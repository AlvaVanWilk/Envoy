// Challenging another Abbild: the Haltung is chosen, the server decides the
// fight (see arena.php), and here it plays round by round. At the end both
// bow; a defeat costs nothing. A challenge costs no Energie.

import { h, replaceChildren } from './dom.js';
import { toast } from './sheet.js';
import { fighterCard, pop, shake } from './scene.js';
import { arena, arenaErrorText } from '../arena.js';
import { sync } from '../sync.js';
import { abbildPortrait, haltungPicker, titleText, ruhmAmount } from './arenaparts.js';

const ROUND_MS = 1300;
const SECOND_BLOW_MS = 600;
const RESULT = { sieg: 'Sieg', remis: 'Unentschieden', niederlage: 'Unterlegen' };
// After the last round: decided on points, a close bout (decided by the
// diligence of both, else by the Haltung), or a draw.
const CLOSE = { sieg: 'Knapper Sieg', niederlage: 'Knapp unterlegen' };
function resultText(fight) {
  if (fight.ergebnis === 'remis') return RESULT.remis;
  if (fight.entscheid === 'punkte') return `${RESULT[fight.ergebnis]} nach Punkten`;
  if (fight.entscheid === 'fleiss') return CLOSE[fight.ergebnis];
  if (fight.entscheid === 'haltung') return `${CLOSE[fight.ergebnis]} durch die Haltung`;
  return RESULT[fight.ergebnis];
}

// Why the Envoy cannot go now, or null.
function blocked(game) {
  if (game.state.world.expedition) return 'Der Envoy ist unterwegs.';
  return null;
}

// Below the Abbild in its window: Haltung, cost, and the button.
export function challengePart(x, game, panel) {
  let haltung = game.state.world.arena.haltung;
  const part = h('div', { class: 'arena-challenge' });
  const draw = () => {
    const why = blocked(game);
    replaceChildren(part,
      haltungPicker(haltung, (id) => { haltung = id; draw(); }, 'Deine Haltung'),
      why ? h('p', { class: 'arena-why' }, why) : null,
      h('button', { class: 'btn primary', disabled: Boolean(why), onclick: (e) => go(e.currentTarget) }, 'Herausfordern'));
  };
  const go = async (button) => {
    button.disabled = true;
    button.textContent = 'Der Envoy geht in die Arena.';
    try {
      await sync.run();
      const fight = await arena.challenge(x.id, haltung);
      replaceChildren(panel.querySelector('.sheet-body'), fightPlay(fight, x, game));
    } catch (error) {
      toast(arenaErrorText(error));
      draw();
    }
  };
  draw();
  return part;
}

// What one blow did, in a few words.
function blowText(value, who, other) {
  if (value === 'daneben') return `${who} verfehlt`;
  if (value === 'ausgewichen') return `${other} weicht aus`;
  return `${who} trifft`;
}

// The fight round by round, then the bow and what it brought.
function fightPlay(fight, x, game) {
  const own = game.state.world.envoy;
  const names = { a: own.name, b: fight.gegner.name };
  const max = fight.leben;
  const life = { a: max.a, b: max.b };
  const cards = {
    a: fighterCard('hero', names.a, abbildPortrait(own, 'arena-fight-pic')),
    b: fighterCard('foe', names.b, abbildPortrait(fight.gegner, 'arena-fight-pic')),
  };
  const line = h('p', { class: 'scene-text fight-line' }, 'Beide verbeugen sich.');
  const scene = h('div', { class: 'scene scene-fight arena-fight' }, cards.a, h('span', { class: 'fight-vs' }, 'gegen'), cards.b, line);
  const end = h('div', { class: 'arena-end', hidden: true });
  const skip = h('button', { class: 'btn ghost small', onclick: () => finish() }, 'Überspringen');
  const timers = [];

  const showLife = () => {
    for (const side of ['a', 'b']) {
      cards[side].querySelector('.life-fill').style.width = `${Math.max(0, (life[side] / max[side]) * 100).toFixed(1)}%`;
    }
  };
  const blow = (side, value, animate) => {
    const target = side === 'a' ? 'b' : 'a';
    if (typeof value === 'number') {
      life[target] = Math.max(0, life[target] - value);
      if (animate) { pop(cards[target], `−${value}`, 'is-hit'); shake(cards[target]); }
    } else if (value && animate) pop(cards[target], value, 'is-miss');
    showLife();
  };
  const playRound = (r, animate) => {
    const first = r.zuerst;
    const second = first === 'a' ? 'b' : 'a';
    if (r.ruhe) {
      if (animate) pop(cards[r.ruhe], 'verbeugt sich', 'is-calm');
      line.textContent = `Runde ${r.n}: ${names[r.ruhe]} verbeugt sich und lässt ab`;
      return;
    }
    const parts = [first, second].filter((s) => r[s] !== null).map((s) => blowText(r[s], names[s], names[s === 'a' ? 'b' : 'a']));
    line.textContent = `Runde ${r.n}: ${parts.join(', ')}`;
    blow(first, r[first], animate);
    if (r[second] !== null) {
      if (animate) timers.push(setTimeout(() => blow(second, r[second], true), SECOND_BLOW_MS));
      else blow(second, r[second], false);
    }
  };
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    life.a = fight.runden.at(-1)?.la ?? max.a;
    life.b = fight.runden.at(-1)?.lb ?? max.b;
    showLife();
    scene.dataset.result = fight.ergebnis;
    line.textContent = resultText(fight);
    skip.remove();
    const [before, after] = fight.platz || [];
    replaceChildren(end,
      h('p', { class: 'arena-end-result' }, resultText(fight)),
      h('p', { class: 'muted' }, 'Beide verbeugen sich.'),
      h('div', { class: 'arena-end-gain' }, ruhmAmount(fight.ruhm, '+')),
      after && before && after < before ? h('p', { class: 'arena-end-place' }, `${names.a} steht jetzt auf Platz ${after}.`) : null);
    end.hidden = false;
  };

  showLife();
  fight.runden.forEach((r, i) => timers.push(setTimeout(() => playRound(r, true), 900 + i * ROUND_MS)));
  timers.push(setTimeout(finish, 900 + fight.runden.length * ROUND_MS + 400));
  const title = titleText(fight.gegnerTitel);
  return h('div', { class: 'arena-play' },
    title ? h('p', { class: 'arena-title-line' }, `${names.b} ${title}`) : null,
    scene, end, skip);
}
