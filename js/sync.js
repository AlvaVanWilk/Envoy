// Keeps the devices of one account in step through sync.php on the own web
// space. Each device sends the events the server has not confirmed yet and
// gets back every event it has not seen. Nothing is ever overwritten, so
// there are no conflicts to resolve. A profile without account does not sync.

import { game, onLocalEvents } from './game.js';
import { store } from './store.js';
import { account, post } from './account.js';
import { arena } from './arena.js';
import { abbildOf } from './world/arena.js';

const RETRY_DELAY_MS = 2000;

const listeners = new Set();
let timer = null;
let running = false;

export const sync = {
  settings: { since: 0, outbox: [], lastSync: null, lastError: null },
  running: false,

  // Reads the sync state of the active profile (after store.useProfile).
  load() {
    this.settings = store.loadSync();
  },

  init() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.run();
    });
    window.addEventListener('online', () => this.run());
    this.run();
  },

  enabled() {
    const profile = account.active();
    return Boolean(profile?.user && profile?.token);
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

  async run() {
    const profile = account.active();
    if (!profile?.token || running) return;
    running = true;
    this.running = true;
    this.save();
    const outbox = new Set(this.settings.outbox);
    const sending = game.events.filter((e) => outbox.has(e.id));
    try {
      // The Abbild goes along; the server keeps it only if it stands in the arena.
      const known = store.loadArena();
      const body = await post({
        action: 'sync', user: profile.user, token: profile.token, since: this.settings.since, events: sending,
        abbild: abbildOf(game.state), arenaId: known.id, arenaSince: known.since,
      });
      game.receive(body.events || []);
      if (body.arena) arena.record(body.arena.id, body.arena.fights);
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
      this.settings.lastError = String(error.message || error);
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
  if (!sync.enabled()) return;
  sync.settings.outbox.push(...events.map((e) => e.id));
  sync.save();
  sync.schedule();
});
