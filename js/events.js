// Everything that happens is written down as an event and never changed.
// The current state is always recalculated from the full list of events
// (see replay.js). That makes syncing between devices simple: two
// devices only need to exchange the events the other one is missing.
//
// Event types of the daily tasks:
//   done     { stat, teile, xp, antworten?, zuviel?, sick? }
//                                             task finished: teile = the rows of its exercises (ids
//                                             in the table), antworten = { row id: answer id } to the
//                                             questions after it, zuviel = „Das war heute zu viel“,
//                                             sick = done in Krankheitsmodus
//            from before: { stat, ex, xp, mk?, z?, m?, fb?, sick? } (one exercise, measured value
//                                             or feedback); its XP counts, its exercise is gone
//   teil     { stat, teil, antwort? }         one exercise of today's task done (teil = its row id),
//                                             antwort = to its question; the last exercise of a
//                                             task writes `done` instead, with all the answers
//   undo     { ref }                          takes back the `done` or `teil` event with id `ref`
//   mode     { sick }                         Krankheitsmodus on or off
//   plan     { stat, ex, sick? }              from before: the exercise picked for a day; ignored now
//
// Event types of the world (see world/worldstate.js):
//   expedition { q, place, title, least, outcome }
//                                             the Envoy sets out for a quest (gathering, building),
//                                             or it joins the row while he is away; the result is
//                                             known from the start, `least` Energie is set aside
//                                             for the work (see world/expedition.js)
//              from before: { q, place, title, out, act, back, cost, outcome } (one quest, all
//                                             parts and the cost fixed) or { stops: […], back, cost }
//   unqueue  { ref }                          the last action of the row taken out again
//   gesehen  { ref }                          the report of the expedition `ref` was shown (on any device)
//   buy      { offer, kind, thing, price }    bought at the trader (kind item, or plan: the plan of a Deko)
//   sell     { inst, price }                  sold to the trader
//   drop     { inst }                         left behind
//   move     { inst, to }                     between backpack and wardrobe
//   equip    { slot, inst }                   item put on
//   unequip  { slot }                         slot emptied by hand
//   weben    { ziel, quelle, tragbar? }       the strength of `quelle` woven into `ziel` (see world/weave.js)
//   abbau    { deko }                         a built Deko taken down, half its material back
//   place, unplace, build                     from earlier versions (furniture, extending the home); ignored now
//
// Only from the test copy of the app (see stage.js), to try things out:
//   test     { energie?, mehrEnergie?, stein?, pilzholz?, splitter?, ruhm?, plan?, kleidung?, fertig? }
//                                             Energie full or more of it; material added, as much as
//                                             fits; Bannsplitter or Ruhm added; the next plan for Deko;
//                                             a piece of clothing; the running expedition back at once
//
// The arena (see world/arena.js; the fights are decided by the server, arena.php):
//   kampf    { kampf, rolle, gegner, ergebnis, ruhm, platz, energie?, entscheid?, leben?, runden? }
//            (before 5.17 also haltung?, gegnerHaltung?)
//                                             a fight of the own Abbild: rolle 'fordert' (it challenged,
//                                             costs `energie`) or 'verteidigt' (it was challenged);
//                                             ergebnis 'sieg' | 'remis' | 'niederlage' from its view,
//                                             ruhm = what it brought, platz = [before, after] in the list;
//                                             its id comes from the server, the same on every device
//   abbild   { titel? }                       the Titel of the own Abbild (the latest counts; before 5.17 also haltung)
//   ruhmkauf { ware, preis, inst?, farbe?, titel? }
//                                             bought with Ruhm: ware 'farbe' (the piece `inst` in the colour
//                                             `farbe`, '' = its own again) or 'titel'
//
// The Envoy itself:
//   envoy    { name, figur, haut, haar, unterhemd }  name, figure, skin and hair colour, and
//                                            unterhemd: false when the undershirt is switched off (the latest counts)
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
  'plan', 'done', 'teil', 'undo', 'mode',
  'expedition', 'unqueue', 'buy', 'sell', 'drop', 'move', 'equip', 'unequip', 'place', 'unplace', 'build',
  'envoy', 'travel', 'quest', 'test',
  'kampf', 'abbild', 'ruhmkauf', 'gesehen', 'tiefe', 'weben', 'abbau',
]);

// Minimal shape check for events coming from outside (sync, backup file).
export function isValidEvent(e) {
  return e && typeof e === 'object'
    && typeof e.id === 'string' && e.id.length > 0 && e.id.length < 80
    && typeof e.t === 'number'
    && typeof e.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.d)
    && KNOWN_TYPES.has(e.type);
}
