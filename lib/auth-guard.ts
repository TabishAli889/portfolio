import 'server-only'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { auth } from '@/auth'
import type { Session } from 'next-auth'

/**
 * Re-verifies the admin session. Called at the top of every server action and
 * every /api/admin route handler — proxy protection alone is not sufficient
 * (see the comment in proxy.ts).
 *
 * `connection()` comes first on purpose. Auth.js reads `new Date()` internally
 * to check session expiry, and with `cacheComponents` enabled Next.js rejects
 * an unstable value like the current time during prerendering - it has no way
 * to know the result is request-specific until something says so. Awaiting
 * `connection()` is the documented way to say it: everything after this line
 * runs only at request time, never while building the static shell.
 *
 * Without it, every admin render logged "Next.js encountered the unstable
 * value `new Date()` while prerendering". A session read is inherently
 * request-time, so marking it as such is also simply correct.
 */
export async function getAdminSession(): Promise<Session | null> {
  await connection()

  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

/** Throws `UnauthorizedError` when the caller is not the signed-in admin. */
export async function requireAdmin(): Promise<Session> {
  const session = await getAdminSession()
  if (!session) throw new UnauthorizedError()
  return session
}

/**
 * Page-level guard. Unlike `requireAdmin`, which throws so a server action can
 * report the failure in its result, this redirects to the login screen - the
 * right behaviour for someone opening an admin URL directly.
 */
export async function requireAdminPage(): Promise<Session> {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  return session
}
