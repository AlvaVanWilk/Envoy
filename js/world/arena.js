// The arena in the own list of events. The fights are decided by the server
// (arena.php); here only what follows from them for this Envoy:
//   kampf     a fight of the own Abbild: Ruhm, and for a challenge the Energie
//             it cost (nothing since version 5.13; the event says how much)
//   abbild    the Titel of the own Abbild (the latest counts; a Haltung of
//             events before 5.17 no longer counts)
//   ruhmkauf  something bought with Ruhm: a colour for a piece of clothing, a
//             piece of clothing with bonuses (since 5.15), or a Titel (before 5.15)
// Ruhm is the currency of the arena only. It never makes the Envoy stronger.
// All the Ruhm ever earned gives the Rang (RANKS), and each Rang its Titel;
// spending Ruhm never lowers the Rang.
//
// world.arena = { ruhm, earned, titel, titles, fights }
//   ruhm     what is left to spend
//   earned   all the Ruhm ever earned
//   titles   { id: true } the Titel bought before 5.15 (they stay)
//   fights   the latest fights, newest last: { id, t, rolle, gegner, ergebnis, ruhm, platz }

import { ARENA_ENERGY_BEFORE, TITLES, DYES, RANKS, ARENA_OFFERS, ARENA_PRICES, ARENA_WINDOW_DAYS, STAT_IDS } from '../config.js';
import { addDays } from '../days.js';
import { stow } from './inventory.js';
import { cleanBonuses, rollBonuses } from './bonuses.js';
import { seededRandom, shuffle } from './rng.js';
import { heroPower } from './hero.js';
import { itemLevel } from './items.js';
import { obtainable, figureOf, rollDye } from './clothes.js';

const KEEP_FIGHTS = 40;
const RESULTS = ['sieg', 'remis', 'niederlage'];

export const emptyArena = () => ({ ruhm: 0, earned: 0, titel: '', titles: {}, fights: [] });

// The Fleiß of the own Envoy, as the server counts it (see effortOf in
// arena.php): on how many of the last 28 days, up to today, the task of each
// area was done. { kraft: 12, …, total: 47 }
export function effortOf(state) {
  const from = addDays(state.today, -(ARENA_WINDOW_DAYS - 1));
  const days = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
  for (const entry of state.log) {
    if (entry.day < from || entry.day > state.today) continue;
    for (const id of STAT_IDS) if (entry.tasks[id]?.done) days[id] += 1;
  }
  return { ...days, total: STAT_IDS.reduce((sum, id) => sum + days[id], 0) };
}

export const titleById = (id) => TITLES.find((t) => t.id === id) || null;

// The Rang for all the Ruhm ever earned: its number (0 = the first) and the next one.
export function rankOf(earned) {
  const index = RANKS.reduce((found, r, i) => (earned >= r.at ? i : found), 0);
  return { index, rank: RANKS[index], next: RANKS[index + 1] || null };
}

// A Titel is the Abbild's once its Rang is reached (or if it was bought before 5.15).
export const titleOwned = (arena, id) => {
  const title = titleById(id);
  return Boolean(title) && (Boolean(arena.titles[id]) || rankOf(arena.earned).index >= title.rang);
};

const BAND = 3;

// What Ruhm buys today besides colours: a few pieces of clothing around the
// Envoy's strength, each at least selten, its price by its Güte.
export function arenaOffersFor(day, ctx) {
  const rng = seededRandom(`${day}:arena`);
  const power = heroPower(ctx.statsAtDayStart);
  const figure = figureOf(ctx.world);
  const items = ctx.catalog.equipment.filter((i) => (i.herkunft.includes('beute') || i.herkunft.includes('haendler'))
    && obtainable(i, figure) && Math.abs(itemLevel(i) - power) <= BAND);
  return shuffle(rng, items).slice(0, ARENA_OFFERS).map((item, n) => {
    const farbe = rollDye(item, seededRandom(`${day}:arena:farbe:${n}`));
    const extra = rollBonuses('arena', power, seededRandom(`${day}:arena:guete:${n}`));
    return { offer: `${day}:arena:${n}`, id: item.id, price: ARENA_PRICES[extra.guete] || ARENA_PRICES.selten, ...(farbe ? { farbe } : {}), ...extra };
  });
}

