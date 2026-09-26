// Start of the app: load the catalogs, build the menu, show a view.

import { loadCatalog } from './catalog.js';
import { game } from './game.js';
import { sync } from './sync.js';
import { h, icon, replaceChildren } from './ui/dom.js';
import { NAV_ICONS, UI_ICONS } from './ui/icons.js';
import { renderToday } from './ui/today.js';
import { renderCharacter, unseenDropCount } from './ui/character.js';
import { renderInventory } from './ui/inventory.js';
import { renderMap, markMapForScroll } from './ui/worldmap.js';
import { renderHome } from './ui/home.js';
import { renderTrader } from './ui/trader.js';
import { renderCompendium } from './ui/compendium.js';
import { renderSettings } from './ui/settings.js';

// The menu at the bottom, left to right. `feature` = unlocked in the game.
const DOCK = [
  { id: 'heute', label: 'Heute', render: renderToday },
  { id: 'envoy', label: 'Envoy', render: renderCharacter },
  { id: 'inventar', label: 'Inventar', render: renderInventory },
  { id: 'karte', label: 'Karte', render: renderMap },
  { id: 'zuhause', label: 'Zuhause', render: renderHome, feature: 'zuhause' },
  { id: 'haendler', label: 'Händler', render: renderTrader, feature: 'haendler' },
  { id: 'kompendium', label: 'Kompendium', render: renderCompendium },
  // Skilltree: visible, greyed out, without a function yet.
  { id: 'skilltree', label: 'Skilltree', disabled: true },
];
const VIEWS = Object.fromEntries([...DOCK.filter((d) => d.render), { id: 'einstellungen', label: 'Einstellungen', render: renderSettings }].map((v) => [v.id, v]));
const DEFAULT_VIEW = 'heute';

const viewRoot = document.getElementById('view');
const navRoot = document.getElementById('nav');

function currentView() {
  const name = location.hash.replace('#', '');
  return VIEWS[name] ? name : DEFAULT_VIEW;
}

function dockItem(item) {
  const active = currentView() === item.id;
  if (item.disabled) {
    return h('span', { class: 'dock-item disabled', 'aria-disabled': 'true', 'aria-label': item.label },
      h('span', { class: 'coin' }, icon(NAV_ICONS[item.id])), h('span', { class: 'dock-label' }, item.label));
  }
  const locked = item.feature && !game.unlocked(item.feature);
  const badge = item.id === 'envoy' ? unseenDropCount(game) : 0;
  return h('a', {
    class: `dock-item ${active ? 'active' : ''} ${locked ? 'locked' : ''}`,
    href: `#${item.id}`,
    'aria-label': locked ? `${item.label}, verschlossen` : item.label,
    'aria-current': active ? 'page' : null,
  },
  h('span', { class: 'coin' }, icon(NAV_ICONS[item.id]),
    locked ? h('span', { class: 'coin-lock', html: UI_ICONS.lock }) : null,
    badge > 0 ? h('span', { class: 'coin-badge' }, String(badge)) : null),
  h('span', { class: 'dock-label' }, item.label));
}

function syncTone() {
  if (!sync.enabled()) return null;
  if (sync.settings.lastError && sync.settings.lastError !== 'offline') return 'error';
  if (sync.settings.outbox.length > 0 || sync.settings.lastError) return 'pending';
  return 'ok';
}

function renderNav() {
  replaceChildren(navRoot, h('div', { class: 'dock-row' }, DOCK.map(dockItem)));
  const tone = syncTone();
  const gear = viewRoot.querySelector('.gear .coin');
  if (gear && tone && !gear.querySelector('.coin-dot')) gear.append(h('span', { class: `coin-dot ${tone}` }));
}

let lastView = null;
function render() {
  const name = currentView();
  if (name !== lastView && name === 'karte') markMapForScroll();
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
    showError('Die Spieldaten konnten nicht geladen werden.');
    return;
  }

  game.init(catalog);
  game.subscribe(render);
  sync.subscribe(() => {
    if (currentView() === 'einstellungen') render();
    else renderNav();
  });
  window.addEventListener('hashchange', render);
  render();
  sync.init();

  // A new day begins at 03:00; the stamina bar refills over time.
  setInterval(() => {
    game.checkDayChange();
    if (['karte', 'envoy'].includes(currentView()) && !document.querySelector('.sheet-layer')) render();
  }, 30 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') game.checkDayChange();
  });
}

start();
