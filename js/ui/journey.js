// Expeditions on screen: the bar while the Envoy is away, the row of what he
// does, and the report when he is back. updateJourneys() moves the bar every
// second; nothing else of the view has to be redrawn for that.
// One action: the bar in its parts, way there, work, way back, with names.
// Several: one block for every action (its way part tinted) and the way home,
// and below the bar the row: done, now, waiting (the last one waiting can be
// taken out). Building at the camp is „fertig“ at a time, all else back at a time.
// Above the bar the scene of what the Envoy is doing right now, below it the
// diary of the trip (see scene.js); on the map, short words rise from the
// Envoy as things happen.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { MATERIALS } from '../config.js';
import { openSheet, closeSheet, isSheetOpen, toast } from './sheet.js';
import { resource, itemIcon, dekoIcon, formatMinutes, MATERIAL_KEYS } from './parts.js';
import { thingName } from '../world/clothes.js';
import { progressAt, heroPosition, timeline, timesOf, nextStep } from '../world/expedition.js';
import { materialKey } from '../world/worldstate.js';
import { facilityRow, stageRow } from '../world/camp.js';
import { updateScene, updateDiary, freshEvents } from './scene.js';
import { updateTripSign } from './tripsign.js';

const PART_NAMES = { way: 'Hinweg', work: 'Vor Ort', home: 'Rückweg' };
// Without a way the work itself is named.
const WORK_NAMES = { bauen: 'Bauen', sammeln: 'Sammeln' };

const single = (exp) => exp.actions.length === 1;
// Building at the camp itself: the Envoy does not go anywhere.
const buildingAtCamp = (exp, game) => single(exp) && exp.actions[0].outcome?.kind === 'bauen'
  && game.catalog.placeById.get(exp.actions[0].place)?.typ === 'lager';

function partName(exp, part) {
  const a = exp.actions[part.i];
  if (part.kind === 'work' && a.way === 0 && WORK_NAMES[a.outcome?.kind]) return WORK_NAMES[a.outcome.kind];
  return PART_NAMES[part.kind];
}

// What a report is called: its quest, or how many stations there were.
export function expeditionTitle(x) {
  const list = x.stops || x.actions || [];
  if (list.length === 1) return list[0].title;
  return list.length > 1 ? `${list.length} Stationen` : 'Zurück im Lager';
}

// What the Envoy is at right now: the action he is on the way to or at work on.
export function currentTitle(exp, t = Date.now()) {
  const p = progressAt(exp, t);
  return exp.actions[Math.max(0, p.i)]?.title || '';
}

// The Envoy's token on the map walks about while he gathers.
export function heroClass(exp, t) {
  if (!exp) return '';
  const p = progressAt(exp, t);
  return p.phase === 'work' && exp.actions[p.i]?.outcome?.kind === 'sammeln' ? 'is-gathering' : '';
}
export const RESULT_TEXT = { won: 'besiegt', calmed: 'beruhigt', driven: 'vertrieben' };
const UNLOCK_TEXT = {
  lagerfeuer: 'Das Lagerfeuer brennt. Das Lager hat jetzt Stufe 1.',
  haendler: 'Der Händler ist gerettet und handelt ab jetzt.',
};

// What a new feature says in the report: the Lagerfeuer, the Händler, a
// stage of the camp, a facility or a Deko.
function unlockText(feature, game) {
  if (UNLOCK_TEXT[feature]) return UNLOCK_TEXT[feature];
  const [id, level] = feature.split(':');
  if (id === 'lager') return `Das Lager ist jetzt: ${stageRow(game.catalog, Number(level))?.name || `Stufe ${level}`}.`;
  if (id === 'deko') {
    const deko = game.catalog.dekoById.get(level);
    return deko ? `${deko.name} steht. Hygge +${deko.hygge}.` : feature;
  }
  const row = facilityRow(game.catalog, id, Number(level));
  if (!row) return feature;
  const before = facilityRow(game.catalog, id, Number(level) - 1)?.hygge || 0;
  return `${row.name} steht. Hygge +${row.hygge - before}.`;
}

const clockTime = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

