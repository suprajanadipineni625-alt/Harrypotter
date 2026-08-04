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
const assets = []

for (const f of files) {
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
