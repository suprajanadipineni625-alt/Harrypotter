import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollDriver, useProgress } from './scroll/ScrollDriver'
import { Scene } from './scene/Scene'
import { Post } from './scene/Post'
import { PerfPanel, PerfProbe, type PerfSample } from './core/PerfOverlay'
import { detectTier, prefersReducedMotion, profileFor } from './core/tier'
import { MOVEMENTS, MOVEMENT_COUNT } from './movements/movements'
import { resolveState } from './movements/interpolate'
import { useCastControl } from './cast/CastControl'
import './App.css'

/**
 * Phase 0 + 1 shell.
 *
 * There is deliberately almost nothing to look at yet. What this proves is the
 * machine: scroll drives progress, progress drives one persistent scene through
 * eight parameter states, and the whole thing holds 60fps before any content
 * exists. See docs/PLAN.md.
 */

function Experience() {
  const progress = useProgress()
  const [sample, setSample] = useState<PerfSample | null>(null)

  const profile = useMemo(() => profileFor(detectTier()), [])
  const reduced = useMemo(prefersReducedMotion, [])
  const onSample = useCallback((s: PerfSample) => setSample(s), [])

  const state = resolveState(progress)
  const current = MOVEMENTS[progress.movement]

  // Movement V is the cast beat. Hand tracking is offered on the high tier
  // only: it is a real GPU cost on top of a full scene, and the pointer path
  // gives everyone else the identical result.
  const inCast = progress.movement === 4
  const cast = useCastControl(inCast, profile.tier === 'high')

  return (
    <>
      <div className="canvas-layer">
        <Canvas
          dpr={[1, profile.maxPixelRatio]}
          camera={{ fov: 42, position: [0, 0, 9] }}
          gl={{ antialias: profile.tier !== 'low', powerPreference: 'high-performance' }}
        >
          <Scene progress={progress} profile={profile} cast={cast.value} />
          <Post profile={profile} state={state} />
          <PerfProbe onSample={onSample} />
        </Canvas>
      </div>

      {/* Scroll track. Each movement gets one viewport of scroll for now;
          real pacing arrives with content in Phase 2. */}
      <div className="scroll-track" style={{ height: `${MOVEMENT_COUNT * 100}vh` }} />

      <div className="hud" aria-live="polite">
        <p className="hud__numeral">{current.numeral}</p>
        <h1 className="hud__title">{current.title}</h1>
        <p className="hud__intent">{current.intent}</p>
      </div>

      <div className="rail" aria-hidden="true">
        {MOVEMENTS.map((m, i) => (
          <span
            key={m.id}
            className="rail__tick"
            data-active={i === progress.movement}
            style={{
              transform: `scaleX(${
                i === progress.movement ? state.blend * 0.5 + 0.5 : 0.18
              })`,
            }}
          />
        ))}
      </div>

      {cast.ui}

      {reduced && (
        <p className="reduced-note">Reduced motion is on — the experience is calmed.</p>
      )}

      <PerfPanel
        sample={sample}
        profile={profile}
        movementTitle={`${current.numeral} · ${current.title}`}
        globalProgress={progress.global}
        castValue={cast.value}
        castSource={cast.source}
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
