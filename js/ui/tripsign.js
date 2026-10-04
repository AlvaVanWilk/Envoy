// While the Envoy is out, a small sign floats above the menu on every page
// (not on the map, which shows the trip itself): what he is doing right now,
// how long it still takes, and a thin bar for the whole trip. Every find rises
// from it („+3 Pilzholz“; both dice at once: „Glücksgriff“). Once he is back
// and the report waits, it glows and leads to the camp, where the report opens.
// A tap during the trip leads to the map.

import { h, icon } from './dom.js';
import { UI_ICONS, FACILITY_ICONS } from './icons.js';
import { resourceIcon, formatMinutes } from './parts.js';
import { timesOf } from '../world/expedition.js';
import { nowDoing } from './scene.js';

let sign = null;

function build() {
  const pic = h('span', { class: 'trip-pic' });
  const title = h('span', { class: 'trip-title' });
  const sub = h('span', { class: 'trip-sub' });
  const fill = h('span', { class: 'trip-fill' });
  const pops = h('span', { class: 'trip-pops', 'aria-hidden': 'true' });
  const el = h('a', { class: 'trip-sign', href: '#abenteuer', hidden: true },
    pic, h('span', { class: 'trip-text' }, title, sub), h('span', { class: 'trip-bar' }, fill), pops);
  document.body.append(el);
  return { el, pic, title, sub, fill, pops, picKey: '' };
}

// The picture at the left: the Envoy walking, the material, the spirit, the search.
function picture(doing) {
  if (!doing) return icon(UI_ICONS.hero);
  if (doing.kind === 'gather') return resourceIcon(doing.material);
  if (doing.kind === 'fight' && doing.monster?.bild) return h('img', { src: doing.monster.bild, alt: '' });
  if (doing.kind === 'work') return icon(doing.title.startsWith('Baut') ? FACILITY_ICONS.aufwerten : UI_ICONS.search);
  return icon(UI_ICONS.hero);
}

function setPicture(s, key, doing) {
  if (s.picKey === key) return;
  s.picKey = key;
  s.pic.replaceChildren(picture(doing));
}

function rise(s, text, lucky) {
  const p = h('span', { class: `trip-pop${lucky ? ' is-lucky' : ''}` }, text);
  s.pops.append(p);
  p.addEventListener('animationend', () => p.remove());
  s.el.classList.remove('is-bumped');
  void s.el.offsetWidth; // start the little bump again
  s.el.classList.add('is-bumped');
}

// Called every second and after every drawing of a page.
// fresh: the events of the trip that have just come due (see scene.js).
export function updateTripSign(game, fresh = []) {
  sign = sign || build();
  const s = sign;
  const view = document.body.dataset.view || '';
  const exp = game.state.world.expedition;
  const waiting = !exp && game.unseenReports().length > 0;
  const away = !exp && !waiting;
  const hidden = away || view === 'abenteuer' || view === 'aussehen' || document.body.classList.contains('creating');
  s.el.hidden = hidden;
  document.body.classList.toggle('has-trip', !hidden);
  if (hidden) return;

  if (waiting) {
    s.el.href = '#lager';
    s.el.dataset.kind = 'back';
    setPicture(s, 'back', null);
    s.title.textContent = 'Der Envoy ist zurück';
    s.sub.textContent = 'Bericht ansehen';
    s.fill.style.width = '100%';
    return;
  }

  const t = Date.now();
  const doing = nowDoing(exp, game, t);
  const times = timesOf(exp);
  const begin = times.actions[0]?.begin ?? t;
  const share = times.end > begin ? Math.min(1, Math.max(0, (t - begin) / (times.end - begin))) : 1;
  const left = Math.max(0, (times.end - t) / 60000);
  s.el.href = '#abenteuer';
  s.el.dataset.kind = doing?.kind || 'way';
  setPicture(s, `${doing?.kind}:${doing?.material || doing?.monster?.id || ''}`, doing);
  s.title.textContent = doing?.title || 'Unterwegs';
  const rest = left < 1 ? `noch ${Math.ceil(left * 60)} Sek.` : `noch ${formatMinutes(Math.ceil(left))}`;
  s.sub.textContent = doing?.count ? `${doing.count} · ${rest}` : rest;
  s.fill.style.width = `${(share * 100).toFixed(1)}%`;
  fresh.forEach((e, n) => setTimeout(() => rise(s, e.pop, e.lucky), n * 600));
}
