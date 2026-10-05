// What comes over the whole screen once at the start, before anything else:
// the news of a new version (see news.js), then, for an Envoy from before the
// age was asked, the age. That one cannot be put aside: the Tageswerk follows
// it (children have their own exercises, see tasks.js), and once it is given
// the open tasks of today are made anew.

import { h } from './dom.js';
import { birthYearFor, ageOf } from './create.js';
import { NEWS_ID, openNews } from './news.js';
import { store } from '../store.js';

let open = false;
// While something lies over the whole screen, no tour begins (see app.js).
export const gateOpen = () => open;

const needsAge = (game) => {
  const envoy = game.state.world.envoy;
  return Boolean(envoy) && !Number.isInteger(envoy.geburtsjahr);
};

export const newsSeen = () => store.loadUi().news === NEWS_ID;
export function markNewsSeen() {
  store.saveUi({ ...store.loadUi(), news: NEWS_ID });
}

// Called after every drawing of the app; shows what is due, one after the other.
export function showGates(game) {
  if (open || !game.state.world.envoy) return;
  if (!newsSeen()) {
    open = true;
    openNews(() => {
      markNewsSeen();
      open = false;
      if (needsAge(game)) showGates(game);
      else game.refresh();   // what waited for it (a tour) comes now
    });
  } else if (needsAge(game)) {
    open = true;
    openAgeGate(game, () => { open = false; });
  }
}

function openAgeGate(game, onDone) {
  const envoy = game.state.world.envoy;
  const layer = h('div', { class: 'gate-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Wie alt bist du?' });
  const save = () => {
    const age = ageOf(field.value);
    if (age === null) return;
    layer.remove();
    onDone();
    game.setEnvoy({ ...envoy, geburtsjahr: birthYearFor(age) });
  };
  const button = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: save }, 'Weiter');
  const field = h('input', {
    class: 'field age-field', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '3',
    placeholder: 'Jahre', 'aria-label': 'Alter in Jahren', autocomplete: 'off',
    oninput: () => { button.disabled = ageOf(field.value) === null; },
    onkeydown: (e) => { if (e.key === 'Enter') save(); },
  });
  layer.append(h('div', { class: 'gate-card age-gate' },
    h('h2', { class: 'gate-title' }, 'Wie alt bist du?'),
    h('p', {}, `${envoy.name} richtet das Tageswerk danach. Kinder und Jugendliche bekommen eigene Übungen.`),
    h('div', { class: 'age-line' }, field, button)));
  document.body.append(layer);
  requestAnimationFrame(() => { layer.classList.add('open'); field.focus({ preventScroll: true }); });
}
