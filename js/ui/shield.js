// A small round shield with an emblem on it: the buttons of the menu.
// A copper rim with rivets around a face of stone with fine veins; the
// emblem looks carved into the stone. Drawn as SVG so the edges stay sharp
// at every size.
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

// Fine branching veins across the face, like in a leaf or in old stone.
const VEINS = 'M28 47.5c-.6-7-1.6-12.8-.8-20.3c.6-6.4-1.2-11.4-3.6-17.4'
  + 'M27.4 34.4c-3.8-2.6-8.2-3.6-13.2-3.4M26.6 40.6c3.6-1.6 7.4-2 11.8-4'
  + 'M27.3 27.4c3.8-2.8 7.8-4.4 12.6-5.4M33 24.3c1.8-3.6 2.4-7.4 2.4-11.2'
  + 'M26 19.8c-3-2-5.6-5-7.4-8.4M24 31.2c-1.8 2.8-3.4 6.2-4.2 10.2M20.4 30.4c-1.6-2.2-3.8-4-6.6-5'
  + 'M31.6 38.6c1.6 1.8 2.6 4 3 6.6M36.6 22.6c2.4.4 4.4 1.6 6 3.4';

const SHIELD_SVG = `<svg class="shield-bg" viewBox="0 0 56 56" aria-hidden="true">
  <circle cx="28" cy="30" r="26.5" class="sh-shadow"/>
  <circle cx="28" cy="28" r="26.5" class="sh-rim"/>
  <path d="M7.6 20.5A21.8 21.8 0 0 1 48.4 20.5" class="sh-rim-light"/>
  ${RIVETS}
  <circle cx="28" cy="28" r="20.2" class="sh-face"/>
  <path d="${VEINS}" class="sh-veins"/>
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
