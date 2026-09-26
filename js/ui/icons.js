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

// A compass star: every arm split along its axis, one half light, one half dark.
function compassStar() {
  let light = '';
  let dark = '';
  for (const [deg, len, wid] of [[-90, 11, 2.6], [0, 11, 2.6], [90, 11, 2.6], [180, 11, 2.6], [-45, 6.6, 1.9], [45, 6.6, 1.9], [135, 6.6, 1.9], [225, 6.6, 1.9]]) {
    const tip = polar(len, deg);
    const left = polar(wid, deg - 90);
    const right = polar(wid, deg + 90);
    light += `M12 12L${left}L${tip}Z`;
    dark += `M12 12L${right}L${tip}Z`;
  }
  return `<path d="${light}"/><path d="${dark}" opacity="0.55"/><circle cx="12" cy="12" r="2.2"/>${engFill('M12 10.9a1.1 1.1 0 1 0 0 2.2a1.1 1.1 0 1 0 0-2.2Z')}`;
}

function sunRays() {
  let d = '';
  for (const deg of [198, 222, 246, 270, 294, 318, 342]) {
    const [x1, y1] = polar(7.6, deg - 5).map((v, i) => (i === 1 ? v + 5.5 : v));
    const [x2, y2] = polar(7.6, deg + 5).map((v, i) => (i === 1 ? v + 5.5 : v));
    const [tx, ty] = polar(11, deg).map((v, i) => (i === 1 ? v + 5.5 : v));
    d += `M${x1} ${y1}L${tx} ${ty}L${x2} ${y2}Z`;
  }
  return `<path d="${d}"/>`;
}

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

export const NAV_ICONS = {
  uebersicht: emblem(compassStar()),
  // a sun rising over the horizon: today's work
  heute: emblem(`<path d="M6 17.5a6 6 0 0 1 12 0Z"/>${sunRays()}<rect x="1.8" y="18.3" width="20.4" height="1.7" rx="0.85"/><rect x="5" y="21.1" width="14" height="1.3" rx="0.65" opacity="0.6"/>`),
  // the Envoy: a hooded figure with two points of light
  envoy: emblem(`<path fill-rule="evenodd" d="${HOOD}${FACE}"/><circle cx="10.6" cy="11" r="0.85"/><circle cx="13.4" cy="11" r="0.85"/>${eng('M12 2v4.2M7 17.6l2 4.4M17 17.6l-2 4.4')}`),
  inventar: emblem(`<path d="M4 9h16v10.6a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 19.6Z"/><path d="M8.4 9V6.6a3.6 3.6 0 0 1 7.2 0V9h-1.9V6.8a1.7 1.7 0 0 0-3.4 0V9Z"/>${eng('M4.6 13.4q7.4 3.2 14.8 0M6 16.8v3.4M18 16.8v3.4')}${engFill('M10.7 14.4h2.6v2.8h-2.6Z')}`),
  karte: emblem(`<path d="M2 5.6l6-2.1l8 2.1l6-2.1v15l-6 2.1l-8-2.1l-6 2.1Z"/>${engFill('M8 3.5l8 2.1v15l-8-2.1Z')}${eng('M4.6 16.4c1.6-2.8 4.4-1.8 6-4.6s3.4-3.8 5-2.2', 1)}${eng('M17.4 6.6l2.4 2.4M19.8 6.6l-2.4 2.4', 1.3)}`),
  zuhause: emblem(`<path d="M2.8 22V12.4L9 7.2l6 5V22Z"/><path d="M14 22V6.2h1.3V4h1.5v2.2h1.4V4h1.5v2.2H21V22Z"/>${engFill('M7.4 22v-3.6a1.6 1.6 0 0 1 3.2 0V22Z')}${engFill('M16.8 9.2h1.4v2.6h-1.4Z')}${eng('M3.4 15.8H14M14.6 13.6h5.8M14.6 17.6h5.8', 0.8)}`),
  haendler: emblem(`<path d="M8.6 7.2C5.1 9.2 3.5 13 3.5 16c0 4 3.5 6 8.5 6s8.5-2 8.5-6c0-3-1.6-6.8-5.1-8.8Z"/><path d="M7.8 3.6c1.6 1.2 6.8 1.2 8.4 0l-.7 3.8H8.5Z"/>${eng('M8.4 7.4q3.6 1.6 7.2 0')}${eng('M12 12.6l1.8 2.9l-1.8 2.9l-1.8-2.9Z', 1)}`),
  kompendium: emblem(`<path d="M5 4.6a2.1 2.1 0 0 1 2.1-2.1h12.4V18H7.1A2.1 2.1 0 0 0 5 20.1Z"/><path d="M7.1 18.8h12.4v2.7H7.1a1.35 1.35 0 0 1 0-2.7Z" opacity="0.6"/>${eng('M8.6 10.2q3.7-3.8 7.4 0q-3.7 3.8-7.4 0Z', 1.1)}${engFill('M12.3 8.9a1.3 1.3 0 1 0 0 2.6a1.3 1.3 0 1 0 0-2.6Z')}`),
  talente: emblem(`<circle cx="12" cy="7.2" r="5"/><circle cx="7.3" cy="10.4" r="3.6"/><circle cx="16.7" cy="10.4" r="3.6"/><circle cx="9.4" cy="13" r="3"/><circle cx="14.6" cy="13" r="3"/><path d="M11 13.5h2l.6 6c.9 1 2.4 1.5 3.4 1.7v.9H7v-.9c1-.2 2.5-.7 3.4-1.7Z"/>${eng('M12 15V9.4M12 12.4L9.4 10M12 11.4l2.8-2.4', 1)}`),
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
  umhang: emblem(`<path d="M8 3h8l1.5 2l3 16l-3.5-1.2l-2.2 2L12 20l-2.8 1.8l-2.2-2L3.5 21l3-16Z"/>${eng('M8 3.2q4 3.4 8 0M9.6 8.4l-1.4 11M14.4 8.4l1.4 11')}${engFill('M12 4.4a1.1 1.1 0 1 0 0 2.2a1.1 1.1 0 1 0 0-2.2Z')}`),
  torso: emblem(`<path d="M8 3L4 5.5L2.4 11l3.1 1l1-2.5V21h11V9.5l1 2.5l3.1-1L20 5.5L16 3c-1 2-7 2-8 0Z"/>${eng('M12 5.8V21M9 3.6q3 2.6 6 0')}`),
  handschuhe: emblem(`${FIST}${eng('M5.4 8.4l13 3.2M5.4 11.6l13 2.6M5.6 15l10 2', 0.9)}`),
  beine: emblem(`<path d="M6 2.5h12l1.5 19h-5.3L12 9l-2.2 12.5H4.5Z"/>${eng('M6.2 5.2h11.6M12 5.4V9', 1)}`),
  schuhe: emblem(`${BOOT}${eng('M7.8 5.2h4M7.8 7.8h4')}`),
  einrichtung: emblem(`<path d="M9 2.6h6v1.8H9Z"/><path d="M8 5h8l1.2 3v9.2L16 19.4H8l-1.2-2.2V8Z"/><rect x="7" y="19.8" width="10" height="2.4" rx="0.8"/>${engFill('M9.6 8.4h4.8v8.2H9.6Z')}<path d="M12 10c.9 1.3 1.6 2.1 1.6 3.3a1.6 1.6 0 0 1-3.2 0c0-1.2.7-2 1.6-3.3Z"/>`),
};

