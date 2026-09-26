import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects, maxStamina, staminaAt } from '../js/world/hero.js';
import { wayStamina, camp } from '../js/world/map.js';
import { encountersFor, questState, questById } from '../js/world/quests.js';
import { runQuest, speedShare } from '../js/world/run.js';
import { planExpedition, progressAt, heroPosition } from '../js/world/expedition.js';
import { offersFor } from '../js/world/trader.js';
import { itemLevel } from '../js/world/items.js';
import { countIn } from '../js/world/inventory.js';
import { MINUTES_PER_STAMINA } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
const H = 3600000;
let n = 0;
function ev(type, fields, hoursAfter = 0, day = DAY) {
  n += 1;
  return { id: `w-${n}`, t: T0 + hoursAfter * H + n, d: day, dev: 't', type, ...fields };
}
function ctxOf(state) {
  return {
    catalog, world: state.world, stats: state.stats, statsAtDayStart: state.statsAtDayStart,
    fx: effects(state.world, catalog), totals: state.totals, day: state.today,
  };
}
const statsAt = (level) => Object.fromEntries(['kraft', 'ausdauer', 'beweglichkeit', 'gelassenheit']
  .map((id) => [id, { level, xp: 0, maxLevel: level, missed: 0 }]));

// Starts an expedition like the app does and returns the event.
function expeditionEvent(events, questId, hoursAfter) {
  const s = replay(events, catalog, DAY, T0 + hoursAfter * H);
  const c = ctxOf(s);
  const quest = questById(questId, c);
  const e = ev('expedition', { q: quest.id, place: quest.place, title: quest.name }, hoursAfter);
  const plan = planExpedition(quest, c, e.id);
  return Object.assign(e, { out: plan.out, act: plan.act, back: plan.back, cost: plan.cost, outcome: plan.outcome });
}
const total = (e) => e.out + e.act + e.back;

test('start: at the camp, full bar, start items in the backpack', () => {
  const s = replay([], catalog, DAY, T0);
  assert.equal(s.world.expedition, null);
  assert.equal(s.world.stamina.value, maxStamina(s.stats));
  assert.equal(countIn(s.world, 'rucksack'), 4);
  assert.deepEqual(s.world.purse, { splitter: 0, pilzholz: 0, stein: 0 });
});

test('ways: further costs more, Ausdauer makes them shorter, an over-full backpack longer', () => {
  const home = camp(catalog);
  const near = catalog.placeById.get('pilzhain');
  const far = catalog.placeById.get('weisstal');
  const fx = effects(replay([], catalog, DAY, T0).world, catalog);
  assert.equal(wayStamina(home, near, statsAt(1), fx), 1);
  assert.ok(wayStamina(home, far, statsAt(1), fx) > wayStamina(home, near, statsAt(1), fx));
  assert.ok(wayStamina(home, far, statsAt(10), fx) < wayStamina(home, far, statsAt(1), fx));
  assert.equal(wayStamina(home, near, statsAt(1), fx, true), wayStamina(home, near, statsAt(1), fx) + 1);
  assert.equal(wayStamina(home, home, statsAt(1), fx), 0);
});

test('time follows stamina: every point of stamina is one minute away', () => {
  const s = replay([], catalog, DAY, T0);
  for (const level of [1, 5, 12]) {
    const c = { ...ctxOf(s), stats: statsAt(level) };
    for (const quest of catalog.quests) {
      const plan = planExpedition(quest, c, 'x');
      assert.equal(plan.out + plan.act + plan.back, plan.cost * MINUTES_PER_STAMINA, `${quest.id} at ${level}`);
      assert.equal(plan.out, plan.back);
    }
  }
  const c = ctxOf(s);
  const quick = planExpedition(catalog.questById.get('q-stein-klein'), c, 'x');
  const long = planExpedition(catalog.questById.get('q-horizont'), c, 'x');
  assert.ok(quick.cost <= 3, `quick ${quick.cost}`);
  assert.ok(long.cost >= 60, `long ${long.cost}`);
});

