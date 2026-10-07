// Der Aushang am Lager: every day a few Aufträge (JOBS_PER_DAY), each with
// its reward on the note: Bannsplitter and often a piece of clothing, in its
// colour and with its Güte, so the Envoy knows what he works for. An Auftrag
// costs no Energie, only time: the Envoy goes to a place and is busy there
// for some minutes, as one more action of his expedition (see worldstate.js).
// Each Auftrag once; the next day new ones hang there. Not endless: only a
// few a day.
//
// The notes of a day are the same all day (chosen with the stats at the start
// of the day). Their id: aus:<day>:<n>. Done ones are kept in world.encountersDone.

import { JOBS, JOBS_FROM_STAGE, JOBS_PER_DAY, JOB_SPLITTER, JOB_THING_CHANCE, JOB_FEATURED } from '../config.js';
import { dayStartMs } from '../days.js';
import { rollBonuses } from './bonuses.js';
import { itemLevel } from './items.js';
import { fits, figureOf } from './clothes.js';
import { seededRandom, randomInt, shuffle } from './rng.js';
import { heroPower } from './hero.js';
import { placeUnlocked } from './quests.js';
import { lootThing } from './run.js';

export const isJob = (id) => typeof id === 'string' && id.startsWith('aus:');

export const jobsOpen = (world) => world.camp.stage >= JOBS_FROM_STAGE;

// Places an Auftrag can lead to: open ones away from the camp.
function jobPlaces(ctx) {
  return ctx.catalog.places.filter((p) => p.typ !== 'lager' && placeUnlocked(p, ctx));
}

// A featured piece for the first note of this day (see JOB_FEATURED), or null:
// from its day on, while the Envoy did not have it before the day began.
function featuredThing(day, ctx, power) {
  const start = dayStartMs(day);
  for (const f of JOB_FEATURED) {
    const item = ctx.catalog.itemById.get(f.id);
    if (!item || day < f.from || !fits(item, figureOf(ctx.world))) continue;
    const had = Object.values(ctx.world.items).some((e) => e.id === f.id && (e.got ?? 0) < start);
    if (had) continue;
    return { kind: 'item', id: item.id, ...rollBonuses('arena', power, seededRandom(`${day}:aushang:${f.id}`), itemLevel(item)) };
  }
  return null;
}

// The Aufträge of a day: { id, job, name, text, place, minutes, splitter, thing }.
export function jobsFor(day, ctx) {
  const rng = seededRandom(`${day}:aushang`);
  const power = heroPower(ctx.statsAtDayStart);
  const places = shuffle(rng, jobPlaces(ctx));
  if (places.length === 0) return [];
  const featured = featuredThing(day, ctx, power);
  return shuffle(rng, JOBS).slice(0, JOBS_PER_DAY).map((job, n) => {
    const minutes = randomInt(rng, job.minutes[0], job.minutes[1]);
    const splitter = Math.round((JOB_SPLITTER.base + JOB_SPLITTER.perMinute * minutes) * (1 + JOB_SPLITTER.perLevel * (power - 1)));
    const thingRng = seededRandom(`${day}:aushang:${n}:kleidung`);
    const drawn = thingRng() < JOB_THING_CHANCE
      ? lootThing({ ...ctx, stats: ctx.statsAtDayStart }, thingRng, 'beute', seededRandom(`${day}:aushang:${n}:farbe`), 'aushang')
      : null;
    const thing = n === 0 && featured ? featured : drawn;
    return {
      id: `aus:${day}:${n}`,
      job: job.id,
      name: job.name,
      text: job.text,
      place: places[n % places.length].id,
      minutes,
      splitter,
      thing,
    };
  });
}

// 'open' | 'running' (the Envoy is on it) | 'done'
export function jobState(job, world) {
  if (world.encountersDone[job.id]) return 'done';
  if (world.expedition?.actions.some((a) => a.q === job.id && a.stage < 3)) return 'running';
  return 'open';
}

// What doing the Auftrag brings, as the outcome of an action (see run.js):
// no Energie, the minutes of the Auftrag, the reward from the note.
export function jobOutcome(job) {
  return {
    kind: 'auftrag',
    fights: [],
    defeated: 0,
    total: 0,
    cleared: true,
    stamina: 0,
    minutes: job.minutes,
    consumed: {},
    reward: { splitter: job.splitter, pilzholz: 0, stein: 0, things: job.thing ? [job.thing] : [], plans: [], unlocks: [], rest: false },
  };
}

// Whether an Auftrag in an event may count: one of the notes of its day, not done yet.
export function jobAllowed(e, world) {
  const [, day, n] = e.q.split(':');
  return day === e.d && Number(n) >= 0 && Number(n) < JOBS_PER_DAY && !world.encountersDone[e.q]
    && !world.expedition?.actions.some((a) => a.q === e.q);
}
