// Fixed values of the game. Everything the rules depend on lives here,
// so it can be checked in one place against docs/spezifikation.md.

export const APP_VERSION = '4.4.0';

// Pictures are asked for with the version of the app, so after an update a
// device fetches a new drawing instead of showing an old copy it kept.
export const versioned = (path) => (path ? `${path}?v=${APP_VERSION}` : path);

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
// back to front. The base figure sits between the accessory and the legs.
// There is no weapon slot: the Envoy fights unarmed, the hand wraps
// take that role. The accessory slot holds special things: a cloak, a
// scarf, a bag; where it is drawn depends on the item (see EBENEN).
export const SLOTS = [
  { id: 'accessoire', name: 'Accessoire',   short: 'Accessoire', layer: 1 },
  { id: 'beine',      name: 'Beinkleidung', short: 'Beine',  layer: 3 },
  { id: 'schuhe',     name: 'Schuhe',       short: 'Schuhe', layer: 4 },
  { id: 'torso',      name: 'Torso',        short: 'Torso',  layer: 5 },
  { id: 'handschuhe', name: 'Handwickel',   short: 'Hände',  layer: 6 },
  { id: 'kopf',       name: 'Kopf',         short: 'Kopf',   layer: 7 },
];

export const BASE_FIGURE_LAYER = 2;

// Slots under an older name, as they may stand in stored events.
export const OLD_SLOT_NAMES = { umhang: 'accessoire' };

// Where an item is drawn when it should not lie at its slot's place
// (column `ebene` in ausruestung.xlsx). The numbers fit in between the
// layers of the slots: wide trousers over the shoes lie at 4.5, above the
// shoes (4) and below the torso (5).
export const EBENEN = [
  { id: 'hinten',           name: 'Hinter der Figur',   layer: 1 },
  { id: 'unter_hose',       name: 'Unter der Hose',     layer: 2.5 },
  { id: 'ueber_schuhen',    name: 'Über den Schuhen',   layer: 4.5 },
  { id: 'ueber_jeder_hose', name: 'Über jeder Hose',    layer: 4.7 },
  { id: 'unter_oberteil',   name: 'Unter dem Oberteil', layer: 4.9 },
  { id: 'ueber_oberteil',   name: 'Über dem Oberteil',  layer: 5.5 },
  { id: 'vorn',             name: 'Ganz vorn',          layer: 8 },
];

// The Envoy: figures to choose from when the Envoy is created, both drawn
// by the user. Each has its own folder with basisfigur.png. Clothing layers
// lie in the folder of the first figure; a figure can have its own version
// of a layer in its folder (same file name), otherwise it wears the one of
// the first.
// skin / skinShadow / hair: the colours the figure is drawn in; the app
// paints them in the chosen colours (see ui/look.js). hairZone: hair only
// occurs in this upper share of the picture. Each folder also holds
// portrait.png, the round picture at the top of the screen; portraitHairZone
// is the same share for it.
export const FIGURES = [
  { id: 'erste', name: 'Envoy mit Dutt', folder: 'assets/figur', skin: [240, 176, 128], skinShadow: [184, 128, 88], hair: [224, 192, 136], hairZone: 0.25, portraitHairZone: 0.78 },
  { id: 'zweite', name: 'Envoy mit kurzem Haar', folder: 'assets/figur/zweite', skin: [240, 176, 130], skinShadow: [182, 130, 90], hair: [190, 178, 118], hairZone: 0.25, portraitHairZone: 0.62 },
];

// Choices for skin and hair. The first of each stands for the colour a
// figure is drawn in (its own blond, its own skin), so it is never painted.
export const SKIN_TONES = [
  { id: 'pfirsich', name: 'Pfirsich', rgb: [240, 176, 128] },
  { id: 'hell', name: 'Hell', rgb: [248, 208, 180] },
  { id: 'rosig', name: 'Rosig', rgb: [236, 184, 164] },
  { id: 'oliv', name: 'Oliv', rgb: [206, 158, 112] },
  { id: 'braun', name: 'Braun', rgb: [160, 108, 70] },
  { id: 'dunkel', name: 'Dunkel', rgb: [106, 70, 48] },
];
export const HAIR_COLORS = [
  { id: 'blond', name: 'Blond', rgb: [224, 192, 136] },
  { id: 'hellblond', name: 'Hellblond', rgb: [240, 226, 188] },
  { id: 'kupfer', name: 'Kupfer', rgb: [200, 104, 52] },
  { id: 'braun', name: 'Braun', rgb: [128, 84, 52] },
  { id: 'dunkelbraun', name: 'Dunkelbraun', rgb: [74, 50, 36] },
  { id: 'schwarz', name: 'Schwarz', rgb: [44, 40, 40] },
  { id: 'grau', name: 'Grau', rgb: [184, 184, 186] },
];
export const NAME_MAX = 24;

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
export const CURRENCY = 'Bannsplitter';
export const MATERIALS = {
  splitter: 'Bannsplitter', // what remains when a spirit is banished: defeated, calmed or driven off
  pilzholz: 'Pilzholz', // stems of the giant fungi in the rubble: light, cut like wood
  stein: 'Stein',    // blocks from old ruins, for walls
};

// Ausdauerleiste: size from the Ausdauer stat, refills in about 8 hours,
// faster with Gelassenheit and a comfortable home.
export const STAMINA_BASE = 20;
export const STAMINA_PER_AUSDAUER = 4;
export const STAMINA_REFILL_HOURS = 8;
export const STAMINA_BONUS_PER_GELASSENHEIT = 0.03;   // +3 % speed per level
export const STAMINA_REST_TASK_SHARE = 0.5;           // Gelassenheit task: half a bar

// Time follows stamina: every point of stamina an expedition costs is one
// minute away from the camp. Short trips are quick; a long one costs as
// much stamina as it takes time.
export const MINUTES_PER_STAMINA = 1;

// Expeditions start and end at the camp. Map coordinates are percent;
// x counts 1.5 because the map is wider than high.
export const MAP_ASPECT = 1.5;
export const TRAVEL_UNITS_PER_STAMINA = 20;           // map distance per stamina of a way
export const TRAVEL_SPEEDUP_PER_AUSDAUER = 0.03;      // shorter ways with Ausdauer
export const OVERLOAD_TRAVEL_EXTRA = 1;               // over-full backpack: +1 per way

// Work on site: every level of the stats named under `tempo` makes it
// shorter and so cheaper, at most by half.
export const SPEEDUP_PER_LEVEL = 0.04;
export const FASTEST_SHARE = 0.5;
export const YIELD_PER_LEVEL = 0.05;                  // +5 % yield per level of the `ertrag` stats

// Nobody fails. A spirit that is too strong is driven off (less loot);
// in a cave the Envoy goes on while enough life is left.
export const DRIVEN_LOOT_SHARE = 0.5;
export const CAVE_RETREAT_SHARE = 0.35;

export const BACKPACK_SIZE = 5;
export const ENCOUNTER_CHANCE = 0.55;                  // per wild place and day
export const ENCOUNTER_COST = 3;                        // stamina on site
export const TRADER_OFFERS = 5;
export const SELL_SHARE = 1 / 3;
