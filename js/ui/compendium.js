// Compendium of every spirit the Envoy has met.

import { h } from './dom.js';
import { viewHead } from './parts.js';
import { openSheet } from './sheet.js';
import { formatDayShort } from '../days.js';

export function renderCompendium(game) {
  const { bestiary } = game.state.world;
  const met = game.catalog.monsters.filter((m) => bestiary[m.id]).sort((a, b) => a.stufe - b.stufe);

  return h('section', { class: 'view compendium' },
    viewHead('Kompendium', 'Geister'),
    h('p', { class: 'muted', style: { 'margin-bottom': '12px' } }, `${met.length} von ${game.catalog.monsters.length} begegnet`),
    met.length === 0
      ? h('div', { class: 'panel empty-state' }, 'Noch keinem Geist begegnet. Auf der Karte tauchen täglich welche auf.')
      : h('div', { class: 'monster-grid' }, met.map((m) => h('button', { class: 'monster-card', onclick: () => openMonster(m, game) },
        h('img', { src: m.bild, alt: '' }),
        h('span', { class: 'quest-name' }, m.name),
        h('span', { class: 'item-sub' }, `Stufe ${m.stufe}`)))));
}

function openMonster(m, game) {
  const record = game.state.world.bestiary[m.id];
  const places = game.catalog.places.filter((p) => p.monsters.includes(m.id)).map((p) => p.name);
  openSheet({
    title: m.name,
    eyebrow: `Stufe ${m.stufe}`,
    className: 'monster-sheet',
    content: [
      h('img', { class: 'monster-hero', src: m.bild, alt: '' }),
      h('p', { class: 'quest-text' }, m.text),
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Leben'), h('dd', {}, String(m.leben))),
        h('div', {}, h('dt', {}, 'Gewandtheit'), h('dd', {}, String(m.gewandtheit))),
        h('div', {}, h('dt', {}, 'Lässt sich beruhigen'), h('dd', {}, m.calmable ? 'ja' : 'nein')),
        places.length ? h('div', {}, h('dt', {}, 'Gesehen bei'), h('dd', {}, places.join(', '))) : null,
        h('div', {}, h('dt', {}, 'Begegnungen'), h('dd', {}, String(record.seen))),
        h('div', {}, h('dt', {}, 'Besiegt'), h('dd', {}, String(record.won))),
        m.calmable ? h('div', {}, h('dt', {}, 'Beruhigt'), h('dd', {}, String(record.calmed))) : null,
        h('div', {}, h('dt', {}, 'Rückzüge'), h('dd', {}, String(record.lost))),
        h('div', {}, h('dt', {}, 'Zuerst gesehen'), h('dd', {}, formatDayShort(record.first)))),
    ],
  });
}
