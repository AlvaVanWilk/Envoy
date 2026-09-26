// The figure: transparent layers of identical size stacked on top of each
// other. Only equipped items whose requirements are met are drawn; an empty
// slot simply shows the base figure underneath.

import { h } from './dom.js';
import { SLOTS, BASE_FIGURE_LAYER, BASE_FIGURE_FILE } from '../config.js';

export function paperdoll(equipped, catalog, { className = '' } = {}) {
  const layers = [{ layer: BASE_FIGURE_LAYER, src: BASE_FIGURE_FILE, slot: 'basis' }];
  for (const slot of SLOTS) {
    const item = catalog.itemById.get(equipped[slot.id]);
    if (item) layers.push({ layer: slot.layer, src: item.figur, slot: slot.id });
  }
  layers.sort((a, b) => a.layer - b.layer);

  return h('div', { class: `paperdoll ${className}`, role: 'img', 'aria-label': 'Der Envoy' },
    h('div', { class: 'paperdoll-glow' }),
    layers.map((l) => h('img', {
      src: l.src,
      alt: '',
      class: 'paperdoll-layer',
      'data-slot': l.slot,
      decoding: 'async',
      draggable: 'false',
      onerror: (e) => { e.currentTarget.hidden = true; },
    })));
}
