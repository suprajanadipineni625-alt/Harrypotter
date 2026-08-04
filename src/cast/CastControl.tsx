import { useEffect, useState } from 'react'
import { useHandCast, usePointerCast, type CastSource } from './useCast'

/**
 * Offers the cast, and returns the resulting 0..1 value.
 *
 * The rules this encodes (docs/PLAN.md Phase 5):
 *
 * 1. **Never prompt on load.** An unexplained camera request on arrival reads
 *    as hostile, and roughly one in ten visitors who see a camera prompt denies
 *    it outright. The offer appears only once you are inside Movement V, when
 *    there is something to actually cast.
 * 2. **The fallback exists first.** Pointer works for everyone. The camera is
 *    an alternative route to the same number, never a requirement.
 * 3. **Desktop by default.** Hand tracking plus a full scene on a mid-range
 *    phone is a frame-budget fight worth declining; touch-hold still works.
 * 4. **Failure is quiet.** Denied, unsupported and errored all fall back to the
 *    pointer without an apology or a modal.
 */

export interface CastResult {
  value: number | null
  source: CastSource
}

export function useCastControl(inMovement: boolean, allowHand: boolean): CastResult & {
  ui: React.ReactNode
} {
  const [handRequested, setHandRequested] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const pointer = usePointerCast(inMovement)
  const hand = useHandCast(handRequested && inMovement)

  // Leaving the movement releases the camera. Holding a webcam open for a
  // section the visitor has scrolled past is indefensible.
  useEffect(() => {
    if (!inMovement && handRequested) {
      setHandRequested(false)
      hand.stop()
    }
  }, [inMovement, handRequested, hand])

  const handActive = hand.status === 'tracking'
  const value = handActive ? hand.value : pointer > 0.001 ? pointer : null
  const source: CastSource = handActive ? 'hand' : pointer > 0.001 ? 'pointer' : 'scroll'

  const failed =
    hand.status === 'denied' || hand.status === 'unsupported' || hand.status === 'error'

  const ui = inMovement ? (
    <div className="cast">
      <p className="cast__hint">
        {handActive
          ? 'Open your hand to the camera.'
          : 'Press and hold to cast.'}
      </p>

      {allowHand && !handRequested && !dismissed && (
        <div className="cast__offer">
          <button
            type="button"
            className="cast__button"
            onClick={() => setHandRequested(true)}
          >
            Use your hand instead
          </button>
          <button
            type="button"
            className="cast__dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss camera offer"
          >
            ×
          </button>
        </div>
      )}

      {hand.status === 'requesting' && <p className="cast__status">Asking for the camera…</p>}
      {hand.status === 'loading' && <p className="cast__status">Loading hand tracking…</p>}
      {failed && <p className="cast__status">Camera unavailable — press and hold instead.</p>}
    </div>
  ) : null

  return { value, source, ui }
}
