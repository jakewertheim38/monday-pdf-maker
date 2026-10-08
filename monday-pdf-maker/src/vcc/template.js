// Renders the VCC card as a PNG buffer via @resvg/resvg-js (pure WASM, no system deps).
// Loads the Figma-exported SVG template and injects the six dynamic values.
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

// The 6 placeholder paths Figma exported for pl1–pl6 text, identified by their
// unique path-data start coordinates. Stripped at render time and replaced with
// live <text> elements.
const PLACEHOLDER_MARKERS = [
  'M340.04 122.4',  // pl1: Name
  'M340.04 177.4',  // pl2: Actual Exp
  'M340.04 237.4',  // pl3: Loaded
  'M340.55 327',    // pl4: Card #
  'M164.55 497',    // pl5: VCC Exp
  'M568.55 497',    // pl6: CVV
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

// Baseline y derived from the bottom of each placeholder path bounding box.
// x aligns with the path start x coordinate.
function buildSvg({ name, actualExp, loaded, cardNumber, vccExp, cvv }) {
  const dynamicText = `
  <text x="340" y="120" font-family="GothamNarrow,sans-serif" font-size="26" font-weight="700" fill="white">${esc(name)}</text>
  <text x="340" y="175" font-family="GothamNarrow,sans-serif" font-size="26" font-weight="700" fill="white">${esc(actualExp)}</text>
  <text x="340" y="235" font-family="GothamNarrow,sans-serif" font-size="26" font-weight="700" fill="white">${esc(loaded)}</text>
  <text x="340" y="325" font-family="GothamNarrow,sans-serif" font-size="26" font-weight="700" fill="white">${esc(cardNumber)}</text>
  <text x="164" y="493" font-family="GothamNarrow,sans-serif" font-size="30" font-weight="700" fill="white">${esc(vccExp)}</text>
  <text x="568" y="493" font-family="GothamNarrow,sans-serif" font-size="30" font-weight="700" fill="white">${esc(cvv)}</text>
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
