// Raising the camp, the levels of the facilities, Deko and its plans.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replay } from '../js/replay.js';
import { buildCatalog } from '../js/catalog.js';
import { effects } from '../js/world/hero.js';
import { questById, questState } from '../js/world/quests.js';
import { runQuest, siteStamina } from '../js/world/run.js';
import { storeCapacity } from '../js/world/inventory.js';
import {
  campStatus, hygge, nextUpgrade, facilityNow, facilityQuests, facilityRow, dekoOfReachedStages, FACILITY_IDS,
} from '../js/world/camp.js';
import { planKnown, rollPlans, traderPlans } from '../js/world/plans.js';
import { offersFor } from '../js/world/trader.js';
import { campScene } from '../js/ui/camp.js';
import { addDays } from '../js/days.js';
import { PLAN_CHANCES, PLAN_SURE_FACTOR } from '../js/config.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url)));
const catalog = buildCatalog(read('uebungen.json'), read('ausruestung.json'), read('welt.json'));

const DAY = '2026-05-01';
const T0 = Date.parse(`${DAY}T08:00:00`);
const H = 3600000;
let n = 0;
function ev(type, fields, hoursAfter = 0, day = DAY) {
  n += 1;
  return { id: `d-${n}`, t: T0 + hoursAfter * H + n, d: day, dev: 't', type, ...fields };
}
function ctxOf(state) {
  return {
    catalog, world: state.world, stats: state.stats, statsAtDayStart: state.statsAtDayStart,
    fx: effects(state.world, catalog), totals: state.totals, day: state.today,
  };
}
// What a quest brought, given right away (an expedition in the old form, all at once).
function gift(reward, hoursAfter = 0) {
  return ev('expedition', { q: 'q-test', place: 'lager', title: 'x', out: 0, act: 1, back: 0, cost: 0,
    outcome: { kind: 'sammeln', fights: [], defeated: 0, total: 0, cleared: true, minutes: 1, consumed: {},
      reward: { splitter: 0, pilzholz: 0, stein: 0, things: [], plans: [], unlocks: [], rest: false, ...reward } } }, hoursAfter);
}
// An action like the app writes it.
function action(events, questId, hoursAfter) {
  const s = replay(events, catalog, DAY, T0 + hoursAfter * H);
  const c = ctxOf(s);
  const quest = questById(questId, c);
  const e = ev('expedition', { q: quest.id, place: quest.place, title: quest.name }, hoursAfter);
  const outcome = runQuest(quest, c, e.id);
  return Object.assign(e, { least: siteStamina(quest, c.stats), outcome });
}
const at = (events, hours) => replay(events, catalog, DAY, T0 + hours * H);
const ALL_LEVEL_1 = ['lagerfeuer', 'steinlager:1', 'pilzlager:1', 'aufbewahrung:1', 'schlafplatz:1'];

test('five stages, from the Provisorisches Lager to the Steinhäuschen', () => {
  assert.deepEqual(catalog.camp.stages.map((s) => s.name),
    ['Provisorisches Lager', 'Unterstand', 'Wackelige Hütte', 'Stabile Hütte', 'Steinhäuschen']);
  assert.deepEqual(catalog.camp.stages.map((s) => s.hyggeBisNaechste), [5, 14, 36, 90, null]);
});

test('the camp is raised once the Hygge is enough; it costs material and Energie in one go', () => {
  const base = [gift({ unlocks: ALL_LEVEL_1 })];
  const s0 = at(base, 0.5);
  const status = campStatus(s0.world, catalog);
  assert.equal(status.hygge, 7);
  assert.equal(status.ready, true);
  const quest = nextUpgrade(s0.world, catalog);
  assert.equal(quest.id, 'bau:lager:2');
  assert.deepEqual(quest.consumes, { pilzholz: 20, stein: 20 });
  assert.equal(quest.cost, 22);
  assert.deepEqual(questState(quest, ctxOf(s0)).missing, ['20 Pilzholz', '20 Stein']);

  // material, and Energie beyond the bar of a new Envoy (like a morning on the Schlafplatz)
  const ready = [...base, gift({ stein: 20, pilzholz: 20 }, 0.2), ev('test', { mehrEnergie: 20 }, 0.3)];
  assert.equal(questState(quest, ctxOf(at(ready, 0.4))).status, 'open');
  const events = [...ready, action(ready, 'bau:lager:2', 0.4)];
  const s = at(events, 1.5);
  assert.equal(s.world.camp.stage, 2);
  assert.equal(s.world.camp.reached[2], DAY);
  assert.deepEqual(s.world.purse, { splitter: 0, pilzholz: 0, stein: 0 });
  assert.equal(campStatus(s.world, catalog).name, 'Unterstand');
  assert.equal(questState(quest, ctxOf(s)).status, 'done');
});

