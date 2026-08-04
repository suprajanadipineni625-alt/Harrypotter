import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color } from 'three'
import { StoryScene } from './StoryScene'
import { SCENES } from './parts'
import { lerp, smoothstep, type Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'
import { ParticleField } from '../scene/ParticleField'

/**
 * The persistent story scene.
 *
 * Same architecture as before the pivot — one scene, never unmounted, whose
 * parameters interpolate — but the unit is now a STORY SCENE rather than an
 * abstract movement, and the content is illustrated composition rather than
 * light.
 *
 * A window of three scenes is mounted so shaders compile one scene ahead of
 * being needed. Compiling a shader at the moment of a transition is a visible
 * stall, and it happens once per scene, so it has to happen early.
 */

/** How present scene `i` is. Adjacent scenes cross-fade. */
function sceneOpacity(progress: Progress, i: number): number {
  const cur = progress.index
  const local = progress.local
  const HOLD = 0.7

  if (i === cur) return local <= HOLD ? 1 : 1 - smoothstep((local - HOLD) / (1 - HOLD))
  if (i === cur + 1) return local <= HOLD ? 0 : smoothstep((local - HOLD) / (1 - HOLD))
  return 0
}

export function StoryRoot({
  progress,
  profile,
  pointer,
}: {
  progress: Progress
  profile: QualityProfile
  pointer: [number, number]
}) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const bg = useMemo(() => new Color(), [])
  const from = useMemo(() => new Color(), [])
  const to = useMemo(() => new Color(), [])

  const i = Math.min(progress.index, SCENES.length - 1)
  const next = Math.min(i + 1, SCENES.length - 1)
  const current = SCENES[i]
  const upcoming = SCENES[next]

  useFrame(() => {
    // Background follows the PART palette, so a part reads as one place even as
    // its scenes change.
    const t = smoothstep(Math.max(0, (progress.local - 0.7) / 0.3))
    from.set(current.part.background)
    to.set(upcoming.part.background)
    bg.copy(from).lerp(to, t)
    scene.background = bg

    // A slow push-in across each scene, plus a small pointer drift. Both are
    // subtle on purpose: the parallax between layers is doing the depth work.
    camera.position.z = lerp(9.4, 8.6, smoothstep(progress.local))
    camera.position.x = pointer[0] * 0.35
    camera.position.y = pointer[1] * 0.2
    camera.lookAt(0, 0, -12)
  })

  const window = [i - 1, i, i + 1].filter((k) => k >= 0 && k < SCENES.length)

  return (
    <>
      {window.map((k) => {
        const entry = SCENES[k]
        return (
          <StoryScene
            key={entry.scene.id}
            part={entry.part}
            scene={entry.scene}
            opacity={sceneOpacity(progress, k)}
            local={k === i ? progress.local : 0}
            time={progress.time}
            pointer={pointer}
          />
        )
      })}

      {/* Atmosphere over the illustration. Kept from the pre-pivot build: this
          is what stops flat layers reading as flat. */}
      {/* Atmosphere, not confetti. Sparse, small, low opacity, and pushed
          back between the mid and fore layers so it sits IN the scene rather
          than on top of it. */}
      <group position={[0, 0, -8]}>
        <ParticleField
          count={1_400}
          profile={profile}
          time={progress.time}
          color={current.part.accent}
          behaviour="drift"
          spread={[38, 22, 6]}
          size={1.1}
          speed={0.3}
          intensity={0.16}
        />
      </group>
    </>
  )
}
