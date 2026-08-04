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


/**
 * King's Cross — the white.
 *
 * The prose says "white, in every direction". It was rendering near-black,
 * because it reused the generic void layer. This is the only inverted scene in
 * the site and the cheapest thing in it: a white field with the faintest
 * suggestion of a vaulted roof.
 */
const WHITE_VOID = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    // Not flat white — a soft radial falloff keeps it from reading as a bug.
    float d = length(uv - vec2(0.5, 0.55));
    vec3 col = vec3(1.0) - vec3(0.10, 0.09, 0.07) * smoothstep(0.1, 0.9, d);
    // Ghost of an arched station roof, barely there.
    float arch = abs(uv.y - (0.86 - pow(abs(uv.x - 0.5) * 2.0, 2.0) * 0.22));
    col -= vec3(0.05) * (1.0 - smoothstep(0.0, 0.012, arch));
    float haze = fbm(uv * 4.0 + uTime * 0.008) * 0.03;
    gl_FragColor = vec4(col - haze, uOpacity);
  }
`

/**
 * The station trainshed — Platform nine and three quarters.
 *
 * Was drawing the castle, which is simply the wrong building. A Victorian
 * iron-and-glass shed: repeating arched trusses receding to a vanishing point,
 * steam pooling at platform level.
 */
const STATION = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);
    vec3 col = uBg * 0.55;

    // The great arch of the roof.
    float roof = 0.92 - pow(abs(p.x) / 1.05, 2.0) * 0.55;
    float inside = step(uv.y, roof);
    col = mix(uBg * 1.8, col, inside);

    // Ribs of the truss, converging with depth.
    float ribs = abs(fract(p.x * 7.0 + 0.5) - 0.5);
    float rib = (1.0 - smoothstep(0.02, 0.06, ribs)) * inside
              * step(0.25, uv.y);
    col = mix(col, uBg * 0.16, rib);

    // Glazing between the ribs, catching cold light.
    float glaze = smoothstep(0.45, 0.95, uv.y) * inside * (1.0 - rib);
    col += uInk * glaze * 0.10;

    // The engine's firebox, low and warm, the only warm note.
    float fire = exp(-length(vec2(p.x * 1.6, (uv.y - 0.16) * 4.0)) * 3.0);
    col += uAccent * fire * (0.85 + 0.15 * sin(uTime * 2.2));

    // Steam rolling along the platform.
    float steam = fbm(vec2(uv.x * 4.0 - uTime * 0.05, uv.y * 9.0));
    col = mix(col, uInk * 0.5, smoothstep(0.35, 0.0, uv.y) * steam * 0.45);

    gl_FragColor = vec4(col, uOpacity);
  }
`

/**
 * The Hall of Prophecy — shelves receding into black, each holding a small
 * glowing sphere. Was drawing the Great Hall's candles, which is a different
 * kind of light entirely: candles drift, these are ranked and still.
 *
 * `uLocal` drives the shatter: past the midpoint the orbs start going out.
 */
const PROPHECY = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = uBg * 0.35;

    // Perspective rows receding to a centre vanishing point.
    vec2 c = uv - vec2(0.5, 0.52);
    float depth = 1.0 / max(abs(c.y) * 4.0 + 0.06, 0.06);
    vec2 q = vec2(c.x * depth, depth);

    vec2 cell = floor(vec2(q.x * 2.5, q.y * 1.6));
    vec2 f = fract(vec2(q.x * 2.5, q.y * 1.6)) - 0.5;
    float r = hash(cell);

    float fade = smoothstep(9.0, 0.6, depth);

    // Shelf boards.
    float shelf = (1.0 - smoothstep(0.03, 0.09, abs(f.y - 0.42))) * fade;
    col += uInk * shelf * 0.05;

    // The orbs. After the midpoint they begin to fall dark.
    float alive = step(uLocal * 1.4, r + 0.35);
    float orb = exp(-length(f * vec2(1.0, 1.35)) * 7.0) * step(0.35, r);
    float pulse = 0.7 + 0.3 * sin(uTime * 0.8 + r * 30.0);
    col += mix(uAccent, uInk, 0.4) * orb * fade * pulse * alive * 1.6;

    // Darkness closing in from every edge — the hall has no visible walls.
    col *= 1.0 - smoothstep(0.35, 0.95, length(c) * 1.6);

    gl_FragColor = vec4(col, uOpacity);
  }
