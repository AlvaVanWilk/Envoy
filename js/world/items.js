// Level and price of equipment and furniture.

import { SELL_SHARE } from '../config.js';

// How demanding an item is: its highest requirement (0 = none).
export function itemLevel(item) {
  return Math.max(0, ...Object.values(item.req || {}));
}

export function itemPrice(item) {
  if (item.preis !== null && item.preis !== undefined) return item.preis;
  const n = itemLevel(item);
  return Math.round(12 + 4 * n + n * n + 8 * item.stufe);
}

// What an owned entry (equipment or furniture) is worth to the trader.
export function sellPrice(entry, catalog) {
  const thing = entry.kind === 'furniture'
    ? catalog.furnitureById.get(entry.id)
    : catalog.itemById.get(entry.id);
  if (!thing) return 0;
  const price = entry.kind === 'furniture' ? (thing.preis || 20) : itemPrice(thing);
  return Math.max(1, Math.floor(price * SELL_SHARE));
}

export function lookup(entry, catalog) {
  return entry.kind === 'furniture' ? catalog.furnitureById.get(entry.id) : catalog.itemById.get(entry.id);
}

// Which requirements of `item` the current stats do not meet.
export function unmetRequirements(item, stats) {
  const unmet = [];
  for (const [stat, min] of Object.entries(item.req || {})) {
    if (min > 0 && stats[stat].level < min) unmet.push({ stat, min });
  }
  return unmet;
}
