import Image from 'next/image'
import { Award, ExternalLink } from 'lucide-react'
import { cloudinaryImageUrl } from '@/lib/cloudinary'
import type { Certification } from '@/lib/content-types'
import { RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'

export function CertificationsSection({
  certifications,
}: {
  certifications: Certification[]
}) {
  // Hidden entirely when empty, rather than showing a heading with nothing
  // under it. The seed data ships no certifications on purpose.
  if (certifications.length === 0) return null

  return (
    <section id="certifications" className="section">
      <div className="shell">
        <SectionHeading
          index="06"
          title={
            <>
              Courses and <span className="text-gradient">credentials</span>
            </>
          }
        />

        <RevealStagger
          as="ul"
          className="glow-room grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.07}
        >
          {certifications.map((item) => (
            <RevealItem as="li" key={item.id} className="h-full">
              <article className="glass glass-ring glow-halo glow-halo-magenta flex h-full gap-3.5 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-600 bg-ink-800 text-neon-magenta">
                  {item.imageUrl ? (
                    <Image
                      src={cloudinaryImageUrl(item.imageUrl, { width: 80, height: 80 })}
                      alt=""
                      width={40}
                      height={40}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Award className="size-4.5" aria-hidden />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm leading-snug">{item.title}</h3>

                  {item.issuer && <p className="mt-1 text-xs text-fog-400">{item.issuer}</p>}

                  <p className="mt-1.5 font-mono text-[0.7rem] text-fog-500">
                    {item.issueDate}
                    {item.credentialId && ` · ${item.credentialId}`}
                  </p>

                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1 text-xs text-neon-cyan transition-colors hover:text-fog-50"
                    >
                      Verify
                      <ExternalLink className="size-3" aria-hidden />
                    </a>
                  )}
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
