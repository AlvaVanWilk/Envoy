// Die Tiefen (see world/depths.js): the next Wächter with its picture, how the
// Envoy would fare against it, his values in the fight and what his
// equipment adds to them, what the Ebene brings, and the way down (or how
// long he still rests). The fight plays round by round in a window, then
// what it brought. Below, all three Tiefen and how far the Envoy got.

import { h, icon, replaceChildren } from './dom.js';
import { PLACE_ICONS } from './icons.js';
import { viewHead, sectionTitle, lockedView, itemIcon, resource, FIGHT_TIPS } from './parts.js';
import { openSheet } from './sheet.js';
import { fighterCard, pop, shake } from './scene.js';
import { resolveLook, portraitSrc, showLayer } from './look.js';
import { thingSubtitle } from './itemsheet.js';
import { fighter } from '../world/hero.js';
import {
  depthsOpen, depthOpen, depthById, clearedIn, nextFloor, guardian, floorSplitter, sureItem, prospect, restMinutes,
} from '../world/depths.js';
import { DEPTHS } from '../config.js';

const ROUND_MS = 1100;
const NO_GEAR = { schaden: 0, treffer: 0, ausweichen: 0, beruhigen: 0, reise: 0, erholung: 0, glueck: 0 };
const clock = (ms) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const percent = (share) => `${Math.round(share * 100)} %`;

// The way in, from the Abenteuer page; it glows while the Envoy could go down.
export function depthsLink(game) {
  const { world } = game.state;
  if (!depthsOpen(world)) return null;
  const ready = !game.depthBlock();
  return h('a', { class: `btn ghost depths-link${ready ? ' news' : ''}`, href: '#tiefen' }, icon(PLACE_ICONS.hoehle), 'Die Tiefen');
}

export function renderDepths(game) {
  const { world } = game.state;
  if (!depthsOpen(world)) return lockedView(PLACE_ICONS.hoehle, 'Die Tiefen', 'Öffnen sich mit dem Lagerfeuer.');
  const floor = nextFloor(world);
  return h('section', { class: 'view depths' },
    viewHead('Abenteuer', 'Die Tiefen'),
    h('div', { class: 'depths-grid' },
      floor ? floorPanel(game, floor) : h('section', { class: 'panel' }, sectionTitle('Ganz unten'), h('p', { class: 'muted' }, 'Tiefer geht es noch nicht.')),
      floor ? valuesPanel(game, floor) : null,
      overviewPanel(game)));
}

// --- the next Ebene -----------------------------------------------------------------

// How the Envoy would fare, in words.
function prospectText(share) {
  if (share >= 0.85) return 'Dein Envoy ist ihm klar überlegen.';
  if (share >= 0.6) return 'Dein Envoy ist etwas stärker.';
  if (share >= 0.4) return 'Beide sind etwa gleich stark.';
  if (share >= 0.15) return 'Der Wächter ist stärker.';
  return 'Der Wächter ist noch viel stärker.';
}

function rewardText(floor) {
  const splitter = floorSplitter(floor);
  if (floor.ebene === floor.depth.waechter.length) return `${splitter} Bannsplitter und ein Kleidungsstück, mindestens selten`;
  return sureItem(floor) ? `${splitter} Bannsplitter und ein Kleidungsstück` : `${splitter} Bannsplitter, vielleicht ein Kleidungsstück`;
}

function floorPanel(game, floor) {
  const c = game.ctx();
  const g = guardian(floor, game.catalog);
  const share = prospect(c, floor);
  const { depth, ebene } = floor;
  const last = ebene === depth.waechter.length;
  return h('section', { class: 'panel depth-floor' },
    sectionTitle(depth.name, h('span', { class: 'depth-count' }, `Ebene ${ebene} von ${depth.waechter.length}`)),
    h('p', { class: 'muted depth-text' }, depth.text),
    shaft(depth, clearedIn(c.world, depth)),
    h('div', { class: 'guardian' },
      h('span', { class: `guardian-pic${last ? ' is-last' : ''}` }, g.bild ? h('img', { src: g.bild, alt: '' }) : null),
      h('div', { class: 'guardian-info' },
        h('p', { class: 'eyebrow' }, last ? `Der letzte Wächter · Stufe ${g.stufe}` : `Wächter der ${ebene}. Ebene · Stufe ${g.stufe}`),
        h('h3', { class: 'guardian-name' }, g.name),
        h('p', { class: 'guardian-text' }, g.text))),
    h('div', { class: 'prospect' },
      h('p', { class: 'prospect-text' }, prospectText(share)),
      h('span', { class: 'prospect-bar', 'aria-hidden': 'true' }, h('span', { class: 'prospect-fill', style: `width: ${(share * 100).toFixed(0)}%` }))),
    h('p', { class: 'depth-reward' }, h('span', { class: 'muted' }, 'Bringt '), rewardText(floor)),
    goPart(game, floor));
}