// Map places, drawn light on a dark ink seal.
export const PLACE_ICONS = {
  lager: emblem('<path fill-rule="evenodd" d="M12 2.6c1 3.5 4.6 5 4.6 9.6c0 3-2 5-4.6 5s-4.6-2-4.6-4.8c0-2.3 1.5-3.3 2-5.3c1 1.5 1.5 2 2 2.5c0-2.5 0-5 .6-7ZM12 11c1 1.5 2 2.3 2 3.8c0 1.2-.9 2-2 2s-2-.8-2-1.9c0-1.3 1.4-2.1 2-3.9Z"/><ellipse cx="5.4" cy="20" rx="2.3" ry="1.6"/><ellipse cx="9.6" cy="21" rx="2.3" ry="1.4"/><ellipse cx="14.4" cy="21" rx="2.3" ry="1.4"/><ellipse cx="18.6" cy="20" rx="2.3" ry="1.6"/>'),
  sammeln: emblem(`<path d="M12 1.8l2.8 4v11.4L12 21.4l-2.8-4.2V5.8Z"/><path d="M6.2 7.6l2 2.6v7.6l-2 3l-2-3v-7.6Z" transform="rotate(-16 6.2 14)"/><path d="M17.8 7.6l2 2.6v7.6l-2 3l-2-3v-7.6Z" transform="rotate(16 17.8 14)"/>${eng('M12 2v19.2', 0.9)}<rect x="3" y="21" width="18" height="1.6" rx="0.8" opacity="0.7"/>`),
  wild: emblem('<path fill-rule="evenodd" d="M12 2.4c4.5 0 7 3.6 7 8.1v10.1l-2.3-1.7l-2.3 2.2L12 19l-2.4 2.1l-2.3-2.2L5 20.6V10.5c0-4.5 2.5-8.1 7-8.1ZM9.6 8.6c-.7 0-1.3.8-1.3 1.9s.6 1.9 1.3 1.9s1.3-.8 1.3-1.9s-.6-1.9-1.3-1.9ZM14.4 8.6c-.7 0-1.3.8-1.3 1.9s.6 1.9 1.3 1.9s1.3-.8 1.3-1.9s-.6-1.9-1.3-1.9Z"/>'),
  ort: emblem(`<path d="M9 20.4V6.2l1.5-2.6L12 5l1.5-2.6L15 5.4v15Z"/><path d="M6.8 20h10.4v2.3H6.8Z"/>${eng('M10.9 7.4v12M13.1 7.4v12', 0.8)}`),
  hoehle: emblem('<path fill-rule="evenodd" d="M1.8 21.6C2.8 14 6 8.2 12 6.6c6 1.6 9.2 7.4 10.2 15ZM8 21.6c0-5 1.8-8 4-8s4 3 4 8Z"/><path d="M10.4 3.8l1.6-1.6l1.6 1.6l-1.6 1.6Z" opacity="0.7"/>'),
};

