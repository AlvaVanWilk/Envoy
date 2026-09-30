// Erfolge: reached by playing, never lost again. Each one is checked while
// the events are replayed (see replay.js), so it is known when it was
// reached, and its reward counts from that moment on.
//
// reached(s): s = { world, stats, totals } at that moment.
// reward: bonuses as shares, e.g. { tageswerk: 0.1 } = 10 % more on every
// gain of the Tageswerk; sammeln = 10 % more pieces from gathering quests.
// bonusMinutes: how long the bonus lasts after the moment it was reached;
// without it the bonus lasts for good.

export const ACHIEVEMENTS = [
  {
    id: 'angekommen',
    name: 'Angekommen',
    text: 'Der Envoy ist in der Zwischenwelt angekommen.',
    reached: (s) => Boolean(s.world.envoy),
    reward: { tageswerk: 0.1, sammeln: 0.1 },
    // a short push to get going right after the start
    bonusMinutes: 15,
  },
];

// How a reward reads in the Handbuch.
export const BONUS_TEXT = {
  tageswerk: (share) => `+${Math.round(share * 100)} % auf jeden Gewinn im Tageswerk`,
  sammeln: (share) => `+${Math.round(share * 100)} % Ertrag beim Sammeln`,
};

const MINUTE = 60000;

// When the bonus of an achievement ends (ms), or null if it lasts for good.
export function bonusEnd(a, entry) {
  return a.bonusMinutes && entry?.t != null ? entry.t + a.bonusMinutes * MINUTE : null;
}

// Does the bonus of this achievement count at time `at`?
function counts(a, entry, at) {
  if (!entry) return false;
  const end = bonusEnd(a, entry);
  return end === null || at <= end;
}

// Notes what has been reached by now, with the day and the moment.
export function checkAchievements(earned, snapshot, day, t) {
  for (const a of ACHIEVEMENTS) {
    if (!earned[a.id] && a.reached(snapshot)) earned[a.id] = { day, t };
  }
}

// One kind of bonus at time `at`, summed over everything reached.
export function bonusOf(earned, kind, at) {
  return ACHIEVEMENTS.reduce((sum, a) => sum + (counts(a, earned[a.id], at) ? a.reward?.[kind] || 0 : 0), 0);
}

// Bonuses that are running at time `at` and will end: [{ achievement, end }].
export function runningBonuses(earned, at) {
  return ACHIEVEMENTS
    .filter((a) => a.bonusMinutes && earned[a.id] && counts(a, earned[a.id], at))
    .map((a) => ({ achievement: a, end: bonusEnd(a, earned[a.id]) }))
    .filter((b) => b.end !== null);
}

// A gain of the Tageswerk with its bonus, in whole points.
export const withBonus = (xp, share) => Math.round(xp * (1 + share));
