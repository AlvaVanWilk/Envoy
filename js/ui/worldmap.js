// The map of the Zwischenwelt. Every expedition starts at the camp, goes to
// a place and comes back; it takes real time. Tapping a place shows what
// can be done there, how long it takes and what it brings.

import { h, icon, replaceChildren } from './dom.js';
import { PLACE_ICONS, UI_ICONS, NAV_ICONS } from './icons.js';
import { CURRENCY, MATERIALS, versioned } from '../config.js';
import {
  viewHead, sectionTitle, supplies, staminaBar, resource, formatMinutes, materialLimits, MATERIAL_KEYS,
} from './parts.js';
import { statEmblem, statInfo } from './stats.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { journeyPanel } from './journey.js';
import { questsAt, questState, placeUnlocked, conditionMet, describeCondition, KIND_NAMES } from '../world/quests.js';
import { heroPosition } from '../world/expedition.js';
import { camp } from '../world/map.js';
import { rewardRange, gatherEstimate } from '../world/run.js';
import { facilityRow, facilityEffect } from '../world/camp.js';
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
    'data-place': place.id,
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
      row(seal('lager'), 'Lager auf dem Trümmerfeld. Hier beginnt und endet jede Expedition, und hier wird gesammelt, ohne Weg.'),
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
  for (const f of quest.reward?.unlocks || []) parts.push(h('span', { class: 'pill' }, unlockName(f, c)));
  if (quest.reward?.rest) parts.push(h('span', { class: 'pill' }, 'Energie voll'));
  return parts;
}

