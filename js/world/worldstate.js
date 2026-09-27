// The state of the world and how each world event changes it.
// replay.js calls these functions in the order the events happened, with
// the stats of that moment. Everything here only changes `world`.
//
// world = {
//   expedition  the running expedition or null: { id, q, place, title, start, out, act, back, end, outcome }
//   stamina     { value, at }: bar value at time `at`, refills from there
//   purse       { splitter, pilzholz, stein }
//   items       owned things, see inventory.js
//   equipped    { slot: inst }
//   placed      furniture set up at home (inst list)
//   unlocked    features: 'zuhause', 'haendler'
//   home        0 = none yet, then the tier of the home
//   quests      { questId: { done, runs, last } }   done = completed (a cave: all spirits overcome)
//   encountersDone { encounterId: true }
//   bestiary    { monsterId: { seen, won, calmed, driven, first } }
//   bought      { offerId: true }
//   reports     finished expeditions, newest last
//   dropped     equipment taken off because a stat fell below its requirement
// }

import { STAMINA_REST_TASK_SHARE } from '../config.js';
import { effects, maxStamina, staminaAt } from './hero.js';
import { stow, removeEntry, hasSpace } from './inventory.js';
import { unmetRequirements } from './items.js';
import { totalMinutes } from './expedition.js';

const MATERIAL_KEYS = ['splitter', 'pilzholz', 'stein'];
// Materials in events written under an older name.
const OLD_NAMES = { quarz: 'pilzholz', aether: 'splitter' };
export const materialKey = (key) => OLD_NAMES[key] || key;
const KEEP_REPORTS = 30;

export function initialWorld(catalog, startTime, stats) {
  const world = {
    expedition: null,
    stamina: { value: maxStamina(stats), at: startTime },
    purse: { splitter: 0, pilzholz: 0, stein: 0 },
    items: {},
    equipped: {},
    placed: [],
    unlocked: [],
    home: 0,
    quests: {},
    encountersDone: {},
    bestiary: {},
    bought: {},
    reports: [],
    dropped: [],
  };
  // The start outfit (herkunft `angezogen`) is worn from the beginning,
  // other start things (`start`) lie in the backpack.
  for (const item of catalog.equipment) {
    const worn = item.herkunft.includes('angezogen');
    if (!worn && !item.herkunft.includes('start')) continue;
    const inst = `start:${item.id}`;
    world.items[inst] = { inst, kind: 'item', id: item.id, where: worn ? 'body' : 'rucksack', got: startTime };
    if (worn) world.equipped[item.slot] = inst;
  }
  return world;
}

// Brings the stamina bar up to time t.
function settle(world, t, ctx) {
  world.stamina = { value: staminaAt(world, t, ctx.stats, effects(world, ctx.catalog)), at: t };
}

function spend(world, amount) {
  world.stamina.value = Math.max(0, world.stamina.value - amount);
}

// Somewhere to put a thing taken off: backpack, else wardrobe, else backpack anyway.
function putAway(world, ctx, entry) {
  if (hasSpace(world, ctx.catalog, 'rucksack')) entry.where = 'rucksack';
  else if (hasSpace(world, ctx.catalog, 'schrank')) entry.where = 'schrank';
  else entry.where = 'rucksack';
}

function unlock(world, feature) {
  if (!world.unlocked.includes(feature)) world.unlocked.push(feature);
  if (feature === 'zuhause' && world.home === 0) world.home = 1;
}

function recordMonsters(world, fights, day) {
  for (const { monster, result } of fights) {
    const entry = world.bestiary[monster] || { seen: 0, won: 0, calmed: 0, driven: 0, first: day };
    entry.seen += 1;
    entry[result] = (entry[result] || 0) + 1;
    world.bestiary[monster] = entry;
  }
}

// The expedition is back: now its result counts.
function finishExpedition(world, ctx) {
  const exp = world.expedition;
  world.expedition = null;
  settle(world, exp.end, ctx);
  const outcome = exp.outcome;
  const r = outcome.reward;
  for (const [key, amount] of Object.entries(r)) {
    if (MATERIAL_KEYS.includes(materialKey(key))) world.purse[materialKey(key)] += amount || 0;
  }
  r.things.forEach((thing, n) => {
    stow(world, ctx.catalog, { inst: `${exp.id}:${n}`, kind: thing.kind, id: thing.id, got: exp.end });
  });
  for (const feature of r.unlocks) unlock(world, feature);
  if (r.rest) world.stamina.value = maxStamina(ctx.stats);
  recordMonsters(world, outcome.fights, exp.day);

  if (exp.q.startsWith('enc:')) {
    world.encountersDone[exp.q] = true;
  } else {
    const record = world.quests[exp.q] || { done: 0, runs: 0, last: null };
    world.quests[exp.q] = {
      done: record.done + (outcome.cleared ? 1 : 0),
      runs: record.runs + 1,
      last: exp.day,
    };
  }
  world.reports.push({ id: exp.id, q: exp.q, place: exp.place, title: exp.title, start: exp.start, end: exp.end, outcome });
  if (world.reports.length > KEEP_REPORTS) world.reports.shift();
}

