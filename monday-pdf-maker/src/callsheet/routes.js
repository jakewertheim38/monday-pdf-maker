// Call sheet: workflow block actions + the item view (page and its API).
const path = require('path');
const jwt = require('jsonwebtoken');
const { getItem, uploadPdf, clearFilesColumn, getBoardColumns } = require('../monday');
const { getSetting } = require('../secrets');
const { FIELDS, KINDS, DOCS } = require('./fields');
const { getMapping, saveMapping } = require('./store');
const { buildPdf, saveColumnFor, DOC_KINDS } = require('./service');
const { toCallSheetItem } = require('./normalize');
const { getUserToken, saveUserToken, exchangeCode, userIdFromSession } = require('../oauth');

// Make one PDF and attach it to the item's Files column.
async function makeAndSave(token, itemId, kind, boardIdHint, workflowInputs = {}) {
  const raw = await getItem(token, itemId);
  const boardId = (raw.board && raw.board.id) || boardIdHint;
  const mapping = await getMapping(boardId);
  const columnId = saveColumnFor(kind, raw, mapping, workflowInputs);
  if (!columnId) throw new Error(`No Files column set for the ${DOCS[kind].label} PDF. Set it in the workflow block inputs or the item view settings.`);
  const { buffer, filename } = await buildPdf(kind, raw, mapping, workflowInputs);
  // Clear existing files before uploading so we replace rather than append.
  await clearFilesColumn(token, boardId, itemId, columnId);
  const file = await uploadPdf(token, itemId, columnId, filename, buffer);
  return { filename, assetId: file && file.id };
}

// ---------- Item view auth: uses MONDAY_API_TOKEN from secrets ----------
async function verifySession(req, res, next) {
  try {
    const apiToken = getSetting('MONDAY_API_TOKEN');
    if (!apiToken) throw new Error('MONDAY_API_TOKEN is not set — add it to monday code Secrets');
    req.apiToken = apiToken;
    // Still verify the session token so we know the request came from monday
    const secret = getSetting('MONDAY_CLIENT_SECRET');
    if (secret) {
      const token = req.headers.authorization;
      if (token) {
        try { req.session = jwt.verify(token, secret); } catch (_) {}
      }
    }
    next();
  } catch (err) {
    console.error('Item view auth failed:', err.message);
    res.status(401).json({ error: err.message });
  }
}

