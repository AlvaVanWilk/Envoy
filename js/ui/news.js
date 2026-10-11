// What is new: shown once over the whole screen, at the first start after an
// update (see gate.js). A new Envoy does not need it. Each piece of news
// knows the version it came with (`seit`); the window shows everything since
// the version this device last saw, all together (so gewünscht: what is
// released during a day goes live at 3 o'clock at once, and so does its
// news). Only the headings show; a tap on one opens its sentence.
// In the user's tone: „Liebe Envoys!“, big headings, short.

import { h, icon } from './dom.js';
import { SLOT_ICONS } from './icons.js';

const GREETING = 'Liebe Envoys!';

// Newest first. Old entries can go once everyone has seen them.
export const NEWS = [
  { seit: '5.22.0', icon: SLOT_ICONS.handschuhe, title: 'Kleidung nach vorn oder hinten',
    text: 'Ein getragenes Stück antippen, dann „Nach vorn“ oder „Nach hinten“.' },
];

// -1, 0 or 1, like the versions 5.9 and 5.22 compare.
export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

// The news since the version last seen (null: never seen any, then nothing).
export const newsSince = (seen) => (seen ? NEWS.filter((n) => compareVersions(n.seit, seen) > 0) : []);

export function openNews(items, onDone) {
  const layer = h('div', { class: 'gate-layer news-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Neuigkeiten' });
  const close = () => {
    layer.classList.remove('open');
    setTimeout(() => layer.remove(), 250);
    onDone();
  };
  layer.append(h('div', { class: 'gate-card news-card' },
    h('h1', { class: 'news-greeting' }, GREETING),
    h('div', { class: 'news-list' }, items.map((n) => h('details', { class: 'news-item' },
      h('summary', { class: 'news-head' },
        icon(n.icon, 'icon news-icon'),
        h('span', { class: 'news-title' }, n.title)),
      h('p', { class: 'news-text' }, n.text)))),
    h('button', { class: 'btn primary news-go', type: 'button', onclick: close }, 'Auf in die Zwischenwelt')));
  document.body.append(layer);
  requestAnimationFrame(() => layer.classList.add('open'));
}
