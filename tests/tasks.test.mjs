// The daily tasks: each area one unit of exercises, every exercise with its
// own stage; up after two good runs in a row, down after two too hard ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { taskFor, taskOfDone, questionsOf, canBeTooMuch, resultOf } from '../js/tasks.js';
import { addDays } from '../js/days.js';
import { XP_MIN, XP_MAX } from '../js/config.js';

const row = (id, stat, teil, xp, extra = {}) => {
  const [uebung, stufe] = [id.slice(0, id.lastIndexOf('-')), Number(id.slice(id.lastIndexOf('-') + 1))];
  return { id, uebung, stat, teil, stufe, name: uebung, kurz: uebung, stufenname: null, xp, phasen: [{ label: '', s: 60 }],
    steps: [], frage: null, antwort: null, ansagen: [], atemtakt: null, bilder: {}, ...extra };
};
const yesNo = { frage: 'Ging es?', antwort: 'ja-nein' };
const effort = { frage: 'Wie war es?', antwort: 'anstrengung' };
const catalog = buildCatalog({
  exercises: [
    row('a-1', 'kraft', 1, 5, yesNo), row('a-2', 'kraft', 1, 7, yesNo), row('a-3', 'kraft', 1, 9, yesNo),
    row('b-1', 'kraft', 2, 5, yesNo), row('b-2', 'kraft', 2, 7, yesNo),
    row('c-1', 'kraft', 3, 4, { phasen: [{ label: 'Erste Seite', s: 30 }, { label: 'Andere Seite', s: 30 }] }),
    row('t-1', 'ausdauer', 1, 14, { ...effort, phasen: [{ label: '', s: 180 }] }),
    row('t-2', 'ausdauer', 1, 20, { ...effort, phasen: [{ label: '', s: 300 }] }),
    row('m-1', 'beweglichkeit', 1, 6),
    row('n-1', 'beweglichkeit', 2, 14, { phasen: [{ label: 'Erste Seite', s: 60 }, { label: 'Andere Seite', s: 60 }] }),
    row('g-1', 'gelassenheit', 1, 14, { ...yesNo, phasen: [{ label: '', s: 120 }] }),
    row('g-2', 'gelassenheit', 1, 18, { ...yesNo, phasen: [{ label: '', s: 180 }] }),
  ],
}, { equipment: [] });

const START = '2026-03-01';
let n = 0;
function ev(day, type, fields) {
  n += 1;
  return { id: `i-${n}`, t: Date.parse(`${day}T12:00:00`) + n, d: day, dev: 't', type, ...fields };
}
// a finished task as the app writes it: the rows done that day and the answers
function done(day, stat, teile, antworten = null, more = {}) {
  const xp = teile.reduce((sum, id) => sum + catalog.exerciseById.get(id).xp, 0);
  return ev(day, 'done', { stat, teile, xp, ...(antworten ? { antworten } : {}), ...more });
}
const levels = (s) => Object.fromEntries(Object.entries(s.intensityAtDayStart).map(([k, v]) => [k, v.level]));

test('each area is one unit: its exercises in their order, at stage 1 to begin with', () => {
  const s = replay([], catalog, START);
  const task = taskFor('kraft', s.intensityAtDayStart, false, catalog);
  assert.deepEqual(task.parts.map((p) => p.row.id), ['a-1', 'b-1', 'c-1']);
  assert.equal(task.xp, 14);
  assert.equal(task.seconds, 180);
  assert.deepEqual(task.parts[2].phases.map((p) => p.label), ['Erste Seite', 'Andere Seite']);
  // asked about: exercises with a question and a higher stage
  assert.deepEqual(questionsOf(task).map((q) => q.part.key), ['a', 'b']);
  assert.equal(canBeTooMuch(task), false);
});

