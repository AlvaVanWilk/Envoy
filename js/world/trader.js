// The trader offers a few different things every day. They are chosen
// around the hero's strength: some a little below, some a little above.
// On some days he also has a plan for Deko (see plans.js).

import { TRADER_OFFERS } from '../config.js';
import { seededRandom, shuffle } from './rng.js';
import { heroPower } from './hero.js';
import { itemLevel, itemPrice } from './items.js';
import { traderPlans } from './plans.js';

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
  return [...traderPlans(day, ctx), ...chosen.map((offer, n) => ({ ...offer, offer: `${day}:${n}` }))];
}
