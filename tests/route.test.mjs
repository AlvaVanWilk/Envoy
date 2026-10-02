// Routes: several quests one after the other on one expedition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects } from '../js/world/hero.js';
import { camp, gatherPlace } from '../js/world/map.js';
import { questById, questState } from '../js/world/quests.js';
import {
  planRoute, planExpedition, routeParts, mostOf, leastOf, legStamina, progressAt, heroPosition, totalMinutes,
} from '../js/world/expedition.js';
import { MINUTES_PER_STAMINA } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
const H = 3600000;
let n = 0;
function ev(type, fields, hoursAfter = 0) {
  n += 1;
  return { id: `r-${n}`, t: T0 + hoursAfter * H + n, d: DAY, dev: 't', type, ...fields };
}
function ctxOf(state) {
  return {
    catalog, world: state.world, stats: state.stats, statsAtDayStart: state.statsAtDayStart,
    fx: effects(state.world, catalog), totals: state.totals, day: state.today,
  };
}
const place = (id) => catalog.placeById.get(id);
const quest = (id, c) => questById(id, c);

// Sets out on a route like the app does and returns the event.
function routeEvent(events, entries, hoursAfter) {
  const c = ctxOf(replay(events, catalog, DAY, T0 + hoursAfter * H));
  const e = ev('expedition', {}, hoursAfter);
  const plan = planRoute(entries.map(([id, options]) => ({ quest: quest(id, c), options })), c, e.id);
  return Object.assign(e, { stops: plan.stops, back: plan.back, cost: plan.cost });
}

test('ways of a route: the Trümmerfeld counts as the camp, from a place there is the way home', () => {
  const c = ctxOf(replay([], catalog, DAY, T0));
  const home = camp(catalog);
  const field = gatherPlace(catalog);
  assert.equal(legStamina(home, field, c), 0);
  assert.equal(legStamina(field, home, c), 0);
  assert.equal(legStamina(field, place('pilzhain'), c), legStamina(home, place('pilzhain'), c));
  assert.equal(legStamina(place('pilzhain'), field, c), legStamina(place('pilzhain'), home, c));
  assert.ok(legStamina(place('pilzhain'), home, c) > 0);
  assert.equal(legStamina(place('pilzhain'), place('pilzhain'), c), 0);
});

test('a route saves ways: from one place straight on to the next', () => {
  const c = ctxOf(replay([], catalog, DAY, T0));
  const ufer = quest('q-uferkies', c);
  const furt = quest('q-furtwache', c);
  const route = planRoute([{ quest: ufer }, { quest: furt }], c, 'x');
  const alone = planExpedition(ufer, c, 'x').cost + planExpedition(furt, c, 'y').cost;
  assert.ok(route.cost < alone, `route ${route.cost}, alone ${alone}`);
  const minutes = route.stops.reduce((sum, s) => sum + s.out + s.act, 0) + route.back;
  assert.equal(minutes, route.cost * MINUTES_PER_STAMINA);
  // two quests at one place: no way between them
  const two = planRoute([{ quest: quest('q-pilzholz-klein', c) }, { quest: quest('q-pilzholz', c) }], c, 'z');
  assert.equal(two.stops[1].out, 0);
});

test('the parts of a route: ways and work in order; gathering from the best to the worst dice', () => {
  const c = ctxOf(replay([], catalog, DAY, T0));
  const entries = [{ quest: quest('q-uferkies', c) }, { quest: quest('gather:stein', c), options: { amount: 6 } }];
  const parts = routeParts(entries, c);
  assert.deepEqual(parts.map((p) => p.kind), ['way', 'work', 'way', 'work', 'maybe']);
  assert.deepEqual(parts.map((p) => p.stop), [0, 0, 1, 1, 1]);
  assert.equal(leastOf(parts), mostOf(parts) - 1);
  for (let i = 0; i < 20; i += 1) {
    const plan = planRoute(entries, c, `seed${i}`);
    assert.ok(plan.cost >= leastOf(parts) && plan.cost <= mostOf(parts), `cost ${plan.cost}`);
    assert.equal(plan.stops[1].outcome.reward.stein, 6);
  }
  // a single quest: way there, work, way back
  const one = routeParts([{ quest: quest('q-uferkies', c) }], c);
  assert.deepEqual(one.map((p) => p.kind), ['way', 'work', 'way']);
  assert.equal(mostOf(one), planExpedition(quest('q-uferkies', c), c, 'x').cost);
});

