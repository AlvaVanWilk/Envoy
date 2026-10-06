// Distances on the map, and how long a way is, counted in Energie. Every
// expedition starts and ends at the camp; each point of a way is 10 seconds
// on the way. Since version 5.12 ways cost no Energie, only this time (see
// RULE_SETS in config.js).

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

// The length of one way, in Energie: further is longer. Every level of
// Ausdauer makes the way 3 % shorter (at most half), boots and cloaks make it
// shorter as well, an over-full backpack longer. At least 1, and nothing between the camp and
// the Trümmerfeld beside it, or within one place.
export function wayStamina(from, to, stats, fx, overloaded = false) {
  if (from.id === to.id || (besideTheCamp(from) && besideTheCamp(to))) return 0;
  const speed = Math.max(FASTEST_SHARE, 1 - TRAVEL_SPEEDUP_PER_AUSDAUER * (stats.ausdauer.level - 1));
  const base = Math.max(1, Math.round((distance(from, to) / TRAVEL_UNITS_PER_STAMINA) * speed));
  return Math.max(1, base + fx.reise) + (overloaded ? OVERLOAD_TRAVEL_EXTRA : 0);
}