function buildAuthUrl() {
  const clientId = getSetting('MONDAY_CLIENT_ID');
  if (!clientId) return null;
  // Use the secret if set, otherwise fall back to the live URL
  const redirectUri = getSetting('MONDAY_OAUTH_REDIRECT_URI') ||
    'https://live1-service-29120331-f5082871.eu.monday.app/oauth/callback';
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
  return `https://auth.monday.com/oauth2/authorize?${params}`;
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
      for (const kind of kinds) results.push(await makeAndSave(token, itemId, kind, boardId, fields));
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

  // ---------- OAuth ----------
  // Redirect the user to monday's OAuth page
  app.get('/oauth/start', (_req, res) => {
    const url = buildAuthUrl();
    if (!url) return res.status(500).send('MONDAY_CLIENT_ID is not set');
    res.redirect(url);
  });

  // monday redirects back here with ?code=... after the user authorises
  app.get('/oauth/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) throw new Error('No code in callback');
      const accessToken = await exchangeCode(code);
      // Find out which user this token belongs to
      const meRes = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: accessToken, 'API-Version': '2026-01' },
        body: JSON.stringify({ query: '{ me { id name } }' }),
      });
      const meJson = await meRes.json();
      const me = meJson.data && meJson.data.me;
      if (!me) throw new Error('Could not get user info from monday');
      await saveUserToken(String(me.id), accessToken);
      console.log(`OAuth: saved token for user ${me.id} (${me.name})`);
      // Close the popup and tell the item view to reload
      res.send(`<html><body><script>
        if (window.opener) { window.opener.postMessage('oauth_complete', '*'); window.close(); }
        else { document.body.innerText = 'Authorised! You can close this tab.'; }
      </script></body></html>`);
    } catch (err) {
      console.error('OAuth callback failed:', err.message);
      res.status(400).send('Authorisation failed: ' + err.message);
    }
  });

  // Check whether the current user has authorised (used by the view on load)
  app.get('/api/callsheet/auth-status', async (req, res) => {
    try {
      const secret = getSetting('MONDAY_CLIENT_SECRET');
      if (!secret) return res.json({ authorised: false, authUrl: buildAuthUrl() });
      const token = req.headers.authorization;
      if (!token) return res.json({ authorised: false, authUrl: buildAuthUrl() });
      const session = jwt.verify(token, secret);
      const userId = userIdFromSession(session);
      const oauthToken = userId ? await getUserToken(userId) : null;
      res.json({ authorised: !!oauthToken, authUrl: oauthToken ? null : buildAuthUrl() });
    } catch (err) {
      res.json({ authorised: false, authUrl: buildAuthUrl() });
    }
  });

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
        crew: subitems.filter((s) => s.crewTalent === 'Crew')
          .map((s) => ({ name: s.name1 || s.name, position: s.position, callTime: s.callTime, wrapTime: s.wrapTime, email: s.email && s.email.email, note: s.callSheetNote })),
        talent: subitems.filter((s) => s.crewTalent === 'Talent')
          .map((s) => ({ name: s.name1 || s.name, position: s.position, callTime: s.callTime, wrapTime: s.wrapTime, note: s.callSheetNote })),
        schedule: subitems.filter((s) => s.type === 'Schedule')
          .map((s) => ({ date: s.date, timeStart: s.timeStart, timeEnd: s.timeEnd, scene: s.sceneName, location: s.location, description: s.description, stillVideo: Array.isArray(s.stillVideo) ? s.stillVideo.join(', ') : s.stillVideo, talent: s.talent, clothing: s.clothing })),
        roles: subitems.filter((s) => s.resposibility && s.resposibility.trim() !== '')
          .map((s) => ({ name: s.name1 || s.name, position: s.position, responsibility: s.resposibility })),
        saveTo,
        docs: DOC_KINDS.map((k) => ({ kind: k, label: DOCS[k].label })),
        canEdit: canEdit(req.session),
      });
    } catch (err) {
      console.error('Item view load failed:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Make a PDF and stream it back to the browser (download only, no monday writes).
  app.post('/api/callsheet/pdf/download', verifySession, async (req, res) => {
    const { itemId, kind } = req.body || {};
    try {
      if (!DOC_KINDS.includes(kind)) throw new Error('Unknown document');
      const raw = await getItem(req.apiToken, itemId);
      const boardId = (raw.board && raw.board.id);
      const mapping = await getMapping(boardId);
      const { buffer, filename } = await buildPdf(kind, raw, mapping);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('X-Filename', encodeURIComponent(filename));
      res.send(buffer);
    } catch (err) {
      console.error('Item view PDF (download) failed:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Save a PDF to the item's Files column (clears first, then uploads).
  // Also streams the PDF back so the browser can download it if wanted.
  app.post('/api/callsheet/pdf/save', verifySession, async (req, res) => {
    const { itemId, kind } = req.body || {};
    try {
      if (!DOC_KINDS.includes(kind)) throw new Error('Unknown document');
      const raw = await getItem(req.apiToken, itemId);
      const boardId = (raw.board && raw.board.id);
      const mapping = await getMapping(boardId);
      const { buffer, filename } = await buildPdf(kind, raw, mapping);
      const columnId = saveColumnFor(kind, raw, mapping);
      if (!columnId) throw new Error(`No Files column configured for the ${kind} PDF — open ⚙️ Settings to set one.`);
      await clearFilesColumn(req.apiToken, boardId, itemId, columnId);
      await uploadPdf(req.apiToken, itemId, columnId, filename, buffer);
      res.json({ ok: true, filename });
    } catch (err) {
      console.error('Item view PDF (save) failed:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Legacy route kept for backwards compatibility — behaves like /download.
  app.post('/api/callsheet/pdf', verifySession, async (req, res) => {
    const { itemId, kind } = req.body || {};
    try {
      if (!DOC_KINDS.includes(kind)) throw new Error('Unknown document');
      const raw = await getItem(req.apiToken, itemId);
      const boardId = (raw.board && raw.board.id);
      const mapping = await getMapping(boardId);
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
