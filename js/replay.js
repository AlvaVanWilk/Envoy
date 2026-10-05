// Recalculates the complete game state from the list of events.
// It walks through every calendar day from the first event until today:
//   1. apply the day's events in the order they happened: XP for finished
//      tasks, the stages of their exercises, and everything done in the world
//   2. when the day is over: malus for every stat whose task was not done,
//      then take off equipment whose requirements are no longer met.
// Achievements are checked along the way; a bonus they give counts from
// the moment they were reached.
// Same events + same catalog = same result on every device.

import {
  STAT_IDS, MALUS_AVERAGE_WINDOW, INTENSITY_UP_AFTER, INTENSITY_DOWN_AFTER, CHILD_UP_AFTER,
  INTENSITY_DOWN_AFTER_MISSED_DAYS, TOO_MUCH,
} from './config.js';
import { addXp, removeXp, malusFactor, average } from './formulas.js';
import { dayRange, addDays, morningMs } from './days.js';
import { compareEvents } from './events.js';
import { initialWorld, applyWorldEvent, restFromTask, checkEquipment, advance, wakeUp } from './world/worldstate.js';
import { checkAchievements, bonusOf, withBonus } from './achievements.js';
import { taskFor, taskOfDone, resultOf, ageOn, isChild } from './tasks.js';

export { unmetRequirements } from './world/items.js';

const HISTORY_DAYS = 30;
const TASK_TYPES = new Set(['plan', 'done', 'teil', 'undo', 'mode']);

function initialStats() {
  const stats = {};
  for (const id of STAT_IDS) stats[id] = { level: 1, xp: 0, maxLevel: 1, missed: 0 };
  return stats;
}

// The stage of every exercise (by its key, see tasks.js), all at 1 to begin with.
// fresh: the stage changed and the exercise was not done since.
function initialIntensity(catalog) {
  const intensity = {};
  for (const stat of STAT_IDS) {
    for (const exercise of catalog.units?.[stat] || []) intensity[exercise.key] = { level: 1, good: 0, hard: 0, fresh: false };
  }
  return intensity;
}