test('two good runs in a row: that exercise goes one stage up, the others stay', () => {
  const events = [
    done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja', 'b-1': 'nein' }),
    done(addDays(START, 1), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja', 'b-1': 'ja' }),
  ];
  const s = replay(events, catalog, addDays(START, 2));
  assert.deepEqual(levels(s), { a: 2, b: 1, c: 1, t: 1, m: 1, n: 1, g: 1 });
  assert.equal(s.intensity.a.fresh, true);
  const task = taskFor('kraft', s.intensityAtDayStart, false, catalog);
  assert.deepEqual(task.parts.map((p) => p.row.id), ['a-2', 'b-1', 'c-1']);
  assert.equal(task.xp, 16);
  assert.equal(task.parts[0].fresh, true);
  assert.equal(canBeTooMuch(task), true);
});

test('a run that is neither breaks the row; skipped days do not', () => {
  const broken = [
    done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
    done(addDays(START, 1), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'nein' }),
    done(addDays(START, 2), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
  ];
  assert.equal(replay(broken, catalog, addDays(START, 3)).intensityAtDayStart.a.level, 1);
  // a day off in between: the two runs are still in a row
  const apart = [
    done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
    done(addDays(START, 2), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
  ];
  assert.equal(replay(apart, catalog, addDays(START, 3)).intensityAtDayStart.a.level, 2);
});

test('„Das war heute zu viel“ twice in a row: every exercise of the unit one stage down', () => {
  const up = [
    done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja', 'b-1': 'ja' }),
    done(addDays(START, 1), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja', 'b-1': 'ja' }),
  ];
  const tooMuch = [
    done(addDays(START, 2), 'kraft', ['a-2', 'b-2', 'c-1'], null, { zuviel: true }),
    done(addDays(START, 3), 'kraft', ['a-2', 'b-2', 'c-1'], null, { zuviel: true }),
  ];
  assert.deepEqual(levels(replay(up, catalog, addDays(START, 2))), { a: 2, b: 2, c: 1, t: 1, m: 1, n: 1, g: 1 });
  const s = replay([...up, ...tooMuch], catalog, addDays(START, 4));
  assert.equal(s.intensityAtDayStart.a.level, 1);
  assert.equal(s.intensityAtDayStart.b.level, 1);
  assert.equal(s.intensityAtDayStart.c.level, 1);
});

test('the stairs: Locker counts as good, Gut fordernd as neither, Zu viel as too hard', () => {
  assert.equal(resultOf('locker'), 'good');
  assert.equal(resultOf('fordernd'), 'neutral');
  assert.equal(resultOf('zuviel'), 'hard');
  assert.equal(resultOf(undefined), null);
  const events = [
    done(START, 'ausdauer', ['t-1'], { 't-1': 'locker' }),
    done(addDays(START, 1), 'ausdauer', ['t-1'], { 't-1': 'locker' }),
  ];
  let s = replay(events, catalog, addDays(START, 2));
  assert.equal(s.intensityAtDayStart.t.level, 2);
  // at the highest stage nothing is asked; the stage never goes higher
  const top = taskFor('ausdauer', s.intensityAtDayStart, false, catalog);
  assert.equal(top.parts[0].top, true);
  assert.equal(questionsOf(top).length, 0);
  events.push(done(addDays(START, 2), 'ausdauer', ['t-2'], { 't-2': 'zuviel' }));
  events.push(done(addDays(START, 3), 'ausdauer', ['t-2'], { 't-2': 'zuviel' }));
  s = replay(events, catalog, addDays(START, 4));
  assert.equal(s.intensityAtDayStart.t.level, 1);
});

test('today\'s answers change tomorrow\'s task, not today\'s', () => {
  const events = [
    done(addDays(START, -1), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
    done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
  ];
  const s = replay(events, catalog, START);
  assert.equal(s.intensityAtDayStart.a.level, 1);
  assert.equal(s.intensity.a.level, 2);
  // the task done today is the one of the morning
  assert.deepEqual(taskOfDone(s.todayDone.kraft, catalog).parts.map((p) => p.row.id), ['a-1', 'b-1', 'c-1']);
});

test('seven missed days in a row: every exercise of the area one stage down', () => {
  const events = [];
  for (let i = 0; i < 4; i += 1) events.push(done(addDays(START, i), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja', 'b-1': 'ja' }));
  let s = replay(events, catalog, addDays(START, 4));
  assert.equal(s.intensity.a.level, 3);
  assert.equal(s.intensity.b.level, 2);
  s = replay(events, catalog, addDays(START, 4 + 6));
  assert.equal(s.intensity.a.level, 3);
  s = replay(events, catalog, addDays(START, 4 + 7));
  assert.equal(s.intensity.a.level, 2);
  assert.equal(s.intensity.b.level, 1);
  assert.equal(s.intensity.c.level, 1);
  assert.equal(s.intensity.a.fresh, true);
});

test('Krankheitsmodus: stage 1, half the time where there is only one stage, 14 XP, nothing counts', () => {
  const events = [
    done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
    done(addDays(START, 1), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' }),
    ev(addDays(START, 2), 'mode', { sick: true }),
  ];
  const s = replay(events, catalog, addDays(START, 2));
  assert.equal(s.sick, true);
  const sick = taskFor('kraft', s.intensityAtDayStart, true, catalog);
  assert.deepEqual(sick.parts.map((p) => p.row.id), ['a-1', 'b-1', 'c-1']);
  assert.equal(sick.xp, XP_MIN);
  assert.equal(questionsOf(sick).length, 0);
  assert.equal(canBeTooMuch(sick), false);
  // exercises with more than one stage keep their time, the others take half
  assert.deepEqual(sick.parts.map((p) => p.seconds), [60, 60, 30]);
  const moving = taskFor('beweglichkeit', s.intensityAtDayStart, true, catalog);
  assert.equal(moving.seconds, 30 + 60);
  assert.equal(moving.xp, XP_MIN);

  // answers given while sick do not count
  events.push(done(addDays(START, 2), 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'nein' }, { sick: true, xp: XP_MIN }));
  events.push(done(addDays(START, 3), 'kraft', ['a-1', 'b-1', 'c-1'], null, { sick: true, xp: XP_MIN, zuviel: true }));
  events.push(done(addDays(START, 4), 'kraft', ['a-1', 'b-1', 'c-1'], null, { sick: true, xp: XP_MIN, zuviel: true }));
  assert.equal(replay(events, catalog, addDays(START, 5)).intensity.a.level, 2);
});

test('tasks from before the units: their XP counts, the stages stay, old plans are ignored', () => {
  const events = [
    ev(START, 'plan', { stat: 'kraft', ex: 'kr-bauchatmung' }),
    ev(START, 'done', { stat: 'kraft', ex: 'kr-bauchatmung', xp: 14, fb: 'leicht' }),
    ev(addDays(START, 1), 'done', { stat: 'ausdauer', ex: 'au-treppe-5', xp: 14, mk: 'stockwerke', z: 5, m: { stockwerke: 6 } }),
  ];
  const s = replay(events, catalog, addDays(START, 2));
  assert.equal(s.stats.kraft.xp, 14);
  assert.equal(s.totals.stockwerke, 6);
  assert.equal(s.totals.treppe_min, 6);   // an old floor counts as a minute of stairs
  assert.deepEqual(levels(s), { a: 1, b: 1, c: 1, t: 1, m: 1, n: 1, g: 1 });
  assert.equal(taskOfDone({ stat: 'kraft', ex: 'kr-bauchatmung', xp: 14 }, catalog), null);
  const first = s.log.find((e) => e.day === START);
  assert.equal(first.tasks.kraft.ex, 'kr-bauchatmung');
  assert.equal(first.tasks.kraft.done, true);
});

test('the log: what was done each day, and today also what is still open', () => {
  const events = [done(START, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja' })];
  const s = replay(events, catalog, addDays(START, 1));
  const before = s.log.find((e) => e.day === START);
  assert.deepEqual(Object.keys(before.tasks), ['kraft']);
  const today = s.log.find((e) => e.day === addDays(START, 1));
  assert.equal(Object.keys(today.tasks).length, 4);
  assert.deepEqual(today.tasks.gelassenheit, { teile: ['g-1'], ex: null, done: false, gain: 0 });
});

test('the table: every area a unit of 14 to 28 XP, whatever the mix of stages', () => {
  const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
  const real = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));
  for (const stat of ['kraft', 'ausdauer', 'beweglichkeit', 'gelassenheit']) {
    const unit = real.units[stat];
    assert.ok(unit.length > 0, stat);
    const least = unit.reduce((sum, x) => sum + Math.min(...x.stages.map((r) => r.xp)), 0);
    const most = unit.reduce((sum, x) => sum + Math.max(...x.stages.map((r) => r.xp)), 0);
    assert.ok(least >= XP_MIN && most <= XP_MAX, `${stat}: ${least} bis ${most}`);
    for (const x of unit) assert.deepEqual(x.stages.map((r) => r.stufe), x.stages.map((_, i) => i + 1));
  }
});

test('minutes of stairs add up for the quests that need them', () => {
  const events = [
    done(START, 'ausdauer', ['t-1'], { 't-1': 'locker' }),
    done(addDays(START, 1), 'ausdauer', ['t-2'], null),
    done(addDays(START, 2), 'kraft', ['a-1', 'b-1', 'c-1']),
  ];
  assert.equal(replay(events, catalog, addDays(START, 2)).totals.treppe_min, 3 + 5);
});

test('exercises done one by one: shown as progress, counted once the last one finishes the task', () => {
  const day = START;
  const first = ev(day, 'teil', { stat: 'kraft', teil: 'a-1', antwort: 'ja' });
  const second = ev(day, 'teil', { stat: 'kraft', teil: 'b-1' });
  let s = replay([first, second], catalog, day);
  assert.deepEqual(Object.keys(s.todayParts.kraft), ['a-1', 'b-1']);
  assert.equal(s.todayParts.kraft['a-1'].antwort, 'ja');
  assert.equal(s.todayDone.kraft, undefined);
  assert.equal(s.stats.kraft.xp, 0);

  // the last one: the task as a whole, with the answers given along the way
  const last = done(day, 'kraft', ['a-1', 'b-1', 'c-1'], { 'a-1': 'ja', 'b-1': 'ja' });
  s = replay([first, second, last], catalog, day);
  assert.equal(s.todayDone.kraft.xp, 14);
  assert.equal(s.todayParts.kraft, undefined);
  assert.equal(s.stats.kraft.xp, 14);
});

test('an exercise done one by one can be taken back; one from yesterday does not carry over', () => {
  const day = START;
  const first = ev(day, 'teil', { stat: 'kraft', teil: 'a-1' });
  const back = ev(day, 'undo', { ref: first.id });
  assert.equal(replay([first, back], catalog, day).todayParts.kraft, undefined);

  // a task left half done: nothing counts, the day is missed
  const next = addDays(day, 1);
  const s = replay([first], catalog, next);
  assert.equal(s.todayParts.kraft, undefined);
  assert.equal(s.stats.kraft.missed, 1);
  assert.deepEqual(levels(s), { a: 1, b: 1, c: 1, t: 1, m: 1, n: 1, g: 1 });
});
