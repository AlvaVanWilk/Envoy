// Backpack and wardrobe. Every owned thing is an entry in world.items:
//   { inst, kind: 'item' | 'furniture', id, where, got }
// where = 'rucksack' | 'schrank' | 'body' (worn) | 'home' (furniture set up)
// The backpack has a few places from the start; the wardrobe comes with the home.

import { BACKPACK_SIZE } from '../config.js';

export function countIn(world, where) {
  let n = 0;
  for (const entry of Object.values(world.items)) if (entry.where === where) n += 1;
  return n;
}

export function capacity(world, catalog, where) {
  if (where === 'rucksack') return BACKPACK_SIZE;
  if (where === 'schrank') return catalog.home[world.home - 1]?.schrank || 0;
  return Infinity;
}

export function hasSpace(world, catalog, where) {
  return countIn(world, where) < capacity(world, catalog, where);
}

export function overloaded(world) {
  return countIn(world, 'rucksack') > BACKPACK_SIZE;
}

// New things go into the backpack; if it is full, into the wardrobe;
// if that is full too, the backpack gets over-full (travel costs more).
export function stow(world, catalog, entry) {
  let where = 'rucksack';
  if (!hasSpace(world, catalog, 'rucksack') && hasSpace(world, catalog, 'schrank')) where = 'schrank';
  world.items[entry.inst] = { ...entry, where };
  return where;
}

export function removeEntry(world, inst) {
  delete world.items[inst];
  for (const [slot, worn] of Object.entries(world.equipped)) if (worn === inst) delete world.equipped[slot];
  world.placed = world.placed.filter((p) => p !== inst);
}

// Entries in one place, as a list.
export function entriesIn(world, where) {
  return Object.values(world.items).filter((e) => e.where === where);
}
