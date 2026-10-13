'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, Download, MapPin, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Hero as HeroContent, SiteSettings } from '@/lib/content-types'
import { cloudinaryImageUrl, isOptimizable } from '@/lib/images'

/**
 * Hero with a typewriter that cycles the roles from the database, and an
 * optional portrait beside it.
 *
 * The first role is rendered on the server as plain text, so the heading has
 * its final size in the very first paint. That is what stops the typewriter
 * from causing layout shift - a common failure in this pattern where the line
 * starts empty and pushes everything below it down as it types.
 */
export function Hero({
  hero,
  settings,
}: {
  hero: HeroContent
  settings: Pick<SiteSettings, 'resumeUrl' | 'resumeFileName' | 'location'>
}) {
  const reduceMotion = useReducedMotion()
  const roles = hero.roles.filter((role) => role.trim() !== '')
  const typed = useTypewriter(roles, reduceMotion ?? false)

  // Reserve the width of the longest role so the caret does not jump the
  // layout as shorter roles type out.
  const longestRole = roles.reduce((a, b) => (b.length > a.length ? b : a), '')

  const hasPortrait = hero.imageUrl.trim() !== ''

  return (
    <section className="section relative flex min-h-[calc(100dvh-var(--header-height))] items-center pt-10">
      <div className="shell">
        {/*
          Two columns once there is a portrait and the screen is wide enough;
          a single column otherwise, which is also the no-image layout.
        */}
        <div
          className={
            hasPortrait
              ? 'grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16'
              : ''
          }
        >
          <div className={hasPortrait ? 'max-w-2xl lg:order-1' : 'max-w-3xl'}>
          {hero.greeting && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-sm tracking-wide text-neon-cyan"
            >
              {hero.greeting}
            </motion.p>
          )}

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mt-3 text-[clamp(2.5rem,8vw,4.75rem)] leading-[1.05]"
          >
            <span className="text-gradient text-glow">{hero.name}</span>
          </motion.h1>

          {roles.length > 0 && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-4 font-display text-[clamp(1.15rem,3.6vw,1.85rem)] font-medium text-fog-100"
            >
              <span className="sr-only">{roles.join(', ')}</span>
              <span aria-hidden className="inline-grid">
                {/* Invisible sizer locks the line width. */}
                <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
                  {longestRole}
                </span>
                <span className="col-start-1 row-start-1">
                  {typed}
                  <span className="ml-0.5 inline-block w-[2px] animate-caret bg-neon-cyan align-middle [height:1.05em]" />
                </span>
              </span>
            </motion.p>
          )}

          {hero.tagline && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-fog-400"
            >
              {hero.tagline}
            </motion.p>
          )}

          {settings.location && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-fog-500"
            >
              <MapPin className="size-3.5 text-neon-violet" aria-hidden />
              {settings.location}
            </motion.p>
          )}

          {/* glow-room: the buttons' hover shadows extend well past their box. */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="glow-room mt-9 flex flex-wrap items-center gap-3"
          >
            {hero.primaryCtaLabel && (
              <a href={hero.primaryCtaHref || '#projects'} className="btn btn-primary">
                {hero.primaryCtaLabel}
                <ArrowDown className="size-4" aria-hidden />
              </a>
            )}

            {hero.secondaryCtaLabel && (
              <a href={hero.secondaryCtaHref || '#contact'} className="btn btn-ghost">
                <Send className="size-4" aria-hidden />
                {hero.secondaryCtaLabel}
              </a>
            )}

            {hero.showResumeButton && settings.resumeUrl && (
              <a
                href={settings.resumeUrl}
                target="_blank"
                rel="noreferrer"
                download={settings.resumeFileName || undefined}
                className="btn btn-ghost"
              >
                <Download className="size-4" aria-hidden />
                Resume
              </a>
            )}
          </motion.div>
          </div>

          {hasPortrait && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.21, 0.6, 0.35, 1] }}
              /*
                `lg:order-2` keeps the portrait on the right on desktop while
                it sits above the text on mobile, where a face reads as a
                stronger opening than a wall of type. glow-room reserves space
                for the frame's glow.
              */
              className="glow-room order-first mx-auto w-44 sm:w-52 lg:order-2 lg:mx-0 lg:w-full lg:max-w-sm"
            >
              <div className="portrait-frame">
                {/* The clipping lives here, not on the frame - see globals.css. */}
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-[1.65rem] bg-ink-800">
                  <Image
                    src={cloudinaryImageUrl(hero.imageUrl, { width: 720, height: 900 })}
                    alt={hero.imageAlt || `Portrait of ${hero.name}`}
                    fill
                    sizes="(max-width: 640px) 11rem, (max-width: 1024px) 13rem, 24rem"
                    /* Above the fold and the likely LCP element, so it is
                       fetched eagerly rather than lazily. */
                    priority
                    className="object-cover"
                    unoptimized={!isOptimizable(hero.imageUrl)}
                  />

                  {/* Keeps the lower edge readable against the aurora. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,5,10,0.45),transparent_45%)]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="pointer-events-none absolute bottom-7 left-1/2 hidden -translate-x-1/2 sm:block"
        aria-hidden
      >
        <span className="flex h-11 w-6 items-start justify-center rounded-full border border-ink-500 p-1.5">
          <span
            className={`size-1.5 rounded-full bg-neon-cyan ${reduceMotion ? '' : 'animate-float'}`}
          />
        </span>
      </motion.div>
    </section>
  )
}

/**
 * Types a word out, holds it, deletes it, moves to the next.
 *
 * With reduced motion it returns the first role immediately and never runs a
 * timer at all.
 */
function useTypewriter(words: string[], reduceMotion: boolean): string {
  const [text, setText] = useState(words[0] ?? '')

  /**
   * `words` is a fresh array on every render, so depending on it directly
   * would tear down and restart the timer each time the typed text changes -
   * an endless loop. Depending on a serialised key instead keeps the effect
   * stable for as long as the actual roles are unchanged.
   */
  const wordsKey = JSON.stringify(words)

  useEffect(() => {
    const list = JSON.parse(wordsKey) as string[]
    if (reduceMotion || list.length === 0) return

    let wordIndex = 0
    let charIndex = list[0]?.length ?? 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      const word = list[wordIndex] ?? ''

      if (!deleting) {
        charIndex += 1
        setText(word.slice(0, charIndex))

        if (charIndex >= word.length) {
          // A single role has nothing to cycle to, so stop rather than
          // deleting and retyping the same word forever.
          if (list.length < 2) return
          deleting = true
          timer = setTimeout(tick, 1900)
          return
        }
        timer = setTimeout(tick, 68)
        return
      }

      charIndex -= 1
      setText(word.slice(0, charIndex))

      if (charIndex <= 0) {
        deleting = false
        wordIndex = (wordIndex + 1) % list.length
        timer = setTimeout(tick, 320)
        return
      }
      timer = setTimeout(tick, 34)
    }

    // The first role is already on screen from the server render, so begin by
    // deleting it rather than typing it a second time.
    if (list.length > 1) {
      deleting = true
      timer = setTimeout(tick, 2200)
    }

    return () => clearTimeout(timer)
  }, [wordsKey, reduceMotion])

  return text
}
