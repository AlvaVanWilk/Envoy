// An expedition: the Envoy sets out from the camp to do something (a quest,
// gathering, building) and can be given more to do while he is away. From
// one place he goes straight on to the next; only after the last one he walks
// home. Every part takes real time: 10 seconds for every Energie of work and
// of way. Only the work costs Energie, the ways cost time (see RULE_SETS in
// config.js; actions from before version 5.12 keep the old rules: a minute
// for every Energie, and the ways cost Energie as well).
//
// expedition = { id, day, start, actions, rushed, dropped, leftBehind }
// action = { id, q, place, title, day, regel, notBefore, from, way, work, least, home, credit, outcome, stage }
//   regel      the rules of Energie it follows (1 before version 5.12, 2 since)
//   notBefore  when it was added: it starts once the one before is done, but not earlier
//   from       where the Envoy sets out from for it, { x, y } on the map
//   way        minutes of the way there
//   work       minutes of the work there (gathering: as the dice fell)
//   least      Energie set aside for the work when it was added
//              (gathering: what the best dice would need; the rest is taken there)
//   home       minutes of the way from the place back to the camp
//   credit     Energie given back when it was added: the way home it replaced
//              (only when that way cost Energie, under the old rules)
//   stage      0 waiting, 1 on the way, 2 at work, 3 done
// The Energie of an action is set aside when it is added (see reserve()).

import { RULE_SETS, RULES_NOW } from '../config.js';
import { camp, wayStamina, distance, besideTheCamp } from './map.js';
import { runQuest } from './run.js';
import { overloaded } from './inventory.js';

const MINUTE = 60000;

// The rules an action follows (see RULE_SETS in config.js).
export const actionRules = (action) => RULE_SETS[action.regel] || RULE_SETS[1];
// The Energie a way of so many minutes costs under these rules.
const wayCost = (minutes, rules) => (minutes / rules.pace) * rules.wayEnergy;
const at = (p) => ({ x: p.x, y: p.y });
const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });

// Where a place lies for the way: the Trümmerfeld is beside the camp, so a
// way from there is a way from the camp.
function spot(place, catalog) {
  return besideTheCamp(place) ? camp(catalog) : place;
}

// Stamina for the way from one place (or a point on the map) to another.
export function legStamina(from, to, ctx) {
  return wayStamina(spot(from, ctx.catalog), spot(to, ctx.catalog), ctx.stats, ctx.fx, overloaded(ctx.world));
}

// A single quest from the camp and back, all at once: minutes of each part,
// stamina and result. options: for gathering { amount, energy }
export function planExpedition(quest, ctx, seed, options = {}) {
  const home = camp(ctx.catalog);
  const place = ctx.catalog.placeById.get(quest.place);
  const out = legStamina(home, place, ctx) * RULES_NOW.pace;
  const back = legStamina(place, home, ctx) * RULES_NOW.pace;
  const outcome = runQuest(quest, ctx, seed, options);
  return {
    out,
    act: outcome.minutes,
    back,
    cost: wayCost(out + back, RULES_NOW) + outcome.stamina,
    outcome,
  };
}

// The Energie an action sets aside when it is added.
export function reserve(action) {
  return wayCost(action.way + action.home, actionRules(action)) + action.least - action.credit;
}

// When each action sets out, arrives and is done, and when the Envoy is
// back at the camp. A rushed expedition (only in the test copy) is over at once.
export function timesOf(exp) {
  const latest = exp.rushed ?? Infinity;
  const clamp = (x) => Math.min(x, latest);
  let before = null;
  const actions = exp.actions.map((a) => {
    const begin = clamp(before === null ? a.notBefore : Math.max(before, a.notBefore));
    const arrive = clamp(begin + a.way * MINUTE);
    const done = clamp(arrive + a.work * MINUTE);
    before = done;
    return { begin, arrive, done };
  });
  const last = exp.actions[exp.actions.length - 1];
  const end = last ? clamp(before + last.home * MINUTE) : clamp(exp.start);
  return { actions, end };
}

// The next thing that happens on the expedition and when (see worldstate.js):
// an action begins, the Envoy arrives, an action is done, or he is back ('end').
export function nextStep(exp) {
  const times = timesOf(exp);
  const i = exp.actions.findIndex((a) => a.stage < 3);
  if (i < 0) return { kind: 'end', time: times.end };
  const x = times.actions[i];
  const stage = exp.actions[i].stage;
  return { kind: ['begin', 'arrive', 'done'][stage], i, time: [x.begin, x.arrive, x.done][stage] };
}

