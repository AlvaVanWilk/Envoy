// A new version reaches open apps by itself (since 5.22.1, so gewünscht): a
// released version goes live every night at 3 o'clock (see
// .github/workflows/taeglich-live.yml), and every app loads anew at four
// (since 5.22.3, so gewünscht: a fixed time, no asking the server; an hour
// after the upload, in case GitHub starts it late). An app that was asleep
// then loads anew as soon as it is seen again. Only at a
// calm moment: never while the timer of an exercise runs or a window is open
// (a fight, a quest); then a minute later. Nothing is lost by it: everything
// done is stored the moment it happens.

import { isSheetOpen } from './sheet.js';

const RELOAD_AT = { hour: 4, minute: 0 };
const CHECK_MS = 60 * 1000;

// The last four o'clock (on this device's clock) up to now.
function lastReloadMoment(now) {
  const moment = new Date(now);
  moment.setHours(RELOAD_AT.hour, RELOAD_AT.minute, 0, 0);
  if (moment.getTime() > now) moment.setDate(moment.getDate() - 1);
  return moment.getTime();
}

// Busy: the timer runs, a window is open, the look is being changed.
const busy = () => Boolean(document.querySelector('.timer-overlay')) || isSheetOpen() || location.hash === '#aussehen';

export function watchForUpdates() {
  const loadedAt = Date.now();
  function check() {
    if (loadedAt < lastReloadMoment(Date.now()) && !busy()) location.reload();
  }
  setInterval(check, CHECK_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
