// Recalculates the complete game state from the list of events.
// It walks through every calendar day from the first event until today:
//   1. apply the day's events in the order they happened: XP for finished
//      tasks, intensity changes, and everything done in the world
//   2. when the day is over: malus for every stat whose task was not done,
//      then take off equipment whose requirements are no longer met.
// Achievements are checked along the way; a bonus they give counts from
// the moment they were reached.
// Same events + same catalog = same result on every device.

import {
  STAT_IDS, MALUS_AVERAGE_WINDOW, INTENSITY_UP_AFTER, INTENSITY_DOWN_AFTER,
  INTENSITY_DOWN_AFTER_MISSED_DAYS, RATIO_GOOD, RATIO_HARD, FEEDBACK,
} from './config.js';
import { addXp, removeXp, malusFactor, average } from './formulas.js';
import { dayRange, addDays } from './days.js';
import { compareEvents } from './events.js';
import { initialWorld, applyWorldEvent, restFromTask, checkEquipment, advance } from './world/worldstate.js';
import { checkAchievements, bonusOf, withBonus } from './achievements.js';

export { unmetRequirements } from './world/items.js';

const HISTORY_DAYS = 30;
const HARD_FEEDBACK = new Set(FEEDBACK.filter((f) => f.hard).map((f) => f.id));
const TASK_TYPES = new Set(['plan', 'done', 'undo', 'mode']);

function initialStats() {
  const stats = {};
  for (const id of STAT_IDS) stats[id] = { level: 1, xp: 0, maxLevel: 1, missed: 0 };
  return stats;
}

function initialIntensity() {
  const intensity = {};
  for (const id of STAT_IDS) intensity[id] = { level: 1, good: 0, hard: 0, fresh: false };
  return intensity;
}

// How a finished task counts for the intensity: 'good', 'hard', 'neutral',
// or null when it does not count (Krankheitsmodus).
export function runResult(done) {
  if (done.sick) return null;
  const value = done.m && done.mk ? done.m[done.mk] : undefined;
  if (typeof value === 'number' && done.z > 0) {
    const ratio = value / done.z;
    if (ratio >= RATIO_GOOD) return 'good';
    if (ratio < RATIO_HARD) return 'hard';
    return 'neutral';
  }
  if (done.fb) return HARD_FEEDBACK.has(done.fb) ? 'hard' : 'good';
  return 'good';
}

// Slowly up, quickly down.
function applyResult(entry, result, maxLevel) {
  const next = { ...entry, fresh: false };
  if (result === 'hard') {
    next.good = 0;
    next.hard += 1;
    if (next.hard >= INTENSITY_DOWN_AFTER) {
      next.level = Math.max(1, next.level - 1);
      next.hard = 0;
      next.fresh = next.level !== entry.level;
    }
  } else if (result === 'good') {
    next.hard = 0;
    next.good += 1;
    if (next.good >= INTENSITY_UP_AFTER) {
      next.level = Math.min(maxLevel, next.level + 1);
      next.good = 0;
      next.fresh = next.level !== entry.level;
    }
  } else {
    next.good = 0;
    next.hard = 0;
  }
  return next;
}

