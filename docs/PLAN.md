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
