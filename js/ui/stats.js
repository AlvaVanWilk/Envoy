// Stat display: emblem, name, the value as a number (1.375: the level big,
// after the point small how far it is to the next one, see statValue in
// formulas.js) and the bar beside it, which shows the same.
// Remembers what was shown last, so a change animates the bar.

import { h, icon } from './dom.js';
import { STAT_ICONS } from './icons.js';
import { STATS, STAT_MAX_LEVEL } from '../config.js';
import { xpToNext, statValue, statText } from '../formulas.js';

const lastShown = {};
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const percent = (s) => (s.level >= STAT_MAX_LEVEL ? 100 : (100 * s.xp) / xpToNext(s.level));

export function statInfo(id) {
  return STATS.find((s) => s.id === id);
}

export function statEmblem(id, size = '') {
  return h('span', { class: `stat-emblem ${size}`, 'data-stat': id }, icon(STAT_ICONS[id]));
}

// The value of a stat: the level big, the thousandths after the point small.
export function statNumber(stat, className = '') {
  const { whole, part } = statValue(stat);
  return h('span', { class: `stat-value ${className}` },
    h('span', { class: 'stat-whole' }, whole),
    part ? h('span', { class: 'stat-part' }, part) : null);
}

export function statRow(id, stat, { onclick = null } = {}) {
  const info = statInfo(id);
  const fill = h('span', { class: 'stat-fill' });

  const row = h(onclick ? 'button' : 'div', {
    class: 'stat-row', 'data-stat': id, onclick, 'data-tip': info.wirkung,
    'aria-label': `${info.name} ${statText(stat)}`,
  },
  statEmblem(id),
  h('span', { class: 'stat-main' },
    h('span', { class: 'stat-name' }, info.name),
    statNumber(stat),
    h('span', { class: 'stat-bar' }, fill)));

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
