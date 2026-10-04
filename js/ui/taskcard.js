// The task of an area as a card. A tap on a task in the Tageswerk turns it
// over and brings it to the middle of the screen (see openCard in sheet.js).
//
// A task is a unit of one or more exercises (see tasks.js). The card shows
// one of them at a time, chosen with a row of tabs: the Envoy doing it (a
// picture by the user for the figure, painted in the Envoy's colours like the
// portrait, else the moving figure, else the emblem of the area), its name
// and stage, its time and the steps. Below: the guided timer for the whole
// unit (timer.js) and „Erledigt“.
//
// After „Erledigt“ (or the timer) come the questions, one for each exercise
// that has a higher stage to go to; their answers move the stages (two good
// runs in a row up, two too hard ones down). „Das war heute zu viel“ counts
// as too hard for every exercise of the unit. Then the card turns back into
// its row and the gain rises from there.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { TIMER_PREP, TIMER_SWITCH, TOO_MUCH } from '../config.js';
import { statEmblem, statInfo } from './stats.js';
import { openCard, closeSheet, toast } from './sheet.js';
import { openTimer } from './timer.js';
import { resolveLook, showLayer } from './look.js';
import { questionsOf, canBeTooMuch } from '../tasks.js';

const TURN_MS = 520;   // as long as the card takes to turn back (sheet.js)

const rowOf = (stat) => document.querySelector(`.task-row[data-stat="${stat}"] .task-line`);
export const gainText = (stat, xp) => `+${xp} ${statInfo(stat).name}`;
// The gain of a task: what it brought, or what it brings now.
export const gainOf = (stat, task, game) => game.state.todayDone[stat]?.gain ?? game.gainFor(task);

// 45 -> „45 Sek.“, 90 -> „1,5 Min.“, 180 -> „3 Min.“
export function formatSeconds(seconds) {
  if (seconds < 60) return `${seconds} Sek.`;
  const minutes = Math.round((seconds / 60) * 2) / 2;
  return `${String(minutes).replace('.', ',')} Min.`;
}

// The name of a task in its row: the exercise, or the short names of all.
export const taskTitle = (task) => (task.parts.length > 1 ? task.parts.map((p) => p.row.kurz).join(' · ') : task.parts[0].row.name);

// Like replaceChildren, leaving out what is not there.
const fill = (el, ...children) => el.replaceChildren(...children.filter(Boolean));

// What „Das war heute zu viel“ needs: it lowers something, and no question
// has „Zu viel“ among its answers already.
const tooMuchLink = (task, questions) =>
  canBeTooMuch(task) && !questions.some((q) => q.answers.some((a) => a.id === TOO_MUCH));

// The tick on the row: done at once, or the card opens at its questions.
export function finishTask(stat, game) {
  const task = game.todayTask(stat);
  if (!task || game.state.todayDone[stat]) return;
  if (questionsOf(task).length > 0) openTaskCard(stat, game, 'questions');
  else commit(stat, {}, game, false);
}

