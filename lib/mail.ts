import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'
import { mailEnv } from './env'

/**
 * Gmail SMTP transport for contact-form notifications.
 *
 * Reused across invocations on a warm lambda (creating a transport per request
 * means a fresh TLS handshake every time). Gmail requires an App Password -
 * a normal account password is rejected once 2FA is on, which it must be for
 * App Passwords to exist at all.
 */

const globalForMail = globalThis as typeof globalThis & {
  _mailTransporter?: Transporter
}

function getTransporter(): Transporter {
  if (globalForMail._mailTransporter) return globalForMail._mailTransporter

  const { user, appPassword } = mailEnv()

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
  })

  globalForMail._mailTransporter = transporter
  return transporter
}

/** Escapes text before it is interpolated into the HTML body of the email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type ContactNotification = {
  name: string
  email: string
  message: string
  receivedAt: Date
  ip?: string
}

export async function sendContactNotification(input: ContactNotification): Promise<void> {
  const { user, to } = mailEnv()
  const transporter = getTransporter()

  const safeName = escapeHtml(input.name)
  const safeEmail = escapeHtml(input.email)
  const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br>')

  await transporter.sendMail({
    // Gmail only permits sending as the authenticated account, so `from` is
    // our own address and the visitor goes in `replyTo`. Setting `from` to the
    // visitor's address would get the message rejected or spam-filed.
    from: `"Portfolio contact form" <${user}>`,
    to,
    replyTo: `"${input.name.replace(/"/g, '')}" <${input.email}>`,
    subject: `Portfolio message from ${input.name}`,
    text: [
      `From: ${input.name} <${input.email}>`,
      `Received: ${input.receivedAt.toISOString()}`,
      input.ip ? `IP: ${input.ip}` : null,
      '',
      input.message,
    ]
      .filter((line) => line !== null)
      .join('\n'),
    html: `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px">
        <h2 style="margin:0 0 4px;font-size:18px">New portfolio message</h2>
        <p style="margin:0 0 16px;color:#666;font-size:13px">
          ${safeName} &lt;${safeEmail}&gt; &middot; ${input.receivedAt.toUTCString()}
        </p>
        <div style="padding:16px;border-left:3px solid #22d3ee;background:#f8fafc;
                    border-radius:4px;white-space:pre-wrap;line-height:1.6">
          ${safeMessage}
        </div>
        <p style="margin:16px 0 0;color:#888;font-size:12px">
          Reply directly to this email to answer ${safeName}.
        </p>
      </div>
    `,
  })
}

/** Used by `npm run test:mail` to confirm SMTP credentials before going live. */
export async function verifyMailTransport(): Promise<void> {
  await getTransporter().verify()
}
