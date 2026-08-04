/**
 * Removes trademarked lettering and emblems from a generated image.
 *
 * This is the compliant operation, not a workaround: the goal is that the mark
 * is GONE, not that it is present-but-fuzzy. A blur that leaves the wordmark
 * legible removes nothing — recognisability is the whole test — and it looks
 * like damage on top.
 *
 * Method: for each region, take a heavily blurred and slightly darkened copy of
 * the surrounding pixels and composite it back through a soft-edged mask. On a
 * matte painterly image that reads as unlit metal or plain enamel rather than
 * as a censored patch, because there is no hard edge anywhere.
 *
 * Regions are normalised 0..1 so they survive any resize.
 *
 *   node scripts/remove-marks.mjs <in> <out> <preset>
 */
import sharp from 'sharp'

const PRESETS = {
  // Nameplates, running number, hanging station signs and platform plaques.
  platform: [
    { x: 0.19, y: 0.42, w: 0.11, h: 0.06 }, // smokebox nameplate
    { x: 0.21, y: 0.47, w: 0.08, h: 0.05 }, // running number
    { x: 0.23, y: 0.36, w: 0.03, h: 0.04 }, // crest above the nameplate
    { x: 0.78, y: 0.41, w: 0.12, h: 0.11 }, // hanging sign
    { x: 0.94, y: 0.41, w: 0.04, h: 0.07 }, // platform number, right
    { x: 0.02, y: 0.46, w: 0.05, h: 0.06 }, // platform number, left
  ],
  // Heraldic devices on the four banners and on the table runners.
  sorting: [
    { x: 0.09, y: 0.38, w: 0.06, h: 0.14 }, // banner 1
    { x: 0.25, y: 0.42, w: 0.05, h: 0.12 }, // banner 2
    { x: 0.72, y: 0.42, w: 0.05, h: 0.12 }, // banner 3
    { x: 0.87, y: 0.38, w: 0.06, h: 0.14 }, // banner 4
    { x: 0.05, y: 0.76, w: 0.05, h: 0.09 }, // runner 1
    { x: 0.29, y: 0.79, w: 0.05, h: 0.09 }, // runner 2
    { x: 0.64, y: 0.79, w: 0.06, h: 0.10 }, // runner 3
    { x: 0.90, y: 0.77, w: 0.06, h: 0.10 }, // runner 4
  ],
}

const [, , input, output, presetName] = process.argv
const regions = PRESETS[presetName]
if (!input || !output || !regions) {
  console.error(`usage: remove-marks.mjs <in> <out> <${Object.keys(PRESETS).join('|')}>`)
  process.exit(1)
}

const base = sharp(input)
const { width, height } = await base.metadata()
const source = await base.png().toBuffer()

const overlays = []

for (const r of regions) {
  // Pad the sample area so the blur pulls in genuine surrounding colour rather
  // than smearing the mark itself outward.
  const pad = 0.5
  const px = Math.max(0, Math.round((r.x - r.w * pad) * width))
  const py = Math.max(0, Math.round((r.y - r.h * pad) * height))
  const pw = Math.min(width - px, Math.round(r.w * (1 + pad * 2) * width))
  const ph = Math.min(height - py, Math.round(r.h * (1 + pad * 2) * height))
  if (pw < 4 || ph < 4) continue

  const patch = await sharp(source)
    .extract({ left: px, top: py, width: pw, height: ph })
    // Heavy enough that no glyph survives at any zoom.
    .blur(Math.max(8, Math.min(pw, ph) / 3))
    // Slightly darker: signage is lit, unlit metal is not.
    .modulate({ brightness: 0.86 })
    .png()
    .toBuffer()

  // Soft elliptical mask so there is no rectangle edge to notice.
  const mask = Buffer.from(
    `<svg width="${pw}" height="${ph}">
       <defs>
         <radialGradient id="g">
           <stop offset="55%" stop-color="#fff" stop-opacity="1"/>
           <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
         </radialGradient>
       </defs>
       <ellipse cx="${pw / 2}" cy="${ph / 2}" rx="${pw / 2}" ry="${ph / 2}" fill="url(#g)"/>
     </svg>`,
  )

  const masked = await sharp(patch)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  overlays.push({ input: masked, left: px, top: py })
}

await sharp(source).composite(overlays).toFile(output)
console.log(`removed ${overlays.length} mark region(s) -> ${output}`)
