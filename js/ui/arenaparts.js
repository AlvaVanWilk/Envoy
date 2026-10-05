// Small building blocks of the arena pages (see arena.js).

import { h, icon } from './dom.js';
import { NAV_ICONS } from './icons.js';
import { resolveLook, portraitSrc, showLayer } from './look.js';
import { titleById } from '../world/arena.js';
import { HALTUNGEN } from '../config.js';

// The round picture of an Envoy: { name, figur, haut, haar }.
export function abbildPortrait(look, className = 'arena-pic') {
  const resolved = resolveLook(look);
  const img = h('img', { alt: '' });
  showLayer(img, portraitSrc(resolved), resolved, 'portrait');
  return h('span', { class: className }, img);
}

export const titleText = (id) => titleById(id)?.name || '';

// Name and Titel: „Mara mit ruhiger Hand“.
export function nameLine(name, titel, className = 'arena-name') {
  const title = titleText(titel);
  return h('span', { class: className }, name, title ? h('span', { class: 'arena-title' }, ` ${title}`) : null);
}

// An amount of Ruhm with its laurel.
export function ruhmAmount(amount, sign = '') {
  return h('span', { class: 'ruhm' }, icon(NAV_ICONS.arena, 'icon ruhm-icon'), h('span', { class: 'ruhm-amount' }, `${sign}${amount}`), h('span', { class: 'ruhm-name' }, 'Ruhm'));
}

// Three Haltungen; each one has the edge over another.
export function haltungPicker(chosen, onPick, label) {
  const edge = HALTUNGEN.find((x) => x.id === chosen);
  return h('div', { class: 'arena-haltung' },
    h('p', { class: 'arena-label' }, label),
    h('div', { class: 'chips' }, HALTUNGEN.map((x) => h('button', {
      class: `chip${x.id === chosen ? ' active' : ''}`, type: 'button', 'aria-pressed': String(x.id === chosen),
      onclick: () => onPick(x.id),
    }, x.name))),
    edge ? h('p', { class: 'arena-edge' }, `${edge.name} ${edge.edge}.`) : null);
}
