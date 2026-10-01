// The map of the Zwischenwelt. Every expedition starts at the camp, goes to
// a place and comes back; it takes real time. A tap on a place fans out what
// can be done there: a small seal for every quest, with its name; a tap on a
// seal opens that quest (questsheet.js). A place with a single quest opens it
// straight away, a place still closed says what opens it.

import { h, icon } from './dom.js';
import { PLACE_ICONS, UI_ICONS, SLOT_ICONS } from './icons.js';
import { versioned } from '../config.js';
import { viewHead, sectionTitle, supplies, staminaBar, materialLimits, resourceIcon } from './parts.js';
import { journeyPanel, heroClass } from './journey.js';
import { openQuest } from './questsheet.js';
import { questsAt, questState, placeUnlocked, describeCondition } from '../world/quests.js';
import { heroPosition } from '../world/expedition.js';
import { camp } from '../world/map.js';

let scrollToHero = true;
let lastScroll = null;   // keeps the map where it was when the view is redrawn
let fanNext = null;      // a place to fan out once the map is drawn (asked for from the Lager page)
let closeFan = null;     // closes the fan that is open, if one is

export function markMapForScroll() {
  scrollToHero = true;
}

// From another page: go to the map and show what there is at a place.
export function showPlace(placeId) {
  fanNext = placeId;
  location.hash = '#abenteuer';
}

function placeMarker(place, game, c) {
  const unlocked = placeUnlocked(place, c);
  const quests = unlocked ? questsAt(place.id, c) : [];
  const states = quests.map((q) => questState(q, c).status);
  const somethingToDo = states.includes('open');
  const spirit = quests.some((q, i) => q.encounter && states[i] === 'open');
  const target = c.world.expedition?.place === place.id;
  const classes = ['place-marker', unlocked ? '' : 'is-locked', somethingToDo ? 'is-open' : '', target ? 'is-target' : ''];
  return h('button', {
    class: classes.join(' '),
    style: { left: `${place.x}%`, top: `${place.y}%` },
    'data-place': place.id,
    'aria-label': `${place.name}${unlocked ? '' : ', verschlossen'}${spirit ? ', Geist gesichtet' : ''}`,
    onclick: (e) => tapPlace(place, game, e.currentTarget),
  },
  h('span', { class: 'seal' },
    icon(PLACE_ICONS[place.typ] || PLACE_ICONS.ort),
    !unlocked ? h('span', { class: 'seal-lock', html: UI_ICONS.lock }) : null,
    spirit ? h('span', { class: 'seal-spirit', html: PLACE_ICONS.wild }) : null),
  h('span', { class: 'place-name' }, place.name));
}

// The way of the running expedition (none for the camp and the Trümmerfeld beside it).
function route(exp, catalog) {
  if (!exp || exp.out === 0) return null;
  const from = camp(catalog);
  const to = catalog.placeById.get(exp.place);
  if (!to) return null;
  return h('span', { class: 'map-route', html:
    `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" vector-effect="non-scaling-stroke"/></svg>` });
}

function legend() {
  const row = (el, text) => h('li', {}, el, h('span', {}, text));
  const seal = (typ, extra = '') => h('span', { class: `seal mini ${extra}` }, icon(PLACE_ICONS[typ]));
  return h('section', { class: 'panel legend' },
    sectionTitle('Legende'),
    h('ul', { class: 'legend-list' },
      row(seal('lager'), 'Das Lager. Hier beginnt und endet jede Expedition.'),
      row(seal('sammeln'), 'Sammelort'),
      row(seal('wild'), 'Wilde Gegend'),
      row(seal('hoehle'), 'Höhle'),
      row(seal('ort'), 'Ort'),
      row(h('span', { class: 'seal mini is-open-demo' }, icon(PLACE_ICONS.ort)), 'Hell umrandet: hier ist etwas zu tun'),
      row(h('span', { class: 'legend-spirit', html: PLACE_ICONS.wild }), 'Heute ist hier ein Geist gesichtet'),
      row(h('span', { class: 'seal mini is-locked-demo' }, icon(UI_ICONS.lock)), 'Noch verschlossen'),
      row(h('span', { class: 'legend-hero', html: UI_ICONS.hero }), 'Der Envoy')));
}

