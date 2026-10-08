// The camp: its stage, its four facilities and its Deko.
//   stage 0   a bare place on the Trümmerfeld
//   stage 1   Provisorisches Lager, with the Lagerfeuer (built by the first quest)
//   stage 2…  raised by „Lager aufwerten“ once the Hygge is enough (sheet Lagerstufen)
// The facilities Steinlager, Pilzlager, Aufbewahrung and Schlafplatz are
// built in levels, each with its own name (Steinstapel, Steinpferch, …). A
// level can only be built once the camp has reached the stage the table names.
// Deko is built from a plan (see plans.js): one plan of a stage is there as
// soon as the stage is reached, the others are found. Deko stays when the
// camp is raised.
// Hygge is what the facilities and the built Deko give together.
// Everything here is built like a quest at the camp: material, Energie and
// its time.
//
// world.camp = { stage, facilities: { steinlager: level, … }, deko: { id: true }, reached: { stage: day } }
//   reached: the day each stage was reached (the trader's plans count from then)

import { DEKO_REFUND_SHARE } from '../config.js';

// The place of the camp on the map (its quests need no way).
export const CAMP_PLACE = 'lager';

export const FACILITY_IDS = ['steinlager', 'pilzlager', 'aufbewahrung', 'schlafplatz'];

export const emptyCamp = () => ({ stage: 0, facilities: {}, deko: {}, reached: {} });

export const facilityRow = (catalog, id, level) => catalog.camp.facilities.find((f) => f.id === id && f.stufe === level) || null;
export const facilityLevel = (world, id) => world.camp.facilities[id] || 0;
export const stageRow = (catalog, stage) => catalog.camp.stages.find((s) => s.stufe === stage) || null;
export const dekoBuilt = (world, id) => Boolean(world.camp.deko?.[id]);

// What taking a Deko down gives back: { pilzholz, stein } (see DEKO_REFUND_SHARE).
export const dekoRefund = (row) => Object.fromEntries(Object.entries(row.cost).map(([k, v]) => [k, Math.floor(v * DEKO_REFUND_SHARE)]));

// The row of the facility's level now, or null if it is not built.
export function facilityNow(world, catalog, id) {
  const level = facilityLevel(world, id);
  return level > 0 ? facilityRow(catalog, id, level) : null;
}

// What all facilities and the built Deko give together.
export function hygge(world, catalog) {
  const facilities = FACILITY_IDS.reduce((sum, id) => sum + (facilityNow(world, catalog, id)?.hygge || 0), 0);
  const deko = catalog.deko.reduce((sum, d) => sum + (dekoBuilt(world, d.id) ? d.hygge : 0), 0);
  return facilities + deko;
}

// { stage, name, hygge, need, ready, next }: need = Hygge for the next stage,
// null while there is no camp or on the highest stage; ready = the camp has
// enough of it; next = the row of the next stage (null on the highest).
export function campStatus(world, catalog) {
  const stage = world.camp.stage;
  const row = stageRow(catalog, stage);
  const next = stage > 0 ? stageRow(catalog, stage + 1) : null;
  const have = hygge(world, catalog);
  const need = row && next ? row.hyggeBisNaechste : null;
  return { stage, name: row ? row.name : null, hygge: have, need, ready: need !== null && have >= need, next };
}

// What a level of a facility does, in a few words.
export function facilityEffect(row) {
  if (row.id === 'steinlager') return `Fasst ${row.kapazitaet} Steine`;
  if (row.id === 'pilzlager') return `Fasst ${row.kapazitaet} Pilzholz`;
  if (row.id === 'aufbewahrung') return `${row.kapazitaet} Plätze in der Aufbewahrung, für Gegenstände und Kleidung`;
  if (row.id === 'schlafplatz') return `Morgens ${row.bonus} % mehr Energie, einmal am Tag`;
  return '';
}

// Something built at the camp, as a quest: it costs material and Energie
// (10 seconds for each) and unlocks `feature` (see worldstate.js).
function buildQuest({ id, name, text, conditions, cost, energie, feature }) {
  const consumes = {};
  if (cost.pilzholz > 0) consumes.pilzholz = cost.pilzholz;
  if (cost.stein > 0) consumes.stein = cost.stein;
  return {
    id,
    name,
    place: CAMP_PLACE,
    kind: 'bauen',
    text,
    monsters: [],
    conditions,
    speedStats: [],
    yieldStats: [],
    consumes,
    cost: energie,
    reward: { splitter: [0, 0], pilzholz: [0, 0], stein: [0, 0], items: [], plans: [], unlocks: [feature], rest: false },
    repeatable: false,
    cooldown: 0,
    active: true,
  };
}

// A level of a facility.
export function facilityQuest(row) {
  return {
    ...buildQuest({
      id: `bau:${row.id}:${row.stufe}`,
      name: row.stufe === 1 ? `${row.name} errichten` : `${row.name} bauen`,
      text: row.text,
      conditions: [{ type: 'camp', min: row.lagerstufe }],
      cost: row.cost,
      energie: row.energie,
      feature: `${row.id}:${row.stufe}`,
    }),
    facility: row.id,
    level: row.stufe,
  };
}

// The next level of each facility that is not built yet.
export function facilityQuests(world, catalog) {
  return FACILITY_IDS
    .map((id) => facilityRow(catalog, id, facilityLevel(world, id) + 1))
    .filter(Boolean)
    .map(facilityQuest);
}

// Raising the camp to stage `target`: the Hygge of the stage before must be
// enough, and it costs what that row of the table says.
export function upgradeQuest(catalog, target) {
  const from = stageRow(catalog, target - 1);
  const to = stageRow(catalog, target);
  if (!from || !to || !from.upgrade) return null;
  return {
    ...buildQuest({
      id: `bau:lager:${target}`,
      name: `${to.name} bauen`,
      text: to.text,
      conditions: [{ type: 'camp', min: target - 1 }, { type: 'hygge', min: from.hyggeBisNaechste }],
      cost: from.upgrade.cost,
      energie: from.upgrade.energie,
      feature: `lager:${target}`,
    }),
    upgrade: target,
  };
}

// The quest to raise the camp one stage, or null on the highest stage (or before the fire).
export function nextUpgrade(world, catalog) {
  return world.camp.stage > 0 ? upgradeQuest(catalog, world.camp.stage + 1) : null;
}

// Building one Deko. It needs its plan (see plans.js).
export function dekoQuest(row) {
  return {
    ...buildQuest({
      id: `bau:deko:${row.id}`,
      name: `${row.name} bauen`,
      text: row.text,
      conditions: [{ type: 'camp', min: row.lagerstufe }, { type: 'plan', id: row.id }],
      cost: row.cost,
      energie: row.energie,
      feature: `deko:${row.id}`,
    }),
    deko: row.id,
  };
}

// The Deko of the stages the camp has reached (or of `stage`), in the order of the table.
export function dekoOfReachedStages(world, catalog, stage = world.camp.stage) {
  return catalog.deko.filter((d) => d.lagerstufe <= stage);
}

// A quest at the camp by its id: bau:<facility>:<level>, bau:lager:<stage>, bau:deko:<id>.
export function campQuestById(catalog, questId) {
  const m = /^bau:([a-z]+):([a-z0-9-]+)$/.exec(questId);
  if (!m) return null;
  if (m[1] === 'lager') return upgradeQuest(catalog, Number(m[2]));
  if (m[1] === 'deko') {
    const row = catalog.dekoById.get(m[2]);
    return row ? dekoQuest(row) : null;
  }
  const row = facilityRow(catalog, m[1], Number(m[2]));
  return row ? facilityQuest(row) : null;
}
