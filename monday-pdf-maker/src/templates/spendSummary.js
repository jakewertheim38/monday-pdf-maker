// Port of generateSpendSummaryPdf() from your Vibe app.
const config = require('../config');
const { formatCurrency, lineTotal, formatDate, groupBy, logoBlock, footer, totalBlock, notesBlock, tableLayout } = require('./shared');
const { projectLines } = require('./shared');

const th = (text, extra = {}) => ({ text, style: 'tableHeader', fillColor: '#e5e7eb', color: '#374151', ...extra });

module.exports = function generateSpendSummaryPdf(item, logoDataUrl) {
  const subitems = item.subitems || [];
  const grandTotal = subitems.reduce((sum, s) => sum + lineTotal(s), 0);

  const tableRows = [[th('Spend Type'), th('Spend Summary'), th('Total Spend', { alignment: 'right' })]];

  Object.entries(groupBy(subitems, 'spendType')).forEach(([spendType, items]) => {
    const groupTotal = items.reduce((sum, s) => sum + lineTotal(s), 0);
    tableRows.push([
      { text: spendType, colSpan: 2, style: 'groupHeader', fillColor: '#f1f5f9', margin: [0, 0.5, 0, 0.5], bold: true },
      {},
      { text: formatCurrency(groupTotal), style: 'groupHeader', fillColor: '#f1f5f9', alignment: 'right', margin: [0, 0.5, 0, 0.5], bold: true },
    ]);
    items.forEach((s) => {
      tableRows.push([
        { text: s.name || '-', margin: [4, 4, 0, 4], fontSize: 9 },
        { text: s.spendSummary || '-', margin: [0, 4, 0, 4], fontSize: 9 },
        { text: formatCurrency(lineTotal(s)), alignment: 'right', margin: [0, 4, 4, 4], fontSize: 9 },
      ]);
    });
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 130, 40, 60],
    header: {
      columns: [
        logoBlock(logoDataUrl),
        {
          stack: [
            { text: item.quoteType || 'Quote', fontSize: 20, bold: true, alignment: 'right' },
            { text: 'Spend Summary', fontSize: 20, bold: true, alignment: 'right', margin: [0, 2, 0, 0] },
            { text: item.name || '-', fontSize: 14, color: '#666', alignment: 'right', margin: [0, 4, 0, 0] },
          ],
          margin: [0, 40, 40, 0],
        },
      ],
    },
    footer,
    content: [
      { text: config.company.name, fontSize: 11, margin: [0, 0, 0, 1.5] },
      { text: config.company.team, fontSize: 10, color: '#666', margin: [0, 0, 0, 1.5] },
      { text: config.company.email, fontSize: 10, color: '#666', margin: [0, 0, 0, 3] },
      {
        columns: [
          { text: '' },
          {
            stack: [
              { text: `Job# ${item.jobNo || '-'}`, fontSize: 12, bold: true, alignment: 'right', margin: [0, 0, 0, 4] },
              { text: `Quote Date: ${formatDate(item.quoteDate) || '-'}`, fontSize: 10, alignment: 'right', margin: [0, 0, 0, 2] },
              { text: `Version #: ${item.versionNo || '-'}`, fontSize: 10, alignment: 'right', margin: [0, 0, 0, 4] },
              {
                stack: [
                  { text: 'Description', fontSize: 10, bold: true, alignment: 'right', margin: [0, 0, 0, 1] },
                  { text: item.quoteDescription || '-', fontSize: 11, alignment: 'right' },
                ],
              },
              ...projectLines(item),
            ],
            alignment: 'right',
          },
        ],
        margin: [0, -53, 0, 12],
      },
      {
        stack: [
          { text: 'Team Owner', fontSize: 10, bold: true, margin: [0, 0, 0, 1] },
          { text: item.team || '-', fontSize: 11 },
        ],
        margin: [0, 4, 0, 12],
      },
      {
        table: { headerRows: 1, widths: ['20%', '*', '20%'], body: tableRows },
        layout: tableLayout,
      },
      totalBlock(grandTotal),
      ...notesBlock(item),
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 10, color: '#000', margin: [0, 6, 0, 6] },
      groupHeader: { bold: true, fontSize: 10, margin: [0, 2, 0, 2] },
    },
  };
};
