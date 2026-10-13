import { z } from 'zod'

/**
 * Validation schemas shared by the admin forms (via @hookform/resolvers) and
 * the server actions. One definition, so the inline field errors a user sees
 * in the browser are exactly the rules enforced on the server.
 *
 * Deliberately free of `server-only` and of any Mongoose import: this module
 * is bundled into the client.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Trimmed, length-capped text. */
const text = (max: number) => z.string().trim().max(max)
const requiredText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep ${label} under ${max} characters`)

/**
 * A URL field that is allowed to be empty. `z.url()` rejects '', and an empty
 * optional input is the normal case in this admin, so empty becomes undefined
 * before validation runs.
 */
const optionalUrl = (max = 600) =>
  z
    .union([z.literal(''), z.url({ message: 'Enter a valid URL including https://' }).max(max)])
    .default('')

const optionalEmail = () =>
  z.union([z.literal(''), z.email({ message: 'Enter a valid email address' }).max(200)]).default('')

/** Lists are edited as one-item-per-line textareas and arrive as arrays. */
const stringList = (maxItems = 50, maxLen = 500) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems).default([])

/**
 * Shared by every collection schema.
 *
 * `order` is deliberately NOT here. It is owned by drag-and-drop
 * (`reorderResource`) and by the create path, which appends new items to the
 * end. If it were part of the form schema it would arrive as its default on
 * every edit and silently reset the item's position to 0 - because no form
 * exposes an order input.
 */
const orderable = {
  published: z.coerce.boolean().default(true),
}

// --- Singletons ----------------------------------------------------------

export const heroSchema = z.object({
  greeting: text(120).default(''),
  name: requiredText(120, 'Name'),
  roles: stringList(12, 80),
  tagline: text(400).default(''),
  imageUrl: optionalUrl(),
  imageAlt: text(240).default(''),
  primaryCtaLabel: text(60).default(''),
  primaryCtaHref: text(300).default(''),
  secondaryCtaLabel: text(60).default(''),
  secondaryCtaHref: text(300).default(''),
  showResumeButton: z.coerce.boolean().default(true),
})

export const aboutSchema = z.object({
  heading: requiredText(120, 'Heading'),
  paragraphs: stringList(20, 2000),
  // No `imageUrl` here: the portrait lives on the hero now. Keeping it with a
  // `.default('')` would blank the stored value on every save of this form,
  // which is the same trap that `order` had.
  facts: z
    .array(
      z.object({
        label: requiredText(80, 'Label'),
        value: requiredText(120, 'Value'),
      }),
    )
    .max(8)
    .default([]),
})

export const siteSettingsSchema = z.object({
  siteName: requiredText(120, 'Site name'),
  tagline: text(240).default(''),
  seoTitle: text(160).default(''),
  seoDescription: text(320).default(''),
  resumeUrl: optionalUrl(),
  resumeFileName: text(160).default('resume.pdf'),
  email: optionalEmail(),
  location: text(160).default(''),
  ogImageUrl: optionalUrl(),
  footerNote: text(240).default(''),
})

// --- Collections ---------------------------------------------------------

export const skillCategorySchema = z.object({
  name: requiredText(80, 'Name'),
  icon: text(60).default(''),
  description: text(240).default(''),
  ...orderable,
})

export const skillSchema = z.object({
  name: requiredText(80, 'Name'),
  category: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Pick a category'),
  level: z.coerce.number().int().min(0, 'Minimum 0').max(100, 'Maximum 100').default(80),
  icon: text(60).default(''),
  ...orderable,
})

export const experienceSchema = z.object({
  role: requiredText(140, 'Role'),
  company: requiredText(140, 'Company'),
  companyUrl: optionalUrl(400),
  location: text(140).default(''),
  employmentType: text(60).default(''),
  startDate: text(60).default(''),
  endDate: text(60).default(''),
  current: z.coerce.boolean().default(false),
  bullets: stringList(20, 600),
  techTags: stringList(30, 40),
  ...orderable,
})

export const projectSchema = z.object({
  title: requiredText(160, 'Title'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .max(160)
    .regex(SLUG_RE, 'Use lowercase words separated by hyphens, e.g. study-buddy'),
  summary: text(400).default(''),
  description: text(20000).default(''),
  techTags: stringList(30, 40),
  imageUrl: optionalUrl(),
  imageAlt: text(240).default(''),
  liveUrl: optionalUrl(),
  githubUrl: optionalUrl(),
  featured: z.coerce.boolean().default(false),
  role: text(140).default(''),
  year: text(40).default(''),
  highlights: stringList(12, 300),
  ...orderable,
})

export const educationSchema = z.object({
  degree: requiredText(180, 'Degree'),
  institution: requiredText(180, 'Institution'),
  location: text(140).default(''),
  startDate: text(60).default(''),
  endDate: text(60).default(''),
  current: z.coerce.boolean().default(false),
  grade: text(80).default(''),
  description: text(1200).default(''),
  ...orderable,
})

export const certificationSchema = z.object({
  title: requiredText(200, 'Title'),
  issuer: text(160).default(''),
  issueDate: text(60).default(''),
  credentialId: text(160).default(''),
  credentialUrl: optionalUrl(),
  imageUrl: optionalUrl(),
  ...orderable,
})

export const socialLinkSchema = z.object({
  label: requiredText(80, 'Label'),
  url: z.url({ message: 'Enter a valid URL including https://' }).max(600),
  icon: text(60).default('Link'),
  ...orderable,
})

// --- Public contact form -------------------------------------------------

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.email({ message: 'Enter a valid email address' }).max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters')
    .max(5000, 'Please keep it under 5000 characters'),
  /**
   * Honeypot. Real users never see this field, so any value means a bot.
   *
   * Deliberately permissive: if the schema rejected a non-empty value, the bot
   * would get a 400 naming the field it tripped on, which is a free hint about
   * how to get past it next time. Validation lets it through and the API route
   * drops the submission while returning an ordinary success response.
   */
  website: z.string().max(200).optional().default(''),
})

export type ContactInput = z.infer<typeof contactSchema>
export type HeroInput = z.infer<typeof heroSchema>
export type AboutInput = z.infer<typeof aboutSchema>
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type SkillInput = z.infer<typeof skillSchema>
export type SkillCategoryInput = z.infer<typeof skillCategorySchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type EducationInput = z.infer<typeof educationSchema>
export type CertificationInput = z.infer<typeof certificationSchema>
export type SocialLinkInput = z.infer<typeof socialLinkSchema>

/** Reorder payload used by the drag-and-drop list. */
export const reorderSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(500),
})
