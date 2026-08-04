import type { ArtKind } from './parts'
import type { LayerDepth } from './Layer'

/**
 * The procedural art.
 *
 * Every scene is drawn with signed-distance fields and noise — no images, no
 * models, no bytes. Gothic architecture is almost ideal for this because it is
 * built from repetition: one arch expression, drawn eight times with a modulo,
 * is a cloister.
 *
 * Each entry returns a GLSL fragment body. `GLSL_PRELUDE` in Layer.tsx has
 * already supplied uniforms, noise and the SDF helpers.
 *
 * These are placeholders in the sense that painted illustrations will be
 * better. They are NOT placeholders in the sense of throwaway: the layer slot,
 * the depth, the parallax and the composition survive the swap.
 */

/* ------------------------------------------------------------- helpers */

/** Sky: vertical gradient plus drifting cloud banks. */
const SKY = /* glsl */ `
  void main() {
    vec2 uv = vUv;

    // Saturation has to be pushed back IN.
    //
    // Simply multiplying the background colour brightens toward grey, because
    // scaling a dark colour raises all three channels proportionally and the
    // eye reads that as desaturation. Boosting the dominant channels away from
    // the mean restores the teal the direction depends on — the whole look is
    // warm windows against cold sky, and a grey sky kills the contrast.
    float m = (uBg.r + uBg.g + uBg.b) / 3.0;
    vec3 rich = clamp(m + (uBg - m) * 3.4, 0.0, 1.0) * 3.2;

    vec3 sky = mix(rich, rich * 0.42, smoothstep(0.0, 1.0, uv.y));

    // Two cloud bands at different rates. Slow, because clouds that move at a
    // readable speed look like smoke.
    float c1 = fbm(vec2(uv.x * 3.0 + uTime * 0.012, uv.y * 5.0));
    float c2 = fbm(vec2(uv.x * 6.0 - uTime * 0.008, uv.y * 8.0 + 3.0));
    float clouds = smoothstep(0.42, 0.80, c1 * 0.65 + c2 * 0.45);
    clouds *= smoothstep(0.15, 0.72, uv.y);

    // Clouds are LIGHTER SKY, not white. Mixing toward ink is what greyed it.
    vec3 col = mix(sky, rich * 1.5, clouds * 0.5);

    // A cold moon-glow high on one side gives the silhouettes an edge to read
    // against, without ever drawing a moon. Tinted, not white.
    float glow = exp(-length(uv - vec2(0.68, 0.86)) * 3.2);
    col += rich * glow * 0.55;

    gl_FragColor = vec4(col, uOpacity);
  }
`

/**
 * The castle.
 *
 * A skyline of towers built by taking the minimum of several box and spire
 * fields, with windows punched back in as accent-coloured light. Windows are
 * on a jittered grid so the building does not read as a spreadsheet — the
 * jitter is what makes it look inhabited.
 */
const CASTLE = /* glsl */ `
  // Coverage of a spire: apex up, base half-width w, height h.
  float spireMask(vec2 p, vec2 base, float w, float h) {
    float t = clamp((p.y - base.y) / h, 0.0, 1.0);
    float halfW = w * (1.0 - t);
    float inside = step(base.y, p.y) * step(p.y, base.y + h)
                 * step(abs(p.x - base.x), halfW);
    return inside;
  }

  float towerMask(vec2 p, float x, float w, float top, float spireH) {
    float body = step(abs(p.x - x), w) * step(p.y, top);
    float roof = spireMask(p, vec2(x, top), w * 1.12, spireH);
    return max(body, roof);
  }

  void main() {
    vec2 uv = vUv;
    // Work in a wider space so towers can be positioned in readable units.
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);

    float m = 0.0;

    // The main mass, then towers of decreasing height outward. Asymmetric on
    // purpose: a symmetrical skyline reads as a logo, not a building.
    m = max(m, step(abs(p.x), 0.62) * step(p.y, 0.26));
    m = max(m, towerMask(p, -0.06, 0.075, 0.40, 0.20));
    m = max(m, towerMask(p,  0.20, 0.055, 0.35, 0.16));
    m = max(m, towerMask(p, -0.34, 0.050, 0.31, 0.14));
    m = max(m, towerMask(p,  0.46, 0.060, 0.29, 0.15));
    m = max(m, towerMask(p, -0.60, 0.044, 0.25, 0.11));
    m = max(m, towerMask(p,  0.70, 0.040, 0.23, 0.10));
    m = max(m, step(abs(p.x + 0.86), 0.13) * step(p.y, 0.19));
    m = max(m, step(abs(p.x - 0.92), 0.15) * step(p.y, 0.17));

    // Break the roofline so it is not a clean cut.
    float rough = fbm(vec2(p.x * 14.0, 2.0)) * 0.012;
    m *= step(p.y, 0.62 + rough);

    vec3 col = vec3(0.0);
    float a = 0.0;

    if (m > 0.5) {
      // The stone is barely lighter than the sky. Silhouette does the work.
      col = uBg * 0.34;

      // Windows. Jittered grid, most lit, some dark, brightness varying.
      vec2 g = vec2(p.x * 22.0, p.y * 26.0);
      vec2 cell = floor(g);
      vec2 f = fract(g);
      float r = hash(cell);
      // Only about a fifth are lit, and they are small.
      float lit = step(0.80, r);
      float win = step(0.38, f.x) * step(f.x, 0.62)
                * step(0.30, f.y) * step(f.y, 0.66);
      // A slow flicker, different per window, so the castle feels occupied.
      float flicker = 0.78 + 0.22 * sin(uTime * (0.5 + r) + r * 40.0);
      col += uAccent * win * lit * flicker * 1.5;
      a = uOpacity;
    }

    gl_FragColor = vec4(col, a * m);
  }
`

