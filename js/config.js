// Fixed values of the game. Everything the rules depend on lives here,
// so it can be checked in one place against docs/spezifikation.md.

export const APP_VERSION = '5.21.0';

// Pictures are asked for with the version of the app, so after an update a
// device fetches a new drawing instead of showing an old copy it kept.
export const versioned = (path) => (path ? `${path}?v=${APP_VERSION}` : path);

// The four stats, in display order. `area` is the real-life daily task.
// wirkung: what the stat does in the game, in a few words (shown when pointing at it)
export const STATS = [
  { id: 'kraft',         name: 'Kraft',         area: 'Tiefenmuskulatur',
    wirkung: 'Mehr Schaden im Kampf. Dazu mehr Stein beim Sammeln.' },
  { id: 'ausdauer',      name: 'Ausdauer',      area: 'Bewegung',
    wirkung: 'Eine größere Energie-Leiste, zehn je Level. Dazu mehr Leben im Kampf.' },
  { id: 'beweglichkeit', name: 'Beweglichkeit', area: 'Stretching und Mobility',
    wirkung: 'Besser ausweichen und treffen. Dazu mehr Pilzholz beim Sammeln.' },
  { id: 'gelassenheit',  name: 'Gelassenheit',  area: 'Entspannung',
    wirkung: 'Die Energie füllt sich schneller. Dazu Geister beruhigen und kürzere Rast in den Tiefen.' },
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
// Children (up to this age) are not asked after an exercise: every run
// counts, and after this many runs at a stage the next one comes.
export const CHILD_UNTIL = 12;
export const CHILD_UP_AFTER = 3;
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
// The undershirt of a figure (FIGURES): over the base figure, under everything worn.
export const UNDERSHIRT_LAYER = 2.2;

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
// is the same share for it. undershirt: a picture in the folder the figure
// always wears right over its skin (under the trousers), not in a slot and
// never taken off; the settings can switch it off (see paperdoll.js).
export const FIGURES = [
  { id: 'erste', name: 'Envoy mit Dutt', folder: 'assets/figur', skin: [240, 176, 128], skinShadow: [184, 128, 88], hair: [224, 192, 136], hairZone: 0.25, portraitHairZone: 0.78 },
  { id: 'zweite', name: 'Envoy mit kurzem Haar', folder: 'assets/figur/zweite', skin: [240, 176, 130], skinShadow: [182, 130, 90], hair: [190, 178, 118], hairZone: 0.25, portraitHairZone: 0.62, undershirt: 'unterhemd.png' },
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
// The age asked at the creation of the Envoy (the app keeps the year of
// birth, see ageOn in tasks.js). It picks the exercises (column `alter`).
export const AGE_MIN = 4;
export const AGE_MAX = 120;

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
// Seconds the timer gives to change sides before „Andere Seite“ (so gewünscht).
export const SIDE_SWITCH = 8;

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
export const SLEEP_BONUS_HOUR = 6;                    // the Schlafplatz gives its Energie in the morning, at this hour

// The rules of Energie. Since version 5.12 (rules 2) every Energie the Envoy
// spends takes 10 seconds, ways take time but cost no Energie, and each task
// of the Tageswerk gives a quarter of the bar (also beyond its end). Before,
// an Energie took a minute, ways cost Energie, and a task gave an eighth.
// Events written since carry `regel: 2`; older ones keep the old rules, so a
// game played before stays exactly as it was.
//   pace        minutes of real time per Energie
//   wayEnergy   Energie per Energie-length of way (0: ways cost only time)
//   taskShare   share of the bar a task of the Tageswerk gives
export const RULES = 2;
export const RULE_SETS = {
  1: { pace: 1, wayEnergy: 1, taskShare: 1 / 8 },
  2: { pace: 1 / 6, wayEnergy: 0, taskShare: 1 / 4 },
};
export const rulesOf = (event) => RULE_SETS[event?.regel] || RULE_SETS[1];
export const RULES_NOW = RULE_SETS[RULES];

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

// Gathering on the Trümmerfeld (see world/run.js): every point of Energie of
// work brings GATHER_BASE pieces, plus one more for every one of
// GATHER_DICE dice that succeeds. The chance of a die is GATHER_CHANCE at level 1
// of the stat (Kraft for Stein, Beweglichkeit for Pilzholz) and rises with it.
// Never less than GATHER_BASE per Energie: nothing fails.
export const GATHER_BASE = 2;
export const GATHER_DICE = 2;
export const GATHER_CHANCE = 0.25;
export const GATHER_CHANCE_PER_LEVEL = 0.015;
export const GATHER_CHANCE_MAX = 0.9;
export const GATHER_STATS = { stein: 'kraft', pilzholz: 'beweglichkeit' };
// Now and then something else turns up while gathering: each Energie of work
// has this chance of one Bannsplitter (a test of the idea, see run.js).
export const GATHER_FIND_CHANCE = 0.05;

// Clothes found on the way (see world/clothes.js): every Energie of work at
// a quest (not building) is a chance of CLOTHES_PER_ENERGY for a piece of
// clothing, at most CLOTHES_MOST per action. The first piece comes for sure
// after CLOTHES_FIRST_ENERGY, every other after CLOTHES_SURE_ENERGY without one
// (twice the average).
export const CLOTHES_PER_ENERGY = 0.03;
export const CLOTHES_MOST = 0.3;
export const CLOTHES_FIRST_ENERGY = 5;
export const CLOTHES_SURE_ENERGY = 66;
// A found or bought piece that can be dyed (column `faerbbar`) gets one of
// these colours, or stays as drawn (one share like each colour). The app
// paints the drawing in the browser (ui/look.js); skin stays as it is.
export const DYES = [
  { id: 'moos', name: 'Moosgrün', rgb: [92, 120, 64] },
  { id: 'salbei', name: 'Salbei', rgb: [146, 164, 124] },
  { id: 'petrol', name: 'Petrol', rgb: [36, 104, 110] },
  { id: 'nacht', name: 'Nachtblau', rgb: [40, 58, 104] },
  { id: 'taube', name: 'Taubenblau', rgb: [112, 138, 172] },
  { id: 'pflaume', name: 'Pflaume', rgb: [108, 56, 96] },
  { id: 'rost', name: 'Rostrot', rgb: [166, 74, 48] },
  { id: 'kupfer', name: 'Kupfer', rgb: [196, 116, 58] },
  { id: 'ocker', name: 'Ocker', rgb: [200, 154, 60] },
  { id: 'sand', name: 'Sand', rgb: [206, 186, 152] },
  { id: 'rose', name: 'Altrosa', rgb: [196, 128, 132] },
  { id: 'schiefer', name: 'Schiefer', rgb: [78, 84, 92] },
];

// Ausrüstung mit Boni (see world/bonuses.js): a piece found, dropped by a
// spirit or offered by the trader gets a Güte, which says how many bonuses it
// has. QUALITY_CHANCES: the shares of the four for each origin. A bonus never
// raises a stat; it helps in the world (see hero.js: fighter, staminaPerHour,
// and the luck in run.js). Its size: base at strength 1, + perLevel for each
// level of strength; strength = the Envoy's (average of the stats) when the
// piece turns up, + the requirement of the piece (since 5.20.5). A piece with
// a requirement is never plain (the share of schlicht goes to gut).
// Within its Güte a piece can turn out weak or strong (since 5.21, so
// gewünscht): its bonuses are so many times the size, by chance anywhere
// between the two numbers of `spread`, the same for all bonuses of the piece.
export const QUALITIES = [
  { id: 'schlicht', name: 'Schlicht', bonuses: 0 },
  { id: 'gut', name: 'Gut', bonuses: 1, spread: [0.5, 1.4] },
  { id: 'selten', name: 'Selten', bonuses: 2, spread: [0.6, 1.5] },
  { id: 'praechtig', name: 'Prächtig', bonuses: 3, spread: [0.7, 1.6] },
];
export const QUALITY_CHANCES = {
  fund: [35, 40, 19, 6],           // found on the way (since 5.19 as from spirits; before 55/30/12/3)
  beute: [35, 40, 19, 6],
  haendler: [25, 45, 24, 6],
  tiefe: [0, 55, 33, 12],          // a Wächter of the Tiefen: never a plain piece
  tiefenwaechter: [0, 0, 70, 30],  // the last Wächter of a Tiefe: at least selten
  aushang: [35, 40, 19, 6],        // the reward of an Auftrag (since 5.21 as from spirits; before 20/45/27/8)
  arena: [0, 0, 65, 35],           // for Ruhm: at least selten
};
export const BONUSES = [
  { id: 'schaden', base: 1, perLevel: 0.2 },      // more damage with each hit
  { id: 'treffer', base: 3, perLevel: 0.6 },      // percent points to hit
  { id: 'ausweichen', base: 3, perLevel: 0.5 },   // percent points to dodge
  { id: 'beruhigen', base: 4, perLevel: 0.8 },    // percent points to calm a spirit
  { id: 'erholung', base: 8, perLevel: 1.2 },     // percent faster refilling of Energie
  { id: 'glueck', base: 5, perLevel: 1 },         // percent more Bannsplitter and finds
];

// Die Tiefen (see world/depths.js): beneath the Trümmerfeld, open with the
// Lagerfeuer. Three of them, one after the other, ten Ebenen each. On every
// Ebene waits a Wächter, one of the spirits of the world, as strong as the
// Stufe of its Ebene: `from` on the first, `step` more on each one after,
// and the last one DEPTH_LAST_EXTRA more. Its values follow from the Stufe
// (DEPTH_GUARDIAN: base + per Stufe). A descent costs no Energie; afterwards
// the Envoy rests. A Wächter too strong: the Envoy withdraws, with a little
// (DEPTH_RETREAT_SHARE), and tries again after the rest. An Ebene overcome
// brings Bannsplitter (splitter: base + per Ebene; the last one `boss`) and
// maybe a piece of clothing (DEPTH_ITEM_CHANCE, sure on DEPTH_SURE_ITEM and the last).
export const DEPTHS_FROM_STAGE = 1;
export const DEPTHS = [
  {
    id: 'brunnen', name: 'Der alte Brunnen', from: 1, step: 0.5, splitter: [10, 3], boss: 80,
    text: 'Unter dem Trümmerfeld führt ein alter Brunnen hinab. Auf jeder Ebene wartet ein Wächter.',
    waechter: ['zauderling', 'nebelwicht', 'gruebelkraehe', 'zauderling', 'hastwind', 'nebelwicht', 'dornenfluesterer', 'gruebelkraehe', 'hastwind', 'schwerer-schatten'],
  },
  {
    id: 'wurzelhallen', name: 'Die Wurzelhallen', from: 6, step: 0.55, splitter: [25, 4], boss: 160,
    opens: 'Öffnet sich, wenn der alte Brunnen bezwungen ist.',
    text: 'Tiefer unten tragen Wurzeln die Decke, dick wie Säulen. Es riecht nach Erde und nach etwas Altem.',
    waechter: ['dornenfluesterer', 'hastwind', 'echo', 'schwerer-schatten', 'dornenfluesterer', 'glutfresser', 'echo', 'schwerer-schatten', 'glutfresser', 'nachtmahr'],
  },
  {
    id: 'aschengewoelbe', name: 'Das Aschengewölbe', from: 11.5, step: 0.55, splitter: [45, 6], boss: 300,
    opens: 'Öffnet sich, wenn die Wurzelhallen bezwungen sind.',
    text: 'Ganz unten ist es warm. Die Asche hier ist älter als die Trümmer oben.',
    waechter: ['glutfresser', 'echo', 'nachtmahr', 'schwerer-schatten', 'glutfresser', 'nachtmahr', 'echo', 'glutfresser', 'nachtmahr', 'aschenkoenigin'],
  },
];
export const DEPTH_LAST_EXTRA = 1;
export const DEPTH_GUARDIAN = { leben: [6, 4.6], kraft: [0.5, 0.75], gewandtheit: [0, 0.8] };
export const DEPTH_REST_MINUTES = 60;           // after every descent
export const DEPTH_REST_PER_GELASSENHEIT = 1;   // a minute less for each level of Gelassenheit above 1
export const DEPTH_REST_LEAST = 30;
export const DEPTH_RETREAT_SHARE = 0.25;
export const DEPTH_ITEM_CHANCE = 40;            // percent, more with luck
export const DEPTH_SURE_ITEM = 5;               // on this Ebene a piece of clothing is sure

// Der Aushang am Lager (see world/jobs.js): open with the Lagerfeuer, every
// day JOBS_PER_DAY Aufträge, each once. An Auftrag costs no Energie, only
// time: the Envoy goes to a place and is busy there for some minutes. Its
// reward stands on the note: often (JOB_THING_CHANCE) a piece of clothing, in
// its colour and with its Güte, else Bannsplitter (JOB_SPLITTER: base + per
// minute, a little more with strength). Since 5.21 one or the other, not both
// (so gewünscht: the Aushang gave too much for no Energie; before 5.21 both,
// base 6, 2 per minute, a piece in 6 of 10).
export const JOBS_FROM_STAGE = 1;
export const JOBS_PER_DAY = 3;
export const JOB_SPLITTER = { base: 4, perMinute: 1.5, perLevel: 0.08 };
export const JOB_THING_CHANCE = 0.5;
// A piece that hangs on the first note from its day on, until the Envoy has it
// (if it fits his figure), at least selten: the Steppenrock, drawn by the
// user's daughter (so gewünscht, since 5.20.6).
export const JOB_FEATURED = [{ id: 'beine_steppenrock_1', from: '2026-10-08' }];
export const JOBS = [
  { id: 'brief', name: 'Ein Brief ohne Absender', minutes: [4, 7], text: 'Am Lager liegt ein Brief. Er soll an den Ort, der darauf steht.' },
  { id: 'laterne', name: 'Die verlorene Laterne', minutes: [5, 9], text: 'Jemand hat unterwegs seine Laterne verloren. Sie liegt irgendwo dort.' },
  { id: 'wurzeln', name: 'Ein Korb Wurzeln', minutes: [6, 10], text: 'Für eine Suppe am Lagerfeuer fehlen noch Wurzeln. Dort wachsen gute.' },
  { id: 'nachsehen', name: 'Nach dem Rechten sehen', minutes: [4, 8], text: 'Dort soll es in letzter Zeit unruhig gewesen sein. Einmal nachsehen genügt.' },
  { id: 'federn', name: 'Ein Bündel Federn', minutes: [5, 9], text: 'Eine Sammlerin wünscht sich weiche Federn. Dort liegen manchmal welche.' },
  { id: 'wache', name: 'Stille Wache', minutes: [8, 14], text: 'Jemand bittet, eine Weile dort zu sitzen und auf das Licht zu achten.' },
  { id: 'wegweiser', name: 'Der umgefallene Wegweiser', minutes: [6, 11], text: 'Ein alter Wegweiser ist umgefallen. Er soll wieder stehen.' },
  { id: 'tee', name: 'Tee für eine Reisende', minutes: [4, 7], text: 'Eine Reisende hat ihren Tee am Lager vergessen. Sie wartet dort.' },
  { id: 'melodie', name: 'Eine verlorene Melodie', minutes: [7, 12], text: 'Ein Echo hat eine Melodie mitgenommen. Wer genau hinhört, findet sie dort.' },
  { id: 'steinturm', name: 'Ein Zeichen am Weg', minutes: [8, 13], text: 'Dort soll ein kleiner Steinturm stehen, damit andere den Weg finden.' },
  { id: 'schal', name: 'Ein Schal im Gestrüpp', minutes: [4, 8], text: 'Dort hängt ein Schal im Gestrüpp. Seine Besitzerin vermisst ihn.' },
  { id: 'samen', name: 'Ein Säckchen Samen', minutes: [6, 10], text: 'Ein Säckchen Samen soll dort in die Erde, an einen hellen Platz.' },
];

// The arena (see arena.php and world/arena.js): open from this Lagerstufe on,
// and only with an account, since the Abbilder of the others lie on the server.
export const ARENA_FROM_STAGE = 1;
export const ARENA_ENERGY = 0;         // a challenge costs no Energie (since 5.13)
export const ARENA_ENERGY_BEFORE = 5;  // what a challenge cost before, for fights written without the field
export const ARENA_REACH = 3;          // places above or below that may be challenged (as on the server)
// The Fleiß counts most in a fight (so gewünscht): on how many of the last
// ARENA_WINDOW_DAYS days the task of each area was done, all four together.
// Each day more makes stronger in the fight (ARENA_FLEISS_EDGE in arena.php),
// and these bonuses of the clothes act in it (the same as ARENA_FIGHT_BONUSES
// in arena.php). The Haltung is gone.
export const ARENA_WINDOW_DAYS = 28;
export const ARENA_FIGHT_BONUSES = ['schaden', 'treffer', 'ausweichen'];
// For Ruhm: a piece of clothing in another colour, and every day a few
// pieces of clothing with bonuses (ARENA_OFFERS, at least selten, price by
// Güte). Titel for the Abbild (shown after its name, the same for every
// figure) are not bought (since 5.15): they come with the Ränge, which
// follow all the Ruhm ever earned (spending it does not lower the Rang).
// A Titel bought before stays.
export const DYE_PRICE = 8;
export const ARENA_OFFERS = 3;
export const ARENA_PRICES = { selten: 20, praechtig: 35 };
export const RANKS = [
  { at: 0, name: 'Neu in der Halle' },
  { at: 15, name: 'Bekannt in der Halle' },
  { at: 40, name: 'Geachtet' },
  { at: 80, name: 'Gefeiert' },
  { at: 150, name: 'Unvergessen' },
  { at: 250, name: 'Legende der Halle' },
];
export const TITLES = [
  { id: 'leiser-schritt', name: 'mit leisem Schritt', rang: 1 },
  { id: 'ruhige-hand', name: 'mit ruhiger Hand', rang: 1 },
  { id: 'morgenstunde', name: 'aus der Morgenstunde', rang: 2 },
  { id: 'truemmerfeld', name: 'vom Trümmerfeld', rang: 2 },
  { id: 'pilzhain', name: 'aus dem Pilzhain', rang: 2 },
  { id: 'langer-atem', name: 'mit langem Atem', rang: 3 },
  { id: 'offenes-herz', name: 'mit offenem Herzen', rang: 3 },
  { id: 'stille', name: 'aus der Stille', rang: 4 },
  { id: 'sturm', name: 'aus dem Sturm', rang: 4 },
  { id: 'tausend-schritte', name: 'der tausend Schritte', rang: 5 },
];

// Where the camp lies, for the time of day in its picture (middle of Germany).
export const CAMP_LATITUDE = 51;
export const CAMP_LONGITUDE = 10;
export const ENCOUNTER_CHANCE = 0.55;                  // per wild place and day
export const ENCOUNTER_COST = 3;                        // stamina on site
export const TRADER_OFFERS = 5;
export const BONUS_PRICE = 0.4;                         // each bonus of a piece: 40 % more at the trader, and when sold
// Tränke beim Händler (since 5.13): drunk at once when bought, each fills the
// bar by so much Energie, never beyond its end (so the camp grows no faster).
// Every day he has each of them in stock this many times.
export const POTIONS = [
  { id: 'pilztee', name: 'Pilztee', energie: 10, preis: 12, text: 'Bitter und warm. Danach geht es wieder.' },
  { id: 'quellsud', name: 'Quellsud', energie: 25, preis: 28, text: 'Aus dem Wasser der stillen Quelle, mit einem Hauch Nebelkraut.' },
];
export const POTIONS_PER_DAY = 2;
export const potionById = (id) => POTIONS.find((p) => p.id === id) || null;

// Plans for Deko (see world/plans.js). A chance to find one: every 10
// Energie of work at the place where it lies, every spirit the Envoy meets,
// or every day at the trader. On average a plan takes this many chances; it is
// there for sure after PLAN_SURE_FACTOR times as many. Searching for a plan
// begins once the camp has reached the stage of its Deko. (Before version
// 5.12 it was 6, 12 and 24: with more Energie a day the camp would otherwise
// grow faster than before.)
export const PLAN_CHANCE_ENERGY = 10;
export const PLAN_CHANCES = { selten: 9, 'sehr selten': 18, kostbar: 36 };
export const PLAN_SURE_FACTOR = 2;
// Taking a Deko down (since 5.20.10, so gewünscht): this share of its
// material comes back (rounded down, as much as the Vorrat has room for);
// the Energie does not. The plan stays, it can be built again.
export const DEKO_REFUND_SHARE = 0.5;
// Plans the trader has for sure on one day (so gewünscht: the Lichterkette,
// drawn by the user, on 9 October 2026); on other days by chance, as any plan.
export const TRADER_PLANS_ON = { lichterkette: '2026-10-09' };
// What the trader pays for a piece: this share of its price (since 5.21, so
// gewünscht: Bannsplitter came too easily; before 1/3).
export const SELL_SHARE = 1 / 6;
