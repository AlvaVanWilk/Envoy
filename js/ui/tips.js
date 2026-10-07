// Short explanations that show when pointing at something: a mouse over it,
// or a tap on a phone or iPad. An element gets one with data-tip. A tap on a
// button or a link still does what it does; its explanation shows with a
// mouse, and in the window it opens.

import { h } from './dom.js';

const TAP_MS = 3200;
let box = null;
let hideTimer = 0;

function show(el) {
  if (!box) {
    box = h('div', { class: 'tip-box', role: 'tooltip' });
    document.body.append(box);
  }
  box.textContent = el.dataset.tip;
  box.classList.add('on');
  // below the element, else above it, always inside the window
  const r = el.getBoundingClientRect();
  const left = Math.min(Math.max(12, r.left), window.innerWidth - 12 - box.offsetWidth);
  let top = r.bottom + 6;
  if (top + box.offsetHeight > window.innerHeight - 12) top = r.top - 6 - box.offsetHeight;
  box.style.left = `${left}px`;
  box.style.top = `${Math.max(12, top)}px`;
}

function hide() {
  clearTimeout(hideTimer);
  box?.classList.remove('on');
}

export function installTips() {
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.('[data-tip]');
    if (el) show(el);
    else hide();
  });
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const el = e.target.closest?.('[data-tip]');
    hide();
    if (!el || el.closest('button, a')) return;
    show(el);
    hideTimer = setTimeout(hide, TAP_MS);
  });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
  window.addEventListener('hashchange', hide);
}
