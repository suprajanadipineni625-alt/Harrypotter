import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { QualityProfile } from '../core/tier'

/**
 * The workhorse. One instanced point cloud, one draw call, animated entirely in
 * the vertex shader.
 *
 * Nearly every movement is this component with different parameters: candles
 * drifting, prophecy orbs falling, embers rising, ash settling, snow, the
 * Patronus burst. Building it once and parameterising it is what keeps the
 * draw-call budget in single digits with tens of thousands of points on screen.
 *
 * Animation is driven by `time` passed in from the driver — never a clock read.
 * See core/progress.ts.
 */

export type FieldBehaviour = 'drift' | 'fall' | 'rise' | 'burst'

export interface ParticleFieldProps {
  /** Requested count. Clamped to the tier's cap. */
  count: number
  profile: QualityProfile
  /** Seconds, supplied by the driver. */
  time: number
  color: Color | string
  /** How the field moves. */
  behaviour?: FieldBehaviour
  /** Box the particles occupy. */
  spread?: [number, number, number]
  /** Base point size in world units. */
  size?: number
  /** Motion rate. */
  speed?: number
  /** 0..1 overall opacity — the main dial for fading a field in and out. */
  intensity?: number
  /** 0..1 burst progress. Only used by behaviour="burst". */
  burst?: number
  /** Additive reads as light; normal reads as matter (ash, snow). */
  additive?: boolean
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uBurst;
  uniform vec3 uSpread;
  uniform int uBehaviour;
  attribute vec3 aSeed;
  attribute float aScale;
  varying float vFade;

  // Cheap hash noise. Enough for organic drift, far cheaper than simplex.
  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec3 p = position;
    float t = uTime * uSpeed;
    float s = aSeed.x * 6.2831853;

