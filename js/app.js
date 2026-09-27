// Start of the app: load the catalogs; without a profile show the start
// screen (log in, new account); otherwise build the menu and show a view.

import { loadCatalog } from './catalog.js';
import { game } from './game.js';
import { sync } from './sync.js';
import { store } from './store.js';
import { account } from './account.js';
import { renderWelcome } from './ui/welcome.js';
import { h, replaceChildren } from './ui/dom.js';
import { NAV_ICONS } from './ui/icons.js';
import { shield } from './ui/shield.js';
import { renderOverview } from './ui/dashboard.js';
import { renderToday } from './ui/today.js';
import { renderCharacter, unseenDropCount } from './ui/character.js';
import { renderInventory } from './ui/inventory.js';
import { renderMap, markMapForScroll } from './ui/worldmap.js';
import { renderHome } from './ui/home.js';
import { renderTrader } from './ui/trader.js';
import { renderCompendium } from './ui/compendium.js';
import { renderSettings } from './ui/settings.js';
import { renderCreate } from './ui/create.js';
import { openTalents, talentsOpen } from './ui/talents.js';
import { updateJourneys, showPendingReport } from './ui/journey.js';
import { isSheetOpen } from './ui/sheet.js';

// The menu at the bottom, left to right: the Envoy's own things, the
// overview in the middle, the world. `feature` = unlocked in the game.
const DOCK = [
  { id: 'heute', label: 'Heute', render: renderToday },
  { id: 'envoy', label: 'Envoy', render: renderCharacter },
  { id: 'inventar', label: 'Inventar', render: renderInventory },
  // Talentbaum: shown with a lock; there is nothing behind it yet.
  { id: 'talente', label: 'Talente', action: () => openTalents(game) },
  { id: 'uebersicht', label: 'Übersicht', render: renderOverview, main: true },
  { id: 'karte', label: 'Karte', render: renderMap },
  { id: 'zuhause', label: 'Zuhause', render: renderHome, feature: 'zuhause' },
  { id: 'haendler', label: 'Händler', render: renderTrader, feature: 'haendler' },
  { id: 'kompendium', label: 'Kompendium', render: renderCompendium },
];
// Changing the look of the Envoy later, reached from the settings.
const changeLook = (g) => renderCreate(g, { onDone: () => { location.hash = '#envoy'; }, onCancel: () => { location.hash = '#einstellungen'; } });
const VIEWS = Object.fromEntries([
  ...DOCK.filter((d) => d.render),
  { id: 'einstellungen', label: 'Einstellungen', render: renderSettings },
  { id: 'aussehen', label: 'Aussehen', render: changeLook, keep: true },
].map((v) => [v.id, v]));
const DEFAULT_VIEW = 'uebersicht';
// Views where a finished expedition reports back by itself.
const REPORT_VIEWS = ['uebersicht', 'karte'];

const viewRoot = document.getElementById('view');
const navRoot = document.getElementById('nav');

function currentView() {
  const name = location.hash.replace('#', '');
  return VIEWS[name] ? name : DEFAULT_VIEW;
}

function badgeFor(id) {
  if (id === 'envoy') return unseenDropCount(game) > 0;
  if (id === 'karte') return game.unseenReports().length > 0;
  return false;
}

function dockItem(item) {
  const active = currentView() === item.id;
  const locked = (item.feature && !game.unlocked(item.feature)) || (item.id === 'talente' && !talentsOpen(game));
  const art = shield(NAV_ICONS[item.id], { locked, extra: badgeFor(item.id) ? h('span', { class: 'shield-badge' }) : null });
  const attrs = {
    class: `dock-item ${item.main ? 'is-main' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''}`,
    'aria-label': locked ? `${item.label}, verschlossen` : item.label,
  };
  if (item.action) {
    return h('button', { ...attrs, type: 'button', onclick: item.action }, art, h('span', { class: 'dock-label' }, item.label));
  }
  return h('a', { ...attrs, href: `#${item.id}`, 'aria-current': active ? 'page' : null }, art, h('span', { class: 'dock-label' }, item.label));
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
  const gear = viewRoot.querySelector('.gear .shield');
  if (gear && tone && !gear.querySelector('.coin-dot')) gear.append(h('span', { class: `coin-dot ${tone}` }));
}

// Before there is an Envoy: only the creation, without the menu. The screen
// is built once, so a refresh in between does not reset the choice.
let creating = null;
function renderCreation() {
  if (creating) return;
  document.body.classList.add('creating');
  replaceChildren(navRoot);
  creating = renderCreate(game, { onDone: () => { creating = null; location.hash = `#${DEFAULT_VIEW}`; render(); } });
  replaceChildren(viewRoot, creating);
  document.title = 'Envoy';
  lastView = null;
}

let lastView = null;
function render() {
  if (!game.state.world.envoy) {
    renderCreation();
    return;
  }
  creating = null;
  document.body.classList.remove('creating');
  account.setLabel(game.state.world.envoy.name);
  const name = currentView();
  // A view with choices in progress is not rebuilt while it is open.
  if (VIEWS[name].keep && name === lastView) return;
  if (name !== lastView && name === 'karte') markMapForScroll();
  replaceChildren(viewRoot, VIEWS[name].render(game));
  renderNav();
  if (name !== lastView) {
    window.scrollTo(0, 0);
    document.title = name === DEFAULT_VIEW ? 'Envoy' : `${VIEWS[name].label} · Envoy`;
    lastView = name;
  }
  if (REPORT_VIEWS.includes(name)) setTimeout(() => showPendingReport(game), 350);
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

  const profile = account.active();
  if (!profile) {
    document.body.classList.add('creating');
    replaceChildren(navRoot);
    replaceChildren(viewRoot, renderWelcome());
    return;
  }
  store.useProfile(profile.id);
  sync.load();
  game.init(catalog);
  game.subscribe(render);
  sync.subscribe(() => {
    if (currentView() === 'einstellungen') render();
    else renderNav();
  });
  window.addEventListener('hashchange', render);
  render();
  sync.init();

  // Every second: the expedition bar moves; once the Envoy is back, the
  // state is recalculated and the report appears.
  setInterval(() => {
    if (updateJourneys(game)) game.refresh();
  }, 1000);
  // Every half minute: a new day may have begun (03:00), the stamina bar refills.
  setInterval(() => {
    game.checkDayChange();
    if (['uebersicht', 'karte', 'envoy'].includes(currentView()) && !isSheetOpen()) render();
  }, 30 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      game.checkDayChange();
      if (updateJourneys(game)) game.refresh();
    }
  });
}

start();
