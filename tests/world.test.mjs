import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects, maxStamina, staminaAt, sleepBonus } from '../js/world/hero.js';
import { wayStamina, camp } from '../js/world/map.js';
import { encountersFor, questState, questById, questsAt } from '../js/world/quests.js';
import { runQuest, speedShare, yieldBonus, gatherChance, gatherEstimate } from '../js/world/run.js';
import { planExpedition, progressAt, heroPosition } from '../js/world/expedition.js';
import { offersFor } from '../js/world/trader.js';
import { itemLevel } from '../js/world/items.js';
import { countIn, roomFor, stow } from '../js/world/inventory.js';
import { campStatus, hygge, facilityQuests } from '../js/world/camp.js';
import { RULES_NOW, BACKPACK_SIZE, GATHER_BASE, GATHER_DICE } from '../js/config.js';
import { resolveLook, layerSrc, iconSrc } from '../js/ui/look.js';

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

// An expedition as the app wrote it before actions could be added, and
// before version 5.12: every Energie a minute, the ways cost Energie too.
function expeditionEvent(events, questId, hoursAfter) {
  const s = replay(events, catalog, DAY, T0 + hoursAfter * H);
  const c = ctxOf(s);
  const quest = questById(questId, c);
  const e = ev('expedition', { q: quest.id, place: quest.place, title: quest.name }, hoursAfter);
  const plan = planExpedition(quest, c, e.id);
  const out = plan.out / RULES_NOW.pace;
  const back = plan.back / RULES_NOW.pace;
  const outcome = { ...plan.outcome, minutes: plan.outcome.stamina };
  return Object.assign(e, { out, act: outcome.minutes, back, cost: out + outcome.stamina + back, outcome });
}
const total = (e) => e.out + e.act + e.back;

