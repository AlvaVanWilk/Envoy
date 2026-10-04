// „Lager einrichten“: the four facilities of the camp as tiles, and from
// Lagerstufe 2 a fifth tile for the Deko (see deko.js). What can be built
// leads: while the next level of a facility can be built at this stage of the
// camp, its tile shows that level (its name, its Hygge as a small medal on the
// symbol, an arrow up, what it costs in small pictures; glowing when it can be
// built right now) and the level that stands only below, small. Otherwise the
// tile shows the level that stands (lit, with a tick).
// A tap opens its details and the button to build it (or, while the Envoy is
// away, to add it to the row of what he does). Building works like a quest
// at the camp: material, Energie and its minutes (see world/camp.js).
// Facilities are not on the map, only here.

import { h, icon } from './dom.js';
import { UI_ICONS, FACILITY_ICONS, ENERGY_ICON } from './icons.js';
import { MATERIALS } from '../config.js';
import { resourceIcon, energyPreview } from './parts.js';
import { openSheet } from './sheet.js';
import { questAction, fact, requirements } from './questsheet.js';
import { dekoTile, dekoCanBeBuilt } from './deko.js';
import {
  campStatus, facilityRow, facilityLevel, facilityQuests, facilityEffect, FACILITY_IDS, CAMP_PLACE,
} from '../world/camp.js';

// How a facility stands: its level, the row of that level (null while not
// built), its next level and the quest for it (null if there is none), the
// plan for building it now (see game.plan) and
//   open   the next level can be built at the stage the camp has (or will
//          have once the row of the Envoy is done, see game.stageAhead)
//   state  'built' | 'running' (in the row of the Envoy, or he builds it) |
//          'ready' (can be built or added now) | 'lacking'
export function facilityView(id, game) {
  const c = game.ctx();
  const level = facilityLevel(c.world, id);
  const now = level > 0 ? facilityRow(c.catalog, id, level) : null;
  const quest = facilityQuests(c.world, c.catalog).find((q) => q.facility === id) || null;
  const next = quest ? facilityRow(c.catalog, id, level + 1) : null;
  const open = Boolean(next) && next.lagerstufe <= game.stageAhead();
  const plan = quest ? game.plan(quest.id) : null;
  let state = level > 0 ? 'built' : 'lacking';
  if (quest && game.queued(quest.id)) state = 'running';
  else if (open && plan && !plan.block) state = 'ready';
  return { id, level, now, next, open, quest, plan, state };
}

// Whether anything can be built right now (the button on the picture glows then).
export function canBuildSomething(game) {
  return FACILITY_IDS.some((id) => facilityView(id, game).state === 'ready') || dekoCanBeBuilt(game);
}

// The costs of a quest at the camp as small pictures; what is lacking
// (material, also after what the row of the Envoy brings, or Energie right
// now) in orange.
export function costs(quest, plan) {
  const purse = plan.ctx.world.purse;
  const items = Object.entries(quest.consumes).map(([key, n]) =>
    h('span', { class: `ft-cost ${(purse[key] || 0) < n ? 'lacking' : ''}`, title: `${n} ${MATERIALS[key]}` }, resourceIcon(key), String(n)));
  const energy = Math.ceil(plan.cost.most);
  items.push(h('span', { class: `ft-cost ${plan.block === 'energy' || plan.block === 'never' ? 'lacking' : ''}`, title: `${energy} Energie` },
    icon(ENERGY_ICON, 'icon res-icon'), String(energy)));
  return h('span', { class: 'ft-costs' }, items);
}

// The Hygge something gives, as a small medal like the one on the camp picture.
export function hyggeMedal(value) {
  return h('span', { class: 'hygge-medal', title: `Hygge ${value}`, 'aria-label': `Hygge ${value}` }, String(value));
}

export const BADGES = { built: UI_ICONS.check, running: UI_ICONS.hero, upgrade: UI_ICONS.up };

// Below the name: in the row, building, the costs of the next step, or the level.
export function tileFoot(quest, plan, game, fallback) {
  const queued = quest ? game.queued(quest.id) : null;
  if (queued) return h('span', { class: 'ft-level' }, queued.action.stage === 0 ? 'In der Reihe' : 'Wird gebaut');
  return plan ? costs(quest, plan) : h('span', { class: 'ft-level' }, fallback);
}

