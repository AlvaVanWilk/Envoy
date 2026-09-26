// Decides which exercise is today's task in each area.
// The person never chooses. The app picks from the catalog:
//   1. the current intensity level of the area (set by earlier feedback)
//   2. not the same exercise as yesterday, if there is another one
//   3. not the same muscle group as yesterday, if there is another one
//   4. of the rest, the one that was assigned longest ago
// Remaining ties are broken by a number derived from the date, so every
// device picks the same exercise for the same day.

import { STAT_IDS } from './config.js';

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// The level actually used: the highest level at or below the target that
// has exercises; if there is none below, the lowest level that exists.
export function effectiveLevel(exercises, target) {
  const levels = [...new Set(exercises.map((x) => x.stufe))].sort((a, b) => a - b);
  if (levels.length === 0) return null;
  const atOrBelow = levels.filter((l) => l <= target);
  return atOrBelow.length > 0 ? atOrBelow[atOrBelow.length - 1] : levels[0];
}

export function pickExercise({ stat, exercises, intensityLevel, yesterdayExerciseId, lastUsed, day }) {
  const own = exercises.filter((x) => x.stat === stat);
  const level = effectiveLevel(own, intensityLevel);
  if (level === null) return null;

  let pool = own.filter((x) => x.stufe === level);

  const notYesterday = pool.filter((x) => x.id !== yesterdayExerciseId);
  if (notYesterday.length > 0) pool = notYesterday;

  const yesterday = exercises.find((x) => x.id === yesterdayExerciseId);
  if (yesterday && yesterday.muskelgruppe) {
    const otherGroup = pool.filter((x) => x.muskelgruppe !== yesterday.muskelgruppe);
    if (otherGroup.length > 0) pool = otherGroup;
  }

  const sorted = [...pool].sort((a, b) => {
    const ua = lastUsed[a.id] || '';
    const ub = lastUsed[b.id] || '';
    if (ua !== ub) return ua < ub ? -1 : 1;
    return hash(day + a.id) - hash(day + b.id);
  });
  return sorted[0];
}

// For every area without a plan for today, pick an exercise.
// Returns { stat: exercise } for the areas that still need a plan event.
export function missingPlans(state, catalog) {
  const result = {};
  for (const stat of STAT_IDS) {
    if (state.todayPlan[stat] || state.todayDone[stat]) continue;
    const exercise = pickExercise({
      stat,
      exercises: catalog.exercises,
      intensityLevel: state.intensityAtDayStart[stat].level,
      yesterdayExerciseId: state.yesterdayExercise[stat],
      lastUsed: state.lastUsed,
      day: state.today,
    });
    if (exercise) result[stat] = exercise;
  }
  return result;
}