test('without enough Hygge the camp cannot be raised', () => {
  const s = at([gift({ unlocks: ['lagerfeuer', 'steinlager:1'] })], 0.5);
  const quest = nextUpgrade(s.world, catalog);
  assert.ok(questState(quest, ctxOf(s)).missing.includes('5 Hygge'));
  assert.equal(campStatus(s.world, catalog).ready, false);
});

test('a level of a facility replaces the one before, with its own name, Hygge and room', () => {
  const s1 = at([gift({ unlocks: ALL_LEVEL_1 })], 0.5);
  assert.equal(facilityNow(s1.world, catalog, 'steinlager').name, 'Steinstapel');
  const next = facilityQuests(s1.world, catalog).find((q) => q.facility === 'steinlager');
  assert.equal(next.id, 'bau:steinlager:2');
  assert.equal(next.name, 'Steinpferch bauen');
  assert.deepEqual(questState(next, ctxOf(s1)).missing.slice(0, 1), ['Lager Stufe 2 (Unterstand)']);

  const s2 = at([gift({ unlocks: [...ALL_LEVEL_1, 'lager:2', 'steinlager:2'] })], 0.5);
  assert.equal(facilityNow(s2.world, catalog, 'steinlager').name, 'Steinpferch');
  assert.equal(storeCapacity(s2.world, catalog, 'stein'), 50);
  assert.equal(hygge(s2.world, catalog), 8);   // 2 + 1 + 2 + 3, not 1 + 2 more
});

test('the stores end at level 3, the Aufbewahrung at 4, the Schlafplatz at 5; each level fits into the stores of the one before', () => {
  const levels = (id) => catalog.camp.facilities.filter((f) => f.id === id).map((f) => f.name);
  assert.deepEqual(levels('steinlager'), ['Steinstapel', 'Steinpferch', 'Steinschuppen']);
  assert.deepEqual(levels('pilzlager'), ['Pilzholzstapel', 'Pilzholzgestell', 'Pilzholzschuppen']);
  assert.deepEqual(levels('aufbewahrung'), ['Krempelplatz', 'Kiste', 'Truhe', 'Kleiderschrank']);
  assert.deepEqual(levels('schlafplatz'), ['Raspelnest', 'Pilzmatte', 'Schlafpodest', 'Bett', 'Himmelbett']);
  for (const row of catalog.camp.facilities.filter((f) => f.stufe > 1)) {
    const store = Math.max(10, ...['steinlager', 'pilzlager'].map((id) => {
      let level = Math.min(row.lagerstufe - 1, 3);
      while (level > 0 && !facilityRow(catalog, id, level)) level -= 1;
      return facilityRow(catalog, id, level)?.kapazitaet || 0;
    }));
    assert.ok(row.cost.pilzholz <= store && row.cost.stein <= store, `${row.name}: ${JSON.stringify(row.cost)} > ${store}`);
  }
});

// What the camp can have at most on a stage: every facility as far as the
// stage allows, and every Deko of the stages reached, if `found` (else only
// those there from the start).
function most(stage, found) {
  const facilities = FACILITY_IDS.reduce((sum, id) => {
    const rows = catalog.camp.facilities.filter((f) => f.id === id && f.lagerstufe <= stage);
    return sum + Math.max(0, ...rows.map((r) => r.hygge));
  }, 0);
  const deko = catalog.deko.filter((d) => d.lagerstufe <= stage && (found || d.fundort === 'start'));
  return facilities + deko.reduce((sum, d) => sum + d.hygge, 0);
}

