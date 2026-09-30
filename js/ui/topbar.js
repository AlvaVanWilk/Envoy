// The bar at the top of the screen, above every view (not while the Envoy
// is being created):
//   left    the portrait of the Envoy in four thin rings, one per stat, big
//           enough to hang into the page. A ring fills in the stat's colour
//           on the way to the next level. Pointing at a ring (or touching
//           it) tells the level and what is missing; tapping the portrait
//           opens the Envoy (on the Envoy's own page it stays where it is).
//   middle  the Tageswerk. While tasks are open an orange glow pulses around
//           it; once all four are done it rests, quiet, with the emblem of
//           the app and its name side by side.
//   right   the settings.

import { h } from './dom.js';
import { STATS, STAT_MAX_LEVEL, versioned } from '../config.js';
import { xpToNext } from '../formulas.js';
import { resolveLook, portraitSrc, showLayer } from './look.js';
import { shield } from './shield.js';
import { NAV_ICONS } from './icons.js';

// Rings from the inside out, in the order of STATS. The portrait lies in
// the middle (radius 32 of 100); each ring is a band of 4.4 around it.
const PORTRAIT_R = 32;
const RING_R = [35, 39.4, 43.8, 48.2];
const BAND = 2.2; // half the width of a band

const share = (s) => (s.level >= STAT_MAX_LEVEL ? 1 : s.xp / xpToNext(s.level));

export function ringText(stat, s) {
  if (s.level >= STAT_MAX_LEVEL) return `${stat.name} · Level ${s.level}`;
  const missing = Math.max(1, Math.ceil(xpToNext(s.level) - s.xp));
  return `${stat.name} · Level ${s.level} · noch ${missing} XP bis Level ${s.level + 1}`;
}

function rings(stats) {
  const circle = (r, cls, extra = '') => `<circle cx="50" cy="50" r="${r}" class="${cls}" pathLength="100" ${extra}/>`;
  const body = STATS.map((st, n) => {
    const filled = Math.round(share(stats[st.id]) * 1000) / 10;
    return circle(RING_R[n], 'stat-ring-track', `data-stat="${st.id}"`)
      + (filled > 0 ? circle(RING_R[n], 'stat-ring-fill', `data-stat="${st.id}" stroke-dasharray="${filled} 100"`) : '');
  }).join('');
  return `<svg class="rings" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}

// Which ring a point belongs to (index into STATS), or -1 for the portrait.
function ringAt(box, x, y) {
  const r = Math.hypot(x - box.left - box.width / 2, y - box.top - box.height / 2) * (100 / box.width);
  if (r < PORTRAIT_R + 1) return -1;
  const n = RING_R.findIndex((rr) => r <= rr + BAND);
  return n === -1 ? RING_R.length - 1 : n;
}

function portraitRings(game, current, badge) {
  const { stats, world } = game.state;
  const look = resolveLook(world.envoy);
  const img = h('img', { class: 'portrait-img', alt: '', draggable: 'false' });
  showLayer(img, portraitSrc(look), look, 'portrait');
  const tip = h('span', { class: 'ring-tip', role: 'status' });
  const levels = STATS.map((st) => `${st.name} ${stats[st.id].level}`).join(', ');
  const art = h('span', { class: 'rings-art', html: rings(stats) });
  const wrap = h('div', { class: 'portrait-rings' },
    art,
    h('a', { class: `portrait-link ${current === 'envoy' ? 'active' : ''}`, href: '#envoy', 'aria-label': `${world.envoy?.name || 'Envoy'} öffnen. ${levels}` }, img),
    badge ? h('span', { class: 'portrait-badge', title: 'Ein Teil wurde abgelegt' }) : null,
    tip);

  let hideTimer = 0;
  const show = (n) => {
    clearTimeout(hideTimer);
    if (n < 0) { tip.classList.remove('on'); return; }
    const st = STATS[n];
    tip.textContent = ringText(st, stats[st.id]);
    tip.dataset.stat = st.id;
    tip.classList.add('on');
  };
  art.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') show(ringAt(art.getBoundingClientRect(), e.clientX, e.clientY));
  });
  art.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') show(-1); });
  // A tap on a ring only shows the level. Listening for clicks here keeps
  // browsers from passing a tap near the portrait on to the portrait.
  art.addEventListener('click', (e) => e.preventDefault());
  art.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    show(ringAt(art.getBoundingClientRect(), e.clientX, e.clientY));
    hideTimer = setTimeout(() => show(-1), 2600);
  });
  return wrap;
}

function dayworkButton(game, current) {
  const s = game.state;
  const doneCount = STATS.filter((st) => s.todayDone[st.id]).length;
  const active = current === 'tageswerk';
  if (doneCount === STATS.length) {
    return h('a', { class: `daywork done ${active ? 'active' : ''}`, href: '#tageswerk', 'aria-label': 'Tageswerk, erledigt' },
      h('img', { class: 'daywork-emblem', src: versioned('assets/app/icon-192.png'), alt: '' }),
      h('span', { class: 'daywork-word', 'aria-hidden': 'true' }, 'ENVOY'));
  }
  return h('a', { class: `daywork open ${active ? 'active' : ''}`, href: '#tageswerk', 'aria-label': `Tageswerk, ${doneCount} von 4 erledigt` },
    h('span', { class: 'daywork-title' }, 'Tageswerk'),
    h('span', { class: 'daywork-count' }, `${doneCount} / 4`));
}

// syncTone: 'ok', 'pending', 'error' or null (no account).
// envoyBadge: something on the Envoy's page is new (a piece was taken off).
export function renderTopbar(game, current, syncTone, { envoyBadge = false } = {}) {
  const gear = h('a', { class: `gear ${current === 'einstellungen' ? 'active' : ''}`, href: '#einstellungen', 'aria-label': 'Einstellungen' },
    shield(NAV_ICONS.einstellungen, { extra: syncTone ? h('span', { class: `coin-dot ${syncTone}` }) : null }));
  return h('div', { class: 'topbar-row' },
    portraitRings(game, current, envoyBadge),
    dayworkButton(game, current),
    gear);
}