// Currency and materials, as small coloured pictures.
export const RESOURCE_ICONS = {
  // Äther: what remains when a spirit dissolves, a cold flame
  aether: '<svg viewBox="0 0 24 24"><path d="M12 1.6c1.2 3.8 6.2 6.2 6.2 12a6.2 6.2 0 0 1-12.4 0c0-3.2 2-4.6 2.8-7.2c1.2 1.8 1.8 2.6 2.4 3c-.3-3.2.2-5.6 1-7.8Z" fill="url(#g-aether)" stroke="#1d2b2e" stroke-width="0.8"/><path d="M12.2 10.4c1 1.8 2.8 3 2.8 5.2a3 3 0 0 1-6 0c0-1.6 1.2-2.6 1.8-4c.5.8.9 1.2 1.2 1.4c0-1 0-1.8.2-2.6Z" fill="#effafa" opacity="0.85"/><circle cx="18.6" cy="5" r="0.9" fill="#d8f0f0"/><circle cx="5.2" cy="8.2" r="0.6" fill="#d8f0f0" opacity="0.8"/></svg>',
  // Quarz: clear crystal from the rubble
  quarz: '<svg viewBox="0 0 24 24" stroke="#1c2328" stroke-width="0.8" stroke-linejoin="round"><path d="M6.4 9.4l2.2 2.4v7.6l-2.2 2.8l-2.2-2.8v-7.6Z" fill="#9fb0ba" transform="rotate(-18 6.4 16)"/><path d="M17.6 8.4l2.2 2.4v8.6l-2.2 2.8l-2.2-2.8v-8.6Z" fill="#9fb0ba" transform="rotate(16 17.6 16)"/><path d="M12 1.8l3 4.2v12.6l-3 3.8l-3-3.8V6Z" fill="url(#g-quarz)"/><path d="M12 1.8l3 4.2v12.6l-3 3.8Z" fill="#8497a3" opacity="0.55" stroke="none"/><path d="M10.2 7.4v8.4" stroke="#fff" stroke-width="0.9" opacity="0.7"/></svg>',
  // Stein: a hewn block from the old ruins
  stein: '<svg viewBox="0 0 24 24" stroke="#16191c" stroke-width="0.8" stroke-linejoin="round"><path d="M3 9.2l8.4-3.6l9.6 2.6l-8.2 3.8Z" fill="#aab0b5"/><path d="M3 9.2l9.8 2.8v9.4L3 18.4Z" fill="#7a8187"/><path d="M12.8 12l8.2-3.8v9.2l-8.2 4Z" fill="#5b6167"/><path d="M6 13.2l1.6 1.4l-.6 2M16.2 13.6l1.2 2.2l1.6.4" fill="none" stroke="#2a2e32" stroke-width="0.9"/></svg>',
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
  book: line('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z"/>'),
  // an hourglass for the exercise timer
  timer: emblem(`<path d="M5.5 2h13v2.2h-1.2c0 3.6-2.4 5.4-3.8 7.8c1.4 2.4 3.8 4.2 3.8 7.8h1.2V22h-13v-2.2h1.2c0-3.6 2.4-5.4 3.8-7.8C9.1 9.6 6.7 7.8 6.7 4.2H5.5Z"/>${engFill('M9 5h6c-.4 2-1.8 3.4-3 5c-1.2-1.6-2.6-3-3-5Z')}${engFill('M8.8 19.6c.4-2 1.8-3.6 3.2-4.8c1.4 1.2 2.8 2.8 3.2 4.8Z')}`),
  lock: emblem('<path fill-rule="evenodd" d="M7.2 10V7.6a4.8 4.8 0 0 1 9.6 0V10h-2.4V7.6a2.4 2.4 0 0 0-4.8 0V10Z"/><path fill-rule="evenodd" d="M5 10h14v10.6a1.4 1.4 0 0 1-1.4 1.4H6.4A1.4 1.4 0 0 1 5 20.6ZM12 13.2a1.5 1.5 0 0 0-.8 2.8v2.4h1.6V16a1.5 1.5 0 0 0-.8-2.8Z"/>'),
  // an ink mark for the hero on the map
  hero: emblem(`<path d="M12 1.5c3 1.2 6.3 1.6 9 1.4v8.6c0 5.6-3.8 9.6-9 11.4C6.8 21.1 3 17.1 3 11.5V2.9c2.7.2 6-.2 9-1.4Z"/>${engFill('M8.6 6.6h6.8v1.8h-4.8v2.3h4v1.8h-4v2.4h4.8v1.8H8.6Z')}`),
};
