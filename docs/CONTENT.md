# Content: eight movements

**This replaces an earlier film-by-film selection.** That version took the most
iconic image from each of the eight films in order. It was the safe choice, and
safe is the failure mode we are trying to avoid — chronological order is not a
*connection* between the parts, it is just sequence.

---

## The structural idea

**Movements, not films.** Each movement braids three or four moments from
*different* films that rhyme visually and emotionally. A movement is anchored by
one famous image and filled out with underrated ones.

Why this is the right structure rather than a clever one:

- **It is the answer to the original brief.** You asked for the connection
  between the parts. Playing the films in order does not connect them; it lists
  them. Putting the floating candles next to the Deluminator next to wands raised
  at the tower *is* a connection — an argument that these are the same image
  three times, twelve years apart.
- **It forces the underrated content in structurally.** A movement needs three or
  four examples, and the famous one is only ever one of them. Under a
  one-scene-per-film scheme the obvious pick wins every time.
- **Nobody tells it this way.** Every Harry Potter tribute is chronological. This
  is the difference between "nice Patronus" and "I have never seen anyone connect
  these four things."

### One honest tension

Most published "underrated Harry Potter moments" lists are about *performance* —
Slughorn's memory of Lily, Narcissa's whispered "is he alive?", Harry arguing
for Pettigrew's life. These are genuinely the overlooked greats, and almost all
of them are useless to us: they are underrated *because* they are subtle, and
subtlety lives in faces we cannot render.

So the filter is narrower than "underrated". It is **underrated as an image** —
moments with real visual force that got overshadowed. Different list, and a
shorter one.

---

## The through-line

**You carry a light.** Its colour and behaviour are the narrative. This is what
the films already do — Columbus's bright childlike world, Cuarón's naturalism,
Half-Blood Prince's cold teal grade. We amplify an arc that exists.

The Deluminator earns promotion from prop to *device*: it is canonically the
object that takes light and gives it back, which is exactly what the site does
across eight movements.

---

## The movements

### I — Lights in the dark
*The thesis. Everything after this is a variation.*

| Moment | Film | Standing |
|---|---|---|
| Floating candles, Great Hall | Philosopher's Stone | iconic anchor |
| Fred and George's fireworks | Order of the Phoenix | **underrated** — described as a visual metaphor for the twins; pure light and colour |
| The Deluminator | Deathly Hallows 1 | **underrated** — a light taken and returned |
| Wands raised at the tower | Half-Blood Prince | **underrated as an image** — hundreds of points of light erasing a dark mark |

- **Palette:** candle amber → silver-white
- **Build:** instanced points, bloom, drift. One system, four behaviours.
- **Opens on motion** — the 3-second rule, no loading state.

### II — Doors
*Thresholds. Each one costs more to walk through than the last.*

| Moment | Film | Standing |
|---|---|---|
| Platform 9¾ | Philosopher's Stone | iconic anchor |
| The Vanishing Cabinet | Half-Blood Prince | **underrated** — a bird sent through, returned dead, then returned alive |
| The Room of Hidden Things | Deathly Hallows 2 | **underrated** — an infinite room of stacked objects |
| King's Cross, white | Deathly Hallows 2 | **underrated as an image** — the last door, and a pure white void |

- **Palette:** warm brick → dust → **absolute white**
- **Build:** portal shader; instanced stacks with heavy repetition. King's Cross
  is the cheapest render in the entire site and one of the most striking.

### III — The web
*Houses, families, allegiances — promoted from interstitial to a movement of its own.*

| Moment | Film | Standing |
|---|---|---|
| The Marauder's Map | Prisoner of Azkaban | **underrated as an interface** — names moving, people as points |
| The Black family tapestry | Order of the Phoenix | **underrated** — connection and its violent severance, faces burnt out |
| The constellation | — | original |

- **Palette:** parchment, ink, gold thread, four house colours
- **Build:** GPU-instanced points and lines. Characters as points, house as
  colour, relationships as threads.
