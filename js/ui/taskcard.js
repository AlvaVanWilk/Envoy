// The task of an area as a card. A tap on a task in the Tageswerk turns it
// over and brings it to the middle of the screen (see openCard in sheet.js).
// The card shows the Envoy doing the exercise, drawn by the user (one
// picture per exercise and figure, painted in the Envoy's colours like the
// portrait; without a picture the emblem of the area), the name, what it
// brings, the steps and, for exercises with a duration, the timer.
// „Erledigt“ asks on the card what the exercise needs (a measured value, or
// how it was); then the card turns back into its row and the gain rises from
// there.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { FEEDBACK, MEASUREMENTS } from '../config.js';
import { statEmblem, statInfo } from './stats.js';
import { openCard, closeSheet, toast } from './sheet.js';
import { openTimer } from './timer.js';
import { resolveLook, showLayer } from './look.js';

const TURN_MS = 520;   // as long as the card takes to turn back (sheet.js)

const rowOf = (stat) => document.querySelector(`.task-row[data-stat="${stat}"] .task-line`);
export const gainText = (stat, xp) => `+${xp} ${statInfo(stat).name}`;
// The gain of a task: what it brought, or what it brings now.
export const gainOf = (stat, exercise, game) => game.state.todayDone[stat]?.gain ?? game.gainFor(exercise);
const formatValue = (value) => String(Math.round(value * 100) / 100).replace('.', ',');
const formatMinutes = (min) => (min < 1 ? `${Math.round(min * 60)} Sek.` : `${String(min).replace('.', ',')} Min.`);

// What finishing a task asks: a measured value where the exercise has one,
// how it was for new exercises and after a change of level, else nothing.
function question(stat, exercise, game) {
  if (exercise.messung) return 'measure';
  if (game.needsFeedback(stat)) return 'feedback';
  return null;
}

// The tick on the row: done at once, or the card opens at its question.
export function finishTask(stat, game) {
  const exercise = game.todayExercise(stat);
  if (!exercise || game.state.todayDone[stat]) return;
  const ask = question(stat, exercise, game);
  if (ask) openTaskCard(stat, game, ask);
  else commit(stat, {}, game, false);
}

function commit(stat, answer, game, onCard) {
  const exercise = game.todayExercise(stat);
  const gain = game.gainFor(exercise);
  const before = game.state.stats[stat].level;
  game.complete(stat, answer);
  const after = game.state.stats[stat].level;
  if (onCard) closeSheet();
  const wait = onCard ? TURN_MS : 0;
  setTimeout(() => {
    const anchor = document.querySelector(`.task-row[data-stat="${stat}"] .task-gain`);
    if (anchor) floatGain(gainText(stat, gain), anchor.getBoundingClientRect(), stat);
  }, wait);
  if (after > before) setTimeout(() => toast(`${statInfo(stat).name} · Level ${after}`, { tone: 'level' }), wait + 700);
}

function floatGain(text, rect, stat) {
  const el = h('div', { class: 'gain-float', 'data-stat': stat, style: { left: `${rect.left + rect.width / 2}px`, top: `${rect.top}px` } }, text);
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove());
}

// The Envoy doing the exercise, or the emblem of the area.
function picture(stat, exercise, game) {
  const look = resolveLook(game.state.world.envoy);
  const src = exercise.bilder?.[look.figure.id];
  if (!src) return h('div', { class: 'tc-picture empty' }, statEmblem(stat));
  const img = h('img', { class: 'tc-img', alt: `Der Envoy: ${exercise.name}`, draggable: 'false' });
  showLayer(img, src, look, 'exercise');
  return h('div', { class: 'tc-picture' }, img);
}

// Like replaceChildren, leaving out what is not there.
const fill = (el, ...children) => el.replaceChildren(...children.filter(Boolean));

const steps = (exercise) => h('ol', { class: 'task-steps' }, exercise.steps.map((step) => h('li', {}, step)));

