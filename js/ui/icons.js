// Icons as SVG markup, 24 x 24. Emblems are filled silhouettes in
// currentColor with engraved details (class "eng"), like marks struck into
// metal. Resources are small coloured pictures; their gradients live in
// index.html. Plain UI icons (check, close, ...) are drawn with lines.

const emblem = (body) => `<svg viewBox="0 0 24 24" fill="currentColor">${body}</svg>`;
const line = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// Engraved lines: darker than the emblem, see .eng in the stylesheet.
const eng = (d, width = 1.1) => `<path class="eng" d="${d}" fill="none" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const engFill = (d) => `<path class="eng-fill" d="${d}"/>`;

const round = (n) => Math.round(n * 100) / 100;
const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [round(12 + r * Math.cos(a)), round(12 + r * Math.sin(a))];
};

function gear() {
  const teeth = 8;
  let d = '';
  for (let i = 0; i < teeth; i += 1) {
    const base = (360 / teeth) * i;
    const pts = [polar(8.2, base - 14), polar(11, base - 8), polar(11, base + 8), polar(8.2, base + 14)];
    d += `${i === 0 ? 'M' : 'L'}${pts.map((p) => p.join(' ')).join('L')}`;
  }
  return `<path fill-rule="evenodd" d="${d}ZM12 8.4a3.6 3.6 0 1 0 0 7.2a3.6 3.6 0 1 0 0-7.2Z"/>${eng('M12 5.6a6.4 6.4 0 1 1 0 12.8a6.4 6.4 0 1 1 0-12.8', 0.9)}`;
}

const HOOD = 'M12 1.8C7.4 1.8 5 5.4 5 10c0 2.6-.8 4.6-2 6v6.2h18V16c-1.2-1.4-2-3.4-2-6c0-4.6-2.4-8.2-7-8.2Z';
const FACE = 'M12 6.4c-2.4 0-3.7 2.1-3.7 4.6c0 2.7 1.7 4.5 3.7 4.5s3.7-1.8 3.7-4.5c0-2.5-1.3-4.6-3.7-4.6Z';
const FIST = [
  '<rect x="5.2" y="4.6" width="3.4" height="7.4" rx="1.7"/>',
  '<rect x="8.5" y="3.8" width="3.4" height="8" rx="1.7"/>',
  '<rect x="11.8" y="4.2" width="3.4" height="7.8" rx="1.7"/>',
  '<rect x="15.1" y="5.4" width="3.3" height="6.8" rx="1.65"/>',
  '<path d="M5.2 9.5h13.2v5c0 3.4-2.4 5.3-5.4 5.3h-2.5c-3 0-5.3-2.1-5.3-5.3Z"/>',
  '<rect x="7.9" y="18.8" width="7.6" height="3.8" rx="0.9"/>',
].join('');
const BOOT = '<path d="M6.3 2.4h6.9v9l5.4 2.7c2 1 2.9 2.3 2.9 4.2v1.3H3.4v-2.5c0-1.9 1.4-2.9 2.9-3.9Z"/><rect x="3" y="20" width="19" height="2.4" rx="0.9" opacity="0.75"/>';

// A campfire in a ring of stones: the camp.
const CAMPFIRE = '<path fill-rule="evenodd" d="M12 2.6c1 3.5 4.6 5 4.6 9.6c0 3-2 5-4.6 5s-4.6-2-4.6-4.8c0-2.3 1.5-3.3 2-5.3c1 1.5 1.5 2 2 2.5c0-2.5 0-5 .6-7ZM12 11c1 1.5 2 2.3 2 3.8c0 1.2-.9 2-2 2s-2-.8-2-1.9c0-1.3 1.4-2.1 2-3.9Z"/><ellipse cx="5.4" cy="20" rx="2.3" ry="1.6"/><ellipse cx="9.6" cy="21" rx="2.3" ry="1.4"/><ellipse cx="14.4" cy="21" rx="2.3" ry="1.4"/><ellipse cx="18.6" cy="20" rx="2.3" ry="1.6"/>';

export const NAV_ICONS = {
  // a map with a winding path: the adventures in the world
  abenteuer: emblem(`<path d="M2 5.6l6-2.1l8 2.1l6-2.1v15l-6 2.1l-8-2.1l-6 2.1Z"/>${engFill('M8 3.5l8 2.1v15l-8-2.1Z')}${eng('M4.6 16.4c1.6-2.8 4.4-1.8 6-4.6s3.4-3.8 5-2.2', 1)}${eng('M17.4 6.6l2.4 2.4M19.8 6.6l-2.4 2.4', 1.3)}`),
  talente: emblem(`<circle cx="12" cy="7.2" r="5"/><circle cx="7.3" cy="10.4" r="3.6"/><circle cx="16.7" cy="10.4" r="3.6"/><circle cx="9.4" cy="13" r="3"/><circle cx="14.6" cy="13" r="3"/><path d="M11 13.5h2l.6 6c.9 1 2.4 1.5 3.4 1.7v.9H7v-.9c1-.2 2.5-.7 3.4-1.7Z"/>${eng('M12 15V9.4M12 12.4L9.4 10M12 11.4l2.8-2.4', 1)}`),
  lager: emblem(CAMPFIRE),
  haendler: emblem(`<path d="M8.6 7.2C5.1 9.2 3.5 13 3.5 16c0 4 3.5 6 8.5 6s8.5-2 8.5-6c0-3-1.6-6.8-5.1-8.8Z"/><path d="M7.8 3.6c1.6 1.2 6.8 1.2 8.4 0l-.7 3.8H8.5Z"/>${eng('M8.4 7.4q3.6 1.6 7.2 0')}${eng('M12 12.6l1.8 2.9l-1.8 2.9l-1.8-2.9Z', 1)}`),
  // a closed book with an eye on the cover: the Handbuch
  handbuch: emblem(`<path d="M5 4.6a2.1 2.1 0 0 1 2.1-2.1h12.4V18H7.1A2.1 2.1 0 0 0 5 20.1Z"/><path d="M7.1 18.8h12.4v2.7H7.1a1.35 1.35 0 0 1 0-2.7Z" opacity="0.6"/>${eng('M8.6 10.2q3.7-3.8 7.4 0q-3.7 3.8-7.4 0Z', 1.1)}${engFill('M12.3 8.9a1.3 1.3 0 1 0 0 2.6a1.3 1.3 0 1 0 0-2.6Z')}`),
  einstellungen: emblem(gear()),
};

export const STAT_ICONS = {
  // a closed fist in hand wraps: strength without a weapon
  kraft: emblem(`${FIST}${eng('M8.6 6.2v4.4M11.9 5.6v5M15.2 6v4.8')}${eng('M5.6 13.4h5.6a1.6 1.6 0 0 1 0 3.2H8', 1.2)}${eng('M8 20.1h7.4M8 21.4h7.4', 0.8)}`),
  ausdauer: emblem(`${BOOT}${eng('M7.8 5.2h4M7.8 7.8h4M8.6 10.4l4.2 2')}`),
  beweglichkeit: emblem(`<path d="M20.2 2.8c-7 .5-12.4 5-14.5 12l-1 4.6c4.5-1 8.4-2.5 11.4-6c2.6-3 4-6.5 4.1-10.6Z"/><path d="M5.6 17.8L3 21.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>${eng('M20 3.2C14 8 9 13 4.4 19.8', 1.1)}${eng('M15.6 6.8l2.8 1M12.6 10l3.4 1.1M9.7 13.4l3.2 1', 0.9)}`),
  gelassenheit: emblem('<path d="M14.6 2.6a9 9 0 1 0 7 13.7a7.4 7.4 0 0 1-7-13.7Z"/><path d="M19 4.2l.7 1.6l1.6.7l-1.6.7l-.7 1.6l-.7-1.6l-1.6-.7l1.6-.7Z"/><path d="M21.2 10.2l.4 1l1 .4l-1 .4l-.4 1l-.4-1l-1-.4l1-.4Z"/>'),
};

