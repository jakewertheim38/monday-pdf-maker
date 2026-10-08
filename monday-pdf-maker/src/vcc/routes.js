// VCC card PNG workflow block.
// Input fields: name, actualExp, loaded, cardNumber, vccExp, cvv, filesColumn, itemId.
// Output: { assetId } of the uploaded PNG.
const { renderPng } = require('./template');
const { uploadFile, clearFilesColumn, getItem, cellText } = require('../monday');
const { getSetting } = require('../secrets');

// monday sends column IDs as field values when the user maps a board column to an input.
// Look up the real text value from the fetched item; fall back to the raw string if not found.
function colVal(raw, idOrValue) {
  const s = String(idOrValue || '').trim();
  const col = raw.column_values.find((c) => c.id === s);
  return col ? cellText(col) : s;
}

module.exports = function registerVcc(app, { verifyMonday, idFrom }) {
  app.post('/action/vcc-png', verifyMonday, async (req, res) => {
    const payload = req.body.payload || {};
    const fields = payload.inboundFieldValues || payload.inputFields || {};
    const itemId = idFrom(fields.itemId ?? fields.item);
    const token = req.session.shortLivedToken || getSetting('MONDAY_API_TOKEN');

    try {
      if (!itemId) throw new Error('No itemId in action input fields');
      if (!token) throw new Error('No API token available');

      const colInput = String(fields.filesColumn || '').trim();
      if (!colInput) throw new Error('filesColumn is required');

      const raw = await getItem(token, itemId);

      const name       = colVal(raw, fields.name);
      const actualExp  = colVal(raw, fields.actualExp);
      const loaded     = colVal(raw, fields.loaded);
      const cardNumber = colVal(raw, fields.cardNumber);
      const vccExp     = colVal(raw, fields.vccExp);
      const cvv        = colVal(raw, fields.cvv);

      if (!cardNumber) throw new Error('cardNumber is required');

      const boardId = raw.board && raw.board.id;
      const want = colInput.toLowerCase();
      const filesCol = raw.column_values.find((c) => c.id === colInput)
        || raw.column_values.find((c) => c.type === 'file' && c.column && c.column.title.trim().toLowerCase() === want);
      if (!filesCol) throw new Error(`Files column "${colInput}" not found on this board`);

      const png = await renderPng({ name, actualExp, loaded, cardNumber, vccExp, cvv });
      const filename = `VCC-${cardNumber.replace(/\s+/g, '-')}.png`;

      await clearFilesColumn(token, boardId, itemId, filesCol.id);
      const file = await uploadFile(token, itemId, filesCol.id, filename, png, 'image/png');

      console.log(`VCC PNG created for item ${itemId} (${png.length} bytes)`);
      res.status(200).json({ outputFields: { assetId: file && file.id } });
    } catch (err) {
      console.error('VCC PNG failed:', err);
      res.status(400).json({
        severityCode: 4000,
        notificationErrorTitle: 'VCC card could not be created',
        notificationErrorDescription: err.message.slice(0, 250),
        runtimeErrorDescription: err.message.slice(0, 250),
      });
    }
  });
};
