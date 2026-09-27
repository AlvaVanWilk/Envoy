// The Envoy's home: grows from a tent to a tower house with quartz, stone
// and Bannsplitter; furniture set up here speeds recovery or brings luck.

import { h, icon } from './dom.js';
import { NAV_ICONS, SLOT_ICONS } from './icons.js';
import { viewHead, sectionTitle, supplies, resource, effectList, itemIcon, lockedView, unlockHint, MATERIAL_KEYS } from './parts.js';
import { openSheet, closeSheet } from './sheet.js';
import { openEntry } from './itemsheet.js';
import { effects } from '../world/hero.js';
import { countIn, capacity } from '../world/inventory.js';

export function renderHome(game) {
  const { world } = game.state;
  if (world.home === 0) return lockedView(NAV_ICONS.zuhause, 'Zuhause', unlockHint('zuhause', game.catalog));

  const tier = game.catalog.home[world.home - 1];
  const next = game.catalog.home[world.home];
  const fx = effects(world, game.catalog);

  const slots = [];
  for (let i = 0; i < tier.plaetze; i += 1) {
    const inst = world.placed[i];
    const entry = inst && world.items[inst];
    const piece = entry && game.catalog.furnitureById.get(entry.id);
    slots.push(piece
      ? h('button', { class: 'furniture-slot filled', onclick: () => openEntry(inst, game) },
        h('span', { class: 'item-frame' }, itemIcon(piece)), piece.name)
      : h('button', { class: 'furniture-slot', onclick: () => chooseFurniture(game) },
        h('span', { class: 'item-frame' }, icon(SLOT_ICONS.einrichtung, 'slot-glyph')), 'Frei'));
  }

  let build = null;
  if (next) {
    const lacking = (k) => world.purse[k] < next.cost[k];
    const needed = MATERIAL_KEYS.filter((k) => next.cost[k] > 0);
    const affordable = needed.every((k) => !lacking(k));
    build = h('section', { class: 'panel' },
      sectionTitle(`Ausbau: ${next.name}`),
      h('p', { class: 'quest-text' }, next.text),
      h('div', { class: 'res-list build-cost' },
        needed.map((k) => resource(k, `${Math.min(world.purse[k], next.cost[k])}/${next.cost[k]}`, { lacking: lacking(k) }))),
      h('p', { class: 'muted build-gain' },
        `Danach: Erholung ${next.erholung} %, ${next.plaetze} Plätze für Einrichtung, Lager für ${next.schrank} Teile`),
      h('button', { class: 'btn primary', disabled: !affordable, onclick: () => game.build() }, 'Ausbauen'));
  }

  return h('section', { class: 'view home' },
    viewHead('Zuhause', tier.name),
    h('div', { class: 'home-grid' },
      h('div', { class: 'panel home-picture-panel' }, h('img', { class: 'home-picture', src: tier.bild, alt: tier.name })),
      h('div', { class: 'char-side' },
        h('section', { class: 'panel' },
          h('p', { class: 'quest-text', style: { 'margin-bottom': '12px' } }, tier.text),
          h('div', { class: 'bonus-row' }, effectList({ erholung: fx.erholung, glueck: fx.glueck })),
          h('p', { class: 'muted', style: { 'margin-top': '10px' } }, `Lager: ${countIn(world, 'schrank')} von ${capacity(world, game.catalog, 'schrank')} Teilen`)),
        h('section', { class: 'panel' },
          sectionTitle('Einrichtung', h('span', { class: 'title-note' }, `${world.placed.length} von ${tier.plaetze}`)),
          h('div', { class: 'furniture-slots' }, slots)),
        build,
        h('section', { class: 'panel' }, sectionTitle('Vorrat'), supplies(world.purse)))));
}

function chooseFurniture(game) {
  const { world } = game.state;
  const pieces = Object.values(world.items)
    .filter((e) => e.kind === 'furniture' && (e.where === 'rucksack' || e.where === 'schrank'))
    .map((e) => ({ entry: e, piece: game.catalog.furnitureById.get(e.id) }))
    .filter((x) => x.piece);
  openSheet({
    title: 'Einrichtung aufstellen',
    content: !game.atCamp() && pieces.length > 0
      ? [h('p', { class: 'muted away-note' }, 'Aufstellen geht, wenn der Envoy im Lager ist.'), furnitureList(pieces, game)]
      : pieces.length === 0
      ? h('p', { class: 'muted' }, 'Keine Einrichtung im Rucksack oder Lager. Der Händler hat manchmal welche, Geister lassen sie liegen.')
      : furnitureList(pieces, game),
  });
}

function furnitureList(pieces, game) {
  const { world } = game.state;
  return h('div', { class: 'item-list' }, pieces.map(({ entry, piece }) => {
    const fits = piece.abStufe <= world.home;
    return h('div', { class: `item-row ${fits ? '' : 'locked'}` },
      h('span', { class: 'item-frame' }, itemIcon(piece)),
      h('span', { class: 'item-row-main' }, h('span', { class: 'item-name' }, piece.name), effectList(piece.effekt)),
      h('button', { class: 'btn primary small', disabled: !fits || !game.atCamp(), onclick: () => { game.place(entry.inst); closeSheet(); } },
        fits ? 'Aufstellen' : `Ab Stufe ${piece.abStufe}`));
  }));
}
