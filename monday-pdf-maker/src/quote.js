// Turns a raw monday item into the same shape your Vibe app's useItem() returned,
// so the PDF templates can stay identical to the originals.
const config = require('./config');
const { cellText } = require('./monday');

// Column lookup that accepts either a column ID ("text_mkzz1g43") or a column title ("Job No.").
const byId = (cvs) => {
  const map = {};
  (cvs || []).forEach((cv) => {
    map[cv.id] = cv;
    const title = cv.column && cv.column.title;
    if (title && !(('title:' + title.trim().toLowerCase()) in map)) map['title:' + title.trim().toLowerCase()] = cv;
  });
  return new Proxy(map, {
    get: (m, key) => (typeof key !== 'string' ? undefined : m[key] ?? m['title:' + key.trim().toLowerCase()]),
  });
};
const text = (map, id) => {
  const t = map[id] ? cellText(map[id]) : '';
  return t === '' ? null : t;
};
const num = (map, id) => {
  const t = text(map, id);
  if (t == null) return null;
  const n = Number(String(t).replace(/[£,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const date = (map, id) => {
  const t = text(map, id); // "2026-09-15"
  if (!t) return null;
  const d = new Date(t.slice(0, 10) + 'T12:00:00Z');
  return isNaN(d) ? null : d;
};

// "2026-11-10 - 2026-11-12" -> "10/11/2026 – 12/11/2026"
const ukDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const formatRange = (t) => {
  if (!t) return null;
  const dates = t.match(/\d{4}-\d{2}-\d{2}/g);
  if (!dates) return t;
  const [a, b] = dates;
  return b && b !== a ? `${ukDate(a)} – ${ukDate(b)}` : ukDate(a);
};

function toProject(cv, linkColumns) {
  const p = config.project;
  for (const colId of linkColumns) {
    const linked = cv[colId] && cv[colId].linked_items;
    if (!linked || !linked.length) continue;
    const proj = linked[0];
    const pcv = byId(proj.column_values);
    return {
      name: proj.name,
      boardName: proj.board && proj.board.name,
      projectId: text(pcv, p.projectId) || text(pcv, p.projectIdText),
      shootDate: formatRange(text(pcv, p.shootDate)),
      campaignOwner: text(pcv, p.campaignOwner),
    };
  }
  return null;
}

// Merge column choices from the workflow block over the defaults in config.js.
// Any input left empty keeps its default.
function columnMapping(inputs = {}) {
  const pick = (key, fallback) => {
    const v = inputs[key];
    if (v == null || v === '') return fallback;
    if (typeof v === 'object') return String(v.id ?? v.columnId ?? v.value ?? fallback);
    return String(v).trim();
  };
  const c = config.columns;
  const s = config.subitemColumns;
  return {
    columns: {
      team: pick('teamColumn', c.team),
      quoteType: pick('quoteTypeColumn', c.quoteType),
      quoteDate: pick('quoteDateColumn', c.quoteDate),
      jobNo: pick('jobNoColumn', c.jobNo),
      versionNo: pick('versionNoColumn', c.versionNo),
      quoteDescription: pick('descriptionColumn', c.quoteDescription),
      notes: pick('notesColumn', c.notes),
    },
    subitemColumns: {
      description: pick('subDescriptionColumn', s.description),
      budgetType: pick('budgetTypeColumn', s.budgetType),
      spendType: pick('spendTypeColumn', s.spendType),
      quotedQty: pick('qtyColumn', s.quotedQty),
      quotedCost: pick('rateColumn', s.quotedCost),
      spendSummary: pick('spendSummaryColumn', s.spendSummary),
    },
    projectLinkColumns: inputs.projectLinkColumn ? [pick('projectLinkColumn')] : config.project.linkColumns,
    filesColumn: pick('filesColumn', pick('columnId', config.filesColumnId)),
  };
}

function toQuote(raw, mapping = columnMapping()) {
  const c = mapping.columns;
  const s = mapping.subitemColumns;
  const cv = byId(raw.column_values);

  return {
    id: raw.id,
    name: raw.name,
    team: text(cv, c.team),
    quoteType: text(cv, c.quoteType),
    quoteDate: date(cv, c.quoteDate),
    jobNo: text(cv, c.jobNo),
    versionNo: text(cv, c.versionNo),
    quoteDescription: text(cv, c.quoteDescription),
    notes: text(cv, c.notes),
    project: toProject(cv, mapping.projectLinkColumns),
    subitems: (raw.subitems || []).map((sub) => {
      const scv = byId(sub.column_values);
      return {
        id: sub.id,
        name: sub.name,
        description: text(scv, s.description),
        budgetType: text(scv, s.budgetType),
        spendType: text(scv, s.spendType),
        quotedQty: num(scv, s.quotedQty),
        quotedCost: num(scv, s.quotedCost),
        spendSummary: text(scv, s.spendSummary),
      };
    }),
  };
}

module.exports = { toQuote, columnMapping };
