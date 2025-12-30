const pdfLib = require('pdf-parse');
console.log('PDFParse class:', pdfLib.PDFParse);
console.log('Prototype:', pdfLib.PDFParse.prototype);
// Try to instantiate
try {
    const parser = new pdfLib.PDFParse();
    console.log('Instance keys:', Object.keys(parser));
} catch (e) { console.log('Constructor error:', e.message); }
