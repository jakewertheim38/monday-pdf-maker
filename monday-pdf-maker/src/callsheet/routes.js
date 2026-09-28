// Call sheet: workflow block actions + the item view (page and its API).
const path = require('path');
const jwt = require('jsonwebtoken');
const { getItem, uploadPdf, getBoardColumns } = require('../monday');
const { getSetting } = require('../secrets');
const { FIELDS, KINDS, DOCS } = require('./fields');
const { getMapping, saveMapping } = require('./store');
const { buildPdf, saveColumnFor, DOC_KINDS } = require('./service');
const { toCallSheetItem } = require('./normalize');

// Make one PDF and attach it to the item's Files column.
async function makeAndSave(token, itemId, kind, boardIdHint) {
  const raw = await getItem(token, itemId);
  const boardId = (raw.board && raw.board.id) || boardIdHint;
  const mapping = await getMapping(boardId);
  const columnId = saveColumnFor(kind, raw, mapping);
  if (!columnId) throw new Error(`No Files column set for the ${DOCS[kind].label} PDF on this board (open the item view settings)`);
  const { buffer, filename } = await buildPdf(kind, raw, mapping);
  const file = await uploadPdf(token, itemId, columnId, filename, buffer);
  return { filename, assetId: file && file.id };
}

// ---------- Item view auth: monday session token, signed with the app's Client Secret ----------
function verifySession(req, res, next) {
  try {
    const secret = getSetting('MONDAY_CLIENT_SECRET');
    if (!secret) throw new Error('MONDAY_CLIENT_SECRET is not set');
    const token = req.headers.authorization;
    if (!token) throw new Error('missing session token');
    req.session = jwt.verify(token, secret);
    req.apiToken = getSetting('MONDAY_API_TOKEN');
    if (!req.apiToken) throw new Error('MONDAY_API_TOKEN is not set');
    next();
  } catch (err) {
    console.error('Item view auth failed:', err.message);
    res.status(401).json({ error: err.message });
  }
}
const canEdit = (session) => {
  const d = (session && session.dat) || {};
  return !d.is_view_only && !d.is_guest;
};

// For the settings panel: which column each field uses on this board right now.
function resolveForBoard(cols, subCols, mapping) {
  const out = {};
  FIELDS.forEach((f) => {
    const list = f.level === 'subitem' ? subCols : cols;
    const chosen = mapping[f.key];
    let col = null;
    if (chosen === '') col = null;
    else if (chosen) col = list.find((c) => c.id === chosen) || null;
    else col = list.find((c) => c.id === f.id) || list.find((c) => c.title.trim().toLowerCase() === f.title.toLowerCase()) || null;
    out[f.key] = col ? col.id : '';
  });
  return out;
}

