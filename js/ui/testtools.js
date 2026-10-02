// Only in the test copy of the app (see stage.js): the small „Test“ sign at
// the top opens a menu that lies over the page, so no page changes because
// of it. Its buttons fill the Energie, add Stein, Pilzholz and Bannsplitter,
// and bring the Envoy back from an expedition at once, so everything can be
// tried without waiting. The real app never shows any of it: only the copy in
// the test folder is marked as such while it is uploaded.

import { h, replaceChildren } from './dom.js';
import { MATERIALS, CURRENCY } from '../config.js';
import { IS_TEST } from '../stage.js';
import { toast } from './sheet.js';

const MATERIAL_AMOUNT = 10;
const SPLITTER_AMOUNT = 50;

function addMaterial(game, key) {
  const before = game.state.world.purse[key] || 0;
  game.add([game.event('test', { [key]: MATERIAL_AMOUNT })]);
  const added = (game.state.world.purse[key] || 0) - before;
  toast(added === MATERIAL_AMOUNT ? `+${added} ${MATERIALS[key]}` : `+${added} ${MATERIALS[key]}, mehr passt nicht`);
}

function actions(game) {
  if (!game.state?.world?.envoy) return [h('p', { class: 'test-menu-note' }, 'Erst einen Envoy anlegen.')];
  const run = (fields, message) => () => { game.add([game.event('test', fields)]); toast(message); };
  const button = (label, onclick, disabled = false) => h('button', { class: 'btn ghost small', type: 'button', disabled, onclick }, label);
  return [
    button('Energie auffüllen', run({ energie: true }, 'Energie aufgefüllt')),
    button(`+${MATERIAL_AMOUNT} ${MATERIALS.stein}`, () => addMaterial(game, 'stein')),
    button(`+${MATERIAL_AMOUNT} ${MATERIALS.pilzholz}`, () => addMaterial(game, 'pilzholz')),
    button(`+${SPLITTER_AMOUNT} ${CURRENCY}`, run({ splitter: SPLITTER_AMOUNT }, `+${SPLITTER_AMOUNT} ${CURRENCY}`)),
    button('Expedition beenden', run({ fertig: true }, 'Der Envoy ist zurück'), !game.state.world.expedition),
  ];
}

export function mountTestTools(game) {
  if (!IS_TEST) return;
  const list = h('div', { class: 'test-menu-buttons' });
  const menu = h('div', { class: 'test-menu', hidden: true, role: 'menu' },
    h('p', { class: 'test-menu-title' }, 'Nur im Test'), list);
  const draw = () => replaceChildren(list, actions(game));
  const close = () => { menu.hidden = true; tag.setAttribute('aria-expanded', 'false'); };
  const tag = h('button', {
    class: 'stage-tag', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Test-Menü',
    onclick: () => {
      if (!menu.hidden) { close(); return; }
      draw();
      menu.hidden = false;
      tag.setAttribute('aria-expanded', 'true');
    },
  }, 'Test');
  // the buttons stay current while the menu is open (Energie, expedition)
  game.subscribe?.(() => { if (!menu.hidden) draw(); });
  // a tap elsewhere closes it (the path, because a tapped button may be redrawn meanwhile)
  document.addEventListener('click', (e) => { const path = e.composedPath(); if (!menu.hidden && !path.includes(menu) && !path.includes(tag)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.body.append(tag, menu);
}
