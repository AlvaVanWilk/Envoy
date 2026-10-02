// Which quests are on the map, where, and whether they can be started.
// Two kinds:
//   fixed quests from data/welt.xlsx (sheet Quests)
//   encounters: every day a few spirits appear at wild places, chosen to
//   fit the hero's current strength (average of the stats at the start of the day)

import { ENCOUNTER_COST, ENCOUNTER_CHANCE, STATS, MATERIALS, GATHER_STATS } from '../config.js';
import { seededRandom } from './rng.js';
import { heroPower } from './hero.js';
import { facilityQuestById, stageRow } from './camp.js';
import { gatherPlace } from './map.js';
import { addDays } from '../days.js';

const statName = (id) => STATS.find((s) => s.id === id).name;

// ctx = { catalog, world, stats, statsAtDayStart, fx, totals, day }

export function conditionMet(c, ctx) {
  if (c.type === 'stat') return ctx.stats[c.stat].level >= c.min;
  if (c.type === 'quest') return (ctx.world.quests[c.id]?.done || 0) > 0;
  if (c.type === 'total') return (ctx.totals[c.key] || 0) >= c.min;
  if (c.type === 'material') return (ctx.world.purse[c.key] || 0) >= c.min;
  if (c.type === 'camp') return ctx.world.camp.stage >= c.min;
  return false;
}

export function describeCondition(c, ctx) {
  if (c.type === 'stat') return `${statName(c.stat)} ${c.min}`;
  if (c.type === 'quest') return `„${ctx.catalog.questById.get(c.id)?.name || c.id}“`;
  if (c.type === 'total') {
    const now = ctx.totals[c.key] || 0;
    return c.key === 'km'
      ? `${c.min} km real gegangen oder gefahren (bisher ${now.toFixed(1).replace('.', ',')})`
      : `${c.min} Stockwerke real gestiegen (bisher ${Math.floor(now)})`;
  }
  if (c.type === 'material') return `${c.min} ${MATERIALS[c.key]}`;
  if (c.type === 'camp') {
    const name = stageRow(ctx.catalog, c.min)?.name;
    return `Lager Stufe ${c.min}${name ? ` (${name})` : ''}`;
  }
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
        kind: 'kampf',
        name: monster.name,
        place: place.id,
        text: monster.text,
        monsters: [monster.id],
        conditions: [],
        speedStats: [],
        yieldStats: [],
        consumes: {},
        cost: ENCOUNTER_COST,
        reward: null,
        repeatable: false,
        cooldown: 0,
      };
    });
}

// Gathering on the Trümmerfeld beside the camp: always on offer, and the way
// costs nothing. What it brings is rolled when the Envoy sets out (see run.js).
const GATHER = {
  stein: { name: 'Steine sammeln', text: 'Lose Steine liegen überall zwischen den Trümmern. Der Envoy hebt auf, was er tragen kann.' },
  pilzholz: { name: 'Pilzholz sammeln', text: 'Abgebrochene Pilzstiele, leicht und zäh. Der Envoy sammelt, was er tragen kann.' },
};

export function gatherQuests(catalog) {
  const place = gatherPlace(catalog);
  if (!place) return [];
  return Object.entries(GATHER).map(([material, g]) => ({
    id: `gather:${material}`,
    name: g.name,
    place: place.id,
    kind: 'sammeln',
    gather: { material, stat: GATHER_STATS[material] },
    text: g.text,
    monsters: [],
    conditions: [],
    speedStats: [],
    yieldStats: [GATHER_STATS[material]],
    consumes: {},
    cost: 1,
    reward: null,
    repeatable: true,
    cooldown: 0,
    active: true,
  }));
}

export function questById(id, ctx) {
  if (id.startsWith('enc:')) return encountersFor(ctx.day, ctx).find((q) => q.id === id) || null;
  if (id.startsWith('gather:')) return gatherQuests(ctx.catalog).find((q) => q.id === id) || null;
  if (id.startsWith('bau:')) return facilityQuestById(ctx.catalog, id);
  return ctx.catalog.questById.get(id) || null;
}

// status: 'open' | 'locked' | 'cooldown' | 'done' | 'running'
// missing: what is lacking, as short texts
export function questState(quest, ctx) {
  if (ctx.world.expedition?.stops.some((s) => s.q === quest.id)) return { status: 'running', missing: [] };
  if (quest.encounter) {
    return ctx.world.encountersDone[quest.id] ? { status: 'done', missing: [] } : { status: 'open', missing: [] };
  }
  const record = ctx.world.quests[quest.id];
  if (record?.done && !quest.repeatable) return { status: 'done', missing: [] };
  if (record?.runs && quest.repeatable && quest.cooldown > 0) {
    const again = addDays(record.last, quest.cooldown);
    if (ctx.day < again) return { status: 'cooldown', missing: [], again };
  }
  const missing = quest.conditions.filter((c) => !conditionMet(c, ctx)).map((c) => describeCondition(c, ctx));
  for (const [key, amount] of Object.entries(quest.consumes)) {
    if ((ctx.world.purse[key] || 0) < amount) missing.push(`${amount} ${MATERIALS[key]}`);
  }
  return missing.length > 0 ? { status: 'locked', missing } : { status: 'open', missing: [] };
}

export function questsAt(placeId, ctx) {
  // a quest set to `aktiv: nein` in the table is not offered for now
  const fixed = ctx.catalog.quests.filter((q) => q.place === placeId && q.active !== false);
  const encounters = encountersFor(ctx.day, ctx).filter((q) => q.place === placeId);
  // the Trümmerfeld beside the camp offers the gathering; the facilities of
  // the camp are no quests on the map, they are built on the Lager page
  const gathering = placeId === gatherPlace(ctx.catalog)?.id ? gatherQuests(ctx.catalog) : [];
  return [...encounters, ...fixed, ...gathering];
}

export const KIND_NAMES = {
  sammeln: 'Sammeln',
  erkunden: 'Erkunden',
  kampf: 'Kampf',
  hoehle: 'Höhle',
  bauen: 'Bauen',
};
