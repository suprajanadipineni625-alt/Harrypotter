import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { QualityProfile } from './tier'

/**
 * Dev-only instrumentation. Built in Phase 0 before any visual work, so that
 * every later phase can be measured rather than guessed at.
 *
 * The numbers that matter, per docs/BUILD-CONSTRAINTS.md §1:
 *   - 60fps on both tiers. This one never flexes.
 *   - under 100 draw calls
 *   - under 10 MB total build
 *
 * Toggle with the backtick key.
 */

export interface PerfSample {
  fps: number
  calls: number
  triangles: number
  /** Wireframe and line geometry count here, not under triangles. */
  lines: number
  /** Point clouds count here. This site is mostly points, so this is the one. */
  points: number
  textures: number
  geometries: number
  programs: number
}

/**
 * Lives inside the Canvas; samples the renderer and reports upward.
 *
 * Sampling happens in `useFrame` with a NEGATIVE priority rather than in its own
 * requestAnimationFrame loop. three.js resets `info.render` at the start of each
 * `render()` call, so an independent RAF loop races it and reads zeros. R3F runs
 * useFrame callbacks in priority order before rendering, so a low priority puts
 * us right after the previous frame's render — we report the last completed
 * frame, which is stable and correct.
 *
 * This is instrumentation, not scene state, so reading a clock here is fine —
 * the no-wall-clock rule in core/progress.ts governs anything that affects what
 * the render looks like.
 */
export function PerfProbe({ onSample }: { onSample: (s: PerfSample) => void }) {
  const gl = useThree((s) => s.gl)
  const frames = useRef(0)
  const last = useRef(performance.now())

  /**
   * Take manual control of `info` accumulation.
   *
   * By default three.js resets the counters at the start of every `render()`.
   * Once EffectComposer is in play there are SEVERAL render calls per frame —
   * the scene pass plus one per effect — so the default behaviour means we only
   * ever read the last one, which is a single fullscreen triangle. That reports
   * "1 draw call, 1 triangle" no matter how heavy the scene is: worse than no
   * instrumentation, because it looks like good news.
   *
   * With autoReset off we accumulate across every pass and reset once per frame
   * ourselves, so the numbers are whole-frame totals.
   */
  useEffect(() => {
    gl.info.autoReset = false
    return () => {
      gl.info.autoReset = true
    }
  }, [gl])

  useFrame(() => {
    frames.current += 1
    const now = performance.now()
    const elapsed = now - last.current
    const info = gl.info

    if (elapsed >= 500) {
      onSample({
        fps: Math.round((frames.current * 1000) / elapsed),
        calls: info.render.calls,
        triangles: info.render.triangles,
        lines: info.render.lines,
        points: info.render.points,
        textures: info.memory.textures,
        geometries: info.memory.geometries,
        programs: info.programs?.length ?? 0,
      })
      frames.current = 0
      last.current = now
    }

    // Priority -1 runs before the scene renders, so this clears the previous
    // frame's totals after we have read them.
    info.reset()
  }, -1)

  return null
}

const ok = '#7ee787'
const warn = '#e3b341'
const bad = '#ff7b72'

function verdict(value: number, good: number, poor: number) {
  if (value >= good) return ok
  if (value >= poor) return warn
  return bad
}

export function PerfPanel({
  sample,
  profile,
  movementTitle,
  globalProgress,
}: {
  sample: PerfSample | null
  profile: QualityProfile
  movementTitle: string
  globalProgress: number
}) {
  const [open, setOpen] = useState(import.meta.env.DEV)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setOpen((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open || !sample) return null

  const row = (label: string, value: string, colour?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
      <span style={{ opacity: 0.55 }}>{label}</span>
      <span style={{ color: colour ?? 'inherit', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: '0.75rem',
        left: '0.75rem',
        zIndex: 100,
        padding: '0.6rem 0.75rem',
        background: 'rgba(6,6,10,0.82)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.35rem',
        font: '500 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#e6edf3',
        pointerEvents: 'none',
        minWidth: '14rem',
      }}
    >
      {row('fps', String(sample.fps), verdict(sample.fps, 58, 45))}
      {row(
        'draw calls',
        String(sample.calls),
        sample.calls <= 100 ? ok : sample.calls <= 250 ? warn : bad,
      )}
      {row('triangles', sample.triangles.toLocaleString())}
      {row('lines', sample.lines.toLocaleString())}
      {row('points', sample.points.toLocaleString())}
      {row('textures', String(sample.textures))}
      {row('geometries', String(sample.geometries))}
      {row('programs', String(sample.programs))}
      <div
        style={{
          margin: '0.45rem 0',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      {row('tier', profile.tier)}
      {row('pixel ratio', `≤ ${profile.maxPixelRatio}`)}
      {row('particle cap', profile.maxParticles.toLocaleString())}
      {row('post', profile.richPost ? 'rich' : profile.postProcessing ? 'basic' : 'off')}
      <div
        style={{
          margin: '0.45rem 0',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      {row('movement', movementTitle)}
      {row('progress', `${(globalProgress * 100).toFixed(1)}%`)}
      <div style={{ marginTop: '0.45rem', opacity: 0.35, fontSize: '10px' }}>
        ` to toggle
      </div>
    </div>
  )
}
