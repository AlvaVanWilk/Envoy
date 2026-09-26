// Distances on the map, and what the way from the camp costs in real
// minutes and in stamina. Every expedition goes there and back again.

import {
  MAP_ASPECT, TRAVEL_UNITS_PER_STAMINA, TRAVEL_MINUTES_PER_UNIT, TRAVEL_MIN_MINUTES,
  TRAVEL_SPEEDUP_PER_AUSDAUER, OVERLOAD_TRAVEL_EXTRA, FASTEST_SHARE,
} from '../config.js';

export function distance(a, b) {
  const dx = (a.x - b.x) * MAP_ASPECT;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function camp(catalog) {
  return catalog.places.find((p) => p.typ === 'lager');
}

// Stamina for one way. Boots and cloaks make it cheaper, an over-full
// backpack dearer. At least 1, and nothing at the camp itself.
export function wayStamina(from, to, fx, overloaded = false) {
  if (from.id === to.id) return 0;
  const base = Math.max(1, Math.round(distance(from, to) / TRAVEL_UNITS_PER_STAMINA));
  return Math.max(1, base + fx.reise) + (overloaded ? OVERLOAD_TRAVEL_EXTRA : 0);
}

// Real minutes for one way. Faster with Ausdauer and with travel gear.
export function wayMinutes(from, to, stats, fx) {
  if (from.id === to.id) return 0;
  const speed = Math.max(FASTEST_SHARE,
    1 - TRAVEL_SPEEDUP_PER_AUSDAUER * (stats.ausdauer.level - 1) + 0.1 * fx.reise);
  return Math.max(TRAVEL_MIN_MINUTES, Math.round(distance(from, to) * TRAVEL_MINUTES_PER_UNIT * speed));
}
