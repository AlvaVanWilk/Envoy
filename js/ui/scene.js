// What the Envoy is doing right now on an expedition, shown live in the
// panel of the expedition (see journey.js):
//   on the way   a small path from one place to the next, the Envoy walking along it
//   a fight      the Envoy and the spirit with their life, round by round:
//                hits, dodges, calming, and how it ends
//   gathering    the pieces coming in, one handful a minute
//   else         the search (or the building) at the place
//   way back     what he carries home
// Below it the diary of the trip: departure, arrival, spirits, finds, return.
// Everything follows from the expedition as it was rolled when it started
// (world/expedition.js, world/run.js), so it is the same on every device and
// after every reload. Nothing here changes the game.

import { h, icon } from './dom.js';
import { UI_ICONS, PLACE_ICONS, FACILITY_ICONS } from './icons.js';
import { MATERIALS, GATHER_BASE, GATHER_DICE } from '../config.js';
import { timesOf, progressAt } from '../world/expedition.js';
import { materialKey } from '../world/worldstate.js';
import { resolveLook, portraitSrc, showLayer } from './look.js';
import { resourceIcon, itemIcon, MATERIAL_KEYS } from './parts.js';
import { thingName } from '../world/clothes.js';

const RESULT = { won: 'besiegt', calmed: 'beruhigt', driven: 'Der Envoy zieht sich zurück' };
const clock = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

// --- the story of an expedition: what happens when ---------------------------

// The fights of an action in time: they fill most of the time at the place
// (the rest is the search for what lies there); each begins with the spirit
// appearing, then the rounds follow evenly.
function fightTimes(x, outcome) {
  const fights = outcome.fights || [];
  if (fights.length === 0 || !(x.done > x.arrive)) return [];
  const span = (x.done - x.arrive) * 0.85;
  const len = span / fights.length;
  let life = null;
  return fights.map((f, k) => {
    const start = x.arrive + k * len;
    const first = start + len * 0.15;
    const last = start + len * 0.85;
    const rounds = f.rounds || [];
    const at = rounds.map((r, j) => first + ((j + 1) / rounds.length) * (last - first));
    const heroStart = life ?? f.heroMax;
    life = rounds.length ? rounds[rounds.length - 1].heroLife : heroStart;
    return { f, start, at, end: last, heroStart };
  });
}

// What one action brought, as short texts, with pictures.
function findsOf(outcome, catalog, game) {
  const r = outcome.reward || {};
  const finds = [];
  const totals = {};
  for (const [key, amount] of Object.entries(r)) {
    if (MATERIAL_KEYS.includes(materialKey(key)) && amount > 0) totals[materialKey(key)] = (totals[materialKey(key)] || 0) + amount;
  }
  for (const key of MATERIAL_KEYS) {
    if (totals[key]) finds.push({ text: `+${totals[key]} ${MATERIALS[key]}`, pic: () => resourceIcon(key) });
  }
  for (const thing of r.things || []) {
    const item = catalog.itemById.get(thing.id);
    if (item) finds.push({ text: thingName(item, thing.farbe), pic: () => itemIcon(item, game, 'scene-thing', thing.farbe) });
  }
  for (const id of r.plans || []) {
    const deko = catalog.dekoById.get(id);
    if (deko) finds.push({ text: `Plan: ${deko.name}`, pic: () => icon(FACILITY_ICONS.deko, 'icon') });
  }
  return finds;
}

const stories = new Map(); // key -> story, the latest few

