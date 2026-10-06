// Der Aushang on the camp page: the Aufträge of today (see world/jobs.js),
// each a note with where it leads, how long it takes and its reward. A tap
// shows the note; the Envoy takes it on (without Energie, only time). Done
// ones stay on the board, crossed out, until the next day.

import { h } from './dom.js';
import { sectionTitle, itemIcon, resource, effectList, effectsOf, qualityClass } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { thingSubtitle } from './itemsheet.js';
import { addition } from '../world/expedition.js';
import { JOBS_PER_DAY } from '../config.js';

const STATE_TEXT = { running: 'Der Envoy ist dabei', done: 'Erledigt' };

export function jobBoard(game) {
  const jobs = game.jobs();
  if (jobs.length === 0) return null;
  const open = jobs.filter((j) => j.state === 'open').length;
  return h('section', { class: 'panel job-board' },
    sectionTitle('Aushang', h('span', { class: 'job-count' }, open > 0 ? `noch ${open} von ${JOBS_PER_DAY}` : 'morgen neue')),
    h('div', { class: 'job-notes' }, jobs.map((job) => jobNote(job, game))));
}

function reward(job, game) {
  const item = job.thing && game.catalog.itemById.get(job.thing.id);
  return h('span', { class: 'job-reward' },
    resource('splitter', job.splitter),
    item ? h('span', { class: `item-frame job-thing${qualityClass(job.thing)}` }, itemIcon(item, game, 'item-icon', job.thing.farbe)) : null);
}

function jobNote(job, game) {
  const place = game.catalog.placeById.get(job.place);
  return h('button', { class: `job-note is-${job.state}`, disabled: job.state === 'done', onclick: () => openJob(job, game) },
    h('span', { class: 'job-name' }, job.name),
    h('span', { class: 'job-where' }, `${place?.name || ''} · etwa ${job.minutes} Minuten`),
    reward(job, game),
    STATE_TEXT[job.state] ? h('span', { class: 'job-state' }, STATE_TEXT[job.state]) : null);
}

function openJob(job, game) {
  const c = game.ctx();
  const place = game.catalog.placeById.get(job.place);
  const way = place ? addition(c.world, place, Date.now(), c) : { way: 0, home: 0 };
  const total = Math.round(job.minutes + way.way + way.home);
  const item = job.thing && game.catalog.itemById.get(job.thing.id);
  const busy = Boolean(c.world.expedition);
  let action;
  if (job.state === 'running') action = h('p', { class: 'muted' }, 'Der Envoy ist dabei.');
  else {
    action = h('button', {
      class: 'btn primary',
      onclick: () => {
        if (game.takeJob(job.id)) toast(busy ? 'Der Auftrag ist angehängt.' : 'Der Envoy macht sich auf den Weg.');
        closeSheet();
      },
    }, busy ? 'Anhängen' : 'Annehmen');
  }
  openSheet({
    title: job.name,
    eyebrow: 'Aushang',
    className: 'job-sheet',
    content: [
      h('p', { class: 'job-text' }, job.text),
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Ort'), h('dd', {}, place?.name || '')),
        h('div', {}, h('dt', {}, 'Dauer'), h('dd', {}, total > job.minutes ? `etwa ${total} Minuten mit dem Weg` : `etwa ${job.minutes} Minuten`)),
        h('div', {}, h('dt', {}, 'Energie'), h('dd', {}, 'keine'))),
      h('p', { class: 'eyebrow job-pay-label' }, 'Lohn'),
      h('div', { class: 'job-pay' },
        resource('splitter', job.splitter),
        item ? h('div', { class: 'job-pay-thing' },
          h('span', { class: `item-frame${qualityClass(job.thing)}` }, itemIcon(item, game, 'item-icon', job.thing.farbe)),
          h('span', { class: 'item-row-main' },
            h('span', { class: 'item-name' }, item.name),
            h('span', { class: 'item-sub' }, thingSubtitle(job.thing, item)),
            effectList(effectsOf(item, job.thing)))) : null),
      h('div', { class: 'sheet-actions' }, action),
    ],
  });
}
