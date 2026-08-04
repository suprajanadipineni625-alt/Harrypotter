/**
 * Uploads the built site to a Supabase Storage bucket.
 *
 * Supabase is a backend platform rather than a static host, but Storage serves
 * public objects over HTTP and this site is a single page with NO client-side
 * routing — which removes the usual objection, since there are no deep URLs
 * that need rewriting to index.html.
 *
 * What it cannot give you is a clean URL. Objects are served from
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 * so the shareable link is long. That matters for a link posted to Instagram,
 * and it is the one real cost of this route. GitHub Pages gives
 * <user>.github.io/Harrypotter/ for the same site, and both can run at once —
 * they are just two copies of the same dist/.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY. The service key bypasses row
 * level security, so it belongs in a GitHub secret and nowhere else — never in
 * a commit, never in a chat, never in client code.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const URL_BASE = process.env.SUPABASE_URL?.replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_KEY
const BUCKET = process.env.SUPABASE_BUCKET ?? 'site'
const DIST = process.argv[2] ?? 'dist'

if (!URL_BASE || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.')
  console.error('Add both as GitHub repository secrets.')
  process.exit(1)
}

/**
 * Content types matter more here than on a normal host.
 *
 * Storage serves whatever type you upload with. Get it wrong and the browser
 * refuses to execute the JS — the page loads and renders nothing, with no
 * obvious error. This is the single most likely way a Supabase static deploy
 * fails.
 */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.task': 'application/octet-stream',
  '.map': 'application/json',
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else out.push(path)
  }
  return out
}

async function ensureBucket() {
  const res = await fetch(`${URL_BASE}/storage/v1/bucket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 52_428_800,
    }),
  })
  if (res.ok) {
    console.log(`created public bucket "${BUCKET}"`)
    return
  }
  const body = await res.text()
  // Already existing is the normal case on every run after the first.
  if (res.status === 409 || /already exists/i.test(body)) {
    console.log(`bucket "${BUCKET}" already exists`)
    return
  }
  throw new Error(`could not create bucket: ${res.status} ${body}`)
}

async function upload(path) {
  const key = relative(DIST, path).split('\\').join('/')
  const type = TYPES[extname(path)] ?? 'application/octet-stream'
  const body = readFileSync(path)

  const res = await fetch(
    `${URL_BASE}/storage/v1/object/${BUCKET}/${key}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': type,
        // Overwrite on every deploy rather than erroring on the second run.
        'x-upsert': 'true',
        // Hashed filenames can be cached hard; index.html must not be, or
        // visitors keep getting the previous build forever.
        'Cache-Control': key === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      },
      body,
    },
  )

  if (!res.ok) throw new Error(`${key}: ${res.status} ${await res.text()}`)
  return { key, size: body.length, type }
}

await ensureBucket()

const files = walk(DIST)
console.log(`uploading ${files.length} files to ${BUCKET}/\n`)

let bytes = 0
let failed = 0

for (const file of files) {
  try {
    const r = await upload(file)
    bytes += r.size
    console.log(`  ${(r.size / 1000).toFixed(1).padStart(8)} kB  ${r.key}`)
  } catch (err) {
    failed++
    console.log(`  FAILED  ${String(err).slice(0, 160)}`)
  }
}

const publicBase = `${URL_BASE}/storage/v1/object/public/${BUCKET}`

console.log('')
console.log(`uploaded ${files.length - failed}/${files.length} files, ${(bytes / 1e6).toFixed(2)} MB`)
console.log('')
console.log(`  live at  ${publicBase}/index.html`)
console.log('')
if (failed) process.exit(1)
