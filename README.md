# Eight Movements

A scroll-driven WebGL experience in eight movements — one light carried through
the dark and back.

Not a chronological retelling. Each movement braids three or four moments from
*different* films that rhyme visually, anchored by one famous image and filled
out with overlooked ones. Playing the parts in order lists them; putting the
floating candles next to the Deluminator next to wands raised at the tower
connects them.

## Run it

```bash
npm install
npm run dev            # http://localhost:5173
```

`?tier=high|mid|low` forces a quality profile. Backtick toggles the perf
overlay.

## Checks

```bash
npm run verify         # walks all eight movements in a browser, high tier
npm run verify -- low  # the same on the low profile
npm run build
npm run budget         # reconciles the build against the 10 MB ceiling
```

`verify` fails on console errors, unreachable movements, over 100 draw calls, or
under 55fps. The frame-rate check downgrades to a warning when the renderer is a
software rasteriser, where the number means nothing.

## The 9:16 cut

```bash
npm run reel:studio    # preview
npm run reel:render    # out/reel-9x16.mp4 — 1080x1920, 60fps, h264 + AAC
```

The video mounts the site's own scene components and drives them from a frame
counter instead of scroll. Nothing is duplicated and nothing is screen-recorded.

## Architecture

**Every visual is a pure function of `Progress`. Nothing reads the wall clock.**
That single rule (`src/core/progress.ts`) is what lets scroll drive the site and
Remotion drive the video from the same components — and it cannot be retrofitted,
which is why it was decided before anything was drawn.

**One persistent scene, eight parameter states.** There are not eight scenes.
Movements are colour, fog, camera and post-processing values that interpolate,
holding their own look for most of their length and cross-fading at the boundary.
That is simultaneously the performance strategy and the structural answer to
connecting the parts: the world never cuts.

**Two first-class tiers.** Desktop gets effects mobile does not run; mobile is
not a stripped desktop. The one figure that never flexes is 60fps.

```
src/core/         progress model, tier detection, perf instrumentation
src/scroll/       Lenis + GSAP, driven from one ticker
src/movements/    the eight movements as data and components
src/scene/        the persistent scene, particle field, post stack
src/cast/         the Patronus: scroll, pointer, or hand
remotion/         the 9:16 render
scripts/          verify, budget, gesture staging, reel render
```

## Documentation

| | |
|---|---|
| `docs/PLAN.md` | phases, gates, and the build log with what went wrong |
| `docs/CONTENT.md` | the eight movements and why each moment was chosen |
| `docs/BUILD-CONSTRAINTS.md` | performance budgets, the capture spec, IP position |
| `docs/REFERENCES.md` | modelling from the real buildings, not the film |
| `docs/ASSETS.md` | the licence and byte ledger |

## Licensing and IP

No film assets, stills, logos, house crests or official fonts. Hogwarts was shot
at Alnwick Castle, Durham and Gloucester Cathedrals and Lacock Abbey — public
heritage architecture, and the correct thing to model from. See
`docs/REFERENCES.md` and `docs/BUILD-CONSTRAINTS.md` §5.

Third-party skills vendored under `.claude/` are attributed in
`.claude/skills/ATTRIBUTION.md`.
