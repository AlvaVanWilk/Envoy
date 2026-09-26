// Distances on the map and what a journey costs.

import { MAP_ASPECT, TRAVEL_UNITS_PER_STAMINA, OVERLOAD_TRAVEL_EXTRA } from '../config.js';

export function distance(a, b) {
  const dx = (a.x - b.x) * MAP_ASPECT;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Stamina for walking from one place to another: at least 1.
// Boots and cloaks can make it cheaper, an over-full backpack dearer.
export function travelCost(from, to, fx, overloaded = false) {
  if (from.id === to.id) return 0;
  const base = Math.max(1, Math.round(distance(from, to) / TRAVEL_UNITS_PER_STAMINA));
  return Math.max(1, base + fx.reise) + (overloaded ? OVERLOAD_TRAVEL_EXTRA : 0);
}