function expeditionSide(game) {
  const exp = game.state.world.expedition;
  return h('section', { class: 'panel' },
    sectionTitle('Expedition'),
    exp
      ? journeyPanel(exp, game)
      : h('p', { class: 'muted' }, 'Der Envoy ist im Lager. Einen Ort antippen, um aufzubrechen.'));
}

export function renderMap(game) {
  const c = game.ctx();
  const exp = c.world.expedition;
  const now = Date.now();
  const pos = heroPosition(exp, now, game.catalog);
  const focus = fanNext ? game.catalog.placeById.get(fanNext) : null;
  fanNext = null;
  closeFan = null;

  const canvas = h('div', { class: 'map-canvas' },
    h('img', { class: 'map-image', src: versioned('assets/welt/karte.jpg'), alt: 'Karte der Zwischenwelt', draggable: 'false' }),
    route(exp, game.catalog),
    game.catalog.places.map((place) => placeMarker(place, game, c)),
    h('span', { class: `hero-token ${heroClass(exp, now)}`, style: { left: `${pos.x}%`, top: `${pos.y}%` }, html: UI_ICONS.hero, 'aria-hidden': 'true' }));

  const scroller = h('div', { class: 'map-scroll', onscroll: (e) => {
    lastScroll = { left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
  } }, canvas);
  const centreOn = focus || (scrollToHero || !lastScroll ? pos : null);
  scrollToHero = false;
  requestAnimationFrame(() => {
    if (centreOn) {
      scroller.scrollLeft = Math.max(0, (canvas.offsetWidth * centreOn.x) / 100 - scroller.clientWidth / 2);
      scroller.scrollTop = Math.max(0, (canvas.offsetHeight * centreOn.y) / 100 - scroller.clientHeight / 2);
    } else {
      scroller.scrollLeft = lastScroll.left;
      scroller.scrollTop = lastScroll.top;
    }
    if (focus) {
      const marker = canvas.querySelector(`.place-marker[data-place="${focus.id}"]`);
      if (marker) tapPlace(focus, game, marker);
    }
  });

  return h('section', { class: 'view world' },
    viewHead('Abenteuer', 'Die Zwischenwelt'),
    h('div', { class: 'world-grid' },
      h('div', { class: 'world-supplies panel' },
        sectionTitle('Vorrat'),
        supplies(c.world.purse, materialLimits(c.world, game.catalog)),
        staminaBar(game.stamina())),
      h('div', { class: 'world-expedition' }, expeditionSide(game)),
      h('div', { class: 'map-frame' }, scroller),
      h('div', { class: 'world-legend' }, legend())));
}

// --- the fan of a place ------------------------------------------------------------

// The seal of a quest in the fan: the spirit, the material, or the kind of quest.
function questSeal(quest, c) {
  if (quest.kind === 'kampf' && quest.monsters.length === 1) {
    const monster = c.catalog.monsterById.get(quest.monsters[0]);
    return h('span', { class: 'seal fan-seal is-portrait' }, h('img', { src: monster.bild, alt: '' }));
  }
  if (quest.gather) return h('span', { class: 'seal fan-seal is-material' }, resourceIcon(quest.gather.material));
  const glyph = quest.facility ? SLOT_ICONS.einrichtung
    : PLACE_ICONS[{ hoehle: 'hoehle', sammeln: 'sammeln', bauen: 'lager' }[quest.kind] || 'ort'];
  return h('span', { class: 'seal fan-seal' }, icon(glyph));
}

const BADGES = { done: UI_ICONS.check, cooldown: UI_ICONS.check, locked: UI_ICONS.lock, running: UI_ICONS.hero };

// What the fan of a place shows: its quests (not those done once and for
// all; they are in the Handbuch), and at the camp the way to the Lager page.
function fanEntries(place, game, c) {
  const entries = questsAt(place.id, c).map((quest) => ({ quest, status: questState(quest, c).status }))
    .filter(({ quest, status }) => status !== 'done' || quest.encounter)
    .map(({ quest, status }) => ({
      name: quest.name,
      status,
      seal: questSeal(quest, c),
      badge: BADGES[status],
      open: () => openQuest(quest, game),
    }));
  if (place.typ === 'lager') {
    entries.push({ name: 'Zum Lager', status: 'link', seal: h('span', { class: 'seal fan-seal' }, icon(UI_ICONS.chevron)), open: () => { location.hash = '#lager'; } });
  }
  return entries;
}

// Positions on an arc beside the marker, in px from its centre: one row
// for every entry, the middle ones a little further out, all inside the map.
function arc(count, side, originY, height) {
  const gap = 50;
  const ys = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * gap);
  const radius = Math.max(56, Math.abs(ys[0]) + 34);
  const top = originY + ys[0] - 28;
  const bottom = originY + ys[count - 1] + 28;
  const shift = top < 0 ? -top : bottom > height ? height - bottom : 0;
  return ys.map((y) => ({ x: side * Math.sqrt(radius * radius - y * y), y: y + shift }));
}

