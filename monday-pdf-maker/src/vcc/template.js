// Renders the VCC card as a PNG buffer via @resvg/resvg-js (pure WASM, no system deps).
// Loads the Figma-exported SVG template and injects the three dynamic values.
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const FONTS_DIR = path.join(__dirname, '..', '..', 'assets', 'fonts');
const FONT_FILES = [
  path.join(FONTS_DIR, 'GothamNarrow-Bold.otf'),
  path.join(FONTS_DIR, 'GothamNarrow-Medium.otf'),
];

const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'assets', 'vcc-template.svg');
const TEMPLATE_SVG = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The template SVG (1011×638) has all static design as paths.
// We inject text elements for the three dynamic values just before </g>.
function buildSvg({ cardNumber, expDate, cvv }) {
  const dynamicText = `
  <text x="40" y="374" font-family="GothamNarrow,sans-serif" font-size="36" font-weight="700" fill="white" letter-spacing="1">#: ${esc(cardNumber)}</text>
  <text x="40" y="528" font-family="GothamNarrow,sans-serif" font-size="36" font-weight="700" fill="white" letter-spacing="1">${esc(expDate)}</text>
  <text x="507" y="528" font-family="GothamNarrow,sans-serif" font-size="36" font-weight="700" fill="white" letter-spacing="1">${esc(cvv)}</text>
`;
  return TEMPLATE_SVG.replace('</g>', dynamicText + '</g>');
}

function renderPng(fields) {
  const svg = buildSvg(fields);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1011 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'GothamNarrow' },
  });
  return Promise.resolve(Buffer.from(resvg.render().asPng()));
}

module.exports = { renderPng };
