// Start of the app: load the catalogs; without a profile show the start
// screen (log in, new account); otherwise build the menu, the bar at the
// top and show a view.

import { loadCatalog } from './catalog.js';
import { game } from './game.js';
import { sync } from './sync.js';
import { store } from './store.js';
import { account } from './account.js';
import { renderWelcome } from './ui/welcome.js';
import { h, replaceChildren, keepPictures } from './ui/dom.js';
import { NAV_ICONS } from './ui/icons.js';
import { shield } from './ui/shield.js';
import { renderCamp } from './ui/camp.js';
import { renderToday } from './ui/today.js';
import { renderCharacter, unseenDropCount } from './ui/character.js';
import { renderInventory } from './ui/inventory.js';
import { renderMap, markMapForScroll } from './ui/worldmap.js';
import { renderTrader } from './ui/trader.js';
import { renderHandbook, handbookBadge } from './ui/handbook.js';
import { renderTopbar } from './ui/topbar.js';
import { renderSettings } from './ui/settings.js';
import { renderCreate } from './ui/create.js';
import { renderTalents, talentsOpen } from './ui/talents.js';
import { renderArena, newFights } from './ui/arena.js';
import { renderDepths } from './ui/depths.js';
import { arena } from './arena.js';
import { updateJourneys, showPendingReport } from './ui/journey.js';
import { isSheetOpen } from './ui/sheet.js';
import { startTourIfNew } from './ui/tours.js';
import { IS_TEST, APP_NAME } from './stage.js';
import { mountTestTools } from './ui/testtools.js';
import { updateTripSign } from './ui/tripsign.js';
import { showGates, markNewsSeen, gateOpen } from './ui/gate.js';
import { installTips } from './ui/tips.js';

// The menu at the bottom, left to right. The camp in the middle is the
// start. `feature` = unlocked in the game.
const DOCK = [
  { id: 'abenteuer', label: 'Abenteuer', render: renderMap },
  // Talentbaum: shown with a lock; its page only tells how far away it is.
  { id: 'talente', label: 'Talentbaum', render: renderTalents },
  { id: 'lager', label: 'Lager', render: renderCamp, main: true },
  { id: 'haendler', label: 'Händler', render: renderTrader, feature: 'haendler' },
  { id: 'handbuch', label: 'Handbuch', render: renderHandbook },
];
// Changing the look of the Envoy later, reached from the settings.
const changeLook = (g) => renderCreate(g, { onDone: () => { location.hash = '#envoy'; }, onCancel: () => { location.hash = '#einstellungen'; } });
// topbar: false = the bar at the top is not shown (while changing the look).
const VIEWS = Object.fromEntries([
  ...DOCK.filter((d) => d.render),
  { id: 'tageswerk', label: 'Tageswerk', render: renderToday },
  { id: 'envoy', label: 'Envoy', render: renderCharacter },
  { id: 'inventar', label: 'Inventar', render: renderInventory },
  { id: 'einstellungen', label: 'Einstellungen', render: renderSettings },
  { id: 'arena', label: 'Arena', render: renderArena },
  { id: 'tiefen', label: 'Die Tiefen', render: renderDepths },
  { id: 'aussehen', label: 'Aussehen', render: changeLook, keep: true, topbar: false },
].map((v) => [v.id, v]));
// Names of views from earlier versions, so old links and bookmarks still work.
const OLD_NAMES = { heute: 'tageswerk', uebersicht: 'lager', karte: 'abenteuer', zuhause: 'lager', kompendium: 'handbuch' };
const DEFAULT_VIEW = 'lager';
// Views where a finished expedition reports back by itself.
const REPORT_VIEWS = ['lager', 'abenteuer'];

const viewRoot = document.getElementById('view');
const navRoot = document.getElementById('nav');
const topRoot = document.getElementById('topbar');

function currentView() {
  const hash = location.hash.replace('#', '');
  const name = OLD_NAMES[hash] || hash.split('/')[0];
  return VIEWS[name] ? name : DEFAULT_VIEW;
}

function badgeFor(id) {
  if (id === 'abenteuer') return game.unseenReports().length > 0 || newFights(game).length > 0;
  if (id === 'handbuch') return handbookBadge(game);
  return false;
}

