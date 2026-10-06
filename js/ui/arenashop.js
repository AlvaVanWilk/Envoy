// What Ruhm buys in the arena: a piece of clothing in another colour, and
// every day a few pieces of clothing with bonuses (at least selten). Titel
// are not bought: they come with the Ränge, from all the Ruhm ever earned.
// Ruhm counts only here and never makes the Envoy stronger.

import { h, replaceChildren } from './dom.js';
import { sectionTitle, itemIcon, reqChips, effectList, effectsOf, qualityClass } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { ruhmAmount, nameLine } from './arenaparts.js';
import { thingSubtitle } from './itemsheet.js';
import { thingName } from '../world/clothes.js';
import { rankOf, titleOwned } from '../world/arena.js';
import { DYES, DYE_PRICE, TITLES, RANKS } from '../config.js';

// The pieces owned that can be dyed (many of those found on the way).
function dyeable(game) {
  const { world } = game.state;
  return Object.values(world.items)
    .map((entry) => ({ entry, item: entry.kind === 'item' ? game.catalog.itemById.get(entry.id) : null }))
    .filter((x) => x.item?.faerbbar);
}

export function shopPanel(game) {
  const own = game.state.world.arena;
  const pieces = dyeable(game).length;
  const offers = game.arenaOffers();
  return h('section', { class: 'panel arena-shop' },
    sectionTitle('Für Ruhm', ruhmAmount(own.ruhm)),
    h('p', { class: 'arena-label' }, 'Ausrüstung der Halle'),
    offers.length === 0
      ? h('p', { class: 'muted' }, 'Heute ist alles vergeben. Morgen gibt es Neues.')
      : h('div', { class: 'item-list arena-offers' }, offers.map((offer) => offerRow(offer, game))),
    h('button', { class: 'arena-shop-row arena-dye-entry', onclick: () => openDye(game) },
      h('span', { class: 'arena-shop-main' },
        h('span', { class: 'arena-shop-name' }, 'Kleidung färben'),
        h('span', { class: 'arena-shop-sub' }, pieces > 0 ? `${pieces} ${pieces === 1 ? 'Teil lässt' : 'Teile lassen'} sich färben` : 'Noch kein Teil, das sich färben lässt')),
      ruhmAmount(DYE_PRICE)));
}

function offerRow(offer, game) {
  const item = game.catalog.itemById.get(offer.id);
  return h('button', { class: 'item-row arena-offer', onclick: () => openOffer(offer, item, game) },
    h('span', { class: `item-frame${qualityClass(offer)}` }, itemIcon(item, game, 'item-icon', offer.farbe)),
    h('span', { class: 'item-row-main' },
      h('span', { class: 'item-name' }, item.name),
      h('span', { class: 'item-sub' }, thingSubtitle(offer, item)),
      effectList(effectsOf(item, offer))),
    ruhmAmount(offer.price));
}

function openOffer(offer, item, game) {
  const own = game.state.world.arena;
  const enough = own.ruhm >= offer.price;
  openSheet({
    title: item.name,
    eyebrow: thingSubtitle(offer, item),
    className: 'item-sheet',
    content: [
      h('div', { class: `item-hero${qualityClass(offer)}` }, itemIcon(item, game, 'item-hero-icon', offer.farbe)),
      reqChips(item, game.state.stats),
      effectList(effectsOf(item, offer)),
      enough ? null : h('p', { class: 'arena-why' }, 'Noch nicht genug Ruhm.'),
      h('div', { class: 'sheet-actions' },
        h('button', {
          class: 'btn primary', disabled: !enough,
          onclick: () => { game.buyArena(offer); closeSheet(); toast(`${item.name} liegt im Rucksack`); },
        }, 'Für ', ruhmAmount(offer.price), ' nehmen')),
    ],
  });
}

