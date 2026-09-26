// What happens on site. Nothing fails: the stats decide whether a quest can
// be started at all, how long the work takes and how much it yields.
//   sammeln   material, more with the `ertrag` stats
//   erkunden  a fixed reward, a few more Traumsplitter with the `ertrag` stats
//   bauen     uses material, gives the reward
//   kampf     one spirit: calmed, defeated or, if it is too strong, driven off
//   hoehle    several spirits one after the other, as far as the Envoy's life reaches
// The result is stored in the event as it is, so it never changes later.

import {
  SPEEDUP_PER_LEVEL, FASTEST_SHARE, FIGHT_MINUTES, FIGHT_MINUTES_PER_ROUND, YIELD_PER_LEVEL,
  DRIVEN_LOOT_SHARE, CAVE_RETREAT_SHARE,
} from '../config.js';
import { seededRandom, randomInt, pick } from './rng.js';
import { fighter, heroPower } from './hero.js';
import { fight } from './combat.js';
import { itemLevel } from './items.js';

const LOOT_BAND = 3;
const FURNITURE_SHARE = 0.3;

const average = (stats, ids) => (ids.length === 0 ? 1 : ids.reduce((sum, id) => sum + stats[id].level, 0) / ids.length);

// Share of the base time needed on site: 1 at level 1, less with higher stats.
export function speedShare(stats, ids) {
  if (ids.length === 0) return 1;
  return Math.max(FASTEST_SHARE, 1 - SPEEDUP_PER_LEVEL * (average(stats, ids) - 1));
}

function roll(rng, range, bonus = 0) {
  if (!range || range[1] <= 0) return 0;
  return randomInt(rng, range[0], range[1]) + bonus;
}

// An equipment piece or furniture that fits the hero's strength.
function lootThing(ctx, rng) {
  const power = heroPower(ctx.stats);
  const items = ctx.catalog.equipment.filter((i) => i.herkunft.includes('beute')
    && Math.abs(itemLevel(i) - power) <= LOOT_BAND);
  const furniture = ctx.catalog.furniture.filter((f) => f.herkunft.includes('beute'));
  if (furniture.length > 0 && (items.length === 0 || rng() < FURNITURE_SHARE)) {
    return { kind: 'furniture', id: pick(rng, furniture).id };
  }
  return items.length > 0 ? { kind: 'item', id: pick(rng, items).id } : null;
}

function monsterLoot(monster, result, ctx, rng, into) {
  const luck = 1 + ctx.fx.glueck / 100;
  const share = result === 'calmed' ? 1.5 : result === 'driven' ? DRIVEN_LOOT_SHARE : 1;
  into.splitter += Math.round(roll(rng, monster.loot.splitter) * share * luck);
  into.pilzholz += Math.round(roll(rng, monster.loot.pilzholz) * (result === 'driven' ? DRIVEN_LOOT_SHARE : 1));
  into.stein += Math.round(roll(rng, monster.loot.stein) * (result === 'driven' ? DRIVEN_LOOT_SHARE : 1));
  if (result !== 'driven' && rng() * 100 < monster.loot.itemChance * luck) {
    const thing = lootThing(ctx, rng);
    if (thing) into.things.push(thing);
  }
}

// How much the `ertrag` stats add: gathering brings one piece more for
// every three levels, exploring a few more Traumsplitter per level.
export function yieldBonus(quest, ctx) {
  const level = average(ctx.stats, quest.yieldStats || []);
  return {
    pieces: quest.kind === 'sammeln' ? Math.floor(level / 3) : 0,
    splitter: (quest.kind === 'erkunden' ? 1 + YIELD_PER_LEVEL * (level - 1) : 1) * (1 + ctx.fx.glueck / 100),
  };
}

// The possible fixed reward as ranges, for the display before starting.
export function rewardRange(quest, ctx) {
  const r = quest.reward;
  if (!r) return null;
  const bonus = yieldBonus(quest, ctx);
  const piece = (range) => (range[1] > 0 ? [range[0] + bonus.pieces, range[1] + bonus.pieces] : [0, 0]);
  return {
    splitter: r.splitter.map((v) => Math.round(v * bonus.splitter)),
    pilzholz: piece(r.pilzholz),
    stein: piece(r.stein),
  };
}

function fixedReward(quest, ctx, rng, into) {
  const r = quest.reward;
  if (!r) return;
  const bonus = yieldBonus(quest, ctx);
  into.splitter += Math.round(roll(rng, r.splitter) * bonus.splitter);
  into.pilzholz += roll(rng, r.pilzholz, r.pilzholz[1] > 0 ? bonus.pieces : 0);
  into.stein += roll(rng, r.stein, r.stein[1] > 0 ? bonus.pieces : 0);
  for (const id of r.items) into.things.push({ kind: 'item', id });
  for (const id of r.furniture) into.things.push({ kind: 'furniture', id });
  into.unlocks.push(...r.unlocks);
  into.rest = into.rest || r.rest;
}

export function runQuest(quest, ctx, seed) {
  const rng = seededRandom(seed);
  const reward = { splitter: 0, pilzholz: 0, stein: 0, things: [], unlocks: [], rest: false };
  const fights = [];
  let minutes = quest.minutes;
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
      minutes += FIGHT_MINUTES + FIGHT_MINUTES_PER_ROUND * f.rounds.length;
      monsterLoot(monster, result, ctx, rng, reward);
      life = f.heroLife;
      if (result === 'driven') {
        if (n < quest.monsters.length - 1) cleared = false;
        break;
      }
    }
  } else {
    minutes *= speedShare(ctx.stats, quest.speedStats || []);
  }

  // A cave gives its own reward only when every spirit in it is overcome.
  if (quest.kind !== 'hoehle' || cleared) fixedReward(quest, ctx, rng, reward);

  return {
    kind: quest.kind,
    fights,
    defeated: fights.length,
    total: quest.monsters.length,
    cleared,
    minutes: Math.max(1, Math.round(minutes)),
    reward,
    consumed: { ...quest.consumes },
  };
}
