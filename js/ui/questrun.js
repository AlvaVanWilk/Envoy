// Shows how a quest went: the checks, the fight round by round, the result.
// The outcome is already decided and stored; this only plays it back.

import { h, icon } from './dom.js';
import { UI_ICONS, RESOURCE_ICONS } from './icons.js';
import { STATS, CURRENCY } from '../config.js';
import { openSheet, closeSheet } from './sheet.js';
import { statEmblem } from './stats.js';
import { itemIcon } from './parts.js';

const STEP_MS = 520;
const ROUND_MS = 420;
const statName = (id) => STATS.find((s) => s.id === id).name;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function checkRow(step) {
  const result = h('span', { class: 'result' }, '…');
  const row = h('div', { class: 'run-step' },
    h('div', { class: 'run-check' }, statEmblem(step.stat, 'small'), h('span', {}, `Probe · ${statName(step.stat)} ${step.difficulty}`), icon(UI_ICONS.die), result));
  const finish = () => {
    result.textContent = step.pass ? 'gelungen' : 'misslungen';
    result.className = `result ${step.pass ? 'ok' : 'fail'}`;
  };
  return { row, finish, rounds: [] };
}

function roundText(r, monsterName) {
  if (r.calm) return { text: `${monsterName} wird ruhig und löst sich auf.`, kind: 'calm' };
  const parts = [r.hit > 0 ? `Treffer ${r.hit}` : 'daneben'];
  if (r.monsterLife > 0) {
    if (r.dodged) parts.push('ausgewichen');
    else if (r.taken > 0) parts.push(`Gegentreffer ${r.taken}`);
    else parts.push(`${monsterName} verfehlt`);
  }
  return { text: `Runde ${r.n}: ${parts.join(' · ')}`, kind: r.taken > 0 ? 'taken' : '' };
}

function fightBlock(step, game) {
  const monster = game.catalog.monsterById.get(step.monster);
  const heroFill = h('span', { class: 'bar-fill' });
  const foeFill = h('span', { class: 'bar-fill' });
  const heroNum = h('span', {});
  const foeNum = h('span', {});
  const log = h('ul', { class: 'fight-log' });
  const startHero = step.rounds.length > 0 ? step.rounds[0].heroLife + (step.rounds[0].taken || 0) : step.heroMax;
  const set = (heroLife, foeLife) => {
    heroFill.style.width = `${(100 * heroLife) / step.heroMax}%`;
    foeFill.style.width = `${(100 * foeLife) / step.monsterMax}%`;
    heroNum.textContent = String(heroLife);
    foeNum.textContent = String(foeLife);
  };
  set(startHero, step.monsterMax);
  const row = h('div', { class: 'run-step' },
    h('div', { class: 'fight-head' },
      h('span', { class: 'quest-portrait' }, h('img', { src: monster.bild, alt: '' })),
      h('div', { class: 'fight-bars' },
        h('div', { class: 'fight-bar hero' }, h('span', {}, 'Envoy'), h('div', { class: 'bar' }, heroFill), heroNum),
        h('div', { class: 'fight-bar foe' }, h('span', {}, monster.name), h('div', { class: 'bar' }, foeFill), foeNum))),
    log);
  const showRound = (r) => {
    const { text, kind } = roundText(r, monster.name);
    log.append(h('li', { class: kind }, text));
    log.scrollTop = log.scrollHeight;
    set(r.heroLife, r.monsterLife);
  };
  const finish = () => {
    const end = step.result === 'won' ? `${monster.name} ist besiegt.` : step.result === 'calmed' ? `${monster.name} ist beruhigt.` : 'Der Envoy zieht sich zurück.';
    log.append(h('li', {}, end));
    log.scrollTop = log.scrollHeight;
  };
  return { row, finish, rounds: step.rounds, showRound };
}

function lootItem(markup, text) {
  return h('span', { class: 'loot-item' }, markup, text);
}

function resultBlock(quest, outcome, game) {
  const r = outcome.reward;
  const lost = outcome.monsters.some((m) => m.result === 'lost');
  if (!outcome.ok) {
    return h('div', { class: 'run-result' },
      h('h3', {}, lost ? 'Erschöpft' : 'Nicht geschafft'),
      h('p', { class: 'muted' }, lost ? 'Die Ausdauerleiste ist leer.' : 'Ein andermal.'));
  }
  const loot = [];
  if (r.glimmer) loot.push(lootItem(icon(RESOURCE_ICONS.glimmer), `+${r.glimmer} ${CURRENCY}`));
  if (r.holz) loot.push(lootItem(icon(RESOURCE_ICONS.holz), `+${r.holz} Holz`));
  if (r.stein) loot.push(lootItem(icon(RESOURCE_ICONS.stein), `+${r.stein} Stein`));
  for (const [k, v] of Object.entries(outcome.consumed || {})) {
    if (v) loot.push(lootItem(icon(RESOURCE_ICONS[k]), `−${v} ${k === 'holz' ? 'Holz' : k === 'stein' ? 'Stein' : CURRENCY}`));
  }
  for (const thing of r.things) {
    const t = thing.kind === 'furniture' ? game.catalog.furnitureById.get(thing.id) : game.catalog.itemById.get(thing.id);
    if (t) loot.push(lootItem(itemIcon(t, ''), t.name));
  }
  if (r.rest) loot.push(lootItem(icon(UI_ICONS.check), 'Ausdauerleiste voll'));
  const unlocks = r.unlocks.map((f) => h('p', {}, f === 'haendler' ? 'Der Händler ist gerettet und handelt ab jetzt mit dir.' : 'Das Zelt steht. Du hast ein Zuhause und einen Schrank.'));
  const firsts = outcome.monsters.filter((m) => game.state.world.bestiary[m.id]?.seen === 1)
    .map((m) => h('p', { class: 'muted' }, `Neu im Kompendium: ${game.catalog.monsterById.get(m.id).name}`));
  return h('div', { class: 'run-result' },
    h('h3', {}, 'Geschafft'),
    loot.length > 0 ? h('div', { class: 'loot' }, loot) : null,
    unlocks, firsts);
}

export function openQuestRun({ quest, outcome }, game) {
  const body = h('div', { class: 'run' });
  const done = h('button', { class: 'btn primary', hidden: true, onclick: closeSheet }, 'Weiter');
  const skip = h('button', { class: 'btn text', onclick: () => { skipped = true; } }, 'Überspringen');
  let skipped = false;

  openSheet({
    title: quest.name,
    eyebrow: quest.encounter ? 'Begegnung' : 'Quest',
    className: 'run-sheet',
    content: [body, h('div', { class: 'sheet-actions' }, skip, done)],
  });

  const blocks = outcome.steps.map((step) => (step.kind === 'check' ? checkRow(step) : fightBlock(step, game)));
  (async () => {
    for (const block of blocks) {
      body.append(block.row);
      if (!skipped) await wait(STEP_MS);
      for (const r of block.rounds) {
        block.showRound(r);
        if (!skipped) await wait(ROUND_MS);
      }
      block.finish();
    }
    if (!skipped && blocks.length > 0) await wait(STEP_MS);
    body.append(resultBlock(quest, outcome, game));
    skip.hidden = true;
    done.hidden = false;
    done.focus();
  })();
}
