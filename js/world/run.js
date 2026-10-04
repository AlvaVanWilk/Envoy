// What happens on site. Nothing fails: the stats decide whether a quest can
// be started at all, how long the work takes and how much it yields.
//   sammeln   material, more with the `ertrag` stats; on the Trümmerfeld by the
//             dice of gatherRoll() (see below)
//   erkunden  a fixed reward, more Bannsplitter with the `ertrag` stats
//   bauen     uses material, gives the reward
//   kampf     one spirit: calmed, defeated or, if it is too strong, driven off
//   hoehle    several spirits one after the other, as far as the Envoy's life reaches
// The work costs the stamina from the table (`kosten`), less with the
// `tempo` stats, and takes as many minutes as it costs.
// Plans for Deko are rolled with it (see plans.js).
// The result is stored in the event as it is, so it never changes later.

import {
  SPEEDUP_PER_LEVEL, FASTEST_SHARE, YIELD_PER_LEVEL, MINUTES_PER_STAMINA,
  DRIVEN_LOOT_SHARE, CAVE_RETREAT_SHARE,
  GATHER_BASE, GATHER_DICE, GATHER_CHANCE, GATHER_CHANCE_PER_LEVEL, GATHER_CHANCE_MAX, GATHER_FIND_CHANCE,
} from '../config.js';
import { seededRandom, randomInt, pick } from './rng.js';
import { fighter, heroPower } from './hero.js';
import { fight } from './combat.js';
import { itemLevel } from './items.js';
import { roomFor } from './inventory.js';
import { rollPlans } from './plans.js';

const LOOT_BAND = 3;

const average = (stats, ids) => (ids.length === 0 ? 1 : ids.reduce((sum, id) => sum + stats[id].level, 0) / ids.length);

// Share of the base stamina needed on site: 1 at level 1, less with higher stats.
export function speedShare(stats, ids) {
  if (ids.length === 0) return 1;
  return Math.max(FASTEST_SHARE, 1 - SPEEDUP_PER_LEVEL * (average(stats, ids) - 1));
}

// Stamina for the work on site, and so also its minutes.
export function siteStamina(quest, stats) {
  return Math.max(1, Math.round(quest.cost * speedShare(stats, quest.speedStats || [])));
}

function roll(rng, range) {
  if (!range || range[1] <= 0) return 0;
  return randomInt(rng, range[0], range[1]);
}

// amount × factor, rounded up or down by chance so that small amounts
// also profit from a bonus: 1 × 1.3 gives 2 in three of ten cases.
function scaled(rng, amount, factor) {
  if (amount <= 0) return 0;
  const exact = amount * factor;
  const whole = Math.floor(exact);
  return whole + (rng() < exact - whole ? 1 : 0);
}

// An equipment piece that fits the hero's strength.
function lootThing(ctx, rng) {
  const power = heroPower(ctx.stats);
  const items = ctx.catalog.equipment.filter((i) => i.herkunft.includes('beute')
    && Math.abs(itemLevel(i) - power) <= LOOT_BAND);
  return items.length > 0 ? { kind: 'item', id: pick(rng, items).id } : null;
}

function monsterLoot(monster, result, ctx, rng, into) {
  const luck = 1 + ctx.fx.glueck / 100;
  const share = result === 'calmed' ? 1.5 : result === 'driven' ? DRIVEN_LOOT_SHARE : 1;
  into.splitter += scaled(rng, roll(rng, monster.loot.splitter), share * luck);
  into.pilzholz += Math.round(roll(rng, monster.loot.pilzholz) * (result === 'driven' ? DRIVEN_LOOT_SHARE : 1));
  into.stein += Math.round(roll(rng, monster.loot.stein) * (result === 'driven' ? DRIVEN_LOOT_SHARE : 1));
  if (result !== 'driven' && rng() * 100 < monster.loot.itemChance * luck) {
    const thing = lootThing(ctx, rng);
    if (thing) into.things.push(thing);
  }
}

// How much the `ertrag` stats add: +5 % per level above 1, for gathering
// on the pieces, for exploring on the Bannsplitter. Luck adds Bannsplitter.
// Achievements can add to gathering (ctx.bonus.sammeln).
export function yieldBonus(quest, ctx) {
  const extra = YIELD_PER_LEVEL * (average(ctx.stats, quest.yieldStats || []) - 1);
  const gathering = 1 + extra + (ctx.bonus?.sammeln || 0);
  return {
    pieces: quest.kind === 'sammeln' ? gathering : 1,
    splitter: (quest.kind === 'erkunden' ? 1 + extra : 1) * (1 + ctx.fx.glueck / 100),
  };
}

// The possible fixed reward as ranges, for the display before starting.
export function rewardRange(quest, ctx) {
  const r = quest.reward;
  if (!r) return null;
  const bonus = yieldBonus(quest, ctx);
  const span = (range, factor) => (range[1] > 0 ? [Math.floor(range[0] * factor), Math.ceil(range[1] * factor)] : [0, 0]);
  return {
    splitter: span(r.splitter, bonus.splitter),
    pilzholz: span(r.pilzholz, bonus.pieces),
    stein: span(r.stein, bonus.pieces),
  };
}

function fixedReward(quest, ctx, rng, into) {
  const r = quest.reward;
  if (!r) return;
  const bonus = yieldBonus(quest, ctx);
  into.splitter += scaled(rng, roll(rng, r.splitter), bonus.splitter);
  into.pilzholz += scaled(rng, roll(rng, r.pilzholz), bonus.pieces);
  into.stein += scaled(rng, roll(rng, r.stein), bonus.pieces);
  for (const id of r.items) into.things.push({ kind: 'item', id });
  for (const id of r.plans || []) into.plans.push(id);
  into.unlocks.push(...r.unlocks);
  into.rest = into.rest || r.rest;
}

