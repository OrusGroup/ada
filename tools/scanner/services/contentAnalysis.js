const fs = require('fs');
const Tesseract = require('tesseract.js');
// const Tesseract = require('tesseract.js');

/**
 * Analyzes a PDF buffer to determine if it has a text layer.
 * @param {Buffer} dataBuffer 
 * @returns {Promise<{isScanned: boolean, textLength: number, text: string, metadata: object, issues: string[], warnings: string[], htmlPreview: string}>}
 */
async function analyzePDF(dataBuffer) {
    try {
        // Dynamic import for ESM-only pdfjs-dist
        const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const pdfjsLib = pdfjsModule;

        // Load the document using PDF.js
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(dataBuffer),
            verbosity: 0 // Suppress warnings
        });

        const pdfDocument = await loadingTask.promise;

        // Extract Metadata
        let metadata = {};
        try {
            const metaDataResult = await pdfDocument.getMetadata();
            metadata = metaDataResult.info || {};
        } catch (e) {
            console.warn("Could not extract metadata:", e.message);
        }

        // Extract Text & Build HTML Preview
        let text = "";
        let htmlPreview = "<div class='pdf-reader-content'>";
        const maxPages = Math.min(pdfDocument.numPages, 10);

        for (let i = 1; i <= maxPages; i++) {
            try {
                const page = await pdfDocument.getPage(i);
                const tokenizedText = await page.getTextContent();

                // Text for analysis
                const pageText = tokenizedText.items.map(token => token.str).join(" ");
                text += pageText + "\n";

                // HTML Construction
                htmlPreview += `<div class="pdf-page-view" style="margin-bottom:20px; padding:24px; background:white; color:#333; border:1px solid #e2e8f0; border-radius:8px; font-family:serif; line-height:1.6;">`;
                htmlPreview += `<div style="color:#94a3b8; font-size:11px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:4px;">Page ${i}</div>`;

                // Simple stream reconstruction
                let currentBlock = "";
                tokenizedText.items.forEach(token => {
                    // Very basic reconstruction
                    if (token.str.trim().length > 0) {
                        currentBlock += `<span style="font-family:sans-serif">${token.str} </span>`;
                    }
                });
                htmlPreview += `<p>${currentBlock}</p>`;
                htmlPreview += `</div>`;

            } catch (pageError) {
                console.warn(`Could not extract text from page ${i}:`, pageError.message);
            }
        }
        text = text.trim();
        htmlPreview += "</div>";

        const issues = [];
        const warnings = [];

        // 1. Check for Scanned Document (Image-only)
        const isScanned = text.length < 50 && pdfDocument.numPages > 0;
        if (isScanned) {
            issues.push("CRITICAL: Document appears to be a scanned image (No text layer found). Screen readers cannot read this.");
        }

        // 2. Check for Title Metadata
        if (!metadata.Title || metadata.Title.trim() === '' || metadata.Title === 'Untitled') {
            warnings.push("Metadata: Document Title is missing or empty. (WCAG 2.4.2)");
        }

        // 3. Check for Non-Descriptive Links (Heuristic)
        const badLinkPatterns = [/click here/i, /read more/i, /more info/i, /link/i];
        if (badLinkPatterns.some(pattern => pattern.test(text))) {
            warnings.push("Content: Found potential non-descriptive links (e.g., 'click here'). Use descriptive link text. (WCAG 2.4.4)");
        }

        // 4. Check for Outline (Bookmarks)
        try {
            const outline = await pdfDocument.getOutline();
            if (!outline || outline.length === 0) {
                if (pdfDocument.numPages > 5) {
                    warnings.push("Navigation: No Bookmarks found in this long document. (WCAG 2.4.5)");
                }
            }
        } catch (e) { }

        // 5. Check for Heading Structure (Heuristic)
        if (text.length > 200 && !/\n[A-Z0-9\s.]{5,50}\n/.test(text)) {
            warnings.push("Structure: Could not detect clear heading structure. Ensure tags are used. (WCAG 1.3.1)");
        }

        return {
            isScanned,
            textLength: text.length,
            text: text.substring(0, 500),
            metadata: metadata,
            issues: issues,
            warnings: warnings,
            htmlPreview: htmlPreview
        };
    } catch (error) {
        console.error("PDF Parse Error Details:", error);
        return {
            isScanned: true,
            textLength: 0,
            text: "",
            metadata: {},
            issues: ["CRITICAL: Failed to parse PDF structure. The file might be corrupted or encrypted."],
            warnings: [],
            htmlPreview: ""
        };
    }
}

/**
 * Performs OCR on an image buffer.
 * @param {Buffer} imageBuffer 
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function analyzeImage(imageBuffer) {
    try {
        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',
            { logger: m => console.log(m) } // Optional logger
        );

        return {
            text: result.data.text.trim(),
            confidence: result.data.confidence
        };
        /*
        console.warn("OCR Disabled in Cloud Mode");
        return { text: "[OCR Disabled]", confidence: 0 };
        */
    } catch (error) {
        console.error("OCR Error:", error);
        // return { text: "", confidence: 0 };
        throw new Error("Failed to perform OCR on image");
    }
}

module.exports = {
    analyzePDF,
    analyzeImage
};
