import { GraduationCap, MapPin } from 'lucide-react'
import type { Education } from '@/lib/content-types'
import { RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function EducationSection({ education }: { education: Education[] }) {
  if (education.length === 0) return null

  return (
    <section id="education" className="section">
      <div className="shell">
        <SectionHeading
          index="05"
          title={
            <>
              Where I <span className="text-gradient">studied</span>
            </>
          }
        />

        <RevealStagger as="ul" className="glow-room grid gap-5 md:grid-cols-2" stagger={0.08}>
          {education.map((item) => (
            <RevealItem as="li" key={item.id} className="h-full">
              <article className="glass glass-ring glow-halo flex h-full flex-col p-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neon-violet/30 bg-neon-violet/10 text-neon-violet shadow-[0_0_22px_-10px_rgba(139,92,246,0.9)]">
                    <GraduationCap className="size-4.5" aria-hidden />
                  </span>

                  <div className="min-w-0">
                    <h3 className="text-base leading-snug">{item.degree}</h3>
                    <p className="mt-1 text-sm text-neon-cyan/90">{item.institution}</p>
                  </div>
                </div>

                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-fog-500">
                  <span>
                    {item.startDate}
                    {(item.endDate || item.current) && ' — '}
                    {item.current && !item.endDate ? 'Present' : item.endDate}
                  </span>
                  {item.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden />
                      {item.location}
                    </span>
                  )}
                  {item.grade && <span className="text-fog-400">{item.grade}</span>}
                </p>

                {item.description && (
                  <p className="mt-3 text-sm leading-relaxed text-fog-400">{item.description}</p>
                )}
              </article>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