// --- gathering on the Trümmerfeld ------------------------------------------
// Every point of Energie is a minute of work. It brings GATHER_BASE pieces
// and one more for each of GATHER_DICE dice that succeeds. The chance of a
// die grows with the stat that belongs to the material, so a higher stat
// means a better day, never a failure: there are at least GATHER_BASE pieces
// for every Energie, however the dice fall. (A pool of success dice is how
// many pen-and-paper games let a skill help without making a roll fail.)

export function gatherChance(statLevel, bonus = 0) {
  return Math.min(GATHER_CHANCE_MAX, GATHER_CHANCE + GATHER_CHANCE_PER_LEVEL * (statLevel - 1) + bonus);
}

export function gatherRoll(rng, chance) {
  let pieces = GATHER_BASE;
  for (let i = 0; i < GATHER_DICE; i += 1) if (rng() < chance) pieces += 1;
  return pieces;
}

// What the Envoy can do, for the display before he sets out: the most he can
// gather now (as much as he can carry, and as much as his Energie surely
// brings in even with the worst dice), and the Energie an amount takes: at
// least (the best dice) and at most (the worst).
export function gatherEstimate(quest, ctx, { amount = 1, energy = 0 } = {}) {
  const chance = gatherChance(ctx.stats[quest.gather.stat].level, ctx.bonus?.sammeln || 0);
  const room = roomFor(ctx.world, ctx.catalog, quest.gather.material);
  const most = Math.min(room, GATHER_BASE * Math.floor(energy));
  const wanted = Math.max(1, amount);
  return {
    room,
    most,
    average: GATHER_BASE + GATHER_DICE * chance,
    energy: { min: Math.ceil(wanted / (GATHER_BASE + GATHER_DICE)), max: Math.ceil(wanted / GATHER_BASE) },
  };
}

// findRng: dice of their own for the Bannsplitter found now and then, so
// the dice of the material fall as they always did.
function runGather(quest, ctx, rng, findRng, { amount = 1, energy = Infinity } = {}) {
  const { material, stat } = quest.gather;
  const chance = gatherChance(ctx.stats[stat].level, ctx.bonus?.sammeln || 0);
  const room = roomFor(ctx.world, ctx.catalog, material);
  const wanted = Math.min(Math.max(1, amount), room);
  const budget = Math.max(0, Math.floor(energy));
  let units = 0;
  let got = 0;
  const rolls = [];
  const finds = []; // the minutes (from 0) in which a Bannsplitter turned up
  while (got < wanted && units < budget) {
    units += 1;
    rolls.push(gatherRoll(rng, chance));
    got += rolls[rolls.length - 1];
    if (findRng() < GATHER_FIND_CHANCE) finds.push(units - 1);
  }
  got = Math.min(got, wanted);
  return {
    kind: 'sammeln',
    fights: [],
    defeated: 0,
    total: 0,
    cleared: true,
    stamina: units,
    minutes: units * MINUTES_PER_STAMINA,
    reward: { splitter: finds.length, pilzholz: material === 'pilzholz' ? got : 0, stein: material === 'stein' ? got : 0, things: [], plans: [], unlocks: [], rest: false },
    consumed: {},
    gather: { material, wanted, units, rolls, finds },
  };
}

// The plans an action finds go to its reward; `search` keeps what it adds
// to the search for the others.
function withPlans(outcome, quest, ctx, seed) {
  const plans = rollPlans(quest, ctx, seed, outcome);
  for (const id of plans.found) if (!outcome.reward.plans.includes(id)) outcome.reward.plans.push(id);
  outcome.search = plans.search;
  return outcome;
}

// options: for gathering { amount, energy }
export function runQuest(quest, ctx, seed, options = {}) {
  const rng = seededRandom(seed);
  if (quest.gather) return withPlans(runGather(quest, ctx, rng, seededRandom(`${seed}:fund`), options), quest, ctx, seed);
  const reward = { splitter: 0, pilzholz: 0, stein: 0, things: [], plans: [], unlocks: [], rest: false };
  const fights = [];
  const stamina = siteStamina(quest, ctx.stats);
  let cleared = true;

  if (quest.monsters.length > 0) {
    let life = null;
    for (const [n, id] of quest.monsters.entries()) {
      const monster = ctx.catalog.monsterById.get(id);
      const hero = fighter(ctx.stats, ctx.fx, monster);
      const maxLife = hero.life;
      if (life !== null) {
        // In a cave the Envoy turns back while there is still some life left.
        if (life < maxLife * CAVE_RETREAT_SHARE) { cleared = false; break; }
        hero.life = life;
      }
      const f = fight(hero, monster, rng);
      const result = f.result === 'lost' ? 'driven' : f.result;
      fights.push({ monster: id, result, rounds: f.rounds, heroMax: maxLife, monsterMax: monster.leben });
      monsterLoot(monster, result, ctx, rng, reward);
      life = f.heroLife;
      if (result === 'driven') {
        if (n < quest.monsters.length - 1) cleared = false;
        break;
      }
    }
  }

  // A cave gives its own reward only when every spirit in it is overcome.
  if (quest.kind !== 'hoehle' || cleared) fixedReward(quest, ctx, rng, reward);

  return withPlans({
    kind: quest.kind,
    fights,
    defeated: fights.length,
    total: quest.monsters.length,
    cleared,
    stamina,
    minutes: stamina * MINUTES_PER_STAMINA,
    reward,
    consumed: { ...quest.consumes },
  }, quest, ctx, seed);
}
