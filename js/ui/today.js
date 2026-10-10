// "Tageswerk": the four tasks of today, one per area (see tasks.js).
// Each task is one short row. Tapping it turns it over into a card with the
// Envoy doing the exercises, the steps, the guided timer and „Erledigt“ (see
// taskcard.js); a done task shows a tick, a tap on it takes the task back. A question mark
// explains what the Tageswerk is for. Once all four are done, the page rests
// and shows what tomorrow brings.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { STATS } from '../config.js';
import { formatDayLong, addDays } from '../days.js';
import { statRow, statEmblem, statInfo } from './stats.js';
import { openStatDetail } from './statdetail.js';
import { viewHead, sectionTitle } from './parts.js';
import { taskFor } from '../tasks.js';
import { openTaskCard, countsFor, taskTitle, formatSeconds } from './taskcard.js';
import { openSheet, closeSheet } from './sheet.js';

let helpOpen = false;

// What the Tageswerk is for, in a few calm lines. The Handbuch says more.
function helpPanel() {
  return h('div', { class: 'panel help-panel', id: 'tageswerk-hilfe' },
    h('p', {}, 'Das Tageswerk sind vier Aufgaben, eine für jeden Wert des Envoy. Die App gibt sie vor, auch wie schwer sie sind.'),
    h('p', {}, 'Nur das Tageswerk stärkt den Envoy. Jede erledigte Aufgabe bringt ihrem Wert Fortschritt; ist der Ring am Portrait voll, steigt der Wert um ein Level.'),
    h('p', {}, 'Bleibt eine Aufgabe länger als einen Tag liegen, sinkt ihr Wert langsam. Ganz verloren geht er nie.'),
    h('a', { class: 'btn text small', href: '#handbuch/anleitung/tageswerk' }, icon(UI_ICONS.book), 'Mehr im Handbuch'));
}

function helpButton(game) {
  return h('button', {
    class: `help-btn ${helpOpen ? 'on' : ''}`, type: 'button',
    'aria-expanded': String(helpOpen), 'aria-controls': 'tageswerk-hilfe', 'aria-label': 'Was ist das Tageswerk?',
    onclick: () => { helpOpen = !helpOpen; game.refresh(); },
  }, '?');
}

const clock = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

// A bonus that only lasts a short while, named once, calmly, with its end.
function bonusNote(game) {
  const running = game.bonuses();
  if (running.length === 0) return null;
  const tasks = running.filter((b) => b.achievement.reward.tageswerk);
  if (tasks.length === 0) return null;
  const share = Math.round(tasks.reduce((sum, b) => sum + b.achievement.reward.tageswerk, 0) * 100);
  const end = Math.max(...tasks.map((b) => b.end));
  return h('p', { class: 'bonus-note' }, `${tasks[0].achievement.name}: +${share} % auf jeden Gewinn, bis ${clock(end)} Uhr.`);
}

// All four done: a calm note and the tasks of tomorrow, with the exercises
// that will be done at a new stage.
function restPanel(game) {
  const { state, catalog } = game;
  const line = (stat) => {
    const next = taskFor(stat, state.intensity, state.sick, catalog, state.age, addDays(state.today, 1));
    if (!next) return null;
    const changed = next.parts.filter((p) => p.level !== (state.intensityAtDayStart[p.key]?.level || 1));
    return h('li', { 'data-stat': stat }, statEmblem(stat, 'tiny'),
      h('span', {}, taskTitle(next),
        changed.map((p) => h('span', { class: 'tomorrow-new' }, ` · ${p.row.kurz}: neue Stufe`))));
  };
  return h('section', { class: 'panel rest-panel' },
    h('p', { class: 'rest-title' }, 'Das Tageswerk ist erledigt.'),
    h('p', { class: 'muted' }, 'Morgen ab 3 Uhr'),
    h('ul', { class: 'tomorrow' }, STATS.map((st) => line(st.id))));
}

export function renderToday(game) {
  const s = game.state;
  const doneCount = STATS.filter((st) => s.todayDone[st.id]).length;

  const sickSwitch = h('button', {
    class: 'switch', role: 'switch', 'aria-checked': String(s.sick),
    onclick: () => game.setSick(!s.sick),
  }, h('span', { class: 'switch-knob' }), 'Krankheitsmodus');

  return h('section', { class: `view today ${doneCount === STATS.length ? 'all-done' : ''}` },
    viewHead(formatDayLong(s.today), 'Tageswerk', helpButton(game)),
    helpOpen ? helpPanel() : null,
    doneCount < STATS.length ? bonusNote(game) : null,
    h('div', { class: 'today-grid' },
      h('div', { class: 'today-main' },
        doneCount === STATS.length ? restPanel(game) : null,
        h('div', { class: 'today-meta' },
          h('span', { class: 'today-count' }, `${doneCount} von 4 erledigt`),
          sickSwitch),
        s.sick ? h('p', { class: 'sick-note' }, 'Alle Aufgaben auf der leichtesten Stufe.') : null,
        h('div', { class: 'task-list panel' }, STATS.map((st) => taskRow(st.id, game)))),
      h('aside', { class: 'today-side' },
        h('section', { class: 'panel' },
          sectionTitle('Werte'),
          STATS.map((st) => statRow(st.id, s.stats[st.id], { onclick: () => openStatDetail(st.id, game) }))))));
}

function taskRow(stat, game) {
  const info = statInfo(stat);
  const task = game.todayTask(stat);
  const done = game.state.todayDone[stat];

  if (!task) {
    return h('article', { class: 'task-row empty', 'data-stat': stat },
      h('div', { class: 'task-summary' }, statEmblem(stat),
        h('span', { class: 'task-title' }, h('span', { class: 'task-name' }, info.name), h('span', { class: 'task-meta' }, 'Keine Übung im Katalog.'))));
  }

  // of a task with several exercises: how many are done so far
  const partsDone = done ? 0 : Object.keys(game.partsDone(stat)).length;
  const summary = h('button', { class: 'task-summary', 'aria-haspopup': 'dialog', onclick: () => openTaskCard(stat, game) },
    statEmblem(stat),
    h('span', { class: 'task-title' },
      h('span', { class: 'task-name' }, taskTitle(task)),
      h('span', { class: 'task-meta' }, h('span', { class: 'task-gain' }, countsFor(stat)), h('span', { class: 'task-area' }, ` · ${formatSeconds(task.seconds)}`),
        partsDone > 0 ? h('span', { class: 'task-progress' }, ` · ${partsDone} von ${task.parts.length}`) : null)),
    icon(UI_ICONS.chevron, 'icon task-chevron'));

  const quick = done
    ? h('button', { class: 'task-check done', 'aria-label': `${taskTitle(task)} zurücknehmen`, onclick: () => confirmUndo(stat, task, game) }, icon(UI_ICONS.check))
    : null;   // no tick to finish it at once (since 5.20.9): it is done in the card, exercise by exercise

  return h('article', { class: `task-row ${done ? 'done' : ''}`, 'data-stat': stat },
    h('div', { class: 'task-line' }, summary, quick));
}

// A tap on the tick of a done task: take it back (what it gave goes again).
function confirmUndo(stat, task, game) {
  openSheet({
    title: taskTitle(task),
    eyebrow: 'Tageswerk',
    content: [
      h('p', {}, 'Die Aufgabe ist als erledigt markiert. Zurücknehmen?'),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', type: 'button', onclick: closeSheet }, 'Behalten'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { closeSheet(); game.undo(stat); } }, icon(UI_ICONS.undo), 'Zurücknehmen')),
    ],
  });
}