test('start: at the camp, full bar, the start outfit worn without gloves and shoes, the backpack empty, no camp yet', () => {
  const s = replay([], catalog, DAY, T0);
  assert.equal(s.world.expedition, null);
  assert.equal(s.world.stamina.value, maxStamina(s.stats));
  assert.equal(s.world.equipped.torso, 'start:torso_leinenhemd_1');
  assert.equal(s.world.equipped.beine, 'start:beine_leinenhose_1');
  // the first shoes come from a quest in the Pilzhain (q-bastsandalen)
  assert.equal(s.world.equipped.schuhe, undefined);
  // the first gloves come from a quest on the Trümmerfeld (q-handwickel)
  assert.equal(s.world.equipped.handschuhe, undefined);
  assert.equal(s.world.items['start:handschuhe_handwickel_1'], undefined);
  assert.equal(s.world.items['start:torso_leinenhemd_1'].where, 'body');
  assert.equal(countIn(s.world, 'rucksack'), 0);
  assert.deepEqual(s.world.purse, { splitter: 0, pilzholz: 0, stein: 0 });
  assert.deepEqual(s.world.camp, { stage: 0, facilities: {}, deko: {}, reached: {} });
  assert.deepEqual(s.world.plans, { found: {}, search: {} });
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

test('time follows Energie: every point of work, and every point of way, is 10 seconds; only the work costs Energie', () => {
  const s = replay([], catalog, DAY, T0);
  for (const level of [1, 5, 12]) {
    const c = { ...ctxOf(s), stats: statsAt(level) };
    for (const quest of catalog.quests) {
      const plan = planExpedition(quest, c, 'x');
      assert.equal(plan.cost, plan.outcome.stamina, `${quest.id} at ${level}`);
      assert.equal(plan.act, plan.outcome.stamina * RULES_NOW.pace);
      assert.equal(plan.out, plan.back);
    }
  }
  const c = ctxOf(s);
  const quick = planExpedition(catalog.questById.get('q-stein-klein'), c, 'x');
  const long = planExpedition(catalog.questById.get('q-horizont'), c, 'x');
  assert.ok(quick.cost <= 1, `quick ${quick.cost}`);
  assert.ok(long.cost >= 60, `long ${long.cost}`);
  assert.ok(long.out + long.act + long.back < 20, `long ${long.out + long.act + long.back} minutes`);
});

test('the Energie bar: 10 per level of Ausdauer', () => {
  assert.equal(maxStamina(statsAt(1)), 10);
  assert.equal(maxStamina(statsAt(10)), 100);
});

test('an expedition takes real time and pays out once the work is done', () => {
  const e = expeditionEvent([], 'q-pilzholz', 0.1);
  assert.ok(e.out >= 1 && e.back === e.out && e.act > 0);
  const during = replay([e], catalog, DAY, e.t + (e.out + 1) * 60000);
  assert.equal(during.world.purse.pilzholz, 0);
  assert.equal(progressAt(during.world.expedition, e.t + (e.out + 1) * 60000).phase, 'work');
  assert.equal(during.world.stamina.value < maxStamina(during.stats), true);

  const after = replay([e], catalog, DAY, e.t + total(e) * 60000 + 1000);
  assert.equal(after.world.expedition, null);
  assert.ok(after.world.purse.pilzholz >= 2, `pilzholz ${after.world.purse.pilzholz}`);
  assert.equal(after.world.reports.length, 1);
});

test('events from before actions could be added: a second one while away is left out', () => {
  const a = expeditionEvent([], 'q-pilzholz', 0.1);
  const b = expeditionEvent([], 'q-stein', 0.15);
  const s = replay([a, b], catalog, DAY, T0 + 0.2 * H);
  assert.deepEqual(s.world.expedition.actions.map((x) => x.q), ['q-pilzholz']);
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
    assert.ok(weak.reward.stein >= 16 && weak.reward.stein <= 20 && weak.cleared);
    weakSum += weak.reward.stein;
    strongSum += runQuest(quest, { ...base, stats: statsAt(9) }, `s${i}`).reward.stein;
  }
  // +5 % per level: level 9 brings about 40 % more
  assert.ok(strongSum / weakSum > 1.3 && strongSum / weakSum < 1.5, `ratio ${strongSum / weakSum}`);
  const weak = runQuest(quest, { ...base, stats: statsAt(1) }, 'x');
  const strong = runQuest(quest, { ...base, stats: statsAt(9) }, 'x');
  assert.ok(strong.stamina < weak.stamina);
  assert.equal(strong.minutes, strong.stamina * RULES_NOW.pace);
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

test('a cave: the stronger the Envoy, the deeper she gets; the cave reward only for all', () => {
  const quest = catalog.questById.get('q-echohoehle');
  const base = { catalog, world: replay([], catalog, DAY, T0).world, fx: effects(replay([], catalog, DAY, T0).world, catalog) };
  const depth = (level) => {
    let sum = 0;
    for (let i = 0; i < 40; i += 1) sum += runQuest(quest, { ...base, stats: statsAt(level) }, `c${i}`).defeated;
    return sum / 40;
  };
  assert.ok(depth(2) >= 1);
  assert.ok(depth(6) > depth(2));
  // the cave's own reward (here a piece of clothing, as if it were drawn) only when all are overcome
  const drawnCatalog = { ...catalog, itemById: new Map([...catalog.itemById].map(([id, item]) => [id, id === 'beine_kampfhose_2' ? { ...item, figur: 'x.png' } : item])) };
  const withDrawing = { ...base, catalog: drawnCatalog };
  const full = runQuest(quest, { ...withDrawing, stats: statsAt(15) }, 'x');
  assert.equal(full.cleared, true);
  assert.equal(full.defeated, 5);
  assert.ok(full.reward.things.some((t) => t.id === 'beine_kampfhose_2'));
  const partial = runQuest(quest, { ...withDrawing, stats: statsAt(2) }, 'x');
  if (!partial.cleared) assert.ok(!partial.reward.things.some((t) => t.id === 'beine_kampfhose_2'));
});

test('a piece that is not drawn yet is never given: not by a quest, not by the trader, not as loot', () => {
  const s = replay([], catalog, DAY, T0);
  const undrawn = new Set(catalog.equipment.filter((i) => !i.figur && !Object.keys(i.figuren || {}).length).map((i) => i.id));
  assert.ok(undrawn.has('beine_kampfhose_2'));
  const quest = catalog.questById.get('q-echohoehle');
  const full = runQuest(quest, { ...ctxOf(s), stats: statsAt(15) }, 'x');
  assert.equal(full.cleared, true);
  assert.ok(full.reward.splitter >= 30);
  for (const level of [1, 4, 8, 12]) {
    const c = { ...ctxOf(s), stats: statsAt(level), statsAtDayStart: statsAt(level) };
    for (let d = 0; d < 30; d += 1) {
      for (const offer of offersFor(`2026-06-${String(d + 1).padStart(2, '0')}`, c)) assert.ok(!undrawn.has(offer.id), `trader ${offer.id}`);
    }
    for (let i = 0; i < 40; i += 1) {
      const out = runQuest(quest, { ...c, stats: statsAt(level) }, `l${level}-${i}`);
      for (const t of out.reward.things) assert.ok(!undrawn.has(t.id), `loot ${t.id}`);
    }
  }
});

// An expedition that only brings things, as a gift for the test.
function gift(reward, hoursAfter = 0, place = 'lager', consumed = {}) {
  return ev('expedition', { q: 'q-test', place, title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed,
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: [], rest: false, ...reward } } }, hoursAfter);
}

test('the Lagerfeuer: needs 8 Stein and 2 Pilzholz, takes them along and gives the camp its first stage', () => {
  const fire = catalog.questById.get('q-lagerfeuer');
  assert.deepEqual(fire.consumes, { stein: 8, pilzholz: 2 });
  const s0 = replay([], catalog, DAY, T0);
  assert.equal(questState(fire, ctxOf(s0)).status, 'locked');
  const material = gift({ stein: 8, pilzholz: 2 }, 0);
  const s1 = replay([material], catalog, DAY, T0 + H);
  assert.deepEqual(s1.world.purse, { splitter: 0, pilzholz: 2, stein: 8 });
  assert.equal(questState(fire, ctxOf(s1)).status, 'open');
  const build = expeditionEvent([material], 'q-lagerfeuer', 1);
  const during = replay([material, build], catalog, DAY, build.t + 60000);
  assert.deepEqual(during.world.purse, { splitter: 0, pilzholz: 0, stein: 0 });
  assert.equal(during.world.camp.stage, 0);
  assert.equal(questState(fire, ctxOf(during)).status, 'running');
  const done = replay([material, build], catalog, DAY, build.t + total(build) * 60000 + 1000);
  assert.equal(done.world.camp.stage, 1);
  assert.equal(questState(fire, ctxOf(done)).status, 'done');
});

test('quartz and Äther from older expeditions count as Pilzholz and Bannsplitter', () => {
  const old = ev('expedition', { q: 'q-pilzholz', place: 'pilzhain', title: 'x', out: 1, act: 1, back: 1, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { aether: 5, quarz: 4, stein: 4, things: [], unlocks: [], rest: false } } }, 0);
  const s1 = replay([old], catalog, DAY, T0 + H);
  assert.equal(s1.world.purse.pilzholz, 4);
  assert.equal(s1.world.purse.splitter, 5);
  const build = ev('expedition', { q: 'q-lagerfeuer', place: 'lager', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: { quarz: 3, stein: 3 },
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: ['lagerfeuer'], rest: false } } }, 0.2);
  const s2 = replay([old, build], catalog, DAY, T0 + H);
  assert.equal(s2.world.purse.pilzholz, 1);
  assert.equal(s2.world.camp.stage, 1);
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
  assert.equal(offers.filter((x) => x.kind === 'item').length, 5);
  assert.equal(offers.filter((x) => x.kind === 'trank').length, 4);   // two of each potion
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

