// Erfolge: reached by playing, never lost again. Each one is checked while
// the events are replayed (see replay.js), so it is known when it was
// reached, and its reward counts from that moment on.
//
// reached(s): s = { world, stats, totals } at that moment.
// reward: bonuses as shares, e.g. { tageswerk: 0.1 } = 10 % more on every
// gain of the Tageswerk; sammeln = 10 % more pieces from gathering quests.

export const ACHIEVEMENTS = [
  {
    id: 'angekommen',
    name: 'Angekommen',
    text: 'Der Envoy ist in der Zwischenwelt angekommen.',
    reached: (s) => Boolean(s.world.envoy),
    reward: { tageswerk: 0.1, sammeln: 0.1 },
  },
];

// How a reward reads in the Handbuch.
export const BONUS_TEXT = {
  tageswerk: (share) => `+${Math.round(share * 100)} % auf jeden Gewinn im Tageswerk`,
  sammeln: (share) => `+${Math.round(share * 100)} % Ertrag beim Sammeln`,
};

// Notes what has been reached by now, with the day and the moment.
export function checkAchievements(earned, snapshot, day, t) {
  for (const a of ACHIEVEMENTS) {
    if (!earned[a.id] && a.reached(snapshot)) earned[a.id] = { day, t };
  }
}

// One kind of bonus, summed over everything reached.
export function bonusOf(earned, kind) {
  return ACHIEVEMENTS.reduce((sum, a) => sum + (earned[a.id] ? a.reward?.[kind] || 0 : 0), 0);
}

// A gain of the Tageswerk with its bonus, in whole points.
export const withBonus = (xp, share) => Math.round(xp * (1 + share));
