# Monday App Skill

## On invocation — ask for project details first

When this skill is loaded at the start of a new app or feature, ask the user for the following before doing anything else. Use `AskUserQuestion` with all questions in one call:

1. **What is the app for?** (a plain description of what it does)
2. **App ID** (from monday Developers Center — looks like a number, e.g. `29120331`)
3. **App URL** (the deployed Cloud Run URL, e.g. `https://latest---service-29120331-xxxx.eu.monday.app`) — or "not deployed yet" if it's new
4. **GitHub repo** (owner/repo, e.g. `jakewertheim38/monday-pdf-maker`)
5. **What feature/block are we building?** (describe the new thing to add, or "just scaffold" if starting fresh)

Only proceed once you have these answers. Use them throughout the session — for route URLs, Developers Center instructions, commit messages, and deployment steps.

---

This project is a **monday.com app** running on **monday code** (Google Cloud Run under the hood). Use this skill as context whenever the user mentions a new feature, block, route, or deployment task.

---

## Stack

- **Runtime**: Node.js 22 on monday code (Cloud Run)
- **Framework**: Express
- **Key deps**: `express`, `jsonwebtoken`, `@mondaycom/apps-sdk`, `pdfmake`, `@resvg/resvg-js`
- **No native modules** — monday code does not have system libraries (e.g. `libvips`), so `sharp` and similar packages that compile native bindings will crash the server on startup. Use pure-JS or WASM alternatives (e.g. `@resvg/resvg-js` for SVG→PNG).

---

## Project layout

```
monday-pdf-maker/          ← repo root
  monday-pdf-maker/        ← app root (package.json lives here)
    src/
      index.js             ← Express app entry point
      config.js            ← env vars / column ID defaults
      monday.js            ← API helpers (getItem, uploadFile, clearFilesColumn, …)
      render.js            ← pdfmake renderer + font loading
      secrets.js           ← getSetting() wrapper for monday code secrets
      oauth.js             ← OAuth helpers
      callsheet/           ← call sheet feature module
        routes.js          ← registers routes on the Express app
        service.js
        …
      vcc/                 ← VCC card PNG feature module
        routes.js
        template.js        ← SVG builder + resvg renderer
      templates/           ← pdfmake document definitions
    views/                 ← HTML views served for item views
    assets/                ← static assets (logo.png etc.)
```

Each feature lives in its own subfolder with a `routes.js` that exports `function(app, { verifyMonday, idFrom })`. It is registered in `index.js` with one line:

```js
require('./featurename/routes')(app, { verifyMonday, idFrom });
```

---

## Boilerplate patterns

### Auth middleware
```js
function verifyMonday(req, res, next) {
  try {
    const token = req.headers.authorization;
    if (!token) throw new Error('missing Authorization header');
    req.session = jwt.verify(token, process.env.MONDAY_SIGNING_SECRET || config.signingSecret);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

### Field ID helper
Workflow/automation fields can arrive as a plain id, string, or object:
```js
function idFrom(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'object') return idFrom(v.id ?? v.itemId ?? v.columnId ?? v.value ?? null);
  return String(v);
}
```

### Reading input fields
monday sends workflow payloads as `inboundFieldValues` or `inputFields`:
```js
const payload = req.body.payload || {};
const fields = payload.inboundFieldValues || payload.inputFields || {};
const itemId = idFrom(fields.itemId ?? fields.item);
const token = req.session.shortLivedToken || getSetting('MONDAY_API_TOKEN');
```

### Error response shape
monday expects this exact shape for action failures:
```js
res.status(400).json({
  severityCode: 4000,
  notificationErrorTitle: 'Short title',
  notificationErrorDescription: err.message.slice(0, 250),
  runtimeErrorDescription: err.message.slice(0, 250),
});
```

### Success response shape
```js
res.status(200).json({ outputFields: { assetId: file && file.id } });
```

### Health endpoint (REQUIRED)
monday sends `HEAD /health` before every action. Without a 200 response it aborts with "resource not being found". Always include:
```js
app.head('/health', (_req, res) => res.sendStatus(200));
app.get('/health', (_req, res) => res.sendStatus(200));
```

---

## monday.js helpers

- `getItem(token, itemId)` — fetches the item with all column values and subitems
- `uploadFile(token, itemId, columnId, filename, buffer, mimeType)` — uploads any file to a Files column
- `uploadPdf(token, itemId, columnId, filename, buffer)` — wraps uploadFile with `application/pdf`
- `clearFilesColumn(token, boardId, itemId, columnId)` — clears all files from a column before uploading
- `getBoardColumns(token, boardId)` — returns board columns and subitem columns
- `cellText(columnValue)` — extracts display text from any column value type

---

## Resolving a Files column from workflow input

```js
const colInput = String(fields.filesColumn || '').trim();
const want = colInput.toLowerCase();
const filesCol = raw.column_values.find((c) => c.id === colInput)
  || raw.column_values.find((c) => c.type === 'file' && c.column && c.column.title.trim().toLowerCase() === want);
if (!filesCol) throw new Error(`Files column "${colInput}" not found on this board`);
```

---

## SVG → PNG rendering

Use `@resvg/resvg-js` (WASM, no system deps). SVG must start with `<?xml version="1.0" encoding="UTF-8"?>`:

```js
const { Resvg } = require('@resvg/resvg-js');

function renderPng(svgString, widthPx) {
  const resvg = new Resvg(svgString, { fitTo: { mode: 'width', value: widthPx } });
  return Buffer.from(resvg.render().asPng());
}
```

---

## Secrets / environment variables

`getSetting(key)` from `./secrets.js` reads monday code secrets (set via `mapps code:env`) or falls back to `process.env[key]`. Never hardcode secrets.

---

## Deployment flow

1. **Develop** on branch `claude/<branch-name>` (branch is specified per session)
2. **Commit and push** to GitHub — `git push origin <branch>`
3. **Deploy to monday code** — run `mapps code:push` from your local machine (requires monday CLI and local auth; cannot be run from the cloud container)
4. monday code pulls from the connected GitHub repo and rebuilds the Cloud Run service
5. **Test** by triggering the automation in monday

The app URL looks like: `https://latest---service-APPID-HASH.eu.monday.app`

### Common deployment gotchas
- `mapps` CLI is not available in the cloud container — always deploy from your local machine
- After adding a new feature block, the block must be registered in the monday Developers Center (Features → Workflow Block) with the correct action URL before it will appear in automations
- New npm packages must be in `package.json` — monday code installs them during the build
- **No native node modules** — WASM and pure-JS only

---

## Workflow block setup in Developers Center

For each new action route (`POST /action/my-feature`):
1. Developers Center → your app → Features → Add Feature → Workflow Block
2. Set Action URL to `https://<app-url>/action/my-feature`
3. Define input fields (itemId, plus whatever the action needs)
4. Define output fields (typically `assetId`)
5. Rebuild the automation using the new block after any field changes
