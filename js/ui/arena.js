// The arena: the Ruhmeshalle. The running list of the Abbilder (a tap shows
// one with its clothes, and challenges it when it is near enough), the own
// Abbild (place, Rang, Fleiß, Titel, set up or taken back), what Ruhm buys, and
// the latest fights. The list comes from the server (see arena.js).

import { h } from './dom.js';
import { NAV_ICONS } from './icons.js';
import { viewHead, sectionTitle, lockedView } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { paperdoll } from './paperdoll.js';
import { arena, arenaErrorText } from '../arena.js';
import { store } from '../store.js';
import { titleOwned, rankOf } from '../world/arena.js';
import { ARENA_REACH, TITLES } from '../config.js';
import { abbildPortrait, titleText, nameLine, ruhmAmount } from './arenaparts.js';
import { challengePart } from './arenafight.js';
import { shopPanel, ranksPanel } from './arenashop.js';

const REFRESH_MS = 60 * 1000;
let loadedAt = 0;

// Fights the own Abbild had while nobody looked: shown as new once.
export function newFights(game) {
  const seen = new Set(store.loadUi().seenFights || []);
  return game.state.world.arena.fights.filter((f) => f.rolle === 'verteidigt' && !seen.has(f.id));
}

function markFightsSeen(game) {
  const fresh = newFights(game);
  if (fresh.length === 0) return;
  const ui = store.loadUi();
  ui.seenFights = [...(ui.seenFights || []), ...fresh.map((f) => f.id)].slice(-80);
  store.saveUi(ui);
}

export function renderArena(game) {
  if (!arena.open()) return lockedView(NAV_ICONS.arena, 'Arena', 'Öffnet sich mit dem Lagerfeuer.');
  if (!arena.hasAccount()) {
    return lockedView(NAV_ICONS.arena, 'Arena', 'Die Arena braucht ein Konto: Dort stehen die Abbilder der anderen. Ein Konto lässt sich in den Einstellungen erstellen.');
  }
  if (!arena.busy && Date.now() - loadedAt > REFRESH_MS) {
    loadedAt = Date.now();
    arena.load();
  }
  const view = h('section', { class: 'view arena' },
    viewHead('Arena', 'Die Ruhmeshalle'),
    h('div', { class: 'arena-grid' },
      ownPanel(game, arena.hall),
      listPanel(game, arena.hall),
      shopPanel(game),
      ranksPanel(game),
      fightsPanel(game)));
  setTimeout(() => markFightsSeen(game), 4000);
  return view;
}

// While the hall is not there yet: why.
function hallState() {
  if (arena.error) return arenaErrorText(arena.error);
  return 'Die Halle wird geöffnet.';
}

// --- the own Abbild -----------------------------------------------------------

function ownPanel(game, hall) {
  const { world } = game.state;
  const me = hall?.me;
  const standing = Boolean(me?.aktiv && me.platz);
  let place = hallState();
  if (hall) place = standing ? `Platz ${me.platz} von ${hall.list.length}` : 'Noch nicht in der Arena.';
  return h('section', { class: 'panel arena-own' },
    sectionTitle('Dein Abbild', ruhmAmount(world.arena.ruhm)),
    h('div', { class: 'arena-own-body' },
      h('div', { class: 'arena-own-figure' }, paperdoll(world.equipped, world, game.catalog, { className: 'arena-doll' })),
      h('div', { class: 'arena-own-info' },
        nameLine(world.envoy.name, world.arena.titel),
        h('p', { class: `arena-place ${standing ? 'is-standing' : ''}` }, place),
        h('p', { class: 'arena-rank' }, `Rang: ${rankOf(world.arena.earned).rank.name}`),
        titlePicker(game),
        hall ? joinButton(standing) : null)));
}

function titlePicker(game) {
  const own = game.state.world.arena;
  const owned = TITLES.filter((t) => titleOwned(own, t.id)).map((t) => t.id);
  if (owned.length === 0) return null;
  return h('div', { class: 'arena-titles' },
    h('p', { class: 'arena-label' }, 'Titel'),
    h('div', { class: 'chips wrap' }, ['', ...owned].map((id) => h('button', {
      class: `chip${id === own.titel ? ' active' : ''}`, type: 'button', 'aria-pressed': String(id === own.titel),
      onclick: () => game.setAbbild({ titel: id }),
    }, id ? titleText(id) : 'ohne'))));
}

function joinButton(standing) {
  if (!standing) {
    return h('button', { class: 'btn primary', disabled: arena.busy, onclick: () => arena.join().catch((e) => toast(arenaErrorText(e))) }, 'Abbild aufstellen');
  }
  return h('button', { class: 'btn ghost small', onclick: confirmLeave }, 'Aus der Arena zurückziehen');
}

function confirmLeave() {
  openSheet({
    title: 'Zurückziehen',
    content: [
      h('p', {}, 'Dein Abbild verlässt die Liste. Stellst du es wieder auf, beginnt es am Ende.'),
      h('button', { class: 'btn primary', onclick: () => { closeSheet(); arena.leave().catch((e) => toast(arenaErrorText(e))); } }, 'Zurückziehen'),
    ],
  });
}

