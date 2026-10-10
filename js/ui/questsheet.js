// The window of one quest: what it is about, what it needs, what it brings
// and what it costs in Energie (as a bar: what stays, and what it takes as
// one block with its way part). Gathering on the Trümmerfeld has its own
// window: the Envoy is told how much to gather.
// While the Envoy is away, anything he can do is added to the row of what he
// does („Anhängen“): he goes there straight from the last place, the way home
// he no longer walks is given back, and the window speaks of the world as it
// will be after the row (material gathered on the way counts, see game.plan).

import { h, icon, replaceChildren } from './dom.js';
import { UI_ICONS } from './icons.js';
import { CURRENCY, MATERIALS, GATHER_BASE, GATHER_DICE } from '../config.js';
import { resource, resourceIcon, energyPreview, formatMinutes, MATERIAL_KEYS } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { markMapForScroll } from './worldmap.js';
import { conditionMet, describeCondition, KIND_NAMES } from '../world/quests.js';
import { besideTheCamp } from '../world/map.js';
import { roomFor, LIMITED_MATERIALS } from '../world/inventory.js';
import { rewardRange, gatherEstimate } from '../world/run.js';
import { facilityRow, facilityEffect, stageRow } from '../world/camp.js';
import { obtainable, figureOf } from '../world/clothes.js';
import { formatDayShort } from '../days.js';

const range = ([a, b]) => (a === b ? String(a) : `${a}–${b}`);
const paragraphs = (text) => text.split('\n').filter(Boolean).map((p) => h('p', {}, p));
const note = (text) => h('span', { class: 'quest-note' }, text);

export function fact(label, ...value) {
  return h('div', { class: 'fact' }, h('dt', {}, label), h('dd', {}, ...value));
}

// What a feature is called among the rewards: Lagerfeuer, Händler, a stage
// of the camp, a facility or a Deko.
function unlockName(feature, c) {
  if (feature === 'lagerfeuer') return 'Lagerfeuer';
  if (feature === 'haendler') return 'Händler';
  const [id, level] = feature.split(':');
  if (id === 'lager') return stageRow(c.catalog, Number(level))?.name || feature;
  if (id === 'deko') return c.catalog.dekoById.get(level)?.name || feature;
  return facilityRow(c.catalog, id, Number(level))?.name || feature;
}

function rewardParts(quest, c, monsters) {
  const parts = [];
  const r = rewardRange(quest, c);
  if (r) for (const key of MATERIAL_KEYS) if (r[key][1] > 0) parts.push(resource(key, range(r[key])));
  const names = [
    ...(quest.reward?.items || []).map((id) => c.catalog.itemById.get(id))
      .filter((item) => obtainable(item, figureOf(c.world))).map((item) => item.name),
    ...(quest.reward?.plans || []).map((id) => c.catalog.dekoById.get(id)?.name).filter(Boolean).map((name) => `Plan: ${name}`),
  ].filter(Boolean);
  for (const name of names) parts.push(h('span', { class: 'pill' }, name));
  if (quest.facility) {
    const row = facilityRow(c.catalog, quest.facility, quest.level);
    parts.push(h('span', {}, `${facilityEffect(row)} · Hygge ${row.hygge}`));
  } else {
    for (const f of quest.reward?.unlocks || []) parts.push(h('span', { class: 'pill' }, unlockName(f, c)));
  }
  if (quest.reward?.rest) parts.push(h('span', { class: 'pill' }, 'Energie voll'));
  if (monsters.length > 0) parts.push(h('span', { class: 'muted' }, `${CURRENCY}, manchmal ein Fundstück`));
  return parts;
}

// What a quest needs: stats, other quests, and the material it uses up
// (for a facility only the material: the camp stage it needs is plain).
export function requirements(quest, c, { conditions = true } = {}) {
  const item = (met, text, res = null) => h('span', { class: `cond ${met ? 'met' : 'unmet'}` },
    icon(met ? UI_ICONS.check : UI_ICONS.lock), res ? resourceIcon(res) : null, text);
  return [
    ...(conditions ? quest.conditions : []).map((cond) => item(conditionMet(cond, c), describeCondition(cond, c))),
    ...Object.entries(quest.consumes).filter(([, n]) => n > 0)
      .map(([key, n]) => item((c.world.purse[key] || 0) >= n, `${n} ${MATERIALS[key]}`, key)),
  ];
}

