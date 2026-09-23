const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const vfsModule = require('pdfmake/build/vfs_fonts');

// Roboto ships inside pdfmake, the same font your Vibe app used in the browser.
const vfs = vfsModule.pdfMake ? vfsModule.pdfMake.vfs : vfsModule.vfs || vfsModule;
const font = (name) => Buffer.from(vfs[name], 'base64');
const printer = new PdfPrinter({
  Roboto: {
    normal: font('Roboto-Regular.ttf'),
    bold: font('Roboto-Medium.ttf'),
    italics: font('Roboto-Italic.ttf'),
    bolditalics: font('Roboto-MediumItalic.ttf'),
  },
});

// Logo is bundled with the app, so nothing is fetched at run time.
const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
const logoDataUrl = fs.existsSync(logoPath)
  ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
  : null;

const templates = {
  quote: require('./templates/quote'),
  spendSummary: require('./templates/spendSummary'),
};

function renderPdf(kind, item) {
  const docDefinition = templates[kind](item, logoDataUrl);
  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

// Same naming as your original: Project - Quote Type - [Spend Summary] - Job No - Version
function filenameFor(kind, item) {
  const parts = [item.name, item.quoteType, kind === 'spendSummary' ? 'Spend Summary' : null, item.jobNo, item.versionNo]
    .filter(Boolean)
    .map((p) => String(p).replace(/[\\/:*?"<>|]+/g, '').trim());
  return parts.length ? `${parts.join(' - ')}.pdf` : kind === 'spendSummary' ? 'quote-spend-summary.pdf' : 'quote.pdf';
}

module.exports = { renderPdf, filenameFor };
