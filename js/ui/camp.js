// "Lager": the first view. The camp as a picture (its stage and the time of
// day), where the Envoy is, the supplies, the facilities that can be built
// and which spirits were seen today.
// The picture belongs to the stage of the camp and to the time of day at
// the camp (see daylight.js). Without a fire there is only the picture of the
// day so far; the other times of day show it darker or warmer until there
// are pictures of their own. (Later the Envoy is to sit there while at the camp.)

import { h, icon } from './dom.js';
import { PLACE_ICONS } from './icons.js';
import { versioned } from '../config.js';
import { formatDayLong } from '../days.js';
import { sectionTitle, supplies, staminaBar, resource, materialLimits, formatMinutes } from './parts.js';
import { journeyPanel, openReport } from './journey.js';
import { encountersFor, questState, placeUnlocked, questsAt } from '../world/quests.js';
import { openPlace, markMapForScroll } from './worldmap.js';
import { unseenDropCount } from './character.js';
import { toast } from './sheet.js';
import { store } from '../store.js';
import { dayPhase } from '../daylight.js';
import { campStatus, facilityEffect, facilityRow, facilityLevel, FACILITY_IDS, CAMP_PLACE } from '../world/camp.js';

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
  if (exp) return `Der Envoy ist unterwegs: ${exp.title}.`;
  return 'Der Envoy ist im Lager.';
}

function stageLine(game) {
  const status = campStatus(game.state.world, game.catalog);
  return status.stage === 0 ? 'Noch kein Lagerfeuer' : `Stufe ${status.stage} · ${status.name}`;
}

function hero(game) {
  const stage = Math.min(game.state.world.camp.stage, 1);
  const picture = h('img', { class: 'camp-picture', alt: ALT[stage] });
  const show = () => {
    const { src, tint } = campPicture(game.state.world.camp.stage, dayPhase());
    picture.className = `camp-picture ${tint ? `tint-${tint}` : ''}`;
    if (!picture.src.endsWith(src)) picture.src = src;
  };
  show();
  // the day moves on while the page stays open
  const timer = setInterval(() => (picture.isConnected ? show() : clearInterval(timer)), 60000);
  return h('section', { class: 'camp-hero' },
    picture,
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
  return h('section', { class: 'panel camp-first' },
    sectionTitle('Als Erstes'),
    h('p', {}, 'Dein Envoy wird eine Weile hier bleiben. Am besten errichtest du ein Lagerfeuer.'),
    h('button', { class: 'btn primary small', onclick: () => openPlace(CAMP_PLACE, game) }, 'Zur Quest'));
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
  const { world } = game.state;
  return h('section', { class: 'panel dash-supplies' },
    sectionTitle('Vorrat'),
    supplies(world.purse, materialLimits(world, game.catalog)),
    staminaBar(game.stamina()));
}

// --- the facilities --------------------------------------------------------------

// One facility: what it is and does, what it takes to build, and the button.
function facilityRowView(id, game, c) {
  const level = facilityLevel(c.world, id);
  const built = level > 0;
  const now = built ? facilityRow(game.catalog, id, level) : null;
  const next = facilityRow(game.catalog, id, level + 1);
  const shown = now || next;
  const quest = next ? questsAt(CAMP_PLACE, c).find((q) => q.facility === id) : null;

  let action = null;
  if (next && quest) {
    const state = questState(quest, c);
    const st = game.stamina();
    const away = Boolean(c.world.expedition);
    if (state.status === 'running') action = h('span', { class: 'quest-note' }, 'Der Envoy baut gerade.');
    else if (state.status === 'locked') action = h('span', { class: 'quest-note' }, `Es fehlt: ${state.missing.join(', ')}`);
    else if (away) action = h('button', { class: 'btn ghost small', disabled: true }, 'Der Envoy ist unterwegs');
    else if (st.value < quest.cost) action = h('button', { class: 'btn ghost small', disabled: true }, `Genug Energie in ${formatMinutes(Math.ceil(((quest.cost - st.value) / st.perHour) * 60))}`);
    else {
      action = h('button', {
        class: 'btn primary small',
        onclick: () => {
          if (!game.startExpedition(quest.id)) return;
          markMapForScroll();
          toast(`Der Envoy macht sich an die Arbeit: ${quest.name}`);
        },
      }, level === 0 ? 'Errichten' : 'Ausbauen');
    }
  }

  const costs = next ? [
    ...Object.entries(next.cost).filter(([, n]) => n > 0).map(([k, n]) => resource(k, String(n), { lacking: (c.world.purse[k] || 0) < n })),
    h('span', { class: 'res' }, h('span', { class: 'res-amount' }, String(next.energie)), h('span', { class: 'res-name' }, 'Energie')),
  ] : [];

  return h('li', { class: `facility ${built ? 'built' : ''}`, 'data-facility': id },
    h('div', { class: 'facility-main' },
      h('span', { class: 'facility-name' }, shown.name, built ? h('span', { class: 'facility-level' }, `Stufe ${level}`) : null),
      h('span', { class: 'facility-text' }, built ? facilityEffect(now) : next.text),
      !built ? h('span', { class: 'facility-effect' }, facilityEffect(next)) : null,
      !built && costs.length > 0 ? h('span', { class: 'res-list facility-costs' }, costs) : null),
    action ? h('div', { class: 'facility-action' }, action) : null);
}

function hyggeBlock(game) {
  const status = campStatus(game.state.world, game.catalog);
  if (status.need === null) return null;
  const share = Math.min(100, Math.round((100 * status.hygge) / status.need));
  return h('div', { class: 'hygge', 'data-ready': String(status.ready) },
    h('div', { class: 'hygge-top' },
      h('span', { class: 'hygge-label' }, 'Hygge'),
      h('span', { class: 'hygge-value' }, h('strong', {}, String(status.hygge)), ` / ${status.need}`)),
    h('div', { class: 'hygge-bar' }, h('span', { class: 'hygge-fill', style: { width: `${share}%` } })),
    h('p', { class: 'hygge-note' }, status.ready
      ? 'Genug Hygge für die nächste Stufe. Der Ausbau folgt mit einem späteren Update.'
      : `Mit mehr Hygge lässt sich das Lager später ausbauen. Jede Einrichtung gibt ${facilityRow(game.catalog, FACILITY_IDS[0], 1).hygge}.`));
}

function facilitiesPanel(game) {
  if (game.state.world.camp.stage < 1) return null;
  const c = game.ctx();
  return h('section', { class: 'panel camp-facilities' },
    sectionTitle('Einrichtungen'),
    hyggeBlock(game),
    h('ul', { class: 'facilities' }, FACILITY_IDS.map((id) => facilityRowView(id, game, c))));
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
      firstTaskPanel(game),
      expeditionPanel(game),
      suppliesPanel(game),
      facilitiesPanel(game),
      sightingsPanel(game),
      noticesPanel(game)));
}
