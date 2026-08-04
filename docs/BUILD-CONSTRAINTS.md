# Build constraints

Research findings that the installed skills do *not* cover. These are the
numbers this project gets judged against. Sources are linked inline.

## 1. Two first-class targets: desktop and mobile

Desktop is where the experience is richest and where it gets **shown and
recorded**. Mobile is where most people will actually open the link. Neither is
a downgrade path for the other — we build two tiers on purpose, and the cheap
tier still has to look deliberate rather than stripped.

The mistake to avoid is letting the weakest phone set the ceiling for everyone.
Desktop should get effects mobile simply does not run.

| | Desktop (hero tier) | Mobile (must-not-break tier) |
|---|---|---|
| Role | showcase, capture, the "wow" | reach — most link opens |
| Post-processing | full stack (bloom, DOF, grain) | one cheap effect, or none |
| Particles / instances | generous | capped hard |
| Texture resolution | 100% | 50%, 25% on low tier |
| Shadows | real-time | baked or faked |
| Frame budget | **16.6 ms** (60fps) | **16.6 ms** (60fps) |

Frame budget is the one number that does **not** flex. A rich scene at 30fps
looks worse than a simpler scene at 60 — and on a screen recording, judder is
the single most obvious tell that something is amateur.

Shared budgets, from the [ZERO case study](https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/)
and [Three.js perf guidance](https://www.utsubo.com/blog/threejs-best-practices-100-tips):

| Metric | Target | Notes |
|---|---|---|
| Total build size | **< 10 MB** | ZERO went 1 GB of source → under 10 MB shipped. Helps desktop too: nobody waits through a loader |
| Draw calls | **< 100** | most devices hold 60fps below this; above ~500 even good GPUs struggle |
| Mobile floor | **budget Android at 60fps** | ZERO holds this; it is the floor, not the ceiling |

Techniques that get us there — all of these help both tiers:

- **Texture atlases.** ZERO packed 50+ individual images into ~a dozen atlases
  (e.g. all hand textures into one 4×4 atlas, meshes referencing it by UV offset
  and scale). Fewer textures, fewer draw calls.
- **Replace images with maths.** ZERO swapped most gradient backgrounds for a
  few lines of GLSL. A gradient should almost never be a PNG.
- **KTX2 over PNG/JPG.** A 2048² texture occupies ~16 MB of VRAM regardless of
  its file size on disk, because PNG fully decompresses on the GPU. KTX2/ETC1S
  stays compressed in VRAM and uploads far faster.
- **Draco for geometry**, and **self-host both decoders** (`public/vendor/`)
  rather than pulling them from a CDN.
- **GPU tier detection at init** — classify high/medium/low and ship texture
  variants at 100% / 50% / 25% resolution. This is the mechanism that lets
  desktop stay rich without breaking phones; build it in early, because
  retrofitting tiers into a finished scene is painful.
- **Split loading groups** so a heavy later scene never blocks the opening.

## 2. Lenis + GSAP must share one ticker

The single most common cause of "almost smooth" scroll jitter. Do not let Lenis
run its own RAF loop alongside GSAP's — drive Lenis *from* `gsap.ticker` so
scroll updates and animation land in the same execution block:

```js
const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

Package note: `@studio-freight/react-lenis` is **retired**. Studio Freight became
Darkroom Engineering; use the `lenis` package and `lenis/react`.

## 3. The site has to film well

Likes come from a *video of* the site, not the site. Design for the capture as a
deliverable, not an afterthought.

Expect the capture to come from the **desktop build** — that is the richer tier
and the one worth showing. That does not remove the vertical problem, it just
moves it to the edit: a 16:9 desktop recording has to survive being placed in a
9:16 frame.

Two workable routes, decide before building the hero:

1. **Letterbox** — 16:9 clip centred in a 9:16 canvas, blurred or solid fill
   above and below. Keeps the desktop composition intact; the subject ends up
   smaller, so anything that must read has to be *large* on desktop.
2. **Tall browser window** — record the desktop build in a narrow, tall viewport
   so the capture is natively closer to vertical. Only works if the layout is
   genuinely responsive at that shape rather than collapsing to the mobile view.

Either way the practical rule holds: **key moments must survive a centre crop.**
An effect that only reads across the full width of a 16:9 hero will be cut in
half in the post. Compose the hero beats near the centre.

- **9:16, 1080 × 1920**, MP4/MOV, H.264 + AAC, 3–90 s, ≥ 3500 kbps.
- **Capture at 60fps** even though Instagram delivers 30 — recording at the
  frame rate the site actually runs avoids judder being baked in.
- **The first 3 seconds are the whole thing.** Instagram's algorithm watches for
  thumb-stop. Open on movement or a bold visual — never on a loading state.
- Keep anything that must be read out of the **bottom ~350 px** (UI chrome
  overlaps it).
- A hero that only works at 21:9 is unfilmable. Ultra-wide compositions are the
  one desktop indulgence that actively costs us here.

## 4. Assets

- [Poly Haven](https://polyhaven.com/) — CC0, no login, HDRIs / textures /
  models, direct glTF download at every resolution 1k–24k. Default source.
- [Sketchfab CC0 tag](https://sketchfab.com/tags/cc0) — CC0 models.
- [awesome-cc0](https://github.com/madjin/awesome-cc0) — wider CC0 index.

Check the licence on every single asset before it lands in the repo. CC0 is the
only category that needs no attribution; everything else has terms.

## 5. Intellectual property — read before publishing

Worth knowing up front rather than after the site gets traction, because the
risk here scales with exactly the success we are aiming for.

The Wizarding World is actively enforced IP. On the record:

- Warner Bros. has historically pursued fan sites with **"Harry Potter" in the
  domain name**, and pressured unauthorised fan festivals over use of names,
  places and objects from the series.
- Non-commercial fan work has fared substantially better than anything with a
  commercial dimension — WB let many fan sites keep their domains on the
  condition they stayed non-commercial.
- The [Wizarding World guidelines](https://www.warnerbros.com/wizardingworldsubmissionguidelines)
  do not authorise reproducing text from the books or creating new
  characters/dialogue/storylines from them without permission.

Practical implications for this build, none of which cost us anything creatively:

1. Keep it **non-commercial** — no ads, no merch, no paywall.
2. Keep **"Harry Potter" out of the domain name**.
3. Build the atmosphere from **public-domain and original material** — our own
   models, CC0 assets, original prose. Evoke; don't reproduce book text
   verbatim or use official film assets, logos, or marks.
4. Do not use the official film **fonts, logos, or house crests** as artwork.

This is a decision for the repo owner, not a blocker on the work. Flagging it
because a viral site is exactly the kind that gets noticed.
