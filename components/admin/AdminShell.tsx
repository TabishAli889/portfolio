'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Inbox, LogOut, Menu, PanelsTopLeft, X, ExternalLink } from 'lucide-react'
import { NAV_RESOURCES } from '@/lib/resources'
import { Icon } from '@/components/ui/Icon'

/**
 * Admin chrome: a fixed sidebar on desktop, a slide-over on mobile.
 *
 * The nav is generated from the resource registry, so a new content type
 * appears here automatically.
 */
export function AdminShell({
  email,
  unreadCount,
  children,
}: {
  email: string
  unreadCount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const nav = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <Link
        href="/admin"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
          isActive('/admin') && pathname === '/admin'
            ? 'bg-neon-cyan/12 text-fog-50 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]'
            : 'text-fog-400 hover:bg-ink-800/70 hover:text-fog-100'
        }`}
      >
        <PanelsTopLeft className="size-4 shrink-0" aria-hidden />
        Overview
      </Link>

      <Link
        href="/admin/inbox"
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
          isActive('/admin/inbox')
            ? 'bg-neon-cyan/12 text-fog-50 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]'
            : 'text-fog-400 hover:bg-ink-800/70 hover:text-fog-100'
        }`}
      >
        <Inbox className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">Inbox</span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-neon-magenta/20 px-2 py-0.5 text-xs font-medium text-neon-magenta ring-1 ring-neon-magenta/40">
            {unreadCount}
          </span>
        )}
      </Link>

      <p className="mt-5 mb-1 px-3 text-[0.68rem] font-semibold tracking-[0.14em] text-fog-500 uppercase">
        Content
      </p>

      {NAV_RESOURCES.map((resource) => {
        const href = `/admin/${resource.slug}`
        return (
          <Link
            key={resource.key}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              isActive(href)
                ? 'bg-neon-cyan/12 text-fog-50 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]'
                : 'text-fog-400 hover:bg-ink-800/70 hover:text-fog-100'
            }`}
          >
            <Icon name={resource.icon} className="size-4 shrink-0" />
            {resource.plural}
          </Link>
        )
      })}

      <div className="mt-auto space-y-2 pt-6">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fog-400 transition-colors hover:bg-ink-800/70 hover:text-fog-100"
        >
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          View live site
        </Link>

        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-3">
          <p className="truncate text-xs text-fog-500" title={email}>
            {email}
          </p>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: '/admin/login' })}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-ink-600 px-3 py-2 text-xs text-fog-300 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut className="size-3.5" aria-hidden />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-dvh bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="glass-blur sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-ink-700/80 bg-ink-900/70 lg:block">
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-700/80 px-5">
          <span className="size-2.5 rounded-full bg-neon-cyan shadow-[0_0_12px_2px_rgba(34,211,238,0.8)]" />
          <span className="font-display text-sm font-semibold tracking-wide text-fog-50">
            Content studio
          </span>
        </div>
        {nav}
      </aside>

      {/* Mobile slide-over */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/80"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-ink-700 bg-ink-900">
            <div className="flex h-16 items-center justify-between border-b border-ink-700 px-5">
              <span className="font-display text-sm font-semibold text-fog-50">
                Content studio
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-fog-400 hover:bg-ink-800 hover:text-fog-100"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-blur sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-ink-700/80 bg-ink-950/85 px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg border border-ink-600 p-2 text-fog-300 hover:bg-ink-800"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="font-display text-sm font-semibold text-fog-50">Content studio</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
