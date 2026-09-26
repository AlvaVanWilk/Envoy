// The trader: a different selection every day, around the hero's strength.
// Buys everything back for a third of its price.

import { h } from './dom.js';
import { NAV_ICONS } from './icons.js';
import { viewHead, purse, price, itemIcon, reqChips, effectList, lockedView, unlockHint } from './parts.js';
import { openSheet, closeSheet } from './sheet.js';
import { thingSubtitle } from './itemsheet.js';
import { sellPrice, lookup } from '../world/items.js';

export function renderTrader(game) {
  const { world, stats } = game.state;
  if (!game.unlocked('haendler')) return lockedView(NAV_ICONS.haendler, 'Händler', unlockHint('haendler', game.catalog));

  const offers = game.offers();
  const owned = Object.values(world.items).filter((e) => e.where === 'rucksack' || e.where === 'schrank')
    .map((entry) => ({ entry, thing: lookup(entry, game.catalog) })).filter((x) => x.thing);

  return h('section', { class: 'view trader' },
    viewHead('Händler', 'Heute im Angebot'),
    h('div', { class: 'trader-grid' },
      h('section', { class: 'panel' }, purse(world.purse)),
      h('section', { class: 'panel' },
        offers.length === 0
          ? h('p', { class: 'empty-state' }, 'Alles verkauft. Morgen gibt es Neues.')
          : h('div', { class: 'offer-grid' }, offers.map((offer) => {
            const thing = offer.kind === 'furniture' ? game.catalog.furnitureById.get(offer.id) : game.catalog.itemById.get(offer.id);
            return h('button', { class: 'offer', onclick: () => openOffer(offer, thing, game) },
              h('span', { class: 'item-frame' }, itemIcon(thing)),
              h('span', { class: 'item-name' }, thing.name),
              h('span', { class: 'item-sub' }, thingSubtitle({ kind: offer.kind }, thing)),
              offer.kind === 'item' ? reqChips(thing, stats) : null,
              price(offer.price, world.purse.glimmer));
          }))),
      h('section', { class: 'panel' },
        h('h2', { class: 'section-title' }, 'Verkaufen'),
        owned.length === 0
          ? h('p', { class: 'muted' }, 'Nichts im Rucksack oder Schrank.')
          : h('div', { class: 'item-list' }, owned.map(({ entry, thing }) => h('div', { class: 'item-row' },
            h('span', { class: 'item-frame' }, itemIcon(thing)),
            h('span', { class: 'item-row-main' }, h('span', { class: 'item-name' }, thing.name), h('span', { class: 'item-sub' }, thingSubtitle(entry, thing))),
            h('button', { class: 'btn ghost small', onclick: () => confirmSell(entry, thing, game) }, `${sellPrice(entry, game.catalog)} Glimmer`)))))));
}

function openOffer(offer, thing, game) {
  const { world, stats } = game.state;
  const affordable = world.purse.glimmer >= offer.price;
  openSheet({
    title: thing.name,
    eyebrow: thingSubtitle({ kind: offer.kind }, thing),
    className: 'item-sheet',
    content: [
      h('div', { class: 'item-hero' }, itemIcon(thing, 'item-hero-icon')),
      offer.kind === 'item' ? reqChips(thing, stats) : null,
      thing.faehigkeit || thing.text ? h('p', { class: 'item-ability' }, thing.faehigkeit || thing.text) : null,
      effectList(thing.effekt),
      h('div', { class: 'sheet-actions' },
        price(offer.price, world.purse.glimmer),
        h('button', { class: 'btn primary', disabled: !affordable, onclick: () => { game.buy(offer); closeSheet(); } },
          affordable ? 'Kaufen' : 'Nicht genug Glimmer')),
    ],
  });
}

function confirmSell(entry, thing, game) {
  const amount = sellPrice(entry, game.catalog);
  openSheet({
    title: `${thing.name} verkaufen`,
    content: [
      h('p', {}, `Für ${amount} Glimmer.`),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Behalten'),
        h('button', { class: 'btn primary', onclick: () => { game.sell(entry.inst); closeSheet(); } }, 'Verkaufen')),
    ],
  });
}
