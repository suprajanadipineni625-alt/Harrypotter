import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { Scene } from '../src/scene/Scene'
import { Post } from '../src/scene/Post'
import { resolveState } from '../src/movements/interpolate'
import { splitProgress, type Progress } from '../src/core/progress'
import { MOVEMENT_COUNT } from '../src/movements/movements'
import { profileFor } from '../src/core/tier'
import { scrollCast } from '../src/movements/Cold'

/**
 * The 9:16 cut, rendered rather than screen-recorded.
 *
 * This mounts the SITE'S OWN scene components — no duplicated scene work — and
 * drives them from `useCurrentFrame()` instead of scroll. That is only possible
 * because of the rule set in Phase 1: every visual is a pure function of
 * `Progress`, and nothing reads the wall clock. `useFrame` advances on real
 * time, which is non-deterministic under a render pipeline and produces
 * flicker; a frame counter is exact and reproducible.
 *
 * Two consequences worth stating plainly, because both were previously accepted
 * as unavoidable:
 *
 *   - **No judder.** The output is computed, not captured. Every frame gets as
 *     long as it needs.
 *   - **No centre-crop problem.** We compose natively at 1080x1920 rather than
 *     cropping a 16:9 desktop recording, so the hero never has to be designed
 *     around surviving a crop.
 */

export const REEL = {
  width: 1080,
  height: 1920,
  fps: 60,
  /** 45 seconds. Long enough for all eight movements to land, short enough to loop. */
  durationInFrames: 60 * 45,
} as const

export function Reel() {
  const frame = useCurrentFrame()
  const { durationInFrames, fps, width, height } = useVideoConfig()

  // The single substitution: frame counter in place of scroll position.
  const global = durationInFrames <= 1 ? 0 : frame / (durationInFrames - 1)
  const { movement, local } = splitProgress(global, MOVEMENT_COUNT)

  const progress: Progress = {
    global,
    movement,
    local,
    // Ambient motion derives from frame/fps, so it is identical on every render
    // pass. This is the value the site's ScrollDriver supplies from real time.
    time: frame / fps,
  }

  // Video always renders at full quality — it is not running on a visitor's
  // phone, and render time is cheap compared to a bad-looking cut.
  const profile = profileFor('high')

  // Drive the Patronus from the timeline, since there is no pointer here.
  const cast = movement === 4 ? scrollCast(local) : 0

  // Same grade as the site. Without this the video is the raw scene — sharper,
  // dimmer, and missing the bloom that is doing most of the work.
  const state = resolveState(progress)

  return (
    <AbsoluteFill style={{ backgroundColor: '#07050a' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 42, position: [0, 0, 9] }}
        gl={{ antialias: true }}
      >
        <Scene progress={progress} profile={profile} cast={cast} />
        <Post profile={profile} state={state} />
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