test('on a route: Energie taken at the start, every stop in turn, all of it counted at the return', () => {
  const e = routeEvent([], [['q-uferkies'], ['q-pilzholz-klein']], 0.1);
  assert.equal(e.stops.length, 2);
  assert.ok(e.cost <= 10, `cost ${e.cost}`);

  const start = replay([e], catalog, DAY, e.t);
  const exp = start.world.expedition;
  assert.equal(exp.stops.length, 2);
  assert.equal(Math.round(start.world.stamina.value), 10 - e.cost);
  const c = ctxOf(start);
  assert.equal(questState(quest('q-uferkies', c), c).status, 'running');
  assert.equal(questState(quest('q-pilzholz-klein', c), c).status, 'running');

  const [first, second] = exp.stops;
  const at = (minutes) => e.t + minutes * 60000;
  assert.equal(progressAt(exp, at(first.out + first.act / 2)).phase, 'act');
  assert.equal(progressAt(exp, at(first.out + first.act / 2)).stop, 0);
  assert.equal(progressAt(exp, at(first.out + first.act + second.out / 2)).phase, 'out');
  assert.equal(progressAt(exp, at(first.out + first.act + second.out / 2)).stop, 1);
  const there = heroPosition(exp, at(first.out + first.act + second.out + second.act / 2), catalog);
  assert.deepEqual([there.x, there.y], [place('pilzhain').x, place('pilzhain').y]);
  assert.equal(progressAt(exp, at(totalMinutes(exp) - exp.back / 2)).phase, 'back');

  const during = replay([e], catalog, DAY, at(first.out + first.act + 1));
  assert.equal(during.world.purse.splitter, 0);

  const after = replay([e], catalog, DAY, at(totalMinutes(exp)) + 1000);
  assert.equal(after.world.expedition, null);
  assert.equal(after.world.purse.splitter, 1);
  assert.ok(after.world.purse.pilzholz >= 7 && after.world.purse.pilzholz <= 9);
  assert.equal(after.world.reports.length, 1);
  assert.deepEqual(after.world.reports[0].stops.map((s) => s.q), ['q-uferkies', 'q-pilzholz-klein']);
  assert.deepEqual(after.world.journal.map((j) => j.q), ['q-uferkies', 'q-pilzholz-klein']);
  assert.equal(after.world.quests['q-uferkies'].runs, 1);
  assert.equal(after.world.quests['q-pilzholz-klein'].done, 1);
});

test('a route on the Trümmerfeld only: no way at all, both kinds of material brought home', () => {
  const field = routeEvent([], [['gather:stein', { amount: 8 }], ['gather:pilzholz', { amount: 2 }]], 0.1);
  const back = replay([field], catalog, DAY, field.t + totalMinutes(field) * 60000 + 1000);
  assert.equal(back.world.purse.stein, 8);
  assert.equal(back.world.purse.pilzholz, 2);
  assert.equal(back.world.reports.at(-1).stops.length, 2);
  assert.equal(field.back, 0);
  assert.ok(field.stops.every((s) => s.out === 0));
});

test('planning in the app: a quest is added only if the Energie still reaches back to the camp from there', async () => {
  const { game } = await import('../js/game.js');
  game.init(catalog);
  game.clearRoute();
  assert.equal(Math.floor(game.stamina().value), 10);
  assert.equal(game.addToRoute('q-uferkies'), true);
  assert.equal(game.addToRoute('q-pilzholz-klein'), true);
  assert.equal(game.routePlan().most, 8);
  assert.equal(game.routeBlock('q-stein-klein'), 'energy');
  assert.equal(game.addToRoute('q-stein-klein'), false);
  assert.equal(game.routeBlock('q-uferkies'), 'twice');
  assert.equal(game.routeBlock('q-lagerfeuer'), 'closed');
  game.add([game.event('test', { stein: 8, pilzholz: 2 })]);
  assert.equal(game.routeBlock('q-lagerfeuer'), 'camp');
  assert.equal(game.inRoute('q-pilzholz-klein'), 1);

  const event = game.startRoute();
  assert.equal(event.stops.length, 2);
  assert.equal(game.route.length, 0);
  assert.equal(game.state.world.expedition.stops.length, 2);
  assert.equal(game.routeBlock('q-stein-klein'), 'away');
});
