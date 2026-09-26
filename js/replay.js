// Recalculates the complete game state from the list of events.
// It walks through every calendar day from the first event until today:
//   1. apply the day's events (XP for finished tasks, feedback, equipment)
//   2. when the day is over: malus for every stat whose task was not done,
//      then take off equipment whose requirements are no longer met.
// Same events + same catalog = same result on every device.

import {
  STAT_IDS, SLOT_IDS, MALUS_AVERAGE_WINDOW,
  INTENSITY_UP_AFTER, INTENSITY_DOWN_AFTER, FEEDBACK,
} from './config.js';
import { addXp, removeXp, malusFactor, average } from './formulas.js';
import { dayRange, addDays } from './days.js';
import { compareEvents } from './events.js';

const HISTORY_DAYS = 30;
const HARD_FEEDBACK = new Set(FEEDBACK.filter((f) => f.hard).map((f) => f.id));

function initialStats() {
  const stats = {};
  for (const id of STAT_IDS) stats[id] = { level: 1, xp: 0, maxLevel: 1, missed: 0 };
  return stats;
}

function initialIntensity() {
  const intensity = {};
  for (const id of STAT_IDS) intensity[id] = { level: 1, good: 0, hard: 0 };
  return intensity;
}

// Which requirements of `item` the current stats do not meet.
export function unmetRequirements(item, stats) {
  const unmet = [];
  for (const [stat, min] of Object.entries(item.req || {})) {
    if (min > 0 && stats[stat].level < min) unmet.push({ stat, min });
  }
  return unmet;
}

// Feedback moves the intensity: slowly up, quickly down.
function applyFeedback(entry, feedback, maxLevel) {
  const next = { ...entry };
  if (HARD_FEEDBACK.has(feedback)) {
    next.good = 0;
    next.hard += 1;
    if (next.hard >= INTENSITY_DOWN_AFTER) {
      next.level = Math.max(1, next.level - 1);
      next.hard = 0;
    }
  } else {
    next.hard = 0;
    next.good += 1;
    if (next.good >= INTENSITY_UP_AFTER) {
      next.level = Math.min(maxLevel, next.level + 1);
      next.good = 0;
    }
  }
  return next;
}

export function replay(events, catalog, today) {
  const sorted = [...events].sort(compareEvents);
  const undone = new Set(sorted.filter((e) => e.type === 'undo').map((e) => e.ref));
  const exerciseById = new Map(catalog.exercises.map((x) => [x.id, x]));
  const itemById = new Map(catalog.equipment.map((x) => [x.id, x]));

  const byDay = new Map();
  for (const e of sorted) {
    if (e.d > today) continue; // clock of another device ahead: wait for that day
    if (!byDay.has(e.d)) byDay.set(e.d, []);
    byDay.get(e.d).push(e);
  }

  const stats = initialStats();
  const intensity = initialIntensity();
  let intensityAtDayStart = intensity;
  const recentGains = Object.fromEntries(STAT_IDS.map((id) => [id, []]));
  const history = Object.fromEntries(STAT_IDS.map((id) => [id, []]));
  const lastUsed = {};              // exercise id -> last day it was assigned or done
  const dayExercise = {};           // day -> stat -> exercise id
  const equipped = {};              // slot -> item id
  const dropped = [];               // equipment taken off automatically
  let todayPlan = {};
  let todayDone = {};

  const firstDay = sorted.length > 0 && sorted[0].d <= today ? sorted[0].d : today;
  const historyFrom = addDays(today, -HISTORY_DAYS);

  for (const day of dayRange(firstDay, today)) {
    intensityAtDayStart = { ...intensity };
    const dayEvents = byDay.get(day) || [];
    const plan = {};
    const done = {};

    for (const e of dayEvents) {
      if (e.type === 'plan') {
        if (!plan[e.stat] && exerciseById.has(e.ex)) plan[e.stat] = e;
      } else if (e.type === 'done') {
        if (undone.has(e.id) || done[e.stat] || !STAT_IDS.includes(e.stat)) continue;
        done[e.stat] = e;
        stats[e.stat] = addXp(stats[e.stat], e.xp);
        intensity[e.stat] = applyFeedback(intensity[e.stat], e.fb, catalog.maxIntensity[e.stat] || 1);
      } else if (e.type === 'equip') {
        const item = itemById.get(e.item);
        if (item && item.slot === e.slot && unmetRequirements(item, stats).length === 0) {
          equipped[e.slot] = e.item;
        }
      } else if (e.type === 'unequip') {
        delete equipped[e.slot];
      }
    }
    dayExercise[day] = {};
    for (const stat of STAT_IDS) {
      const ex = done[stat]?.ex || plan[stat]?.ex;
      if (ex) {
        dayExercise[day][stat] = ex;
        lastUsed[ex] = day;
      }
    }

    if (day === today) {
      todayPlan = plan;
      todayDone = done;
      for (const stat of STAT_IDS) {
        if (done[stat]) history[stat].push({ day, kind: 'gain', xp: done[stat].xp, level: stats[stat].level });
      }
      break;
    }

    // The day is over.
    for (const stat of STAT_IDS) {
      const before = stats[stat];
      if (done[stat]) {
        recentGains[stat].push(done[stat].xp);
        if (recentGains[stat].length > MALUS_AVERAGE_WINDOW) recentGains[stat].shift();
        stats[stat] = { ...before, missed: 0 };
        if (day >= historyFrom) history[stat].push({ day, kind: 'gain', xp: done[stat].xp, level: before.level });
      } else {
        const missed = before.missed + 1;
        const malus = Math.round(malusFactor(missed) * average(recentGains[stat]));
        const after = malus > 0 ? removeXp(before, malus) : before;
        stats[stat] = { ...after, missed };
        if (day >= historyFrom) history[stat].push({ day, kind: 'missed', missed, xp: -malus, level: after.level });
      }
    }

    for (const slot of SLOT_IDS) {
      const item = itemById.get(equipped[slot]);
      if (!item) continue;
      const unmet = unmetRequirements(item, stats);
      if (unmet.length > 0) {
        delete equipped[slot];
        dropped.push({ day, slot, item: item.id, unmet });
      }
    }
  }

  // Items that vanished from the catalog are not shown.
  for (const slot of Object.keys(equipped)) if (!itemById.has(equipped[slot])) delete equipped[slot];

  return {
    today,
    firstDay,
    stats,
    intensity,
    intensityAtDayStart,
    todayPlan,
    todayDone,
    history,
    lastUsed,
    yesterdayExercise: dayExercise[addDays(today, -1)] || {},
    equipped,
    dropped,
  };
}
