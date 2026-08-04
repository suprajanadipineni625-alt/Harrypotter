import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, FogExp2, type PointLight } from 'three'
import { resolveState } from '../movements/interpolate'
import { MOVEMENTS } from '../movements/movements'
import type { Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'
import { Cold, scrollCast } from '../movements/Cold'
import { movementWeight } from '../movements/weight'

/**
 * THE persistent scene. One scene, eight parameter states.
 *
 * `useFrame` here only APPLIES already-resolved state to three.js objects. It
 * never computes state from `state.clock` — everything derives from `progress`.
 * See core/progress.ts.
 */

/**
 * Which movements have their geometry allocated right now.
 *
 * Not just the current one: building a 20k-point buffer takes a few
 * milliseconds, and doing that at the moment of a transition is a visible
 * hitch. Keeping a one-movement lookahead means the build happens while the
 * PREVIOUS movement is still on screen, where nobody sees it. Keeping the
 * previous one alive briefly means scrolling back up is equally smooth.
 */
function mountWindow(index: number): number[] {
  return [index - 1, index, index + 1].filter(
    (i) => i >= 0 && i < MOVEMENTS.length,
  )
}

export function Scene({
  progress,
  profile,
  cast,
}: {
  progress: Progress
  profile: QualityProfile
  /** 0..1 Patronus cast. Null means "use the scroll-driven default". */
  cast: number | null
}) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const lightRef = useRef<PointLight>(null)

  const fog = useMemo(() => new FogExp2(0x000000, 0.03), [])
  const bgColor = useMemo(() => new Color(), [])

  useFrame(() => {
    const s = resolveState(progress)

    bgColor.copy(s.background)
    scene.background = bgColor
    fog.color.copy(s.fog)
    fog.density = s.fogDensity
    scene.fog = fog

    if (lightRef.current) {
      lightRef.current.color.copy(s.light)
      lightRef.current.intensity = 9 + s.bloom * 7
    }

    camera.position.z = s.cameraZ
    camera.position.y = s.cameraY
    camera.lookAt(0, s.cameraY * 0.35, 0)
  })

  const mounted = mountWindow(progress.movement)
  const resolvedCast = cast ?? scrollCast(progress.local)

  return (
    <>
      {/* The light you carry, present in every movement. */}
      <pointLight ref={lightRef} position={[0, 0.5, 3]} distance={44} decay={1.6} />
      <ambientLight intensity={0.1} />

      {mounted.includes(4) && (
        <Cold
          progress={progress}
          profile={profile}
          cast={progress.movement === 4 ? resolvedCast : 0}
          weight={movementWeight(progress, 4)}
        />
      )}
    </>
  )
}
