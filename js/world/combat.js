// A fight is rolled round by round, as the specification says.
// Each round: with Gelassenheit the hero may calm a spirit (it dissolves),
// otherwise the hero strikes (Beweglichkeit to hit, Kraft for damage),
// then the spirit strikes back (Beweglichkeit to dodge). Ausdauer gives life.

import { randomInt } from './rng.js';

const MAX_ROUNDS = 12;
const MONSTER_HIT = 0.75;

// hero: result of fighter() plus the life left from an earlier fight.
export function fight(hero, monster, rng) {
  const rounds = [];
  let heroLife = hero.life;
  let monsterLife = monster.leben;

  for (let n = 1; n <= MAX_ROUNDS; n += 1) {
    const round = { n };
    if (hero.calm > 0 && rng() < hero.calm) {
      round.calm = true;
      round.heroLife = heroLife;
      round.monsterLife = monsterLife;
      rounds.push(round);
      return { result: 'calmed', rounds, heroLife };
    }

    round.hit = rng() < hero.hit ? hero.damage + randomInt(rng, 0, 2) : 0;
    monsterLife = Math.max(0, monsterLife - round.hit);
    if (monsterLife > 0) {
      const strikes = rng() < MONSTER_HIT;
      const dodged = strikes && rng() < hero.dodge;
      round.dodged = dodged;
      round.taken = strikes && !dodged ? monster.kraft + randomInt(rng, 0, 1) : 0;
      heroLife = Math.max(0, heroLife - round.taken);
    }
    round.heroLife = heroLife;
    round.monsterLife = monsterLife;
    rounds.push(round);

    if (monsterLife === 0) return { result: 'won', rounds, heroLife };
    if (heroLife === 0) return { result: 'lost', rounds, heroLife };
  }
  // Nobody gave in: the hero withdraws, exhausted.
  return { result: 'lost', rounds, heroLife };
}
