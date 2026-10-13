/**
 * Generates the bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 *   npm run hash:password -- "my super secret password"
 *
 * The plain password is never written to disk by this script.
 *
 * Two forms are printed on purpose. A bcrypt hash contains `$` characters, and
 * the dotenv loader Next.js uses expands `$NAME` sequences in `.env` files -
 * even inside single quotes - which silently shortens the hash to a fragment
 * and makes every login fail with "invalid credentials". So:
 *
 *   - in a .env file the dollars must be backslash-escaped,
 *   - in the Vercel dashboard the value is injected verbatim and must not be.
 */
import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Usage: npm run hash:password -- "your-password"')
  process.exit(1)
}

if (password.length < 12) {
  console.error(
    `Refusing to hash a ${password.length}-character password. Use at least 12 characters.`,
  )
  process.exit(1)
}

// Wrapped in a function rather than using top-level await: package.json has no
// "type": "module", so tsx compiles these scripts as CommonJS.
async function main(plain: string) {
  const hash = await bcrypt.hash(plain, 12)
  const escaped = hash.replaceAll('$', '\\$')

  console.log(`
Paste into .env.local  (dollars escaped - required, see note below)
-------------------------------------------------------------------
ADMIN_PASSWORD_HASH="${escaped}"

Paste into the Vercel dashboard  (raw, do NOT escape)
-------------------------------------------------------------------
${hash}

Why two forms: .env files go through variable expansion, so an unescaped
"$2b$12$..." is partially eaten and logins fail even though the file looks
right. Vercel injects env vars directly and never expands them.
`)
}

main(password).catch((error) => {
  console.error('Could not hash the password:', error)
  process.exit(1)
})
