import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { type ReactNode, useEffect } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/gsap'

let instance: Lenis | null = null

/** The page's Lenis instance (null with reduced motion, before mount, or in tests). */
export const lenis = () => instance

/** Jumps to the top without smoothing (route changes). */
export function scrollTopNow() {
  if (instance) instance.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}

/**
 * Lenis smooth scrolling for the whole app, driven by GSAP's ticker so ScrollTrigger reads the
 * same scroll position. Nested scroll areas (dialogs, tables, sidebars) keep native scrolling.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  // Scroll-triggered reveals store trigger positions; when layout settles (fonts, images,
  // accordions), re-measure so nothing waits below a stale start line.
  useEffect(() => {
    let t = 0
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    ro.observe(document.body)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const l = new Lenis({
      autoRaf: false,
      anchors: { offset: -16 },
      allowNestedScroll: true,
      lerp: 0.11,
      wheelMultiplier: 1,
    })
    instance = l
    l.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
      instance = null
    }
  }, [])
  return <>{children}</>
}
