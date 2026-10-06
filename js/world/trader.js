// The trader offers a few different things every day. They are chosen
// around the hero's strength: some a little below, some a little above,
// only what fits the Envoy's figure and is drawn, clothes in a colour of their own (see
// clothes.js). On some days he also has a plan for Deko (see plans.js), and
// every day a few potions that give Energie (POTIONS).

import { TRADER_OFFERS, POTIONS, POTIONS_PER_DAY, BONUS_PRICE } from '../config.js';
import { seededRandom, shuffle } from './rng.js';
import { heroPower } from './hero.js';
import { itemLevel, itemPrice } from './items.js';
import { traderPlans } from './plans.js';
import { obtainable, figureOf, rollDye } from './clothes.js';
import { rollBonuses, bonusCount } from './bonuses.js';

const BAND = 3;
const MIN_CHOICE = 6;

export function offersFor(day, ctx) {
  const rng = seededRandom(`${day}:haendler`);
  const power = heroPower(ctx.statsAtDayStart);

  const figure = figureOf(ctx.world);
  const items = ctx.catalog.equipment.filter((i) => i.herkunft.includes('haendler') && obtainable(i, figure));
  let band = items.filter((i) => Math.abs(itemLevel(i) - power) <= BAND);
  if (band.length < MIN_CHOICE) {
    band = [...items].sort((a, b) => Math.abs(itemLevel(a) - power) - Math.abs(itemLevel(b) - power)).slice(0, MIN_CHOICE);
  }
  const dyeRng = seededRandom(`${day}:haendler:farbe`);
  const chosen = shuffle(rng, band).slice(0, TRADER_OFFERS).map((i) => {
    const farbe = rollDye(i, dyeRng);
    // Güte and bonuses, with dice of their own; each bonus makes it dearer
    const extra = rollBonuses('haendler', power, seededRandom(`${day}:haendler:guete:${i.id}`));
    const price = Math.round(itemPrice(i) * (1 + BONUS_PRICE * bonusCount(extra)));
    return { kind: 'item', id: i.id, price, ...(farbe ? { farbe } : {}), ...extra };
  });
  // the potions of the day, each a few times (see POTIONS)
  const potions = POTIONS.flatMap((p) => Array.from({ length: POTIONS_PER_DAY }, (_, n) => (
    { kind: 'trank', id: p.id, price: p.preis, offer: `${day}:trank:${p.id}:${n}` })));
  return [...potions, ...traderPlans(day, ctx), ...chosen.map((offer, n) => ({ ...offer, offer: `${day}:${n}` }))];
}
