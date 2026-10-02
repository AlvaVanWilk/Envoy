// „Lager aufwerten“: raising the camp to its next stage once the Hygge is
// enough. It is built like everything at the camp (see world/camp.js); its
// Energie is needed in one go, so the bar has to be long enough, and the bar
// grows only with the real Ausdauer task.

import { h, icon } from './dom.js';
import { FACILITY_ICONS } from './icons.js';
import { energyPreview } from './parts.js';
import { openSheet } from './sheet.js';
import { questAction, fact, requirements } from './questsheet.js';
import { campStatus, nextUpgrade, CAMP_PLACE } from '../world/camp.js';

export function openUpgrade(game) {
  const c = game.ctx();
  const status = campStatus(c.world, c.catalog);
  const quest = nextUpgrade(c.world, c.catalog);
  if (!quest || !status.next) return;
  const plan = game.plan(quest.id);
  const queued = game.queued(quest.id);
  openSheet({
    title: 'Lager aufwerten',
    eyebrow: `${status.name} → ${status.next.name}`,
    className: 'quest-sheet facility-sheet',
    content: [
      h('div', { class: 'facility-head' }, h('span', { class: 'ft-emblem is-ready' }, icon(FACILITY_ICONS.aufwerten)), h('p', { class: 'quest-text' }, status.next.text)),
      h('dl', { class: 'quest-facts' },
        fact('Neue Stufe', `${status.stage + 1} · ${status.next.name}`),
        // the Hygge and the material (the stage it needs is plain here)
        fact('Braucht', h('span', { class: 'cond-list' }, requirements({ ...quest, conditions: quest.conditions.filter((x) => x.type === 'hygge') }, c)))),
      h('p', { class: 'quest-note' }, 'Einrichtungen und Deko bleiben stehen.'),
      !queued ? energyPreview(game.stamina(), plan.cost) : null,
      h('div', { class: 'quest-actions' }, questAction(quest, plan, game, c.catalog.placeById.get(CAMP_PLACE))),
    ],
  });
}
