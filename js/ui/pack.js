// The inventory box on the character sheet: the backpack with its few
// places (the Envoy has it with him, Stein and Pilzholz take places too) and,
// once the camp has one, the Aufbewahrung at the camp. While the Envoy is
// away, the Aufbewahrung can be looked at but not used: its things are greyed out.
// Looking at it is the Envoy remembering what lies there.

import { h, icon, replaceChildren } from './dom.js';
import { UI_ICONS } from './icons.js';
import { BACKPACK_SIZE, MATERIAL_STACK, MATERIALS } from '../config.js';
import { sectionTitle, itemIcon, resourceIcon } from './parts.js';
import { openEntry, AWAY_NOTE } from './itemsheet.js';
import { lookup, unmetRequirements } from '../world/items.js';
import { entriesIn, capacity, reachable, atCamp, carried, materialPlaces, CARRIED_MATERIALS } from '../world/inventory.js';

const ROW = 5;
const SHOW_ALL = 15; // up to this many places the storage is shown in full
let tab = 'rucksack'; // kept while the app is open: 'rucksack' | 'schrank'

function cell(entry, game, { over = false } = {}) {
  const { world, stats } = game.state;
  const thing = lookup(entry, game.catalog);
  if (!thing) return null;
  const locked = entry.kind === 'item' && unmetRequirements(thing, stats).length > 0;
  const away = !reachable(world, entry);
  return h('button', {
    class: `pack-cell filled ${locked ? 'locked' : ''} ${away ? 'away' : ''} ${over ? 'over' : ''}`,
    'aria-label': thing.name,
    title: thing.name,
    onclick: () => openEntry(entry.inst, game),
  }, itemIcon(thing), locked ? icon(UI_ICONS.lock, 'item-lock') : null);
}

const emptyCell = () => h('span', { class: 'pack-cell', 'aria-hidden': 'true' });

// What the Envoy carries of a material: one place for every MATERIAL_STACK pieces.
function materialCells(game) {
  const have = carried(game.state.world, game.catalog);
  const out = [];
  for (const key of CARRIED_MATERIALS) {
    for (let left = have[key]; left > 0; left -= MATERIAL_STACK) {
      const count = Math.min(left, MATERIAL_STACK);
      out.push(h('span', { class: 'pack-cell filled material', 'data-res': key, title: `${count} ${MATERIALS[key]}`, role: 'img', 'aria-label': `${count} ${MATERIALS[key]}` },
        resourceIcon(key), h('span', { class: 'pack-count' }, String(count))));
    }
  }
  return out;
}

function cells(game) {
  const { world } = game.state;
  const list = entriesIn(world, tab).sort((a, b) => (a.got || 0) - (b.got || 0));
  if (tab === 'rucksack') {
    const material = materialCells(game);
    const out = [...list.map((entry, n) => cell(entry, game, { over: n >= BACKPACK_SIZE })), ...material];
    for (let n = out.length; n < BACKPACK_SIZE; n += 1) out.push(emptyCell());
    return out;
  }
  // A small storage shows all its places; a large one grows row by row with
  // what lies in it, so the box does not turn into a wall of empty places.
  const size = capacity(world, game.catalog, 'schrank');
  const shown = size <= SHOW_ALL ? size : Math.min(size, Math.max(ROW, Math.ceil((list.length + 1) / ROW) * ROW));
  const out = list.map((entry) => cell(entry, game));
  for (let n = list.length; n < shown; n += 1) out.push(emptyCell());
  return out;
}

export function packBox(game) {
  const box = h('section', { class: 'panel pack' });
  const draw = () => {
    const { world } = game.state;
    const hasStorage = capacity(world, game.catalog, 'schrank') > 0;
    if (!hasStorage) tab = 'rucksack';
    const packCount = entriesIn(world, 'rucksack').length + materialPlaces(world, game.catalog);
    const storeCount = entriesIn(world, 'schrank').length;
    const choose = (id) => () => { tab = id; draw(); };

    const head = hasStorage
      ? h('div', { class: 'tabs pack-tabs', role: 'tablist' },
        h('button', { class: `tab ${tab === 'rucksack' ? 'active' : ''}`, role: 'tab', onclick: choose('rucksack') },
          `Rucksack · ${packCount}/${BACKPACK_SIZE}`),
        h('button', { class: `tab ${tab === 'schrank' ? 'active' : ''}`, role: 'tab', onclick: choose('schrank') },
          `Aufbewahrung · ${storeCount}/${capacity(world, game.catalog, 'schrank')}`))
      : null;

    replaceChildren(box,
      sectionTitle(hasStorage ? 'Inventar' : `Rucksack · ${packCount}/${BACKPACK_SIZE}`,
        h('a', { class: 'title-link', href: '#inventar' }, 'Alle')),
      head,
      tab === 'schrank' && !atCamp(world) ? h('p', { class: 'muted pack-note' }, AWAY_NOTE) : null,
      tab === 'rucksack' && packCount > BACKPACK_SIZE ? h('p', { class: 'pack-note over' }, 'Überfüllt. Jeder Weg kostet 1 Energie mehr.') : null,
      h('div', { class: `pack-grid ${tab}` }, cells(game)));
  };
  draw();
  return box;
}
