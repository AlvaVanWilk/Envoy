// "Tageswerk": the four tasks the app has chosen for today.
// Each task is one short row. Tapping it opens it: timer, done, and the
// instructions only when asked for. A question mark explains what the
// Tageswerk is for. Once all four are done, the page rests and shows what
// tomorrow brings.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { STATS, FEEDBACK, MEASUREMENTS } from '../config.js';
import { formatDayLong } from '../days.js';
import { statRow, statEmblem, statInfo } from './stats.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { openTimer } from './timer.js';
import { openStatDetail } from './statdetail.js';
import { viewHead, sectionTitle } from './parts.js';
import { tomorrowPlans } from '../planner.js';

// Which rows are open and which show their instructions. Kept while the
// app is open, so a new render keeps them.
const open = new Set();
const guide = new Set();
let helpOpen = false;

// What the Tageswerk is for, in a few calm lines. The Handbuch says more.
function helpPanel() {
  return h('div', { class: 'panel help-panel', id: 'tageswerk-hilfe' },
    h('p', {}, 'Das Tageswerk sind vier Aufgaben, eine für jeden Wert des Envoy. Die App wählt sie jeden Tag neu aus.'),
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

// All four done: a calm note and the exercises of tomorrow.
function restPanel(game) {
  const next = tomorrowPlans(game.state, game.catalog);
  return h('section', { class: 'panel rest-panel' },
    h('p', { class: 'rest-title' }, 'Das Tageswerk ist erledigt.'),
    h('p', { class: 'muted' }, 'Morgen ab 3 Uhr'),
    h('ul', { class: 'tomorrow' }, STATS.filter((st) => next[st.id]).map((st) =>
      h('li', { 'data-stat': st.id }, statEmblem(st.id, 'tiny'), h('span', {}, next[st.id].name)))));
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

const formatValue = (value) => String(Math.round(value * 100) / 100).replace('.', ',');
const gainText = (stat, xp) => `+${xp} ${statInfo(stat).name}`;
// The gain of a task: what it brought, or what it brings now.
const gainOf = (stat, exercise, game) => game.state.todayDone[stat]?.gain ?? game.gainFor(exercise);

function formatMinutes(min) {
  return min < 1 ? `${Math.round(min * 60)} Sek.` : `${String(min).replace('.', ',')} Min.`;
}

function taskRow(stat, game) {
  const info = statInfo(stat);
  const exercise = game.todayExercise(stat);
  const done = game.state.todayDone[stat];
  const isOpen = open.has(stat);

  if (!exercise) {
    return h('article', { class: 'task-row empty', 'data-stat': stat },
      h('div', { class: 'task-summary' }, statEmblem(stat),
        h('span', { class: 'task-title' }, h('span', { class: 'task-name' }, info.name), h('span', { class: 'task-meta' }, 'Keine Übung im Katalog.'))));
  }

  const toggle = () => {
    if (open.has(stat)) open.delete(stat); else open.add(stat);
    game.refresh();
  };

  const summary = h('button', { class: 'task-summary', 'aria-expanded': String(isOpen), onclick: toggle },
    statEmblem(stat),
    h('span', { class: 'task-title' },
      h('span', { class: 'task-name' }, exercise.name),
      h('span', { class: 'task-meta' }, h('span', { class: 'task-gain' }, gainText(stat, gainOf(stat, exercise, game))), h('span', { class: 'task-area' }, ` · ${info.area}`))),
    icon(UI_ICONS.expand, 'icon task-chevron'));

  const quick = done
    ? h('span', { class: 'task-check done', 'aria-label': 'Erledigt' }, icon(UI_ICONS.check))
    : h('button', { class: 'task-check', 'aria-label': `${exercise.name} erledigt`, onclick: () => finish(stat, game) }, icon(UI_ICONS.check));

  return h('article', { class: `task-row ${done ? 'done' : ''} ${isOpen ? 'open' : ''}`, 'data-stat': stat },
    h('div', { class: 'task-line' }, summary, quick),
    isOpen ? taskBody(stat, exercise, done, game) : null);
}

function taskBody(stat, exercise, done, game) {
  const showGuide = guide.has(stat);
  const guideButton = h('button', {
    class: `btn text small ${showGuide ? 'on' : ''}`,
    onclick: () => { if (guide.has(stat)) guide.delete(stat); else guide.add(stat); game.refresh(); },
  }, icon(UI_ICONS.book), showGuide ? 'Anleitung schließen' : 'Anleitung');
  const steps = showGuide ? h('ol', { class: 'task-steps' }, exercise.steps.map((step) => h('li', {}, step))) : null;

  if (done) {
    const feedback = FEEDBACK.find((f) => f.id === done.fb);
    const value = done.mk && done.m ? done.m[done.mk] : null;
    const def = MEASUREMENTS[done.mk];
    return h('div', { class: 'task-body' },
      h('div', { class: 'task-done-row' },
        value !== null && def ? h('span', { class: 'pill' }, `${formatValue(value)} ${def.unit}`) : null,
        feedback ? h('span', { class: 'pill' }, feedback.label) : null,
        stat === 'gelassenheit' ? h('span', { class: 'pill' }, 'Rast: Energie halb aufgefüllt') : null),
      h('div', { class: 'task-actions' },
        guideButton,
        h('button', { class: 'btn text small', onclick: () => game.undo(stat) }, icon(UI_ICONS.undo), 'Rückgängig')),
      steps);
  }

  const measure = exercise.messung ? MEASUREMENTS[exercise.messung] : null;
  return h('div', { class: 'task-body' },
    measure ? h('p', { class: 'task-hint' }, `Danach eintragen: ${measure.question.replace('?', '')}${measure.unit ? ` (${measure.unit})` : ''}`) : null,
    h('div', { class: 'task-actions' },
      guideButton,
      exercise.timer_min
        ? h('button', { class: 'btn ghost small', onclick: () => openTimer(exercise, { onFinish: () => finish(stat, game) }) },
          icon(UI_ICONS.timer), formatMinutes(exercise.timer_min))
        : null,
      h('button', { class: 'btn primary small', onclick: () => finish(stat, game) }, 'Erledigt')),
    steps);
}

// Finishing a task. A measured value is required where the exercise has one;
// the feeling is asked only for new exercises and after a change of level;
// otherwise one tap is enough.
export function finish(stat, game) {
  const exercise = game.todayExercise(stat);
  if (!exercise || game.state.todayDone[stat]) return;

  if (exercise.messung) {
    openMeasurement(stat, exercise, game);
  } else if (game.needsFeedback(stat)) {
    openFeedback(stat, exercise, game);
  } else {
    commit(stat, {}, game);
  }
}

function commit(stat, answer, game) {
  const exercise = game.todayExercise(stat);
  const gain = game.gainFor(exercise);
  const before = game.state.stats[stat];
  const anchor = document.querySelector(`.task-row[data-stat="${stat}"] .task-gain`);
  const rect = anchor ? anchor.getBoundingClientRect() : null;
  game.complete(stat, answer);
  closeSheet();
  const after = game.state.stats[stat];
  if (rect) floatGain(gainText(stat, gain), rect, stat);
  if (after.level > before.level) {
    setTimeout(() => toast(`${statInfo(stat).name} · Level ${after.level}`, { tone: 'level' }), 700);
  }
}

function openMeasurement(stat, exercise, game) {
  const def = MEASUREMENTS[exercise.messung];
  const input = h('input', {
    class: 'field', type: 'text', inputmode: def.decimals ? 'decimal' : 'numeric',
    autocomplete: 'off', 'aria-label': def.question,
  });
  const parse = () => {
    const value = parseFloat(String(input.value).replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const submit = h('button', { class: 'btn primary', disabled: true, onclick: () => {
    const value = parse();
    if (value !== null) commit(stat, { value }, game);
  } }, 'Eintragen');
  input.addEventListener('input', () => { submit.disabled = parse() === null; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && parse() !== null) submit.click(); });

  openSheet({
    title: exercise.name,
    eyebrow: statInfo(stat).name,
    className: 'complete-sheet',
    content: [
      h('p', { class: 'sheet-question' }, def.question),
      h('div', { class: 'measure-input' }, input, h('span', { class: 'unit' }, def.unit)),
      h('div', { class: 'sheet-actions' }, submit),
    ],
  });
  setTimeout(() => input.focus(), 250);
}

function openFeedback(stat, exercise, game) {
  openSheet({
    title: exercise.name,
    eyebrow: statInfo(stat).name,
    className: 'complete-sheet',
    content: [
      h('p', { class: 'sheet-question' }, 'Wie war es?'),
      h('div', { class: 'feedback-row' }, FEEDBACK.map((f) =>
        h('button', { class: `btn feedback fb-${f.id}`, onclick: () => commit(stat, { feedback: f.id }, game) }, f.label))),
    ],
  });
}

function floatGain(text, rect, stat) {
  const el = h('div', { class: 'gain-float', 'data-stat': stat, style: { left: `${rect.left + rect.width / 2}px`, top: `${rect.top}px` } }, text);
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
}
