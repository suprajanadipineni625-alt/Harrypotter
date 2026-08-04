/**
 * Stages the on-device hand-tracking runtime into `public/vendor/mediapipe/`.
 *
 * Run automatically before a build. These files are NOT committed — the wasm
 * comes from node_modules and the model is downloaded — because a 20 MB binary
 * blob in git history is permanent, and neither file is ours.
 *
 * Self-hosting rather than pulling from Google's CDN at runtime is deliberate:
 * a third-party script host on a page that is asking for camera permission is
 * both a privacy leak and a single point of failure.
 *
 * These assets are opt-in: nothing here is fetched unless a visitor explicitly
 * turns the camera on. They are therefore accounted separately from the 10 MB
 * initial budget — see scripts/budget.mjs and docs/ASSETS.md.
 */
import { mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = 'public/vendor/mediapipe'
const WASM_OUT = join(OUT, 'wasm')
const WASM_SRC = 'node_modules/@mediapipe/tasks-vision/wasm'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const MODEL_OUT = join(OUT, 'hand_landmarker.task')

/**
 * Only the files the vision runtime actually loads.
 *
 * `vision_wasm_module_internal.*` is an alternate ES-module build we do not use;
 * shipping it doubles the payload for nothing. The nosimd build stays as a
 * fallback for browsers without WebAssembly SIMD.
 */
const KEEP = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
]

mkdirSync(WASM_OUT, { recursive: true })

if (!existsSync(WASM_SRC)) {
  console.error(`Missing ${WASM_SRC} — run \`npm install\` first.`)
  process.exit(1)
}

let staged = 0
for (const name of KEEP) {
  const from = join(WASM_SRC, name)
  if (!existsSync(from)) {
    console.error(`Expected ${from} but it is not there.`)
    process.exit(1)
  }
  copyFileSync(from, join(WASM_OUT, name))
  staged += statSync(from).size
}

const skipped = readdirSync(WASM_SRC).filter((f) => !KEEP.includes(f))
console.log(`  wasm     ${(staged / 1e6).toFixed(1)} MB  (${KEEP.length} files)`)
if (skipped.length) console.log(`  skipped  ${skipped.join(', ')}`)

if (existsSync(MODEL_OUT)) {
  console.log(`  model    already present, ${(statSync(MODEL_OUT).size / 1e6).toFixed(1)} MB`)
} else {
  console.log('  model    downloading…')
  const res = await fetch(MODEL_URL)
  if (!res.ok) {
    console.error(`  model    FAILED ${res.status} — gesture input will be unavailable`)
    process.exit(1)
  }
  await writeFile(MODEL_OUT, Buffer.from(await res.arrayBuffer()))
  console.log(`  model    ${(statSync(MODEL_OUT).size / 1e6).toFixed(1)} MB`)
}
