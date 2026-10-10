// The row of actions: the Envoy is given more to do while he is away.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects } from '../js/world/hero.js';
import { camp, gatherPlace } from '../js/world/map.js';
import { questById, questState } from '../js/world/quests.js';
import { runQuest, siteStamina, gatherEstimate } from '../js/world/run.js';
import { projectedWorld } from '../js/world/worldstate.js';
import { legStamina, progressAt, heroPosition, timesOf, reserve } from '../js/world/expedition.js';
import { RULES, RULE_SETS, RULES_NOW } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
const MIN = 60000;
let n = 0;
function ctxOf(state) {
  return {
    catalog, world: state.world, stats: state.stats, statsAtDayStart: state.statsAtDayStart,
    fx: effects(state.world, catalog), totals: state.totals, day: state.today,
  };
}
const place = (id) => catalog.placeById.get(id);

// An action like the app wrote it before version 5.12 (old rules: every
// Energie a minute, ways cost Energie): rolled against the world after the
// row. With regel 2, as the app writes it since (see the tests at the end).
function action(events, questId, t, options = {}, seed = null, regel = 1) {
  n += 1;
  const c = ctxOf(replay(events, catalog, DAY, t));
  const after = { ...c, world: projectedWorld(c.world, c) };
  const quest = questById(questId, after);
  const id = seed || `q-${n}`;
  const rolled = runQuest(quest, after, id, options);
  const outcome = regel === 1 ? { ...rolled, minutes: rolled.stamina * RULE_SETS[1].pace } : rolled;
  const least = quest.gather ? gatherEstimate(quest, after, options).energy.min : siteStamina(quest, c.stats);
  return {
    id, t, d: DAY, dev: 't', type: 'expedition', q: quest.id, place: quest.place, title: quest.name,
    ...(regel === 1 ? {} : { regel }), least: Math.min(least, outcome.stamina), outcome,
  };
}
const now = (events, questId, t, options = {}, seed = null) => action(events, questId, t, options, seed, RULES);
const energy = (events, t) => replay(events, catalog, DAY, t).world.stamina.value;

test('ways: the Trümmerfeld counts as the camp, from a place there is the way home', () => {
  const c = ctxOf(replay([], catalog, DAY, T0));
  const home = camp(catalog);
  const field = gatherPlace(catalog);
  assert.equal(legStamina(home, field, c), 0);
  assert.equal(legStamina(field, place('pilzhain'), c), legStamina(home, place('pilzhain'), c));
  assert.equal(legStamina(place('pilzhain'), field, c), legStamina(place('pilzhain'), home, c));
  assert.equal(legStamina(place('pilzhain'), place('pilzhain'), c), 0);
});

test('added while he works: straight on to the next place, the way home before is given back', () => {
  const a = action([], 'q-uferkies', T0);
  const s1 = replay([a], catalog, DAY, T0);
  const first = s1.world.expedition.actions[0];
  assert.equal(Math.round(s1.world.stamina.value), 10 - reserve(first));
  const t = T0 + (first.way + first.work / 2) * MIN;
  const b = action([a], 'q-pilzholz-klein', t);
  const s = replay([a, b], catalog, DAY, t);
  const exp = s.world.expedition;
  assert.equal(exp.actions.length, 2);
  const second = exp.actions[1];
  assert.deepEqual(second.from, { x: place('stillesufer').x, y: place('stillesufer').y });
  const c = ctxOf(s);
  assert.equal(second.way, legStamina(place('stillesufer'), place('pilzhain'), c));
  assert.equal(second.credit, first.home);
  const times = timesOf(exp);
  assert.equal(times.actions[1].begin, times.actions[0].done);
  // on the way between the places, then at the Pilzhain
  const between = times.actions[1].begin + (second.way / 2) * MIN;
  assert.equal(progressAt(exp, between).phase, 'way');
  const there = heroPosition(exp, times.actions[1].arrive + 1000, catalog);
  assert.deepEqual([there.x, there.y], [place('pilzhain').x, place('pilzhain').y]);
  // the Bannsplitter count once the work at the shore is done, before the Envoy is back
  assert.ok(replay([a, b], catalog, DAY, times.actions[0].done + 1000).world.purse.splitter >= 3);
  const back = replay([a, b], catalog, DAY, times.end + 1000);
  assert.equal(back.world.expedition, null);
  assert.ok(back.world.purse.pilzholz >= 7);
  assert.deepEqual(back.world.reports.at(-1).stops.map((x) => x.q), ['q-uferkies', 'q-pilzholz-klein']);
  assert.deepEqual(back.world.journal.map((j) => j.q), ['q-uferkies', 'q-pilzholz-klein']);
  assert.equal(questState(questById('q-uferkies', ctxOf(back)), ctxOf(back)).status, 'open');
});

