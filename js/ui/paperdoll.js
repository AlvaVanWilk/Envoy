// The figure: transparent layers of identical size stacked on top of each
// other. Only worn items are drawn; an item whose requirement is no longer
// met has already been taken off, so the slot shows the base figure.
// An item without a picture yet is worn but not drawn.
// Which figure and which colours: see look.js.

import { h } from './dom.js';
import { SLOTS, BASE_FIGURE_LAYER } from '../config.js';
import { resolveLook, baseSrc, layerSrc, showLayer } from './look.js';

// envoy: { figur, haut, haar } – by default the Envoy of this world.
export function paperdoll(equipped, world, catalog, { className = '', envoy = world.envoy } = {}) {
  const look = resolveLook(envoy);
  const layers = [{ layer: BASE_FIGURE_LAYER, src: baseSrc(look), slot: 'basis', base: true }];
  for (const slot of SLOTS) {
    const entry = world.items[equipped[slot.id]];
    const item = entry && catalog.itemById.get(entry.id);
    const src = item && layerSrc(item, look);
    if (src) layers.push({ layer: slot.layer, src, slot: slot.id });
  }
  layers.sort((a, b) => a.layer - b.layer);

  return h('div', { class: `paperdoll ${className}`, role: 'img', 'aria-label': envoy?.name || 'Der Envoy' },
    h('div', { class: 'paperdoll-shadow' }),
    layers.map((l) => {
      const img = h('img', {
        alt: '',
        class: 'paperdoll-layer',
        'data-slot': l.slot,
        decoding: 'async',
        draggable: 'false',
        onerror: (e) => { e.currentTarget.hidden = true; },
      });
      showLayer(img, l.src, look, Boolean(l.base));
      return img;
    }));
}
