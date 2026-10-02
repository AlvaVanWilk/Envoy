// The state of the world and how each world event changes it.
// replay.js calls these functions in the order the events happened, with
// the stats of that moment. Everything here only changes `world`.
//
// world = {
//   envoy       { name, figur, haut, haar } or null while the Envoy has not been created
//   expedition  the running expedition or null: { id, q, place, title, start, out, act, back, end, outcome }
//   stamina     { value, at }: bar of Energie at time `at`, refills from there
//   purse       { splitter, pilzholz, stein }: the totals; what the Envoy carries and
//               what lies in the stores of the camp follows from them (see inventory.js)
//   items       owned things, see inventory.js
//   equipped    { slot: inst }
//   unlocked    features: 'haendler'
//   camp        { stage, facilities }: Lagerstufe and the level of each facility, see camp.js
//   quests      { questId: { done, runs, last } }   done = completed (a cave: all spirits overcome)
//   encountersDone { encounterId: true }
//   bestiary    { monsterId: { seen, won, calmed, driven, first } }
//   bought      { offerId: true }
//   reports     finished expeditions, newest last (the latest 30, with all details)
//   journal     every finished expedition in short, oldest first (for the Handbuch)
//   dropped     equipment taken off because a stat fell below its requirement
// }

import { STAMINA_REST_TASK_SHARE, NAME_MAX, OLD_SLOT_NAMES } from '../config.js';
import { effects, maxStamina, staminaAt, sleepBonus } from './hero.js';
import { stow, removeEntry, hasSpace, atCamp, reachable, roomFor, CARRIED_MATERIALS } from './inventory.js';
import { emptyCamp, FACILITY_IDS } from './camp.js';
import { unmetRequirements } from './items.js';
import { totalMinutes } from './expedition.js';

const MATERIAL_KEYS = ['splitter', 'pilzholz', 'stein'];
// Materials in events written under an older name.
const OLD_NAMES = { quarz: 'pilzholz', aether: 'splitter' };
export const materialKey = (key) => OLD_NAMES[key] || key;
const slotKey = (slot) => OLD_SLOT_NAMES[slot] || slot;
const KEEP_REPORTS = 30;