test('added on his way home: he turns round where he is', () => {
  const a = action([], 'q-saeule', T0);
  const exp1 = replay([a], catalog, DAY, T0).world.expedition;
  const { done } = timesOf(exp1).actions[0];
  const home = exp1.actions[0].home;
  assert.ok(home >= 1);
  const t = done + (home / 2) * MIN;
  const b = action([a], 'q-pilzholz-klein', t);
  const exp = replay([a, b], catalog, DAY, t).world.expedition;
  const second = exp.actions[1];
  assert.ok(Math.abs(second.credit - home / 2) < 1e-9);
  const halfway = { x: (place('stillesufer').x + camp(catalog).x) / 2, y: (place('stillesufer').y + camp(catalog).y) / 2 };
  assert.ok(Math.abs(second.from.x - halfway.x) < 1e-9 && Math.abs(second.from.y - halfway.y) < 1e-9);
  assert.equal(timesOf(exp).actions[1].begin, t);
});

test('material gathered in the row counts for what comes later: Stein, Pilzholz, then the Lagerfeuer', () => {
  const a = action([], 'gather:stein', T0, { amount: 8 });
  const b = action([a], 'gather:pilzholz', T0 + MIN / 2, { amount: 2 });
  const c0 = ctxOf(replay([a, b], catalog, DAY, T0 + MIN));
  const fire = questById('q-lagerfeuer', c0);
  assert.equal(questState(fire, c0).status, 'locked');
  assert.equal(questState(fire, { ...c0, world: projectedWorld(c0.world, c0) }).status, 'open');
  const f = action([a, b], 'q-lagerfeuer', T0 + MIN);
  const exp = replay([a, b, f], catalog, DAY, T0 + MIN).world.expedition;
  const done = replay([a, b, f], catalog, DAY, timesOf(exp).end + 1000);
  assert.equal(done.world.camp.stage, 1);
  assert.equal(done.world.purse.stein, 0);
  assert.equal(done.world.purse.pilzholz, 0);
});

test('a build whose material is missing when it is due is left out, its Energie comes back', () => {
  const a = action([], 'q-uferkies', T0);
  const fire = action([], 'q-lagerfeuer', T0);   // rolled with nothing in the row, as if the material were there
  fire.t = T0 + MIN;
  const before = energy([a], T0 + MIN);
  const s = replay([a, fire], catalog, DAY, T0 + MIN);
  assert.ok(s.world.stamina.value < before);
  const end = timesOf(s.world.expedition).end;
  const back = replay([a, fire], catalog, DAY, end + 1000);
  assert.equal(back.world.camp.stage, 0);
  assert.deepEqual(back.world.reports.at(-1).dropped.map((d) => [d.q, d.reason]), [['q-lagerfeuer', 'material']]);
  assert.deepEqual(back.world.reports.at(-1).stops.map((x) => x.q), ['q-uferkies']);
});

