// A note at the start of a day after one without the Tageswerk: if a task
// stays undone today as well, its stat loses something by tomorrow (the
// Malus, see replay.js). Shown once a day on this device, after the news and
// the age (see gate.js), and only for the stats that would really lose
// something (not on the first day in a row, not at the floor). Calm, without
// pressure: one day off costs nothing.

import { h } from './dom.js';
import { statEmblem } from './stats.js';
import { store } from '../store.js';
import { STATS, STAT_IDS } from '../config.js';

// The stats whose task left undone today would cost them something.
export const statsAtStake = (game) => STAT_IDS.filter((id) => game.state.atStake?.[id] > 0);

export const dayNoteDue = (game) => store.loadUi().dayNote !== game.state.today && statsAtStake(game).length > 0;

export function markDayNoteSeen(game) {
  store.saveUi({ ...store.loadUi(), dayNote: game.state.today });
}

const nameOf = (id) => STATS.find((s) => s.id === id).name;
// „Kraft“, „Kraft und Gelassenheit“, „Kraft, Ausdauer und Gelassenheit“
const joined = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`);

// The words of the note for these stats. firstDay: yesterday was the first
// day without them (one day off costs nothing, which the note then says).
export function dayNoteText(ids, firstDay) {
  const pause = firstDay ? 'Ein Tag Pause kostet nichts. ' : '';
  if (ids.length === STAT_IDS.length) {
    return {
      title: 'Gestern blieb das Tageswerk liegen',
      text: `${pause}Bleibt es heute auch liegen, verliert dein Envoy ab morgen etwas von dem, was er sich erarbeitet hat.`,
    };
  }
  const names = joined(ids.map(nameOf));
  if (ids.length === 1) {
    return {
      title: `Gestern blieb die Aufgabe für ${names} liegen`,
      text: `${pause}Bleibt sie heute auch liegen, verliert dein Envoy ab morgen etwas von dem, was er sich bei ${names} erarbeitet hat.`,
    };
  }
  return {
    title: `Gestern blieben die Aufgaben für ${names} liegen`,
    text: `${pause}Bleiben sie heute auch liegen, verliert dein Envoy ab morgen etwas von dem, was er sich dort erarbeitet hat.`,
  };
}

// The note for this Envoy today.
export function openDayNoteFor(game, onDone) {
  const ids = statsAtStake(game);
  openDayNote(ids, ids.every((id) => game.state.stats[id].missed === 1), onDone);
}

// ids: the stats at stake (the test menu can show the note with any).
export function openDayNote(ids, firstDay, onDone) {
  const { title, text } = dayNoteText(ids, firstDay);
  const layer = h('div', { class: 'gate-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  const close = (toTasks) => {
    layer.classList.remove('open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => layer.remove(), 250);
    onDone();
    if (toTasks) location.hash = '#tageswerk';
  };
  const onKey = (e) => { if (e.key === 'Escape') close(false); };
  layer.addEventListener('click', (e) => { if (e.target === layer) close(false); });
  document.addEventListener('keydown', onKey);
  layer.append(h('div', { class: 'gate-card daynote-card' },
    h('div', { class: 'daynote-stats' }, ids.map((id) => statEmblem(id, 'small'))),
    h('h2', { class: 'gate-title' }, title),
    h('p', { class: 'daynote-text' }, text),
    h('div', { class: 'daynote-actions' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => close(false) }, 'Später'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => close(true) }, 'Zum Tageswerk'))));
  document.body.append(layer);
  requestAnimationFrame(() => layer.classList.add('open'));
}
