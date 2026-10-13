import { getAdminSession } from '@/lib/auth-guard'
import { countUnreadMessages } from '@/lib/admin-data'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Content studio',
  // The admin must never be indexed.
  robots: { index: false, follow: false, nocache: true },
}

/**
 * `instant = false` tells Next.js not to expect an instantly-navigable static
 * shell here. Every admin screen reads the session at request time, which by
 * definition cannot be prerendered - so this opts the whole segment out of
 * instant-navigation validation rather than wrapping each page in Suspense,
 * for a dashboard where a server round trip is perfectly acceptable.
 */
export const instant = false

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
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
