import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects, maxStamina, staminaAt, sleepBonus } from '../js/world/hero.js';
import { questById, questsAt } from '../js/world/quests.js';
import { gatherChance, gatherEstimate, gatherRoll, runQuest } from '../js/world/run.js';
import { planExpedition } from '../js/world/expedition.js';
import { roomFor, storeCapacity, materialLimit, hasSpace, stow } from '../js/world/inventory.js';
import { seededRandom } from '../js/world/rng.js';
import { addDays, dayKey } from '../js/days.js';
import { BACKPACK_SIZE, MATERIAL_WITHOUT_STORE, GATHER_BASE, GATHER_DICE, GATHER_FIND_CHANCE } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const NEXT = '2026-05-02';
const T0 = Date.parse(`${DAY}T08:00:00`);
const H = 3600000;
let n = 0;
function ev(type, fields, hoursAfter = 0, day = DAY) {
  n += 1;
  return { id: `c-${n}`, t: T0 + hoursAfter * H + n, d: day, dev: 't', type, ...fields };
}
function ctxOf(state, extra = {}) {
  return {
    catalog, world: state.world, stats: state.stats, statsAtDayStart: state.statsAtDayStart,
    fx: effects(state.world, catalog), totals: state.totals, day: state.today, ...extra,
  };
}
function gift(reward, hoursAfter = 0, consumed = {}, day = DAY) {
  return ev('expedition', { q: 'q-test', place: 'lager', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed,
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: [], rest: false, ...reward } } }, hoursAfter, day);
}
// Starts an expedition like the app does.
function expeditionEvent(events, questId, hoursAfter, options = {}) {
  const s = replay(events, catalog, DAY, T0 + hoursAfter * H);
  const c = ctxOf(s);
  const quest = questById(questId, c);
  const e = ev('expedition', { q: quest.id, place: quest.place, title: quest.name }, hoursAfter);
  const energy = staminaAt(s.world, e.t, s.stats, c.fx);
  const plan = planExpedition(quest, c, e.id, { ...options, energy });
  return Object.assign(e, { out: plan.out, act: plan.act, back: plan.back, cost: plan.cost, outcome: plan.outcome });
}
const total = (e) => e.out + e.act + e.back;

// --- the Vorrat -----------------------------------------------------------------

test('Pilzholz and Stein lie in the Vorrat, not in the backpack: ten of each without a store', () => {
  assert.equal(MATERIAL_WITHOUT_STORE, 10);
  const s = replay([gift({ stein: 8, pilzholz: 2 })], catalog, DAY, T0 + H);
  assert.equal(materialLimit(s.world, catalog, 'stein'), 10);
  assert.equal(roomFor(s.world, catalog, 'stein'), 2);
  assert.equal(roomFor(s.world, catalog, 'pilzholz'), 8);
  assert.equal(hasSpace(s.world, catalog, 'rucksack'), true);   // the backpack is for things
});

test('more than fits stays behind and is noted in the report', () => {
  const s = replay([gift({ stein: 14 })], catalog, DAY, T0 + H);
  assert.equal(s.world.purse.stein, 10);
  assert.deepEqual(s.world.reports.at(-1).leftBehind, { stein: 4 });
});

test('a Steinlager holds more: what it holds is the limit for Stein', () => {
  const camp1 = gift({ unlocks: ['lagerfeuer', 'steinlager:1'] }, 0);
  const s = replay([camp1, gift({ stein: 10 }, 0.2)], catalog, DAY, T0 + H);
  assert.equal(storeCapacity(s.world, catalog, 'stein'), 20);
  assert.equal(materialLimit(s.world, catalog, 'stein'), 20);
  assert.equal(roomFor(s.world, catalog, 'stein'), 10);
  assert.equal(materialLimit(s.world, catalog, 'pilzholz'), 10);   // no Pilzlager yet
  const full = replay([camp1, gift({ stein: 20 }, 0.2), gift({ stein: 6 }, 0.4)], catalog, DAY, T0 + H);
  assert.equal(full.world.purse.stein, 20);
  assert.deepEqual(full.world.reports.at(-1).leftBehind, { stein: 6 });
});

test('things go into the backpack while it has places left, material does not take any', () => {
  const s = replay([gift({ stein: 10, pilzholz: 10 })], catalog, DAY, T0 + H);
  const world = structuredClone(s.world);
  for (let i = 0; i < BACKPACK_SIZE; i += 1) {
    assert.equal(hasSpace(world, catalog, 'rucksack'), true);
    stow(world, catalog, { inst: `t${i}`, kind: 'item', id: 'kopf_kapuze_2', got: i });
  }
  assert.equal(hasSpace(world, catalog, 'rucksack'), false);
  assert.equal(stow(world, catalog, { inst: 'x', kind: 'item', id: 'kopf_kapuze_2', got: 9 }), 'rucksack');   // over-full, no storage yet
});

