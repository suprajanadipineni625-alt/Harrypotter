# Build constraints

Research findings that the installed skills do *not* cover. These are the
numbers this project gets judged against. Sources are linked inline.

## 1. Instagram is the target, so mobile is the platform

This is the constraint everything else bends to. A WebGL site that only sings on
a desktop GPU is a failed brief here — the audience arrives from a phone, on a
link, over cellular, and leaves in under five seconds if the first frame stalls.

Budgets, from the [ZERO case study](https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/)
and [Three.js perf guidance](https://www.utsubo.com/blog/threejs-best-practices-100-tips):

| Metric | Target | Notes |
|---|---|---|
| Total build size | **< 10 MB** | ZERO went 1 GB of source → under 10 MB shipped |
| Draw calls | **< 100** | most devices hold 60fps below this; above ~500 even good GPUs struggle |
| Frame budget | **16.6 ms** | profile in Chrome DevTools, 3–5 s recording while scrolling |
| Target device | **budget Android** | ZERO holds 60fps there; that is the bar |

Techniques that get us there:

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
  variants at 100% / 50% / 25% resolution.
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

- **9:16, 1080 × 1920**, MP4/MOV, H.264 + AAC, 3–90 s, ≥ 3500 kbps.
- **The first 3 seconds are the whole thing.** Instagram's algorithm watches for
  thumb-stop. Open on movement or a bold visual — never on a loading state.
- Keep anything that must be read out of the **bottom ~350 px** (UI chrome
  overlaps it).
- Practical consequence: at least one sequence must be **composed vertically**
  and readable at phone size. A hero that only works at 21:9 is unfilmable.

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
