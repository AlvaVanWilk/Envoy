// Loads the exercise and equipment catalogs. Both JSON files are generated
// from the spreadsheets in data/ by tools/convert_data.py.

import { DATA_FILES, STAT_IDS } from './config.js';

export function buildCatalog(exerciseData, equipmentData) {
  const exercises = exerciseData.exercises || [];
  const equipment = equipmentData.equipment || [];
  const maxIntensity = {};
  for (const stat of STAT_IDS) {
    const levels = exercises.filter((x) => x.stat === stat).map((x) => x.stufe);
    maxIntensity[stat] = levels.length > 0 ? Math.max(...levels) : 1;
  }
  return {
    exercises,
    equipment,
    maxIntensity,
    exerciseById: new Map(exercises.map((x) => [x.id, x])),
    itemById: new Map(equipment.map((x) => [x.id, x])),
    generated: exerciseData.generated || null,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

export async function loadCatalog() {
  const [exerciseData, equipmentData] = await Promise.all([
    fetchJson(DATA_FILES.exercises),
    fetchJson(DATA_FILES.equipment),
  ]);
  return buildCatalog(exerciseData, equipmentData);
}
