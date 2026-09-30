// The trader offers a few different things every day. They are chosen
// around the hero's strength: some a little below, some a little above.
// Only equipment for now; furniture waits for the new way the camp grows.

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
  const chosen = shuffle(rng, band).slice(0, TRADER_OFFERS).map((i) => ({ kind: 'item', id: i.id, price: itemPrice(i) }));
  return chosen.map((offer, n) => ({ ...offer, offer: `${day}:${n}` }));
}
