// Small building blocks used by several views.

import { h, icon } from './dom.js';
import { NAV_ICONS, RESOURCE_ICONS, UI_ICONS } from './icons.js';
import { statEmblem, statInfo } from './stats.js';
import { CURRENCY } from '../config.js';

// Round metal disc with an icon, as in the menu.
export function coin(markup, extra = null) {
  return h('span', { class: 'coin' }, icon(markup), extra);
}

export function viewHead(eyebrow, title, ...actions) {
  return h('header', { class: 'view-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, eyebrow), h('h1', {}, title)),
    h('div', { class: 'head-actions' }, ...actions,
      h('a', { class: 'gear', href: '#einstellungen', 'aria-label': 'Einstellungen' }, coin(NAV_ICONS.einstellungen))));
}

const RESOURCE_NAMES = { glimmer: CURRENCY, holz: 'Holz', stein: 'Stein' };

export function resource(key, amount, { lacking = false } = {}) {
  return h('span', { class: `purse-item ${key} ${lacking ? 'lacking' : ''}`, title: RESOURCE_NAMES[key] },
    icon(RESOURCE_ICONS[key]), `${amount} ${RESOURCE_NAMES[key]}`);
}

export function purse(p) {
  return h('div', { class: 'purse' }, resource('glimmer', p.glimmer), resource('holz', p.holz), resource('stein', p.stein));
}

export function price(amount, have) {
  return h('span', { class: `price ${have < amount ? 'lacking' : ''}` }, icon(RESOURCE_ICONS.glimmer), String(amount));
}

function duration(hours) {
  if (hours <= 0) return 'voll';
  const minutes = Math.ceil(hours * 60);
  if (minutes < 60) return `voll in ${minutes} Min.`;
  const h1 = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `voll in ${h1} Std.${m ? ` ${m} Min.` : ''}`;
}

export function staminaBar(st) {
  const value = Math.floor(st.value);
  return h('div', { class: 'stamina', 'aria-label': `Ausdauerleiste ${value} von ${st.max}` },
    h('div', { class: 'stamina-top' },
      h('span', {}, 'Ausdauerleiste'),
      h('span', {}, h('strong', {}, `${value} / ${st.max}`), ` · ${duration(st.hoursToFull)}`)),
    h('div', { class: 'bar' }, h('span', { class: 'bar-fill', style: { width: `${(100 * st.value) / st.max}%` } })));
}

export function itemIcon(thing, className = 'item-icon') {
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
      coin(markup, h('span', { class: 'coin-lock', html: UI_ICONS.lock })),
      h('h1', {}, title),
      h('p', { class: 'muted' }, text)));
}

// The quest that unlocks a feature, for a hint.
export function unlockHint(feature, catalog) {
  const quest = catalog.quests.find((q) => q.reward.unlocks.includes(feature));
  if (!quest) return 'Noch verschlossen.';
  const place = catalog.placeById.get(quest.place);
  return `Wird freigeschaltet durch die Quest „${quest.name}“${place ? ` (${place.name})` : ''}.`;
}
