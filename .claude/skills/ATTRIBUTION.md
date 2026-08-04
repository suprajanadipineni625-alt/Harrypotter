# Vendored skill attribution

The skills in this directory are third-party, vendored under their original licenses.

## Design language: `impeccable`

- Source: https://github.com/pbakaus/impeccable (v4.0.4, by Paul Bakaus)
- License: Apache 2.0 — full text at `impeccable/LICENSE`, third-party notices
  at `impeccable/NOTICE.md`.
- One skill with 23 sub-commands (`init`, `craft`, `shape`, `audit`, `critique`,
  `polish`, `animate`, `bolder`, `quieter`, `overdrive`, `typeset`, `colorize`,
  `layout`, `distill`, `harden`, `optimize`, `live`, …), 4 agents installed in
  `.claude/agents/`, and a deterministic anti-pattern detector.
- Started from Anthropic's `frontend-design` skill and expands on it.
- `.claude/settings.json` carries its two hooks: an immediate-tier design check
  after Edit/Write/MultiEdit on UI files, and a full-rule deep pass on Stop.
  Both require Node 22+ (verified working here on v22.22.2) and no-op quietly
  otherwise.
- Not yet run: `/impeccable init`, which writes PRODUCT.md and DESIGN.md.

## Three.js core set (23 skills, `threejs-*`)

- Source: https://github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package
- License: MIT
- Covers: scene graph, renderer, math, raycaster, geometries, materials, shaders,
  loaders, controls, lighting, shadows, animation, post-processing, physics,
  React Three Fiber, drei, WebGPU, audio, XR, plus performance/rendering error
  debugging and two agent skills (scene builder, model optimizer).
- Deviation from upstream: `threejs-impl-ifc-viewer` (BIM/IFC) was dropped as
  irrelevant to this project.

## Animation: GSAP (8 skills, `gsap-*`)

- Source: https://github.com/greensock/gsap-skills — GreenSock's OFFICIAL skills
- License: MIT
- Covers core, timeline, ScrollTrigger, plugins (Flip/Draggable/SplitText),
  utils, React (`useGSAP`), performance (60fps), and other frameworks.
- Supersedes the third-party `gsap-scrolltrigger` skill from claudedesignskills,
  which was removed along with its agent and its `timeline_builder` /
  `generate_animation` commands. Official wins on API accuracy.

## Animation: Motion.dev (`motion-dev-animations`)

- Source: https://github.com/199-biotechnologies/motion-dev-animations-skill
- License: MIT
- 120fps GPU-accelerated animation for the React UI layer (Motion.dev, the
  Framer Motion successor), with `prefers-reduced-motion` and perf validation.
- Supersedes `motion-framer` from claudedesignskills, removed along with its
  agent and its `animation_generator` / `variant_builder` commands.

## Browser verification (`webapp-testing`)

- Source: https://github.com/anthropics/skills (per-skill `LICENSE.txt`)
- Drives the real site in a browser so animation smoothness and interaction can
  be checked against the running page, not just the source.

## Scroll / transitions / pipeline / design (5 skills)

- Source: https://github.com/freshtechbro/claudedesignskills
- License: MIT
- Vendored subset: `locomotive-scroll`, `barba-js`, `blender-web-pipeline`,
  `modern-web-design`, `web3d-integration-patterns`.
- Their accompanying agents and slash commands are installed in `.claude/agents/`
  and `.claude/commands/`.
- The upstream `threejs-webgl` and `react-three-fiber` plugins were deliberately
  NOT vendored — they overlap the Three.js core set above and would give
  conflicting guidance on the same topics.

## Design references (`docs/design-references/`)

- Source: https://github.com/rohitg00/awesome-claude-design
- License: MIT
- The `cinematic` family of DESIGN.md exemplars (BMW, Ferrari, Lamborghini,
  Runway, NVIDIA, Cohere, …) — complete art-direction specs with real tokens.
  Raw material for writing this project's DESIGN.md, not skills.

## Evaluated but not vendored

- https://github.com/EnzeD/r3f-skills — good, focused R3F set, but overlaps
  `threejs-impl-react-three-fiber` and ships no LICENSE file (README claims MIT).
- https://github.com/cloudai-x/threejs-skills — same overlap and same missing
  LICENSE file.
- https://github.com/gsimone/awesome-react-three-fiber — a link list, not skills.
- https://github.com/tponscr-debug/claude-skill-awwwards — strong Awwwards
  creative-direction skill (judges work against the real 8.0+ criteria), but
  ships NO LICENSE file, so it is not vendored here. Same rule applied above.
- https://github.com/Leonxlnx/taste-skill — MIT, 12 art-directed skills
  (brutalist, soft, brandkit, redesign, …). Held back deliberately: it is a
  competing "design director" philosophy to impeccable, and stacking two of
  those makes UI guidance muddier, not better. Adopt it *instead of* impeccable
  if the art-directed angle is preferred — not alongside.
- https://github.com/anthropics/skills `frontend-design` — impeccable started
  from this skill and expands it, so vendoring both is redundant.
