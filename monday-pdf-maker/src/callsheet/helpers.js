// Helpers shared by the call sheet PDFs, copied from the Vibe app so output matches.
const fs = require('fs');
const path = require('path');

const MYPROTEIN_TEAL = '#003942';

const formatDateUK = (dateValue) => {
  if (!dateValue) return '—';
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

// Same as the Vibe app's formatTime for 24-hour hour columns: 9, 5 -> "09:05"
const formatTime = (hour, minute) => {
  if (hour == null) return '';
  const pad = (n) => String(n ?? 0).padStart(2, '0');
  return `${pad(hour)}:${pad(minute)}`;
};

const getWeatherIcon = (emoji) => {
  const iconColor = MYPROTEIN_TEAL;
  
  const icons = {
    // Sun icons
    '☀️': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="4" fill="${iconColor}"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    '☀': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="4" fill="${iconColor}"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    
    // Cloud icons
    '☁️': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/></svg>`,
    '☁': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/></svg>`,
    '⛅': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="10" r="3" fill="${iconColor}"/><path d="M12 2v2M19 9l-1.5 1.5M22 12h-2M5.64 5.64l1.41 1.41" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/><path d="M18 15h-1a6 6 0 1 0-8 0h9a3.5 3.5 0 0 0 0-7z" fill="${iconColor}" opacity="0.8"/></svg>`,
    '⛅️': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="10" r="3" fill="${iconColor}"/><path d="M12 2v2M19 9l-1.5 1.5M22 12h-2M5.64 5.64l1.41 1.41" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/><path d="M18 15h-1a6 6 0 1 0-8 0h9a3.5 3.5 0 0 0 0-7z" fill="${iconColor}" opacity="0.8"/></svg>`,
    '🌤️': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="9" r="3.5" fill="${iconColor}"/><path d="M11 2v2M18 8l-1.2 1.2M21 11h-2M5.5 5.5l1.4 1.4" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/><path d="M16 16h-1a5 5 0 1 0-6 0h7a2.5 2.5 0 0 0 0-5z" fill="${iconColor}" opacity="0.7"/></svg>`,
    '🌤': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="9" r="3.5" fill="${iconColor}"/><path d="M11 2v2M18 8l-1.2 1.2M21 11h-2M5.5 5.5l1.4 1.4" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/><path d="M16 16h-1a5 5 0 1 0-6 0h7a2.5 2.5 0 0 0 0-5z" fill="${iconColor}" opacity="0.7"/></svg>`,
    
    // Rain icons
    '🌧️': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/><path d="M8 19v3M12 19v3M16 19v3" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🌧': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/><path d="M8 19v3M12 19v3M16 19v3" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🌦️': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="10" cy="8" r="2.5" fill="${iconColor}"/><path d="M10 2v1.5M16 7l-1 1M18 10h-1.5" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/><path d="M16 12h-1a5 5 0 1 0-7 0h8a3 3 0 0 0 0-6z" fill="${iconColor}" opacity="0.8"/><path d="M8 17v2M12 17v2" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    '🌦': `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="10" cy="8" r="2.5" fill="${iconColor}"/><path d="M10 2v1.5M16 7l-1 1M18 10h-1.5" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/><path d="M16 12h-1a5 5 0 1 0-7 0h8a3 3 0 0 0 0-6z" fill="${iconColor}" opacity="0.8"/><path d="M8 17v2M12 17v2" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    
    // Snow icons
    '🌨️': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/><circle cx="8" cy="21" r="1" fill="${iconColor}"/><circle cx="12" cy="21" r="1" fill="${iconColor}"/><circle cx="16" cy="21" r="1" fill="${iconColor}"/></svg>`,
    '🌨': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/><circle cx="8" cy="21" r="1" fill="${iconColor}"/><circle cx="12" cy="21" r="1" fill="${iconColor}"/><circle cx="16" cy="21" r="1" fill="${iconColor}"/></svg>`,
    '❄️': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    '❄': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/></svg>`,
    
    // Storm icons
    '⛈️': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/><path d="M13 13l-3 5h3l-2 4" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    '⛈': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="${iconColor}"/><path d="M13 13l-3 5h3l-2 4" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    '🌩️': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M13 13l-3 5h3l-2 4" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    '🌩': `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M13 13l-3 5h3l-2 4" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  };
  
  return icons[emoji] || null;
};

const processWeatherText = (text) => {
  if (!text) return { hasIcon: false, text: '' };
  
  // Check for weather emojis
  const weatherEmojis = ['☀️', '☀', '⛅', '⛅️', '🌤️', '🌤', '☁️', '☁', '🌧️', '🌧', '🌦️', '🌦', '🌨️', '🌨', '❄️', '❄', '⛈️', '⛈', '🌩️', '🌩'];
  let foundEmoji = null;
  
  for (const emoji of weatherEmojis) {
    if (text.includes(emoji)) {
      foundEmoji = emoji;
      break;
    }
  }
  
  if (foundEmoji) {
    const icon = getWeatherIcon(foundEmoji);
    const textWithoutEmoji = text.replace(foundEmoji, '').trim();
    return { hasIcon: true, icon, text: textWithoutEmoji };
  }
  
  // Remove any remaining emojis
  const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
  
  return { hasIcon: false, text: cleanText };
};

// Splits weather text into a temperature line and a conditions line,
// e.g. "17°C, light cloud" -> { temp: "17°C", condition: "Light Cloud" }.
const splitWeather = (text) => {
  const clean = String(text || '').trim();
  if (!clean) return { temp: '', condition: '' };
  const m = clean.match(/-?\d+(?:\.\d+)?[ \t]*(?:°(?:[ \t]*[CF](?![a-z]))?|degrees?(?:[ \t]*[CF](?![a-z]))?|deg\b|[CF](?![a-z]))/i);
  let temp = '';
  let rest = clean;
  if (m) {
    temp = m[0].replace(/\s+/g, '').replace(/degrees?/i, '°').replace(/^(-?[\d.]+)([CF])$/i, '$1°$2').replace(/°$/, '°C');
    rest = (clean.slice(0, m.index) + ' ' + clean.slice(m.index + m[0].length));
  } else if (clean.includes('\n')) {
    const [first, ...others] = clean.split('\n');
    return { temp: first.trim(), condition: others.join(' ').trim() };
  }
  const condition = rest.replace(/[,|/–—-]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());
  return { temp, condition };
};

// Weather card content: icon on the left, centred against two lines (temperature, conditions).
const weatherBlock = (weatherData) => {
  const { temp, condition } = splitWeather(weatherData.text);
  const lines = [];
  if (temp) lines.push({ text: temp, fontSize: 9, bold: true, color: '#1e293b' });
  if (condition) lines.push({ text: condition, fontSize: 8, color: '#334155' });
  if (!lines.length) lines.push({ text: '—', fontSize: 8 });
  if (!weatherData.hasIcon) return { stack: lines };
  const iconSize = 16;
  // pdfmake line height for Roboto is about 1.17 x font size, times the page's 1.3 line spacing
  const textHeight = lines.reduce((h, l) => h + l.fontSize * 1.17 * 1.3, 0);
  return {
    columns: [
      { svg: weatherData.icon, width: iconSize, height: iconSize, margin: [0, Math.max(0, (textHeight - iconSize) / 2), 5, 0] },
      { width: '*', stack: lines },
    ],
  };
};

// Logo is bundled with the app; other images (map images) are fetched from monday.
const LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'logo.png');
const imageToBase64 = async (url) => {
  if (!url) return null;
  if (url.startsWith('file://')) {
    // local testing only
    const buf = fs.readFileSync(url.slice(7));
    const type = buf[0] === 0x89 ? 'image/png' : buf[0] === 0xff ? 'image/jpeg' : null;
    return type ? `data:${type};base64,${buf.toString('base64')}` : null;
  }
  if (url.includes('Myprotein_logo')) {
    return fs.existsSync(LOGO_PATH) ? 'data:image/png;base64,' + fs.readFileSync(LOGO_PATH).toString('base64') : null;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buf = Buffer.from(await response.arrayBuffer());
    // PDFs can embed PNG and JPEG only; check the file itself rather than trusting headers
    const type = buf[0] === 0x89 && buf[1] === 0x50 ? 'image/png' : buf[0] === 0xff && buf[1] === 0xd8 ? 'image/jpeg' : null;
    if (!type) return null;
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch (err) {
    console.error('Image conversion failed:', err.message);
    return null;
  }
};

module.exports = { MYPROTEIN_TEAL, formatDateUK, formatTime, getWeatherIcon, processWeatherText, splitWeather, weatherBlock, imageToBase64 };
