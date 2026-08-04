/**
 * Generates the painted backdrop for each scene.
 *
 * WHERE THIS RUNS, AND WHY
 *
 * Not in the dev container — its egress policy denies image-API hosts, so no
 * key would work there. It runs in GitHub Actions, where the runner has open
 * network. Consequence worth stating plainly: the API key lives in a GitHub
 * repository secret and is never pasted into a chat, never stored here, and
 * never visible to me. That is strictly better than handing a key over.
 *
 * WHAT IT PRODUCES
 *
 * One `back` layer per scene — the backdrop. `mid` and `fore` stay procedural,
 * because they carry the parallax and the animated detail (lit windows,
 * falling letters, torch flicker) that a static image cannot do. Painting the
 * backdrop is where almost all of the visual lift is, per image spent.
 *
 * BUDGET
 *
 * `--budget` is a hard ceiling in dollars, enforced before every request. The
 * run stops rather than overspending. Defaults deliberately to the cheap model
 * so a mistake costs cents.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/* --------------------------------------------------------- providers */

/**
 * Per-image cost, used for the budget ceiling. Approximate published rates —
 * deliberately rounded UP so the estimate is never optimistic.
 */
const PROVIDERS = {
  deepinfra: {
    env: 'DEEPINFRA_API_KEY',
    models: {
      schnell: { id: 'black-forest-labs/FLUX-1-schnell', cost: 0.003 },
      dev: { id: 'black-forest-labs/FLUX-1-dev', cost: 0.025 },
    },
    async generate(key, model, prompt, size) {
      const res = await fetch(`https://api.deepinfra.com/v1/inference/${model}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, width: size[0], height: size[1] }),
      })
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
      const json = await res.json()
      const url = json.images?.[0] ?? json.image_url
      if (!url) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 200)}`)
      // Data URI or hosted URL, depending on model.
      if (url.startsWith('data:')) return Buffer.from(url.split(',')[1], 'base64')
      return Buffer.from(await (await fetch(url)).arrayBuffer())
    },
  },
  openai: {
    env: 'OPENAI_API_KEY',
    models: {
      low: { id: 'gpt-image-1', cost: 0.011, quality: 'low' },
      medium: { id: 'gpt-image-1', cost: 0.042, quality: 'medium' },
    },
    async generate(key, model, prompt, size, quality) {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          quality,
          size: `${size[0]}x${size[1]}`,
          n: 1,
        }),
      })
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
      const json = await res.json()
      const b64 = json.data?.[0]?.b64_json
      if (b64) return Buffer.from(b64, 'base64')
      const url = json.data?.[0]?.url
      if (!url) throw new Error('no image in response')
      return Buffer.from(await (await fetch(url)).arrayBuffer())
    },
  },
}

/* ----------------------------------------------------------- prompts */

/**
 * The style contract.
 *
 * Prepended to every scene so 44 backdrops read as one artist's work. Style
 * drift across scenes is the single most likely way this looks amateur, and it
 * is fixed by making the shared clause long and the per-scene clause short.
 *
 * Note what is deliberately absent: no character names, no film references, no
 * actors, no logos, no crests. These are original illustrations of places and
 * moods. See docs/BUILD-CONSTRAINTS.md §5.
 */
const STYLE = [
  'flat painterly digital illustration, matte poster art',
  'limited palette, deep desaturated blues and teals with warm amber accents',
  'strong silhouette shapes, simplified forms, no fine detail',
  'dramatic single light source, heavy atmosphere and fog',
  'cinematic wide composition, empty space in the lower third for text',
  'no people, no faces, no text, no lettering, no watermark, no logo',
].join(', ')

