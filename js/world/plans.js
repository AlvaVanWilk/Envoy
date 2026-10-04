// Plans for Deko. One plan of each stage is there as soon as the camp reaches
// the stage (fundort `start`); the others have to be found, with some luck.
// Where a plan lies says the table (sheet Deko, column fundort):
//   a place     every 10 minutes of work there is a chance (the minutes the
//               table gives the quest, not shortened by the stats)
//   a quest     the same, only for this quest
//   geister     every spirit the Envoy meets is a chance, wherever it is
//   haendler    every day is a chance that the trader has it on offer
// How rare a plan is (selten, sehr selten, kostbar) says how many chances it
// takes on average (PLAN_CHANCES). Bad luck does not last: after twice as
// many chances the plan is there for sure.
// Searching begins once the camp has reached the stage of the Deko; the
// chances spent so far are kept in world.plans.search.
//
// world.plans = { found: { id: day }, search: { id: chances } }

import { PLAN_CHANCE_MINUTES, PLAN_CHANCES, PLAN_SURE_FACTOR } from '../config.js';
import { seededRandom } from './rng.js';
import { daysBetween } from '../days.js';

export const emptyPlans = () => ({ found: {}, search: {} });

// Whether the plan of a Deko is known: found, or there from the start of its
// stage (the stage of the camp, or `stage`).
export function planKnown(world, row, stage = world.camp.stage) {
  if (row.fundort === 'start') return stage >= row.lagerstufe;
  return Boolean(world.plans?.found[row.id]);
}

// The plans the Envoy can find out there now (not those of the trader).
function sought(world, catalog) {
  return catalog.deko.filter((d) => d.fundort !== 'start' && d.fundort !== 'haendler'
    && d.lagerstufe <= world.camp.stage && !world.plans.found[d.id]);
}

// The plans an action could bring (for the list of quests on the map): those
// still sought that lie at its place or quest, and with spirits those of the
// spirits. Only that one could be there, not which.
export function plansFindable(quest, world, catalog) {
  return sought(world, catalog).filter((row) => row.fundort === quest.id || row.fundort === quest.place
    || (row.fundort === 'geister' && (quest.monsters?.length || 0) > 0));
}

// How many chances an action gives for a plan.
function chancesFor(row, quest, outcome) {
  if (row.fundort === 'geister') return outcome.fights.length;
  if (row.fundort !== quest.id && row.fundort !== quest.place) return 0;
  const minutes = quest.gather ? outcome.stamina : quest.cost;
  return minutes / PLAN_CHANCE_MINUTES;
}

const average = (row) => PLAN_CHANCES[row.seltenheit] || PLAN_CHANCES.selten;

// The plans an action finds, rolled with the other dice when it begins:
//   { found: [id, …], search: { id: chances } }
// search: what the action adds to the search for each plan (kept when it is done).
export function rollPlans(quest, ctx, seed, outcome) {
  const result = { found: [], search: {} };
  if (!ctx.world?.plans || !ctx.catalog.deko) return result;
  for (const row of sought(ctx.world, ctx.catalog)) {
    const chances = chancesFor(row, quest, outcome);
    if (!(chances > 0)) continue;
    result.search[row.id] = chances;
    const avg = average(row);
    const before = ctx.world.plans.search[row.id] || 0;
    const sure = before + chances >= avg * PLAN_SURE_FACTOR;
    const p = 1 - (1 - 1 / avg) ** chances;
    if (sure || seededRandom(`${seed}:plan:${row.id}`)() < p) result.found.push(row.id);
  }
  return result;
}

// The plans the trader has on offer on a day, for Bannsplitter.
export function traderPlans(day, ctx) {
  const { world, catalog } = ctx;
  if (!world.plans) return [];
  return catalog.deko
    .filter((d) => d.fundort === 'haendler' && d.lagerstufe <= world.camp.stage && !world.plans.found[d.id])
    .filter((d) => {
      const avg = average(d);
      const since = world.camp.reached?.[d.lagerstufe];
      const sure = since && daysBetween(since, day) >= avg * PLAN_SURE_FACTOR;
      return sure || seededRandom(`${day}:haendler:plan:${d.id}`)() < 1 / avg;
    })
    .map((d) => ({ kind: 'plan', id: d.id, price: d.preis, offer: `${day}:plan:${d.id}` }));
}
