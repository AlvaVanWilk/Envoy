import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { missingPlans } from '../js/planner.js';
import { addDays } from '../js/days.js';
import { mergeEvents } from '../js/events.js';

const catalog = buildCatalog({
  exercises: [
    { id: 'k1a', stat: 'kraft', stufe: 1, name: 'A', xp: 14, muskelgruppe: 'beckenboden' },
    { id: 'k1b', stat: 'kraft', stufe: 1, name: 'B', xp: 14, muskelgruppe: 'rumpf' },
    { id: 'k1c', stat: 'kraft', stufe: 1, name: 'C', xp: 14, muskelgruppe: 'beckenboden' },
    { id: 'k2a', stat: 'kraft', stufe: 2, name: 'D', xp: 20 },
    { id: 'k3a', stat: 'kraft', stufe: 3, name: 'E', xp: 28 },
    { id: 'a1', stat: 'ausdauer', stufe: 1, name: 'Gehen', xp: 14 },
    { id: 'b1', stat: 'beweglichkeit', stufe: 1, name: 'Strecken', xp: 14 },
    { id: 'g1', stat: 'gelassenheit', stufe: 1, name: 'Atmen', xp: 14 },
  ],
}, {
  equipment: [
    { id: 'hemd', slot: 'torso', name: 'Hemd', req: {} },
    { id: 'wickel', slot: 'handschuhe', name: 'Wickel', req: { kraft: 2 } },
  ],
});

const START = '2026-01-01';
let n = 0;
function ev(day, type, fields) {
  n += 1;
  return { id: `t-${n}`, t: n, d: day, dev: 't', type, ...fields };
}
function done(day, stat, xp, fb = 'passend') {
  return ev(day, 'done', { stat, ex: 'x', xp, fb });
}

test('xp from finished tasks accumulates', () => {
  const events = [done(START, 'kraft', 28), done(addDays(START, 1), 'kraft', 28)];
  const s = replay(events, catalog, addDays(START, 1));
  assert.equal(s.stats.kraft.level, 2);
  assert.equal(s.stats.kraft.xp, 11);
});

test('one task per area and day counts', () => {
  const events = [done(START, 'kraft', 20), done(START, 'kraft', 20)];
  assert.equal(replay(events, catalog, START).stats.kraft.xp, 20);
});

test('undo removes the xp', () => {
  const d = done(START, 'kraft', 20);
  const events = [d, ev(START, 'undo', { ref: d.id })];
  assert.equal(replay(events, catalog, START).stats.kraft.xp, 0);
});

test('malus: day 1 free, days 2-7 a quarter, from day 8 full', () => {
  // seven active days with 20 XP each -> average 20
  const events = [];
  for (let i = 0; i < 7; i += 1) events.push(done(addDays(START, i), 'kraft', 20));
  // 140 XP -> level 3 (45 + 61 = 106), 34 XP into level 3
  const base = replay(events, catalog, addDays(START, 7));
  assert.equal(base.stats.kraft.level, 3);
  assert.equal(base.stats.kraft.xp, 34);

  // Missed day 1 (START+7) is over when today is START+8: no loss.
  assert.equal(replay(events, catalog, addDays(START, 8)).stats.kraft.xp, 34);
  // Missed day 2: -5
  assert.equal(replay(events, catalog, addDays(START, 9)).stats.kraft.xp, 29);
  // Missed days 2..7 = 6 x 5 = 30 -> 4 XP left after day 7
  const after7 = replay(events, catalog, addDays(START, 14));
  assert.equal(after7.stats.kraft.xp, 4);
  assert.equal(after7.stats.kraft.missed, 7);
  // Missed day 8: -20 -> drops to level 2
  const after8 = replay(events, catalog, addDays(START, 15));
  assert.equal(after8.stats.kraft.level, 2);
  assert.equal(after8.stats.kraft.xp, 61 + 4 - 20);
});

test('doing the task resets the missed counter', () => {
  const events = [done(START, 'kraft', 20), done(addDays(START, 3), 'kraft', 20)];
  const s = replay(events, catalog, addDays(START, 4));
  assert.equal(s.stats.kraft.missed, 0);
  // missed day 1 (free) and day 2 (-5) happened in between
  assert.equal(s.stats.kraft.xp, 35);
});

