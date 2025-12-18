const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Helper to ensure protocol
const ensureProtocol = (url) => {
    if (!url.match(/^https?:\/\//i)) {
        return 'https://' + url;
    }
    return url;
};

// FAST CRAWL request wrapper with Redirect support
const fetchUrl = (url, headers) => {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { headers, timeout: 8000 }, (res) => {
            // Handle Redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                try {
                    const redirectUrl = new URL(res.headers.location, url).href;
                    resolve(fetchUrl(redirectUrl, headers)); // Recursive follow
                } catch {
                    resolve({ error: 'Invalid redirect' });
                }
                return;
            }

            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ body: data, status: res.statusCode }));
        });
        req.on('error', (e) => resolve({ error: e }));
        req.on('timeout', () => { req.destroy(); resolve({ timeout: true }); });
    });
};

// FAST CRAWL (Static)
async function fastCrawl(startUrl, maxPages, onDiscover) {
    console.log(`🚀 Starting FAST static crawl for ${startUrl}`);
    const visited = new Set();
    const queue = [startUrl];
    const results = [];
    const domain = new URL(startUrl).hostname; // startUrl is already normalized by ensureProtocol

    // Add start URL immediately
    if (onDiscover) onDiscover(startUrl);

    const normalizeUrl = (url) => {
        try {
            const u = new URL(url);
            return u.origin + u.pathname;
        } catch { return null; }
    };

    const MAX_CONCURRENT = 10;
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    while (queue.length > 0 && visited.size < maxPages) {
        const batch = [];
        while (queue.length > 0 && batch.length < MAX_CONCURRENT && visited.size + batch.length < maxPages) {
            const url = queue.shift();
            if (!visited.has(url)) {
                visited.add(url);
                batch.push(url);
                results.push(url);
                // Call callback only if it's new (visited check passed)
                // Note: startUrl was added manually, so skip it? 
                // Actually startUrl is in queue but not visited set initially.
                // We'll trust the caller to handle dupes or just let it fire.
                if (onDiscover && url !== startUrl) onDiscover(url);
            }
        }

        if (batch.length === 0) break;

        await Promise.all(batch.map(async (url) => {
            const res = await fetchUrl(url, { 'User-Agent': UA });

            if (res.body && res.status >= 200 && res.status < 300) {
                // Extract links
                const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']/gi;
                let match;
                while ((match = linkRegex.exec(res.body)) !== null) {
                    try {
                        const absolute = new URL(match[1], url).href;
                        const norm = normalizeUrl(absolute);
                        if (norm && new URL(norm).hostname.replace(/^www\./, '') === domain.replace(/^www\./, '') && !norm.match(/\.(pdf|jpg|png|css|js|zip|docx|xml)$/i)) {
                            if (!visited.has(norm) && !queue.includes(norm)) {
                                queue.push(norm);
                            }
                        }
                    } catch (e) { }
                }
            }
        }));

        await new Promise(r => setTimeout(r, 100));
    }

    return results;
}

