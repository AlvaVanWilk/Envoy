// Small building blocks used by several views.

import { h, icon } from './dom.js';
import { RESOURCE_ICONS, SLOT_ICONS, FACILITY_ICONS } from './icons.js';
import { statEmblem, statInfo } from './stats.js';
import { shield } from './shield.js';
import { MATERIALS } from '../config.js';
import { materialLimit, LIMITED_MATERIALS } from '../world/inventory.js';
import { resolveLook, iconSrc, iconLayerSrc, showLayer, dyeOf } from './look.js';

export const MATERIAL_KEYS = ['splitter', 'pilzholz', 'stein'];

export function viewHead(eyebrow, title, ...actions) {
  return h('header', { class: 'view-head' },
    h('div', {}, h('p', { class: 'eyebrow' }, eyebrow), h('h1', {}, title)),
    actions.length > 0 ? h('div', { class: 'head-actions' }, ...actions) : null);
}

// A heading inside a panel, with an ornament line.
export function sectionTitle(text, extra = null) {
  return h('h2', { class: 'section-title' }, h('span', {}, text), extra);
}

export function resourceIcon(key) {
  return icon(RESOURCE_ICONS[key], 'icon res-icon');
}

// Inline: picture, amount, name. Used for costs and loot.
export function resource(key, amount, { lacking = false, sign = '' } = {}) {
  return h('span', { class: `res ${lacking ? 'lacking' : ''}`, 'data-res': key },
    resourceIcon(key), h('span', { class: 'res-amount' }, `${sign}${amount}`), h('span', { class: 'res-name' }, MATERIALS[key]));
}

// How much of Stein and Pilzholz the Vorrat holds (more with the stores of the camp).
export function materialLimits(world, catalog) {
  const limits = {};
  for (const key of LIMITED_MATERIALS) limits[key] = materialLimit(world, catalog, key);
  return limits;
}

// The supplies as three small plaques. limits: how much of a material fits
// (see materialLimits); shown as „8 / 10“.
export function supplies(purse, limits = {}) {
  return h('div', { class: 'supplies' }, MATERIAL_KEYS.map((key) =>
    h('div', { class: 'supply', 'data-res': key },
      h('span', { class: 'supply-art' }, resourceIcon(key)),
      h('span', { class: 'supply-text' },
        h('span', { class: 'supply-amount' }, String(purse[key] || 0),
          limits[key] !== undefined ? h('span', { class: 'supply-limit' }, ` / ${limits[key]}`) : null),
        h('span', { class: 'supply-name' }, MATERIALS[key])))));
}

export function price(amount, have) {
  return h('span', { class: `price ${have < amount ? 'lacking' : ''}` }, resourceIcon('splitter'), String(amount));
}

export function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} Min.`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

// A short time: seconds under a minute, else as formatMinutes.
export function formatDuration(minutes) {
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} Sek.`;
  return formatMinutes(minutes);
}

function overNote(over, rested) {
  return over <= (rested || 0) ? `Ausgeschlafen: ${over} extra` : `${over} über der Leiste`;
}

function refillText(hours) {
  if (hours <= 0) return 'voll';
  return `voll in ${formatMinutes(Math.ceil(hours * 60))}`;
}

// The Energie bar with a notch for every point (every 5, 10 or 20 on a long bar).
// After a night at the Schlafplatz it holds more than its normal length: the
// extra is shown as a copper end of the bar. Only what the Schlafplatz can
// give is called „Ausgeschlafen“; more than that comes from the test menu.
// Which stat makes a value in a fight grow, shown when pointing at it.
export const FIGHT_TIPS = {
  leben: 'Steigt mit Ausdauer.',
  schaden: 'Steigt mit Kraft und mit Schaden auf der Kleidung.',
  treffer: 'Steigt mit Beweglichkeit und mit Treffer auf der Kleidung.',
  ausweichen: 'Steigt mit Beweglichkeit und mit Ausweichen auf der Kleidung.',
  beruhigen: 'Steigt mit Gelassenheit und mit Beruhigen auf der Kleidung.',
};

// What makes the Energie bigger and quicker, shown when pointing at the bar.
const ENERGY_TIP = 'Mit Ausdauer wird die Leiste größer, mit Gelassenheit füllt sie sich schneller.';

export function staminaBar(st) {
  const value = Math.floor(st.value);
  const over = Math.max(0, value - st.max);
  const total = st.max + over;
  const step = st.max <= 30 ? 1 : st.max <= 60 ? 5 : st.max <= 120 ? 10 : 20;
  return h('div', { class: 'stamina', 'aria-label': `Energie ${value} von ${st.max}`, 'data-tip': ENERGY_TIP },
    h('div', { class: 'stamina-top' },
      h('span', { class: 'stamina-label' }, 'Energie'),
      h('span', { class: 'stamina-value' }, h('strong', {}, `${value}`), ` / ${st.max}`)),
    h('div', { class: 'stamina-bar', style: { '--notches': String(total / step) } },
      h('span', { class: 'stamina-fill', style: { width: `${(100 * Math.min(st.value, st.max)) / total}%` } }),
      over > 0 ? h('span', { class: 'stamina-extra', style: { left: `${(100 * st.max) / total}%` } }) : null),
    h('p', { class: 'stamina-note' }, over > 0 ? overNote(over, st.rested) : refillText(st.hoursToFull)));
}

