import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { addDays } from '../js/days.js';
import { effects, maxStamina, staminaAt } from '../js/world/hero.js';
import { travelCost } from '../js/world/map.js';
import { encountersFor, questState, questById } from '../js/world/quests.js';
import { runQuest } from '../js/world/run.js';
import { offersFor } from '../js/world/trader.js';
import { itemLevel } from '../js/world/items.js';
import { countIn } from '../js/world/inventory.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
let n = 0;
function ev(type, fields, hoursAfter = 0, day = DAY) {
  n += 1;
  return { id: `w-${n}`, t: T0 + hoursAfter * 3600000 + n, d: day, dev: 't', type, ...fields };
}
function ctxOf(state) {
  return {
    catalog, world: state.world, stats: state.stats, statsAtDayStart: state.statsAtDayStart,
    fx: effects(state.world, catalog), totals: state.totals, day: state.today,
  };
}
// Plays a quest like the app does and returns the event.
function questEvent(events, questId, hoursAfter) {
  const s = replay(events, catalog, DAY, T0 + hoursAfter * 3600000);
  const c = ctxOf(s);
  const quest = questById(questId, c);
  const e = ev('quest', { q: quest.id, place: quest.place, cost: quest.cost }, hoursAfter);
  e.outcome = runQuest(quest, c, e.id);
  return e;
}

test('start: at the camp, full bar, start items in the backpack', () => {
  const s = replay([], catalog, DAY, T0);
  assert.equal(s.world.position, 'lager');
  assert.equal(s.world.stamina.value, maxStamina(s.stats));
  assert.equal(countIn(s.world, 'rucksack'), 4);
  assert.deepEqual(s.world.unlocked, []);
});

test('travel costs stamina by distance; the bar refills over time', () => {
  const lager = catalog.placeById.get('lager');
  const near = catalog.placeById.get('birkenhain');
  const far = catalog.placeById.get('weisstal');
  const fx = effects(replay([], catalog, DAY, T0).world, catalog);
  assert.ok(travelCost(lager, far, fx) > travelCost(lager, near, fx));
  assert.equal(travelCost(lager, near, fx, true), travelCost(lager, near, fx) + 1);

  const events = [ev('plan', { stat: 'kraft', ex: 'kr-bauchatmung' }), ev('travel', { to: 'birkenhain', cost: 2 }, 0.1)];
  const s = replay(events, catalog, DAY, T0);
  assert.equal(s.world.position, 'birkenhain');
  assert.equal(s.world.stamina.value, maxStamina(s.stats) - 2);
  const later = staminaAt(s.world, T0 + 2 * 3600000, s.stats, effects(s.world, catalog));
  assert.equal(later, maxStamina(s.stats));
});

test('gathering, then the home quest unlocks the home and the wardrobe', () => {
  const events = [ev('plan', { stat: 'kraft', ex: 'kr-bauchatmung' })];
  events.push(ev('travel', { to: 'birkenhain', cost: 2 }, 0.1));
  for (let i = 0; i < 3; i += 1) events.push(questEvent(events, 'q-holz', 0.2 + i * 3));
  events.push(ev('travel', { to: 'steinbruch', cost: 3 }, 9));
  for (let i = 0; i < 3; i += 1) events.push(questEvent(events, 'q-stein', 9.2 + i * 3));
  events.push(ev('travel', { to: 'lager', cost: 2 }, 18));
  let s = replay(events, catalog, DAY, T0 + 20 * 3600000);
  assert.ok(s.world.purse.holz >= 6, `holz ${s.world.purse.holz}`);
  assert.ok(s.world.purse.stein >= 3, `stein ${s.world.purse.stein}`);
  assert.equal(questState(catalog.questById.get('q-zuhause'), ctxOf(s)).status, 'open');

  events.push(questEvent(events, 'q-zuhause', 20));
  s = replay(events, catalog, DAY, T0 + 21 * 3600000);
  assert.ok(s.world.unlocked.includes('zuhause'));
  assert.equal(s.world.home, 1);
  assert.equal(questState(catalog.questById.get('q-zuhause'), ctxOf(s)).status, 'done');
});

test('a quest result is stored and replayed the same way', () => {
  const events = [ev('plan', { stat: 'kraft', ex: 'kr-bauchatmung' }), ev('travel', { to: 'birkenhain', cost: 2 }, 0.1)];
  const q = questEvent(events, 'q-holz', 1);
  const again = questEvent(events, 'q-holz', 1);
  q.outcome = again.outcome = runQuest(catalog.questById.get('q-holz'), ctxOf(replay(events, catalog, DAY, T0)), 'same-seed');
  const a = replay([...events, q], catalog, DAY, T0 + 7200000).world.purse.holz;
  const b = replay([...events, again], catalog, DAY, T0 + 7200000).world.purse.holz;
  assert.equal(a, b);
});

