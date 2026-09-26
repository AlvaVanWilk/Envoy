// Everything that happens is written down as an event and never changed.
// The current state is always recalculated from the full list of events
// (see replay.js). That makes syncing between devices simple: two
// devices only need to exchange the events the other one is missing.
//
// Event types:
//   plan    { stat, ex }                     the app assigned exercise `ex` for the day
//   done    { stat, ex, xp, fb, m }          task finished, with feedback and measurements
//   undo    { ref }                          takes back the `done` event with id `ref`
//   equip   { slot, item }                   item put into a slot
//   unequip { slot }                         slot emptied by hand
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

const KNOWN_TYPES = new Set(['plan', 'done', 'undo', 'equip', 'unequip']);

// Minimal shape check for events coming from outside (sync, backup file).
export function isValidEvent(e) {
  return e && typeof e === 'object'
    && typeof e.id === 'string' && e.id.length > 0 && e.id.length < 80
    && typeof e.t === 'number'
    && typeof e.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.d)
    && KNOWN_TYPES.has(e.type);
}