// The Energie bar before setting out: full, what stays for sure; striped,
// what the dice of gathering may take or leave; at the end of the bar what it
// takes, as one block. cost: { least, most } (see game.plan)
export function energyPreview(st, cost) {
  const value = Math.floor(st.value);
  const total = Math.max(st.max, value);
  const least = Math.max(0, Math.ceil(cost.least));
  const most = Math.max(least, Math.ceil(cost.most));
  const share = (n) => `${(100 * n) / total}%`;
  const step = st.max <= 30 ? 1 : st.max <= 60 ? 5 : st.max <= 120 ? 10 : 20;
  const amount = least === most ? String(least) : `${least}–${most}`;
  const start = Math.max(0, value - most);
  const maybe = Math.max(0, Math.min(most - least, value - start));
  const block = Math.max(0, value - start - maybe);
  return h('div', { class: `stamina energy-preview ${most > value ? 'short' : ''}`, 'aria-label': `Energie: kostet ${amount} von ${value}` },
    h('div', { class: 'stamina-top' },
      h('span', { class: 'stamina-label' }, 'Energie'),
      h('span', { class: 'stamina-value' }, 'kostet ', h('strong', {}, amount), ` von ${value}`)),
    h('div', { class: 'stamina-bar', style: { '--notches': String(total / step) } },
      h('span', { class: 'ep-keep', style: { width: share(start) } }),
      maybe > 0 ? h('span', { class: 'ep-maybe', style: { left: share(start), width: share(maybe) } }) : null,
      block > 0 ? h('span', { class: 'ep-block', style: { left: share(start + maybe), width: share(block) } }) : null));
}

// The picture of a thing, as drawn for the figure of this Envoy; in its
// colour (farbe, see world/clothes.js) it is cut from its dyed drawing.
// Without one yet, the symbol of its slot.
export function itemIcon(thing, game, className = 'item-icon', farbe = null) {
  const look = resolveLook(game.state.world.envoy);
  const src = iconSrc(thing, look);
  if (!src) return thing.slot ? icon(SLOT_ICONS[thing.slot], `${className} item-glyph`) : h('span', { class: className });
  const img = h('img', { class: className, alt: '', decoding: 'async', onerror: (e) => { e.currentTarget.hidden = true; } });
  const dye = dyeOf(farbe, thing);
  const layer = dye && iconLayerSrc(thing, look);
  if (layer) showLayer(img, layer, look, 'icon', dye);
  else img.src = src;
  return img;
}

// The picture of a Deko; without one yet, the Deko symbol.
export function dekoIcon(row, className = 'item-icon') {
  if (!row.icon) return icon(FACILITY_ICONS.deko, `${className} item-glyph`);
  return h('img', { class: className, src: row.icon, alt: '', decoding: 'async', onerror: (e) => { e.currentTarget.hidden = true; } });
}

export function reqChips(item, stats) {
  const entries = Object.entries(item.req || {});
  if (entries.length === 0) return null;
  return h('span', { class: 'req-chips' }, entries.map(([stat, min]) =>
    h('span', { class: `req-chip ${stats[stat].level >= min ? 'met' : 'unmet'}`, 'data-stat': stat, title: statInfo(stat).name },
      statEmblem(stat, 'tiny'), String(min))));
}

const EFFECT_TEXT = {
  schaden: (v) => `Schaden ${v > 0 ? '+' : ''}${v}`,
  treffer: (v) => `Treffer +${v} %`,
  ausweichen: (v) => `Ausweichen +${v} %`,
  beruhigen: (v) => `Beruhigen +${v} %`,
  reise: (v) => `Reise ${v}`,
  erholung: (v) => `Energie +${v} % schneller`,
  glueck: (v) => `Glück +${v} %`,
};

// The abilities of a piece: those of the table, and its own bonuses (see
// world/bonuses.js; entry: the owned piece or the offer).
export function effectsOf(thing, entry) {
  const total = { ...(thing?.effekt || {}) };
  for (const [key, value] of Object.entries(entry?.bonus || {})) total[key] = (total[key] || 0) + value;
  return total;
}

// The class of a frame for the Güte of a piece: its colour.
export const qualityClass = (entry) => (entry?.guete ? ` q-${entry.guete}` : '');

export function effectText(key, value) {
  return EFFECT_TEXT[key] ? EFFECT_TEXT[key](value) : `${key} ${value}`;
}

export function effectList(effects) {
  const entries = Object.entries(effects || {}).filter(([, v]) => v);
  if (entries.length === 0) return null;
  return h('span', { class: 'item-effects' }, entries.map(([k, v]) => h('span', { class: 'effect' }, effectText(k, v))));
}

export function lockedView(markup, title, text) {
  return h('section', { class: 'view' },
    h('div', { class: 'locked-view' },
      shield(markup, { locked: true }),
      h('h1', {}, title),
      h('p', { class: 'muted' }, text)));
}

// The quest that unlocks a feature, for a hint.
export function unlockHint(feature, catalog) {
  const quest = catalog.quests.find((q) => q.reward.unlocks.includes(feature));
  if (!quest) return 'Noch verschlossen.';
  const place = catalog.placeById.get(quest.place);
  return `Öffnet sich mit der Quest „${quest.name}“${place ? ` (${place.name})` : ''}.`;
}
