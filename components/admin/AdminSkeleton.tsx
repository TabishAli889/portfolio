/**
 * Static placeholder for the admin while the session is being read.
 *
 * This is what gets prerendered into the admin's static shell: no session, no
 * database, nothing request-specific. The real dashboard streams in behind a
 * Suspense boundary once the session resolves.
 */
export function AdminSkeleton() {
  return (
    <div className="flex min-h-dvh bg-ink-950" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the content studio…</span>

      {/* Sidebar placeholder */}
      <aside className="hidden h-dvh w-64 shrink-0 border-r border-ink-700/80 bg-ink-900/70 lg:block">
        <div className="flex h-16 items-center gap-2.5 border-b border-ink-700/80 px-5">
          <span className="size-2.5 animate-pulse rounded-full bg-neon-cyan/60" />
          <span className="h-3.5 w-28 animate-pulse rounded bg-ink-700" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2.5">
              <span className="size-4 shrink-0 animate-pulse rounded bg-ink-700" />
              <span
                className="h-3 animate-pulse rounded bg-ink-700"
                style={{ width: `${55 + ((index * 13) % 35)}%` }}
              />
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-ink-700/80 px-4 lg:hidden">
          <span className="size-9 animate-pulse rounded-lg bg-ink-700" />
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="h-8 w-56 animate-pulse rounded bg-ink-700" />
            <div className="h-4 w-80 animate-pulse rounded bg-ink-800" />
            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass h-16 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
