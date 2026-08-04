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
  letters: 'a cramped dim room interior, envelopes of paper suspended mid-air, a fireplace glow',
  platform: 'a vast Victorian railway station trainshed at night, steam, iron arches, a red engine',
  sorting: 'an immense stone hall interior, hundreds of candles floating in mid-air, long tables',
  chess: 'an enormous dim stone chamber with a giant chequered stone floor, monolithic shapes',
  mirror: 'an empty dark stone room, one tall ornate mirror frame, cold light spilling from it',
  car: 'moonlit clouds seen from above, open night sky, a distant patchwork of fields far below',
  writing: 'a flooded stone corridor at night, torchlight on wet flagstones, dripping walls',
  diary: 'a small dark desk lit by one candle, an open blank book, deep shadow all around',
  chamber: 'a vast underground stone cavern, green water, colossal carved serpent pillars',
  fang: 'a dark cavern floor beside green water, ink spreading through shallow water',
  dementors: 'a train compartment window at night, frost crawling across the glass, dark outside',
  map: 'aged parchment spread on a wooden table, ink lines, candlelight from one side',
  buckbeak: 'a great lake at dusk seen from high above, mountains, still water like hammered metal',
  patronus: 'a dark misty lakeshore at night, brilliant silver-white light bursting from the centre',
  timeturner: 'a moonlit stone courtyard at night, long shadows, a sense of time doubled',
  goblet: 'a dark stone hall, one tall stone chalice burning with blue flame, deep shadow',
  dragon: 'jagged castle rooftops and towers at dusk seen from the air, smoke, dark wings of cloud',
  lake4: 'deep dark cold lake water seen from below, faint light failing far above, weeds',
  maze: 'towering dark hedge walls at night forming a narrow corridor, mist on the ground',
  graveyard: 'an overgrown graveyard at night, leaning headstones, bare trees, low mist',
  quill: 'a dark office interior, one desk, a single lamp, oppressive pink and gilt decor',
  da: 'a hidden cluttered stone room lit by lanterns, tall mirrors, worn wooden floor',
  prophecy: 'endless dark shelves receding into blackness, small glowing glass spheres on each',
  shatter: 'shelves collapsing in darkness, thousands of small glass lights falling like rain',
  veil: 'a stone amphitheatre pit, a tattered curtain hanging in a stone archway, still air',
  book: 'a battered open textbook on a worn desk, cramped handwriting in the margins, dim light',
  memory: 'a dim study, a shallow stone basin filled with liquid silver light, vapour rising',
  cave: 'a vast sea cave, black still water, a small island with a ring of green fire',
  towerfall: 'the top of a high castle tower at night, parapet, green light in the sky',
  ring: 'a cracked black stone ring on dark wood, one shaft of cold light',
  grimmauld: 'a decaying grand townhouse interior, dust sheets, a burnt tapestry on the wall',
  tent: 'a small lit tent in a vast empty snowy wilderness at night, dark trees far off',
  locket: 'a heavy gold locket on a chain lying on frozen ground, cold blue light',
  ice: 'a frozen forest pool at night, silver light glowing beneath thick ice, bare trees',
  sword: 'a silver sword blade on ice in a dark wood, cold light, breath fog',
  brothers: 'ink-and-shadow puppet theatre style, a river, a road, three tall thin silhouettes',
  dobby: 'a wide bright cold beach at dawn, a small cottage on the dunes, pale sky',
  gringotts: 'a colossal underground vault of gold, cavernous dark, chains, distant firelight',
  diadem: 'a vast room piled to the ceiling with abandoned objects, cursed fire spreading',
  shield: 'a great castle at night beneath a vast dome of pale light, valley below',
  battle: 'a ruined castle at night, broken towers, fires burning, smoke against the sky',
  memories: 'a dim stone room, silver vapour drifting, a shallow basin of light',
  forest: 'a dark ancient forest at night, immense trunks, mist, one thin path',
  kingscross: 'an infinite white void, faint suggestion of a vaulted station roof, nothing else',
  lastmove: 'a ruined stone courtyard at dawn, rubble, one shaft of first light',
  dawn: 'a broken castle silhouette at sunrise, warm gold light, mist in the valley',
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
