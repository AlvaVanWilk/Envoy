// Loads the catalogs. The JSON files are generated from the spreadsheets
// in data/ by tools/convert_data.py.

import { DATA_FILES, STAT_IDS, versioned } from './config.js';

const EMPTY_WORLD = { places: [], monsters: [], quests: [], camp: { stages: [], facilities: [] }, furniture: [] };

// The picture fields of a list, with the app version added (see versioned).
function withVersions(list, fields) {
  return list.map((entry) => {
    const copy = { ...entry };
    for (const field of fields) if (copy[field]) copy[field] = versioned(copy[field]);
    if (copy.figuren) copy.figuren = Object.fromEntries(Object.entries(copy.figuren).map(([f, path]) => [f, versioned(path)]));
    return copy;
  });
}

export function buildCatalog(exerciseData, equipmentData, worldData = EMPTY_WORLD) {
  const exercises = exerciseData.exercises || [];
  const equipment = withVersions(equipmentData.equipment || [], ['figur', 'icon']);
  const given = { ...EMPTY_WORLD, ...worldData };
  const world = {
    ...given,
    monsters: withVersions(given.monsters, ['bild']),
    furniture: withVersions(given.furniture, ['icon']),
  };
  const maxIntensity = {};
  for (const stat of STAT_IDS) {
    const levels = exercises.filter((x) => x.stat === stat).map((x) => x.stufe);
    maxIntensity[stat] = levels.length > 0 ? Math.max(...levels) : 1;
  }
  const byId = (list) => new Map(list.map((x) => [x.id, x]));
  return {
    exercises,
    equipment,
    maxIntensity,
    exerciseById: byId(exercises),
    itemById: byId(equipment),
    places: world.places,
    placeById: byId(world.places),
    monsters: world.monsters,
    monsterById: byId(world.monsters),
    quests: world.quests,
    questById: byId(world.quests),
    camp: world.camp,
    furniture: world.furniture,
    furnitureById: byId(world.furniture),
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
