// OAuth flow for the item view.
// Monday's item views don't receive a short-lived token, so we use OAuth so each user
// authorises the app with their own account. Their token is stored in SecureStorage,
// keyed by their monday user ID (from the session JWT).
const { SecureStorage } = require('@mondaycom/apps-sdk');
const { getSetting } = require('./secrets');

let storage = null;
try { storage = new SecureStorage(); } catch (_) {}
const memory = new Map(); // fallback for local testing

const tokenKey = (userId) => `oauth-token-${userId}`;

async function getUserToken(userId) {
  const key = tokenKey(userId);
  try {
    if (storage) {
      const v = await storage.get(key);
      if (v) return String(v);
    }
  } catch (_) {}
  return memory.get(key) || null;
}

async function saveUserToken(userId, token) {
  const key = tokenKey(userId);
  memory.set(key, token);
  if (storage) {
    try { await storage.set(key, token); } catch (_) {}
  }
}

// Exchange an OAuth code for an access token using monday's token endpoint.
async function exchangeCode(code) {
  const clientId = getSetting('MONDAY_CLIENT_ID');
  const clientSecret = getSetting('MONDAY_CLIENT_SECRET');
  const redirectUri = getSetting('MONDAY_OAUTH_REDIRECT_URI');
  if (!clientId || !clientSecret) throw new Error('MONDAY_CLIENT_ID or MONDAY_CLIENT_SECRET is not set');
  const res = await fetch('https://auth.monday.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error_description || json.error || 'OAuth exchange failed');
  return json.access_token;
}

// Get the user ID from a monday session JWT (signed with Client Secret).
function userIdFromSession(session) {
  const d = (session && session.dat) || {};
  return d.user_id ? String(d.user_id) : null;
}

module.exports = { getUserToken, saveUserToken, exchangeCode, userIdFromSession };
