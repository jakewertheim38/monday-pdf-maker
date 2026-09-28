// Ported from RolesResponsibilitiesGenerator.jsx in the Vibe app. The layout code below is unchanged;
// only the browser-specific parts (download/upload) were removed.
const { MYPROTEIN_TEAL, formatDateUK, formatTime, processWeatherText, imageToBase64 } = require('../helpers');

module.exports = async function build(item, subitems) {
  const responsibilityItems = subitems.filter(s => s.resposibility && s.resposibility.trim() !== '');
  const shootDate = formatDateUK(item.shootDate?.from || item.shootDate?.to);

  // Group team members by position + responsibility
  const grouped = {};
  responsibilityItems.forEach(item => {
    const key = `${item.position || '—'}|||${item.resposibility || '—'}`;
    if (!grouped[key]) {
      grouped[key] = {
        position: item.position || '—',
        resposibility: item.resposibility || '—',
        names: []
      };
    }
    grouped[key].names.push(item.name1 || '—');
  });

  // Build roles table rows with grouped names
  const rolesRows = Object.values(grouped).map(group => [
    { text: group.names.join(', '), fontSize: 9 },
    { text: group.position, fontSize: 9 },
    { text: group.resposibility, fontSize: 9 },
  ]);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    defaultStyle: { fontSize: 9, lineHeight: 1.4 },

    footer: (currentPage, pageCount) => ({
      stack: [
        { 
          canvas: [{ 
            type: 'line', 
            x1: 40, 
            y1: 0, 
            x2: 555, 
            y2: 0, 
            lineWidth: 2, 
            lineColor: MYPROTEIN_TEAL 
          }], 
          margin: [0, 0, 0, 8] 
        },
        {
          columns: [
            { 
              text: 'THG Nutrition Production & Planning Team', 
              color: '#64748b',
              fontSize: 8,
              margin: [40, 0, 0, 0]
            },
            { 
              text: `Page ${currentPage} of ${pageCount}`, 
              alignment: 'right', 
              color: '#64748b', 
              fontSize: 8,
              margin: [0, 0, 40, 0]
            },
          ],
        },
      ],
    }),

    content: [
      // Title
      { 
        text: 'ROLES & RESPONSIBILITIES', 
        fontSize: 18, 
        bold: true, 
        color: MYPROTEIN_TEAL,
        alignment: 'center',
        margin: [0, 0, 0, 4]
      },
      { 
        text: item.name, 
        fontSize: 14, 
        bold: true, 
        alignment: 'center', 
        color: '#1e293b',
        margin: [0, 0, 0, 12] 
      },

      // Production info
      {
        columns: [
          { 
            text: `Shoot Date: ${shootDate}`, 
            fontSize: 9,
            color: '#64748b',
            width: '*'
          },
          { 
            text: `Production ID: ${item.productionId?.displayValue || '—'}`, 
            fontSize: 9,
            color: '#64748b',
            alignment: 'center',
            width: '*'
          },
          { 
            text: `Team Members: ${responsibilityItems.length}`, 
            fontSize: 9,
            color: '#64748b',
            alignment: 'right',
            width: '*'
          },
        ],
        margin: [0, 0, 0, 16]
      },

      // Roles Table
      {
        table: {
          headerRows: 1,
          widths: ['25%', '25%', '50%'],
          body: [
            [
              { text: 'NAME', bold: true, fillColor: '#DCFCE7', fontSize: 9, border: [false, false, false, false], margin: [6, 6, 6, 6] },
              { text: 'POSITION', bold: true, fillColor: '#DCFCE7', fontSize: 9, border: [false, false, false, false], margin: [6, 6, 6, 6] },
              { text: 'RESPONSIBILITY', bold: true, fillColor: '#DCFCE7', fontSize: 9, border: [false, false, false, false], margin: [6, 6, 6, 6] },
            ],
            ...(rolesRows.length ? rolesRows.map((row, idx) => row.map(cell => ({ 
              ...cell, 
              fillColor: idx % 2 === 0 ? 'white' : '#f8fafc', 
              border: [false, false, false, false],
              margin: [6, 6, 6, 6]
            }))) : [[
              { text: 'No roles with responsibilities defined', colSpan: 3, alignment: 'center', fontSize: 9, italics: true, fillColor: '#f8fafc', border: [false, false, false, false], margin: [6, 12, 6, 12] },
              {}, {}
            ]]),
          ],
        },
        layout: { 
          hLineWidth: () => 0, 
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
    ],
  };

  // Format date for filename (YYYY-MM-DD)
  const dateForFilename = item.shootDate?.from || item.shootDate?.to || new Date().toISOString().split('T')[0];
  const formattedDate = dateForFilename.split('T')[0];

  return { docDefinition, filename: `Roles-Responsibilities_${item.name}_${formattedDate}.pdf` };
};
