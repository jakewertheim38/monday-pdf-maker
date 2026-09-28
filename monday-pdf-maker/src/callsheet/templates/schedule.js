// Ported from ScheduleGenerator.jsx in the Vibe app. The layout code below is unchanged;
// only the browser-specific parts (download/upload) were removed.
const { MYPROTEIN_TEAL, formatDateUK, formatTime, processWeatherText, imageToBase64 } = require('../helpers');

module.exports = async function build(item, subitems) {
  const scheduleItems = subitems.filter(s => s.type === 'Schedule');
  const producerName = item.producer?.[0]?.name || '—';
  const projectManagerName = item.projectManager?.[0]?.name || '—';
  const shootDate = formatDateUK(item.shootDate?.from || item.date);

  // Define all possible columns with their configuration
  const allColumns = [
    { 
      key: 'date', 
      label: 'Date', 
      width: 7,
      getValue: (s) => s.date ? formatDateUK(s.date) : null
    },
    { 
      key: 'timeRange', 
      label: 'Time Range', 
      width: 9,
      getValue: (s) => {
        if (!s.timeStart) return null;
        const startTime = formatTime(s.timeStart.hour, s.timeStart.minute);
        if (s.timeEnd) {
          const endTime = formatTime(s.timeEnd.hour, s.timeEnd.minute);
          return `${startTime} - ${endTime}`;
        }
        return startTime;
      }
    },
    { 
      key: 'scene', 
      label: 'Scene', 
      width: 9,
      getValue: (s) => s.sceneName || null
    },
    { 
      key: 'location', 
      label: 'Location', 
      width: 10,
      getValue: (s) => s.location || null
    },
    { 
      key: 'description', 
      label: 'Description', 
      width: 15,
      getValue: (s) => s.description || null
    },
    { 
      key: 'stillVideo', 
      label: 'Still/Video', 
      width: 10,
      getValue: (s) => {
        if (!s.stillVideo) return null;
        if (Array.isArray(s.stillVideo)) {
          return s.stillVideo.length > 0 ? s.stillVideo.join('\n') : null;
        }
        return s.stillVideo;
      },
      noWrap: false
    },
    { 
      key: 'talent', 
      label: 'Talent', 
      width: 10,
      getValue: (s) => s.talent || null
    },
    { 
      key: 'nutritionVits', 
      label: 'Nutrition / Vits', 
      width: 15,
      getValue: (s) => s.nutritionVits || null
    },
    { 
      key: 'clothing', 
      label: 'Clothing', 
      width: 15,
      getValue: (s) => s.clothing || null
    },
  ];

  // Detect which columns have at least one non-empty value
  const visibleColumns = allColumns.filter(col => 
    scheduleItems.some(item => {
      const value = col.getValue(item);
      return value !== null && value !== undefined && value !== '';
    })
  );

  // If no columns have data, show all columns as fallback
  const columnsToShow = visibleColumns.length > 0 ? visibleColumns : allColumns;

  // Calculate total width and proportional widths
  const totalWidth = columnsToShow.reduce((sum, col) => sum + col.width, 0);
  const widths = columnsToShow.map(col => `${(col.width / totalWidth * 100).toFixed(1)}%`);

  // Build table headers (using light green to match call sheet)
  const headers = columnsToShow.map(col => ({
    text: col.label,
    bold: true,
    fillColor: '#DCFCE7',
    fontSize: 8,
    border: [false, false, false, false],
    margin: [4, 4, 4, 4]
  }));

  // Build schedule table rows with text wrapping enabled
  const scheduleRows = scheduleItems.map(s => 
    columnsToShow.map(col => {
      const value = col.getValue(s);
      return {
        text: value || '—',
        fontSize: 8,
        noWrap: false // Allow text wrapping for all columns
      };
    })
  );

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 30, 30, 50],
    defaultStyle: { fontSize: 8, lineHeight: 1.3 },

    footer: (currentPage, pageCount) => ({
      stack: [
        { 
          canvas: [{ 
            type: 'line', 
            x1: 30, 
            y1: 0, 
            x2: 812, 
            y2: 0, 
            lineWidth: 2, 
            lineColor: MYPROTEIN_TEAL 
          }], 
          margin: [0, 0, 0, 8] 
        },
        {
          columns: [
            { 
              text: 'Phone Number: 0161 515 5444  |  Email: thgnutrition_production@thg.com', 
              color: '#64748b',
              fontSize: 8,
              lineHeight: 1.3,
              margin: [30, 0, 0, 0]
            },
            { 
              text: `Page ${currentPage} of ${pageCount}`, 
              alignment: 'right', 
              color: '#64748b', 
              fontSize: 8,
              margin: [0, 0, 30, 0]
            },
          ],
        },
        {
          text: 'THG Nutrition Production & Planning Team',
          color: '#64748b',
          fontSize: 8,
          alignment: 'center',
          margin: [0, 4, 0, 0]
        },
      ],
    }),

    content: [
      // Title and info boxes on same row
      {
        columns: [
          // Title column (left side)
          {
            width: '30%',
            text: `PRODUCTION SCHEDULE:\n${item.name}`,
            fontSize: 12,
            bold: true,
            color: MYPROTEIN_TEAL,
            alignment: 'left',
            margin: [0, 4, 0, 0],
          },
          // Info boxes column (right side)
          {
            width: '70%',
            columns: [
              {
                width: '*',
                stack: [
                  { text: 'SHOOT DATE', fontSize: 7, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [4, 2, 4, 2] },
                  {
                    table: {
                      widths: ['*'],
                      body: [[{ 
                        stack: [
                          { text: 'Shoot Date', fontSize: 7, bold: true, color: '#64748b', margin: [0, 0, 0, 1] },
                          { text: shootDate, fontSize: 8, bold: true }
                        ],
                        border: [false, false, false, false], 
                        fillColor: '#f8fafc', 
                        margin: [4, 3, 4, 3] 
                      }]],
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
                  },
                ],
              },
              {
                width: '*',
                stack: [
                  { text: 'PRODUCER', fontSize: 7, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [4, 2, 4, 2] },
                  {
                    table: {
                      widths: ['*'],
                      body: [[{ 
                        stack: [
                          { text: 'Producer', fontSize: 7, bold: true, color: '#64748b', margin: [0, 0, 0, 1] },
                          { text: producerName, fontSize: 8, bold: true }
                        ],
                        border: [false, false, false, false], 
                        fillColor: '#f8fafc', 
                        margin: [4, 3, 4, 3] 
                      }]],
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
                  },
                ],
              },
              {
                width: '*',
                stack: [
                  { text: 'PROJECT MANAGER', fontSize: 7, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [4, 2, 4, 2] },
                  {
                    table: {
                      widths: ['*'],
                      body: [[{ 
                        stack: [
                          { text: 'Project Manager', fontSize: 7, bold: true, color: '#64748b', margin: [0, 0, 0, 1] },
                          { text: projectManagerName, fontSize: 8, bold: true }
                        ],
                        border: [false, false, false, false], 
                        fillColor: '#f8fafc', 
                        margin: [4, 3, 4, 3] 
                      }]],
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
                  },
                ],
              },
              {
                width: '*',
                stack: [
                  { text: 'PRODUCTION ID', fontSize: 7, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [4, 2, 4, 2] },
                  {
                    table: {
                      widths: ['*'],
                      body: [[{ 
                        stack: [
                          { text: 'Production ID', fontSize: 7, bold: true, color: '#64748b', margin: [0, 0, 0, 1] },
                          { text: item.productionId?.displayValue || '—', fontSize: 8, bold: true }
                        ],
                        border: [false, false, false, false], 
                        fillColor: '#f8fafc', 
                        margin: [4, 3, 4, 3] 
                      }]],
                    },
                    layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
                  },
                ],
              },
            ],
            columnGap: 6,
          },
        ],
        columnGap: 10,
        margin: [0, 0, 0, 16],
      },

      // Schedule Table
      {
        stack: [
          { 
            text: `SCHEDULE  •  ${scheduleItems.length} Scenes`, 
            fontSize: 10, 
            bold: true, 
            color: 'white', 
            fillColor: MYPROTEIN_TEAL, 
            margin: [0, 0, 0, 0], 
            padding: [8, 5, 8, 5] 
          },
          {
            table: {
              headerRows: 1,
              widths: widths,
              body: [
                headers,
                ...(scheduleRows.length ? scheduleRows.map((row, idx) => row.map(cell => ({ 
                  ...cell, 
                  fillColor: idx % 2 === 0 ? 'white' : '#f8fafc', 
                  border: [false, false, false, false],
                  margin: [4, 4, 4, 4]
                }))) : [[
                  { text: 'No schedule items', colSpan: columnsToShow.length, alignment: 'center', fontSize: 8, italics: true, fillColor: '#f8fafc', border: [false, false, false, false], margin: [4, 8, 4, 8] },
                  ...Array(columnsToShow.length - 1).fill({})
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
      },
    ],
  };

  // Format date for filename (YYYY-MM-DD)
  const dateForFilename = item.shootDate?.from || item.shootDate?.to || new Date().toISOString().split('T')[0];
  const formattedDate = dateForFilename.split('T')[0]; // Ensure YYYY-MM-DD format

  return { docDefinition, filename: `Schedule_${item.name}_${formattedDate}.pdf` };
};
