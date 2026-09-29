// Saves the column mapping chosen in the item view's settings, one per board.
// Uses monday code's SecureStorage (kept on monday's servers, shared by the item view and
// the workflow blocks). Falls back to memory if it isn't available (e.g. local testing).
let storage = null;
try {
  const { SecureStorage } = require('@mondaycom/apps-sdk');
  storage = new SecureStorage();
} catch (_) {}
const memory = new Map();

const keyFor = (boardId) => `callsheet-mapping-${boardId}`;

async function getMapping(boardId) {
  if (!boardId) return {};
  const key = keyFor(boardId);
  try {
    if (storage) {
      const v = await storage.get(key);
      if (v && typeof v === 'object') return v;
    }
  } catch (err) {
    console.error('Reading mapping failed, using defaults:', err.message);
  }
  return memory.get(key) || {};
}

async function saveMapping(boardId, mapping) {
  const key = keyFor(boardId);
  const clean = {};
  Object.entries(mapping || {}).forEach(([k, v]) => {
    if (typeof v === 'string' && /^[\w-]{0,100}$/.test(v)) clean[k] = v;
  });
  memory.set(key, clean);
  if (storage) {
    try { await storage.set(key, clean); } catch (err) {
      console.error('saveMapping: SecureStorage write failed:', err.message);
      // clean is already in memory; the caller gets the saved value either way
    }
  }
  return clean;
}

module.exports = { getMapping, saveMapping };