// Up after two good runs in a row, down after two too hard ones in a row;
// a run that is neither breaks the row. A child is not asked: each run counts
// as good, up after CHILD_UP_AFTER of them.
function applyResult(entry, result, maxLevel, upAfter = INTENSITY_UP_AFTER) {
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
    if (next.good >= upAfter) {
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
  const intensity = initialIntensity(catalog);
  const stagesOf = new Map(STAT_IDS.flatMap((stat) => (catalog.units?.[stat] || []).map((x) => [x.key, x.stages.length])));
  let intensityAtDayStart = intensity;
  let statsAtDayStart = { ...stats };
  const recentGains = Object.fromEntries(STAT_IDS.map((id) => [id, []]));
  const history = Object.fromEntries(STAT_IDS.map((id) => [id, []]));
  const log = [];                   // every day: which exercises, done or not, and the gain
  // real totals: minutes of stairs (an old floor counts as one), kilometres from earlier versions
  const totals = { treppe_min: 0, km: 0, stockwerke: 0 };
  const earned = {};                // achievement id -> { day, t }
  let lastT = 0;                    // moment of the latest event so far
  let sick = false;
  let todayDone = {};
  let todayParts = {};              // stat -> { row id: { id, antwort } }: exercises done of a task not done yet

  const firstEvent = sorted.find((e) => e.d <= today);
  const firstDay = firstEvent ? firstEvent.d : today;
  const world = initialWorld(catalog, firstEvent ? firstEvent.t : now, stats);
  const ctx = { catalog, stats };
  const historyFrom = addDays(today, -HISTORY_DAYS);

  for (const day of dayRange(firstDay, today)) {
    intensityAtDayStart = { ...intensity };
    statsAtDayStart = { ...stats };
    const done = {};
    const parts = {};
    // the morning: with a Schlafplatz the Envoy wakes up rested (not on the first day)
    let awake = day === firstDay;
    const morning = morningMs(day);
    const wake = (t) => {
      if (awake || t < morning) return;
      awake = true;
      wakeUp(world, morning, ctx);
    };

    for (const e of byDay.get(day) || []) {
      wake(e.t);
      lastT = e.t;
      if (!TASK_TYPES.has(e.type)) {
        applyWorldEvent(world, e, ctx);
        checkAchievements(earned, { world, stats, totals }, day, e.t);
      } else if (e.type === 'plan') {
        // from earlier versions, when the exercise of a day was picked
        // ahead; the task of an area now follows from its stages
      } else if (e.type === 'mode') {
        sick = Boolean(e.sick);
      } else if (e.type === 'teil') {
        // one exercise of a task with several; it counts once the task is done
        if (undone.has(e.id) || done[e.stat] || !STAT_IDS.includes(e.stat) || typeof e.teil !== 'string') continue;
        parts[e.stat] = { ...parts[e.stat], [e.teil]: { id: e.id, antwort: typeof e.antwort === 'string' ? e.antwort : null } };
      } else if (e.type === 'done') {
        if (undone.has(e.id) || done[e.stat] || !STAT_IDS.includes(e.stat)) continue;
        const gain = withBonus(e.xp, bonusOf(earned, 'tageswerk', e.t));
        done[e.stat] = { ...e, gain };
        stats[e.stat] = addXp(stats[e.stat], gain);
        // measured values from earlier versions
        if (e.m) {
          totals.km += Number(e.m.strecke_km) || 0;
          totals.stockwerke += Number(e.m.stockwerke) || 0;
          totals.treppe_min += Number(e.m.stockwerke) || 0;
        }
        if (e.stat === 'ausdauer') totals.treppe_min += (taskOfDone(e, catalog)?.seconds || 0) / 60;
        // every exercise of the task: its answer counts for its stage
        // („zu viel“ for all of them), nothing in Krankheitsmodus; a child's
        // run counts as good without a question
        const child = isChild(ageOn(world.envoy, day));
        for (const id of Array.isArray(e.teile) ? e.teile : []) {
          const row = catalog.exerciseById.get(id);
          if (!row || !intensity[row.uebung]) continue;
          const entry = { ...intensity[row.uebung], fresh: false };
          let result = e.sick ? null : resultOf(e.zuviel ? TOO_MUCH : e.antworten?.[id]);
          if (!result && child && !e.sick) result = 'good';
          intensity[row.uebung] = result
            ? applyResult(entry, result, stagesOf.get(row.uebung), child ? CHILD_UP_AFTER : INTENSITY_UP_AFTER)
            : entry;
        }
        restFromTask(world, e.t, ctx);
      }
    }

    // no event after the morning: it came all the same (today only if it is past)
    wake(day === today ? now : Infinity);

    // what was done; on the last day also what is still open
    // teile: the rows of the exercises; ex: the exercise of an earlier version
    const tasks = {};
    for (const stat of STAT_IDS) {
      if (done[stat]) {
        tasks[stat] = { teile: done[stat].teile || null, ex: done[stat].ex || null, done: true, gain: done[stat].gain };
      } else if (day === today) {
        const open = taskFor(stat, intensityAtDayStart, sick, catalog, ageOn(world.envoy, day));
        if (open) tasks[stat] = { teile: open.parts.map((p) => p.row.id), ex: null, done: false, gain: 0 };
      }
    }
    if (Object.keys(tasks).length > 0) log.push({ day, tasks, sick });

    if (day === today) {
      todayDone = done;
      todayParts = Object.fromEntries(Object.entries(parts).filter(([stat]) => !done[stat]));
      for (const stat of STAT_IDS) {
        if (done[stat]) history[stat].push({ day, kind: 'gain', xp: done[stat].gain, level: stats[stat].level, levelXp: stats[stat].xp });
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
        if (day >= historyFrom) history[stat].push({ day, kind: 'gain', xp: done[stat].gain, level: before.level, levelXp: before.xp });
      } else {
        const missed = before.missed + 1;
        const malus = Math.round(malusFactor(missed) * average(recentGains[stat]));
        const after = malus > 0 ? removeXp(before, malus) : before;
        stats[stat] = { ...after, missed };
        if (day >= historyFrom) history[stat].push({ day, kind: 'missed', missed, xp: -malus, level: after.level, levelXp: after.xp });
        // A long break lowers the stage of every exercise of the area, so
        // coming back is easy.
        if (missed % INTENSITY_DOWN_AFTER_MISSED_DAYS === 0) {
          for (const exercise of catalog.units?.[stat] || []) {
            const entry = intensity[exercise.key];
            if (entry.level > 1) intensity[exercise.key] = { level: entry.level - 1, good: 0, hard: 0, fresh: true };
          }
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
    age: ageOn(world.envoy, today),
    todayDone,
    todayParts,
    history,
    log,
    totals,
    world,
    achievements: earned,
    envoy: world.envoy,
    equipped: world.equipped,
    dropped: world.dropped,
  };
}
