'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Scroll-reveal wrapper.
 *
 * `useReducedMotion` is checked at the component level rather than relying on
 * the CSS media query alone: Framer animates inline styles, which the CSS
 * override in globals.css cannot reach. When reduced motion is requested the
 * element renders in its final state with no transform at all.
 *
 * `once: true` means an element animates in and then stays put - re-animating
 * on every scroll past is the thing that makes these sites feel cheap.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'article' | 'span'
}) {
  const reduceMotion = useReducedMotion()
  const Component = motion[as]

  if (reduceMotion) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px 0px -60px 0px' }}
      transition={{ duration: 0.62, delay, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </Component>
  )
}

/**
 * Staggered container. Children rendered inside a `<RevealStagger>` animate in
 * sequence; pass `index` to a `<Reveal>` child or use the `stagger` helper.
 */
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  stagger?: number
  as?: 'div' | 'ul' | 'section'
}) {
  const reduceMotion = useReducedMotion()
  const Component = motion[as]

  if (reduceMotion) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px 0px -60px 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </Component>
  )
}

/** A child of `RevealStagger`. Inherits the parent's stagger timing. */
export function RevealItem({
  children,
  className,
  y = 18,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  y?: number
  as?: 'div' | 'li' | 'article'
}) {
  const reduceMotion = useReducedMotion()
  const Component = motion[as]

  if (reduceMotion) {
    const Static = as
    return <Static className={className}>{children}</Static>
  }

  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.6, 0.35, 1] } },
      }}
    >
      {children}
    </Component>
  )
}