test('the bar: 20 + 4 per level of Ausdauer', () => {
  assert.equal(maxStamina(statsAt(1)), 24);
  assert.equal(maxStamina(statsAt(10)), 60);
});

test('an expedition takes real time and pays out only when back', () => {
  const e = expeditionEvent([], 'q-pilzholz', 0.1);
  assert.ok(e.out >= 1 && e.back === e.out && e.act > 0);
  const during = replay([e], catalog, DAY, e.t + (e.out + 1) * 60000);
  assert.equal(during.world.purse.pilzholz, 0);
  assert.equal(progressAt(during.world.expedition, e.t + (e.out + 1) * 60000).phase, 'act');
  assert.equal(during.world.stamina.value < maxStamina(during.stats), true);

  const after = replay([e], catalog, DAY, e.t + total(e) * 60000 + 1000);
  assert.equal(after.world.expedition, null);
  assert.ok(after.world.purse.pilzholz >= 2, `pilzholz ${after.world.purse.pilzholz}`);
  assert.equal(after.world.reports.length, 1);
});

test('only one expedition at a time', () => {
  const a = expeditionEvent([], 'q-pilzholz', 0.1);
  const b = expeditionEvent([], 'q-stein', 0.15);
  const s = replay([a, b], catalog, DAY, T0 + 0.2 * H);
  assert.equal(s.world.expedition.q, 'q-pilzholz');
});

test('the hero moves along the way', () => {
  const e = expeditionEvent([], 'q-stein', 0);
  const s = replay([e], catalog, DAY, e.t);
  const home = camp(catalog);
  const place = catalog.placeById.get('steinbruch');
  const mid = heroPosition(s.world.expedition, e.t + (e.out / 2) * 60000, catalog);
  assert.ok(Math.abs(mid.x - (home.x + place.x) / 2) < 0.5);
  const there = heroPosition(s.world.expedition, e.t + (e.out + 1) * 60000, catalog);
  assert.deepEqual([there.x, there.y], [place.x, place.y]);
});

test('gathering never fails, yields more with Kraft and gets shorter with the tempo stats', () => {
  const quest = catalog.questById.get('q-stein');
  const base = { catalog, world: replay([], catalog, DAY, T0).world, fx: effects(replay([], catalog, DAY, T0).world, catalog) };
  let weakSum = 0;
  let strongSum = 0;
  for (let i = 0; i < 200; i += 1) {
    const weak = runQuest(quest, { ...base, stats: statsAt(1) }, `s${i}`);
    assert.ok(weak.reward.stein >= 2 && weak.reward.stein <= 3 && weak.cleared);
    weakSum += weak.reward.stein;
    strongSum += runQuest(quest, { ...base, stats: statsAt(9) }, `s${i}`).reward.stein;
  }
  // +5 % per level: level 9 brings about 40 % more
  assert.ok(strongSum / weakSum > 1.3 && strongSum / weakSum < 1.5, `ratio ${strongSum / weakSum}`);
  const weak = runQuest(quest, { ...base, stats: statsAt(1) }, 'x');
  const strong = runQuest(quest, { ...base, stats: statsAt(9) }, 'x');
  assert.ok(strong.stamina < weak.stamina);
  assert.equal(strong.minutes, strong.stamina * MINUTES_PER_STAMINA);
  assert.equal(speedShare(statsAt(30), ['kraft']), 0.5);
});

test('a small gathering always brings at least one piece', () => {
  const quest = catalog.questById.get('q-pilzholz-klein');
  const base = { catalog, world: replay([], catalog, DAY, T0).world, fx: effects(replay([], catalog, DAY, T0).world, catalog) };
  for (let i = 0; i < 50; i += 1) {
    assert.ok(runQuest(quest, { ...base, stats: statsAt(1) }, `k${i}`).reward.pilzholz >= 1);
  }
});