// The ten Ebenen of a Tiefe, the ones overcome lit.
function shaft(depth, cleared) {
  return h('ol', { class: 'shaft', 'aria-label': `${cleared} von ${depth.waechter.length} Ebenen bezwungen` },
    depth.waechter.map((_, i) => h('li', {
      class: `shaft-step${i < cleared ? ' is-done' : ''}${i === cleared ? ' is-next' : ''}${i === depth.waechter.length - 1 ? ' is-last' : ''}`,
    })));
}

// The way down, or why not now.
function goPart(game, floor) {
  const block = game.depthBlock();
  const { world } = game.state;
  if (block === 'away') return h('p', { class: 'depth-why' }, 'Der Envoy ist unterwegs.');
  if (block === 'rest') return restLine(game, world.tiefen.rest);
  const lostLast = world.tiefen.last?.result === 'lost' && world.tiefen.last.tiefe === floor.depth.id && world.tiefen.last.ebene === floor.ebene;
  return h('div', { class: 'depth-go' },
    h('button', { class: 'btn primary', onclick: () => goDown(game) }, lostLast ? 'Noch einmal hinabsteigen' : 'Hinabsteigen'),
    h('p', { class: 'muted' }, `Kostet keine Energie. Danach ruht der Envoy ${restMinutes(game.state.stats)} Minuten.`));
}

// While the Envoy rests: until when, counting down; then the page is drawn anew.
function restLine(game, until) {
  const left = h('span', { class: 'rest-left' });
  const line = h('p', { class: 'depth-why' }, 'Der Envoy ruht bis ', h('strong', {}, clock(until)), ' · noch ', left);
  let drawn = false;
  const tick = () => {
    const ms = until - Date.now();
    // the first time the line is not on the page yet; once it is gone, it stops
    if (drawn && !line.isConnected) { clearInterval(timer); return; }
    if (drawn && ms <= 0) { clearInterval(timer); game.refresh(); return; }
    drawn = true;
    const min = Math.floor(Math.max(0, ms) / 60000);
    const sec = Math.floor((Math.max(0, ms) % 60000) / 1000);
    left.textContent = `${min}:${String(sec).padStart(2, '0')}`;
  };
  const timer = setInterval(tick, 1000);
  tick();
  return line;
}

// --- the values in the fight, and what the equipment adds -------------------------

function valuesPanel(game, floor) {
  const c = game.ctx();
  const g = guardian(floor, game.catalog);
  const now = fighter(c.stats, c.fx, g);
  const bare = fighter(c.stats, NO_GEAR, g);
  const extra = (a, b, show) => (a > b ? h('span', { class: 'gear-part' }, `+${show(a - b)}`) : null);
  const row = (label, own, gear, other, tip) => h('tr', { 'data-tip': tip },
    h('th', { scope: 'row' }, label),
    h('td', {}, own, gear),
    h('td', {}, other));
  return h('section', { class: 'panel depth-values' },
    sectionTitle('Im Kampf'),
    h('table', { class: 'fight-table' },
      h('thead', {}, h('tr', {}, h('th', {}), h('th', { scope: 'col' }, game.state.world.envoy?.name || 'Envoy'), h('th', { scope: 'col' }, g.name))),
      h('tbody', {},
        row('Leben', String(now.life), null, String(g.leben), FIGHT_TIPS.leben),
        row('Schaden', `${now.damage} bis ${now.damage + 2}`, extra(now.damage, bare.damage, String), `${g.kraft} bis ${g.kraft + 1}`, FIGHT_TIPS.schaden),
        row('Treffer', percent(now.hit), extra(now.hit, bare.hit, (d) => percent(d)), '75 %', FIGHT_TIPS.treffer),
        row('Ausweichen', percent(now.dodge), extra(now.dodge, bare.dodge, (d) => percent(d)), '–', FIGHT_TIPS.ausweichen),
        g.calmable ? row('Beruhigen', percent(now.calm), extra(now.calm, bare.calm, (d) => percent(d)), '–', FIGHT_TIPS.beruhigen) : null)),
    h('p', { class: 'muted gear-note' }, h('span', { class: 'gear-part' }, '+'), ' kommt von der Ausrüstung.'));
}

// --- all Tiefen ---------------------------------------------------------------------

function overviewPanel(game) {
  const { world } = game.state;
  return h('section', { class: 'panel depth-overview' },
    sectionTitle('Alle Tiefen'),
    h('ul', { class: 'depth-list' }, DEPTHS.map((depth) => {
      const open = depthOpen(world, depth);
      const done = clearedIn(world, depth);
      let state = `${done} von ${depth.waechter.length} Ebenen`;
      if (done >= depth.waechter.length) state = 'Bezwungen';
      if (!open) state = depth.opens;
      return h('li', { class: `depth-item${open ? '' : ' is-locked'}` },
        h('span', { class: 'depth-name' }, depth.name),
        open ? shaft(depth, done) : null,
        h('span', { class: 'muted' }, state));
    })));
}

// --- going down: the fight in a window ----------------------------------------------