// --- the list -------------------------------------------------------------------

function listPanel(game, hall) {
  let body;
  if (!hall) body = h('p', { class: 'muted' }, hallState());
  else if (hall.list.length === 0) body = h('p', { class: 'muted' }, 'Noch steht kein Abbild in der Halle.');
  else body = h('ol', { class: 'arena-list' }, hall.list.map((x) => h('li', {}, listRow(x, game))));
  const standing = Boolean(hall?.me?.aktiv && hall.me.platz);
  return h('section', { class: 'panel arena-ranks' },
    sectionTitle('Rangliste'),
    body,
    standing ? h('p', { class: 'arena-hint' }, `Herausfordern lassen sich die Abbilder bis ${ARENA_REACH} Plätze über und unter deinem, jedes einmal am Tag. Stark macht im Kampf, wie oft das Tageswerk in den letzten vier Wochen erledigt wurde, nicht wie leicht es fällt. Schaden, Treffer und Ausweichen der Kleidung helfen mit.`) : null);
}

function listRow(x, game) {
  let mark = null;
  if (x.ich) mark = h('span', { class: 'arena-mark is-me' }, 'Du');
  else if (x.erreichbar) mark = h('span', { class: `arena-mark ${x.heute ? 'is-done' : 'is-open'}` }, x.heute ? 'heute schon' : 'herausfordern');
  return h('button', { class: `arena-row${x.ich ? ' is-me' : ''}${x.erreichbar && !x.heute ? ' is-reachable' : ''}`, onclick: () => openAbbild(x, game) },
    h('span', { class: 'arena-no' }, String(x.platz)),
    abbildPortrait(x),
    nameLine(x.name, x.titel, 'arena-row-name'),
    mark);
}

// An Abbild with its clothes as worn; near enough, it can be challenged.
function openAbbild(x, game) {
  const items = {};
  const equipped = {};
  for (const w of x.worn || []) {
    const item = game.catalog.itemById.get(w.id);
    if (!item) continue;
    items[item.slot] = { inst: item.slot, kind: 'item', id: w.id, ...(w.farbe ? { farbe: w.farbe } : {}) };
    equipped[item.slot] = item.slot;
  }
  const figure = paperdoll(equipped, { items }, game.catalog, { className: 'arena-doll', envoy: x });
  const sheet = openSheet({
    title: x.name,
    eyebrow: `Platz ${x.platz}`,
    className: 'arena-sheet',
    content: [
      titleText(x.titel) ? h('p', { class: 'arena-title-line' }, titleText(x.titel)) : null,
      h('div', { class: 'arena-sheet-figure' }, figure),
      x.ich ? h('p', { class: 'muted' }, 'Dein Abbild, so wie die anderen es sehen.') : null,
      !x.ich && x.erreichbar && x.heute ? h('p', { class: 'muted' }, 'Heute schon herausgefordert.') : null,
      !x.ich && !x.erreichbar && arena.hall?.me?.platz ? h('p', { class: 'muted' }, 'Zu weit weg, um es herauszufordern.') : null,
    ],
  });
  if (!x.ich && x.erreichbar && !x.heute) sheet.panel.querySelector('.sheet-body').append(challengePart(x, game, sheet.panel));
}

// --- the latest fights ------------------------------------------------------------

const RESULT_WORDS = {
  fordert: { sieg: 'Sieg', remis: 'Unentschieden', niederlage: 'Unterlegen' },
  verteidigt: { sieg: 'Gehalten', remis: 'Unentschieden', niederlage: 'Unterlegen' },
};

export function fightLine(f, name) {
  if (f.rolle === 'fordert') return `${name} hat ${f.gegner.name} herausgefordert.`;
  return `${f.gegner.name} hat dein Abbild herausgefordert.`;
}

function placeChange(platz) {
  const [before, after] = platz || [];
  if (!before || !after || before === after) return null;
  return `Platz ${before} → ${after}`;
}

function fightsPanel(game) {
  const { world } = game.state;
  const fresh = new Set(newFights(game).map((f) => f.id));
  const fights = [...world.arena.fights].reverse().slice(0, 12);
  return h('section', { class: 'panel arena-fights' },
    sectionTitle('Kämpfe'),
    fights.length === 0
      ? h('p', { class: 'muted' }, 'Noch keine Kämpfe.')
      : h('ul', { class: 'arena-fight-list' }, fights.map((f) => h('li', { class: `arena-fight-row is-${f.ergebnis}${fresh.has(f.id) ? ' is-new' : ''}` },
        abbildPortrait(f.gegner, 'arena-pic small'),
        h('span', { class: 'arena-fight-main' },
          h('span', { class: 'arena-fight-text' }, fightLine(f, world.envoy.name)),
          h('span', { class: 'arena-fight-meta' },
            h('span', { class: 'arena-result' }, RESULT_WORDS[f.rolle][f.ergebnis]),
            placeChange(f.platz) ? h('span', {}, placeChange(f.platz)) : null)),
        ruhmAmount(f.ruhm, '+')))));
}
