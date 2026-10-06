// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, SLOT_ICONS, ENERGY_ICON } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.13';

const GREETING = 'Liebe Envoys!';
const INTRO = 'Euer Envoy hat jetzt mehr zu tun, und seine Kleidung zählt.';

const NEWS = [
  { icon: SLOT_ICONS.torso, title: 'Kleidung mit Boni',
    text: 'Gefundene Kleidung kann gut, selten oder prächtig sein. Dann bringt sie Boni mit: mehr Schaden, bessere Treffer, schnellere Energie, mehr Glück.' },
  { icon: NAV_ICONS.haendler, title: 'Der Händler wartet gleich am Anfang',
    text: 'Er steckt in der Nebelfurt fest. Helft ihm heraus, dann ist er für euch da.' },
  { icon: ENERGY_ICON, title: 'Tränke für Energie',
    text: 'Pilztee und Quellsud füllen eure Energie auf. Der Händler hat jeden Tag zwei von jeder Sorte.' },
  { icon: NAV_ICONS.arena, title: 'Die Arena kostet keine Energie mehr',
    text: 'Fordert heraus, wen die Rangliste erlaubt. Eure Energie bleibt ganz für die Zwischenwelt.' },
];

export function openNews(onDone) {
  const layer = h('div', { class: 'gate-layer news-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Neuigkeiten' });
  const close = () => {
    layer.classList.remove('open');
    setTimeout(() => layer.remove(), 250);
    onDone();
  };
  layer.append(h('div', { class: 'gate-card news-card' },
    h('h1', { class: 'news-greeting' }, GREETING),
    h('p', { class: 'news-intro' }, INTRO),
    h('div', { class: 'news-list' }, NEWS.map((n) => h('section', { class: 'news-item' },
      icon(n.icon, 'icon news-icon'),
      h('div', { class: 'news-body' },
        h('h2', { class: 'news-title' }, n.title),
        h('p', { class: 'news-text' }, n.text))))),
    h('button', { class: 'btn primary news-go', type: 'button', onclick: close }, 'Auf in die Zwischenwelt')));
  document.body.append(layer);
  requestAnimationFrame(() => layer.classList.add('open'));
}
