// The map: places, where the hero stands, the stamina bar.
// Tapping a place shows its quests and what the journey costs.

import { h, icon } from './dom.js';
import { PLACE_ICONS, NAV_ICONS, UI_ICONS } from './icons.js';
import { viewHead, purse, staminaBar, coin } from './parts.js';
import { statEmblem } from './stats.js';
import { openSheet, closeSheet } from './sheet.js';
import { questsAt, questState, questStats, successChance, estimateLabel, placeUnlocked, describeCondition } from '../world/quests.js';
import { formatDayShort } from '../days.js';
import { openQuestRun } from './questrun.js';

const ESTIMATE_TEXT = { leicht: 'Leicht', machbar: 'Machbar', fordernd: 'Fordernd', gefährlich: 'Gefährlich' };
let scrollToHero = true;
let lastScroll = null;   // keeps the map where it was when the view is redrawn

function openCount(place, game, c) {
  if (!placeUnlocked(place, c)) return 0;
  return questsAt(place.id, c).filter((q) => questState(q, c).status === 'open').length;
}

export function renderMap(game) {
  const c = game.ctx();
  const here = game.here();

  const canvas = h('div', { class: 'map-canvas' },
    h('img', { class: 'map-image', src: 'assets/welt/karte.jpg', alt: '', draggable: 'false' }),
    game.catalog.places.map((place) => {
      const unlocked = placeUnlocked(place, c);
      const count = openCount(place, game, c);
      return h('button', {
        class: `marker ${unlocked ? '' : 'locked'} ${place.id === here.id ? 'here' : ''}`,
        style: { left: `${place.x}%`, top: `${place.y}%` },
        'aria-label': place.name,
        onclick: () => openPlace(place.id, game),
      },
      coin(PLACE_ICONS[place.typ] || PLACE_ICONS.ort,
        !unlocked ? h('span', { class: 'coin-lock', html: UI_ICONS.lock }) : count > 0 ? h('span', { class: 'coin-badge' }, String(count)) : null),
      h('span', { class: 'marker-name' }, place.name));
    }),
    h('span', { class: 'hero-pin', style: { left: `${here.x}%`, top: `${here.y}%` }, 'aria-hidden': 'true' }));

  const scroller = h('div', { class: 'map-scroll', onscroll: (e) => {
    lastScroll = { left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
  } }, canvas);
  const centre = scrollToHero || !lastScroll;
  scrollToHero = false;
  requestAnimationFrame(() => {
    if (centre) {
      scroller.scrollLeft = Math.max(0, (canvas.offsetWidth * here.x) / 100 - scroller.clientWidth / 2);
      scroller.scrollTop = Math.max(0, (canvas.offsetHeight * here.y) / 100 - scroller.clientHeight / 2);
    } else {
      scroller.scrollLeft = lastScroll.left;
      scroller.scrollTop = lastScroll.top;
    }
  });

  return h('section', { class: 'view world' },
    viewHead('Karte', here.name),
    h('div', { class: 'map-status' }, staminaBar(game.stamina()), purse(c.world.purse)),
    scroller);
}

export function markMapForScroll() {
  scrollToHero = true;
}

function questCard(quest, place, game, c, isHere) {
  const state = questState(quest, c);
  const stamina = game.stamina().value;
  const monster = quest.encounter ? game.catalog.monsterById.get(quest.monsters[0]) : null;
  const chance = state.status === 'open' ? successChance(quest, c) : null;
  const label = chance !== null ? estimateLabel(chance) : null;

  let action = null;
  if (state.status === 'open' && isHere) {
    const enough = stamina >= quest.cost;
    action = h('button', {
      class: 'btn primary small', disabled: !enough,
      onclick: () => {
        const run = game.startQuest(quest.id);
        if (run) openQuestRun(run, game);
      },
    }, enough ? `Aufbrechen · −${quest.cost}` : 'Zu erschöpft');
  }

  let status = null;
  if (state.status === 'done') status = h('span', { class: 'pill' }, quest.encounter ? 'Heute erledigt' : 'Erledigt');
  if (state.status === 'cooldown') status = h('span', { class: 'pill' }, `Wieder ab ${formatDayShort(state.again)}`);
  if (state.status === 'locked') status = h('span', { class: 'quest-missing' }, `Braucht: ${state.missing.join(', ')}`);

  return h('article', { class: 'quest-card' },
    h('div', { class: 'quest-top' },
      monster ? h('span', { class: 'quest-portrait' }, h('img', { src: monster.bild, alt: '' })) : null,
      h('span', { class: 'quest-title' },
        h('span', { class: 'quest-name' }, quest.name),
        h('span', { class: 'quest-kind' }, quest.encounter ? `Begegnung · Stufe ${monster.stufe}` : questKind(quest, place)))),
    quest.text ? h('p', { class: 'quest-text' }, quest.text) : null,
    h('div', { class: 'quest-meta' },
      h('span', { class: 'quest-stats' }, questStats(quest, c).map((id) => statEmblem(id, 'small'))),
      label ? h('span', { class: `estimate ${label.replace('ä', 'ae')}` }, ESTIMATE_TEXT[label]) : null,
      status),
    action ? h('div', { class: 'quest-actions' }, action) : null);
}

function questKind(quest, place) {
  if (place.typ === 'sammeln') return 'Sammeln';
  if (Object.keys(quest.consumes).length > 0) return 'Bauen';
  if (quest.monsters.length > 0) return 'Kampf';
  return 'Prüfung';
}

export function openPlace(placeId, game) {
  const c = game.ctx();
  const place = game.catalog.placeById.get(placeId);
  const isHere = c.world.position === placeId;
  const unlocked = placeUnlocked(place, c);
  const quests = unlocked ? questsAt(placeId, c) : [];

  let travel = null;
  if (!isHere) {
    const cost = game.costTo(placeId);
    const enough = game.stamina().value >= cost;
    travel = h('div', { class: 'travel-row' },
      h('span', {}, unlocked ? `Reise · −${cost} Ausdauer` : `Verschlossen: ${place.unlock.map((u) => describeCondition(u, c)).join(', ')}`),
      unlocked
        ? h('button', {
          class: 'btn primary small', disabled: !enough,
          onclick: () => {
            if (game.travel(placeId)) {
              markMapForScroll();
              openPlace(placeId, game);
            }
          },
        }, enough ? 'Hinreisen' : 'Zu erschöpft')
        : null);
  }

  const homeLink = place.typ === 'lager' && game.unlocked('zuhause')
    ? h('a', { class: 'btn ghost small', href: '#zuhause', onclick: closeSheet }, icon(NAV_ICONS.zuhause), 'Zum Zuhause')
    : null;

  openSheet({
    title: place.name,
    eyebrow: isHere ? `${place.region} · Hier` : place.region,
    className: 'place-sheet',
    content: [
      h('p', { class: 'quest-text' }, place.text),
      travel,
      homeLink,
      quests.length > 0
        ? h('div', { class: 'quest-list' }, quests.map((q) => questCard(q, place, game, c, isHere)))
        : unlocked ? h('p', { class: 'muted' }, 'Heute ist es hier still.') : null,
    ],
  });
}
