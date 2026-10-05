// The arena in the own list of events. The fights are decided by the server
// (arena.php); here only what follows from them for this Envoy:
//   kampf     a fight of the own Abbild: Ruhm, and for a challenge the Energie
//   abbild    Haltung and Titel of the own Abbild (the latest counts)
//   ruhmkauf  something bought with Ruhm: a colour for a piece of clothing, or a Titel
// Ruhm is the currency of the arena only. It never makes the Envoy stronger.
//
// world.arena = { ruhm, haltung, titel, titles, fights }
//   ruhm     what is left to spend
//   titles   { id: true } the Titel bought
//   fights   the latest fights, newest last: { id, t, rolle, gegner, ergebnis, ruhm, platz }

import { ARENA_ENERGY, HALTUNGEN, TITLES, DYES } from '../config.js';

const KEEP_FIGHTS = 40;
const RESULTS = ['sieg', 'remis', 'niederlage'];

export const emptyArena = () => ({ ruhm: 0, haltung: 'abwehr', titel: '', titles: {}, fights: [] });

export const titleById = (id) => TITLES.find((t) => t.id === id) || null;

// The id of the event for a fight: the same on every device, so a fight is
// written only once (arena = the id of the list on the server, s = its number).
export const fightEventId = (arena, s) => `kampf-${arena}-${s}`;

const whole = (n) => Math.max(0, Math.floor(Number(n) || 0));

function fought(world, e) {
  if (!RESULTS.includes(e.ergebnis)) return;
  const ruhm = whole(e.ruhm);
  world.arena.ruhm += ruhm;
  if (e.rolle === 'fordert') world.stamina.value = Math.max(0, world.stamina.value - (Number(e.energie) || ARENA_ENERGY));
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
  if (e.ware === 'titel') {
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
    if (HALTUNGEN.some((h) => h.id === e.haltung)) world.arena.haltung = e.haltung;
    if (e.titel === '' || world.arena.titles[e.titel]) world.arena.titel = e.titel;
  }
}

// The Abbild as the server gets it: name and look, the clothes worn (with
// their colour), Haltung and Titel. No stats: its strength in the arena is
// how often the tasks were done lately, which the server counts itself
// (see arena.php), so talent does not win, diligence does.
export function abbildOf(state) {
  const { world } = state;
  if (!world.envoy) return null;
  const worn = Object.values(world.equipped).map((inst) => world.items[inst]).filter(Boolean)
    .map((entry) => ({ id: entry.id, ...(entry.farbe ? { farbe: entry.farbe } : {}) }));
  return {
    name: world.envoy.name,
    figur: world.envoy.figur,
    haut: world.envoy.haut,
    haar: world.envoy.haar,
    unterhemd: world.envoy.unterhemd,
    worn,
    haltung: world.arena.haltung,
    titel: world.arena.titel,
  };
}
