// "Lager": the first view. The camp as a picture (its stage and the time of
// day) with its Hygge and the buttons to furnish
// it („Lager einrichten“, see facilities.js) and to raise it to the next stage
// („Lager aufwerten“, see upgrade.js; until the Hygge is enough it says why).
// Below: where the Envoy is, the supplies, and what waits out there today
// (a few lines leading to the pages under Abenteuer).
// The picture belongs to the stage of the camp and to the time of day at
// the camp (see daylight.js). A stage without a picture of its own shows the
// one of the stage before; a time of day without one shows the day picture,
// darker or warmer. On it lie, as layers in the order the user arranged them
// (see campLayers and tools/lager_ebenen.py), the building of the stage, the
// facilities and the Deko that are built, and pieces cut out of the picture
// that stand in front of them. A tap on the picture shows it large, all of
// it. (Later the Envoy is to sit there while at the camp.)

import { h, icon } from './dom.js';
import { PLACE_ICONS, UI_ICONS, SLOT_ICONS } from './icons.js';
import { versioned } from '../config.js';
import { formatDayLong } from '../days.js';
import { sectionTitle, supplies, staminaBar, materialLimits } from './parts.js';
import { journeyPanel, openReport, expeditionTitle, currentTitle } from './journey.js';
import { encountersFor, questState, placeUnlocked } from '../world/quests.js';
import { showPlace } from './worldmap.js';
import { openQuest } from './questsheet.js';
import { openFacilities, canBuildSomething } from './facilities.js';
import { openUpgrade } from './upgrade.js';
import { openPicture } from './sheet.js';
import { unseenDropCount } from './character.js';
import { jobsOpen } from '../world/jobs.js';
import { depthsOpen } from '../world/depths.js';
import { store } from '../store.js';
import { dayPhase } from '../daylight.js';
import { campStatus, facilityLevel, nextUpgrade, dekoBuilt, FACILITY_IDS } from '../world/camp.js';

const ALT = [
  'Das Lager auf dem Trümmerfeld: Steine, schwarze Säulen und hohe Pilze, noch ohne Feuer.',
  'Das Lager auf dem Trümmerfeld: ein Feuer in einem Kreis aus Steinen, dahinter hohe Pilze.',
];

// The picture for a stage and time of day: the one of this stage, or of the
// highest stage below it that has one (`shown`). Where there is none for the
// time of day, the day picture is used (`time`) and `tint` names how it is
// darkened or warmed.
export function campPicture(stage, phase, catalog) {
  const pictures = catalog.camp.pictures || {};
  let shown = stage;
  while (shown > 0 && !pictures[shown]) shown -= 1;
  const times = pictures[shown] || ['tag'];
  const time = times.includes(phase) ? phase : 'tag';
  return { src: versioned(`assets/lager/stufe_${shown}_${time}.jpg`), tint: time === phase ? null : phase, shown, time };
}

// The highest drawn stage up to `stage` among some layers (0 if none).
const drawnUpTo = (layers, stage) => layers.reduce((best, l) => (l.stufe <= stage && l.stufe > best ? l.stufe : best), 0);

// What of the stack of layers (catalog.camp.layers, back to front, see
// tools/lager_ebenen.py) lies on the picture now, in that order: the building
// of the camp stage (or of the highest stage below it with a drawing; some
// buildings come in parts, one behind the beds, one in front), each facility
// at its level (or the highest level below it with a drawing), the built Deko
// where the stack has its place, and the pieces cut out of the picture shown
// (rocks, the fire, the pillars), so that they stand in front of what lies
// behind them, where their conditions hold (only up to a camp stage, not
// with a certain drawing). -> [{ src, cutout }]
export function campLayers(world, catalog, picture = { shown: 1, time: 'tag' }) {
  const stack = catalog.camp.layers || [];
  const building = drawnUpTo(stack.filter((l) => l.art === 'gebaeude'), world.camp.stage);
  const level = Object.fromEntries(FACILITY_IDS.map((id) => [id,
    drawnUpTo(stack.filter((l) => l.art === 'einrichtung' && l.id === id), facilityLevel(world, id))]));
  const layers = [];
  for (const l of stack) {
    if (l.art === 'gebaeude' && l.stufe === building) layers.push({ src: l.bild, cutout: false });
    else if (l.art === 'einrichtung' && l.stufe === level[l.id]) layers.push({ src: l.bild, cutout: false });
    else if (l.art === 'deko') {
      for (const d of catalog.deko) if (dekoBuilt(world, d.id) && d.bild) layers.push({ src: d.bild, cutout: false });
    } else if (l.art === 'ausschnitt' && l.bildstufe === picture.shown && l.bilder[picture.time]
      && !(l.bisLager < world.camp.stage) && !(l.nichtMit || []).some((n) => level[n.id] === n.stufe)) {
      layers.push({ src: l.bilder[picture.time], cutout: true });
    }
  }
  return layers;
}

