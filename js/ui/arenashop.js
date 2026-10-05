// What Ruhm buys in the arena: a piece of clothing in another colour, and
// Titel for the own Abbild. Ruhm counts only here and never makes the
// Envoy stronger.

import { h, replaceChildren } from './dom.js';
import { sectionTitle, itemIcon } from './parts.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { ruhmAmount, nameLine } from './arenaparts.js';
import { thingName } from '../world/clothes.js';
import { DYES, DYE_PRICE, TITLES } from '../config.js';

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
  return h('section', { class: 'panel arena-shop' },
    sectionTitle('Für Ruhm', ruhmAmount(own.ruhm)),
    h('button', { class: 'arena-shop-row', onclick: () => openDye(game) },
      h('span', { class: 'arena-shop-main' },
        h('span', { class: 'arena-shop-name' }, 'Kleidung färben'),
        h('span', { class: 'arena-shop-sub' }, pieces > 0 ? `${pieces} ${pieces === 1 ? 'Teil lässt' : 'Teile lassen'} sich färben` : 'Noch kein Teil, das sich färben lässt')),
      ruhmAmount(DYE_PRICE)),
    h('p', { class: 'arena-label' }, 'Titel für dein Abbild'),
    h('div', { class: 'arena-title-list' }, TITLES.map((t) => h('button', { class: 'arena-shop-row', onclick: () => openTitle(t, game) },
      h('span', { class: 'arena-shop-name' }, t.name),
      own.titles[t.id] ? h('span', { class: 'arena-owned' }, 'gehört dir') : ruhmAmount(t.price)))));
}

function openTitle(title, game) {
  const own = game.state.world.arena;
  const owned = Boolean(own.titles[title.id]);
  const worn = own.titel === title.id;
  let action;
  if (worn) action = h('p', { class: 'muted' }, 'Dein Abbild trägt diesen Titel.');
  else if (owned) action = h('button', { class: 'btn primary', onclick: () => { game.setAbbild({ titel: title.id }); closeSheet(); } }, 'Tragen');
  else {
    action = h('button', {
      class: 'btn primary', disabled: own.ruhm < title.price,
      onclick: () => { game.buyTitle(title.id); game.setAbbild({ titel: title.id }); closeSheet(); toast(`Titel: ${title.name}`); },
    }, 'Für ', ruhmAmount(title.price), ' nehmen');
  }
  openSheet({
    title: 'Titel',
    className: 'arena-title-sheet',
    content: [
      h('p', { class: 'arena-title-preview' }, nameLine(game.state.world.envoy.name, title.id)),
      !owned && own.ruhm < title.price ? h('p', { class: 'arena-why' }, 'Noch nicht genug Ruhm.') : null,
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
