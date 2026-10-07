// The arena in the own list of events: Ruhm from fights, Energie for a
// challenge, Haltung and Titel, and what Ruhm buys. The fights themselves
// are decided by the server (see server.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { mergeEvents } from '../js/events.js';
import { buildCatalog } from '../js/catalog.js';
import { abbildOf, fightEventId, rankOf, arenaOffersFor } from '../js/world/arena.js';
import { ARENA_ENERGY, DYE_PRICE, TITLES, RANKS } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
let n = 0;
function ev(type, fields, minutes = 0) {
  n += 1;
  return { id: `a-${n}`, t: T0 + minutes * 60000 + n, d: DAY, dev: 't', type, ...fields };
}
const gegner = { name: 'Mara', figur: 'erste', haut: '', haar: '' };
const fight = (s, rolle, ergebnis, ruhm, minutes) => ({
  ...ev('kampf', { kampf: s, rolle, gegner, ergebnis, ruhm, platz: [3, 2], ...(rolle === 'fordert' ? { energie: ARENA_ENERGY } : {}) }, minutes),
  id: fightEventId('x1', s),
});
const start = () => [ev('envoy', { name: 'Ida', figur: 'erste', haut: '', haar: '' })];

test('arena: fights bring Ruhm; a challenge costs Energie, being challenged does not', () => {
  const events = [...start(), fight(1, 'fordert', 'sieg', 3, 1)];
  const s = replay(events, catalog, DAY, T0 + 2 * 60000);
  assert.equal(s.world.arena.ruhm, 3);
  assert.equal(s.world.arena.fights.length, 1);
  assert.equal(s.world.arena.fights[0].gegner.name, 'Mara');
  // the bar was full (10 at Ausdauer 1): a challenge took ARENA_ENERGY of it
  assert.ok(Math.abs(s.world.stamina.value - (10 - ARENA_ENERGY)) < 0.2, `stamina ${s.world.stamina.value}`);

  const t = replay([...events, fight(2, 'verteidigt', 'niederlage', 1, 2)], catalog, DAY, T0 + 3 * 60000);
  assert.equal(t.world.arena.ruhm, 4);
  assert.ok(Math.abs(t.world.stamina.value - s.world.stamina.value) < 0.2);
  // the same fight written by two devices counts once
  const twice = replay(mergeEvents(events, [fight(1, 'fordert', 'sieg', 3, 1)]), catalog, DAY, T0 + 3 * 60000);
  assert.equal(twice.world.arena.ruhm, 3);
});

test('arena: the Titel of the Abbild comes with its Rang, one bought before stays; a Haltung no longer counts', () => {
  const title = TITLES.find((t) => t.rang === 1);
  const events = [...start(), fight(1, 'verteidigt', 'sieg', RANKS[1].at - 1, 1), ev('abbild', { haltung: 'angriff', titel: title.id }, 2)];
  let s = replay(events, catalog, DAY, T0 + 3 * 60000);
  assert.equal(s.world.arena.haltung, undefined);
  assert.equal(s.world.arena.titel, '');            // the Rang is not reached yet
  assert.equal(rankOf(s.world.arena.earned).index, 0);
  events.push(fight(2, 'verteidigt', 'sieg', 1, 3), ev('abbild', { titel: title.id }, 4));
  s = replay(events, catalog, DAY, T0 + 5 * 60000);
  assert.equal(rankOf(s.world.arena.earned).index, 1);
  assert.equal(s.world.arena.titel, title.id);
  assert.equal(abbildOf(s).titel, title.id);
  assert.equal(abbildOf(s).haltung, undefined);
  // a Titel of a higher Rang is not the Abbild's yet, unless it was bought before 5.15
  const high = TITLES.find((t) => t.rang === 5);
  events.push(ev('abbild', { titel: high.id }, 5));
  assert.equal(replay(events, catalog, DAY, T0 + 6 * 60000).world.arena.titel, title.id);
  events.push(ev('ruhmkauf', { ware: 'titel', titel: high.id, preis: 10 }, 6), ev('abbild', { titel: high.id }, 7));
  s = replay(events, catalog, DAY, T0 + 8 * 60000);
  assert.equal(s.world.arena.titel, high.id);
  // spending Ruhm never lowers the Rang
  assert.equal(s.world.arena.ruhm, RANKS[1].at - 10);
  assert.equal(rankOf(s.world.arena.earned).index, 1);
});

