// A small iron shield with an emblem on it: the buttons of the menu.
// Drawn as SVG so the rim, the bevel and the rivets stay sharp.
// The colours come from the gradients in index.html; the state
// (active, locked) is set by classes on the surrounding element.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';

const RIM = 'M24 1.5C30 4 37 5 45.5 4.5V24c0 14-9 24.5-21.5 30.5C11.5 48.5 2.5 38 2.5 24V4.5C11 5 18 4 24 1.5Z';
const FACE = 'M24 6.2c5.5 2 11 3 17 2.8V24c0 11.5-7.2 20.5-17 25.6C14.2 44.5 7 35.5 7 24V9c6 .2 11.5-.8 17-2.8Z';

const SHIELD_SVG = `<svg class="shield-bg" viewBox="0 0 48 56" aria-hidden="true">
  <path d="${RIM}" class="sh-shadow" transform="translate(0 2.2)"/>
  <path d="${RIM}" class="sh-rim"/>
  <path d="M5 6.2c8 .6 14-.4 19-2.5c5 2.1 11 3.1 19 2.5" class="sh-edge"/>
  <path d="${FACE}" class="sh-face"/>
  <path d="${FACE}" class="sh-sheen"/>
  <circle cx="10.4" cy="11.6" r="1.5" class="sh-rivet"/><circle cx="37.6" cy="11.6" r="1.5" class="sh-rivet"/>
  <circle cx="24" cy="46" r="1.3" class="sh-rivet"/>
</svg>`;

// markup: the emblem (from icons.js). extra: e.g. a badge.
export function shield(markup, { locked = false, extra = null } = {}) {
  return h('span', { class: `shield ${locked ? 'is-locked' : ''}` },
    h('span', { class: 'shield-art', html: SHIELD_SVG }),
    icon(markup, 'icon shield-icon'),
    locked ? h('span', { class: 'shield-lock', html: UI_ICONS.lock }) : null,
    extra);
}
