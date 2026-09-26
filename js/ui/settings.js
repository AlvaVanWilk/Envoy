// Settings: device sync, backup file, facts about the data.

import { h, icon } from './dom.js';
import { UI_ICONS } from './icons.js';
import { sync, generateKey, formatKey, isPlausibleKey } from '../sync.js';
import { game } from '../game.js';
import { store } from '../store.js';
import { toast, openSheet, closeSheet } from './sheet.js';
import { APP_VERSION } from '../config.js';
import { dayKey } from '../days.js';

const ERRORS = {
  offline: 'Offline. Wird nachgeholt.',
  profile_limit: 'Der Server nimmt keine weiteren Schlüssel an.',
  bad_key: 'Schlüssel ungültig.',
  status_404: 'sync.php wurde nicht gefunden.',
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

function syncPanel() {
  if (!sync.enabled()) {
    const input = h('input', {
      type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX', 'aria-label': 'Schlüssel',
    });
    const connect = () => {
      if (!isPlausibleKey(input.value)) {
        toast('Schlüssel ungültig.');
        return;
      }
      sync.connect(input.value);
    };
    return h('section', { class: 'panel settings-panel' },
      h('h2', { class: 'section-title' }, 'Abgleich'),
      h('p', { class: 'muted' }, 'Nur auf diesem Gerät gespeichert.'),
      h('div', { class: 'button-row' },
        h('button', { class: 'btn primary', onclick: () => sync.connect(generateKey()) }, 'Neuen Schlüssel erzeugen')),
      h('div', { class: 'field-row' }, input,
        h('button', { class: 'btn ghost', onclick: connect }, 'Verbinden')));
  }

  const key = formatKey(sync.settings.key);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(key);
      toast('Kopiert.');
    } catch {
      toast('Kopieren nicht möglich.');
    }
  };
  const status = sync.settings.lastError ? 'error' : sync.settings.outbox.length > 0 ? 'pending' : 'ok';
  return h('section', { class: 'panel settings-panel' },
    h('h2', { class: 'section-title' }, 'Abgleich'),
    h('p', { class: `sync-status ${status}` }, h('span', { class: 'dot' }), syncStatusText()),
    h('div', { class: 'key-box' },
      h('code', { class: 'key' }, key),
      h('button', { class: 'btn text small', onclick: copy }, 'Kopieren')),
    h('div', { class: 'button-row' },
      h('button', { class: 'btn ghost', onclick: () => sync.run() }, icon(UI_ICONS.sync), 'Jetzt abgleichen'),
      h('button', { class: 'btn text', onclick: confirmDisconnect }, 'Trennen')));
}

function confirmDisconnect() {
  openSheet({
    title: 'Abgleich trennen',
    content: [
      h('p', {}, 'Die Daten bleiben auf diesem Gerät und auf dem Server.'),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Abbrechen'),
        h('button', { class: 'btn primary', onclick: () => { sync.disconnect(); closeSheet(); } }, 'Trennen')),
    ],
  });
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
      h('p', {}, sync.enabled()
        ? 'Löscht alle Daten auf diesem Gerät. Auf dem Server bleiben sie erhalten.'
        : 'Löscht alle Daten auf diesem Gerät. Ohne Sicherung sind sie verloren.'),
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
      h('p', { class: 'eyebrow' }, 'Envoy'),
      h('h1', {}, 'Einstellungen')),
    h('div', { class: 'settings-grid' }, syncPanel(), backupPanel(), aboutPanel(), resetPanel()));
}
