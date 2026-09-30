// The Handbuch: a book with orange tabs along its upper edge and folded
// corners at the bottom to turn the pages (swiping works too). Turning on
// from the last page of a tab goes to the next tab, as in a real book.
// A link such as #handbuch/anleitung/tageswerk opens a certain page.

import { h, replaceChildren } from './dom.js';
import { guidePages, newChapters, hasUnannouncedChapters, announceChapters } from './guide.js';
import { daysPages, questPages, achievementPages } from './logbook.js';
import { compendiumPages } from './compendium.js';
import { isSheetOpen } from './sheet.js';

// pages(game, goTo, room): room is the size of a page body, so that long
// lists can be split to what fits.
const TABS = [
  { id: 'anleitung', name: 'Anleitung', pages: (game) => guidePages(game) },
  { id: 'tageswerk', name: 'Tageswerk', pages: (game, goTo, room) => daysPages(game, room) },
  { id: 'quests', name: 'Quests', pages: (game, goTo, room) => questPages(game, room) },
  { id: 'kompendium', name: 'Kompendium', pages: (game, goTo, room) => compendiumPages(game, goTo, room) },
  { id: 'erfolge', name: 'Erfolge', pages: (game, goTo, room) => achievementPages(game, room) },
];

// Where the book is open; kept while the app is open.
const at = { tab: 'anleitung', page: 0 };
const SWIPE = 60;

// What a page body holds (px). The book fills the window, so the room comes
// from the window; the first guess is refined once the book is on screen.
const roomGuess = () => ({ width: Math.min(window.innerWidth, 860) - 80, height: Math.max(200, window.innerHeight - 430) });

// #handbuch/<tab>/<page id>: open there, then tidy the address.
function followLink(game, goTo, room) {
  const [, tabId, pageId] = location.hash.replace('#', '').split('/');
  if (!tabId) return;
  const tab = TABS.find((t) => t.id === tabId);
  if (tab) {
    at.tab = tab.id;
    const index = tab.pages(game, goTo, room).findIndex((p) => p.id === pageId);
    at.page = Math.max(0, index);
  }
  history.replaceState(null, '', '#handbuch');
}

// The menu point glows until the Handbuch has been opened.
export function handbookBadge(game) {
  return hasUnannouncedChapters(game);
}

export function renderHandbook(game) {
  const root = h('section', { class: 'view handbook' });
  announceChapters(game);
  let room = roomGuess();

  const pagesOf = (tabId) => TABS.find((t) => t.id === tabId).pages(game, goTo, room);
  function goTo(pageId) {
    at.page = Math.max(0, pagesOf(at.tab).findIndex((p) => p.id === pageId));
    draw(1);
  }
  function turn(step) {
    const count = pagesOf(at.tab).length;
    const next = at.page + step;
    if (next >= 0 && next < count) {
      at.page = next;
    } else {
      const t = TABS.findIndex((x) => x.id === at.tab) + step;
      if (t < 0 || t >= TABS.length) return;
      at.tab = TABS[t].id;
      at.page = step > 0 ? 0 : pagesOf(at.tab).length - 1;
    }
    draw(step);
  }
  function openTab(id) {
    if (id === at.tab) return;
    const step = TABS.findIndex((x) => x.id === id) > TABS.findIndex((x) => x.id === at.tab) ? 1 : -1;
    at.tab = id;
    at.page = 0;
    draw(step);
  }

  function draw(direction = 0) {
    const tabIndex = TABS.findIndex((x) => x.id === at.tab);
    const pages = pagesOf(at.tab);
    at.page = Math.min(at.page, pages.length - 1);
    const page = pages[at.page];
    const first = tabIndex === 0 && at.page === 0;
    const last = tabIndex === TABS.length - 1 && at.page === pages.length - 1;
    const fresh = newChapters(game).length > 0;

    const sheet = h('article', { class: `book-page ${direction > 0 ? 'turn-next' : direction < 0 ? 'turn-prev' : ''}`, 'aria-live': 'polite' },
      h('header', { class: 'page-head' },
        h('p', { class: 'page-eyebrow' }, TABS[tabIndex].name),
        h('h2', { class: 'page-title' }, page.title, page.isNew ? h('span', { class: 'page-new' }, 'Neu') : null)),
      h('div', { class: 'page-body' }, page.body()),
      h('footer', { class: 'page-foot' },
        h('button', { class: 'page-corner prev', type: 'button', 'aria-label': 'Vorige Seite', disabled: first, onclick: () => turn(-1) }),
        h('span', { class: 'page-number' }, `${at.page + 1} / ${pages.length}`),
        h('button', { class: 'page-corner next', type: 'button', 'aria-label': 'Nächste Seite', disabled: last, onclick: () => turn(1) })));

    let startX = null;
    let startY = null;
    sheet.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) > SWIPE && Math.abs(dy) < Math.abs(dx) / 2) turn(dx < 0 ? 1 : -1);
    });

    replaceChildren(root, h('div', { class: 'book' },
      h('nav', { class: 'book-tabs', role: 'tablist', 'aria-label': 'Handbuch' }, TABS.map((t) => h('button', {
        class: `book-tab ${t.id === at.tab ? 'active' : ''}`, role: 'tab', type: 'button',
        'aria-selected': String(t.id === at.tab),
        onclick: () => openTab(t.id),
      }, t.name, t.id === 'anleitung' && fresh ? h('span', { class: 'book-tab-dot', 'aria-label': 'Neu' }) : null))),
      sheet));
    page.onShow?.();
    if (direction !== 0) window.scrollTo(0, 0);
  }

  // Measures the page body and lays the pages out again if the room is not
  // what they were made for (first look, turning the iPad).
  function fit() {
    const body = root.querySelector('.page-body');
    if (!root.isConnected || !body) return;
    const next = { width: body.clientWidth, height: body.clientHeight };
    if (Math.abs(next.height - room.height) < 6 && Math.abs(next.width - room.width) < 6) return;
    room = next;
    draw();
  }
  const onResize = () => (root.isConnected ? fit() : window.removeEventListener('resize', onResize));
  window.addEventListener('resize', onResize);

  keys.turn = turn;
  followLink(game, goTo, room);
  draw();
  requestAnimationFrame(fit);
  return root;
}

// The arrow keys turn the pages while the book is open.
const keys = { turn: null };
document.addEventListener('keydown', (e) => {
  if (!location.hash.startsWith('#handbuch') || isSheetOpen() || !keys.turn) return;
  if (e.target.closest?.('input, textarea')) return;
  if (e.key === 'ArrowRight') keys.turn(1);
  if (e.key === 'ArrowLeft') keys.turn(-1);
});
