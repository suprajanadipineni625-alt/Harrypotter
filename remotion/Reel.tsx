import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { StoryRoot } from '../src/story/StoryRoot'
import { Post } from '../src/scene/Post'
import { splitProgress, type Progress } from '../src/core/progress'
import { SCENE_COUNT } from '../src/story/parts'
import { profileFor } from '../src/core/tier'

/**
 * The 9:16 cut, rendered rather than screen-recorded.
 *
 * Mounts the site's OWN story components and drives them from
 * `useCurrentFrame()` instead of scroll. Only possible because every visual is
 * a pure function of `Progress` and nothing reads the wall clock — see
 * src/core/progress.ts. The pivot from abstract movements to illustrated scenes
 * did not touch this file's premise, which is the point of the rule.
 */

export const REEL = {
  width: 1080,
  height: 1920,
  fps: 60,
  /** 60 seconds — roughly 1.5s per scene across the whole story. */
  durationInFrames: 60 * 60,
} as const

export function Reel() {
  const frame = useCurrentFrame()
  const { durationInFrames, fps, width, height } = useVideoConfig()

  const global = durationInFrames <= 1 ? 0 : frame / (durationInFrames - 1)
  const { index, local } = splitProgress(global, SCENE_COUNT)

  const progress: Progress = {
    global,
    index,
    local,
    // Identical on every render pass, unlike a wall clock.
    time: frame / fps,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b1a2a' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 46, position: [0, 0, 9.4] }}
        gl={{ antialias: true }}
      >
        <StoryRoot progress={progress} profile={profileFor('high')} pointer={[0, 0]} />
        <Post profile={profileFor('high')} bloom={0.55} vignette={0.4} />
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
