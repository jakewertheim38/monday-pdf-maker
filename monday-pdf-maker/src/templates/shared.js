const config = require('../config');

// Format currency with commas (same as your original)
const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const lineTotal = (s) => (s.quotedQty || 0) * (s.quotedCost || 0);

const formatDate = (d) => (d ? d.toLocaleDateString('en-GB', { timeZone: 'Europe/London' }) : null);

// Group subitems by a field, keeping first-seen order
const groupBy = (subs, key) => {
  const groups = {};
  subs.forEach((s) => {
    const k = s[key] || 'Other';
    (groups[k] = groups[k] || []).push(s);
  });
  return groups;
};

const logoBlock = (logoDataUrl) =>
  logoDataUrl
    ? { image: logoDataUrl, width: 100, margin: [40, 30, 0, 0] }
    : { text: 'MYPROTEIN', fontSize: 24, bold: true, margin: [40, 30, 0, 0] };

const footer = (page, pages) => ({
  text: `Page ${page} of ${pages}`,
  alignment: 'center',
  fontSize: 9,
  margin: [0, 20],
});

const totalBlock = (grandTotal) => ({
  columns: [
    { text: '' },
    {
      width: 150,
      stack: [
        {
          columns: [
            { text: 'Total', bold: true, fontSize: 14 },
            { text: formatCurrency(grandTotal), alignment: 'right', bold: true, fontSize: 14 },
          ],
        },
      ],
      margin: [0, 10, 0, 0],
    },
  ],
});

const notesBlock = (item) => [
  { text: 'Notes', fontSize: 12, bold: true, margin: [0, 20, 0, 6] },
  { text: item.notes || config.defaultNotes, fontSize: 10, color: '#666' },
];

const tableLayout = {
  hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
  vLineWidth: () => 0,
  hLineColor: () => '#e2e8f0',
  fillColor: (i) => (i === 0 ? '#f8fafc' : null),
  paddingLeft: () => 8,
  paddingRight: () => 8,
};

// Linked-project lines for the top-right block. Nothing is shown if no project is linked.
const projectLines = (item) => {
  const pr = item.project;
  if (!pr) return [];
  const row = (label, value) => ({
    text: [
      { text: `${label}: `, fontSize: 10, color: '#6b7280' },
      { text: value || '-', fontSize: 10, color: '#374151', bold: true },
    ],
    alignment: 'right',
    margin: [0, 0, 0, 2],
  });
  return [
    { text: 'Project', fontSize: 10, color: '#6b7280', bold: true, alignment: 'right', margin: [0, 6, 0, 1] },
    { text: pr.name || '-', fontSize: 11, color: '#374151', alignment: 'right', margin: [0, 0, 0, 3] },
    row('Project ID', pr.projectId),
    row('Shoot Date', pr.shootDate),
    row('Campaign Owner', pr.campaignOwner),
  ];
};

module.exports = { projectLines, formatCurrency, lineTotal, formatDate, groupBy, logoBlock, footer, totalBlock, notesBlock, tableLayout };