// Building at the camp is building; everything else sets out on a way.
function verb(quest, place) {
  if (quest.gather) return 'Sammeln';
  if (quest.kind !== 'bauen' || !besideTheCamp(place)) return 'Aufbrechen';
  if (quest.upgrade) return 'Aufwerten';
  if (quest.deko) return 'Bauen';
  return quest.facility && quest.level > 1 ? 'Ausbauen' : 'Errichten';
}

function start(quest, game, options, message) {
  const busy = Boolean(game.state.world.expedition);
  if (!game.startExpedition(quest.id, options)) return;
  closeSheet();
  if (!busy) markMapForScroll();
  toast(message);
}

function waitButton(cost, st) {
  const minutes = Math.ceil(((cost - st.value) / st.perHour) * 60);
  return h('button', { class: 'btn ghost', disabled: true }, `Genug Energie in ${formatMinutes(minutes)}`);
}

// Where a quest is in the row: on the way there, at work, or waiting.
function queuedNote(quest, queued, place) {
  const { action, index, count } = queued;
  if (action.stage === 1) return note('Der Envoy ist auf dem Weg dorthin.');
  if (action.stage === 2) {
    if (quest.gather) return note('Der Envoy sammelt gerade.');
    return note(quest.kind === 'bauen' && besideTheCamp(place) ? 'Der Envoy baut gerade daran.' : 'Der Envoy ist gerade dort.');
  }
  return note(`In der Reihe, Station ${index + 1} von ${count}.`);
}

function removeButton(quest, queued, game) {
  return h('button', {
    class: 'btn ghost',
    onclick: () => { game.unqueue(queued.action.id); closeSheet(); toast(`Aus der Reihe genommen: ${quest.name}`); },
  }, 'Herausnehmen');
}

// What can be done with a quest right now: set out for it, or add it to the
// row while the Envoy is away; wait for Energie, or a note why not. A quest
// already in the row says where it is, and the last one waiting can be taken out.
// options: for gathering { amount }, message: what the toast says
export function questAction(quest, plan, game, place, options = {}, message = null) {
  const st = game.stamina();
  const queued = game.queued(quest.id);
  const label = plan.busy ? 'Anhängen' : verb(quest, place);
  const building = !plan.busy && label !== 'Aufbrechen' && label !== 'Sammeln';
  const parts = queued ? [queuedNote(quest, queued, place), queued.removable ? removeButton(quest, queued, game) : null] : [];
  const status = plan.state.status;
  let main;
  if (queued && status !== 'open') main = null;
  else if (status === 'done') main = note(quest.encounter ? 'Heute erledigt.' : 'Erledigt.');
  else if (status === 'cooldown') main = note(`Wieder ab ${formatDayShort(plan.state.again)}.`);
  else if (status !== 'open') main = h('button', { class: 'btn primary', disabled: true }, label);
  else if (plan.block === 'never') main = note('Die Energie reicht dafür noch nicht. Sie wächst mit dem Wert Ausdauer.');
  else if (plan.block === 'energy') main = waitButton(plan.needed, st);
  else {
    const text = message || (plan.busy ? `Angehängt: ${quest.name}`
      : building ? `Der Envoy macht sich an die Arbeit: ${quest.name}` : `Aufgebrochen: ${quest.name}`);
    main = h('button', { class: 'btn primary', onclick: () => start(quest, game, options, text) }, label);
  }
  return [...parts, main];
}

// A reward larger than what still fits into the Vorrat: said before setting
// out (while the Envoy is away, after what the row brings).
function carryNote(quest, c) {
  const r = rewardRange(quest, c);
  if (!r) return null;
  const notes = LIMITED_MATERIALS
    .map((key) => [key, roomFor(c.world, c.catalog, key)])
    .filter(([key, room]) => r[key][1] > room)
    .map(([key, room]) => (room > 0 ? `In den Vorrat passen davon nur ${room} ${MATERIALS[key]}.` : `Der Vorrat an ${MATERIALS[key]} ist voll.`));
  return notes.length > 0 ? h('p', { class: 'quest-note carry-note' }, notes.join(' ')) : null;
}

