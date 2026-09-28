// Sample Production Files item (raw monday API shape), based on a real shoot.
const cv = (id, title, type, text, value, extra = {}) => ({ id, type, text, value: value ? JSON.stringify(value) : null, column: { title }, ...extra });
const hour = (h, m = 0) => ({ hour: h, minute: m });
const t12 = (h, m = 0) => `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;

const person = (name, position, call, wrap, note = '', kind = 'Crew', resp = '') => ({
  id: String(Math.random()).slice(2, 10), name,
  column_values: [
    cv('color_mm0ytm9e', 'Type', 'status', 'Call Sheet'),
    cv('color_mm0p20', 'Crew / Talent', 'status', kind),
    cv('text_mm0psq8', 'Name', 'text', name),
    cv('text_mm0ptm7s', 'Position', 'text', position),
    cv('email_mm0p8jsm', 'Email', 'email', kind === 'Crew' ? `${name.split(' ')[0].toLowerCase()}@thg.com` : '', kind === 'Crew' ? { email: `${name.split(' ')[0].toLowerCase()}@thg.com` } : null),
    cv('text_mm21e2b4', 'Call sheet Note', 'text', note),
    cv('hour_mm0xxc1y', 'Call Time', 'hour', t12(...call), hour(...call)),
    cv('hour_mm0xzkdq', 'Wrap Time', 'hour', t12(...wrap), hour(...wrap)),
    cv('long_text_mm13fv0p', 'Resposibility', 'long_text', resp),
  ],
});
const scene = (n, start, end, name, location, desc, sv, talent, clothing) => ({
  id: 'sch' + n, name: `Schedule ${n}`,
  column_values: [
    cv('color_mm0ytm9e', 'Type', 'status', 'Schedule'),
    cv('date_mm0y6v8r', 'Date', 'date', '2026-09-16', { date: '2026-09-16' }),
    cv('hour_mm0yqpme', 'Time Start', 'hour', t12(...start), hour(...start)),
    cv('hour_mm0y4maz', 'Time End', 'hour', t12(...end), hour(...end)),
    cv('text_mm0y34be', 'Scene Name', 'text', name),
    cv('text_mm0yfhw0', 'Location', 'text', location),
    cv('long_text_mm0y7yxw', 'Description', 'long_text', desc),
    { ...cv('dropdown_mm0yrmb5', 'Still / Video', 'dropdown', sv), values: [{ label: sv }] },
    cv('text_mm0y2rh', 'Talent', 'text', talent),
    cv('long_text_mm0yz2cg', 'Clothing', 'long_text', clothing),
  ],
});

const demo = {
  id: '3192237188', name: 'Zoe Rae', board: { id: '5091973337' },
  column_values: [
    cv('timerange_mm0ychc', 'Shoot Date', 'timeline', '2026-09-16 - 2026-09-16', { from: '2026-09-16', to: '2026-09-16' }),
    cv('multiple_person_mm0pm53b', 'Producer', 'people', 'Emma Weaver'),
    cv('multiple_person_mm0pz5bz', 'Project Manager', 'people', 'Kiran Dhadwal'),
    { ...cv('lookup_mm5z5yqh', 'Production ID', 'mirror', null), display_value: 'PROD-020' },
    cv('location_mm0pkz93', 'Shoot Location', 'location', 'THG Studios, Sunbank Lane, Altrincham, UK', { address: 'THG Studios, Sunbank Lane, Altrincham, UK' }),
    cv('long_text_mm1z5d82', 'Location Notes', 'long_text', 'Studio - C03'),
    { ...cv('file_mm0p6m1r', 'Map Image', 'file', 'map.png'), files: [{ asset: { name: 'map.png', public_url: 'file://' + require('path').join(__dirname, 'sample-map.png') } }] },
    cv('location_mm0pch5e', 'Nearest Hospital', 'location', 'Wythenshawe Hospital, Southmoor Road, Wythenshawe, Manchester, UK', { address: 'Wythenshawe Hospital, Southmoor Road, Wythenshawe, Manchester, UK' }),
    cv('text_mm0pv127', 'Weather', 'text', '⛅ 17°C, light cloud'),
    cv('hour_mm0x8mk3', 'Crew Call Time', 'hour', '07:00 AM', hour(7)),
    cv('hour_mm0x695z', 'Talent Call Time', 'hour', '08:00 AM', hour(8)),
    cv('long_text_mm0rbe89', 'Notes', 'long_text', 'Please arrive via the main reception and sign in.'),
    cv('phone_mm0y61d3', 'Production Team Phone Number', 'phone', '01615155444', { phone: '01615155444', countryShortName: 'GB' }),
    cv('file_mm1dr8wc', 'Call Sheet', 'file', ''),
    cv('file_mm1dd93', 'Schedule', 'file', ''),
    cv('file_mm1dmxw0', 'R&Rs', 'file', ''),
  ],
  subitems: [
    person('Kiran Dhadwal', 'MP Brand Manager', [7], [17, 30], '', 'Crew', 'Brand sign-off on all hero shots'),
    person('Emma Weaver', 'Producer', [7], [17, 30], '', 'Crew', 'Overall shoot running and schedule'),
    person('Mia Duffy', 'Talent Manager', [7], [17], '', 'Crew', 'Talent welfare and timings'),
    person('Hannah Willmott', 'Social Rep', [7], [17, 30], 'Parking Bay 4', 'Crew', 'BTS content for social'),
    person('Caitlin Matthews', 'Stylist', [7], [17, 30], 'Parking Bay 5', 'Crew', 'Wardrobe and steaming'),
    person('Tia Barrea', 'MUA', [7, 30], [17, 30], 'Parking Bay 6'),
    person('Jack Moss', 'Photographer', [7], [17, 30], 'Parking Bay 8', 'Crew', 'Stills capture'),
    person('Zoe Rae', '', [8], [17], 'Parking Bay 10', 'Talent'),
    scene(1, [8, 30], [10], 'Hero product', 'Studio C03', 'Clean white set, product in hand', 'Stills', 'Zoe Rae', 'Black set'),
    scene(2, [10, 15], [12], 'Lifestyle', 'Studio C03', 'Kitchen set, shaker pour', 'Stills & Video -  No Audio', 'Zoe Rae', 'Grey loungewear'),
    scene(3, [13], [15, 30], 'Social cutdowns', 'Studio C03', 'Vertical video for reels', 'Video - Audio', 'Zoe Rae', 'Own clothes'),
  ],
};

module.exports = demo;
