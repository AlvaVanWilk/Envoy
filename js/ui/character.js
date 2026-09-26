// Character window: the Envoy with its slots, the stats and the wardrobe.

import { h, icon } from './dom.js';
import { SLOT_ICONS, UI_ICONS } from './icons.js';
import { SLOTS, STATS } from '../config.js';
import { unmetRequirements } from '../replay.js';
import { paperdoll } from './paperdoll.js';
import { statRow, statEmblem, statInfo } from './stats.js';
import { openStatDetail } from './statdetail.js';
import { openSheet, closeSheet } from './sheet.js';
import { store } from '../store.js';
import { addDays, formatDayShort } from '../days.js';

const LEFT_SLOTS = ['kopf', 'schultern', 'umhang', 'torso'];
const RIGHT_SLOTS = ['handschuhe', 'guertel', 'beine', 'schuhe'];
const NOTICE_DAYS = 14;

const slotName = (id) => SLOTS.find((s) => s.id === id).name;

export function renderCharacter(game) {
  const s = game.state;
  return h('section', { class: 'view character' },
    h('header', { class: 'view-head' },
      h('p', { class: 'eyebrow' }, 'Charakter'),
      h('h1', {}, 'Envoy')),
    h('div', { class: 'char-grid' },
      h('div', { class: 'panel doll-frame' },
        h('div', { class: 'slot-column' }, LEFT_SLOTS.map((id) => slotTile(id, game))),
        paperdoll(s.equipped, game.catalog),
        h('div', { class: 'slot-column' }, RIGHT_SLOTS.map((id) => slotTile(id, game)))),
      h('div', { class: 'char-side' },
        droppedNotice(game),
        h('section', { class: 'panel stats-panel' },
          h('h2', { class: 'section-title' }, 'Werte'),
          STATS.map((st) => statRow(st.id, s.stats[st.id], { onclick: () => openStatDetail(st.id, game) }))),
        wardrobe(game))));
}

function itemIcon(item, className = 'item-icon') {
  return h('img', { class: className, src: item.icon, alt: '', decoding: 'async', onerror: (e) => { e.currentTarget.hidden = true; } });
}

function slotTile(slotId, game) {
  const item = game.catalog.itemById.get(game.state.equipped[slotId]);
  return h('button', {
    class: `slot ${item ? 'filled' : ''}`,
    'data-slot': slotId,
    'aria-label': item ? `${slotName(slotId)}: ${item.name}` : `${slotName(slotId)}: leer`,
    onclick: () => openSlot(slotId, game),
  },
  h('span', { class: 'slot-frame' }, item ? itemIcon(item) : icon(SLOT_ICONS[slotId], 'slot-glyph')),
  h('span', { class: 'slot-label' }, slotName(slotId)));
}

function reqChips(item, stats) {
  const entries = Object.entries(item.req || {});
  if (entries.length === 0) return null;
  return h('span', { class: 'req-chips' }, entries.map(([stat, min]) =>
    h('span', { class: `req-chip ${stats[stat].level >= min ? 'met' : 'unmet'}`, 'data-stat': stat, title: statInfo(stat).name },
      statEmblem(stat, 'tiny'), String(min))));
}

function wardrobe(game) {
  const { equipped, stats } = game.state;
  const order = SLOTS.map((s) => s.id);
  const items = [...game.catalog.equipment].sort((a, b) =>
    order.indexOf(a.slot) - order.indexOf(b.slot) || a.stufe - b.stufe || a.name.localeCompare(b.name, 'de'));

  return h('section', { class: 'panel wardrobe' },
    h('h2', { class: 'section-title' }, 'Schrank'),
    items.length === 0
      ? h('p', { class: 'muted' }, 'Noch keine Ausrüstung.')
      : h('div', { class: 'item-grid' }, items.map((item) => {
        const worn = equipped[item.slot] === item.id;
        const locked = unmetRequirements(item, stats).length > 0;
        return h('button', {
          class: `item-tile ${worn ? 'worn' : ''} ${locked ? 'locked' : ''}`,
          onclick: () => openItem(item, game),
          'aria-label': `${item.name}${worn ? ', angelegt' : ''}${locked ? ', Voraussetzung fehlt' : ''}`,
        },
        h('span', { class: 'item-frame' }, itemIcon(item), locked ? icon(UI_ICONS.lock, 'item-lock') : null,
          worn ? icon(UI_ICONS.check, 'item-worn') : null),
        h('span', { class: 'item-name' }, item.name),
        reqChips(item, stats));
      })));
}