// start: 'measure' or 'feedback' to open the card at its question.
export function openTaskCard(stat, game, start = null) {
  const exercise = game.todayExercise(stat);
  if (!exercise) return;
  const info = statInfo(stat);
  const body = h('div', { class: 'tc-body' });
  const actions = h('div', { class: 'tc-actions' });
  const front = [
    h('header', { class: 'tc-head' },
      statEmblem(stat, 'tiny'),
      h('p', { class: 'eyebrow' }, `${info.name} · ${info.area}`),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Schließen', onclick: () => closeSheet() }, icon(UI_ICONS.close))),
    h('div', { class: 'tc-scroll' },
      picture(stat, exercise, game),
      h('div', { class: 'tc-titles' },
        h('h2', { class: 'tc-title' }, exercise.name),
        h('span', { class: 'tc-gain' }, gainText(stat, gainOf(stat, exercise, game)))),
      body),
    actions,
  ];
  const back = h('div', { class: 'tc-back' }, statEmblem(stat), h('span', { class: 'tc-back-name' }, info.name));
  const { card } = openCard({ label: exercise.name, front, back, from: () => rowOf(stat), className: 'task-card' });
  card.dataset.stat = stat;

  const done = () => {
    const ask = question(stat, exercise, game);
    if (ask) show(ask);
    else commit(stat, {}, game, true);
  };

  function show(view) {
    card.dataset.view = view;
    if (view === 'steps') {
      const measure = exercise.messung ? MEASUREMENTS[exercise.messung] : null;
      fill(body, 
        steps(exercise),
        measure ? h('p', { class: 'task-hint' }, `Danach eintragen: ${measure.question.replace('?', '')}${measure.unit ? ` (${measure.unit})` : ''}`) : null);
      fill(actions, 
        exercise.timer_min
          ? h('button', { class: 'btn ghost', type: 'button', onclick: () => openTimer(exercise, { onFinish: done }) }, icon(UI_ICONS.timer), formatMinutes(exercise.timer_min))
          : null,
        h('button', { class: 'btn primary', type: 'button', onclick: done }, 'Erledigt'));
    } else if (view === 'measure') {
      showMeasure();
    } else if (view === 'feedback') {
      fill(body, 
        h('p', { class: 'sheet-question' }, 'Wie war es?'),
        h('div', { class: 'feedback-row' }, FEEDBACK.map((f) =>
          h('button', { class: `btn feedback fb-${f.id}`, type: 'button', onclick: () => commit(stat, { feedback: f.id }, game, true) }, f.label))));
      fill(actions, backButton());
    } else {
      const entry = game.state.todayDone[stat];
      const feedback = FEEDBACK.find((f) => f.id === entry.fb);
      const def = MEASUREMENTS[entry.mk];
      const value = entry.mk && entry.m ? entry.m[entry.mk] : null;
      fill(body, 
        h('div', { class: 'task-done-row' },
          h('span', { class: 'pill' }, 'Erledigt'),
          value !== null && def ? h('span', { class: 'pill' }, `${formatValue(value)} ${def.unit}`) : null,
          feedback ? h('span', { class: 'pill' }, feedback.label) : null,
          stat === 'gelassenheit' ? h('span', { class: 'pill' }, 'Rast: Energie halb aufgefüllt') : null),
        steps(exercise));
      fill(actions, 
        h('button', { class: 'btn text', type: 'button', onclick: () => { game.undo(stat); show('steps'); } }, icon(UI_ICONS.undo), 'Rückgängig'));
    }
  }

  function backButton() {
    return h('button', { class: 'btn ghost', type: 'button', onclick: () => show('steps') }, 'Zurück');
  }

  function showMeasure() {
    const def = MEASUREMENTS[exercise.messung];
    const input = h('input', {
      class: 'field', type: 'text', inputmode: def.decimals ? 'decimal' : 'numeric',
      autocomplete: 'off', 'aria-label': def.question,
    });
    const parse = () => {
      const value = parseFloat(String(input.value).replace(',', '.'));
      return Number.isFinite(value) && value >= 0 ? value : null;
    };
    const submit = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => {
      const value = parse();
      if (value !== null) commit(stat, { value }, game, true);
    } }, 'Eintragen');
    input.addEventListener('input', () => { submit.disabled = parse() === null; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && parse() !== null) submit.click(); });
    fill(body, 
      h('p', { class: 'sheet-question' }, def.question),
      h('div', { class: 'measure-input' }, input, h('span', { class: 'unit' }, def.unit)));
    fill(actions, backButton(), submit);
    setTimeout(() => input.focus({ preventScroll: true }), TURN_MS);
  }

  show(game.state.todayDone[stat] ? 'done' : start || 'steps');
}
