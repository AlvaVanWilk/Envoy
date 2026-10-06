import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { addDays } from '../js/days.js';
import { mergeEvents } from '../js/events.js';
import { bonusOf, runningBonuses } from '../js/achievements.js';

const exercise = (id, stat, xp) => ({ id, uebung: id.split('-')[0], stat, teil: 1, stufe: 1, name: id, kurz: id, xp,
  phasen: [{ label: '', s: 60 }], steps: [], frage: null, antwort: null, ansagen: [], bilder: {} });
const catalog = buildCatalog({
  exercises: [
    exercise('k-1', 'kraft', 14),
    exercise('a-1', 'ausdauer', 14),
    exercise('b-1', 'beweglichkeit', 14),
    exercise('g-1', 'gelassenheit', 14),
  ],
}, {
  equipment: [
    { id: 'hemd', slot: 'torso', name: 'Hemd', req: {}, herkunft: ['start'], effekt: {} },
    { id: 'wickel', slot: 'handschuhe', name: 'Wickel', req: { kraft: 2 }, herkunft: ['start'], effekt: {} },
    { id: 'tuch', slot: 'accessoire', name: 'Tuch', req: {}, herkunft: ['start'], effekt: {} },
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

test('equipment needs its requirements and falls off when they are no longer met', () => {
  const events = [ev(START, 'equip', { slot: 'handschuhe', item: 'wickel' })];
  assert.equal(replay(events, catalog, START).equipped.handschuhe, undefined);

  const events2 = [
    done(START, 'kraft', 45),
    ev(START, 'equip', { slot: 'handschuhe', inst: 'start:wickel' }),
    ev(START, 'equip', { slot: 'torso', inst: 'start:hemd' }),
  ];
  const s = replay(events2, catalog, START);
  assert.equal(s.equipped.handschuhe, 'start:wickel');
  assert.equal(s.equipped.torso, 'start:hemd');
  assert.equal(s.world.items['start:wickel'].where, 'body');

  // Long break: kraft falls from 2 back to 1 (floor 1.2) -> wickel is taken off.
  const later = replay(events2, catalog, addDays(START, 20));
  assert.equal(later.stats.kraft.level, 1);
  assert.equal(later.equipped.handschuhe, undefined);
  assert.equal(later.world.items['start:wickel'].where, 'rucksack');
  assert.equal(later.equipped.torso, 'start:hemd');
  assert.equal(later.dropped.length, 1);
  assert.equal(later.dropped[0].item, 'wickel');
});

test('merging keeps each event once', () => {
  const a = [done(START, 'kraft', 20)];
  const b = [a[0], done(START, 'ausdauer', 14)];
  const merged = mergeEvents(b, a);
  assert.equal(merged.length, 2);
  const s = replay(merged, catalog, START);
  assert.equal(s.stats.kraft.xp, 20);
  assert.equal(s.stats.ausdauer.xp, 14);
});

test('events from before the accessory slot, when it was the cloak slot, still count', () => {
  const worn = replay([ev(START, 'equip', { slot: 'umhang', inst: 'start:tuch' })], catalog, START);
  assert.equal(worn.equipped.accessoire, 'start:tuch');
  assert.equal(worn.equipped.umhang, undefined);
  const off = replay([
    ev(START, 'equip', { slot: 'umhang', inst: 'start:tuch' }),
    ev(START, 'unequip', { slot: 'umhang' }),
  ], catalog, START);
  assert.equal(off.equipped.accessoire, undefined);
  assert.equal(off.world.items['start:tuch'].where, 'rucksack');
});

test('the achievement "Angekommen" is reached with the Envoy and adds 10 % to gains for the first 15 minutes only', () => {
  const MIN = 60000;
  const T = 1_000_000_000;
  const before = { ...done(START, 'kraft', 20), t: T - MIN };
  const envoy = { ...ev(START, 'envoy', { name: 'Mira', figur: 'erste' }), t: T };
  const soon = { ...done(START, 'ausdauer', 20), t: T + 10 * MIN };
  const late = { ...done(START, 'beweglichkeit', 20), t: T + 16 * MIN };
  const s = replay([before, envoy, soon, late], catalog, START);
  assert.deepEqual(Object.keys(s.achievements), ['angekommen']);
  assert.equal(s.achievements.angekommen.day, START);
  assert.equal(s.achievements.angekommen.t, T);
  assert.equal(s.todayDone.kraft.gain, 20);        // before the arrival
  assert.equal(s.todayDone.ausdauer.gain, 22);     // within 15 minutes
  assert.equal(s.todayDone.beweglichkeit.gain, 20); // after 15 minutes
  assert.equal(replay([before], catalog, START).achievements.angekommen, undefined);
});

test('the time-limited bonus is asked for by time', () => {
  const earned = { angekommen: { day: START, t: 1000 } };
  assert.equal(bonusOf(earned, 'tageswerk', 1000 + 14 * 60000), 0.1);
  assert.equal(bonusOf(earned, 'tageswerk', 1000 + 15 * 60000), 0.1);
  assert.equal(bonusOf(earned, 'tageswerk', 1000 + 15 * 60000 + 1), 0);
  assert.equal(bonusOf(earned, 'sammeln', 1000), 0.1);
  assert.equal(runningBonuses(earned, 1000 + 5 * 60000).length, 1);
  assert.equal(runningBonuses(earned, 1000 + 20 * 60000).length, 0);
  assert.equal(bonusOf({}, 'tageswerk', 0), 0);
});


test('at stake: after a day without a task, leaving it today as well would cost something', () => {
  const events = [];
  for (let i = 0; i < 7; i += 1) events.push(done(addDays(START, i), 'kraft', 20));
  // yesterday (START+6) Kraft was done: today's day would be the first missed one, it costs nothing
  assert.deepEqual(replay(events, catalog, addDays(START, 7)).atStake, {});
  // yesterday (START+7) Kraft was left: today it would cost 5 XP (a quarter of 20)
  const s = replay(events, catalog, addDays(START, 8));
  assert.deepEqual(Object.keys(s.atStake), ['kraft']);
  assert.ok(Math.abs(s.atStake.kraft - 5 / 73.5) < 0.01, `${s.atStake.kraft}`);
  // done today: nothing at stake any more
  assert.deepEqual(replay([...events, done(addDays(START, 8), 'kraft', 20)], catalog, addDays(START, 8)).atStake, {});
  // the other stats were never done: nothing to lose
  assert.equal(s.atStake.ausdauer, undefined);
});

test('at stake: nothing at the floor', () => {
  const events = [done(START, 'kraft', 802)]; // straight to level 10
  const low = replay(events, catalog, addDays(START, 400));
  assert.equal(low.stats.kraft.level, 6);
  assert.deepEqual(low.atStake, {});
});

test('the note after a day without the Tageswerk names the stats at stake', async () => {
  const { dayNoteText } = await import('../js/ui/daynote.js');
  const one = dayNoteText(['kraft'], true);
  assert.equal(one.title, 'Gestern blieb die Aufgabe für Kraft liegen');
  assert.match(one.text, /^Ein Tag Pause kostet nichts\. Bleibt sie heute auch liegen, verliert dein Envoy ab morgen etwas von dem, was er sich bei Kraft erarbeitet hat\.$/);
  const two = dayNoteText(['kraft', 'ausdauer', 'gelassenheit'], false);
  assert.equal(two.title, 'Gestern blieben die Aufgaben für Kraft, Ausdauer und Gelassenheit liegen');
  assert.ok(!two.text.includes('Pause'));
  assert.equal(dayNoteText(['kraft', 'ausdauer', 'beweglichkeit', 'gelassenheit'], true).title, 'Gestern blieb das Tageswerk liegen');
  for (const x of [one, two]) assert.ok(!`${x.title}${x.text}`.includes('!'));
});
