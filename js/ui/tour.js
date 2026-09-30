// A short tour over a page: the page is dimmed, one part of it is lit and a
// card next to it says what it is. "Weiter" goes on, "Überspringen" (or the
// Escape key) ends it at any time. Tours are kept apart from the pages: a page
// only names its steps (see tours.js).
//
// step: { selector, text, round? }  selector may match several elements; the
// light then covers all of them. round: a round light (for the portrait).

import { h } from './dom.js';

const PAD = 8;     // light around the part, px
const GAP = 14;    // between light and card
const EDGE = 12;   // card to the edge of the window
const CARD_WIDTH = 360;

let open = false;

const bounds = (elements) => {
  const rects = elements.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (rects.length === 0) return null;
  return {
    left: Math.min(...rects.map((r) => r.left)),
    top: Math.min(...rects.map((r) => r.top)),
    right: Math.max(...rects.map((r) => r.right)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };
};

const partsOf = (step) => [...document.querySelectorAll(step.selector)];

// onEnd() is called when the tour is over, whether it was seen to the end or skipped.
export function runTour(allSteps, { onEnd = () => {} } = {}) {
  const steps = allSteps.filter((s) => bounds(partsOf(s)));
  if (open || steps.length === 0) return;
  open = true;

  let index = 0;
  const light = h('div', { class: 'tour-light' });
  const text = h('p', { class: 'tour-text' });
  const count = h('span', { class: 'tour-count' });
  const skip = h('button', { class: 'btn text', type: 'button', onclick: () => end() }, 'Überspringen');
  const next = h('button', { class: 'btn primary', type: 'button', onclick: () => go(index + 1) }, 'Weiter');
  const card = h('div', { class: 'tour-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Rundgang' },
    text,
    h('div', { class: 'tour-actions' }, count, skip, next));
  const layer = h('div', { class: 'tour-layer' }, light, card);

  function place() {
    const step = steps[index];
    const box = bounds(partsOf(step));
    if (!box) return;
    const r = { left: box.left - PAD, top: box.top - PAD, right: box.right + PAD, bottom: box.bottom + PAD };
    light.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.right - r.left}px;height:${r.bottom - r.top}px;`;
    light.classList.toggle('round', Boolean(step.round));

    const width = Math.min(CARD_WIDTH, window.innerWidth - 2 * EDGE);
    card.style.width = `${width}px`;
    const height = card.offsetHeight;
    const below = window.innerHeight - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const clampX = (x) => Math.min(Math.max(x, EDGE), window.innerWidth - width - EDGE);
    const clampY = (y) => Math.min(Math.max(y, EDGE), window.innerHeight - height - EDGE);
    const middle = { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    let top;
    let left = clampX(middle.x - width / 2);
    if (below >= height) top = r.bottom + GAP;
    else if (above >= height) top = r.top - GAP - height;
    else if (window.innerWidth - r.right - GAP - EDGE >= width) { left = r.right + GAP; top = clampY(middle.y - height / 2); }
    else if (r.left - GAP - EDGE >= width) { left = r.left - GAP - width; top = clampY(middle.y - height / 2); }
    else top = window.innerHeight - height - EDGE; // no room beside the part: at the bottom
    card.style.top = `${clampY(top)}px`;
    card.style.left = `${left}px`;
  }

  function show() {
    const step = steps[index];
    const last = index === steps.length - 1;
    text.textContent = step.text;
    count.textContent = `${index + 1} von ${steps.length}`;
    next.textContent = last ? 'Fertig' : 'Weiter';
    skip.style.display = last ? 'none' : '';
    partsOf(step)[0].scrollIntoView({ block: 'center', inline: 'nearest' });
    place();
    next.focus({ preventScroll: true });
  }

  function go(n) {
    if (n >= steps.length) { end(); return; }
    index = n;
    show();
  }

  const onKey = (e) => { if (e.key === 'Escape') end(); };
  const view = document.getElementById('view');
  // The page may be drawn again or an image may arrive while the tour is open.
  const watcher = new MutationObserver(place);

  function end() {
    window.removeEventListener('resize', place);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('load', place, true);
    watcher.disconnect();
    layer.remove();
    open = false;
    onEnd();
  }

  window.addEventListener('resize', place);
  document.addEventListener('keydown', onKey);
  document.addEventListener('load', place, true);
  if (view) watcher.observe(view, { childList: true });
  document.body.append(layer);
  show();
}
