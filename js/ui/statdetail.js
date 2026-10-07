// Details of one stat: its value, what it does in the game (with its numbers
// now, without the clothes), best level, floor and the last days (what was
// done and the value after each day; how much it rose or fell is not shown as
// a number).

import { h } from './dom.js';
import { openSheet } from './sheet.js';
import { statRow, statInfo } from './stats.js';
import { floorPosition, statText } from '../formulas.js';
import { formatDayShort } from '../days.js';
import { maxStamina } from '../world/hero.js';
import { gatherChance } from '../world/run.js';
import { restMinutes } from '../world/depths.js';
import { STAMINA_BONUS_PER_GELASSENHEIT } from '../config.js';

const percent = (share) => `${Math.round(Math.min(1, share) * 100)} %`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// What the stat does, with the numbers for its level now (in a fight against
// a spirit of Stufe 1, as on the Envoy page; the dice of gathering on the Trümmerfeld).
function effectRows(stat, stats) {
  const level = stats[stat].level;
  const rows = {
    kraft: [['Schaden je Treffer', `${1 + Math.round(0.6 * level)} bis ${3 + Math.round(0.6 * level)}`], ['Stein beim Sammeln, je Würfel', percent(gatherChance(level))]],
    ausdauer: [['Energie-Leiste', String(maxStamina(stats))], ['Leben im Kampf', String(8 + 3 * level)]],
    beweglichkeit: [['Ausweichen', percent(clamp(0.08 + 0.03 * (level - 1), 0, 0.6))], ['Treffer', percent(clamp(0.65 + 0.04 * (level - 1), 0.15, 0.95))], ['Pilzholz beim Sammeln, je Würfel', percent(gatherChance(level))]],
    gelassenheit: [['Energie füllt sich', `${Math.round(100 * STAMINA_BONUS_PER_GELASSENHEIT * level)} % schneller`], ['Beruhigen', percent(clamp(0.04 + 0.04 * (level - 1), 0, 0.5))], ['Rast in den Tiefen', `${restMinutes(stats)} Minuten`]],
  }[stat];
  return h('dl', { class: 'facts stat-effects' }, rows.map(([dt, dd]) => h('div', {}, h('dt', {}, dt), h('dd', {}, dd))));
}

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
      h('p', { class: 'stat-wirkung' }, info.wirkung),
      effectRows(stat, game.state.stats),
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Höchstes Level'), h('dd', {}, String(s.maxLevel))),
        h('div', {}, h('dt', {}, 'Untergrenze'), h('dd', {}, String(Math.floor(floorPosition(s.maxLevel)))))),
      rows.length > 0
        ? h('div', {}, h('h3', { class: 'section-title' }, 'Letzte Tage'), h('ul', { class: 'history' }, rows))
        : null,
    ],
  });
}
