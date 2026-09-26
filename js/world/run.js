// Plays a quest through: first the checks, then the fights, then the reward.
// The result is stored in the quest event as it is, so it never changes
// later, even if the rules are tuned.

import { seededRandom, randomInt, pick } from './rng.js';
import { fighter, checkChance, heroPower } from './hero.js';
import { fight } from './combat.js';
import { itemLevel } from './items.js';

const LOOT_BAND = 3;
const FURNITURE_SHARE = 0.3;

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

function monsterLoot(monster, calmed, ctx, rng, into) {
  const luck = 1 + ctx.fx.glueck / 100;
  into.glimmer += Math.round(roll(rng, monster.loot.glimmer) * (calmed ? 1.5 : 1) * luck);
  into.holz += roll(rng, monster.loot.holz);
  into.stein += roll(rng, monster.loot.stein);
  if (rng() * 100 < monster.loot.itemChance * luck) {
    const thing = lootThing(ctx, rng);
    if (thing) into.things.push(thing);
  }
}

export function runQuest(quest, ctx, seed) {
  const rng = seededRandom(seed);
  const steps = [];
  const monsters = [];
  let ok = true;

  for (const check of quest.checks) {
    const level = ctx.stats[check.stat].level;
    const chance = checkChance(level, check.difficulty, ctx.fx.glueck);
    const pass = rng() < chance;
    steps.push({ kind: 'check', stat: check.stat, difficulty: check.difficulty, chance, pass });
    if (!pass) { ok = false; break; }
  }

  let life = null;
  if (ok) {
    for (const id of quest.monsters) {
      const monster = ctx.catalog.monsterById.get(id);
      const hero = fighter(ctx.stats, ctx.fx, monster);
      const maxLife = hero.life;
      if (life !== null) hero.life = life;
      const result = fight(hero, monster, rng);
      life = result.heroLife;
      steps.push({ kind: 'fight', monster: id, result: result.result, rounds: result.rounds, heroMax: maxLife, monsterMax: monster.leben });
      monsters.push({ id, result: result.result });
      if (result.result === 'lost') { ok = false; break; }
    }
  }

  const reward = { glimmer: 0, holz: 0, stein: 0, things: [], unlocks: [], rest: false };
  if (ok) {
    const r = quest.reward;
    if (r) {
      const place = ctx.catalog.placeById.get(quest.place);
      const gatherBonus = place?.typ === 'sammeln' ? Math.floor(ctx.stats.kraft.level / 3) : 0;
      reward.glimmer += Math.round(roll(rng, r.glimmer) * (1 + ctx.fx.glueck / 100));
      reward.holz += roll(rng, r.holz, r.holz[1] > 0 ? gatherBonus : 0);
      reward.stein += roll(rng, r.stein, r.stein[1] > 0 ? gatherBonus : 0);
      for (const id of r.items) reward.things.push({ kind: 'item', id });
      for (const id of r.furniture) reward.things.push({ kind: 'furniture', id });
      reward.unlocks.push(...r.unlocks);
      reward.rest = r.rest;
    }
    for (const m of monsters) {
      monsterLoot(ctx.catalog.monsterById.get(m.id), m.result === 'calmed', ctx, rng, reward);
    }
  }

  return { ok, steps, monsters, reward, consumed: ok ? { ...quest.consumes } : {} };
}
