import Link from "next/link";
import { ArrowUp } from "lucide-react";
import type { SiteSettings, SocialLink } from "@/lib/content-types";
import { Icon } from "@/components/ui/Icon";

export function SiteFooter({
  settings,
  socialLinks,
  year,
}: {
  settings: Pick<SiteSettings, "siteName" | "tagline" | "footerNote">;
  socialLinks: SocialLink[];
  /** Passed in from a cached reader - see getCurrentYear in lib/data.ts. */
  year: number;
}) {
  return (
    <footer className="relative border-t border-ink-700/70 py-12">
      <div className="shell">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-fog-50">
              {settings.siteName}
              <span className="text-neon-cyan">.</span>
            </p>
            {settings.tagline && (
              <p className="mt-1.5 max-w-sm text-sm text-fog-400">
                {settings.tagline}
              </p>
            )}
          </div>

          {socialLinks.length > 0 && (
            <nav
              aria-label="Social links"
              className="glow-room flex flex-wrap gap-2"
            >
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="glass glow-halo flex size-10 items-center justify-center text-fog-400 transition-colors hover:text-neon-cyan"
                >
                  <Icon name={link.icon} className="size-4" />
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-ink-700/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fog-500">
            &copy; {year} {settings.siteName}.
            {settings.footerNote && (
              <span className="ml-1.5">{settings.footerNote}</span>
            )}
          </p>

          <div className="flex items-center gap-5">
            {/*
              The admin link is here rather than hidden: it is protected by
              auth, and a visible entry point is far more convenient than
              remembering the URL. Search engines are kept away by the
              `robots` metadata on the admin layout.
            */}
            <Link
              href="/admin"
              className="text-xs text-fog-500 transition-colors hover:text-fog-200"
            >
              Admin
            </Link>

            <a
              href="#top"
              className="inline-flex items-center gap-1.5 text-xs text-fog-500 transition-colors hover:text-neon-cyan"
            >
              Back to top
              <ArrowUp className="size-3" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
