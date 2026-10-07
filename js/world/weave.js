// Einweben (since 5.16, so gewünscht): at the Lagerfeuer the Envoy weaves the
// strength of one piece into another of the same slot. The piece he keeps
// stays as it is (its look, colour, name and requirements) and takes the
// Güte and bonuses of the other; its own bonuses go. The other piece falls to
// threads and is gone. A fixed ability of a piece (from the table) stays with
// that piece. It costs nothing else.

import { cleanBonuses, bonusCount } from './bonuses.js';
import { atCamp, reachable } from './inventory.js';

// Pieces whose strength could go into `target`: the same slot, with bonuses, not itself.
export function weaveSources(world, catalog, target) {
  const slot = catalog.itemById.get(target?.id)?.slot;
  if (!slot) return [];
  return Object.values(world.items).filter((e) => e.inst !== target.inst && e.kind === 'item'
    && catalog.itemById.get(e.id)?.slot === slot && bonusCount(e) > 0 && reachable(world, e));
}

// Why not now, or null: 'fire' (no Lagerfeuer yet), 'away' (on an expedition).
export function weaveBlock(world) {
  if (world.camp.stage < 1) return 'fire';
  if (!atCamp(world)) return 'away';
  return null;
}

// Whether it can be done: both owned and in reach, the same slot, the source with bonuses.
export function canWeave(world, catalog, targetInst, sourceInst) {
  const target = world.items[targetInst];
  const source = world.items[sourceInst];
  if (!target || !source || weaveBlock(world) || !reachable(world, target)) return false;
  return weaveSources(world, catalog, target).some((e) => e.inst === sourceInst);
}

// The Güte and bonuses `target` would have afterwards.
export const wovenBonuses = (source) => cleanBonuses(source);
