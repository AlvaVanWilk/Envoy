// Detail sheet for one owned thing (equipment), with the actions that make
// sense where it is right now, and the Einweben: the strength of another
// piece of the same slot woven into this one (see world/weave.js).

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { SLOTS } from '../config.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { statEmblem, statInfo } from './stats.js';
import { itemIcon, effectList, reqChips, effectsOf, qualityClass } from './parts.js';
import { qualityById } from '../world/bonuses.js';
import { unmetRequirements, lookup } from '../world/items.js';
import { fits, figureOf, dyeById } from '../world/clothes.js';
import { hasSpace, reachable, capacity } from '../world/inventory.js';
import { weaveSources, weaveBlock, wovenBonuses } from '../world/weave.js';

export const slotName = (id) => SLOTS.find((s) => s.id === id)?.name || id;
export const WHERE = { rucksack: 'Rucksack', schrank: 'Aufbewahrung', body: 'Getragen' };
// Shown for things in the storage while the Envoy is away.
export const AWAY_NOTE = 'Der Envoy ist unterwegs. Er erinnert sich nur, was dort liegt; erreichbar wird es im Lager.';

// Slot, stufe, the Güte of a piece with bonuses and, for a piece with a
// colour of its own, the colour.
export function thingSubtitle(entry, thing) {
  const dye = dyeById(entry?.farbe);
  const quality = qualityById(entry?.guete);
  return `${slotName(thing.slot)} · Stufe ${thing.stufe}${quality && quality.bonuses > 0 ? ` · ${quality.name}` : ''}${dye ? ` · ${dye.name}` : ''}`;
}

// Shown for a piece whose drawing is made for the other figure.
export const OTHER_FIGURE = 'Passt nicht zu dieser Figur.';

function requirementList(item, stats) {
  const reqs = Object.entries(item.req || {});
  if (reqs.length === 0) return null;
  return h('ul', { class: 'req-list' }, reqs.map(([stat, min]) => {
    const current = stats[stat].level;
    return h('li', { class: current >= min ? 'met' : 'unmet' },
      statEmblem(stat, 'small'),
      h('span', {}, `${statInfo(stat).name} ${min}`),
      h('span', { class: 'req-current' }, current >= min ? icon(UI_ICONS.check) : `jetzt ${current}`));
  }));
}

function confirmDrop(entry, thing, game) {
  openSheet({
    title: `${thing.name} liegen lassen`,
    content: [
      h('p', {}, 'Das Teil ist danach weg.'),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: () => openEntry(entry.inst, game) }, 'Behalten'),
        h('button', { class: 'btn danger', onclick: () => { game.drop(entry.inst); closeSheet(); } }, 'Liegen lassen')),
    ],
  });
}

export function openEntry(inst, game) {
  const { world, stats } = game.state;
  const entry = world.items[inst];
  if (!entry) return;
  const thing = lookup(entry, game.catalog);
  if (!thing) return;
  const hasStorage = capacity(world, game.catalog, 'schrank') > 0;
  const atCamp = game.atCamp();
  const actions = [];

  if (!reachable(world, entry)) {
    // In the storage while the Envoy is away: look, but not touch.
  } else if (entry.kind === 'item') {
    const canWear = unmetRequirements(thing, stats).length === 0 && fits(thing, figureOf(world));
    if (entry.where === 'body') {
      actions.push(h('button', { class: 'btn ghost', onclick: () => { game.unequip(thing.slot); closeSheet(); } }, 'Ablegen'));
    } else {
      actions.push(h('button', { class: 'btn primary', disabled: !canWear, onclick: () => { game.equip(thing.slot, inst); closeSheet(); } }, 'Anlegen'));
    }
  }

  // Between backpack and storage only at the camp.
  if (hasStorage && atCamp && (entry.where === 'rucksack' || entry.where === 'schrank')) {
    const to = entry.where === 'rucksack' ? 'schrank' : 'rucksack';
    const space = hasSpace(world, game.catalog, to);
    actions.push(h('button', { class: 'btn ghost', disabled: !space, onclick: () => { game.move(inst, to); closeSheet(); } },
      to === 'schrank' ? 'In die Aufbewahrung' : 'In den Rucksack'));
  }
  if (reachable(world, entry) && (entry.where === 'rucksack' || entry.where === 'schrank')) {
    actions.push(h('button', { class: 'btn text danger-text', onclick: () => confirmDrop(entry, thing, game) }, 'Liegen lassen'));
  }
  const sources = entry.kind === 'item' && reachable(world, entry) ? weaveSources(world, game.catalog, entry, stats) : [];
  const weaveWhy = WEAVE_WHY[weaveBlock(world)];

  openSheet({
    title: thing.name,
    eyebrow: `${thingSubtitle(entry, thing)} · ${WHERE[entry.where]}`,
    className: 'item-sheet',
    content: [
      h('div', { class: `item-hero${qualityClass(entry)}` }, itemIcon(thing, game, 'item-hero-icon', entry.farbe)),
      entry.kind === 'item' ? requirementList(thing, stats) : null,
      entry.kind === 'item' && !fits(thing, figureOf(world)) ? h('p', { class: 'muted' }, OTHER_FIGURE) : null,
      thing.faehigkeit || thing.text ? h('p', { class: 'item-ability' }, thing.faehigkeit || thing.text) : null,
      effectList(effectsOf(thing, entry)),
      reachable(world, entry) ? null : h('p', { class: 'muted away-note' }, AWAY_NOTE),
      actions.length > 0 ? h('div', { class: 'sheet-actions' }, actions) : null,
      sources.length > 0 ? h('div', { class: 'weave-entry' },
        h('button', { class: 'btn ghost', disabled: Boolean(weaveWhy), onclick: () => openWeave(entry, thing, game) }, 'Kraft einweben'),
        weaveWhy ? h('p', { class: 'muted' }, weaveWhy) : null) : null,
    ],
  });
}

