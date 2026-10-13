'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2, Loader2, Mail, MapPin, Send } from 'lucide-react'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import type { z } from 'zod'
import type { SiteSettings, SocialLink } from '@/lib/content-types'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

/**
 * The honeypot field has a Zod default, which makes it optional on the way IN
 * and guaranteed on the way OUT. react-hook-form models those separately, so
 * the form is typed with the input shape and the submit handler receives the
 * parsed output shape.
 */
type ContactFormValues = z.input<typeof contactSchema>

type Status =
  | { kind: 'idle' }
  | { kind: 'success'; emailed: boolean }
  | { kind: 'error'; message: string }

export function ContactSection({
  settings,
  socialLinks,
}: {
  settings: Pick<SiteSettings, 'email' | 'location'>
  socialLinks: SocialLink[]
}) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues, unknown, ContactInput>({
    // The same schema the API route re-validates against, so the inline errors
    // here are exactly the server's rules.
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  })

  async function onSubmit(values: ContactInput) {
    setStatus({ kind: 'idle' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        emailed?: boolean
        error?: string
        fieldErrors?: Record<string, string[]>
      }

      if (!response.ok || !body.ok) {
        if (body.fieldErrors) {
          for (const [name, messages] of Object.entries(body.fieldErrors)) {
            if (messages?.[0]) {
              setError(name as keyof ContactFormValues, {
                type: 'server',
                message: messages[0],
              })
            }
          }
        }
        setStatus({
          kind: 'error',
          message:
            body.error ??
            (response.status === 429
              ? 'Too many messages from this address. Please try again later.'
              : 'Something went wrong. Please try again, or email me directly.'),
        })
        return
      }

      reset()
      setStatus({ kind: 'success', emailed: body.emailed !== false })
    } catch {
      setStatus({
        kind: 'error',
        message: 'Could not reach the server. Check your connection and try again.',
      })
    }
  }

  return (
    <section id="contact" className="section">
      <div className="shell">
        <SectionHeading
          index="07"
          title={
            <>
              Get in <span className="text-gradient">touch</span>
            </>
          }
          lede="Open to AI engineering roles and interesting problems. I read everything that arrives here."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-12">
          {/* Contact details */}
          <Reveal className="space-y-4">
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="glass flex items-center gap-3.5 p-4 transition-colors hover:border-neon-cyan/45"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan">
                  <Mail className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[0.7rem] tracking-wider text-fog-500 uppercase">
                    Email
                  </span>
                  <span className="block truncate text-sm text-fog-100">{settings.email}</span>
                </span>
              </a>
            )}

            {settings.location && (
              <div className="glass flex items-center gap-3.5 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neon-violet/30 bg-neon-violet/10 text-neon-violet">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[0.7rem] tracking-wider text-fog-500 uppercase">
                    Location
                  </span>
                  <span className="block text-sm text-fog-100">{settings.location}</span>
                </span>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="glow-room flex flex-wrap gap-2.5">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="glass glow-halo flex items-center gap-2 px-3.5 py-2.5 text-sm text-fog-300 transition-colors hover:text-neon-cyan"
                  >
                    <Icon name={link.icon} className="size-4" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1} className="glow-room">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="glass glass-ring glow-halo space-y-4 p-6 sm:p-7"
            >
              {status.kind === 'success' && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    Thanks — your message is saved and I will get back to you.
                    {!status.emailed && (
                      <span className="mt-1 block text-xs text-emerald-200/70">
                        (My email notification did not go through, but the message itself is
                        safely stored, so nothing is lost.)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {status.kind === 'error' && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{status.message}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    className={`field ${errors.name ? 'field-error' : ''}`}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="contact-name-error" className="mt-1.5 text-xs text-rose-300">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    className={`field ${errors.email ? 'field-error' : ''}`}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="contact-email-error" className="mt-1.5 text-xs text-rose-300">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  className={`field resize-y ${errors.message ? 'field-error' : ''}`}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  {...register('message')}
                />
                {errors.message && (
                  <p id="contact-message-error" className="mt-1.5 text-xs text-rose-300">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/*
                Honeypot. Hidden from sight and from assistive technology, and
                skipped by tab order, so a human will not fill it in - but a
                naive bot that fills every input will, and the server rejects
                any submission where it is non-empty.
              */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register('website')}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="size-4" aria-hidden />
                    Send message
                  </>
                )}
              </button>

              <p className="text-center text-xs text-fog-500">
                Your message is stored before the email is sent, so it cannot get lost in transit.
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
