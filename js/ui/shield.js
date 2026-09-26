// A small round shield with an emblem on it: the buttons of the menu.
// A copper rim with rivets around a face of stone; the emblem looks carved
// into the stone. Drawn as SVG so the edges stay sharp at every size.
// The colours come from the gradients in index.html; the state
// (active, locked) is set by classes on the surrounding element.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';

const RIVETS = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const x = (28 + 23.2 * Math.cos(a)).toFixed(2);
  const y = (28 + 23.2 * Math.sin(a)).toFixed(2);
  return `<circle cx="${x}" cy="${y}" r="1.35" class="sh-rivet"/>`;
}).join('');

const SHIELD_SVG = `<svg class="shield-bg" viewBox="0 0 56 56" aria-hidden="true">
  <circle cx="28" cy="30" r="26.5" class="sh-shadow"/>
  <circle cx="28" cy="28" r="26.5" class="sh-rim"/>
  <path d="M7.6 20.5A21.8 21.8 0 0 1 48.4 20.5" class="sh-rim-light"/>
  ${RIVETS}
  <circle cx="28" cy="28" r="20.2" class="sh-face"/>
  <circle cx="28" cy="28" r="20.2" class="sh-grain"/>
  <circle cx="28" cy="28" r="16.6" class="sh-ring"/>
  <circle cx="28" cy="28" r="20.2" class="sh-sheen"/>
</svg>`;

// markup: the emblem (from icons.js). extra: e.g. a badge.
export function shield(markup, { locked = false, extra = null } = {}) {
  return h('span', { class: `shield ${locked ? 'is-locked' : ''}` },
    h('span', { class: 'shield-art', html: SHIELD_SVG }),
    icon(markup, 'icon shield-icon'),
    locked ? h('span', { class: 'shield-lock', html: UI_ICONS.lock }) : null,
    extra);
}