// All that happens on the expedition, in order:
// { t, key, text, pop } where pop is the short word that rises on the map.
export function storyOf(exp, game) {
  const key = `${exp.id}:${exp.actions.length}:${exp.rushed ?? ''}`;
  if (stories.has(key)) return stories.get(key);
  const { catalog } = game;
  const times = timesOf(exp);
  const events = [];
  const fights = [];
  exp.actions.forEach((a, i) => {
    const x = times.actions[i];
    const o = a.outcome || {};
    const place = catalog.placeById.get(a.place);
    const name = place?.name || '';
    if (a.way > 0) {
      events.push({ t: x.begin, key: `go${i}`, text: `Aufbruch: ${name}` });
      events.push({ t: x.arrive, key: `at${i}`, text: `Angekommen: ${name}` });
    } else if (o.kind === 'bauen') events.push({ t: x.begin, key: `at${i}`, text: `Baut: ${a.title}` });
    else events.push({ t: x.begin, key: `at${i}`, text: a.title });

    const ft = fightTimes(x, o);
    fights.push(ft);
    ft.forEach((f, k) => {
      const monster = catalog.monsterById.get(f.f.monster);
      const who = monster?.name || f.f.monster;
      events.push({ t: f.start, key: `m${i}.${k}`, text: `${who} taucht auf` });
      const result = f.f.result === 'driven' ? `${who}: ${RESULT.driven}` : `${who} ${RESULT[f.f.result] || f.f.result}`;
      events.push({ t: f.end, key: `e${i}.${k}`, text: result, pop: f.f.result === 'driven' ? 'zurückgezogen' : `${who} ${RESULT[f.f.result]}` });
    });

    if (o.gather && o.gather.units > 0 && Array.isArray(o.gather.rolls)) {
      const each = (x.done - x.arrive) / o.gather.units;
      let sum = 0;
      o.gather.rolls.forEach((roll, u) => {
        const before = sum;
        sum = Math.min(o.gather.wanted, sum + roll);
        if (sum > before) {
          // both dice at once: a handful more than usual
          const lucky = roll >= GATHER_BASE + GATHER_DICE;
          const pop = `+${sum - before} ${MATERIALS[o.gather.material]}`;
          events.push({ t: x.arrive + (u + 1) * each, key: `g${i}`, text: `${sum} ${MATERIALS[o.gather.material]} gesammelt`, pop: lucky ? `Glücksgriff: ${pop}` : pop, lucky });
        }
        // now and then a Bannsplitter turns up as well
        if ((o.gather.finds || []).includes(u)) {
          events.push({ t: x.arrive + (u + 1) * each + 1, key: `s${i}.${u}`, text: 'Fund: 1 Bannsplitter', pop: 'Fund: 1 Bannsplitter', lucky: true });
        }
      });
      // a piece of clothing found between the stones, at the end
      (o.reward?.things || []).forEach((thing, n) => {
        const item = catalog.itemById.get(thing.id);
        if (item) events.push({ t: x.done, key: `k${i}.${n}`, text: `Fund: ${thingName(item, thing.farbe)}`, pop: `Fund: ${item.name}`, lucky: true });
      });
    } else {
      const finds = findsOf(o, catalog, game);
      if (o.kind === 'bauen') events.push({ t: x.done, key: `f${i}`, text: `Fertig: ${a.title}`, pop: 'Fertig' });
      if (finds.length > 0) events.push({ t: x.done, key: `f${i}+`, text: `Gefunden: ${finds.map((f) => f.text.replace(/^\+/, '')).join(', ')}`, pop: finds.map((f) => f.text).join(' · ') });
    }
    const next = times.actions[i + 1];
    if (a.home > 0 && (!next || next.begin > x.done)) events.push({ t: x.done, key: `home${i}`, text: 'Auf dem Rückweg' });
  });
  if (exp.actions.length > 0 && times.end > (times.actions[0]?.begin ?? 0)) {
    const last = exp.actions[exp.actions.length - 1];
    const atCamp = exp.actions.length === 1 && last.way === 0 && last.home === 0;
    events.push({ t: times.end, key: 'end', text: atCamp ? 'Fertig' : 'Zurück im Lager' });
  }
  // the same key later replaces the earlier line (the count while gathering)
  events.sort((p, q) => p.t - q.t);
  const story = { events, fights, times };
  if (stories.size > 6) stories.delete(stories.keys().next().value);
  stories.set(key, story);
  return story;
}

// --- the scene -------------------------------------------------------------------

const seal = (typ) => h('span', { class: 'seal mini' }, icon(PLACE_ICONS[typ] || PLACE_ICONS.ort));

