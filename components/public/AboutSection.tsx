import Image from 'next/image'
import { cloudinaryImageUrl } from '@/lib/cloudinary'
import type { About } from '@/lib/content-types'
import { Reveal, RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function AboutSection({ about }: { about: About }) {
  if (about.paragraphs.length === 0 && !about.imageUrl && about.facts.length === 0) return null

  return (
    <section id="about" className="section">
      <div className="shell">
        <SectionHeading index="01" title={about.heading || 'About me'} />

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-5">
            {about.paragraphs.map((paragraph, index) => (
              <Reveal key={index} delay={index * 0.07}>
                <p className="text-[1.02rem] leading-[1.75] text-fog-300">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <div className="space-y-7">
            {about.imageUrl && (
              <Reveal className="glow-room">
                {/*
                  No `overflow-hidden` on this element, deliberately. Its halo
                  is a ::before at inset -28px, and `overflow: hidden` clips an
                  element's own pseudo-elements - so putting it here would make
                  the glow vanish. The image is clipped to the rounded corners
                  by the inner wrapper below instead, which carries no glow.
                */}
                <div className="glass glass-ring glow-halo glow-halo-violet relative p-2">

                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-ink-800">
                    <Image
                      src={cloudinaryImageUrl(about.imageUrl, { width: 720, height: 900 })}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 90vw, 380px"
                      className="object-cover"
                      // Below the fold, so no priority hint: it lazy-loads.
                    />
                  </div>
                </div>
              </Reveal>
            )}

            {about.facts.length > 0 && (
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
