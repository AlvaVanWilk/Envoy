// Talentbaum: a page of its own, locked in the menu. It opens once all four
// stats reach level 10; what it contains follows in a later phase, so for now
// it only tells how far away that is.

import { h } from './dom.js';
import { STATS } from '../config.js';
import { NAV_ICONS } from './icons.js';
import { shield } from './shield.js';
import { statEmblem, statNumber } from './stats.js';
import { statText } from '../formulas.js';
import { viewHead } from './parts.js';

export const TALENT_LEVEL = 10;

export function talentsOpen(game) {
  return STATS.every((st) => game.state.stats[st.id].level >= TALENT_LEVEL);
}

export function renderTalents(game) {
  const open = talentsOpen(game);
  return h('section', { class: 'view talent-view' },
    viewHead('Talentbaum', 'Der Talentbaum'),
    h('div', { class: 'panel talent-panel' },
      h('div', { class: 'talent-art' }, shield(NAV_ICONS.talente, { locked: !open })),
      h('p', { class: 'talent-text' }, open
        ? 'Alle vier Werte haben Level 10 erreicht. Der Talentbaum folgt.'
        : 'Öffnet sich, wenn alle vier Werte Level 10 erreichen.'),
      h('ul', { class: 'talent-progress' }, STATS.map((st) => {
        const stat = game.state.stats[st.id];
        const value = Number(statText(stat));   // 1.375: the level and the way to the next one
        return h('li', { 'data-stat': st.id, class: stat.level >= TALENT_LEVEL ? 'reached' : '' },
          statEmblem(st.id, 'small'),
          h('span', { class: 'talent-name' }, st.name),
          h('span', { class: 'talent-bar' }, h('span', { style: { width: `${Math.min(100, (100 * value) / TALENT_LEVEL)}%` } })),
          h('span', { class: 'talent-level' }, stat.level >= TALENT_LEVEL ? `${TALENT_LEVEL}` : statNumber(stat), ` / ${TALENT_LEVEL}`));
      }))));
}
