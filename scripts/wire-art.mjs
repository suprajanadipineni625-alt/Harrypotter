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

const have = new Set(
  readdirSync(DIR).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')),
)

let src = await readFile(SRC, 'utf8')
let wired = 0
let cleared = 0

// Every scene object literal, matched on its id.
src = src.replace(
  /(\{\s*\n\s*id: '([a-z0-9]+)',[\s\S]*?)(\n(\s*)art: '[a-z]+',)(\n\s*image: \{[^}]*\},)?/g,
  (all, head, id, artLine, indent, existing) => {
    const wants = have.has(id)
    if (wants) {
      wired++
      // BASE_URL keeps the path correct under a Pages sub-path.
      return `${head}${artLine}\n${indent}image: { back: 'scenes/${id}.png', mid: '', fore: '' },`
    }
    if (existing) cleared++
    return `${head}${artLine}`
  },
)

await writeFile(SRC, src)
console.log(`wired ${wired} scene backdrop(s), cleared ${cleared} stale reference(s)`)
console.log(have.size ? `images present: ${[...have].join(', ')}` : 'no images found')
