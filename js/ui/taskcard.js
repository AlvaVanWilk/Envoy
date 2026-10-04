// The task of an area as a card. A tap on a task in the Tageswerk turns it
// over and brings it to the middle of the screen (see openCard in sheet.js).
//
// A task is a unit of one or more exercises (see tasks.js). The card shows
// one of them at a time, chosen with a row of tabs: the Envoy doing it (a
// picture by the user for the figure, painted in the Envoy's colours like the
// portrait, else the moving figure, else the emblem of the area), its name
// and stage, its time and the steps. Below: the guided timer for what is
// still open of the unit (timer.js) and the button that finishes the
// exercise shown, with its name on it („Käfer erledigt“): each exercise is
// done on its own, its tab gets a tick and the card goes on to the next one;
// the last one finishes the task. A unit of one exercise just has „Erledigt“.
//
// Each exercise that has a higher stage to go to has a question; it comes
// right after the exercise (after the timer: those of all the exercises it
// ran). The answers move the stages (two good runs in a row up, two too hard
// ones down). „Das war heute zu viel“ finishes the whole task and counts as
// too hard for every exercise of the unit. Then the card turns back into its
// row and the new value rises from there.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { TIMER_PREP, TIMER_SWITCH, TOO_MUCH } from '../config.js';
import { statEmblem, statInfo, statNumber } from './stats.js';
import { openCard, closeSheet, toast } from './sheet.js';
import { openTimer } from './timer.js';
import { resolveLook, showLayer } from './look.js';
import { questionsOf, canBeTooMuch } from '../tasks.js';
import { holdRing, releaseRing, celebrateStat, ringTarget } from './topbar.js';

const TURN_MS = 520;   // as long as the card takes to turn back (sheet.js)

const rowOf = (stat) => document.querySelector(`.task-row[data-stat="${stat}"] .task-line`);
// What a task counts for („für Kraft“); how much it brings is not shown.
export const countsFor = (stat) => `für ${statInfo(stat).name}`;

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

// The exercises of the task not done yet today, and their questions.
const openParts = (task, game) => task.parts.filter((p) => !game.partsDone(task.stat)[p.row.id]);
const openQuestions = (task, game) => questionsOf(task).filter((q) => !game.partsDone(task.stat)[q.part.row.id]);

// The tick on the row: what is still open of the task done at once, or the
// card opens at the questions of those exercises.
export function finishTask(stat, game) {
  const task = game.todayTask(stat);
  if (!task || game.state.todayDone[stat]) return;
  if (openQuestions(task, game).length > 0) openTaskCard(stat, game, 'questions');
  else commit(stat, {}, game, false);
}

// Runs what finishes something of the task. Once the whole task is done,
// the card turns back into its row and the new value rises there; a light
// flies from the row to the stat's ring at the portrait, which then grows
// and glows (topbar.js). Returns whether the task is done.
const FLIGHT_MS = 750;
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function settle(stat, game, onCard, action) {
  const before = { ...game.state.stats[stat] };
  holdRing(stat, before);   // the ring keeps its old value until the light arrives
  action();
  if (!game.state.todayDone[stat]) { releaseRing(stat); return false; }
  const now = game.state.stats[stat];
  if (onCard) closeSheet();
  const wait = onCard ? TURN_MS : 0;
  const flight = still() ? 0 : FLIGHT_MS;
  celebrateStat(stat, before, now, wait + flight);
  // the new value rises from the row (not how much it grew)
  setTimeout(() => {
    const anchor = document.querySelector(`.task-row[data-stat="${stat}"] .task-gain`);
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    floatGain([`${statInfo(stat).name} `, statNumber(now)], rect, stat);
    if (flight) flyToRing(stat, rect);
  }, wait);
  if (now.level > before.level) setTimeout(() => toast(`${statInfo(stat).name} erreicht ${now.level}`, { tone: 'level' }), wait + flight + 700);
  return true;
}

// A small light from the row up to the ring of its stat, in a gentle arc.
function flyToRing(stat, rect) {
  const target = ringTarget(stat);
  if (!target) return;
  const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  const mid = { x: (from.x + target.x) / 2 + 40, y: Math.min(from.y, target.y) + (Math.abs(from.y - target.y) * 0.25) };
  const el = h('div', { class: 'gain-spark', 'data-stat': stat, style: { left: '0px', top: '0px' } });
  document.body.append(el);
  const at = (p, scale, opacity = 1) => ({ transform: `translate(${p.x}px, ${p.y}px) scale(${scale})`, opacity });
  el.animate([at(from, 0.4, 0), at(from, 1.1), at(mid, 1), at(target, 0.7, 0.9)], {
    duration: FLIGHT_MS, easing: 'cubic-bezier(0.45, 0, 0.3, 1)', fill: 'forwards',
  }).finished.then(() => el.remove(), () => el.remove());
}

const commit = (stat, answer, game, onCard) => settle(stat, game, onCard, () => game.complete(stat, answer));

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