/** Per-scene subject. Places and weather, never characters. */
const SUBJECTS = {
  castle: 'a vast Gothic revival castle on a Scottish highland crag at night, many turrets and pointed spires, tall arched cathedral windows lit warm from within, a stone viaduct bridge, black loch below, mist rising, full moon',
  letters: 'a cramped low-ceilinged cottage room at night, hundreds of white envelopes bursting from a fireplace and swirling through the air, firelight from below, dark furniture in silhouette, bare floor in the foreground',
  platform: 'the interior of a vast Victorian iron-and-glass railway trainshed at night, great arched trusses receding, a scarlet steam locomotive at the platform, steam and lamplight, empty platform stone in the foreground',
  sorting: 'the interior of an immense medieval great hall, hammerbeam roof lost in darkness, hundreds of candles floating unsupported in mid-air, four long banqueting tables receding away, warm candlelight only',
  chess: 'an enormous dim Norman crypt with a giant chequered stone floor, colossal weathered stone chess pieces standing on the squares, one square conspicuously empty, cold light from high above, rubble in the foreground',
  mirror: 'an empty vaulted stone chamber at night, one tall ornate gilded mirror standing alone, cold silver light spilling out of the glass across a bare flagstone floor, deep shadow everywhere else',
  car: 'moonlit cloudscape seen from above at night, a break in the cloud revealing dark patchwork fields far below, vast empty sky, a small dark shape crossing',
  writing: 'a flooded Norman cloister corridor at night, ribbed stone vaulting, torchlight on wet flagstones, standing water reflecting the arches, deep shadow at the end of the passage',
  diary: 'a dark wooden desk lit by a single guttering candle, one open book with blank pages, an inkwell, everything beyond the candlelight in blackness',
  chamber: 'a colossal underground stone cavern, vast carved serpent columns receding into darkness, still green water across the floor, one shaft of cold light from far above',
  fang: 'a dark cavern floor beside still green water, black ink spreading in clouds through shallow water, one shaft of dim light',
  dementors: 'the interior of a vintage train compartment at night, one large window, thick frost crystals growing inward across the glass, the corridor lamp dying, dark countryside beyond',
  map: 'aged parchment spread across a worn wooden table, fine ink lines and drawn corridors, one candle from the left, deep shadow at the edges of the paper',
  buckbeak: 'a vast Scottish loch at dusk seen from high above, mountains folding into haze, the water like hammered pewter, a single small shape casting a shadow',
  patronus: 'a dark misty lakeshore at night, brilliant silver-white light bursting outward from the centre of the frame, the mist driven back, bare trees in silhouette',
  timeturner: 'a moonlit stone courtyard at night, cloister arches, long double shadows falling in two directions at once, still air',
  goblet: 'a dark medieval hall, one tall rough-hewn stone chalice burning with cold blue flame, the flame the only light source, stone floor in the foreground',
  dragon: 'jagged castle rooftops, spires and turrets seen from the air at dusk, smoke curling between the towers, dark wings of cloud, the valley far below',
  lake4: 'deep cold lake water seen from below the surface, weak green light failing far above, weed forests in silhouette, silt suspended, blackness below',
  maze: 'towering dark hedge walls at night forming a narrow corridor, the top of the hedges lost in mist, ground fog, a faint glow at the far end',
  graveyard: 'an overgrown country graveyard at night, leaning weathered headstones, one great yew tree, low ground mist, a stone angel in silhouette',
  quill: 'a small oppressive office interior at night, one desk under a single lamp, ornate pink and gilt decorative plates covering the wall, everything too neat',
  da: 'a hidden cluttered stone room lit by lanterns, tall foxed mirrors on the walls, worn wooden floorboards, stacked furniture in shadow',
  prophecy: 'endless towering shelves receding into total blackness in every direction, each shelf holding small glowing glass spheres, cold blue light from the spheres only',
  shatter: 'towering shelves collapsing in darkness, thousands of small glass spheres falling and breaking, points of light streaking downward like rain',
  veil: 'a sunken stone amphitheatre, a tattered black curtain hanging in a freestanding stone archway at the centre, the curtain moving in still air, cold light',
  book: 'a battered open textbook on a scarred wooden desk, cramped handwriting crowding the margins, one low lamp, darkness beyond',
  memory: 'a dim circular study at night, a shallow carved stone basin filled with liquid silver light, vapour rising from it, bookshelves in shadow',
  cave: 'an immense sea cave, black perfectly still water, a small rock island at the centre with a ring of green fire burning on it, the fire the only light',
  towerfall: 'the top of a high castle tower at night, stone parapet and battlements, a sickly green glow in the sky above, the grounds far below in darkness',
  ring: 'a cracked blackened gold ring lying on dark wood, one shaft of cold light, everything else in shadow',
  grimmauld: 'a decaying grand Georgian townhouse interior, dust sheets over furniture, a huge faded family tapestry on the wall with burnt holes in it, dim grey daylight',
  tent: 'a small canvas tent glowing from within, alone in a vast snowy wilderness at night, dark treeline far off, deep blue snow, enormous empty sky',
  locket: 'a heavy ornate gold locket on a chain lying on frozen ground, frost around it, cold blue light, blurred dark forest behind',
  ice: 'a frozen forest pool at night, silver-white light glowing up through thick ice, bare black trees crowding around, snow, breath fog',
  sword: 'a silver sword blade lying on cracked ice in a dark winter wood, light catching the edge, everything else deep blue and black',
  brothers: 'ink and shadow puppet theatre style, stark black silhouettes on aged parchment, a wide river, a long road, three tall thin cloaked figures, no colour except parchment and ink',
  dobby: 'a wide cold beach at first light, pale grey-gold sky, a small stone cottage on the dunes, wet sand reflecting the sky, one dark headland',
  gringotts: 'a colossal underground vault, mountains of gold coins and treasure heaped to the ceiling, cavernous darkness above, distant firelight glinting off the gold',
  diadem: 'a vast room piled to the ceiling with abandoned furniture and objects forming corridors, cursed fire spreading through it, orange light against enormous shadow',
  shield: 'a great Gothic castle at night seen from the valley, an immense dome of pale blue light closing over the whole castle, mountains, black loch below',
  battle: 'a ruined Gothic castle at night, towers broken open, fires burning in the wreckage, thick smoke against the sky, rubble in the foreground',
  memories: 'a dim stone room at night, silver vapour drifting through the air, a shallow carved basin of light on a plinth, deep shadow',
  forest: 'a dark ancient forest at night, immense gnarled trunks, thick mist between the trees, one narrow path leading away, almost no light',
  kingscross: 'a vast white void, the faintest suggestion of an arched glass station roof dissolving into pure white, no walls, no floor, nothing else',
  lastmove: 'a ruined stone courtyard at dawn, broken flagstones and rubble, one shaft of first light through a collapsed arch, smoke still hanging',
  dawn: 'a broken Gothic castle silhouette at sunrise, warm gold light flooding from behind it, mist filling the valley, still water in the foreground',
}

