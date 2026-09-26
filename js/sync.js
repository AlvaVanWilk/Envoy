// Keeps several devices in step through sync.php on the own web space.
// Each device sends the events the server has not confirmed yet and gets
// back every event it has not seen. Nothing is ever overwritten, so there
// are no conflicts to resolve.

import { SYNC_ENDPOINT } from './config.js';
import { game, onLocalEvents } from './game.js';
import { store } from './store.js';

const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RETRY_DELAY_MS = 2000;

const listeners = new Set();
let timer = null;
let running = false;

export const sync = {
  settings: store.loadSync(),
  running: false,

  init() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.run();
    });
    window.addEventListener('online', () => this.run());
    this.run();
  },

  enabled() {
    return Boolean(this.settings.key);
  },

  save() {
    store.saveSync(this.settings);
    for (const fn of listeners) fn(this);
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => this.run(), RETRY_DELAY_MS);
  },

  // Connect this device. All local events go to the server once.
  connect(key) {
    this.settings = {
      key: normalizeKey(key),
      since: 0,
      outbox: game.events.map((e) => e.id),
      lastSync: null,
      lastError: null,
    };
    this.save();
    return this.run();
  },

  disconnect() {
    this.settings = { key: '', since: 0, outbox: [], lastSync: null, lastError: null };
    this.save();
  },

  async run() {
    if (!this.settings.key || running) return;
    running = true;
    this.running = true;
    this.save();
    const outbox = new Set(this.settings.outbox);
    const sending = game.events.filter((e) => outbox.has(e.id));
    try {
      const response = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: this.settings.key, since: this.settings.since, events: sending }),
        cache: 'no-store',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) throw new Error(body.error || `status_${response.status}`);

      game.receive(body.events || []);
      const sent = new Set(sending.map((e) => e.id));
      if (body.seq < this.settings.since) {
        // The server lost data: send everything this device knows again.
        this.settings.outbox = game.events.map((e) => e.id);
        this.schedule();
      } else {
        this.settings.outbox = this.settings.outbox.filter((id) => !sent.has(id));
      }
      this.settings.since = body.seq;
      this.settings.lastSync = Date.now();
      this.settings.lastError = null;
    } catch (error) {
      this.settings.lastError = navigator.onLine === false ? 'offline' : String(error.message || error);
    } finally {
      running = false;
      this.running = false;
      this.save();
    }
  },
};

// Registered when this file loads, before the game creates its first events,
// so no local event is missed.
onLocalEvents((events) => {
  if (!sync.settings.key) return;
  sync.settings.outbox.push(...events.map((e) => e.id));
  sync.save();
  sync.schedule();
});

export function generateKey() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return formatKey(Array.from(bytes, (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join(''));
}

export function normalizeKey(input) {
  return String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatKey(key) {
  return normalizeKey(key).replace(/(.{4})(?=.)/g, '$1-');
}

export function isPlausibleKey(input) {
  return /^[A-Z0-9]{20,64}$/.test(normalizeKey(input));
}
