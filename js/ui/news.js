// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, SLOT_ICONS, UI_ICONS } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.19';

const GREETING = 'Liebe Envoys!';
const INTRO = 'Euer Lager wächst leichter, eure Quests lohnen sich mehr, und in der Arena zählt euer Fleiß.';

const NEWS = [
  { icon: NAV_ICONS.lager, title: 'Das Lager wächst leichter',
    text: 'Die ersten Aufwertungen brauchen viel weniger Energie: 15 statt 30, dann 40 statt 70. Die späteren werden auch günstiger.' },
  { icon: NAV_ICONS.abenteuer, title: 'Quests lohnen sich mehr',
    text: 'Erkunden bringt doppelt so viele Bannsplitter. Kleidung, die ihr unterwegs findet, ist öfter gut, selten oder prächtig.' },
  { icon: NAV_ICONS.arena, title: 'Fleiß entscheidet',
    text: 'In der Arena gewinnt, wer in den letzten vier Wochen öfter sein Tageswerk gemacht hat. Bei gleichem Fleiß entscheidet die Kleidung, sonst treffen beide zugleich.' },
  { icon: UI_ICONS.hero, title: 'Eure Werte und Kampfwerte',
    text: 'Beim Envoy seht ihr jetzt eure Kampfwerte und euren Fleiß. Zeigt auf einen Wert oder tippt ihn an, dann steht dort, was er bewirkt.' },
  { icon: SLOT_ICONS.torso, title: 'Kraft einweben',
    text: 'Ein Stück gefällt euch, ein anderes hat die besseren Boni? Am Lagerfeuer webt euer Envoy die Kraft des einen in das andere. Das gebende Stück zerfällt dabei.' },
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
