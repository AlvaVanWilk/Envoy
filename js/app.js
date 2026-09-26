// Start of the app: load the catalogs, build the navigation, show a view.

import { loadCatalog } from './catalog.js';
import { game } from './game.js';
import { sync } from './sync.js';
import { h, icon, replaceChildren } from './ui/dom.js';
import { NAV_ICONS } from './ui/icons.js';
import { renderToday } from './ui/today.js';
import { renderCharacter, unseenDropCount } from './ui/character.js';
import { renderSettings } from './ui/settings.js';

const VIEWS = {
  heute: { label: 'Heute', render: renderToday },
  envoy: { label: 'Envoy', render: renderCharacter },
  einstellungen: { label: 'Einstellungen', render: renderSettings },
};
const DEFAULT_VIEW = 'heute';

const viewRoot = document.getElementById('view');
const navRoot = document.getElementById('nav');

function currentView() {
  const name = location.hash.replace('#', '');
  return VIEWS[name] ? name : DEFAULT_VIEW;
}

function navItem(id, label, { disabled = false, badge = 0 } = {}) {
  const active = currentView() === id;
  if (disabled) {
    // Skilltree: visible, greyed out, no function in phase 1.
    return h('span', { class: 'nav-item disabled', 'aria-disabled': 'true' },
      icon(NAV_ICONS[id]), h('span', { class: 'nav-label' }, label));
  }
  return h('a', { class: `nav-item ${active ? 'active' : ''}`, href: `#${id}`, 'aria-current': active ? 'page' : null },
    icon(NAV_ICONS[id]),
    h('span', { class: 'nav-label' }, label),
    badge > 0 ? h('span', { class: 'nav-badge', 'aria-label': `${badge} neu` }, String(badge)) : null,
    id === 'einstellungen' && sync.enabled() ? h('span', { class: `nav-sync ${syncTone()}` }) : null);
}

function syncTone() {
  if (sync.settings.lastError && sync.settings.lastError !== 'offline') return 'error';
  if (sync.settings.outbox.length > 0 || sync.settings.lastError) return 'pending';
  return 'ok';
}

function renderNav() {
  replaceChildren(navRoot,
    h('span', { class: 'nav-brand' }, 'Envoy'),
    navItem('heute', 'Heute'),
    navItem('envoy', 'Envoy', { badge: unseenDropCount(game) }),
    navItem('skilltree', 'Skilltree', { disabled: true }),
    navItem('einstellungen', 'Einstellungen'));
}

let lastView = null;
function render() {
  const name = currentView();
  replaceChildren(viewRoot, VIEWS[name].render(game));
  renderNav();
  if (name !== lastView) {
    window.scrollTo(0, 0);
    document.title = name === DEFAULT_VIEW ? 'Envoy' : `${VIEWS[name].label} · Envoy`;
    lastView = name;
  }
}

function showError(message) {
  replaceChildren(viewRoot, h('section', { class: 'view' },
    h('div', { class: 'panel error-panel' },
      h('h1', {}, 'Envoy'),
      h('p', {}, message),
      h('button', { class: 'btn primary', onclick: () => location.reload() }, 'Neu laden'))));
}

async function start() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* works without */ });
  }

  let catalog;
  try {
    catalog = await loadCatalog();
  } catch {
    showError('Die Übungsdaten konnten nicht geladen werden.');
    return;
  }

  game.init(catalog);
  game.subscribe(render);
  sync.subscribe(() => {
    renderNav();
    if (currentView() === 'einstellungen') render();
  });
  window.addEventListener('hashchange', render);
  render();
  sync.init();

  // A new day begins at 03:00; check now and then and when the app comes back.
  setInterval(() => game.checkDayChange(), 30 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') game.checkDayChange();
  });
}

start();
