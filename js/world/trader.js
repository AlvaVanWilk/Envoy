// The trader offers a few different things every day. They are chosen
// around the hero's strength: some a little below, some a little above.

import { TRADER_OFFERS } from '../config.js';
import { seededRandom, shuffle } from './rng.js';
import { heroPower } from './hero.js';
import { itemLevel, itemPrice } from './items.js';

const BAND = 3;
const MIN_CHOICE = 6;

export function offersFor(day, ctx) {
  const rng = seededRandom(`${day}:haendler`);
  const power = heroPower(ctx.statsAtDayStart);

  const items = ctx.catalog.equipment.filter((i) => i.herkunft.includes('haendler'));
  let band = items.filter((i) => Math.abs(itemLevel(i) - power) <= BAND);
  if (band.length < MIN_CHOICE) {
    band = [...items].sort((a, b) => Math.abs(itemLevel(a) - power) - Math.abs(itemLevel(b) - power)).slice(0, MIN_CHOICE);
  }
  const homeTier = Math.max(1, ctx.world.home);
  const furniture = ctx.catalog.furniture.filter((f) => f.herkunft.includes('haendler') && f.abStufe <= homeTier + 1);

  const furnitureCount = furniture.length > 0 ? (rng() < 0.5 ? 1 : 2) : 0;
  const chosen = [
    ...shuffle(rng, band).slice(0, TRADER_OFFERS - furnitureCount).map((i) => ({ kind: 'item', id: i.id, price: itemPrice(i) })),
    ...shuffle(rng, furniture).slice(0, furnitureCount).map((f) => ({ kind: 'furniture', id: f.id, price: f.preis })),
  ];
  return chosen.map((offer, n) => ({ ...offer, offer: `${day}:${n}` }));
}