// Whether the tile shows the next level (it can be built at this stage of the
// camp, or it is not built at all yet) rather than the one that stands.
const ahead = (v) => Boolean(v.next) && (v.open || v.level === 0);

function tile(id, game) {
  const v = facilityView(id, game);
  const next = ahead(v);
  const row = next ? v.next : v.now;
  const upgrade = next && v.level > 0;
  const badge = v.state === 'running' ? BADGES.running : upgrade ? BADGES.upgrade : v.level > 0 ? BADGES.built : null;
  return h('button', { class: `facility-tile is-${v.state} ${next ? 'is-next' : 'has-level'} ${upgrade ? 'is-upgrade' : ''}`, type: 'button', 'data-facility': id, onclick: () => openFacility(id, game) },
    h('span', { class: 'ft-emblem' }, icon(FACILITY_ICONS[id]), badge ? h('span', { class: 'ft-badge', html: badge }) : null, hyggeMedal(row.hygge)),
    upgrade ? h('span', { class: 'ft-eyebrow' }, `Ausbau · Stufe ${v.next.stufe}`) : null,
    h('span', { class: 'ft-name' }, row.name),
    tileFoot(v.quest, next ? v.plan : null, game, `Stufe ${v.level}`),
    upgrade ? h('span', { class: 'ft-now' }, `Jetzt: ${v.now.name}`) : null);
}

export function openFacilities(game) {
  const status = campStatus(game.state.world, game.catalog);
  openSheet({
    title: 'Lager einrichten',
    eyebrow: `Stufe ${status.stage} · ${status.name}`,
    className: 'facilities-sheet',
    content: h('div', { class: 'facility-tiles' }, FACILITY_IDS.map((id) => tile(id, game)), dekoTile(game)),
  });
}

// One facility. While its next level can be built, the window is about that
// level (what it brings, its Hygge, what it costs, building it), and the level
// that stands is one line below. Otherwise it shows the level that stands.
export function openFacility(id, game) {
  const c = game.ctx();
  const v = facilityView(id, game);
  const building = ahead(v) ? v.next : null;
  const shown = building || v.now;
  const upgrade = Boolean(building) && v.level > 0;
  const facts = [
    fact('Bringt', h('span', { class: 'facility-effect' }, facilityEffect(shown))),
    fact('Hygge', upgrade ? `${shown.hygge} statt ${v.now.hygge}` : String(shown.hygge)),
  ];
  if (building) facts.push(fact('Kosten', h('span', { class: 'cond-list' }, requirements(v.quest, c, { conditions: false }))));

  const back = h('button', { class: 'btn ghost', type: 'button', onclick: () => openFacilities(game) }, 'Alle Einrichtungen');
  const queued = v.quest ? game.queued(v.quest.id) : null;
  const act = building || queued ? questAction(v.quest, v.plan, game, c.catalog.placeById.get(CAMP_PLACE)) : null;
  let note = null;
  if (upgrade) note = h('p', { class: 'facility-now' }, `Jetzt steht hier: ${v.now.name}. ${facilityEffect(v.now)}.`);
  else if (!building && v.next) note = h('p', { class: 'quest-note' }, `Nächste Stufe: ${v.next.name}, ab Lagerstufe ${v.next.lagerstufe}.`);

  let eyebrow = 'Einrichtung';
  if (upgrade) eyebrow = `Ausbau · Stufe ${building.stufe}`;
  else if (v.level > 0) eyebrow = `Einrichtung · Stufe ${v.level}`;
  const emblemState = building ? (upgrade ? 'upgrade' : v.state) : 'built';
  openSheet({
    title: shown.name,
    eyebrow,
    className: 'quest-sheet facility-sheet',
    content: [
      h('div', { class: 'facility-head' },
        h('span', { class: `ft-emblem is-${emblemState}` }, icon(FACILITY_ICONS[id]), upgrade ? h('span', { class: 'ft-badge', html: BADGES.upgrade }) : null, hyggeMedal(shown.hygge)),
        h('p', { class: 'quest-text' }, shown.text)),
      h('dl', { class: 'quest-facts' }, facts),
      note,
      building && !queued ? energyPreview(game.stamina(), v.plan.cost) : null,
      h('div', { class: 'quest-actions' }, back, act),
    ],
  });
}
