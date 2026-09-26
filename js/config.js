// Fixed values of the game. Everything the rules depend on lives here,
// so it can be checked in one place against docs/spezifikation.md.

export const APP_VERSION = '3.0.0';

// The four stats, in display order. `area` is the real-life daily task.
export const STATS = [
  { id: 'kraft',         name: 'Kraft',         area: 'Tiefenmuskulatur' },
  { id: 'ausdauer',      name: 'Ausdauer',      area: 'Spazieren, Treppe, Rad' },
  { id: 'beweglichkeit', name: 'Beweglichkeit', area: 'Stretching und Mobility' },
  { id: 'gelassenheit',  name: 'Gelassenheit',  area: 'Entspannung' },
];

export const STAT_IDS = STATS.map((s) => s.id);

export const STAT_MIN_LEVEL = 1;
export const STAT_MAX_LEVEL = 100;

// Malus per stat and missed day (day 1 = first missed day in a row).
export const MALUS_GRACE_DAYS = 1;         // day 1: nothing
export const MALUS_SMALL_UNTIL_DAY = 7;    // days 2..7: small factor
export const MALUS_SMALL_FACTOR = 0.25;
export const MALUS_FULL_FACTOR = 1.0;      // from day 8
export const MALUS_AVERAGE_WINDOW = 7;     // last seven active days

// Floor: 60 % of the highest level ever reached.
export const FLOOR_SHARE = 0.6;

// Exercise intensity: up after three good runs in a row, down after two too hard.
export const INTENSITY_UP_AFTER = 3;
export const INTENSITY_DOWN_AFTER = 2;
// With a measured value: from 90 % of the target a run counts as good,
// below 70 % as too hard, in between as neither.
export const RATIO_GOOD = 0.9;
export const RATIO_HARD = 0.7;
// After every 7 missed days in a row the intensity goes down one level.
export const INTENSITY_DOWN_AFTER_MISSED_DAYS = 7;

// A day starts at 03:00 local time, so a late evening session still
// counts for the day it belongs to.
export const DAY_START_HOUR = 3;

// Equipment slots. `layer` is the drawing order on the paperdoll,
// back to front. The base figure sits between cloak and legs.
// There is no weapon slot: the Envoy fights unarmed, the hand wraps
// take that role.
export const SLOTS = [
  { id: 'umhang',     name: 'Umhang',       short: 'Umhang', layer: 1 },
  { id: 'beine',      name: 'Beinkleidung', short: 'Beine',  layer: 3 },
  { id: 'schuhe',     name: 'Schuhe',       short: 'Schuhe', layer: 4 },
  { id: 'torso',      name: 'Torso',        short: 'Torso',  layer: 5 },
  { id: 'handschuhe', name: 'Handwickel',   short: 'Hände',  layer: 6 },
  { id: 'kopf',       name: 'Kopf',         short: 'Kopf',   layer: 7 },
];

export const BASE_FIGURE_LAYER = 2;
export const BASE_FIGURE_FILE = 'assets/figur/basisfigur.png';

export const SLOT_IDS = SLOTS.map((s) => s.id);

// Feedback after an exercise without a measured value. It is only asked
// the first time an exercise is done and after the intensity changed.
export const FEEDBACK = [
  { id: 'leicht',  label: 'Leicht',  hard: false },
  { id: 'passend', label: 'Passend', hard: false },
  { id: 'zuviel',  label: 'Zu viel', hard: true },
];

// Values that must be entered after an exercise that has one.
export const MEASUREMENTS = {
  strecke_km:     { question: 'Welche Strecke?',         unit: 'km',   decimals: true },
  stockwerke:     { question: 'Wie viele Stockwerke hinauf?', unit: 'Stockwerke', decimals: false },
  haltezeit_s:    { question: 'Längste Haltezeit?',      unit: 'Sek.', decimals: false },
  wiederholungen: { question: 'Wie viele Wiederholungen?', unit: '',   decimals: false },
  dauer_min:      { question: 'Wie lange?',              unit: 'Min.', decimals: false },
};

export const DATA_FILES = {
  exercises: 'data/uebungen.json',
  equipment: 'data/ausruestung.json',
  world: 'data/welt.json',
};

export const SYNC_ENDPOINT = 'sync.php';

// --- world ---------------------------------------------------------------

// Currency and materials. The world is stony, broken and ethereal.
export const CURRENCY = 'Äther';
export const MATERIALS = {
  aether: 'Äther',   // what remains when a spirit dissolves
  quarz: 'Quarz',    // clear crystal from the rubble, for light and structure
  stein: 'Stein',    // blocks from old ruins, for walls
};

// Ausdauerleiste: size from the Ausdauer stat, refills in about 8 hours,
// faster with Gelassenheit and a comfortable home.
export const STAMINA_BASE = 10;
export const STAMINA_PER_AUSDAUER = 2;
export const STAMINA_REFILL_HOURS = 8;
export const STAMINA_BONUS_PER_GELASSENHEIT = 0.03;   // +3 % speed per level
export const STAMINA_REST_TASK_SHARE = 0.5;           // Gelassenheit task: half a bar

// Expeditions start and end at the camp. Map coordinates are percent;
// x counts 1.5 because the map is wider than high.
export const MAP_ASPECT = 1.5;
export const TRAVEL_UNITS_PER_STAMINA = 20;           // stamina per way
export const TRAVEL_MINUTES_PER_UNIT = 0.25;          // real minutes per way
export const TRAVEL_MIN_MINUTES = 2;
export const TRAVEL_SPEEDUP_PER_AUSDAUER = 0.03;      // faster walking with Ausdauer
export const OVERLOAD_TRAVEL_EXTRA = 1;               // over-full backpack: +1 per way

// Time on site: every level of the stats named under `tempo` shortens it,
// at most to half.
export const SPEEDUP_PER_LEVEL = 0.04;
export const FASTEST_SHARE = 0.5;
export const FIGHT_MINUTES = 2;                       // per fight
export const FIGHT_MINUTES_PER_ROUND = 1.2;
export const YIELD_PER_LEVEL = 0.05;                  // more Äther from exploring

// Nobody fails. A spirit that is too strong is driven off (less loot);
// in a cave the Envoy goes on while enough life is left.
export const DRIVEN_LOOT_SHARE = 0.5;
export const CAVE_RETREAT_SHARE = 0.35;

export const BACKPACK_SIZE = 8;
export const ENCOUNTER_CHANCE = 0.55;                  // per wild place and day
export const ENCOUNTER_COST = 2;
export const ENCOUNTER_MINUTES = 5;
export const TRADER_OFFERS = 5;
export const SELL_SHARE = 1 / 3;
