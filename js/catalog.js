// Loads the catalogs. The JSON files are generated from the spreadsheets
// in data/ by tools/convert_data.py.

import { DATA_FILES, STAT_IDS, versioned } from './config.js';

const EMPTY_WORLD = { places: [], monsters: [], quests: [], camp: { stages: [], facilities: [], pictures: {}, layers: [] }, deko: [] };

// The picture fields of a list, with the app version added (see versioned).
function withVersions(list, fields) {
  return list.map((entry) => {
    const copy = { ...entry };
    for (const field of fields) if (copy[field]) copy[field] = versioned(copy[field]);
    // the other figures' own versions: { zweite: path }; a cut-out of the camp picture by time of day: { tag: path }
    for (const field of ['figuren', 'icons', 'bilder']) {
      if (copy[field]) copy[field] = Object.fromEntries(Object.entries(copy[field]).map(([f, path]) => [f, versioned(path)]));
    }
    return copy;
  });
}

// Each area is one unit: its exercises in the order of `teil`, each with its
// stages (the rows of the table, by `stufe`).
// -> { kraft: [{ key, teil, stages: [row, …] }, …], … }
function unitsOf(exercises) {
  const units = {};
  for (const stat of STAT_IDS) {
    const byKey = new Map();
    for (const row of exercises.filter((x) => x.stat === stat)) {
      if (!byKey.has(row.uebung)) byKey.set(row.uebung, { key: row.uebung, teil: row.teil, stages: [] });
      byKey.get(row.uebung).stages.push(row);
    }
    for (const exercise of byKey.values()) exercise.stages.sort((a, b) => a.stufe - b.stufe);
    units[stat] = [...byKey.values()].sort((a, b) => a.teil - b.teil);
  }
  return units;
}

export function buildCatalog(exerciseData, equipmentData, worldData = EMPTY_WORLD) {
  const exercises = withVersions(exerciseData.exercises || [], []);
  const equipment = withVersions(equipmentData.equipment || [], ['figur', 'icon']);
  const given = { ...EMPTY_WORLD, ...worldData };
  const camp = { stages: [], facilities: [], pictures: {}, layers: [], ...given.camp };
  const world = {
    ...given,
    monsters: withVersions(given.monsters, ['bild']),
    camp: { ...camp, layers: withVersions(camp.layers, ['bild']) },
    deko: withVersions(given.deko || [], ['icon', 'bild']),
  };
  const byId = (list) => new Map(list.map((x) => [x.id, x]));
  return {
    exercises,
    units: unitsOf(exercises),
    equipment,
    exerciseById: byId(exercises),
    itemById: byId(equipment),
    places: world.places,
    placeById: byId(world.places),
    monsters: world.monsters,
    monsterById: byId(world.monsters),
    quests: world.quests,
    questById: byId(world.quests),
    camp: world.camp,
    deko: world.deko,
    dekoById: byId(world.deko),
    generated: exerciseData.generated || null,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

export async function loadCatalog() {
  const [exerciseData, equipmentData, worldData] = await Promise.all([
    fetchJson(DATA_FILES.exercises),
    fetchJson(DATA_FILES.equipment),
    fetchJson(DATA_FILES.world),
  ]);
  return buildCatalog(exerciseData, equipmentData, worldData);
}
