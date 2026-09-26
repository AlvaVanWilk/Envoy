// Which quests are on the map, where, and whether they can be started.
// Two kinds:
//   fixed quests from data/welt.xlsx (sheet Quests)
//   encounters: every day a few spirits appear at wild places, chosen to
//   fit the hero's current strength (average of the stats at the start of the day)

import { ENCOUNTER_COST, ENCOUNTER_CHANCE, STATS } from '../config.js';
import { seededRandom } from './rng.js';
import { heroPower, fighter, checkChance } from './hero.js';
import { fight } from './combat.js';
import { addDays } from '../days.js';

const statName = (id) => STATS.find((s) => s.id === id).name;
const MATERIAL_NAMES = { holz: 'Holz', stein: 'Stein', glimmer: 'Glimmer' };

// ctx = { catalog, world, stats, statsAtDayStart, fx, totals, day }

export function conditionMet(c, ctx) {
  if (c.type === 'stat') return ctx.stats[c.stat].level >= c.min;
  if (c.type === 'quest') return (ctx.world.quests[c.id]?.done || 0) > 0;
  if (c.type === 'total') return (ctx.totals[c.key] || 0) >= c.min;
  if (c.type === 'material') return (ctx.world.purse[c.key] || 0) >= c.min;
  return false;
}

export function describeCondition(c, ctx) {
  if (c.type === 'stat') return `${statName(c.stat)} ${c.min}`;
  if (c.type === 'quest') return `nach „${ctx.catalog.questById.get(c.id)?.name || c.id}“`;
  if (c.type === 'total') {
    const now = ctx.totals[c.key] || 0;
    const shown = c.key === 'km' ? now.toFixed(1).replace('.', ',') : Math.floor(now);
    return c.key === 'km'
      ? `${c.min} km gegangen oder gefahren (${shown})`
      : `${c.min} Stockwerke gestiegen (${shown})`;
  }
  if (c.type === 'material') return `${c.min} ${MATERIAL_NAMES[c.key]}`;
  return '';
}

export function placeUnlocked(place, ctx) {
  return place.unlock.every((c) => conditionMet(c, ctx));
}

// Encounters of a day. Each wild place has its own daily chance, so the
// list stays the same during the day; those at places still locked are
// simply not shown. At least one appears at a place open from the start.
export function encountersFor(day, ctx) {
  const { catalog } = ctx;
  const power = heroPower(ctx.statsAtDayStart);
  const wild = catalog.places.filter((p) => p.encounters && p.monsters.length > 0);
  const chosen = wild.filter((p) => seededRandom(`${day}:${p.id}:begegnung`)() < ENCOUNTER_CHANCE);
  const alwaysOpen = wild.filter((p) => p.unlock.length === 0);
  if (alwaysOpen.length > 0 && !chosen.some((p) => alwaysOpen.includes(p))) {
    chosen.push(alwaysOpen[Math.floor(seededRandom(`${day}:begegnung`)() * alwaysOpen.length)]);
  }

  return chosen
    .filter((place) => placeUnlocked(place, ctx))
    .map((place) => {
      const rng = seededRandom(`${day}:${place.id}:monster`);
      const pool = place.monsters.map((id) => catalog.monsterById.get(id)).filter(Boolean);
      // close to the hero's strength is likely, one level above now and then
      const weights = pool.map((m) => Math.exp(-((m.stufe - power) ** 2) / 1.5));
      let r = rng() * weights.reduce((a, b) => a + b, 0);
      let monster = pool[0];
      for (let i = 0; i < pool.length; i += 1) {
        r -= weights[i];
        if (r <= 0) { monster = pool[i]; break; }
      }
      return {
        id: `enc:${day}:${place.id}`,
        encounter: true,
        name: monster.name,
        place: place.id,
        text: monster.text,
        monsters: [monster.id],
        checks: [],
        conditions: [],
        consumes: {},
        cost: ENCOUNTER_COST,
        reward: null,
        repeatable: false,
        cooldown: 0,
      };
    });
}

export function questById(id, ctx) {
  if (id.startsWith('enc:')) return encountersFor(ctx.day, ctx).find((q) => q.id === id) || null;
  return ctx.catalog.questById.get(id) || null;
}

// status: 'open' | 'locked' | 'cooldown' | 'done'; missing: texts of what is lacking
export function questState(quest, ctx) {
  const record = ctx.world.quests[quest.id];
  if (quest.encounter) {
    return ctx.world.encountersDone[quest.id] ? { status: 'done', missing: [] } : { status: 'open', missing: [] };
  }
  if (record?.done && !quest.repeatable) return { status: 'done', missing: [] };
  if (record?.done && quest.repeatable && quest.cooldown > 0) {
    const again = addDays(record.last, quest.cooldown);
    if (ctx.day < again) return { status: 'cooldown', missing: [], again };
  }
  const missing = quest.conditions.filter((c) => !conditionMet(c, ctx)).map((c) => describeCondition(c, ctx));
  for (const [key, amount] of Object.entries(quest.consumes)) {
    if ((ctx.world.purse[key] || 0) < amount) missing.push(`${amount} ${MATERIAL_NAMES[key]}`);
  }
  return missing.length > 0 ? { status: 'locked', missing } : { status: 'open', missing: [] };
}

export function questsAt(placeId, ctx) {
  const fixed = ctx.catalog.quests.filter((q) => q.place === placeId);
  const encounters = encountersFor(ctx.day, ctx).filter((q) => q.place === placeId);
  return [...encounters, ...fixed];
}

// Stats a quest asks for, to show as small emblems.
export function questStats(quest, ctx) {
  const used = new Set(quest.checks.map((c) => c.stat));
  if (quest.monsters.length > 0) {
    used.add('kraft');
    used.add('beweglichkeit');
    used.add('ausdauer');
    if (quest.monsters.some((id) => ctx.catalog.monsterById.get(id)?.calmable)) used.add('gelassenheit');
  }
  const place = ctx.catalog.placeById.get(quest.place);
  if (place?.typ === 'sammeln') used.add('kraft');
  return STATS.map((s) => s.id).filter((id) => used.has(id));
}

// A rough chance of success, from the check chances and 60 trial fights.
export function successChance(quest, ctx) {
  let chance = 1;
  for (const check of quest.checks) {
    chance *= checkChance(ctx.stats[check.stat].level, check.difficulty, ctx.fx.glueck);
  }
  if (quest.monsters.length > 0) {
    const rng = seededRandom(`schaetzung:${quest.id}`);
    let wins = 0;
    const trials = 60;
    for (let t = 0; t < trials; t += 1) {
      let life = null;
      let won = true;
      for (const id of quest.monsters) {
        const monster = ctx.catalog.monsterById.get(id);
        const hero = fighter(ctx.stats, ctx.fx, monster);
        if (life !== null) hero.life = life;
        const result = fight(hero, monster, rng);
        life = result.heroLife;
        if (result.result === 'lost') { won = false; break; }
      }
      if (won) wins += 1;
    }
    chance *= wins / trials;
  }
  return chance;
}

export function estimateLabel(chance) {
  if (chance >= 0.85) return 'leicht';
  if (chance >= 0.6) return 'machbar';
  if (chance >= 0.35) return 'fordernd';
  return 'gefährlich';
}