export const SLOT_ICONS = {
  kopf: emblem(`<path fill-rule="evenodd" d="${HOOD}${FACE}"/>`),
  // something special: an amulet on a cord
  accessoire: emblem(`<path d="M4.6 2.9l1.5-.6L12 10.6l5.9-8.3l1.5.6l-6.4 9.4h-2Z"/><path d="M12 11.2l4.8 4.4L12 22.2l-4.8-6.6Z"/>${eng('M7.6 15.6h8.8M12 11.8v10M9.8 13.6l2.2 2l2.2-2', 0.9)}`),
  torso: emblem(`<path d="M8 3L4 5.5L2.4 11l3.1 1l1-2.5V21h11V9.5l1 2.5l3.1-1L20 5.5L16 3c-1 2-7 2-8 0Z"/>${eng('M12 5.8V21M9 3.6q3 2.6 6 0')}`),
  handschuhe: emblem(`${FIST}${eng('M5.4 8.4l13 3.2M5.4 11.6l13 2.6M5.6 15l10 2', 0.9)}`),
  beine: emblem(`<path d="M6 2.5h12l1.5 19h-5.3L12 9l-2.2 12.5H4.5Z"/>${eng('M6.2 5.2h11.6M12 5.4V9', 1)}`),
  schuhe: emblem(`${BOOT}${eng('M7.8 5.2h4M7.8 7.8h4')}`),
  einrichtung: emblem(`<path d="M9 2.6h6v1.8H9Z"/><path d="M8 5h8l1.2 3v9.2L16 19.4H8l-1.2-2.2V8Z"/><rect x="7" y="19.8" width="10" height="2.4" rx="0.8"/>${engFill('M9.6 8.4h4.8v8.2H9.6Z')}<path d="M12 10c.9 1.3 1.6 2.1 1.6 3.3a1.6 1.6 0 0 1-3.2 0c0-1.2.7-2 1.6-3.3Z"/>`),
};

