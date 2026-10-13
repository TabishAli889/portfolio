import { connection, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/mongodb'
import { Message } from '@/models'
import { contactSchema } from '@/lib/schemas'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { hasMailConfig } from '@/lib/env'
import { sendContactNotification } from '@/lib/mail'

/**
 * Contact form endpoint.
 *
 * Order of operations matters and is the whole point of this route:
 *   1. validate,
 *   2. WRITE THE MESSAGE TO MONGODB,
 *   3. only then attempt the Gmail send.
 *
 * Gmail is the unreliable step - an expired App Password, an SMTP timeout or a
 * rate limit will all fail at some point. If the email were sent first, or if a
 * send failure returned an error to the visitor, a real enquiry would be lost
 * and the sender would never know. Instead the row is already durable, the
 * visitor gets a success response, and the delivery failure is recorded on the
 * document so the admin inbox can flag it.
 */

/** Keeps the per-IP limiter honest when a proxy omits forwarding headers. */
const MAX_PER_WINDOW = 3
const WINDOW_MS = 10 * 60 * 1000

export async function POST(request: Request) {
  // Reading request data makes this request-time; `cacheComponents` forbids
  // `export const dynamic`, so the intent is stated explicitly.
  await connection()

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  // Server-side validation with the same schema the browser used. The client
  // check is a convenience; this one is the rule.
  const parsed = contactSchema.safeParse(payload)
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error)
    return NextResponse.json(
      { ok: false, error: 'Please check the form and try again.', fieldErrors },
      { status: 400 },
    )
  }

  const { name, email, message, website } = parsed.data

  /**
   * Honeypot. A filled-in `website` field means an automated submission.
   * Returning a normal-looking success is deliberate: telling a bot it was
   * detected just teaches the operator to adapt. Nothing is written or sent.
   */
  if (website && website.trim() !== '') {
    return NextResponse.json({ ok: true, emailed: true })
  }

  const ip = clientIp(request.headers)
  const limit = rateLimit(`contact:${ip}`, { limit: MAX_PER_WINDOW, windowMs: WINDOW_MS })

  if (!limit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: `That is a few messages in a short time. Please try again in ${Math.ceil(
          limit.retryAfter / 60,
        )} minute(s).`,
      },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter) } },
    )
  }

  // --- Step 1: persist, before anything that can fail externally -----------
  let messageId: string
  try {
    await connectToDatabase()
    const doc = await Message.create({
      name,
      email,
      message,
      read: false,
      emailSent: false,
      ip,
      userAgent: request.headers.get('user-agent')?.slice(0, 400) ?? '',
    })
    messageId = String(doc._id)
  } catch (error) {
    // The database is the one failure the visitor does need to know about,
    // because nothing was stored and a retry is worthwhile.
    console.error('[contact] failed to store message', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Could not save your message right now. Please try again in a moment.',
      },
      { status: 503 },
    )
  }

  // --- Step 2: notify, best effort ----------------------------------------
  if (!hasMailConfig()) {
    console.warn('[contact] GMAIL_USER / GMAIL_APP_PASSWORD not set; message stored without email')
    await Message.findByIdAndUpdate(messageId, {
      $set: { emailSent: false, emailError: 'Mail is not configured on the server.' },
    })
    return NextResponse.json({ ok: true, emailed: false })
  }

  try {
    await sendContactNotification({
      name,
      email,
      message,
      receivedAt: new Date(),
      ip,
    })
    await Message.findByIdAndUpdate(messageId, { $set: { emailSent: true, emailError: '' } })
    return NextResponse.json({ ok: true, emailed: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('[contact] email send failed; message is stored', detail)

    await Message.findByIdAndUpdate(messageId, {
      $set: { emailSent: false, emailError: detail.slice(0, 600) },
    })

    // Still a success from the visitor's point of view: their message is safe.
    return NextResponse.json({ ok: true, emailed: false })
  }
}
