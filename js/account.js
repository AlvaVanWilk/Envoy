// Accounts and profiles.
// An account lives on the server: a name and a password (see sync.php).
// A profile is what this device keeps for one Envoy: its events, settings
// and the login to its account. A profile without an account stays on this
// device only; an account can be added to it later.
//   profile = { id, user, token, label }
//   user and token are null without an account; label is the name of the
//   Envoy, for the list on the start screen.

import { SYNC_ENDPOINT } from './config.js';
import { store } from './store.js';
import { mergeEvents, isValidEvent } from './events.js';

export const ACCOUNT_ERRORS = {
  offline: 'Keine Verbindung.',
  unreachable: 'Der Server für Konten ist hier nicht erreichbar.',
  user_taken: 'Diesen Namen gibt es schon.',
  bad_user: 'Der Name braucht 3 bis 30 Zeichen: Buchstaben, Ziffern, Leerzeichen, Punkt oder Strich.',
  bad_password: 'Das Passwort braucht mindestens 8 Zeichen.',
  login_failed: 'Name oder Passwort stimmt nicht.',
  locked: 'Zu viele Versuche. In 15 Minuten geht es wieder.',
  account_limit: 'Der Server nimmt keine weiteren Konten an.',
  auth: 'Bitte neu anmelden.',
};
export const errorText = (error) => ACCOUNT_ERRORS[error?.message] || 'Das hat nicht geklappt.';

function newId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

// One request to sync.php. Errors carry the server's short code.
export async function post(body) {
  let response;
  try {
    response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new Error(navigator.onLine === false ? 'offline' : 'unreachable');
  }
  const data = await response.json().catch(() => null);
  if (!data) throw new Error('unreachable'); // e.g. a web space without PHP
  if (!response.ok || !data.ok) throw new Error(data.error || `status_${response.status}`);
  return data;
}

const sameUser = (a, b) => Boolean(a && b) && a.toLocaleLowerCase('de') === b.toLocaleLowerCase('de');

export const account = {
  profiles: () => store.loadProfiles(),

  active() {
    const id = store.loadActive();
    return this.profiles().find((p) => p.id === id) || null;
  },

  save(profile) {
    const others = this.profiles().filter((p) => p.id !== profile.id);
    store.saveProfiles([...others, profile]);
  },

  activate(profile) {
    this.save(profile);
    store.saveActive(profile.id);
  },

  // The name of the Envoy, shown on the start screen.
  setLabel(label) {
    const profile = this.active();
    if (profile && label && profile.label !== label) this.save({ ...profile, label });
  },

  // A game from before the accounts on this device, or null.
  legacy: () => store.loadLegacy(),

  // A new account on the server, with a new profile on this device.
  async register(user, password, { adopt = false } = {}) {
    const answer = await post({ action: 'register', user, password });
    const profile = { id: newId(), user: answer.user, token: answer.token, label: '' };
    await this.fill(profile, adopt);
    this.activate(profile);
  },

  // Logs in. A profile of this account on this device is used again.
  async login(user, password, { adopt = false } = {}) {
    const answer = await post({ action: 'login', user, password });
    const known = this.profiles().find((p) => sameUser(p.user, answer.user));
    const profile = { ...(known || { id: newId(), label: '' }), user: answer.user, token: answer.token };
    await this.fill(profile, adopt);
    this.activate(profile);
  },

  // Without an account: the Envoy stays on this device.
  async local({ adopt = false } = {}) {
    const profile = { id: newId(), user: null, token: null, label: '' };
    await this.fill(profile, adopt);
    this.activate(profile);
  },

  // Continue with a profile that needs no password (one without account).
  resume(profile) {
    this.activate(profile);
  },

  // Adds a new account to the running profile; all its events go up once.
  async attach(user, password) {
    const answer = await post({ action: 'register', user, password });
    const profile = { ...this.active(), user: answer.user, token: answer.token };
    this.save(profile);
    const sync = store.loadSync();
    store.saveSync({ ...sync, since: 0, lastError: null, outbox: store.loadEvents().map((e) => e.id) });
  },

  // Logs this device out. The profile stays, so logging in again is quick.
  async logout() {
    const profile = this.active();
    if (profile?.token) post({ action: 'logout', user: profile.user, token: profile.token }).catch(() => {});
    if (profile) this.save({ ...profile, token: null });
    store.saveActive(null);
  },

  // Leaves a profile without account; it stays in the list.
  leave() {
    store.saveActive(null);
  },

  // Prepares the storage of a profile. With `adopt`, the game from before
  // the accounts is taken along, including what its old device key knows.
  async fill(profile, adopt) {
    store.useProfile(profile.id);
    const legacy = adopt ? store.loadLegacy() : null;
    if (legacy) {
      let events = legacy.events.filter(isValidEvent);
      if (legacy.key) {
        try {
          const answer = await post({ key: legacy.key, since: 0, events });
          events = mergeEvents(events, (answer.events || []).filter(isValidEvent));
        } catch { /* take what this device has */ }
      }
      store.saveEvents(mergeEvents(store.loadEvents(), events));
      if (Object.keys(store.loadUi()).length === 0) store.saveUi(legacy.ui || {});
      store.markLegacyAdopted(profile.id);
    }
    if (profile.token) {
      // everything on this device goes to the account once
      const sync = store.loadSync();
      const outbox = new Set([...sync.outbox, ...store.loadEvents().map((e) => e.id)]);
      store.saveSync({ ...sync, lastError: null, outbox: [...outbox] });
    }
  },
};