function commit(stat, answer, game, onCard) {
  const task = game.todayTask(stat);
  const gain = game.gainFor(task);
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

// The Envoy doing an exercise at its stage: a drawing of the user for this
// figure (painted in the Envoy's colours), else the moving figure
// (tools/uebungsbilder.py), else null.
function figure(part, game, className) {
  const look = resolveLook(game.state.world.envoy);
  const src = part.row.bilder?.[look.figure.id];
  const alt = `Der Envoy: ${part.row.name}`;
  if (src) {
    const img = h('img', { class: className, alt, draggable: 'false' });
    showLayer(img, src, look, 'exercise');
    return img;
  }
  return part.row.skizze ? h('img', { class: `${className} is-sketch`, src: part.row.skizze, alt, draggable: 'false' }) : null;
}

// The parts of the guided timer: getting ready, every exercise (one side,
// the other side …), the change to the next one; what the voice says.
function timerSegments(task, game) {
  const segments = [];
  const prep = TIMER_PREP[task.stat] || 0;
  task.parts.forEach((part, i) => {
    const name = part.row.name;
    if (i === 0 && prep > 0) segments.push({ name, label: 'Gleich geht es los', seconds: prep, say: `Gleich geht es los: ${name}.`, figure: figure(part, game, 'timer-img') });
    if (i > 0) segments.push({ name, label: 'Wechsel', seconds: TIMER_SWITCH, say: `Als Nächstes: ${name}.`, figure: figure(part, game, 'timer-img') });
    part.phases.forEach((phase, j) => {
      const prompts = j === 0 ? part.row.ansagen : [];
      const spokenAtStart = prompts.some((p) => p.at === 0);
      const start = phase.label || (spokenAtStart || (i === 0 && prep === 0) ? '' : 'Los.');
      segments.push({ name, label: phase.label, seconds: phase.s, say: start, prompts, figure: figure(part, game, 'timer-img') });
    });
  });
  return segments;
}

// start: 'questions' to open the card at its questions.
export function openTaskCard(stat, game, start = null) {
  const task = game.todayTask(stat);
  if (!task) return;
  const info = statInfo(stat);
  const done = game.state.todayDone[stat];
  let shown = 0;   // which exercise the card shows

  const pictureBox = h('div', { class: 'tc-picture' });
  const tabs = task.parts.length > 1 ? h('div', { class: 'tc-tabs', role: 'tablist' }) : null;
  const partBox = h('div', { class: 'tc-part' });
  const body = h('div', { class: 'tc-body' });
  const actions = h('div', { class: 'tc-actions' });
  const front = [
    h('header', { class: 'tc-head' },
      statEmblem(stat, 'tiny'),
      h('p', { class: 'eyebrow' }, `${info.name} · ${info.area}`),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Schließen', onclick: () => closeSheet() }, icon(UI_ICONS.close))),
    h('div', { class: 'tc-scroll' },
      h('p', { class: 'tc-meta' }, h('span', { class: 'tc-gain' }, gainText(stat, gainOf(stat, task, game))), ` · ${formatSeconds(task.seconds)}`),
      pictureBox, tabs, partBox, body),
    actions,
  ];
  const back = h('div', { class: 'tc-back' }, statEmblem(stat), h('span', { class: 'tc-back-name' }, info.name));
  const { card } = openCard({ label: taskTitle(task), front, back, from: () => rowOf(stat), className: 'task-card' });
  card.dataset.stat = stat;

  // one exercise: picture, name, stage, time, what it is for, the steps
  function showPart(i) {
    shown = i;
    const part = task.parts[i];
    fill(pictureBox, figure(part, game, 'tc-img') || statEmblem(stat));
    pictureBox.classList.toggle('empty', !pictureBox.querySelector('img'));
    if (tabs) {
      fill(tabs, ...task.parts.map((p, n) => h('button', {
        class: `tc-tab ${n === i ? 'on' : ''}`, type: 'button', role: 'tab', 'aria-selected': String(n === i),
        onclick: () => showPart(n),
      }, p.row.kurz)));
    }
    const stage = part.row.stufenname ? `Stufe ${part.level} · ${part.row.stufenname}` : null;
    fill(partBox,
      h('h2', { class: 'tc-title' }, part.row.name),
      h('p', { class: 'tc-stage' },
        stage ? h('span', {}, stage) : null,
        h('span', {}, formatSeconds(part.seconds)),
        part.fresh ? h('span', { class: 'pill tc-new' }, 'Neue Stufe') : null),
      part.row.wofuer ? h('p', { class: 'tc-why' }, part.row.wofuer) : null,
      h('ol', { class: 'task-steps' }, part.row.steps.map((step) => h('li', {}, step))));
  }

  const questions = questionsOf(task);
  const finish = () => {
    if (questions.length > 0) show('questions');
    else commit(stat, {}, game, true);
  };
  const tooMuch = () => h('button', { class: 'btn text tc-too-much', type: 'button', onclick: () => commit(stat, { zuviel: true }, game, true) }, 'Das war heute zu viel');

  function show(view) {
    card.dataset.view = view;
    if (view === 'steps') {
      fill(body);
      fill(actions,
        canBeTooMuch(task) ? tooMuch() : null,
        h('button', { class: 'btn ghost', type: 'button', onclick: () => openTimer({ title: taskTitle(task), segments: timerSegments(task, game), rhythm: task.parts.length === 1 ? task.parts[0].row.atemtakt : null, onFinish: finish }) },
          icon(UI_ICONS.timer), 'Mit Timer'),
        h('button', { class: 'btn primary', type: 'button', onclick: finish }, 'Erledigt'));
    } else if (view === 'questions') {
      showQuestions();
    } else {
      fill(body, h('div', { class: 'task-done-row' },
        h('span', { class: 'pill' }, 'Erledigt'),
        done?.zuviel ? h('span', { class: 'pill' }, 'Zu viel') : null,
        done?.sick ? h('span', { class: 'pill' }, 'Krankheitsmodus') : null,
        stat === 'gelassenheit' ? h('span', { class: 'pill' }, 'Rast: Energie halb aufgefüllt') : null));
      fill(actions,
        h('button', { class: 'btn text', type: 'button', onclick: () => { closeSheet(); game.undo(stat); } }, icon(UI_ICONS.undo), 'Rückgängig'));
    }
  }

  // One question per exercise. A single one is answered with one tap; with
  // several, „Fertig“ comes once all are answered.
  function showQuestions() {
    const given = {};
    const ready = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => commit(stat, { antworten: given }, game, true) }, 'Fertig');
    const blocks = questions.map(({ part, answers }) => {
      const buttons = answers.map((a) => h('button', {
        class: `btn feedback fb-${a.id}`, type: 'button', 'aria-pressed': 'false',
        onclick: (e) => {
          given[part.row.id] = a.id;
          if (questions.length === 1) { commit(stat, { antworten: given }, game, true); return; }
          for (const b of e.currentTarget.parentElement.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
          ready.disabled = Object.keys(given).length < questions.length;
        },
      }, a.label));
      return h('div', { class: 'tc-question' },
        questions.length > 1 ? h('p', { class: 'tc-question-part' }, part.row.kurz) : null,
        h('p', { class: 'sheet-question' }, part.row.frage),
        h('div', { class: `feedback-row answers-${answers.length}` }, buttons));
    });
    fill(body, ...blocks);
    fill(actions,
      tooMuchLink(task, questions) ? tooMuch() : null,
      h('button', { class: 'btn ghost', type: 'button', onclick: () => show('steps') }, 'Zurück'),
      questions.length > 1 ? ready : null);
  }

  showPart(shown);
  show(done ? 'done' : start || 'steps');
}
