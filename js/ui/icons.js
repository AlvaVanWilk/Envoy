// Line icons as SVG markup. 24 x 24, drawn with currentColor.

const svg = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const STAT_ICONS = {
  // a closed fist: strength without a weapon
  kraft: svg('<path d="M7 11V8.5a1.5 1.5 0 0 1 3 0V11"/><path d="M10 10V7.5a1.5 1.5 0 0 1 3 0V10"/><path d="M13 10V8a1.5 1.5 0 0 1 3 0v3"/><path d="M16 10.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-1.5A5.5 5.5 0 0 1 6 14.5V12a1.5 1.5 0 0 1 1-1.4"/><path d="M7 14h3.5a1.5 1.5 0 0 0 0-3H7"/>'),
  // a winding path
  ausdauer: svg('<path d="M5 20c3-1 4-3 3-5s-2-4 1-6 6-1 7-3-1-3-1-3"/><circle cx="5" cy="20" r="1"/><circle cx="15" cy="3" r="1"/><path d="M17 12l2 1-1 2"/>'),
  // a feather / flowing arc
  beweglichkeit: svg('<path d="M19 4c-7 0-12 5-13 12l-1 4"/><path d="M19 4c0 6-4 11-11 12"/><path d="M9 12h5"/><path d="M11 8.5h5"/>'),
  // crescent moon over still water
  gelassenheit: svg('<path d="M15.5 3.5a6.5 6.5 0 1 0 5 10.5 5.5 5.5 0 0 1-5-10.5z"/><path d="M3 18.5c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/>'),
};

export const SLOT_ICONS = {
  kopf: svg('<path d="M6 13a6 6 0 0 1 12 0"/><path d="M5 13h14"/><path d="M17 13l3 3"/><path d="M18 13l1 4"/>'),
  umhang: svg('<path d="M8 4h8l3 16-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M8 4c1 2 7 2 8 0"/>'),
  torso: svg('<path d="M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3"/><path d="M8 4c1 2 7 2 8 0"/>'),
  handschuhe: svg('<path d="M7 20v-5l-1.5-2.5V8a1.3 1.3 0 0 1 2.6 0V11M8.1 9.5V6.3a1.3 1.3 0 0 1 2.6 0v4.2M10.7 9.8V5.5a1.3 1.3 0 0 1 2.6 0v4.5M13.3 10V6.8a1.3 1.3 0 0 1 2.6 0v6.2L14 16v4"/><path d="M7.3 15.5l6.6-1.8M7.2 18l6.8-1.8"/>'),
  beine: svg('<path d="M7 3h10l1 18h-4l-2-11-2 11H6z"/><path d="M7 6h10"/>'),
  schuhe: svg('<path d="M4 17V8h5v5l6 2c3 1 5 1.5 5 3v1H4z"/><path d="M4 19h16"/>'),
  einrichtung: svg('<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M3 11h18v5H3z"/><path d="M5 16v3M19 16v3"/>'),
};

export const NAV_ICONS = {
  heute: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  envoy: svg('<circle cx="12" cy="6" r="3"/><path d="M12 9v7M8 21l4-5 4 5M6 12l6-2 6 2"/>'),
  inventar: svg('<path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M8 13h8"/>'),
  karte: svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  zuhause: svg('<path d="M3 20h18"/><path d="M5 20V10l7-6 7 6v10"/><path d="M10 20v-5h4v5"/>'),
  haendler: svg('<path d="M12 3v18M6 21h12"/><path d="M4 7h16"/><path d="M6 7l-3 6a3 3 0 0 0 6 0zM18 7l-3 6a3 3 0 0 0 6 0z"/>'),
  kompendium: svg('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9.5 9c1-1.3 4-1.3 5 0-1 1.3-4 1.3-5 0z"/>'),
  skilltree: svg('<circle cx="12" cy="4.5" r="1.8"/><circle cx="6" cy="11" r="1.8"/><circle cx="18" cy="11" r="1.8"/><circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/><path d="M11 6l-4 3.5M13 6l4 3.5M6.8 12.7l1.6 4.6M17.2 12.7l-1.6 4.6M10.8 19h2.4"/>'),
  einstellungen: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
};

// Resources and currency.
export const RESOURCE_ICONS = {
  // Glimmer: a small shard of light left behind by a calmed spirit
  glimmer: svg('<path d="M12 3l3 7-3 11-3-11z"/><path d="M9 10h6"/>'),
  holz: svg('<rect x="4" y="9" width="16" height="6" rx="3"/><circle cx="17" cy="12" r="1.5"/><path d="M6 17l3-2M9 7l3 2"/>'),
  stein: svg('<path d="M5 17l2-7 5-3 6 2 2 6-4 3H8z"/><path d="M12 7l1 5 5 2"/>'),
};

// Kinds of places on the map.
export const PLACE_ICONS = {
  lager: svg('<path d="M4 20l8-14 8 14z"/><path d="M12 6v14M9 20l3-5 3 5"/>'),
  wild: svg('<path d="M12 3c4 0 6 3 6 7 0 3-1 5 0 8-2-1-3 1-4 3-1-2-2-2-2-2s-1 0-2 2c-1-2-2-4-4-3 1-3 0-5 0-8 0-4 2-7 6-7z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="10" r="1"/>'),
  sammeln: svg('<path d="M14 4l6 6-3 1-4-4z"/><path d="M13 7L4 16l2 2 9-9"/>'),
  ort: svg('<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>'),
};

export const UI_ICONS = {
  check: svg('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  timer: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  sync: svg('<path d="M20 11a8 8 0 0 0-14.7-4.3L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.7 4.3L20 16"/><path d="M20 20v-4h-4"/>'),
  pause: svg('<path d="M9 5v14M15 5v14"/>'),
  play: svg('<path d="M7 5l12 7-12 7z"/>'),
  chevron: svg('<path d="M9 6l6 6-6 6"/>'),
  die: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>'),
  search: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),
  pin: svg('<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
};
