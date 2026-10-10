// The daily task of each area. Each area is one unit: all its exercises, in
// the order of the table, every day. The person never chooses; the app
// decides at which stage each exercise is done (see replay.js: levels go up
// after two good runs in a row and down after two too hard ones).
//
// Children and young people have exercises of their own (column `alter`,
// see exercisesFor); the age comes from the creation of the Envoy.
//
// A task: { stat, parts, xp, seconds, sick }
//   parts  [{ key, row, level, top, fresh, phases, seconds }]
//          row     the line of the table for this exercise at this stage
//          top     no higher stage exists (then nothing is asked about it)
//          fresh   the stage changed since it was last done
//          phases  [{ label, s, skizze }]: the time of the exercise, maybe in
//                  parts (one side, the other side), see the column `zeit`;
//                  skizze: a part with a moving figure of its own
//   xp     what the task brings: the sum of its exercises, XP_MIN when sick
//
// Krankheitsmodus: every exercise at stage 1; one with only one stage takes
// half its time. Answers given then do not count for the stages.

import { XP_MIN, SICK_TIME_SHARE, ANSWERS, TOO_MUCH, CHILD_UNTIL } from './config.js';
import { seededRandom } from './world/rng.js';

const sum = (list, f) => list.reduce((total, x) => total + f(x), 0);

// The exercise of a group for a day (column `gruppe`, e.g. Treppe, Laufen
// auf der Stelle, Knie heben): the app picks, the same on every device.
export function choiceFor(exercise, level, day) {
  const rows = exercise.choices?.[level - 1] || [exercise.stages[level - 1]];
  if (rows.length === 1) return rows[0];
  return rows[Math.floor(seededRandom(`${day}|${exercise.key}`)() * rows.length)];
}

function part(exercise, level, sick, fresh, row) {
  const share = sick && exercise.stages.length === 1 ? SICK_TIME_SHARE : 1;
  const phases = row.phasen.map((p) => ({ ...p, s: Math.round(p.s * share) }));
  return {
    key: exercise.key,
    row,
    level,
    top: level >= exercise.stages.length,
    fresh: Boolean(fresh),
    phases,
    seconds: sum(phases, (p) => p.s),
  };
}

function taskOf(stat, parts, sick) {
  return {
    stat,
    parts,
    xp: sick ? XP_MIN : sum(parts, (p) => p.row.xp),
    seconds: sum(parts, (p) => p.seconds),
    sick,
  };
}

// The age the person turns in the year of `day` (from the year of birth of
// the Envoy), or null when no age was given.
export function ageOn(envoy, day) {
  const born = envoy?.geburtsjahr;
  return Number.isInteger(born) ? Number(day.slice(0, 4)) - born : null;
}

// The exercises of an area for this age (column `alter`); without an age,
// those for grown-ups (the ones without an upper end).
export function exercisesFor(stat, age, catalog) {
  return (catalog.units?.[stat] || []).filter((exercise) => {
    const [from, to] = exercise.alter || [0, null];
    if (age === null) return to === null;
    return from <= age && (to === null || age <= to);
  });
}

// The task of an area with the given stages (state.intensityAtDayStart for
// today: an answer given today changes the task of tomorrow) for a person
// of this age (see ageOn), on this day (see choiceFor).
export function taskFor(stat, levels, sick, catalog, age = null, day = '') {
  const parts = exercisesFor(stat, age, catalog).map((exercise) => {
    const entry = levels[exercise.key];
    const level = sick ? 1 : Math.min(Math.max(1, entry?.level || 1), exercise.stages.length);
    return part(exercise, level, sick, !sick && entry?.fresh, choiceFor(exercise, level, day));
  });
  return parts.length > 0 ? { ...taskOf(stat, parts, sick), child: isChild(age) } : null;
}

// A child is not asked after an exercise (see CHILD_UNTIL).
export const isChild = (age) => age !== null && age <= CHILD_UNTIL;

// The task as it was done (from its `done` event), or null for a task from
// before the exercises were units (its exercise is not in the table anymore).
export function taskOfDone(done, catalog) {
  if (!Array.isArray(done.teile)) return null;
  const parts = [];
  for (const id of done.teile) {
    const row = catalog.exerciseById.get(id);
    const exercise = row && (catalog.units?.[row.stat] || []).find((x) => x.key === row.uebung);
    if (exercise) parts.push(part(exercise, row.stufe, Boolean(done.sick), false, row));
  }
  return parts.length > 0 ? { ...taskOf(done.stat, parts, Boolean(done.sick)), xp: done.xp } : null;
}

// The questions after a task: one for each exercise that has one and a
// higher stage to go to. None in Krankheitsmodus, none for children.
// -> [{ part, answers: [{ id, label, result }] }]
export function questionsOf(task) {
  if (task.sick || task.child) return [];
  return task.parts
    .filter((p) => p.row.frage && !p.top && ANSWERS[p.row.antwort])
    .map((p) => ({ part: p, answers: ANSWERS[p.row.antwort] }));
}

// „Das war heute zu viel“ is offered while it can lower something.
export const canBeTooMuch = (task) => !task.sick && task.parts.some((p) => p.level > 1);

// How an answer counts for the stage: 'good', 'neutral', 'hard', or null.
export function resultOf(answer) {
  if (answer === TOO_MUCH) return 'hard';
  for (const list of Object.values(ANSWERS)) {
    const found = list.find((a) => a.id === answer);
    if (found) return found.result;
  }
  return null;
}