/* -------------------------------------------------------------- main */

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)

const providerName = args.provider ?? 'deepinfra'
const provider = PROVIDERS[providerName]
if (!provider) {
  console.error(`Unknown provider "${providerName}". Use: ${Object.keys(PROVIDERS).join(', ')}`)
  process.exit(1)
}

const key = process.env[provider.env]
if (!key) {
  console.error(`Missing ${provider.env}.`)
  console.error(`Add it as a GitHub repository secret; never commit it.`)
  process.exit(1)
}

const modelName = args.model ?? (providerName === 'deepinfra' ? 'schnell' : 'low')
const model = provider.models[modelName]
if (!model) {
  console.error(`Unknown model "${modelName}" for ${providerName}. Use: ${Object.keys(provider.models).join(', ')}`)
  process.exit(1)
}

const budget = Number(args.budget ?? 1.0)
const only = args.only ? String(args.only).split(',') : null
// 3:2 landscape. The back layer is over-wide on purpose so the parallax can
// drift across it without ever exposing an edge.
const size = [1024, 704]
const OUT = 'public/scenes'

await mkdir(OUT, { recursive: true })

const ids = Object.keys(SUBJECTS).filter((id) => (only ? only.includes(id) : true))
const maxAffordable = Math.floor(budget / model.cost)

console.log(`provider  ${providerName} / ${modelName} (${model.id})`)
console.log(`cost      ~$${model.cost.toFixed(4)} per image`)
console.log(`budget    $${budget.toFixed(2)} -> at most ${maxAffordable} images`)
console.log(`queued    ${ids.length} scenes`)
console.log('')

if (maxAffordable < 1) {
  console.error('Budget will not cover a single image at this model. Nothing run.')
  process.exit(1)
}

let spent = 0
let made = 0
let skipped = 0

for (const id of ids) {
  const path = join(OUT, `${id}.png`)

  if (existsSync(path) && !args.force) {
    skipped++
    continue
  }

  // Checked BEFORE the request, so the ceiling can never be exceeded.
  if (spent + model.cost > budget) {
    console.log(`\nStopping: next image would exceed the $${budget.toFixed(2)} budget.`)
    break
  }

  const prompt = `${SUBJECTS[id]}. ${STYLE}`
  process.stdout.write(`${id.padEnd(14)} `)

  try {
    const bytes = await provider.generate(key, model.id, prompt, size, model.quality)
    await writeFile(path, bytes)
    spent += model.cost
    made++
    console.log(`ok  ${(bytes.length / 1000).toFixed(0)} kB   spent ~$${spent.toFixed(3)}`)
  } catch (err) {
    // A failed generation is not charged, so the run continues.
    console.log(`FAILED  ${String(err).slice(0, 120)}`)
  }
}

console.log('')
console.log(`generated ${made}, skipped ${skipped} (already present)`)
console.log(`estimated spend ~$${spent.toFixed(3)} of $${budget.toFixed(2)}`)
console.log('')
console.log('These are backdrops only. Run `npm run art:wire` to point the scenes at them.')
