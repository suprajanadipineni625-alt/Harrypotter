import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollDriver, useProgress } from './scroll/ScrollDriver'
import { StoryRoot } from './story/StoryRoot'
import { Prose, HorcruxCounter } from './story/Prose'
import { Post } from './scene/Post'
import { PerfPanel, PerfProbe, type PerfSample } from './core/PerfOverlay'
import { detectTier, prefersReducedMotion, profileFor } from './core/tier'
import { PARTS, SCENES, SCENE_COUNT } from './story/parts'
import './App.css'

/**
 * An illustrated story in eight parts.
 *
 * Scroll drives progress; progress selects a scene and how far through it you
 * are; the scene draws itself as parallax layers with a paragraph beside it.
 * See docs/STORY.md.
 */

/** How many Horcruxes have been destroyed by the time you reach scene `i`. */
function destroyedBy(i: number): number {
  let n = 0
  for (let k = 0; k <= i && k < SCENES.length; k++) {
    if (SCENES[k].scene.horcrux) n++
  }
  return n
}

function Experience() {
  const progress = useProgress()
  const [sample, setSample] = useState<PerfSample | null>(null)
  const [pointer, setPointer] = useState<[number, number]>([0, 0])
  const raf = useRef(0)

  const profile = useMemo(() => profileFor(detectTier()), [])
  const reduced = useMemo(prefersReducedMotion, [])
  const onSample = useCallback((s: PerfSample) => setSample(s), [])

  // Pointer drives a small look-around drift. Throttled to one frame, and
  // disabled entirely under reduced motion.
  useEffect(() => {
    if (reduced) return
    let latest: [number, number] = [0, 0]
    const onMove = (e: PointerEvent) => {
      latest = [
        (e.clientX / window.innerWidth - 0.5) * 2,
        -(e.clientY / window.innerHeight - 0.5) * 2,
      ]
      if (!raf.current) {
        raf.current = requestAnimationFrame(() => {
          raf.current = 0
          setPointer(latest)
        })
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [reduced])

  const i = Math.min(progress.index, SCENES.length - 1)
  const { part, scene } = SCENES[i]
  const isPartOpening = part.scenes[0].id === scene.id
  const destroyed = destroyedBy(i)

  // Prose fades as a scene ends so the next arrives clean.
  const proseOpacity = progress.local > 0.82 ? 1 - (progress.local - 0.82) / 0.18 : 1

  return (
    <>
      <div className="canvas-layer">
        <Canvas
          dpr={[1, profile.maxPixelRatio]}
          camera={{ fov: 46, position: [0, 0, 9.4] }}
          gl={{ antialias: profile.tier !== 'low', powerPreference: 'high-performance' }}
        >
          <StoryRoot progress={progress} profile={profile} pointer={pointer} />
          <Post profile={profile} bloom={0.55} vignette={0.4} />
          <PerfProbe onSample={onSample} />
        </Canvas>
      </div>

      <div className="scroll-track" style={{ height: `${SCENE_COUNT * 110}vh` }} />

      <Prose
        part={part}
        scene={scene}
        opacity={proseOpacity}
        isPartOpening={isPartOpening}
      />

      <HorcruxCounter destroyed={destroyed} />

      <p className="progress-note" aria-hidden="true">
        Part {part.n} of {PARTS.length}
      </p>

      <PerfPanel
        sample={sample}
        profile={profile}
        movementTitle={`${part.n} · ${scene.title}`}
        globalProgress={progress.global}
        castValue={null}
        castSource={`${destroyed}/7 horcruxes`}
      />
    </>
  )
}

export default function App() {
  return (
    <ScrollDriver>
      <Experience />
    </ScrollDriver>
  )
}