export function replay(events, catalog, today, now = Date.now()) {
  const sorted = [...events].sort(compareEvents);
  const undone = new Set(sorted.filter((e) => e.type === 'undo').map((e) => e.ref));

  const byDay = new Map();
  for (const e of sorted) {
    if (e.d > today) continue; // clock of another device ahead: wait for that day
    if (!byDay.has(e.d)) byDay.set(e.d, []);
    byDay.get(e.d).push(e);
  }

  const stats = initialStats();
  const intensity = initialIntensity();
  let intensityAtDayStart = intensity;
  let statsAtDayStart = { ...stats };
  const recentGains = Object.fromEntries(STAT_IDS.map((id) => [id, []]));
  const history = Object.fromEntries(STAT_IDS.map((id) => [id, []]));
  const lastUsed = {};              // exercise id -> last day it was assigned or done
  const doneCount = {};             // exercise id -> how often it was done
  const dayExercise = {};           // day -> stat -> exercise id
  const log = [];                   // every day: which exercise, done or not, and the gain
  const totals = { km: 0, stockwerke: 0 };
  const earned = {};                // achievement id -> { day, t }
  let lastT = 0;                    // moment of the latest event so far
  let sick = false;
  let todayPlan = {};
  let todayDone = {};

  const firstEvent = sorted.find((e) => e.d <= today);
  const firstDay = firstEvent ? firstEvent.d : today;
  const world = initialWorld(catalog, firstEvent ? firstEvent.t : now, stats);
  const ctx = { catalog, stats };
  const historyFrom = addDays(today, -HISTORY_DAYS);

  for (const day of dayRange(firstDay, today)) {
    intensityAtDayStart = { ...intensity };
    statsAtDayStart = { ...stats };
    const plan = {};
    const done = {};

    for (const e of byDay.get(day) || []) {
      lastT = e.t;
      if (!TASK_TYPES.has(e.type)) {
        applyWorldEvent(world, e, ctx);
        checkAchievements(earned, { world, stats, totals }, day, e.t);
      } else if (e.type === 'plan') {
        // the latest assignment counts, as long as the task is still open
        if (!done[e.stat] && catalog.exerciseById.has(e.ex)) plan[e.stat] = e;
      } else if (e.type === 'mode') {
        sick = Boolean(e.sick);
      } else if (e.type === 'done') {
        if (undone.has(e.id) || done[e.stat] || !STAT_IDS.includes(e.stat)) continue;
        const gain = withBonus(e.xp, bonusOf(earned, 'tageswerk', e.t));
        done[e.stat] = { ...e, gain };
        stats[e.stat] = addXp(stats[e.stat], gain);
        doneCount[e.ex] = (doneCount[e.ex] || 0) + 1;
        if (e.m) {
          totals.km += Number(e.m.strecke_km) || 0;
          totals.stockwerke += Number(e.m.stockwerke) || 0;
        }
        const result = runResult(e);
        if (result) intensity[e.stat] = applyResult(intensity[e.stat], result, catalog.maxIntensity[e.stat] || 1);
        if (e.stat === 'gelassenheit') restFromTask(world, e.t, ctx);
      }
    }

    dayExercise[day] = {};
    const tasks = {};
    for (const stat of STAT_IDS) {
      const ex = done[stat]?.ex || plan[stat]?.ex;
      if (ex) {
        dayExercise[day][stat] = ex;
        lastUsed[ex] = day;
        tasks[stat] = { ex, done: Boolean(done[stat]), gain: done[stat]?.gain || 0 };
      }
    }
    if (Object.keys(tasks).length > 0) log.push({ day, tasks, sick });

    if (day === today) {
      todayPlan = plan;
      todayDone = done;
      for (const stat of STAT_IDS) {
        if (done[stat]) history[stat].push({ day, kind: 'gain', xp: done[stat].gain, level: stats[stat].level });
      }
      break;
    }

    // The day is over.
    for (const stat of STAT_IDS) {
      const before = stats[stat];
      if (done[stat]) {
        recentGains[stat].push(done[stat].gain);
        if (recentGains[stat].length > MALUS_AVERAGE_WINDOW) recentGains[stat].shift();
        stats[stat] = { ...before, missed: 0 };
        if (day >= historyFrom) history[stat].push({ day, kind: 'gain', xp: done[stat].gain, level: before.level });
      } else {
        const missed = before.missed + 1;
        const malus = Math.round(malusFactor(missed) * average(recentGains[stat]));
        const after = malus > 0 ? removeXp(before, malus) : before;
        stats[stat] = { ...after, missed };
        if (day >= historyFrom) history[stat].push({ day, kind: 'missed', missed, xp: -malus, level: after.level });
        // A long break lowers the exercise intensity, so coming back is easy.
        if (missed % INTENSITY_DOWN_AFTER_MISSED_DAYS === 0 && intensity[stat].level > 1) {
          intensity[stat] = { level: intensity[stat].level - 1, good: 0, hard: 0, fresh: true };
        }
      }
    }
    checkEquipment(world, ctx, day);
    checkAchievements(earned, { world, stats, totals }, day, lastT);
  }
  // An expedition that is back by now counts.
  advance(world, now, ctx);

  return {
    today,
    now,
    firstDay,
    stats,
    statsAtDayStart,
    intensity,
    intensityAtDayStart,
    sick,
    todayPlan,
    todayDone,
    history,
    log,
    lastUsed,
    doneCount,
    totals,
    yesterdayExercise: dayExercise[addDays(today, -1)] || {},
    world,
    achievements: earned,
    envoy: world.envoy,
    equipped: world.equipped,
    dropped: world.dropped,
  };
}