// --- gathering ------------------------------------------------------------------

const GATHER = (material) => questById(`gather:${material}`, ctxOf(replay([], catalog, DAY, T0)));

test('gathering is offered on the Trümmerfeld beside the camp from the start and costs no way', () => {
  const s = replay([], catalog, DAY, T0);
  const field = catalog.places.find((p) => p.typ === 'truemmerfeld');
  const ids = questsAt(field.id, ctxOf(s)).map((q) => q.id);
  // besides the gathering: the quest for the first gloves
  assert.deepEqual(ids.sort(), ['gather:pilzholz', 'gather:stein', 'q-handwickel']);
  // the Lagerfeuer is a quest of its own, at the camp
  assert.deepEqual(questsAt('lager', ctxOf(s)).map((q) => q.id), ['q-lagerfeuer']);
  assert.equal(GATHER('stein').place, field.id);
  const plan = planExpedition(GATHER('stein'), ctxOf(s), 'x', { amount: 6, energy: 10 });
  assert.equal(plan.out, 0);
  assert.equal(plan.back, 0);
  assert.equal(plan.act, plan.outcome.stamina);
  assert.equal(plan.cost, plan.outcome.stamina);
});

test('every Energie brings at least two pieces and at most four, never less, however the dice fall', () => {
  assert.equal(GATHER_BASE, 2);
  assert.equal(GATHER_DICE, 2);
  const rng = seededRandom('dice');
  const seen = new Set();
  for (let i = 0; i < 2000; i += 1) seen.add(gatherRoll(rng, gatherChance(1)));
  assert.deepEqual([...seen].sort(), [2, 3, 4]);
  // on average 2.5 at level 1
  const rng2 = seededRandom('average');
  let sum = 0;
  for (let i = 0; i < 20000; i += 1) sum += gatherRoll(rng2, gatherChance(1));
  assert.ok(Math.abs(sum / 20000 - 2.5) < 0.05, `average ${sum / 20000}`);
});

test('a higher stat raises the chance of the dice, not the minimum', () => {
  assert.equal(gatherChance(1), 0.25);
  assert.ok(gatherChance(10) > gatherChance(1));
  assert.ok(gatherChance(100) <= 0.9);
  const s = replay([], catalog, DAY, T0);
  const strong = { ...s.stats, kraft: { ...s.stats.kraft, level: 20 } };
  assert.ok(gatherEstimate(GATHER('stein'), ctxOf(s, { stats: strong }), { amount: 8, energy: 10 }).average
    > gatherEstimate(GATHER('stein'), ctxOf(s), { amount: 8, energy: 10 }).average);
});

test('Stein follows Kraft, Pilzholz follows Beweglichkeit', () => {
  assert.equal(GATHER('stein').gather.stat, 'kraft');
  assert.equal(GATHER('pilzholz').gather.stat, 'beweglichkeit');
});

test('to a set amount: exactly that many, never more', () => {
  const s = replay([], catalog, DAY, T0);
  for (let i = 0; i < 50; i += 1) {
    const exact = runQuest(GATHER('stein'), ctxOf(s), `menge${i}`, { amount: 7, energy: 10 });
    assert.equal(exact.reward.stein, 7);
    assert.ok(exact.stamina >= 2 && exact.stamina <= 4, `energy ${exact.stamina}`);
    assert.equal(exact.minutes, exact.stamina * 1);
  }
});

test('the most to choose: what fits into the Vorrat and what his Energie surely brings in', () => {
  const s = replay([], catalog, DAY, T0);
  const c = ctxOf(s);
  assert.equal(gatherEstimate(GATHER('stein'), c, { energy: 10 }).most, 10);    // ten without a Steinlager
  assert.equal(gatherEstimate(GATHER('stein'), c, { energy: 3.7 }).most, 6);    // 3 whole Energie, 2 each for sure
  assert.equal(gatherEstimate(GATHER('stein'), c, { energy: 0.5 }).most, 0);
  // the Energie an amount takes: at least with the best dice, at most with the worst
  assert.deepEqual(gatherEstimate(GATHER('stein'), c, { amount: 7, energy: 10 }).energy, { min: 2, max: 4 });
  assert.deepEqual(gatherEstimate(GATHER('stein'), c, { amount: 1, energy: 10 }).energy, { min: 1, max: 1 });
});