function tapPlace(place, game, marker) {
  const wasOpen = marker.classList.contains('is-fanned');
  closeFan?.();
  if (wasOpen) return;
  const c = game.ctx();

  let entries = [];
  let message = null;
  if (!placeUnlocked(place, c)) message = h('span', {}, icon(UI_ICONS.lock), `Öffnet sich mit: ${place.unlock.map((u) => describeCondition(u, c)).join(', ')}`);
  else {
    entries = fanEntries(place, game, c);
    if (entries.length === 0) message = h('span', {}, questsAt(place.id, c).length > 0 ? 'Hier ist alles getan.' : 'Heute ist es hier still.');
    if (entries.length === 1) { entries[0].open(); return; }
  }
  openFan(place, marker, entries, message);
}

function openFan(place, marker, entries, message) {
  const canvas = marker.parentElement;
  const scroller = canvas.parentElement;
  const side = place.x > 58 ? -1 : 1;
  const originX = (canvas.offsetWidth * place.x) / 100;
  const originY = (canvas.offsetHeight * place.y) / 100;
  const spots = arc(Math.max(1, entries.length), side, originY, canvas.offsetHeight);

  const close = () => {
    if (closeFan !== close) return;
    closeFan = null;
    document.removeEventListener('keydown', onKey);
    marker.classList.remove('is-fanned');
    veil.remove();
    fan.remove();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const veil = h('div', { class: 'map-veil', onclick: close });

  const items = message
    ? [h('p', { class: 'fan-note', style: { '--x': `${side * 40}px`, '--y': '0px', '--i': '0' } }, message)]
    : entries.map((entry, i) => h('button', {
      class: `fan-item ${entry.status}`,
      type: 'button',
      style: { '--x': `${spots[i].x}px`, '--y': `${spots[i].y}px`, '--i': String(i) },
      onclick: () => { close(); entry.open(); },
    }, entry.seal,
    entry.badge ? h('span', { class: 'fan-badge', html: entry.badge }) : null,
    h('span', { class: 'fan-label' }, entry.name)));
  const fan = h('div', { class: 'fan', 'data-side': side > 0 ? 'right' : 'left', style: { left: `${place.x}%`, top: `${place.y}%` } }, items);

  marker.classList.add('is-fanned');
  canvas.append(veil, fan);
  closeFan = close;
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => {
    fan.classList.add('open');
    reveal(scroller, marker, originX, originY, items);
  });
}

// Scrolls the map so that the place and its whole fan can be seen.
function reveal(scroller, marker, originX, originY, items) {
  let left = originX - marker.offsetWidth / 2;
  let right = originX + marker.offsetWidth / 2;
  let top = originY - 30;
  let bottom = originY + 30;
  for (const item of items) {
    const x = originX + parseFloat(item.style.getPropertyValue('--x'));
    const y = originY + parseFloat(item.style.getPropertyValue('--y'));
    const side = item.parentElement.dataset.side === 'left' ? -1 : 1;
    left = Math.min(left, side > 0 ? x - 24 : x - item.offsetWidth);
    right = Math.max(right, side > 0 ? x + item.offsetWidth : x + 24);
    top = Math.min(top, y - 26);
    bottom = Math.max(bottom, y + 26);
  }
  const dx = left < scroller.scrollLeft ? left - scroller.scrollLeft
    : right > scroller.scrollLeft + scroller.clientWidth ? right - scroller.scrollLeft - scroller.clientWidth : 0;
  const dy = top < scroller.scrollTop ? top - scroller.scrollTop
    : bottom > scroller.scrollTop + scroller.clientHeight ? bottom - scroller.scrollTop - scroller.clientHeight : 0;
  if (dx || dy) scroller.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
}
