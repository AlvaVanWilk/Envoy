// The state of the world and how each world event changes it.
// replay.js calls these functions in the order the events happened, with
// the stats of that moment. Everything here only changes `world`.
//
// world = {
//   envoy       { name, figur, haut, haar, unterhemd, geburtsjahr } or null while the Envoy
//               has not been created; unterhemd is true unless an envoy event says false;
//               geburtsjahr: the year of birth (from the age at the creation) or null
//   expedition  the running expedition or null: { id, day, start, actions, rushed, dropped, leftBehind },
//               a row of actions, see expedition.js
//   stamina     { value, at }: bar of Energie at time `at`, refills from there
//   purse       { splitter, pilzholz, stein }: the totals; what the Envoy carries and
//               what lies in the stores of the camp follows from them (see inventory.js)
//   items       owned things, see inventory.js
//   equipped    { slot: inst }
//   unlocked    features: 'haendler'
//   camp        { stage, facilities, deko, reached }: Lagerstufe, the level of each facility,
//               the Deko built, the day each stage was reached; see camp.js
//   plans       { found, search }: plans for Deko found, and the search for the others; see plans.js
//   clothes     { since, found }: Energie of work since the last piece of clothing found on
//               the way, and how many were found; see clothes.js
//   arena       { ruhm, earned, titel, titles, fights }: the own Abbild in the arena; see arena.js
//   tiefen      { cleared, rest, descents, last }: how far down the Envoy got; see depths.js
//   quests      { questId: { done, runs, last } }   done = completed (a cave: all spirits overcome)
//   encountersDone { encounterId: true }, also the Aufträge of the Aushang done (aus:…, see jobs.js)
//   bestiary    { monsterId: { seen, won, calmed, driven, first } }
//   bought      { offerId: true }
//   seen        { report id: true }: reports shown on some device (event `gesehen`)
//   reports     finished expeditions, newest last (the latest 30, with all details):
//               { id, start, end, stops: [{ q, place, title, outcome }], dropped, leftBehind }
//   journal     every finished quest in short, oldest first (for the Handbuch)
//   dropped     equipment taken off because a stat fell below its requirement
// }

import { NAME_MAX, OLD_SLOT_NAMES, RULE_SETS, rulesOf, potionById } from '../config.js';
import { effects, maxStamina, staminaAt, sleepBonus } from './hero.js';
import {
  stow, removeEntry, hasSpace, atCamp, reachable, roomFor, overloaded, entriesIn, LIMITED_MATERIALS,
} from './inventory.js';
import { emptyCamp, FACILITY_IDS } from './camp.js';
import { emptyPlans } from './plans.js';
import { emptyClothes, countClothes, fits, figureOf } from './clothes.js';
import { emptyArena, applyArenaEvent } from './arena.js';
import { emptyDepths, nextFloor, blockedAt, restMinutes } from './depths.js';
import { isJob, jobAllowed, jobsOpen } from './jobs.js';
import { canWeave, wovenBonuses } from './weave.js';
import { lootThing } from './run.js';
import { cleanBonuses } from './bonuses.js';
import { seededRandom } from './rng.js';
import { unmetRequirements } from './items.js';
import { camp } from './map.js';
import { reserve, addition, wayFrom, legStamina, nextStep, actionRules } from './expedition.js';

const MATERIAL_KEYS = ['splitter', 'pilzholz', 'stein'];
// Materials in events written under an older name.
const OLD_NAMES = { quarz: 'pilzholz', aether: 'splitter' };
export const materialKey = (key) => OLD_NAMES[key] || key;
const slotKey = (slot) => OLD_SLOT_NAMES[slot] || slot;
const KEEP_REPORTS = 30;
// The colour of a thing, if it has one (see clothes.js).
const dyed = (farbe) => (typeof farbe === 'string' && farbe ? { farbe } : {});
// Its colour, and its Güte and bonuses, if it has them (see bonuses.js).
const kept = (thing) => ({ ...dyed(thing.farbe), ...cleanBonuses(thing) });

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
    plans: emptyPlans(),
    clothes: emptyClothes(),
    arena: emptyArena(),
    tiefen: emptyDepths(),
    quests: {},
    encountersDone: {},
    bestiary: {},
    bought: {},
    reports: [],
    seen: {},
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

