// The arena in the own list of events: Ruhm from fights, Energie for a
// challenge, Haltung and Titel, and what Ruhm buys. The fights themselves
// are decided by the server (see server.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { mergeEvents } from '../js/events.js';
import { buildCatalog } from '../js/catalog.js';
import { abbildOf, fightEventId } from '../js/world/arena.js';
import { ARENA_ENERGY, DYE_PRICE, TITLES } from '../js/config.js';

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

test('arena: Haltung and Titel of the Abbild; a Titel is bought with Ruhm first', () => {
  const title = TITLES[0];
  const events = [...start(), fight(1, 'verteidigt', 'sieg', title.price, 1), ev('abbild', { haltung: 'angriff', titel: title.id }, 2)];
  let s = replay(events, catalog, DAY, T0 + 3 * 60000);
  assert.equal(s.world.arena.haltung, 'angriff');
  assert.equal(s.world.arena.titel, '');            // not bought yet
  events.push(ev('ruhmkauf', { ware: 'titel', titel: title.id, preis: title.price }, 3), ev('abbild', { titel: title.id }, 4));
  s = replay(events, catalog, DAY, T0 + 5 * 60000);
  assert.equal(s.world.arena.titel, title.id);
  assert.equal(s.world.arena.ruhm, 0);
  // without enough Ruhm nothing is bought
  events.push(ev('ruhmkauf', { ware: 'titel', titel: TITLES[1].id, preis: TITLES[1].price }, 5));
  s = replay(events, catalog, DAY, T0 + 6 * 60000);
  assert.equal(s.world.arena.titles[TITLES[1].id], undefined);
  assert.equal(abbildOf(s).titel, title.id);
  assert.equal(abbildOf(s).haltung, 'angriff');
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
