// Clothes: found on the way, in colours of their own, only what fits the figure.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects } from '../js/world/hero.js';
import { questById } from '../js/world/quests.js';
import { runQuest } from '../js/world/run.js';
import { offersFor } from '../js/world/trader.js';
import { rollClothes, countClothes, fits, thingName, emptyClothes } from '../js/world/clothes.js';
import { seededRandom } from '../js/world/rng.js';
import { resolveLook, layerSrc, iconSrc } from '../js/ui/look.js';
import { DYES, CLOTHES_PER_ENERGY, CLOTHES_FIRST_ENERGY, CLOTHES_SURE_ENERGY } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
const H = 3600000;
let n = 0;
function ev(type, fields, hoursAfter = 0) {
  n += 1;
  return { id: `k-${n}`, t: T0 + hoursAfter * H + n, d: DAY, dev: 't', type, ...fields };
}
const ctxOf = (s) => ({ catalog, world: s.world, stats: s.stats, statsAtDayStart: s.statsAtDayStart, fx: effects(s.world, catalog), totals: s.totals, day: s.today });
const envoy = (figur) => ev('envoy', { name: 'Ida', figur, haut: 'hell', haar: 'blond', geburtsjahr: 2016 });

// Sets out like the app does: the outcome is rolled now and kept in the event.
function setOut(events, questId, hoursAfter, options = {}) {
  const s = replay(events, catalog, DAY, T0 + hoursAfter * H);
  const quest = questById(questId, ctxOf(s));
  const e = ev('expedition', { q: quest.id, place: quest.place, title: quest.name }, hoursAfter);
  const outcome = runQuest(quest, ctxOf(s), e.id, options);
  return Object.assign(e, { least: outcome.stamina, outcome });
}

test('the chance of a piece: by the Energie of work, the first for sure early, every other after twice the average', () => {
  const rng = () => 0.99;   // the dice never help
  assert.equal(rollClothes({ clothes: emptyClothes() }, CLOTHES_FIRST_ENERGY - 1, rng).found, false);
  assert.equal(rollClothes({ clothes: { since: 3, found: 0 } }, 3, rng).found, true);
  assert.equal(rollClothes({ clothes: { since: CLOTHES_SURE_ENERGY - 5, found: 2 } }, 4, rng).found, false);
  assert.equal(rollClothes({ clothes: { since: CLOTHES_SURE_ENERGY - 5, found: 2 } }, 5, rng).found, true);
  assert.equal(rollClothes({ clothes: { since: 0, found: 1 } }, 0, () => 0).found, false);   // no work, no find
  // on average one piece every 1 / CLOTHES_PER_ENERGY Energie
  const dice = seededRandom('kleidung');
  let found = 0;
  for (let i = 0; i < 4000; i += 1) if (rollClothes({ clothes: { since: 0, found: 1 } }, 5, dice).found) found += 1;
  const share = found / 4000;
  assert.ok(Math.abs(share - 5 * CLOTHES_PER_ENERGY) < 0.03, `share ${share}`);
  // what is left for the next ones
  const world = { clothes: { since: 10, found: 1 } };
  countClothes(world, { energy: 4, found: false });
  assert.deepEqual(world.clothes, { since: 14, found: 1 });
  countClothes(world, { energy: 4, found: true });
  assert.deepEqual(world.clothes, { since: 0, found: 2 });
});

test('the first day: the work for the Lagerfeuer and the first gloves brings a first piece of clothing, which fits the figure', () => {
  for (const figur of ['erste', 'zweite', 'erste']) {
    // whatever the dice: 8 Stein, 2 Pilzholz, the quest for the Handwickel
    const events = [envoy(figur)];
    const pieces = [];
    const steps = [['gather:stein', { amount: 8, energy: 4 }], ['gather:pilzholz', { amount: 2, energy: 1 }], ['q-handwickel', {}]];
    steps.forEach(([q, options], i) => {
      const e = setOut(events, q, i * 0.5, options);
      events.push(e, ev('test', { fertig: true }, i * 0.5 + 0.2));
      pieces.push(...e.outcome.reward.things.filter((t) => catalog.itemById.get(t.id).herkunft.includes('fund')));
    });
    assert.equal(pieces.length, 1, figur);
    const item = catalog.itemById.get(pieces[0].id);
    assert.ok(item.herkunft.includes('fund') && fits(item, figur), item.id);
    assert.deepEqual(item.req, {}, `${item.id}: the first piece can be put on at once`);
    const s = replay(events, catalog, DAY, T0 + 3 * H);
    const owned = Object.values(s.world.items).find((x) => x.id === item.id);
    assert.equal(owned.farbe, pieces[0].farbe);
    assert.equal(s.world.clothes.found, 1);
  }
});

