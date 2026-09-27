// The map of the Zwischenwelt. Every expedition starts at the camp, goes to
// a place and comes back; it takes real time. Tapping a place shows what
// can be done there, how long it takes and what it brings.

import { h, icon } from './dom.js';
import { PLACE_ICONS, UI_ICONS, NAV_ICONS } from './icons.js';
import { CURRENCY, versioned } from '../config.js';
import {
  viewHead, sectionTitle, supplies, staminaBar, resource, formatMinutes, MATERIAL_KEYS,
} from './parts.js';
import { statEmblem, statInfo } from './stats.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { journeyPanel } from './journey.js';
import { questsAt, questState, placeUnlocked, conditionMet, describeCondition, KIND_NAMES } from '../world/quests.js';
import { heroPosition } from '../world/expedition.js';
import { camp } from '../world/map.js';
import { rewardRange } from '../world/run.js';
import { formatDayShort } from '../days.js';

let scrollToHero = true;
let lastScroll = null;   // keeps the map where it was when the view is redrawn

export function markMapForScroll() {
  scrollToHero = true;
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
    'aria-label': `${place.name}${unlocked ? '' : ', verschlossen'}${spirit ? ', Geist gesichtet' : ''}`,
    onclick: () => openPlace(place.id, game),
  },
  h('span', { class: 'seal' },
    icon(PLACE_ICONS[place.typ] || PLACE_ICONS.ort),
    !unlocked ? h('span', { class: 'seal-lock', html: UI_ICONS.lock }) : null,
    spirit ? h('span', { class: 'seal-spirit', html: PLACE_ICONS.wild }) : null),
  h('span', { class: 'place-name' }, place.name));
}

function route(exp, catalog) {
  if (!exp) return null;
  const from = camp(catalog);
  const to = catalog.placeById.get(exp.place);
  if (!to || to.id === from.id) return null;
  return h('span', { class: 'map-route', html:
    `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" vector-effect="non-scaling-stroke"/></svg>` });
}

