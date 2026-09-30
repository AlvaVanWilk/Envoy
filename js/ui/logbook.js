// The looking-back parts of the Handbuch:
//   Tageswerk  today first, then every earlier day: which exercise, done or not
//   Quests     every finished expedition, newest first, and how it went
//   Erfolge    what the Envoy has reached, with its reward

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { STATS, MATERIALS } from '../config.js';
import { formatDayLong, formatDayShort } from '../days.js';
import { statEmblem } from './stats.js';
import { RESULT_TEXT } from './journey.js';
import { ACHIEVEMENTS, BONUS_TEXT } from '../achievements.js';

const DAYS_PER_PAGE = 7;
const QUESTS_PER_PAGE = 8;

const chunks = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

// --- Tageswerk ----------------------------------------------------------------

function taskLine(stat, task, game) {
  const exercise = game.catalog.exerciseById.get(task.ex);
  return h('li', { class: `log-task ${task.done ? 'done' : ''}`, 'data-stat': stat },
    statEmblem(stat, 'tiny'),
    h('span', { class: 'log-task-name' }, exercise ? exercise.name : task.ex),
    h('span', { class: 'log-task-state' }, task.done ? `+${task.gain}` : '–'));
}

function dayBlock(entry, game, { withDate = true } = {}) {
  return h('div', { class: 'log-day' },
    withDate || entry.sick
      ? h('p', { class: 'log-day-date' }, withDate ? formatDayShort(entry.day) : null, entry.sick ? h('span', { class: 'log-sick' }, `${withDate ? ' · ' : ''}Krankheitsmodus`) : null)
      : null,
    h('ul', { class: 'log-tasks' }, STATS.filter((st) => entry.tasks[st.id]).map((st) => taskLine(st.id, entry.tasks[st.id], game))));
}

export function daysPages(game) {
  const { log, today } = game.state;
  const todayEntry = log.find((e) => e.day === today);
  const earlier = log.filter((e) => e.day !== today).reverse();
  const first = {
    id: 'heute',
    title: 'Heute',
    body: () => [
      h('p', { class: 'page-note' }, formatDayLong(today)),
      todayEntry ? dayBlock(todayEntry, game, { withDate: false }) : h('p', {}, 'Heute ist noch nichts geplant.'),
      h('a', { class: 'book-link', href: '#tageswerk' }, 'Zum Tageswerk'),
    ],
  };
  const pages = chunks(earlier, DAYS_PER_PAGE).map((part, n) => ({
    id: `tage-${n + 1}`,
    title: 'Die Tage davor',
    body: () => [
      h('p', { class: 'page-note' }, `${formatDayShort(part[part.length - 1].day)} bis ${formatDayShort(part[0].day)}`),
      part.map((e) => dayBlock(e, game)),
    ],
  }));
  return [first, ...pages];
}

// --- Quests --------------------------------------------------------------------

const clock = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

function outcomeText(entry, game) {
  const monster = (id) => game.catalog.monsterById.get(id)?.name || id;
  if (entry.kind === 'hoehle') {
    const overcome = entry.fights.filter((f) => f.result !== 'driven').length;
    const spirits = overcome === 0 ? 'Kein Geist' : overcome === 1 ? 'Ein Geist' : `${overcome} Geister`;
    return entry.cleared ? `Alle ${entry.fights.length} Geister überwunden` : `${spirits} überwunden, dann umgekehrt`;
  }
  if (entry.fights.length > 0) return entry.fights.map((f) => `${monster(f.monster)} ${RESULT_TEXT[f.result] || f.result}`).join(', ');
  if (entry.kind === 'bauen') return 'Gebaut';
  const parts = ['splitter', 'pilzholz', 'stein'].filter((k) => entry.reward[k] > 0).map((k) => `${entry.reward[k]} ${MATERIALS[k]}`);
  if (entry.reward.things > 0) parts.push(entry.reward.things === 1 ? 'ein Fundstück' : `${entry.reward.things} Fundstücke`);
  return parts.length > 0 ? parts.join(', ') : 'Zurück ohne Fund';
}

function questLine(entry, game) {
  const place = game.catalog.placeById.get(entry.place);
  return h('li', { class: `log-quest ${entry.cleared ? 'cleared' : ''}` },
    h('span', { class: 'log-quest-mark' }, entry.cleared ? icon(UI_ICONS.check) : null),
    h('span', { class: 'log-quest-text' },
      h('span', { class: 'log-quest-title' }, entry.title),
      h('span', { class: 'log-quest-meta' }, `${formatDayShort(entry.day)}, ${clock(entry.end)} · ${place ? place.name : ''}`),
      h('span', { class: 'log-quest-outcome' }, outcomeText(entry, game))));
}

export function questPages(game) {
  const journal = [...game.state.world.journal].reverse();
  if (journal.length === 0) {
    return [{ id: 'quests', title: 'Quests', body: () => [h('p', {}, 'Noch keine Expedition beendet.')] }];
  }
  return chunks(journal, QUESTS_PER_PAGE).map((part, n) => ({
    id: `quests-${n + 1}`,
    title: n === 0 ? 'Zuletzt' : 'Davor',
    body: () => [h('ul', { class: 'log-quests' }, part.map((e) => questLine(e, game)))],
  }));
}

// --- Erfolge ---------------------------------------------------------------------

export function achievementPages(game) {
  const earned = game.state.achievements;
  const reached = ACHIEVEMENTS.filter((a) => earned[a.id]);
  return [{
    id: 'erfolge',
    title: 'Erfolge',
    body: () => (reached.length === 0 ? [h('p', {}, 'Noch keine Erfolge.')] : [
      h('ul', { class: 'book-achievements' }, reached.map((a) => h('li', { class: 'book-achievement' },
        h('span', { class: 'achievement-seal' }, icon(UI_ICONS.check)),
        h('span', { class: 'achievement-text' },
          h('span', { class: 'achievement-name' }, a.name),
          h('span', {}, a.text),
          h('span', { class: 'achievement-date' }, `Erreicht am ${formatDayShort(earned[a.id].day)}`),
          Object.entries(a.reward || {}).map(([kind, share]) => h('span', { class: 'achievement-reward' }, BONUS_TEXT[kind] ? BONUS_TEXT[kind](share) : kind)))))),
    ]),
  }];
}
