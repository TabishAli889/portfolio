import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { LoginForm } from '@/components/admin/LoginForm'
import { AuroraBackground } from '@/components/public/AuroraBackground'

export const metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export const instant = false

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-16">
      <AuroraBackground />

      {/* glow-room gives the card's halo somewhere to paint. */}
      <div className="glow-room relative w-full max-w-md">
        <div className="glass glass-ring glow-halo glow-halo-violet p-7 sm:p-9">
          <span className="inline-flex size-11 items-center justify-center rounded-xl border border-neon-cyan/35 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_26px_-8px_rgba(34,211,238,0.75)]">
            <Lock className="size-5" aria-hidden />
          </span>

          <h1 className="mt-5 text-2xl">
            <span className="text-gradient">Content studio</span>
          </h1>
          <p className="mt-1.5 mb-7 text-sm text-fog-400">
            Sign in to edit your portfolio content.
          </p>

          <LoginForm />
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-fog-500 transition-colors hover:text-fog-200"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to the site
        </Link>
      </div>
    </div>
  )
}