test('gathering in the row plans with the best dice; if they need more, the last action leaves the row', () => {
  const a = action([], 'q-uferkies', T0);                    // 5 of 10 set aside
  const t = T0 + 2 * MIN;
  // a seed where the dice need the most: 4 Energie for 8 Stein instead of 2
  let stone = null;
  for (let i = 0; i < 400 && !stone; i += 1) {
    const x = action([a], 'gather:stein', t, { amount: 8 }, `stein-${i}`);
    if (x.outcome.stamina - x.least >= 2) stone = x;
  }
  assert.ok(stone, 'a seed with bad dice');
  assert.equal(stone.least, 2);                              // 3 left
  const wood = action([a, stone], 'q-pilzholz-klein', t + 1000);
  const events = [a, stone, wood];
  const exp = replay(events, catalog, DAY, t + 1000).world.expedition;
  assert.equal(exp.actions.length, 3);
  assert.equal(Math.round(reserve(exp.actions[2])), 4);      // nothing left now
  const back = replay(events, catalog, DAY, T0 + 60 * MIN);
  const report = back.world.reports.at(-1);
  assert.deepEqual(report.dropped.map((d) => [d.q, d.reason]), [['q-pilzholz-klein', 'energy']]);
  assert.deepEqual(report.stops.map((x) => x.q), ['q-uferkies', 'gather:stein']);
  assert.equal(back.world.purse.stein, 8);
  assert.equal(back.world.purse.pilzholz, 0);
});

test('the last action waiting can be taken out again, its Energie comes back', () => {
  const a = action([], 'q-uferkies', T0);
  const b = action([a], 'q-pilzholz-klein', T0 + MIN);
  const before = energy([a], T0 + MIN);
  const out = { id: 'u-1', t: T0 + 1.5 * MIN, d: DAY, dev: 't', type: 'unqueue', ref: b.id };
  const s = replay([a, b, out], catalog, DAY, T0 + 1.5 * MIN);
  assert.equal(s.world.expedition.actions.length, 1);
  assert.ok(Math.abs(s.world.stamina.value - before) < 0.05);
  // the first one, already on its way, cannot be taken out
  const no = { id: 'u-2', t: T0 + 2 * MIN, d: DAY, dev: 't', type: 'unqueue', ref: a.id };
  assert.equal(replay([a, no], catalog, DAY, T0 + 2 * MIN).world.expedition.actions.length, 1);
});

test('in the app: start, add while away, the Energie of a row, take out again', async () => {
  const { game } = await import('../js/game.js');
  game.init(catalog);
  const alone = game.plan('q-uferkies');
  assert.equal(alone.busy, false);
  assert.equal(alone.block, null);
  assert.deepEqual([alone.cost.least, alone.cost.way], [3, 0]);   // the work only, ways cost no Energie
  const started = game.startExpedition('q-uferkies');
  assert.ok(started);
  assert.equal(started.regel, RULES);
  const next = game.plan('q-pilzholz-klein');
  assert.equal(next.busy, true);
  assert.equal(next.cost.way, 0);
  assert.equal(next.cost.least, 2);
  assert.equal(next.block, null);
  // the Lagerfeuer opens once Stein and Pilzholz are in the row
  assert.equal(game.plan('q-lagerfeuer').block, 'closed');
  assert.ok(game.startExpedition('gather:stein', { amount: 8 }));
  assert.ok(game.startExpedition('gather:pilzholz', { amount: 2 }));
  const fire = game.plan('q-lagerfeuer');
  assert.equal(fire.state.status, 'open');
  // what the dice of the gatherings in the row still take is kept free (since 5.21)
  const ahead = game.state.world.expedition.actions.filter((a) => a.stage < 2)
    .reduce((sum, a) => sum + Math.max(0, a.outcome.stamina - a.least), 0);
  assert.equal(fire.cost.ahead, ahead);
  assert.equal(fire.needed, Math.ceil(fire.cost.least + ahead));
  assert.equal(fire.block, fire.needed > Math.floor(game.stamina().value) ? 'energy' : null);
  const q = game.queued('gather:pilzholz');
  assert.deepEqual([q.index, q.count, q.removable], [2, 3, true]);
  assert.equal(game.queued('q-uferkies').removable, false);
  game.unqueue(q.action.id);
  assert.equal(game.state.world.expedition.actions.length, 2);
  assert.equal(game.plan('q-lagerfeuer').block, 'closed');
});