// Where the Envoy sets out from at time t after the actions before `index`:
// from the last place, or from where he is on his way home, or from the camp.
// rest: the minutes of the way home he no longer walks; credit: the Energie
// of it (only under the old rules, where ways cost Energie).
export function departure(exp, index, t, catalog) {
  const home = camp(catalog);
  const prev = exp?.actions[index - 1];
  if (!prev) return { from: at(home), point: home, credit: 0, rest: 0 };
  const rules = actionRules(prev);
  const prevPlace = catalog.placeById.get(prev.place) || home;
  const done = timesOf(exp).actions[index - 1].done;
  if (t <= done) return { from: at(prevPlace), point: prevPlace, credit: wayCost(prev.home, rules), rest: prev.home };
  const walked = (t - done) / MINUTE;
  if (walked >= prev.home) return { from: at(home), point: home, credit: 0, rest: 0 };
  const pos = lerp(prevPlace, home, walked / prev.home);
  const rest = prev.home - walked;
  return { from: pos, point: { id: 'unterwegs', typ: 'weg', ...pos }, credit: wayCost(rest, rules), rest };
}

// The way to a place for the action at `index`, setting out at time t:
// where from, the minutes there and home (pace: minutes per Energie of way,
// see RULE_SETS), and the Energie given back for the way home the Envoy no
// longer walks.
export function wayFrom(exp, index, place, t, ctx, pace = RULES_NOW.pace) {
  const d = departure(exp, index, t, ctx.catalog);
  // on his way home, for something beside the camp he simply walks on
  const way = d.point.typ === 'weg' && besideTheCamp(place)
    ? d.rest
    : legStamina(d.point, place, ctx) * pace;
  return { from: d.from, way, home: legStamina(place, camp(ctx.catalog), ctx) * pace, credit: d.credit };
}

// What adding something at a place at time t means for the way (see wayFrom).
export function addition(world, place, t, ctx, pace = RULES_NOW.pace) {
  const exp = world.expedition;
  return { notBefore: t, ...wayFrom(exp, exp ? exp.actions.length : 0, place, t, ctx, pace) };
}

// Where an expedition stands at time t:
//   { i, phase: 'way' | 'work' | 'home' | 'done', share (of that part), remaining (minutes to the end) }
// 'home' is the way back to the camp after action i (also the part of it
// walked before something new was added).
export function progressAt(exp, t) {
  const { actions, end } = timesOf(exp);
  const remaining = Math.max(0, (end - t) / MINUTE);
  const homeShare = (i, since) => (exp.actions[i].home > 0 ? Math.min(1, (t - since) / (exp.actions[i].home * MINUTE)) : 1);
  for (const [i, x] of actions.entries()) {
    if (t < x.begin && i === 0) return { i, phase: 'way', share: 0, remaining };
    if (t < x.begin) return { i: i - 1, phase: 'home', share: homeShare(i - 1, actions[i - 1].done), remaining };
    if (t < x.arrive) return { i, phase: 'way', share: (t - x.begin) / (x.arrive - x.begin), remaining };
    if (t < x.done) return { i, phase: 'work', share: (t - x.arrive) / (x.done - x.arrive), remaining };
  }
  const last = actions.length - 1;
  if (last >= 0 && t < end) return { i: last, phase: 'home', share: homeShare(last, actions[last].done), remaining };
  return { i: last, phase: 'done', share: 1, remaining: 0 };
}

// The parts of the time in order, for the bar: the way and the work of every
// action, and the ways home: [{ kind: 'way' | 'work' | 'home', i, minutes }]
export function timeline(exp) {
  const { actions, end } = timesOf(exp);
  const parts = [];
  actions.forEach((x, i) => {
    if (i > 0 && x.begin > actions[i - 1].done) parts.push({ kind: 'home', i: i - 1, minutes: (x.begin - actions[i - 1].done) / MINUTE });
    parts.push({ kind: 'way', i, minutes: (x.arrive - x.begin) / MINUTE }, { kind: 'work', i, minutes: (x.done - x.arrive) / MINUTE });
  });
  if (actions.length > 0) parts.push({ kind: 'home', i: actions.length - 1, minutes: (end - actions[actions.length - 1].done) / MINUTE });
  return parts.filter((p) => p.minutes > 0);
}

// Position of the Envoy on the map at time t, in map percent.
export function heroPosition(exp, t, catalog) {
  const home = camp(catalog);
  if (!exp || exp.actions.length === 0) return at(home);
  const p = progressAt(exp, t);
  const a = exp.actions[p.i];
  const place = a ? catalog.placeById.get(a.place) || home : home;
  if (p.phase === 'way') return lerp(a.from, place, p.share);
  if (p.phase === 'work') return at(place);
  if (p.phase === 'home') return lerp(place, home, p.share);
  return at(home);
}

export function distanceFromCamp(place, catalog) {
  return distance(camp(catalog), place);
}
