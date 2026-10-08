import { type CSSProperties, createElement, Fragment, useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '@/lib/gsap'

type Props = {
  text: string | undefined
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  style?: CSSProperties
  /** Word indexes rendered with the .hl class (accent colour). */
  hl?: number[]
  /** 'load' plays once on mount; 'scroll' plays when the element scrolls into view. */
  on?: 'load' | 'scroll'
  delay?: number
  stagger?: number
}

/**
 * Word-by-word masked text reveal. React renders the split (so language switches and
 * re-renders stay correct); GSAP only animates transforms on the inner spans.
 */
export function RevealText({
  text = '',
  as = 'h2',
  className,
  style,
  hl,
  on = 'scroll',
  delay = 0,
  stagger = 0.07,
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const words = text.split(/\s+/).filter(Boolean)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      const inner = el.querySelectorAll<HTMLElement>('.rt-w > i')
      gsap.set(inner, { yPercent: 110, rotate: 4, opacity: 0 })
      gsap.to(inner, {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        duration: 1,
        ease: 'expo.out',
        stagger,
        delay,
        scrollTrigger: on === 'scroll' ? { trigger: el, start: 'top 88%', once: true } : undefined,
      })
    },
    { scope: ref, dependencies: [text], revertOnUpdate: true },
  )

  return createElement(
    as,
    { ref, className: `rt ${className ?? ''}`, style, 'aria-label': text },
    words.map((w, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: words of a fixed string
      <Fragment key={i}>
        <span className={`rt-w ${hl?.includes(i) ? 'hl' : ''}`} aria-hidden="true">
          <i>{w}</i>
        </span>{' '}
      </Fragment>
    )),
  )
}
