// Make PDFs locally so you can tweak the design without deploying.
//   npm run demo                                       -> sample data, no monday account needed
//   MONDAY_API_TOKEN=xxx npm run preview -- 3225120381 -> a real item from Production Quotes 26
const fs = require('fs');
const { getItem } = require('../src/monday');
const { toQuote } = require('../src/quote');
const { renderPdf, filenameFor } = require('../src/render');

const demoQuote = {
  id: '3225120381',
  name: 'Twilight & Plum Social',
  team: 'Social',
  quoteType: 'Production & Planning Quote',
  quoteDate: null,
  jobNo: 'PROD-025',
  versionNo: null,
  quoteDescription: null,
  notes: null,
  project: process.argv.includes('--no-project')
    ? null
    : { name: 'Campaign | Black Friday Campaign', projectId: 'PRJ-014', shootDate: '10/11/2026 – 12/11/2026', campaignOwner: 'Oakley Pendergest' },
  subitems: [
    { name: 'Location Hire', description: null, budgetType: 'CA', spendType: 'Hard Cost', quotedQty: 2, quotedCost: null, spendSummary: null },
    { name: 'Videographer', description: 'Si', budgetType: 'CA', spendType: 'Freelancer', quotedQty: 2, quotedCost: 800, spendSummary: null },
    { name: 'Edits', description: null, budgetType: 'CA', spendType: 'Freelancer', quotedQty: 3, quotedCost: 500, spendSummary: null },
  ],
};

(async () => {
  const demo = process.argv.includes('--demo');
  const itemId = process.argv.slice(2).find((a) => !a.startsWith('--'));
  const quote = demo ? demoQuote : toQuote(await getItem(process.env.MONDAY_API_TOKEN, itemId));
  for (const kind of ['quote', 'spendSummary']) {
    const out = filenameFor(kind, quote);
    fs.writeFileSync(out, await renderPdf(kind, quote));
    console.log(`Wrote ${out}`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
