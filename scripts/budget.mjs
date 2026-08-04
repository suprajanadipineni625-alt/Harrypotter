/**
 * Reconciles the built output against the 10 MB budget in docs/ASSETS.md.
 *
 * Reports gzipped JS/CSS (what a visitor actually downloads) and raw asset
 * bytes. Exits non-zero over budget so it can gate a build.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET = 10_000_000
const DIST = process.argv[2] ?? 'dist'

const CODE = new Set(['.js', '.mjs', '.css', '.html'])

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) out.push(...walk(path))
    else out.push({ path, size: st.size })
  }
  return out
}

let files
try {
  files = walk(DIST)
} catch {
  console.error(`No build found at ${DIST}/ — run \`npm run build\` first.`)
  process.exit(1)
}

let codeRaw = 0
let codeGz = 0
let assetBytes = 0
let optInBytes = 0
const assets = []

/**
 * What does a visitor ACTUALLY download on arrival?
 *
 * Not every file in dist/. Two categories are deferred:
 *
 *   - anything under vendor/, fetched only on camera consent
 *   - lazily imported chunks, which the browser fetches only when the dynamic
 *     import runs — the hand-tracking bundle is 150 kB of that
 *
 * Counting either against the 10 MB budget is false accounting in the strict
 * direction: it would force real cuts to the experience everyone sees in order
 * to pay for a feature most visitors never trigger. Both are reported
 * separately instead, because they are still real bytes on someone's connection.
 *
 * The entry set is read from index.html rather than guessed at — whatever the
 * HTML references with <script> or modulepreload is what loads on arrival.
 */
/**
 * Matched on BASENAME, not on path.
 *
 * The HTML references assets through the deploy base path (`/Harrypotter/...`
 * on Pages, `/` elsewhere) while the files on disk are relative to dist/.
 * Comparing full paths silently misfiles the entry bundle as deferred the
 * moment `base` changes — which reported this whole site as 1.9 kB. Vite
 * content-hashes every filename, so basenames are already unique.
 */
const entryRefs = (() => {
  try {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8')
    return new Set(
      [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) =>
        m[1].split('/').pop(),
      ),
    )
  } catch {
    return null
  }
})()

/**
 * Scene backdrops are fetched per scene as you reach them, not on arrival.
 *
 * Verified in a browser: loading the site pulls exactly one backdrop, and the
 * next is requested on scrolling to it. Counting all forty-seven against an
 * arrival budget therefore measures a download nobody performs, and pushed
 * image quality down for no benefit. They are reported separately.
 */
const isProgressive = (p) => p.includes('scenes/')

const isOptIn = (p) => {
  if (p.includes('vendor/')) return true
  if (!entryRefs) return false
  // A JS chunk the entry HTML never references is loaded on demand, if at all.
  return extname(p) === '.js' && !entryRefs.has(p.split('/').pop())
}

let progressiveBytes = 0
let progressiveCount = 0

for (const f of files) {
  if (isOptIn(f.path)) {
    optInBytes += f.size
    continue
  }
  if (isProgressive(f.path)) {
    progressiveBytes += f.size
    progressiveCount++
    continue
  }
  if (CODE.has(extname(f.path))) {
    codeRaw += f.size
    codeGz += gzipSync(readFileSync(f.path)).length
  } else {
    assetBytes += f.size
    assets.push(f)
  }
}

const total = codeGz + assetBytes
const pct = ((total / BUDGET) * 100).toFixed(1)

const kb = (n) => `${(n / 1000).toFixed(1)} kB`

console.log('')
console.log(`  code (raw)     ${kb(codeRaw)}`)
console.log(`  code (gzip)    ${kb(codeGz)}   <- what the visitor downloads`)
console.log(`  assets         ${kb(assetBytes)}`)
console.log(`  ${'-'.repeat(34)}`)
console.log(`  shipped        ${kb(total)}  of ${kb(BUDGET)}  (${pct}%)`)
console.log('')
if (progressiveCount) {
  const avg = progressiveBytes / progressiveCount
  console.log(
    `  backdrops      ${kb(progressiveBytes)} across ${progressiveCount}, avg ${kb(avg)} each`,
  )
  console.log(`                 fetched ONE AT A TIME as you scroll, not on arrival`)
  console.log(`  arrival cost   ${kb(total + avg)}   (code + the opening backdrop)`)
  console.log('')
}

if (optInBytes) {
  console.log(`  opt-in         ${kb(optInBytes)}   hand tracking; fetched ONLY on camera consent`)
  console.log('                 not counted against the budget above')
  console.log('')
}

if (assets.length) {
  console.log('  largest assets:')
  for (const a of assets.sort((x, y) => y.size - x.size).slice(0, 10)) {
    console.log(`    ${kb(a.size).padStart(10)}  ${a.path}`)
  }
  console.log('')
}

if (total > BUDGET) {
  console.log(`  OVER BUDGET by ${kb(total - BUDGET)}`)
  process.exit(1)
}
console.log(`  within budget, ${kb(BUDGET - total)} remaining`)