// Everything the picture of the camp is made of at a time of day, back to
// front, each with its look: the picture and its layers. The drawings are
// made by day: on the picture of another time they get its light
// (light-<phase>, in css/envoy.css), on the day picture standing in for
// another time they are tinted like it. The cut-outs come from the picture
// itself and look like it.
export function campScene(world, catalog, phase) {
  const picture = campPicture(world.camp.stage, phase, catalog);
  const own = picture.tint ? `tint-${picture.tint}` : '';
  const drawing = picture.tint ? `tint-${picture.tint}` : phase === 'tag' ? '' : `light-${phase}`;
  return [
    { src: picture.src, look: own },
    ...campLayers(world, catalog, picture).map((l) => ({ src: l.src, look: l.cutout ? own : drawing })),
  ];
}

function sceneImages(game, phase) {
  const { world } = game.state;
  const alt = ALT[world.camp.stage] || `Das Lager: ${campStatus(world, game.catalog).name}.`;
  return campScene(world, game.catalog, phase).map(({ src, look }, i) => (i === 0
    ? h('img', { class: `camp-picture ${look}`, src, alt })
    : h('img', { class: `camp-picture camp-layer ${look}`, src, alt: '', onerror: (e) => { e.currentTarget.hidden = true; } })));
}

// The whole picture, as large as the screen allows; on a narrow screen it
// can be moved sideways. A tap closes it.
function openLargePicture(game) {
  const scene = h('div', { class: 'picture-scene' }, sceneImages(game, dayPhase()));
  const strip = h('div', { class: 'picture-strip' }, scene);
  openPicture({ label: 'Das Lager', content: strip });
  // start in the middle, at the fire
  requestAnimationFrame(() => { strip.scrollLeft = (strip.scrollWidth - strip.clientWidth) / 2; });
}

function statusLine(game) {
  const exp = game.state.world.expedition;
  if (exp) return `Der Envoy ist unterwegs: ${currentTitle(exp)}.`;
  return 'Der Envoy ist im Lager.';
}

function stageLine(game) {
  const status = campStatus(game.state.world, game.catalog);
  return status.stage === 0 ? 'Noch kein Lagerfeuer' : `Stufe ${status.stage} · ${status.name}`;
}

// The Hygge of the camp, as a number on the picture. It is not a goal to
// reach: once there is enough, the camp can be raised to the next stage, and
// „Lager aufwerten“ glows.
function hyggeBadge(game) {
  const { hygge } = campStatus(game.state.world, game.catalog);
  return h('div', { class: 'camp-hygge', role: 'img', 'aria-label': `Hygge ${hygge}` },
    h('span', { class: 'hygge-num' }, String(hygge)),
    h('span', { class: 'hygge-word' }, 'Hygge'));
}

