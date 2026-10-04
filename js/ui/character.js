// Character window: the Envoy with its slots and the inventory box, the
// stats and what the equipment adds in the world.

import { h, icon } from './dom.js';
import { SLOT_ICONS } from './icons.js';
import { STATS, SLOTS } from '../config.js';
import { paperdoll } from './paperdoll.js';
import { statRow, statInfo } from './stats.js';
import { openStatDetail } from './statdetail.js';
import { store } from '../store.js';
import { addDays, formatDayShort } from '../days.js';
import { viewHead, sectionTitle, itemIcon, staminaBar, effectText } from './parts.js';
import { openSlot, slotName } from './itemsheet.js';
import { packBox } from './pack.js';

const LEFT_SLOTS = ['kopf', 'torso', 'handschuhe'];
const RIGHT_SLOTS = ['accessoire', 'beine', 'schuhe'];
const NOTICE_DAYS = 14;

export function renderCharacter(game) {
  const s = game.state;
  return h('section', { class: 'view character' },
    viewHead('Envoy', s.world.envoy?.name || 'Envoy'),
    h('div', { class: 'char-grid' },
      h('div', { class: 'panel doll-frame' },
        h('div', { class: 'slot-column' }, LEFT_SLOTS.map((id) => slotTile(id, game))),
        paperdoll(s.equipped, s.world, game.catalog),
        h('div', { class: 'slot-column' }, RIGHT_SLOTS.map((id) => slotTile(id, game)))),
      packBox(game),
      h('div', { class: 'char-side' },
        droppedNotice(game),
        h('section', { class: 'panel' },
          sectionTitle('Werte'),
          STATS.map((st) => statRow(st.id, s.stats[st.id], { onclick: () => openStatDetail(st.id, game) }))),
        worldPanel(game))));
}

function slotTile(slotId, game) {
  const { world } = game.state;
  const entry = world.items[world.equipped[slotId]];
  const item = entry && game.catalog.itemById.get(entry.id);
  return h('button', {
    class: `slot ${item ? 'filled' : ''}`,
    'data-slot': slotId,
    'aria-label': item ? `${slotName(slotId)}: ${item.name}` : `${slotName(slotId)}: leer`,
    onclick: () => openSlot(slotId, game),
  },
  h('span', { class: 'slot-frame' }, item ? itemIcon(item, game, 'item-icon', entry.farbe) : icon(SLOT_ICONS[slotId], 'slot-glyph')),
  h('span', { class: 'slot-label' }, SLOTS.find((x) => x.id === slotId).short));
}

function worldPanel(game) {
  const s = game.state;
  const fx = game.ctx().fx;
  const effects = Object.entries(fx).filter(([, v]) => v);
  return h('section', { class: 'panel' },
    sectionTitle('In der Welt'),
    staminaBar(game.stamina()),
    h('dl', { class: 'facts' },
      h('div', {}, h('dt', {}, 'Leben im Kampf'), h('dd', {}, String(8 + 3 * s.stats.ausdauer.level))),
      h('div', {}, h('dt', {}, 'Schaden je Treffer'), h('dd', {}, `${1 + Math.round(0.6 * s.stats.kraft.level) + fx.schaden} bis ${3 + Math.round(0.6 * s.stats.kraft.level) + fx.schaden}`)),
      effects.filter(([k]) => k !== 'schaden').map(([k, v]) => h('div', {}, h('dt', {}, 'Fähigkeit'), h('dd', {}, effectText(k, v))))));
}

// Items that fell off because a stat dropped below their requirement.
function droppedNotice(game) {
  const ui = store.loadUi();
  const seen = new Set(ui.seenDropped || []);
  const since = addDays(game.state.today, -NOTICE_DAYS);
  const fresh = game.state.dropped.filter((d) => d.day >= since && !seen.has(`${d.day}|${d.item}`));
  if (fresh.length === 0) return null;

  const dismiss = () => {
    ui.seenDropped = [...seen, ...fresh.map((d) => `${d.day}|${d.item}`)].slice(-100);
    store.saveUi(ui);
    game.refresh();
  };
  return h('section', { class: 'panel notice' },
    sectionTitle('Abgelegt'),
    h('ul', { class: 'notice-list' }, fresh.map((d) => {
      const item = game.catalog.itemById.get(d.item);
      const reasons = d.unmet.map((u) => `${statInfo(u.stat).name} unter ${u.min}`).join(', ');
      return h('li', {}, h('span', { class: 'notice-item' }, item ? item.name : d.item),
        h('span', { class: 'muted' }, `${formatDayShort(d.day)} · ${reasons} · jetzt im Rucksack`));
    })),
    h('button', { class: 'btn text small', onclick: dismiss }, 'Gesehen'));
}

export function unseenDropCount(game) {
  const seen = new Set(store.loadUi().seenDropped || []);
  const since = addDays(game.state.today, -NOTICE_DAYS);
  return game.state.dropped.filter((d) => d.day >= since && !seen.has(`${d.day}|${d.item}`)).length;
}
