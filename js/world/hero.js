// What the hero can do in the world, derived from the four stats and the
// abilities of worn equipment and home furniture. Equipment never raises
// a stat; it only adds abilities such as extra damage or dodging.

import {
  STAT_IDS, STAMINA_BASE, STAMINA_PER_AUSDAUER, STAMINA_REFILL_HOURS,
  STAMINA_BONUS_PER_GELASSENHEIT,
} from '../config.js';

const EMPTY = { schaden: 0, treffer: 0, ausweichen: 0, beruhigen: 0, reise: 0, erholung: 0, glueck: 0 };

function addEffects(total, effects) {
  for (const [key, value] of Object.entries(effects || {})) total[key] = (total[key] || 0) + value;
  return total;
}

// All abilities from worn items, placed furniture and the home itself.
export function effects(world, catalog) {
  const total = { ...EMPTY };
  for (const inst of Object.values(world.equipped)) {
    const entry = world.items[inst];
    const item = entry && catalog.itemById.get(entry.id);
    if (item) addEffects(total, item.effekt);
  }
  for (const inst of world.placed) {
    const entry = world.items[inst];
    const piece = entry && catalog.furnitureById.get(entry.id);
    if (piece) addEffects(total, piece.effekt);
  }
  const tier = catalog.home[world.home - 1];
  if (tier) total.erholung += tier.erholung;
  return total;
}

// Average of the four stats: how strong the hero is overall.
export function heroPower(stats) {
  return STAT_IDS.reduce((sum, id) => sum + stats[id].level, 0) / STAT_IDS.length;
}

export function maxStamina(stats) {
  return STAMINA_BASE + STAMINA_PER_AUSDAUER * stats.ausdauer.level;
}

export function staminaPerHour(stats, fx) {
  const speed = 1 + STAMINA_BONUS_PER_GELASSENHEIT * stats.gelassenheit.level + fx.erholung / 100;
  return (maxStamina(stats) / STAMINA_REFILL_HOURS) * speed;
}

// The bar refills over time. Returns the value at time t.
export function staminaAt(world, t, stats, fx) {
  const max = maxStamina(stats);
  const hours = Math.max(0, t - world.stamina.at) / 3600000;
  return Math.min(max, world.stamina.value + hours * staminaPerHour(stats, fx));
}

// Hours until the bar is full again.
export function hoursUntilFull(world, t, stats, fx) {
  const missing = maxStamina(stats) - staminaAt(world, t, stats, fx);
  return missing <= 0 ? 0 : missing / staminaPerHour(stats, fx);
}

// Values used in a fight against a monster.
export function fighter(stats, fx, monster) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const agilityGap = stats.beweglichkeit.level - monster.gewandtheit;
  return {
    life: 8 + 3 * stats.ausdauer.level,
    damage: 1 + Math.round(0.6 * stats.kraft.level) + fx.schaden,
    hit: clamp(0.65 + 0.04 * agilityGap + fx.treffer / 100, 0.15, 0.95),
    dodge: clamp(0.08 + 0.03 * agilityGap + fx.ausweichen / 100, 0, 0.6),
    calm: monster.calmable
      ? clamp(0.04 + 0.04 * (stats.gelassenheit.level - monster.stufe) + fx.beruhigen / 100, 0, 0.5)
      : 0,
    luck: fx.glueck,
  };
}

// Chance to pass a check of the given stat against a difficulty.
export function checkChance(statLevel, difficulty, luck = 0) {
  return Math.min(0.95, Math.max(0.05, 0.6 + 0.08 * (statLevel - difficulty) + luck / 400));
}
