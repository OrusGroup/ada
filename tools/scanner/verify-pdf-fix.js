const fs = require('fs');
const path = require('path');
const contentAnalysis = require('./services/contentAnalysis');

async function test() {
    console.log("Testing PDF Content Analysis...");
    try {
        const pdfPath = path.join(__dirname, 'test-sample.pdf');
        if (!fs.existsSync(pdfPath)) {
            console.error("Test PDF not found:", pdfPath);
            return;
        }

        const buffer = fs.readFileSync(pdfPath);
        console.log(`Loaded PDF: ${buffer.length} bytes`);

        const result = await contentAnalysis.analyzePDF(buffer);

        console.log("\n--- Analysis Result ---");
        console.log("Is Scanned:", result.isScanned);
        console.log("Text Length:", result.textLength);
        console.log("Issues Found:", result.issues.length);
        result.issues.forEach(i => console.log(`- ${i}`));

        if (result.metadata) {
            console.log("Metadata Title:", result.metadata.Title);
        }

        if (result.htmlPreview) {
             console.log("HTML Preview: GENERATED (" + result.htmlPreview.length + " chars)");
        } else {
             console.log("HTML Preview: MISSING");
        }

        console.log("\nSUCCESS: PDF verified without crash.");

    } catch (e) {
        console.error("TEST FAILED:", e);
    }
}

test();