test('colours: a piece that can be dyed comes in many colours, the start outfit never', () => {
  const s = replay([envoy('erste')], catalog, DAY, T0 + H);
  const seen = new Set();
  for (let i = 0; i < 300; i += 1) {
    const o = runQuest(questById('gather:stein', ctxOf(s)), { ...ctxOf(s), world: { ...s.world, clothes: { since: 0, found: 0 } } },
      `farbe${i}`, { amount: 20, energy: 10 });
    for (const t of o.reward.things) {
      // a piece kept as drawn (the jerseys, the Steppenrock) never gets a colour
      if (!catalog.itemById.get(t.id).faerbbar) { assert.equal(t.farbe, undefined); continue; }
      seen.add(t.farbe || 'wie gezeichnet');
    }
  }
  assert.ok(seen.size >= DYES.length - 2, [...seen].join(', '));
  assert.ok(seen.has('wie gezeichnet'));
  assert.equal(catalog.itemById.get('torso_leinenhemd_1').faerbbar, false);
  assert.equal(catalog.itemById.get('handschuhe_handwickel_1').faerbbar, false);
  const shirt = catalog.itemById.get('torso_bandshirt_2');
  assert.equal(thingName(shirt, 'moos'), 'Bandshirt in Moosgrün');
  assert.equal(thingName(shirt, null), 'Bandshirt');
});

test('the trader: only what fits the figure, clothes in a colour of their own; the colour stays after buying', () => {
  const events = [envoy('zweite'), ev('test', { splitter: 500 }, 0.1)];
  const s = replay(events, catalog, DAY, T0 + H);
  let coloured = 0;
  for (let d = 1; d <= 20; d += 1) {
    const day = `2026-05-${String(d).padStart(2, '0')}`;
    for (const offer of offersFor(day, ctxOf(s)).filter((o) => o.kind === 'item')) {
      assert.ok(fits(catalog.itemById.get(offer.id), 'zweite'), offer.id);
      if (offer.farbe) coloured += 1;
    }
  }
  assert.ok(coloured > 0);
  const offer = offersFor(DAY, ctxOf(s)).find((o) => o.farbe) || null;
  if (offer) {
    const buy = ev('buy', { offer: offer.offer, kind: offer.kind, thing: offer.id, price: offer.price, farbe: offer.farbe }, 0.2);
    const after = replay([...events, buy], catalog, DAY, T0 + H);
    assert.equal(after.world.items[buy.id].farbe, offer.farbe);
  }
});

test('a piece drawn for the other figure: not put on, not drawn', () => {
  const events = [envoy('zweite'), ev('test', { kleidung: true }, 0.1)];
  const s = replay(events, catalog, DAY, T0 + H);
  const found = Object.values(s.world.items).find((x) => x.inst === events[1].id);
  assert.ok(fits(catalog.itemById.get(found.id), 'zweite'));
  // a top only for the first figure, put into the backpack of the second
  const own = { inst: 'x1', kind: 'item', id: 'torso_leinenbluse_1', where: 'rucksack', got: T0 };
  const state = replay(events, catalog, DAY, T0 + H);
  state.world.items.x1 = own;
  const look = resolveLook({ figur: 'zweite' });
  assert.equal(layerSrc(catalog.itemById.get('torso_leinenbluse_1'), look), null);
  assert.ok(layerSrc(catalog.itemById.get('torso_leinenbluse_1'), resolveLook({ figur: 'erste' })));
  // the event that would put it on is left out
  const put = replay([...events, { ...ev('equip', { slot: 'torso', inst: 'x1' }, 0.3) }], catalog, DAY, T0 + H);
  assert.equal(put.world.equipped.torso, 'start:torso_leinenhemd_1');
});

test('the table: every piece found on the way has a drawing and an icon for each figure it fits, and no ability', () => {
  const found = catalog.equipment.filter((i) => i.herkunft.includes('fund'));
  assert.ok(found.length >= 50, String(found.length));
  // all come in colours of their own, except the football jerseys (always as drawn)
  assert.deepEqual(found.filter((i) => !i.faerbbar).map((i) => i.id), ['torso_trikotmitderacht_2', 'torso_trikotmitdernull_2', 'beine_steppenrock_1']);
  for (const item of found) {
    assert.deepEqual(item.effekt, {}, item.id);
    assert.equal(item.faehigkeit, null, item.id);
    for (const figur of item.passt) {
      const look = resolveLook({ figur });
      assert.ok(layerSrc(item, look), `${item.id} ${figur}`);
      assert.ok(iconSrc(item, look), `${item.id} ${figur} icon`);
    }
  }
  // the second figure finds tops, trousers, shoes, gloves and the Fliegerbrille too
  const second = new Set(found.filter((i) => fits(i, 'zweite')).map((i) => i.slot));
  assert.deepEqual([...second].sort(), ['beine', 'handschuhe', 'kopf', 'schuhe', 'torso']);
});
