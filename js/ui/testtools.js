// Only in the test copy of the app (see stage.js): buttons to fill the
// Energie and to add Stein and Pilzholz, so everything can be tried without
// waiting. The real app never shows them: only the copy in the test folder is
// marked as such while it is uploaded.

import { h } from './dom.js';
import { MATERIALS } from '../config.js';
import { IS_TEST } from '../stage.js';
import { toast } from './sheet.js';

const AMOUNT = 10;

function addMaterial(game, key) {
  const before = game.state.world.purse[key] || 0;
  game.add([game.event('test', { [key]: AMOUNT })]);
  const added = (game.state.world.purse[key] || 0) - before;
  toast(added === AMOUNT ? `+${added} ${MATERIALS[key]}` : `+${added} ${MATERIALS[key]}, mehr passt nicht`);
}

export function testTools(game) {
  if (!IS_TEST) return null;
  return h('div', { class: 'test-tools' },
    h('span', { class: 'test-tools-label' }, 'Nur im Test'),
    h('div', { class: 'test-tools-buttons' },
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => { game.add([game.event('test', { energie: true })]); toast('Energie aufgefüllt'); } }, 'Energie auffüllen'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => addMaterial(game, 'stein') }, `+${AMOUNT} ${MATERIALS.stein}`),
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => addMaterial(game, 'pilzholz') }, `+${AMOUNT} ${MATERIALS.pilzholz}`)));
}
