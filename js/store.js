// Local storage in the browser. Every profile (one Envoy, see account.js)
// keeps its own event list, sync state and settings; only the device id
// and the list of profiles are shared by the whole device.
// Everything else is recalculated from the events.
// The test copy of the app (see stage.js) uses its own names, so it never
// touches the data of the real app on the same web space.

import { IS_TEST } from './stage.js';

const NS = IS_TEST ? 'envoy-test' : 'envoy';
const GLOBAL = {
  device: `${NS}.device`,
  profiles: `${NS}.profiles`,
  active: `${NS}.active`,
  adopted: `${NS}.legacyAdopted`,
};
// Where a game from before the accounts lies (one per device).
const LEGACY = { events: `${NS}.events`, sync: `${NS}.sync`, ui: `${NS}.ui` };

let prefix = `${NS}.p.none.`;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export const store = {
  // From now on events, sync state and settings belong to this profile.
  useProfile(id) {
    prefix = `${NS}.p.${id}.`;
  },

  loadEvents: () => read(`${prefix}events`, []),
  saveEvents: (events) => write(`${prefix}events`, events),

  loadSync: () => read(`${prefix}sync`, { since: 0, outbox: [], lastSync: null, lastError: null }),
  saveSync: (sync) => write(`${prefix}sync`, sync),

  loadUi: () => read(`${prefix}ui`, {}),
  saveUi: (ui) => write(`${prefix}ui`, ui),

  loadDeviceId: () => read(GLOBAL.device, null),
  saveDeviceId: (id) => write(GLOBAL.device, id),

  loadProfiles: () => read(GLOBAL.profiles, []),
  saveProfiles: (profiles) => write(GLOBAL.profiles, profiles),
  loadActive: () => read(GLOBAL.active, null),
  saveActive: (id) => (id ? write(GLOBAL.active, id) : remove(GLOBAL.active)),

  // A game from before the accounts, if there is one and it was not taken over yet.
  loadLegacy() {
    if (read(GLOBAL.adopted, null)) return null;
    const events = read(LEGACY.events, []);
    if (!Array.isArray(events) || events.length === 0) return null;
    return { events, key: read(LEGACY.sync, {})?.key || '', ui: read(LEGACY.ui, {}) };
  },
  // The old data stays where it is, as a spare copy; it is only marked.
  markLegacyAdopted: (profileId) => write(GLOBAL.adopted, profileId),

  // Everything of this app on this device, all profiles included.
  clearAll() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${NS}.`)) keys.push(key);
      }
      keys.forEach(remove);
    } catch { /* ignore */ }
  },
};
