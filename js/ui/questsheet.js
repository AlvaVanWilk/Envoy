// The window of one quest: what it is about, what it needs, what it brings
// and what it costs in Energie (as a bar: what is used, what stays).
// Gathering on the Trümmerfeld has its own window: the Envoy is told how
// much to gather, and the bar shows what that may take.

import { h, icon, replaceChildren } from './dom.js';
import { UI_ICONS } from './icons.js';
import { CURRENCY, MATERIALS } from '../config.js';
import { resource, resourceIcon, energyPreview, formatMinutes, MATERIAL_KEYS } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { markMapForScroll } from './worldmap.js';
import { questState, conditionMet, describeCondition, KIND_NAMES } from '../world/quests.js';
import { besideTheCamp } from '../world/map.js';
import { rewardRange, gatherEstimate } from '../world/run.js';
import { facilityRow, facilityEffect } from '../world/camp.js';
import { formatDayShort } from '../days.js';

const range = ([a, b]) => (a === b ? String(a) : `${a}–${b}`);
const paragraphs = (text) => text.split('\n').filter(Boolean).map((p) => h('p', {}, p));
const note = (text) => h('span', { class: 'quest-note' }, text);

export function fact(label, ...value) {
  return h('div', { class: 'fact' }, h('dt', {}, label), h('dd', {}, ...value));
}

// What a feature is called among the rewards: Lagerfeuer, Händler or a facility.
function unlockName(feature, c) {
  if (feature === 'lagerfeuer') return 'Lagerfeuer';
  if (feature === 'haendler') return 'Händler';
  const [id, level] = feature.split(':');
  return facilityRow(c.catalog, id, Number(level))?.name || feature;
}

function rewardParts(quest, c, monsters) {
  const parts = [];
  const r = rewardRange(quest, c);
  if (r) for (const key of MATERIAL_KEYS) if (r[key][1] > 0) parts.push(resource(key, range(r[key])));
  const names = [
    ...(quest.reward?.items || []).map((id) => c.catalog.itemById.get(id)?.name),
    ...(quest.reward?.furniture || []).map((id) => c.catalog.furnitureById.get(id)?.name),
  ].filter(Boolean);
  for (const name of names) parts.push(h('span', { class: 'pill' }, name));
  if (quest.facility) {
    const row = facilityRow(c.catalog, quest.facility, Number(quest.id.split(':')[2]));
    parts.push(h('span', {}, `${facilityEffect(row)} · Hygge +${row.hygge}`));
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
  if (quest.kind !== 'bauen' || !besideTheCamp(place)) return 'Aufbrechen';
  return quest.facility && Number(quest.id.split(':')[2]) > 1 ? 'Ausbauen' : 'Errichten';
}

function start(quest, game, options, message) {
  if (!game.startExpedition(quest.id, options)) return;
  closeSheet();
  markMapForScroll();
  toast(message);
}

function waitButton(cost, st) {
  const minutes = Math.ceil(((cost - st.value) / st.perHour) * 60);
  return h('button', { class: 'btn ghost', disabled: true }, `Genug Energie in ${formatMinutes(minutes)}`);
}

// What can be done with a quest right now: start it, wait for Energie, or a note why not.
export function questAction(quest, cost, game, state, place) {
  const st = game.stamina();
  const label = verb(quest, place);
  const building = label !== 'Aufbrechen';
  if (state.status === 'running') return note(building ? 'Der Envoy baut gerade daran.' : 'Der Envoy ist gerade dort.');
  if (state.status === 'done') return note(quest.encounter ? 'Heute erledigt.' : 'Erledigt.');
  if (state.status === 'cooldown') return note(`Wieder ab ${formatDayShort(state.again)}.`);
  if (state.status === 'locked') return h('button', { class: 'btn primary', disabled: true }, label);
  if (game.state.world.expedition) return h('button', { class: 'btn ghost', disabled: true }, 'Der Envoy ist unterwegs');
  if (cost > st.max) return note('Die Energie reicht dafür noch nicht. Sie wächst mit dem Wert Ausdauer.');
  if (cost > st.value) return waitButton(cost, st);
  const message = building ? `Der Envoy macht sich an die Arbeit: ${quest.name}` : `Aufgebrochen: ${quest.name}`;
  return h('button', { class: 'btn primary', onclick: () => start(quest, game, {}, message) }, label);
}

function questBody(quest, game, place) {
  const c = game.ctx();
  const state = questState(quest, c);
  const open = state.status === 'open' || state.status === 'locked';
  const cost = game.preview(quest.id).cost;
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
    open ? energyPreview(game.stamina(), cost, cost) : null,
    h('div', { class: 'quest-actions' }, questAction(quest, cost, game, state, place)),
  ];
}

// --- gathering -------------------------------------------------------------------

// How much the Envoy is told to gather, kept while the app is open.
const gatherChoice = { stein: 1, pilzholz: 1 };

// He gathers as much as is chosen: at most what he can carry, and what his
// Energie surely brings in. A tap on + beyond that says why there is no more.
function gatherBody(quest, game) {
  const { material } = quest.gather;
  const name = MATERIALS[material];
  const box = h('div', { class: 'gather' });
  let blocked = null;

  const draw = () => {
    const c = game.ctx();
    const st = game.stamina();
    const state = questState(quest, c);
    const most = gatherEstimate(quest, c, { energy: st.value }).most;
    const amount = Math.max(1, Math.min(gatherChoice[material], most));
    gatherChoice[material] = amount;
    const est = gatherEstimate(quest, c, { amount, energy: st.value });
    const have = c.world.purse[material] || 0;
    const away = Boolean(c.world.expedition);
    const canGather = most >= 1 && !away && state.status === 'open';
    const atLimit = amount >= most;
    const limitText = amount >= est.room ? 'Mehr kann dein Envoy nicht tragen.' : 'Für mehr reicht die Energie nicht.';

    const change = (next) => () => {
      if (next > most) blocked = limitText;
      else { gatherChoice[material] = next; blocked = null; }
      draw();
    };

    let act;
    if (state.status === 'running') act = note('Der Envoy sammelt gerade.');
    else if (away) act = h('button', { class: 'btn ghost', disabled: true }, 'Der Envoy ist unterwegs');
    else if (est.room <= 0) act = note('Mehr kann dein Envoy nicht tragen.');
    else if (most < 1) act = waitButton(1, st);
    else act = h('button', { class: 'btn primary', onclick: () => start(quest, game, { amount }, `Der Envoy sammelt ${name}`) }, 'Sammeln');

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
      h('p', { class: 'gather-stock' }, `Im Vorrat ${have} / ${have + est.room} ${name}`),
      canGather ? energyPreview(st, est.energy.min, est.energy.max) : null,
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
