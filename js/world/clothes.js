// Clothes: which figure a piece fits, its colour, and the pieces found on
// the way.
//
// A drawing fits one figure or both (column `figur`, here `passt`). A piece
// that does not fit the Envoy is never found for it, cannot be put on, and
// is not drawn on it.
//
// A piece that can be dyed (`faerbbar`) gets a colour of its own when it is
// found or offered (DYES, or as drawn). The colour belongs to the thing that
// is owned (entry.farbe), so the same piece turns up in many forms.
//
// Every action on the way, except building, is a chance to find a piece:
// CLOTHES_PER_ENERGY for each Energie of its work. world.clothes keeps the
// Energie since the last find and how many were found; the first comes for
// sure after CLOTHES_FIRST_ENERGY, every other after CLOTHES_SURE_ENERGY.
// Which piece: one that fits the Envoy's strength (see lootThing in run.js).

import {
  FIGURES, DYES, CLOTHES_PER_ENERGY, CLOTHES_MOST, CLOTHES_FIRST_ENERGY, CLOTHES_SURE_ENERGY,
} from '../config.js';

export const emptyClothes = () => ({ since: 0, found: 0 });

// The figure of the Envoy (the first one while there is no Envoy yet).
export const figureOf = (world) => (FIGURES.find((f) => f.id === world?.envoy?.figur) || FIGURES[0]).id;

export function fits(item, figure) {
  return !item.passt || item.passt.includes(figure);
}

export const dyeById = (id) => DYES.find((d) => d.id === id) || null;

// A colour for a piece: null (as drawn) or the id of one of DYES.
export function rollDye(item, rng) {
  if (!item?.faerbbar) return null;
  const n = Math.floor(rng() * (DYES.length + 1));
  return n < DYES.length ? DYES[n].id : null;
}

// The name of an owned or offered thing with its colour: „Bandshirt in Moosgrün“.
export function thingName(item, farbe) {
  const dye = dyeById(farbe);
  return dye ? `${item.name} in ${dye.name}` : item.name;
}

// Is a piece of clothing found in an action with this much Energie of work?
// -> { energy, found }
export function rollClothes(world, energy, rng) {
  const state = world.clothes || emptyClothes();
  const since = state.since + energy;
  const sure = state.found === 0 ? CLOTHES_FIRST_ENERGY : CLOTHES_SURE_ENERGY;
  const found = energy > 0 && (since >= sure || rng() < Math.min(CLOTHES_MOST, CLOTHES_PER_ENERGY * energy));
  return { energy, found };
}

// What an action's roll leaves for the next ones.
export function countClothes(world, roll) {
  if (!roll) return;
  const state = world.clothes || emptyClothes();
  world.clothes = roll.found ? { since: 0, found: state.found + 1 } : { since: state.since + roll.energy, found: state.found };
}