// The Ränge, from all the Ruhm ever earned, and the Titel each one brings.
export function ranksPanel(game) {
  const own = game.state.world.arena;
  const { index, next } = rankOf(own.earned);
  return h('section', { class: 'panel arena-ranks' },
    sectionTitle('Ränge und Titel'),
    next ? h('p', { class: 'muted arena-rank-next' }, `Noch ${next.at - own.earned} Ruhm bis „${next.name}“.`) : null,
    h('ol', { class: 'rank-list' }, RANKS.map((rank, i) => h('li', { class: `rank${i <= index ? ' is-reached' : ''}${i === index ? ' is-now' : ''}` },
      h('span', { class: 'rank-name' }, rank.name),
      h('span', { class: 'rank-at' }, i === 0 ? '' : `ab ${rank.at} Ruhm`),
      h('span', { class: 'rank-titles' }, TITLES.filter((t) => t.rang === i).map((t) => h('button', {
        class: `rank-title${titleOwned(own, t.id) ? ' is-owned' : ''}${own.titel === t.id ? ' is-worn' : ''}`,
        type: 'button', onclick: () => openTitle(t, game),
      }, t.name)))))));
}

function openTitle(title, game) {
  const own = game.state.world.arena;
  const owned = titleOwned(own, title.id);
  const worn = own.titel === title.id;
  let action;
  if (worn) action = h('p', { class: 'muted' }, 'Dein Abbild trägt diesen Titel.');
  else if (owned) action = h('button', { class: 'btn primary', onclick: () => { game.setAbbild({ titel: title.id }); closeSheet(); toast(`Titel: ${title.name}`); } }, 'Tragen');
  else action = h('p', { class: 'arena-why' }, `Kommt mit dem Rang „${RANKS[title.rang].name}“.`);
  openSheet({
    title: 'Titel',
    className: 'arena-title-sheet',
    content: [
      h('p', { class: 'arena-title-preview' }, nameLine(game.state.world.envoy.name, title.id)),
      action,
    ],
  });
}

// First the piece, then its colour.
function openDye(game) {
  const body = h('div', { class: 'arena-dye-body' });
  openSheet({ title: 'Kleidung färben', eyebrow: `${DYE_PRICE} Ruhm je Teil`, className: 'arena-dye', content: body });

  const showList = () => {
    const pieces = dyeable(game);
    replaceChildren(body, pieces.length === 0
      ? h('p', { class: 'muted' }, 'Noch kein Teil, das sich färben lässt. Viele Fundstücke unterwegs lassen sich färben.')
      : h('div', { class: 'item-list' }, pieces.map(({ entry, item }) => h('button', { class: 'item-row arena-dye-row', onclick: () => showColours(entry.inst) },
        h('span', { class: 'item-frame' }, itemIcon(item, game, 'item-icon', entry.farbe)),
        h('span', { class: 'item-row-main' }, h('span', { class: 'item-name' }, thingName(item, entry.farbe)))))));
  };

  const showColours = (inst) => {
    let chosen = game.state.world.items[inst]?.farbe || '';
    const draw = () => {
      const entry = game.state.world.items[inst];
      const item = entry && game.catalog.itemById.get(entry.id);
      if (!item) { showList(); return; }
      const ruhm = game.state.world.arena.ruhm;
      const same = (entry.farbe || '') === chosen;
      replaceChildren(body,
        h('div', { class: 'item-hero' }, itemIcon(item, game, 'item-hero-icon', chosen || null)),
        h('p', { class: 'arena-dye-name' }, thingName(item, chosen || null)),
        h('div', { class: 'arena-swatches' }, [{ id: '', name: 'Wie gezeichnet' }, ...DYES].map((d) => h('button', {
          class: `arena-swatch${d.id === chosen ? ' active' : ''}${d.id ? '' : ' is-own'}`,
          style: d.id ? { background: `rgb(${d.rgb.join(', ')})` } : null,
          type: 'button', title: d.name, 'aria-label': d.name, 'aria-pressed': String(d.id === chosen),
          onclick: () => { chosen = d.id; draw(); },
        }))),
        ruhm < DYE_PRICE ? h('p', { class: 'arena-why' }, 'Noch nicht genug Ruhm.') : null,
        h('div', { class: 'arena-dye-actions' },
          h('button', { class: 'btn ghost small', onclick: showList }, 'Zurück'),
          h('button', {
            class: 'btn primary', disabled: same || ruhm < DYE_PRICE,
            onclick: () => { game.dye(inst, chosen); toast(thingName(item, chosen || null)); showList(); },
          }, 'Färben')));
    };
    draw();
  };

  showList();
}
