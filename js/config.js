// Fixed values of the game. Everything the rules depend on lives here,
// so it can be checked in one place against docs/spezifikation.md.

export const APP_VERSION = '1.0.0';

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

// A day starts at 03:00 local time, so a late evening session still
// counts for the day it belongs to.
export const DAY_START_HOUR = 3;

// Equipment slots. `layer` is the drawing order on the paperdoll,
// back to front. The base figure sits between cloak and legs.
// There is no weapon slot: the Envoy fights unarmed.
export const SLOTS = [
  { id: 'umhang',     name: 'Umhang',         layer: 1 },
  { id: 'beine',      name: 'Beinkleidung',   layer: 3 },
  { id: 'schuhe',     name: 'Schuhe',         layer: 4 },
  { id: 'torso',      name: 'Torso',          layer: 5 },
  { id: 'guertel',    name: 'Gürtel',         layer: 6 },
  { id: 'handschuhe', name: 'Handschuhe',     layer: 7 },
  { id: 'schultern',  name: 'Schulterstücke', layer: 8 },
  { id: 'kopf',       name: 'Kopf',           layer: 9 },
];

export const BASE_FIGURE_LAYER = 2;
export const BASE_FIGURE_FILE = 'assets/figur/basisfigur.png';

export const SLOT_IDS = SLOTS.map((s) => s.id);

// Feedback after an exercise. `hard` lowers the intensity.
export const FEEDBACK = [
  { id: 'leicht',  label: 'Leicht',  hard: false },
  { id: 'passend', label: 'Passend', hard: false },
  { id: 'zuviel',  label: 'Zu viel', hard: true },
];

// Values that can be entered by hand after an exercise.
export const MEASUREMENTS = {
  dauer_min:      { label: 'Dauer',          unit: 'Min.',  step: 1 },
  strecke_km:     { label: 'Strecke',        unit: 'km',    step: 0.1 },
  tempo_kmh:      { label: 'Tempo',          unit: 'km/h',  step: 0.1 },
  stockwerke:     { label: 'Stockwerke',     unit: '',      step: 1 },
  haltezeit_s:    { label: 'Haltezeit',      unit: 'Sek.',  step: 1 },
  wiederholungen: { label: 'Wiederholungen', unit: '',      step: 1 },
};

export const DATA_FILES = {
  exercises: 'data/uebungen.json',
  equipment: 'data/ausruestung.json',
};

export const SYNC_ENDPOINT = 'sync.php';