// A stage of the camp reached on `day`.
function raiseCamp(world, stage, day) {
  if (world.camp.stage >= stage) return;
  world.camp.stage = stage;
  world.camp.reached[stage] = day;
}

// A feature of the game: the Lagerfeuer (stage 1 of the camp), a stage of the
// camp (lager:2), a level of a facility (steinlager:2), a Deko (deko:<id>),
// or the trader.
function unlock(world, feature, day) {
  const [id, level] = feature.split(':');
  if (feature === 'lagerfeuer') raiseCamp(world, 1, day);
  else if (id === 'lager') raiseCamp(world, Number(level) || 0, day);
  else if (id === 'deko') world.camp.deko[level] = true;
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

// Energie given back (never beyond the end of the bar), or taken if it is less than nothing.
function giveBack(world, amount, ctx) {
  if (amount < 0) spend(world, -amount);
  else world.stamina.value = Math.max(world.stamina.value, Math.min(maxStamina(ctx.stats), world.stamina.value + amount));
}

// --- expeditions: a row of actions (see expedition.js) -----------------------------

// For the ways: the world and the effects of what the Envoy wears (boots, cloaks).
const wayCtx = (world, ctx) => ({ ...ctx, world, fx: effects(world, ctx.catalog) });

// What one action brought: material goes where it fits (a store of the camp,
// else the backpack), the rest stays behind; things go into the backpack.
function bringHome(world, ctx, action, leftBehind, t) {
  const { outcome } = action;
  const r = outcome.reward;
  for (const [key, amount] of Object.entries(r)) {
    const name = materialKey(key);
    if (!MATERIAL_KEYS.includes(name) || !amount) continue;
    const room = LIMITED_MATERIALS.includes(name) ? roomFor(world, ctx.catalog, name) : Infinity;
    const taken = Math.min(amount, room);
    world.purse[name] += taken;
    if (taken < amount) leftBehind[name] = (leftBehind[name] || 0) + amount - taken;
  }
  r.things.forEach((thing, n) => {
    stow(world, ctx.catalog, { inst: `${action.id}:${n}`, kind: thing.kind, id: thing.id, got: t, ...kept(thing) });
  });
  for (const feature of r.unlocks) unlock(world, feature, action.day);
  for (const id of r.plans || []) if (!world.plans.found[id]) world.plans.found[id] = action.day;
  for (const [id, n] of Object.entries(outcome.search || {})) world.plans.search[id] = (world.plans.search[id] || 0) + n;
  if (r.rest) world.stamina.value = Math.max(world.stamina.value, maxStamina(ctx.stats));
  recordMonsters(world, outcome.fights, action.day);

  if (action.q.startsWith('enc:') || isJob(action.q)) {
    world.encountersDone[action.q] = true;
  } else {
    const record = world.quests[action.q] || { done: 0, runs: 0, last: null };
    world.quests[action.q] = {
      done: record.done + (outcome.cleared ? 1 : 0),
      runs: record.runs + 1,
      last: action.day,
    };
  }
  world.journal.push({
    id: action.id, q: action.q, place: action.place, title: action.title, day: action.day, end: t,
    kind: outcome.kind, cleared: outcome.cleared,
    fights: (outcome.fights || []).map((f) => ({ monster: f.monster, result: f.result })),
    reward: { splitter: r.splitter || 0, pilzholz: r.pilzholz || 0, stein: r.stein || 0, things: r.things.length, plans: (r.plans || []).length },
  });
}

// An action that has not begun leaves the row and its Energie comes back.
// If one follows (a build in the middle that lacks material), that one now
// sets out from the place before. reason: 'material' | 'energy', or null when
// the person took it out.
function dropAction(world, exp, index, t, ctx, reason) {
  const [gone] = exp.actions.splice(index, 1);
  let refund = reserve(gone);
  const next = exp.actions[index];
  if (next) {
    refund += reserve(next);
    next.notBefore = Math.max(next.notBefore, t);
    Object.assign(next, wayFrom(exp, index, ctx.catalog.placeById.get(next.place), next.notBefore, wayCtx(world, ctx), actionRules(next).pace));
    refund -= reserve(next);
  }
  if (reason) exp.dropped.push({ q: gone.q, title: gone.title, reason });
  giveBack(world, refund, ctx);
}

// Not enough Energie for what the dice needed: the Envoy gathers as long as it lasts.
function cutGathering(world, action) {
  const o = action.outcome;
  const rolls = o.gather?.rolls;
  if (!rolls) { spend(world, o.stamina - action.least); return; }
  const more = Math.floor(world.stamina.value);
  const units = action.least + more;
  spend(world, more);
  const got = Math.min(o.gather.wanted, rolls.slice(0, units).reduce((sum, n) => sum + n, 0));
  const { pace } = actionRules(action);
  action.outcome = {
    ...o, stamina: units, minutes: units * pace,
    reward: { ...o.reward, [o.gather.material]: got }, gather: { ...o.gather, units, cut: true },
  };
  action.work = units * pace;
}

// Back at the camp: what the backpack cannot hold goes into the storage.
function unpack(world, ctx) {
  const newest = entriesIn(world, 'rucksack').sort((a, b) => b.got - a.got);
  for (const entry of newest) {
    if (!overloaded(world) || !hasSpace(world, ctx.catalog, 'schrank')) break;
    entry.where = 'schrank';
  }
}

// What happens along the way, in order: an action begins (material for
// building is taken along; without it the action is left out), the Envoy
// arrives (what the dice need beyond the best is taken now: if the Energie
// is short, the last actions still waiting leave the row, and only if that
// is not enough the gathering ends early), an action is done (its result
// counts), and at last he is back at the camp.
const STEPS = {
  begin(world, exp, step, ctx) {
    const a = exp.actions[step.i];
    const needs = Object.entries(a.outcome.consumed || {}).map(([k, v]) => [materialKey(k), v]).filter(([, v]) => v > 0);
    if (needs.some(([k, v]) => (world.purse[k] || 0) < v)) {
      dropAction(world, exp, step.i, step.time, ctx, 'material');
      return;
    }
    for (const [k, v] of needs) world.purse[k] -= v;
    a.stage = 1;
  },
  arrive(world, exp, step, ctx, project) {
    const a = exp.actions[step.i];
    a.stage = 2;
    const extra = (Number(a.outcome.stamina) || 0) - a.least;
    if (!(extra > 0) || project) return;
    while (world.stamina.value < extra && exp.actions.length - 1 > step.i) {
      dropAction(world, exp, exp.actions.length - 1, step.time, ctx, 'energy');
    }
    if (world.stamina.value >= extra) spend(world, extra);
    else cutGathering(world, a);
  },
  done(world, exp, step, ctx) {
    const a = exp.actions[step.i];
    a.stage = 3;
    bringHome(world, ctx, a, exp.leftBehind, step.time);
  },
  end(world, exp, step, ctx) {
    world.expedition = null;
    unpack(world, ctx);
    world.reports.push({
      id: exp.id, start: exp.start, end: step.time, dropped: exp.dropped, leftBehind: exp.leftBehind,
      stops: exp.actions.map(({ q, place, title, outcome }) => ({ q, place, title, outcome })),
    });
    if (world.reports.length > KEEP_REPORTS) world.reports.shift();
  },
};

// Lets time pass up to t: everything on the expedition that is due by then happens.
// project: only to foresee the result (see projectedWorld), the Energie is left out.
export function advance(world, t, ctx, project = false) {
  while (world.expedition) {
    const step = nextStep(world.expedition);
    if (step.time > t) return;
    settle(world, Math.max(step.time, world.stamina.at), ctx);
    STEPS[step.kind](world, world.expedition, step, ctx, project);
  }
}

// The world as it will be once the expedition is over, to plan what can be
// added: material gathered, things built, quests done. Energie left out.
export function projectedWorld(world, ctx) {
  if (!world.expedition) return world;
  const copy = structuredClone({ ...world, journal: [], reports: [] });
  advance(copy, Infinity, { ...ctx, world: copy }, true);
  return copy;
}

const newExpedition = (e) => ({ id: e.id, day: e.d, start: e.t, actions: [], rushed: null, dropped: [], leftBehind: {} });

// Events from before actions could be added: one quest with all its parts
// (out, act, back), or a route with its stops; all of it paid at the start.
// They follow the old rules of Energie (a minute each, ways cost Energie).
function oldExpedition(world, e, ctx) {
  if (world.expedition) return;
  const stops = (Array.isArray(e.stops) ? e.stops : [e]).filter((s) => s && typeof s.q === 'string' && s.outcome?.reward);
  if (stops.length === 0) return;
  const home = camp(ctx.catalog);
  const exp = newExpedition(e);
  let from = home;
  stops.forEach((s, i) => {
    const place = ctx.catalog.placeById.get(s.place) || home;
    const prev = exp.actions[i - 1];
    const work = Number(s.act) || 0;
    const { pace } = RULE_SETS[1];
    exp.actions.push({
      id: i === 0 ? e.id : `${e.id}:${i}`, q: s.q, place: s.place, title: s.title, day: e.d, regel: 1, notBefore: e.t,
      from: { x: from.x, y: from.y }, way: Number(s.out) || 0, work, least: work / pace,
      home: i === stops.length - 1 ? Number(e.back) || 0 : legStamina(place, home, wayCtx(world, ctx)) * pace,
      credit: prev ? prev.home / pace : 0, outcome: s.outcome, stage: 0,
    });
    from = place;
  });
  world.expedition = exp;
  spend(world, e.cost);
}

// An action for the Envoy: with nothing to do he sets out for it, else it
// joins the row. Its Energie is set aside now. It follows the rules of
// Energie its event names (see RULE_SETS).
function addAction(world, e, ctx) {
  if (Array.isArray(e.stops) || e.out !== undefined) { oldExpedition(world, e, ctx); return; }
  const place = ctx.catalog.placeById.get(e.place);
  if (!place || typeof e.q !== 'string' || !e.outcome?.reward) return;
  // an Auftrag of the Aushang: once, only those of its day, no Energie
  if (isJob(e.q) && (!jobsOpen(world) || !jobAllowed(e, world) || Number(e.outcome.stamina) > 0)) return;
  const regel = RULE_SETS[e.regel] ? e.regel : 1;
  const action = {
    id: e.id, q: e.q, place: e.place, title: e.title, day: e.d, regel,
    ...addition(world, place, e.t, wayCtx(world, ctx), rulesOf(e).pace),
    work: Number(e.outcome.minutes) || 0,
    least: Number(e.least ?? e.outcome.stamina) || 0,
    outcome: e.outcome,
    stage: 0,
  };
  if (!world.expedition) world.expedition = newExpedition(e);
  world.expedition.actions.push(action);
  spend(world, reserve(action));
  countClothes(world, e.outcome.clothes);
}

// The person takes the last action out again, while it has not begun.
function removeAction(world, e, ctx) {
  const exp = world.expedition;
  const last = exp?.actions[exp.actions.length - 1];
  if (last && last.id === e.ref && last.stage === 0) dropAction(world, exp, exp.actions.length - 1, e.t, ctx, null);
}

// A descent into the Tiefen (see depths.js): only to the next Ebene, at the
// camp, after the rest. What it brought counts; then the Envoy rests.
function descendInto(world, e, ctx) {
  const o = e.outcome;
  const floor = nextFloor(world);
  if (!o?.reward || blockedAt(world, e.t) || floor.depth.id !== e.tiefe || floor.ebene !== e.ebene) return;
  if (o.result === 'won' || o.result === 'calmed') world.tiefen.cleared[e.tiefe] = e.ebene;
  world.purse.splitter += Math.max(0, Math.floor(Number(o.reward.splitter) || 0));
  (o.reward.things || []).forEach((thing, n) => {
    if (thing?.kind !== 'item' || !ctx.catalog.itemById.has(thing.id)) return;
    stow(world, ctx.catalog, { inst: `${e.id}:${n}`, kind: 'item', id: thing.id, got: e.t, ...kept(thing) });
  });
  world.tiefen.rest = e.t + restMinutes(ctx.stats) * 60000;
  world.tiefen.descents += 1;
  world.tiefen.last = { id: e.id, tiefe: e.tiefe, ebene: e.ebene, result: o.result, t: e.t };
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
  if (!fits(item, figureOf(world))) return;
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
      addAction(world, e, ctx);
      break;
    case 'unqueue':
      removeAction(world, e, ctx);
      break;
    case 'buy':
      if (!world.bought[e.offer] && world.purse.splitter >= e.price) {
        world.purse.splitter -= e.price;
        world.bought[e.offer] = true;
        // a plan for Deko is knowledge, not a thing for the backpack; a potion
        // is drunk at once
        if (e.kind === 'plan') world.plans.found[e.thing] = world.plans.found[e.thing] || e.d;
        else if (e.kind === 'trank') giveBack(world, potionById(e.thing)?.energie || 0, ctx);
        else stow(world, ctx.catalog, { inst: e.id, kind: e.kind, id: e.thing, got: e.t, ...kept(e) });
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
    case 'tiefe':
      descendInto(world, e, ctx);
      break;
    case 'weben':
      // the strength of `quelle` goes into `ziel`; `quelle` falls to threads (see weave.js)
      if (canWeave(world, ctx.catalog, e.ziel, e.quelle)) {
        const target = world.items[e.ziel];
        delete target.guete;
        delete target.bonus;
        Object.assign(target, wovenBonuses(world.items[e.quelle]));
        removeEntry(world, e.quelle);
      }
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
    case 'gesehen':
      if (typeof e.ref === 'string') world.seen[e.ref] = true;
      break;
    case 'kampf':
    case 'abbild':
    case 'ruhmkauf':
      applyArenaEvent(world, e, ctx);
      break;
    case 'envoy': {
      const name = String(e.name || '').trim().slice(0, NAME_MAX);
      const born = Number.isInteger(e.geburtsjahr) ? e.geburtsjahr : null;
      if (name) world.envoy = { name, figur: String(e.figur || ''), haut: String(e.haut || ''), haar: String(e.haar || ''), unterhemd: e.unterhemd !== false, geburtsjahr: born };
      break;
    }
    default:
      break;
  }
}

// Help while trying things out, only offered in the test copy (see ui/testtools.js):
// the bar full again (or more Energie, beyond the end of the bar), material
// added (as much as fits, like after a trip), Bannsplitter and Ruhm added, the next
// plan not found yet, the rest after a descent into the Tiefen over, or the
// running expedition over at once, every action done.
function testHelp(world, e, ctx) {
  if (e.rast) world.tiefen.rest = Math.min(world.tiefen.rest, e.t);
  if (e.energie) world.stamina.value = Math.max(world.stamina.value, maxStamina(ctx.stats));
  world.stamina.value += Math.max(0, Math.floor(Number(e.mehrEnergie) || 0));
  if (e.plan) {
    const next = ctx.catalog.deko.find((d) => d.fundort !== 'start' && d.lagerstufe <= world.camp.stage && !world.plans.found[d.id]);
    if (next) world.plans.found[next.id] = e.d;
  }
  if (e.kleidung) {
    // a piece of clothing as if found on the way: fits the Envoy, in a colour of its own
    const thing = lootThing({ ...ctx, world }, seededRandom(`${e.id}:kleidung`), 'fund', seededRandom(`${e.id}:farbe`));
    if (thing) stow(world, ctx.catalog, { inst: e.id, kind: 'item', id: thing.id, got: e.t, ...kept(thing) });
  }
  for (const key of LIMITED_MATERIALS) {
    const amount = Math.max(0, Math.floor(Number(e[key]) || 0));
    if (amount > 0) world.purse[key] += Math.min(amount, roomFor(world, ctx.catalog, key));
  }
  world.purse.splitter += Math.max(0, Math.floor(Number(e.splitter) || 0));
  const ruhm = Math.max(0, Math.floor(Number(e.ruhm) || 0));
  world.arena.ruhm += ruhm;
  world.arena.earned += ruhm;
  if (e.fertig && world.expedition) {
    world.expedition.rushed = e.t;
    advance(world, e.t, ctx);
  }
}

// Each task of the Tageswerk done gives a share of the bar back (a quarter;
// an eighth before version 5.12, see RULE_SETS), also beyond its end
// (whoever does the Tageswerk in the morning with a full bar keeps it).
export function restFromTask(world, t, ctx, share) {
  advance(world, t, ctx);
  settle(world, t, ctx);
  world.stamina.value += maxStamina(ctx.stats) * share;
}

// The morning (SLEEP_BONUS_HOUR): with a Schlafplatz the Envoy wakes up with
// extra Energie, once, even beyond the end of the bar (up to the end of the
// bar and the bonus). A Schlafplatz built in the night counts. Spent, it does
// not come back until the next morning. It never takes Energie away that is
// already beyond that (from tasks or the test menu).
export function wakeUp(world, t, ctx) {
  advance(world, t, ctx);
  settle(world, t, ctx);
  const bonus = sleepBonus(world, ctx.catalog, ctx.stats);
  const value = world.stamina.value;
  if (bonus > 0) world.stamina.value = Math.max(value, Math.min(maxStamina(ctx.stats) + bonus, value + bonus));
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
