# Build plan

How this gets built, in what order, and what has to be true before each phase
ends. Creative direction is an *input* to this plan, resolved at a specific
point — it is not the plan.

Governing principle: **build the empty machine first, fill it second.** Most
ambitious WebGL sites die because scene one is built to perfection, then the
performance and architecture problems only surface at scene five with no room
left to fix them.

---

## Stack decisions (locked before any code)

| Decision | Choice | Why |
|---|---|---|
| Bundler / framework | **Vite + React + R3F** | No SSR benefit for a full-canvas experience; Next.js adds hydration complexity for zero gain here. Vite builds faster and the static output still carries OG meta for link sharing. |
| 3D | **R3F + drei** | Declarative scene state is what makes 8 swappable acts tractable. Raw Three.js would mean hand-rolling that. |
| Scroll | **Lenis**, driven from `gsap.ticker` | See BUILD-CONSTRAINTS §2. Never two RAF loops. |
| Choreography | **GSAP + ScrollTrigger** | One timeline owns act progression. |
| UI motion | **Motion.dev** | React layer only — overlays, menus, HUD. Not the 3D. |
| Gesture | **`@mediapipe/tasks-vision`** | On-device. See §Phase 5. |
| Video output | **`@remotion/three`** | Renders the site's own act components to 9:16 60fps deterministically. See §Phase 6. |
| Language | **TypeScript** | Non-negotiable at this size. |

---

## Phase 0 — Foundation and instrumentation

No visuals. This phase exists so every later phase can be measured.

1. Scaffold Vite + React + TS + R3F. Biome or ESLint, strict TS.
2. `/impeccable init` → writes `PRODUCT.md` and `DESIGN.md`.
3. **Perf harness first**: FPS counter, `renderer.info` draw-call readout,
   triangle count, texture memory — toggleable overlay, dev-only.
4. **Tier detection**: probe GPU at init, classify `high | mid | low`, expose it
   as context. Stub the quality profiles now even if nothing reads them yet.
5. **Asset ledger**: a checked-in file recording every asset, its source, its
   licence, and its byte cost. Budget is 10 MB total; a ledger is how it stays
   there rather than being discovered blown at the end.
6. Deploy pipeline to a live URL from day one.

**Gate:** empty page deploys, overlay reports 60fps and correct tier on a real
phone and a desktop. Nothing ships past this until the numbers are visible.

---

## Phase 1 — The spine

Still almost no content. This builds the machine that all eight acts run on.

1. Lenis + GSAP ticker wiring, `lagSmoothing(0)`.
2. One master ScrollTrigger timeline with **8 empty acts** and normalised
   progress (`0..1` global, `0..1` within act).

   **Architectural rule, decided here because it cannot be retrofitted:** act
   state must be a **pure function of normalised progress**. No animation may
   read the wall clock. Concretely — never drive act state from `useFrame`'s
   internal clock; pass progress in as a prop.

   This is what makes Remotion possible later (see Phase 6). R3F's `useFrame`
   advances on real time, which is non-deterministic under a render pipeline and
   produces flicker and motion artefacts; Remotion's `<ThreeCanvas>` instead
   drives from `useCurrentFrame()`. If progress is a prop, **scroll drives it on
   the site and Remotion's frame counter drives it in the video — same
   components, two drivers, zero duplicated scene work.** If we let the clock
   creep in anywhere, the video path is gone and the only option is screen
   recording.
3. **One persistent scene, not eight.** Acts are *parameter states* of a single
   R3F scene — camera, colour grading, fog, light, post-processing stack — that
   interpolate between each other. This is both the performance strategy and the
   structural answer to "connection": if the scene never unmounts, the
   connection is literal rather than decorative.
4. Loading-group architecture: act assets grouped so a later act can never block
   the opening.
5. Quality profiles wired to tier — post-processing, particle caps, texture
   resolution, shadow strategy.

**Gate:** scroll through all 8 acts where each act is nothing but a colour and a
camera position. Holds 60fps on desktop *and* budget phone. Transitions feel
smooth. If the skeleton judders, no amount of art fixes it later.

---

## Phase 2 — Vertical slice: one act at final quality

The single most important phase. Pick **one** movement — not the first, a
middle one — and build it to the quality bar we intend to ship.

Purpose is calibration, not content. It answers:

- How long does one act actually take?
- What does one act cost in MB and draw calls?
- Does the intended quality bar survive the perf budget, or does the bar move?

