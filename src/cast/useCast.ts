import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The cast: one 0..1 number, three possible sources.
 *
 * Everything downstream — the Patronus burst, its light, the retreat of the
 * dread field — reads this single value and knows nothing about where it came
 * from. That indirection is what makes the camera feature safe: it is an
 * ALTERNATIVE INPUT to a parameter that already works, not a feature the
 * experience depends on.
 *
 *   scroll   default. Everyone gets this, including anyone who denies the
 *            camera, is on a phone, or has JS-blocked media access.
 *   pointer  hold the mouse or a finger down to charge the cast.
 *   hand     an open palm raised to the camera, on-device via MediaPipe.
 *
 * Build order was deliberate (docs/PLAN.md Phase 5): the pointer path was made
 * to work first, so the camera could never become load-bearing.
 */

export type CastSource = 'scroll' | 'pointer' | 'hand'

export interface CastState {
  /** 0..1 */
  value: number
  source: CastSource
}

/**
 * Charge/decay rates, per second. Charging faster than decay means a cast
 * feels responsive; decaying slower than it charges means it lingers, which
 * is what makes it feel like something was released rather than switched off.
 */
const CHARGE = 1.5
const DECAY = 0.55

/**
 * Pointer-driven cast. Hold to charge, release to let it fall away.
 *
 * Runs its own rAF because it is INPUT, not scene state — it produces the
 * value that later becomes a prop. The no-wall-clock rule in core/progress.ts
 * governs what the render is a function of, and input is upstream of that.
 * In a Remotion render there is no pointer, so this never runs.
 */
export function usePointerCast(enabled: boolean) {
  const [value, setValue] = useState(0)
  const holding = useRef(false)
  const raf = useRef(0)
  const last = useRef(0)
  const current = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const down = () => (holding.current = true)
    const up = () => (holding.current = false)

    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    // A pointer that leaves the window never fires pointerup, which would
    // otherwise leave the cast stuck on.
    window.addEventListener('blur', up)

    last.current = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last.current) / 1000, 0.1)
      last.current = now
      const target = holding.current ? CHARGE : -DECAY
      current.current = Math.min(Math.max(current.current + target * dt, 0), 1)
      setValue(current.current)
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('blur', up)
    }
  }, [enabled])

  return value
}

export type HandStatus =
  | 'idle'
  | 'requesting'
  | 'loading'
  | 'tracking'
  | 'denied'
  | 'unsupported'
  | 'error'

/**
 * Hand-driven cast, on-device.
 *
 * MediaPipe Tasks for Web runs the model in the browser with no server and no
 * upload — the camera frames never leave the device. That is the whole reason
 * this is viable for a public site; a Python backend would mean shipping video
 * to a server, with the latency, cost and privacy problems that implies.
 *
 * Loaded lazily so that nobody who never opts in pays for the bundle.
 */
export function useHandCast(active: boolean) {
  const [value, setValue] = useState(0)
  const [status, setStatus] = useState<HandStatus>('idle')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setValue(0)
    setStatus('idle')
  }, [])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    let raf = 0

    const run = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported')
        return
      }

      setStatus('requesting')
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })
      } catch {
        // Denial is a normal outcome, not an error state to apologise for.
        setStatus('denied')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      setStatus('loading')
      let landmarker: {
        detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: unknown[] }
        close: () => void
      }
      try {
        const vision = await import('@mediapipe/tasks-vision')
        const files = await vision.FilesetResolver.forVisionTasks(
          // Served from our own /vendor, never a CDN — a third-party script host
          // is both a privacy leak and a single point of failure.
          '/vendor/mediapipe/wasm',
        )
        landmarker = (await vision.HandLandmarker.createFromOptions(files, {
          baseOptions: {
            modelAssetPath: '/vendor/mediapipe/hand_landmarker.task',
            delegate: 'GPU',
          },
          numHands: 1,
          runningMode: 'VIDEO',
        })) as unknown as typeof landmarker
      } catch {
        stream.getTracks().forEach((t) => t.stop())
        setStatus('error')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const video = document.createElement('video')
      video.srcObject = stream
      video.playsInline = true
      video.muted = true
      await video.play().catch(() => undefined)
      videoRef.current = video

      setStatus('tracking')
      let smoothed = 0

      const tick = () => {
        if (cancelled) return
        try {
          const result = landmarker.detectForVideo(video, performance.now())
          const hand = result.landmarks?.[0] as { x: number; y: number }[] | undefined

          // Openness: mean fingertip distance from the wrist, normalised by
          // hand size so it does not depend on how close the hand is to the
          // lens. An open palm charges; a fist does not.
          let target = 0
          if (hand && hand.length >= 21) {
            const wrist = hand[0]
            const span = Math.hypot(hand[9].x - wrist.x, hand[9].y - wrist.y) || 1
            const tips = [4, 8, 12, 16, 20]
            const mean =
              tips.reduce(
                (acc, i) => acc + Math.hypot(hand[i].x - wrist.x, hand[i].y - wrist.y),
                0,
              ) / tips.length
            const openness = (mean / span - 1.15) / 0.85
            target = Math.min(Math.max(openness, 0), 1)
          }

          // Heavy smoothing. Raw landmark output jitters, and a Patronus that
          // flickers with hand tremor reads as broken rather than as magic.
          smoothed += (target - smoothed) * 0.12
          setValue(smoothed)
        } catch {
          /* a dropped frame is not worth tearing the session down for */
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      stopRef.current = () => {
        cancelAnimationFrame(raf)
        landmarker.close()
        stream.getTracks().forEach((t) => t.stop())
        video.srcObject = null
      }
    }

    void run()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stopRef.current?.()
      stopRef.current = null
    }
  }, [active])

  return { value, status, stop, video: videoRef }
}
