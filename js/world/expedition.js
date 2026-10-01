// An expedition: from the camp to a place, the work there, and back.
// All three parts take real time: as many minutes as they cost stamina.
// The hero can be on one expedition at a time; the result is known from
// the start but only counts once back.

import { MINUTES_PER_STAMINA } from '../config.js';
import { camp, wayStamina, distance } from './map.js';
import { runQuest } from './run.js';
import { overloaded } from './inventory.js';

// Everything needed to start: minutes for each part, stamina, result.
// options: for gathering { mode, amount, energy } (see run.js)
export function planExpedition(quest, ctx, seed, options = {}) {
  const home = camp(ctx.catalog);
  const place = ctx.catalog.placeById.get(quest.place);
  const way = wayStamina(home, place, ctx.stats, ctx.fx, overloaded(ctx.world));
  const outcome = runQuest(quest, ctx, seed, options);
  return {
    out: way * MINUTES_PER_STAMINA,
    act: outcome.minutes,
    back: way * MINUTES_PER_STAMINA,
    cost: 2 * way + outcome.stamina,
    outcome,
  };
}

export function totalMinutes(exp) {
  return exp.out + exp.act + exp.back;
}

// Where an expedition stands at time t.
//   phase: 'out' | 'act' | 'back' | 'done'
//   share: 0..1 of the whole, phaseShare: 0..1 of the current part
export function progressAt(exp, t) {
  const minutes = Math.max(0, (t - exp.start) / 60000);
  const total = totalMinutes(exp);
  const share = total > 0 ? Math.min(1, minutes / total) : 1;
  const remaining = Math.max(0, total - minutes);
  if (minutes >= total) return { phase: 'done', share: 1, phaseShare: 1, remaining: 0 };
  if (minutes < exp.out) return { phase: 'out', share, phaseShare: minutes / exp.out, remaining };
  if (minutes < exp.out + exp.act) return { phase: 'act', share, phaseShare: (minutes - exp.out) / exp.act, remaining };
  return { phase: 'back', share, phaseShare: (minutes - exp.out - exp.act) / exp.back, remaining };
}

// Position of the hero on the map at time t, in map percent.
export function heroPosition(exp, t, catalog) {
  const home = camp(catalog);
  if (!exp) return { x: home.x, y: home.y };
  const place = catalog.placeById.get(exp.place);
  const p = progressAt(exp, t);
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  if (p.phase === 'out') return lerp(home, place, p.phaseShare);
  if (p.phase === 'act') return { x: place.x, y: place.y };
  if (p.phase === 'back') return lerp(place, home, p.phaseShare);
  return { x: home.x, y: home.y };
}

export function distanceFromCamp(place, catalog) {
  return distance(camp(catalog), place);
}
