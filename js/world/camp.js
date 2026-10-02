// The camp: its stage and its four facilities.
//   stage 0   a bare place on the Trümmerfeld
//   stage 1   Lagerfeuer (built by the first quest)
// The facilities Steinlager, Pilzlager, Aufbewahrung (on its first level
// called Krempelplatz) and Schlafplatz are
// built in levels. What a level costs and gives stands in the table
// (data/welt.xlsx, sheet Einrichtungen); a level of a facility can only be
// built once the camp has reached the stage the table names. Each level adds
// Hygge; when the Hygge is high enough, the camp can grow to the next stage
// (the extension itself is not built yet).
//
// world.camp = { stage, facilities: { steinlager: level, … } }

// The place of the camp on the map (its quests need no way).
export const CAMP_PLACE = 'lager';

export const FACILITY_IDS = ['steinlager', 'pilzlager', 'aufbewahrung', 'schlafplatz'];

export const emptyCamp = () => ({ stage: 0, facilities: {} });

export const facilityRow = (catalog, id, level) => catalog.camp.facilities.find((f) => f.id === id && f.stufe === level) || null;
export const facilityLevel = (world, id) => world.camp.facilities[id] || 0;
export const stageRow = (catalog, stage) => catalog.camp.stages.find((s) => s.stufe === stage) || null;

// The row of the facility's level now, or null if it is not built.
export function facilityNow(world, catalog, id) {
  const level = facilityLevel(world, id);
  return level > 0 ? facilityRow(catalog, id, level) : null;
}

// What all facilities give together.
export function hygge(world, catalog) {
  return FACILITY_IDS.reduce((sum, id) => sum + (facilityNow(world, catalog, id)?.hygge || 0), 0);
}

// { stage, name, hygge, need, ready }: need = Hygge for the next stage, null
// while there is no camp; ready = the camp has enough of it.
export function campStatus(world, catalog) {
  const stage = world.camp.stage;
  const row = stageRow(catalog, stage);
  const have = hygge(world, catalog);
  const need = row ? row.hyggeBisNaechste : null;
  return { stage, name: row ? row.name : null, hygge: have, need, ready: need !== null && have >= need };
}

// What a level of a facility does, in a few words.
export function facilityEffect(row) {
  if (row.id === 'steinlager') return `Fasst ${row.kapazitaet} Steine`;
  if (row.id === 'pilzlager') return `Fasst ${row.kapazitaet} Pilzholz`;
  if (row.id === 'aufbewahrung') return `${row.kapazitaet} Plätze in der Aufbewahrung, für Gegenstände und Kleidung`;
  if (row.id === 'schlafplatz') return `Morgens ${row.bonus} % mehr Energie, einmal am Tag`;
  return '';
}

// Building a level of a facility is a quest at the camp, like the Lagerfeuer:
// it costs material and Energie (which is also its minutes).
export function facilityQuest(row) {
  const cost = {};
  if (row.cost.pilzholz > 0) cost.pilzholz = row.cost.pilzholz;
  if (row.cost.stein > 0) cost.stein = row.cost.stein;
  return {
    id: `bau:${row.id}:${row.stufe}`,
    facility: row.id,
    name: row.stufe === 1 ? `${row.name} errichten` : `${row.name} ausbauen`,
    place: CAMP_PLACE,
    kind: 'bauen',
    text: row.text,
    monsters: [],
    conditions: [{ type: 'camp', min: row.lagerstufe }],
    speedStats: [],
    yieldStats: [],
    consumes: cost,
    cost: row.energie,
    reward: { splitter: [0, 0], pilzholz: [0, 0], stein: [0, 0], items: [], furniture: [], unlocks: [`${row.id}:${row.stufe}`], rest: false },
    repeatable: false,
    cooldown: 0,
    active: true,
  };
}

// The next level of each facility that is not built yet.
export function facilityQuests(world, catalog) {
  return FACILITY_IDS
    .map((id) => facilityRow(catalog, id, facilityLevel(world, id) + 1))
    .filter(Boolean)
    .map(facilityQuest);
}

export function facilityQuestById(catalog, questId) {
  const m = /^bau:([a-z]+):(\d+)$/.exec(questId);
  const row = m && facilityRow(catalog, m[1], Number(m[2]));
  return row ? facilityQuest(row) : null;
}
