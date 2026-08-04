import { smoothstep, type Progress } from '../core/progress'

/**
 * How present movement `index` should be, 0..1.
 *
 * The mount window in Scene.tsx keeps neighbouring movements ALLOCATED so their
 * buffers are built ahead of time — but allocated must not mean drawn. Without
 * this, a neighbouring movement renders its particles using the *current*
 * movement's local progress, so Cold's dementors appear during Descent. Cheap
 * to miss, since it only shows as an unexplained cost in the perf overlay one
 * movement away from where the content actually is.
 *
 * Weight is 1 while the movement is current, ramps down across the same
 * boundary region the colour interpolation uses, and is 0 everywhere else.
 */

/** Must match HOLD in interpolate.ts — both describe the same boundary. */
const HOLD = 0.65

export function movementWeight(
  progress: Progress,
  index: number,
  count = 8,
): number {
  const current = progress.movement
  const local = progress.local

  // The final movement has nothing to cross-fade INTO, so it must hold at full
  // weight to the end. Without this the site fades to an empty frame exactly
  // where Dawn is supposed to land on Movement I's gold — the one moment the
  // whole arc is built around.
  const isLast = index === count - 1

  if (index === current) {
    if (local <= HOLD || isLast) return 1
    return 1 - smoothstep((local - HOLD) / (1 - HOLD))
  }

  if (index === current + 1) {
    // Incoming: mirror of the outgoing curve, so the pair always sums to 1.
    if (local <= HOLD) return 0
    return smoothstep((local - HOLD) / (1 - HOLD))
  }

  return 0
}
