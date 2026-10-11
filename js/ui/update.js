// A new version on the server reaches open apps by itself (since 5.22.1, so
// gewünscht): a released version goes live every night at 3 o'clock (see
// .github/workflows/taeglich-live.yml). Every 15 minutes, and whenever the
// app comes back into view, it asks the server which version is there; if it
// is another one, the app loads anew, but only at a calm moment: never while
// the timer of an exercise runs or a window is open (a fight, a quest).
// Nothing is lost by it: everything done is stored the moment it happens.

import { APP_VERSION } from '../config.js';
import { isSheetOpen } from './sheet.js';

const EVERY_MS = 15 * 60 * 1000;
const RETRY_MS = 60 * 1000;   // a new version waiting for a calm moment

// The version on the server, or null when it cannot be asked.
async function serverVersion() {
  try {
    const response = await fetch(`js/config.js?nachsehen=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.text()).match(/APP_VERSION = '([^']+)'/)?.[1] || null;
  } catch {
    return null;
  }
}

// Busy: the timer runs, a window is open, the look is being changed.
const busy = () => Boolean(document.querySelector('.timer-overlay')) || isSheetOpen() || location.hash === '#aussehen';

export function watchForUpdates() {
  let waiting = false;
  async function check() {
    if (!waiting) {
      const there = await serverVersion();
      waiting = Boolean(there) && there !== APP_VERSION;
    }
    if (!waiting) return;
    if (busy()) setTimeout(check, RETRY_MS);
    else location.reload();
  }
  setInterval(check, EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
