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

## Animation / scroll / design set (7 skills)

- Source: https://github.com/freshtechbro/claudedesignskills
- License: MIT
- Vendored subset: `gsap-scrolltrigger`, `locomotive-scroll`, `barba-js`,
  `blender-web-pipeline`, `motion-framer`, `modern-web-design`,
  `web3d-integration-patterns`.
- Their accompanying agents and slash commands are installed in `.claude/agents/`
  and `.claude/commands/`.
- The upstream `threejs-webgl` and `react-three-fiber` plugins were deliberately
  NOT vendored — they overlap the Three.js core set above and would give
  conflicting guidance on the same topics.

## Evaluated but not vendored

- https://github.com/EnzeD/r3f-skills — good, focused R3F set, but overlaps
  `threejs-impl-react-three-fiber` and ships no LICENSE file (README claims MIT).
- https://github.com/cloudai-x/threejs-skills — same overlap and same missing
  LICENSE file.
- https://github.com/gsimone/awesome-react-three-fiber — a link list, not skills.
