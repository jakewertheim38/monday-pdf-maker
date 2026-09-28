// Production Document — Cover page section as a standalone PDF.
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
        { text: 'THG Nutrition Production & Planning Team', alignment: 'right', fontSize: 7, color: '#64748b', bold: true, margin: [0, 10, 40, 0] },
      ],
    }),
    content: [
      // Cover page
      {
        text: 'PRODUCTION DOCUMENT',
        fontSize: 28,
        bold: true,
        color: MYPROTEIN_TEAL,
        alignment: 'center',
        margin: [0, 60, 0, 16]
      },
      {
        text: item.name,
        fontSize: 18,
        bold: true,
        alignment: 'center',
        color: '#1e293b',
        margin: [0, 0, 0, 40]
      },
      {
        table: {
          widths: ['*'],
          body: [[{
            text: 'STRICTLY CONFIDENTIAL\nPLEASE DO NOT SHARE',
            bold: true,
            alignment: 'center',
            fillColor: '#DCFCE7',
            color: '#166534',
            border: [false, false, false, false],
            fontSize: 10,
            lineHeight: 1.4,
            margin: [20, 20, 20, 20],
          }]],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [100, 0, 100, 40]
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Shoot Date', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: shootDate, fontSize: 10, margin: [0, 0, 0, 12] },
              { text: 'Production ID', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: item.productionId?.displayValue || '—', fontSize: 10, bold: true, margin: [0, 0, 0, 12] },
              { text: 'Producer', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: producerName, fontSize: 10, margin: [0, 0, 0, 12] },
              { text: 'Project Manager', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: projectManagerName, fontSize: 10 },
            ]
          },
          {
            width: '50%',
            stack: [
              { text: 'Location', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: item.shootLocation?.address || '—', fontSize: 10, margin: [0, 0, 0, 12] },
              { text: 'Crew Members', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: `${crewItems.length}`, fontSize: 10, margin: [0, 0, 0, 12] },
              { text: 'Talent Members', fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
              { text: `${talentItems.length}`, fontSize: 10 },
            ]
          }
        ],
        margin: [0, 0, 0, 0]
      },
    ],
  };

  const dateForFilename = item.shootDate?.from || item.shootDate?.to || new Date().toISOString().split('T')[0];
  const formattedDate = dateForFilename.split('T')[0];
  return { docDefinition, filename: `Production-Document-Cover_${item.name}_${formattedDate}.pdf` };
};
