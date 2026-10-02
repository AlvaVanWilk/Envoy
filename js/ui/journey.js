// Expeditions on screen: the progress bar while the Envoy is away,
// and the report when it is back. The bar is updated every second by
// updateJourneys(); nothing else of the view has to be redrawn for that.
// Work beside the camp has no way: building at the camp is „fertig“ at a
// time, gathering on the Trümmerfeld is back at a time. A route has a part
// for every way and every work, and its report tells of every stop.

import { h } from './dom.js';
import { MATERIALS } from '../config.js';
import { openSheet, closeSheet, isSheetOpen } from './sheet.js';
import { resource, itemIcon, formatMinutes, MATERIAL_KEYS } from './parts.js';
import { progressAt, heroPosition, timeline } from '../world/expedition.js';
import { materialKey } from '../world/worldstate.js';
import { facilityRow } from '../world/camp.js';

const PHASES = [
  { id: 'out', name: 'Hinweg' },
  { id: 'act', name: 'Vor Ort' },
  { id: 'back', name: 'Rückweg' },
];
// Without a way the work itself is named.
const WORK_NAMES = { bauen: 'Bauen', sammeln: 'Sammeln' };

const single = (exp) => exp.stops.length === 1;
const kindOf = (exp) => (single(exp) ? exp.stops[0].outcome?.kind : null);
// Building at the camp itself: the Envoy does not go anywhere.
const buildingAtCamp = (exp, game) => kindOf(exp) === 'bauen' && game.catalog.placeById.get(exp.stops[0].place)?.typ === 'lager';

// What a part of the time is called: for one quest the way there, the work
// (named after it where there is no way) and the way back; on a route the
// way to a stop, the quest there, and the way back.
function partName(exp, part) {
  if (!single(exp)) {
    if (part.phase === 'out') return `Weg zu Station ${part.stop + 1}`;
    if (part.phase === 'act') return exp.stops[part.stop].title;
  }
  if (part.phase === 'act' && exp.stops[0].out === 0 && WORK_NAMES[kindOf(exp)]) return WORK_NAMES[kindOf(exp)];
  return PHASES.find((x) => x.id === part.phase).name;
}

// What an expedition or its report is called: its quest, or for a route how many.
export function expeditionTitle(x) {
  return x.stops.length === 1 ? x.stops[0].title : `Route mit ${x.stops.length} Quests`;
}

// The Envoy's token on the map walks about while he gathers.
export function heroClass(exp, t) {
  if (!exp) return '';
  const p = progressAt(exp, t);
  return p.phase === 'act' && exp.stops[p.stop]?.outcome?.kind === 'sammeln' ? 'is-gathering' : '';
}
export const RESULT_TEXT = { won: 'besiegt', calmed: 'beruhigt', driven: 'vertrieben' };
const UNLOCK_TEXT = {
  lagerfeuer: 'Das Lagerfeuer brennt. Das Lager hat jetzt Stufe 1.',
  haendler: 'Der Händler ist gerettet und handelt ab jetzt.',
};

// What a new feature says in the report: the Lagerfeuer, the Händler or a facility.
function unlockText(feature, game) {
  if (UNLOCK_TEXT[feature]) return UNLOCK_TEXT[feature];
  const [id, level] = feature.split(':');
  const row = facilityRow(game.catalog, id, Number(level));
  return row ? `${row.name} steht. Hygge +${row.hygge}.` : feature;
}

const clockTime = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

function phaseLine(exp, p, atCamp) {
  if (p.phase === 'done') return atCamp ? 'Fertig' : 'Zurück im Lager';
  const name = partName(exp, p);
  // the last minute in seconds, so a short trip visibly moves
  const seconds = Math.ceil(p.remaining * 60);
  return `${name} · noch ${seconds < 60 ? `${seconds} Sek.` : formatMinutes(Math.ceil(p.remaining))}`;
}