test('he gathers no more than fits into the Vorrat', () => {
  const s = replay([gift({ stein: 10, pilzholz: 2 })], catalog, DAY, T0 + H);
  const out = runQuest(GATHER('stein'), ctxOf(s), 'x', { amount: 5, energy: 10 });
  assert.equal(out.reward.stein, 0);
  assert.equal(out.stamina, 0);
  assert.equal(gatherEstimate(GATHER('stein'), ctxOf(s), { amount: 5, energy: 10 }).room, 0);
  assert.equal(gatherEstimate(GATHER('pilzholz'), ctxOf(s), { amount: 5, energy: 10 }).room, 8);   // the other kind has its own room
});

test('gathering: now and then a Bannsplitter turns up, with dice of its own', () => {
  const s = replay([], catalog, DAY, T0);
  let units = 0;
  let finds = 0;
  for (let i = 0; i < 400; i += 1) {
    const o = runQuest(GATHER('stein'), ctxOf(s), `fund${i}`, { amount: 8, energy: 10 });
    units += o.gather.units;
    finds += o.gather.finds.length;
    assert.equal(o.reward.splitter, o.gather.finds.length);
    assert.equal(o.reward.stein, 8);   // the material comes as always
    assert.ok(o.gather.finds.every((u) => u < o.gather.units));
  }
  const share = finds / units;
  assert.ok(share > GATHER_FIND_CHANCE * 0.6 && share < GATHER_FIND_CHANCE * 1.4, `share ${share}`);
});

test('the first day: the Lagerfeuer is sure to be built with the 10 Energie of the start, whatever the dice do', () => {
  const s = replay([], catalog, DAY, T0);
  assert.equal(maxStamina(s.stats), 10);
  const est = gatherEstimate(GATHER('stein'), ctxOf(s), { amount: 8, energy: 10 });
  const estPilz = gatherEstimate(GATHER('pilzholz'), ctxOf(s), { amount: 2, energy: 10 });
  assert.equal(est.energy.max, 4);        // 8 Stein: four Energie at the very most
  assert.equal(estPilz.energy.max, 1);    // 2 Pilzholz: one Energie at the very most
  const fire = catalog.questById.get('q-lagerfeuer');
  const gloves = catalog.questById.get('q-handwickel');
  // the fire, and the first gloves too, on the same day
  assert.ok(est.energy.max + estPilz.energy.max + fire.cost + gloves.cost <= 10);
  // and in play, with many different dice
  for (let i = 0; i < 300; i += 1) {
    const stone = runQuest(GATHER('stein'), ctxOf(s), `stein${i}`, { amount: 8, energy: 10 });
    assert.equal(stone.reward.stein, 8);
    assert.ok(stone.stamina <= 4);
    const afterStone = replay([gift({ stein: 8 })], catalog, DAY, T0 + H);
    const wood = runQuest(GATHER('pilzholz'), ctxOf(afterStone), `holz${i}`, { amount: 2, energy: 10 });
    assert.equal(wood.reward.pilzholz, 2);
    assert.ok(wood.stamina <= 1);
    assert.ok(stone.stamina + wood.stamina + fire.cost <= 7);
  }
});

test('the first shoes: a quest in the Pilzhain without conditions, a short way from the camp', () => {
  const s = replay([], catalog, DAY, T0);
  assert.equal(s.world.equipped.schuhe, undefined);
  const quest = questById('q-bastsandalen', ctxOf(s));
  assert.deepEqual(quest.conditions, []);
  assert.deepEqual(quest.reward.items, ['schuhe_bastsandalen_1']);
  assert.equal(quest.repeatable, false);
  const plan = planExpedition(quest, ctxOf(s), 'x', { energy: 10 });
  assert.equal(plan.out + plan.act + plan.back, 4);   // one Energie each way, two there
  const e = expeditionEvent([], 'q-bastsandalen', 0.1);
  const back = replay([e], catalog, DAY, T0 + 0.1 * H + total(e) * 60000 + 1000);
  const sandals = Object.values(back.world.items).find((i) => i.id === 'schuhe_bastsandalen_1');
  assert.equal(sandals.where, 'rucksack');
});