function dockItem(item) {
  // The arena and the Tiefen are reached from the Abenteuer page.
  const active = currentView() === item.id || (item.id === 'abenteuer' && ['arena', 'tiefen'].includes(currentView()));
  const locked = (item.feature && !game.unlocked(item.feature)) || (item.id === 'talente' && !talentsOpen(game));
  const art = shield(NAV_ICONS[item.id], { locked });
  const attrs = {
    class: `dock-item ${item.main ? 'is-main' : ''} ${active ? 'active' : ''} ${locked ? 'locked' : ''} ${badgeFor(item.id) ? 'news' : ''}`,
    'aria-label': locked ? `${item.label}, verschlossen` : item.label,
  };
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
  const name = currentView();
  const withBar = VIEWS[name].topbar !== false;
  document.body.classList.toggle('has-topbar', withBar);
  if (withBar) {
    const bar = renderTopbar(game, name, syncTone(), { envoyBadge: unseenDropCount(game) > 0 });
    keepPictures(topRoot, bar);
    replaceChildren(topRoot, bar);
  }
  else replaceChildren(topRoot);
}

// Before there is an Envoy: only the creation, without the menu. The screen
// is built once, so a refresh in between does not reset the choice. A new
// Envoy starts on its own page (with the tour); later starts are at the camp.
let creating = null;
function renderCreation() {
  if (creating) return;
  document.body.classList.add('creating');
  document.body.classList.remove('has-topbar');
  replaceChildren(navRoot);
  replaceChildren(topRoot);
  // whoever creates an Envoy is new here and does not need the news of this version
  markNewsSeen();
  creating = renderCreate(game, { onDone: () => { creating = null; location.hash = '#envoy'; render(); } });
  replaceChildren(viewRoot, creating);
  document.title = APP_NAME;
  lastView = null;
}

// A bonus that only lasts a while ends by itself: draw once more when it is over.
let bonusTimer = 0;
function scheduleBonusEnd() {
  clearTimeout(bonusTimer);
  const ends = game.bonuses().map((b) => b.end);
  if (ends.length > 0) bonusTimer = setTimeout(() => game.refresh(), Math.max(1000, Math.min(...ends) - Date.now() + 500));
}

let lastView = null;
let tourWaiting = null;
function render() {
  if (!game.state.world.envoy) {
    renderCreation();
    return;
  }
  creating = null;
  document.body.classList.remove('creating');
  account.setLabel(game.state.world.envoy.name);
  const name = currentView();
  document.body.dataset.view = name;
  // A view with choices in progress is not rebuilt while it is open.
  if (VIEWS[name].keep && name === lastView) return;
  if (name !== lastView && name === 'abenteuer') markMapForScroll();
  const view = VIEWS[name].render(game);
  keepPictures(viewRoot, view);
  replaceChildren(viewRoot, view);
  renderNav();
  updateTripSign(game);
  showGates(game);
  // a tour of the page begins on the first visit; while something lies over
  // the whole screen (news, the age), it waits for the next drawing
  const tourHere = ['envoy', 'tageswerk', 'abenteuer', 'lager'].includes(name) && (name !== 'lager' || game.state.world.camp.stage >= 1);
  if (tourHere && (name !== lastView || tourWaiting === name)) {
    tourWaiting = gateOpen() ? name : null;
    if (!tourWaiting) startTourIfNew(name, game, () => currentView() === name);
  }
  if (name !== lastView) {
    window.scrollTo(0, 0);
    document.title = name === DEFAULT_VIEW ? APP_NAME : `${VIEWS[name].label} · ${APP_NAME}`;
    lastView = name;
  }
  if (REPORT_VIEWS.includes(name)) setTimeout(() => showPendingReport(game), 350);
  scheduleBonusEnd();
}

function showError(message) {
  replaceChildren(viewRoot, h('section', { class: 'view' },
    h('div', { class: 'panel error-panel' },
      h('h1', {}, 'Envoy'),
      h('p', {}, message),
      h('button', { class: 'btn primary', onclick: () => location.reload() }, 'Neu laden'))));
}

async function start() {
  installTips();
  if (IS_TEST) {
    document.title = APP_NAME;
    document.body.classList.add('stage-test');
    mountTestTools(game);
  }
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
    replaceChildren(topRoot);
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
  arena.subscribe(() => {
    if (currentView() === 'arena' && !isSheetOpen()) render();
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
    if (['lager', 'abenteuer', 'envoy'].includes(currentView()) && !isSheetOpen()) render();
  }, 30 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      game.checkDayChange();
      if (updateJourneys(game)) game.refresh();
    }
  });
}

start();