- **The map and the tapestry are the same object with opposite intent** — one
  shows you where everyone is, the other erases whoever disappointed the family.
  That contrast carries the whole movement.
- The web **persists and grows** for the rest of the site, thickening under
  later movements.

### IV — Descent
*Down, into water, into dark.*

| Moment | Film | Standing |
|---|---|---|
| The Chamber | Chamber of Secrets | iconic anchor |
| The second task | Goblet of Fire | **underrated** — the lake's cold look is specifically praised in the cinematography writing |
| The cave | Half-Blood Prince | anchor — the film's signature teal grade |

- **Palette:** sickly green → cold teal → black
- **Build:** volumetric fog, caustics, god-rays from a failing surface above.
  One depth system, three depths.

### V — Cold
*The turn. The first time light is something you do rather than watch.*

| Moment | Film | Standing |
|---|---|---|
| Dementors on the train | Prisoner of Azkaban | **underrated as an image** — frost creeping across glass |
| The Patronus | Prisoner of Azkaban | iconic anchor |
| The sword under the frozen lake | Deathly Hallows 1 | **underrated** — silver light beneath ice |

- **Palette:** blue-silver against black
- **Build:** post-processing (frost, vignette, desaturation) fighting a particle burst
- **This is the gesture beat.** Of everything in the series it is the moment
  built for a hand raised at a camera.

### VI — Fire
*War. The only movement that is loud.*

| Moment | Film | Standing |
|---|---|---|
| The Goblet | Goblet of Fire | iconic anchor |
| The Burrow burning | Half-Blood Prince | **underrated** — a home lost in a ring of fire on black water |
| Fiendfyre | Deathly Hallows 2 | **underrated** — cursed fire that takes the shape of animals |

- **Palette:** ember orange, white-hot, ash
- **Build:** fire as shader and particles, never geometry. Fiendfyre taking
  animal shapes is the single most technically ambitious effect in the site —
  scope it at the Phase 2 gate.

### VII — The quiet
*The breath. Almost no 3D, and the movement most likely to be quoted back at us.*

| Moment | Film | Standing |
|---|---|---|
| The dance to "O Children" | Deathly Hallows 1 | **underrated** — two silhouettes turning in a tent |
| The Tale of the Three Brothers | Deathly Hallows 1 | **underrated** — already silhouette animation in the source |
| Shell Cottage | Deathly Hallows 1 | **underrated** — the only bright beach in the series |

- **Palette:** bleached parchment, ink black, then one shock of pale daylight
- **Build:** 2D silhouette and masking. Nearly free to render, which buys the
  budget back that Fiendfyre spends.
- Deathly Hallows 1 is widely called the weak entry and is the most visually
  distinctive of the eight — the first shot outside Hogwarts, on real locations.
  **Building an entire movement from the film people skip is the single most
  contrarian choice here, and the one most likely to earn a comment.**

### VIII — Dawn
*Return.*

| Moment | Film | Standing |
|---|---|---|
| The shield charm | Deathly Hallows 2 | iconic anchor |
| Ash falling | Deathly Hallows 2 | — |
| Dawn | Deathly Hallows 2 | — |

- **Palette:** ash grey → fire → **the exact gold of Movement I**
- The last frame rhymes with the first. That is the moment someone decides
  whether to share it.

---

## Arc

Gold → wonder → connection → down → the turn → war → breath → gold returning.

The ordering is deliberately **not** chronological, but it is not random either:
it is emotional. Cold before Fire even though Azkaban precedes Goblet, because
the first act of defiance has to come before the full war.

---

## Cut, and why

- **Quidditch** — motion without meaning once abstracted.
- **The graveyard, Snape's death, the tower confrontation, Narcissa's lie** —
  the overlooked greats, and all performance. Without faces they are dark fields.
- **The Mirror of Erised** — the content of the mirror is the entire point, and
  we cannot show it.
- **Diagon Alley, the Great Hall as architecture** — detailed environment
  modelling is precisely the budget we do not have.
