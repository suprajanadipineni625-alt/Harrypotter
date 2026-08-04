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
3. **No film assets.** No stills, no logos, no house crests, no official fonts,
   no ripped models. See BUILD-CONSTRAINTS §5.
4. **Geometry is Draco'd, textures are KTX2.** A PNG that looks small on disk
   still costs ~16 MB of VRAM at 2048². Decoders are self-hosted in
   `public/vendor/`, never a CDN.
5. **Prefer maths over files.** A gradient should almost never be an image. The
   cheapest asset is the one replaced by a few lines of GLSL.

## Budget

| | Bytes | Notes |
|---|---|---|
| Budget | 10 000 000 | hard ceiling |
| JS (gzip) | ~347 000 | three.js + R3F + GSAP + Lenis, measured at Phase 0 |
| Assets | 0 | nothing yet |
| **Remaining** | **~9 650 000** | |

## Ledger

| Asset | Movement | Source | Licence | Bytes | Notes |
|---|---|---|---|---|---|
| `public/favicon.svg` | — | original | — | 233 | hand-written |

*(No third-party assets yet. Phase 1 is deliberately geometry-free.)*