// The two buttons on the picture. „Lager einrichten“ glows while something
// can be built right now. „Lager aufwerten“ glows once the Hygge is enough
// and then opens the window for it (also while the Envoy is at it); before
// that a tap (or pointing at it) says why it cannot be done yet.
function campActions(game) {
  const status = campStatus(game.state.world, game.catalog);
  const upgrade = nextUpgrade(game.state.world, game.catalog);
  const running = upgrade && game.queued(upgrade.id);
  let why = 'Weitere Stufen folgen später.';
  if (status.need !== null) why = status.ready ? `Genug Hygge für: ${status.next.name}` : `Dafür braucht das Lager ${status.need} Hygge.`;
  if (status.ready || running) {
    return h('div', { class: 'camp-actions' },
      buildButton(game),
      h('span', { class: 'camp-upgrade' },
        h('button', { class: `camp-action is-up ${running ? '' : 'is-glowing'}`, type: 'button', onclick: () => openUpgrade(game) },
          icon(UI_ICONS.chevron), h('span', {}, running ? 'Wird aufgewertet' : 'Lager aufwerten'))));
  }
  const wrap = h('span', { class: 'camp-upgrade' });
  let timer = null;
  const showWhy = () => {
    wrap.classList.add('show-hint');
    clearTimeout(timer);
    timer = setTimeout(() => wrap.classList.remove('show-hint'), 3500);
  };
  wrap.append(
    h('button', { class: 'camp-action is-locked', type: 'button', title: why, 'aria-label': `Lager aufwerten. ${why}`, onclick: showWhy },
      icon(UI_ICONS.lock), h('span', {}, 'Lager aufwerten')),
    h('span', { class: 'camp-hint', role: 'status' }, why));
  return h('div', { class: 'camp-actions' }, buildButton(game), wrap);
}

function buildButton(game) {
  return h('button', { class: `camp-action camp-build ${canBuildSomething(game) ? 'is-glowing' : ''}`, type: 'button', onclick: () => openFacilities(game) },
    icon(SLOT_ICONS.einrichtung), h('span', {}, 'Lager einrichten'));
}

function hero(game) {
  const { world } = game.state;
  const stage = world.camp.stage;
  const open = () => openLargePicture(game);
  const frame = h('div', {
    class: 'camp-frame', role: 'button', tabindex: '0', 'aria-label': 'Lagerbild groß zeigen',
    onclick: open, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
  });
  let shown = null;
  const show = () => {
    const phase = dayPhase();
    if (phase === shown) return;
    shown = phase;
    frame.replaceChildren(...sceneImages(game, phase));
  };
  show();
  // the day moves on while the page stays open
  const timer = setInterval(() => (frame.isConnected ? show() : clearInterval(timer)), 60000);
  return h('section', { class: 'camp-hero' },
    h('div', { class: 'camp-scene' },
      frame,
      h('span', { class: `camp-zoom ${stage >= 1 ? '' : 'is-alone'}`, 'aria-hidden': 'true' }, icon(UI_ICONS.enlarge)),
      stage >= 1 ? hyggeBadge(game) : null,
      stage >= 1 ? campActions(game) : null),
    h('div', { class: 'camp-caption' },
      h('div', {},
        h('p', { class: 'eyebrow' }, formatDayLong(game.state.today)),
        h('h1', {}, 'Lager'),
        h('p', { class: 'camp-status' }, statusLine(game))),
      h('p', { class: 'camp-stage' }, stageLine(game))));
}

// Before there is a fire: what the Envoy is to do first.
function firstTaskPanel(game) {
  if (game.state.world.camp.stage > 0) return null;
  const fire = game.catalog.quests.find((q) => q.reward.unlocks.includes('lagerfeuer'));
  return h('section', { class: 'panel camp-first' },
    sectionTitle('Als Erstes'),
    h('p', {}, 'Dein Envoy wird eine Weile hier bleiben. Am besten errichtest du ein Lagerfeuer.'),
    fire ? h('button', { class: 'btn primary small', onclick: () => openQuest(fire, game) }, 'Zur Quest') : null);
}

// While the Envoy is away: the journey; once back: the report.
function expeditionPanel(game) {
  const exp = game.state.world.expedition;
  const [report] = game.unseenReports();
  if (!exp && !report) return null;
  return h('section', { class: 'panel camp-expedition' },
    sectionTitle('Expedition'),
    exp
      ? journeyPanel(exp, game)
      : h('div', { class: 'dash-report' },
        h('p', {}, `Zurück: ${expeditionTitle(report)}`),
        h('button', { class: 'btn primary small', onclick: () => openReport(report, game) }, 'Bericht')));
}

