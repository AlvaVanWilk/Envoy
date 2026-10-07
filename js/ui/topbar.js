// The bar at the top of the screen, above every view (not while the Envoy
// is being created):
//   left    the portrait of the Envoy in four thin rings, one per stat, big
//           enough to hang into the page. A ring fills in the stat's colour
//           on the way to the next level. Pointing at a ring (or touching
//           it) tells the level and what is missing; tapping the portrait
//           opens the Envoy (on the Envoy's own page it stays where it is).
//           When a task of the Tageswerk is done, its ring grows from the old
//           value to the new one and glows, and the portrait glows with it
//           (see celebrateStat).
//   middle  the Tageswerk. While tasks are open an orange glow pulses around
//           it; once all four are done it rests, quiet, with the emblem of
//           the app and its name side by side.
//   right   the settings.

import { h } from './dom.js';
import { STATS, STAT_MAX_LEVEL, versioned } from '../config.js';
import { xpToNext, statText } from '../formulas.js';
import { resolveLook, portraitSrc, showLayer } from './look.js';
import { shield } from './shield.js';
import { NAV_ICONS } from './icons.js';

// Rings from the inside out, in the order of STATS. The portrait lies in
// the middle (radius 32 of 100); each ring is a band of 4.4 around it.
const PORTRAIT_R = 32;
const RING_R = [35, 39.4, 43.8, 48.2];
const BAND = 2.2; // half the width of a band

const share = (s) => (s.level >= STAT_MAX_LEVEL ? 1 : s.xp / xpToNext(s.level));

// The hint at a ring: the stat and its value (1.375, see statValue).
export const ringText = (stat, s) => `${stat.name} ${statText(s)}`;

// --- a ring that has just grown ---------------------------------------------
// holdRing() keeps a ring at its old value while the task is being finished;
// celebrateStat() then lets it grow to the new value once the light of the
// task arrives (after `delay`): full and on from the start after a new
// level. Ring and portrait glow meanwhile. The bar may be drawn anew at any
// time; it then continues where the motion is.
const GROW_MS = 1100;
const GLOW_MS = 1700;
const celebrations = new Map(); // stat -> { from, to, levelUp, start }

export function holdRing(stat, before) {
  celebrations.set(stat, { from: share(before), to: share(before), levelUp: false, start: Infinity });
}

export function releaseRing(stat) {
  if (celebrations.get(stat)?.start === Infinity) celebrations.delete(stat);
}

export function celebrateStat(stat, before, now, delay = 0) {
  celebrations.set(stat, { from: share(before), to: share(now), levelUp: now.level > before.level, start: Date.now() + delay });
  setTimeout(() => requestAnimationFrame(play), Math.max(0, delay));
}

const ease = (k) => 1 - (1 - k) ** 3;

// The share a celebrated ring shows at time t (null: none is celebrated).
function shownShare(c, t) {
  const k = Math.min(1, Math.max(0, (t - c.start) / GROW_MS));
  if (k <= 0) return c.from;
  const way = c.levelUp ? (1 - c.from) + c.to : c.to - c.from;
  const p = ease(k) * way;
  if (!c.levelUp) return c.from + p;
  return p < 1 - c.from ? c.from + p : p - (1 - c.from);
}

// The bright point at the end of a growing ring.
function sparkAt(n, filled) {
  const a = ((filled / 100) * 360 - 90) * (Math.PI / 180);
  return { x: 50 + RING_R[n] * Math.cos(a), y: 50 + RING_R[n] * Math.sin(a) };
}

function setFill(el, filled) {
  el.setAttribute('stroke-dasharray', `${filled} 100`);
  // a ring at nought would show a dot (round ends)
  el.style.visibility = filled < 0.3 ? 'hidden' : '';
}