test('a single spirit is always overcome; too strong means driven off with less loot', () => {
  const quest = catalog.questById.get('q-mondsee'); // Echo, level 6
  const base = { catalog, world: replay([], catalog, DAY, T0).world, fx: effects(replay([], catalog, DAY, T0).world, catalog) };
  const weak = runQuest(quest, { ...base, stats: statsAt(1) }, 'x');
  assert.equal(weak.cleared, true);
  assert.equal(weak.fights[0].result, 'driven');
  const strong = runQuest(quest, { ...base, stats: statsAt(12) }, 'x');
  assert.notEqual(strong.fights[0].result, 'driven');
});

test('a cave: the stronger the Envoy, the deeper he gets; the cave reward only for all', () => {
  const quest = catalog.questById.get('q-echohoehle');
  const base = { catalog, world: replay([], catalog, DAY, T0).world, fx: effects(replay([], catalog, DAY, T0).world, catalog) };
  const depth = (level) => {
    let sum = 0;
    for (let i = 0; i < 40; i += 1) sum += runQuest(quest, { ...base, stats: statsAt(level) }, `c${i}`).defeated;
    return sum / 40;
  };
  assert.ok(depth(2) >= 1);
  assert.ok(depth(6) > depth(2));
  const full = runQuest(quest, { ...base, stats: statsAt(15) }, 'x');
  assert.equal(full.cleared, true);
  assert.equal(full.defeated, 5);
  assert.ok(full.reward.things.some((t) => t.id === 'beine_kampfhose_2'));
  const partial = runQuest(quest, { ...base, stats: statsAt(2) }, 'x');
  if (!partial.cleared) assert.ok(!partial.reward.things.some((t) => t.id === 'beine_kampfhose_2'));
});

test('building takes the material along and unlocks the home on return', () => {
  const gift = ev('expedition', { q: 'q-pilzholz', place: 'pilzhain', title: 'x', out: 1, act: 1, back: 1, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 0, pilzholz: 8, stein: 8, things: [], unlocks: [], rest: false } } }, 0);
  const s1 = replay([gift], catalog, DAY, T0 + H);
  assert.equal(questState(catalog.questById.get('q-zuhause'), ctxOf(s1)).status, 'open');
  const build = expeditionEvent([gift], 'q-zuhause', 1);
  const during = replay([gift, build], catalog, DAY, build.t + 60000);
  assert.equal(during.world.purse.pilzholz, 2);
  assert.equal(questState(catalog.questById.get('q-zuhause'), ctxOf(during)).status, 'running');
  const done = replay([gift, build], catalog, DAY, build.t + total(build) * 60000 + 1000);
  assert.ok(done.world.unlocked.includes('zuhause'));
  assert.equal(done.world.home, 1);
  assert.equal(questState(catalog.questById.get('q-zuhause'), ctxOf(done)).status, 'done');
});

test('quartz and Äther from older expeditions count as Pilzholz and Bannsplitter', () => {
  const old = ev('expedition', { q: 'q-pilzholz', place: 'pilzhain', title: 'x', out: 1, act: 1, back: 1, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { aether: 5, quarz: 7, stein: 7, things: [], unlocks: [], rest: false } } }, 0);
  const s1 = replay([old], catalog, DAY, T0 + H);
  assert.equal(s1.world.purse.pilzholz, 7);
  assert.equal(s1.world.purse.splitter, 5);
  const build = ev('expedition', { q: 'q-zuhause', place: 'lager', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: { quarz: 6, stein: 6 },
      reward: { splitter: 10, pilzholz: 0, stein: 0, things: [], unlocks: ['zuhause'], rest: false } } }, 0.2);
  const s2 = replay([old, build], catalog, DAY, T0 + H);
  assert.equal(s2.world.purse.pilzholz, 1);
  assert.equal(s2.world.home, 1);
});

test('stat requirements decide access', () => {
  const s = replay([], catalog, DAY, T0);
  const state = questState(catalog.questById.get('q-spalt'), ctxOf(s));
  assert.equal(state.status, 'locked');
  assert.deepEqual(state.missing, ['Beweglichkeit 4']);
});

