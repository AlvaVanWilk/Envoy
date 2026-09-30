// "Lager": the first view. The camp as a picture, where the Envoy is, the
// supplies, and which spirits were seen today. Once the camp can be extended
// (a quest unlocks it, not offered for now), a button leads there.
// The picture belongs to the stage of the camp; at the start it is a
// campfire. (Later the Envoy is to sit there while at the camp.)

import { h, icon } from './dom.js';
import { PLACE_ICONS } from './icons.js';
import { versioned } from '../config.js';
import { formatDayLong } from '../days.js';
import { sectionTitle, supplies, staminaBar } from './parts.js';
import { journeyPanel, openReport } from './journey.js';
import { encountersFor, questState, placeUnlocked } from '../world/quests.js';
import { openPlace } from './worldmap.js';
import { unseenDropCount } from './character.js';
import { openSheet } from './sheet.js';
import { store } from '../store.js';

// Pictures of the camp by stage. Only the campfire is drawn so far.
const CAMP_PICTURES = ['assets/lager/stufe_0.jpg'];

function campPicture(game) {
  return versioned(CAMP_PICTURES[Math.min(game.state.world.home, CAMP_PICTURES.length - 1)] || CAMP_PICTURES[0]);
}

function statusLine(game) {
  const exp = game.state.world.expedition;
  if (exp) return `Der Envoy ist unterwegs: ${exp.title}.`;
  return 'Der Envoy ist im Lager.';
}

// Extending the camp is unlocked by a quest; there is none for now, so the
// button does not show yet. What it offers comes with the housing.
function upgradeButton(game) {
  if (!game.unlocked('zuhause')) return null;
  const show = () => openSheet({
    title: 'Lager verbessern',
    eyebrow: 'Lager',
    content: h('p', { class: 'sheet-text' }, 'Wie das Lager wächst, folgt mit einem späteren Update.'),
  });
  return h('button', { class: 'btn ghost small camp-upgrade', onclick: show }, 'Lager verbessern');
}

function hero(game) {
  return h('section', { class: 'camp-hero' },
    h('img', { class: 'camp-picture', src: campPicture(game), alt: 'Das Lager: ein Feuer in einem Kreis aus Steinen, dahinter große Pilze.' }),
    h('div', { class: 'camp-caption' },
      h('div', {},
        h('p', { class: 'eyebrow' }, formatDayLong(game.state.today)),
        h('h1', {}, 'Lager'),
        h('p', { class: 'camp-status' }, statusLine(game))),
      upgradeButton(game)));
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
        h('p', {}, `Zurück: ${report.title}`),
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
        h('button', { class: 'sighting', onclick: () => openPlace(place.id, game) },
          h('span', { class: 'portrait small' }, h('img', { src: monster.bild, alt: '' })),
          h('span', { class: 'sighting-text' },
            h('span', { class: 'sighting-name' }, monster.name),
            h('span', { class: 'sighting-place' }, `${place.name} · Stufe ${monster.stufe}`)),
          icon(PLACE_ICONS.wild, 'icon sighting-mark')));
    })));
}

function suppliesPanel(game) {
  return h('section', { class: 'panel dash-supplies' },
    sectionTitle('Vorrat'),
    supplies(game.state.world.purse),
    staminaBar(game.stamina()));
}

// Things worth knowing, each with a way to act on it.
function noticesPanel(game) {
  const notes = [];
  const dropped = unseenDropCount(game);
  if (dropped > 0) notes.push(h('a', { class: 'notice-line', href: '#envoy' }, `${dropped === 1 ? 'Ein Teil wurde' : `${dropped} Teile wurden`} abgelegt. Mehr beim Envoy.`));
  const c = game.ctx();
  const newPlaces = game.catalog.places.filter((p) => p.unlock.length > 0 && placeUnlocked(p, c) && !seenPlace(p.id));
  for (const p of newPlaces) notes.push(h('button', { class: 'notice-line', onclick: () => { markPlaceSeen(p.id); openPlace(p.id, game); } }, `Neu auf der Karte: ${p.name}`));
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
      expeditionPanel(game),
      suppliesPanel(game),
      sightingsPanel(game),
      noticesPanel(game)));
}
