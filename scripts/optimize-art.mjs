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
 * Quality is set for a lazily-loaded asset, not a bundled one.
 *
 * Backdrops are fetched per scene as you reach them — arriving downloads the
 * code plus ONE image. So the meaningful number is the size of a single
 * backdrop, not the size of all forty-seven, and compressing hard against a
 * whole-library total was optimising the wrong quantity.
 *
 * At 1920 and quality 88 a backdrop is roughly 250 kB, which is one photo. The
 * previous 1600/80 was visibly softer for no benefit — especially on portrait
 * sources, where cropping to landscape discards about half the pixels and then
 * upscales what remains.
 */
const QUALITY = 88

/**
 * Every backdrop is normalised to one landscape aspect.
 *
 * Generators return whatever shape they feel like — 4:3, 16:9, and portrait
 * when asked for a tall subject. Feeding mixed aspects to a fixed landscape
 * plane means correcting for it at render time, and any error there pushes UVs
 * outside 0..1 where the texture clamps and smears its edge pixels into
 * streaks across the whole frame.
 *
 * Cropping here instead removes the class of bug entirely: the shader can
 * assume one shape, and the crop is decided by a tool that can see the whole
 * image rather than by arithmetic at 60fps. Centre crop, because these
 * compositions put their subject in the middle.
 */
const TARGET = { width: 1920, height: 1200 }

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
  const ratio = (meta.width ?? 1) / (meta.height ?? 1)
  const target = ratio.toFixed(2)

  await sharp(src)
    .resize({
      width: TARGET.width,
      height: TARGET.height,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out)

  const outBytes = statSync(out).size
  after += outBytes

  // Deleted rather than kept: a 3 MB PNG committed once lives in history for
  // good, and nothing reads it after conversion.
  unlinkSync(src)

  const saved = (100 * (1 - outBytes / inBytes)).toFixed(0)
  const cropped = Math.abs(ratio - TARGET.width / TARGET.height) > 0.05
  console.log(
    `  ${id.padEnd(14)} ${(inBytes / 1e6).toFixed(2)} MB -> ${(outBytes / 1e3).toFixed(0)} kB  (-${saved}%)` +
      (cropped ? `  [cropped from ${target}:1]` : ''),
  )
}

console.log('')
console.log(
  `converted ${sources.length}: ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB`,
)
