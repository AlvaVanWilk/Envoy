// "Übersicht": the first view. What is open today, where the Envoy is,
// the supplies, the stats, and which spirits have been seen today.

import { h, icon } from './dom.js';
import { UI_ICONS, PLACE_ICONS } from './icons.js';
import { STATS } from '../config.js';
import { formatDayLong } from '../days.js';
import { statRow, statEmblem, statInfo } from './stats.js';
import { openStatDetail } from './statdetail.js';
import { viewHead, sectionTitle, supplies, staminaBar } from './parts.js';
import { journeyPanel, openReport } from './journey.js';
import { encountersFor, questState, placeUnlocked } from '../world/quests.js';
import { openPlace } from './worldmap.js';
import { unseenDropCount } from './character.js';
import { store } from '../store.js';

function tasksPanel(game) {
  const s = game.state;
  const rows = STATS.map((st) => {
    const exercise = game.todayExercise(st.id);
    const done = s.todayDone[st.id];
    return h('a', { class: `day-task ${done ? 'done' : ''}`, href: '#heute', 'data-stat': st.id },
      statEmblem(st.id, 'small'),
      h('span', { class: 'day-task-text' },
        h('span', { class: 'day-task-name' }, exercise ? exercise.name : statInfo(st.id).area),
        h('span', { class: 'day-task-gain' }, exercise ? `+${exercise.xp} ${st.name}` : '')),
      h('span', { class: `day-task-state ${done ? 'done' : ''}` }, done ? icon(UI_ICONS.check) : null));
  });
  const doneCount = STATS.filter((st) => s.todayDone[st.id]).length;
  return h('section', { class: 'panel dash-tasks' },
    sectionTitle('Tageswerk', h('span', { class: 'title-note' }, `${doneCount} von 4`)),
    s.sick ? h('p', { class: 'sick-note' }, 'Krankheitsmodus') : null,
    h('div', { class: 'day-tasks' }, rows));
}

function expeditionPanel(game) {
  const { world } = game.state;
  const exp = world.expedition;
  const [report] = game.unseenReports();
  let body;
  if (exp) {
    body = journeyPanel(exp, game);
  } else if (report) {
    body = h('div', { class: 'dash-report' },
      h('p', {}, `Zurück: ${report.title}`),
      h('button', { class: 'btn primary small', onclick: () => openReport(report, game) }, 'Bericht'));
  } else {
    body = h('p', { class: 'muted' }, 'Der Envoy ist im Lager.');
  }
  return h('section', { class: 'panel dash-expedition' },
    sectionTitle('Expedition'),
    body,
    h('div', { class: 'panel-foot' }, h('a', { class: 'btn ghost small', href: '#karte' }, 'Zur Karte')));
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

function statsPanel(game) {
  const s = game.state;
  return h('section', { class: 'panel dash-stats' },
    sectionTitle('Werte'),
    STATS.map((st) => statRow(st.id, s.stats[st.id], { onclick: () => openStatDetail(st.id, game) })));
}

// Things worth knowing, each with a way to act on it.
function noticesPanel(game) {
  const notes = [];
  const dropped = unseenDropCount(game);
  if (dropped > 0) notes.push(h('a', { class: 'notice-line', href: '#envoy' }, `${dropped === 1 ? 'Ein Teil wurde' : `${dropped} Teile wurden`} abgelegt. Mehr unter Envoy.`));
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

export function renderOverview(game) {
  return h('section', { class: 'view overview' },
    viewHead(formatDayLong(game.state.today), 'Übersicht'),
    h('div', { class: 'dash-grid' },
      tasksPanel(game),
      expeditionPanel(game),
      suppliesPanel(game),
      statsPanel(game),
      sightingsPanel(game),
      noticesPanel(game)));
}
