// The core formulas. Pure functions, no state.

import {
  STAT_MIN_LEVEL, STAT_MAX_LEVEL,
  MALUS_GRACE_DAYS, MALUS_SMALL_UNTIL_DAY, MALUS_SMALL_FACTOR, MALUS_FULL_FACTOR,
  FLOOR_SHARE,
} from './config.js';

// XP needed to go from level n to n + 1, rounded to whole XP.
// Up to level 10 only the first part applies; from there the curve steepens.
export function xpToNext(n) {
  const raw = 45 * n ** 0.45 * (1 + (Math.max(0, n - 9) / 6) ** 2);
  return Math.round(raw);
}

// A stat as a number, as it is shown: the level, and after the point how far
// it is to the next one, in thousandths (1.375). Never rounded up, so the
// number before the point is always the level (1.999 is still level 1). At
// the highest level only the level. -> { whole: '1', part: '.375' }
export function statValue({ level, xp }) {
  if (level >= STAT_MAX_LEVEL) return { whole: String(level), part: '' };
  const thousandths = Math.max(0, Math.min(999, Math.floor((1000 * xp) / xpToNext(level))));
  return { whole: String(level), part: `.${String(thousandths).padStart(3, '0')}` };
}

export const statText = (stat) => {
  const { whole, part } = statValue(stat);
  return whole + part;
};

// Share of the average daily gain that is lost on the given missed day.
// missedDay 1 = first day in a row without the task.
export function malusFactor(missedDay) {
  if (missedDay <= MALUS_GRACE_DAYS) return 0;
  if (missedDay <= MALUS_SMALL_UNTIL_DAY) return MALUS_SMALL_FACTOR;
  return MALUS_FULL_FACTOR;
}

// The lowest point a stat can sink to, as a fractional level:
// 60 % of the highest level reached. Level 3 as best gives 1.8,
// meaning level 1 with the bar 80 % full.
export function floorPosition(maxLevelReached) {
  return Math.max(STAT_MIN_LEVEL, FLOOR_SHARE * maxLevelReached);
}

// Turns a fractional level into { level, xp }.
export function fromPosition(position) {
  const level = Math.floor(position);
  const xp = Math.round((position - level) * xpToNext(level));
  return { level, xp };
}

export function toPosition(level, xp) {
  return level + xp / xpToNext(level);
}

// Adds XP to a stat. Returns a new stat object; levels up as often as needed.
export function addXp(stat, amount) {
  let { level, xp, maxLevel } = stat;
  xp += amount;
  while (level < STAT_MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
  }
  if (level >= STAT_MAX_LEVEL) {
    level = STAT_MAX_LEVEL;
    xp = 0;
  }
  return { ...stat, level, xp, maxLevel: Math.max(maxLevel, level) };
}

// Removes XP from a stat. When the bar runs empty the stat drops a level
// and the bar continues backwards there. Never below the floor.
export function removeXp(stat, amount) {
  let { level, xp } = stat;
  xp -= amount;
  while (xp < 0 && level > STAT_MIN_LEVEL) {
    level -= 1;
    xp += xpToNext(level);
  }
  if (xp < 0) xp = 0;

  const floor = floorPosition(stat.maxLevel);
  if (toPosition(level, xp) < floor) {
    ({ level, xp } = fromPosition(floor));
  }
  return { ...stat, level, xp };
}

// Average of the given daily gains; 0 if there are none yet.
export function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