// The id of the event for a fight: the same on every device, so a fight is
// written only once (arena = the id of the list on the server, s = its number).
export const fightEventId = (arena, s) => `kampf-${arena}-${s}`;

const whole = (n) => Math.max(0, Math.floor(Number(n) || 0));

function fought(world, e) {
  if (!RESULTS.includes(e.ergebnis)) return;
  const ruhm = whole(e.ruhm);
  world.arena.ruhm += ruhm;
  world.arena.earned += ruhm;
  if (e.rolle === 'fordert') {
    const cost = e.energie === undefined ? ARENA_ENERGY_BEFORE : whole(e.energie);
    world.stamina.value = Math.max(0, world.stamina.value - cost);
  }
  const gegner = e.gegner && typeof e.gegner === 'object' ? e.gegner : {};
  world.arena.fights.push({
    id: e.id, t: e.t, rolle: e.rolle === 'fordert' ? 'fordert' : 'verteidigt',
    gegner: { name: String(gegner.name || ''), figur: String(gegner.figur || ''), haut: String(gegner.haut || ''), haar: String(gegner.haar || '') },
    ergebnis: e.ergebnis, ruhm, platz: Array.isArray(e.platz) ? e.platz : [null, null],
  });
  if (world.arena.fights.length > KEEP_FIGHTS) world.arena.fights.shift();
}

function bought(world, e, catalog) {
  const price = whole(e.preis);
  if (price > world.arena.ruhm) return;
  if (e.ware === 'kleidung') {
    // a piece of clothing with bonuses, each offer once
    if (world.bought[e.offer] || !catalog.itemById.get(e.thing) || typeof e.offer !== 'string') return;
    world.bought[e.offer] = true;
    const farbe = typeof e.farbe === 'string' && e.farbe ? { farbe: e.farbe } : {};
    stow(world, catalog, { inst: e.id, kind: 'item', id: e.thing, got: e.t, ...farbe, ...cleanBonuses(e) });
  } else if (e.ware === 'titel') {
    if (!titleById(e.titel) || world.arena.titles[e.titel]) return;
    world.arena.titles[e.titel] = true;
  } else if (e.ware === 'farbe') {
    const entry = world.items[e.inst];
    if (!entry || entry.kind !== 'item' || !catalog.itemById.get(entry.id)?.faerbbar) return;
    if (e.farbe && !DYES.some((d) => d.id === e.farbe)) return;
    if (e.farbe) entry.farbe = e.farbe;
    else delete entry.farbe;
  } else return;
  world.arena.ruhm -= price;
}

export function applyArenaEvent(world, e, ctx) {
  if (e.type === 'kampf') fought(world, e);
  else if (e.type === 'ruhmkauf') bought(world, e, ctx.catalog);
  else if (e.type === 'abbild') {
    if (e.titel === '' || titleOwned(world.arena, e.titel)) world.arena.titel = e.titel;
  }
}

// The Abbild as the server gets it: name and look, the clothes worn (with
// their colour and bonuses: equally diligent, the clothes decide) and the
// Titel. No stats: its strength in the arena is how often the tasks were
// done lately, which the server counts itself (see arena.php), so talent
// does not win, diligence does.
export function abbildOf(state) {
  const { world } = state;
  if (!world.envoy) return null;
  const worn = Object.values(world.equipped).map((inst) => world.items[inst]).filter(Boolean)
    .map((entry) => ({ id: entry.id, ...(entry.farbe ? { farbe: entry.farbe } : {}), ...(entry.bonus ? { bonus: entry.bonus } : {}) }));
  return {
    name: world.envoy.name,
    figur: world.envoy.figur,
    haut: world.envoy.haut,
    haar: world.envoy.haar,
    unterhemd: world.envoy.unterhemd,
    worn,
    titel: world.arena.titel,
  };
}
