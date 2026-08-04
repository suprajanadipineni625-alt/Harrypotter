import { useMemo } from 'react'
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import type { QualityProfile } from '../core/tier'

/**
 * Tier-gated post-processing.
 *
 * The whole site is light in dark, so bloom is not decoration here — it is the
 * primary rendering of the subject. It is therefore the last effect to be cut,
 * and grain/vignette go first.
 *
 * low  — nothing. The composer is not mounted at all, so there is no extra
 *        full-screen pass and no render target allocated.
 * mid  — bloom + vignette
 * high — bloom + vignette + grain
 *
 * All parameters come from the interpolated movement state, so the grade
 * changes continuously as you scroll rather than snapping at boundaries.
 */
export function Post({
  profile,
  bloom,
  vignette,
}: {
  profile: QualityProfile
  bloom: number
  vignette: number
}) {
  // `multisampling: 0` — MSAA on the composer is expensive and mostly wasted on
  // a scene made of points and fog.
  const composerProps = useMemo(() => ({ multisampling: 0 }), [])

  if (!profile.postProcessing) return null

  return (
    <EffectComposer {...composerProps}>
      {profile.bloom ? (
        <Bloom
          intensity={bloom}
          // A LOW threshold blooms everything, including mid-tones, which is
          // how a scene made of additive points turns into a white field. This
          // sits high on purpose: only genuinely bright cores glow, and the
          // darkness stays dark. Contrast is the subject here.
          luminanceThreshold={0.55}
          luminanceSmoothing={0.22}
          mipmapBlur
          radius={0.68}
        />
      ) : (
        <></>
      )}

      <Vignette
        offset={0.25}
        darkness={vignette}
        blendFunction={BlendFunction.NORMAL}
      />

      {profile.richPost ? (
        <Noise opacity={0.035} blendFunction={BlendFunction.OVERLAY} />
      ) : (
        <></>
      )}
    </EffectComposer>
  )
}
