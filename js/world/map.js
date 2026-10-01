// Distances on the map, and what the way from the camp costs in stamina.
// Every expedition goes there and back again; each point of stamina is
// also a minute on the way (see MINUTES_PER_STAMINA).

import {
  MAP_ASPECT, TRAVEL_UNITS_PER_STAMINA, TRAVEL_SPEEDUP_PER_AUSDAUER, OVERLOAD_TRAVEL_EXTRA, FASTEST_SHARE,
} from '../config.js';

export function distance(a, b) {
  const dx = (a.x - b.x) * MAP_ASPECT;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function camp(catalog) {
  return catalog.places.find((p) => p.typ === 'lager');
}

// The Trümmerfeld right by the camp, where the Envoy gathers Stein and
// Pilzholz (null if the table has no such place).
export function gatherPlace(catalog) {
  return catalog.places.find((p) => p.typ === 'truemmerfeld') || null;
}

// The camp and the Trümmerfeld beside it are reached without a way.
export const besideTheCamp = (place) => place.typ === 'lager' || place.typ === 'truemmerfeld';

// Stamina for one way: further costs more. Every level of Ausdauer makes
// the way 3 % shorter (at most half), boots and cloaks make it cheaper, an
// over-full backpack dearer. At least 1, and nothing at the camp itself or
// on the Trümmerfeld beside it.
export function wayStamina(from, to, stats, fx, overloaded = false) {
  if (from.id === to.id || besideTheCamp(to)) return 0;
  const speed = Math.max(FASTEST_SHARE, 1 - TRAVEL_SPEEDUP_PER_AUSDAUER * (stats.ausdauer.level - 1));
  const base = Math.max(1, Math.round((distance(from, to) / TRAVEL_UNITS_PER_STAMINA) * speed));
  return Math.max(1, base + fx.reise) + (overloaded ? OVERLOAD_TRAVEL_EXTRA : 0);
}
