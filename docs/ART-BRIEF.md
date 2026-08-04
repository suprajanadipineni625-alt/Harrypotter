# Art brief

Copy-paste prompts for generating the scene backdrops in ChatGPT (or anything
else). **You do not need API credit for this** — a Plus subscription generates
images in the app at no extra cost. API access is billed separately and is not
included.

## How to use it

1. Paste the **style line** below into ChatGPT once, then a **scene prompt**.
2. Ask for **landscape**, ideally 1536 × 1024. The backdrop is over-wide on
   purpose so parallax can drift across it without exposing an edge.
3. Save the result as exactly `<id>.png` — the id is the heading of each
   section, e.g. `letters.png`.
4. Upload to **`public/scenes/`** in the repo. On github.com: open that folder →
   *Add file* → *Upload files*. Works from a phone.
5. That is it. A workflow wires it in and redeploys automatically.

**Do them a few at a time.** Any scene without an image keeps drawing
procedurally, so a half-finished set is never broken — and three good ones tell
you whether the style is right before you make forty.

## The style line

Paste this once, and again whenever the look starts drifting.

> Generate a wide landscape illustration, 1536×1024. Style for every image in
> this series, keep it identical throughout:
> **flat painterly digital illustration, matte poster art, limited palette, deep desaturated blues and teals with warm amber accents, strong silhouette shapes, simplified forms, no fine detail, dramatic single light source, heavy atmosphere and fog, cinematic wide composition, empty space in the lower third for text, no people, no faces, no text, no lettering, no watermark, no logo**

Style drift across scenes is the likeliest way this ends up looking amateur, so
keep the style line the same and change only the subject.

## Tested: describe it, do not name it

Run as an A/B on the same scene:

- **Naming the franchise was refused outright** by the generator.
- **Describing the real architecture worked, and produced a better image** —
  Gothic revival castle, crag, viaduct, loch, lit arched windows. It reads
  unmistakably as the place without a single trademark in the prompt.

That is not a workaround, it is simply a better prompt: "Gothic revival with
turrets and arched windows above a Scottish loch" tells the model about shape,
scale and light. A franchise name tells it almost nothing visually, and averages
eight films that look nothing like each other.

A generator producing something is also not a clearance. The filter reflects
that tool's policy, not what is safe to publish on a site built to be shared.
Both point the same way here, which is convenient.

## The rule, stated more precisely

The test is what ends up **in the image**, not what appears in the prompt.

- **Words in a prompt are invisible in the output.** Using a coined creature or
  spell name to steer the model toward the right cold, the right dread, the
  right kind of light is fine and often the fastest way to get there. Nobody
  can inspect the finished picture and find the word.
- **Marks rendered into the artwork are permanent and visible.** A wordmark
  painted on a boiler, a house crest on a banner, a platform number on a sign —
  those live in the file, in the repo, and on the page.

Earlier guidance here treated both the same. It should not have: one is a
steering instruction, the other is a reproduction.

Practical consequence: steer freely, but always end a prompt with an explicit
ban on lettering, and check the result. Some subjects pull hard toward signage
whatever the prompt says — a steam locomotive at a lamplit platform is the
worst offender, because almost every reference image of one carries a
nameplate.

## A note on what to ask for

These prompts deliberately describe **places and weather — never characters,
actors, or anything from the films.** That is not squeamishness; it is what
keeps the site publishable. Original artwork of a castle is fine. A recreated
film frame is not. See docs/BUILD-CONSTRAINTS.md §5.


---


## Part 1

### `castle.png` — The castle

> a vast Gothic revival castle on a Scottish highland crag at night, many turrets and pointed spires, tall arched cathedral windows lit warm from within, a stone viaduct bridge, black loch below, mist rising, full moon.

### `letters.png` — The letters

> a cramped low-ceilinged cottage room at night, hundreds of white envelopes bursting from a fireplace and swirling through the air, firelight from below, dark furniture in silhouette, bare floor in the foreground.

### `platform.png` — Platform nine and three quarters

> the interior of a vast Victorian iron-and-glass railway trainshed at night, great arched trusses receding, a scarlet steam locomotive at the platform, steam and lamplight, empty platform stone in the foreground.

### `sorting.png` — The Sorting

> the interior of an immense medieval great hall, hammerbeam roof lost in darkness, hundreds of candles floating unsupported in mid-air, four long banqueting tables receding away, warm candlelight only.

### `chess.png` — The chess game

> an enormous dim Norman crypt with a giant chequered stone floor, colossal weathered stone chess pieces standing on the squares, one square conspicuously empty, cold light from high above, rubble in the foreground.

### `mirror.png` — The mirror

> an empty vaulted stone chamber at night, one tall ornate gilded mirror standing alone, cold silver light spilling out of the glass across a bare flagstone floor, deep shadow everywhere else.


## Part 2

### `car.png` — The flying car

> moonlit cloudscape seen from above at night, a break in the cloud revealing dark patchwork fields far below, vast empty sky, a small dark shape crossing.

### `writing.png` — The writing on the wall

> a flooded Norman cloister corridor at night, ribbed stone vaulting, torchlight on wet flagstones, standing water reflecting the arches, deep shadow at the end of the passage.

### `diary.png` — The diary

> a dark wooden desk lit by a single guttering candle, one open book with blank pages, an inkwell, everything beyond the candlelight in blackness.

### `chamber.png` — The Chamber

> a colossal underground stone cavern, vast carved serpent columns receding into darkness, still green water across the floor, one shaft of cold light from far above.

### `fang.png` — The fang

> a dark cavern floor beside still green water, black ink spreading in clouds through shallow water, one shaft of dim light.


## Part 3

### `dementors.png` — Dementors on the train

