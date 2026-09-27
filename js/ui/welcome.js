// The start screen when no one is logged in on this device: log in, create
// an account, or play without one. Below, the Envoys already on this device.
// After a choice the app starts anew with that profile.

import { h, replaceChildren } from './dom.js';
import { account, errorText } from '../account.js';

export function renderWelcome() {
  const legacy = account.legacy();
  const others = account.profiles();
  let mode = 'login'; // 'login' | 'register'
  let busy = false;

  const root = h('section', { class: 'view welcome' });
  const user = h('input', { class: 'field', type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', 'aria-label': 'Name', placeholder: 'Name' });
  const password = h('input', { class: 'field', type: 'password', 'aria-label': 'Passwort', placeholder: 'Passwort' });
  const show = h('button', {
    class: 'btn text small', type: 'button',
    onclick: () => {
      const hidden = password.type === 'password';
      password.type = hidden ? 'text' : 'password';
      show.textContent = hidden ? 'Verbergen' : 'Zeigen';
    },
  }, 'Zeigen');
  const adopt = h('input', { type: 'checkbox', checked: true });
  const error = h('p', { class: 'form-error', role: 'alert' });

  async function act(work) {
    if (busy) return;
    busy = true;
    error.textContent = '';
    root.classList.add('busy');
    try {
      await work();
      location.reload();
    } catch (e) {
      error.textContent = errorText(e);
      busy = false;
      root.classList.remove('busy');
    }
  }

  const submit = () => act(() => (mode === 'login'
    ? account.login(user.value, password.value, { adopt: adopt.checked })
    : account.register(user.value, password.value, { adopt: adopt.checked })));

  function draw() {
    password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    const tab = (id, label) => h('button', {
      class: `tab ${mode === id ? 'active' : ''}`, role: 'tab', type: 'button',
      onclick: () => { mode = id; error.textContent = ''; draw(); },
    }, label);

    replaceChildren(root,
      h('header', { class: 'welcome-head' },
        h('img', { class: 'welcome-sigil', src: 'assets/app/icon-192.png', alt: '' }),
        h('h1', {}, 'Envoy')),
      h('form', {
        class: 'panel welcome-form',
        onsubmit: (e) => { e.preventDefault(); submit(); },
      },
      h('div', { class: 'tabs', role: 'tablist' }, tab('login', 'Anmelden'), tab('register', 'Neues Konto')),
      h('label', { class: 'form-field' }, h('span', {}, 'Name'), user),
      h('label', { class: 'form-field' }, h('span', {}, 'Passwort'), h('span', { class: 'password-row' }, password, show)),
      legacy ? h('label', { class: 'check' }, adopt, h('span', {}, 'Den bisherigen Spielstand dieses Geräts übernehmen')) : null,
      error,
      h('button', { class: 'btn primary', type: 'submit' }, mode === 'login' ? 'Anmelden' : 'Konto erstellen')),
      others.length > 0 ? h('section', { class: 'panel welcome-profiles' },
        h('h2', { class: 'section-title' }, h('span', {}, 'Auf diesem Gerät')),
        others.map((p) => h('div', { class: 'profile-row' },
          h('span', { class: 'profile-name' }, p.label || 'Envoy', h('span', { class: 'muted' }, p.user ? ` · ${p.user}` : ' · nur auf diesem Gerät')),
          p.user
            ? h('button', { class: 'btn ghost small', type: 'button', onclick: () => { mode = 'login'; draw(); user.value = p.user; password.focus(); } }, 'Anmelden')
            : h('button', { class: 'btn ghost small', type: 'button', onclick: () => { account.resume(p); location.reload(); } }, 'Weiter')))) : null,
      h('button', {
        class: 'btn text welcome-local', type: 'button',
        onclick: () => act(() => account.local({ adopt: Boolean(legacy) && adopt.checked })),
      }, 'Ohne Konto spielen'));
  }

  draw();
  return root;
}