// What waits out there today, in a few lines, each leading to its page under
// Abenteuer (since 5.21 the Aufträge and the spirits are there, not here):
// the spirits seen today, the open notes of the Aushang, the Tiefen once the
// rest is over.
function outsidePanel(game) {
  const c = game.ctx();
  const { world } = c;
  const lines = [];
  const spirits = encountersFor(c.day, c).filter((q) => questState(q, c).status !== 'done');
  if (spirits.length > 0) {
    const names = spirits.map((q) => game.catalog.monsterById.get(q.monsters[0])?.name).filter(Boolean);
    lines.push(outsideLine('#abenteuer', PLACE_ICONS.wild, spirits.length === 1 ? 'Ein Geist gesichtet' : `${spirits.length} Geister gesichtet`, names.join(', ')));
  }
  if (jobsOpen(world)) {
    const open = game.jobs().filter((j) => j.state === 'open').length;
    if (open > 0) lines.push(outsideLine('#aushang', UI_ICONS.note, open === 1 ? 'Ein Auftrag am Aushang' : `${open} Aufträge am Aushang`, 'Ohne Energie, nur Zeit'));
  }
  if (depthsOpen(world) && !game.depthBlock()) lines.push(outsideLine('#tiefen', PLACE_ICONS.hoehle, 'Die Tiefen', 'Der Envoy kann hinabsteigen'));
  if (lines.length === 0) return null;
  return h('section', { class: 'panel dash-outside' }, sectionTitle('Draußen'), h('div', { class: 'outside-lines' }, lines));
}

function outsideLine(href, glyph, title, sub) {
  return h('a', { class: 'outside-line', href },
    icon(glyph, 'icon outside-mark'),
    h('span', { class: 'outside-text' }, h('span', { class: 'outside-title' }, title), h('span', { class: 'outside-sub' }, sub)),
    icon(UI_ICONS.chevron, 'icon outside-go'));
}

function suppliesPanel(game) {
  const { world } = game.state;
  return h('section', { class: 'panel dash-supplies' },
    sectionTitle('Vorrat'),
    supplies(world.purse, materialLimits(world, game.catalog)),
    staminaBar(game.stamina()));
}

// Things worth knowing, each with a way to act on it.
function noticesPanel(game) {
  const notes = [];
  const dropped = unseenDropCount(game);
  if (dropped > 0) notes.push(h('a', { class: 'notice-line', href: '#envoy' }, `${dropped === 1 ? 'Ein Teil wurde' : `${dropped} Teile wurden`} abgelegt. Mehr beim Envoy.`));
  const c = game.ctx();
  const newPlaces = game.catalog.places.filter((p) => p.unlock.length > 0 && placeUnlocked(p, c) && !seenPlace(p.id));
  for (const p of newPlaces) notes.push(h('button', { class: 'notice-line', onclick: () => { markPlaceSeen(p.id); showPlace(p.id); } }, `Neu auf der Karte: ${p.name}`));
  if (notes.length === 0) return null;
  return h('section', { class: 'panel dash-notices' }, sectionTitle('Hinweise'), notes);
}

// Places that opened up are announced once per device.
function seenPlace(id) {
  return (store.loadUi().seenPlaces || []).includes(id);
}
function markPlaceSeen(id) {
  const ui = store.loadUi();
  ui.seenPlaces = [...(ui.seenPlaces || []), id];
  store.saveUi(ui);
}

export function renderCamp(game) {
  return h('section', { class: 'view camp' },
    hero(game),
    h('div', { class: 'camp-grid' },
      h('div', { class: 'camp-col' },
        firstTaskPanel(game),
        expeditionPanel(game),
        suppliesPanel(game)),
      h('div', { class: 'camp-col' },
        outsidePanel(game),
        noticesPanel(game))));
}
