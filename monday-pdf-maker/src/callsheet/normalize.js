// Converts a raw monday item (from monday.getItem) into the same object shape the
// Vibe app's useItem() produced, so the ported PDF layouts work unchanged.
const { FIELDS } = require('./fields');
const { cellText } = require('../monday');

const parseJson = (v) => {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch (_) { return null; }
};
const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

// Find the column for a field: saved mapping first ('' means "not used"),
// then the default column ID, then a column with the default title.
function findColumn(columnValues, field, mapping) {
  const chosen = mapping ? mapping[field.key] : undefined;
  if (chosen === '') return null;
  if (chosen) return columnValues.find((c) => c.id === chosen) || null;
  const byId = columnValues.find((c) => c.id === field.id);
  if (byId) return byId;
  const title = (field.title || '').trim().toLowerCase();
  return columnValues.find((c) => c.column && c.column.title.trim().toLowerCase() === title) || null;
}

// Read one column value as the kind of data a field needs.
function readValue(cv, kind) {
  if (!cv) return null;
  const v = parseJson(cv.value) || {};
  const text = cellText(cv);

  switch (kind) {
    case 'text':
    case 'status':
      if (cv.type === 'dropdown' && Array.isArray(cv.values)) return emptyToNull(cv.values.map((x) => x.label).join(', '));
      return emptyToNull(text);

    case 'dropdown':
      if (Array.isArray(cv.values) && cv.values.length) return cv.values.map((x) => x.label);
      return text ? text.split(',').map((s) => s.trim()).filter(Boolean) : null;

    case 'people':
      return text ? text.split(',').map((name) => ({ name: name.trim() })).filter((p) => p.name) : null;

    case 'timeline':
      if (cv.type === 'timeline' && (v.from || v.to)) return { from: v.from || v.to, to: v.to || v.from };
      if (cv.type === 'date' && v.date) return { from: v.date, to: v.date };
      return null;

    case 'date':
      if (cv.type === 'date' && v.date) return v.date;
      if (cv.type === 'timeline' && (v.from || v.to)) return v.from || v.to;
      return null;

    case 'hour':
      return v.hour != null ? { hour: Number(v.hour), minute: Number(v.minute || 0) } : null;

    case 'location':
      return v.address || text ? { address: v.address || text } : null;

    case 'phone':
      return v.phone || text ? { phone: v.phone || text, country: v.countryShortName || 'GB' } : null;

    case 'email':
      return v.email || text ? { email: v.email || text } : null;

    case 'file': {
      const files = (cv.files || [])
        .map((f) => f && f.asset && { url: f.asset.public_url, name: f.asset.name })
        .filter((f) => f && f.url);
      return files.length ? files : null;
    }

    case 'mirror':
      return text ? { displayValue: text } : null;

    default:
      return emptyToNull(text);
  }
}

function build(columnValues, level, mapping) {
  const out = {};
  const used = {};
  FIELDS.filter((f) => f.level === level && !f.key.endsWith('File')).forEach((f) => {
    const cv = findColumn(columnValues || [], f, mapping);
    used[f.key] = cv ? cv.id : null;
    out[f.key] = readValue(cv, f.kind);
  });
  return { values: out, used };
}

// raw: item from monday.getItem(); mapping: saved settings for this board (or {}).
function toCallSheetItem(raw, mapping = {}) {
  const main = build(raw.column_values, 'item', mapping);
  const subitems = (raw.subitems || []).map((s) => ({ id: s.id, name: s.name, ...build(s.column_values, 'subitem', mapping).values }));
  const item = { id: raw.id, name: raw.name, boardId: raw.board && raw.board.id, ...main.values };
  return { item, subitems, usedColumns: main.used };
}

// Which Files column a PDF should be saved to on this item.
function fileColumnFor(raw, fieldKey, mapping = {}) {
  const field = FIELDS.find((f) => f.key === fieldKey);
  const cv = findColumn(raw.column_values || [], field, mapping);
  return cv && cv.type === 'file' ? cv.id : null;
}

module.exports = { toCallSheetItem, fileColumnFor, findColumn, readValue };
