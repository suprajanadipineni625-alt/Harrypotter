# Reference strategy

**The concern:** if we invent the architecture, it will look invented. Amateur
3D architecture is the single fastest way for a site to look cheap, and no
amount of lighting rescues wrong proportions.

That is correct, and it drives the asset strategy. But the fix is not "use the
film's assets" — it is better than that.

---

## The thing that makes this easy

**Hogwarts is real buildings.** The films were shot in public, historic
locations that predate the franchise by eight hundred years:

| Seen as | Actually | Notes |
|---|---|---|
| Hogwarts exterior, first flying lesson | **Alnwick Castle**, Northumberland | inner courtyards and baileys |
| Hogwarts corridors, McGonagall's classroom, Hedwig in the snow | **Durham Cathedral** cloisters | |
| Chamber of Secrets corridor, Gryffindor common room, the Unbreakable Vow | **Gloucester Cathedral** cloisters | the fan vaulting everyone pictures |
| Quirrell's classroom, Snape's Potions, the Mirror of Erised room | **Lacock Abbey** | Warming Room, Sacristy, Chapter House |
| King's Cross | **King's Cross Station**, London | a working railway station |
| The Hogwarts Express bridge | **Glenfinnan Viaduct**, Scotland | a working railway viaduct |

None of that is Warner Bros. intellectual property. Gloucester Cathedral's
cloister is 14th-century architecture in the public domain. Photographing it,
scanning it, and modelling from it are all fine.

So the reference strategy and the IP position point the same way: **reference
the real buildings, never the film.** We get accuracy *and* a clean licence,
and the reference is more authentic than a film still would be — it is the
actual stone that was actually filmed.

---

## Sources

- **[Sketchfab cultural-heritage CC0](https://sketchfab.com/nebulousflynn/collections/cc0-9e9b8c5442ab4b59ba16b6fa5e43b8da)**
  — Sketchfab runs a Public Domain Dedication programme for museums and heritage
  organisations. Genuine photogrammetry of historic architecture, CC0.
- **Sketchfab `cathedral` / `gothic` tags, filtered to CC0 or CC-BY** — León
  cathedral cloister, Canterbury, Cologne. Check the licence on every single
  one; the tag is not the licence.
- **[Poly Haven](https://polyhaven.com/)** — CC0 stone, plaster and timber
  materials, and HDRIs for image-based lighting. Default source for surfaces.
- **Zenodo / university heritage-scanning archives** — often CC0 and higher
  fidelity than hobbyist scans.
- **Own reference photography** where a specific building matters and no scan
  exists. Photographs are reference for modelling, not assets to ship.

Everything gets a row in `docs/ASSETS.md` with its licence before it is used.
CC-BY means attribution has to actually appear in the site, not just the repo.

---

## The catch, and how it resolves

Photogrammetry scans are enormous — a cathedral cloister scan is routinely
tens or hundreds of megabytes. Our entire budget is 10 MB. A raw scan cannot
ship, ever.

So the scan is **source material, not cargo**:

1. **Take the proportions.** This is 90% of the value. Wrong proportions are
   what read as amateur; a correct silhouette at low polygon count reads as
   real. Getting a bay spacing and vault spring-point right from a scan costs
   nothing at runtime.
2. **Decimate hard.** `gltf-transform simplify` plus Draco. Target hundreds of
   triangles per element, not hundreds of thousands.
3. **Bake, don't carry.** Surface detail becomes a normal map at KTX2, or is
   dropped entirely — see below.
4. **Instance repeated elements.** Gothic architecture is *made of repetition* —
   one arch, one column, one vault bay, drawn many times. This is the single
   biggest reason the reference is cheap to use: the buildings themselves are
   already instanced.

### Why this works better here than it would elsewhere

Our art direction never shows these buildings in full light. Every movement is
fog, silhouette and a single carried light. **Detail we cannot afford is detail
the design was never going to show.** A silhouette with true proportions,
resolved through fog and lit by one source, is close to indistinguishable from a
detailed model under those conditions — at a fraction of the cost.

That is the resolution: the reference buys us *correctness*, which is what the
eye actually judges. It does not commit us to *detail*, which is what the budget
cannot pay for.

---

## What is still off-limits

Unchanged from BUILD-CONSTRAINTS §5, and worth restating because this document
is about getting closer to the source:

- No film stills, no film-derived models, no ripped game assets.
- No official logos, house crests, or the film wordmark.
- No official fonts.
- Real buildings only, from open-licensed scans or our own reference.

The distinction that matters: **Durham Cathedral is public heritage. A Warner
Bros. render of Durham Cathedral is not.**