// One frame of every celebrated ring in the bar as it is now.
function play() {
  const t = Date.now();
  let more = false;
  for (const [stat, c] of celebrations) {
    if (c.start === Infinity) continue;
    if (t >= c.start + GLOW_MS) { celebrations.delete(stat); }
    else more = true;
    const n = STATS.findIndex((st) => st.id === stat);
    const filled = Math.round((t >= c.start + GROW_MS ? c.to : shownShare(c, t)) * 1000) / 10;
    const lit = t >= c.start && t < c.start + GLOW_MS;
    document.querySelectorAll(`.topbar .stat-ring-fill[data-stat="${stat}"]`).forEach((el) => {
      setFill(el, filled);
      el.classList.toggle('is-lit', lit);
    });
    document.querySelectorAll(`.topbar .ring-spark[data-stat="${stat}"]`).forEach((el) => {
      const at = sparkAt(n, filled);
      el.setAttribute('cx', at.x.toFixed(2));
      el.setAttribute('cy', at.y.toFixed(2));
      el.classList.toggle('on', t >= c.start && t < c.start + GROW_MS + 200);
    });
    document.querySelectorAll('.topbar .portrait-rings').forEach((wrap) => glow(wrap, stat, t - c.start));
  }
  if (more) requestAnimationFrame(play);
}

// The glow of ring and portrait, `since` ms after it began (a new drawing
// of the bar picks it up where it was).
function glow(wrap, stat, since) {
  const on = since >= 0 && since < GLOW_MS;
  let el = wrap.querySelector(`.ring-glow[data-stat="${stat}"]`);
  if (on && !el) {
    el = h('span', { class: 'ring-glow', 'data-stat': stat, style: { 'animation-delay': `${-since}ms` } });
    wrap.prepend(el);
    wrap.classList.add('is-glowing');
    wrap.dataset.stat = stat;
    const link = wrap.querySelector('.portrait-link');
    if (link) link.style.animationDelay = `${-since}ms`;
  }
  if (!on && el) {
    el.remove();
    wrap.classList.remove('is-glowing');
    delete wrap.dataset.stat;
  }
}

function rings(stats) {
  const t = Date.now();
  const circle = (r, cls, extra = '') => `<circle cx="50" cy="50" r="${r}" class="${cls}" pathLength="100" ${extra}/>`;
  const body = STATS.map((st, n) => {
    const c = celebrations.get(st.id);
    const value = c && !(t >= c.start + GROW_MS) ? shownShare(c, t) : share(stats[st.id]);
    const filled = Math.round(value * 1000) / 10;
    const spark = c ? sparkAt(n, filled) : null;
    const lit = c && t >= c.start && t < c.start + GLOW_MS;
    return circle(RING_R[n], 'stat-ring-track', `data-stat="${st.id}"`)
      + circle(RING_R[n], `stat-ring-fill${lit ? ' is-lit' : ''}`, `data-stat="${st.id}" stroke-dasharray="${filled} 100"${filled < 0.3 ? ' style="visibility:hidden"' : ''}`)
      + (spark ? `<circle class="ring-spark" data-stat="${st.id}" cx="${spark.x.toFixed(2)}" cy="${spark.y.toFixed(2)}" r="2.4"/>` : '');
  }).join('');
  return `<svg class="rings" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}

// Where the light of a finished task flies to: the top of the stat's ring.
export function ringTarget(stat) {
  const wrap = document.querySelector('.topbar .portrait-rings');
  const n = STATS.findIndex((st) => st.id === stat);
  if (!wrap || n < 0) return null;
  const box = wrap.getBoundingClientRect();
  if (box.width === 0) return null;
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 - (RING_R[n] / 100) * box.width };
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
  const levels = STATS.map((st) => `${st.name} ${statText(stats[st.id])}`).join(', ');
  const art = h('span', { class: 'rings-art', html: rings(stats) });
  const wrap = h('div', { class: 'portrait-rings' },
    art,
    h('a', { class: `portrait-link ${current === 'envoy' ? 'active' : ''}`, href: '#envoy', 'aria-label': `${world.envoy?.name || 'Envoy'} öffnen. ${levels}` }, img),
    badge ? h('span', { class: 'portrait-badge', title: 'Ein Teil wurde abgelegt' }) : null,
    tip);
  // a glow that is still going on goes on in the new drawing
  for (const [stat, c] of celebrations) if (c.start !== Infinity) glow(wrap, stat, Date.now() - c.start);

  let hideTimer = 0;
  const show = (n) => {
    clearTimeout(hideTimer);
    if (n < 0) { tip.classList.remove('on'); return; }
    const st = STATS[n];
    tip.replaceChildren(h('span', { class: 'ring-tip-value' }, ringText(st, stats[st.id])), h('span', { class: 'ring-tip-text' }, st.wirkung));
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
