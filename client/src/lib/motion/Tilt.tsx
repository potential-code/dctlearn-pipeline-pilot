import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  href?: string
  style?: CSSProperties
  /** Max rotation in degrees. */
  max?: number
}

/**
 * Card with a springy 3D tilt and a cursor spotlight (--mx/--my) on hover (Framer Motion).
 * Renders an <a> when href is given.
 */
export function Tilt({ children, className, href, style, max = 7 }: Props) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 220, damping: 22 })
  const sy = useSpring(py, { stiffness: 220, damping: 22 })
  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const mx = useTransform(px, (v) => `${v * 100}%`)
  const my = useTransform(py, (v) => `${v * 100}%`)
  const spot = useMotionTemplate`radial-gradient(420px circle at ${mx} ${my}, rgba(255,255,255,.22), transparent 55%)`

  const move = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const leave = () => {
    px.set(0.5)
    py.set(0.5)
  }
  const Comp = href ? motion.a : motion.div
  return (
    <Comp
      href={href}
      className={className}
      style={{ ...style, rotateX, rotateY, transformPerspective: 1100 }}
      onMouseMove={move}
      onMouseLeave={leave}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      {children}
      <motion.span className="tilt-spot" aria-hidden="true" style={{ background: spot }} />
    </Comp>
  )
}
