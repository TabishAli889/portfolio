'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { ArrowRight, Globe, Star } from 'lucide-react'
import type { Project } from '@/lib/content-types'
import { GithubIcon } from '@/components/ui/BrandIcons'

/**
 * Project card with a pointer-tracked tilt and a glow that follows the cursor.
 *
 * Tilt is applied with `transform: perspective(...) rotateX/rotateY` on the
 * card itself. Note what is NOT here: no `overflow-hidden` on the card. The
 * cover image is clipped by its own inner wrapper instead, so the card's halo
 * and gradient ring can still paint outside the card box.
 *
 * The pointer position is held in motion values, not React state. Driving it
 * through `useState` meant two setState calls per `pointermove`, so the whole
 * card re-rendered on every mouse movement - and with several cards on screen
 * that was enough to make the page feel heavy. Motion values write straight to
 * the DOM node and never re-render the component.
 */
export function ProjectCard({
  project,
  imageUrl,
  priority = false,
}: {
  project: Project
  imageUrl: string
  priority?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)

  const rotateX = useSpring(0, { stiffness: 220, damping: 24 })
  const rotateY = useSpring(0, { stiffness: 220, damping: 24 })
  const spotX = useMotionValue(50)
  const spotY = useMotionValue(50)
  const spotOpacity = useMotionValue(0)

  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${spotX}% ${spotY}%, color-mix(in oklab, var(--color-neon-cyan) 13%, transparent), transparent 62%)`

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    // Touch and pen get no tilt: it fights with scrolling.
    if (reduceMotion || event.pointerType !== 'mouse') return
    const element = cardRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    rotateX.set((py - 0.5) * -7)
    rotateY.set((px - 0.5) * 9)
    spotX.set(px * 100)
    spotY.set(py * 100)
    spotOpacity.set(0.7)
  }

  function reset() {
    rotateX.set(0)
    rotateY.set(0)
    spotOpacity.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className={`glass glass-ring glow-halo group relative flex h-full flex-col ${
        project.featured ? 'glow-halo-violet' : ''
      }`}
    >
      {/* Cursor spotlight. Sits above the fill, below the content. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: spotlight, opacity: spotOpacity }}
      />

      {imageUrl && (
        <div className="relative m-2 mb-0 aspect-16/9 overflow-hidden rounded-xl bg-ink-800">
          <Image
            src={imageUrl}
            alt={project.imageAlt || `${project.title} screenshot`}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,5,10,0.6),transparent_55%)]" />
        </div>
      )}

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-snug">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors hover:text-neon-cyan"
            >
              {project.title}
              {/* Stretched hit area so the whole card is clickable, while the
                  explicit links below stay independently focusable. */}
              <span className="absolute inset-0 z-0" aria-hidden />
            </Link>
          </h3>

          {project.featured && (
            <Star
              className="mt-1 size-3.5 shrink-0 fill-neon-cyan text-neon-cyan"
              aria-label="Featured project"
            />
          )}
        </div>

        {project.year && (
          <p className="mt-1 font-mono text-[0.7rem] text-fog-500">{project.year}</p>
        )}

        {project.summary && (
          <p className="mt-3 text-sm leading-relaxed text-fog-400">{project.summary}</p>
        )}

        {project.techTags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.techTags.slice(0, 5).map((tag) => (
              <li key={tag} className="chip">
                {tag}
              </li>
            ))}
            {project.techTags.length > 5 && (
              <li className="chip !text-fog-500">+{project.techTags.length - 5}</li>
            )}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-4 pt-1">
          <Link
            href={`/projects/${project.slug}`}
            className="relative z-10 inline-flex items-center gap-1.5 text-sm font-medium text-neon-cyan transition-colors hover:text-fog-50"
          >
            Case study
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>

          <span className="ml-auto flex items-center gap-1.5">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title} live site`}
                className="relative z-10 rounded-lg border border-ink-600 p-2 text-fog-400 transition-colors hover:border-neon-cyan/50 hover:text-neon-cyan"
              >
                <Globe className="size-3.5" aria-hidden />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.title} source on GitHub`}
                className="relative z-10 rounded-lg border border-ink-600 p-2 text-fog-400 transition-colors hover:border-neon-violet/50 hover:text-neon-violet"
              >
                <GithubIcon className="size-3.5" />
              </a>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
