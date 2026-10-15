import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "./mongodb";
import { toPlain, toPlainList } from "./serialize";
import { CACHE_TAGS } from "./cache-tags";
import { SINGLETON_KEY } from "@/models/common";
import {
  About as AboutModel,
  Certification as CertificationModel,
  Education as EducationModel,
  Experience as ExperienceModel,
  Hero as HeroModel,
  Project as ProjectModel,
  SiteSettings as SiteSettingsModel,
  Skill as SkillModel,
  SkillCategory as SkillCategoryModel,
  SocialLink as SocialLinkModel,
} from "@/models";
import type {
  About,
  Certification,
  Education,
  Experience,
  Hero,
  Project,
  SiteSettings,
  SkillGroup,
  SocialLink,
} from "./content-types";

/**
 * Cached readers for the public site.
 *
 * Every function is a `use cache` scope tagged with its content type, so the
 * home page is prerendered into a static shell and visitors never wait on
 * MongoDB. Saving in the admin calls `updateTag` with the same tags (see
 * lib/actions.ts), which is what makes an edit show up immediately.
 *
 * `cacheLife('max')` is deliberate: the data only ever changes through the
 * admin, and the admin purges the tag itself, so there is no reason to let an
 * entry expire on a timer. That also means a quiet site makes almost no
 * database queries - which is exactly why /api/health exists to keep the
 * free-tier Atlas cluster from auto-pausing.
 *
 * Only `published: true` documents are ever returned here. Drafts exist only
 * inside the admin.
 */

const PUBLISHED = { published: true } as const;
const BY_ORDER = { order: 1, createdAt: 1 } as const;

// --- Defaults -------------------------------------------------------------
// A brand-new database has no documents. Returning a filled-in default keeps
// the public site renderable (and the build green) before the seed script runs.

const DEFAULT_HERO: Hero = {
  greeting: "",
  name: "Your Name",
  roles: [],
  tagline: "",
  imageUrl: "",
  imageAlt: "",
  primaryCtaLabel: "View my work",
  primaryCtaHref: "#projects",
  secondaryCtaLabel: "Get in touch",
  secondaryCtaHref: "#contact",
  showResumeButton: false,
};

const DEFAULT_ABOUT: About = {
  heading: "About me",
  paragraphs: [],
  facts: [],
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Portfolio",
  tagline: "",
  seoTitle: "Portfolio",
  seoDescription: "",
  resumeUrl: "",
  resumeFileName: "resume.pdf",
  email: "",
  location: "",
  ogImageUrl: "",
  footerNote: "",
};

// --- Singletons -----------------------------------------------------------

export async function getHero(): Promise<Hero> {
  "use cache";
  cacheTag(CACHE_TAGS.hero);
  cacheLife("max");

  await connectToDatabase();
  const doc = await HeroModel.findOne({ key: SINGLETON_KEY }).lean();
  if (!doc) return DEFAULT_HERO;

  return { ...DEFAULT_HERO, ...toPlain<Partial<Hero>>(doc) };
}

export async function getAbout(): Promise<About> {
  "use cache";
  cacheTag(CACHE_TAGS.about);
  cacheLife("max");

  await connectToDatabase();
  const doc = await AboutModel.findOne({ key: SINGLETON_KEY }).lean();
  if (!doc) return DEFAULT_ABOUT;

  return { ...DEFAULT_ABOUT, ...toPlain<Partial<About>>(doc) };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife("max");

  await connectToDatabase();
  const doc = await SiteSettingsModel.findOne({ key: SINGLETON_KEY }).lean();
  if (!doc) return DEFAULT_SETTINGS;

  return { ...DEFAULT_SETTINGS, ...toPlain<Partial<SiteSettings>>(doc) };
}

// --- Collections ----------------------------------------------------------

/**
 * Skills nested under their category, with empty categories dropped so the
 * public section never renders a heading with nothing under it.
 */
export async function getSkillGroups(): Promise<SkillGroup[]> {
  "use cache";
  cacheTag(CACHE_TAGS.skills, CACHE_TAGS.skillCategories);
  cacheLife("max");

  await connectToDatabase();

  const [categories, skills] = await Promise.all([
    SkillCategoryModel.find(PUBLISHED).sort(BY_ORDER).lean(),
    SkillModel.find(PUBLISHED).sort(BY_ORDER).lean(),
  ]);

  const plainCategories = toPlainList<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>(categories);

  const plainSkills = toPlainList<{
    id: string;
    name: string;
    level: number;
    icon: string;
    category: string;
  }>(skills);

  return plainCategories
    .map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon ?? "",
      description: category.description ?? "",
      skills: plainSkills
        .filter((skill) => skill.category === category.id)
        .map(({ id, name, level, icon }) => ({
          id,
          name,
          level,
          icon: icon ?? "",
        })),
    }))
    .filter((group) => group.skills.length > 0);
}

export async function getExperience(): Promise<Experience[]> {
  "use cache";
  cacheTag(CACHE_TAGS.experience);
  cacheLife("max");

  await connectToDatabase();
  const docs = await ExperienceModel.find(PUBLISHED).sort(BY_ORDER).lean();
  return toPlainList<Experience>(docs);
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("minutes");

  await connectToDatabase();
  const docs = await ProjectModel.find(PUBLISHED).sort(BY_ORDER).lean();
  return toPlainList<Project>(docs);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("minutes");

  await connectToDatabase();
  const doc = await ProjectModel.findOne({ ...PUBLISHED, slug }).lean();
  return doc ? toPlain<Project>(doc) : null;
}

/** Slugs for `generateStaticParams`, so every project detail page prerenders. */
export async function getProjectSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  cacheLife("max");

  await connectToDatabase();
  const docs = await ProjectModel.find(PUBLISHED)
    .select("slug")
    .sort(BY_ORDER)
    .lean<{ slug: string }[]>();
  return docs.map((doc) => doc.slug);
}

export async function getEducation(): Promise<Education[]> {
  "use cache";
  cacheTag(CACHE_TAGS.education);
  cacheLife("max");

  await connectToDatabase();
  const docs = await EducationModel.find(PUBLISHED).sort(BY_ORDER).lean();
  return toPlainList<Education>(docs);
}

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheTag(CACHE_TAGS.certifications);
  cacheLife("max");

  await connectToDatabase();
  const docs = await CertificationModel.find(PUBLISHED).sort(BY_ORDER).lean();
  return toPlainList<Certification>(docs);
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  "use cache";
  cacheTag(CACHE_TAGS.socialLinks);
  cacheLife("max");

  await connectToDatabase();
  const docs = await SocialLinkModel.find(PUBLISHED).sort(BY_ORDER).lean();
  return toPlainList<SocialLink>(docs);
}

/**
 * The footer's copyright year.
 *
 * `new Date()` is an unstable value that `cacheComponents` will not prerender,
 * so it is read inside a cache scope with a one-day lifetime: long enough that
 * it is effectively free, short enough that the year is never stale by more
 * than a day.
 */
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");

  return new Date().getFullYear();
}
