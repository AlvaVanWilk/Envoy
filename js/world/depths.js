// Die Tiefen: beneath the Trümmerfeld a shaft leads down, Ebene after Ebene.
// On each one waits a Wächter. How far the Envoy gets depends on his stats
// and on what he wears: a bonus for damage, hitting, dodging or calming
// decides many a fight (see hero.js: fighter). A descent costs no Energie.
// Afterwards the Envoy rests, a little shorter with more Gelassenheit. Nothing
// fails: a Wächter too strong, the Envoy withdraws with a little and tries
// again after the rest. Each Ebene is overcome once.
//
// world.tiefen = { cleared: { brunnen: 3, … }, rest, descents, last }
//   cleared   how many Ebenen of each Tiefe are overcome
//   rest      until when the Envoy rests (time in ms); before that no descent
//   descents  how many descents there were
//   last      the latest descent: { id, tiefe, ebene, result, t }
// The result is rolled when the Envoy goes down and stored in the event
// (`tiefe`), like the outcome of an expedition.

import {
  DEPTHS, DEPTHS_FROM_STAGE, DEPTH_LAST_EXTRA, DEPTH_GUARDIAN, DEPTH_REST_MINUTES,
  DEPTH_REST_PER_GELASSENHEIT, DEPTH_REST_LEAST, DEPTH_RETREAT_SHARE, DEPTH_ITEM_CHANCE, DEPTH_SURE_ITEM,
} from '../config.js';
import { fighter } from './hero.js';
import { fight } from './combat.js';
import { lootThing } from './run.js';
import { seededRandom } from './rng.js';

const ESTIMATE_FIGHTS = 120;

export const emptyDepths = () => ({ cleared: {}, rest: 0, descents: 0, last: null });

export const depthsOpen = (world) => world.camp.stage >= DEPTHS_FROM_STAGE;

export const depthById = (id) => DEPTHS.find((d) => d.id === id) || null;

export const clearedIn = (world, depth) => world.tiefen.cleared[depth.id] || 0;

// A Tiefe opens once the one above it is overcome.
export const depthOpen = (world, depth) => {
  const i = DEPTHS.indexOf(depth);
  return i === 0 || clearedIn(world, DEPTHS[i - 1]) >= DEPTHS[i - 1].waechter.length;
};

// The Ebene the Envoy faces next: { depth, ebene }, or null once all are overcome.
export function nextFloor(world) {
  for (const depth of DEPTHS) {
    const done = clearedIn(world, depth);
    if (done < depth.waechter.length) return { depth, ebene: done + 1 };
  }
  return null;
}

const isLast = ({ depth, ebene }) => ebene === depth.waechter.length;

// The Stufe of the Wächter on an Ebene (not always a whole number).
export function floorStufe(floor) {
  const { depth, ebene } = floor;
  return depth.from + depth.step * (ebene - 1) + (isLast(floor) ? DEPTH_LAST_EXTRA : 0);
}

// The Wächter of an Ebene: one of the spirits of the world, as strong as its Stufe.
export function guardian(floor, catalog) {
  const spirit = catalog.monsterById.get(floor.depth.waechter[floor.ebene - 1]);
  const s = floorStufe(floor);
  const value = ([base, per]) => Math.max(1, Math.round(base + per * s));
  return {
    id: spirit.id,
    name: spirit.name,
    bild: spirit.bild,
    text: spirit.text,
    calmable: spirit.calmable,
    stufe: Math.round(s),
    leben: value(DEPTH_GUARDIAN.leben),
    kraft: value(DEPTH_GUARDIAN.kraft),
    gewandtheit: value(DEPTH_GUARDIAN.gewandtheit),
  };
}

// Bannsplitter for overcoming an Ebene.
export function floorSplitter(floor) {
  const { depth, ebene } = floor;
  return isLast(floor) ? depth.boss : depth.splitter[0] + depth.splitter[1] * ebene;
}

// Whether a piece of clothing is sure on this Ebene.
export const sureItem = (floor) => floor.ebene === DEPTH_SURE_ITEM || isLast(floor);

// How long the Envoy rests after a descent, in minutes.
export function restMinutes(stats) {
  return Math.max(DEPTH_REST_LEAST, DEPTH_REST_MINUTES - DEPTH_REST_PER_GELASSENHEIT * (stats.gelassenheit.level - 1));
}

// How the Envoy would fare against the Wächter now: the share of many
// fights tried in thought (always the same dice, so only stats and
// equipment change it).
export function prospect(ctx, floor) {
  const g = guardian(floor, ctx.catalog);
  let won = 0;
  for (let i = 0; i < ESTIMATE_FIGHTS; i += 1) {
    if (fight(fighter(ctx.stats, ctx.fx, g), g, seededRandom(`tiefe:aussicht:${i}`)).result !== 'lost') won += 1;
  }
  return won / ESTIMATE_FIGHTS;
}

// A descent: the fight against the Wächter and what it brings.
// result: 'won' | 'calmed' | 'lost' (the Envoy withdraws).
export function descend(ctx, floor, seed) {
  const g = guardian(floor, ctx.catalog);
  const rng = seededRandom(seed);
  const hero = fighter(ctx.stats, ctx.fx, g);
  const f = fight(hero, g, rng);
  const luck = 1 + ctx.fx.glueck / 100;
  const reward = { splitter: 0, things: [] };
  if (f.result === 'lost') {
    reward.splitter = Math.max(1, Math.round(floorSplitter(floor) * DEPTH_RETREAT_SHARE * luck));
  } else {
    reward.splitter = Math.round(floorSplitter(floor) * luck);
    if (sureItem(floor) || rng() * 100 < DEPTH_ITEM_CHANCE * luck) {
      const thing = lootThing(ctx, rng, 'beute', seededRandom(`${seed}:farbe`), isLast(floor) ? 'tiefenwaechter' : 'tiefe');
      if (thing) reward.things.push(thing);
    }
  }
  return {
    tiefe: floor.depth.id, ebene: floor.ebene, monster: g.id,
    result: f.result, rounds: f.rounds, heroMax: hero.life, monsterMax: g.leben, reward,
  };
}

// Why the Envoy cannot go down now, or null: 'closed' (no Lagerfeuer yet),
// 'away' (on an expedition), 'rest' (still resting), 'done' (all overcome).
export function blockedAt(world, t) {
  if (!depthsOpen(world)) return 'closed';
  if (!nextFloor(world)) return 'done';
  if (world.expedition) return 'away';
  if (t < world.tiefen.rest) return 'rest';
  return null;
}