test('arena: Ruhm buys clothing with bonuses, each offer once', () => {
  const s0 = replay(start(), catalog, DAY, T0 + 60000);
  const ctx = { catalog, world: s0.world, stats: s0.stats, statsAtDayStart: s0.statsAtDayStart };
  const offers = arenaOffersFor(DAY, ctx);
  assert.equal(offers.length, 3);
  for (const o of offers) assert.ok(['selten', 'praechtig'].includes(o.guete) && o.price > 0);
  const o = offers[0];
  const buy = (minutes) => ev('ruhmkauf', { ware: 'kleidung', offer: o.offer, thing: o.id, preis: o.price, guete: o.guete, bonus: o.bonus, ...(o.farbe ? { farbe: o.farbe } : {}) }, minutes);
  const events = [...start(), fight(1, 'verteidigt', 'sieg', o.price + 1, 1), buy(2), buy(3)];
  const s = replay(events, catalog, DAY, T0 + 4 * 60000);
  const pieces = Object.values(s.world.items).filter((e) => e.id === o.id && e.guete);
  assert.equal(pieces.length, 1);
  assert.deepEqual(pieces[0].bonus, o.bonus);
  assert.equal(s.world.arena.ruhm, 1);
});

test('arena: a piece that can be dyed takes another colour for Ruhm, and the Abbild wears it so', () => {
  const piece = catalog.equipment.find((i) => i.faerbbar && i.passt.includes('erste') && Object.keys(i.req).length === 0);
  const fixed = catalog.equipment.find((i) => !i.faerbbar && i.herkunft.includes('haendler'));
  const events = [
    ...start(),
    ev('test', { splitter: 10 }, 1),
    ev('buy', { offer: 'o1', kind: 'item', thing: piece.id, price: 1 }, 2),
    ev('buy', { offer: 'o2', kind: 'item', thing: fixed.id, price: 1 }, 3),
    fight(1, 'verteidigt', 'sieg', 2 * DYE_PRICE, 4),
  ];
  const s0 = replay(events, catalog, DAY, T0 + 5 * 60000);
  const inst = Object.values(s0.world.items).find((e) => e.id === piece.id).inst;
  const other = Object.values(s0.world.items).find((e) => e.id === fixed.id).inst;
  events.push(
    ev('ruhmkauf', { ware: 'farbe', inst, farbe: 'petrol', preis: DYE_PRICE }, 6),
    ev('ruhmkauf', { ware: 'farbe', inst: other, farbe: 'rost', preis: DYE_PRICE }, 7),   // cannot be dyed
    ev('equip', { slot: piece.slot, inst }, 8),
  );
  const s = replay(events, catalog, DAY, T0 + 9 * 60000);
  assert.equal(s.world.items[inst].farbe, 'petrol');
  assert.equal(s.world.items[other].farbe, undefined);
  assert.equal(s.world.arena.ruhm, DYE_PRICE);
  assert.deepEqual(abbildOf(s).worn.find((w) => w.id === piece.id), { id: piece.id, farbe: 'petrol' });
  assert.equal(abbildOf(s).stats, undefined);   // the strength is counted on the server
  // back to its own colour
  events.push(ev('ruhmkauf', { ware: 'farbe', inst, farbe: '', preis: DYE_PRICE }, 9));
  assert.equal(replay(events, catalog, DAY, T0 + 10 * 60000).world.items[inst].farbe, undefined);
});

test('arena: the own Fleiß counts the days with a task done in the last 28 days', async () => {
  const { effortOf } = await import('../js/world/arena.js');
  const days = ['2026-04-01', '2026-04-20', '2026-04-29', '2026-05-01'];
  const done = (stat, d, n) => ({ id: `f-${stat}-${d}`, t: Date.parse(`${d}T09:00:00`) + n, d, dev: 't', type: 'done', stat, teile: [], xp: 20, regel: 2 });
  const events = [...start(), ...days.flatMap((d, i) => [done('kraft', d, i), done('gelassenheit', d, i + 10)]), done('ausdauer', '2026-04-29', 30)];
  const undo = { id: 'u-1', t: Date.parse('2026-04-29T10:00:00'), d: '2026-04-29', dev: 't', type: 'undo', ref: 'f-ausdauer-2026-04-29', stat: 'ausdauer' };
  const s = replay([...events, undo], catalog, DAY, T0 + 60000);
  // 2026-04-01 lies more than 27 days before 2026-05-01; the Ausdauer was taken back
  assert.deepEqual(effortOf(s), { kraft: 3, ausdauer: 0, beweglichkeit: 0, gelassenheit: 3, total: 6 });
});