function questBody(quest, game, place) {
  const plan = game.plan(quest.id);
  const c = plan.ctx;
  const state = plan.state;
  const open = state.status === 'open' || state.status === 'locked';
  const monsters = quest.monsters.map((id) => c.catalog.monsterById.get(id)).filter(Boolean);

  const facts = [];
  if (open) {
    const needs = requirements(quest, c);
    if (needs.length > 0) facts.push(fact('Voraussetzung', h('span', { class: 'cond-list' }, needs)));
    if (quest.kind === 'kampf') {
      const m = monsters[0];
      facts.push(fact('Geist', h('span', { class: 'foe' }, h('span', { class: 'portrait small' }, h('img', { src: m.bild, alt: '' })), `${m.name} · Stufe ${m.stufe}`)));
    }
    if (quest.kind === 'hoehle') facts.push(fact('Geister', `${monsters.length} nacheinander`));
    const reward = rewardParts(quest, c, monsters);
    if (reward.length > 0) facts.push(fact('Belohnung', h('span', { class: 'res-list' }, reward)));
  }

  return [
    quest.text && open ? h('div', { class: 'quest-text' }, paragraphs(quest.text)) : null,
    facts.length > 0 ? h('dl', { class: 'quest-facts' }, facts) : null,
    open ? carryNote(quest, c) : null,
    open ? energyPreview(game.stamina(), plan.cost) : null,
    h('div', { class: 'quest-actions' }, questAction(quest, plan, game, place)),
  ];
}

// --- gathering -------------------------------------------------------------------

// How much the Envoy is told to gather, kept while the app is open.
const gatherChoice = { stein: 1, pilzholz: 1 };

// He gathers as much as is chosen: at most what fits into the Vorrat (after
// what the row brings), and what the Energie allows: right away, even with the worst
// dice; in the row, with the best (see game.plan). A tap on + beyond that
// says why there is no more.
function gatherBody(quest, game) {
  const { material } = quest.gather;
  const name = MATERIALS[material];
  const place = game.catalog.placeById.get(quest.place);
  const box = h('div', { class: 'gather' });
  let blocked = null;

  const draw = () => {
    const st = game.stamina();
    const first = game.plan(quest.id, { amount: 1 });
    const room = gatherEstimate(quest, first.ctx).room;
    const spare = Math.max(0, Math.floor(st.value) - Math.ceil(Math.max(0, first.cost.way)));
    const most = Math.min(room, (first.busy ? GATHER_BASE + GATHER_DICE : GATHER_BASE) * spare);
    const amount = Math.max(1, Math.min(gatherChoice[material], most));
    gatherChoice[material] = amount;
    const plan = game.plan(quest.id, { amount });
    // the stock as it is, or while the Envoy is away, as it will be after the row
    const shown = plan.busy ? plan.ctx : game.ctx();
    const have = shown.world.purse[material] || 0;
    const canGather = most >= 1 && plan.state.status === 'open';
    const atLimit = amount >= most;
    const limitText = amount >= room ? 'Mehr passt nicht in den Vorrat.' : 'Für mehr reicht die Energie nicht.';

    const change = (next) => () => {
      if (next > most) blocked = limitText;
      else { gatherChoice[material] = next; blocked = null; }
      draw();
    };

    let act;
    if (room <= 0) act = note('Der Vorrat ist voll.');
    else if (most < 1) act = waitButton(1 + Math.ceil(Math.max(0, first.cost.way)), st);
    else act = questAction(quest, plan, game, place, { amount }, plan.busy ? `Angehängt: ${quest.name}` : `Der Envoy sammelt ${name}`);
    if (game.queued(quest.id) && !canGather) act = questAction(quest, plan, game, place);

    replaceChildren(box,
      h('div', { class: 'quest-text' }, paragraphs(quest.text)),
      canGather ? h('div', { class: 'stepper' },
        h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Weniger', disabled: amount <= 1, onclick: change(amount - 1) }, '−'),
        h('span', { class: 'stepper-value' }, resource(material, String(amount))),
        h('button', {
          class: `btn ghost small ${atLimit ? 'at-limit' : ''}`, type: 'button', 'aria-label': 'Mehr',
          'aria-disabled': atLimit ? 'true' : null, title: atLimit ? limitText : null, onclick: change(amount + 1),
        }, '+')) : null,
      blocked && canGather ? h('p', { class: 'gather-note', role: 'status' }, blocked) : null,
      h('p', { class: 'gather-stock' }, `${plan.busy ? 'Nach der Reihe im Vorrat' : 'Im Vorrat'} ${have} / ${have + roomFor(shown.world, shown.catalog, material)} ${name}`),
      canGather ? energyPreview(st, plan.cost) : null,
      h('div', { class: 'quest-actions' }, act));
  };
  draw();
  return box;
}

export function openQuest(quest, game) {
  const place = game.catalog.placeById.get(quest.place);
  const kind = quest.encounter ? 'Begegnung' : KIND_NAMES[quest.kind] || quest.kind;
  openSheet({
    title: quest.name,
    eyebrow: `${place.name} · ${kind}`,
    className: 'quest-sheet',
    content: quest.gather ? gatherBody(quest, game) : questBody(quest, game, place),
  });
}
