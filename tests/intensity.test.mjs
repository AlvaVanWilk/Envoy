import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replay, runResult } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { missingPlans, replans } from '../js/planner.js';
import { addDays } from '../js/days.js';

const catalog = buildCatalog({
  exercises: [
    { id: 'w1', stat: 'ausdauer', stufe: 1, name: '10 Min', xp: 14, messung: 'strecke_km', ziel: 0.6 },
    { id: 'w2', stat: 'ausdauer', stufe: 2, name: '15 Min', xp: 17, messung: 'strecke_km', ziel: 0.9 },
    { id: 'w3', stat: 'ausdauer', stufe: 3, name: '20 Min', xp: 20, messung: 'strecke_km', ziel: 1.2 },
    { id: 'b1', stat: 'beweglichkeit', stufe: 1, name: 'Strecken', xp: 14 },
    { id: 'b2', stat: 'beweglichkeit', stufe: 2, name: 'Katze', xp: 17 },
    { id: 'k1', stat: 'kraft', stufe: 1, name: 'K', xp: 14 },
    { id: 'g1', stat: 'gelassenheit', stufe: 1, name: 'G', xp: 14 },
  ],
}, { equipment: [] });

const START = '2026-03-01';
let n = 0;
function ev(day, type, fields) {
  n += 1;
  return { id: `i-${n}`, t: Date.parse(`${day}T12:00:00`) + n, d: day, dev: 't', type, ...fields };
}
const walk = (day, km, ex = 'w1', z = 0.6) =>
  ev(day, 'done', { stat: 'ausdauer', ex, xp: 14, mk: 'strecke_km', z, m: { strecke_km: km } });

test('measured value against target: good, neutral, too hard', () => {
  assert.equal(runResult({ mk: 'strecke_km', z: 1, m: { strecke_km: 0.95 } }), 'good');
  assert.equal(runResult({ mk: 'strecke_km', z: 1, m: { strecke_km: 0.8 } }), 'neutral');
  assert.equal(runResult({ mk: 'strecke_km', z: 1, m: { strecke_km: 0.5 } }), 'hard');
  assert.equal(runResult({ fb: 'zuviel' }), 'hard');
  assert.equal(runResult({}), 'good');
  assert.equal(runResult({ sick: true, fb: 'zuviel' }), null);
});

test('three good walks raise the intensity, a neutral one breaks the row', () => {
  const events = [walk(START, 0.7), walk(addDays(START, 1), 0.5 * 1.6), walk(addDays(START, 2), 0.7)];
  // 0.8 km of 0.6 is good; all three good -> level 2 from day 4
  assert.equal(replay(events, catalog, addDays(START, 3)).intensityAtDayStart.ausdauer.level, 2);

  const broken = [walk(START, 0.7), walk(addDays(START, 1), 0.5), walk(addDays(START, 2), 0.7)];
  // 0.5 of 0.6 = 83 %: neutral, the row starts again
  assert.equal(replay(broken, catalog, addDays(START, 3)).intensityAtDayStart.ausdauer.level, 1);
});

test('two clearly too short walks lower the intensity again', () => {
  const events = [];
  for (let i = 0; i < 3; i += 1) events.push(walk(addDays(START, i), 0.7));
  events.push(walk(addDays(START, 3), 0.4, 'w2', 0.9), walk(addDays(START, 4), 0.5, 'w2', 0.9));
  const s = replay(events, catalog, addDays(START, 5));
  assert.equal(s.intensityAtDayStart.ausdauer.level, 1);
  assert.equal(s.intensity.ausdauer.fresh, true);
});

test('seven missed days in a row lower the intensity one level', () => {
  const events = [];
  for (let i = 0; i < 6; i += 1) events.push(walk(addDays(START, i), 1.5, i < 3 ? 'w1' : 'w2', i < 3 ? 0.6 : 0.9));
  let s = replay(events, catalog, addDays(START, 6));
  assert.equal(s.intensity.ausdauer.level, 3);
  s = replay(events, catalog, addDays(START, 6 + 6));
  assert.equal(s.intensity.ausdauer.level, 3);
  s = replay(events, catalog, addDays(START, 6 + 7));
  assert.equal(s.intensity.ausdauer.level, 2);
  assert.equal(s.intensity.ausdauer.fresh, true);
});

test('feedback is needed for new exercises and after a level change only', () => {
  const s0 = replay([], catalog, START);
  assert.equal(s0.doneCount.b1, undefined);
  const events = [ev(START, 'done', { stat: 'beweglichkeit', ex: 'b1', xp: 14, fb: 'passend' })];
  const s1 = replay(events, catalog, addDays(START, 1));
  assert.equal(s1.doneCount.b1, 1);
  assert.equal(s1.intensity.beweglichkeit.fresh, false);
});

test('Krankheitsmodus: lowest level, does not count for the intensity', () => {
  const events = [];
  for (let i = 0; i < 3; i += 1) events.push(walk(addDays(START, i), 0.7));
  events.push(ev(addDays(START, 3), 'mode', { sick: true }));
  let s = replay(events, catalog, addDays(START, 3));
  assert.equal(s.sick, true);
  assert.equal(s.intensityAtDayStart.ausdauer.level, 2);
  const plans = missingPlans(s, catalog);
  assert.equal(plans.ausdauer.id, 'w1');

  // done while sick: no effect on the intensity counters
  events.push(ev(addDays(START, 3), 'done', { stat: 'ausdauer', ex: 'w1', xp: 14, mk: 'strecke_km', z: 0.6, m: { strecke_km: 0.1 }, sick: true }));
  events.push(ev(addDays(START, 4), 'done', { stat: 'ausdauer', ex: 'w1', xp: 14, mk: 'strecke_km', z: 0.6, m: { strecke_km: 0.1 }, sick: true }));
  s = replay(events, catalog, addDays(START, 5));
  assert.equal(s.intensity.ausdauer.level, 2);
  assert.equal(s.intensity.ausdauer.hard, 0);
});

test('switching Krankheitsmodus replans open tasks', () => {
  const events = [ev(START, 'plan', { stat: 'ausdauer', ex: 'w1' })];
  for (let i = 1; i <= 3; i += 1) events.push(walk(addDays(START, i), 0.7));
  const day = addDays(START, 4);
  events.push(ev(day, 'plan', { stat: 'ausdauer', ex: 'w2' }));
  events.push(ev(day, 'mode', { sick: true }));
  const s = replay(events, catalog, day);
  const again = replans(s, catalog);
  assert.equal(again.ausdauer.id, 'w1');
});

test('totals of real distance and floors', () => {
  const events = [walk(START, 1.2),
    ev(addDays(START, 1), 'done', { stat: 'ausdauer', ex: 'w1', xp: 14, mk: 'stockwerke', z: 5, m: { stockwerke: 6 } })];
  const s = replay(events, catalog, addDays(START, 1));
  assert.equal(s.totals.km, 1.2);
  assert.equal(s.totals.stockwerke, 6);
});
