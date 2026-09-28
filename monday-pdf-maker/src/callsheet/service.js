// Builds any of the four call sheet PDFs for a monday item.
const { renderDefinition } = require('../render');
const { toCallSheetItem, fileColumnFor } = require('./normalize');
const { DOCS } = require('./fields');

const templates = {
  callSheet: require('./templates/callSheet'),
  schedule: require('./templates/schedule'),
  roles: require('./templates/roles'),
  productionDoc: require('./templates/productionDoc'),
  // Production document split into four standalone PDFs
  productionCover: require('./templates/productionCover'),
  productionCallSheet: require('./templates/productionCallSheet'),
  productionSchedule: require('./templates/productionSchedule'),
  productionRoles: require('./templates/productionRoles'),
};

const safe = (name) => name.replace(/[\\/:*?"<>|]+/g, '').trim();

async function buildPdf(kind, raw, mapping) {
  if (!templates[kind]) throw new Error(`Unknown document "${kind}"`);
  const { item, subitems } = toCallSheetItem(raw, mapping);
  const { docDefinition, filename } = await templates[kind](item, subitems);
  const buffer = await renderDefinition(docDefinition);
  return { buffer, filename: safe(filename) };
}

// Which Files column this document is saved to on this item (null if none found).
function saveColumnFor(kind, raw, mapping) {
  return fileColumnFor(raw, DOCS[kind].fileField, mapping);
}

module.exports = { buildPdf, saveColumnFor, DOC_KINDS: Object.keys(templates) };
