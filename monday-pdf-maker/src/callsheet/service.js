// Builds any of the four call sheet PDFs for a monday item.
const { renderDefinition } = require('../render');
const { toCallSheetItem, fileColumnFor, mergeWorkflowInputs } = require('./normalize');
const { DOCS } = require('./fields');

const templates = {
  callSheet: require('./templates/callSheet'),
  schedule: require('./templates/schedule'),
  roles: require('./templates/roles'),
  productionDoc: require('./templates/productionDoc'),
};

const safe = (name) => name.replace(/[\\/:*?"<>|]+/g, '').trim();

async function buildPdf(kind, raw, mapping, workflowInputs = {}) {
  if (!templates[kind]) throw new Error(`Unknown document "${kind}"`);
  const merged = mergeWorkflowInputs(mapping, workflowInputs);
  const { item, subitems } = toCallSheetItem(raw, merged);
  const { docDefinition, filename } = await templates[kind](item, subitems);
  const buffer = await renderDefinition(docDefinition);
  return { buffer, filename: safe(filename) };
}

// Which Files column this document is saved to on this item (null if none found).
function saveColumnFor(kind, raw, mapping, workflowInputs = {}) {
  const merged = mergeWorkflowInputs(mapping, workflowInputs);
  return fileColumnFor(raw, DOCS[kind].fileField, merged);
}

module.exports = { buildPdf, saveColumnFor, mergeWorkflowInputs, DOC_KINDS: Object.keys(templates) };