    if (uBehaviour == 0) {
      // drift — candles, dust, motes suspended in air
      p.x += sin(t * 0.4 + s) * 0.35 * aSeed.y;
      p.y += sin(t * 0.3 + s * 1.7) * 0.5 * aSeed.z;
      p.z += cos(t * 0.35 + s) * 0.35 * aSeed.y;
      vFade = 0.45 + 0.55 * (0.5 + 0.5 * sin(t * 1.6 + s * 3.0));
    } else if (uBehaviour == 1) {
      // fall — ash, snow, shattered glass. Wraps so the field never empties.
      float fall = fract(aSeed.y + t * 0.06);
      p.y = uSpread.y * 0.5 - fall * uSpread.y;
      p.x += sin(t * 0.5 + s) * 0.6;
      vFade = smoothstep(0.0, 0.12, fall) * (1.0 - smoothstep(0.82, 1.0, fall));
    } else if (uBehaviour == 2) {
      // rise — embers, sparks, light going up
      float rise = fract(aSeed.y + t * 0.09);
      p.y = -uSpread.y * 0.5 + rise * uSpread.y;
      p.x += sin(t * 1.1 + s) * 0.4 * rise;
      p.z += cos(t * 0.9 + s) * 0.4 * rise;
      vFade = smoothstep(0.0, 0.1, rise) * (1.0 - smoothstep(0.6, 1.0, rise));
    } else {
      // burst — the Patronus. Points stream outward from origin on uBurst 0..1.
      //
      // Radius is cubed rather than linear so points bunch near the core and
      // thin out toward the edge. A linear distribution puts most points at
      // large radius (surface area grows with r^2), which reads as a hollow
      // shell — the opposite of light streaming from a source.
      float h = hash(aSeed.x * 91.7);
      float d = h * h * h;
      float r = uBurst * (0.15 + d * 1.6);
      vec3 dir = normalize(position + vec3(0.0001));

      // Swirl. Radial-only motion reads as scattered dots leaving a point;
      // adding tangential rotation that decays with radius reads as FORCE —
      // energy thrown outward and dragged around, which is what a cast should
      // look like. The decay matters: constant swirl looks like a whirlpool.
      float swirl = (1.0 - d) * uBurst * 2.4;
      float ca = cos(swirl), sa = sin(swirl);
      dir.xz = mat2(ca, -sa, sa, ca) * dir.xz;

      p = dir * (r * 11.0);
      // Slight vertical lift so it is not perfectly spherical — perfect
      // symmetry is the thing that makes procedural effects look procedural.
      p.y += sin(t * 2.0 + s) * 0.2 * uBurst + r * 1.1;
      // Brightness must HOLD at full cast, not fade out at the top.
      //
      // A burst that fades as it completes works for a value that sweeps 0->1
      // and keeps going, but the cast is HELD: a visitor pressing and holding
      // parks uBurst at 1.0, and a fade-at-the-top means their reward for
      // holding is an empty screen. Ramp in, then stay.
      float edge = smoothstep(0.0, 0.22, uBurst);
      vFade = edge * (0.4 + 0.3 * sin(t * 3.0 + s)) * (1.0 - d * 0.55);
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Perspective-correct sizing, clamped HARD.
    //
    // Additive blended points are fill-rate bound, not vertex bound: every
    // pixel a point covers is a blended fragment, and they overlap heavily. A
    // 64px cap on 30k points is millions of blended fragments per frame, which
    // is the single most expensive thing this site could do on a phone. 22px
    // costs roughly a tenth of that and is visually near-identical once bloom
    // is doing the glow — bloom is a far cheaper way to make a point look big.
    gl_PointSize = clamp(uSize * aScale * (260.0 / -mv.z), 1.0, 12.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying float vFade;

  void main() {
    // A bright core with fast falloff, NOT a uniform soft disc.
    //
    // A linear soft edge makes every point read as a bokeh blob — the scene
    // looks like defocused photography rather than light. Squaring the falloff
    // concentrates the energy in the middle few pixels, which reads as a spark;
    // bloom then supplies the halo far more convincingly, and far cheaper, than
    // a big translucent quad.
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float core = 1.0 - smoothstep(0.0, 0.25, d);
    core *= core;
    // 0.42 ceiling per point. Additive blending means brightness comes from
    // OVERLAP, not from any one point being bright. Pushing individual alpha up
    // does not make the effect richer, it makes it a white rectangle.
    float alpha = core * vFade * uIntensity * 0.55;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`

const BEHAVIOUR_INDEX: Record<FieldBehaviour, number> = {
  drift: 0,
  fall: 1,
  rise: 2,
  burst: 3,
}

export function ParticleField({
  count,
  profile,
  time,
  color,
  behaviour = 'drift',
  spread = [26, 16, 18],
  size = 6,
  speed = 1,
  intensity = 1,
  burst = 0,
  additive = true,
}: ParticleFieldProps) {
  const points = useRef<Points>(null)

  // Tier decides how many points actually exist. The design asks; the device answers.
  const resolved = Math.min(count, profile.maxParticles)
  const spreadKey = spread.join(',')

  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    const pos = new Float32Array(resolved * 3)
    const seed = new Float32Array(resolved * 3)
    const scale = new Float32Array(resolved)

    for (let i = 0; i < resolved; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread[0]
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2]
      seed[i * 3] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = Math.random()
      // Squared distribution: mostly small points, a few large ones. A uniform
      // distribution looks synthetic — real light sources vary a lot.
      scale[i] = 0.35 + Math.random() * Math.random() * 1.9
    }

    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new BufferAttribute(seed, 3))
    g.setAttribute('aScale', new BufferAttribute(scale, 1))
    return g
    // Rebuilt only when the count or box changes — never per frame.
  }, [resolved, spreadKey])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: size },
          uSpeed: { value: speed },
          uBurst: { value: 0 },
          uIntensity: { value: intensity },
          uColor: { value: new Color(color) },
          uSpread: { value: new Vector3(spread[0], spread[1], spread[2]) },
          uBehaviour: { value: BEHAVIOUR_INDEX[behaviour] },
        },
      }),
    [additive, behaviour, spreadKey],
  )

  useFrame(() => {
    const u = material.uniforms
    u.uTime.value = time
    u.uIntensity.value = intensity
    u.uBurst.value = burst
    u.uSize.value = size
    u.uSpeed.value = speed
    ;(u.uColor.value as Color).set(color)
  })

  // Dispose on unmount — a leaked geometry per movement is how a WebGL site
  // dies slowly. See threejs-errors-performance. This must be useEffect:
  // useMemo does not run the function it returns.
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  if (intensity <= 0.001) return null

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
