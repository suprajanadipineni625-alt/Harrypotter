import { Layer } from './Layer'
import { compositionFor } from './art'
import type { Part, Scene } from './parts'
import type { LayerDepth } from './Layer'

/**
 * One scene: a stack of parallax layers.
 *
 * If the scene carries a painted `image`, every layer reads from it and the
 * procedural art is never compiled. Otherwise the layers draw themselves. The
 * scene, its depths and its parallax do not know or care which happened.
 */

const ORDER: LayerDepth[] = ['back', 'mid', 'fore']

export function StoryScene({
  part,
  scene,
  opacity,
  local,
  time,
  pointer,
}: {
  part: Part
  scene: Scene
  /** 0..1 presence of this scene. */
  opacity: number
  /** 0..1 progress within the scene. */
  local: number
  time: number
  pointer: [number, number]
}) {
  if (opacity <= 0.001) return null

  const composition = compositionFor(scene.art)
  const palette = { background: part.background, ink: part.ink, accent: part.accent }

  /**
   * A painted backdrop IS the scene.
   *
   * The procedural mid layer draws the same subject — the corridor, the
   * castle, the water — and it draws it opaquely, so leaving it on top of an
   * uploaded illustration hides the illustration completely. The person who
   * generated the art would see no change and reasonably conclude the upload
   * failed.
   *
   * So when a back image exists, procedural mid is dropped. The FOREGROUND
   * stays: that is the animated layer — tumbling letters, drifting snow,
   * framing trees — which is exactly what a static image cannot do, and what
   * keeps a painted scene from looking like a photograph glued to the screen.
   */
  const hasPaintedBack = Boolean(scene.image?.back)

  return (
    <group>
      {ORDER.map((depth) => {
        const image = scene.image?.[depth]
        const shader =
          hasPaintedBack && depth === 'mid' && !image ? undefined : composition[depth]
        if (!image && !shader) return null
        return (
          <Layer
            key={`${scene.id}-${depth}`}
            depth={depth}
            shader={shader ?? ''}
            image={image}
            time={time}
            opacity={opacity}
            local={local}
            palette={palette}
            pointer={pointer}
          />
        )
      })}
    </group>
  )
}