test('the camp: facilities need the fire, each adds its own Hygge, 5 open the next stage', () => {
  const noFire = replay([gift({ pilzholz: 6, stein: 4 })], catalog, DAY, T0 + H);
  const waiting = facilityQuests(noFire.world, catalog);
  assert.ok(waiting.every((q) => questState(q, ctxOf(noFire)).status === 'locked'));
  const fire = replay([gift({ unlocks: ['lagerfeuer'] })], catalog, DAY, T0 + H);
  const offered = facilityQuests(fire.world, catalog).map((q) => q.id);
  assert.deepEqual(offered, ['bau:steinlager:1', 'bau:pilzlager:1', 'bau:aufbewahrung:1', 'bau:schlafplatz:1']);
  // they are built on the Lager page, not offered on the map
  assert.equal(questsAt('lager', ctxOf(fire)).filter((q) => q.facility).length, 0);
  assert.equal(campStatus(fire.world, catalog).hygge, 0);
  assert.equal(campStatus(fire.world, catalog).need, 5);

  // Steinlager and Pilzlager 1 each, Krempelplatz 2, Schlafplatz 3
  const two = replay([gift({ unlocks: ['lagerfeuer', 'steinlager:1', 'pilzlager:1'] })], catalog, DAY, T0 + H);
  assert.equal(hygge(two.world, catalog), 2);
  assert.equal(campStatus(two.world, catalog).ready, false);
  const three = replay([gift({ unlocks: ['lagerfeuer', 'steinlager:1', 'pilzlager:1', 'schlafplatz:1'] })], catalog, DAY, T0 + H);
  assert.equal(campStatus(three.world, catalog).hygge, 5);
  assert.equal(campStatus(three.world, catalog).ready, true);
  const cosy = replay([gift({ unlocks: ['lagerfeuer', 'aufbewahrung:1', 'schlafplatz:1'] })], catalog, DAY, T0 + H);
  assert.equal(campStatus(cosy.world, catalog).ready, true);
  // a built facility is not offered again
  assert.ok(!facilityQuests(three.world, catalog).some((q) => q.id === 'bau:steinlager:1'));
});

