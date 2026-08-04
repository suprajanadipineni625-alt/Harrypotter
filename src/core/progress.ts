/**
 * The progress model.
 *
 * THE RULE: every visual in this site is a pure function of `Progress`.
 * Nothing reads the wall clock — no `Date.now()`, no `performance.now()`, and
 * no `useFrame((state) => state.clock...)` driving scene state.
 *
 * Why it matters beyond tidiness: `@remotion/three` renders video by stepping a
 * frame counter, not by running a real-time loop. If a component's appearance
 * depends on elapsed time, it renders differently every pass and the video
 * flickers. Keep everything a function of progress and the SAME components can
 * be driven by scroll on the site and by Remotion's `useCurrentFrame()` when we
 * render the 9:16 cut — no duplicated scene work.
 *
 * Continuous ambient motion (drift, flicker, shimmer) is still allowed — it just
 * has to be derived from `progress.time`, which a driver supplies, rather than
 * read from a clock directly.
 */

export interface Progress {
  /** 0..1 across the entire experience. */
  global: number
  /** Index of the scene currently on screen. */
  index: number
  /** 0..1 within the current scene. */
  local: number
  /**
   * Monotonic "seconds" for ambient motion. Supplied by the driver:
   * the scroll driver advances it in real time, Remotion derives it from
   * `frame / fps`. Never read a clock to get this.
   */
  time: number
}

export const ZERO_PROGRESS: Progress = {
  global: 0,
  index: 0,
  local: 0,
  time: 0,
}

/**
 * Split a global 0..1 into a scene index plus local 0..1.
 * The final scene includes global === 1 rather than overflowing.
 */
export function splitProgress(global: number, count: number): {
  index: number
  local: number
} {
  const clamped = Math.min(Math.max(global, 0), 1)
  const scaled = clamped * count
  const index = Math.min(Math.floor(scaled), count - 1)
  return { index, local: scaled - index }
}

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Map x from [inMin,inMax] to [outMin,outMax], clamped. */
export function mapRange(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin
  const t = Math.min(Math.max((x - inMin) / (inMax - inMin), 0), 1)
  return outMin + (outMax - outMin) * t
}

/** Smoothstep easing on 0..1. */
export const smoothstep = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}
