// Small building blocks used by several views.

import { h, icon } from './dom.js';
import { RESOURCE_ICONS, SLOT_ICONS } from './icons.js';
import { statEmblem, statInfo } from './stats.js';
import { shield } from './shield.js';
import { MATERIALS } from '../config.js';

export const MATERIAL_KEYS = ['splitter', 'pilzholz', 'stein'];

export function viewHead(eyebrow, title, ...actions) {
  return h('header', { class: 'view-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, eyebrow), h('h1', {}, title)),
    actions.length > 0 ? h('div', { class: 'head-actions' }, ...actions) : null);
}

// A heading inside a panel, with an ornament line.
export function sectionTitle(text, extra = null) {
  return h('h2', { class: 'section-title' }, h('span', {}, text), extra);
}

export function resourceIcon(key) {
  return icon(RESOURCE_ICONS[key], 'icon res-icon');
}

// Inline: picture, amount, name. Used for costs and loot.
export function resource(key, amount, { lacking = false, sign = '' } = {}) {
  return h('span', { class: `res ${lacking ? 'lacking' : ''}`, 'data-res': key },
    resourceIcon(key), h('span', { class: 'res-amount' }, `${sign}${amount}`), h('span', { class: 'res-name' }, MATERIALS[key]));
}

// The supplies as three small plaques.
export function supplies(purse) {
  return h('div', { class: 'supplies' }, MATERIAL_KEYS.map((key) =>
    h('div', { class: 'supply', 'data-res': key },
      h('span', { class: 'supply-art' }, resourceIcon(key)),
      h('span', { class: 'supply-text' },
        h('span', { class: 'supply-amount' }, String(purse[key] || 0)),
        h('span', { class: 'supply-name' }, MATERIALS[key])))));
}

export function price(amount, have) {
  return h('span', { class: `price ${have < amount ? 'lacking' : ''}` }, resourceIcon('splitter'), String(amount));
}

export function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} Min.`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

function refillText(hours) {
  if (hours <= 0) return 'voll';
  return `voll in ${formatMinutes(Math.ceil(hours * 60))}`;
}

// The stamina bar with a notch every 5 points (10 or 20 on a long bar).
export function staminaBar(st) {
  const value = Math.floor(st.value);
  const step = st.max <= 60 ? 5 : st.max <= 120 ? 10 : 20;
  return h('div', { class: 'stamina', 'aria-label': `Ausdauerleiste ${value} von ${st.max}` },
    h('div', { class: 'stamina-top' },
      h('span', { class: 'stamina-label' }, 'Ausdauerleiste'),
      h('span', { class: 'stamina-value' }, h('strong', {}, `${value}`), ` / ${st.max}`)),
    h('div', { class: 'stamina-bar', style: { '--notches': String(st.max / step) } },
      h('span', { class: 'stamina-fill', style: { width: `${(100 * st.value) / st.max}%` } })),
    h('p', { class: 'stamina-note' }, refillText(st.hoursToFull)));
}

// The picture of a thing. Without one yet, the symbol of its slot.
export function itemIcon(thing, className = 'item-icon') {
  if (!thing.icon) return thing.slot ? icon(SLOT_ICONS[thing.slot], `${className} item-glyph`) : h('span', { class: className });
  return h('img', { class: className, src: thing.icon, alt: '', decoding: 'async', onerror: (e) => { e.currentTarget.hidden = true; } });
}

export function reqChips(item, stats) {
  const entries = Object.entries(item.req || {});
  if (entries.length === 0) return null;
  return h('span', { class: 'req-chips' }, entries.map(([stat, min]) =>
    h('span', { class: `req-chip ${stats[stat].level >= min ? 'met' : 'unmet'}`, 'data-stat': stat, title: statInfo(stat).name },
      statEmblem(stat, 'tiny'), String(min))));
}

const EFFECT_TEXT = {
  schaden: (v) => `Schaden ${v > 0 ? '+' : ''}${v}`,
  treffer: (v) => `Treffer +${v} %`,
  ausweichen: (v) => `Ausweichen +${v} %`,
  beruhigen: (v) => `Beruhigen +${v} %`,
  reise: (v) => `Reise ${v}`,
  erholung: (v) => `Erholung +${v} %`,
  glueck: (v) => `Glück +${v} %`,
};

export function effectText(key, value) {
  return EFFECT_TEXT[key] ? EFFECT_TEXT[key](value) : `${key} ${value}`;
}

export function effectList(effects) {
  const entries = Object.entries(effects || {}).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return h('span', { class: 'item-effects' }, entries.map(([k, v]) => h('span', { class: 'effect' }, effectText(k, v))));
}

export function lockedView(markup, title, text) {
  return h('section', { class: 'view' },
    h('div', { class: 'locked-view' },
      shield(markup, { locked: true }),
      h('h1', {}, title),
      h('p', { class: 'muted' }, text)));
}

// The quest that unlocks a feature, for a hint.
export function unlockHint(feature, catalog) {
  const quest = catalog.quests.find((q) => q.reward.unlocks.includes(feature));
  if (!quest) return 'Noch verschlossen.';
  const place = catalog.placeById.get(quest.place);
  return `Öffnet sich mit der Quest „${quest.name}“${place ? ` (${place.name})` : ''}.`;
}
