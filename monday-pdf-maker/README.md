# monday PDF maker

Two sets of PDFs, one app:
- **Production Quotes**: Quote and Spend Summary (workflow blocks)
- **Call Sheets**: Call Sheet, Schedule, Roles & Responsibilities and Production Document
  (workflow blocks **and** an item view with column settings); see "Call sheets" below

---

# Production Quotes

This app generates the **Production & Planning Quote** and **Spend Summary** PDFs from your
Vibe app. It runs on the server as a monday automation, so there's no watermark and nobody
has to open the app and click download. The PDF is attached straight to the item.

The layouts are direct ports of `generateQuotePdf` and `generateSpendSummaryPdf`. They use
the same fonts (Roboto), colours, grouping and file names.

Column IDs are already mapped to **Production Quotes 26** (board 5090759229):

| Field | Column |
|---|---|
| Team / Quote Type / Quote Date / Job No. / Version No. | `text_mkzzej45`, `text_mkzzpyvk`, `date_mkzz1td2`, `text_mkzz1g43`, `text_mkzz6n87` |
| Quote Description / Notes | `long_text_mm036kj9`, `long_text_mm02y09x` |
| Subitem Description / Budget Type / Spend Type | `text_mkzzjzdp`, `color_mkzzt8h9`, `color_mm1c6k34` |
| Subitem Quoted Qty / Quoted Cost / Spend summary | `numeric_mkzzhtz7`, `numeric_mkzz27x1`, `long_text_mm1tfkt9` |

**Linked project:** if the quote is linked to a project through "Link to Project" or
"2026 Brand Projects", the PDF adds a Project block under Job#. The block shows the project
name, plus the Project ID, Shoot Date and Campaign Owner from the **Project Board**
(5090728485). If nothing is linked, the block is left out. Projects linked on
"Live Brand Projects" show the name only, because that board has different columns.

If you duplicate the board, override any of these with env vars. The variable names are in `src/config.js`.

## Choosing columns per board (optional workflow inputs)

Add any of these as **Text** input fields on the blocks. Type a column **ID** or its exact **title**.
Anything left empty uses the Production Quotes 26 defaults.

| Field key | PDF field | | Field key | PDF field |
|---|---|---|---|---|
| `jobNoColumn` | Job# | | `subDescriptionColumn` | Line description |
| `quoteTypeColumn` | Title | | `budgetTypeColumn` | Budget Pot / grouping |
| `quoteDateColumn` | Quote Date | | `spendTypeColumn` | Spend Type grouping |
| `versionNoColumn` | Version # | | `qtyColumn` | Qty |
| `descriptionColumn` | Description | | `rateColumn` | Rate |
| `notesColumn` | Notes | | `spendSummaryColumn` | Spend summary |
| `teamColumn` | Team Owner | | `projectLinkColumn` | Project link |
| `filesColumn` | Where the PDF goes | | | |

## Try it locally

```bash
npm install
npm run demo                                          # sample PROD-025 data (add --no-project to hide the project block)
MONDAY_API_TOKEN=your_token npm run preview -- 3225120381   # a real item
```

## Deploying without Terminal (GitHub)

`.github/workflows/deploy.yml` deploys the app to monday code from GitHub's servers every time
you change a file on the `main` branch, or when you press **Run workflow** on the Actions tab.
It needs, in the repo's **Settings → Secrets and variables → Actions**:
- Secret `MONDAY_TOKEN`: your developer token (Developer Center → My access tokens)
- Variable `MONDAY_APP_ID`: your app's ID (shown in the Developer Center)

## Set up in monday (as workflow blocks)

1. **Developer Center → Create app.** Under OAuth & Permissions, tick `boards:read` and `boards:write`. Copy the **Signing Secret**.
2. **Host on monday → Server-side code → Connect monday code** (a monday admin may need to enable this).
3. Deploy from Terminal (one time):
   ```bash
   npm install -g @mondaycom/apps-cli
   mapps init
   npm install
   mapps code:push
   ```
4. Add the secret `MONDAY_SIGNING_SECRET` under **Host on monday → Server-side code**.
5. **Features → Create feature → Automation block**. Do this twice:

   | | Block 1 | Block 2 |
   |---|---|---|
   | Block name | Create quote PDF | Create spend summary PDF |
   | Block type | Action | Action |
   | Deployment | Server-side code | Server-side code |
   | Input field | type **Item**, key `itemId` (set as main field) | same |
   | Optional input | type **Column**, key `columnId` (the Files column) | same |
   | Execution URL | `/action/quote-pdf` | `/action/spend-summary-pdf` |

   Leave *Async actions* unticked; each PDF takes a few seconds.
6. **Publish a new app version** so the blocks go live, then **install the app** on your account.
7. In monday, open the **Workflow Builder**, choose a trigger (for example "When button clicked" or
   "When status changes to Completed" on Production Quotes 26), add your **Create quote PDF** block,
   and map its Item field to the item from the trigger.

## Files

- `src/templates/quote.js`, `src/templates/spendSummary.js`: the layouts. Edit these to change the look.
- `src/quote.js`: maps monday columns to the fields the templates use.
- `src/config.js`: column IDs, company details, default notes.
- `assets/logo.png`: the Myprotein logo, bundled so nothing is downloaded at run time.


---

# Call sheets

The four PDFs from the old Vibe call sheet app, with the same layouts (ported from its code).
Defaults are the columns on **Production Files** (5091973337) and its subitems.

## Settings needed in monday code (Environment variables or Secrets)

| Key | What it is |
|---|---|
| `MONDAY_SIGNING_SECRET` | Already set: used by the workflow blocks |
| `MONDAY_CLIENT_SECRET` | Basic information → App credentials → **Client Secret**. The item view uses it to confirm requests come from monday |
| `MONDAY_API_TOKEN` | Your developer token (My access tokens). The item view uses it to read items and save PDFs, so saved files show as uploaded by you |

## Item view

Developer Center → Features → Create feature → **Item view**. Point it at a custom URL:
`<your monday code URL>/views/callsheet`

The view shows the shoot summary, crew and talent, and a **Download** and **Save to item** button for each PDF.
**⚙️ Settings** lets you pick which column fills each part of the PDFs. It's saved per board and also used by the
workflow blocks. Fields left on the default use the Production Files column, or a column with the same name.

## Workflow blocks

Each needs the same inputs as the quote blocks: `boardId` (Board) and `itemId` (Item, main field, depends on boardId).

| Block | Execution URL ending |
|---|---|
| Create call sheet PDF | `/action/callsheet-pdf` |
| Create schedule PDF | `/action/schedule-pdf` |
| Create roles & responsibilities PDF | `/action/roles-pdf` |
| Create production document PDF | `/action/production-doc-pdf` |
| Create call sheet pack (call sheet + schedule + R&Rs) | `/action/callsheet-pack` |

Column choices come from the item view's settings, so the blocks need no column inputs.

## Try it locally

```bash
npm run callsheet-demo                                        # sample data
MONDAY_API_TOKEN=your_token node scripts/callsheet-demo.js 3192237188   # a real item
```
