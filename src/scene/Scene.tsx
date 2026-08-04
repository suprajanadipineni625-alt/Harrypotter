import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, FogExp2, type Mesh, type PointLight } from 'three'
import { resolveState } from '../movements/interpolate'
import type { Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'

/**
 * THE persistent scene. One scene, eight parameter states.
 *
 * Phase 1 deliberately renders almost nothing — a light, fog, a background and
 * one placeholder form. The point of this phase is to prove the machine holds
 * 60fps while transitioning through all eight states. Content arrives in
 * Phase 2 onward, into this same scene.
 *
 * Note the discipline: `useFrame` is used only to APPLY already-resolved state
 * to three.js objects. It never computes state from `state.clock`. All state
 * derives from the `progress` prop.
 */

export function Scene({
  progress,
  profile,
}: {
  progress: Progress
  profile: QualityProfile
}) {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const lightRef = useRef<PointLight>(null)
  const markerRef = useRef<Mesh>(null)

  const fog = useMemo(() => new FogExp2(new Color('#000').getHex(), 0.03), [])
  const bgColor = useMemo(() => new Color(), [])

  useFrame(() => {
    const s = resolveState(progress)

    // Background + fog
    bgColor.copy(s.background)
    scene.background = bgColor
    fog.color.copy(s.fog)
    fog.density = s.fogDensity
    scene.fog = fog

    // The light you carry
    if (lightRef.current) {
      lightRef.current.color.copy(s.light)
      lightRef.current.intensity = 14 + s.bloom * 10
    }

    // Camera — driven by progress, not by a clock
    camera.position.z = s.cameraZ
    camera.position.y = s.cameraY
    camera.lookAt(0, s.cameraY * 0.35, 0)

    // Placeholder form so there is something to judge depth and colour against.
    // Ambient rotation derives from progress.time, which the DRIVER supplies —
    // scroll gives real seconds, Remotion gives frame/fps. Never a clock read.
    if (markerRef.current) {
      markerRef.current.rotation.y = progress.time * 0.25
      markerRef.current.rotation.x = Math.sin(progress.time * 0.15) * 0.2
      markerRef.current.position.y = s.cameraY * 0.35
    }
  })

  return (
    <>
      <pointLight ref={lightRef} position={[0, 0.5, 3]} distance={40} decay={1.6} />
      <ambientLight intensity={0.12} />

      <mesh ref={markerRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          flatShading
          roughness={0.55}
          metalness={0.1}
          wireframe={profile.tier === 'low'}
        />
      </mesh>
    </>
  )
}