function phaseLine(exp, p, atCamp) {
  if (p.phase === 'done') return atCamp ? 'Fertig' : 'Zurück im Lager';
  const name = partName(exp, { kind: p.phase, i: Math.max(0, p.i) });
  // the last minute in seconds, so a short trip visibly moves
  const seconds = Math.ceil(p.remaining * 60);
  return `${name} · noch ${seconds < 60 ? `${seconds} Sek.` : formatMinutes(Math.ceil(p.remaining))}`;
}

// A part of the bar: a track with its fill, as wide as its share of the time.
const track = (part, index) => h('span', { class: 'journey-track', 'data-kind': part.kind, 'data-index': String(index), style: { 'flex-grow': String(part.minutes) } },
  h('span', { class: 'journey-fill' }));

// One action: three parts with their names. Several: a block for every action
// (way and work together) and the ways home.
function progressBar(exp) {
  const parts = timeline(exp);
  if (single(exp)) {
    return h('div', { class: 'journey-bar' }, parts.map((part, index) =>
      h('div', { class: 'journey-part', 'data-phase': part.kind, style: { 'flex-grow': String(part.minutes) } },
        track(part, index),
        h('span', { class: 'journey-part-name' }, h('span', {}, partName(exp, part)), h('span', {}, formatMinutes(Math.round(part.minutes)))))));
  }
  const blocks = [];
  parts.forEach((part, index) => {
    const last = blocks[blocks.length - 1];
    const sameAction = last && part.kind !== 'home' && last.kind !== 'home' && last.i === part.i;
    if (sameAction) last.tracks.push(track(part, index));
    else blocks.push({ kind: part.kind === 'home' ? 'home' : 'action', i: part.i, tracks: [track(part, index)] });
  });
  return h('div', { class: 'journey-bar is-row' }, blocks.map((b) =>
    h('div', { class: `journey-block is-${b.kind}`, style: { 'flex-grow': String(b.tracks.reduce((n, el) => n + Number(el.style.flexGrow), 0)) } }, b.tracks)));
}

// The row below the bar: every action with its place, done, now or waiting.
function actionRow(exp, game) {
  const last = exp.actions.length - 1;
  return h('ol', { class: 'journey-row' }, exp.actions.map((a, i) => {
    const place = game.catalog.placeById.get(a.place);
    const removable = i === last && a.stage === 0;
    return h('li', { class: 'journey-stop', 'data-stop': String(i) },
      h('span', { class: 'journey-mark' }, h('span', { class: 'journey-n' }, String(i + 1)), icon(UI_ICONS.check, 'icon journey-check')),
      h('span', { class: 'journey-stop-text' },
        h('span', { class: 'journey-stop-title' }, a.title, a.outcome?.gather ? ` · ${a.outcome.gather.wanted}` : ''),
        h('span', { class: 'journey-stop-place' }, place ? place.name : '')),
      removable ? h('button', {
        class: 'journey-remove', type: 'button', 'aria-label': `${a.title} aus der Reihe nehmen`,
        onclick: () => { game.unqueue(a.id); toast(`Aus der Reihe genommen: ${a.title}`); },
      }, icon(UI_ICONS.close)) : null);
  }));
}

// Where the expedition leads: one place, or the way from the camp and back.
function wayLine(exp, game) {
  const place = game.catalog.placeById.get(exp.actions[0].place);
  if (single(exp) && place?.typ === 'lager') return 'Im Lager';
  if (single(exp) && exp.actions[0].way === 0 && place) return place.name;
  const names = exp.actions.map((a) => game.catalog.placeById.get(a.place)?.name || '')
    .filter((name, i, all) => name && name !== all[i - 1]);
  return ['Das Lager', ...names, 'Das Lager'].join(' – ');
}

// A panel for a running expedition; updateJourneys() keeps it current.
export function journeyPanel(exp, game) {
  const atCamp = buildingAtCamp(exp, game);
  const el = h('div', { class: 'journey', 'data-journey': exp.id, 'data-at-camp': atCamp ? 'true' : null },
    h('div', { class: 'journey-head' },
      h('span', { class: 'journey-title' }, single(exp) ? exp.actions[0].title : currentTitle(exp)),
      h('span', { class: 'journey-place' }, wayLine(exp, game))),
    h('div', { class: 'journey-scene' }),
    progressBar(exp),
    h('div', { class: 'journey-foot' },
      h('span', { class: 'journey-phase' }, ''),
      h('span', { class: 'journey-until' }, `${atCamp ? 'fertig um' : 'zurück um'} ${clockTime(timesOf(exp).end)}`)),
    single(exp) ? null : actionRow(exp, game),
    h('ol', { class: 'diary', 'aria-label': 'Unterwegs' }));
  updateJourney(el, exp, Date.now(), game);
  return el;
}