// The bar in parts, as wide as their share of the time; for one quest with
// the name and minutes of each part below it.
function progressBar(exp) {
  const named = single(exp);
  return h('div', { class: `journey-bar ${named ? '' : 'is-route'}` }, timeline(exp).map((part, index) =>
    h('div', { class: 'journey-part', 'data-phase': part.phase, 'data-index': String(index), style: { 'flex-grow': String(part.minutes) } },
      h('span', { class: 'journey-track' }, h('span', { class: 'journey-fill' })),
      named ? h('span', { class: 'journey-part-name' }, h('span', {}, partName(exp, part)), h('span', {}, formatMinutes(part.minutes))) : null)));
}

// Where the expedition leads: from the camp to its places and back.
function wayLine(exp, game) {
  const names = exp.stops.map((s) => game.catalog.placeById.get(s.place)?.name || '')
    .filter((name, i, all) => name && name !== all[i - 1]);
  const place = game.catalog.placeById.get(exp.stops[0].place);
  if (single(exp) && place?.typ === 'lager') return 'Im Lager';
  if (single(exp) && exp.stops[0].out === 0 && place) return place.name;
  return ['Das Lager', ...names, 'Das Lager'].join(' – ');
}

// A panel for a running expedition; updateJourneys() keeps it current.
export function journeyPanel(exp, game) {
  const atCamp = buildingAtCamp(exp, game);
  const el = h('div', { class: 'journey', 'data-journey': exp.id, 'data-at-camp': atCamp ? 'true' : null },
    h('div', { class: 'journey-head' },
      h('span', { class: 'journey-title' }, expeditionTitle(exp)),
      h('span', { class: 'journey-place' }, wayLine(exp, game))),
    progressBar(exp),
    h('div', { class: 'journey-foot' },
      h('span', { class: 'journey-phase' }, ''),
      h('span', { class: 'journey-until' }, `${atCamp ? 'fertig um' : 'zurück um'} ${clockTime(exp.end)}`)));
  updateJourney(el, exp, Date.now());
  return el;
}

function updateJourney(el, exp, t) {
  const p = progressAt(exp, t);
  el.querySelectorAll('.journey-part').forEach((part) => {
    const index = Number(part.dataset.index);
    let share = 0;
    if (index < p.index) share = 1;
    else if (index === p.index) share = p.phaseShare;
    part.querySelector('.journey-fill').style.width = `${(share * 100).toFixed(2)}%`;
    part.classList.toggle('current', index === p.index);
  });
  el.querySelector('.journey-phase').textContent = phaseLine(exp, p, el.dataset.atCamp === 'true');
}

// Called every second by the app. Returns true once an expedition has
// come back, so the app can recalculate the state.
export function updateJourneys(game) {
  const exp = game.state.world.expedition;
  if (!exp) return false;
  const t = Date.now();
  document.querySelectorAll(`[data-journey="${exp.id}"]`).forEach((el) => updateJourney(el, exp, t));
  const pos = heroPosition(exp, t, game.catalog);
  const gathering = heroClass(exp, t) !== '';
  document.querySelectorAll('.hero-token').forEach((el) => {
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
    el.classList.toggle('is-gathering', gathering);
  });
  return t >= exp.end;
}

// --- report --------------------------------------------------------------

function fightRow(f, game) {
  const monster = game.catalog.monsterById.get(f.monster);
  return h('li', { class: `report-fight ${f.result}` },
    h('span', { class: 'portrait' }, monster ? h('img', { src: monster.bild, alt: '' }) : null),
    h('span', { class: 'report-fight-name' }, monster ? monster.name : f.monster),
    h('span', { class: 'report-fight-result' }, RESULT_TEXT[f.result] || f.result));
}

function newInCompendium(report, game) {
  const count = {};
  for (const stop of report.stops) for (const f of stop.outcome.fights) count[f.monster] = (count[f.monster] || 0) + 1;
  return Object.keys(count)
    .filter((id) => game.state.world.bestiary[id]?.seen === count[id])
    .map((id) => game.catalog.monsterById.get(id)?.name)
    .filter(Boolean);
}

