# Asset ledger

Every asset that ships, with its source, licence and cost. Budget is **10 MB
total** (docs/BUILD-CONSTRAINTS.md §1).

The ledger exists because a blown budget discovered at the end is unfixable
without cutting content, while a budget checked per-asset is just a series of
small decisions. Run `npm run budget` after any build to reconcile it.

## Rules

1. **Nothing lands without a row here.** Adding an asset and not recording it is
   the failure this file prevents.
2. **CC0 by default.** Poly Haven first. Anything not CC0 needs its attribution
   requirements written into the Notes column, and honoured in the site.
   CC-BY means the credit appears *in the site*, not just in this file.
3. **Model from the real buildings, never the film.** Hogwarts was shot at
   Alnwick Castle, Durham and Gloucester Cathedrals and Lacock Abbey — public
   heritage architecture, not Warner Bros. property. See docs/REFERENCES.md for
   the full mapping and the decimation workflow. No film stills, no logos, no
   house crests, no official fonts, no ripped models.
   **Raw photogrammetry never ships** — it is source material for proportions,
   then decimated hard and instanced.
4. **Geometry is Draco'd, textures are KTX2.** A PNG that looks small on disk
   still costs ~16 MB of VRAM at 2048². Decoders are self-hosted in
   `public/vendor/`, never a CDN.
5. **Prefer maths over files.** A gradient should almost never be an image. The
   cheapest asset is the one replaced by a few lines of GLSL.

## Budget — measured after Phase 7

| | Bytes | Notes |
|---|---|---|
| Budget | 10 000 000 | hard ceiling |
| JS + CSS (gzip) | ~368 000 | three.js, R3F, GSAP, Lenis, postprocessing |
| Assets | 233 | the favicon |
| **Shipped** | **~368 000** | **3.7% of budget** |
| **Remaining** | **~9 630 000** | |

**All eight movements are made of shaders and points, so they cost zero asset
bytes.** That was the Phase 2 finding and it is why the whole experience fits in
under 4% of its own budget. Architecture — the cloisters and King's Cross in
Movements II and III — is where bytes will finally be spent.

## Opt-in payload — NOT counted above

| Asset | Bytes | Notes |
|---|---|---|
| MediaPipe vision wasm | ~23 400 000 | SIMD + nosimd fallback |
| `hand_landmarker.task` | ~7 800 000 | float16 model |
| **Total** | **~31 200 000** | fetched ONLY on camera consent |

Deliberately excluded from the 10 MB budget. Nothing here is downloaded unless a
visitor explicitly enables the camera in Movement V; counting it against the
initial budget would force real cuts to the experience everyone sees in order to
pay for a feature most never trigger. It is over three times the entire site
budget, which is worth knowing.

Staged at build time by `scripts/setup-gesture.mjs` and gitignored — a 31 MB
binary blob in git history is permanent, and neither file is ours. Self-hosted
rather than CDN-loaded: a third-party script host on a page requesting camera
permission is both a privacy leak and a single point of failure.

## Ledger

| Asset | Scene | Source | Licence | Bytes | Notes |
|---|---|---|---|---|---|
| `public/favicon.svg` | — | original | — | 233 | hand-written |
| `public/scenes/castle.webp` | 1 · The castle | generated, descriptive prompt | original work | 64 000 | 2.72 MB PNG → WebP, −98% |
| `public/scenes/dawn.webp` | 8 · Dawn | generated, descriptive prompt | original work | 30 000 | 1.75 MB PNG → WebP, −98% |

Generated from prompts describing real architecture — Gothic revival, crag,
viaduct, loch — never naming the franchise. Naming it was refused by the
generator anyway; see docs/ART-BRIEF.md. Every remaining scene is procedural.

**Uploads are converted before they ship.** `scripts/optimize-art.mjs` takes a
2–3 MB PNG to roughly 30–70 kB of WebP, and deletes the original so the heavy
version never enters git history. At 47 scenes the raw route would be over
100 MB against a 10 MB budget; converted, the whole set fits comfortably.
