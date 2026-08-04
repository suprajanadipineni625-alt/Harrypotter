/**
 * GPU tier detection and quality profiles.
 *
 * Built in Phase 0 on purpose. Retrofitting tiers into a finished scene means
 * touching every component; having the profile available from the first commit
 * means each component reads it as it is written.
 *
 * Desktop and mobile are two first-class tiers, not one tier and a degraded
 * copy — see docs/BUILD-CONSTRAINTS.md §1. The one number that never flexes is
 * 60fps.
 */

export type Tier = 'high' | 'mid' | 'low'

export interface QualityProfile {
  tier: Tier
  /** Cap on devicePixelRatio. Never render more pixels than the tier can afford. */
  maxPixelRatio: number
  /** Post-processing at all? */
  postProcessing: boolean
  /** Bloom is the one effect worth keeping longest — the whole site is light. */
  bloom: boolean
  /** Depth of field, grain, chromatic aberration — the expensive tail. */
  richPost: boolean
  /**
   * Upper bound on particles in any ONE field. Movements run two or three
   * fields at once, so the worst case is roughly three times this — which is
   * why the low figure is well under what a single field could afford.
   */
  maxParticles: number
  /** Real-time shadows, or baked/faked. */
  shadows: boolean
  /** Texture resolution scale: 1 = full, 0.5 = half, 0.25 = quarter. */
  textureScale: number
}

const PROFILES: Record<Tier, QualityProfile> = {
  high: {
    tier: 'high',
    maxPixelRatio: 2,
    postProcessing: true,
    bloom: true,
    richPost: true,
    maxParticles: 120_000,
    shadows: true,
    textureScale: 1,
  },
  mid: {
    tier: 'mid',
    maxPixelRatio: 1.75,
    postProcessing: true,
    bloom: true,
    richPost: false,
    maxParticles: 30_000,
    shadows: false,
    textureScale: 0.5,
  },
  low: {
    tier: 'low',
    maxPixelRatio: 1.5,
    postProcessing: false,
    bloom: false,
    richPost: false,
    maxParticles: 8_000,
    shadows: false,
    textureScale: 0.25,
  },
}

/** Read the unmasked GPU string, where the browser allows it. */
function readRenderer(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return ''
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const raw = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER)
    return typeof raw === 'string' ? raw.toLowerCase() : ''
  } catch {
    return ''
  }
}

function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false
  // userAgentData is the modern signal; UA string is the fallback.
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
    .userAgentData
  if (typeof uaData?.mobile === 'boolean') return uaData.mobile
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent)
}

/**
 * Classify the device.
 *
 * Deliberately conservative: a device we cannot identify is assumed to be
 * weaker than it might be. A high-end phone briefly running the mid profile is
 * invisible; a weak phone running the high profile is a slideshow.
 */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'high' // SSR / Remotion render

  // `?tier=high|mid|low` forces a profile. The plan requires proving 60fps on
  // BOTH tiers, and no single machine is both — so the override is how either
  // tier gets tested, and how a screenshot of the low path can be taken on a
  // desktop.
  const forced = new URLSearchParams(window.location.search).get('tier')
  if (forced === 'high' || forced === 'mid' || forced === 'low') return forced

  const renderer = readRenderer()
  const mobile = isMobileUA()
  const cores = navigator.hardwareConcurrency ?? 4
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4

  // Software rendering: always the floor, whatever the device claims.
  if (
    renderer.includes('swiftshader') ||
    renderer.includes('llvmpipe') ||
    renderer.includes('software')
  ) {
    return 'low'
  }

  if (mobile) {
    // Apple silicon phones handle the mid profile comfortably.
    if (/apple/.test(renderer) && cores >= 6) return 'mid'
    // Recent Adreno/Mali flagships.
    if (/adreno \(tm\) (7|8)\d\d/.test(renderer)) return 'mid'
    if (/mali-g(7|ps|[7-9])/.test(renderer) && cores >= 8) return 'mid'
    if (cores >= 8 && memory >= 6) return 'mid'
    return 'low'
  }

  // Desktop. Integrated graphics are real and common.
  const integrated =
    renderer.includes('intel') &&
    !renderer.includes('arc') &&
    !renderer.includes('iris xe max')
  if (integrated && cores <= 4) return 'mid'
  if (cores <= 2 || memory <= 2) return 'mid'

  return 'high'
}

export function profileFor(tier: Tier): QualityProfile {
  return PROFILES[tier]
}

/**
 * Respect the OS-level reduced-motion setting.
 * The site is motion; when this is set we still show it, but calmly.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