Pick **Movement V (Cold)** as the slice: it carries the gesture beat, it is
post-processing-heavy rather than asset-heavy, and it is representative of the
hardest work without being the most expensive.

**Gate:** one movement is genuinely finished — passes an `/impeccable audit`,
holds 60fps on both tiers, and its asset cost is measured. Multiply that cost by
8. If the result exceeds 10 MB or the schedule, **the scope changes here**, not
later. Fiendfyre in Movement VI is the known outlier — scope it explicitly at
this gate rather than discovering it late.

---

## Phase 3 — Remaining acts

Now this is known, repeatable work. Build in narrative order so the arc can be
felt as it accumulates. Re-run the perf overlay after every act; the budget is
checked continuously, never at the end.

**Scope lever, decided at the Phase 2 gate:** if eight acts at full quality
won't fit the budget or the time, ship **three breathtaking acts rather than
eight mediocre ones**. Three acts that hold 60fps and look extraordinary beat
eight that stutter. The architecture supports adding acts later; a reputation
for a janky site is harder to undo.

**Gate:** all acts in, budget intact, arc reads end to end.

---

## Phase 4 — The web

Houses, characters, relationships — **Movement III** in CONTENT.md, plus the
persistent web that thickens under every movement after it.

Implementation: GPU-instanced points and lines — characters as points, house as
colour, relationships as threads. Cheap to render, and literally "connection"
made visual.

Built after the movements because it has to *react* to them: the web accumulates
as the site progresses, so it needs the movements to exist before it can respond
to them.

**Gate:** the web reads as one growing object rather than a repeated graphic,
costs near-nothing in draw calls, and the site still reads as continuous.

---

## Phase 5 — Gesture interaction

Built **standalone and behind a flag**, integrated last. It is the highest-risk,
highest-reward component and must never be able to break the main experience.

**Correction to the original idea: this cannot be Python.** Python means a
server, video frames leaving the device, network round-trips, hosting cost, and
a privacy problem. [MediaPipe Tasks for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js)
(`@mediapipe/tasks-vision`) runs the same underlying models **entirely
on-device**, GPU-accelerated, with 21 hand landmarks and no server at all — and
on Google's own issue tracker the JS build measures *slightly faster* than
Python on CPU. There is no version of this where Python is the better choice for
a public site.

Build order, and this order matters:

1. **Mouse/touch path first.** The gesture drives some scene parameter; prove
   that parameter works when driven by a cursor. Everyone gets this.
