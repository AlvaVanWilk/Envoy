// The figure: transparent layers of identical size stacked on top of each
// other. Only worn items are drawn; an item whose requirement is no longer
// met has already been taken off, so the slot shows the base figure.
// An item without a picture yet is worn but not drawn.
// Each item lies at its slot's place unless it names another (EBENEN), or
// the person moved this piece further to the front or the back (entry.lage,
// since 5.22, so gewünscht: see layerMoves).
// A figure may wear an undershirt right over the base figure: no slot, it
// cannot be taken off, only switched off in the settings.
// Which figure and which colours, and the colour of a piece: see look.js.
// A piece whose drawing does not fit the figure is not drawn.

import { h } from './dom.js';
import { SLOTS, BASE_FIGURE_LAYER, UNDERSHIRT_LAYER, EBENEN } from '../config.js';
import { resolveLook, baseSrc, undershirtSrc, layerSrc, showLayer, dyeOf } from './look.js';

const layerOf = (item, slot, entry) => entry?.lage ?? EBENEN.find((e) => e.id === item.ebene)?.layer ?? slot.layer;

// envoy: { figur, haut, haar, unterhemd } – by default the Envoy of this world.
export function paperdoll(equipped, world, catalog, { className = '', envoy = world.envoy } = {}) {
  const look = resolveLook(envoy);
  const layers = [{ layer: BASE_FIGURE_LAYER, src: baseSrc(look), slot: 'basis', base: true }];
  if (look.undershirt) layers.push({ layer: UNDERSHIRT_LAYER, src: undershirtSrc(look), slot: 'unterhemd' });
  for (const slot of SLOTS) {
    const entry = world.items[equipped[slot.id]];
    const item = entry && catalog.itemById.get(entry.id);
    const src = item && layerSrc(item, look);
    if (src) layers.push({ layer: layerOf(item, slot, entry), src, slot: slot.id, dye: dyeOf(entry.farbe, item) });
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
      showLayer(img, l.src, look, l.base ? 'base' : 'layer', l.dye);
      return img;
    }));
}

// Where a worn piece would lie one step further to the front or to the back:
// just past the next layer of the figure in that direction (the base figure
// and the undershirt count as layers too). { front, back }, each a layer
// number, or null where it is already the first or the last.
export function layerMoves(inst, world, catalog) {
  const look = resolveLook(world.envoy);
  const others = [BASE_FIGURE_LAYER, ...(look.undershirt ? [UNDERSHIRT_LAYER] : [])];
  let own = null;
  for (const slot of SLOTS) {
    const entry = world.items[world.equipped[slot.id]];
    const item = entry && catalog.itemById.get(entry.id);
    if (!item || !layerSrc(item, look)) continue;
    if (entry.inst === inst) own = layerOf(item, slot, entry);
    else others.push(layerOf(item, slot, entry));
  }
  if (own === null) return { front: null, back: null };
  const above = others.filter((l) => l > own).sort((a, b) => a - b);
  const below = others.filter((l) => l < own).sort((a, b) => b - a);
  const between = (a, b, step) => (b === undefined ? a + step : (a + b) / 2);
  return {
    front: above.length > 0 ? between(above[0], above[1], 0.5) : null,
    back: below.length > 0 ? Math.max(0.1, between(below[0], below[1], -0.5)) : null,
  };
}
