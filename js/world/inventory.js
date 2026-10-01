// Backpack and storage. Every owned thing is an entry in world.items:
//   { inst, kind: 'item' | 'furniture', id, where, got }
// where = 'rucksack' | 'schrank' | 'body' (worn)
// The backpack has a few places from the start; the Envoy has it with him.
// The storage ('schrank', shown as „Aufbewahrung“) is a facility of the camp
// and stays there: while the Envoy is away it can be looked at, but nothing
// can be taken out of it or put into it.
//
// Pilzholz and Stein are carried too: every place of the backpack holds
// MATERIAL_STACK pieces of one kind. The Steinlager and Pilzlager of the camp
// take what the Envoy brings home (up to what they hold); only what does not
// fit there stays in the backpack. world.purse keeps the total.

import { BACKPACK_SIZE, MATERIAL_STACK } from '../config.js';
import { facilityNow } from './camp.js';

export const CARRIED_MATERIALS = ['stein', 'pilzholz'];
const STORE_OF = { stein: 'steinlager', pilzholz: 'pilzlager' };

// How many pieces the store of the camp holds (0 while it is not built).
export function storeCapacity(world, catalog, key) {
  return facilityNow(world, catalog, STORE_OF[key])?.kapazitaet || 0;
}

// What the Envoy carries himself: the part of the total that is not in a store.
export function carried(world, catalog) {
  const out = {};
  for (const key of CARRIED_MATERIALS) out[key] = Math.max(0, (world.purse[key] || 0) - storeCapacity(world, catalog, key));
  return out;
}

export function materialPlaces(world, catalog) {
  const c = carried(world, catalog);
  return CARRIED_MATERIALS.reduce((sum, key) => sum + Math.ceil(c[key] / MATERIAL_STACK), 0);
}

// Places of the backpack that are not taken by things or material.
export function freePlaces(world, catalog) {
  return Math.max(0, BACKPACK_SIZE - countIn(world, 'rucksack') - materialPlaces(world, catalog));
}

// How many more pieces of a material the Envoy can take, on the way
// (only what he can carry) or at the camp (the store counts too).
export function roomFor(world, catalog, key, { atTheCamp = true } = {}) {
  const have = carried(world, catalog)[key];
  const spare = Math.ceil(have / MATERIAL_STACK) * MATERIAL_STACK - have;
  const storeFree = atTheCamp ? Math.max(0, storeCapacity(world, catalog, key) - (world.purse[key] || 0)) : 0;
  return storeFree + spare + freePlaces(world, catalog) * MATERIAL_STACK;
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
  const taken = where === 'rucksack' ? materialPlaces(world, catalog) : 0;
  return countIn(world, where) + taken < capacity(world, catalog, where);
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
