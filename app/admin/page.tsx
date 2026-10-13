import Link from 'next/link'
import { ArrowUpRight, Inbox, Plus } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth-guard'
import { getDashboardStats } from '@/lib/admin-data'
import { RESOURCES, NAV_RESOURCES } from '@/lib/resources'
import { Icon } from '@/components/ui/Icon'

export default async function AdminDashboard() {
  await requireAdminPage()
  const { counts, unread } = await getDashboardStats()

  const singletons = NAV_RESOURCES.filter((resource) => resource.singleton)

  return (
    <div className="space-y-9">
      <header>
        <h1 className="text-2xl sm:text-3xl">
          <span className="text-gradient">Content studio</span>
        </h1>
        <p className="mt-1.5 text-sm text-fog-400">
          Everything on the public site is editable here. Saving a change refreshes the live page
          straight away.
        </p>
      </header>

      {/* Inbox callout */}
      <Link
        href="/admin/inbox"
        className="glass glass-ring glow-halo group flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon-magenta/35 bg-neon-magenta/10 text-neon-magenta">
          <Inbox className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fog-50">
            {unread > 0
              ? `${unread} unread message${unread === 1 ? '' : 's'}`
              : 'No unread messages'}
          </p>
          <p className="mt-0.5 text-xs text-fog-500">
            Every contact form submission is stored here, even if the email fails to send.
          </p>
        </div>
        <ArrowUpRight
          className="size-4 shrink-0 text-fog-500 transition-colors group-hover:text-neon-magenta"
          aria-hidden
        />
      </Link>

      {/* Collection counts */}
      <section>
        <h2 className="mb-3.5 text-xs font-semibold tracking-[0.14em] text-fog-500 uppercase">
          Collections
        </h2>
        <div className="glow-room grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {counts.map((entry) => {
            const config = RESOURCES[entry.resource]
            return (
              <div
                key={entry.resource}
                className="glass glass-ring glow-halo glow-halo-violet flex flex-col p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800/80 text-neon-cyan">
                    <Icon name={config.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fog-50">{entry.label}</p>
                    <p className="mt-0.5 text-xs text-fog-500">
                      {entry.total} total
                      {entry.drafts > 0 && (
                        <span className="text-amber-300/90"> &middot; {entry.drafts} draft</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/admin/${config.slug}`}
                    className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/admin/${config.slug}/new`}
                    className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    New
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Singleton sections */}
      <section>
        <h2 className="mb-3.5 text-xs font-semibold tracking-[0.14em] text-fog-500 uppercase">
          Page content
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {singletons.map((config) => (
            <Link
              key={config.key}
              href={`/admin/${config.slug}`}
              className="glass flex items-start gap-3 p-4 transition-colors hover:border-neon-cyan/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-ink-600 bg-ink-800/80 text-neon-violet">
                <Icon name={config.icon} className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-fog-50">{config.singular}</p>
                <p className="mt-0.5 text-xs leading-snug text-fog-500">{config.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
