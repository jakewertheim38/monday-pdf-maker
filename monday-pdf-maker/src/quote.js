// Turns a raw monday item into the same shape your Vibe app's useItem() returned,
// so the PDF templates can stay identical to the originals.
const config = require('./config');
const { cellText } = require('./monday');

const byId = (cvs) => Object.fromEntries((cvs || []).map((cv) => [cv.id, cv]));
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

function toProject(cv) {
  const p = config.project;
  for (const colId of p.linkColumns) {
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

function toQuote(raw) {
  const c = config.columns;
  const s = config.subitemColumns;
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
    project: toProject(cv),
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

module.exports = { toQuote };
