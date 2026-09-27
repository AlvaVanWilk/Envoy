// Creating the Envoy: first the figure, then skin and hair colour and a
// name. The same screen changes the look later (from the settings).
// The choice is stored as an event, so it is the same on every device.

import { h, replaceChildren } from './dom.js';
import { FIGURES, SKIN_TONES, HAIR_COLORS, NAME_MAX } from '../config.js';
import { paperdoll } from './paperdoll.js';
import { resolveLook } from './look.js';

const rgb = (c) => `rgb(${c.rgb.join(',')})`;

// onDone: called after the Envoy is saved. change: true when an existing
// Envoy is changed (then there is a way back without saving).
export function renderCreate(game, { onDone, onCancel = null } = {}) {
  const current = game.state.world.envoy;
  const choice = {
    figur: current?.figur || FIGURES[0].id,
    haut: current?.haut || SKIN_TONES[0].id,
    haar: current?.haar || HAIR_COLORS[0].id,
    name: current?.name || '',
  };
  let step = 1;
  const root = h('section', { class: 'view create' });
  const { world } = game.state;
  const doll = (envoy, className) => paperdoll(world.equipped, world, game.catalog, { envoy, className });

  function figureStep() {
    return [
      h('header', { class: 'create-head' },
        h('p', { class: 'eyebrow' }, current ? 'Aussehen' : 'Neuer Envoy'),
        h('h1', {}, 'Wähle deinen Envoy')),
      h('div', { class: 'figure-choice' }, FIGURES.map((figure) => h('button', {
        class: `figure-card panel ${choice.figur === figure.id ? 'active' : ''}`,
        'aria-pressed': String(choice.figur === figure.id),
        'aria-label': figure.name,
        onclick: () => { choice.figur = figure.id; draw(); },
      }, doll({ ...choice, figur: figure.id }, 'figure-preview')))),
      h('div', { class: 'create-actions' },
        onCancel ? h('button', { class: 'btn text', onclick: onCancel }, 'Abbrechen') : null,
        h('button', { class: 'btn primary', onclick: () => { step = 2; draw(); } }, 'Weiter')),
    ];
  }

  function swatches(list, key, label) {
    // the first colour is the one the chosen figure is drawn in
    const drawn = resolveLook({ figur: choice.figur })[key === 'haut' ? 'skin' : 'hair'];
    return h('div', { class: 'swatch-group' },
      h('p', { class: 'swatch-label' }, label),
      h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': label }, list.map((c) => h('button', {
        class: `swatch ${choice[key] === c.id ? 'active' : ''}`,
        role: 'radio',
        'aria-checked': String(choice[key] === c.id),
        'aria-label': c.name,
        title: c.name,
        style: { background: rgb(c === list[0] ? drawn : c) },
        onclick: () => { choice[key] = c.id; draw(); },
      }))));
  }

  function lookStep() {
    const input = h('input', {
      class: 'field name-field', type: 'text', maxlength: String(NAME_MAX), value: choice.name,
      placeholder: 'Name', 'aria-label': 'Name des Envoy', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false',
      oninput: (e) => { choice.name = e.currentTarget.value; done.disabled = !choice.name.trim(); },
      onkeydown: (e) => { if (e.key === 'Enter' && choice.name.trim()) save(); },
    });
    const done = h('button', { class: 'btn primary', disabled: !choice.name.trim(), onclick: save }, 'Fertig');
    return [
      h('header', { class: 'create-head' },
        h('p', { class: 'eyebrow' }, current ? 'Aussehen' : 'Neuer Envoy'),
        h('h1', {}, 'Aussehen und Name')),
      h('div', { class: 'create-look' },
        h('div', { class: 'panel create-preview' }, doll(choice, 'look-preview')),
        h('div', { class: 'panel create-controls' },
          swatches(SKIN_TONES, 'haut', 'Haut'),
          swatches(HAIR_COLORS, 'haar', 'Haare'),
          h('label', { class: 'swatch-group' }, h('span', { class: 'swatch-label' }, 'Name'), input))),
      h('div', { class: 'create-actions' },
        h('button', { class: 'btn text', onclick: () => { step = 1; draw(); } }, 'Zurück'),
        done),
    ];
  }

  function save() {
    if (!choice.name.trim()) return;
    game.setEnvoy(choice);
    onDone?.();
  }

  function draw() {
    const focusName = document.activeElement?.classList.contains('name-field');
    replaceChildren(root, step === 1 ? figureStep() : lookStep());
    if (focusName) root.querySelector('.name-field')?.focus();
  }

  draw();
  return root;
}
