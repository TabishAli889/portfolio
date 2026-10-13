import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Sora } from 'next/font/google'
import { Toaster } from 'sonner'
import { getSiteSettings } from '@/lib/data'
import { siteUrl } from '@/lib/env'
import './globals.css'

/**
 * Font pairing: Sora for display (geometric, slightly technical - it carries
 * the neon treatment well at large sizes) against Inter for body copy, with
 * JetBrains Mono reserved for the small monospace accents. All three are
 * self-hosted by next/font, so there is no render-blocking request to Google
 * and no layout shift from a late-swapping webfont.
 */
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-code',
  display: 'swap',
  weight: ['400', '500'],
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()

  const title = settings.seoTitle || settings.siteName
  const description = settings.seoDescription || settings.tagline

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${settings.siteName}`,
    },
    description,
    applicationName: settings.siteName,
    authors: [{ name: settings.siteName }],
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      title,
      description,
      url: siteUrl,
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: '#04050a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-950">
        {children}

        <Toaster
          position="bottom-right"
          theme="dark"
          closeButton
          toastOptions={{
            classNames: {
              toast:
                'glass !bg-ink-850/95 !border-ink-600 !text-fog-100 !shadow-[0_18px_50px_-24px_rgba(34,211,238,0.5)]',
              title: '!text-fog-50 !font-medium',
              description: '!text-fog-400',
              actionButton: '!bg-neon-cyan !text-ink-950',
              closeButton: '!bg-ink-700 !border-ink-500 !text-fog-200',
            },
          }}
        />
      </body>
    </html>
  )
}
