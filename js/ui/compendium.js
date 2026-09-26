// Compendium of the spirits. Those already met are shown with their
// picture; the others stay dark until the Envoy meets them.

import { h } from './dom.js';
import { viewHead } from './parts.js';
import { openSheet } from './sheet.js';
import { formatDayShort } from '../days.js';

export function renderCompendium(game) {
  const { bestiary } = game.state.world;
  const all = [...game.catalog.monsters].sort((a, b) => a.stufe - b.stufe || a.name.localeCompare(b.name, 'de'));
  const met = all.filter((m) => bestiary[m.id]);

  return h('section', { class: 'view compendium' },
    viewHead('Kompendium', 'Geister'),
    h('p', { class: 'muted compendium-count' }, `${met.length} von ${all.length} begegnet`),
    h('div', { class: 'monster-grid' }, all.map((m) => (bestiary[m.id]
      ? h('button', { class: 'monster-card', onclick: () => openMonster(m, game) },
        h('span', { class: 'monster-frame' }, h('img', { src: m.bild, alt: '' })),
        h('span', { class: 'monster-name' }, m.name),
        h('span', { class: 'item-sub' }, `Stufe ${m.stufe}`))
      : h('div', { class: 'monster-card unknown', 'aria-label': 'Noch nicht begegnet' },
        h('span', { class: 'monster-frame' }, h('img', { src: m.bild, alt: '' })),
        h('span', { class: 'monster-name' }, 'Unbekannt'),
        h('span', { class: 'item-sub' }, `Stufe ${m.stufe}`))))));
}

function openMonster(m, game) {
  const record = game.state.world.bestiary[m.id];
  const places = game.catalog.places.filter((p) => p.monsters.includes(m.id)).map((p) => p.name);
  const row = (label, value) => h('div', {}, h('dt', {}, label), h('dd', {}, value));
  openSheet({
    title: m.name,
    eyebrow: `Stufe ${m.stufe}`,
    className: 'monster-sheet',
    content: [
      h('img', { class: 'monster-hero', src: m.bild, alt: '' }),
      h('p', { class: 'quest-text' }, m.text),
      h('dl', { class: 'facts' },
        row('Leben', String(m.leben)),
        row('Gewandtheit', String(m.gewandtheit)),
        row('Lässt sich beruhigen', m.calmable ? 'ja' : 'nein'),
        places.length ? row('Zu finden bei', places.join(', ')) : null,
        row('Begegnungen', String(record.seen)),
        row('Besiegt', String(record.won || 0)),
        m.calmable ? row('Beruhigt', String(record.calmed || 0)) : null,
        row('Vertrieben', String((record.driven || 0) + (record.lost || 0))),
        row('Zuerst gesehen', formatDayShort(record.first))),
    ],
  });
}