// --- since version 5.12: ways cost no Energie, every Energie takes 10 seconds ---

test('the rules since 5.12: the work costs Energie, ways only time, every Energie 10 seconds', () => {
  assert.equal(RULES_NOW.pace, 1 / 6);
  assert.equal(RULES_NOW.wayEnergy, 0);
  const a = now([], 'q-uferkies', T0);
  const s = replay([a], catalog, DAY, T0);
  const first = s.world.expedition.actions[0];
  assert.equal(first.regel, RULES);
  assert.equal(reserve(first), 3);                            // the work there, no way
  assert.equal(Math.round(s.world.stamina.value), 10 - 3);
  const c = ctxOf(s);
  const way = legStamina(camp(catalog), place('stillesufer'), c);
  assert.ok(way >= 1);
  assert.equal(first.way, way * RULES_NOW.pace);              // 10 seconds for every Energie-length of way
  assert.equal(first.work, 3 * RULES_NOW.pace);               // 30 seconds of work
  const { end } = timesOf(s.world.expedition);
  assert.equal(end - T0, (2 * way + 3) * 10000);
  const back = replay([a], catalog, DAY, end + 1000);
  assert.equal(back.world.expedition, null);
  assert.ok(back.world.purse.splitter >= 1);
});

test('the rules since 5.12: added while he works, he goes straight on, nothing to give back', () => {
  const a = now([], 'q-uferkies', T0);
  const s1 = replay([a], catalog, DAY, T0);
  const first = s1.world.expedition.actions[0];
  const t = T0 + (first.way + first.work / 2) * MIN;
  const b = now([a], 'q-pilzholz-klein', t);
  const s = replay([a, b], catalog, DAY, t);
  const second = s.world.expedition.actions[1];
  assert.equal(second.credit, 0);
  assert.equal(reserve(second), 2);
  assert.equal(Math.round(s.world.stamina.value), 10 - 3 - 2);
  assert.deepEqual(second.from, { x: place('stillesufer').x, y: place('stillesufer').y });
  const times = timesOf(s.world.expedition);
  assert.equal(times.actions[1].begin, times.actions[0].done);
  const back = replay([a, b], catalog, DAY, times.end + 1000);
  assert.deepEqual(back.world.reports.at(-1).stops.map((x) => x.q), ['q-uferkies', 'q-pilzholz-klein']);
});

test('an action under the new rules after one under the old: the old way home comes back, the new way costs nothing', () => {
  const a = action([], 'q-uferkies', T0);                     // before the update
  const s1 = replay([a], catalog, DAY, T0);
  const first = s1.world.expedition.actions[0];
  assert.equal(reserve(first), 3 + first.way + first.home);   // the old rules: ways cost Energie
  const t = T0 + (first.way + first.work / 2) * MIN;
  const b = now([a], 'q-pilzholz-klein', t);
  const s = replay([a, b], catalog, DAY, t);
  const second = s.world.expedition.actions[1];
  assert.equal(second.credit, first.home);                    // the old way home he no longer walks
  assert.equal(reserve(second), 2 - first.home);
  assert.equal(second.way, legStamina(place('stillesufer'), place('pilzhain'), ctxOf(s)) * RULES_NOW.pace);
});

test('taken out again under the new rules: its Energie comes back', () => {
  const a = now([], 'q-uferkies', T0);
  const b = now([a], 'q-pilzholz-klein', T0 + 5000);
  const before = energy([a], T0 + 6000);
  const out = { id: 'u-3', t: T0 + 6000, d: DAY, dev: 't', type: 'unqueue', ref: b.id };
  const s = replay([a, b, out], catalog, DAY, T0 + 6000);
  assert.equal(s.world.expedition.actions.length, 1);
  assert.ok(Math.abs(s.world.stamina.value - before) < 0.05);
});
