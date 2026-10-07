// Ausrüstung mit Boni (since version 5.13). A piece of clothing that is found
// on the way, dropped by a spirit or offered by the trader gets a Güte, and
// with it so many bonuses. A bonus never raises a stat (Kraft, Ausdauer,
// Beweglichkeit, Gelassenheit stay the work of the real exercises); it helps
// in the world: more damage, hitting and dodging, calming spirits, Energie
// refilling faster, more luck with Bannsplitter and finds. The bigger the
// Envoy's stats when the piece turns up, the bigger its bonuses. A piece that
// asks something of the Envoy offers something in return (since 5.20.5, so
// gewünscht): its bonuses are as big as if he were stronger by its
// requirement, and it is never plain. Wearing it takes the stats, and those
// come only from the real exercises.
//
// An owned piece keeps its Güte and bonuses: entry.guete, entry.bonus = { schaden: 2, … }

import { QUALITIES, QUALITY_CHANCES, BONUSES } from '../config.js';

export const qualityById = (id) => QUALITIES.find((q) => q.id === id) || null;
export const bonusById = (id) => BONUSES.find((b) => b.id === id) || null;

// The size of a bonus for an Envoy of this strength (average of the stats):
// from `base` at strength 1, growing by `perLevel`, a little up or down by chance.
function bonusSize(bonus, power, rng) {
  const exact = bonus.base + bonus.perLevel * Math.max(0, power - 1);
  return Math.max(1, Math.round(exact * (0.8 + 0.4 * rng())));
}

// Güte and bonuses for a piece from `origin` (fund, beute, haendler, …):
// {} for a plain one, else { guete, bonus }. power: the Envoy's strength,
// level: the requirement of the piece (see itemLevel in items.js, 0 = none).
export function rollBonuses(origin, power, rng, level = 0) {
  const base = QUALITY_CHANCES[origin] || QUALITY_CHANCES.fund;
  // with a requirement never plain: the share of schlicht goes to gut
  const chances = level > 0 ? [0, base[0] + base[1], ...base.slice(2)] : base;
  const total = chances.reduce((sum, n) => sum + n, 0);
  let pick = rng() * total;
  let index = 0;
  while (index < chances.length - 1 && pick >= chances[index]) { pick -= chances[index]; index += 1; }
  const quality = QUALITIES[index];
  if (quality.bonuses === 0) return {};
  const left = [...BONUSES];
  const bonus = {};
  for (let n = 0; n < quality.bonuses && left.length > 0; n += 1) {
    const [chosen] = left.splice(Math.floor(rng() * left.length), 1);
    bonus[chosen.id] = bonusSize(chosen, power + level, rng);
  }
  return { guete: quality.id, bonus };
}

// Güte and bonuses as they may stand in an event: only known bonuses, whole
// numbers within reason.
export function cleanBonuses(thing) {
  const quality = qualityById(thing?.guete);
  if (!quality || quality.bonuses === 0 || !thing.bonus || typeof thing.bonus !== 'object') return {};
  const bonus = {};
  for (const [id, value] of Object.entries(thing.bonus)) {
    const n = Math.round(Number(value));
    if (bonusById(id) && Number.isFinite(n) && n > 0) bonus[id] = Math.min(n, 100);
  }
  return Object.keys(bonus).length > 0 ? { guete: quality.id, bonus } : {};
}

// How many bonuses a piece has (for its price).
export const bonusCount = (entry) => Object.keys(entry?.bonus || {}).length;
