// "Heute": the four tasks the app has chosen for today.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { STATS, FEEDBACK, MEASUREMENTS } from '../config.js';
import { formatDayLong } from '../days.js';
import { statRow, statEmblem, statInfo } from './stats.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { openTimer } from './timer.js';
import { openStatDetail } from './statdetail.js';
import { viewHead } from './parts.js';

export function renderToday(game) {
  const s = game.state;
  const gainedToday = STATS.reduce((sum, st) => sum + (s.todayDone[st.id]?.xp || 0), 0);
  const allDone = STATS.every((st) => s.todayDone[st.id]);

  const sickSwitch = h('button', {
    class: 'switch', role: 'switch', 'aria-checked': String(s.sick),
    onclick: () => game.setSick(!s.sick),
  }, h('span', { class: 'switch-knob' }), 'Krankheitsmodus');

  return h('section', { class: 'view today' },
    viewHead('Tageswerk', formatDayLong(s.today)),
    h('div', { class: 'today-top' },
      h('div', { class: 'panel stat-strip' }, STATS.map((st) => statRow(st.id, s.stats[st.id], {
        showLabel: false,
        onclick: () => openStatDetail(st.id, game),
      }))),
      h('div', { class: 'today-meta' },
        sickSwitch,
        gainedToday > 0
          ? h('span', { class: 'today-gain' },
            allDone ? h('span', { class: 'complete-mark' }, icon(UI_ICONS.check), 'Tageswerk vollständig') : null,
            `Heute +${gainedToday} XP`)
          : null)),
    h('div', { class: 'tasks' }, STATS.map((st) => taskCard(st.id, game))));
}

function formatNumber(value) {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

function taskCard(stat, game) {
  const info = statInfo(stat);
  const exercise = game.todayExercise(stat);
  const done = game.state.todayDone[stat];

  const head = h('header', { class: 'task-head' },
    statEmblem(stat, 'small'),
    h('span', { class: 'task-stat' },
      h('span', { class: 'task-stat-name' }, info.name),
      h('span', { class: 'task-area' }, info.area)),
    exercise ? h('span', { class: `xp-badge ${done ? 'earned' : ''}` }, `+${exercise.xp} XP`) : null);

  if (!exercise) {
    return h('article', { class: 'panel task empty', 'data-stat': stat }, head, h('p', { class: 'muted' }, 'Keine Übung im Katalog.'));
  }

  const steps = h('ol', { class: 'task-steps' }, exercise.steps.map((step) => h('li', {}, step)));

  if (done) {
    const feedback = FEEDBACK.find((f) => f.id === done.fb);
    const value = done.mk && done.m ? done.m[done.mk] : null;
    const def = MEASUREMENTS[done.mk];
    return h('article', { class: 'panel task done', 'data-stat': stat },
      head,
      h('h2', { class: 'task-name' }, exercise.name),
      h('div', { class: 'task-done-row' },
        h('span', { class: 'done-mark' }, icon(UI_ICONS.check), 'Erledigt'),
        value !== null && def ? h('span', { class: 'pill' }, `${formatNumber(value)} ${def.unit}`) : null,
        feedback ? h('span', { class: 'pill' }, feedback.label) : null,
        stat === 'gelassenheit' ? h('span', { class: 'pill' }, 'Rast') : null,
        h('button', { class: 'btn text small', onclick: () => game.undo(stat) }, icon(UI_ICONS.undo), 'Rückgängig')),
      h('details', { class: 'task-details' }, h('summary', {}, 'Anleitung'), steps));
  }

  return h('article', { class: 'panel task', 'data-stat': stat },
    head,
    h('h2', { class: 'task-name' }, exercise.name),
    steps,
    h('footer', { class: 'task-actions' },
      exercise.timer_min
        ? h('button', { class: 'btn ghost', onclick: () => openTimer(exercise, { onFinish: () => finish(stat, game) }) },
          icon(UI_ICONS.timer), `Timer · ${formatMinutes(exercise.timer_min)}`)
        : null,
      h('button', { class: 'btn primary', onclick: () => finish(stat, game) }, 'Erledigt')));
}

function formatMinutes(min) {
  return min < 1 ? `${Math.round(min * 60)} Sek.` : `${String(min).replace('.', ',')} Min.`;
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
  const before = game.state.stats[stat];
  game.complete(stat, answer);
  closeSheet();
  const after = game.state.stats[stat];
  const badge = document.querySelector(`.task[data-stat="${stat}"] .xp-badge`);
  if (badge) floatXp(`+${exercise.xp} XP`, badge.getBoundingClientRect(), stat);
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

function floatXp(text, rect, stat) {
  const el = h('div', { class: 'xp-float', 'data-stat': stat, style: { left: `${rect.left + rect.width / 2}px`, top: `${rect.top}px` } }, text);
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
}