function goDown(game) {
  const outcome = game.descend();
  if (!outcome) return;
  const depth = depthById(outcome.tiefe);
  openSheet({
    title: `${depth.name} · Ebene ${outcome.ebene}`,
    eyebrow: 'Die Tiefen',
    className: 'depth-sheet',
    content: fightPlay(outcome, game),
  });
}

const RESULT = {
  won: 'Der Wächter ist besiegt.',
  calmed: 'Der Wächter kommt zur Ruhe.',
  lost: 'Der Wächter ist noch zu stark. Der Envoy zieht sich zurück.',
};

function roundText(r) {
  if (r.calm) return 'der Wächter kommt zur Ruhe';
  const blow = r.hit > 0 ? `Treffer −${r.hit}` : 'daneben';
  if (r.taken > 0) return `${blow}, Gegentreffer −${r.taken}`;
  return r.dodged ? `${blow}, ausgewichen` : blow;
}

function fightPlay(outcome, game) {
  const g = game.catalog.monsterById.get(outcome.monster);
  const look = resolveLook(game.state.world.envoy);
  const portrait = h('img', { alt: '' });
  showLayer(portrait, portraitSrc(look), look, 'portrait');
  const hero = fighterCard('hero', game.state.world.envoy?.name || 'Envoy', portrait);
  const spirit = fighterCard('spirit', g?.name || '', g?.bild ? h('img', { src: g.bild, alt: '' }) : null);
  const line = h('p', { class: 'scene-text fight-line' }, 'Der Wächter stellt sich in den Weg');
  const scene = h('div', { class: 'scene scene-fight depth-fight' }, hero, h('span', { class: 'fight-vs' }, 'gegen'), spirit, line);
  const end = h('div', { class: 'depth-end', hidden: true });
  const skip = h('button', { class: 'btn ghost small', onclick: () => finish() }, 'Überspringen');
  const timers = [];

  const life = (card, value, max) => { card.querySelector('.life-fill').style.width = `${Math.max(0, Math.min(100, (value / max) * 100)).toFixed(1)}%`; };
  const show = (r) => { life(hero, r.heroLife, outcome.heroMax); life(spirit, r.monsterLife, outcome.monsterMax); };
  const play = (r) => {
    line.textContent = `Runde ${r.n}: ${roundText(r)}`;
    if (r.calm) { spirit.classList.add('is-calmed'); pop(spirit, 'beruhigt', 'is-calm'); show(r); return; }
    if (r.hit > 0) { pop(spirit, `−${r.hit}`, 'is-hit'); shake(spirit); } else pop(spirit, 'daneben', 'is-miss');
    life(spirit, r.monsterLife, outcome.monsterMax);
    timers.push(setTimeout(() => {
      if (r.taken > 0) { pop(hero, `−${r.taken}`, 'is-hit'); shake(hero); } else if (r.dodged) pop(hero, 'ausgewichen', 'is-miss');
      life(hero, r.heroLife, outcome.heroMax);
    }, 450));
  };
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    const lastRound = outcome.rounds.at(-1);
    if (lastRound) show(lastRound);
    scene.dataset.result = outcome.result === 'lost' ? 'driven' : outcome.result;
    line.textContent = RESULT[outcome.result];
    skip.remove();
    replaceChildren(end, ...endPart(outcome, game));
    end.hidden = false;
  };

  life(hero, outcome.heroMax, outcome.heroMax);
  life(spirit, outcome.monsterMax, outcome.monsterMax);
  outcome.rounds.forEach((r, i) => timers.push(setTimeout(() => play(r), 800 + i * ROUND_MS)));
  timers.push(setTimeout(finish, 800 + outcome.rounds.length * ROUND_MS + 300));
  return h('div', { class: 'depth-play' }, scene, end, skip);
}

// What the descent brought, and what comes next.
function endPart(outcome, game) {
  const things = (outcome.reward.things || []).map((thing) => {
    const item = game.catalog.itemById.get(thing.id);
    if (!item) return null;
    return h('li', { class: 'depth-find' },
      h('span', { class: `item-frame${thing.guete ? ` q-${thing.guete}` : ''}` }, itemIcon(item, game, 'item-icon', thing.farbe)),
      h('span', { class: 'item-row-main' }, h('span', { class: 'item-name' }, item.name), h('span', { class: 'item-sub' }, thingSubtitle(thing, item))));
  });
  const depth = depthById(outcome.tiefe);
  const won = outcome.result !== 'lost';
  let next = 'Nach der Rast versucht er es noch einmal.';
  if (won && outcome.ebene < depth.waechter.length) next = `Nach der Rast geht es hinab auf Ebene ${outcome.ebene + 1}.`;
  else if (won) next = `${depth.name} ist bezwungen.`;
  return [
    h('div', { class: 'depth-gain' }, resource('splitter', outcome.reward.splitter, { sign: '+' })),
    things.length ? h('ul', { class: 'depth-finds' }, things) : null,
    h('p', { class: 'muted' }, next),
  ];
}
