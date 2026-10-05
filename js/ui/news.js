// What is new in this version: shown once over the whole screen, at the
// first start after the update (see gate.js). A new Envoy does not need it.
// Big headings, one or two short sentences each, in the user's tone.

import { h, icon } from './dom.js';
import { NAV_ICONS, SLOT_ICONS, STAT_ICONS, RESOURCE_ICONS, UI_ICONS, ENERGY_ICON, FACILITY_ICONS } from './icons.js';

// A new version with news gets a new id here (and new NEWS below).
export const NEWS_ID = '5.11';

const GREETING = 'Liebe Envoys!';
const INTRO = 'Gerade erst das Lager aufgeschlagen, schon gibt es ein Update für euch. Es hat sich bereits viel getan in der Zwischenwelt.';

const NEWS = [
  { icon: NAV_ICONS.arena, title: 'Die Arena wurde eröffnet!',
    text: 'Stellt euer Abbild in der Ruhmeshalle auf und fordert die anderen heraus. Wer fleißig übt, steht stark da, und Ruhm geht nie verloren.' },
  { icon: SLOT_ICONS.torso, title: 'Kleider machen Envoys!',
    text: 'Unterwegs liegt jetzt viel mehr Kleidung herum, oft in ganz eigenen Farben. Mit Ruhm aus der Arena lassen sich Lieblingsstücke umfärben.' },
  { icon: STAT_ICONS.beweglichkeit, title: 'Übungen für jedes Alter',
    text: 'Kinder und Jugendliche bekommen eigene Übungen, vom Bärengang bis zum Teddy-Atmen. Dafür fragt Envoy gleich einmal nach eurem Alter.' },
  { icon: UI_ICONS.timer, title: 'Eine Übung nach der anderen',
    text: 'Der Timer begleitet jede Übung einzeln, mit Zeit zum Lesen dazwischen. Die Frage danach kommt sofort, und Kinder werden gar nicht mehr gefragt.' },
  { icon: ENERGY_ICON, title: 'Das Tageswerk gibt Energie',
    text: 'Jede erledigte Aufgabe füllt ein Achtel eurer Energie auf, auch über die Leiste hinaus. Wer morgens übt, verschenkt nichts.' },
  { icon: FACILITY_ICONS.schlafplatz, title: 'Gut geschlafen',
    text: 'Der Schlafplatz schenkt seine Energie jetzt um 6 Uhr morgens. Wer nachts noch ein Bett baut, wacht schon am nächsten Morgen ausgeruht auf.' },
  { icon: NAV_ICONS.abenteuer, title: 'Alle Quests auf einen Blick',
    text: 'Neben der Karte steht jetzt eine Liste aller Quests, mit Filter und Reihenfolge. Ein Tipp, und der Ort leuchtet auf.' },
  { icon: RESOURCE_ICONS.splitter, title: 'Kleine Überraschungen',
    text: 'Wer sammelt, stößt ab und zu auf einen Bannsplitter zwischen Stein und Pilzholz.' },
  { icon: NAV_ICONS.handbuch, title: 'Jeder Bericht nur einmal',
    text: 'Berichte von Expeditionen erscheinen nur noch einmal, egal auf welchem Gerät ihr spielt.' },
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