export function initialWorld(catalog, startTime, stats) {
  const world = {
    envoy: null,
    expedition: null,
    stamina: { value: maxStamina(stats), at: startTime },
    purse: { splitter: 0, pilzholz: 0, stein: 0 },
    items: {},
    equipped: {},
    unlocked: [],
    camp: emptyCamp(),
    quests: {},
    encountersDone: {},
    bestiary: {},
    bought: {},
    reports: [],
    journal: [],
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

// Somewhere to put a thing taken off: backpack, else storage (only at the
// camp), else backpack anyway.
function putAway(world, ctx, entry) {
  if (hasSpace(world, ctx.catalog, 'rucksack')) entry.where = 'rucksack';
  else if (atCamp(world) && hasSpace(world, ctx.catalog, 'schrank')) entry.where = 'schrank';
  else entry.where = 'rucksack';
}

// A feature of the game, the Lagerfeuer (stage 1 of the camp) or a level of
// a facility, written id:level.
function unlock(world, feature) {
  const [id, level] = feature.split(':');
  if (feature === 'lagerfeuer') world.camp.stage = Math.max(world.camp.stage, 1);
  else if (FACILITY_IDS.includes(id)) world.camp.facilities[id] = Math.max(world.camp.facilities[id] || 0, Number(level) || 1);
  else if (!world.unlocked.includes(feature)) world.unlocked.push(feature);
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
  // Back at the camp: what he brought goes into the stores, what does not
  // fit anywhere stays behind.
  const leftBehind = {};
  for (const [key, amount] of Object.entries(r)) {
    const name = materialKey(key);
    if (!MATERIAL_KEYS.includes(name) || !amount) continue;
    const room = CARRIED_MATERIALS.includes(name) ? roomFor(world, ctx.catalog, name) : Infinity;
    const taken = Math.min(amount, room);
    world.purse[name] += taken;
    if (taken < amount) leftBehind[name] = amount - taken;
  }
  r.things.forEach((thing, n) => {
    stow(world, ctx.catalog, { inst: `${exp.id}:${n}`, kind: thing.kind, id: thing.id, got: exp.end });
  });
  for (const feature of r.unlocks) unlock(world, feature);
  if (r.rest) world.stamina.value = Math.max(world.stamina.value, maxStamina(ctx.stats));
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
  world.reports.push({ id: exp.id, q: exp.q, place: exp.place, title: exp.title, start: exp.start, end: exp.end, outcome, leftBehind });
  if (world.reports.length > KEEP_REPORTS) world.reports.shift();
  world.journal.push({
    id: exp.id, q: exp.q, place: exp.place, title: exp.title, day: exp.day, end: exp.end,
    kind: outcome.kind, cleared: outcome.cleared,
    fights: (outcome.fights || []).map((f) => ({ monster: f.monster, result: f.result })),
    reward: { splitter: r.splitter || 0, pilzholz: r.pilzholz || 0, stein: r.stein || 0, things: r.things.length },
  });
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
  const slot = slotKey(e.slot);
  let entry = world.items[e.inst];
  if (!entry && e.item) {
    // events written before items had their own ids
    entry = Object.values(world.items).find((x) => x.id === e.item && x.where !== 'body');
  }
  if (!entry || entry.kind !== 'item' || entry.where === 'body' || !reachable(world, entry)) return;
  const item = ctx.catalog.itemById.get(entry.id);
  if (!item || item.slot !== slot || unmetRequirements(item, ctx.stats).length > 0) return;
  const previous = world.items[world.equipped[slot]];
  if (previous) previous.where = entry.where;
  entry.where = 'body';
  world.equipped[slot] = entry.inst;
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
      if (entry && (entry.where === 'rucksack' || entry.where === 'schrank') && reachable(world, entry)) {
        removeEntry(world, e.inst);
        world.purse.splitter += e.price;
      }
      break;
    case 'drop':
      if (entry && (entry.where === 'rucksack' || entry.where === 'schrank') && reachable(world, entry)) removeEntry(world, e.inst);
      break;
    case 'move':
      // between backpack and storage: only at the camp
      if (entry && atCamp(world) && ['rucksack', 'schrank'].includes(entry.where) && ['rucksack', 'schrank'].includes(e.to)
        && entry.where !== e.to && hasSpace(world, ctx.catalog, e.to)) {
        entry.where = e.to;
      }
      break;
    case 'equip':
      equip(world, e, ctx);
      break;
    case 'unequip': {
      const slot = slotKey(e.slot);
      const worn = world.items[world.equipped[slot]];
      delete world.equipped[slot];
      if (worn) putAway(world, ctx, worn);
      break;
    }
    case 'test':
      testHelp(world, e, ctx);
      break;
    case 'envoy': {
      const name = String(e.name || '').trim().slice(0, NAME_MAX);
      if (name) world.envoy = { name, figur: String(e.figur || ''), haut: String(e.haut || ''), haar: String(e.haar || '') };
      break;
    }
    default:
      break;
  }
}

// Help while trying things out, only offered in the test copy (see ui/testtools.js):
// the bar full again, or material added, as much as fits like after a trip.
function testHelp(world, e, ctx) {
  if (e.energie) world.stamina.value = Math.max(world.stamina.value, maxStamina(ctx.stats));
  for (const key of CARRIED_MATERIALS) {
    const amount = Math.max(0, Math.floor(Number(e[key]) || 0));
    if (amount > 0) world.purse[key] += Math.min(amount, roomFor(world, ctx.catalog, key));
  }
}

// Finishing the Gelassenheit task is a real rest: half a bar back.
export function restFromTask(world, t, ctx) {
  advance(world, t, ctx);
  settle(world, t, ctx);
  const max = maxStamina(ctx.stats);
  world.stamina.value = Math.max(world.stamina.value, Math.min(max, world.stamina.value + max * STAMINA_REST_TASK_SHARE));
}

// A new day: with a Schlafplatz the Envoy starts it with extra Energie, once,
// even beyond the end of the bar. Spent, it does not come back until the next morning.
export function startOfDay(world, t, ctx) {
  advance(world, t, ctx);
  settle(world, t, ctx);
  const bonus = sleepBonus(world, ctx.catalog, ctx.stats);
  if (bonus > 0) world.stamina.value = Math.min(maxStamina(ctx.stats) + bonus, world.stamina.value + bonus);
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
