# Vendored skill attribution

The skills in this directory are third-party, vendored under their original MIT licenses.

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
