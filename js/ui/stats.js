// Stat display: emblem, level, bar and progress as a number (e.g. 4/45).
// Remembers what was shown last, so a change animates the bar.

import { h, icon } from './dom.js';
import { STAT_ICONS } from './icons.js';
import { STATS, STAT_MAX_LEVEL } from '../config.js';
import { xpToNext } from '../formulas.js';

const lastShown = {};
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const percent = (s) => (s.level >= STAT_MAX_LEVEL ? 100 : (100 * s.xp) / xpToNext(s.level));

export function statInfo(id) {
  return STATS.find((s) => s.id === id);
}

export function statEmblem(id, size = '') {
  return h('span', { class: `stat-emblem ${size}`, 'data-stat': id }, icon(STAT_ICONS[id]));
}

export function statRow(id, stat, { onclick = null, showLabel = true } = {}) {
  const info = statInfo(id);
  const fill = h('span', { class: 'stat-fill' });
  const levelNumber = h('span', { class: 'stat-level-num' }, String(stat.level));
  const progress = stat.level >= STAT_MAX_LEVEL
    ? 'max'
    : `${Math.floor(stat.xp)}/${xpToNext(stat.level)}`;

  const row = h(onclick ? 'button' : 'div', {
    class: 'stat-row', 'data-stat': id, onclick,
    'aria-label': `${info.name}, Level ${stat.level}, ${progress} XP`,
  },
  statEmblem(id),
  h('span', { class: 'stat-main' },
    h('span', { class: 'stat-name' }, info.name),
    h('span', { class: 'stat-bar' }, fill),
    h('span', { class: 'stat-progress' }, progress)),
  h('span', { class: 'stat-level' },
    showLabel ? h('span', { class: 'stat-level-label' }, 'Level') : null,
    levelNumber));

  animate(id, stat, fill, row);
  return row;
}

function animate(id, stat, fill, row) {
  const before = lastShown[id];
  lastShown[id] = { level: stat.level, xp: stat.xp };
  const target = percent(stat);

  if (!before || reduceMotion() || (before.level === stat.level && before.xp === stat.xp)) {
    fill.style.width = `${target}%`;
    return;
  }
  const from = percent(before);
  fill.style.transition = 'none';
  fill.style.width = `${before.level === stat.level ? from : before.level < stat.level ? from : 100}%`;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.transition = '';
    if (stat.level > before.level) {
      fill.style.width = '100%';
      setTimeout(() => {
        row.classList.add('level-up');
        fill.style.transition = 'none';
        fill.style.width = '0%';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fill.style.transition = '';
          fill.style.width = `${target}%`;
        }));
        setTimeout(() => row.classList.remove('level-up'), 1600);
      }, 650);
    } else if (stat.level < before.level) {
      fill.style.width = '0%';
      setTimeout(() => {
        fill.style.transition = 'none';
        fill.style.width = '100%';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fill.style.transition = '';
          fill.style.width = `${target}%`;
        }));
      }, 650);
    } else {
      fill.style.width = `${target}%`;
      row.classList.add('gain');
      setTimeout(() => row.classList.remove('gain'), 1200);
    }
  }));
}
