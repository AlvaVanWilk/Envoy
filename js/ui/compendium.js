// The Kompendium in the Handbuch: first a page with all spirits, then one
// page for every spirit the Envoy has met. Spirits not met yet stay dark.

import { h } from './dom.js';
import { formatDayShort } from '../days.js';

const pageId = (m) => `geist-${m.id}`;

function sortedMonsters(game) {
  return [...game.catalog.monsters].sort((a, b) => a.stufe - b.stufe || a.name.localeCompare(b.name, 'de'));
}

function indexPage(game, all, goTo) {
  const { bestiary } = game.state.world;
  const met = all.filter((m) => bestiary[m.id]);
  return {
    id: 'verzeichnis',
    title: 'Geister',
    body: () => [
      h('p', { class: 'page-note' }, `${met.length} von ${all.length} begegnet`),
      h('div', { class: 'book-spirits' }, all.map((m) => (bestiary[m.id]
        ? h('button', { class: 'book-spirit', onclick: () => goTo(pageId(m)) },
          h('img', { src: m.bild, alt: '' }),
          h('span', { class: 'book-spirit-name' }, m.name),
          h('span', { class: 'book-spirit-sub' }, `Stufe ${m.stufe}`))
        : h('div', { class: 'book-spirit unknown', 'aria-label': 'Noch nicht begegnet' },
          h('img', { src: m.bild, alt: '' }),
          h('span', { class: 'book-spirit-name' }, 'Unbekannt'),
          h('span', { class: 'book-spirit-sub' }, `Stufe ${m.stufe}`))))),
    ],
  };
}

function spiritPage(m, game) {
  const record = game.state.world.bestiary[m.id];
  const places = game.catalog.places.filter((p) => p.monsters.includes(m.id)).map((p) => p.name);
  const row = (label, value) => h('div', {}, h('dt', {}, label), h('dd', {}, value));
  return {
    id: pageId(m),
    title: m.name,
    body: () => [
      h('img', { class: 'page-picture', src: m.bild, alt: '' }),
      h('p', { class: 'page-note' }, `Stufe ${m.stufe}`),
      h('p', {}, m.text),
      h('dl', { class: 'page-facts' },
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
  };
}

// goTo(pageId): turns to another page of the Kompendium.
export function compendiumPages(game, goTo) {
  const all = sortedMonsters(game);
  const met = all.filter((m) => game.state.world.bestiary[m.id]);
  return [indexPage(game, all, goTo), ...met.map((m) => spiritPage(m, game))];
}
