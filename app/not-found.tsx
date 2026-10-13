import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import { AuroraBackground } from '@/components/public/AuroraBackground'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-20">
      <AuroraBackground />

      <div className="glow-room text-center">
        <div className="glass glass-ring glow-halo glow-halo-magenta px-8 py-12 sm:px-14">
          <span className="inline-flex size-12 items-center justify-center rounded-xl border border-neon-magenta/35 bg-neon-magenta/10 text-neon-magenta">
            <Compass className="size-5" aria-hidden />
          </span>

          <p className="mt-6 font-mono text-sm tracking-[0.2em] text-neon-cyan/80">404</p>
          <h1 className="mt-2 text-3xl">
            <span className="text-gradient">Nothing here</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-fog-400">
            That page does not exist, or the project you are looking for is no longer published.
          </p>

          <Link href="/" className="btn btn-primary mt-8">
            <ArrowLeft className="size-4" aria-hidden />
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  )
}
