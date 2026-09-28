// Reads a setting from monday code's Environment variables or Secrets (either works),
// or from a normal environment variable when running locally.
let secrets = null;
try {
  const { SecretsManager } = require('@mondaycom/apps-sdk');
  secrets = new SecretsManager();
} catch (_) {}

function getSetting(name) {
  if (process.env[name]) return process.env[name];
  try {
    const v = secrets && secrets.get(name);
    if (v != null && v !== '') return String(v);
  } catch (_) {}
  return '';
}

module.exports = { getSetting };