test('from stage 2 on the facilities alone are not enough: Deko has to be built, and from stage 3 on found', () => {
  const need = (stage) => catalog.camp.stages[stage - 1].hyggeBisNaechste;
  assert.ok(most(1, false) >= need(1));
  // stage 2: the one Deko there from the start has to be built
  assert.ok(most(2, false) >= need(2));
  assert.ok(most(2, false) - 4 < need(2));
  // stage 3 and 4: plans have to be found
  assert.ok(most(3, false) < need(3));
  assert.ok(most(3, true) >= need(3));
  assert.ok(most(4, false) < need(4));
  assert.ok(most(4, true) >= need(4));
  // one Deko from the start on stage 2, four or five to find on stage 3, around ten on stage 4
  const findable = (stage) => catalog.deko.filter((d) => d.lagerstufe === stage && d.fundort !== 'start').length;
  assert.equal(catalog.deko.filter((d) => d.lagerstufe === 2).length, 1);
  assert.ok(findable(3) >= 4 && findable(3) <= 5);
  assert.ok(findable(4) >= 8 && findable(4) <= 10);
});

test('Deko gives at least as much Hygge as the Schlafplatz of its stage, more than a store or the Aufbewahrung', () => {
  for (const d of catalog.deko) {
    const at = (id) => Math.max(0, ...catalog.camp.facilities.filter((f) => f.id === id && f.lagerstufe <= d.lagerstufe).map((f) => f.hygge));
    assert.ok(d.hygge >= at('schlafplatz'), `${d.name}`);
    assert.ok(d.hygge > at('steinlager') && d.hygge > at('aufbewahrung'), `${d.name}`);
  }
});

test('Deko: one plan of a stage is there at once, the others have to be found; built Deko stays', () => {
  const s2 = at([gift({ unlocks: [...ALL_LEVEL_1, 'lager:2'] })], 0.5);
  assert.deepEqual(dekoOfReachedStages(s2.world, catalog).map((d) => d.id), ['pilzkappenschale']);
  assert.equal(planKnown(s2.world, catalog.dekoById.get('pilzkappenschale')), true);
  const bowl = questById('bau:deko:pilzkappenschale', ctxOf(s2));
  assert.deepEqual(questState(bowl, ctxOf(s2)).missing, ['6 Pilzholz', '2 Stein']);

  const s3 = at([gift({ unlocks: [...ALL_LEVEL_1, 'lager:2', 'deko:pilzkappenschale', 'lager:3'] })], 0.5);
  assert.equal(hygge(s3.world, catalog), 7 + 4);
  const jug = questById('bau:deko:wasserkrug', ctxOf(s3));
  assert.ok(questState(jug, ctxOf(s3)).missing.includes('Plan: Wasserkrug'));
  assert.equal(planKnown(s3.world, catalog.dekoById.get('steinbank')), true);
});

test('plans are searched only once the camp has reached the stage of their Deko, and only where they lie', () => {
  const ufer = catalog.questById.get('q-uferkies');
  const outcome = { fights: [], stamina: 3 };
  const s2 = at([gift({ unlocks: ['lagerfeuer', 'lager:2'] })], 0.5);
  assert.deepEqual(rollPlans(ufer, ctxOf(s2), 'a', outcome).search, {});
  const s3 = at([gift({ unlocks: ['lagerfeuer', 'lager:2', 'lager:3'] })], 0.5);
  // ten minutes of work there are one chance; spirits are chances for the Windspiel
  assert.deepEqual(rollPlans(ufer, ctxOf(s3), 'a', outcome).search, { wasserkrug: ufer.cost / 10 });
  const fight = { fights: [{ monster: 'zauderling' }, { monster: 'echo' }], stamina: 6 };
  assert.deepEqual(rollPlans({ id: 'enc:x', place: 'nebelfurt', cost: 3 }, ctxOf(s3), 'a', fight).search, { windspiel: 2 });
});

