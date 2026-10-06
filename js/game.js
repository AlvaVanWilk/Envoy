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
import { addition, progressAt } from './world/expedition.js';
import { runQuest, siteStamina, gatherEstimate } from './world/run.js';
import { projectedWorld } from './world/worldstate.js';
import { DYE_PRICE, RULES, RULES_NOW } from './config.js';
import { titleById } from './world/arena.js';
import { offersFor } from './world/trader.js';
import { sellPrice } from './world/items.js';
import { nextFloor, blockedAt, descend } from './world/depths.js';
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
    // when this device first opened this Envoy (see unseenReports)
    const ui = store.loadUi();
    if (!ui.since) store.saveUi({ ...ui, since: Date.now() });
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
    return task || taskFor(stat, this.state.intensityAtDayStart, this.state.sick, this.catalog, this.state.age);
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

  // The whole task (what is still open of it). antworten: { row id: answer
  // id } for the questions asked (see tasks.js), together with those given
  // for exercises done one by one; zuviel: „Das war heute zu viel“.
  complete(stat, { antworten = {}, zuviel = false } = {}) {
    const task = this.todayTask(stat);
    if (!task || this.state.todayDone[stat]) return;
    const teile = task.parts.map((p) => p.row.id);
    const fields = { stat, teile, xp: task.xp, regel: RULES };
    const earlier = Object.fromEntries(Object.entries(this.partsDone(stat)).filter(([, p]) => p.antwort).map(([id, p]) => [id, p.antwort]));
    const given = Object.fromEntries(Object.entries({ ...earlier, ...antworten }).filter(([id, a]) => teile.includes(id) && typeof a === 'string'));
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

  // The exercises of today's task done one by one: { row id: { id, antwort } }.
  partsDone(stat) {
    return this.state.todayParts?.[stat] || {};
  },

  // One exercise of the task done (antwort: to its question, if it was asked).
  // The last open one finishes the task.
  completePart(stat, rowId, antwort = null) {
    const task = this.todayTask(stat);
    if (!task || this.state.todayDone[stat]) return;
    const done = this.partsDone(stat);
    if (done[rowId] || !task.parts.some((p) => p.row.id === rowId)) return;
    const open = task.parts.filter((p) => !done[p.row.id] && p.row.id !== rowId);
    if (open.length === 0) {
      this.complete(stat, { antworten: antwort ? { [rowId]: antwort } : {} });
      return;
    }
    this.add([this.event('teil', { stat, teil: rowId, ...(antwort ? { antwort } : {}) })]);
  },

  undoPart(stat, rowId) {
    const part = this.partsDone(stat)[rowId];
    if (!part || this.state.todayDone[stat]) return;
    this.add([this.event('undo', { ref: part.id })]);
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
  //   cost   Energie set aside now: { least, most, way, work }
  //          least/most: gathering takes as much as the dice want
  //          way: nothing, ways cost only time (see RULE_SETS); less than
  //               nothing in a row after an action under the old rules, whose
  //               way home the Envoy no longer walks
  //          work: { min, max } of the work there
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
    const add = addition(c.world, place, Date.now(), c);
    const way = ((add.way + add.home) / RULES_NOW.pace) * RULES_NOW.wayEnergy - add.credit;
    const work = quest.gather
      ? gatherEstimate(quest, after, { amount: options.amount }).energy
      : { min: siteStamina(quest, c.stats), max: siteStamina(quest, c.stats) };
    const cost = {
      least: way + work.min,
      most: way + work.max,
      way,
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
    const event = this.event('expedition', { q: quest.id, place: quest.place, title: quest.name, regel: RULES });
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
  // A report shows once: not again on this device, nor on another one once
  // it was seen anywhere (event `gesehen`), and never one that was over
  // before this device first opened this Envoy.
  unseenReports() {
    const ui = store.loadUi();
    const seen = new Set(ui.seenReports || []);
    const since = Math.max(Date.now() - REPORT_HOURS * 3600000, ui.since || 0);
    return this.state.world.reports.filter((r) => !seen.has(r.id) && !this.state.world.seen[r.id] && r.end >= since);
  },

  markReportSeen(id) {
    const ui = store.loadUi();
    if (!(ui.seenReports || []).includes(id)) {
      ui.seenReports = [...(ui.seenReports || []), id].slice(-60);
      store.saveUi(ui);
    }
    if (!this.state.world.seen[id]) this.add([this.event('gesehen', { ref: id })]);
  },

  offers() {
    return offersFor(this.state.today, this.ctx()).filter((o) => !this.state.world.bought[o.offer]);
  },

  buy(offer) {
    if (!this.unlocked('haendler') || this.state.world.purse.splitter < offer.price) return;
    const farbe = offer.farbe ? { farbe: offer.farbe } : {};
    const extra = offer.guete ? { guete: offer.guete, bonus: offer.bonus } : {};
    this.add([this.event('buy', { offer: offer.offer, kind: offer.kind, thing: offer.id, price: offer.price, ...farbe, ...extra })]);
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

  // --- die Tiefen (see world/depths.js) ---------------------------------------

  // Why the Envoy cannot go down now, or null.
  depthBlock() {
    return blockedAt(this.state.world, Date.now());
  },

  // Down to the next Ebene: the fight is rolled now and stored in the event.
  descend() {
    this.refresh();
    if (this.depthBlock()) return null;
    const c = this.ctx();
    const floor = nextFloor(c.world);
    const event = this.event('tiefe', { tiefe: floor.depth.id, ebene: floor.ebene });
    event.outcome = descend(c, floor, event.id);
    this.add([event]);
    return event.outcome;
  },

  // --- the arena: the own Abbild and what Ruhm buys (the fights come from the server, see arena.js) ---

  // Haltung and Titel of the own Abbild ('' = without Titel).
  setAbbild({ haltung, titel } = {}) {
    const own = this.state.world.arena;
    const fields = {};
    if (haltung && haltung !== own.haltung) fields.haltung = haltung;
    if (typeof titel === 'string' && titel !== own.titel) fields.titel = titel;
    if (Object.keys(fields).length > 0) this.add([this.event('abbild', fields)]);
  },

  buyTitle(id) {
    const title = titleById(id);
    const own = this.state.world.arena;
    if (!title || own.titles[id] || own.ruhm < title.price) return;
    this.add([this.event('ruhmkauf', { ware: 'titel', titel: id, preis: title.price })]);
  },

  // A piece of clothing in another colour ('' = its own colour again).
  dye(inst, farbe) {
    const entry = this.state.world.items[inst];
    const item = entry && this.catalog.itemById.get(entry.id);
    if (!item?.faerbbar || (entry.farbe || '') === farbe || this.state.world.arena.ruhm < DYE_PRICE) return;
    this.add([this.event('ruhmkauf', { ware: 'farbe', inst, farbe, preis: DYE_PRICE })]);
  },

  // Name and look of the Envoy, at the creation or changed later
  // (unterhemd: false switches the undershirt off, see FIGURES), and the
  // year of birth, from the age (it picks the exercises, see tasks.js).
  setEnvoy({ name, figur, haut, haar, unterhemd = true, geburtsjahr = null }) {
    const clean = String(name || '').trim();
    if (!clean) return;
    const born = Number.isInteger(geburtsjahr) ? { geburtsjahr } : {};
    this.add([this.event('envoy', { name: clean, figur, haut, haar, unterhemd: unterhemd !== false, ...born })]);
  },
};

// Sync listens here for new local events.
export function onLocalEvents(fn) {
  addListeners.add(fn);
}