// MAIN CRAWL FUNCTION (Hybrid)
// MAIN CRAWL FUNCTION (Hybrid)
async function crawl(rawUrl, maxPages = 500, onDiscover = null) {
    const startUrl = ensureProtocol(rawUrl); // Normalize first

    try {
        console.log(`🕵️ Attempting Fast Static Discovery first for ${startUrl}...`);
        const staticResults = await fastCrawl(startUrl, maxPages, onDiscover);

        // Return if successful (relaxed threshold to 1 because even finding homepage is valid)
        // USER REQUEST: Prioritize Accuracy over Speed. Disable early return to ensure deep crawl.
        /*
        if (staticResults.length > 0) {
            console.log(`⚡ Fast Discovery successful! Found ${staticResults.length} pages.`);
            return staticResults;
        }
        */
        console.log(`⚡ Fast Discovery found ${staticResults.length} pages. Proceeding to Deep Crawl for accuracy...`);
    } catch (e) {
        console.error('Fast crawl failed, continuing to Puppeteer:', e.message);
    }

    // FALLBACK TO PUPPETEER (Ensure we use static results as seed if available)
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
            ignoreHTTPSErrors: true
        });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(15000); // reduced from 30s to 15s to prevent long hangs

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media', 'other'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const normalizeUrl = (url) => {
            try {
                const urlObj = new URL(url);
                return urlObj.origin + urlObj.pathname;
            } catch { return url; }
        };

        const visited = new Set();
        // Seed queue with static results to ensure we cover them + find dynamic children
        // We add startUrl explicitly first
        let queue = [normalizeUrl(startUrl)];

        // Add all static results to queue if they aren't the start URL
        if (staticResults && staticResults.length > 0) {
            staticResults.forEach(u => {
                const norm = normalizeUrl(u);
                if (norm !== queue[0] && !queue.includes(norm)) {
                    queue.push(norm);
                }
            });
            console.log(`📥 Seeded Puppeteer queue with ${queue.length} pages from Fast Crawl`);
        }

        // We do NOT add them to 'visited' yet because we want Puppeteer to actually VISIT them 
        // to find dynamic links *on* them.
        const results = [];
        // Extract domain safely
        let domain;
        try { domain = new URL(startUrl).hostname; } catch (e) { domain = ''; }

        console.log(`🕷️ Starting Puppeteer crawl of ${domain}`);

        let consecutiveNoNewPages = 0;
        const STALENESS_LIMIT = 15; // Stop if 15 pages visited with NO new discoveries

        while (queue.length > 0 && visited.size < maxPages) {
            // Check staleness
            if (consecutiveNoNewPages >= STALENESS_LIMIT) {
                console.log(`🛑 Discovery Staled: No new pages found in last ${STALENESS_LIMIT} visits. Stopping early.`);
                break;
            }

            const url = queue.shift();
            if (visited.has(url)) continue;

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                // REMOVED duplicate goto
                visited.add(url);
                results.push(url);
                if (onDiscover) onDiscover(url); // Trigger callback for Puppeteer findings

                const links = await page.evaluate((currentDomain) => {
                    if (!currentDomain) return []; // Safety
                    const normalizeHost = (host) => host.replace(/^www\./i, '');
                    const normalizedDomain = normalizeHost(currentDomain);
                    return Array.from(document.querySelectorAll('a'))
                        .map(a => a.href)
                        .filter(href => {
                            try {
                                const url = new URL(href);
                                return normalizeHost(url.hostname) === normalizedDomain && !href.match(/\.(pdf|jpg|png|css|js|zip|docx)$/i);
                            } catch { return false; }
                        });
                }, domain);

                const preCount = results.length;
                for (const link of links) {
                    const normalizedLink = normalizeUrl(link);
                    if (!visited.has(normalizedLink) && !queue.includes(normalizedLink)) {
                        queue.push(normalizedLink);
                    }
                }

                // Check if we added any new items to queue or results? 
                // Wait, results aren't updated here? 
                // Ah, results only track VISITED pages in this logic?
                // No, results.push(url) happens above (line 177).
                // But we want to know if we found NEW CANDIDATES.
                // The queue growing is the sign of discovery.

                // Let's verify if 'queue' grew?
                // Or simply: Did we find any link that we haven't seen before?
                // logic above: if (!visited.has(normalizedLink) && !queue.includes(normalizedLink))

                const newFound = links.filter(l => {
                    const n = normalizeUrl(l);
                    return !visited.has(n) && !queue.includes(n); // Wait, queue includes check is expensive if heavy.
                    // But effectively, did we push to queue?
                }).length;
                // Wait, logic above pushes to queue.
                // Simpler: Compare queue length before and after?
                // But queue shrinks by shift().

                // Let's track if we added *anything* to queue this turn.
                let addedNew = false;
                for (const link of links) {
                    const normalizedLink = normalizeUrl(link);
                    // Check logic again (it was queue.includes)
                    // We can optimize queue check? No array.includes is fine for <500
                    if (!visited.has(normalizedLink) && !queue.includes(normalizedLink)) {
                        queue.push(normalizedLink);
                        addedNew = true;
                    }
                }

                if (addedNew) {
                    consecutiveNoNewPages = 0;
                } else {
                    consecutiveNoNewPages++;
                }

            } catch (e) {
                console.error(`Failed to crawl ${url}:`, e.message);
            }
        }
        return results;

    } catch (error) {
        console.error('Crawl fatal error:', error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { crawl };
