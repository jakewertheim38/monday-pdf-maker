// Port of generateQuotePdf() from your Vibe app — same layout, run on the server.
const config = require('../config');
const { formatCurrency, lineTotal, formatDate, groupBy, logoBlock, footer, totalBlock, notesBlock, tableLayout } = require('./shared');
const { projectLines } = require('./shared');

const th = (text, extra = {}) => ({ text, style: 'tableHeader', fillColor: '#e5e7eb', color: '#374151', ...extra });

module.exports = function generateQuotePdf(item, logoDataUrl) {
  const subitems = item.subitems || [];
  const grandTotal = subitems.reduce((sum, s) => sum + lineTotal(s), 0);

  const tableRows = [
    [th('Item'), th('Description'), th('Budget Pot'), th('Qty', { alignment: 'right' }), th('Rate', { alignment: 'right' }), th('Amount', { alignment: 'right' })],
  ];

  Object.entries(groupBy(subitems, 'budgetType')).forEach(([budgetType, items]) => {
    const groupSubtotal = items.reduce((sum, s) => sum + lineTotal(s), 0);
    tableRows.push([
      { text: budgetType, colSpan: 5, style: 'groupHeader', fillColor: '#f1f5f9', margin: [0, 0.5, 0, 0.5] },
      {}, {}, {}, {},
      { text: formatCurrency(groupSubtotal), style: 'groupHeader', fillColor: '#f1f5f9', alignment: 'right', margin: [0, 0.5, 0, 0.5] },
    ]);
    items.forEach((s) => {
      tableRows.push([
        { text: s.name || '-', margin: [0, 4, 0, 4] },
        { text: s.description || '-', margin: [0, 4, 0, 4] },
        { text: s.budgetType || '-', alignment: 'center', margin: [0, 4, 0, 4] },
        { text: s.quotedQty || s.quotedQty === 0 ? String(s.quotedQty) : '-', alignment: 'center', margin: [0, 4, 0, 4] },
        { text: formatCurrency(s.quotedCost), alignment: 'right', margin: [0, 4, 0, 4] },
        { text: formatCurrency(lineTotal(s)), alignment: 'right', margin: [0, 4, 0, 4] },
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
            { text: item.quoteType || 'Quote', fontSize: 24, bold: true, alignment: 'right' },
            { text: item.name || '-', fontSize: 14, color: '#666', alignment: 'right', margin: [0, 4, 0, 0] },
          ],
          margin: [0, 40, 40, 0],
        },
      ],
    },
    footer,
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: config.company.name, fontSize: 11, color: '#374151', margin: [0, 0, 0, 1.5] },
              { text: config.company.team, fontSize: 10, color: '#6b7280', margin: [0, 0, 0, 1.5] },
              { text: config.company.email, fontSize: 10, color: '#6b7280', margin: [0, 0, 0, 8] },
              { text: 'Team Owner', fontSize: 10, color: '#6b7280', bold: true, margin: [0, 0, 0, 1] },
              { text: item.team || '-', fontSize: 11, color: '#374151' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: `Job# ${item.jobNo || '-'}`, fontSize: 11, bold: true, color: '#374151', alignment: 'right', margin: [0, 0, 0, 4] },
              { text: [
                { text: 'Quote Date: ', fontSize: 10, color: '#6b7280' },
                { text: formatDate(item.quoteDate) || '-', fontSize: 10, color: '#374151', bold: true },
              ], alignment: 'right', margin: [0, 0, 0, 2] },
              { text: [
                { text: 'Version #: ', fontSize: 10, color: '#6b7280' },
                { text: item.versionNo || '-', fontSize: 10, color: '#374151', bold: true },
              ], alignment: 'right', margin: [0, 0, 0, 4] },
              { text: 'Description', fontSize: 10, color: '#6b7280', bold: true, alignment: 'right', margin: [0, 0, 0, 1] },
              { text: item.quoteDescription || '-', fontSize: 11, color: '#374151', alignment: 'right' },
              ...projectLines(item),
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      },
      {
        table: { headerRows: 1, widths: ['*', '*', 60, 40, 60, 70], body: tableRows },
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
