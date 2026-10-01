// „Lager einrichten“: the four facilities of the camp as tiles. A tile shows
// at a glance whether the facility stands (lit), can be built right now
// (glowing) or still lacks something (dark), and what it costs, in small
// pictures. A tap opens its details and the button to build it. Building
// works like a quest at the camp: material, Energie and its minutes
// (see world/camp.js). Facilities are not on the map, only here.

import { h, icon } from './dom.js';
import { UI_ICONS, FACILITY_ICONS, ENERGY_ICON } from './icons.js';
import { MATERIALS } from '../config.js';
import { resourceIcon, energyPreview } from './parts.js';
import { openSheet } from './sheet.js';
import { questAction, fact, requirements } from './questsheet.js';
import { questState } from '../world/quests.js';
import {
  campStatus, facilityRow, facilityLevel, facilityQuests, facilityEffect, FACILITY_IDS, CAMP_PLACE,
} from '../world/camp.js';

// How a facility stands: its level, the row of that level (null while not
// built), the quest for its next level (null if there is none) and
//   state  'built' | 'running' (the Envoy builds it) | 'ready' (can be built now) | 'lacking'
export function facilityView(id, game) {
  const c = game.ctx();
  const level = facilityLevel(c.world, id);
  const now = level > 0 ? facilityRow(c.catalog, id, level) : null;
  const quest = facilityQuests(c.world, c.catalog).find((q) => q.facility === id) || null;
  const next = quest ? facilityRow(c.catalog, id, level + 1) : null;
  let state = level > 0 ? 'built' : 'lacking';
  if (quest) {
    const status = questState(quest, c).status;
    if (status === 'running') state = 'running';
    else if (status === 'open' && !c.world.expedition && game.stamina().value >= quest.cost) state = 'ready';
  }
  return { id, level, now, next, quest, state };
}

// Whether anything can be built right now (the button on the picture glows then).
export function canBuildSomething(game) {
  return FACILITY_IDS.some((id) => facilityView(id, game).state === 'ready');
}

function costs(quest, c) {
  const items = Object.entries(quest.consumes).map(([key, n]) =>
    h('span', { class: `ft-cost ${(c.world.purse[key] || 0) < n ? 'lacking' : ''}`, title: `${n} ${MATERIALS[key]}` }, resourceIcon(key), String(n)));
  items.push(h('span', { class: 'ft-cost', title: `${quest.cost} Energie` }, icon(ENERGY_ICON, 'icon res-icon'), String(quest.cost)));
  return h('span', { class: 'ft-costs' }, items);
}

const BADGES = { built: UI_ICONS.check, running: UI_ICONS.hero };

function tile(id, game) {
  const c = game.ctx();
  const v = facilityView(id, game);
  const row = v.now || v.next;
  let below;
  if (v.state === 'running') below = h('span', { class: 'ft-level' }, 'Wird gebaut');
  else if (v.level > 0) below = h('span', { class: 'ft-level' }, `Stufe ${v.level}`);
  else below = costs(v.quest, c);
  return h('button', { class: `facility-tile is-${v.state}`, type: 'button', 'data-facility': id, onclick: () => openFacility(id, game) },
    h('span', { class: 'ft-emblem' }, icon(FACILITY_ICONS[id]), BADGES[v.state] ? h('span', { class: 'ft-badge', html: BADGES[v.state] }) : null),
    h('span', { class: 'ft-name' }, row.name),
    below);
}

export function openFacilities(game) {
  const status = campStatus(game.state.world, game.catalog);
  openSheet({
    title: 'Lager einrichten',
    eyebrow: `Stufe ${status.stage} · ${status.name}`,
    className: 'facilities-sheet',
    content: h('div', { class: 'facility-tiles' }, FACILITY_IDS.map((id) => tile(id, game))),
  });
}

// One facility: what it is, what it gives, and building it.
export function openFacility(id, game) {
  const c = game.ctx();
  const v = facilityView(id, game);
  const shown = v.now || v.next;
  const building = v.level === 0 ? v.next : null;
  const facts = [
    fact('Bringt', h('span', { class: 'facility-effect' }, facilityEffect(shown))),
    fact('Hygge', `+${shown.hygge}`),
  ];
  if (building) facts.push(fact('Kosten', h('span', { class: 'cond-list' }, requirements(v.quest, c, { conditions: false }))));

  const back = h('button', { class: 'btn ghost', type: 'button', onclick: () => openFacilities(game) }, 'Alle Einrichtungen');
  const state = v.quest ? questState(v.quest, c) : null;
  let act = null;
  if (building) act = questAction(v.quest, v.quest.cost, game, state, c.catalog.placeById.get(CAMP_PLACE));
  else if (v.state === 'running') act = h('span', { class: 'quest-note' }, 'Der Envoy baut gerade daran.');

  openSheet({
    title: shown.name,
    eyebrow: v.level > 0 ? `Einrichtung · Stufe ${v.level}` : 'Einrichtung',
    className: 'quest-sheet facility-sheet',
    content: [
      h('div', { class: 'facility-head' }, h('span', { class: `ft-emblem is-${v.state}` }, icon(FACILITY_ICONS[id])), h('p', { class: 'quest-text' }, shown.text)),
      h('dl', { class: 'quest-facts' }, facts),
      v.state === 'built' ? h('p', { class: 'quest-note' }, 'Ausbauen lässt es sich mit einer höheren Lagerstufe.') : null,
      building && state.status !== 'running' ? energyPreview(game.stamina(), v.quest.cost, v.quest.cost) : null,
      h('div', { class: 'quest-actions' }, back, act),
    ],
  });
}
