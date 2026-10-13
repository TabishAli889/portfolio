import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

/**
 * First line of defence for /admin (Next.js 16 renamed `middleware` to `proxy`).
 *
 * This is intentionally only the *first* line: proxy can be bypassed in some
 * deployment topologies and does not run for direct server-action invocations,
 * so every server action and API route re-checks the session itself via
 * `requireAdmin()` in lib/auth-guard.ts.
 */
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  /**
   * Run on admin pages and admin APIs only. Everything else — including
   * _next/static, _next/image, the Auth.js endpoints themselves and public
   * assets — is skipped so proxy can never block CSS, JS or images.
   */
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
