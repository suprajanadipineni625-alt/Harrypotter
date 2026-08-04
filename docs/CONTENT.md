# Content: the eight acts

Selected content, with the reasoning. Chosen against three filters:

1. **Is it iconic as an *image*?** Dialogue-driven moments, however beloved, are
   useless here. We need moments that survive being reduced to light, colour,
   silhouette and motion.
2. **Can it be evoked rather than reproduced?** We use no film assets, no film
   stills, no book text, no logos or crests (BUILD-CONSTRAINTS §5). Every act
   must work as an *abstraction* of a moment. This is a creative advantage, not
   a limitation — abstraction is what separates an art piece from a fan wiki.
3. **Does it fit the frame budget?** Anything that needs a detailed character
   model is out. Light, particles, fog, silhouette and shader work are in.

---

## The through-line

**You carry a light, and the light is the story.**

One light source travels the entire experience and never cuts. Its colour,
temperature and behaviour *are* the narrative — because that is genuinely how
these films were shot. The cinematography went from Columbus's bright,
wonder-filled world seen through a child's eyes, to Cuarón's naturalism, to
Half-Blood Prince's cold teal-green grade. The arc already exists in the source
material; we are amplifying it, not inventing it.

This solves three problems at once:

- **Performance** — light and colour are shader and post-processing work, not
  geometry. One persistent scene, eight parameter states.
- **Connection** — the thing you asked for. The light never cuts, so the
  connection is structural rather than decorative.
- **Arc** — gold → descent → dark → breath → gold returning. That shape is what
  stops eight acts being a list.

---

## The acts

### Act 1 — Philosopher's Stone · the floating candles

**Image:** thousands of points of warm light suspended in a vast dark, drifting.
The camera rises through them.

- **Palette:** candle amber, warm gold, deep warm black
- **Build:** instanced points, bloom, gentle noise drift
- **Why it opens:** motion on the very first frame, no loading state — the
  3-second rule from BUILD-CONSTRAINTS §3. And it is the purest image of wonder
  in the series.
- **Interaction:** the pointer disturbs the candles; they drift back.

### Act 2 — Chamber of Secrets · the chamber

**Image:** submerged green dark. Vast stone. Something enormous moving just
outside where the light reaches.

- **Palette:** sickly green, wet stone, black water
- **Build:** volumetric fog, caustic shader, one large silhouette that is never
  fully revealed
- **Note:** restraint is the whole effect. What you do not show is the horror.

### Act 3 — Prisoner of Azkaban · the Patronus

**Image:** cold advances from the edges of the frame — frost, darkness closing
in. Then silver-white light bursts outward and drives it back.

- **Palette:** blue-silver moonlight against black
- **Build:** post-processing (vignette, frost, desaturation) fighting a particle
  burst
- **This is the gesture beat.** Of every moment in the series this is the one
  built for a hand raised at a camera. It is also the arc's first turn: the
  first time light is something you *do*, not something you watch.

### Act 4 — Goblet of Fire · the second task

**Image:** descending into cold black water. The surface light failing above.
Shapes below.

- **Palette:** cold teal-black
- **Build:** depth fog, god-rays from above, drifting particulate
- **Why this over the graveyard:** the underwater task is the better *image* —
  the graveyard is a performance and a story beat, and abstracted it becomes
  a generic dark field. The lake's cold look is specifically praised in the
  cinematography writing, and depth is something WebGL renders beautifully.

### Act 5 — Order of the Phoenix · the Hall of Prophecy

**Image:** infinite shelves of glowing orbs receding into dark — then the
shatter, and thousands of points of light falling.

- **Palette:** dusty blue-grey, institutional cold
- **Build:** instanced spheres in a receding grid, then a physics-lite fall
- **Why:** the Ministry battle is the film's cinematographic high point, and the
  shelf collapse is one image that is simultaneously enormous, cheap to
  instance, and genuinely beautiful.

### Act 6 — Half-Blood Prince · the cave

**Image:** black water, a ring of green fire, hands rising from beneath.

- **Palette:** teal-green — this film's actual signature grade, and widely
  considered the best-shot of the eight
- **Build:** reflective water shader, one ring light, silhouetted forms
- **Position:** the bottom of the arc. Everything after this turns back toward
  light.

### Act 7 — Deathly Hallows Pt 1 · the Tale of the Three Brothers

**Image:** ink and shadow. Silhouette figures, a river, three gifts, a road.

- **Palette:** bleached parchment, ink black, one thin line of light
- **Build:** 2D silhouette and masking work — almost no 3D at all
- **Why this is the smartest act in the set:** the source sequence is *already*
  stylised silhouette animation, so an original abstraction of it is stylistically
  faithful without touching a frame of the film. It is also nearly free to
  render, which buys budget back for Act 8. And tonally it is a held breath —
  eight acts of escalating dark would be monotonous; this one changes the
  medium entirely.

### Act 8 — Deathly Hallows Pt 2 · the shield, the ash, the dawn

**Image:** a dome of light rising over everything. Then ash falling like snow.
Then dawn — warm gold returning.

- **Palette:** ash grey → fire → **the gold from Act 1**
- **Build:** expanding shell shader, falling particulate, a final colour grade
  that lands exactly on the opening palette
- **Why it closes:** the last frame rhymes with the first. That is the difference
  between an arc and a list, and it is the moment a viewer decides whether to
  share it.

---

## The connective layer — houses and characters

Deliberately **not** a separate section. Between each act, the world dissolves
into a constellation:

- **characters as points of light**
- **house as colour** — the four palettes are the only place house colour is used
- **relationships as threads** between points

Built as GPU-instanced points and lines: nearly free in draw calls, and it is
literally "connection" made visible.

The mechanism that makes it more than decoration: **the constellation grows.**
Each interstitial carries every node from the acts before it, plus the new ones.
Between Act 1 and 2 it is sparse — a handful of points. By Act 8 it is dense and
tangled, and you can *see* the accumulated weight of who is connected to whom.
Seven interstitials, one growing web.

That is the house-and-character connection you asked for, expressed as structure
rather than as a page of profile cards.

---

## What was deliberately left out

- **Quidditch.** Reads as motion without meaning when abstracted.
- **The graveyard, Snape's death, Dumbledore's tower.** Performance-driven
  scenes. Without faces they become dark fields.
- **The Mirror of Erised.** Beautiful idea, but the content of the mirror is the
  point, and we cannot show it.
- **Diagon Alley, the Great Hall as architecture.** Detailed environment
  modelling is exactly the budget we do not have.
