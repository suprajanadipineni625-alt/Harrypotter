/**
 * Converts uploaded scene art to WebP at a sane size.
 *
 * Generated PNGs arrive around 2–3 MB each. At 47 scenes that is well over
 * 100 MB against a 10 MB budget, so raw uploads can never ship. WebP at a
 * sensible quality takes the same image to roughly 150–350 kB — an order of
 * magnitude, with no visible difference on a backdrop that sits behind fog,
 * particles and text.
 *
 * The original PNG is deleted after conversion. Keeping both would put the
 * heavy version in git history permanently, where it cannot be removed.
 *
 * Runs automatically in CI when anything lands in public/scenes/, so uploading
 * a 3 MB PNG from a phone is fine — it is converted before it ever ships.
 */
import { readdirSync, statSync, unlinkSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const DIR = process.argv[2] ?? 'public/scenes'

/**
 * 1600px wide is plenty.
 *
 * The backdrop sits at the furthest parallax depth, behind fog and a particle
 * layer, and is never the sharp thing on screen. Beyond this the extra pixels
 * cost bytes and buy nothing.
 */
const MAX_WIDTH = 1600
const QUALITY = 80

const sources = readdirSync(DIR).filter((f) =>
  ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase()),
)

if (!sources.length) {
  console.log('No PNG or JPEG to convert.')
  process.exit(0)
}

let before = 0
let after = 0

for (const file of sources) {
  const src = join(DIR, file)
  const id = basename(file, extname(file))
  const out = join(DIR, `${id}.webp`)

  const inBytes = statSync(src).size
  before += inBytes

  const meta = await sharp(src).metadata()
  await sharp(src)
    .resize({ width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out)

  const outBytes = statSync(out).size
  after += outBytes

  // Deleted rather than kept: a 3 MB PNG committed once lives in history for
  // good, and nothing reads it after conversion.
  unlinkSync(src)

  const saved = (100 * (1 - outBytes / inBytes)).toFixed(0)
  console.log(
    `  ${id.padEnd(14)} ${(inBytes / 1e6).toFixed(2)} MB -> ${(outBytes / 1e3).toFixed(0)} kB  (-${saved}%)`,
  )
}

console.log('')
console.log(
  `converted ${sources.length}: ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB`,
)
