import { ParticleField } from '../scene/ParticleField'
import { mapRange, smoothstep, type Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'

/**
 * The seven movements other than Cold.
 *
 * Every one is the same `ParticleField` primitive under different parameters,
 * which is why they cost nothing to download and only a few draw calls each.
 * Content and reasoning: docs/CONTENT.md
 */

export interface MovementProps {
  progress: Progress
  profile: QualityProfile
  /** 0..1 presence. See weight.ts. */
  weight: number
}

/** Fade a field in over the first part of a movement and out at the end. */
function arc(local: number, inEnd = 0.25, outStart = 0.8): number {
  return smoothstep(mapRange(local, 0, inEnd, 0, 1)) *
    (1 - smoothstep(mapRange(local, outStart, 1, 0, 1)))
}

/* ------------------------------------------------------------------ I */

/**
 * Lights in the dark — floating candles, the twins' fireworks, the
 * Deluminator, wands raised at the tower.
 *
 * The thesis movement. Warm points suspended in a vast dark, and the camera
 * rising through them. It opens on motion because the first three seconds
 * decide everything (BUILD-CONSTRAINTS §3).
 */
export function Lights({ progress, profile, weight }: MovementProps) {
  if (weight <= 0.001) return null
  const p = progress.local

  // The candles are always there. A second, brighter field rises through the
  // movement — the twins' fireworks and the wands at the tower, arriving late.
  const risen = smoothstep(mapRange(p, 0.45, 0.95, 0, 1))

  return (
    <>
      <ParticleField
        count={30_000}
        profile={profile}
        time={progress.time}
        color="#ffc76b"
        behaviour="drift"
        spread={[34, 20, 26]}
        size={2.1}
        speed={0.42}
        intensity={0.9 * weight}
      />
      <ParticleField
        count={9_000}
        profile={profile}
        time={progress.time}
        color="#fff2d0"
        behaviour="rise"
        spread={[30, 24, 22]}
        size={2.6}
        speed={1.5}
        intensity={risen * 0.8 * weight}
      />
    </>
  )
}

/* ----------------------------------------------------------------- II */

/**
 * Doors — Platform nine and three quarters, the Vanishing Cabinet, the Room of
 * Hidden Things, King's Cross.
 *
 * Thresholds. The movement resolves toward white: King's Cross is the last
 * door, and the cheapest render in the site.
 */
export function Doors({ progress, profile, weight }: MovementProps) {
  if (weight <= 0.001) return null
  const p = progress.local

  const dust = arc(p, 0.2, 0.72)
  // The white-out at the end. King's Cross.
  const white = smoothstep(mapRange(p, 0.72, 1, 0, 1))

  return (
    <>
      {/* Dust in shafts of light — the Room of Hidden Things. */}
      <ParticleField
        count={26_000}
        profile={profile}
        time={progress.time}
        color="#f2e4cd"
        behaviour="drift"
        spread={[40, 22, 34]}
        size={1.7}
        speed={0.3}
        intensity={dust * 0.75 * weight}
      />
      {/* The threshold itself: a dense, close field that floods the frame. */}
      <ParticleField
        count={14_000}
        profile={profile}
        time={progress.time}
        color="#ffffff"
        behaviour="drift"
        spread={[14, 10, 8]}
        size={4}
        speed={0.18}
        intensity={white * 0.85 * weight}
      />
      <pointLight
        position={[0, 0, -4]}
        color="#ffffff"
        intensity={white * 90 * weight}
        distance={40}
        decay={1.4}
      />
    </>
  )
}

/* ---------------------------------------------------------------- IV */

/**
 * Descent — the Chamber, the second task, the cave.
 *
 * Down, into water, into dark. Particulate drifts UP past the camera, which is
 * what selling downward motion actually requires: the camera does not move, the
 * world moves past it.
 */
export function Descent({ progress, profile, weight }: MovementProps) {
  if (weight <= 0.001) return null
  const p = progress.local

  const depth = smoothstep(mapRange(p, 0, 0.75, 0, 1))

  return (
    <>
      {/* Silt and debris rising as we sink. */}
      <ParticleField
        count={24_000}
        profile={profile}
        time={progress.time}
        color="#4fd6b0"
        behaviour="rise"
        spread={[32, 30, 26]}
        size={1.5}
        speed={0.85 + depth * 0.7}
        intensity={(0.35 + depth * 0.4) * weight}
      />
      {/* Failing surface light above, dimming as we go down. */}
      <ParticleField
        count={7_000}
        profile={profile}
        time={progress.time}
        color="#bff5e4"
        behaviour="drift"
        spread={[26, 6, 20]}
        size={2.2}
        speed={0.5}
        intensity={(1 - depth) * 0.5 * weight}
      />
    </>
  )
}

/* ---------------------------------------------------------------- VI */

/**
 * Fire — the Goblet, the Burrow burning, Fiendfyre.
 *
 * The only loud movement. Embers rise, ash falls through them: two opposed
 * fields is what makes fire read as fire rather than as orange particles.
 *
 * Fiendfyre taking animal shapes was flagged in the plan as the most ambitious
 * effect in the site. It is NOT attempted here — see the build log. This is the
 * honest version: heat, embers and ash, which holds the movement without
 * pretending to an effect that needs its own vertical slice.
 */
export function Fire({ progress, profile, weight }: MovementProps) {
  if (weight <= 0.001) return null
  const p = progress.local

  const heat = smoothstep(mapRange(p, 0.1, 0.6, 0, 1))

  return (
    <>
      <ParticleField
        count={28_000}
        profile={profile}
        time={progress.time}
        color="#ff7a2f"
        behaviour="rise"
        spread={[30, 26, 22]}
        size={2.3}
        speed={1.8}
        intensity={heat * 0.85 * weight}
      />
      <ParticleField
        count={11_000}
        profile={profile}
        time={progress.time}
        color="#ffd9a0"
        behaviour="rise"
        spread={[18, 24, 16]}
        size={1.5}
        speed={2.8}
        intensity={heat * 0.7 * weight}
      />
      {/* Ash falling through the heat. Not additive — ash is matter. */}
      <ParticleField
        count={9_000}
        profile={profile}
        time={progress.time}
        color="#3a2a22"
        behaviour="fall"
        spread={[34, 26, 20]}
        size={2}
        speed={0.9}
        intensity={heat * 0.6 * weight}
        additive={false}
      />
    </>
  )
}

/* --------------------------------------------------------------- VII */

/**
 * The quiet — the dance, the Tale of the Three Brothers, Shell Cottage.
 *
 * The breath. Light background, ink-dark motes: the ONE inversion in the site,
 * and the reason it works is that it arrives after six movements of darkness.
 * Nearly free to render, which is what buys the budget for Fire and Dawn.
 */
export function Quiet({ progress, profile, weight }: MovementProps) {
  if (weight <= 0.001) return null
  const p = progress.local

  return (
    <ParticleField
      count={7_000}
      profile={profile}
      time={progress.time}
      color="#2a2420"
      behaviour="fall"
      spread={[40, 26, 18]}
      size={1.8}
      speed={0.35}
      intensity={arc(p, 0.3, 0.75) * 0.5 * weight}
      additive={false}
    />
  )
}

/* -------------------------------------------------------------- VIII */

/**
 * Dawn — the shield, the ash, the light returning.
 *
 * Closes the loop. The palette lands on Movement I's exact gold, and the ember
 * field rises the way the candles drifted, so the last frame rhymes with the
 * first. That rhyme is the difference between an arc and a list.
 */
export function Dawn({ progress, profile, weight }: MovementProps) {
  if (weight <= 0.001) return null
  const p = progress.local

  const ash = 1 - smoothstep(mapRange(p, 0.25, 0.7, 0, 1))
  const light = smoothstep(mapRange(p, 0.35, 0.95, 0, 1))

  return (
    <>
      {/* Ash still falling from the battle, clearing as dawn arrives. */}
      <ParticleField
        count={16_000}
        profile={profile}
        time={progress.time}
        color="#6b6560"
        behaviour="fall"
        spread={[36, 28, 24]}
        size={1.9}
        speed={0.55}
        intensity={ash * 0.55 * weight}
        additive={false}
      />
      {/* The gold from Movement I, returning. */}
      <ParticleField
        count={26_000}
        profile={profile}
        time={progress.time}
        color="#ffc76b"
        behaviour="drift"
        spread={[34, 22, 26]}
        size={2.1}
        speed={0.42}
        intensity={light * 0.9 * weight}
      />
      <pointLight
        position={[0, 3, 2]}
        color="#ffd89a"
        intensity={light * 45 * weight}
        distance={44}
        decay={1.5}
      />
    </>
  )
}
