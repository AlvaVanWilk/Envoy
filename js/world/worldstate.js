// The state of the world and how each world event changes it.
// replay.js calls these functions in the order the events happened, with
// the stats of that moment. Everything here only changes `world`.
//
// world = {
//   position   id of the place where the hero is
//   stamina    { value, at }: bar value at time `at`, refills from there
//   purse      { glimmer, holz, stein }
//   items      owned things, see inventory.js
//   equipped   { slot: inst }
//   placed     furniture set up at home (inst list)
//   unlocked   features: 'zuhause', 'haendler'
//   home       0 = none yet, then the tier of the home
//   quests     { questId: { done, last } }
//   encountersDone { encounterId: true }
//   bestiary   { monsterId: { seen, won, calmed, lost, first } }
//   bought     { offerId: true }
//   dropped    equipment taken off because a stat fell below its requirement
// }

import { STAMINA_REST_TASK_SHARE } from '../config.js';
import { effects, maxStamina, staminaAt } from './hero.js';
import { stow, removeEntry, hasSpace } from './inventory.js';
import { unmetRequirements } from './items.js';

export function initialWorld(catalog, startTime, stats) {
  const camp = catalog.places.find((p) => p.typ === 'lager');
  const world = {
    position: camp ? camp.id : null,
    stamina: { value: maxStamina(stats), at: startTime },
    purse: { glimmer: 0, holz: 0, stein: 0 },
    items: {},
    equipped: {},
    placed: [],
    unlocked: [],
    home: 0,
    quests: {},
    encountersDone: {},
    bestiary: {},
    bought: {},
    dropped: [],
  };
  for (const item of catalog.equipment.filter((i) => i.herkunft.includes('start'))) {
    const inst = `start:${item.id}`;
    world.items[inst] = { inst, kind: 'item', id: item.id, where: 'rucksack', got: startTime };
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

function recordMonsters(world, monsters, day) {
  for (const { id, result } of monsters) {
    const entry = world.bestiary[id] || { seen: 0, won: 0, calmed: 0, lost: 0, first: day };
    entry.seen += 1;
    entry[result] += 1;
    world.bestiary[id] = entry;
  }
}

function applyQuest(world, e, ctx) {
  const outcome = e.outcome;
  spend(world, e.cost);
  recordMonsters(world, outcome.monsters || [], e.d);
  if (!outcome.ok) {
    // A lost fight exhausts the hero: it costs time in the game, never real exercise.
    if ((outcome.monsters || []).some((m) => m.result === 'lost')) world.stamina.value = 0;
    return;
  }
  const r = outcome.reward;
  for (const key of ['glimmer', 'holz', 'stein']) {
    world.purse[key] += (r[key] || 0) - (outcome.consumed[key] || 0);
    world.purse[key] = Math.max(0, world.purse[key]);
  }
  r.things.forEach((thing, n) => {
    const inst = `${e.id}:${n}`;
    stow(world, ctx.catalog, { inst, kind: thing.kind, id: thing.id, got: e.t });
  });
  for (const feature of r.unlocks) unlock(world, feature);
  if (r.rest) world.stamina.value = maxStamina(ctx.stats);

  if (e.q.startsWith('enc:')) {
    world.encountersDone[e.q] = true;
  } else {
    const record = world.quests[e.q] || { done: 0, last: null };
    world.quests[e.q] = { done: record.done + 1, last: e.d };
  }
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
  settle(world, e.t, ctx);
  const entry = world.items[e.inst];
  switch (e.type) {
    case 'travel':
      if (ctx.catalog.placeById.has(e.to)) {
        spend(world, e.cost);
        world.position = e.to;
      }
      break;
    case 'quest':
      if (e.outcome) applyQuest(world, e, ctx);
      break;
    case 'buy':
      if (!world.bought[e.offer] && world.purse.glimmer >= e.price) {
        world.purse.glimmer -= e.price;
        world.bought[e.offer] = true;
        stow(world, ctx.catalog, { inst: e.id, kind: e.kind, id: e.thing, got: e.t });
      }
      break;
    case 'sell':
      if (entry && (entry.where === 'rucksack' || entry.where === 'schrank')) {
        removeEntry(world, e.inst);
        world.purse.glimmer += e.price;
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
      if (world.home > 0 && next && ['holz', 'stein', 'glimmer'].every((k) => world.purse[k] >= next.cost[k])) {
        for (const k of ['holz', 'stein', 'glimmer']) world.purse[k] -= next.cost[k];
        world.home += 1;
      }
      break;
    }
    default:
      break;
  }
}

// Finishing the Gelassenheit task is a real rest: half a bar back.
export function restFromTask(world, t, ctx) {
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

export function staminaNow(world, now, ctx) {
  return staminaAt(world, now, ctx.stats, effects(world, ctx.catalog));
}