function updateJourney(el, exp, t, game) {
  updateScene(el.querySelector('.journey-scene'), exp, game, t);
  updateDiary(el.querySelector('.diary'), exp, game, t);
  const p = progressAt(exp, t);
  const parts = timeline(exp);
  const current = p.phase === 'done' ? parts.length : parts.findIndex((part) => part.kind === p.phase && part.i === p.i);
  el.querySelectorAll('.journey-track').forEach((tr) => {
    const index = Number(tr.dataset.index);
    let share = 0;
    if (index < current) share = 1;
    else if (index === current) share = p.share;
    tr.querySelector('.journey-fill').style.width = `${(share * 100).toFixed(2)}%`;
    tr.closest('.journey-part, .journey-block')?.classList.toggle('current', index === current);
  });
  const times = timesOf(exp).actions;
  el.querySelectorAll('.journey-stop').forEach((li) => {
    const x = times[Number(li.dataset.stop)];
    li.dataset.state = !x ? 'gone' : t >= x.done ? 'done' : t >= x.begin ? 'now' : 'waiting';
  });
  el.querySelector('.journey-phase').textContent = phaseLine(exp, p, el.dataset.atCamp === 'true');
}

// Called every second by the app. Returns true once something on the
// expedition is due (an action done, the Envoy back), so the app can
// recalculate the state.
export function updateJourneys(game) {
  const exp = game.state.world.expedition;
  if (!exp) { updateTripSign(game); return false; }
  const t = Date.now();
  document.querySelectorAll(`[data-journey="${exp.id}"]`).forEach((el) => updateJourney(el, exp, t, game));
  const pos = heroPosition(exp, t, game.catalog);
  const gathering = heroClass(exp, t) !== '';
  const fresh = freshEvents(exp, game, t).filter((e) => e.pop);
  updateTripSign(game, fresh);
  document.querySelectorAll('.hero-token').forEach((el) => {
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
    el.classList.toggle('is-gathering', gathering);
    fresh.forEach((e, n) => setTimeout(() => mapPop(el, e), n * 700));
  });
  return t >= nextStep(exp).time;
}

// A short word rising from the Envoy on the map (a find, a spirit overcome).
function mapPop(token, event) {
  const canvas = token.parentElement;
  if (!canvas) return;
  const el = h('span', { class: `map-pop${event.lucky ? ' is-lucky' : ''}`, style: { left: token.style.left, top: token.style.top } }, event.pop);
  canvas.append(el);
  el.addEventListener('animationend', () => el.remove());
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

// What one station brought: the spirits met there and what the Envoy found.
// From a cave not cleared he goes back, or on to the next place.
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
    const t = game.catalog.itemById.get(thing.id);
    if (t) loot.push(h('span', { class: 'loot-thing' }, itemIcon(t, game, 'loot-icon', thing.farbe), thingName(t, thing.farbe)));
  }
  for (const id of r.plans || []) {
    const deko = game.catalog.dekoById.get(id);
    if (deko) loot.push(h('span', { class: 'loot-thing loot-plan' }, dekoIcon(deko, 'loot-icon'), `Plan gefunden: ${deko.name}`));
  }
  let summary = null;
  if (o.kind === 'hoehle') {
    summary = h('p', { class: 'report-summary' }, o.cleared
      ? `Alle ${o.total} Geister überwunden.`
      : `${o.fights.filter((f) => f.result !== 'driven').length} von ${o.total} Geistern überwunden, dann ${onward ? 'weiter' : 'zurück ins Lager'}.`);
  }
  if (o.gather?.cut) summary = h('p', { class: 'report-summary' }, `Die Energie reichte für ${r[o.gather.material]} ${MATERIALS[o.gather.material]}.`);
  return [
    summary,
    o.fights.length > 0 ? h('ul', { class: 'report-fights' }, o.fights.map((f) => fightRow(f, game))) : null,
    loot.length > 0 ? h('div', {}, h('p', { class: 'label' }, 'Mitgebracht'), h('div', { class: 'loot' }, loot)) : null,
  ];
}