module.exports = function registerCallSheet(app, { verifyMonday, idFrom }) {
  // ---------- Workflow blocks ----------
  const action = (kinds) => async (req, res) => {
    const payload = req.body.payload || {};
    const fields = payload.inboundFieldValues || payload.inputFields || {};
    const itemId = idFrom(fields.itemId ?? fields.item);
    const boardId = idFrom(fields.boardId ?? fields.board);
    const token = req.session.shortLivedToken || getSetting('MONDAY_API_TOKEN');
    try {
      if (!itemId) throw new Error('No itemId in action input fields');
      const results = [];
      for (const kind of kinds) results.push(await makeAndSave(token, itemId, kind, boardId));
      console.log(`Call sheet PDFs for item ${itemId}:`, results.map((r) => r.filename).join(', '));
      res.status(200).json({ outputFields: { assetId: results[0] && results[0].assetId } });
    } catch (err) {
      console.error('Call sheet PDF failed:', err);
      res.status(400).json({
        severityCode: 4000,
        notificationErrorTitle: 'Call sheet PDF could not be created',
        notificationErrorDescription: err.message.slice(0, 250),
        runtimeErrorDescription: err.message.slice(0, 250),
      });
    }
  };
  app.post('/action/callsheet-pdf', verifyMonday, action(['callSheet']));
  app.post('/action/schedule-pdf', verifyMonday, action(['schedule']));
  app.post('/action/roles-pdf', verifyMonday, action(['roles']));
  app.post('/action/production-doc-pdf', verifyMonday, action(['productionDoc']));
  app.post('/action/callsheet-pack', verifyMonday, action(['callSheet', 'schedule', 'roles']));
  // Production document split into four individual pages
  app.post('/action/production-cover-pdf', verifyMonday, action(['productionCover']));
  app.post('/action/production-callsheet-pdf', verifyMonday, action(['productionCallSheet']));
  app.post('/action/production-schedule-pdf', verifyMonday, action(['productionSchedule']));
  app.post('/action/production-roles-pdf', verifyMonday, action(['productionRoles']));
  // Full production document pack (all four pages in one go)
  app.post('/action/production-pack', verifyMonday, action(['productionCover', 'productionCallSheet', 'productionSchedule', 'productionRoles']));

  // ---------- Item view page ----------
  app.get('/views/callsheet', (_req, res) => res.sendFile(path.join(__dirname, '..', '..', 'views', 'callsheet.html')));

  // Summary of the item for the view
  app.get('/api/callsheet/item', verifySession, async (req, res) => {
    try {
      const raw = await getItem(req.apiToken, req.query.itemId);
      const boardId = (raw.board && raw.board.id) || req.query.boardId;
      const mapping = await getMapping(boardId);
      const { item, subitems } = toCallSheetItem(raw, mapping);
      const saveTo = {};
      DOC_KINDS.forEach((k) => { saveTo[k] = !!saveColumnFor(k, raw, mapping); });
      res.json({
        boardId,
        item: {
          name: item.name,
          shootDate: item.shootDate,
          producer: item.producer && item.producer.map((p) => p.name).join(', '),
          projectManager: item.projectManager && item.projectManager.map((p) => p.name).join(', '),
          productionId: item.productionId && item.productionId.displayValue,
          location: item.shootLocation && item.shootLocation.address,
          crewCallTime: item.crewCallTime,
          talentCallTime: item.talentCallTime,
        },
        counts: {
          crew: subitems.filter((s) => s.crewTalent === 'Crew').length,
          talent: subitems.filter((s) => s.crewTalent === 'Talent').length,
          schedule: subitems.filter((s) => s.type === 'Schedule').length,
          roles: subitems.filter((s) => s.resposibility && s.resposibility.trim() !== '').length,
        },
        crew: subitems.filter((s) => s.crewTalent === 'Crew' || s.crewTalent === 'Talent')
          .map((s) => ({ kind: s.crewTalent, name: s.name1 || s.name, position: s.position, callTime: s.callTime })),
        saveTo,
        docs: DOC_KINDS.map((k) => ({ kind: k, label: DOCS[k].label })),
        canEdit: canEdit(req.session),
      });
    } catch (err) {
      console.error('Item view load failed:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Make a PDF: download it, or save it to the item
  app.post('/api/callsheet/pdf', verifySession, async (req, res) => {
    const { itemId, kind, save } = req.body || {};
    try {
      if (!DOC_KINDS.includes(kind)) throw new Error('Unknown document');
      if (save) {
        if (!canEdit(req.session)) throw new Error('View-only users cannot save files');
        const result = await makeAndSave(req.apiToken, itemId, kind);
        return res.json({ ok: true, ...result });
      }
      const raw = await getItem(req.apiToken, itemId);
      const mapping = await getMapping(raw.board && raw.board.id);
      const { buffer, filename } = await buildPdf(kind, raw, mapping);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('X-Filename', encodeURIComponent(filename));
      res.send(buffer);
    } catch (err) {
      console.error('Item view PDF failed:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Settings: fields, the board's columns, and the saved mapping
  app.get('/api/callsheet/settings', verifySession, async (req, res) => {
    try {
      const { columns, subitemColumns, boardName } = await getBoardColumns(req.apiToken, req.query.boardId);
      const saved = await getMapping(req.query.boardId);
      res.json({
        boardName,
        fields: FIELDS.map((f) => ({ key: f.key, label: f.label, group: f.group, level: f.level, hint: f.hint || '', types: KINDS[f.kind] })),
        columns,
        subitemColumns,
        saved,
        current: resolveForBoard(columns, subitemColumns, saved),
        canEdit: canEdit(req.session),
      });
    } catch (err) {
      console.error('Settings load failed:', err);
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/callsheet/settings', verifySession, async (req, res) => {
    try {
      if (!canEdit(req.session)) throw new Error('View-only users cannot change settings');
      const { boardId, mapping } = req.body || {};
      if (!boardId) throw new Error('boardId missing');
      const saved = await saveMapping(boardId, mapping || {});
      res.json({ ok: true, saved });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
};
