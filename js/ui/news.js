// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, UI_ICONS, STAT_ICONS, SLOT_ICONS } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.21.1';

const GREETING = 'Liebe Envoys!';
const INTRO = 'Eure Notizen sind eingearbeitet.';

const NEWS = [
  { icon: STAT_ICONS.ausdauer, title: 'Nicht immer Treppe',
    text: 'An manchen Tagen gibt es stattdessen Laufen auf der Stelle, Knie heben oder Ausfallschritte im Wechsel. Die Stufe bleibt dieselbe.' },
  { icon: STAT_ICONS.beweglichkeit, title: 'Die Brücke',
    text: 'Sie ersetzt den knienden Ausfallschritt. Die Hampel-Runden haben jetzt kürzere Abschnitte mit Pausen dazwischen.' },
  { icon: UI_ICONS.timer, title: 'Starten',
    text: 'Jede Übung beginnt mit „Starten“. Der Timer zeigt, wie sie geht, lässt Zeit zum Seitenwechsel, klopft zwischendurch leise und klingt am Ende, auch bei dunklem Bildschirm. Erledigt ist sie, wenn die Zeit um ist.' },
  { icon: NAV_ICONS.abenteuer, title: 'Alles draußen unter Abenteuer',
    text: 'Karte, Aushang, Tiefen und Arena liegen jetzt zusammen. Das Lager zeigt nur noch, was draußen wartet.' },
  { icon: SLOT_ICONS.torso, title: 'Kleidung',
    text: 'Innerhalb einer Güte fällt ein Stück schwächer oder stärker aus. Ein Auftrag bringt ein Kleidungsstück oder Bannsplitter, und der Händler zahlt weniger.' },
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
