// Fixed values of the game. Everything the rules depend on lives here,
// so it can be checked in one place against docs/spezifikation.md.

export const APP_VERSION = '5.4.0';

// Pictures are asked for with the version of the app, so after an update a
// device fetches a new drawing instead of showing an old copy it kept.
export const versioned = (path) => (path ? `${path}?v=${APP_VERSION}` : path);

// The four stats, in display order. `area` is the real-life daily task.
export const STATS = [
  { id: 'kraft',         name: 'Kraft',         area: 'Tiefenmuskulatur' },
  { id: 'ausdauer',      name: 'Ausdauer',      area: 'Treppe' },
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

// What a task brings: 14 to 28 XP, after its size (see the table of exercises).
export const XP_MIN = 14;
export const XP_MAX = 28;

// The stage of each exercise: up after two good runs in a row, down after two
// too hard in a row. What counts as good or too hard follows from the answer
// after the exercise (see ANSWERS).
export const INTENSITY_UP_AFTER = 2;
export const INTENSITY_DOWN_AFTER = 2;
// After every 7 missed days in a row each exercise of the area goes down one stage.
export const INTENSITY_DOWN_AFTER_MISSED_DAYS = 7;

// Krankheitsmodus: every exercise at stage 1; one that has only one stage
// takes this share of its time. Such a task brings XP_MIN.
export const SICK_TIME_SHARE = 0.5;

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

// The answers to the question after an exercise (column `antwort` of the
// table) and how a run counts for its stage: good, neither, or too hard.
export const ANSWERS = {
  'ja-nein': [
    { id: 'ja', label: 'Ja', result: 'good' },
    { id: 'nein', label: 'Nein', result: 'neutral' },
  ],
  anstrengung: [
    { id: 'locker', label: 'Locker', result: 'good' },
    { id: 'fordernd', label: 'Gut fordernd', result: 'neutral' },
    { id: 'zuviel', label: 'Zu viel', result: 'hard' },
  ],
};
// „Das war heute zu viel“ on the card: too hard, for every exercise of the unit.
export const TOO_MUCH = 'zuviel';

// The guided timer: time to get ready before the first exercise, and to
// change to the next one (seconds), per area.
export const TIMER_PREP = { kraft: 10, ausdauer: 5, beweglichkeit: 10, gelassenheit: 0 };
export const TIMER_SWITCH = 10;

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

// Energie (called stamina in the code): what everything the Envoy does costs.
// The bar is 10 per level of the Ausdauer stat, so a new Envoy has 10. It
// refills in about 8 hours, faster with Gelassenheit.
export const STAMINA_BASE = 0;
export const STAMINA_PER_AUSDAUER = 10;
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
// Pilzholz and Stein lie in the Vorrat, not in the backpack: this many of
// each while the camp has no Steinlager or Pilzlager, then what the store holds.
export const MATERIAL_WITHOUT_STORE = 10;

// Gathering on the Trümmerfeld (see world/run.js): every point of Energie is a
// minute of work and brings GATHER_BASE pieces, plus one more for every one of
// GATHER_DICE dice that succeeds. The chance of a die is GATHER_CHANCE at level 1
// of the stat (Kraft for Stein, Beweglichkeit for Pilzholz) and rises with it.
// Never less than GATHER_BASE per Energie: nothing fails.
export const GATHER_BASE = 2;
export const GATHER_DICE = 2;
export const GATHER_CHANCE = 0.25;
export const GATHER_CHANCE_PER_LEVEL = 0.015;
export const GATHER_CHANCE_MAX = 0.9;
export const GATHER_STATS = { stein: 'kraft', pilzholz: 'beweglichkeit' };

// Where the camp lies, for the time of day in its picture (middle of Germany).
export const CAMP_LATITUDE = 51;
export const CAMP_LONGITUDE = 10;
export const ENCOUNTER_CHANCE = 0.55;                  // per wild place and day
export const ENCOUNTER_COST = 3;                        // stamina on site
export const TRADER_OFFERS = 5;

// Plans for Deko (see world/plans.js). A chance to find one: every 10
// minutes the Envoy spends at the place where it lies, every spirit he meets,
// or every day at the trader. On average a plan takes this many chances; it is
// there for sure after PLAN_SURE_FACTOR times as many. Searching for a plan
// begins once the camp has reached the stage of its Deko.
export const PLAN_CHANCE_MINUTES = 10;
export const PLAN_CHANCES = { selten: 6, 'sehr selten': 12, kostbar: 24 };
export const PLAN_SURE_FACTOR = 2;
export const SELL_SHARE = 1 / 3;
