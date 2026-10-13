'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Root error boundary.
 *
 * Shows a calm, on-theme fallback instead of a stack trace. The message from
 * the error object is deliberately not rendered: in production it could carry
 * internal detail, and it would mean nothing to a visitor either way.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-950 px-4">
      <div className="glow-room text-center">
        <div className="glass glass-ring px-8 py-12 sm:px-12">
          <span className="inline-flex size-12 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 text-amber-300">
            <AlertTriangle className="size-5" aria-hidden />
          </span>

          <h1 className="mt-6 text-2xl">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-fog-400">
            This page failed to load. Trying again usually fixes it - if it does not, the database
            may be briefly unreachable.
          </p>

          {error.digest && (
            <p className="mt-4 font-mono text-[0.7rem] text-fog-500">Reference: {error.digest}</p>
          )}

          <button type="button" onClick={reset} className="btn btn-primary mt-8">
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
