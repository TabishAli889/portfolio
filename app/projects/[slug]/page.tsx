import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Globe, UserRound } from "lucide-react";
import {
  getCurrentYear,
  getProjectBySlug,
  getProjectSlugs,
  getSiteSettings,
  getSocialLinks,
} from "@/lib/data";
import { cloudinaryImageUrl, isOptimizable } from "@/lib/images";
import { renderMarkdown, stripMarkdown } from "@/lib/markdown";
import { AuroraBackground } from "@/components/public/AuroraBackground";
import { SiteFooter } from "@/components/public/SiteFooter";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { Reveal } from "@/components/public/Reveal";

/**
 * Project detail page.
 *
 * `generateStaticParams` prerenders every published project at build time.
 * A slug added later still works - the route falls through to an on-demand
 * render, and the cached reader it uses is tagged `projects`, so publishing
 * from the admin refreshes it immediately.
 */
export async function generateStaticParams() {
  /**
   * A throw here fails the whole build with "Failed to collect page data",
   * which is a confusing way to report that the database was unreachable. The
   * list of slugs is only a prerender optimisation, so an empty list is a
   * perfectly valid answer: every project still renders on demand on first
   * request, and `getProjectBySlug` is tagged `projects`, so an admin save
   * refreshes it exactly as it would a prerendered page.
   *
   * Deliberately NOT applied to the cached readers in lib/data.ts. Those run
   * under `cacheLife('max')`, so swallowing an error there would cache an
   * empty site permanently - far worse than a failed deploy.
   */
  try {
    const slugs = await getProjectSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error(
      "[projects] Could not list project slugs, so none were prerendered. " +
        "They will render on demand instead.",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
  ]);

  if (!project) return { title: "Project not found" };

  const description =
    project.summary ||
    stripMarkdown(project.description) ||
    settings.seoDescription;

  return {
    title: project.title,
    description,
    openGraph: {
      title: `${project.title} · ${settings.siteName}`,
      description,
      type: "article",
      images: project.imageUrl ? [{ url: project.imageUrl }] : undefined,
    },
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;

  const [project, settings, socialLinks, year] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
    getSocialLinks(),
    getCurrentYear(),
  ]);

  if (!project) notFound();

  const html = await renderMarkdown(project.description);

  return (
    <>
      <AuroraBackground withGrid={false} />

      <main className="relative flex-1 pt-24 pb-10">
        <article className="shell max-w-3xl">
          <Reveal>
            <Link
              href="/#projects"
              className="inline-flex items-center gap-1.5 text-sm text-fog-500 transition-colors hover:text-neon-cyan"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All projects
            </Link>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-6 text-[clamp(2rem,6vw,3.1rem)]">
              <span className="text-gradient">{project.title}</span>
            </h1>
          </Reveal>

          {project.summary && (
            <Reveal delay={0.1}>
              <p className="mt-4 text-lg leading-relaxed text-fog-300">
                {project.summary}
              </p>
            </Reveal>
          )}

          {/* Meta row */}
          <Reveal delay={0.14}>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-fog-500">
              {project.year && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {project.year}
                </span>
              )}
              {project.role && (
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-3.5" aria-hidden />
                  {project.role}
                </span>
              )}
            </div>
          </Reveal>

          {/* Links */}
          {(project.liveUrl || project.githubUrl) && (
            <Reveal delay={0.18}>
              <div className="glow-room mt-7 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    <Globe className="size-4" aria-hidden />
                    Visit live site
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    <GithubIcon className="size-4" />
                    View source
                  </a>
                )}
              </div>
            </Reveal>
          )}

          {/* Cover image */}
          {project.imageUrl && (
            <Reveal delay={0.22} className="glow-room mt-10">
              <div className="glass glass-ring glow-halo p-2">
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-ink-800">
                  <Image
                    src={cloudinaryImageUrl(project.imageUrl, {
                      width: 1600,
                      height: 900,
                    })}
                    alt={project.imageAlt || `${project.title} screenshot`}
                    fill
                    sizes="(max-width: 768px) 92vw, 768px"
                    priority
                    className="object-cover"
                    unoptimized={!isOptimizable(project.imageUrl)}
                  />
                </div>
              </div>
            </Reveal>
          )}

          {/* Tech + highlights */}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            { (project.techTags || []).length > 0 && (
              <Reveal>
                <h2 className="font-mono text-xs tracking-[0.18em] text-neon-cyan/80 uppercase">
                  Built with
                </h2>
                <ul className="mt-3.5 flex flex-wrap gap-1.5">
                  {project.techTags.map((tag) => (
                    <li key={tag} className="chip chip-interactive">
                      {tag}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            { (project.highlights || []).length > 0 && (
              <Reveal delay={0.06}>
                <h2 className="font-mono text-xs tracking-[0.18em] text-neon-violet/80 uppercase">
                  Highlights
                </h2>
                <ul className="mt-3.5 space-y-2">
                  {project.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 text-sm leading-relaxed text-fog-300"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.5em] size-1 shrink-0 rounded-full bg-neon-violet/80"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>

          {/* Body */}
          {html && (
            <Reveal delay={0.08}>
              <div className="mt-12 border-t border-ink-700/70 pt-10">
                {/*
                  `html` has been through marked and then DOMPurify with an
                  explicit tag allow-list (see lib/markdown.ts), so no script,
                  iframe, style or event handler can survive into this markup.
                */}
                <div
                  className="prose-neon"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ink-700/70 pt-8">
              <Link href="/#projects" className="btn btn-ghost">
                <ArrowLeft className="size-4" aria-hidden />
                Back to all projects
              </Link>
              <Link href="/#contact" className="btn btn-primary">
                Get in touch
              </Link>
            </div>
          </Reveal>
        </article>
      </main>

      <SiteFooter settings={settings} socialLinks={socialLinks} year={year} />
    </>
  );
}
