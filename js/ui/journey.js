// Expeditions on screen: the progress bar while the Envoy is away,
// and the report when it is back. The bar is updated every second by
// updateJourneys(); nothing else of the view has to be redrawn for that.

import { h } from './dom.js';
import { MATERIALS } from '../config.js';
import { openSheet, closeSheet, isSheetOpen } from './sheet.js';
import { resource, itemIcon, formatMinutes, MATERIAL_KEYS } from './parts.js';
import { progressAt, heroPosition } from '../world/expedition.js';
import { materialKey } from '../world/worldstate.js';

const PHASES = [
  { id: 'out', name: 'Hinweg' },
  { id: 'act', name: 'Vor Ort' },
  { id: 'back', name: 'Rückweg' },
];
const RESULT_TEXT = { won: 'besiegt', calmed: 'beruhigt', driven: 'vertrieben' };
const UNLOCK_TEXT = {
  zuhause: 'Das Zelt steht. Zuhause und Schrank sind offen.',
  haendler: 'Der Händler ist gerettet und handelt ab jetzt.',
};

const clockTime = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

function phaseLine(exp, p) {
  if (p.phase === 'done') return 'Zurück im Lager';
  const name = PHASES.find((x) => x.id === p.phase).name;
  const minutes = Math.ceil(p.remaining);
  return `${name} · noch ${minutes <= 1 ? 'eine Minute' : formatMinutes(minutes)}`;
}

// The bar in three parts, as wide as their share of the time.
function progressBar(exp) {
  return h('div', { class: 'journey-bar' }, PHASES.filter((ph) => exp[ph.id] > 0).map((ph) =>
    h('div', { class: 'journey-part', 'data-phase': ph.id, style: { 'flex-grow': String(exp[ph.id]) } },
      h('span', { class: 'journey-track' }, h('span', { class: 'journey-fill' })),
      h('span', { class: 'journey-part-name' }, h('span', {}, ph.name), h('span', {}, formatMinutes(exp[ph.id]))))));
}

// A panel for a running expedition; updateJourneys() keeps it current.
export function journeyPanel(exp, game) {
  const place = game.catalog.placeById.get(exp.place);
  const el = h('div', { class: 'journey', 'data-journey': exp.id },
    h('div', { class: 'journey-head' },
      h('span', { class: 'journey-title' }, exp.title),
      h('span', { class: 'journey-place' }, `Das Lager – ${place ? place.name : ''} – Das Lager`)),
    progressBar(exp),
    h('div', { class: 'journey-foot' },
      h('span', { class: 'journey-phase' }, ''),
      h('span', { class: 'journey-until' }, `zurück um ${clockTime(exp.end)}`)));
  updateJourney(el, exp, Date.now());
  return el;
}

function updateJourney(el, exp, t) {
  const p = progressAt(exp, t);
  const order = PHASES.map((x) => x.id);
  const current = order.indexOf(p.phase);
  el.querySelectorAll('.journey-part').forEach((part) => {
    const index = order.indexOf(part.dataset.phase);
    let share = 0;
    if (p.phase === 'done' || index < current) share = 1;
    else if (index === current) share = p.phaseShare;
    part.querySelector('.journey-fill').style.width = `${(share * 100).toFixed(2)}%`;
    part.classList.toggle('current', index === current);
  });
  el.querySelector('.journey-phase').textContent = phaseLine(exp, p);
}

// Called every second by the app. Returns true once an expedition has
// come back, so the app can recalculate the state.
export function updateJourneys(game) {
  const exp = game.state.world.expedition;
  if (!exp) return false;
  const t = Date.now();
  document.querySelectorAll(`[data-journey="${exp.id}"]`).forEach((el) => updateJourney(el, exp, t));
  const pos = heroPosition(exp, t, game.catalog);
  document.querySelectorAll('.hero-token').forEach((el) => {
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
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
  for (const f of report.outcome.fights) count[f.monster] = (count[f.monster] || 0) + 1;
  return Object.keys(count)
    .filter((id) => game.state.world.bestiary[id]?.seen === count[id])
    .map((id) => game.catalog.monsterById.get(id)?.name)
    .filter(Boolean);
}

export function openReport(report, game) {
  const o = report.outcome;
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
  const consumed = Object.entries(o.consumed || {}).filter(([, v]) => v > 0).map(([k, v]) => [materialKey(k), v]);
  const fresh = newInCompendium(report, game);

  let summary = null;
  if (o.kind === 'hoehle') {
    summary = h('p', { class: 'report-summary' }, o.cleared
      ? `Alle ${o.total} Geister überwunden.`
      : `${o.fights.filter((f) => f.result !== 'driven').length} von ${o.total} Geistern überwunden, dann zurück ins Lager.`);
  }

  openSheet({
    title: report.title,
    eyebrow: 'Zurück im Lager',
    className: 'report-sheet',
    content: [
      summary,
      o.fights.length > 0 ? h('ul', { class: 'report-fights' }, o.fights.map((f) => fightRow(f, game))) : null,
      loot.length > 0 ? h('div', {}, h('p', { class: 'label' }, 'Mitgebracht'), h('div', { class: 'loot' }, loot)) : null,
      consumed.length > 0 ? h('p', { class: 'muted' }, `Verbaut: ${consumed.map(([k, v]) => `${v} ${MATERIALS[k]}`).join(', ')}`) : null,
      r.unlocks.map((f) => h('p', { class: 'report-unlock' }, UNLOCK_TEXT[f] || f)),
      r.rest ? h('p', { class: 'report-unlock' }, 'Die Ausdauerleiste ist wieder voll.') : null,
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