function wayScene(exp, game, p, home) {
  const a = exp.actions[p.i];
  const { catalog } = game;
  const camp = catalog.places.find((pl) => pl.typ === 'lager');
  const place = catalog.placeById.get(a.place);
  // a.from is where the way began: a place, or a point on the way back
  const from = home ? place : catalog.places.find((pl) => pl.x === a.from?.x && pl.y === a.from?.y);
  const to = home ? camp : place;
  const carried = home ? exp.actions.slice(0, p.i + 1).flatMap((x) => findsOf(x.outcome || {}, catalog, game)) : [];
  return h('div', { class: 'scene scene-way', 'data-home': home ? 'true' : null },
    h('div', { class: 'way-track' },
      seal(from?.typ),
      h('span', { class: 'way-line' },
        h('span', { class: 'way-done' }),
        h('span', { class: 'way-hero', html: UI_ICONS.hero })),
      seal(to?.typ)),
    h('p', { class: 'scene-text' }, home ? 'Auf dem Rückweg ins Lager' : `Auf dem Weg: ${to?.name || ''}`),
    carried.length > 0 ? h('div', { class: 'scene-carried' }, carried.map((f) => h('span', { class: 'scene-find' }, f.pic(), f.text))) : null);
}

function updateWay(el, p, home) {
  const share = Math.min(1, Math.max(0, p.share));
  const left = `${(share * 100).toFixed(1)}%`;
  el.querySelector('.way-done').style.width = left;
  el.querySelector('.way-hero').style.left = left;
  el.dataset.home = home ? 'true' : '';
}

// A fighter with picture, name and life (also for the arena, see arena.js).
export function fighterCard(kind, name, picture) {
  return h('div', { class: `fighter is-${kind}` },
    h('span', { class: 'fighter-pic' }, picture),
    h('span', { class: 'fighter-name' }, name),
    h('span', { class: 'life' }, h('span', { class: 'life-fill' })),
    h('span', { class: 'fighter-pops' }));
}

function fightScene(ft, game) {
  const monster = game.catalog.monsterById.get(ft.f.monster);
  const look = resolveLook(game.state.world.envoy);
  const hero = h('img', { alt: '' });
  showLayer(hero, portraitSrc(look), look, 'portrait');
  return h('div', { class: 'scene scene-fight' },
    fighterCard('hero', game.state.world.envoy?.name || 'Envoy', hero),
    h('span', { class: 'fight-vs' }, 'gegen'),
    fighterCard('spirit', monster?.name || '', monster?.bild ? h('img', { src: monster.bild, alt: '' }) : null),
    h('p', { class: 'scene-text fight-line' }, ''));
}

// The fight at time t: life of both after the last round so far; a new
// round lets its blows show (a number rises, the one hit shakes).
function updateFight(el, ft, t) {
  const done = ft.at.filter((at) => at <= t).length;
  const round = done > 0 ? ft.f.rounds[done - 1] : null;
  const heroLife = round ? round.heroLife : ft.heroStart;
  const spiritLife = round ? round.monsterLife : ft.f.monsterMax;
  const share = (v, max) => `${Math.max(0, Math.min(100, (v / max) * 100)).toFixed(1)}%`;
  el.querySelector('.is-hero .life-fill').style.width = share(heroLife, ft.f.heroMax);
  el.querySelector('.is-spirit .life-fill').style.width = share(spiritLife, ft.f.monsterMax);
  const line = el.querySelector('.fight-line');
  const ended = t >= ft.end;
  el.dataset.result = ended ? ft.f.result : '';
  if (ended) line.textContent = ft.f.result === 'driven' ? RESULT.driven : RESULT[ft.f.result];
  else if (!round) line.textContent = 'Der Geist stellt sich in den Weg';
  else line.textContent = `Runde ${done}: ${roundText(round)}`;
  const shown = Number(el.dataset.round || 0);
  if (done > shown && round) {
    for (let j = shown; j < done; j += 1) blows(el, ft.f.rounds[j], j === done - 1);
  }
  el.dataset.round = String(done);
}

// What happened in a round, in a few words.
function roundText(r) {
  if (r.calm) return 'der Geist kommt zur Ruhe';
  const blow = r.hit > 0 ? `Treffer −${r.hit}` : 'daneben';
  if (r.taken > 0) return `${blow}, Gegentreffer −${r.taken}`;
  return r.dodged ? `${blow}, ausgewichen` : blow;
}

