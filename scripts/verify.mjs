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
import { mkdirSync } from 'node:fs'

const TIER = process.argv[2] ?? 'high'
const URL = process.env.VERIFY_URL ?? 'http://127.0.0.1:5173'
const OUT = process.env.VERIFY_OUT ?? '.verify-shots'
const MOVEMENTS = 8

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
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

for (let i = 0; i < MOVEMENTS; i++) {
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    Math.round((height - 900) * (i / (MOVEMENTS - 1))),
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
      numeral: document.querySelector('.hud__numeral')?.textContent ?? '',
      title: document.querySelector('.hud__title')?.textContent ?? '',
      fps: num('fps'),
      calls: num('draw calls'),
      triangles: num('triangles'),
      lines: num('lines'),
    }
  })

  rows.push(row)
  await page.screenshot({ path: `${OUT}/${TIER}-${i}-${row.numeral}.png` })
}

await browser.close()

console.log(`\ntier: ${TIER}\n`)
for (const r of rows) {
  console.log(
    `${r.numeral.padStart(4)}  ${r.title.padEnd(20)} ` +
      `fps ${String(r.fps).padStart(3)}  calls ${String(r.calls).padStart(4)}  ` +
      `tris ${String(r.triangles).padStart(6)}  lines ${String(r.lines).padStart(6)}`,
  )
}

const overBudget = rows.filter((r) => r.calls > 100)
const reachedAll = new Set(rows.map((r) => r.numeral)).size === MOVEMENTS

console.log('')
if (errors.length) console.log(`FAIL  ${errors.length} console error(s):`, errors)
if (!reachedAll) console.log('FAIL  did not reach all eight movements')
if (overBudget.length)
  console.log(`FAIL  draw calls over 100 in: ${overBudget.map((r) => r.numeral).join(', ')}`)

const failed = errors.length > 0 || !reachedAll || overBudget.length > 0
console.log(failed ? 'gate: FAILED' : 'gate: passed')
process.exit(failed ? 1 : 0)
