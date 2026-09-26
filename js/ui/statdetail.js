// Details of one stat: progress, best level, floor and the last days.

import { h } from './dom.js';
import { openSheet } from './sheet.js';
import { statRow, statInfo } from './stats.js';
import { floorPosition } from '../formulas.js';
import { formatDayShort } from '../days.js';

const DAYS_SHOWN = 14;

export function openStatDetail(stat, game) {
  const s = game.state.stats[stat];
  const info = statInfo(stat);
  const entries = [...game.state.history[stat]].reverse().slice(0, DAYS_SHOWN);

  const rows = entries.map((e) => {
    let text;
    let tone;
    if (e.kind === 'gain') {
      text = `+${e.xp} ${info.name}`;
      tone = 'gain';
    } else if (e.xp < 0) {
      text = `Pause · −${Math.abs(e.xp)} ${info.name}`;
      tone = 'loss';
    } else {
      text = 'Pause';
      tone = 'rest';
    }
    return h('li', { class: `history-row ${tone}` },
      h('span', { class: 'history-day' }, e.day === game.state.today ? 'Heute' : formatDayShort(e.day)),
      h('span', { class: 'history-text' }, text),
      h('span', { class: 'history-level' }, `Level ${e.level}`));
  });

  openSheet({
    title: info.name,
    eyebrow: info.area,
    className: 'stat-sheet',
    content: [
      statRow(stat, s),
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Höchstes Level'), h('dd', {}, String(s.maxLevel))),
        h('div', {}, h('dt', {}, 'Untergrenze'), h('dd', {}, `Level ${Math.floor(floorPosition(s.maxLevel))}`))),
      rows.length > 0
        ? h('div', {}, h('h3', { class: 'section-title' }, 'Letzte Tage'), h('ul', { class: 'history' }, rows))
        : null,
    ],
  });
}