test('a facility is built like a quest: material and Energie, then it stands', () => {
  const start = [gift({ unlocks: ['lagerfeuer'], pilzholz: 4 })];
  const s0 = replay(start, catalog, DAY, T0 + H);
  const quest = facilityQuests(s0.world, catalog).find((q) => q.id === 'bau:steinlager:1');
  assert.deepEqual(quest.consumes, { pilzholz: 4 });
  assert.equal(questState(quest, ctxOf(s0)).status, 'open');
  const build = expeditionEvent(start, 'bau:steinlager:1', 1);
  assert.equal(build.cost, 2);
  const done = replay([...start, build], catalog, DAY, build.t + total(build) * 60000 + 1000);
  assert.equal(done.world.camp.facilities.steinlager, 1);
  assert.equal(done.world.purse.pilzholz, 0);
});

test('the Aufbewahrung gives places for things; away, it can only be looked at', () => {
  const camp1 = gift({ unlocks: ['lagerfeuer', 'aufbewahrung:1'] }, 0);
  const shirt = 'start:torso_leinenhemd_1';
  const takeOff = ev('unequip', { slot: 'torso' }, 0.9);
  const store = ev('move', { inst: shirt, to: 'schrank' }, 1);
  const away = expeditionEvent([camp1, takeOff, store], 'q-stein', 1.1);            // back after 8 minutes
  const takeOut = ev('move', { inst: shirt, to: 'rucksack' }, 1.12);
  const wear = ev('equip', { slot: 'torso', inst: shirt }, 1.13);
  const s = replay([camp1, takeOff, store, away, takeOut, wear], catalog, DAY, T0 + 1.14 * H);
  assert.ok(s.world.expedition);
  assert.equal(s.world.items[shirt].where, 'schrank');
  assert.equal(s.world.equipped.torso, undefined);

  const back = ev('equip', { slot: 'torso', inst: shirt }, 2);
  const s2 = replay([camp1, takeOff, store, away, takeOut, wear, back], catalog, DAY, T0 + 2.1 * H);
  assert.equal(s2.world.equipped.torso, shirt);
  // without the facility nothing goes into the storage
  const none = replay([takeOff, ev('move', { inst: shirt, to: 'schrank' }, 1)], catalog, DAY, T0 + 2 * H);
  assert.equal(none.world.items[shirt].where, 'rucksack');
});

test('the Envoy: name and look from the latest envoy event, trimmed', () => {
  assert.equal(replay([], catalog, DAY, T0).world.envoy, null);
  const first = ev('envoy', { name: '  Mira ', figur: 'erste', haut: 'braun', haar: 'schwarz' }, 0.1);
  const empty = ev('envoy', { name: '   ', figur: 'zweite' }, 0.2);
  const later = ev('envoy', { name: 'Mira Kupfer', figur: 'erste', haut: 'hell', haar: 'kupfer' }, 0.3);
  assert.deepEqual(replay([first, empty], catalog, DAY, T0 + H).envoy, { name: 'Mira', figur: 'erste', haut: 'braun', haar: 'schwarz', unterhemd: true, geburtsjahr: null });
  assert.equal(replay([first, empty, later], catalog, DAY, T0 + H).envoy.haar, 'kupfer');
  // the year of birth from the age at the creation
  const child = ev('envoy', { name: 'Mira', figur: 'erste', haut: 'braun', haar: 'schwarz', geburtsjahr: 2016 }, 0.4);
  assert.equal(replay([first, child], catalog, DAY, T0 + H).envoy.geburtsjahr, 2016);
});

test('the backpack has five places', () => {
  assert.equal(BACKPACK_SIZE, 5);
});

test('equipment abilities count, never stats', () => {
  const s = replay([], catalog, DAY, T0);
  assert.equal(effects(s.world, catalog).schaden, 0);   // no gloves at the start
  const found = expeditionEvent([], 'q-handwickel', 0.1);
  const back = replay([found], catalog, DAY, T0 + H);
  const wraps = Object.values(back.world.items).find((i) => i.id === 'handschuhe_handwickel_1');
  const worn = replay([found, ev('equip', { slot: 'handschuhe', inst: wraps.inst }, 0.9)], catalog, DAY, T0 + H);
  assert.equal(effects(worn.world, catalog).schaden, 1);
  assert.equal(worn.stats.kraft.level, 1);
});

