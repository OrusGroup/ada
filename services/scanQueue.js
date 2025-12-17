const pa11y = require('pa11y');
const db = require('./db');

const CONCURRENCY = 2;
const queue = [];
let activeWorkers = 0;

// Shared Options (mirrors server.js)
const scanOptions = {
    standard: 'WCAG2AA',
    runners: ['axe'],
    timeout: 60000,
    wait: 1000,
    chromeLaunchConfig: { args: ['--no-sandbox'] }
};

function addJob(url, crawlId) {
    queue.push({ url, crawlId });
    processQueue();
}

async function processQueue() {
    if (activeWorkers >= CONCURRENCY || queue.length === 0) return;

    activeWorkers++;
    const job = queue.shift();

    console.log(`🔍 Scanning queued page: ${job.url}`);

    try {
        const results = await pa11y(job.url, scanOptions);

        // Process results
        const summary = {
            url: results.pageUrl,
            title: results.documentTitle,
            total: results.issues.length,
            errors: results.issues.filter(i => i.type === 'error').length,
            warnings: results.issues.filter(i => i.type === 'warning').length,
            notices: results.issues.filter(i => i.type === 'notice').length,
        };

        // Helper to categorize
        const categories = { 'Perceivable': 0, 'Operable': 0, 'Understandable': 0, 'Robust': 0, 'Other': 0 };
        results.issues.forEach(i => {
            const c = i.code.toUpperCase();
            if (c.includes('COLOR') || c.includes('TEXT')) categories.Perceivable++;
            else if (c.includes('LINK') || c.includes('BUTTON')) categories.Operable++;
            else categories.Other++; // Simplified for queue speed
        });

        // Save to DB
        await db.saveScan({
            summary: summary,
            detailedIssues: results.issues, // Full issues
            crawlId: job.crawlId
        });

        // Check if all pages have been scanned and mark crawl as complete
        db.db.get("SELECT total_pages FROM crawls WHERE id = ?", [job.crawlId], (err, crawl) => {
            if (!err && crawl && crawl.total_pages > 0) {
                db.db.get("SELECT COUNT(*) as count FROM scans WHERE crawl_id = ?", [job.crawlId], (err, result) => {
                    if (!err && result && result.count >= crawl.total_pages) {
                        db.db.run("UPDATE crawls SET status = 'completed' WHERE id = ?", [job.crawlId]);
                        console.log(`✅ Crawl ${job.crawlId} completed: ${result.count}/${crawl.total_pages} pages scanned`);
                    }
                });
            }
        });

    } catch (error) {
        console.error(`❌ Failed to scan ${job.url}:`, error.message);
        // Optionally save a "failed" record to DB so progress bar updates
        await db.saveScan({
            summary: { url: job.url, total: 0, errors: 0, warnings: 0, notices: 0 },
            detailedIssues: [],
            crawlId: job.crawlId
        });

        // Check completion even for failed scans
        db.db.get("SELECT total_pages FROM crawls WHERE id = ?", [job.crawlId], (err, crawl) => {
            if (!err && crawl && crawl.total_pages > 0) {
                db.db.get("SELECT COUNT(*) as count FROM scans WHERE crawl_id = ?", [job.crawlId], (err, result) => {
                    if (!err && result && result.count >= crawl.total_pages) {
                        db.db.run("UPDATE crawls SET status = 'completed' WHERE id = ?", [job.crawlId]);
                        console.log(`✅ Crawl ${job.crawlId} completed: ${result.count}/${crawl.total_pages} pages scanned`);
                    }
                });
            }
        });
    } finally {
        activeWorkers--;
        processQueue();
    }
}

module.exports = { addJob };
