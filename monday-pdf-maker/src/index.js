// On monday code, variables set with `mapps code:env` / secrets are loaded into process.env here.
// Locally (npm run demo/preview) this package is simply skipped.
try {
  const { EnvironmentVariablesManager } = require('@mondaycom/apps-sdk');
  new EnvironmentVariablesManager({ updateProcessEnv: true });
} catch (_) {}

const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { getItem, uploadPdf } = require('./monday');
const { toQuote, columnMapping } = require('./quote');
const { renderPdf, filenameFor } = require('./render');

const app = express();
app.use(express.json());

// monday signs every request with your app's Signing Secret. Reject anything else.
function verifyMonday(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) throw new Error('missing Authorization header');
    req.session = jwt.verify(token, process.env.MONDAY_SIGNING_SECRET || config.signingSecret);
    next();
  } catch (err) {
    console.error('Auth failed:', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Workflow fields can arrive as a plain id (123), a string ("123"),
// or an object ({ id: 123 } / { value: 123 }) depending on the field type chosen.
function idFrom(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'object') return idFrom(v.id ?? v.itemId ?? v.columnId ?? v.value ?? null);
  return String(v);
}

function handler(kind) {
  return async (req, res) => {
    const payload = req.body.payload || {};
    const fields = payload.inboundFieldValues || payload.inputFields || {};
    const itemId = idFrom(fields.itemId ?? fields.item);
    const mapping = columnMapping(fields); // column IDs typed into the workflow block, if any
    const apiToken = req.session.shortLivedToken || config.apiToken;

    try {
      if (!itemId) throw new Error('No itemId in action input fields');
      if (!apiToken) throw new Error('No API token available');

      const raw = await getItem(apiToken, itemId);
      const quote = toQuote(raw, mapping);
      // The Files column can be given by title too; uploading needs its real ID.
      const want = mapping.filesColumn.trim().toLowerCase();
      const filesCol = raw.column_values.find((c) => c.id === mapping.filesColumn)
        || raw.column_values.find((c) => c.type === 'file' && c.column && c.column.title.trim().toLowerCase() === want);
      if (!filesCol) throw new Error(`Files column "${mapping.filesColumn}" not found on this board`);
      const pdf = await renderPdf(kind, quote);
      const file = await uploadPdf(apiToken, itemId, filesCol.id, filenameFor(kind, quote), pdf);

      console.log(`${kind} PDF created for item ${itemId} (${pdf.length} bytes)`);
      res.status(200).json({ outputFields: { assetId: file && file.id } });
    } catch (err) {
      console.error(`${kind} PDF failed:`, err);
      res.status(400).json({
        severityCode: 4000,
        notificationErrorTitle: 'PDF could not be created',
        notificationErrorDescription: err.message.slice(0, 250),
        runtimeErrorDescription: err.message.slice(0, 250),
      });
    }
  };
}

app.get('/', (_req, res) => res.send('monday PDF maker is running'));
app.post('/action/quote-pdf', verifyMonday, handler('quote'));
app.post('/action/spend-summary-pdf', verifyMonday, handler('spendSummary'));

app.listen(config.port, () => console.log(`Listening on port ${config.port}`));