const DROPPED_TEXT = { energy: 'Dafür reichte die Energie nicht mehr.', material: 'Dafür fehlte das Material.' };

export function openReport(report, game) {
  const outcomes = report.stops.map((s) => s.outcome);
  const consumed = {};
  for (const o of outcomes) for (const [k, v] of Object.entries(o.consumed || {})) if (v > 0) consumed[materialKey(k)] = (consumed[materialKey(k)] || 0) + v;
  const unlocks = outcomes.flatMap((o) => o.reward.unlocks);
  const rest = outcomes.some((o) => o.reward.rest);
  const fresh = newInCompendium(report, game);
  const several = report.stops.length > 1;
  const onlyAtCamp = report.stops.length === 1 && outcomes[0].kind === 'bauen' && game.catalog.placeById.get(report.stops[0].place)?.typ === 'lager';

  const { panel } = openSheet({
    title: expeditionTitle(report),
    eyebrow: onlyAtCamp ? 'Im Lager' : 'Zurück im Lager',
    className: 'report-sheet',
    content: [
      several
        ? report.stops.map((stop, i) => h('section', { class: 'report-stop' },
          h('p', { class: 'report-stop-title' }, h('span', { class: 'report-stop-n' }, String(i + 1)), stop.title,
            h('span', { class: 'report-stop-place' }, game.catalog.placeById.get(stop.place)?.name || '')),
          stopReport(stop, game, i < report.stops.length - 1)))
        : report.stops.length === 1 ? stopReport(report.stops[0], game) : null,
      (report.dropped || []).map((d) => h('p', { class: 'muted' }, `Ausgelassen: ${d.title}. ${DROPPED_TEXT[d.reason] || ''}`)),
      Object.keys(consumed).length > 0 ? h('p', { class: 'muted' }, `Verbaut: ${Object.entries(consumed).map(([k, v]) => `${v} ${MATERIALS[k]}`).join(', ')}`) : null,
      Object.keys(report.leftBehind || {}).length > 0
        ? h('p', { class: 'muted' }, `Zurückgelassen: ${Object.entries(report.leftBehind).map(([k, v]) => `${v} ${MATERIALS[k]}`).join(', ')}. Mehr passte nicht in den Vorrat.`)
        : null,
      unlocks.map((f) => h('p', { class: 'report-unlock' }, unlockText(f, game))),
      rest ? h('p', { class: 'report-unlock' }, 'Die Energie ist wieder voll.') : null,
      fresh.length > 0 ? h('p', { class: 'muted' }, `Neu im Kompendium: ${fresh.join(', ')}`) : null,
      h('div', { class: 'sheet-actions' }, h('button', { class: 'btn primary', onclick: closeSheet }, 'Weiter')),
    ],
    onClose: () => game.markReportSeen(report.id),
  });
  reveal(panel);
}

// The report unfolds: the spirits met, then what he brought, one after the
// other, each lighting up; the amounts count up.
const REVEAL_FIRST = 250;
const REVEAL_STEP = 180;
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function reveal(panel) {
  if (still()) return;
  const parts = [...panel.querySelectorAll('.report-summary, .report-fight, .loot > *, .report-unlock')];
  parts.forEach((el, n) => {
    el.classList.add('is-revealed');
    el.style.setProperty('--i', String(n));
    const amount = el.querySelector('.res-amount');
    if (amount) countUp(amount, REVEAL_FIRST + n * REVEAL_STEP);
  });
}

function countUp(el, delay) {
  const match = /^([+]?)(\d+)$/.exec(el.textContent.trim());
  if (!match) return;
  const [, sign, digits] = match;
  const to = Number(digits);
  const duration = Math.min(900, 300 + to * 40);
  el.textContent = `${sign}0`;
  setTimeout(() => {
    const begin = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - begin) / duration);
      el.textContent = `${sign}${Math.round(to * (1 - (1 - k) ** 2))}`;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, delay);
}

// Shows the oldest report this device has not shown yet.
export function showPendingReport(game) {
  if (isSheetOpen()) return;
  const [report] = game.unseenReports();
  if (report) openReport(report, game);
}
