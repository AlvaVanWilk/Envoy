// Detail sheet for one owned thing (equipment or furniture), with the
// actions that make sense where it is right now.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { SLOTS } from '../config.js';
import { openSheet, closeSheet } from './sheet.js';
import { statEmblem, statInfo } from './stats.js';
import { itemIcon, effectList, reqChips } from './parts.js';
import { unmetRequirements, lookup } from '../world/items.js';
import { hasSpace, reachable } from '../world/inventory.js';

export const slotName = (id) => SLOTS.find((s) => s.id === id)?.name || id;
export const WHERE = { rucksack: 'Rucksack', schrank: 'Kiste', body: 'Getragen', home: 'Aufgestellt' };
// Shown for things in the storage while the Envoy is away.
export const AWAY_NOTE = 'Erreichbar, wenn der Envoy im Lager ist.';

export function thingSubtitle(entry, thing) {
  return entry.kind === 'furniture' ? `Einrichtung · ab ${thing.abStufe === 1 ? 'Zelt' : `Stufe ${thing.abStufe}`}` : `${slotName(thing.slot)} · Stufe ${thing.stufe}`;
}

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
  const hasHome = world.home > 0;
  const atCamp = game.atCamp();
  const actions = [];

  if (!reachable(world, entry)) {
    // In the storage while the Envoy is away: look, but not touch.
  } else if (entry.kind === 'item') {
    const canWear = unmetRequirements(thing, stats).length === 0;
    if (entry.where === 'body') {
      actions.push(h('button', { class: 'btn ghost', onclick: () => { game.unequip(thing.slot); closeSheet(); } }, 'Ablegen'));
    } else {
      actions.push(h('button', { class: 'btn primary', disabled: !canWear, onclick: () => { game.equip(thing.slot, inst); closeSheet(); } }, 'Anlegen'));
    }
  } else if (entry.where === 'home') {
    actions.push(h('button', { class: 'btn ghost', disabled: !atCamp, onclick: () => { game.unplace(inst); closeSheet(); } }, 'Abbauen'));
  } else if (hasHome) {
    const tier = game.catalog.home[world.home - 1];
    const free = world.placed.length < tier.plaetze;
    const fits = thing.abStufe <= world.home;
    actions.push(h('button', { class: 'btn primary', disabled: !free || !fits || !atCamp, onclick: () => { game.place(inst); closeSheet(); } },
      !fits ? `Ab Stufe ${thing.abStufe}` : !free ? 'Kein Platz frei' : 'Aufstellen'));
  }

  // Between backpack and storage only at the camp.
  if (hasHome && atCamp && (entry.where === 'rucksack' || entry.where === 'schrank')) {
    const to = entry.where === 'rucksack' ? 'schrank' : 'rucksack';
    const space = hasSpace(world, game.catalog, to);
    actions.push(h('button', { class: 'btn ghost', disabled: !space, onclick: () => { game.move(inst, to); closeSheet(); } },
      to === 'schrank' ? 'In die Kiste' : 'In den Rucksack'));
  }
  if (reachable(world, entry) && (entry.where === 'rucksack' || entry.where === 'schrank')) {
    actions.push(h('button', { class: 'btn text danger-text', onclick: () => confirmDrop(entry, thing, game) }, 'Liegen lassen'));
  }

  openSheet({
    title: thing.name,
    eyebrow: `${thingSubtitle(entry, thing)} · ${WHERE[entry.where]}`,
    className: 'item-sheet',
    content: [
      h('div', { class: 'item-hero' }, itemIcon(thing, 'item-hero-icon')),
      entry.kind === 'item' ? requirementList(thing, stats) : null,
      thing.faehigkeit || thing.text ? h('p', { class: 'item-ability' }, thing.faehigkeit || thing.text) : null,
      effectList(thing.effekt),
      reachable(world, entry) ? null : h('p', { class: 'muted away-note' }, AWAY_NOTE),
      actions.length > 0 ? h('div', { class: 'sheet-actions' }, actions) : null,
    ],
  });
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
    let action;
    if (worn) action = h('button', { class: 'btn ghost small', onclick: () => { game.unequip(slotId); closeSheet(); } }, 'Ablegen');
    else if (!reachable(world, entry)) action = h('span', { class: 'locked-label' }, 'In der Kiste');
    else if (unmet.length === 0) action = h('button', { class: 'btn primary small', onclick: () => { game.equip(slotId, entry.inst); closeSheet(); } }, 'Anlegen');
    else action = h('span', { class: 'locked-label' }, icon(UI_ICONS.lock), 'Gesperrt');
    return h('div', { class: `item-row ${unmet.length && !worn ? 'locked' : ''} ${reachable(world, entry) ? '' : 'away'}` },
      h('span', { class: 'item-frame' }, itemIcon(item)),
      h('span', { class: 'item-row-main' },
        h('span', { class: 'item-name' }, item.name),
        h('span', { class: 'item-sub' }, `Stufe ${item.stufe} · ${WHERE[entry.where]}`),
        reqChips(item, stats),
        effectList(item.effekt)),
      action);
  });

  openSheet({
    title: slotName(slotId),
    eyebrow: 'Slot',
    className: 'slot-sheet',
    content: rows.length === 0
      ? h('p', { class: 'muted' }, 'Nichts für diesen Slot im Rucksack oder Lager.')
      : h('div', { class: 'item-list' }, rows),
  });
}