test('an achievement bonus on gathering adds to the pieces, not to the Bannsplitter', () => {
  const s = replay([], catalog, DAY, T0);
  const quest = catalog.questById.get('q-stein');
  const plain = yieldBonus(quest, ctxOf(s));
  const boosted = yieldBonus(quest, { ...ctxOf(s), bonus: { sammeln: 0.1 } });
  assert.ok(Math.abs(boosted.pieces - plain.pieces - 0.1) < 1e-9);
  assert.equal(boosted.splitter, plain.splitter);
  const explore = catalog.questById.get('q-uferkies');
  assert.equal(yieldBonus(explore, { ...ctxOf(s), bonus: { sammeln: 0.1 } }).pieces, 1);
});

test('the undershirt: worn by a figure that has one, unless switched off; no slot', () => {
  assert.equal(resolveLook({ figur: 'erste' }).undershirt, false);
  assert.equal(resolveLook({ figur: 'zweite' }).undershirt, true);
  assert.equal(resolveLook({ figur: 'zweite', unterhemd: true }).undershirt, true);
  assert.equal(resolveLook({ figur: 'zweite', unterhemd: false }).undershirt, false);
  const on = ev('envoy', { name: 'Jon', figur: 'zweite' }, 0.1);
  const off = ev('envoy', { name: 'Jon', figur: 'zweite', unterhemd: false }, 0.2);
  assert.equal(replay([on], catalog, DAY, T0 + H).world.envoy.unterhemd, true);
  assert.equal(replay([on, off], catalog, DAY, T0 + H).world.envoy.unterhemd, false);
  assert.equal(replay([on, off, ev('envoy', { name: 'Jon', figur: 'zweite', unterhemd: true }, 0.3)], catalog, DAY, T0 + H).world.envoy.unterhemd, true);
  // nothing is worn in a slot for it
  assert.deepEqual(Object.keys(replay([on], catalog, DAY, T0 + H).world.equipped).sort(), ['beine', 'torso']);
});

test('the second figure wears its own layers and shows its own icons', () => {
  const shirt = catalog.itemById.get('torso_leinenhemd_1');
  const first = resolveLook({ figur: 'erste' });
  const second = resolveLook({ figur: 'zweite' });
  assert.match(layerSrc(shirt, first), /^assets\/figur\/torso_leinenhemd_1\.png/);
  assert.match(layerSrc(shirt, second), /^assets\/figur\/zweite\/torso_leinenhemd_1\.png/);
  assert.match(iconSrc(shirt, first), /^assets\/icons\/icon_torso_leinenhemd_1\.png/);
  assert.match(iconSrc(shirt, second), /^assets\/icons\/zweite\/icon_torso_leinenhemd_1\.png/);
  // every own layer of the second figure comes with its own icon
  for (const item of catalog.equipment) {
    if (item.figuren?.zweite) assert.ok(item.icons?.zweite, `${item.id}: Icon der zweiten Figur fehlt`);
  }
});

test('a potion from the trader fills the Energie, never beyond the end of the bar', () => {
  const gift = ev('expedition', { q: 'q-pilzholz', place: 'pilzhain', title: 'x', out: 0, act: 1, back: 0, cost: 8,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 60, pilzholz: 0, stein: 0, things: [], unlocks: ['haendler'], rest: false } } }, 0);
  const tea = ev('buy', { offer: `${DAY}:trank:pilztee:0`, kind: 'trank', thing: 'pilztee', price: 12 }, 0.05);
  const s = replay([gift, tea], catalog, DAY, T0 + 0.06 * H);
  assert.equal(s.world.purse.splitter, 48);
  assert.ok(Math.abs(s.world.stamina.value - 10) < 0.05, `${s.world.stamina.value}`);   // 2 + 10, but only up to 10
  const again = ev('buy', { offer: `${DAY}:trank:pilztee:0`, kind: 'trank', thing: 'pilztee', price: 12 }, 0.07);
  assert.equal(replay([gift, tea, again], catalog, DAY, T0 + 0.08 * H).world.purse.splitter, 48);   // the same one only once
});

test('the higher the requirement of a piece, the bigger its bonuses', async () => {
  const { rollBonuses } = await import('../js/world/bonuses.js');
  const { seededRandom } = await import('../js/world/rng.js');
  let low = 0;
  let high = 0;
  for (let i = 0; i < 500; i += 1) {
    // the same dice: the same Güte and the same bonuses, only their size differs
    const a = rollBonuses('arena', 5, seededRandom(`r${i}`), 0);
    const b = rollBonuses('arena', 5, seededRandom(`r${i}`), 8);
    assert.deepEqual(Object.keys(a.bonus), Object.keys(b.bonus));
    for (const key of Object.keys(a.bonus)) {
      assert.ok(b.bonus[key] >= a.bonus[key]);
      low += a.bonus[key];
      high += b.bonus[key];
    }
  }
  assert.ok(high > 1.3 * low, `${low} ${high}`);
});

