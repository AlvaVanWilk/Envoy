// The Kompendium in the Handbuch: first the pages with all spirits, then one
// page for every spirit the Envoy has met. Spirits not met yet stay dark.

import { h } from './dom.js';
import { formatDayShort } from '../days.js';
import { chunks, perPage } from './room.js';

const pageId = (m) => `geist-${m.id}`;

// What one card of the index takes up (px), as in the stylesheet.
const CARD = { width: 220, height: 58, gap: 8 };

function sortedMonsters(game) {
  return [...game.catalog.monsters].sort((a, b) => a.stufe - b.stufe || a.name.localeCompare(b.name, 'de'));
}

function card(m, known, goTo) {
  const inner = [
    h('img', { src: m.bild, alt: '' }),
    h('span', { class: 'book-spirit-text' },
      h('span', { class: 'book-spirit-name' }, known ? m.name : 'Unbekannt'),
      h('span', { class: 'book-spirit-sub' }, `Stufe ${m.stufe}`)),
  ];
  return known
    ? h('button', { class: 'book-spirit', type: 'button', onclick: () => goTo(pageId(m)) }, ...inner)
    : h('div', { class: 'book-spirit unknown', 'aria-label': 'Noch nicht begegnet' }, ...inner);
}

// The index, as many pages as the room needs.
function indexPages(game, all, goTo, room) {
  const { bestiary } = game.state.world;
  const met = all.filter((m) => bestiary[m.id]).length;
  const size = perPage(room, CARD, 30);
  return chunks(all, size).map((part, n, parts) => ({
    id: n === 0 ? 'verzeichnis' : `verzeichnis-${n + 1}`,
    title: 'Geister',
    body: () => [
      h('p', { class: 'page-note' }, parts.length > 1 ? `${met} von ${all.length} begegnet · Seite ${n + 1}` : `${met} von ${all.length} begegnet`),
      h('div', { class: 'book-spirits' }, part.map((m) => card(m, Boolean(bestiary[m.id]), goTo))),
    ],
  }));
}

function spiritPage(m, game) {
  const record = game.state.world.bestiary[m.id];
  const places = game.catalog.places.filter((p) => p.monsters.includes(m.id)).map((p) => p.name);
  const chip = (label, value) => h('div', {}, h('dt', {}, label), h('dd', {}, value));
  return {
    id: pageId(m),
    title: m.name,
    body: () => [
      h('div', { class: 'spirit-top' },
        h('img', { class: 'page-picture', src: m.bild, alt: '' }),
        h('div', { class: 'spirit-text' },
          h('p', { class: 'page-note' }, `Stufe ${m.stufe}`),
          h('p', {}, m.text))),
      h('dl', { class: 'spirit-chips' },
        chip('Leben', String(m.leben)),
        chip('Gewandtheit', String(m.gewandtheit)),
        chip('Beruhigen', m.calmable ? 'ja' : 'nein'),
        chip('Begegnungen', String(record.seen)),
        chip('Besiegt', String(record.won || 0)),
        m.calmable ? chip('Beruhigt', String(record.calmed || 0)) : null,
        chip('Vertrieben', String((record.driven || 0) + (record.lost || 0)))),
      h('p', { class: 'spirit-line' },
        places.length ? `Zu finden bei ${places.join(', ')} · ` : '',
        `Zuerst gesehen am ${formatDayShort(record.first)}`),
    ],
  };
}

// goTo(pageId): turns to another page of the Kompendium.
// room: how much a page body holds, see room.js.
export function compendiumPages(game, goTo, room) {
  const all = sortedMonsters(game);
  const met = all.filter((m) => game.state.world.bestiary[m.id]);
  return [...indexPages(game, all, goTo, room), ...met.map((m) => spiritPage(m, game))];
}