test('the bar refills over time', () => {
  const e = expeditionEvent([], 'q-pilzholz', 0);
  const s = replay([e], catalog, DAY, T0 + 10 * H);
  assert.equal(staminaAt(s.world, T0 + 10 * H, s.stats, effects(s.world, catalog)), maxStamina(s.stats));
});

test('encounters: same list all day, fitting the hero', () => {
  const s = replay([], catalog, DAY, T0);
  const a = encountersFor(DAY, ctxOf(s));
  assert.deepEqual(a.map((q) => q.id), encountersFor(DAY, ctxOf(s)).map((q) => q.id));
  assert.ok(a.length >= 1);
  for (const q of a) {
    assert.equal(catalog.placeById.get(q.place).unlock.length, 0);
    assert.ok(catalog.monsterById.get(q.monsters[0]).stufe <= 4, q.monsters[0]);
  }
});

test('trader offers lie around the hero\'s strength; buying needs enough Bannsplitter', () => {
  const s = replay([], catalog, DAY, T0);
  const offers = offersFor(DAY, ctxOf(s));
  assert.equal(offers.length, 5);
  for (const o of offers.filter((x) => x.kind === 'item')) assert.ok(itemLevel(catalog.itemById.get(o.id)) <= 4, o.id);

  const buy = ev('buy', { offer: `${DAY}:0`, kind: 'item', thing: 'kopf_kapuze_2', price: 50 }, 3);
  assert.equal(replay([buy], catalog, DAY, T0 + 4 * H).world.items[buy.id], undefined);
  const gift = ev('expedition', { q: 'q-pilzholz', place: 'pilzhain', title: 'x', out: 1, act: 1, back: 1, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 60, pilzholz: 0, stein: 0, things: [], unlocks: ['haendler'], rest: false } } }, 0);
  const s2 = replay([gift, buy], catalog, DAY, T0 + 4 * H);
  assert.equal(s2.world.items[buy.id].id, 'kopf_kapuze_2');
  assert.equal(s2.world.purse.splitter, 10);
});

test('home: build needs material, furniture adds recovery', () => {
  const gift = ev('expedition', { q: 'q-zuhause', place: 'lager', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 200, pilzholz: 30, stein: 50, things: [{ kind: 'furniture', id: 'schlafmatte' }], unlocks: ['zuhause'], rest: false } } }, 0);
  const build = ev('build', { tier: 2, cost: catalog.home[1].cost }, 1);
  const place = ev('place', { inst: `${gift.id}:0` }, 1.5);
  const s = replay([gift, build, place], catalog, DAY, T0 + 2 * H);
  assert.equal(s.world.home, 2);
  assert.deepEqual(s.world.purse, { splitter: 140, pilzholz: 10, stein: 10 });
  assert.equal(effects(s.world, catalog).erholung, 10 + 8);
});

test('home: a build keeps the price it had, even if the table changes later', () => {
  const gift = ev('expedition', { q: 'q-zuhause', place: 'lager', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 50, pilzholz: 10, stein: 25, things: [], unlocks: ['zuhause'], rest: false } } }, 0);
  // built when the Steinhütte still cost 8 Quarz, 20 Stein and 40 Äther
  const build = ev('build', { tier: 2, cost: { quarz: 8, stein: 20, aether: 40 } }, 1);
  const s = replay([gift, build], catalog, DAY, T0 + 2 * H);
  assert.equal(s.world.home, 2);
  assert.deepEqual(s.world.purse, { splitter: 10, pilzholz: 2, stein: 5 });
});

test('equipment abilities count, never stats', () => {
  const s = replay([ev('equip', { slot: 'handschuhe', inst: 'start:handschuhe_handwickel_1' }, 0.1)], catalog, DAY, T0);
  assert.equal(effects(s.world, catalog).schaden, 1);
  assert.equal(s.stats.kraft.level, 1);
});