export function pop(el, text, cls) {
  const box = el.querySelector('.fighter-pops');
  const p = h('span', { class: `fight-pop ${cls}` }, text);
  box.append(p);
  p.addEventListener('animationend', () => p.remove());
}

export function shake(el) {
  el.classList.remove('is-struck');
  void el.offsetWidth; // start the motion again
  el.classList.add('is-struck');
}

function blows(scene, r, animate) {
  const hero = scene.querySelector('.is-hero');
  const spirit = scene.querySelector('.is-spirit');
  if (!animate) return;
  if (r.calm) { spirit.classList.add('is-calmed'); pop(spirit, 'beruhigt', 'is-calm'); return; }
  if (r.hit > 0) { pop(spirit, `−${r.hit}`, 'is-hit'); shake(spirit); } else pop(spirit, 'daneben', 'is-miss');
  if (r.taken > 0) { setTimeout(() => { pop(hero, `−${r.taken}`, 'is-hit'); shake(hero); }, 450); }
  else if (r.dodged) setTimeout(() => pop(hero, 'ausgewichen', 'is-miss'), 450);
}

function gatherScene(a) {
  const g = a.outcome.gather;
  return h('div', { class: 'scene scene-gather' },
    h('span', { class: 'gather-pic' }, resourceIcon(g.material), h('span', { class: 'gather-pops' })),
    h('p', { class: 'gather-count' }, h('span', { class: 'gather-n' }, '0'), h('span', { class: 'gather-of' }, ` / ${g.wanted} ${MATERIALS[g.material]}`)),
    h('p', { class: 'scene-text' }, a.title));
}

// How many pieces a gathering has brought by time t.
function gatheredAt(a, x, t) {
  const g = a.outcome.gather;
  const each = (x.done - x.arrive) / Math.max(1, g.units);
  const units = Math.min(g.units, Math.max(0, Math.floor((t - x.arrive) / each)));
  return Math.min(g.wanted, g.rolls.slice(0, units).reduce((s, r) => s + r, 0));
}

function updateGather(el, a, x, t) {
  const sum = gatheredAt(a, x, t);
  const shown = Number(el.dataset.n ?? -1);
  el.querySelector('.gather-n').textContent = String(sum);
  if (shown >= 0 && sum > shown) {
    const p = h('span', { class: 'gather-pop' }, `+${sum - shown}`);
    el.querySelector('.gather-pops').append(p);
    p.addEventListener('animationend', () => p.remove());
    const n = el.querySelector('.gather-count');
    n.classList.remove('is-up');
    void n.offsetWidth;
    n.classList.add('is-up');
  }
  el.dataset.n = String(sum);
}

function workScene(a, place) {
  const building = a.outcome?.kind === 'bauen';
  return h('div', { class: 'scene scene-work' },
    h('span', { class: 'work-pic' }, icon(building ? FACILITY_ICONS.aufwerten : UI_ICONS.search)),
    h('p', { class: 'scene-text' }, building ? `Baut: ${a.title}` : `Erkundet: ${place?.name || a.title}`),
    h('span', { class: 'work-bar' }, h('span', { class: 'work-fill' })));
}

// Which scene belongs to time t, with a key that changes when it does.
function sceneAt(exp, story, t) {
  const p = progressAt(exp, t);
  if (p.phase === 'done' || p.i < 0) return null;
  const a = exp.actions[p.i];
  if (p.phase === 'way') return { key: `way${p.i}`, p, kind: 'way' };
  if (p.phase === 'home') return { key: `home${p.i}`, p, kind: 'home' };
  // the latest fight that has begun stays in view until the next one (or the end)
  const fights = story.fights[p.i];
  const fight = fights.reduce((found, ft, k) => (t >= ft.start ? k : found), -1);
  if (fight >= 0) return { key: `fight${p.i}.${fight}`, p, kind: 'fight', ft: fights[fight] };
  if (Array.isArray(a.outcome?.gather?.rolls)) return { key: `gather${p.i}`, p, kind: 'gather' };
  return { key: `work${p.i}`, p, kind: 'work' };
}

