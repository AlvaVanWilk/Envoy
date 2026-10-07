// Small building blocks of the arena pages (see arena.js).

import { h, icon } from './dom.js';
import { NAV_ICONS } from './icons.js';
import { resolveLook, portraitSrc, showLayer } from './look.js';
import { titleById } from '../world/arena.js';

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