`

/**
 * The cave — black water, a ring of green fire, hands beneath the surface.
 *
 * Was reusing the generic water layer, which has caustics and light from above.
 * This has neither: the only light is the ring, and everything below it is
 * opaque.
 */
const CAVE = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = uBg * 0.10;

    // The ring of fire, sitting on the water at mid-height.
    vec2 c = (uv - vec2(0.5, 0.46)) * vec2(1.0, 2.6);
    float ring = abs(length(c) - 0.26);
    float flicker = 0.82 + 0.18 * sin(uTime * 3.4 + uv.x * 12.0);
    col += uAccent * (1.0 - smoothstep(0.0, 0.055, ring)) * flicker * 2.2;
    // Its glow on the air.
    col += uAccent * exp(-ring * 6.0) * 0.35 * flicker;

    // Still black water below, holding a broken reflection.
    float water = smoothstep(0.46, 0.42, uv.y);
    float ripple = fbm(vec2(uv.x * 12.0, uv.y * 30.0 - uTime * 0.15));
    col = mix(col, col * 0.30 + uAccent * ripple * 0.10, water);

    // Shapes rising through it, never resolving.
    float hands = smoothstep(0.62, 0.95, fbm(vec2(uv.x * 7.0, uv.y * 5.0 - uTime * 0.06)));
    col += uAccent * hands * water * 0.08;

    gl_FragColor = vec4(col, uOpacity);
  }
`

/** The graveyard — leaning stones and low mist, not a ruined castle. */
const GRAVEYARD = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);
    vec3 col = uBg * 0.4;
    float m = 0.0;

    // Rows of headstones, smaller and paler with depth.
    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      float r = hash(vec2(fi, 7.0));
      float row = floor(fi / 5.0);
      float base = 0.06 + row * 0.055;
      float x = -0.95 + fract(r * 3.7) * 1.9;
      float w = (0.020 + r * 0.016) * (1.0 - row * 0.2);
      float h = (0.075 + r * 0.055) * (1.0 - row * 0.22);
      // Leaning, because a straight row of stones looks like a fence.
      float lean = (r - 0.5) * 0.22;
      float px = p.x - x - (p.y - base) * lean;
      float stone = step(abs(px), w) * step(base, p.y) * step(p.y, base + h);
      // Rounded tops.
      stone = max(stone, step(length(vec2(px, (p.y - base - h)) * vec2(1.0, 1.0)), w));
      m = max(m, stone * (1.0 - row * 0.15));
    }

    col = mix(col, uBg * 0.14, m);

    // Ground mist swallowing their feet.
    float mist = fbm(vec2(uv.x * 5.0 + uTime * 0.02, uv.y * 12.0));
    col = mix(col, uInk * 0.22, smoothstep(0.22, 0.02, uv.y) * (0.4 + mist * 0.5));

    gl_FragColor = vec4(col, uOpacity);
  }
`

/** Gringotts — a vault of gold receding into dark. */
const VAULT = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = uBg * 0.16;

    // Heaped coins: many small bright specks, denser toward the floor.
    float heap = smoothstep(0.55, 0.0, uv.y);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float sc = 40.0 + fi * 34.0;
      vec2 g = vec2(uv.x * sc, uv.y * sc * 1.6);
      vec2 cell = floor(g);
      float r = hash(cell + fi * 13.0);
      vec2 f = fract(g) - 0.5;
      float coin = (1.0 - smoothstep(0.10, 0.30, length(f))) * step(0.55, r);
      float glint = 0.5 + 0.5 * sin(uTime * 1.4 + r * 40.0);
      col += uAccent * coin * heap * glint * (0.5 + r * 0.9);
    }

    // Vault walls closing in.
    col *= 1.0 - smoothstep(0.4, 1.0, abs(uv.x - 0.5) * 2.0) * 0.75;
    // Distant torch, high.
    col += uAccent * exp(-length(uv - vec2(0.5, 0.88)) * 5.0) * 0.5;

    gl_FragColor = vec4(col, uOpacity);
  }
`

/** Fiendfyre — cursed fire, rolling and animal-shaped at the edges. */
const CURSED_FIRE = /* glsl */ `
  void main() {
    vec2 uv = vUv;

    // Layered rising noise. Domain-warping the second octave by the first is
    // what gives fire its curling, self-devouring look rather than a flat wash.
    vec2 q = vec2(uv.x * 3.0, uv.y * 2.4 - uTime * 0.35);
    float n1 = fbm(q);
    float n2 = fbm(q * 2.1 + vec2(n1 * 1.6, -uTime * 0.5));
    float fire = pow(smoothstep(0.25, 0.95, n1 * 0.55 + n2 * 0.65), 1.5);
    fire *= smoothstep(0.0, 0.45, uv.y) * smoothstep(1.05, 0.35, uv.y);

    vec3 col = uBg * 0.14;
    col += uAccent * fire * 2.0;
    // White-hot core where the two octaves agree.
    col += vec3(1.0, 0.92, 0.72) * pow(fire, 3.0) * 0.85;

    gl_FragColor = vec4(col, uOpacity);
  }
`

