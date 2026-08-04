/**
 * Walks the whole scroll spine in a real browser and reports what the perf
 * overlay sees at each movement.
 *
 * This is the Phase 0/1 gate, automated: "holds 60fps across all eight
 * movements, on both tiers". Run it against a dev server:
 *
 *   npm run dev
 *   npm run verify           # high tier
 *   npm run verify -- low    # low tier
 *
 * Caveat when running headless in CI or a container: Chromium falls back to
 * SwiftShader (software rendering), so the FPS figure is a floor, not a
 * measurement of real hardware. Draw calls, triangles and error-freedom are
 * accurate regardless — those are the numbers to trust here.
 */
import { chromium } from 'playwright'
import { mkdirSync, existsSync } from 'node:fs'

const TIER = process.argv[2] ?? 'high'
const URL = process.env.VERIFY_URL ?? 'http://127.0.0.1:5173'
const OUT = process.env.VERIFY_OUT ?? '.verify-shots'
/** Sample points across the whole story. Not one per scene — enough to catch
 * a scene that fails to render, without a ten-minute run. */
const SAMPLES = 16
const PARTS = 8

mkdirSync(OUT, { recursive: true })

/**
 * Find a Chromium.
 *
 * This container ships one at a fixed path; CI installs its own via
 * `playwright install`. Passing a non-existent executablePath fails outright,
 * and an empty string is NOT caught by `??` — so the path is checked for
 * existence and otherwise omitted entirely, letting Playwright resolve its own.
 */
const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium']
const executablePath = candidates.find((p) => p && existsSync(p))

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(`${URL}/?tier=${TIER}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const height = await page.evaluate(() => document.body.scrollHeight)
const rows = []

for (let i = 0; i < SAMPLES; i++) {
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    Math.round((height - 900) * (i / (SAMPLES - 1))),
  )
  await page.waitForTimeout(1400)

  const row = await page.evaluate(() => {
    const num = (label) => {
      const el = [...document.querySelectorAll('div')].find(
        (d) => d.children.length === 2 && d.children[0].textContent === label,
      )
      return el ? Number(el.children[1].textContent.replace(/[^0-9.]/g, '')) : null
    }
    return {
      numeral: document.querySelector('.progress-note')?.textContent ?? '',
      title: document.querySelector('.prose__title')?.textContent ?? '',
      fps: num('fps'),
      calls: num('draw calls'),
      triangles: num('triangles'),
      lines: num('lines'),
      points: num('points'),
    }
  })

  rows.push(row)
  await page.screenshot({ path: `${OUT}/${TIER}-${String(i).padStart(2, '0')}.png` })
}

// Is this real hardware or a software rasteriser? On SwiftShader an FPS figure
// says nothing about how the site performs on a real GPU, so we report it but
// do not fail on it. Everything else is measured the same either way.
const renderer = await page
  .evaluate(() => {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    const ext = gl?.getExtension('WEBGL_debug_renderer_info')
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (gl?.getParameter(gl.RENDERER) ?? '')
  })
  .catch(() => '')

const software = /swiftshader|llvmpipe|software/i.test(String(renderer))

await browser.close()

console.log(`\ntier: ${TIER}   renderer: ${renderer || 'unknown'}`)
if (software) {
  console.log('NOTE  software rasteriser — fps is advisory only, not a hardware measurement\n')
} else {
  console.log('')
}

for (const r of rows) {
  console.log(
    `${r.numeral.padEnd(13)} ${r.title.padEnd(26)} ` +
      `fps ${String(r.fps).padStart(3)}  calls ${String(r.calls).padStart(4)}  ` +
      `tris ${String(r.triangles).padStart(6)}  points ${String(r.points).padStart(7)}`,
  )
}

const overCalls = rows.filter((r) => r.calls > 100)
const slow = rows.filter((r) => r.fps !== null && r.fps < 55)
// Every part should be seen, and scenes should actually change as we scroll.
const partsSeen = new Set(rows.map((r) => r.numeral.trim())).size
const scenesSeen = new Set(rows.map((r) => r.title.trim()).filter(Boolean)).size
const blank = rows.filter((r) => !r.title.trim()).length

console.log('')
if (errors.length) console.log(`FAIL  ${errors.length} console error(s):`, errors)
if (partsSeen < PARTS) console.log(`FAIL  saw only ${partsSeen} of ${PARTS} parts`)
if (blank) console.log(`FAIL  ${blank} sample(s) rendered no scene text`)
console.log(`      ${scenesSeen} distinct scenes across ${SAMPLES} samples`)
if (overCalls.length)
  console.log(`FAIL  draw calls over 100 in: ${overCalls.map((r) => r.numeral).join(', ')}`)
if (slow.length) {
  const label = software ? 'WARN ' : 'FAIL '
  console.log(`${label} under 55fps in: ${slow.map((r) => `${r.numeral}(${r.fps})`).join(', ')}`)
}

const failed =
  errors.length > 0 ||
  partsSeen < PARTS ||
  blank > 0 ||
  overCalls.length > 0 ||
  (slow.length > 0 && !software)

console.log(failed ? 'gate: FAILED' : software ? 'gate: passed (fps unverified)' : 'gate: passed')
process.exit(failed ? 1 : 0)