// Map places, drawn light on a dark ink seal.
export const PLACE_ICONS = {
  lager: emblem(CAMPFIRE),
  // a basket: here something is gathered
  sammeln: emblem(`<path d="M7 10c0-5.4 10-5.4 10 0h-1.8c0-3.2-6.4-3.2-6.4 0Z"/><path d="M3.4 10h17.2l-1.9 10.2a1.6 1.6 0 0 1-1.6 1.3H6.9a1.6 1.6 0 0 1-1.6-1.3Z"/>${eng('M3.8 12.2h16.4M5 15.4h14M5.7 18.6h12.6', 0.9)}${eng('M8.6 12.4v8.8M12 12.4v9M15.4 12.4v8.8', 0.8)}`),
  wild: emblem('<path fill-rule="evenodd" d="M12 2.4c4.5 0 7 3.6 7 8.1v10.1l-2.3-1.7l-2.3 2.2L12 19l-2.4 2.1l-2.3-2.2L5 20.6V10.5c0-4.5 2.5-8.1 7-8.1ZM9.6 8.6c-.7 0-1.3.8-1.3 1.9s.6 1.9 1.3 1.9s1.3-.8 1.3-1.9s-.6-1.9-1.3-1.9ZM14.4 8.6c-.7 0-1.3.8-1.3 1.9s.6 1.9 1.3 1.9s1.3-.8 1.3-1.9s-.6-1.9-1.3-1.9Z"/>'),
  ort: emblem(`<path d="M9 20.4V6.2l1.5-2.6L12 5l1.5-2.6L15 5.4v15Z"/><path d="M6.8 20h10.4v2.3H6.8Z"/>${eng('M10.9 7.4v12M13.1 7.4v12', 0.8)}`),
  hoehle: emblem('<path fill-rule="evenodd" d="M1.8 21.6C2.8 14 6 8.2 12 6.6c6 1.6 9.2 7.4 10.2 15ZM8 21.6c0-5 1.8-8 4-8s4 3 4 8Z"/><path d="M10.4 3.8l1.6-1.6l1.6 1.6l-1.6 1.6Z" opacity="0.7"/>'),
};
// the Trümmerfeld beside the camp is a place of gathering too
PLACE_ICONS.truemmerfeld = PLACE_ICONS.sammeln;

