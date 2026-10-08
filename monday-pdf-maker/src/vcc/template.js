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

// Unique substrings that identify each placeholder path element in the SVG.
// These are the 6 vector-path glyphs Figma exported for the example card data.
const PLACEHOLDER_MARKERS = [
  'M359.715 112.434',  // top-right area label/value
  'M362.405 292.584',  // middle area text
  'M44.4053 431.584',  // bottom-left (expiry area)
  'M440.405 458.584',  // bottom-right (CVV area)
  'M362 168.508',      // card number label area
  'M362 228.508',      // 16-digit card number
];

function stripPlaceholders(svg) {
  return svg
    .split('\n')
    .filter(line => !PLACEHOLDER_MARKERS.some(m => line.includes(m)))
    .join('\n');
}

const BASE_SVG = stripPlaceholders(TEMPLATE_SVG);

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Text positions derived from the bounding boxes of the removed placeholder paths.
// Card number: path6 bbox y=206-241, x=348  → baseline y≈238
// Expiry:      path3 bbox y=425-458, x=33   → baseline y≈455
// CVV:         path4 bbox y=449-485, x=429  → baseline y≈482
function buildSvg({ cardNumber, expDate, cvv }) {
  const dynamicText = `
  <text x="348" y="238" font-family="GothamNarrow,sans-serif" font-size="36" font-weight="700" fill="white" letter-spacing="2">${esc(cardNumber)}</text>
  <text x="33" y="455" font-family="GothamNarrow,sans-serif" font-size="28" font-weight="700" fill="white">${esc(expDate)}</text>
  <text x="429" y="482" font-family="GothamNarrow,sans-serif" font-size="28" font-weight="700" fill="white">${esc(cvv)}</text>
`;
  return BASE_SVG.replace('</g>', dynamicText + '</g>');
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
