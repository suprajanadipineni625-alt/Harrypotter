import { HORCRUX_TOTAL, type Part, type Scene } from './parts'

/**
 * The reading layer: part title, scene heading, one paragraph, and the Horcrux
 * counter.
 *
 * The reference direction is prose-led — the text is the narrative, not a
 * caption on a picture. So it is typeset as something to actually read: a
 * measure around 60 characters, generous leading, and a serif.
 *
 * The counter is the connective tissue. Seven marks, present from the first
 * scene, going out one at a time from Part 2 to Part 8. It is what makes eight
 * parts one hunt instead of eight summaries.
 */

export function Prose({
  part,
  scene,
  opacity,
  isPartOpening,
}: {
  part: Part
  scene: Scene
  opacity: number
  isPartOpening: boolean
}) {
  return (
    <div className="prose" style={{ opacity }} aria-live="polite">
      {isPartOpening && (
        <header className="prose__part">
          <p className="prose__partnum">Part {part.n}</p>
          <h2 className="prose__parttitle">{part.title}</h2>
          <p className="prose__partsub">{part.subtitle}</p>
        </header>
      )}

      <h3 className="prose__title">{scene.title}</h3>
      <p className="prose__body">{scene.prose}</p>

      {scene.horcrux && (
        <p className="prose__mark">
          Horcrux {scene.horcrux} of {HORCRUX_TOTAL} destroyed
        </p>
      )}
    </div>
  )
}

export function HorcruxCounter({ destroyed }: { destroyed: number }) {
  return (
    <div
      className="horcrux"
      aria-label={`${destroyed} of ${HORCRUX_TOTAL} Horcruxes destroyed`}
    >
      {Array.from({ length: HORCRUX_TOTAL }, (_, i) => (
        <span
          key={i}
          className="horcrux__mark"
          data-out={i < destroyed}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