test('pieces found, dropped or offered get a Güte and bonuses; worn, the bonuses count', async () => {
  const { rollBonuses, cleanBonuses } = await import('../js/world/bonuses.js');
  const { seededRandom } = await import('../js/world/rng.js');
  const counts = {};
  for (let i = 0; i < 2000; i += 1) {
    const r = rollBonuses('fund', 5, seededRandom(`b${i}`));
    counts[r.guete || 'schlicht'] = (counts[r.guete || 'schlicht'] || 0) + 1;
    if (r.guete) {
      assert.equal(Object.keys(r.bonus).length, { gut: 1, selten: 2, praechtig: 3 }[r.guete]);
      for (const key of Object.keys(r.bonus)) assert.ok(!['kraft', 'ausdauer', 'beweglichkeit', 'gelassenheit'].includes(key));
    }
  }
  // the shares of QUALITY_CHANCES.fund, give or take a little
  const { QUALITY_CHANCES } = await import('../js/config.js');
  ['schlicht', 'gut', 'selten', 'praechtig'].forEach((id, i) => {
    assert.ok(Math.abs(counts[id] / 2000 - QUALITY_CHANCES.fund[i] / 100) < 0.04, JSON.stringify(counts));
  });
  assert.deepEqual(cleanBonuses({ guete: 'gut', bonus: { kraft: 5 } }), {});
  // a bought piece with a bonus, worn: its bonus counts in the effects
  const gift = ev('expedition', { q: 'q-pilzholz', place: 'pilzhain', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 200, pilzholz: 0, stein: 0, things: [], unlocks: ['haendler'], rest: false } } }, 0);
  const item = catalog.equipment.find((i) => i.herkunft.includes('fund') && i.slot === 'torso' && i.passt?.includes('erste') && !Object.keys(i.req || {}).length);
  const buy = ev('buy', { offer: `${DAY}:9`, kind: 'item', thing: item.id, price: 20, guete: 'selten', bonus: { erholung: 9, schaden: 2 } }, 0.05);
  const wear = ev('equip', { slot: 'torso', inst: buy.id }, 0.06);
  const s = replay([gift, buy, wear], catalog, DAY, T0 + 0.07 * H);
  assert.deepEqual([s.world.items[buy.id].guete, s.world.items[buy.id].bonus], ['selten', { erholung: 9, schaden: 2 }]);
  const fx = effects(s.world, catalog);
  assert.equal(fx.erholung, 9);
  assert.equal(fx.schaden, 2);
});

