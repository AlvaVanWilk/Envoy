// Character window: the Envoy with its slots and the inventory box, the
// stats, the Energie and the other bonuses of the clothes, the values in a
// fight (and what the clothes add to them), and for the arena the Fleiß.

import { h, icon } from './dom.js';
import { SLOT_ICONS } from './icons.js';
import { STATS, SLOTS, STAT_IDS } from '../config.js';
import { paperdoll } from './paperdoll.js';
import { statRow, statInfo, statEmblem } from './stats.js';
import { openStatDetail } from './statdetail.js';
import { store } from '../store.js';
import { addDays, formatDayShort } from '../days.js';
import { viewHead, sectionTitle, itemIcon, staminaBar, effectText, qualityClass } from './parts.js';
import { openSlot, slotName } from './itemsheet.js';
import { packBox } from './pack.js';
import { fighter } from '../world/hero.js';
import { effortOf, gearScore } from '../world/arena.js';
import { arena } from '../arena.js';

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
        worldPanel(game),
        fightPanel(game),
        arenaPanel(game))));
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
  h('span', { class: `slot-frame${qualityClass(entry)}` }, item ? itemIcon(item, game, 'item-icon', entry.farbe) : icon(SLOT_ICONS[slotId], 'slot-glyph')),
  h('span', { class: 'slot-label' }, SLOTS.find((x) => x.id === slotId).short));
}

// The Energie, and what the clothes give besides the fight.
const WORLD_BONUSES = ['erholung', 'glueck', 'reise'];
function worldPanel(game) {
  const fx = game.ctx().fx;
  const bonuses = WORLD_BONUSES.filter((k) => fx[k]);
  return h('section', { class: 'panel' },
    sectionTitle('In der Welt'),
    staminaBar(game.stamina()),
    bonuses.length > 0 ? h('dl', { class: 'facts' }, bonuses.map((k) => h('div', {}, h('dt', {}, 'Kleidung'), h('dd', {}, effectText(k, fx[k]))))) : null);
}

const NO_GEAR = { schaden: 0, treffer: 0, ausweichen: 0, beruhigen: 0, reise: 0, erholung: 0, glueck: 0 };
const percent = (share) => `${Math.round(share * 100)} %`;

// The values in a fight against a spirit as strong as the Envoy, and in
// orange what the clothes add to them.
function fightPanel(game) {
  const { stats } = game.state;
  const fx = game.ctx().fx;
  const even = { gewandtheit: stats.beweglichkeit.level, stufe: stats.gelassenheit.level, calmable: true };
  const now = fighter(stats, fx, even);
  const bare = fighter(stats, NO_GEAR, even);
  const extra = (a, b, show) => (a > b ? h('span', { class: 'gear-part' }, `+${show(a - b)}`) : null);
  const row = (label, value, gear) => h('div', {}, h('dt', {}, label), h('dd', {}, value, gear));
  return h('section', { class: 'panel fight-panel' },
    sectionTitle('Kampfwerte'),
    h('dl', { class: 'facts' },
      row('Leben', String(now.life), null),
      row('Schaden je Treffer', `${now.damage} bis ${now.damage + 2}`, extra(now.damage, bare.damage, String)),
      row('Treffer', percent(now.hit), extra(now.hit, bare.hit, percent)),
      row('Ausweichen', percent(now.dodge), extra(now.dodge, bare.dodge, percent)),
      row('Beruhigen', percent(now.calm), extra(now.calm, bare.calm, percent))),
    h('p', { class: 'muted gear-note' }, 'Gegen einen gleich starken Geist. ', h('span', { class: 'gear-part' }, '+'), ' kommt von der Kleidung.'));
}

// For the arena: the Fleiß (it decides every fight) and what the clothes
// count for when both are equally diligent.
function arenaPanel(game) {
  if (!arena.open()) return null;
  const effort = effortOf(game.state);
  return h('section', { class: 'panel arena-values' },
    sectionTitle('Arena'),
    h('div', { class: 'effort' },
      h('span', { class: 'effort-total' }, String(effort.total)),
      h('span', { class: 'effort-label' }, 'Fleiß', h('span', { class: 'muted' }, 'Tage mit Tageswerk in den letzten vier Wochen'))),
    h('ul', { class: 'effort-areas' }, STAT_IDS.map((id) => h('li', {}, statEmblem(id, 'small'), h('span', {}, String(effort[id]))))),
    h('dl', { class: 'facts' },
      h('div', {}, h('dt', {}, 'Kleidung im Kampf'), h('dd', {}, String(gearScore(game.ctx().fx))))),
    h('p', { class: 'muted gear-note' }, 'In der Arena gewinnt, wer fleißiger ist. Bei gleichem Fleiß entscheidet die Kleidung.'));
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
