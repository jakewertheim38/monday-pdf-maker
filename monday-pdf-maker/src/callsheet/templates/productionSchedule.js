// Production Document — Schedule section as a standalone PDF.
const { MYPROTEIN_TEAL, formatDateUK, formatTime, processWeatherText, imageToBase64 } = require('../helpers');

module.exports = async function build(item, subitems) {

  const producerName = item.producer?.[0]?.name || '—';
  const projectManagerName = item.projectManager?.[0]?.name || '—';
  const shootDate = formatDateUK(item.shootDate?.from || item.shootDate?.to);

  const crewItems = subitems.filter(s => s.crewTalent === 'Crew');
  const talentItems = subitems.filter(s => s.crewTalent === 'Talent');
  const scheduleItems = subitems.filter(s => s.type === 'Schedule');
  const responsibilityItems = subitems.filter(s => s.resposibility && s.resposibility.trim() !== '');

  // Build crew rows (exact structure from CallSheetGenerator)
  const crewRows = crewItems.map(s => [
    { text: s.position || '', fontSize: 8 },
    { text: s.name1 || '', fontSize: 8 },
    { text: s.callSheetNote || '', fontSize: 8 },
    { text: s.email?.email || '', fontSize: 8 },
    { text: s.callTime ? formatTime(s.callTime.hour, s.callTime.minute) : '', fontSize: 8 },
  ]);

  // Build talent rows (exact structure from CallSheetGenerator)
  const talentRows = talentItems.map(s => [
    { text: s.name1 || '', fontSize: 8 },
    { text: s.callSheetNote || '', fontSize: 8 },
    { text: s.callTime ? formatTime(s.callTime.hour, s.callTime.minute) : '', fontSize: 8 },
    { text: s.wrapTime ? formatTime(s.wrapTime.hour, s.wrapTime.minute) : '', fontSize: 8 },
  ]);

  // Build schedule rows with dynamic columns (exact logic from ScheduleGenerator)
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
      getValue: (s) => s.scene || null
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
      }
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

  // Detect which columns have data
  const visibleColumns = allColumns.filter(col => 
    scheduleItems.some(item => {
      const value = col.getValue(item);
      return value !== null && value !== undefined && value !== '';
    })
  );
  const columnsToShow = visibleColumns.length > 0 ? visibleColumns : allColumns;
  const totalWidth = columnsToShow.reduce((sum, col) => sum + col.width, 0);
  const widths = columnsToShow.map(col => `${(col.width / totalWidth * 100).toFixed(1)}%`);

  const scheduleHeaders = columnsToShow.map(col => ({
    text: col.label,
    bold: true,
    fillColor: '#DCFCE7',
    fontSize: 8,
    border: [false, false, false, false],
    margin: [4, 4, 4, 4]
  }));

  const scheduleRows = scheduleItems.map(s => 
    columnsToShow.map(col => {
      const value = col.getValue(s);
      return {
        text: value || '—',
        fontSize: 8,
        noWrap: false
      };
    })
  );

  // Build roles rows with grouping (exact logic from RolesResponsibilitiesGenerator)
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

  const rolesRows = Object.values(grouped).map(group => [
    { text: group.names.join(', '), fontSize: 9 },
    { text: group.position, fontSize: 9 },
    { text: group.resposibility, fontSize: 9 },
  ]);


  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Phone Number: ${item.productionTeamPhoneNumber?.phone ? `(+44) ${item.productionTeamPhoneNumber.phone}` : ''}  |  Email: thgnutrition_production@thg.com`, fontSize: 7, color: '#64748b', margin: [40, 10, 0, 0] },
        { text: 'THG Nutrition Production & Planning Team', alignment: 'center', fontSize: 7, color: '#64748b', bold: true, margin: [0, 10, 0, 0] },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 7, color: '#64748b', margin: [0, 10, 40, 0] },
      ],
    }),
    content: [
      // Section 2: Schedule (exact structure from ScheduleGenerator with landscape orientation)
      {
        text: 'PRODUCTION SCHEDULE',
        fontSize: 20,
        bold: true,
        color: MYPROTEIN_TEAL,
        margin: [0, 0, 0, 16]
      },
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
                scheduleHeaders,
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

  const dateForFilename = item.shootDate?.from || item.shootDate?.to || new Date().toISOString().split('T')[0];
  const formattedDate = dateForFilename.split('T')[0];
  return { docDefinition, filename: `Production-Document-Schedule_${item.name}_${formattedDate}.pdf` };
};