test('a lost fight empties the bar, costs no real task', () => {
  const s0 = replay([], catalog, DAY, T0);
  const fake = ev('quest', { q: 'q-haendler', place: 'nebelfurt', cost: 3 }, 1);
  fake.outcome = { ok: false, steps: [], monsters: [{ id: 'nebelwaechter', result: 'lost' }], reward: {}, consumed: {} };
  const s = replay([ev('travel', { to: 'nebelfurt', cost: 3 }, 0.5), fake], catalog, DAY, T0 + 3600000);
  assert.equal(s.world.stamina.value, 0);
  assert.equal(s.world.bestiary.nebelwaechter.lost, 1);
  assert.deepEqual(s.stats, s0.stats);
});

test('encounters: same list all day, fitting the hero', () => {
  const s = replay([], catalog, DAY, T0);
  const a = encountersFor(DAY, ctxOf(s));
  const b = encountersFor(DAY, ctxOf(s));
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id));
  assert.ok(a.length >= 1);
  for (const q of a) {
    assert.ok(catalog.placeById.get(q.place).unlock.length === 0, 'only open places');
    assert.ok(catalog.monsterById.get(q.monsters[0]).stufe <= 4, q.monsters[0]);
  }
});

test('trader offers lie around the hero\'s strength', () => {
  const s = replay([], catalog, DAY, T0);
  const offers = offersFor(DAY, ctxOf(s));
  assert.equal(offers.length, 5);
  for (const o of offers.filter((x) => x.kind === 'item')) {
    assert.ok(itemLevel(catalog.itemById.get(o.id)) <= 4, o.id);
    assert.ok(o.price > 0);
  }
  assert.deepEqual(offersFor(DAY, ctxOf(s)), offers);
});

test('buying needs enough Glimmer; selling brings some back', () => {
  const buy = ev('buy', { offer: `${DAY}:0`, kind: 'item', thing: 'kopf_kapuze_2', price: 50 }, 1);
  let s = replay([buy], catalog, DAY, T0 + 3600000);
  assert.equal(s.world.items[buy.id], undefined);

  const win = ev('quest', { q: 'q-spalt', place: 'spalt', cost: 0 }, 0.5);
  win.outcome = { ok: true, steps: [], monsters: [], consumed: {}, reward: { glimmer: 60, holz: 0, stein: 0, things: [], unlocks: ['haendler'], rest: false } };
  s = replay([win, buy], catalog, DAY, T0 + 3600000);
  assert.equal(s.world.items[buy.id].id, 'kopf_kapuze_2');
  assert.equal(s.world.purse.glimmer, 10);

  const sell = ev('sell', { inst: buy.id, price: 16 }, 2);
  s = replay([win, buy, sell], catalog, DAY, T0 + 7200000);
  assert.equal(s.world.items[buy.id], undefined);
  assert.equal(s.world.purse.glimmer, 26);
});

test('a full backpack overflows instead of losing things', () => {
  const win = ev('quest', { q: 'q-spalt', place: 'spalt', cost: 0 }, 0.5);
  const things = Array.from({ length: 6 }, () => ({ kind: 'furniture', id: 'wolldecke' }));
  win.outcome = { ok: true, steps: [], monsters: [], consumed: {}, reward: { glimmer: 0, holz: 0, stein: 0, things, unlocks: [], rest: false } };
  const s = replay([win], catalog, DAY, T0 + 3600000);
  assert.equal(countIn(s.world, 'rucksack'), 10);
});

test('equipment abilities count, never stats', () => {
  const s = replay([ev('equip', { slot: 'handschuhe', inst: 'start:handschuhe_handwickel_1' }, 0.1)], catalog, DAY, T0);
  const fx = effects(s.world, catalog);
  assert.equal(fx.schaden, 1);
  assert.equal(s.stats.kraft.level, 1);
});

test('home: build needs materials, furniture adds recovery', () => {
  const win = ev('quest', { q: 'q-zuhause', place: 'lager', cost: 0 }, 0.5);
  win.outcome = { ok: true, steps: [], monsters: [], consumed: {}, reward: { glimmer: 200, holz: 40, stein: 20, things: [{ kind: 'furniture', id: 'schlafmatte' }], unlocks: ['zuhause'], rest: false } };
  const build = ev('build', { tier: 2 }, 1);
  const place = ev('place', { inst: `${win.id}:0` }, 1.5);
  const s = replay([win, build, place], catalog, DAY, T0 + 2 * 3600000);
  assert.equal(s.world.home, 2);
  assert.equal(s.world.purse.holz, 25);
  assert.deepEqual(s.world.placed, [`${win.id}:0`]);
  assert.equal(effects(s.world, catalog).erholung, 10 + 8);
});
