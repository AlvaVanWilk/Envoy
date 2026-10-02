// Deko, from Lagerstufe 2: one tile among the facilities („Lager einrichten“)
// leads to the list of all Deko of the stages the camp has reached. A Deko
// whose plan is known shows its picture, name, Hygge and costs; one whose plan
// has not been found yet stays grey and nameless, with a lock. A tap on a
// known one opens it, with the button to build it (see world/camp.js,
// world/plans.js).

import { h, icon } from './dom.js';
import { UI_ICONS, FACILITY_ICONS } from './icons.js';
import { dekoIcon, energyPreview } from './parts.js';
import { openSheet } from './sheet.js';
import { questAction, fact, requirements } from './questsheet.js';
import { hyggeMedal, tileFoot, BADGES, openFacilities } from './facilities.js';
import { dekoOfReachedStages, dekoQuest, dekoBuilt, CAMP_PLACE } from '../world/camp.js';
import { planKnown } from '../world/plans.js';

// How a Deko stands: known (its plan), its quest and plan for building it
// now, and the state as for a facility: 'built' | 'running' | 'ready' | 'lacking'.
function dekoView(row, game) {
  const { world } = game.state;
  const known = planKnown(world, row);
  const quest = dekoQuest(row);
  const plan = known && !dekoBuilt(world, row.id) ? game.plan(quest.id) : null;
  let state = dekoBuilt(world, row.id) ? 'built' : 'lacking';
  if (game.queued(quest.id)) state = 'running';
  else if (plan && !plan.block) state = 'ready';
  return { row, known, quest, plan, state };
}

const views = (game) => dekoOfReachedStages(game.state.world, game.catalog).map((row) => dekoView(row, game));

// Whether a Deko can be built right now.
export function dekoCanBeBuilt(game) {
  return views(game).some((v) => v.state === 'ready');
}

// The tile among the facilities: how many of the Deko stand. Not before Lagerstufe 2.
export function dekoTile(game) {
  const all = views(game);
  if (all.length === 0) return null;
  const built = all.filter((v) => v.state === 'built').length;
  const state = all.some((v) => v.state === 'ready') ? 'ready' : all.some((v) => v.state === 'running') ? 'running' : built > 0 ? 'built' : 'lacking';
  return h('button', { class: `facility-tile deko-tile is-${state}`, type: 'button', onclick: () => openDekoList(game) },
    h('span', { class: 'ft-emblem' }, icon(FACILITY_ICONS.deko)),
    h('span', { class: 'ft-name' }, 'Deko'),
    h('span', { class: 'ft-level' }, `${built} / ${all.length}`));
}

function knownTile(v, game) {
  const foot = v.state === 'built' ? h('span', { class: 'ft-level' }, 'Steht') : tileFoot(v.quest, v.plan, game, '');
  return h('button', { class: `facility-tile is-${v.state}`, type: 'button', 'data-deko': v.row.id, onclick: () => openDeko(v.row.id, game) },
    h('span', { class: 'ft-emblem ft-picture' }, dekoIcon(v.row, 'deko-icon'), BADGES[v.state] ? h('span', { class: 'ft-badge', html: BADGES[v.state] }) : null, hyggeMedal(v.row.hygge)),
    h('span', { class: 'ft-name' }, v.row.name),
    foot);
}

// A Deko whose plan has not been found: nothing about it but that it is there.
function unknownTile() {
  return h('div', { class: 'facility-tile is-unknown', 'aria-label': 'Plan noch nicht gefunden' },
    h('span', { class: 'ft-emblem' }, icon(UI_ICONS.lock)),
    h('span', { class: 'ft-name' }, '?'),
    h('span', { class: 'ft-level' }, 'Plan fehlt'));
}

export function openDekoList(game) {
  const all = views(game);
  const built = all.filter((v) => v.state === 'built').length;
  openSheet({
    title: 'Deko',
    eyebrow: `${built} von ${all.length} gebaut`,
    className: 'facilities-sheet deko-sheet',
    content: [
      h('div', { class: 'facility-tiles' }, all.map((v) => (v.known ? knownTile(v, game) : unknownTile()))),
      h('div', { class: 'quest-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => openFacilities(game) }, 'Alle Einrichtungen')),
    ],
  });
}

// One Deko: what it is, its Hygge and costs, and building it.
export function openDeko(id, game) {
  const c = game.ctx();
  const row = c.catalog.dekoById.get(id);
  const v = dekoView(row, game);
  const queued = game.queued(v.quest.id);
  const facts = [fact('Hygge', `+${row.hygge}`)];
  if (v.state !== 'built') facts.push(fact('Kosten', h('span', { class: 'cond-list' }, requirements(v.quest, c, { conditions: false }))));
  const back = h('button', { class: 'btn ghost', type: 'button', onclick: () => openDekoList(game) }, 'Alle Deko');
  const act = v.plan || queued ? questAction(v.quest, v.plan || game.plan(v.quest.id), game, c.catalog.placeById.get(CAMP_PLACE)) : null;
  openSheet({
    title: row.name,
    eyebrow: v.state === 'built' ? 'Deko · steht' : 'Deko',
    className: 'quest-sheet facility-sheet',
    content: [
      h('div', { class: 'facility-head' }, h('span', { class: `ft-emblem ft-picture is-${v.state}` }, dekoIcon(row, 'deko-icon'), hyggeMedal(row.hygge)), h('p', { class: 'quest-text' }, row.text)),
      h('dl', { class: 'quest-facts' }, facts),
      v.plan && !queued ? energyPreview(game.stamina(), v.plan.cost) : null,
      h('div', { class: 'quest-actions' }, back, act),
    ],
  });
}
