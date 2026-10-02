// Everything that happens is written down as an event and never changed.
// The current state is always recalculated from the full list of events
// (see replay.js). That makes syncing between devices simple: two
// devices only need to exchange the events the other one is missing.
//
// Event types of the daily tasks:
//   plan     { stat, ex, sick? }              exercise `ex` assigned for the day (the latest one counts)
//   done     { stat, ex, xp, mk?, z?, m?, fb?, sick? }
//                                             task finished: measured value m[mk] against target z,
//                                             or feedback fb; sick = done in Krankheitsmodus
//   undo     { ref }                          takes back the `done` event with id `ref`
//   mode     { sick }                         Krankheitsmodus on or off
//
// Event types of the world (see world/worldstate.js):
//   expedition { q, place, title, out, act, back, cost, outcome }
//                                             from the camp to a place and back; minutes for each
//                                             part and the full result, known from the start
//   buy      { offer, kind, thing, price }    bought at the trader (thing = item or furniture id)
//   sell     { inst, price }                  sold to the trader
//   drop     { inst }                         left behind
//   move     { inst, to }                     between backpack and wardrobe
//   equip    { slot, inst }                   item put on
//   unequip  { slot }                         slot emptied by hand
//   place, unplace, build                     from earlier versions (furniture, extending the home); ignored now
//
// Only from the test copy of the app (see stage.js), to try things out:
//   test     { energie?, stein?, pilzholz? }   Energie full; material added, as much as fits
//
// The Envoy itself:
//   envoy    { name, figur, haut, haar }      name, figure, skin and hair colour (the latest counts)
// (travel and quest from version 2 are still accepted and ignored)
//
// Common fields: id, t (timestamp in ms), d (day key), dev (device id).

import { dayKey } from './days.js';

let counter = 0;

function randomPart(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function newDeviceId() {
  return randomPart(8);
}

export function createEvent(type, fields, deviceId, now = new Date()) {
  counter += 1;
  return {
    id: `${deviceId}-${now.getTime().toString(36)}-${counter.toString(36)}${randomPart(3)}`,
    t: now.getTime(),
    d: dayKey(now),
    dev: deviceId,
    type,
    ...fields,
  };
}

// Stable order for replay: by day, then time, then id.
export function compareEvents(a, b) {
  if (a.d !== b.d) return a.d < b.d ? -1 : 1;
  if (a.t !== b.t) return a.t - b.t;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

// Joins two event lists. Events with the same id are the same event.
export function mergeEvents(listA, listB) {
  const byId = new Map();
  for (const e of listA) byId.set(e.id, e);
  for (const e of listB) if (!byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort(compareEvents);
}

export const KNOWN_TYPES = new Set([
  'plan', 'done', 'undo', 'mode',
  'expedition', 'buy', 'sell', 'drop', 'move', 'equip', 'unequip', 'place', 'unplace', 'build',
  'envoy', 'travel', 'quest', 'test',
]);

// Minimal shape check for events coming from outside (sync, backup file).
export function isValidEvent(e) {
  return e && typeof e === 'object'
    && typeof e.id === 'string' && e.id.length > 0 && e.id.length < 80
    && typeof e.t === 'number'
    && typeof e.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.d)
    && KNOWN_TYPES.has(e.type);
}
