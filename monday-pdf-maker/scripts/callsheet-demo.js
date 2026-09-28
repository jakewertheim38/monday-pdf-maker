// Make the four call sheet PDFs locally, without deploying.
//   node scripts/callsheet-demo.js                  -> sample data (based on a real Production Files shoot)
//   MONDAY_API_TOKEN=xxx node scripts/callsheet-demo.js 3192237188   -> a real item
const fs = require('fs');
const { getItem } = require('../src/monday');
const { buildPdf, DOC_KINDS } = require('../src/callsheet/service');

const demo = require('./callsheet-sample');

(async () => {
  const itemId = process.argv[2];
  const raw = itemId ? await getItem(process.env.MONDAY_API_TOKEN, itemId) : demo;
  for (const kind of DOC_KINDS) {
    const { buffer, filename } = await buildPdf(kind, raw, {});
    fs.writeFileSync(filename, buffer);
    console.log(`Wrote ${filename} (${Math.round(buffer.length / 1024)} KB)`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
