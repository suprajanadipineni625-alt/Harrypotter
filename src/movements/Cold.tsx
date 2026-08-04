import { ParticleField } from '../scene/ParticleField'
import { mapRange, smoothstep, type Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'

/**
 * Movement V — Cold.
 *
 * Dementors on the train, the Patronus, the sword beneath the ice.
 *
 * The arc's turn: the first time light is something you DO rather than watch.
 * Structurally the movement is a fight between two particle fields —
 *
 *   dread  falls inward, dim and colourless, building through the first half
 *   burst  explodes outward, silver-white, driven by the cast
 *
 * The cast is normally scroll-driven. In Phase 5 the same `cast` value is
 * driven by a raised hand instead, with no change to this component — that is
 * the whole point of routing everything through one 0..1 parameter.
 */

export interface ColdProps {
  progress: Progress
  profile: QualityProfile
  /**
   * 0..1. How fully the Patronus is cast. Scroll supplies this by default;
   * pointer and gesture override it in Phase 5.
   */
  cast: number
  /** 0..1 presence. See movements/weight.ts. */
  weight: number
}

export function Cold({ progress, profile, cast, weight }: ColdProps) {
  const p = progress.local

  // Allocated but not current: draw nothing. The buffers stay warm.
  if (weight <= 0.001) return null

  // Dread builds through the first 55%, then is driven back by the cast.
  const dreadRise = smoothstep(mapRange(p, 0.0, 0.5, 0, 1))
  const dread = dreadRise * (1 - smoothstep(cast * 1.15))

  // Frost motes hanging in the cold — always present, thickest at mid-movement.
  const frost = smoothstep(mapRange(p, 0.05, 0.35, 0, 1)) * (1 - cast * 0.55)

  // The burst itself.
  const burstIntensity = cast > 0.001 ? 1 : 0

  return (
    <>
      {/* Dementor cold: colourless matter falling inward. Deliberately NOT
          additive — this is the absence of light, so it must not glow. */}
      <ParticleField
        count={14_000}
        profile={profile}
        time={progress.time}
        color="#243044"
        behaviour="fall"
        spread={[34, 22, 22]}
        size={2.2}
        speed={1.1}
        intensity={dread * 0.5 * weight}
        additive={false}
      />

      {/* Frost suspended in the air. Additive, but barely bright. */}
      <ParticleField
        count={6_000}
        profile={profile}
        time={progress.time}
        color="#8fb6e0"
        behaviour="drift"
        spread={[30, 18, 20]}
        size={1.5}
        speed={0.55}
        intensity={frost * 0.5 * weight}
      />

      {/* The Patronus. Silver-white, additive, exploding outward. */}
      <ParticleField
        count={16_000}
        profile={profile}
        time={progress.time}
        color="#dceeff"
        behaviour="burst"
        spread={[2, 2, 2]}
        size={2.4}
        speed={1}
        intensity={burstIntensity * weight}
        burst={cast}
      />

      {/* The light source at the centre of the cast, so the burst also lights
          the fog around it rather than floating in it. */}
      <pointLight
        position={[0, 0, 0]}
        color="#dceeff"
        intensity={cast * 55 * weight}
        distance={26}
        decay={1.8}
      />
    </>
  )
}

/**
 * Scroll-driven default for the cast.
 *
 * Exported separately so Phase 5 can substitute pointer or gesture input while
 * keeping this as the fallback everyone gets.
 */
export function scrollCast(local: number): number {
  // Nothing until 55% of the movement, then a fast rise and a slow settle.
  return smoothstep(mapRange(local, 0.55, 0.85, 0, 1))
}