// The four facilities of the camp.
export const FACILITY_ICONS = {
  // three stones on top of each other
  steinlager: emblem(`<ellipse cx="7" cy="18.8" rx="4.2" ry="2.8"/><ellipse cx="17" cy="18.8" rx="4.2" ry="2.8"/><ellipse cx="12" cy="12.8" rx="4.6" ry="2.7"/><ellipse cx="12" cy="7.3" rx="3" ry="2.1"/>${eng('M4.4 18.2l2.2 1M15.2 17.6l2 1.6M10 12.4l2.4.9M11 6.9l1.4.6', 0.9)}`),
  // a pile of mushroom wood, a small cap on top
  pilzlager: emblem(`<circle cx="6.6" cy="18.8" r="2.6"/><circle cx="12" cy="18.8" r="2.6"/><circle cx="17.4" cy="18.8" r="2.6"/><circle cx="9.3" cy="14" r="2.6"/><circle cx="14.7" cy="14" r="2.6"/><path d="M8 9.4C8 6.4 9.8 4.6 12 4.6s4 1.8 4 4.8Z"/><path d="M11.3 9.2h1.4v2.2h-1.4Z"/>${eng('M5.5 18.8a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0M10.9 18.8a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0M16.3 18.8a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0M8.2 14a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0M13.6 14a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0', 0.8)}`),
  // a chest with a lid and a lock
  aufbewahrung: emblem(`<path d="M4.6 4.4h14.8a1.6 1.6 0 0 1 1.6 1.6v3.2H3V6a1.6 1.6 0 0 1 1.6-1.6Z"/><path d="M3.4 10.2h17.2v9.6a1.4 1.4 0 0 1-1.4 1.4H4.8a1.4 1.4 0 0 1-1.4-1.4Z"/>${engFill('M10.5 8.2h3v4.6h-3Z')}${eng('M3.8 15.6h6.4M13.8 15.6h6.4M7 10.6v10.2M17 10.6v10.2', 0.9)}`),
  // a rolled-up bed under the moon
  schlafplatz: emblem(`<path d="M6.4 13h11.4c2.2 0 3.6 1.5 3.6 3.6s-1.4 3.6-3.6 3.6H6.4Z"/><circle cx="6.4" cy="16.6" r="3.8"/><path d="M15.4 2.6a4.6 4.6 0 1 0 5 6a3.7 3.7 0 0 1-5-6Z"/>${eng('M6.4 14.6a2 2 0 1 1-1.9 2.5a1.1 1.1 0 0 1 2-.6', 1)}${eng('M11 13.4v6.6M15 13.4v6.6', 0.8)}`),
};

// Energie, as a small picture for costs: a spark in the colour of the bar.
export const ENERGY_ICON = '<svg viewBox="0 0 24 24" stroke="#0e1c20" stroke-width="0.9" stroke-linejoin="round"><path d="M14 2.2L5 13.4h5.8l-1.8 8.4l9.4-11.6h-6Z" fill="#9cc7c8"/><path d="M14 2.2l-1.6 8h6" fill="none" stroke="#eaf7f6" stroke-width="0.8" opacity="0.75"/></svg>';

