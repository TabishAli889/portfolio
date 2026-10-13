'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [spot, setSpot] = useState<{ x: number; y: number } | null>(null)

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    // Touch and pen get no tilt: it fights with scrolling.
    if (reduceMotion || event.pointerType !== 'mouse') return
    const element = cardRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height

    setTilt({ x: (py - 0.5) * -7, y: (px - 0.5) * 9 })
    setSpot({ x: px * 100, y: py * 100 })
  }

  function reset() {
    setTilt({ x: 0, y: 0 })
    setSpot(null)
  }

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      style={{ transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      className={`glass glass-ring glow-halo group relative flex h-full flex-col ${
        project.featured ? 'glow-halo-violet' : ''
      }`}
    >
      {/* Cursor spotlight. Sits above the fill, below the content. */}
      {spot && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70 transition-opacity"
          style={{
            background: `radial-gradient(320px circle at ${spot.x}% ${spot.y}%, color-mix(in oklab, var(--color-neon-cyan) 13%, transparent), transparent 62%)`,
          }}
        />
      )}

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
