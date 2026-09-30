// What happens on site. Nothing fails: the stats decide whether a quest can
// be started at all, how long the work takes and how much it yields.
//   sammeln   material, more with the `ertrag` stats
//   erkunden  a fixed reward, more Bannsplitter with the `ertrag` stats
//   bauen     uses material, gives the reward
//   kampf     one spirit: calmed, defeated or, if it is too strong, driven off
//   hoehle    several spirits one after the other, as far as the Envoy's life reaches
// The work costs the stamina from the table (`kosten`), less with the
// `tempo` stats, and takes as many minutes as it costs.
// The result is stored in the event as it is, so it never changes later.

import {
  SPEEDUP_PER_LEVEL, FASTEST_SHARE, YIELD_PER_LEVEL, MINUTES_PER_STAMINA,
  DRIVEN_LOOT_SHARE, CAVE_RETREAT_SHARE,
} from '../config.js';
import { seededRandom, randomInt, pick } from './rng.js';
import { fighter, heroPower } from './hero.js';
import { fight } from './combat.js';
import { itemLevel } from './items.js';

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

// An equipment piece that fits the hero's strength. (Furniture is not
// found for now; the camp gets its own way of growing.)
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
  for (const id of r.furniture) into.things.push({ kind: 'furniture', id });
  into.unlocks.push(...r.unlocks);
  into.rest = into.rest || r.rest;
}

export function runQuest(quest, ctx, seed) {
  const rng = seededRandom(seed);
  const reward = { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: [], rest: false };
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

  return {
    kind: quest.kind,
    fights,
    defeated: fights.length,
    total: quest.monsters.length,
    cleared,
    stamina,
    minutes: stamina * MINUTES_PER_STAMINA,
    reward,
    consumed: { ...quest.consumes },
  };
}