test('die Tiefen: one Ebene after another, a rest after each descent, nothing lost when the Wächter is too strong', async () => {
  const { nextFloor, descend, guardian, prospect, blockedAt, restMinutes } = await import('../js/world/depths.js');
  const fire = ev('expedition', { q: 'q-lagerfeuer', place: 'truemmerfeld', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: ['lagerfeuer'], rest: false } } }, 0);
  // closed before the Lagerfeuer
  assert.equal(blockedAt(replay([], catalog, DAY, T0).world, T0), 'closed');
  const before = replay([fire], catalog, DAY, T0 + 0.1 * H);
  assert.equal(blockedAt(before.world, T0 + 0.1 * H), null);
  const floor = nextFloor(before.world);
  assert.deepEqual([floor.depth.id, floor.ebene], ['brunnen', 1]);
  // the first Wächter is weak, the last of the first Tiefe much stronger
  const first = guardian(floor, catalog);
  const last = guardian({ depth: floor.depth, ebene: 10 }, catalog);
  assert.ok(last.leben > first.leben * 2 && last.kraft > first.kraft);
  assert.ok(prospect(ctxOf(before), floor) > 0.8);
  assert.ok(prospect(ctxOf(before), { depth: floor.depth, ebene: 10 }) < 0.05);

  // a descent won: Bannsplitter, the Ebene overcome, then a rest
  const won = ev('tiefe', { tiefe: 'brunnen', ebene: 1 }, 0.1);
  won.outcome = { tiefe: 'brunnen', ebene: 1, monster: 'zauderling', result: 'won', rounds: [], heroMax: 11, monsterMax: 11,
    reward: { splitter: 13, things: [] } };
  const s1 = replay([fire, won], catalog, DAY, T0 + 0.2 * H);
  assert.equal(s1.world.tiefen.cleared.brunnen, 1);
  assert.equal(s1.world.purse.splitter, 13);
  assert.equal(s1.world.tiefen.rest, won.t + restMinutes(s1.stats) * 60000);
  assert.equal(blockedAt(s1.world, T0 + 0.2 * H), 'rest');
  // during the rest, or for the wrong Ebene, a descent does not count
  const early = ev('tiefe', { tiefe: 'brunnen', ebene: 2 }, 0.3);
  early.outcome = { ...won.outcome, ebene: 2, reward: { splitter: 16, things: [] } };
  assert.equal(replay([fire, won, early], catalog, DAY, T0 + 0.4 * H).world.tiefen.cleared.brunnen, 1);
  const wrong = ev('tiefe', { tiefe: 'brunnen', ebene: 3 }, 1.2);
  wrong.outcome = { ...won.outcome, ebene: 3 };
  assert.equal(replay([fire, won, wrong], catalog, DAY, T0 + 1.3 * H).world.tiefen.cleared.brunnen, 1);
  // too strong: the Envoy withdraws with a little, the Ebene stays
  const lost = ev('tiefe', { tiefe: 'brunnen', ebene: 2 }, 1.2);
  lost.outcome = { ...won.outcome, ebene: 2, result: 'lost', reward: { splitter: 4, things: [] } };
  const s2 = replay([fire, won, lost], catalog, DAY, T0 + 1.3 * H);
  assert.equal(s2.world.tiefen.cleared.brunnen, 1);
  assert.equal(s2.world.purse.splitter, 17);
  assert.equal(nextFloor(s2.world).ebene, 2);

  // rolled for real: a sure piece of clothing on Ebene 5 comes with a Güte, at least gut
  const c = ctxOf(before);
  const five = descend({ ...c, stats: statsAt(8) }, { depth: floor.depth, ebene: 5 }, 'tiefe-test');
  assert.equal(five.result === 'lost', false);
  assert.equal(five.reward.things.length, 1);
  assert.ok(['gut', 'selten', 'praechtig'].includes(five.reward.things[0].guete));
  // equipment matters: the same Envoy with bonuses fares better against a strong Wächter
  const strong = { depth: floor.depth, ebene: 10 };
  const plain = prospect({ ...c, stats: statsAt(5) }, strong);
  const dressed = prospect({ ...c, stats: statsAt(5), fx: { ...c.fx, schaden: 3, treffer: 12, ausweichen: 8 } }, strong);
  assert.ok(dressed > plain + 0.15, `${plain} → ${dressed}`);
});

test('der Aushang: a few Aufträge a day, each once, without Energie, the reward from the note', async () => {
  const { jobsFor, jobOutcome, jobState } = await import('../js/world/jobs.js');
  const fire = ev('expedition', { q: 'q-lagerfeuer', place: 'truemmerfeld', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: ['lagerfeuer'], rest: false } } }, 0);
  const s0 = replay([fire], catalog, DAY, T0 + 0.1 * H);
  const c = ctxOf(s0);
  const jobs = jobsFor(DAY, c);
  assert.equal(jobs.length, 3);
  assert.deepEqual(jobsFor(DAY, c), jobs);                     // the same all day
  for (const j of jobs) {
    assert.ok(j.minutes >= 4 && j.splitter > 0 && catalog.placeById.get(j.place));
    if (j.thing) assert.ok(catalog.itemById.get(j.thing.id));
  }
  const job = jobs[0];
  const take = (hoursAfter, fields = {}) => Object.assign(ev('expedition', { q: job.id, place: job.place, title: job.name, regel: 2, least: 0 }, hoursAfter), { outcome: jobOutcome(job) }, fields);
  const first = take(0.1);
  const busy = replay([fire, first], catalog, DAY, T0 + 0.11 * H);
  assert.ok(Math.abs(busy.world.stamina.value - s0.world.stamina.value) < 0.1);   // no Energie
  assert.equal(jobState(job, busy.world), 'running');
  const after = replay([fire, first], catalog, DAY, T0 + 2 * H);
  assert.equal(after.world.expedition, null);
  assert.equal(after.world.purse.splitter, job.splitter);
  assert.equal(jobState(job, after.world), 'done');
  if (job.thing) assert.ok(Object.values(after.world.items).some((e) => e.id === job.thing.id));
  // the same Auftrag again, or one of another day, does not count
  const again = take(2.1);
  assert.equal(replay([fire, first, again], catalog, DAY, T0 + 4 * H).world.purse.splitter, job.splitter);
  const old = take(2.2, { d: '2026-05-02' });
  assert.equal(replay([fire, first, old], catalog, '2026-05-02', T0 + 30 * H).world.purse.splitter, job.splitter);
  // not before the Lagerfeuer
  assert.equal(replay([take(0)], catalog, DAY, T0 + 2 * H).world.purse.splitter, 0);
});

