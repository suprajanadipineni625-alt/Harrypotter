import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
} from 'three'
import { mapRange, smoothstep, type Progress } from '../core/progress'
import type { QualityProfile } from '../core/tier'

/**
 * Movement III — the web. Also the site-wide connective layer (Phase 4).
 *
 * The Marauder's Map and the Black family tapestry are the same object with
 * opposite intent: one finds people, the other erases whoever disappointed the
 * family. That contrast is the movement.
 *
 * Characters are points, house is colour, relationships are threads. Two draw
 * calls total — one for the nodes, one for every edge — because both are single
 * buffers rather than per-object meshes.
 *
 * It GROWS: `reveal` controls how much of the web exists, and the site passes a
 * value that accumulates across later movements, so by Dawn the web is dense
 * and tangled. That accumulation is the point; a web that just appears is a
 * graphic, a web that thickens is an argument.
 */

/**
 * Four house palettes plus a muted fifth for the unaffiliated.
 * The only place in the site where house colour appears.
 */
const HOUSE_COLOURS = ['#8c2f39', '#28527a', '#c9a227', '#2f6d4f', '#6b6560']

/**
 * The web's shape.
 *
 * Deliberately NOT a real character database — that would be a research project
 * and a licensing question, and it would read as a wiki. What matters visually
 * is the topology: four dense clusters that mostly connect inward, a handful of
 * threads that cross between them, and a few nodes that sit outside any house.
 * Those crossing threads are the whole meaning of the movement.
 */
function buildWeb(nodeCount: number) {
  const positions = new Float32Array(nodeCount * 3)
  const colours = new Float32Array(nodeCount * 3)
  const order = new Float32Array(nodeCount)
  const cluster = new Int32Array(nodeCount)
  const c = new Color()

  // Four house clusters plus a small unaffiliated group.
  // Kept well inside frame. BUILD-CONSTRAINTS §3: key moments must survive a
  // centre crop to 9:16, so nothing important may live near the left or right
  // edge — a wide composition is exactly what gets cut in half in the post.
  const centres: [number, number, number][] = [
    [-4.2, 2.6, -1.5],
    [4.2, 2.6, -1.5],
    [-4.2, -2.6, 1.5],
    [4.2, -2.6, 1.5],
    [0, 0, 3.5],
  ]

  for (let i = 0; i < nodeCount; i++) {
    // Weight toward the four houses; the fifth group stays sparse.
    const h = i % 24 === 0 ? 4 : i % 4
    cluster[i] = h
    const [cx, cy, cz] = centres[h]
    const spreadR = h === 4 ? 1.6 : 2.3

    // Gaussian-ish clumping: sum of two randoms clusters toward the centre.
    const rx = (Math.random() + Math.random() - 1) * spreadR
    const ry = (Math.random() + Math.random() - 1) * spreadR * 0.8
    const rz = (Math.random() + Math.random() - 1) * spreadR * 0.8

    positions[i * 3] = cx + rx
    positions[i * 3 + 1] = cy + ry
    positions[i * 3 + 2] = cz + rz

    c.set(HOUSE_COLOURS[h])
    colours[i * 3] = c.r
    colours[i * 3 + 1] = c.g
    colours[i * 3 + 2] = c.b

    // Reveal order. Randomised rather than sequential so the web fills in
    // organically instead of sweeping across the screen.
    order[i] = Math.random()
  }

  // Edges. Mostly within a house; a minority cross between them.
  const edges: number[] = []
  const edgeOrder: number[] = []
  for (let i = 0; i < nodeCount; i++) {
    const links = 1 + (i % 3 === 0 ? 1 : 0)
    for (let k = 0; k < links; k++) {
      // One in six edges crosses houses. Those are the interesting ones.
      const crossing = Math.random() < 0.17
      let j = -1
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = Math.floor(Math.random() * nodeCount)
        if (candidate === i) continue
        const sameHouse = cluster[candidate] === cluster[i]
        if (crossing ? !sameHouse : sameHouse) {
          j = candidate
          break
        }
      }
      if (j < 0) continue
      edges.push(i, j)
      // An edge appears only once both its endpoints have.
      edgeOrder.push(Math.max(order[i], order[j]))
    }
  }

  const linePos = new Float32Array(edges.length * 3)
  const lineCol = new Float32Array(edges.length * 3)
  const lineOrder = new Float32Array(edges.length)

  for (let e = 0; e < edges.length; e++) {
    const n = edges[e]
    linePos[e * 3] = positions[n * 3]
    linePos[e * 3 + 1] = positions[n * 3 + 1]
    linePos[e * 3 + 2] = positions[n * 3 + 2]
    lineCol[e * 3] = colours[n * 3]
    lineCol[e * 3 + 1] = colours[n * 3 + 1]
    lineCol[e * 3 + 2] = colours[n * 3 + 2]
    lineOrder[e] = edgeOrder[e >> 1]
  }

  return { positions, colours, order, linePos, lineCol, lineOrder }
}

