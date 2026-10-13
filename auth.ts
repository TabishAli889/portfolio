import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'
import { authEnv } from './lib/env'
import { clientIp, rateLimit, resetRateLimit } from './lib/rate-limit'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
})

/** Thrown with a stable code so the login form can show a useful message. */
class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

/**
 * A bcrypt hash of a throwaway string. When the submitted email does not match
 * the admin we still run one comparison against this, so a wrong email and a
 * wrong password take the same amount of time and the endpoint does not leak
 * which one was wrong through timing.
 */
const DUMMY_HASH = '$2b$12$ZA2V2c6pVt.elp8XUzO1RONrytZc6OvNhKn8OQuPz7M4q9CfcvVYa'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) throw new LoginError('invalid_input')

        // Rate limit per IP: 5 attempts per 10 minutes.
        const ip = clientIp(request.headers)
        const key = `login:${ip}`
        const limit = rateLimit(key, { limit: 5, windowMs: 10 * 60 * 1000 })
        if (!limit.success) throw new LoginError('rate_limited')

        const { adminEmail, adminPasswordHash } = authEnv()
        const email = parsed.data.email.trim().toLowerCase()
        const emailMatches = email === adminEmail

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          emailMatches ? adminPasswordHash : DUMMY_HASH,
        )

        if (!emailMatches || !passwordMatches) {
          throw new LoginError('invalid_credentials')
        }

        resetRateLimit(key)

        return {
          id: 'admin',
          email: adminEmail,
          name: 'Admin',
          role: 'admin',
        }
      },
    }),
  ],
})