// Currency and materials, as small coloured pictures.
export const RESOURCE_ICONS = {
  // Bannsplitter: what remains when a spirit is banished, pale shards
  splitter: '<svg viewBox="0 0 24 24" stroke="#14303a" stroke-width="0.8" stroke-linejoin="round"><circle cx="12" cy="13" r="10" fill="url(#g-splitter-glow)" stroke="none"/><path d="M5.2 9.4l3.6 2.8l-.8 7l-3.6-4.6Z" fill="url(#g-splitter)"/><path d="M18.6 11.8l2.2 3l-3.2 6l-1.2-4.8Z" fill="url(#g-splitter)"/><path d="M12.2 2l3.4 7.8l-2.2 11l-4-8.2Z" fill="url(#g-splitter)"/><path d="M12.2 2l1.2 18.8l2.2-11Z" fill="#f7fbff" opacity="0.45" stroke="none"/><path d="M5.2 9.4l2.8 9.8l.8-7Z" fill="#f7fbff" opacity="0.3" stroke="none"/><path d="M4.6 3.6l.5 1.2l1.2.5l-1.2.5l-.5 1.2l-.5-1.2l-1.2-.5l1.2-.5Z" fill="#eef8ff" stroke="none"/><path d="M19.4 4.4l.4.9l.9.4l-.9.4l-.4.9l-.4-.9l-.9-.4l.9-.4Z" fill="#eef8ff" stroke="none"/></svg>',
  // Pilzholz: the stem of a giant fungus, light and cut like wood
  pilzholz: '<svg viewBox="0 0 24 24" stroke="#1c1916" stroke-width="0.8" stroke-linejoin="round"><path d="M9.3 11.2c-.2 4-.6 6.8-1.2 9.8h5.8c-.6-3-1-5.8-1.2-9.8Z" fill="url(#g-pilz-stem)"/><path d="M10.5 12.6v7.6M11.7 12.6v7.8" stroke="#b09a78" stroke-width="0.6"/><path d="M2.6 11.4C2.6 6.4 6.4 3.2 11 3.2s8.4 3.2 8.4 8.2c-3 1.2-13.8 1.2-16.8 0Z" fill="url(#g-pilz-cap)"/><path d="M4.4 11.8c3.8.8 9.4.8 13.2 0" fill="none" stroke="#4a1f0b" stroke-width="0.6"/><circle cx="7.4" cy="7.4" r="1" fill="#fde3c8" stroke="none" opacity="0.85"/><circle cx="12.6" cy="5.8" r="0.8" fill="#fde3c8" stroke="none" opacity="0.85"/><circle cx="15.6" cy="8.6" r="0.7" fill="#fde3c8" stroke="none" opacity="0.85"/><path d="M15.2 17.4h5.2a1.9 2.3 0 0 1 0 4.6h-5.2Z" fill="url(#g-pilz-stem)"/><ellipse cx="15.2" cy="19.7" rx="1.9" ry="2.3" fill="#f7efe1"/><ellipse cx="15.2" cy="19.7" rx="0.9" ry="1.1" fill="none" stroke="#b8a283" stroke-width="0.6"/></svg>',
  // Stein: a hewn block from the old ruins
  stein: '<svg viewBox="0 0 24 24" stroke="#0e1c20" stroke-width="0.8" stroke-linejoin="round"><path d="M3 9.2l8.4-3.6l9.6 2.6l-8.2 3.8Z" fill="#b2c3c2"/><path d="M3 9.2l9.8 2.8v9.4L3 18.4Z" fill="#76898b"/><path d="M12.8 12l8.2-3.8v9.2l-8.2 4Z" fill="#4f6366"/><path d="M6 13.2l1.6 1.4l-.6 2M16.2 13.6l1.2 2.2l1.6.4" fill="none" stroke="#223235" stroke-width="0.9"/></svg>',
};

export const UI_ICONS = {
  check: line('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  close: line('<path d="M6 6l12 12M18 6L6 18"/>'),
  undo: line('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  sync: line('<path d="M20 11a8 8 0 0 0-14.7-4.3L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.7 4.3L20 16"/><path d="M20 20v-4h-4"/>'),
  pause: line('<path d="M9 5v14M15 5v14"/>'),
  play: line('<path d="M7 5l12 7-12 7z"/>'),
  chevron: line('<path d="M9 6l6 6-6 6"/>'),
  expand: line('<path d="M6 9l6 6 6-6"/>'),
  search: line('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  soundOn: line('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>'),
  soundOff: line('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  book: line('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z"/>'),
  // an hourglass for the exercise timer
  timer: emblem(`<path d="M5.5 2h13v2.2h-1.2c0 3.6-2.4 5.4-3.8 7.8c1.4 2.4 3.8 4.2 3.8 7.8h1.2V22h-13v-2.2h1.2c0-3.6 2.4-5.4 3.8-7.8C9.1 9.6 6.7 7.8 6.7 4.2H5.5Z"/>${engFill('M9 5h6c-.4 2-1.8 3.4-3 5c-1.2-1.6-2.6-3-3-5Z')}${engFill('M8.8 19.6c.4-2 1.8-3.6 3.2-4.8c1.4 1.2 2.8 2.8 3.2 4.8Z')}`),
  lock: emblem('<path fill-rule="evenodd" d="M7.2 10V7.6a4.8 4.8 0 0 1 9.6 0V10h-2.4V7.6a2.4 2.4 0 0 0-4.8 0V10Z"/><path fill-rule="evenodd" d="M5 10h14v10.6a1.4 1.4 0 0 1-1.4 1.4H6.4A1.4 1.4 0 0 1 5 20.6ZM12 13.2a1.5 1.5 0 0 0-.8 2.8v2.4h1.6V16a1.5 1.5 0 0 0-.8-2.8Z"/>'),
  // the hero's mark on the map: a small round shield with an E
  hero: emblem(`<circle cx="12" cy="12" r="10.5"/>${eng('M12 3.4a8.6 8.6 0 1 1 0 17.2a8.6 8.6 0 1 1 0-17.2', 0.9)}${engFill('M8.6 6.9h6.8v1.8h-4.8v2.4h4v1.8h-4v2.4h4.8v1.8H8.6Z')}`),
};
