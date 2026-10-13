import type { About } from '@/lib/content-types'
import { Reveal, RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'

/**
 * The portrait used to live here. It now sits in the hero, so this section is
 * prose plus the quick-fact chips - and the column split is narrower, since
 * the right-hand column no longer has an image to hold.
 */
export function AboutSection({ about }: { about: About }) {
  if (about.paragraphs.length === 0 && about.facts.length === 0) return null

  const hasFacts = about.facts.length > 0

  return (
    <section id="about" className="section">
      <div className="shell">
        <SectionHeading index="01" title={about.heading || 'About me'} />

        <div
          className={
            hasFacts ? 'grid gap-12 lg:grid-cols-[1.7fr_1fr] lg:gap-16' : 'max-w-3xl'
          }
        >
          <div className="space-y-5">
            {about.paragraphs.map((paragraph, index) => (
              <Reveal key={index} delay={index * 0.07}>
                <p className="text-[1.02rem] leading-[1.75] text-fog-300">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <div className="space-y-7">
            {hasFacts && (
              <RevealStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1" as="div">
                {about.facts.map((fact) => (
                  <RevealItem
                    key={`${fact.label}-${fact.value}`}
                    className="glass flex items-baseline justify-between gap-4 px-4 py-3"
                  >
                    <span className="font-mono text-[0.7rem] tracking-wider text-fog-500 uppercase">
                      {fact.label}
                    </span>
                    <span className="text-right text-sm font-medium text-fog-100">
                      {fact.value}
                    </span>
                  </RevealItem>
                ))}
              </RevealStagger>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
