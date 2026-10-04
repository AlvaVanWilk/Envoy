// Level and price of equipment.

import { SELL_SHARE } from '../config.js';
import { fits, figureOf } from './clothes.js';

// How demanding an item is: its highest requirement (0 = none).
export function itemLevel(item) {
  return Math.max(0, ...Object.values(item.req || {}));
}

export function itemPrice(item) {
  if (item.preis !== null && item.preis !== undefined) return item.preis;
  const n = itemLevel(item);
  return Math.round(12 + 4 * n + n * n + 8 * item.stufe);
}

// What an owned item is worth to the trader.
export function sellPrice(entry, catalog) {
  const thing = catalog.itemById.get(entry.id);
  return thing ? Math.max(1, Math.floor(itemPrice(thing) * SELL_SHARE)) : 0;
}

export function lookup(entry, catalog) {
  return catalog.itemById.get(entry.id);
}

// Can the Envoy put this on: the requirements met, and the drawing fits its figure?
export function wearable(item, stats, world) {
  return unmetRequirements(item, stats).length === 0 && fits(item, figureOf(world));
}

// Which requirements of `item` the current stats do not meet.
export function unmetRequirements(item, stats) {
  const unmet = [];
  for (const [stat, min] of Object.entries(item.req || {})) {
    if (min > 0 && stats[stat].level < min) unmet.push({ stat, min });
  }
  return unmet;
}
