// The trader: a different selection every day, around the hero's strength,
// and on some days a plan for Deko. Buys everything back for a third of its price.

import { h } from './dom.js';
import { NAV_ICONS } from './icons.js';
import { viewHead, sectionTitle, supplies, price, resource, itemIcon, dekoIcon, reqChips, effectList, lockedView, unlockHint } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { thingSubtitle } from './itemsheet.js';
import { sellPrice, lookup } from '../world/items.js';
import { reachable } from '../world/inventory.js';
import { CURRENCY } from '../config.js';

export function renderTrader(game) {
  const { world, stats } = game.state;
  if (!game.unlocked('haendler')) return lockedView(NAV_ICONS.haendler, 'Händler', unlockHint('haendler', game.catalog));

  const offers = game.offers();
  // Only what the Envoy can reach: things in the storage while at the camp.
  const owned = Object.values(world.items).filter((e) => (e.where === 'rucksack' || e.where === 'schrank') && reachable(world, e))
    .map((entry) => ({ entry, thing: lookup(entry, game.catalog) })).filter((x) => x.thing);

  return h('section', { class: 'view trader' },
    viewHead('Händler', 'Der Händler'),
    h('div', { class: 'trader-grid' },
      h('section', { class: 'panel trader-purse' }, sectionTitle('Vorrat'), supplies(world.purse)),
      h('section', { class: 'panel trader-offers' },
        sectionTitle('Heute im Angebot'),
        offers.length === 0
          ? h('p', { class: 'empty-state' }, 'Alles verkauft. Morgen gibt es Neues.')
          : h('div', { class: 'offer-grid' }, offers.map((offer) => {
            if (offer.kind === 'plan') return planOffer(offer, game);
            const thing = game.catalog.itemById.get(offer.id);
            return h('button', { class: 'offer', onclick: () => openOffer(offer, thing, game) },
              h('span', { class: 'item-frame' }, itemIcon(thing, game, 'item-icon', offer.farbe)),
              h('span', { class: 'item-name' }, thing.name),
              h('span', { class: 'item-sub' }, thingSubtitle(offer, thing)),
              offer.kind === 'item' ? reqChips(thing, stats) : null,
              price(offer.price, world.purse.splitter));
          }))),
      h('section', { class: 'panel trader-sell' },
        sectionTitle('Verkaufen'),
        owned.length === 0
          ? h('p', { class: 'muted' }, 'Nichts im Rucksack oder Lager.')
          : h('div', { class: 'item-list' }, owned.map(({ entry, thing }) => h('div', { class: 'item-row' },
            h('span', { class: 'item-frame' }, itemIcon(thing, game, 'item-icon', entry.farbe)),
            h('span', { class: 'item-row-main' }, h('span', { class: 'item-name' }, thing.name), h('span', { class: 'item-sub' }, thingSubtitle(entry, thing))),
            h('button', { class: 'btn ghost small', onclick: () => confirmSell(entry, thing, game) }, resource('splitter', sellPrice(entry, game.catalog)))))))));
}

function openOffer(offer, thing, game) {
  const { world, stats } = game.state;
  const affordable = world.purse.splitter >= offer.price;
  openSheet({
    title: thing.name,
    eyebrow: thingSubtitle(offer, thing),
    className: 'item-sheet',
    content: [
      h('div', { class: 'item-hero' }, itemIcon(thing, game, 'item-hero-icon', offer.farbe)),
      offer.kind === 'item' ? reqChips(thing, stats) : null,
      thing.faehigkeit || thing.text ? h('p', { class: 'item-ability' }, thing.faehigkeit || thing.text) : null,
      effectList(thing.effekt),
      h('div', { class: 'sheet-actions' },
        price(offer.price, world.purse.splitter),
        h('button', { class: 'btn primary', disabled: !affordable, onclick: () => { game.buy(offer); closeSheet(); } },
          affordable ? 'Kaufen' : `Nicht genug ${CURRENCY}`)),
    ],
  });
}

// A plan for Deko: what it is for and what it gives the camp.
function planOffer(offer, game) {
  const deko = game.catalog.dekoById.get(offer.id);
  return h('button', { class: 'offer offer-plan', onclick: () => openPlan(offer, deko, game) },
    h('span', { class: 'item-frame' }, dekoIcon(deko)),
    h('span', { class: 'item-name' }, `Plan: ${deko.name}`),
    h('span', { class: 'item-sub' }, `Deko · Hygge +${deko.hygge}`),
    price(offer.price, game.state.world.purse.splitter));
}

function openPlan(offer, deko, game) {
  const { world } = game.state;
  const affordable = world.purse.splitter >= offer.price;
  openSheet({
    title: `Plan: ${deko.name}`,
    eyebrow: `Deko · Hygge +${deko.hygge}`,
    className: 'item-sheet',
    content: [
      h('div', { class: 'item-hero' }, dekoIcon(deko, 'item-hero-icon')),
      h('p', { class: 'item-ability' }, deko.text),
      h('p', { class: 'muted' }, 'Mit dem Plan lässt sich die Deko im Lager bauen.'),
      h('div', { class: 'sheet-actions' },
        price(offer.price, world.purse.splitter),
        h('button', {
          class: 'btn primary',
          disabled: !affordable,
          onclick: () => { game.buy(offer); closeSheet(); toast(`Plan gekauft: ${deko.name}`); },
        }, affordable ? 'Kaufen' : `Nicht genug ${CURRENCY}`)),
    ],
  });
}

function confirmSell(entry, thing, game) {
  const amount = sellPrice(entry, game.catalog);
  openSheet({
    title: `${thing.name} verkaufen`,
    content: [
      h('p', {}, `Für ${amount} ${CURRENCY}.`),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Behalten'),
        h('button', { class: 'btn primary', onclick: () => { game.sell(entry.inst); closeSheet(); } }, 'Verkaufen')),
    ],
  });
}
