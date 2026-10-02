// An expedition: from the camp to one place or, as a route, to several places
// one after the other, the work at each of them, and back to the camp.
// Every part takes real time: as many minutes as it costs stamina. A route
// saves ways: from one place the Envoy goes on to the next instead of home.
// He can be on one expedition at a time; the result is known from the start
// but only counts once he is back.
//
// expedition = { stops: [{ q, place, title, out, act, outcome }], back }
//   out   minutes of the way to the place (from the camp or the place before)
//   act   minutes of the work there
//   back  minutes of the way home from the last place

import { MINUTES_PER_STAMINA } from '../config.js';
import { camp, wayStamina, distance, besideTheCamp } from './map.js';
import { runQuest, siteStamina, gatherEstimate } from './run.js';
import { overloaded } from './inventory.js';

// Where a place lies for the way: the Trümmerfeld is beside the camp, so a
// way from there is a way from the camp.
function spot(place, catalog) {
  return besideTheCamp(place) ? camp(catalog) : place;
}

// Stamina for the way from one place to the next.
export function legStamina(from, to, ctx) {
  return wayStamina(spot(from, ctx.catalog), spot(to, ctx.catalog), ctx.stats, ctx.fx, overloaded(ctx.world));
}

// Everything needed to set out: for every stop the minutes of the way there
// and of the work, the minutes of the way home, the stamina of all of it,
// and the results (rolled now, counted at the return).
// entries: [{ quest, options }], options for gathering { amount }
// energy: what the Envoy has, the most gathering may use
export function planRoute(entries, ctx, seed, energy = Infinity) {
  const home = camp(ctx.catalog);
  let at = home;
  let cost = 0;
  const stops = entries.map(({ quest, options = {} }, i) => {
    const place = ctx.catalog.placeById.get(quest.place);
    const way = legStamina(at, place, ctx);
    const outcome = runQuest(quest, ctx, i === 0 ? seed : `${seed}:${i}`, { ...options, energy: energy - cost - way });
    cost += way + outcome.stamina;
    at = place;
    return { q: quest.id, place: quest.place, title: quest.name, out: way * MINUTES_PER_STAMINA, act: outcome.minutes, outcome };
  });
  const back = legStamina(at, home, ctx);
  return { stops, back: back * MINUTES_PER_STAMINA, cost: cost + back };
}

// The same for a single quest. options: for gathering { amount, energy }
export function planExpedition(quest, ctx, seed, options = {}) {
  const { energy = Infinity, ...rest } = options;
  const plan = planRoute([{ quest, options: rest }], ctx, seed, energy);
  const [stop] = plan.stops;
  return { out: stop.out, act: stop.act, back: plan.back, cost: plan.cost, outcome: stop.outcome };
}

// The stamina a route takes, part by part in the order of the trip: the way
// to every place, the work there, and the way home. Gathering takes as much
// as the dice want: `work` is the least, `maybe` what it may take on top.
// Every part knows its stop (the way home counts as one more).
export function routeParts(entries, ctx) {
  const home = camp(ctx.catalog);
  let at = home;
  const parts = [];
  entries.forEach(({ quest, options = {} }, stop) => {
    const place = ctx.catalog.placeById.get(quest.place);
    parts.push({ kind: 'way', n: legStamina(at, place, ctx), stop });
    if (quest.gather) {
      const { min, max } = gatherEstimate(quest, ctx, { amount: options.amount }).energy;
      parts.push({ kind: 'work', n: min, stop }, { kind: 'maybe', n: max - min, stop });
    } else {
      parts.push({ kind: 'work', n: siteStamina(quest, ctx.stats), stop });
    }
    at = place;
  });
  parts.push({ kind: 'way', n: legStamina(at, home, ctx), stop: entries.length });
  return parts.filter((p) => p.n > 0);
}

// The most a route can take, and the least.
export const mostOf = (parts) => parts.reduce((sum, p) => sum + p.n, 0);
export const leastOf = (parts) => parts.reduce((sum, p) => sum + (p.kind === 'maybe' ? 0 : p.n), 0);

// The parts of the time, in order: [{ phase: 'out' | 'act' | 'back', stop, minutes }]
export function timeline(exp) {
  const list = [];
  exp.stops.forEach((s, stop) => list.push({ phase: 'out', stop, minutes: s.out }, { phase: 'act', stop, minutes: s.act }));
  list.push({ phase: 'back', stop: exp.stops.length - 1, minutes: exp.back });
  return list.filter((part) => part.minutes > 0);
}

export function totalMinutes(exp) {
  return exp.stops.reduce((sum, s) => sum + s.out + s.act, 0) + exp.back;
}

// Where an expedition stands at time t.
//   phase: 'out' | 'act' | 'back' | 'done', stop: the place it is about,
//   index: the part of timeline(exp), share: 0..1 of the whole,
//   phaseShare: 0..1 of the current part, remaining: minutes
export function progressAt(exp, t) {
  const minutes = Math.max(0, (t - exp.start) / 60000);
  const total = totalMinutes(exp);
  const parts = timeline(exp);
  let before = 0;
  for (const [index, part] of parts.entries()) {
    if (minutes < before + part.minutes) {
      return {
        phase: part.phase, stop: part.stop, index,
        share: minutes / total, phaseShare: (minutes - before) / part.minutes, remaining: total - minutes,
      };
    }
    before += part.minutes;
  }
  return { phase: 'done', stop: exp.stops.length - 1, index: parts.length, share: 1, phaseShare: 1, remaining: 0 };
}

// Position of the Envoy on the map at time t, in map percent.
export function heroPosition(exp, t, catalog) {
  const home = camp(catalog);
  const at = (p) => ({ x: p.x, y: p.y });
  if (!exp) return at(home);
  const p = progressAt(exp, t);
  const place = (i) => catalog.placeById.get(exp.stops[i]?.place) || home;
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  if (p.phase === 'out') return lerp(p.stop === 0 ? home : place(p.stop - 1), place(p.stop), p.phaseShare);
  if (p.phase === 'act') return at(place(p.stop));
  if (p.phase === 'back') return lerp(place(p.stop), home, p.phaseShare);
  return at(home);
}

export function distanceFromCamp(place, catalog) {
  return distance(camp(catalog), place);
}