// What a feature is called in the list of rewards: Lagerfeuer, Händler or a facility.
function unlockName(feature, c) {
  if (feature === 'lagerfeuer') return 'Lagerfeuer';
  if (feature === 'haendler') return 'Händler';
  const [id, level] = feature.split(':');
  return facilityRow(c.catalog, id, Number(level))?.name || feature;
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

// What the Envoy is told to gather, kept while the app is open.
const gatherChoice = { stein: { mode: 'menge', amount: 8 }, pilzholz: { mode: 'menge', amount: 2 } };

function startButton(quest, plan, game, state) {
  const st = game.stamina();
  const away = game.state.world.expedition;
  if (state.status === 'running') return h('span', { class: 'quest-note' }, 'Der Envoy ist gerade dort.');
  if (state.status === 'done') return h('span', { class: 'quest-note' }, quest.encounter ? 'Heute erledigt.' : 'Erledigt.');
  if (state.status === 'cooldown') return h('span', { class: 'quest-note' }, `Wieder ab ${formatDayShort(state.again)}.`);
  if (state.status === 'locked') return null;
  if (away) return h('button', { class: 'btn ghost small', disabled: true }, 'Der Envoy ist unterwegs');
  if (plan.cost > st.max) return h('span', { class: 'quest-note' }, 'Die Energie reicht dafür noch nicht. Sie wächst mit dem Wert Ausdauer.');
  if (plan.cost > st.value) {
    const hours = (plan.cost - st.value) / st.perHour;
    return h('button', { class: 'btn ghost small', disabled: true }, `Genug Energie in ${formatMinutes(Math.ceil(hours * 60))}`);
  }
  const nearby = quest.place === camp(game.catalog).id;
  return h('button', {
    class: 'btn primary',
    onclick: () => {
      const event = game.startExpedition(quest.id);
      if (!event) return;
      closeSheet();
      markMapForScroll();
      toast(nearby ? `Der Envoy macht sich an die Arbeit: ${quest.name}` : `Aufgebrochen: ${quest.name}`);
    },
  }, nearby ? 'Anfangen' : 'Aufbrechen');
}

const paragraphs = (text) => text.split('\n').filter(Boolean).map((p) => h('p', {}, p));

// A quest of gathering on the Trümmerfeld: the Envoy gathers up to an amount or
// until his Energie is used up, and carries what fits. What he gets for each
// Energie is rolled, between 2 and 4 pieces (see run.js).
function gatherCard(quest, game) {
  const material = quest.gather.material;
  const name = MATERIALS[material];
  const box = h('article', { class: 'quest-card open gather-card' });

  const draw = () => {
    const c = game.ctx();
    const choice = gatherChoice[material];
    const state = questState(quest, c);
    const st = game.stamina();
    const energy = Math.floor(st.value);
    const est = gatherEstimate(quest, c, { ...choice, energy });
    const have = c.world.purse[material] || 0;
    const limit = have + est.room;
    const away = Boolean(c.world.expedition);
    if (choice.amount > est.room) choice.amount = Math.max(1, est.room);

    const modeButton = (id, label) => h('button', {
      class: `chip ${choice.mode === id ? 'active' : ''}`, type: 'button',
      onclick: () => { choice.mode = id; draw(); },
    }, label);
    const step = (delta) => () => { choice.amount = Math.min(Math.max(1, choice.amount + delta), Math.max(1, est.room)); draw(); };

    const range = est.perEnergy;
    const time = choice.mode === 'menge'
      ? `etwa ${est.likely} Min., höchstens ${est.atMost}`
      : `bis zu ${energy} Min.`;
    const canStart = state.status === 'open' && !away && est.wanted >= 1 && energy >= 1;
    let note = null;
    if (est.room <= 0) note = `Dein Envoy kann nicht mehr als ${limit} ${name} tragen.`;
    else if (choice.mode === 'menge' && choice.amount >= est.room) note = `Mehr als ${limit} ${name} kann dein Envoy gerade nicht tragen.`;
    else if (choice.mode === 'menge' && !est.sure) note = 'Die Energie reicht vielleicht nicht für die ganze Menge.';

    replaceChildren(box,
      h('header', { class: 'quest-top' },
        h('span', { class: 'seal mini' }, icon(PLACE_ICONS.sammeln)),
        h('span', { class: 'quest-title' },
          h('span', { class: 'quest-name' }, quest.name),
          h('span', { class: 'quest-kind' }, 'Sammeln'))),
      h('div', { class: 'quest-text' }, paragraphs(quest.text)),
      h('div', { class: 'chips gather-mode', role: 'group', 'aria-label': 'Wie lange sammeln' },
        modeButton('menge', 'Bis zu einer Menge'), modeButton('energie', 'Bis die Energie reicht')),
      choice.mode === 'menge'
        ? h('div', { class: 'stepper' },
          h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Weniger', disabled: choice.amount <= 1, onclick: step(-1) }, '−'),
          h('span', { class: 'stepper-value' }, resource(material, String(choice.amount))),
          h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Mehr', disabled: choice.amount >= est.room, onclick: step(1) }, '+'))
        : null,
      h('dl', { class: 'quest-facts' },
        fact('Im Vorrat', h('strong', {}, `${have} / ${limit}`), h('span', { class: 'muted' }, ` ${name}`)),
        fact('Dauer', h('strong', {}, time)),
        fact('Je Energie', h('strong', {}, `${range.min} bis ${range.max}`), h('span', { class: 'muted' }, ` ${name}, im Schnitt ${range.average.toFixed(1).replace('.', ',')}`)),
        fact('Mehr Ertrag mit', statList(quest.yieldStats))),
      note ? h('p', { class: 'quest-note gather-note' }, note) : null,
      h('div', { class: 'quest-actions' },
        state.status === 'running' ? h('span', { class: 'quest-note' }, 'Der Envoy ist gerade dort.')
          : away ? h('button', { class: 'btn ghost small', disabled: true }, 'Der Envoy ist unterwegs')
            : energy < 1 ? h('button', { class: 'btn ghost small', disabled: true }, 'Keine Energie übrig')
              : est.wanted < 1 ? h('button', { class: 'btn ghost small', disabled: true }, 'Kein Platz zum Tragen')
                : h('button', {
                  class: 'btn primary', disabled: !canStart,
                  onclick: () => {
                    const event = game.startExpedition(quest.id, { mode: choice.mode, amount: choice.amount });
                    if (!event) return;
                    closeSheet();
                    markMapForScroll();
                    toast(`Der Envoy sammelt ${name}`);
                  },
                }, 'Sammeln')));
  };
  draw();
  return box;
}

function questCard(quest, game, c) {
  if (quest.gather) return gatherCard(quest, game);
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
    facts.push(fact('Energie', h('strong', {}, String(plan.cost))));
    if (monsters.length === 0 && quest.speedStats.length > 0) facts.push(fact('Kürzer mit', statList(quest.speedStats)));
    if (quest.yieldStats.length > 0) facts.push(fact('Mehr Ertrag mit', statList(quest.yieldStats)));
    if (monsters.length > 0) facts.push(fact('Im Kampf', h('span', { class: 'muted' }, 'Kraft trifft härter, Ausdauer hält länger, Beweglichkeit weicht aus, Gelassenheit beruhigt.')));
    const reward = rewardText(quest, c);
    if (quest.facility) {
      const row = facilityRow(c.catalog, quest.facility, Number(quest.id.split(':')[2]));
      facts.push(fact('Bringt', h('span', {}, `${facilityEffect(row)} · Hygge +${row.hygge}`)));
    } else if (reward.length > 0) facts.push(fact(quest.kind === 'hoehle' ? 'Alle überwunden' : 'Ertrag', h('span', { class: 'res-list' }, reward)));
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
    quest.text && !finished ? h('div', { class: 'quest-text' }, paragraphs(quest.text)) : null,
    facts.length > 0 ? h('dl', { class: 'quest-facts' }, facts) : null,
    h('div', { class: 'quest-actions' }, startButton(quest, plan, game, state)));
}

export function openPlace(placeId, game) {
  const c = game.ctx();
  const place = game.catalog.placeById.get(placeId);
  const unlocked = placeUnlocked(place, c);
  const quests = unlocked ? questsAt(placeId, c) : [];

  const homeLink = place.typ === 'lager'
    ? h('a', { class: 'btn ghost small', href: '#lager', onclick: closeSheet }, icon(NAV_ICONS.lager), 'Zum Lager')
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