// In a few words what the Envoy is doing at time t, for the sign above the
// menu (tripsign.js): { kind, title, count, material, monster }, or null.
export function nowDoing(exp, game, t) {
  const story = storyOf(exp, game);
  const now = sceneAt(exp, story, t);
  if (!now) return null;
  const a = exp.actions[now.p.i];
  const place = game.catalog.placeById.get(a.place);
  if (now.kind === 'way') return { kind: 'way', title: `Auf dem Weg: ${place?.name || a.title}` };
  if (now.kind === 'home') return { kind: 'home', title: 'Auf dem Rückweg ins Lager' };
  if (now.kind === 'fight') {
    const monster = game.catalog.monsterById.get(now.ft.f.monster);
    return { kind: 'fight', title: `Kampf: ${monster?.name || ''}`, monster };
  }
  if (now.kind === 'gather') {
    const g = a.outcome.gather;
    const sum = gatheredAt(a, story.times.actions[now.p.i], t);
    return { kind: 'gather', title: `Sammelt ${MATERIALS[g.material]}`, count: `${sum} / ${g.wanted}`, material: g.material };
  }
  return { kind: 'work', title: a.outcome?.kind === 'bauen' ? `Baut: ${a.title}` : `Erkundet: ${place?.name || a.title}` };
}

// Draws or moves on the scene in `box` for time t.
export function updateScene(box, exp, game, t) {
  const story = storyOf(exp, game);
  const now = sceneAt(exp, story, t);
  if (!now) { box.replaceChildren(); box.dataset.key = ''; return; }
  const a = exp.actions[now.p.i];
  const x = story.times.actions[now.p.i];
  if (box.dataset.key !== now.key) {
    const place = game.catalog.placeById.get(a.place);
    let el;
    if (now.kind === 'way' || now.kind === 'home') el = wayScene(exp, game, now.p, now.kind === 'home');
    else if (now.kind === 'fight') el = fightScene(now.ft, game);
    else if (now.kind === 'gather') el = gatherScene(a);
    else el = workScene(a, place);
    box.replaceChildren(el);
    box.dataset.key = now.key;
  }
  const el = box.firstElementChild;
  if (now.kind === 'way' || now.kind === 'home') updateWay(el, now.p, now.kind === 'home');
  else if (now.kind === 'fight') updateFight(el, now.ft, t);
  else if (now.kind === 'gather') updateGather(el, a, x, t);
  else el.querySelector('.work-fill').style.width = `${(Math.min(1, now.p.share) * 100).toFixed(1)}%`;
}

// --- the diary -------------------------------------------------------------------

const DIARY_LINES = 4;

// The latest lines of the trip up to time t (a line with the same key as a
// later one gives way to it).
export function diaryAt(exp, game, t) {
  const seen = new Map();
  for (const e of storyOf(exp, game).events) if (e.t <= t) seen.set(e.key, e);
  return [...seen.values()].sort((p, q) => p.t - q.t).slice(-DIARY_LINES);
}

export function updateDiary(list, exp, game, t) {
  const lines = diaryAt(exp, game, t);
  const sig = lines.map((e) => `${e.key}:${e.text}`).join('|');
  if (list.dataset.sig === sig) return;
  const before = new Set((list.dataset.sig || '').split('|'));
  list.replaceChildren(...lines.map((e) => h('li', {
    class: `diary-line ${list.dataset.sig !== undefined && !before.has(`${e.key}:${e.text}`) ? 'is-new' : ''}`,
  }, h('span', { class: 'diary-time' }, clock(e.t)), h('span', { class: 'diary-text' }, e.text))));
  list.dataset.sig = sig;
}

// The events that came due since the last call, for the words rising on
// the map. The first call for an expedition only takes note of the past.
const announced = new Map(); // expedition id -> keys of events already due
export function freshEvents(exp, game, t) {
  const due = storyOf(exp, game).events.filter((e) => e.t <= t);
  const known = announced.get(exp.id);
  const keys = new Set(due.map((e) => `${e.key}:${e.text}`));
  announced.set(exp.id, keys);
  if (!known) return [];
  return due.filter((e) => !known.has(`${e.key}:${e.text}`));
}