// --- Einweben ---------------------------------------------------------------------

const WEAVE_WHY = { fire: 'Einweben geht am Lagerfeuer.', away: 'Einweben geht im Lager, am Feuer. Der Envoy ist unterwegs.' };

// First the piece that gives its strength, then what this one has afterwards.
function openWeave(target, thing, game) {
  const body = h('div', { class: 'weave-body' });
  openSheet({ title: `Kraft einweben`, eyebrow: `In: ${thing.name}`, className: 'weave-sheet', content: body });

  const showList = () => {
    const { world } = game.state;
    const rows = weaveSources(world, game.catalog, world.items[target.inst] || target, game.state.stats).map((source) => {
      const item = game.catalog.itemById.get(source.id);
      return h('button', { class: 'item-row weave-row', onclick: () => showChoice(source) },
        h('span', { class: `item-frame${qualityClass(source)}` }, itemIcon(item, game, 'item-icon', source.farbe)),
        h('span', { class: 'item-row-main' },
          h('span', { class: 'item-name' }, item.name),
          h('span', { class: 'item-sub' }, `${thingSubtitle(source, item)} · ${WHERE[source.where]}`),
          effectList(source.bonus)));
    });
    body.replaceChildren(
      h('p', { class: 'muted' }, 'Welches Teil gibt seine Kraft? Es zerfällt dabei zu Fäden.'),
      h('div', { class: 'item-list' }, rows));
  };

  const showChoice = (source) => {
    const item = game.catalog.itemById.get(source.id);
    const after = { ...target, guete: undefined, bonus: undefined, ...wovenBonuses(source) };
    const keepsAbility = item.faehigkeit || Object.keys(item.effekt || {}).length > 0;
    body.replaceChildren(
      h('div', { class: 'weave-compare' },
        h('div', { class: 'weave-side' },
          h('p', { class: 'eyebrow' }, 'Jetzt'),
          h('span', { class: `item-frame${qualityClass(target)}` }, itemIcon(thing, game, 'item-icon', target.farbe)),
          effectList(effectsOf(thing, target)) || h('p', { class: 'muted' }, 'Keine Boni')),
        h('span', { class: 'weave-arrow', 'aria-hidden': 'true' }, '→'),
        h('div', { class: 'weave-side' },
          h('p', { class: 'eyebrow' }, 'Danach'),
          h('span', { class: `item-frame${qualityClass(after)}` }, itemIcon(thing, game, 'item-icon', target.farbe)),
          effectList(effectsOf(thing, after)))),
      h('p', { class: 'weave-warning' }, `${item.name} zerfällt dabei zu Fäden.${keepsAbility ? ' Seine eigene Fähigkeit geht mit ihm.' : ''}`),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: showList }, 'Zurück'),
        h('button', {
          class: 'btn primary',
          onclick: () => {
            game.weave(target.inst, source.inst);
            closeSheet();
            toast(`${thing.name} trägt jetzt die Kraft von ${item.name}`);
          },
        }, 'Einweben')));
  };

  showList();
}

// All owned items for one slot, to choose from.
export function openSlot(slotId, game) {
  const { world, stats } = game.state;
  const entries = Object.values(world.items)
    .filter((e) => e.kind === 'item' && game.catalog.itemById.get(e.id)?.slot === slotId)
    .map((e) => ({ entry: e, item: game.catalog.itemById.get(e.id) }))
    .sort((a, b) => a.item.stufe - b.item.stufe || a.item.name.localeCompare(b.item.name, 'de'));

  const rows = entries.map(({ entry, item }) => {
    const worn = entry.where === 'body';
    const unmet = unmetRequirements(item, stats);
    const other = !fits(item, figureOf(world));
    let action;
    if (worn) action = h('button', { class: 'btn ghost small', onclick: () => { game.unequip(slotId); closeSheet(); } }, 'Ablegen');
    else if (!reachable(world, entry)) action = h('span', { class: 'locked-label' }, 'In der Aufbewahrung');
    else if (other) action = h('span', { class: 'locked-label' }, 'Passt nicht');
    else if (unmet.length === 0) action = h('button', { class: 'btn primary small', onclick: () => { game.equip(slotId, entry.inst); closeSheet(); } }, 'Anlegen');
    else action = h('span', { class: 'locked-label' }, icon(UI_ICONS.lock), 'Gesperrt');
    return h('div', { class: `item-row ${(unmet.length || other) && !worn ? 'locked' : ''} ${reachable(world, entry) ? '' : 'away'}` },
      h('span', { class: `item-frame${qualityClass(entry)}` }, itemIcon(item, game, 'item-icon', entry.farbe)),
      h('span', { class: 'item-row-main' },
        h('span', { class: 'item-name' }, item.name),
        h('span', { class: 'item-sub' }, `${thingSubtitle(entry, item)} · ${WHERE[entry.where]}`),
        reqChips(item, stats),
        effectList(effectsOf(item, entry))),
      action);
  });

  openSheet({
    title: slotName(slotId),
    eyebrow: 'Slot',
    className: 'slot-sheet',
    content: rows.length === 0
      ? h('p', { class: 'muted' }, 'Nichts für diesen Slot im Rucksack oder in der Aufbewahrung.')
      : h('div', { class: 'item-list' }, rows),
  });
}