function itemRow(item, game, close) {
  const { equipped, stats } = game.state;
  const worn = equipped[item.slot] === item.id;
  const unmet = unmetRequirements(item, stats);
  let action;
  if (worn) {
    action = h('button', { class: 'btn ghost small', onclick: () => { game.unequip(item.slot); close(); } }, 'Ablegen');
  } else if (unmet.length === 0) {
    action = h('button', { class: 'btn primary small', onclick: () => { game.equip(item.slot, item.id); close(); } }, 'Anlegen');
  } else {
    action = h('span', { class: 'locked-label' }, icon(UI_ICONS.lock), 'Gesperrt');
  }
  return h('div', { class: `item-row ${worn ? 'worn' : ''} ${unmet.length ? 'locked' : ''}` },
    h('span', { class: 'item-frame' }, itemIcon(item)),
    h('span', { class: 'item-row-main' },
      h('span', { class: 'item-name' }, item.name),
      h('span', { class: 'item-meta' }, `Stufe ${item.stufe}`),
      reqChips(item, stats),
      item.faehigkeit ? h('span', { class: 'item-ability' }, item.faehigkeit) : null),
    action);
}

function openSlot(slotId, game) {
  const items = game.catalog.equipment.filter((i) => i.slot === slotId).sort((a, b) => a.stufe - b.stufe);
  const sheet = openSheet({
    title: slotName(slotId),
    eyebrow: 'Slot',
    className: 'slot-sheet',
    content: items.length === 0
      ? h('p', { class: 'muted' }, 'Noch nichts für diesen Slot.')
      : h('div', { class: 'item-list' }, items.map((item) => itemRow(item, game, () => sheet.close()))),
  });
}

function openItem(item, game) {
  const { stats, equipped } = game.state;
  const worn = equipped[item.slot] === item.id;
  const reqs = Object.entries(item.req || {});
  const canWear = unmetRequirements(item, stats).length === 0;
  openSheet({
    title: item.name,
    eyebrow: `${slotName(item.slot)} · Stufe ${item.stufe}`,
    className: 'item-sheet',
    content: [
      h('div', { class: 'item-hero' }, itemIcon(item, 'item-hero-icon')),
      reqs.length > 0
        ? h('ul', { class: 'req-list' }, reqs.map(([stat, min]) => {
          const current = stats[stat].level;
          return h('li', { class: current >= min ? 'met' : 'unmet' },
            statEmblem(stat, 'small'),
            h('span', {}, `${statInfo(stat).name} ${min}`),
            h('span', { class: 'req-current' }, current >= min ? icon(UI_ICONS.check) : `jetzt ${current}`));
        }))
        : h('p', { class: 'muted' }, 'Keine Voraussetzung.'),
      item.faehigkeit ? h('p', { class: 'item-ability' }, item.faehigkeit) : null,
      h('div', { class: 'sheet-actions' },
        worn
          ? h('button', { class: 'btn ghost', onclick: () => { game.unequip(item.slot); closeSheet(); } }, 'Ablegen')
          : h('button', { class: 'btn primary', disabled: !canWear, onclick: () => { game.equip(item.slot, item.id); closeSheet(); } }, 'Anlegen')),
    ],
  });
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
    h('h2', { class: 'section-title' }, 'Abgelegt'),
    h('ul', { class: 'notice-list' }, fresh.map((d) => {
      const item = game.catalog.itemById.get(d.item);
      const reasons = d.unmet.map((u) => `${statInfo(u.stat).name} unter ${u.min}`).join(', ');
      return h('li', {}, h('span', { class: 'notice-item' }, item ? item.name : d.item),
        h('span', { class: 'muted' }, `${formatDayShort(d.day)} · ${reasons}`));
    })),
    h('button', { class: 'btn text small', onclick: dismiss }, 'Gesehen'));
}

export function unseenDropCount(game) {
  const seen = new Set(store.loadUi().seenDropped || []);
  const since = addDays(game.state.today, -NOTICE_DAYS);
  return game.state.dropped.filter((d) => d.day >= since && !seen.has(`${d.day}|${d.item}`)).length;
}
