'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import { Download, Menu, X } from 'lucide-react'

/**
 * Sticky header with a scroll-progress bar and active-section highlighting.
 *
 * The active link is tracked with an IntersectionObserver rather than scroll
 * maths - it is cheaper, it does not run on every scroll frame, and it handles
 * sections of wildly different heights correctly.
 */
export function SiteHeader({
  siteName,
  sections,
  resumeUrl,
  resumeFileName,
}: {
  siteName: string
  sections: { id: string; label: string }[]
  resumeUrl: string
  resumeFileName: string
}) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>(sections[0]?.id ?? '')
  const [scrolled, setScrolled] = useState(false)

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 36, restDelta: 0.001 })

  /**
   * Piggybacks on the scroll listener Framer already owns for `useScroll`,
   * rather than registering a second `window.scroll` handler of our own.
   * `setScrolled` only ever changes state when the threshold is crossed.
   */
  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 12)
  })

  // Active-section tracking.
  useEffect(() => {
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // The entry closest to the top of the viewport wins.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setActive(visible[0].target.id)
      },
      // The band sits just under the header, so a section counts as active
      // once its top passes the header rather than when it first peeks in.
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null)

    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [sections])

  // Lock body scroll behind the mobile menu.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-(--header-height) transition-colors duration-300 ${
        scrolled ? 'glass-blur border-b border-ink-700/70 bg-ink-950/80' : ''
      }`}
    >
      <div className="shell flex h-full items-center gap-6">
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight text-fog-50"
        >
          {siteName}
          <span className="text-neon-cyan">.</span>
        </Link>

        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 md:flex">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              className={`relative rounded-lg px-3 py-2 text-sm transition-colors ${
                active === section.id
                  ? 'text-fog-50'
                  : 'text-fog-400 hover:text-fog-100'
              }`}
            >
              {section.label}
              {active === section.id && (
                <motion.span
                  layoutId="nav-active"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 30 }
                  }
                  className="absolute inset-x-2 -bottom-px h-px bg-[linear-gradient(90deg,transparent,var(--color-neon-cyan),transparent)]"
                />
              )}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              download={resumeFileName || undefined}
              className="btn btn-ghost hidden !px-3.5 !py-2 !text-xs sm:inline-flex"
            >
              <Download className="size-3.5" aria-hidden />
              Resume
            </a>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-lg border border-ink-600 p-2 text-fog-300 transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan md:hidden"
          >
            {open ? <X className="size-4.5" aria-hidden /> : <Menu className="size-4.5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Scroll progress */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-[linear-gradient(90deg,var(--color-neon-cyan),var(--color-neon-violet),var(--color-neon-magenta))]"
        style={{ scaleX: progress }}
      />

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 top-(--header-height) z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/85"
          />
          <nav
            aria-label="Sections"
            className="glass-blur relative mx-4 mt-3 rounded-2xl border border-ink-700 bg-ink-900/95 p-2"
          >
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                  active === section.id
                    ? 'bg-neon-cyan/10 text-neon-cyan'
                    : 'text-fog-300 hover:bg-ink-800'
                }`}
              >
                {section.label}
              </a>
            ))}

            {resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                download={resumeFileName || undefined}
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-fog-300 hover:bg-ink-800"
              >
                <Download className="size-4" aria-hidden />
                Download resume
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
