// Calendar days as plain strings "YYYY-MM-DD".
// A day begins at DAY_START_HOUR local time, not at midnight.

import { DAY_START_HOUR, SLEEP_BONUS_HOUR } from './config.js';

const pad = (n) => String(n).padStart(2, '0');

export function dayKey(date = new Date()) {
  const shifted = new Date(date.getTime() - DAY_START_HOUR * 3600 * 1000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

// The moment (ms) a day begins, in local time.
export function dayStartMs(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, DAY_START_HOUR).getTime();
}

// The morning of a day (when the Envoy wakes up rested, see the Schlafplatz).
export function morningMs(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, SLEEP_BONUS_HOUR).getTime();
}

// Day arithmetic in UTC, so daylight saving time never skips or repeats a day.
function parse(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function format(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(key, n) {
  return format(parse(key) + n * 86400000);
}

export function daysBetween(fromKey, toKey) {
  return Math.round((parse(toKey) - parse(fromKey)) / 86400000);
}

// All days from `fromKey` to `toKey`, both included.
export function dayRange(fromKey, toKey) {
  const days = [];
  for (let k = fromKey; k <= toKey; k = addDays(k, 1)) days.push(k);
  return days;
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'];

export function formatDayLong(key) {
  const d = new Date(parse(key));
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`;
}

export function formatDayShort(key) {
  const d = new Date(parse(key));
  return `${WEEKDAYS[d.getUTCDay()].slice(0, 2)} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
}
