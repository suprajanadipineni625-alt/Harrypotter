import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Mesh, ShaderMaterial, TextureLoader, Vector2, Vector3 } from 'three'

/**
 * One parallax layer of an illustrated scene.
 *
 * THE SWAP POINT. A layer draws either:
 *   - a procedural composition (today), or
 *   - a painted illustration (when one exists)
 *
 * Both are a textured plane at a given depth. Swapping means changing which
 * material the plane gets — the plane, its depth, its parallax response, the
 * scene around it and the scroll beat all stay exactly as they are. That is
 * why the procedural version is not throwaway work: it is the same slot.
 *
 * Depth is real. Layers sit at different z in the scene and the camera drifts,
 * so parallax comes from perspective rather than from faking offsets. When a
 * painted three-layer illustration replaces the procedural art, it inherits
 * that parallax for free.
 */

export type LayerDepth = 'back' | 'mid' | 'fore'

/** z position and scale per depth. Further back means bigger and slower. */
const DEPTH: Record<LayerDepth, { z: number; scale: number }> = {
  back: { z: -26, scale: 3.4 },
  mid: { z: -12, scale: 2.0 },
  fore: { z: -3, scale: 1.25 },
}

export interface LayerProps {
  depth: LayerDepth
  /** Fragment shader body drawing this layer. Ignored when `image` is set. */
  shader: string
  /** Painted illustration for this layer. Takes precedence over `shader`. */
  image?: string
  /** Seconds from the driver. Never a clock read. */
  time: number
  /** 0..1 scene presence. */
  opacity: number
  /** 0..1 progress within the scene, for art that develops as you scroll. */
  local: number
  palette: { background: string; ink: string; accent: string }
  /** Pointer in -1..1, for the slight look-around drift. */
  pointer?: [number, number]
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Shared prelude for every procedural layer.
 *
 * Signed-distance helpers plus value noise. Everything the layers draw —
 * towers, arches, clouds, water — is built from these, which is why the whole
 * story costs no bytes: the art is arithmetic.
 */
export const GLSL_PRELUDE = /* glsl */ `
  uniform float uTime;
  uniform float uLocal;
  uniform float uOpacity;
  uniform vec3 uBg;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  // Axis-aligned box, centred at c with half-extents h.
  float box(vec2 p, vec2 c, vec2 h) {
    vec2 d = abs(p - c) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
  }

  float circle(vec2 p, vec2 c, float r) { return length(p - c) - r; }

  // Soft coverage from a distance field; s is the edge softness in uv units.
  float fill(float d, float s) { return 1.0 - smoothstep(-s, s, d); }
`

export function Layer({
  depth,
  shader,
  image,
  time,
  opacity,
  local,
  palette,
  pointer = [0, 0],
}: LayerProps) {
  const mesh = useRef<Mesh>(null)
  const viewport = useThree((s) => s.viewport)
  const { z, scale } = DEPTH[depth]

  const texture = useMemo(() => {
    if (!image) return null
    // Painted art path. Loaded only for scenes that have it — a scene with no
    // backdrop never fetches anything.
    //
    // Resolved against BASE_URL because the site is served from a sub-path on
    // Pages. A root-relative path here 404s in production while working
    // perfectly in dev, which is the worst kind of bug.
    const base = import.meta.env.BASE_URL ?? '/'
    const url = image.startsWith('http') ? image : `${base}${image.replace(/^\//, '')}`
    return new TextureLoader().load(url)
  }, [image])

  const material = useMemo(() => {
    const frag = image
      ? /* glsl */ `
          uniform sampler2D uMap;
          uniform float uOpacity;
          uniform vec2 uCover;
          varying vec2 vUv;
          void main() {
            // COVER fit, not stretch.
            //
            // The plane is sized to the viewport, so mapping the texture 0..1
            // across it distorts any image whose aspect differs — a portrait
            // source on a landscape plane gets stretched horizontally, which
            // reads as horizontal smearing across the whole scene rather than
            // as an obviously wrong image. uCover rescales UVs about the
            // centre so the image fills the frame at its true aspect and the
            // overflow is cropped instead.
            vec2 uv = (vUv - 0.5) / uCover + 0.5;
            vec4 c = texture2D(uMap, uv);
            gl_FragColor = vec4(c.rgb, c.a * uOpacity);
          }
        `
      : `${GLSL_PRELUDE}\n${shader}`

    return new ShaderMaterial({
      vertexShader,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uLocal: { value: 0 },
        uOpacity: { value: 1 },
        uBg: { value: new Color(palette.background) },
        uInk: { value: new Color(palette.ink) },
        uAccent: { value: new Color(palette.accent) },
        uPointer: { value: new Vector2() },
        ...(texture ? { uMap: { value: texture }, uCover: { value: new Vector2(1, 1) } } : {}),
      },
    })
  }, [shader, image, texture, palette.background, palette.ink, palette.accent])

  useFrame(() => {
    const u = material.uniforms
    u.uTime.value = time
    u.uLocal.value = local
    u.uOpacity.value = opacity
    if (u.uBg) (u.uBg.value as Color).set(palette.background)
    if (u.uInk) (u.uInk.value as Color).set(palette.ink)
    if (u.uAccent) (u.uAccent.value as Color).set(palette.accent)
    if (u.uPointer) (u.uPointer.value as Vector2).set(pointer[0], pointer[1])

    // Recomputed per frame because both the image and the viewport can change.
    if (u.uCover && texture?.image) {
      const iw = (texture.image as { width?: number }).width ?? 1
      const ih = (texture.image as { height?: number }).height ?? 1
      const imageAspect = iw / ih
      const planeAspect = viewport.width / viewport.height
      const v = u.uCover.value as Vector2
      //
      // The shader divides by uCover, so a value ABOVE 1 narrows the sampled
      // range — which is what cropping means. Getting this inverted pushes UVs
      // outside 0..1, where the texture clamps and smears its edge pixels
      // across the frame as horizontal or vertical streaks. That looks like a
      // rendering glitch rather than a wrong image, which is what made it hard
      // to place.
      if (imageAspect > planeAspect) {
        // Image is wider than the frame: fill height, crop the sides.
        v.set(imageAspect / planeAspect, 1)
      } else {
        // Image is taller than the frame: fill width, crop top and bottom.
        v.set(1, planeAspect / imageAspect)
      }
    }

    // Parallax. Nearer layers move further, which is the whole illusion.
    if (mesh.current) {
      const strength = depth === 'fore' ? 0.6 : depth === 'mid' ? 0.28 : 0.1
      mesh.current.position.x = pointer[0] * strength
      mesh.current.position.y = pointer[1] * strength * 0.5
    }
  })

  useEffect(() => () => {
    material.dispose()
    texture?.dispose()
  }, [material, texture])

  if (opacity <= 0.001) return null

  // Sized to cover the frustum at this depth, whatever the viewport shape —
  // the same scene has to hold at 16:9 on a desktop and 9:16 in the reel.
  const dist = Math.abs(z) + 9
  const h = viewport.height * (dist / 9) * 1.15
  const w = viewport.width * (dist / 9) * 1.15

  return (
    <mesh ref={mesh} position={new Vector3(0, 0, z)} material={material}>
      <planeGeometry args={[w * (scale / scale), h, 1, 1]} />
    </mesh>
  )
}