/** Foreground trees, framing left and right — the reference's vignette. */
const TREES = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    float edge = min(uv.x, 1.0 - uv.x);

    // Ragged canopy pressing in from both sides, plus from the top.
    float n = fbm(vec2(uv.y * 7.0, uv.x * 3.0));
    float side = smoothstep(0.30 + n * 0.16, 0.02, edge);
    float top = smoothstep(0.82 - n * 0.18, 1.0, uv.y);

    // Trunks and branches: thin vertical strokes near the edges only.
    float br = smoothstep(0.55, 0.95, fbm(vec2(uv.x * 26.0, uv.y * 5.0 + 9.0)));
    float mask = clamp(max(side, top) + br * side * 1.4, 0.0, 1.0);

    gl_FragColor = vec4(uBg * 0.12, mask * uOpacity);
  }
`

/**
 * The letters.
 *
 * Envelopes tumbling through the frame. `uLocal` drives the flood: at the start
 * of the scene there are a handful, by the end the room is full — which is the
 * beat the scene is about.
 */
const LETTERS = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = vec3(0.0);
    float a = 0.0;

    // Grid of falling cells; each holds one rotating envelope.
    float density = mix(3.0, 9.0, uLocal);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float sc = density + fi * 3.0;
      vec2 g = vec2(uv.x * sc, uv.y * sc - uTime * (0.22 + fi * 0.12));
      vec2 cell = floor(g);
      vec2 f = fract(g) - 0.5;
      float r = hash(cell + fi * 31.0);

      // Only some cells carry an envelope, and more of them as the flood builds.
      if (r > 1.0 - mix(0.10, 0.55, uLocal)) {
        float ang = (r - 0.5) * 2.4 + uTime * (0.3 + r * 0.5);
        float ca = cos(ang), sa = sin(ang);
        vec2 q = mat2(ca, -sa, sa, ca) * f;

        // Envelope: a rectangle with a flap line across it.
        float env = fill(box(q, vec2(0.0), vec2(0.16, 0.105)), 0.012);
        float flap = fill(abs(q.y - (0.055 - abs(q.x) * 0.62)) - 0.006, 0.008);
        float shape = env;
        vec3 paper = mix(uInk, uInk * 0.72, 0.5 + 0.5 * sin(ang));
        col += paper * shape * (0.55 + r * 0.45);
        col -= uInk * 0.35 * flap * env;
        a += shape;
      }
    }

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOpacity);
  }
`

/**
 * The Great Hall — floating candles over four long tables.
 *
 * This is where the house palette is established, so the four table bands are
 * deliberately readable as four distinct colours.
 */
