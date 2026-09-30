// Settings: the account and sync, the Envoy's look, backup file, facts
// about the data, resetting this device.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { sync } from '../sync.js';
import { account, ACCOUNT_ERRORS, errorText } from '../account.js';
import { game } from '../game.js';
import { store } from '../store.js';
import { toast, openSheet, closeSheet } from './sheet.js';
import { APP_VERSION } from '../config.js';
import { dayKey } from '../days.js';
import { resetEnvoyTour } from './tours.js';

const ERRORS = {
  ...ACCOUNT_ERRORS,
  offline: 'Offline. Wird nachgeholt.',
  storage: 'Der Server konnte nicht speichern.',
  storage_damaged: 'Die Datei auf dem Server ist beschädigt.',
};

function syncStatusText() {
  const st = sync.settings;
  if (sync.running) return 'Gleicht ab …';
  if (st.lastError) return ERRORS[st.lastError] || 'Abgleich fehlgeschlagen.';
  if (st.lastSync) {
    const d = new Date(st.lastSync);
    const today = dayKey(d) === dayKey();
    const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `Abgeglichen ${today ? 'heute' : d.toLocaleDateString('de-DE')} ${time}`;
  }
  return 'Noch nicht abgeglichen.';
}

function accountPanel() {
  const profile = account.active();
  if (!profile?.user) {
    return h('section', { class: 'panel settings-panel' },
      h('h2', { class: 'section-title' }, 'Konto'),
      h('p', { class: 'muted' }, 'Nur auf diesem Gerät gespeichert.'),
      h('div', { class: 'button-row' },
        h('button', { class: 'btn primary', onclick: openAttach }, 'Konto erstellen'),
        h('button', { class: 'btn text', onclick: () => { account.leave(); location.reload(); } }, 'Profil wechseln')));
  }
  const status = sync.settings.lastError ? 'error' : sync.settings.outbox.length > 0 ? 'pending' : 'ok';
  const relogin = sync.settings.lastError === 'auth';
  return h('section', { class: 'panel settings-panel' },
    h('h2', { class: 'section-title' }, 'Konto'),
    h('p', { class: 'account-name' }, 'Angemeldet als ', h('strong', {}, profile.user)),
    h('p', { class: `sync-status ${status}` }, h('span', { class: 'dot' }), syncStatusText()),
    h('div', { class: 'button-row' },
      relogin ? null : h('button', { class: 'btn ghost', onclick: () => sync.run() }, icon(UI_ICONS.sync), 'Jetzt abgleichen'),
      h('button', { class: relogin ? 'btn primary' : 'btn text', onclick: confirmLogout }, relogin ? 'Neu anmelden' : 'Abmelden')));
}

// A local profile gets an account: everything so far goes to the server.
function openAttach() {
  const user = h('input', { class: 'field', type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', placeholder: 'Name', 'aria-label': 'Name' });
  const password = h('input', { class: 'field', type: 'password', autocomplete: 'new-password', placeholder: 'Passwort', 'aria-label': 'Passwort' });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const create = async () => {
    error.textContent = '';
    try {
      await account.attach(user.value, password.value);
      sync.load();
      closeSheet();
      toast('Konto erstellt.');
      await sync.run();
      game.refresh();
    } catch (e) {
      error.textContent = errorText(e);
    }
  };
  openSheet({
    title: 'Konto erstellen',
    content: [
      h('label', { class: 'form-field' }, h('span', {}, 'Name'), user),
      h('label', { class: 'form-field' }, h('span', {}, 'Passwort'), password),
      error,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Abbrechen'),
        h('button', { class: 'btn primary', onclick: create }, 'Erstellen')),
    ],
  });
}

function confirmLogout() {
  const pending = sync.settings.outbox.length > 0;
  openSheet({
    title: 'Abmelden',
    content: [
      h('p', {}, pending
        ? 'Einiges ist noch nicht abgeglichen. Es bleibt auf diesem Gerät und geht beim nächsten Anmelden auf den Server.'
        : 'Der Spielstand bleibt auf dem Server und auf diesem Gerät.'),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Abbrechen'),
        h('button', { class: 'btn primary', onclick: async () => { await account.logout(); location.reload(); } }, 'Abmelden')),
    ],
  });
}