/** A lit tent in an enormous empty dark. */
const TENT = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);
    vec3 col = uBg * 0.42;

    // Ground.
    col = mix(col, uBg * 0.18, smoothstep(0.26, 0.20, uv.y));

    // The tent: a small triangle, deliberately tiny in the frame.
    float t = clamp((p.y - 0.20) / 0.13, 0.0, 1.0);
    float tent = step(abs(p.x + 0.18), 0.085 * (1.0 - t))
               * step(0.20, p.y) * step(p.y, 0.33);
    col = mix(col, uBg * 0.10, tent);
    // Lit from within.
    col += uAccent * exp(-length(vec2((p.x + 0.18) * 3.0, (uv.y - 0.245) * 7.0)) * 3.0)
         * (0.85 + 0.15 * sin(uTime * 1.8));

    // Snow.
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float sc = 26.0 + fi * 18.0;
      vec2 g = vec2(uv.x * sc + sin(uv.y * 3.0 + uTime * 0.2) * 0.6,
                    uv.y * sc - uTime * (0.5 + fi * 0.4));
      vec2 f = fract(g) - 0.5;
      float r = hash(floor(g) + fi * 9.0);
      col += uInk * (1.0 - smoothstep(0.06, 0.20, length(f))) * step(0.86, r) * 0.5;
    }

    gl_FragColor = vec4(col, uOpacity);
  }
`

/** A train window at night, frost creeping in from its edges. */
const TRAIN = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = uBg * 0.30;

    // Window aperture.
    float win = step(0.10, uv.x) * step(uv.x, 0.90)
              * step(0.18, uv.y) * step(uv.y, 0.86);
    // Outside: dark, with lights streaking past.
    float streak = smoothstep(0.90, 1.0, fbm(vec2(uv.x * 3.0 - uTime * 1.1, uv.y * 22.0)));
    col = mix(col, uBg * 0.9 + uAccent * streak * 0.5, win);

    // Frost growing inward from the frame — crystalline, not smooth.
    float edge = min(min(uv.x - 0.10, 0.90 - uv.x), min(uv.y - 0.18, 0.86 - uv.y));
    float crystal = fbm(uv * 24.0) * 0.5 + fbm(uv * 60.0) * 0.5;
    float frost = smoothstep(0.30, 0.0, edge / max(crystal, 0.25));
    col = mix(col, uInk * 0.62, frost * win * 0.85);

    // The frame itself.
    col = mix(uBg * 0.12, col, win);
    gl_FragColor = vec4(col, uOpacity);
  }
`

/** One tall mirror in an empty dark room. */
const MIRROR = /* glsl */ `
  void main() {
    vec2 uv = vUv;
    vec3 col = uBg * 0.16;

    vec2 c = uv - vec2(0.5, 0.48);
    // Arched top, flat base.
    float frame = max(abs(c.x) - 0.17, abs(c.y) - 0.30);
    float arch = length(vec2(c.x, max(0.0, c.y - 0.14))) - 0.17;
    float shape = min(max(frame, -0.0), arch);
    float inside = 1.0 - smoothstep(-0.004, 0.004, shape);

    // The glass: light spilling out, no image in it. What it shows is the one
    // thing we deliberately cannot draw.
    float glow = exp(-length(c * vec2(2.2, 1.2)) * 2.4);
    col += mix(uInk, uAccent, 0.35) * inside * glow * 1.1;

    // Gilt edge.
    float edge = 1.0 - smoothstep(0.004, 0.016, abs(shape));
    col += uAccent * edge * 0.65;

    // Its light on the floor.
    col += uAccent * exp(-length(vec2(c.x * 1.4, (uv.y - 0.12) * 5.0)) * 3.0) * 0.20;

    gl_FragColor = vec4(col, uOpacity);
  }
`

/* --------------------------------------------------------------- table */

type Composition = Partial<Record<LayerDepth, string>>

const COMPOSITIONS: Record<ArtKind, Composition> = {
  letters: { back: SKY, mid: CORRIDOR, fore: LETTERS },
  platform: { back: SKY, mid: STATION, fore: TREES },
  greathall: { back: VOID_LAYER, mid: GREAT_HALL, fore: TREES },
  chess: { back: VOID_LAYER, mid: CHESS },
  mirror: { back: VOID_LAYER, mid: MIRROR },
  castle: { back: SKY, mid: CASTLE, fore: TREES },
  corridor: { back: VOID_LAYER, mid: CORRIDOR },
  chamber: { back: VOID_LAYER, mid: CORRIDOR, fore: WATER },
  train: { back: VOID_LAYER, mid: TRAIN },
  lake: { back: SKY, mid: WATER },
  graveyard: { back: SKY, mid: GRAVEYARD, fore: TREES },
  prophecy: { back: VOID_LAYER, mid: PROPHECY },
  cave: { back: VOID_LAYER, mid: CAVE },
  tower: { back: SKY, mid: CASTLE },
  tent: { back: SKY, mid: TENT },
  ice: { back: SKY, mid: WATER, fore: TREES },
  brothers: { back: INK },
  gringotts: { back: VOID_LAYER, mid: VAULT },
  fiendfyre: { back: VOID_LAYER, mid: CURSED_FIRE },
  battle: { back: SKY, mid: RUIN, fore: TREES },
  forest: { back: SKY, mid: TREES, fore: TREES },
  kingscross: { back: WHITE_VOID },
  dawn: { back: SKY, mid: CASTLE, fore: TREES },
}

export function compositionFor(kind: ArtKind): Composition {
  return COMPOSITIONS[kind] ?? { back: VOID_LAYER }
}
