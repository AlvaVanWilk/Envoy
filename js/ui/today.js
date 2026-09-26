// "Heute": the four tasks the app has chosen for today.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { STATS, FEEDBACK, MEASUREMENTS } from '../config.js';
import { formatDayLong } from '../days.js';
import { statRow, statEmblem, statInfo } from './stats.js';
import { paperdoll } from './paperdoll.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { openTimer } from './timer.js';
import { openStatDetail } from './statdetail.js';

export function renderToday(game) {
  const s = game.state;
  const gainedToday = STATS.reduce((sum, st) => sum + (s.todayDone[st.id]?.xp || 0), 0);
  const allDone = STATS.every((st) => s.todayDone[st.id]);

  return h('section', { class: 'view today' },
    h('header', { class: 'view-head' },
      h('p', { class: 'eyebrow' }, 'Tageswerk'),
      h('h1', {}, formatDayLong(s.today))),
    h('div', { class: 'today-grid' },
      h('aside', { class: 'panel hero-card' },
        h('a', { class: 'hero-figure', href: '#envoy', 'aria-label': 'Zum Charakter' },
          paperdoll(s.equipped, game.catalog, { className: 'small' })),
        h('div', { class: 'hero-stats' },
          STATS.map((st) => statRow(st.id, s.stats[st.id], {
            showLabel: false,
            onclick: () => openStatDetail(st.id, game),
          })),
          gainedToday > 0
            ? h('p', { class: 'hero-today' },
              allDone ? h('span', { class: 'complete-mark' }, icon(UI_ICONS.check), 'Tageswerk vollständig') : null,
              h('span', {}, `Heute +${gainedToday} XP`))
            : null)),
      h('div', { class: 'tasks' }, STATS.map((st) => taskCard(st.id, game)))));
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
    return h('article', { class: 'panel task empty', 'data-stat': stat }, head,
      h('p', { class: 'muted' }, 'Keine Übung im Katalog.'));
  }

  const steps = h('ol', { class: 'task-steps' }, exercise.steps.map((step) => h('li', {}, step)));

  if (done) {
    const feedback = FEEDBACK.find((f) => f.id === done.fb);
    return h('article', { class: 'panel task done', 'data-stat': stat },
      head,
      h('h2', { class: 'task-name' }, exercise.name),
      h('div', { class: 'task-done-row' },
        h('span', { class: 'done-mark' }, icon(UI_ICONS.check), 'Erledigt'),
        feedback ? h('span', { class: 'done-feedback' }, feedback.label) : null,
        measurementSummary(done.m),
        h('button', { class: 'btn text small', onclick: () => game.undo(stat) }, icon(UI_ICONS.undo), 'Rückgängig')),
      h('details', { class: 'task-details' }, h('summary', {}, 'Anleitung'), steps));
  }

  return h('article', { class: 'panel task', 'data-stat': stat },
    head,
    h('h2', { class: 'task-name' }, exercise.name),
    steps,
    h('footer', { class: 'task-actions' },
      exercise.timer_min
        ? h('button', { class: 'btn ghost', onclick: () => openTimer(exercise, { onFinish: () => openComplete(stat, game) }) },
          icon(UI_ICONS.timer), `Timer · ${formatMinutes(exercise.timer_min)}`)
        : null,
      h('button', { class: 'btn primary', onclick: () => openComplete(stat, game) }, 'Erledigt')));
}

function formatMinutes(min) {
  return min < 1 ? `${Math.round(min * 60)} Sek.` : `${String(min).replace('.', ',')} Min.`;
}

function measurementSummary(m) {
  if (!m || Object.keys(m).length === 0) return null;
  const parts = Object.entries(m).map(([key, value]) => {
    const def = MEASUREMENTS[key];
    return def ? `${String(value).replace('.', ',')} ${def.unit || def.label}`.trim() : null;
  }).filter(Boolean);
  return h('span', { class: 'done-measure' }, parts.join(' · '));
}

// Finishing a task: optional measured values, then how it felt.
export function openComplete(stat, game) {
  const exercise = game.todayExercise(stat);
  if (!exercise || game.state.todayDone[stat]) return;

  const inputs = exercise.messung.map((key) => {
    const def = MEASUREMENTS[key];
    // Text field with decimal keyboard: number fields reject the German comma.
    const input = h('input', {
      type: 'text', inputmode: def.step < 1 ? 'decimal' : 'numeric', name: key,
      autocomplete: 'off', placeholder: '–', 'aria-label': def.label,
    });
    return { key, input, row: h('label', { class: 'measure' }, h('span', {}, def.label), input, h('span', { class: 'unit' }, def.unit)) };
  });

  const choose = (feedbackId, button) => {
    const m = {};
    for (const { key, input } of inputs) {
      const value = parseFloat(String(input.value).replace(',', '.'));
      if (Number.isFinite(value) && value >= 0) m[key] = value;
    }
    const before = game.state.stats[stat];
    game.complete(stat, feedbackId, m);
    closeSheet();
    const after = game.state.stats[stat];
    const badge = document.querySelector(`.task[data-stat="${stat}"] .xp-badge`) || button;
    floatXp(`+${exercise.xp} XP`, badge.getBoundingClientRect(), stat);
    if (after.level > before.level) {
      setTimeout(() => toast(`${statInfo(stat).name} · Level ${after.level}`, { tone: 'level' }), 700);
    }
  };

  openSheet({
    title: exercise.name,
    eyebrow: statInfo(stat).name,
    className: 'complete-sheet',
    content: [
      inputs.length > 0 ? h('div', { class: 'measures' }, inputs.map((i) => i.row)) : null,
      h('p', { class: 'sheet-question' }, 'Wie war es?'),
      h('div', { class: 'feedback-row' }, FEEDBACK.map((f) =>
        h('button', { class: `btn feedback fb-${f.id}`, onclick: (e) => choose(f.id, e.currentTarget) }, f.label))),
    ],
  });
}

function floatXp(text, rect, stat) {
  const el = h('div', { class: 'xp-float', 'data-stat': stat, style: { left: `${rect.left + rect.width / 2}px`, top: `${rect.top}px` } }, text);
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
}