test('gathering and building in play: from the empty start to the Lagerfeuer in one day', () => {
  let events = [];
  let hours = 0.1;
  const stone = expeditionEvent(events, 'gather:stein', hours, { amount: 8 });
  events = [...events, stone];
  hours += total(stone) / 60 + 0.01;
  const wood = expeditionEvent(events, 'gather:pilzholz', hours, { amount: 2 });
  events = [...events, wood];
  hours += total(wood) / 60 + 0.01;
  const mid = replay(events, catalog, DAY, T0 + hours * H);
  assert.deepEqual(mid.world.purse, { splitter: 0, pilzholz: 2, stein: 8 });
  const fire = expeditionEvent(events, 'q-lagerfeuer', hours);
  events = [...events, fire];
  hours += total(fire) / 60 + 0.01;
  const done = replay(events, catalog, DAY, T0 + hours * H);
  assert.equal(done.world.camp.stage, 1);
  assert.deepEqual(done.world.purse, { splitter: 0, pilzholz: 0, stein: 0 });
  assert.ok(done.world.stamina.value >= 3, `left ${done.world.stamina.value}`);
});

test('the first gloves: a quest on the Trümmerfeld without conditions, then still the Lagerfeuer on the same day', () => {
  const s = replay([], catalog, DAY, T0);
  const quest = questById('q-handwickel', ctxOf(s));
  assert.deepEqual(quest.conditions, []);
  assert.deepEqual(quest.reward.items, ['handschuhe_handwickel_1']);
  assert.equal(quest.repeatable, false);
  const plan = planExpedition(quest, ctxOf(s), 'x', { energy: 10 });
  assert.equal(plan.out + plan.back, 0);     // beside the camp: no way

  let events = [];
  let hours = 0.1;
  const gloves = expeditionEvent(events, 'q-handwickel', hours);
  events = [...events, gloves];
  hours += total(gloves) / 60 + 0.01;
  const got = replay(events, catalog, DAY, T0 + hours * H);
  const wraps = Object.values(got.world.items).find((i) => i.id === 'handschuhe_handwickel_1');
  assert.equal(wraps.where, 'rucksack');
  const worn = replay([...events, ev('equip', { slot: 'handschuhe', inst: wraps.inst }, hours)], catalog, DAY, T0 + (hours + 0.01) * H);
  assert.equal(worn.world.equipped.handschuhe, wraps.inst);

  for (const [id, options] of [['gather:stein', { amount: 8 }], ['gather:pilzholz', { amount: 2 }], ['q-lagerfeuer', {}]]) {
    const e = expeditionEvent(events, id, hours, options);
    events = [...events, e];
    hours += total(e) / 60 + 0.01;
  }
  const done = replay(events, catalog, DAY, T0 + hours * H);
  assert.equal(done.world.camp.stage, 1);
});

// --- Schlafplatz ----------------------------------------------------------------

test('the Schlafplatz adds Energie each morning, once, beyond the end of the bar', () => {
  const built = gift({ unlocks: ['lagerfeuer', 'schlafplatz:1'] }, 0);
  const s1 = replay([built], catalog, DAY, T0 + H);
  assert.equal(sleepBonus(s1.world, catalog, s1.stats), 2);              // 20 % of 10
  const noBed = replay([], catalog, NEXT, Date.parse(`${NEXT}T09:00:00`));
  assert.equal(noBed.world.stamina.value, 10);
  // the day after: 12 of 10
  const morning = Date.parse(`${NEXT}T09:00:00`);
  const s2 = replay([built], catalog, NEXT, morning);
  assert.equal(s2.world.stamina.value, 12);
  assert.equal(staminaAt(s2.world, morning + 5 * H, s2.stats, effects(s2.world, catalog)), 12);   // does not drain by itself
  // spent, it is gone: the bar fills only to the normal end during the day
  const work = ev('expedition', { q: 'q-test', place: 'lager', title: 'x', out: 0, act: 6, back: 0, cost: 6,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 6, consumed: {},
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: [], rest: false } } }, 25, NEXT);
  work.t = morning + 0.5 * H;
  const s3 = replay([built, work], catalog, NEXT, morning + 1 * H);
  assert.equal(Math.round(s3.world.stamina.value), 6);
  const evening = replay([built, work], catalog, NEXT, morning + 20 * H);
  assert.equal(staminaAt(evening.world, morning + 20 * H, evening.stats, effects(evening.world, catalog)), 10);
});

test('the morning adds the bonus once, at most up to the end of the bar and the bonus, and takes nothing away', () => {
  const built = gift({ unlocks: ['lagerfeuer', 'schlafplatz:1'] }, 0);
  const morning = Date.parse(`${NEXT}T09:00:00`);
  // two nights in a row: still 12, not 14
  const twoNights = replay([built], catalog, addDays(NEXT, 1), Date.parse(`${addDays(NEXT, 1)}T09:00:00`));
  assert.equal(twoNights.world.stamina.value, 12);
  // 50 more from the test menu in the evening: the morning does not cut it down
  const extra = ev('test', { mehrEnergie: 50 }, 10);
  const s = replay([built, extra], catalog, NEXT, morning);
  assert.equal(s.world.stamina.value, 60);
});

