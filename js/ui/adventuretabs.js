// Everything the Envoy can do out there lies under Abenteuer (since 5.21, so
// gewünscht: before, Aufträge were at the camp, on the map and in the Tiefen
// all at once). A row of tabs at the top of each of its pages: the Karte
// with its quests and the spirits of the day, the Aushang, the Tiefen and
// the Arena; each one only once it is open. A tab glows when something is
// waiting there: an open Auftrag, the Tiefen after the rest, a new fight in
// the arena.

import { h, icon } from './dom.js';
import { NAV_ICONS, PLACE_ICONS, UI_ICONS } from './icons.js';
import { jobsOpen } from '../world/jobs.js';
import { depthsOpen } from '../world/depths.js';
import { arena } from '../arena.js';
import { newFights } from './arena.js';

export function adventureTabs(game, current) {
  const { world } = game.state;
  const openJobs = jobsOpen(world) ? game.jobs().filter((j) => j.state === 'open').length : 0;
  const tabs = [
    { id: 'abenteuer', label: 'Karte', glyph: NAV_ICONS.abenteuer },
    jobsOpen(world) ? { id: 'aushang', label: 'Aushang', glyph: UI_ICONS.note, count: openJobs, news: openJobs > 0 } : null,
    depthsOpen(world) ? { id: 'tiefen', label: 'Tiefen', glyph: PLACE_ICONS.hoehle, news: !game.depthBlock() } : null,
    arena.open() ? { id: 'arena', label: 'Arena', glyph: NAV_ICONS.arena, news: newFights(game).length > 0 } : null,
  ].filter(Boolean);
  if (tabs.length < 2) return null;
  return h('nav', { class: 'adv-tabs', 'aria-label': 'Abenteuer' }, tabs.map((t) =>
    h('a', {
      class: `adv-tab${t.id === current ? ' is-current' : ''}${t.news && t.id !== current ? ' news' : ''}`,
      href: `#${t.id}`,
      'aria-current': t.id === current ? 'page' : null,
    }, icon(t.glyph), h('span', {}, t.label), t.count ? h('span', { class: 'adv-count' }, String(t.count)) : null)));
}