const GREAT_HALL = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = vec3(0.0);
    float a = 0.0;

    // Candles: a field of small warm points, drifting, denser toward the top.
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float sc = 11.0 + fi * 7.0;
      vec2 g = vec2(uv.x * sc + fi * 3.7, uv.y * sc * 0.7);
      vec2 cell = floor(g);
      float r = hash(cell + fi * 17.0);
      if (r < 0.34) continue;
      vec2 f = fract(g) - 0.5;
      f.y += sin(uTime * (0.35 + r * 0.4) + r * 30.0) * 0.10;
      float flame = exp(-length(f) * (13.0 - fi * 1.6));
      float up = smoothstep(0.18, 0.95, uv.y);
      col += uAccent * flame * up * (0.8 + r * 0.8);
      a += flame * up;
    }

    // Four tables running away from the viewer along the lower third.
    float band = smoothstep(0.30, 0.0, uv.y);
    float which = floor(uv.x * 4.0);
    vec3 house =
      which < 1.0 ? vec3(0.55, 0.13, 0.16) :
      which < 2.0 ? vec3(0.10, 0.22, 0.42) :
      which < 3.0 ? vec3(0.68, 0.55, 0.14) :
                    vec3(0.12, 0.36, 0.25);
    float stripe = smoothstep(0.06, 0.0, abs(fract(uv.x * 4.0) - 0.5) - 0.34);
    col += house * band * stripe * 0.5;
    a += band * stripe * 0.5;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOpacity);
  }
`

/**
 * The chess game.
 *
 * A board in perspective with pieces standing on it, and — as `uLocal`
 * advances — one square left conspicuously empty where a piece was taken.
 * The scene is about a sacrifice, so the gap is the subject.
 */
const CHESS = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = vec3(0.0);
    float a = 0.0;

    // Perspective: squash toward the horizon.
    float horizon = 0.62;
    if (uv.y < horizon) {
      float depth = (horizon - uv.y) / horizon;
      float persp = 1.0 / (0.14 + depth * 1.5);
      vec2 bp = vec2((uv.x - 0.5) * persp, depth * persp * 1.4);
      vec2 sq = floor(bp * 4.0);
      float check = mod(sq.x + sq.y, 2.0);

      float fade = smoothstep(1.0, 0.05, depth);
      col += mix(uBg * 0.35, uInk * 0.30, check) * fade;
      a += fade * 0.9;

      // Pieces: blocks standing on alternating squares, one gap opening up.
      float r = hash(sq);
      vec2 f = fract(bp * 4.0) - 0.5;
      float taken = step(r, uLocal * 0.35);
      float piece = step(0.60, r) * (1.0 - taken)
                  * fill(box(f, vec2(0.0, -0.05), vec2(0.16, 0.28)), 0.05);
      col += mix(uBg * 0.1, uInk * 0.55, check) * piece * fade;
      a += piece * fade;
    }

    // Dust and grit in the air over the board.
    float grit = smoothstep(0.86, 1.0, fbm(vec2(uv * 26.0 + uTime * 0.05)));
    col += uInk * grit * 0.05;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uOpacity);
  }
`

/** Stone corridor: repeating arches, torchlight, wet floor. */
const CORRIDOR = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = uBg * 0.5;

    // Arcade. One arch expression, repeated with a modulo — which is exactly
    // how the real architecture is built.
    float ax = fract(uv.x * 5.0) - 0.5;
    float archTop = 0.52 + 0.16 * sqrt(max(0.0, 1.0 - pow(abs(ax) / 0.34, 2.0)));
    float pillar = smoothstep(0.30, 0.26, abs(ax));
    float opening = step(uv.y, archTop) * (1.0 - pillar);
    col = mix(col, uBg * 0.12, opening);

    // Torches between the arches, and their pooled light on the floor.
    float tx = fract(uv.x * 5.0 + 0.5);
    float torch = exp(-length(vec2((tx - 0.5) * 2.4, (uv.y - 0.62) * 3.0)) * 3.4);
    float flick = 0.82 + 0.18 * sin(uTime * 3.1 + uv.x * 20.0);
    col += uAccent * torch * flick * 0.75;

    // Reflection on wet stone below.
    float wet = smoothstep(0.24, 0.0, uv.y);
    col += uAccent * torch * flick * wet * 0.30;

    col *= 0.55 + 0.45 * smoothstep(0.0, 0.5, uv.y);
    gl_FragColor = vec4(col, uOpacity);
  }
`

/** Deep water: caustics above, darkness below. */
const WATER = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    float depth = 1.0 - uv.y;
    vec3 col = mix(uBg * 1.9, uBg * 0.18, smoothstep(0.0, 0.85, depth));

    // Caustics, strongest near the surface.
    float c = fbm(vec2(uv.x * 9.0 + uTime * 0.10, uv.y * 14.0 - uTime * 0.05));
    c = pow(smoothstep(0.44, 0.86, c), 2.2);
    col += uAccent * c * smoothstep(0.75, 0.0, depth) * 0.55;

    // Shafts of failing light from above.
    float shaft = pow(max(0.0, sin(uv.x * 7.0 + 1.4)), 7.0);
    col += uInk * shaft * smoothstep(1.0, 0.25, depth) * 0.10;

    gl_FragColor = vec4(col, uOpacity);
  }
`