// Lets time pass up to t: an expedition that is back by then is finished.
export function advance(world, t, ctx) {
  if (world.expedition && t >= world.expedition.end) finishExpedition(world, ctx);
}

function startExpedition(world, e, ctx) {
  if (world.expedition) return; // one at a time
  const consumed = Object.entries(e.outcome.consumed || {}).map(([k, v]) => [materialKey(k), v]);
  if (consumed.some(([k, v]) => (world.purse[k] || 0) < v)) return;
  // Material for building is taken along right away.
  for (const [k, v] of consumed) world.purse[k] -= v;
  spend(world, e.cost);
  world.expedition = {
    id: e.id, q: e.q, place: e.place, title: e.title, day: e.d,
    start: e.t, out: e.out, act: e.act, back: e.back,
    end: e.t + totalMinutes(e) * 60000,
    outcome: e.outcome,
  };
}

function equip(world, e, ctx) {
  let entry = world.items[e.inst];
  if (!entry && e.item) {
    // events written before items had their own ids
    entry = Object.values(world.items).find((x) => x.id === e.item && x.where !== 'body');
  }
  if (!entry || entry.kind !== 'item' || entry.where === 'body') return;
  const item = ctx.catalog.itemById.get(entry.id);
  if (!item || item.slot !== e.slot || unmetRequirements(item, ctx.stats).length > 0) return;
  const previous = world.items[world.equipped[e.slot]];
  if (previous) previous.where = entry.where;
  entry.where = 'body';
  world.equipped[e.slot] = entry.inst;
}

export function applyWorldEvent(world, e, ctx) {
  advance(world, e.t, ctx);
  settle(world, e.t, ctx);
  const entry = world.items[e.inst];
  switch (e.type) {
    case 'expedition':
      if (e.outcome) startExpedition(world, e, ctx);
      break;
    case 'buy':
      if (!world.bought[e.offer] && world.purse.splitter >= e.price) {
        world.purse.splitter -= e.price;
        world.bought[e.offer] = true;
        stow(world, ctx.catalog, { inst: e.id, kind: e.kind, id: e.thing, got: e.t });
      }
      break;
    case 'sell':
      if (entry && (entry.where === 'rucksack' || entry.where === 'schrank')) {
        removeEntry(world, e.inst);
        world.purse.splitter += e.price;
      }
      break;
    case 'drop':
      if (entry && (entry.where === 'rucksack' || entry.where === 'schrank')) removeEntry(world, e.inst);
      break;
    case 'move':
      if (entry && ['rucksack', 'schrank'].includes(entry.where) && ['rucksack', 'schrank'].includes(e.to)
        && entry.where !== e.to && hasSpace(world, ctx.catalog, e.to)) {
        entry.where = e.to;
      }
      break;
    case 'equip':
      equip(world, e, ctx);
      break;
    case 'unequip': {
      const worn = world.items[world.equipped[e.slot]];
      delete world.equipped[e.slot];
      if (worn) putAway(world, ctx, worn);
      break;
    }
    case 'place': {
      const piece = entry && ctx.catalog.furnitureById.get(entry.id);
      const tier = ctx.catalog.home[world.home - 1];
      if (piece && tier && ['rucksack', 'schrank'].includes(entry.where)
        && world.placed.length < tier.plaetze && piece.abStufe <= world.home) {
        entry.where = 'home';
        world.placed.push(entry.inst);
      }
      break;
    }
    case 'unplace':
      if (entry && entry.where === 'home') {
        world.placed = world.placed.filter((p) => p !== entry.inst);
        putAway(world, ctx, entry);
      }
      break;
    case 'build': {
      const next = ctx.catalog.home[world.home];
      const cost = next && priceAtTheTime(e.cost, next.cost);
      if (world.home > 0 && next && MATERIAL_KEYS.every((k) => world.purse[k] >= cost[k])) {
        for (const k of MATERIAL_KEYS) world.purse[k] -= cost[k];
        world.home += 1;
      }
      break;
    }
    default:
      break;
  }
}

// A build counts with the price it had when it was built, so a later change
// in data/welt.xlsx never takes away a home that already stands.
function priceAtTheTime(stored, current) {
  if (!stored) return current;
  const price = { splitter: 0, pilzholz: 0, stein: 0 };
  for (const [key, amount] of Object.entries(stored)) {
    if (materialKey(key) in price) price[materialKey(key)] = amount || 0;
  }
  return price;
}

// Finishing the Gelassenheit task is a real rest: half a bar back.
export function restFromTask(world, t, ctx) {
  advance(world, t, ctx);
  settle(world, t, ctx);
  const max = maxStamina(ctx.stats);
  world.stamina.value = Math.min(max, world.stamina.value + max * STAMINA_REST_TASK_SHARE);
}

// After a day: equipment whose requirements are no longer met comes off.
export function checkEquipment(world, ctx, day) {
  for (const [slot, inst] of Object.entries(world.equipped)) {
    const entry = world.items[inst];
    const item = entry && ctx.catalog.itemById.get(entry.id);
    if (!item) continue;
    const unmet = unmetRequirements(item, ctx.stats);
    if (unmet.length > 0) {
      delete world.equipped[slot];
      putAway(world, ctx, entry);
      world.dropped.push({ day, slot, item: item.id, unmet });
    }
  }
}
