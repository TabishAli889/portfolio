/**
 * Verifies Gmail SMTP end to end, before trusting the contact form with a real
 * enquiry.
 *
 *   npm run test:mail
 *
 * Two steps, so a failure tells you which half is wrong:
 *   1. `verify()` opens an authenticated SMTP connection. This is the step that
 *      fails if the App Password is wrong, if 2FA is off, or if the account
 *      blocks the login.
 *   2. a real message is sent to CONTACT_TO_EMAIL, using the exact same code
 *      path the contact form uses.
 */
import { sendContactNotification, verifyMailTransport } from '../lib/mail'

async function main() {
  const user = process.env.GMAIL_USER
  const to = process.env.CONTACT_TO_EMAIL || user

  if (!user || !process.env.GMAIL_APP_PASSWORD) {
    console.error(
      'GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env.local.\n' +
        'The App Password is a 16-character code from https://myaccount.google.com/apppasswords\n' +
        '(it requires 2-Step Verification to be enabled on the account first).',
    )
    process.exit(1)
  }

  console.log(`\n1/2  Authenticating with smtp.gmail.com as ${user} ...`)
  try {
    await verifyMailTransport()
    console.log('     OK - credentials accepted.')
  } catch (error) {
    console.error('     FAILED -', error instanceof Error ? error.message : error)
    console.error(
      '\n     Common causes:\n' +
        '       - using the account password instead of an App Password\n' +
        '       - 2-Step Verification not enabled on the Google account\n' +
        '       - the App Password was pasted with its spaces removed incorrectly\n' +
        '         (spaces are fine; lib/env.ts strips them)\n',
    )
    process.exit(1)
  }

  console.log(`\n2/2  Sending a test message to ${to} ...`)
  await sendContactNotification({
    name: 'Portfolio self-test',
    email: user,
    message:
      'This is the test message from `npm run test:mail`.\n\n' +
      'If you are reading it in your inbox, the contact form will deliver ' +
      'real enquiries correctly. Note the Reply-To header: replying goes to ' +
      'the visitor, not to yourself.',
    receivedAt: new Date(),
  })

  console.log(`     Sent. Check ${to} (including the spam folder on first send).\n`)
}

main().catch((error) => {
  console.error('\nMail test failed:', error)
  process.exit(1)
})
