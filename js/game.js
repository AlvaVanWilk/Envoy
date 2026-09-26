// The running game: holds the events, recalculates the state and offers
// the few actions the person can take. Views subscribe to changes.

import { createEvent, mergeEvents, newDeviceId, isValidEvent } from './events.js';
import { replay, unmetRequirements } from './replay.js';
import { missingPlans } from './planner.js';
import { dayKey } from './days.js';
import { store } from './store.js';

const listeners = new Set();

export const game = {
  catalog: null,
  events: [],
  state: null,
  deviceId: null,

  init(catalog) {
    this.catalog = catalog;
    this.deviceId = store.loadDeviceId();
    if (!this.deviceId) {
      this.deviceId = newDeviceId();
      store.saveDeviceId(this.deviceId);
    }
    this.events = store.loadEvents().filter(isValidEvent);
    this.refresh();
  },

  // Recalculate, add missing plans for today, notify views.
  refresh() {
    this.state = replay(this.events, this.catalog, dayKey());
    const plans = missingPlans(this.state, this.catalog);
    const newEvents = Object.entries(plans).map(([stat, exercise]) =>
      createEvent('plan', { stat, ex: exercise.id }, this.deviceId));
    if (newEvents.length > 0) {
      this.add(newEvents);
      return;
    }
    for (const fn of listeners) fn(this.state);
  },

  add(newEvents) {
    this.events = mergeEvents(this.events, newEvents);
    store.saveEvents(this.events);
    for (const fn of addListeners) fn(newEvents);
    this.refresh();
  },

  // Events from another device or a backup file.
  receive(incoming) {
    const valid = incoming.filter(isValidEvent);
    const before = this.events.length;
    this.events = mergeEvents(this.events, valid);
    if (this.events.length !== before) {
      store.saveEvents(this.events);
      this.refresh();
    }
    return this.events.length - before;
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // --- what the person can do -------------------------------------------

  todayExercise(stat) {
    const plan = this.state.todayPlan[stat];
    const done = this.state.todayDone[stat];
    const id = done ? done.ex : plan ? plan.ex : null;
    return id ? this.catalog.exerciseById.get(id) || null : null;
  },

  complete(stat, feedback, measurements) {
    const exercise = this.todayExercise(stat);
    if (!exercise || this.state.todayDone[stat]) return;
    this.add([createEvent('done', {
      stat, ex: exercise.id, xp: exercise.xp, fb: feedback, m: measurements,
    }, this.deviceId)]);
  },

  undo(stat) {
    const done = this.state.todayDone[stat];
    if (!done) return;
    this.add([createEvent('undo', { ref: done.id }, this.deviceId)]);
  },

  canEquip(item) {
    return unmetRequirements(item, this.state.stats).length === 0;
  },

  equip(slot, itemId) {
    const item = this.catalog.itemById.get(itemId);
    if (!item || item.slot !== slot || !this.canEquip(item)) return;
    this.add([createEvent('equip', { slot, item: itemId }, this.deviceId)]);
  },

  unequip(slot) {
    if (!this.state.equipped[slot]) return;
    this.add([createEvent('unequip', { slot }, this.deviceId)]);
  },

  // Called regularly: after 03:00 a new day begins.
  checkDayChange() {
    if (this.state && dayKey() !== this.state.today) this.refresh();
  },
};

// Sync listens here for new local events.
const addListeners = new Set();
export function onLocalEvents(fn) {
  addListeners.add(fn);
}