test('Einweben: the strength of one piece goes into another of the same slot, which keeps its look; the first is gone', async () => {
  const { weaveBlock } = await import('../js/world/weave.js');
  const fire = ev('expedition', { q: 'q-lagerfeuer', place: 'truemmerfeld', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'bauen', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 400, pilzholz: 0, stein: 0, things: [], unlocks: ['lagerfeuer', 'haendler'], rest: false } } }, 0);
  const tops = catalog.equipment.filter((i) => i.herkunft.includes('fund') && i.slot === 'torso' && i.passt?.includes('erste') && !Object.keys(i.req || {}).length);
  const shoes = catalog.equipment.find((i) => i.herkunft.includes('fund') && i.slot === 'schuhe' && i.passt?.includes('erste'));
  const fav = ev('buy', { offer: `${DAY}:a`, kind: 'item', thing: tops[0].id, price: 1, farbe: 'petrol', guete: 'gut', bonus: { glueck: 5 } }, 0.05);
  const strong = ev('buy', { offer: `${DAY}:b`, kind: 'item', thing: tops[1].id, price: 1, guete: 'praechtig', bonus: { schaden: 2, treffer: 4, erholung: 9 } }, 0.06);
  const other = ev('buy', { offer: `${DAY}:c`, kind: 'item', thing: shoes.id, price: 1, guete: 'selten', bonus: { ausweichen: 3, glueck: 6 } }, 0.07);
  const wear = ev('equip', { slot: 'torso', inst: strong.id }, 0.08);
  const weave = ev('weben', { ziel: fav.id, quelle: strong.id }, 0.09);
  const s = replay([fire, fav, strong, other, wear, weave], catalog, DAY, T0 + 0.1 * H);
  const kept = s.world.items[fav.id];
  assert.deepEqual([kept.id, kept.farbe, kept.guete, kept.bonus], [tops[0].id, 'petrol', 'praechtig', { schaden: 2, treffer: 4, erholung: 9 }]);
  assert.equal(s.world.items[strong.id], undefined);          // fallen to threads
  assert.equal(s.world.equipped.torso, undefined);           // it was worn, now gone
  // another slot, or a piece without bonuses, does not weave
  const wrong = ev('weben', { ziel: fav.id, quelle: other.id }, 0.095);
  assert.equal(replay([fire, fav, strong, other, wear, weave, wrong], catalog, DAY, T0 + 0.1 * H).world.items[other.id].guete, 'selten');
  const plain = ev('weben', { ziel: strong.id, quelle: 'start:torso_leinenhemd_1' }, 0.085);
  assert.ok(replay([fire, fav, strong, plain], catalog, DAY, T0 + 0.1 * H).world.items['start:torso_leinenhemd_1']);
  // since 5.20.4 only from a piece the Envoy can wear now; earlier weavings keep counting
  const demanding = catalog.equipment.find((i) => i.herkunft.includes('fund') && i.slot === 'torso' && i.passt?.includes('erste') && (i.req?.kraft || 0) >= 3);
  const high = ev('buy', { offer: `${DAY}:d`, kind: 'item', thing: demanding.id, price: 1, guete: 'praechtig', bonus: { schaden: 5, treffer: 9, glueck: 12 } }, 0.065);
  const newWeave = ev('weben', { ziel: fav.id, quelle: high.id, tragbar: true }, 0.09);
  const refused = replay([fire, fav, high, newWeave], catalog, DAY, T0 + 0.1 * H);
  assert.equal(refused.world.items[fav.id].guete, 'gut');      // Kraft 1 is not enough to wear it
  assert.ok(refused.world.items[high.id]);
  const { weaveSources } = await import('../js/world/weave.js');
  assert.ok(!weaveSources(refused.world, catalog, refused.world.items[fav.id], refused.stats).some((e) => e.inst === high.id));
  const oldWeave = ev('weben', { ziel: fav.id, quelle: high.id }, 0.09);
  assert.equal(replay([fire, fav, high, oldWeave], catalog, DAY, T0 + 0.1 * H).world.items[fav.id].guete, 'praechtig');
  // only at the Lagerfeuer, not while away
  assert.equal(weaveBlock({ camp: { stage: 0 }, expedition: null }), 'fire');
  assert.equal(weaveBlock({ camp: { stage: 1 }, expedition: { actions: [] } }), 'away');
  assert.equal(weaveBlock(s.world), null);
});