test('floor: never below 60 % of the best level', () => {
  const events = [done(START, 'kraft', 802)]; // straight to level 10
  const s = replay(events, catalog, addDays(START, 400));
  assert.equal(s.stats.kraft.maxLevel, 10);
  assert.equal(s.stats.kraft.level, 6);
  assert.equal(s.stats.kraft.xp, 0);
});

test('intensity: up after three good runs, down after two too hard', () => {
  const events = [];
  for (let i = 0; i < 3; i += 1) events.push(done(addDays(START, i), 'kraft', 14, 'passend'));
  let s = replay(events, catalog, addDays(START, 3));
  assert.equal(s.intensityAtDayStart.kraft.level, 2);

  events.push(done(addDays(START, 3), 'kraft', 20, 'zuviel'));
  events.push(done(addDays(START, 4), 'kraft', 20, 'zuviel'));
  s = replay(events, catalog, addDays(START, 5));
  assert.equal(s.intensityAtDayStart.kraft.level, 1);
});

test('intensity never above the highest level in the catalog', () => {
  const events = [];
  for (let i = 0; i < 30; i += 1) events.push(done(addDays(START, i), 'kraft', 14, 'leicht'));
  const s = replay(events, catalog, addDays(START, 30));
  assert.equal(s.intensityAtDayStart.kraft.level, 3);
});

test('today\'s feedback does not change today\'s plan level', () => {
  const events = [];
  for (let i = 0; i < 3; i += 1) events.push(done(addDays(START, 2), 'kraft', 14));
  events.length = 0;
  events.push(done(START, 'kraft', 14), done(addDays(START, 1), 'kraft', 14), done(addDays(START, 2), 'kraft', 14));
  const s = replay(events, catalog, addDays(START, 2));
  assert.equal(s.intensityAtDayStart.kraft.level, 1);
  assert.equal(s.intensity.kraft.level, 2);
});

test('equipment needs its requirements and falls off when they are no longer met', () => {
  const events = [ev(START, 'equip', { slot: 'handschuhe', item: 'wickel' })];
  assert.equal(replay(events, catalog, START).equipped.handschuhe, undefined);

  const events2 = [
    done(START, 'kraft', 45),
    ev(START, 'equip', { slot: 'handschuhe', item: 'wickel' }),
    ev(START, 'equip', { slot: 'torso', item: 'hemd' }),
  ];
  const s = replay(events2, catalog, START);
  assert.equal(s.equipped.handschuhe, 'wickel');
  assert.equal(s.equipped.torso, 'hemd');

  // Long break: kraft falls from 2 back to 1 (floor 1.2) -> wickel is taken off.
  const later = replay(events2, catalog, addDays(START, 20));
  assert.equal(later.stats.kraft.level, 1);
  assert.equal(later.equipped.handschuhe, undefined);
  assert.equal(later.equipped.torso, 'hemd');
  assert.equal(later.dropped.length, 1);
  assert.equal(later.dropped[0].item, 'wickel');
});

test('planner: same plan on every device, avoids yesterday and its muscle group', () => {
  const day1 = START;
  const s1 = replay([], catalog, day1);
  const p1 = missingPlans(s1, catalog);
  assert.equal(Object.keys(p1).length, 4);
  assert.deepEqual(missingPlans(s1, catalog), p1);

  const planEvent = ev(day1, 'plan', { stat: 'kraft', ex: p1.kraft.id });
  const s2 = replay([planEvent], catalog, addDays(day1, 1));
  const p2 = missingPlans(s2, catalog);
  assert.notEqual(p2.kraft.id, p1.kraft.id);
  if (p1.kraft.muskelgruppe === 'beckenboden') assert.equal(p2.kraft.id, 'k1b');
});

test('planner: existing plan is kept', () => {
  const s = replay([ev(START, 'plan', { stat: 'kraft', ex: 'k1c' })], catalog, START);
  assert.equal(s.todayPlan.kraft.ex, 'k1c');
  assert.equal(missingPlans(s, catalog).kraft, undefined);
});

test('merging keeps each event once and in order', () => {
  const a = [ev(START, 'plan', { stat: 'kraft', ex: 'k1a' })];
  const b = [a[0], ev(START, 'plan', { stat: 'kraft', ex: 'k1b' })];
  const merged = mergeEvents(b, a);
  assert.equal(merged.length, 2);
  assert.equal(replay(merged, catalog, START).todayPlan.kraft.ex, 'k1a');
});
