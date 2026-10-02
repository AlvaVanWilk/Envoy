// "Lager": the first view. The camp as a picture (its stage and the time of
// day) with its Hygge and the buttons to furnish
// it („Lager einrichten“, see facilities.js) and to raise it to the next stage
// („Lager aufwerten“, not built yet: it says why). Below: where the Envoy is,
// the supplies and which spirits were seen today.
// The picture belongs to the stage of the camp and to the time of day at
// the camp (see daylight.js). Without a fire there is only the picture of the
// day so far; the other times of day show it darker or warmer until there
// are pictures of their own. (Later the Envoy is to sit there while at the camp.)

import { h, icon } from './dom.js';
import { PLACE_ICONS, UI_ICONS, SLOT_ICONS } from './icons.js';
import { versioned } from '../config.js';
import { formatDayLong } from '../days.js';
import { sectionTitle, supplies, staminaBar, materialLimits } from './parts.js';
import { journeyPanel, openReport, expeditionTitle } from './journey.js';
import { encountersFor, questState, placeUnlocked } from '../world/quests.js';
import { showPlace } from './worldmap.js';
import { openQuest } from './questsheet.js';
import { openFacilities, canBuildSomething } from './facilities.js';
import { unseenDropCount } from './character.js';
import { store } from '../store.js';
import { dayPhase } from '../daylight.js';
import { campStatus } from '../world/camp.js';

// The pictures of the camp, by stage and time of day.
const PICTURES = {
  0: { tag: 'assets/lager/stufe_0_tag.jpg' },
  1: {
    morgen: 'assets/lager/stufe_1_morgen.jpg',
    tag: 'assets/lager/stufe_1_tag.jpg',
    abend: 'assets/lager/stufe_1_abend.jpg',
    nacht: 'assets/lager/stufe_1_nacht.jpg',
  },
};
const ALT = [
  'Das Lager auf dem Trümmerfeld: Steine, schwarze Säulen und hohe Pilze, noch ohne Feuer.',
  'Das Lager auf dem Trümmerfeld: ein Feuer in einem Kreis aus Steinen, dahinter hohe Pilze.',
];

// The picture for a stage and time of day. Where there is none for the time of
// day, the day picture is used and `tint` names how it is darkened or warmed.
export function campPicture(stage, phase) {
  const set = PICTURES[Math.min(stage, 1)];
  const own = set[phase];
  return { src: versioned(own || set.tag), tint: own ? null : phase };
}

function statusLine(game) {
  const exp = game.state.world.expedition;
  if (exp) return `Der Envoy ist unterwegs: ${expeditionTitle(exp)}.`;
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
// can be built right now. „Lager aufwerten“ glows once the Hygge is enough;
// a tap (or pointing at it) says why it cannot be done yet.
function campActions(game) {
  const status = campStatus(game.state.world, game.catalog);
  let why = 'Weitere Stufen folgen später.';
  if (status.need !== null) why = status.ready ? 'Genug Hygge. Das Aufwerten folgt mit einem späteren Update.' : `Dafür braucht das Lager ${status.need} Hygge.`;
  const wrap = h('span', { class: 'camp-upgrade' });
  let timer = null;
  const showWhy = () => {
    wrap.classList.add('show-hint');
    clearTimeout(timer);
    timer = setTimeout(() => wrap.classList.remove('show-hint'), 3500);
  };
  wrap.append(
    h('button', { class: `camp-action ${status.ready ? 'is-glowing is-up' : 'is-locked'}`, type: 'button', title: why, 'aria-label': `Lager aufwerten. ${why}`, onclick: showWhy },
      icon(status.ready ? UI_ICONS.chevron : UI_ICONS.lock), h('span', {}, 'Lager aufwerten')),
    h('span', { class: 'camp-hint', role: 'status' }, why));
  return h('div', { class: 'camp-actions' },
    h('button', { class: `camp-action camp-build ${canBuildSomething(game) ? 'is-glowing' : ''}`, type: 'button', onclick: () => openFacilities(game) },
      icon(SLOT_ICONS.einrichtung), h('span', {}, 'Lager einrichten')),
    wrap);
}

function hero(game) {
  const stage = game.state.world.camp.stage;
  const picture = h('img', { class: 'camp-picture', alt: ALT[Math.min(stage, 1)] });
  const show = () => {
    const { src, tint } = campPicture(game.state.world.camp.stage, dayPhase());
    picture.className = `camp-picture ${tint ? `tint-${tint}` : ''}`;
    if (!picture.src.endsWith(src)) picture.src = src;
  };
  show();
  // the day moves on while the page stays open
  const timer = setInterval(() => (picture.isConnected ? show() : clearInterval(timer)), 60000);
  return h('section', { class: 'camp-hero' },
    h('div', { class: 'camp-scene' },
      picture,
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

function sightingsPanel(game) {
  const c = game.ctx();
  const list = encountersFor(c.day, c).filter((q) => questState(q, c).status !== 'done');
  if (list.length === 0) return null;
  return h('section', { class: 'panel dash-sightings' },
    sectionTitle('Heute gesichtet'),
    h('ul', { class: 'sightings' }, list.map((q) => {
      const monster = game.catalog.monsterById.get(q.monsters[0]);
      const place = game.catalog.placeById.get(q.place);
      return h('li', {},
        h('button', { class: 'sighting', onclick: () => openQuest(q, game) },
          h('span', { class: 'portrait small' }, h('img', { src: monster.bild, alt: '' })),
          h('span', { class: 'sighting-text' },
            h('span', { class: 'sighting-name' }, monster.name),
            h('span', { class: 'sighting-place' }, `${place.name} · Stufe ${monster.stufe}`)),
          icon(PLACE_ICONS.wild, 'icon sighting-mark')));
    })));
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
        sightingsPanel(game),
        noticesPanel(game))));
}
