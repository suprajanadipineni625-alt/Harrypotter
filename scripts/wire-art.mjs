/**
 * Points scenes at any generated backdrops.
 *
 * Reads public/scenes/ and, for each id that has an image, sets that scene's
 * `image.back` in parts.ts. Scenes without one keep drawing procedurally, so a
 * partial generation run leaves a working site rather than holes.
 *
 * This is the swap the whole Layer architecture was built for: one field per
 * scene, no engine change.
 */
import { readdirSync, existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

const SRC = 'src/story/parts.ts'
const DIR = 'public/scenes'

if (!existsSync(DIR)) {
  console.log('No public/scenes/ — nothing to wire. Run `npm run art:generate` first.')
  process.exit(0)
}

/**
 * Map scene id -> filename.
 *
 * WebP is what actually ships (optimize-art.mjs converts uploads), but a raw
 * PNG that has not been converted yet is still accepted so a fresh upload is
 * never silently ignored.
 */
const IMAGES = new Map()
for (const f of readdirSync(DIR)) {
  const m = /^([a-z0-9]+)\.(webp|png|jpe?g)$/i.exec(f)
  if (!m) continue
  const [, id, ext] = m
  // Prefer webp when both exist.
  if (IMAGES.has(id) && ext.toLowerCase() !== 'webp') continue
  IMAGES.set(id, f)
}
const have = IMAGES

let src = await readFile(SRC, 'utf8')
let wired = 0
let cleared = 0

// Every scene object literal, matched on its id.
src = src.replace(
  /(\{\s*\n\s*id: '([a-z0-9]+)',[\s\S]*?)(\n(\s*)art: '[a-z]+',)(\n\s*image: \{[^}]*\},)?/g,
  (all, head, id, artLine, indent, existing) => {
    const file = have.get(id)
    if (file) {
      wired++
      // BASE_URL keeps the path correct under a Pages sub-path.
      return `${head}${artLine}\n${indent}image: { back: 'scenes/${file}', mid: '', fore: '' },`
    }
    if (existing) cleared++
    return `${head}${artLine}`
  },
)

await writeFile(SRC, src)
console.log(`wired ${wired} scene backdrop(s), cleared ${cleared} stale reference(s)`)
console.log(have.size ? `images present: ${[...have.values()].join(', ')}` : 'no images found')