test('found by chance, as rare as the table says; after twice the average chances it is there for sure', () => {
  const s3 = at([gift({ unlocks: ['lagerfeuer', 'lager:2', 'lager:3'] })], 0.5);
  const ufer = catalog.questById.get('q-uferkies');
  const outcome = { fights: [], stamina: 3 };
  const avg = PLAN_CHANCES.selten;
  let found = 0;
  const tries = 4000;
  for (let i = 0; i < tries; i += 1) if (rollPlans(ufer, ctxOf(s3), `roll${i}`, outcome).found.length > 0) found += 1;
  const expected = 1 - (1 - 1 / avg) ** (ufer.cost / 10);
  assert.ok(Math.abs(found / tries - expected) < 0.015, `${found / tries} vs ${expected}`);

  const world = structuredClone(s3.world);
  world.plans.search.wasserkrug = avg * PLAN_SURE_FACTOR - ufer.cost / 10;
  for (let i = 0; i < 20; i += 1) assert.deepEqual(rollPlans(ufer, { ...ctxOf(s3), world }, `sure${i}`, outcome).found, ['wasserkrug']);
});

test('what an action found and searched is kept when it is done, and the plan is known from then', () => {
  const start = [gift({ unlocks: [...ALL_LEVEL_1, 'lager:2', 'lager:3'] }), ev('test', { mehrEnergie: 100 }, 0.1)];
  let events = start;
  let hours = 0.2;
  let s;
  // with enough searching it is found for sure
  for (let i = 0; i < 40; i += 1) {
    events = [...events, action(events, 'q-uferkies', hours)];
    hours += 1;
    s = at(events, hours);
    if (s.world.plans.found.wasserkrug) break;
  }
  assert.equal(s.world.plans.found.wasserkrug, DAY);
  assert.ok(s.world.plans.search.wasserkrug > 0);
  assert.equal(planKnown(s.world, catalog.dekoById.get('wasserkrug')), true);
  assert.ok(s.world.reports.some((r) => r.stops.some((x) => x.outcome.reward.plans.includes('wasserkrug'))));
});

test('the trader has his plans on some days, for sure after twice the average of days; a bought plan is known', () => {
  const events = [gift({ unlocks: [...ALL_LEVEL_1, 'lager:2', 'lager:3', 'haendler'] })];
  const s = at(events, 0.5);
  const sure = addDays(DAY, PLAN_CHANCES.selten * PLAN_SURE_FACTOR);
  const offer = traderPlans(sure, { ...ctxOf(s), day: sure }).find((o) => o.id === 'teppich');
  assert.deepEqual(offer, { kind: 'plan', id: 'teppich', price: 40, offer: `${sure}:plan:teppich` });
  // before that only on some days
  let days = 0;
  for (let i = 0; i < 300; i += 1) {
    const day = addDays('2030-01-01', i);
    const world = structuredClone(s.world);
    world.camp.reached[3] = day;
    if (traderPlans(day, { ...ctxOf(s), world }).some((o) => o.id === 'teppich')) days += 1;
  }
  assert.ok(days > 25 && days < 80, `${days} of 300 days`);
  assert.ok(offersFor(sure, { ...ctxOf(s), day: sure }).some((o) => o.kind === 'plan'));

  const rich = [...events, gift({ splitter: 50 }, 0.2)];
  const bought = at([...rich, ev('buy', { offer: offer.offer, kind: 'plan', thing: 'teppich', price: 40 }, 0.6)], 1);
  assert.equal(bought.world.plans.found.teppich, DAY);
  assert.equal(bought.world.purse.splitter, 10);
  assert.equal(Object.keys(bought.world.items).filter((k) => !k.startsWith('start:')).length, 0);   // a plan is no thing
});

test('every plan to find lies where it can be searched again and again', () => {
  const repeatable = new Set(catalog.quests.filter((q) => q.repeatable).map((q) => q.id));
  const places = new Set(catalog.quests.filter((q) => q.repeatable).map((q) => q.place));
  for (const p of catalog.places.filter((x) => x.encounters)) places.add(p.id);
  for (const d of catalog.deko) {
    if (['start', 'geister', 'haendler'].includes(d.fundort)) continue;
    assert.ok(repeatable.has(d.fundort) || places.has(d.fundort), `${d.name}: ${d.fundort}`);
  }
});

