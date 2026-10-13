import 'server-only'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { Session } from 'next-auth'

/**
 * Re-verifies the admin session. Called at the top of every server action and
 * every /api/admin route handler — proxy protection alone is not sufficient
 * (see the comment in proxy.ts).
 */
export async function getAdminSession(): Promise<Session | null> {
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
