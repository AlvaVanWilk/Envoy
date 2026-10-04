import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xpToNext, malusFactor, addXp, removeXp, floorPosition, statValue, statText } from '../js/formulas.js';

test('curve matches the specification', () => {
  assert.equal(xpToNext(1), 45);
  assert.equal(xpToNext(2), 61);
  assert.equal(xpToNext(3), 74);
  assert.equal(xpToNext(5), 93);
  assert.equal(xpToNext(9), 121);
  assert.equal(xpToNext(10), 130);
  let sum = 0;
  for (let n = 1; n < 10; n += 1) sum += xpToNext(n);
  assert.equal(sum, 802);
});

test('first level up: two strong days or four weak days', () => {
  const start = { level: 1, xp: 0, maxLevel: 1 };
  assert.equal(addXp(addXp(start, 28), 28).level, 2);
  let s = start;
  for (let i = 0; i < 3; i += 1) s = addXp(s, 14);
  assert.equal(s.level, 1);
  assert.equal(addXp(s, 14).level, 2);
});

test('level 10 after 802 XP', () => {
  const s = addXp({ level: 1, xp: 0, maxLevel: 1 }, 802);
  assert.equal(s.level, 10);
  assert.equal(s.xp, 0);
  assert.equal(s.maxLevel, 10);
});

test('malus steps', () => {
  assert.equal(malusFactor(1), 0);
  assert.equal(malusFactor(2), 0.25);
  assert.equal(malusFactor(7), 0.25);
  assert.equal(malusFactor(8), 1);
  assert.equal(malusFactor(30), 1);
});

test('empty bar drops a level and continues backwards', () => {
  const s = removeXp({ level: 5, xp: 3, maxLevel: 5 }, 10);
  assert.equal(s.level, 4);
  assert.equal(s.xp, xpToNext(4) - 7);
});

test('floor is 60 % of the best level', () => {
  assert.equal(floorPosition(30), 18);
  const fallen = removeXp({ level: 20, xp: 0, maxLevel: 30 }, 100000);
  assert.deepEqual([fallen.level, fallen.xp], [18, 0]);
  // best level 3: floor 1.8 = level 1 with 80 % of the bar
  const small = removeXp({ level: 2, xp: 0, maxLevel: 3 }, 1000);
  assert.equal(small.level, 1);
  assert.equal(small.xp, 36);
});

test('never below level 1 with 0 XP', () => {
  const s = removeXp({ level: 1, xp: 10, maxLevel: 1 }, 50);
  assert.deepEqual([s.level, s.xp], [1, 0]);
});

test('cap at level 100', () => {
  const s = addXp({ level: 99, xp: 0, maxLevel: 99 }, 10_000_000);
  assert.equal(s.level, 100);
  assert.equal(s.xp, 0);
});

test('a stat as a number: the level, then the thousandths to the next one, never rounded up', () => {
  assert.equal(statText({ level: 1, xp: 0 }), '1.000');
  assert.equal(statText({ level: 1, xp: 15 }), '1.333');
  assert.equal(statText({ level: 1, xp: 44.99 }), '1.999');
  assert.equal(statText({ level: 3, xp: 6 }), `3.${String(Math.floor((6000) / xpToNext(3))).padStart(3, '0')}`);
  assert.deepEqual(statValue({ level: 12, xp: 0 }), { whole: '12', part: '.000' });
  assert.deepEqual(statValue({ level: 100, xp: 50 }), { whole: '100', part: '' });
});