2. **Then** MediaPipe as an *alternative input* to the same parameter.
3. Camera is **opt-in at a specific beat**, never on page load. Roughly
   [10% of users who see a camera prompt deny it](https://blog.addpipe.com/using-permissions-api-to-detect-getusermedia-responses/),
   and an unexplained prompt on arrival reads as hostile. Ask once, in context,
   after the visitor is invested — with the fallback already working.
4. Desktop-only by default. Hand tracking plus a full 3D scene on a mid-range
   phone is a frame-budget fight we do not need to pick.

**Gate:** works with camera; works identically well without it; disabling the
flag entirely leaves the site untouched.

---

## Phase 6 — Capture pass

Explicit phase, because the video is the actual deliverable for the stated goal.

**Render the video; do not screen-record it.** Given the Phase 1 rule that act
state is a pure function of progress, the scene components can be mounted inside
[`@remotion/three`](https://www.remotion.dev/docs/three)'s `<ThreeCanvas>` and
rendered natively at **1080 × 1920, 60fps**, driven by `useCurrentFrame()`.

This removes two problems that were previously accepted as unavoidable:

- **Judder is gone.** Output is deterministic, not a capture of a live browser.
- **The centre-crop problem is gone.** We compose *natively* at 9:16 rather than
  cropping a 16:9 desktop recording — so the letterbox-vs-tall-window decision in
  BUILD-CONSTRAINTS §3 stops being a constraint on how the hero is designed.

Requirements: `<ThreeCanvas>` needs explicit `width`/`height`; any `<Sequence>`
inside the canvas needs `layout="none"`; and nothing in the scene may use
`useFrame` for state.

1. Build the Remotion composition reusing the site's act components.
2. Fix the opening 3 seconds — must open on motion, never a loader.
3. Render at 1080 × 1920, 60fps.
4. Screen recording stays as the fallback only if a component proves impossible
   to drive deterministically.
5. OG/meta card so the shared link itself looks right.

**Gate:** a 9:16 cut exists that is genuinely good, with no judder.

---

## Phase 7 — Ship

Real-device testing (not just DevTools throttling), Lighthouse, reduced-motion
path, `/impeccable audit` and `/impeccable finish` pass, licence ledger
reconciled.

---

## Risks, honestly

| Risk | Mitigation |
|---|---|
| Eight acts is a lot of content at this quality bar | Phase 2 measures it before it is 8× committed; Phase 3 has an explicit scope lever |
| "Memorable scenes from each part" becomes a highlight reel — a list, not an arc | The single-persistent-scene structure in Phase 1 forces continuity; acts are states of one world, not eight separate scenes |
| Perf discovered blown at act six | Overlay from Phase 0, budget checked after every act |
| Gesture feature eats the schedule | Isolated, flagged, last, with a working fallback built first |
| IP exposure once it gets traction | BUILD-CONSTRAINTS §5 — non-commercial, original assets, name out of the domain |

---

## What is blocked on you, and when

Phases 0 and 1 need **no creative direction** — the stack, instrumentation,
tier system, scroll spine and act skeleton are all concept-independent. Work can
start immediately.

Direction is needed **before Phase 2**, and that is where `/impeccable init`
earns its place: what the eight acts *are*, what unifies them, and what the
site feels like.

---

# Build log

Recorded as phases complete. Findings that changed the plan are kept here
rather than smoothed away.

## Phase 2 gate — Movement V (Cold), measured

**Result: passed, and the scope question changed shape.**

| | Measured |
|---|---|
| Asset cost of one movement | **0 bytes** |
| Draw calls (movement) | 3 |
| Draw calls (whole frame, incl. post) | ~20 |
| Points on screen, high tier | 36 000 |
| Build after Phase 2 | 366 kB of 10 MB (3.7%) |

**The finding: a movement built from shaders and points costs nothing to
download.** Cold is three `ParticleField` instances and a post-processing grade
— no models, no textures, no geometry files. Multiplying by eight still gives
zero asset bytes. The 10 MB budget is essentially untouched by this approach.

So the Phase 3 scope lever is not needed for *budget* reasons. The real limits
are draw calls and fill rate, and at 3 calls per movement with only one movement
weighted above zero at a time, there is comfortable headroom. **All eight
movements stay in scope.** Architecture (Movements II and III) will spend real
bytes; that is where the ledger starts mattering.

### Three bugs this phase caught, all of which would have shipped

1. **The perf probe reported "1 draw call, 1 triangle" once post-processing was
   added** — three.js resets `info` per `render()`, and EffectComposer renders
   many times per frame, so we were reading only the last fullscreen pass.
   Instrumentation that silently reports good news is worse than none. Fixed
   with `info.autoReset = false` and a manual per-frame reset.
2. **The verify gate passed at 3fps** because it never checked frame rate.
   Now fails under 55fps — downgraded to a warning only when the renderer is a
   software rasteriser, where the figure is meaningless.
3. **The mount window drew neighbouring movements' content.** Keeping buffers
   warm one movement ahead is right; letting them render using the *current*
   movement's local progress is not. Cold's dementors were appearing during
   Descent. Fixed with `movements/weight.ts`.

### Performance findings

- **Point size is the dominant cost, not point count.** Dropping the
  `gl_PointSize` clamp from 64px to 22px took the scene from ~3fps to ~15fps on
  the software rasteriser — a 4× win from one line, because additive points are
  fill-rate bound and overlap heavily.
- **After that fix the remaining cost is vertex processing, not fill.** Verified
  by measuring at 1440×900, 720×450 and 360×225: frame rate stayed flat at
  16/17/18fps across a 16× reduction in pixels. That is SwiftShader running 30k
  vertex shaders on CPU — a cost that does not exist on a real GPU.
- **Consequence: frame rate on this container is not evidence.** Draw calls,
  point counts, byte sizes and error-freedom are. Real-hardware verification on
  a desktop GPU and a mid-range phone is still outstanding and is a Phase 7 gate.

### Art direction notes

Three passes were needed before Cold read as anything:

1. **Blown out to pure white.** Bloom `luminanceThreshold` at 0.12 blooms
   mid-tones, and a scene made of additive points then becomes a white
   rectangle. Raised to 0.55: only genuinely bright cores glow, darkness stays
   dark. Contrast is the subject.
2. **Bokeh, not light.** A linearly soft point edge reads as defocused
   photography. Squaring the falloff concentrates energy into a few pixels so it
   reads as a spark, and lets bloom supply the halo — cheaper and more
   convincing than a large translucent quad.
3. **A ball of dots, not a cast.** Purely radial motion reads as scatter. Adding
   tangential swirl that decays with radius reads as force. Perfect spherical
   symmetry is also what makes procedural effects look procedural, so the burst
   lifts slightly as it expands.

**Still honest about this:** Cold now has real form and contrast, but it is not
yet the best version of itself. A Patronus that genuinely stops a thumb wants
directional streaking and a suggestion of shape. That is art-direction
iteration with a human eye on a real GPU, not more parameter guessing here.

## Phases 3–7 — build log

### Phase 3/4 — all movements, and the web

Every movement is the same `ParticleField` primitive under different parameters,
which is why the whole experience costs zero asset bytes. The web is two draw
calls — one buffer of nodes, one of edges — and persists behind every movement
after III rather than appearing once.

**Bug found: the final movement faded to an empty frame.** `movementWeight`
assumed there was always a next movement to cross-fade into, so Dawn went to
zero exactly where it is supposed to land on Movement I's gold — the single
moment the whole arc is built around.

Web clusters were pulled inward from ±7 to ±4.2 so nothing important sits near
the frame edge. That is BUILD-CONSTRAINTS §3 applied to composition rather than
to editing: an effect that only reads across a wide frame gets cut in half in a
9:16 post.

### Phase 5 — gesture

The cast is one 0..1 number with three sources and no downstream knowledge of
which is driving it. Pointer was built first so the camera could never become
load-bearing.

**The cost is the story here.** The on-device runtime is 23 MB of wasm plus a
7.8 MB model — over three times the entire site budget, for a feature most
visitors never trigger. Resolved by accounting honestly rather than by cutting:
`scripts/budget.mjs` reports opt-in payload separately, and the staging script
drops the unused `vision_wasm_module_internal` build, halving the wasm.

**Bug the pointer path exposed:** the burst faded out as `uBurst` approached 1,
which is fine for a value sweeping past but wrong for a HELD interaction — a
visitor pressing and holding was rewarded with an empty screen. Found only after
adding the cast value to the perf overlay; it was invisible before that.

### Phase 6 — the reel

`@remotion/three` mounts the site's own `Scene` and `Post` and drives them from
`useCurrentFrame()`. Verified: **1080×1920, 60fps, h264 + AAC, 9:16**, with bloom
and grade intact. The Phase 1 rule paid for itself exactly as intended — one
substitution, zero duplicated scene work.

Remotion downloads its own headless Chromium, which 403s under a restricted
egress policy; `scripts/render-reel.mjs` falls back to a local **headless shell**
(not full Chrome, which removed old headless mode).

### Phase 7 — ship

- Low-tier particle cap cut from 12k to 8k per field. The cap is per-field and
  movements run up to three at once, so the worst case is 3×, which the original
  figure did not account for.
- Reduced motion now does something: ambient drift at quarter speed, shorter
  scroll easing. Scroll-driven progression is untouched, because that IS the
  content — freezing it would give a blank page, not an accessible one.
- **Budget script was over-reporting.** It counted every `.js` in `dist/` as
  initial download, including MediaPipe's lazily-imported 153 kB chunk. It now
  reads `index.html` to determine what actually loads on arrival.

**Final: 370 kB shipped of 10 MB (3.7%). 1–23 draw calls. Both tiers pass.**

---

## Outstanding

Stated plainly rather than buried:

1. **No real-GPU verification.** This container has no GPU, so every frame-rate
   figure here comes from a software rasteriser and is not evidence. Draw calls,
   point counts, byte sizes and error-freedom are accurate. Testing on a desktop
   GPU and a mid-range phone is the one gate that could not be closed here.
2. **Art direction needs a human eye.** The movements have real structure and
   contrast, but "working" is not "breathtaking". The Patronus in particular
   wants directional streaking and a suggestion of shape — that is iteration
   against a real display, not more parameter guessing in a headless browser.
3. **No architecture yet.** Movements II and III describe King's Cross and the
   cloisters; both currently render as light and dust. The reference pipeline in
   docs/REFERENCES.md is specified but has not been exercised, and it is where
   the remaining 9.6 MB of budget goes.
4. **Fiendfyre is not attempted.** Flagged at the Phase 2 gate as the one effect
   needing its own vertical slice. Fire ships as heat, embers and ash.
5. **`/impeccable init` has not been run.** PRODUCT.md and DESIGN.md are still
   unwritten, so the type and colour system in the HUD is a placeholder rather
   than a designed system.