test('the bonus of the Schlafplatz grows with the bar', () => {
  const built = gift({ unlocks: ['lagerfeuer', 'schlafplatz:1'] }, 0);
  const s = replay([built], catalog, DAY, T0 + H);
  const strong = { ...s.stats, ausdauer: { ...s.stats.ausdauer, level: 10 } };
  assert.equal(sleepBonus(s.world, catalog, strong), 20);
});

// --- help in the test copy ------------------------------------------------------

test('the test buttons: Energie full, material as much as fits', () => {
  const work = Object.assign(gift({ stein: 4 }, 0), { cost: 8 });
  const tired = replay([work], catalog, DAY, T0 + 0.1 * H);
  assert.ok(tired.world.stamina.value < 4, `left ${tired.world.stamina.value}`);
  const full = ev('test', { energie: true }, 0.1);
  const s = replay([work, full], catalog, DAY, T0 + 0.1 * H + 1000);
  assert.equal(Math.round(s.world.stamina.value), maxStamina(s.stats));
  // 10 Stein more: only 6 fit next to the 4 (ten without a Steinlager)
  const stone = ev('test', { stein: 10 }, 0.7);
  const s2 = replay([work, full, stone], catalog, DAY, T0 + H);
  assert.equal(s2.world.purse.stein, 10);
});

test('with a store built later, the Vorrat holds more', () => {
  const before = replay([gift({ stein: 8 })], catalog, DAY, T0 + H);
  assert.equal(roomFor(before.world, catalog, 'stein'), 2);
  const after = replay([gift({ stein: 8 }), gift({ unlocks: ['lagerfeuer', 'steinlager:1'] }, 0.5)], catalog, DAY, T0 + H);
  assert.equal(after.world.purse.stein, 8);
  assert.equal(roomFor(after.world, catalog, 'stein'), 12);
});

test('the test menu: Bannsplitter added, a running expedition back at once', () => {
  const trip = Object.assign(gift({ stein: 2 }, 0), { out: 10, act: 10, back: 10, cost: 5 });
  const away = replay([trip], catalog, DAY, T0 + 0.1 * H);
  assert.ok(away.world.expedition);
  const back = ev('test', { fertig: true, splitter: 50 }, 0.1);
  const s = replay([trip, back], catalog, DAY, T0 + 0.1 * H + 1000);
  assert.equal(s.world.expedition, null);
  assert.equal(s.world.purse.stein, 2);
  assert.equal(s.world.purse.splitter, 50);
  assert.equal(s.world.reports.length, 1);
});

test('the Schlafplatz gives its Energie in the morning (6 Uhr), also when it was built in the night', () => {
  const at = (day, hour) => Date.parse(`${day}T${String(hour).padStart(2, '0')}:00:00`);
  const builtAt = (t) => Object.assign(gift({ unlocks: ['lagerfeuer', 'schlafplatz:1'] }, 0), { t, d: dayKey(new Date(t)) });
  // before the morning: nothing yet; from 6 Uhr: 12 of 10
  const early = builtAt(T0);
  assert.equal(replay([early], catalog, NEXT, at(NEXT, 5)).world.stamina.value, 10);
  assert.equal(replay([early], catalog, NEXT, at(NEXT, 7)).world.stamina.value, 12);
  // built at 1 Uhr in the night (still the day before) or at 4 Uhr: rested in the morning
  for (const hour of [1, 4]) {
    const night = builtAt(at(NEXT, hour));
    const s = replay([ev('envoy', { name: 'Ida', figur: 'erste' }), night], catalog, NEXT, at(NEXT, 7));
    assert.equal(Math.round(s.world.stamina.value), 12, `built at ${hour} Uhr`);
  }
  // built after the morning: only the next one
  const late = builtAt(at(NEXT, 8));
  const s = replay([ev('envoy', { name: 'Ida', figur: 'erste' }), late], catalog, NEXT, at(NEXT, 9));
  assert.equal(Math.round(s.world.stamina.value), 10);
});

test('each task of the Tageswerk gives an eighth of the bar back, also beyond its end', () => {
  const task = (stat, minutes) => Object.assign(ev('done', { stat, teile: [], xp: 14 }, minutes / 60), {});
  const s = replay([ev('envoy', { name: 'Ida', figur: 'erste' }), task('kraft', 10), task('gelassenheit', 20)], catalog, DAY, T0 + H);
  assert.equal(s.world.stamina.value, 10 + 2 * (10 / 8));
});
