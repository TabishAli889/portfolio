import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

/**
 * Shared section header: a small monospace index label, the heading itself and
 * an optional lede, with a gradient rule underneath.
 */
export function SectionHeading({
  index,
  title,
  lede,
  align = 'left',
}: {
  index: string
  title: ReactNode
  lede?: string
  align?: 'left' | 'center'
}) {
  return (
    <Reveal className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}>
      <p className="font-mono text-xs tracking-[0.2em] text-neon-cyan/80 uppercase">
        <span className="text-neon-cyan/50">{index}</span>
        <span className="mx-2 text-fog-500">{'//'}</span>
      </p>

      <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>

      <div
        className={`mt-5 h-px w-28 bg-[linear-gradient(90deg,var(--color-neon-cyan),var(--color-neon-violet),transparent)] ${
          align === 'center' ? 'mx-auto' : ''
        }`}
      />

      {lede && (
        <p
          className={`mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-fog-400 ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {lede}
        </p>
      )}
    </Reveal>
  )
}
