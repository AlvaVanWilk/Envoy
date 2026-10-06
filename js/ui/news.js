// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, RESOURCE_ICONS, UI_ICONS, ENERGY_ICON } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.12';

const GREETING = 'Liebe Envoys!';
const INTRO = 'In der Zwischenwelt geht jetzt vieles schneller. Euer Envoy schafft an einem Tag viel mehr als bisher.';

const NEWS = [
  { icon: UI_ICONS.timer, title: 'Zehn Sekunden statt einer Minute',
    text: 'Jede Energie dauert jetzt nur noch zehn Sekunden. Kleine Aufgaben sind im Nu erledigt, lange Expeditionen in ein paar Minuten.' },
  { icon: NAV_ICONS.abenteuer, title: 'Wege kosten keine Energie mehr',
    text: 'Die ganze Energie geht in das, was euer Envoy unterwegs tut. Weit entfernte Orte brauchen nur etwas länger.' },
  { icon: ENERGY_ICON, title: 'Das Tageswerk gibt doppelt so viel',
    text: 'Jede erledigte Aufgabe füllt ein Viertel eurer Energie auf, auch über die Leiste hinaus. Alle vier zusammen sind eine ganze Leiste.' },
  { icon: RESOURCE_ICONS.splitter, title: 'Mehr Bannsplitter!',
    text: 'Wiederholbare Quests bringen jetzt viel mehr Bannsplitter, und viele lassen sich jeden Tag machen.' },
  { icon: NAV_ICONS.lager, title: 'Das Lager bleibt ein großes Vorhaben',
    text: 'Damit es nicht zu schnell fertig ist, braucht das Aufwerten mehr Energie am Stück. Pläne für Deko sind etwas seltener, beim Händler kosten sie mehr.' },
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
