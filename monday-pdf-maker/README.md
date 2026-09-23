# monday PDF maker: Production Quotes

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

## Try it locally

```bash
npm install
npm run demo                                          # sample PROD-025 data (add --no-project to hide the project block)
MONDAY_API_TOKEN=your_token npm run preview -- 3225120381   # a real item
```

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