test('the camp picture: the picture, then the layers in the order the user arranged them', () => {
  const world = { camp: { stage: 2, facilities: { steinlager: 1, pilzlager: 1, schlafplatz: 2 }, deko: {}, reached: {} } };
  const scene = (w, cat, phase) => campScene(w, cat, phase).map((x) => [x.src.split('?')[0], x.look]);
  // stage 2 has no picture of its own yet: the one of stage 1, on it the Unterstand,
  // the Pilzmatte, the stores, the rocks, fire and pillars cut out of the picture in between
  assert.deepEqual(scene(world, catalog, 'tag'), [
    ['assets/lager/stufe_1_tag.jpg', ''],
    ['assets/lager/gebaeude_2.png', ''],
    ['assets/lager/einrichtung_schlafplatz_2.png', ''],
    ['assets/lager/einrichtung_pilzlager_1.png', ''],
    ['assets/lager/ausschnitt_fels_mitte_tag.png', ''],
    ['assets/lager/ausschnitt_feuer_tag.png', ''],
    ['assets/lager/einrichtung_steinlager_1.png', ''],
    ['assets/lager/ausschnitt_fels_rechts_tag.png', ''],
    ['assets/lager/ausschnitt_saeule_links_tag.png', ''],
  ]);
  // at night: the night picture and its cut-outs; the drawings get its light
  assert.deepEqual(scene(world, catalog, 'nacht').map(([src, look]) => look), ['', 'light-nacht', 'light-nacht', 'light-nacht', '', '', 'light-nacht', '', '']);
  assert.ok(scene(world, catalog, 'nacht').some(([src]) => src === 'assets/lager/ausschnitt_feuer_nacht.png'));
  // where there is only a day picture, it stands in, tinted, and all on it with it
  const dayOnly = { ...catalog, camp: { ...catalog.camp, pictures: { 1: ['tag'] } } };
  assert.ok(scene(world, dayOnly, 'abend').every(([src, look]) => look === 'tint-abend'));
  // the Wackelige Hütte in two parts: the back one behind the beds, the front one in front of them
  const hut = scene({ camp: { ...world.camp, stage: 3 } }, catalog, 'tag').map(([src]) => src);
  assert.ok(hut.indexOf('assets/lager/gebaeude_3_hinten.png') < hut.indexOf('assets/lager/einrichtung_schlafplatz_2.png'));
  assert.ok(hut.indexOf('assets/lager/gebaeude_3_vorn.png') > hut.indexOf('assets/lager/einrichtung_schlafplatz_2.png'));
  // the Steinhäuschen: its stem in front of the bed; no other building with it
  const house = scene({ camp: { ...world.camp, stage: 5 } }, catalog, 'tag').map(([src]) => src);
  assert.ok(house.indexOf('assets/lager/gebaeude_5_stiel.png') > house.indexOf('assets/lager/einrichtung_schlafplatz_2.png'));
  assert.equal(house.filter((src) => src.includes('gebaeude')).length, 2);
  // a facility without a drawing of its level shows the level below
  const higher = scene({ camp: { ...world.camp, facilities: { schlafplatz: 9 } } }, catalog, 'tag').map(([src]) => src);
  assert.ok(higher.includes('assets/lager/einrichtung_schlafplatz_5.png'));
  // the rocks behind: in front only up to the Wackelige Hütte, the right one not with the Krempelplatz
  const rocks = (stage, facilities) => scene({ camp: { ...world.camp, stage, facilities } }, catalog, 'tag')
    .map(([src]) => src).filter((src) => /fels_(mitte|rechts)/.test(src));
  assert.deepEqual(rocks(3, { aufbewahrung: 3 }), ['assets/lager/ausschnitt_fels_mitte_tag.png', 'assets/lager/ausschnitt_fels_rechts_tag.png']);
  assert.deepEqual(rocks(3, { aufbewahrung: 1 }), ['assets/lager/ausschnitt_fels_mitte_tag.png']);
  assert.deepEqual(rocks(4, { aufbewahrung: 3 }), []);
  assert.deepEqual(rocks(5, {}), []);
  // before the fire: the bare picture, nothing on it
  assert.deepEqual(scene({ camp: { stage: 0, facilities: {}, deko: {}, reached: {} } }, catalog, 'tag'), [['assets/lager/stufe_0_tag.jpg', '']]);
});
