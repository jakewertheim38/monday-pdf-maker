// VCC card PNG workflow block.
// Input fields: cardNumber, expDate, cvv, filesColumn (column id or title), itemId.
// Output: { assetId } of the uploaded PNG.
const { renderPng } = require('./template');
const { uploadFile, clearFilesColumn, getItem } = require('../monday');
const { getSetting } = require('../secrets');

module.exports = function registerVcc(app, { verifyMonday, idFrom }) {
  app.post('/action/vcc-png', verifyMonday, async (req, res) => {
    const payload = req.body.payload || {};
    const fields = payload.inboundFieldValues || payload.inputFields || {};
    const itemId = idFrom(fields.itemId ?? fields.item);
    const token = req.session.shortLivedToken || getSetting('MONDAY_API_TOKEN');

    try {
      if (!itemId) throw new Error('No itemId in action input fields');
      if (!token) throw new Error('No API token available');

      const cardNumber = String(fields.cardNumber || '').trim();
      const expDate = String(fields.expDate || '').trim();
      const cvv = String(fields.cvv || '').trim();

      if (!cardNumber) throw new Error('cardNumber is required');
      if (!expDate) throw new Error('expDate is required');
      if (!cvv) throw new Error('cvv is required');

      // Resolve the Files column from the workflow input.
      const colInput = String(fields.filesColumn || '').trim();
      if (!colInput) throw new Error('filesColumn is required');

      const raw = await getItem(token, itemId);
      const boardId = raw.board && raw.board.id;
      const want = colInput.toLowerCase();
      const filesCol = raw.column_values.find((c) => c.id === colInput)
        || raw.column_values.find((c) => c.type === 'file' && c.column && c.column.title.trim().toLowerCase() === want);
      if (!filesCol) throw new Error(`Files column "${colInput}" not found on this board`);

      const png = await renderPng({ cardNumber, expDate, cvv });
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