> the interior of a vintage train compartment at night, one large window, thick frost crystals growing inward across the glass, the corridor lamp dying, dark countryside beyond.

### `map.png` — The map

> aged parchment spread across a worn wooden table, fine ink lines and drawn corridors, one candle from the left, deep shadow at the edges of the paper.

### `buckbeak.png` — Over the lake

> a vast Scottish loch at dusk seen from high above, mountains folding into haze, the water like hammered pewter, a single small shape casting a shadow.

### `patronus.png` — The Patronus

> a dark misty lakeshore at night, brilliant silver-white light bursting outward from the centre of the frame, the mist driven back, bare trees in silhouette.

### `timeturner.png` — The Time-Turner

> a moonlit stone courtyard at night, cloister arches, long double shadows falling in two directions at once, still air.


## Part 4

### `goblet.png` — The Goblet

> a dark medieval hall, one tall rough-hewn stone chalice burning with cold blue flame, the flame the only light source, stone floor in the foreground.

### `dragon.png` — The dragon

> jagged castle rooftops, spires and turrets seen from the air at dusk, smoke curling between the towers, dark wings of cloud, the valley far below.

### `lake4.png` — The second task

> deep cold lake water seen from below the surface, weak green light failing far above, weed forests in silhouette, silt suspended, blackness below.

### `maze.png` — The maze

> towering dark hedge walls at night forming a narrow corridor, the top of the hedges lost in mist, ground fog, a faint glow at the far end.

### `graveyard.png` — The graveyard

> an overgrown country graveyard at night, leaning weathered headstones, one great yew tree, low ground mist, a stone angel in silhouette.


## Part 5

### `quill.png` — The quill

> a small oppressive office interior at night, one desk under a single lamp, ornate pink and gilt decorative plates covering the wall, everything too neat.

### `da.png` — da

> a hidden cluttered stone room lit by lanterns, tall foxed mirrors on the walls, worn wooden floorboards, stacked furniture in shadow.

### `prophecy.png` — The Hall of Prophecy

> endless towering shelves receding into total blackness in every direction, each shelf holding small glowing glass spheres, cold blue light from the spheres only.

### `shatter.png` — The shatter

> towering shelves collapsing in darkness, thousands of small glass spheres falling and breaking, points of light streaking downward like rain.

### `veil.png` — The veil

> a sunken stone amphitheatre, a tattered black curtain hanging in a freestanding stone archway at the centre, the curtain moving in still air, cold light.


## Part 6

### `book.png` — book

> a battered open textbook on a scarred wooden desk, cramped handwriting crowding the margins, one low lamp, darkness beyond.

### `memory.png` — The memory

> a dim circular study at night, a shallow carved stone basin filled with liquid silver light, vapour rising from it, bookshelves in shadow.

### `cave.png` — The cave

> an immense sea cave, black perfectly still water, a small rock island at the centre with a ring of green fire burning on it, the fire the only light.

### `towerfall.png` — The tower

> the top of a high castle tower at night, stone parapet and battlements, a sickly green glow in the sky above, the grounds far below in darkness.

### `ring.png` — The ring

> a cracked blackened gold ring lying on dark wood, one shaft of cold light, everything else in shadow.


## Part 7

### `grimmauld.png` — The empty house

> a decaying grand Georgian townhouse interior, dust sheets over furniture, a huge faded family tapestry on the wall with burnt holes in it, dim grey daylight.

### `tent.png` — On the run

> a small canvas tent glowing from within, alone in a vast snowy wilderness at night, dark treeline far off, deep blue snow, enormous empty sky.

### `locket.png` — The locket

> a heavy ornate gold locket on a chain lying on frozen ground, frost around it, cold blue light, blurred dark forest behind.

### `ice.png` — The frozen lake

> a frozen forest pool at night, silver-white light glowing up through thick ice, bare black trees crowding around, snow, breath fog.

### `sword.png` — The sword

> a silver sword blade lying on cracked ice in a dark winter wood, light catching the edge, everything else deep blue and black.

### `brothers.png` — The Tale of the Three Brothers

> ink and shadow puppet theatre style, stark black silhouettes on aged parchment, a wide river, a long road, three tall thin cloaked figures, no colour except parchment and ink.

### `dobby.png` — Shell Cottage

> a wide cold beach at first light, pale grey-gold sky, a small stone cottage on the dunes, wet sand reflecting the sky, one dark headland.


## Part 8

### `gringotts.png` — Gringotts

> a colossal underground vault, mountains of gold coins and treasure heaped to the ceiling, cavernous darkness above, distant firelight glinting off the gold.

### `diadem.png` — The Room of Requirement

> a vast room piled to the ceiling with abandoned furniture and objects forming corridors, cursed fire spreading through it, orange light against enormous shadow.

### `shield.png` — The shield

> a great Gothic castle at night seen from the valley, an immense dome of pale blue light closing over the whole castle, mountains, black loch below.

### `battle.png` — Everything gone

> a ruined Gothic castle at night, towers broken open, fires burning in the wreckage, thick smoke against the sky, rubble in the foreground.

### `memories.png` — memories

> a dim stone room at night, silver vapour drifting through the air, a shallow carved basin of light on a plinth, deep shadow.

### `forest.png` — The forest

> a dark ancient forest at night, immense gnarled trunks, thick mist between the trees, one narrow path leading away, almost no light.

### `kingscross.png` — kingscross

> a vast white void, the faintest suggestion of an arched glass station roof dissolving into pure white, no walls, no floor, nothing else.

### `lastmove.png` — The last move

> a ruined stone courtyard at dawn, broken flagstones and rubble, one shaft of first light through a collapsed arch, smoke still hanging.

### `dawn.png` — Dawn

> a broken Gothic castle silhouette at sunrise, warm gold light flooding from behind it, mist filling the valley, still water in the foreground.

