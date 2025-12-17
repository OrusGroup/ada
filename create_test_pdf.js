const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test-sample.pdf'));

doc.fontSize(25).text('Test Accessible PDF', 100, 100);
doc.fontSize(12).text('This is a test document generated for testing the scanner.');
doc.text('It contains a text layer, so it should NOT be flagged as a scanned image.');
doc.end();

console.log('✅ Created test-sample.pdf');
