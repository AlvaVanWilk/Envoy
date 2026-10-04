// The running game: holds the events, recalculates the state and offers
// the actions the person can take. Views subscribe to changes.
// Every action only writes an event; the state follows from replay.js.

import { createEvent, mergeEvents, newDeviceId, isValidEvent } from './events.js';
import { replay, unmetRequirements } from './replay.js';
import { taskFor, taskOfDone } from './tasks.js';
import { dayKey } from './days.js';
import { store } from './store.js';
import { effects, staminaAt, hoursUntilFull, maxStamina, staminaPerHour, sleepBonus } from './world/hero.js';
import { hasSpace, atCamp, reachable } from './world/inventory.js';
import { questById, questState } from './world/quests.js';
import { addition, legStamina, progressAt } from './world/expedition.js';
import { camp } from './world/map.js';
import { runQuest, siteStamina, gatherEstimate } from './world/run.js';
import { projectedWorld } from './world/worldstate.js';
import { MINUTES_PER_STAMINA } from './config.js';
import { offersFor } from './world/trader.js';
import { sellPrice } from './world/items.js';
import { bonusOf, withBonus, runningBonuses } from './achievements.js';

const REPORT_HOURS = 48;
const listeners = new Set();
const addListeners = new Set();

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

  // Recalculate, notify views.
  refresh() {
    this.state = replay(this.events, this.catalog, dayKey(), Date.now());
    for (const fn of listeners) fn(this.state);
  },

  event(type, fields) {
    return createEvent(type, fields, this.deviceId);
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

  // Called regularly: after 03:00 a new day begins.
  checkDayChange() {
    if (this.state && dayKey() !== this.state.today) this.refresh();
  },

  // --- daily tasks --------------------------------------------------------

  // The task of an area today (see tasks.js): as it was done, or with the
  // stages of the morning (in Krankheitsmodus all at stage 1).
  todayTask(stat) {
    const done = this.state.todayDone[stat];
    const task = done ? taskOfDone(done, this.catalog) : null;
    return task || taskFor(stat, this.state.intensityAtDayStart, this.state.sick, this.catalog);
  },

  // What finishing the task brings now: its points with the bonus of the
  // achievements that still count.
  gainFor(task) {
    return withBonus(task.xp, bonusOf(this.state.achievements, 'tageswerk', Date.now()));
  },

  // Time-limited bonuses running now: [{ achievement, end }], for the display.
  bonuses() {
    return runningBonuses(this.state.achievements, Date.now());
  },

  // antworten: { row id: answer id } for the questions asked (see tasks.js);
  // zuviel: „Das war heute zu viel“.
  complete(stat, { antworten = {}, zuviel = false } = {}) {
    const task = this.todayTask(stat);
    if (!task || this.state.todayDone[stat]) return;
    const teile = task.parts.map((p) => p.row.id);
    const fields = { stat, teile, xp: task.xp };
    const given = Object.fromEntries(Object.entries(antworten).filter(([id, a]) => teile.includes(id) && typeof a === 'string'));
    if (Object.keys(given).length > 0) fields.antworten = given;
    if (zuviel) fields.zuviel = true;
    if (this.state.sick) fields.sick = true;
    this.add([this.event('done', fields)]);
  },

  undo(stat) {
    const done = this.state.todayDone[stat];
    if (!done) return;
    this.add([this.event('undo', { ref: done.id })]);
  },

  setSick(on) {
    if (Boolean(on) === this.state.sick) return;
    this.add([this.event('mode', { sick: Boolean(on) })]);
  },

  // --- world: what is true right now ---------------------------------------

  ctx() {
    const s = this.state;
    return {
      catalog: this.catalog,
      world: s.world,
      stats: s.stats,
      statsAtDayStart: s.statsAtDayStart,
      fx: effects(s.world, this.catalog),
      totals: s.totals,
      day: s.today,
      bonus: { sammeln: bonusOf(s.achievements, 'sammeln', Date.now()) },
    };
  },



  stamina() {
    const c = this.ctx();
    const now = Date.now();
    return {
      value: staminaAt(c.world, now, c.stats, c.fx),
      max: maxStamina(c.stats),
      hoursToFull: hoursUntilFull(c.world, now, c.stats, c.fx),
      perHour: staminaPerHour(c.stats, c.fx),
      rested: sleepBonus(c.world, c.catalog, c.stats),   // what the Schlafplatz gives each morning
    };
  },

  unlocked(feature) {
    return this.state.world.unlocked.includes(feature);
  },

  // --- world: expeditions ---------------------------------------------------

  // What doing a quest (gathering, building) now would take, for its window.
  // With nothing to do the Envoy sets out for it; while he is away it joins
  // the row of what he does, and he goes there straight from the last place.
  //   busy   it would join the row
  //   state  the quest as it will be once the row is done (see projectedWorld)
  //   cost   Energie set aside now: { least, most, way, alone }
  //          least/most: gathering takes as much as the dice want
  //          way: the part of it that is way (in a row the way home before is given back)
  //          alone: the way there and back for this quest on its own
  //   block  why not, or null: 'closed' (the quest is not open then),
  //          'energy' (not enough Energie now), 'never' (the bar is too short for it)
  // Something that begins right away must surely fit into the Energie; for
  // something that joins the row the best dice count (see worldstate.js).
  plan(questId, options = {}) {
    const c = this.ctx();
    const quest = questById(questId, c);
    if (!quest) return null;
    const busy = Boolean(c.world.expedition);
    const after = busy ? { ...c, world: projectedWorld(c.world, c) } : c;
    const state = questState(quest, after);
    const place = this.catalog.placeById.get(quest.place);
    const home = camp(this.catalog);
    const add = addition(c.world, place, Date.now(), c);
    const way = (add.way + add.home) / MINUTES_PER_STAMINA - add.credit;
    const work = quest.gather
      ? gatherEstimate(quest, after, { amount: options.amount }).energy
      : { min: siteStamina(quest, c.stats), max: siteStamina(quest, c.stats) };
    const cost = {
      least: way + work.min,
      most: way + work.max,
      way,
      alone: legStamina(home, place, c) + legStamina(place, home, c),
      work,
    };
    const st = this.stamina();
    const needed = Math.ceil(busy ? cost.least : cost.most);
    let block = null;
    if (state.status !== 'open') block = 'closed';
    else if (needed > Math.max(st.max, Math.floor(st.value))) block = 'never';
    else if (needed > Math.floor(st.value)) block = 'energy';
    return { quest, busy, state, ctx: after, cost, block };
  },

  // The stage of the camp once the row of the Envoy is done: while he raises
  // the camp, what the new stage opens can already join the row.
  stageAhead() {
    const c = this.ctx();
    return (c.world.expedition ? projectedWorld(c.world, c) : c.world).camp.stage;
  },

  // The running expedition, with its progress right now.
  expedition() {
    const exp = this.state.world.expedition;
    return exp ? { ...exp, progress: progressAt(exp, Date.now()) } : null;
  },

  // Where a quest is in the row of the running expedition, if it is there and
  // not done yet: { index, count, action, removable } (only the last one,
  // while it has not begun, can be taken out).
  queued(questId) {
    const exp = this.state.world.expedition;
    const index = exp ? exp.actions.findIndex((a) => a.q === questId && a.stage < 3) : -1;
    if (index < 0) return null;
    const action = exp.actions[index];
    return { index, count: exp.actions.length, action, removable: index === exp.actions.length - 1 && action.stage === 0 };
  },

  // Sets out for a quest, or adds it to the row. The result is rolled now.
  startExpedition(questId, options = {}) {
    const plan = this.plan(questId, options);
    if (!plan || plan.block) return null;
    const { quest } = plan;
    const event = this.event('expedition', { q: quest.id, place: quest.place, title: quest.name });
    const outcome = runQuest(quest, plan.ctx, event.id, { amount: options.amount });
    if (quest.gather && outcome.stamina < 1) return null;
    Object.assign(event, { least: Math.min(plan.cost.work.min, outcome.stamina), outcome });
    this.add([event]);
    return event;
  },

  // Takes the last action out of the row again, while it has not begun.
  unqueue(actionId) {
    const exp = this.state.world.expedition;
    const last = exp?.actions[exp.actions.length - 1];
    if (last && last.id === actionId && last.stage === 0) this.add([this.event('unqueue', { ref: actionId })]);
  },

  // Finished expeditions of the last two days this device has not shown yet.
  unseenReports() {
    const seen = new Set(store.loadUi().seenReports || []);
    const since = Date.now() - REPORT_HOURS * 3600000;
    return this.state.world.reports.filter((r) => !seen.has(r.id) && r.end >= since);
  },

  markReportSeen(id) {
    const ui = store.loadUi();
    ui.seenReports = [...(ui.seenReports || []), id].slice(-60);
    store.saveUi(ui);
  },

  offers() {
    return offersFor(this.state.today, this.ctx()).filter((o) => !this.state.world.bought[o.offer]);
  },

  buy(offer) {
    if (!this.unlocked('haendler') || this.state.world.purse.splitter < offer.price) return;
    this.add([this.event('buy', { offer: offer.offer, kind: offer.kind, thing: offer.id, price: offer.price })]);
  },

  sell(inst) {
    const entry = this.state.world.items[inst];
    if (!entry || !this.unlocked('haendler') || !reachable(this.state.world, entry)) return;
    this.add([this.event('sell', { inst, price: sellPrice(entry, this.catalog) })]);
  },

  drop(inst) {
    const entry = this.state.world.items[inst];
    if (entry && reachable(this.state.world, entry)) this.add([this.event('drop', { inst })]);
  },

  // At the camp: the storage can be used.
  atCamp() {
    return atCamp(this.state.world);
  },

  move(inst, to) {
    if (this.atCamp() && hasSpace(this.state.world, this.catalog, to)) this.add([this.event('move', { inst, to })]);
  },

  canEquip(item) {
    return unmetRequirements(item, this.state.stats).length === 0;
  },

  equip(slot, inst) {
    const entry = this.state.world.items[inst];
    const item = entry && this.catalog.itemById.get(entry.id);
    if (!item || item.slot !== slot || !this.canEquip(item) || !reachable(this.state.world, entry)) return;
    this.add([this.event('equip', { slot, inst })]);
  },

  unequip(slot) {
    if (this.state.world.equipped[slot]) this.add([this.event('unequip', { slot })]);
  },

  // Name and look of the Envoy, at the creation or changed later.
  setEnvoy({ name, figur, haut, haar }) {
    const clean = String(name || '').trim();
    if (!clean) return;
    this.add([this.event('envoy', { name: clean, figur, haut, haar })]);
  },
};

// Sync listens here for new local events.
export function onLocalEvents(fn) {
  addListeners.add(fn);
}
