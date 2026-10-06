// The quests of the map as a list beside it (worldmap.js): every quest of
// every open place, with its place, what it costs in Energie and what it
// brings. Above the list: filters by what one needs right now (Pilzholz,
// Stein, Bannsplitter, Kleidung, Pläne, Neues) and the order (what can be
// done now first, the cheapest first, or by place). A tap on a quest lights up
// its place on the map and fans out its quests there (`onPick`).
// Filter and order are kept on this device.

import { h, icon } from './dom.js';
import { SLOT_ICONS, FACILITY_ICONS, UI_ICONS } from './icons.js';
import { CURRENCY, MATERIALS } from '../config.js';
import { store } from '../store.js';
import { resourceIcon, sectionTitle, MATERIAL_KEYS } from './parts.js';
import { questsAt, placeUnlocked } from '../world/quests.js';
import { rewardRange } from '../world/run.js';
import { plansFindable } from '../world/plans.js';
import { obtainable, figureOf } from '../world/clothes.js';
import { formatDayShort } from '../days.js';

const FILTERS = [
  { id: 'alle', name: 'Alle' },
  { id: 'pilzholz', name: MATERIALS.pilzholz },
  { id: 'stein', name: MATERIALS.stein },
  { id: 'splitter', name: CURRENCY },
  { id: 'kleidung', name: 'Kleidung' },
  { id: 'plan', name: 'Pläne' },
  { id: 'neu', name: 'Neues' },
];
const ORDERS = [
  { id: 'jetzt', name: 'Machbar zuerst' },
  { id: 'energie', name: 'Wenig Energie zuerst' },
  { id: 'ort', name: 'Nach Ort' },
];

const range = ([a, b]) => (a === b ? String(a) : `${a}–${b}`);

function remembered() {
  const ui = store.loadUi();
  return { filter: ui.questFilter || 'alle', order: ui.questOrder || 'jetzt' };
}

function remember(key, value) {
  const ui = store.loadUi();
  ui[key] = value;
  store.saveUi(ui);
}

// What a quest brings, as tags for the filters and as small chips.
function rewardsOf(quest, c) {
  const tags = new Set();
  const chips = [];
  if (quest.gather) {
    tags.add(quest.gather.material);
    chips.push(h('span', { class: 'ql-chip' }, resourceIcon(quest.gather.material), 'Menge wählbar'));
  }
  const r = rewardRange(quest, c);
  if (r) {
    for (const key of MATERIAL_KEYS) {
      if (r[key][1] > 0) {
        tags.add(key);
        chips.push(h('span', { class: 'ql-chip' }, resourceIcon(key), range(r[key])));
      }
    }
  }
  if (quest.monsters.length > 0) {
    tags.add('splitter');
    chips.push(h('span', { class: 'ql-chip' }, resourceIcon('splitter'), CURRENCY));
    tags.add('kleidung');
    chips.push(h('span', { class: 'ql-chip is-maybe' }, icon(SLOT_ICONS.torso), 'vielleicht ein Fundstück'));
  }
  for (const id of quest.reward?.items || []) {
    const item = c.catalog.itemById.get(id);
    if (!obtainable(item, figureOf(c.world))) continue;
    tags.add('kleidung');
    chips.push(h('span', { class: 'ql-chip is-thing' }, icon(SLOT_ICONS[item.slot] || SLOT_ICONS.torso), item.name));
  }
  if ((quest.reward?.plans || []).length > 0 || plansFindable(quest, c.world, c.catalog).length > 0) {
    tags.add('plan');
    chips.push(h('span', { class: 'ql-chip is-maybe' }, icon(FACILITY_ICONS.deko), 'vielleicht ein Plan'));
  }
  if ((quest.reward?.unlocks || []).length > 0) {
    tags.add('neu');
    chips.push(h('span', { class: 'ql-chip is-new' }, 'Neues'));
  }
  if (quest.reward?.rest) chips.push(h('span', { class: 'ql-chip' }, 'Energie voll'));
  return { tags, chips };
}

