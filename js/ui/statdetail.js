// Details of one stat: its value, best level, floor and the last days (what
// was done and the value after each day; how much it rose or fell is not
// shown as a number).

import { h } from './dom.js';
import { openSheet } from './sheet.js';
import { statRow, statInfo } from './stats.js';
import { floorPosition, statText } from '../formulas.js';
import { formatDayShort } from '../days.js';

const DAYS_SHOWN = 14;

export function openStatDetail(stat, game) {
  const s = game.state.stats[stat];
  const info = statInfo(stat);
  const entries = [...game.state.history[stat]].reverse().slice(0, DAYS_SHOWN);

  const rows = entries.map((e) => {
    const tone = e.kind === 'gain' ? 'gain' : e.xp < 0 ? 'loss' : 'rest';
    return h('li', { class: `history-row ${tone}` },
      h('span', { class: 'history-day' }, e.day === game.state.today ? 'Heute' : formatDayShort(e.day)),
      h('span', { class: 'history-text' }, e.kind === 'gain' ? 'Erledigt' : 'Pause'),
      h('span', { class: 'history-level' }, e.levelXp === undefined ? String(e.level) : statText({ level: e.level, xp: e.levelXp })));
  });

  openSheet({
    title: info.name,
    eyebrow: info.area,
    className: 'stat-sheet',
    content: [
      statRow(stat, s),
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Höchstes Level'), h('dd', {}, String(s.maxLevel))),
        h('div', {}, h('dt', {}, 'Untergrenze'), h('dd', {}, String(Math.floor(floorPosition(s.maxLevel)))))),
      rows.length > 0
        ? h('div', {}, h('h3', { class: 'section-title' }, 'Letzte Tage'), h('ul', { class: 'history' }, rows))
        : null,
    ],
  });
}
