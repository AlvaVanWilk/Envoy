// Backpack, storage and the Vorrat. Every owned thing is an entry in world.items:
//   { inst, kind: 'item', id, where, got }
// where = 'rucksack' | 'schrank' | 'body' (worn)
// The backpack has a few places from the start; the Envoy has it with him.
// The storage ('schrank', shown as „Aufbewahrung“) is a facility of the camp
// and stays there: while the Envoy is away it can be looked at, but nothing
// can be taken out of it or put into it.
//
// Pilzholz and Stein are no things: they lie in the Vorrat (world.purse), up
// to MATERIAL_WITHOUT_STORE of each, or once the camp has a Steinlager or
// Pilzlager, up to what it holds. What the Envoy gathers is there at once.

import { BACKPACK_SIZE, MATERIAL_WITHOUT_STORE } from '../config.js';
import { facilityNow } from './camp.js';

export const LIMITED_MATERIALS = ['stein', 'pilzholz'];
const STORE_OF = { stein: 'steinlager', pilzholz: 'pilzlager' };

// How many pieces the store of the camp holds (0 while it is not built).
export function storeCapacity(world, catalog, key) {
  return facilityNow(world, catalog, STORE_OF[key])?.kapazitaet || 0;
}

// How much of a material the Vorrat holds.
export function materialLimit(world, catalog, key) {
  return Math.max(MATERIAL_WITHOUT_STORE, storeCapacity(world, catalog, key));
}

// How many more pieces of a material fit into the Vorrat.
export function roomFor(world, catalog, key) {
  return Math.max(0, materialLimit(world, catalog, key) - (world.purse[key] || 0));
}

export function countIn(world, where) {
  let n = 0;
  for (const entry of Object.values(world.items)) if (entry.where === where) n += 1;
  return n;
}

export function capacity(world, catalog, where) {
  if (where === 'rucksack') return BACKPACK_SIZE;
  if (where === 'schrank') return facilityNow(world, catalog, 'aufbewahrung')?.kapazitaet || 0;
  return Infinity;
}

export function hasSpace(world, catalog, where) {
  return countIn(world, where) < capacity(world, catalog, where);
}

export function overloaded(world) {
  return countIn(world, 'rucksack') > BACKPACK_SIZE;
}

// The Envoy is at the camp when no expedition is running.
export function atCamp(world) {
  return !world.expedition;
}

// Can the Envoy get at this thing right now? Things in storage only at the camp.
export function reachable(world, entry) {
  return entry.where !== 'schrank' || atCamp(world);
}

// New things go into the backpack; if it is full, into the storage (only
// at the camp); otherwise the backpack gets over-full (travel costs more).
export function stow(world, catalog, entry) {
  let where = 'rucksack';
  if (!hasSpace(world, catalog, 'rucksack') && atCamp(world) && hasSpace(world, catalog, 'schrank')) where = 'schrank';
  world.items[entry.inst] = { ...entry, where };
  return where;
}

export function removeEntry(world, inst) {
  delete world.items[inst];
  for (const [slot, worn] of Object.entries(world.equipped)) if (worn === inst) delete world.equipped[slot];
}

// Entries in one place, as a list.
export function entriesIn(world, where) {
  return Object.values(world.items).filter((e) => e.where === where);
}
