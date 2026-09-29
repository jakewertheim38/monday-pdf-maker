// Ported from CallSheetGenerator.jsx in the Vibe app. The layout code below is unchanged;
// only the browser-specific parts (download/upload) were removed.
const { MYPROTEIN_TEAL, formatDateUK, formatTime, processWeatherText, weatherBlock, imageToBase64 } = require('../helpers');

// Vertical space between stacked cards in the call sheet header (both side columns)
const HEADER_CARD_GAP = 8;
// Rough spacer added to the bottom of the left/right header columns so they line up with
// the confidential notice at the bottom of the centre column.
const LEFT_RIGHT_COLUMN_SPACER = 0;

module.exports = async function build(item, subitems) {

  const producerName = item.producer?.[0]?.name || '';
  const projectOwnerName = item.projectManager?.[0]?.name || '';
  const shootDate = formatDateUK(item.shootDate?.from || item.shootDate?.to);
  const crewCall = item.crewCallTime ? formatTime(item.crewCallTime.hour, item.crewCallTime.minute) : '09:00';
  const talentCall = item.talentCallTime ? formatTime(item.talentCallTime.hour, item.talentCallTime.minute) : '09:00';
  const weatherData = processWeatherText(item.weather || '');
  const nearestHospital = item.nearestHospital?.address || '';
  const location = item.shootLocation?.address || '';
  const location2 = item.shootLocation2?.address || '';
  const location3 = item.shootLocation3?.address || '';
  const locationNotesData = processWeatherText(item.locationNotes || '');
  const location2NotesData = processWeatherText(item.location2Notes || '');
  const location3NotesData = processWeatherText(item.location3Notes || '');
  const callSheetNotesData = processWeatherText(item.notes || '');

  // Extract and format phone number with country code
  let phoneNumber = '(+44) 0161 515 5444'; // Default fallback
  if (item.productionTeamPhoneNumber?.phone) {
    const phone = item.productionTeamPhoneNumber.phone;
    const country = item.productionTeamPhoneNumber.country || 'GB';
    const countryCode = country === 'GB' ? '+44' : '+44'; // Default to +44, can extend for other countries
    phoneNumber = `(${countryCode}) ${phone}`;
  }

  // Fetch logo
  const logoUrl = 'https://upload.wikimedia.org/wikipedia/en/f/fd/Myprotein_logo_2023.png';
  const logoDataUrl = await imageToBase64(logoUrl);

  let mapDataUrl = null;
  if (item.mapImage?.length > 0 && item.mapImage[0]?.url) {
    mapDataUrl = await imageToBase64(item.mapImage[0].url);
  }

  let mapDataUrl2 = null;
  if (item.mapImage2?.length > 0 && item.mapImage2[0]?.url) {
    mapDataUrl2 = await imageToBase64(item.mapImage2[0].url);
  }

  let mapDataUrl3 = null;
  if (item.mapImage3?.length > 0 && item.mapImage3[0]?.url) {
    mapDataUrl3 = await imageToBase64(item.mapImage3[0].url);
  }

  const crewRows = subitems
    .filter(s => s.crewTalent === 'Crew')
    .map(s => [
      s.position || '', 
      s.name1 || '', 
      s.callSheetNote || '',
      s.email?.email || '', 
      s.callTime ? formatTime(s.callTime.hour, s.callTime.minute) : ''
    ]);

  const talentRows = subitems
    .filter(s => s.crewTalent === 'Talent')
    .map(s => [
      s.name1 || '', 
      s.callSheetNote || '',
      s.callTime ? formatTime(s.callTime.hour, s.callTime.minute) : '', 
      s.wrapTime ? formatTime(s.wrapTime.hour, s.wrapTime.minute) : ''
    ]);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [30, 30, 30, 50],
    defaultStyle: { fontSize: 8, lineHeight: 1.3 },

    footer: (currentPage, pageCount) => ({
      stack: [
        { 
          canvas: [{ 
            type: 'line', 
            x1: 30, 
            y1: 0, 
            x2: 565, 
            y2: 0, 
            lineWidth: 2, 
            lineColor: MYPROTEIN_TEAL 
          }], 
          margin: [0, 0, 0, 8] 
        },
        {
          columns: [
            { 
              text: 'Phone Number: 0161 515 5444\nEmail: thgnutrition_production@thg.com', 
              color: '#64748b',
              fontSize: 8,
              lineHeight: 1.3,
              margin: [30, 0, 0, 0]
            },
            { 
              text: 'THG Nutrition Production & Planning Team', 
              alignment: 'right', 
              color: MYPROTEIN_TEAL, 
              bold: true,
              fontSize: 8,
              margin: [0, 2, 30, 0]
            },
          ],
        },
      ],
    }),

    content: [
      // Three-column header layout — every card in the left and right columns is separated by HEADER_CARD_GAP (same structure as Traditional)
      {
        columns: [
          // Left: Company info card
          {
            width: '30%',
            stack: [
              {
                stack: [
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          stack: [
                            { text: 'THG Nutrition Ltd', fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: '7-9 Sunbank Ln', fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: 'Altrincham,', fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: 'WA15 0AF', fontSize: 8 },
                          ],
                          border: [false, false, false, false],
                          fillColor: '#f8fafc',
                          margin: [6, 6, 6, 6]
                        }],
                      ],
                    },
                    layout: { 
                      hLineWidth: () => 0, 
                      vLineWidth: () => 0
                    },
                  },
                ],
                margin: [0, 0, 0, HEADER_CARD_GAP],
              },
              {
                // Producer and Production ID side by side
                columns: [
                  { width: '*', ...{
                stack: [
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [
                          { 
                            stack: [
                              { text: 'Producer', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
                              { text: producerName || '—', fontSize: 8 }
                            ],
                            border: [false, false, false, false], 
                            fillColor: '#f8fafc', 
                            margin: [6, 6, 6, 6] 
                          }
                        ],
                      ],
                    },
                    layout: { 
                      hLineWidth: () => 0, 
                      vLineWidth: () => 0
                    },
                  },
                ],
              } },
                  { width: '*', ...{
                    
                    stack: [
                      {
                        table: {
                          widths: ['*'],
                          body: [
                            [
                              { 
                                stack: [
                                  { text: 'Production ID', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
                                  { text: item.productionId?.displayValue || '—', fontSize: 8, bold: true }
                                ],
                                border: [false, false, false, false], 
                                fillColor: '#f8fafc', 
                                margin: [6, 6, 6, 6] 
                              }
                            ],
                          ],
                        },
                        layout: { 
                          hLineWidth: () => 0, 
                          vLineWidth: () => 0
                        },
                      },
                    ],
                  } },
                ],
                columnGap: 6,
                margin: [0, 0, 0, HEADER_CARD_GAP],
              },
              {
                stack: [
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [
                          { 
                            stack: [
                              { text: 'Shoot Date', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
                              { text: shootDate, fontSize: 8 }
                            ],
                            border: [false, false, false, false], 
                            fillColor: '#f8fafc', 
                            margin: [6, 6, 6, 6] 
                          }
                        ],
                      ],
                    },
                    layout: { 
                      hLineWidth: () => 0, 
                      vLineWidth: () => 0
                    },
                  },
                ],
              },
              // Spacer so this column's bottom roughly lines up with the centre column's notes line
              { text: '', margin: [0, 0, 0, LEFT_RIGHT_COLUMN_SPACER] },
            ],
          },

          // Center: Logo and Call Sheet title, warning
          {
            width: '40%',
            stack: [
              ...(logoDataUrl ? [{
                image: logoDataUrl,
                width: 92,
                alignment: 'center',
                margin: [0, 0, 0, 2]
              }] : []),
              { 
                text: 'Call Sheet', 
                fontSize: 20, 
                bold: true,
                color: '#1e293b',
                alignment: 'center', 
                margin: [0, 2, 0, 3] 
              },
              { 
                text: item.name, 
                fontSize: 16, 
                bold: true, 
                alignment: 'center', 
                color: MYPROTEIN_TEAL,
                margin: [0, 0, 0, 8] 
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
                    fontSize: 8,
                    lineHeight: 1.3,
                    margin: [8, 11, 8, 11],
                  }]],
                },
                layout: { 
                  hLineWidth: () => 0, 
                  vLineWidth: () => 0
                },
                // Pushed down and stretched so it lines up top/bottom with the Shoot Date /
                // Production Team Phone Number cards beside it.
                margin: [0, 5, 0, 8]
              },
            ],
          },

          // Right: Weather/Hospital/Contact cards
          {
            width: '30%',
            stack: [
              {
                // Weather gets the full width so temperature and conditions each fit on one line;
                // Production ID sits underneath it.
                stack: [
                  {
                    stack: [
                      {
                        table: {
                          widths: ['*'],
                          body: [
                            [
                              { 
                                stack: [
                                  { text: 'Weather', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
                                  // Two lines (temperature, conditions) with the icon centred beside them
                                  weatherBlock(weatherData)
                                ],
                                border: [false, false, false, false], 
                                fillColor: '#f8fafc', 
                                margin: [6, 6, 6, 6] 
                              }
                            ],
                          ],
                        },
                        layout: { 
                          hLineWidth: () => 0, 
                          vLineWidth: () => 0
                        },
                      },
                    ],
                  },
                  
                ],
                margin: [0, 0, 0, HEADER_CARD_GAP],
              },
              {
                stack: [
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [
                          { 
                            stack: [
                              { text: 'Nearest Hospital', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 2] },
                              { text: nearestHospital || '—', fontSize: 8 }
                            ],
                            border: [false, false, false, false], 
                            fillColor: '#f8fafc', 
                            margin: [6, 6, 6, 6] 
                          }
                        ],
                      ],
                    },
                    layout: { 
                      hLineWidth: () => 0, 
                      vLineWidth: () => 0
                    },
                  },
                ],
                margin: [0, 0, 0, HEADER_CARD_GAP],
              },
              {
                stack: [
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{ 
                          text: 'Production Team Phone Number', 
                          alignment: 'center', 
                          fontSize: 8,
                          bold: true,
                          color: '#64748b',
                          border: [false, false, false, false], 
                          fillColor: '#f8fafc',
                          margin: [6, 6, 6, 2] 
                        }],
                        [{ 
                          text: phoneNumber, 
                          alignment: 'center', 
                          fontSize: 8,
                          bold: true,
                          color: '#1e293b',
                          border: [false, false, false, false], 
                          fillColor: '#f8fafc',
                          margin: [6, 2, 6, 6] 
                        }],
                      ],
                    },
                    layout: { 
                      hLineWidth: () => 0, 
                      vLineWidth: () => 0
                    },
                  },
                ],
              },
              // Spacer so this column's bottom roughly lines up with the centre column's notes line
              { text: '', margin: [0, 0, 0, LEFT_RIGHT_COLUMN_SPACER] },
            ],
          },
        ],
        columnGap: 8,
        margin: [0, 0, 0, 12],
      },

      // Notes section (call sheet notes), full width, above the crew roster
      ...(callSheetNotesData.text ? [{
        stack: [
          { text: 'Notes:', fontSize: 9, bold: true, color: '#1e293b', margin: [0, 0, 0, 4] },
          {
            table: {
              widths: ['*'],
              body: [[
                callSheetNotesData.hasIcon
                  ? {
                      columns: [
                        { svg: callSheetNotesData.icon, width: 14, height: 14, margin: [0, 0, 3, 0] },
                        { text: callSheetNotesData.text, fontSize: 8, margin: [0, 1, 0, 0] }
                      ],
                      border: [false, false, false, false],
                      fillColor: '#f8fafc',
                      margin: [8, 8, 8, 8]
                    }
                  : {
                      text: callSheetNotesData.text,
                      fontSize: 8,
                      border: [false, false, false, false],
                      fillColor: '#f8fafc',
                      margin: [8, 8, 8, 8]
                    }
              ]],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0
            },
          },
        ],
        margin: [0, 0, 0, 12],
      }] : []),

      // Crew roster card
      {
        stack: [
          { 
            text: `CREW ROSTER  •  ${crewRows.length} Members`, 
            fontSize: 8, 
            bold: true, 
            color: 'white', 
            fillColor: '#16a34a', 
            margin: [0, 0, 0, 0], 
            padding: [8, 5, 8, 5] 
          },
          {
            table: {
              headerRows: 1,
              widths: ['20%', '20%', '20%', '25%', '15%'],
              body: [
                [
                  { text: 'CREW POSITION', bold: true, fillColor: '#dcfce7', fontSize: 8, border: [false, false, false, false] },
                  { text: 'NAME', bold: true, fillColor: '#dcfce7', fontSize: 8, border: [false, false, false, false] },
                  { text: 'CALL SHEET NOTE', bold: true, fillColor: '#dcfce7', fontSize: 8, border: [false, false, false, false] },
                  { text: 'EMAIL', bold: true, fillColor: '#dcfce7', fontSize: 8, border: [false, false, false, false] },
                  { text: 'CALL TIME', bold: true, fillColor: '#dcfce7', fontSize: 8, border: [false, false, false, false] },
                ],
                ...(crewRows.length ? crewRows.map((row, idx) => row.map(cell => ({ text: cell, fontSize: 8, fillColor: idx % 2 === 0 ? 'white' : '#f8fafc', border: [false, false, false, false] }))) : [[{ text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }]]),
              ],
            },
            layout: { 
              hLineWidth: () => 0, 
              vLineWidth: () => 0,
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
        margin: [0, 0, 0, 12],
      },

      // Talent roster card
      {
        stack: [
          { 
            text: `TALENT ROSTER  •  ${talentRows.length} Members`, 
            fontSize: 8, 
            bold: true, 
            color: 'white', 
            fillColor: '#64748b', 
            margin: [0, 0, 0, 0], 
            padding: [8, 5, 8, 5] 
          },
          {
            table: {
              headerRows: 1,
              widths: ['25%', '25%', '25%', '25%'],
              body: [
                [
                  { text: 'Talent Name', bold: true, fillColor: '#f1f5f9', fontSize: 8, border: [false, false, false, false] },
                  { text: 'Call Sheet Note', bold: true, fillColor: '#f1f5f9', fontSize: 8, border: [false, false, false, false] },
                  { text: 'Talent Call Time', bold: true, fillColor: '#f1f5f9', fontSize: 8, border: [false, false, false, false] },
                  { text: 'Talent Wrap Time', bold: true, fillColor: '#f1f5f9', fontSize: 8, border: [false, false, false, false] },
                ],
                ...(talentRows.length ? talentRows.map((row, idx) => row.map(cell => ({ text: cell, fontSize: 8, fillColor: idx % 2 === 0 ? 'white' : '#f8fafc', border: [false, false, false, false] }))) : [[{ text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }, { text: '', fillColor: '#f8fafc', border: [false, false, false, false] }]]),
              ],
            },
            layout: { 
              hLineWidth: () => 0, 
              vLineWidth: () => 0,
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
        margin: [0, 0, 0, 12],
      },

      // Map and Location/Notes card (moved to bottom)
      {
        stack: [
          { text: 'LOCATION & NOTES', fontSize: 8, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [8, 5, 8, 5] },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  {
                    stack: [
                      { text: 'Shoot Location', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 3] },
                      { text: location || '—', fontSize: 8, margin: [0, 0, 0, 10] },
                      ...(locationNotesData.text ? [
                        { text: 'Location Notes', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 3] },
                        locationNotesData.hasIcon
                          ? {
                              columns: [
                                { svg: locationNotesData.icon, width: 14, height: 14, margin: [0, 0, 3, 0] },
                                { text: locationNotesData.text, fontSize: 8, margin: [0, 1, 0, 0] }
                              ],
                              margin: [0, 0, 0, 0]
                            }
                          : { text: locationNotesData.text, fontSize: 8 }
                      ] : [])
                    ],
                    border: [false, false, false, false],
                    fillColor: '#f8fafc',
                    margin: [8, 8, 8, 8]
                  },
                  mapDataUrl
                    ? {
                        image: mapDataUrl,
                        fit: [245, 186],
                        alignment: 'center',
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [6, 6, 6, 6]
                      }
                    : {
                        text: 'Map image not available',
                        italics: true,
                        color: '#94a3b8',
                        alignment: 'center',
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [6, 99, 6, 99]
                      }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0
            },
          },
        ],
        unbreakable: true,
        margin: [0, 0, 0, 12],
      },

      // Location 2 section (if available)
      ...(location2 ? [{
        stack: [
          { text: 'LOCATION 2', fontSize: 8, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [8, 5, 8, 5] },
          {
            table: {
              widths: ['*', 306],
              body: [
                [
                  {
                    stack: [
                      { text: 'Shoot Location 2', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 3] },
                      { text: location2, fontSize: 8, margin: [0, 0, 0, 10] },
                      ...(location2NotesData.text ? [
                        { text: 'Notes', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 3] },
                        location2NotesData.hasIcon
                          ? {
                              columns: [
                                { svg: location2NotesData.icon, width: 14, height: 14, margin: [0, 0, 3, 0] },
                                { text: location2NotesData.text, fontSize: 8, margin: [0, 1, 0, 0] }
                              ],
                              margin: [0, 0, 0, 0]
                            }
                          : { text: location2NotesData.text, fontSize: 8 }
                      ] : [])
                    ],
                    border: [false, false, false, false],
                    fillColor: '#f8fafc',
                    margin: [8, 8, 8, 8]
                  },
                  mapDataUrl2
                    ? {
                        image: mapDataUrl2,
                        fit: [220, 157],
                        alignment: 'center',
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [6, 6, 6, 6]
                      }
                    : {
                        text: 'Map image not available',
                        italics: true,
                        color: '#94a3b8',
                        alignment: 'center',
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [6, 99, 6, 99]
                      }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0
            },
          },
        ],
        unbreakable: true,
        margin: [0, 0, 0, 12],
      }] : []),

      // Location 3 section (if available)
      ...(location3 ? [{
        stack: [
          { text: 'LOCATION 3', fontSize: 8, bold: true, color: 'white', fillColor: MYPROTEIN_TEAL, margin: [0, 0, 0, 0], padding: [8, 5, 8, 5] },
          {
            table: {
              widths: ['*', 306],
              body: [
                [
                  {
                    stack: [
                      { text: 'Shoot Location 3', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 3] },
                      { text: location3, fontSize: 8, margin: [0, 0, 0, 10] },
                      ...(location3NotesData.text ? [
                        { text: 'Notes', fontSize: 8, bold: true, color: '#64748b', margin: [0, 0, 0, 3] },
                        location3NotesData.hasIcon
                          ? {
                              columns: [
                                { svg: location3NotesData.icon, width: 14, height: 14, margin: [0, 0, 3, 0] },
                                { text: location3NotesData.text, fontSize: 8, margin: [0, 1, 0, 0] }
                              ],
                              margin: [0, 0, 0, 0]
                            }
                          : { text: location3NotesData.text, fontSize: 8 }
                      ] : [])
                    ],
                    border: [false, false, false, false],
                    fillColor: '#f8fafc',
                    margin: [8, 8, 8, 8]
                  },
                  mapDataUrl3
                    ? {
                        image: mapDataUrl3,
                        fit: [220, 157],
                        alignment: 'center',
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [6, 6, 6, 6]
                      }
                    : {
                        text: 'Map image not available',
                        italics: true,
                        color: '#94a3b8',
                        alignment: 'center',
                        border: [false, false, false, false],
                        fillColor: '#f8fafc',
                        margin: [6, 99, 6, 99]
                      }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0
            },
          },
        ],
        unbreakable: true,
      }] : []),
    ],
  };

  // Format date for filename (YYYY-MM-DD)
  const dateForFilename = item.shootDate?.from || item.shootDate?.to || new Date().toISOString().split('T')[0];
  const formattedDate = dateForFilename.split('T')[0]; // Ensure YYYY-MM-DD format

  return { docDefinition, filename: `Callsheet_${item.name}_${formattedDate}.pdf` };
};
