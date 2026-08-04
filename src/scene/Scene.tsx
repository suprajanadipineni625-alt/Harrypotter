import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, FogExp2, type PointLight } from 'three'
import { resolveState } from '../movements/interpolate'
import { MOVEMENTS } from '../movements/movements'
import { mapRange, smoothstep, type Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'
import { Cold, scrollCast } from '../movements/Cold'
import { Web, webReveal } from '../movements/Web'
import { movementWeight } from '../movements/weight'
import { Dawn, Descent, Doors, Fire, Lights, Quiet } from '../movements/Movements'

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
 * hitch. A one-movement lookahead means the build happens while the PREVIOUS
 * movement is on screen, where nobody sees it. Allocated is not drawn — see
 * movements/weight.ts.
 */
function mountWindow(index: number): number[] {
  return [index - 1, index, index + 1].filter((i) => i >= 0 && i < MOVEMENTS.length)
}

/**
 * How present the web is at any point in the site.
 *
 * It builds through Movement III, then persists behind everything after it at
 * low opacity, thickening slightly toward the end. A web that appears once is a
 * graphic; a web that stays and accumulates is the argument the movement makes.
 */
function webPresence(progress: Progress): { reveal: number; presence: number } {
  const g = progress.global
  const inWeb = progress.movement === 2

  if (progress.movement < 2) return { reveal: 0, presence: 0 }
  if (inWeb) return { reveal: webReveal(progress.local), presence: 1 }

  // After Movement III: fully revealed, sitting well back.
  return { reveal: 1, presence: 0.1 + smoothstep(mapRange(g, 0.375, 1, 0, 1)) * 0.16 }
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
  const w = (i: number) => movementWeight(progress, i, MOVEMENTS.length)
  const web = webPresence(progress)
  const resolvedCast = cast ?? scrollCast(progress.local)

  const common = { progress, profile }

  return (
    <>
      {/* The light you carry. Present in every movement — it is the through-line. */}
      <pointLight ref={lightRef} position={[0, 0.5, 3]} distance={44} decay={1.6} />
      <ambientLight intensity={0.1} />

      {mounted.includes(0) && <Lights {...common} weight={w(0)} />}
      {mounted.includes(1) && <Doors {...common} weight={w(1)} />}
      {mounted.includes(3) && <Descent {...common} weight={w(3)} />}
      {mounted.includes(4) && (
        <Cold
          {...common}
          weight={w(4)}
          cast={progress.movement === 4 ? resolvedCast : 0}
        />
      )}
      {mounted.includes(5) && <Fire {...common} weight={w(5)} />}
      {mounted.includes(6) && <Quiet {...common} weight={w(6)} />}
      {mounted.includes(7) && <Dawn {...common} weight={w(7)} />}

      {/* The web is not gated by the mount window: once built it persists for
          the rest of the site, which is the whole point of it. */}
      {web.presence > 0.001 && (
        <Web {...common} reveal={web.reveal} presence={web.presence} />
      )}
    </>
  )
}
