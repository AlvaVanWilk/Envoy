// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, SLOT_ICONS, PLACE_ICONS } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.15';

const GREETING = 'Liebe Envoys!';
const INTRO = 'Euer Envoy hat jetzt viel mehr zu tun, und seine Kleidung zählt.';

const NEWS = [
  { icon: PLACE_ICONS.hoehle, title: 'Die Tiefen',
    text: 'Unter dem Trümmerfeld wartet auf jeder Ebene ein Wächter. Hinabsteigen kostet keine Energie. Wie weit euer Envoy kommt, entscheiden seine Werte und seine Kleidung.' },
  { icon: PLACE_ICONS.ort, title: 'Der Aushang am Lager',
    text: 'Jeden Tag hängen dort drei Aufträge, der Lohn steht gleich darauf. Sie kosten keine Energie, nur ein wenig Zeit.' },
  { icon: SLOT_ICONS.torso, title: 'Kleidung mit Boni',
    text: 'Gefundene Kleidung kann gut, selten oder prächtig sein. Dann bringt sie Boni mit: mehr Schaden, bessere Treffer, schnellere Energie, mehr Glück.' },
  { icon: NAV_ICONS.haendler, title: 'Der Händler wartet gleich am Anfang',
    text: 'Er steckt in der Nebelfurt fest. Helft ihm heraus, dann verkauft er euch jeden Tag auch Pilztee und Quellsud für Energie.' },
  { icon: NAV_ICONS.arena, title: 'Neues in der Arena',
    text: 'Herausfordern kostet keine Energie mehr. Für Ruhm gibt es jetzt Kleidung mit Boni, und Titel kommen mit euren Rängen.' },
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
