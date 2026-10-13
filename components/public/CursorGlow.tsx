'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

/**
 * A soft glow that trails the cursor on desktop.
 *
 * Three guards keep this from being a nuisance:
 *  - it renders nothing when `prefers-reduced-motion` is set,
 *  - it binds no listeners on devices without a fine pointer, and the handler
 *    ignores non-mouse pointers, so a phone never ends up with a glow stuck
 *    in a corner,
 *  - it is `pointer-events-none` and `fixed`, so it cannot intercept clicks or
 *    become a scroll container.
 *
 * It also carries no `mix-blend-mode`. A blend mode would force the entire
 * stacking context beneath it to be re-composited as the pointer moves, which
 * is far too high a price for a decorative glow.
 *
 * Position and opacity are motion values rather than React state, so moving
 * the mouse never triggers a React render - and there is no `setState` inside
 * the effect to cause a cascading re-render on mount.
 */
export function CursorGlow() {
  const reduceMotion = useReducedMotion()

  // Parked off-screen and fully transparent until the first real mouse move.
  const x = useMotionValue(-600)
  const y = useMotionValue(-600)
  const opacity = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 120, damping: 22, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 120, damping: 22, mass: 0.4 })

  useEffect(() => {
    if (reduceMotion) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      x.set(event.clientX)
      y.set(event.clientY)
      opacity.set(0.45)
    }

    const onLeave = () => opacity.set(0)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [reduceMotion, x, y, opacity])

  if (reduceMotion) return null

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-30 size-[380px] rounded-full"
      style={{
        x: springX,
        y: springY,
        opacity,
        translateX: '-50%',
        translateY: '-50%',
        background:
          'radial-gradient(circle, color-mix(in oklab, var(--color-neon-cyan) 12%, transparent) 0%, transparent 58%)',
        filter: 'blur(28px)',
      }}
    />
  )
}