function legend() {
  const row = (el, text) => h('li', {}, el, h('span', {}, text));
  const seal = (typ, extra = '') => h('span', { class: `seal mini ${extra}` }, icon(PLACE_ICONS[typ]));
  return h('section', { class: 'panel legend' },
    sectionTitle('Legende'),
    h('ul', { class: 'legend-list' },
      row(seal('lager'), 'Lager. Hier beginnt und endet jede Expedition.'),
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
  const pos = heroPosition(exp, Date.now(), game.catalog);

  const canvas = h('div', { class: 'map-canvas' },
    h('img', { class: 'map-image', src: versioned('assets/welt/karte.jpg'), alt: 'Karte der Zwischenwelt', draggable: 'false' }),
    route(exp, game.catalog),
    game.catalog.places.map((place) => placeMarker(place, game, c)),
    h('span', { class: 'hero-token', style: { left: `${pos.x}%`, top: `${pos.y}%` }, html: UI_ICONS.hero, 'aria-hidden': 'true' }));

  const scroller = h('div', { class: 'map-scroll', onscroll: (e) => {
    lastScroll = { left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
  } }, canvas);
  const centre = scrollToHero || !lastScroll;
  scrollToHero = false;
  requestAnimationFrame(() => {
    if (centre) {
      scroller.scrollLeft = Math.max(0, (canvas.offsetWidth * pos.x) / 100 - scroller.clientWidth / 2);
      scroller.scrollTop = Math.max(0, (canvas.offsetHeight * pos.y) / 100 - scroller.clientHeight / 2);
    } else {
      scroller.scrollLeft = lastScroll.left;
      scroller.scrollTop = lastScroll.top;
    }
  });

  return h('section', { class: 'view world' },
    viewHead('Karte', 'Die Zwischenwelt'),
    h('div', { class: 'world-grid' },
      h('div', { class: 'world-supplies panel' },
        sectionTitle('Vorrat'),
        supplies(c.world.purse),
        staminaBar(game.stamina())),
      h('div', { class: 'world-expedition' }, expeditionSide(game)),
      h('div', { class: 'map-frame' }, scroller),
      h('div', { class: 'world-legend' }, legend())));
}

// --- a place and its quests ------------------------------------------------

const range = ([a, b]) => (a === b ? String(a) : `${a}–${b}`);

function rewardText(quest, c) {
  const r = rewardRange(quest, c);
  const parts = [];
  if (r) {
    for (const key of MATERIAL_KEYS) if (r[key][1] > 0) parts.push(resource(key, range(r[key])));
  }
  const names = [
    ...quest.reward?.items.map((id) => c.catalog.itemById.get(id)?.name) || [],
    ...quest.reward?.furniture.map((id) => c.catalog.furnitureById.get(id)?.name) || [],
  ].filter(Boolean);
  for (const name of names) parts.push(h('span', { class: 'pill' }, name));
  for (const f of quest.reward?.unlocks || []) parts.push(h('span', { class: 'pill' }, f === 'zuhause' ? 'Zuhause' : f === 'haendler' ? 'Händler' : f));
  if (quest.reward?.rest) parts.push(h('span', { class: 'pill' }, 'Ausdauerleiste voll'));
  return parts;
}

function statList(ids) {
  return h('span', { class: 'stat-list' }, ids.map((id) => h('span', { class: 'stat-tag', 'data-stat': id }, statEmblem(id, 'tiny'), statInfo(id).name)));
}

function fact(label, ...value) {
  return h('div', { class: 'fact' }, h('dt', {}, label), h('dd', {}, ...value));
}

function durationText(plan) {
  const total = plan.out + plan.act + plan.back;
  const parts = plan.out > 0
    ? `${plan.out} hin · ${plan.act} vor Ort · ${plan.back} zurück`
    : `${plan.act} vor Ort`;
  return [h('strong', {}, formatMinutes(total)), h('span', { class: 'muted' }, ` · ${parts}`)];
}

function startButton(quest, plan, game, state) {
  const st = game.stamina();
  const away = game.state.world.expedition;
  if (state.status === 'running') return h('span', { class: 'quest-note' }, 'Der Envoy ist gerade dort.');
  if (state.status === 'done') return h('span', { class: 'quest-note' }, quest.encounter ? 'Heute erledigt.' : 'Erledigt.');
  if (state.status === 'cooldown') return h('span', { class: 'quest-note' }, `Wieder ab ${formatDayShort(state.again)}.`);
  if (state.status === 'locked') return null;
  if (away) return h('button', { class: 'btn ghost small', disabled: true }, 'Der Envoy ist unterwegs');
  if (plan.cost > st.max) return h('span', { class: 'quest-note' }, 'Die Ausdauerleiste ist dafür noch zu kurz. Sie wächst mit dem Wert Ausdauer.');
  if (plan.cost > st.value) {
    const hours = (plan.cost - st.value) / st.perHour;
    return h('button', { class: 'btn ghost small', disabled: true }, `Genug Ausdauer in ${formatMinutes(Math.ceil(hours * 60))}`);
  }
  return h('button', {
    class: 'btn primary',
    onclick: () => {
      const event = game.startExpedition(quest.id);
      if (!event) return;
      closeSheet();
      markMapForScroll();
      toast(`Aufgebrochen: ${quest.name}`);
    },
  }, 'Aufbrechen');
}

function questCard(quest, game, c) {
  const state = questState(quest, c);
  const plan = game.preview(quest.id);
  const monsters = quest.monsters.map((id) => c.catalog.monsterById.get(id)).filter(Boolean);
  const kind = quest.encounter ? 'Begegnung' : KIND_NAMES[quest.kind] || quest.kind;
  const finished = state.status === 'done' || state.status === 'cooldown';

  const facts = [];
  if (!finished) {
    const conditions = quest.conditions.map((cond) => h('span', { class: `cond ${conditionMet(cond, c) ? 'met' : 'unmet'}` },
      conditionMet(cond, c) ? icon(UI_ICONS.check) : icon(UI_ICONS.lock), describeCondition(cond, c)));
    if (conditions.length > 0) facts.push(fact('Voraussetzung', h('span', { class: 'cond-list' }, conditions)));
    const needs = Object.entries(quest.consumes);
    if (needs.length > 0) {
      facts.push(fact('Braucht', h('span', { class: 'res-list' }, needs.map(([k, v]) =>
        resource(k, `${Math.min(c.world.purse[k] || 0, v)}/${v}`, { lacking: (c.world.purse[k] || 0) < v })))));
    }
    if (quest.kind === 'kampf') {
      const m = monsters[0];
      facts.push(fact('Geist', h('span', { class: 'foe' }, h('span', { class: 'portrait small' }, h('img', { src: m.bild, alt: '' })), `${m.name} · Stufe ${m.stufe}`)));
    }
    if (quest.kind === 'hoehle') {
      const reach = plan.outcome.fights.filter((f) => f.result !== 'driven').length;
      facts.push(fact('Geister', h('span', {}, `${monsters.length} nacheinander. Mit den jetzigen Werten schafft der Envoy etwa ${reach} davon.`)));
    }
    facts.push(fact('Dauer', ...durationText(plan)));
    facts.push(fact('Ausdauer', h('strong', {}, String(plan.cost))));
    if (monsters.length === 0 && quest.speedStats.length > 0) facts.push(fact('Kürzer mit', statList(quest.speedStats)));
    if (quest.yieldStats.length > 0) facts.push(fact('Mehr Ertrag mit', statList(quest.yieldStats)));
    if (monsters.length > 0) facts.push(fact('Im Kampf', h('span', { class: 'muted' }, 'Kraft trifft härter, Ausdauer hält länger, Beweglichkeit weicht aus, Gelassenheit beruhigt.')));
    const reward = rewardText(quest, c);
    if (reward.length > 0) facts.push(fact(quest.kind === 'hoehle' ? 'Alle überwunden' : 'Ertrag', h('span', { class: 'res-list' }, reward)));
    if (monsters.length > 0) facts.push(fact('Beute', h('span', { class: 'muted' }, `${CURRENCY} von jedem Geist, manchmal ein Fundstück.`)));
  }

  return h('article', { class: `quest-card ${state.status}` },
    h('header', { class: 'quest-top' },
      monsters.length === 1 && quest.kind === 'kampf'
        ? h('span', { class: 'portrait' }, h('img', { src: monsters[0].bild, alt: '' }))
        : h('span', { class: 'seal mini' }, icon(PLACE_ICONS[quest.kind === 'hoehle' ? 'hoehle' : quest.kind === 'sammeln' ? 'sammeln' : quest.kind === 'bauen' ? 'lager' : 'ort'])),
      h('span', { class: 'quest-title' },
        h('span', { class: 'quest-name' }, quest.name),
        h('span', { class: 'quest-kind' }, kind))),
    quest.text && !finished ? h('p', { class: 'quest-text' }, quest.text) : null,
    facts.length > 0 ? h('dl', { class: 'quest-facts' }, facts) : null,
    h('div', { class: 'quest-actions' }, startButton(quest, plan, game, state)));
}

export function openPlace(placeId, game) {
  const c = game.ctx();
  const place = game.catalog.placeById.get(placeId);
  const unlocked = placeUnlocked(place, c);
  const quests = unlocked ? questsAt(placeId, c) : [];

  const homeLink = place.typ === 'lager' && game.unlocked('zuhause')
    ? h('a', { class: 'btn ghost small', href: '#zuhause', onclick: closeSheet }, icon(NAV_ICONS.zuhause), 'Zum Zuhause')
    : null;

  openSheet({
    title: place.name,
    eyebrow: place.region,
    className: 'place-sheet',
    content: [
      h('p', { class: 'place-text' }, place.text),
      !unlocked
        ? h('p', { class: 'place-locked' }, icon(UI_ICONS.lock), `Öffnet sich mit: ${place.unlock.map((u) => describeCondition(u, c)).join(', ')}`)
        : null,
      homeLink,
      quests.length > 0
        ? h('div', { class: 'quest-list' }, quests.map((q) => questCard(q, game, c)))
        : unlocked ? h('p', { class: 'muted' }, 'Heute ist es hier still.') : null,
    ],
  });
}

