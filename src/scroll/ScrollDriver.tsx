import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { splitProgress, ZERO_PROGRESS, type Progress } from '../core/progress'
import { MOVEMENT_COUNT } from '../movements/movements'

gsap.registerPlugin(ScrollTrigger)

/**
 * One of two drivers of `Progress`. This one maps scroll position to progress.
 * The other (Phase 6) is Remotion's frame counter. Scene components never know
 * which is driving them — that is the whole point.
 */

const ProgressContext = createContext<Progress>(ZERO_PROGRESS)

/** Read the current progress. Cheap; updated via a ref-backed subscription. */
export const useProgress = () => useContext(ProgressContext)

export function ScrollDriver({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(ZERO_PROGRESS)
  const timeRef = useRef(0)

  useEffect(() => {
    const lenis = new Lenis({
      // Slightly long, because this is a cinematic scroll rather than a document.
      duration: 1.2,
      smoothWheel: true,
    })

    // THE integration point. Lenis must NOT run its own RAF loop alongside
    // GSAP's — two loops is the single most common cause of "almost smooth"
    // scroll jitter. Drive Lenis from the GSAP ticker so scroll updates and
    // animation land in the same execution block. See BUILD-CONSTRAINTS §2.
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => {
      // GSAP's ticker gives seconds; Lenis wants milliseconds.
      lenis.raf(time * 1000)
      timeRef.current = time
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const global = self.progress
        const { movement, local } = splitProgress(global, MOVEMENT_COUNT)
        setProgress({ global, movement, local, time: timeRef.current })
      },
    })

    return () => {
      trigger.kill()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return (
    <ProgressContext.Provider value={progress}>
      {children}
    </ProgressContext.Provider>
  )
}
