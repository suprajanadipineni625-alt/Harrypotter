import { Composition } from 'remotion'
import { Reel, REEL } from './Reel'

/**
 * Compositions.
 *
 *   reel-9x16   the deliverable: 1080x1920, 60fps, natively vertical
 *   reel-16x9   the same experience for a landscape context
 *
 * Both mount the identical scene components as the live site.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="reel-9x16"
        component={Reel}
        durationInFrames={REEL.durationInFrames}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
      <Composition
        id="reel-16x9"
        component={Reel}
        durationInFrames={REEL.durationInFrames}
        fps={REEL.fps}
        width={1920}
        height={1080}
      />
    </>
  )
}
