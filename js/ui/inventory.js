// Inventory: backpack from the start, storage („Lager“) once there is a home.
// Search, filter by slot and sort. Tapping a thing opens its sheet.
// While the Envoy is away, things in the storage are shown greyed out.

import { h, icon, replaceChildren } from './dom.js';
import { UI_ICONS } from './icons.js';
import { SLOTS, BACKPACK_SIZE } from '../config.js';
import { viewHead, itemIcon, reqChips } from './parts.js';
import { openEntry, thingSubtitle } from './itemsheet.js';
import { lookup, unmetRequirements } from '../world/items.js';
import { countIn, capacity, reachable } from '../world/inventory.js';

const FILTERS = [{ id: 'alle', name: 'Alle' }, ...SLOTS.map((s) => ({ id: s.id, name: s.name })), { id: 'einrichtung', name: 'Einrichtung' }];
const SORTS = [
  { id: 'slot', name: 'Slot' },
  { id: 'stufe', name: 'Stufe' },
  { id: 'name', name: 'Name' },
  { id: 'neu', name: 'Neueste' },
];
const SLOT_ORDER = [...SLOTS.map((s) => s.id), 'einrichtung'];

// Kept while the app is open, so a new render keeps the choice.
const view = { tab: 'rucksack', search: '', filter: 'alle', sort: 'slot' };   // tab: rucksack | schrank | body

function rows(game) {
  const { world } = game.state;
  return Object.values(world.items)
    .filter((e) => e.where === view.tab)
    .map((entry) => ({ entry, thing: lookup(entry, game.catalog) }))
    .filter(({ thing }) => thing);
}

function matches({ entry, thing }) {
  const slot = entry.kind === 'furniture' ? 'einrichtung' : thing.slot;
  if (view.filter !== 'alle' && slot !== view.filter) return false;
  const q = view.search.trim().toLowerCase();
  return !q || thing.name.toLowerCase().includes(q) || (thing.faehigkeit || thing.text || '').toLowerCase().includes(q);
}

function sorter(a, b) {
  const slotA = a.entry.kind === 'furniture' ? 'einrichtung' : a.thing.slot;
  const slotB = b.entry.kind === 'furniture' ? 'einrichtung' : b.thing.slot;
  const byName = a.thing.name.localeCompare(b.thing.name, 'de');
  const byLevel = (a.thing.stufe || a.thing.abStufe || 0) - (b.thing.stufe || b.thing.abStufe || 0);
  if (view.sort === 'name') return byName;
  if (view.sort === 'stufe') return -byLevel || byName;
  if (view.sort === 'neu') return (b.entry.got || 0) - (a.entry.got || 0) || byName;
  return SLOT_ORDER.indexOf(slotA) - SLOT_ORDER.indexOf(slotB) || byLevel || byName;
}

function tile({ entry, thing }, game) {
  const locked = entry.kind === 'item' && unmetRequirements(thing, game.state.stats).length > 0;
  const away = !reachable(game.state.world, entry);
  return h('button', { class: `item-tile ${locked ? 'locked' : ''} ${away ? 'away' : ''}`, onclick: () => openEntry(entry.inst, game) },
    h('span', { class: 'item-frame' }, itemIcon(thing), locked ? icon(UI_ICONS.lock, 'item-lock') : null),
    h('span', { class: 'item-name' }, thing.name),
    h('span', { class: 'item-sub' }, thingSubtitle(entry, thing)),
    entry.kind === 'item' ? reqChips(thing, game.state.stats) : null);
}

function fillGrid(grid, game) {
  const list = rows(game).filter(matches).sort(sorter);
  replaceChildren(grid, list.length > 0
    ? h('div', { class: 'item-grid' }, list.map((r) => tile(r, game)))
    : h('p', { class: 'empty-state' }, rows(game).length === 0 ? 'Leer.' : 'Nichts gefunden.'));
}

export function renderInventory(game) {
  const { world } = game.state;
  const hasHome = world.home > 0;
  if (!hasHome && view.tab === 'schrank') view.tab = 'rucksack';

  const packCount = countIn(world, 'rucksack');
  const tabs = h('div', { class: 'tabs', role: 'tablist' },
    h('button', { class: `tab ${view.tab === 'rucksack' ? 'active' : ''}`, role: 'tab', onclick: () => { view.tab = 'rucksack'; game.refresh(); } },
      `Rucksack · ${packCount}/${BACKPACK_SIZE}`),
    h('button', { class: `tab ${view.tab === 'schrank' ? 'active' : ''}`, role: 'tab', disabled: !hasHome, onclick: () => { view.tab = 'schrank'; game.refresh(); } },
      hasHome ? `Lager · ${countIn(world, 'schrank')}/${capacity(world, game.catalog, 'schrank')}` : [icon(UI_ICONS.lock), 'Lager']),
    h('button', { class: `tab ${view.tab === 'body' ? 'active' : ''}`, role: 'tab', onclick: () => { view.tab = 'body'; game.refresh(); } },
      `Getragen · ${countIn(world, 'body')}`));

  const grid = h('div', {});
  const search = h('input', {
    class: 'field', type: 'search', placeholder: 'Suchen', value: view.search, 'aria-label': 'Suchen', autocomplete: 'off',
    oninput: (e) => { view.search = e.currentTarget.value; fillGrid(grid, game); },
  });
  const sort = h('select', {
    class: 'field', 'aria-label': 'Sortieren',
    onchange: (e) => { view.sort = e.currentTarget.value; fillGrid(grid, game); },
  }, SORTS.map((s) => h('option', { value: s.id, selected: view.sort === s.id }, s.name)));
  const chips = h('div', { class: 'chips' }, FILTERS.map((f) => h('button', {
    class: `chip ${view.filter === f.id ? 'active' : ''}`,
    onclick: (e) => {
      view.filter = f.id;
      chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      fillGrid(grid, game);
    },
  }, f.name)));
  fillGrid(grid, game);

  const over = packCount > BACKPACK_SIZE;
  return h('section', { class: 'view inventory' },
    viewHead('Inventar', { rucksack: 'Rucksack', schrank: 'Lager', body: 'Getragen' }[view.tab]),
    tabs,
    view.tab === 'schrank' && !game.atCamp() ? h('p', { class: 'capacity' }, 'Der Envoy ist unterwegs. Das Lager ist erst nach der Rückkehr erreichbar.') : null,
    over ? h('p', { class: 'capacity over' }, 'Der Rucksack ist überfüllt. Jede Reise kostet 1 Ausdauer mehr.') : null,
    h('div', { class: 'toolbar' }, h('div', { class: 'toolbar-row' }, search, sort), chips),
    h('div', { class: 'panel' }, grid));
}