// What one stop brought: the spirits met there and what the Envoy found.
// From a cave not cleared he goes back, or on a route on to the next place.
function stopReport(stop, game, onward = false) {
  const o = stop.outcome;
  const r = o.reward;
  const gained = {};
  for (const [key, amount] of Object.entries(r)) {
    if (MATERIAL_KEYS.includes(materialKey(key)) && amount) gained[materialKey(key)] = (gained[materialKey(key)] || 0) + amount;
  }
  const loot = [];
  for (const key of MATERIAL_KEYS) if (gained[key]) loot.push(resource(key, gained[key], { sign: '+' }));
  for (const thing of r.things) {
    const t = thing.kind === 'furniture' ? game.catalog.furnitureById.get(thing.id) : game.catalog.itemById.get(thing.id);
    if (t) loot.push(h('span', { class: 'loot-thing' }, itemIcon(t, 'loot-icon'), t.name));
  }
  let summary = null;
  if (o.kind === 'hoehle') {
    summary = h('p', { class: 'report-summary' }, o.cleared
      ? `Alle ${o.total} Geister überwunden.`
      : `${o.fights.filter((f) => f.result !== 'driven').length} von ${o.total} Geistern überwunden, dann ${onward ? 'weiter' : 'zurück ins Lager'}.`);
  }
  return [
    summary,
    o.fights.length > 0 ? h('ul', { class: 'report-fights' }, o.fights.map((f) => fightRow(f, game))) : null,
    loot.length > 0 ? h('div', {}, h('p', { class: 'label' }, 'Mitgebracht'), h('div', { class: 'loot' }, loot)) : null,
  ];
}

export function openReport(report, game) {
  const outcomes = report.stops.map((s) => s.outcome);
  const consumed = {};
  for (const o of outcomes) for (const [k, v] of Object.entries(o.consumed || {})) if (v > 0) consumed[materialKey(k)] = (consumed[materialKey(k)] || 0) + v;
  const unlocks = outcomes.flatMap((o) => o.reward.unlocks);
  const rest = outcomes.some((o) => o.reward.rest);
  const fresh = newInCompendium(report, game);
  const route = report.stops.length > 1;

  openSheet({
    title: expeditionTitle(report),
    eyebrow: buildingAtCamp(report, game) ? 'Im Lager' : 'Zurück im Lager',
    className: 'report-sheet',
    content: [
      route
        ? report.stops.map((stop, i) => h('section', { class: 'report-stop' },
          h('p', { class: 'report-stop-title' }, h('span', { class: 'report-stop-n' }, String(i + 1)), stop.title,
            h('span', { class: 'report-stop-place' }, game.catalog.placeById.get(stop.place)?.name || '')),
          stopReport(stop, game, i < report.stops.length - 1)))
        : stopReport(report.stops[0], game),
      Object.keys(consumed).length > 0 ? h('p', { class: 'muted' }, `Verbaut: ${Object.entries(consumed).map(([k, v]) => `${v} ${MATERIALS[k]}`).join(', ')}`) : null,
      Object.keys(report.leftBehind || {}).length > 0
        ? h('p', { class: 'muted' }, `Zurückgelassen: ${Object.entries(report.leftBehind).map(([k, v]) => `${v} ${MATERIALS[k]}`).join(', ')}. Mehr konnte der Envoy nicht tragen.`)
        : null,
      unlocks.map((f) => h('p', { class: 'report-unlock' }, unlockText(f, game))),
      rest ? h('p', { class: 'report-unlock' }, 'Die Energie ist wieder voll.') : null,
      fresh.length > 0 ? h('p', { class: 'muted' }, `Neu im Kompendium: ${fresh.join(', ')}`) : null,
      h('div', { class: 'sheet-actions' }, h('button', { class: 'btn primary', onclick: closeSheet }, 'Weiter')),
    ],
    onClose: () => game.markReportSeen(report.id),
  });
}

// Shows the oldest report this device has not shown yet.
export function showPendingReport(game) {
  if (isSheetOpen()) return;
  const [report] = game.unseenReports();
  if (report) openReport(report, game);
}

