import 'server-only'

/**
 * Centralised, lazily-validated access to server environment variables.
 *
 * Why lazy (a function per group instead of one eager `envSchema.parse`)?
 * `next build` imports every module to collect metadata and prerender the
 * static shell. Validating everything at import time would make a build fail
 * on a machine that only has, say, MONGODB_URI set. Each group is therefore
 * validated at the moment it is first used, so a missing Cloudinary key breaks
 * uploads with a clear message instead of breaking the whole build.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Add it to .env.local (see .env.example) or to your Vercel project settings.`,
    )
  }
  return value.trim()
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback
}

export function dbEnv() {
  return { uri: required('MONGODB_URI') }
}

/** A bcrypt hash is always a 60-character string of this exact shape. */
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

/**
 * Validates ADMIN_PASSWORD_HASH and fails loudly if it has been corrupted.
 *
 * This guard exists because of a trap that costs real debugging time: the
 * dotenv loader Next.js uses performs variable expansion on `.env` values, and
 * it does so inside single quotes too. A bcrypt hash starts `$2b$12$...`, so
 * `$2b`, `$12` and the next `$`-prefixed run are each expanded to an empty
 * string, and the app silently receives a 15-character fragment. Every login
 * then fails with "invalid credentials" while the hash in the file looks
 * perfectly correct.
 *
 * In a `.env` file the dollars must therefore be backslash-escaped. Values set
 * in the Vercel dashboard are injected straight into `process.env` and are
 * never expanded, so there they must NOT be escaped. `npm run hash:password`
 * prints both forms.
 */
function adminPasswordHash(): string {
  const value = required('ADMIN_PASSWORD_HASH')

  if (!BCRYPT_HASH_RE.test(value)) {
    const looksExpanded = !value.startsWith('$2')

    throw new Error(
      `ADMIN_PASSWORD_HASH is not a valid bcrypt hash (got ${value.length} characters; ` +
        `a bcrypt hash is 60 and starts with "$2b$").` +
        (looksExpanded
          ? ' It looks like the leading "$2b$12$" was stripped by .env variable expansion. ' +
            'In a .env file, escape every dollar sign: ADMIN_PASSWORD_HASH="\\$2b\\$12\\$..." ' +
            'In the Vercel dashboard, paste the hash unescaped. ' +
            'Run `npm run hash:password -- "your-password"` to print both forms.'
          : ' Regenerate it with `npm run hash:password -- "your-password"`.'),
    )
  }

  return value
}

export function authEnv() {
  return {
    secret: required('AUTH_SECRET'),
    adminEmail: required('ADMIN_EMAIL').toLowerCase(),
    adminPasswordHash: adminPasswordHash(),
  }
}

export function cloudinaryEnv() {
  const uploadPreset = optional('CLOUDINARY_UPLOAD_PRESET')

  // In unsigned mode only the cloud name and the preset are needed: no API
  // key is involved, so requiring one would block the very configuration that
  // exists to work around a key problem.
  if (uploadPreset) {
    return {
      cloudName: required('CLOUDINARY_CLOUD_NAME'),
      apiKey: optional('CLOUDINARY_API_KEY'),
      apiSecret: optional('CLOUDINARY_API_SECRET'),
      uploadPreset,
    }
  }

  return {
    cloudName: required('CLOUDINARY_CLOUD_NAME'),
    apiKey: required('CLOUDINARY_API_KEY'),
    apiSecret: required('CLOUDINARY_API_SECRET'),
    uploadPreset: '',
  }
}

export function mailEnv() {
  const user = required('GMAIL_USER')
  return {
    user,
    appPassword: required('GMAIL_APP_PASSWORD').replace(/\s+/g, ''),
    to: optional('CONTACT_TO_EMAIL', user),
  }
}

/** True when mail is configured; lets the contact route degrade gracefully. */
export function hasMailConfig(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

/** True when Cloudinary is configured; lets the admin hide the uploader. */
export function hasCloudinaryConfig(): boolean {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return false

  // Either an unsigned preset, or a full signing key pair.
  return Boolean(
    process.env.CLOUDINARY_UPLOAD_PRESET ||
      (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  )
}

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '')
