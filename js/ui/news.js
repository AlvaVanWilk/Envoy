// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, UI_ICONS } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.20';

const GREETING = 'Liebe Envoys!';
const INTRO = 'In der Arena zählt eure Kleidung jetzt im Kampf.';

const NEWS = [
  { icon: NAV_ICONS.arena, title: 'Kleidung zählt im Kampf',
    text: 'Seid ihr gleich fleißig, entscheidet in der Arena der Kampf selbst. Schaden, Treffer und Ausweichen eurer Kleidung wirken dabei mit.' },
  { icon: UI_ICONS.hero, title: 'Was eure Kleidung dafür hat',
    text: 'Beim Envoy steht unter Arena, welche dieser Boni eure Kleidung gerade mitbringt.' },
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
