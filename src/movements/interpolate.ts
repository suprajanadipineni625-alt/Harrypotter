import { Color } from 'three'
import { lerp, smoothstep, type Progress } from '../core/progress'
import { MOVEMENTS, type MovementState } from './movements'

/**
 * Resolve the scene's parameters at any point in the experience.
 *
 * Pure: same Progress in, same state out, every time. This is what lets scroll
 * drive it on the site and Remotion drive it in the video render.
 */

export interface ResolvedState {
  background: Color
  light: Color
  fog: Color
  fogDensity: number
  bloom: number
  grade: number
  vignette: number
  cameraZ: number
  cameraY: number
  /** Index of the movement we are in, and the one we are heading toward. */
  from: MovementState
  to: MovementState
  /** Eased 0..1 blend between them. */
  blend: number
}

// Reused instances — allocating Colors every frame is how you get GC stutter.
const bg = new Color()
const lightC = new Color()
const fogC = new Color()
const tmpA = new Color()
const tmpB = new Color()

/**
 * Movements hold their own look for most of their length and cross-fade near
 * the boundary. A constant lerp across the whole movement would mean the scene
 * is never actually *at* any of the eight looks — it would always be somewhere
 * between two, which reads as mud.
 */
const HOLD = 0.65

export function resolveState(progress: Progress): ResolvedState {
  const i = Math.min(progress.movement, MOVEMENTS.length - 1)
  const from = MOVEMENTS[i]
  const to = MOVEMENTS[Math.min(i + 1, MOVEMENTS.length - 1)]

  // 0 for the held portion, then eased 0..1 across the transition.
  const raw = progress.local <= HOLD ? 0 : (progress.local - HOLD) / (1 - HOLD)
  const blend = smoothstep(raw)

  bg.copy(tmpA.set(from.background)).lerp(tmpB.set(to.background), blend)
  lightC.copy(tmpA.set(from.light)).lerp(tmpB.set(to.light), blend)
  fogC.copy(tmpA.set(from.fog)).lerp(tmpB.set(to.fog), blend)

  return {
    background: bg,
    light: lightC,
    fog: fogC,
    fogDensity: lerp(from.fogDensity, to.fogDensity, blend),
    bloom: lerp(from.bloom, to.bloom, blend),
    grade: lerp(from.grade, to.grade, blend),
    vignette: lerp(from.vignette, to.vignette, blend),
    cameraZ: lerp(from.cameraZ, to.cameraZ, blend),
    cameraY: lerp(from.cameraY, to.cameraY, blend),
    from,
    to,
    blend,
  }
}
