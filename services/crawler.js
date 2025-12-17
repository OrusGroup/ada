const puppeteer = require('puppeteer');

async function crawl(startUrl, maxPages = 50) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // User Agent to look regular
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Helper function to normalize URLs (remove query params and fragments)
        const normalizeUrl = (url) => {
            try {
                const urlObj = new URL(url);
                // Return just protocol + host + pathname (no query or hash)
                return urlObj.origin + urlObj.pathname;
            } catch {
                return url;
            }
        };

        const visited = new Set();
        const queue = [normalizeUrl(startUrl)]; // Normalize the starting URL
        const results = [];
        const domain = new URL(startUrl).hostname;

        console.log(`🕷️ Starting crawl of ${domain} (Limit: ${maxPages})`);

        while (queue.length > 0 && visited.size < maxPages) {
            const url = queue.shift();
            if (visited.has(url)) continue; // url is already normalized

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                visited.add(url); // url is already normalized
                results.push(url); // Store normalized URL

                // Find internal links
                const links = await page.evaluate((currentDomain) => {
                    // Normalize hostname by removing www prefix for comparison
                    const normalizeHost = (host) => host.replace(/^www\./i, '');
                    const normalizedDomain = normalizeHost(currentDomain);

                    return Array.from(document.querySelectorAll('a'))
                        .map(a => a.href)
                        .filter(href => {
                            try {
                                const url = new URL(href);
                                // Compare normalized hostnames to allow www/non-www variants
                                return normalizeHost(url.hostname) === normalizedDomain &&
                                    !href.match(/\.(pdf|jpg|png|css|js|zip|docx)$/i);
                            } catch { return false; }
                        });
                }, domain);

                // Add new links to queue (normalize all URLs)
                for (const link of links) {
                    const normalizedLink = normalizeUrl(link);
                    if (!visited.has(normalizedLink) && !queue.includes(normalizedLink)) {
                        queue.push(normalizedLink);
                    }
                }

                // Polite delay
                await new Promise(r => setTimeout(r, 500));

            } catch (e) {
                console.error(`Failed to crawl ${url}:`, e.message);
            }
        }

        console.log(`✅ Crawl complete. Found ${results.length} pages.`);
        return results;

    } catch (error) {
        console.error('Crawl fatal error:', error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { crawl };