function envoyPanel() {
  const envoy = game.state.world.envoy;
  return h('section', { class: 'panel settings-panel' },
    h('h2', { class: 'section-title' }, 'Envoy'),
    h('p', {}, envoy?.name || 'Envoy'),
    h('div', { class: 'button-row' },
      h('a', { class: 'btn ghost', href: '#aussehen' }, 'Aussehen und Name ändern'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { resetEnvoyTour(); location.hash = '#envoy'; } }, 'Rundgang ansehen')));
}

function backupPanel() {
  const save = () => {
    const blob = new Blob([JSON.stringify({ app: 'envoy', version: 1, events: game.events }, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `envoy-sicherung-${dayKey()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true,
    onchange: async (e) => {
      const file = e.currentTarget.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (data.app !== 'envoy' || !Array.isArray(data.events)) throw new Error('format');
        const added = game.receive(data.events);
        if (sync.enabled()) {
          sync.settings.outbox = game.events.map((ev) => ev.id);
          sync.save();
          sync.run();
        }
        toast(added > 0 ? `${added} Einträge übernommen.` : 'Nichts Neues in der Datei.');
      } catch {
        toast('Datei nicht lesbar.');
      }
      e.currentTarget.value = '';
    },
  });
  return h('section', { class: 'panel settings-panel' },
    h('h2', { class: 'section-title' }, 'Sicherung'),
    h('div', { class: 'button-row' },
      h('button', { class: 'btn ghost', onclick: save }, 'Sicherung speichern'),
      h('button', { class: 'btn ghost', onclick: () => fileInput.click() }, 'Sicherung laden'),
      fileInput));
}

function aboutPanel() {
  const c = game.catalog;
  const generated = c.generated ? new Date(c.generated).toLocaleDateString('de-DE') : '–';
  return h('section', { class: 'panel settings-panel' },
    h('h2', { class: 'section-title' }, 'Daten'),
    h('dl', { class: 'facts' },
      h('div', {}, h('dt', {}, 'Übungen'), h('dd', {}, `${c.exercises.length} · Stand ${generated}`)),
      h('div', {}, h('dt', {}, 'Ausrüstung'), h('dd', {}, String(c.equipment.length))),
      h('div', {}, h('dt', {}, 'Einträge'), h('dd', {}, String(game.events.length))),
      h('div', {}, h('dt', {}, 'Erster Tag'), h('dd', {}, new Date(`${game.state.firstDay}T12:00`).toLocaleDateString('de-DE'))),
      h('div', {}, h('dt', {}, 'Version'), h('dd', {}, APP_VERSION))));
}

function resetPanel() {
  const confirmReset = () => openSheet({
    title: 'Gerät zurücksetzen',
    content: [
      h('p', {}, 'Löscht alle Envoys und Daten auf diesem Gerät. Was in einem Konto auf dem Server liegt, bleibt dort. Envoys ohne Konto sind ohne Sicherung verloren.'),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Abbrechen'),
        h('button', { class: 'btn danger', onclick: () => { store.clearAll(); location.reload(); } }, 'Löschen')),
    ],
  });
  return h('section', { class: 'panel settings-panel' },
    h('h2', { class: 'section-title' }, 'Dieses Gerät'),
    h('div', { class: 'button-row' }, h('button', { class: 'btn text danger-text', onclick: confirmReset }, 'Zurücksetzen')));
}

export function renderSettings() {
  return h('section', { class: 'view settings' },
    h('header', { class: 'view-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, 'Envoy'), h('h1', {}, 'Einstellungen'))),
    h('div', { class: 'settings-grid' }, accountPanel(), envoyPanel(), backupPanel(), aboutPanel(), resetPanel()));
}
