import { animate, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/gsap'

/** Counts from 0 to `to` the first time it scrolls into view (Framer Motion). */
export function CountUp({
  to,
  locale = 'en-US',
  duration = 1.8,
}: {
  to: number
  locale?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })
  const [n, setN] = useState(() => (prefersReducedMotion() ? to : 0))
  useEffect(() => {
    if (!seen || prefersReducedMotion()) {
      if (prefersReducedMotion()) setN(to)
      return
    }
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (x) => setN(x) })
    return () => c.stop()
  }, [seen, to, duration])
  return <span ref={ref}>{Math.round(n).toLocaleString(locale)}</span>
}
