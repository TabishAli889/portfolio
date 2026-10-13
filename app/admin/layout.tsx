import { Suspense } from 'react'
import { getAdminSession } from '@/lib/auth-guard'
import { countUnreadMessages } from '@/lib/admin-data'
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminSkeleton } from '@/components/admin/AdminSkeleton'

export const metadata = {
  title: 'Content studio',
  // The admin must never be indexed.
  robots: { index: false, follow: false, nocache: true },
}

/**
 * This layout function is deliberately **synchronous**.
 *
 * With `cacheComponents` enabled, awaiting the session at a layout's top level
 * is an error: it holds the entire segment - `{children}` included - behind a
 * request-time read, so Next.js has no static shell to prerender. That is what
 * produced "Next.js encountered the unstable value `new Date()`" and then
 * `blocking-prerender-dynamic` pointing at `getAdminSession`.
 *
 * The documented fix is to push the request-time read into a component inside
 * a `<Suspense>` boundary, which is what `<AdminGuard>` below is. The skeleton
 * is the static shell; the real dashboard streams in once the session
 * resolves. Pages nested under here render as `children` of the guard, so they
 * sit inside the same boundary and their own session checks are covered too.
 */
export const instant = false

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  )
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  /**
   * The login page lives at /admin/login, inside this segment. Redirecting
   * here when there is no session would therefore loop, so instead the shell
   * is skipped and the child renders standalone. Authorisation is not weakened
   * by this: proxy.ts redirects unauthenticated /admin requests before they
   * arrive, and every admin page additionally calls `requireAdminPage()`.
   */
  if (!session) return <>{children}</>

  const unreadCount = await countUnreadMessages()

  return (
    <AdminShell email={session.user?.email ?? 'admin'} unreadCount={unreadCount}>
      {children}
    </AdminShell>
  )
}
