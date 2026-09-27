// The figure: transparent layers of identical size stacked on top of each
// other. Only worn items are drawn; an item whose requirement is no longer
// met has already been taken off, so the slot shows the base figure.
// An item without a picture yet is worn but not drawn.

import { h } from './dom.js';
import { SLOTS, BASE_FIGURE_LAYER, BASE_FIGURE_FILE } from '../config.js';

export function paperdoll(equipped, world, catalog, { className = '' } = {}) {
  const layers = [{ layer: BASE_FIGURE_LAYER, src: BASE_FIGURE_FILE, slot: 'basis' }];
  for (const slot of SLOTS) {
    const entry = world.items[equipped[slot.id]];
    const item = entry && catalog.itemById.get(entry.id);
    if (item?.figur) layers.push({ layer: slot.layer, src: item.figur, slot: slot.id });
  }
  layers.sort((a, b) => a.layer - b.layer);

  return h('div', { class: `paperdoll ${className}`, role: 'img', 'aria-label': 'Der Envoy' },
    h('div', { class: 'paperdoll-shadow' }),
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