// One entry for every quest at every open place (not those done for good).
function entries(game, c) {
  const list = [];
  c.catalog.places.forEach((place, order) => {
    if (!placeUnlocked(place, c)) return;
    for (const quest of questsAt(place.id, c)) {
      const plan = game.plan(quest.id);
      if (!plan) continue;
      const status = plan.state.status;
      if (status === 'done') continue;
      const cost = quest.gather ? null : Math.ceil(plan.cost.most);
      const doable = status === 'open' && !plan.block;
      list.push({ quest, place, order, plan, status, cost, doable, ...rewardsOf(quest, c) });
    }
  });
  return list;
}

const ORDER_FN = {
  jetzt: (a, b) => Number(b.doable) - Number(a.doable) || (a.cost ?? 1) - (b.cost ?? 1) || a.order - b.order,
  energie: (a, b) => (a.cost ?? 1) - (b.cost ?? 1) || a.order - b.order,
  ort: (a, b) => a.order - b.order || (a.cost ?? 1) - (b.cost ?? 1),
};

// Why a quest cannot be done right now, in a few words.
function whyNot(e) {
  if (e.status === 'running') return 'Der Envoy ist dabei';
  if (e.status === 'cooldown') return `Wieder ab ${formatDayShort(e.plan.state.again)}`;
  if (e.status === 'locked') return `Braucht: ${e.plan.state.missing.join(', ')}`;
  if (e.plan.block === 'never') return 'Braucht mehr Energie, als die Leiste fasst';
  if (e.plan.block) return 'Gerade zu wenig Energie';
  return null;
}

function row(e, seal, onPick) {
  const why = e.doable ? null : whyNot(e);
  const energy = e.cost === null ? 'ab 1 Energie' : `${e.cost} Energie`;
  return h('li', {},
    h('button', {
      class: `ql-row ${e.doable ? 'is-doable' : 'is-later'}`, type: 'button',
      'data-quest': e.quest.id, 'data-place': e.place.id,
      onclick: () => onPick(e.quest, e.place),
    },
    seal(e.quest),
    h('span', { class: 'ql-main' },
      h('span', { class: 'ql-name' }, e.quest.name),
      h('span', { class: 'ql-meta' }, `${e.place.name} · ${energy}`),
      e.chips.length > 0 ? h('span', { class: 'ql-rewards' }, e.chips) : null,
      why ? h('span', { class: 'ql-why' }, why) : null),
    icon(UI_ICONS.chevron, 'icon ql-go')));
}

// The panel with the list. seal(quest): the little seal of a quest (as in the
// fan on the map); onPick(quest, place): what a tap does.
export function questListPanel(game, c, { seal, onPick }) {
  const all = entries(game, c);
  const chosen = remembered();
  const listBox = h('ol', { class: 'ql-list' });
  const filterRow = h('div', { class: 'ql-filters', role: 'group', 'aria-label': 'Was es bringt' });
  const orderSelect = h('select', { class: 'field ql-order', 'aria-label': 'Reihenfolge' },
    ORDERS.map((o) => h('option', { value: o.id, selected: o.id === chosen.order }, o.name)));

  function draw() {
    const count = (id) => (id === 'alle' ? all.length : all.filter((e) => e.tags.has(id)).length);
    filterRow.replaceChildren(...FILTERS.filter((f) => f.id === 'alle' || count(f.id) > 0).map((f) => h('button', {
      class: `chip${chosen.filter === f.id ? ' active' : ''}`, type: 'button', 'aria-pressed': String(chosen.filter === f.id),
      onclick: () => { chosen.filter = f.id; remember('questFilter', f.id); draw(); },
    }, f.name, h('small', {}, String(count(f.id))))));
    const shown = all.filter((e) => chosen.filter === 'alle' || e.tags.has(chosen.filter)).sort(ORDER_FN[chosen.order] || ORDER_FN.jetzt);
    listBox.replaceChildren(...(shown.length > 0
      ? shown.map((e) => row(e, seal, onPick))
      : [h('li', { class: 'ql-empty' }, 'Gerade nichts davon zu finden.')]));
  }
  orderSelect.addEventListener('change', () => { chosen.order = orderSelect.value; remember('questOrder', chosen.order); draw(); });
  draw();

  return h('section', { class: 'panel quest-list' },
    sectionTitle('Quests'),
    filterRow,
    h('label', { class: 'ql-order-line' }, h('span', {}, 'Reihenfolge'), orderSelect),
    listBox);
}
