// Every piece of data the call sheet PDFs use, which monday column it comes from by default,
// and which column types can be mapped to it in the settings panel.
//
// Defaults are the columns on "Production Files" (board 5091973337) and its subitems.
// On other boards, a field falls back to a column with the same title if the ID isn't there.

const TEXTISH = ['text', 'long_text', 'status', 'dropdown', 'mirror', 'lookup', 'formula', 'email', 'phone', 'location', 'numbers', 'item_id', 'people', 'date', 'country', 'link'];

const KINDS = {
  text: TEXTISH,
  people: ['people', 'mirror', 'lookup', 'text'],
  timeline: ['timeline', 'date'],
  date: ['date', 'timeline'],
  hour: ['hour'],
  location: ['location', 'text', 'long_text', 'mirror', 'lookup'],
  phone: ['phone', 'text', 'mirror', 'lookup'],
  email: ['email', 'text', 'mirror', 'lookup'],
  file: ['file'],
  mirror: ['mirror', 'lookup', 'text', 'formula', 'item_id', 'numbers'],
  status: ['status', 'dropdown', 'text', 'mirror', 'lookup'],
  dropdown: ['dropdown', 'status', 'text', 'mirror', 'lookup'],
};

const FIELDS = [
  // ---- Shoot details (main item) ----
  { key: 'shootDate', label: 'Shoot Date', group: 'Shoot details', level: 'item', kind: 'timeline', id: 'timerange_mm0ychc', title: 'Shoot Date' },
  { key: 'producer', label: 'Producer', group: 'Shoot details', level: 'item', kind: 'people', id: 'multiple_person_mm0pm53b', title: 'Producer' },
  { key: 'projectManager', label: 'Project Manager', group: 'Shoot details', level: 'item', kind: 'people', id: 'multiple_person_mm0pz5bz', title: 'Project Manager' },
  { key: 'productionId', label: 'Production ID', group: 'Shoot details', level: 'item', kind: 'mirror', id: 'lookup_mm5z5yqh', title: 'Production ID' },
  { key: 'crewCallTime', label: 'Crew Call Time', group: 'Shoot details', level: 'item', kind: 'hour', id: 'hour_mm0x8mk3', title: 'Crew Call Time' },
  { key: 'talentCallTime', label: 'Talent Call Time', group: 'Shoot details', level: 'item', kind: 'hour', id: 'hour_mm0x695z', title: 'Talent Call Time' },
  { key: 'weather', label: 'Weather', group: 'Shoot details', level: 'item', kind: 'text', id: 'text_mm0pv127', title: 'Weather' },
  { key: 'notes', label: 'Call Sheet Notes', group: 'Shoot details', level: 'item', kind: 'text', id: 'long_text_mm0rbe89', title: 'Notes' },
  { key: 'productionTeamPhoneNumber', label: 'Production Team Phone', group: 'Shoot details', level: 'item', kind: 'phone', id: 'phone_mm0y61d3', title: 'Production Team Phone Number' },
  { key: 'nearestHospital', label: 'Nearest Hospital', group: 'Shoot details', level: 'item', kind: 'location', id: 'location_mm0pch5e', title: 'Nearest Hospital' },

  // ---- Locations (main item) ----
  { key: 'shootLocation', label: 'Shoot Location', group: 'Locations', level: 'item', kind: 'location', id: 'location_mm0pkz93', title: 'Shoot Location' },
  { key: 'locationNotes', label: 'Location Notes', group: 'Locations', level: 'item', kind: 'text', id: 'long_text_mm1z5d82', title: 'Location Notes' },
  { key: 'mapImage', label: 'Map Image', group: 'Locations', level: 'item', kind: 'file', id: 'file_mm0p6m1r', title: 'Map Image' },
  { key: 'shootLocation2', label: 'Shoot Location 2', group: 'Locations', level: 'item', kind: 'location', id: 'location_mm1jb7b2', title: 'Shoot Location 2' },
  { key: 'location2Notes', label: 'Location 2 Notes', group: 'Locations', level: 'item', kind: 'text', id: 'long_text_mm1zmqba', title: 'Location 2 Notes' },
  { key: 'mapImage2', label: 'Map Image 2', group: 'Locations', level: 'item', kind: 'file', id: 'file_mm1jgb5f', title: 'Map Image 2' },
  { key: 'shootLocation3', label: 'Shoot Location 3', group: 'Locations', level: 'item', kind: 'location', id: 'location_mm1jba7d', title: 'Shoot Location 3' },
  { key: 'location3Notes', label: 'Location 3 Notes', group: 'Locations', level: 'item', kind: 'text', id: 'long_text_mm1zmh6n', title: 'Location 3 Notes' },
  { key: 'mapImage3', label: 'Map Image 3', group: 'Locations', level: 'item', kind: 'file', id: 'file_mm1jxexk', title: 'Map Image 3' },

  // ---- Crew & talent (subitems) ----
  { key: 'crewTalent', label: 'Crew / Talent', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'status', id: 'color_mm0p20', title: 'Crew / Talent', hint: 'Labels must be "Crew" and "Talent"' },
  { key: 'name1', label: 'Person Name', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'text', id: 'text_mm0psq8', title: 'Name' },
  { key: 'position', label: 'Position', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'text', id: 'text_mm0ptm7s', title: 'Position' },
  { key: 'email', label: 'Email', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'email', id: 'email_mm0p8jsm', title: 'Email' },
  { key: 'callSheetNote', label: 'Call Sheet Note', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'text', id: 'text_mm21e2b4', title: 'Call sheet Note' },
  { key: 'callTime', label: 'Call Time', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'hour', id: 'hour_mm0xxc1y', title: 'Call Time' },
  { key: 'wrapTime', label: 'Wrap Time', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'hour', id: 'hour_mm0xzkdq', title: 'Wrap Time' },
  { key: 'resposibility', label: 'Responsibility', group: 'Crew & talent (subitems)', level: 'subitem', kind: 'text', id: 'long_text_mm13fv0p', title: 'Resposibility' },

  // ---- Schedule (subitems) ----
  { key: 'type', label: 'Type', group: 'Schedule (subitems)', level: 'subitem', kind: 'status', id: 'color_mm0ytm9e', title: 'Type', hint: 'Schedule rows need the label "Schedule"' },
  { key: 'date', label: 'Date', group: 'Schedule (subitems)', level: 'subitem', kind: 'date', id: 'date_mm0y6v8r', title: 'Date' },
  { key: 'timeStart', label: 'Time Start', group: 'Schedule (subitems)', level: 'subitem', kind: 'hour', id: 'hour_mm0yqpme', title: 'Time Start' },
  { key: 'timeEnd', label: 'Time End', group: 'Schedule (subitems)', level: 'subitem', kind: 'hour', id: 'hour_mm0y4maz', title: 'Time End' },
  { key: 'sceneName', label: 'Scene Name', group: 'Schedule (subitems)', level: 'subitem', kind: 'text', id: 'text_mm0y34be', title: 'Scene Name' },
  { key: 'location', label: 'Location', group: 'Schedule (subitems)', level: 'subitem', kind: 'text', id: 'text_mm0yfhw0', title: 'Location' },
  { key: 'description', label: 'Description', group: 'Schedule (subitems)', level: 'subitem', kind: 'text', id: 'long_text_mm0y7yxw', title: 'Description' },
  { key: 'stillVideo', label: 'Still / Video', group: 'Schedule (subitems)', level: 'subitem', kind: 'dropdown', id: 'dropdown_mm0yrmb5', title: 'Still / Video' },
  { key: 'talent', label: 'Talent', group: 'Schedule (subitems)', level: 'subitem', kind: 'text', id: 'text_mm0y2rh', title: 'Talent' },
  { key: 'nutritionVits', label: 'Nutrition / Vits', group: 'Schedule (subitems)', level: 'subitem', kind: 'text', id: 'long_text_mm0yan4b', title: 'Nutrition / Vits' },
  { key: 'clothing', label: 'Clothing', group: 'Schedule (subitems)', level: 'subitem', kind: 'text', id: 'long_text_mm0yz2cg', title: 'Clothing' },

  // ---- Where each PDF is saved (main item Files columns) ----
  { key: 'callSheetFile', label: 'Call Sheet PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dr8wc', title: 'Call Sheet' },
  { key: 'scheduleFile', label: 'Schedule PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dd93', title: 'Schedule' },
  { key: 'rolesFile', label: 'Roles & Responsibilities PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dmxw0', title: 'R&Rs' },
  { key: 'productionDocFile', label: 'Production Document PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dr8wc', title: 'Call Sheet' },
  { key: 'productionCoverFile', label: 'Production Cover PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dr8wc', title: 'Call Sheet' },
  { key: 'productionCallSheetFile', label: 'Production Call Sheet PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dr8wc', title: 'Call Sheet' },
  { key: 'productionScheduleFile', label: 'Production Schedule PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dd93', title: 'Schedule' },
  { key: 'productionRolesFile', label: 'Production Roles PDF', group: 'Save PDFs to', level: 'item', kind: 'file', id: 'file_mm1dmxw0', title: 'R&Rs' },
];

// The four PDFs, and which "Save PDFs to" field each one uses.
const DOCS = {
  callSheet: { label: 'Call Sheet', fileField: 'callSheetFile' },
  schedule: { label: 'Schedule', fileField: 'scheduleFile' },
  roles: { label: 'Roles & Responsibilities', fileField: 'rolesFile' },
  productionDoc: { label: 'Production Document', fileField: 'productionDocFile' },
  productionCover: { label: 'Production Cover', fileField: 'productionCoverFile' },
};

module.exports = { FIELDS, KINDS, DOCS };