/** Void: near-black with the faintest structure. Used for King's Cross inverted. */
const VOID_LAYER = /* glsl */ `
  void main() {
    float n = fbm(vUv * 3.0 + uTime * 0.01);
    vec3 col = uBg * (0.5 + n * 0.4);
    gl_FragColor = vec4(col, uOpacity);
  }
`

/** Ruin: broken verticals against light. The castle, taken apart. */
const RUIN = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);
    float m = 0.0;

    // Same skyline language as CASTLE, but every top is broken at a different
    // height and nothing is symmetrical. The rhyme is the point.
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      float x = -0.86 + fi * 0.215;
      float r = hash(vec2(fi, 3.0));
      float w = 0.032 + r * 0.055;
      float top = mix(0.12, 0.52, r) * (1.0 - uLocal * 0.25);
      float jag = fbm(vec2(p.x * 30.0 + fi, 5.0)) * 0.05;
      m = max(m, step(abs(p.x - x), w) * step(p.y, top + jag));
    }
    m = max(m, step(abs(p.x), 0.75) * step(p.y, 0.14));

    vec3 col = uBg * 0.22;
    // Fires still burning in the wreck.
    float fire = exp(-length(vec2(p.x * 0.8, p.y - 0.05)) * 3.0);
    col += uAccent * fire * (0.6 + 0.4 * sin(uTime * 2.0)) * m;

    gl_FragColor = vec4(col, m * uOpacity);
  }
`

/** Ink and parchment: the Three Brothers register. */
const INK = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    // Parchment ground with grain.
    vec3 col = uInk * (0.86 + fbm(uv * 60.0) * 0.14);
    // Three standing silhouettes, spaced across.
    float m = 0.0;
    for (int i = 0; i < 3; i++) {
      float x = 0.28 + float(i) * 0.22;
      vec2 q = vec2(uv.x - x, uv.y - 0.30);
      float body = fill(box(q, vec2(0.0, 0.0), vec2(0.028, 0.13)), 0.006);
      float head = fill(circle(q, vec2(0.0, 0.155), 0.026), 0.005);
      // Ragged hems so they read as drawn rather than as boxes.
      float hem = step(uv.y, 0.17 + fbm(vec2(uv.x * 40.0, 2.0)) * 0.03);
      m = max(m, max(body * (1.0 - hem * 0.0), head));
    }
    col = mix(col, uBg * 0.1, m);
    gl_FragColor = vec4(col, uOpacity);
  }
`

/* --------------------------------------------------------------- table */

type Composition = Partial<Record<LayerDepth, string>>

const COMPOSITIONS: Record<ArtKind, Composition> = {
  letters: { back: SKY, mid: CORRIDOR, fore: LETTERS },
  platform: { back: SKY, mid: CASTLE, fore: TREES },
  greathall: { back: VOID_LAYER, mid: GREAT_HALL, fore: TREES },
  chess: { back: VOID_LAYER, mid: CHESS },
  mirror: { back: VOID_LAYER, mid: CORRIDOR },
  castle: { back: SKY, mid: CASTLE, fore: TREES },
  corridor: { back: VOID_LAYER, mid: CORRIDOR },
  chamber: { back: VOID_LAYER, mid: CORRIDOR, fore: WATER },
  train: { back: SKY, mid: CORRIDOR },
  lake: { back: SKY, mid: WATER },
  graveyard: { back: SKY, mid: RUIN, fore: TREES },
  prophecy: { back: VOID_LAYER, mid: GREAT_HALL },
  cave: { back: VOID_LAYER, mid: WATER },
  tower: { back: SKY, mid: CASTLE },
  tent: { back: SKY, mid: TREES },
  ice: { back: SKY, mid: WATER, fore: TREES },
  brothers: { back: INK },
  gringotts: { back: VOID_LAYER, mid: CORRIDOR },
  fiendfyre: { back: VOID_LAYER, mid: RUIN },
  battle: { back: SKY, mid: RUIN, fore: TREES },
  forest: { back: SKY, mid: TREES, fore: TREES },
  kingscross: { back: VOID_LAYER },
  dawn: { back: SKY, mid: CASTLE, fore: TREES },
}

export function compositionFor(kind: ArtKind): Composition {
  return COMPOSITIONS[kind] ?? { back: VOID_LAYER }
}
