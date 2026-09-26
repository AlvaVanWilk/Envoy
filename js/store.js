// Local storage in the browser. Only the event list and a few settings
// are stored; everything else is recalculated.

const KEYS = {
  events: 'envoy.events',
  device: 'envoy.device',
  sync: 'envoy.sync',
  ui: 'envoy.ui',
};

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

export const store = {
  loadEvents: () => read(KEYS.events, []),
  saveEvents: (events) => write(KEYS.events, events),

  loadDeviceId: () => read(KEYS.device, null),
  saveDeviceId: (id) => write(KEYS.device, id),

  loadSync: () => read(KEYS.sync, { key: '', since: 0, outbox: [], lastSync: null, lastError: null }),
  saveSync: (sync) => write(KEYS.sync, sync),

  loadUi: () => read(KEYS.ui, {}),
  saveUi: (ui) => write(KEYS.ui, ui),

  clearAll() {
    for (const key of Object.values(KEYS)) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
  },
};
