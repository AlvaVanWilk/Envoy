// The arena on the server (arena.php): the hall with the running list and
// the own Abbild, setting it up, taking it back, challenging another one.
// Every fight of the own Abbild is written into the own list of events
// (type `kampf`, see world/arena.js) with an id from the server, so each
// device writes the same one and nothing counts twice. They come with the
// hall and with every sync (see sync.js).

import { game } from './game.js';
import { account, post } from './account.js';
import { store } from './store.js';
import { dayKey } from './days.js';
import { abbildOf, fightEventId } from './world/arena.js';
import { ARENA_ENERGY, ARENA_FROM_STAGE } from './config.js';

export const ARENA_ERRORS = {
  offline: 'Keine Verbindung.',
  unreachable: 'Der Server ist gerade nicht erreichbar.',
  auth: 'Bitte in den Einstellungen neu anmelden.',
  not_in_list: 'Dein Abbild steht gerade nicht in der Liste.',
  out_of_reach: 'Dieses Abbild steht zu weit weg.',
  today: 'Dieses Abbild hast du heute schon herausgefordert.',
  bad_abbild: 'Das Abbild ließ sich nicht aufstellen.',
};
export const arenaErrorText = (error) => ARENA_ERRORS[error?.message] || 'Das hat nicht geklappt.';

const listeners = new Set();

export const arena = {
  hall: null,      // the latest answer of the server
  busy: false,
  error: null,

  // With an account and from the Lagerfeuer on.
  open() {
    return game.state.world.camp.stage >= ARENA_FROM_STAGE;
  },

  hasAccount() {
    const profile = account.active();
    return Boolean(profile?.user && profile?.token);
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  changed() {
    for (const fn of listeners) fn(this);
  },

  // What goes along with a request: the login, the Abbild as it is now, and
  // the number of the latest fight already written down.
  base(action) {
    const profile = account.active();
    const known = store.loadArena();
    return { action, user: profile.user, token: profile.token, abbild: abbildOf(game.state), arenaId: known.id, since: known.since };
  },

  async request(action, extra = {}) {
    this.busy = true;
    this.error = null;
    this.changed();
    try {
      const hall = await post({ ...this.base(action), ...extra });
      this.hall = hall;
      this.record(hall.id, hall.fights, hall.kampf);
      return hall;
    } catch (error) {
      this.error = error;
      throw error;
    } finally {
      this.busy = false;
      this.changed();
    }
  },

  load() {
    return this.request('arena').catch(() => null);
  },

  join() {
    return this.request('arena_join');
  },

  leave() {
    return this.request('arena_leave');
  },

  // Challenges the Abbild with the id `gegner`; returns the fight with its rounds.
  async challenge(gegner, haltung) {
    const hall = await this.request('arena_fight', { gegner, haltung });
    return hall.kampf;
  },

  // Writes down the fights not written yet. `fight` (the one just fought)
  // carries its rounds; the others come short.
  record(arenaId, fights = [], fight = null) {
    if (!arenaId) return;
    const known = store.loadArena();
    let since = known.id === arenaId ? known.since : 0;
    const have = new Set(game.events.map((e) => e.id));
    const fresh = [];
    for (const f of fight ? [...fights.filter((x) => x.s !== fight.s), fight] : fights) {
      since = Math.max(since, f.s);
      const id = fightEventId(arenaId, f.s);
      if (have.has(id)) continue;
      fresh.push({
        id, t: f.t, d: dayKey(new Date(f.t)), dev: game.deviceId, type: 'kampf',
        kampf: f.s, rolle: f.rolle, gegner: f.gegner, ergebnis: f.ergebnis, ruhm: f.ruhm, platz: f.platz,
        ...(f.rolle === 'fordert' ? { energie: ARENA_ENERGY } : {}),   // what it cost (nothing now)
        ...(f.runden ? { haltung: f.haltung, gegnerHaltung: f.gegnerHaltung, entscheid: f.entscheid, leben: f.leben, runden: f.runden } : {}),
      });
    }
    store.saveArena({ id: arenaId, since });
    if (fresh.length > 0) game.add(fresh);
  },
};