const nodeVert = /* glsl */ `
  uniform float uReveal;
  uniform float uTime;
  attribute vec3 aColour;
  attribute float aOrder;
  varying vec3 vColour;
  varying float vOn;
  void main() {
    vColour = aColour;
    // A node exists once the reveal front passes its order value.
    vOn = smoothstep(aOrder - 0.08, aOrder + 0.02, uReveal);
    vec3 p = position;
    p.y += sin(uTime * 0.35 + aOrder * 20.0) * 0.09;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(5.0 * (260.0 / -mv.z) * vOn, 1.0, 10.0);
    gl_Position = projectionMatrix * mv;
  }
`

const nodeFrag = /* glsl */ `
  varying vec3 vColour;
  varying float vOn;
  uniform float uIntensity;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float core = 1.0 - smoothstep(0.0, 0.25, d);
    core *= core;
    float a = core * vOn * uIntensity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColour, a);
  }
`

const lineVert = /* glsl */ `
  uniform float uReveal;
  attribute vec3 aColour;
  attribute float aOrder;
  varying vec3 vColour;
  varying float vOn;
  void main() {
    vColour = aColour;
    vOn = smoothstep(aOrder - 0.05, aOrder + 0.06, uReveal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lineFrag = /* glsl */ `
  varying vec3 vColour;
  varying float vOn;
  uniform float uIntensity;
  void main() {
    float a = vOn * uIntensity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColour, a);
  }
`

export function Web({
  progress,
  profile,
  /**
   * 0..1 how much of the web exists. Movement III drives this to 1; later
   * movements hold it there so the web persists behind them.
   */
  reveal,
  /** Overall opacity. Low outside Movement III so it sits behind the content. */
  presence = 1,
}: {
  progress: Progress
  profile: QualityProfile
  reveal: number
  presence?: number
}) {
  // Node count scales with tier — the topology reads the same either way.
  const nodeCount = profile.tier === 'high' ? 900 : profile.tier === 'mid' ? 520 : 260

  const built = useMemo(() => buildWeb(nodeCount), [nodeCount])

  const nodeGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(built.positions, 3))
    g.setAttribute('aColour', new BufferAttribute(built.colours, 3))
    g.setAttribute('aOrder', new BufferAttribute(built.order, 1))
    return g
  }, [built])

  const lineGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(built.linePos, 3))
    g.setAttribute('aColour', new BufferAttribute(built.lineCol, 3))
    g.setAttribute('aOrder', new BufferAttribute(built.lineOrder, 1))
    return g
  }, [built])

  const nodeMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: nodeVert,
        fragmentShader: nodeFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uReveal: { value: 0 },
          uTime: { value: 0 },
          uIntensity: { value: 1 },
        },
      }),
    [],
  )

  const lineMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uReveal: { value: 0 }, uIntensity: { value: 1 } },
      }),
    [],
  )

  useFrame(() => {
    nodeMat.uniforms.uReveal.value = reveal
    nodeMat.uniforms.uTime.value = progress.time
    nodeMat.uniforms.uIntensity.value = presence
    lineMat.uniforms.uReveal.value = reveal
    // Threads sit well under the nodes; at equal weight the web reads as mesh
    // rather than as people connected by relationships.
    lineMat.uniforms.uIntensity.value = presence * 0.28
  })

  useEffect(
    () => () => {
      nodeGeo.dispose()
      lineGeo.dispose()
      nodeMat.dispose()
      lineMat.dispose()
    },
    [nodeGeo, lineGeo, nodeMat, lineMat],
  )

  if (presence <= 0.001) return null

  return (
    <group>
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
    </group>
  )
}

/** Movement III's own reveal curve. */
export function webReveal(local: number): number {
  return smoothstep(mapRange(local, 0.05, 0.85, 0, 1))
}
