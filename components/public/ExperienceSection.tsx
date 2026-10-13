'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { ExternalLink, MapPin } from 'lucide-react'
import type { Experience } from '@/lib/content-types'
import { RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'

/**
 * Timeline whose spine fills as the section scrolls past.
 *
 * The filled line is a scaled overlay on top of a static full-height rail, so
 * the layout is identical whether or not the animation runs - nothing moves
 * as the progress changes.
 */
export function ExperienceSection({ experience }: { experience: Experience[] }) {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 72%', 'end 55%'],
  })

  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 32, restDelta: 0.001 })

  if (experience.length === 0) return null

  return (
    <section id="experience" className="section">
      <div className="shell">
        <SectionHeading
          index="03"
          title={
            <>
              Where I have <span className="text-gradient">worked</span>
            </>
          }
        />

        <div ref={containerRef} className="relative">
          {/* Rail + animated fill, inset so it sits under the node centres. */}
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-[11px] w-px bg-ink-700 sm:left-[15px]"
          >
            <motion.div
              className="h-full w-px origin-top bg-[linear-gradient(180deg,var(--color-neon-cyan),var(--color-neon-violet),var(--color-neon-magenta))]"
              style={reduceMotion ? { scaleY: 1 } : { scaleY: progress }}
            />
          </div>

          <RevealStagger as="ul" className="space-y-9" stagger={0.1}>
            {experience.map((item) => (
              <RevealItem as="li" key={item.id} className="relative pl-10 sm:pl-14">
                {/* Node. The ring animation needs room, hence the padding on
                    the wrapper rather than a tight absolute box. */}
                <span
                  aria-hidden
                  className={`absolute top-1.5 left-0 flex size-[23px] items-center justify-center rounded-full border border-ink-600 bg-ink-900 sm:size-[31px] ${
                    item.current && !reduceMotion ? 'animate-pulse-ring' : ''
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      item.current
                        ? 'bg-neon-cyan shadow-[0_0_12px_2px_rgba(34,211,238,0.85)]'
                        : 'bg-fog-500'
                    }`}
                  />
                </span>

                <article className="glass glass-ring p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg">{item.role}</h3>
                    {item.current && (
                      <span className="rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-neon-cyan uppercase">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fog-300">
                    {item.companyUrl ? (
                      <a
                        href={item.companyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-neon-violet transition-colors hover:text-neon-cyan"
                      >
                        {item.company}
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-neon-violet">{item.company}</span>
                    )}

                    {item.employmentType && (
                      <>
                        <span className="text-fog-500" aria-hidden>
                          &middot;
                        </span>
                        <span className="text-fog-400">{item.employmentType}</span>
                      </>
                    )}
                  </p>

                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-fog-500">
                    <span>
                      {item.startDate}
                      {(item.endDate || item.current) && ' — '}
                      {item.current ? 'Present' : item.endDate}
                    </span>
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" aria-hidden />
                        {item.location}
                      </span>
                    )}
                  </p>

                  {item.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {item.bullets.map((bullet, index) => (
                        <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-fog-300">
                          <span
                            aria-hidden
                            className="mt-[0.5em] size-1 shrink-0 rounded-full bg-neon-cyan/70"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.techTags.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {item.techTags.map((tag) => (
                        <li key={tag} className="chip">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  )
}
