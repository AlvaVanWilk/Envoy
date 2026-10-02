// A panel that slides up from the bottom (phone) or appears centred (tablet).
// Only one sheet is open at a time.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';

let current = null;

export function openSheet({ title, eyebrow = null, content, className = '', onClose = null }) {
  closeSheet();
  const root = document.getElementById('sheet-root');
  const previousFocus = document.activeElement;

  const close = () => closeSheet();
  const panel = h('div', { class: `sheet ${className}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', { class: 'sheet-head' },
      h('div', {},
        eyebrow ? h('p', { class: 'eyebrow' }, eyebrow) : null,
        h('h2', { class: 'sheet-title' }, title)),
      h('button', { class: 'icon-btn', 'aria-label': 'Schließen', onclick: close }, icon(UI_ICONS.close))),
    h('div', { class: 'sheet-body' }, content));
  const backdrop = h('div', { class: 'sheet-backdrop', onclick: close });
  const layer = h('div', { class: 'sheet-layer' }, backdrop, panel);

  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  root.replaceChildren(layer);
  requestAnimationFrame(() => layer.classList.add('open'));
  const focusTarget = panel.querySelector('.sheet-body button, .sheet-body input') || panel.querySelector('button');
  focusTarget?.focus({ preventScroll: true });

  current = { layer, onKey, onClose, previousFocus };
  return { close, panel };
}

// A picture over the whole screen, without a frame (counts as a sheet: only
// one is open at a time). A tap anywhere closes it; moving it does not.
export function openPicture({ label, content }) {
  closeSheet();
  const root = document.getElementById('sheet-root');
  const previousFocus = document.activeElement;

  const close = () => closeSheet();
  const button = h('button', { class: 'icon-btn picture-close', 'aria-label': 'Schließen' }, icon(UI_ICONS.close));
  const view = h('div', { class: 'picture-view', role: 'dialog', 'aria-modal': 'true', 'aria-label': label, onclick: close }, content, button);
  const layer = h('div', { class: 'sheet-layer picture-layer' }, view);

  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  root.replaceChildren(layer);
  requestAnimationFrame(() => layer.classList.add('open'));
  button.focus({ preventScroll: true });

  current = { layer, onKey, onClose: null, previousFocus };
  return { close };
}

export function isSheetOpen() {
  return current !== null;
}

export function closeSheet() {
  if (!current) return;
  const { layer, onKey, onClose, previousFocus } = current;
  current = null;
  document.removeEventListener('keydown', onKey);
  layer.classList.remove('open');
  layer.classList.add('closing');
  setTimeout(() => layer.remove(), 220);
  previousFocus?.focus?.({ preventScroll: true });
  onClose?.();
}

export function toast(text, { tone = 'neutral', duration = 2600 } = {}) {
  const root = document.getElementById('toast-root');
  const el = h('div', { class: `toast toast-${tone}`, role: 'status' }, text);
  root.append(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}
