const pa11y = require('pa11y');

// Dynamic DB selection - match server.js logic
let db;
if (process.env.SUPABASE_URL) {
    db = require('./db-supabase');
} else {
    db = require('./db');
}

const CONCURRENCY = 2; // Reduced to 2 - AWS environment can't handle 10 Chrome instances
const queue = [];
let activeWorkers = 0;

// Shared Options (mirrors server.js)
const scanOptions = {
    standard: 'WCAG2AA',
    runners: ['axe'],
    timeout: 60000, // 60s timeout
    wait: 1000, // 1s wait
    chromeLaunchConfig: {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process', // Critical: prevent hung processes
            '--no-zygote'
        ]
    }
};

function addJob(url, crawlId, scanId = null) {
    queue.push({ url, crawlId, scanId });
    processQueue();
}

async function processQueue() {
    if (activeWorkers >= CONCURRENCY || queue.length === 0) {
        if (queue.length > 0) {
            console.log(`⏸️  Queue paused: ${activeWorkers}/${CONCURRENCY} workers active, ${queue.length} jobs waiting`);
        }
        return;
    }

    activeWorkers++;
    const job = queue.shift();

    console.log(`🔍 [${activeWorkers}/${CONCURRENCY}] Scanning: ${job.url} (scanId: ${job.scanId}, ${queue.length} remaining)`);

    try {
        // Enforce timeout via Promise.race (aligned with 60s timeout)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Scan timed out after 65s')), 65000)
        );

        const results = await Promise.race([
            pa11y(job.url, scanOptions),
            timeoutPromise
        ]);

        // DEBUG: Log first issue to see structure
        if (results.issues && results.issues.length > 0) {
            console.log('📋 [DEBUG] Sample pa11y issue structure:', JSON.stringify(results.issues[0], null, 2));
        }

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

        // Save to DB (update existing if scanId provided, otherwise create new)
        await db.saveScan({
            summary: summary,
            detailedIssues: results.issues, // Full issues
            crawlId: job.crawlId,
            scanId: job.scanId // Will be null for old-style crawls, or a specific ID for split spider
        });

        console.log(`✅ Successfully scanned ${job.url} - ${summary.total} issues found`);

    } catch (error) {
        console.error(`❌ Failed to scan ${job.url}:`, error.message);

        // Save "failed" record to DB so UI updates from "Queueing" to "Failed"
        try {
            await db.saveScan({
                summary: { url: job.url, total: 0, errors: 0, warnings: 0, notices: 0 },
                detailedIssues: [],
                crawlId: job.crawlId,
                scanId: job.scanId,
                status: 'failed' // NEW: Explicit failed status
            });
            console.log(`⚠️  Marked ${job.url} as failed in database`);
        } catch (dbError) {
            console.error(`❌ Failed to save failed scan to DB:`, dbError.message);
        }
    } finally {
        activeWorkers--;
        // Process next job immediately
        setImmediate(processQueue);
    }
}


function clear(crawlId) {
    const initialLength = queue.length;
    // Remove jobs matching this crawlId
    // Note: This won't filter in-place easily with filter() if we want to mutate active queue reference,
    // but since 'queue' is const array, we can't reassign it.
    // We must splice it or use a different structure.
    // Easier approach: iterate backwards and splice.
    for (let i = queue.length - 1; i >= 0; i--) {
        if (parseInt(queue[i].crawlId) === parseInt(crawlId)) {
            queue.splice(i, 1);
        }
    }
    console.log(`🛑 Cleared ${initialLength - queue.length} jobs for crawl ${crawlId}`);
}

module.exports = { addJob, clear };