// start: 'questions' to open the card at the questions of what is open.
export function openTaskCard(stat, game, start = null) {
  const task = game.todayTask(stat);
  if (!task) return;
  const info = statInfo(stat);
  const done = game.state.todayDone[stat];
  const several = task.parts.length > 1;
  const isDone = (part) => Boolean(done || game.partsDone(stat)[part.row.id]);
  let shown = Math.max(0, task.parts.findIndex((p) => !isDone(p)));   // which exercise the card shows

  const pictureBox = h('div', { class: 'tc-picture' });
  const tabs = several ? h('div', { class: 'tc-tabs', role: 'tablist' }) : null;
  const partBox = h('div', { class: 'tc-part' });
  const body = h('div', { class: 'tc-body' });
  const actions = h('div', { class: 'tc-actions' });
  const front = [
    h('header', { class: 'tc-head' },
      statEmblem(stat, 'tiny'),
      h('p', { class: 'eyebrow' }, `${info.name} · ${info.area}`),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Schließen', onclick: () => closeSheet() }, icon(UI_ICONS.close))),
    h('div', { class: 'tc-scroll' },
      h('p', { class: 'tc-meta' }, h('span', { class: 'tc-gain' }, countsFor(stat)), ` · ${formatSeconds(task.seconds)}`),
      pictureBox, tabs, partBox, body),
    actions,
  ];
  const back = h('div', { class: 'tc-back' }, statEmblem(stat), h('span', { class: 'tc-back-name' }, info.name));
  const { card } = openCard({ label: taskTitle(task), front, back, from: () => rowOf(stat), className: 'task-card' });
  card.dataset.stat = stat;

  // one exercise: picture, name, stage, time, what it is for, the steps;
  // the tabs show which ones are done
  function showPart(i) {
    shown = i;
    const part = task.parts[i];
    fill(pictureBox, figure(part, game, 'tc-img') || statEmblem(stat));
    pictureBox.classList.toggle('empty', !pictureBox.querySelector('img'));
    if (tabs) {
      fill(tabs, ...task.parts.map((p, n) => h('button', {
        class: `tc-tab ${n === i ? 'on' : ''} ${isDone(p) ? 'done' : ''}`, type: 'button', role: 'tab', 'aria-selected': String(n === i),
        'aria-label': isDone(p) ? `${p.row.kurz}, erledigt` : p.row.kurz,
        onclick: () => { showPart(n); if (card.dataset.view === 'steps') show('steps'); },
      }, isDone(p) ? icon(UI_ICONS.check) : null, p.row.kurz)));
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

  // the next exercise that is still open, after the one shown
  const nextOpen = () => {
    for (let k = 1; k <= task.parts.length; k += 1) {
      const i = (shown + k) % task.parts.length;
      if (!isDone(task.parts[i])) return i;
    }
    return shown;
  };

  // all that is still open: its questions, then the task is done
  const finish = () => {
    const questions = openQuestions(task, game);
    if (questions.length > 0) showQuestions(questions, (given) => commit(stat, { antworten: given }, game, true));
    else commit(stat, {}, game, true);
  };

  // one exercise of several: its question, then on to the next one (the
  // last one finishes the task)
  const finishPart = (part) => {
    const question = openQuestions(task, game).find((q) => q.part.row.id === part.row.id);
    const record = (answer) => {
      if (settle(stat, game, true, () => game.completePart(stat, part.row.id, answer))) return;
      showPart(nextOpen());
      show('steps');
    };
    if (question) showQuestions([question], (given) => record(given[part.row.id]));
    else record(null);
  };

  const tooMuch = () => h('button', { class: 'btn text tc-too-much', type: 'button', onclick: () => commit(stat, { zuviel: true }, game, true) }, 'Das war heute zu viel');

  function show(view) {
    card.dataset.view = view;
    if (view === 'steps') {
      const part = task.parts[shown];
      const open = openParts(task, game);
      const timer = () => openTimer({
        title: taskTitle({ parts: open }), segments: timerSegments({ ...task, parts: open }, game),
        rhythm: open.length === 1 ? open[0].row.atemtakt : null, onFinish: finish,
      });
      fill(body);
      fill(actions,
        isDone(part)
          ? h('button', { class: 'btn text tc-too-much', type: 'button', onclick: () => { game.undoPart(stat, part.row.id); showPart(shown); show('steps'); } },
            icon(UI_ICONS.undo), 'Rückgängig')
          : (canBeTooMuch(task) ? tooMuch() : null),
        open.length > 0 ? h('button', { class: 'btn ghost', type: 'button', onclick: timer }, icon(UI_ICONS.timer), 'Mit Timer') : null,
        isDone(part)
          ? h('span', { class: 'pill tc-part-done' }, icon(UI_ICONS.check), `${part.row.kurz} erledigt`)
          : h('button', { class: 'btn primary', type: 'button', onclick: () => (several ? finishPart(part) : finish()) },
            several ? `${part.row.kurz} erledigt` : 'Erledigt'));
    } else if (view === 'questions') {
      finish();
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

  // Questions, one for each exercise given. A single one is answered with
  // one tap; with several, „Fertig“ comes once all are answered.
  function showQuestions(questions, onAnswered) {
    card.dataset.view = 'questions';
    const given = {};
    const ready = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => onAnswered(given) }, 'Fertig');
    const blocks = questions.map(({ part, answers }) => {
      const buttons = answers.map((a) => h('button', {
        class: `btn feedback fb-${a.id}`, type: 'button', 'aria-pressed': 'false',
        onclick: (e) => {
          given[part.row.id] = a.id;
          if (questions.length === 1) { onAnswered(given); return; }
          for (const b of e.currentTarget.parentElement.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
          ready.disabled = Object.keys(given).length < questions.length;
        },
      }, a.label));
      return h('div', { class: 'tc-question' },
        questions.length > 1 || several ? h('p', { class: 'tc-question-part' }, part.row.kurz) : null,
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
