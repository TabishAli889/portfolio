import type { ZodObject, ZodRawShape } from 'zod'
import {
  aboutSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  heroSchema,
  projectSchema,
  siteSettingsSchema,
  skillCategorySchema,
  skillSchema,
  socialLinkSchema,
} from './schemas'

/**
 * The admin is generated from this registry rather than hand-written per
 * content type - the Django-admin idea the brief asked for. Adding a field
 * means adding one descriptor here; the list view, the form, the validation
 * and the server action all pick it up automatically.
 *
 * Client-safe on purpose: no Mongoose, no 'server-only'. The model bindings
 * live in `lib/resources.server.ts`.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'number'
  | 'boolean'
  | 'slug'
  | 'url'
  | 'email'
  | 'image'
  | 'pdf'
  | 'stringList'
  | 'tags'
  | 'keyValueList'
  | 'ref'

export type FieldDescriptor = {
  name: string
  label: string
  type: FieldType
  help?: string
  placeholder?: string
  rows?: number
  /** Render two fields side by side on wide screens. */
  half?: boolean
  /** For `ref`: which resource supplies the options. */
  refResource?: ResourceKey
  min?: number
  max?: number
}

export type ResourceConfig = {
  key: ResourceKey
  /** URL segment under /admin. */
  slug: string
  singular: string
  plural: string
  description: string
  /** lucide-react icon name for the sidebar. */
  icon: string
  /** Singletons have exactly one document and no list view. */
  singleton: boolean
  /**
   * Typed as a ZodObject rather than the looser ZodType so @hookform/resolvers
   * can infer the form's field values from it.
   */
  schema: ZodObject<ZodRawShape>
  fields: FieldDescriptor[]
  /** Field shown as the row title in list views. */
  titleField?: string
  /** Secondary line in list views. */
  subtitleField?: string
  /** Order in the admin sidebar. */
  navOrder: number
}

export const RESOURCE_KEYS = [
  'hero',
  'about',
  'settings',
  'projects',
  'skill-categories',
  'skills',
  'experience',
  'education',
  'certifications',
  'social-links',
] as const

export type ResourceKey = (typeof RESOURCE_KEYS)[number]

const publishedField: FieldDescriptor = {
  name: 'published',
  label: 'Published',
  type: 'boolean',
  help: 'Unpublished items are hidden from the public site but kept here.',
}

export const RESOURCES: Record<ResourceKey, ResourceConfig> = {
  hero: {
    key: 'hero',
    slug: 'hero',
    singular: 'Hero',
    plural: 'Hero',
    description:
      'The first thing visitors see: your name, rotating roles and call-to-action buttons.',
    icon: 'Sparkles',
    singleton: true,
    schema: heroSchema,
    navOrder: 1,
    fields: [
      { name: 'greeting', label: 'Greeting', type: 'text', half: true, placeholder: 'Hi, I am' },
      { name: 'name', label: 'Name', type: 'text', half: true, placeholder: 'Tabish Ali' },
      {
        name: 'roles',
        label: 'Rotating roles',
        type: 'stringList',
        rows: 5,
        help: 'One role per line. These cycle through the typewriter effect.',
      },
      { name: 'tagline', label: 'Tagline', type: 'textarea', rows: 3 },
      { name: 'primaryCtaLabel', label: 'Primary button label', type: 'text', half: true },
      {
        name: 'primaryCtaHref',
        label: 'Primary button link',
        type: 'text',
        half: true,
        placeholder: '#projects',
      },
      { name: 'secondaryCtaLabel', label: 'Secondary button label', type: 'text', half: true },
      {
        name: 'secondaryCtaHref',
        label: 'Secondary button link',
        type: 'text',
        half: true,
        placeholder: '#contact',
      },
      {
        name: 'showResumeButton',
        label: 'Show resume download button',
        type: 'boolean',
        help: 'Requires a resume PDF uploaded under Site settings.',
      },
    ],
  },

  about: {
    key: 'about',
    slug: 'about',
    singular: 'About',
    plural: 'About',
    description: 'Your story, a portrait and a few quick facts.',
    icon: 'User',
    singleton: true,
    schema: aboutSchema,
    navOrder: 2,
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      {
        name: 'paragraphs',
        label: 'Paragraphs',
        type: 'stringList',
        rows: 10,
        help: 'One paragraph per line. Blank lines are ignored.',
      },
      { name: 'imageUrl', label: 'Portrait', type: 'image' },
      {
        name: 'facts',
        label: 'Quick facts',
        type: 'keyValueList',
        help: 'Small chips such as Based in / Lahore, Pakistan.',
      },
    ],
  },

  settings: {
    key: 'settings',
    slug: 'settings',
    singular: 'Site settings',
    plural: 'Site settings',
    description: 'Name, SEO metadata, contact details and the resume PDF.',
    icon: 'Settings',
    singleton: true,
    schema: siteSettingsSchema,
    navOrder: 10,
    fields: [
      { name: 'siteName', label: 'Site name', type: 'text', half: true },
      { name: 'tagline', label: 'Tagline', type: 'text', half: true },
      {
        name: 'seoTitle',
        label: 'SEO title',
        type: 'text',
        help: 'Shown in the browser tab and in search results. Aim for under 60 characters.',
      },
      {
        name: 'seoDescription',
        label: 'SEO description',
        type: 'textarea',
        rows: 3,
        help: 'The snippet under your title in search results. Aim for 150-160 characters.',
      },
      {
        name: 'resumeUrl',
        label: 'Resume PDF',
        type: 'pdf',
        help:
          'If the download returns "deny or ACL failure", enable ' +
          'Settings > Security > "Allow delivery of PDF and ZIP files" in ' +
          'Cloudinary - new accounts block PDF delivery by default.',
      },
      { name: 'resumeFileName', label: 'Resume download filename', type: 'text', half: true },
      { name: 'email', label: 'Public email', type: 'email', half: true },
      { name: 'location', label: 'Location', type: 'text', half: true },
      {
        name: 'ogImageUrl',
        label: 'Social share image',
        type: 'image',
        help: '1200x630 works best.',
      },
      { name: 'footerNote', label: 'Footer note', type: 'text' },
    ],
  },

  projects: {
    key: 'projects',
    slug: 'projects',
    singular: 'Project',
    plural: 'Projects',
    description: 'Case studies with tech tags, links and a detail page each.',
    icon: 'FolderGit2',
    singleton: false,
    schema: projectSchema,
    titleField: 'title',
    subtitleField: 'summary',
    navOrder: 3,
    fields: [
      { name: 'title', label: 'Title', type: 'text', half: true },
      {
        name: 'slug',
        label: 'Slug',
        type: 'slug',
        half: true,
        help: 'Used in the URL: /projects/your-slug',
      },
      {
        name: 'summary',
        label: 'Summary',
        type: 'textarea',
        rows: 3,
        help: 'One or two sentences, shown on the project card.',
      },
      {
        name: 'description',
        label: 'Full description',
        type: 'markdown',
        rows: 12,
        help: 'Shown on the detail page. Markdown is supported and sanitised before rendering.',
      },
      { name: 'techTags', label: 'Tech tags', type: 'tags', help: 'Comma or newline separated.' },
      {
        name: 'highlights',
        label: 'Highlights',
        type: 'stringList',
        rows: 5,
        help: 'One bullet per line.',
      },
      { name: 'imageUrl', label: 'Cover image', type: 'image' },
      {
        name: 'imageAlt',
        label: 'Image alt text',
        type: 'text',
        help: 'Describe the image for screen readers.',
      },
      { name: 'liveUrl', label: 'Live URL', type: 'url', half: true },
      { name: 'githubUrl', label: 'GitHub URL', type: 'url', half: true },
      { name: 'role', label: 'Your role', type: 'text', half: true },
      { name: 'year', label: 'Year', type: 'text', half: true, placeholder: '2025' },
      {
        name: 'featured',
        label: 'Featured',
        type: 'boolean',
        help: 'Featured projects get a larger card.',
      },
      publishedField,
    ],
  },

  'skill-categories': {
    key: 'skill-categories',
    slug: 'skill-categories',
    singular: 'Skill category',
    plural: 'Skill categories',
    description: 'Groups that skills are listed under, such as Languages or AI and ML.',
    icon: 'LayoutGrid',
    singleton: false,
    schema: skillCategorySchema,
    titleField: 'name',
    subtitleField: 'description',
    navOrder: 4,
    fields: [
      { name: 'name', label: 'Name', type: 'text', half: true },
      {
        name: 'icon',
        label: 'Icon',
        type: 'text',
        half: true,
        help: 'A lucide icon name, e.g. Code2, Brain, Database.',
      },
      { name: 'description', label: 'Description', type: 'text' },
      publishedField,
    ],
  },

  skills: {
    key: 'skills',
    slug: 'skills',
    singular: 'Skill',
    plural: 'Skills',
    description: 'Individual skills with a proficiency level, grouped by category.',
    icon: 'Code2',
    singleton: false,
    schema: skillSchema,
    titleField: 'name',
    navOrder: 5,
    fields: [
      { name: 'name', label: 'Name', type: 'text', half: true },
      {
        name: 'category',
        label: 'Category',
        type: 'ref',
        half: true,
        refResource: 'skill-categories',
      },
      {
        name: 'level',
        label: 'Proficiency',
        type: 'number',
        min: 0,
        max: 100,
        half: true,
        help: '0-100. Drives the animated bar.',
      },
      { name: 'icon', label: 'Icon', type: 'text', half: true, help: 'Optional lucide icon name.' },
      publishedField,
    ],
  },

  experience: {
    key: 'experience',
    slug: 'experience',
    singular: 'Experience',
    plural: 'Experience',
    description: 'Roles shown on the animated timeline.',
    icon: 'Briefcase',
    singleton: false,
    schema: experienceSchema,
    titleField: 'role',
    subtitleField: 'company',
    navOrder: 6,
    fields: [
      { name: 'role', label: 'Role', type: 'text', half: true },
      { name: 'company', label: 'Company', type: 'text', half: true },
      { name: 'companyUrl', label: 'Company URL', type: 'url', half: true },
      { name: 'location', label: 'Location', type: 'text', half: true },
      {
        name: 'employmentType',
        label: 'Employment type',
        type: 'text',
        half: true,
        placeholder: 'Internship',
      },
      { name: 'startDate', label: 'Start date', type: 'text', half: true, placeholder: 'Jun 2025' },
      { name: 'endDate', label: 'End date', type: 'text', half: true, placeholder: 'Sep 2025' },
      {
        name: 'current',
        label: 'Currently here',
        type: 'boolean',
        help: 'Shows Present instead of an end date.',
      },
      {
        name: 'bullets',
        label: 'Responsibilities',
        type: 'stringList',
        rows: 6,
        help: 'One bullet per line.',
      },
      { name: 'techTags', label: 'Tech tags', type: 'tags' },
      publishedField,
    ],
  },

  education: {
    key: 'education',
    slug: 'education',
    singular: 'Education',
    plural: 'Education',
    description: 'Degrees and schooling.',
    icon: 'GraduationCap',
    singleton: false,
    schema: educationSchema,
    titleField: 'degree',
    subtitleField: 'institution',
    navOrder: 7,
    fields: [
      { name: 'degree', label: 'Degree', type: 'text', half: true },
      { name: 'institution', label: 'Institution', type: 'text', half: true },
      { name: 'location', label: 'Location', type: 'text', half: true },
      { name: 'grade', label: 'Grade or CGPA', type: 'text', half: true },
      { name: 'startDate', label: 'Start date', type: 'text', half: true, placeholder: '2023' },
      { name: 'endDate', label: 'End date', type: 'text', half: true, placeholder: '2027' },
      { name: 'current', label: 'Currently studying', type: 'boolean' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
      publishedField,
    ],
  },

  certifications: {
    key: 'certifications',
    slug: 'certifications',
    singular: 'Certification',
    plural: 'Certifications',
    description: 'Courses and credentials worth showing.',
    icon: 'Award',
    singleton: false,
    schema: certificationSchema,
    titleField: 'title',
    subtitleField: 'issuer',
    navOrder: 8,
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'issuer', label: 'Issuer', type: 'text', half: true },
      { name: 'issueDate', label: 'Issued', type: 'text', half: true, placeholder: 'Mar 2025' },
      { name: 'credentialId', label: 'Credential ID', type: 'text', half: true },
      { name: 'credentialUrl', label: 'Credential URL', type: 'url', half: true },
      { name: 'imageUrl', label: 'Badge image', type: 'image' },
      publishedField,
    ],
  },

  'social-links': {
    key: 'social-links',
    slug: 'social-links',
    singular: 'Social link',
    plural: 'Social links',
    description: 'Footer and contact links.',
    icon: 'Link2',
    singleton: false,
    schema: socialLinkSchema,
    titleField: 'label',
    subtitleField: 'url',
    navOrder: 9,
    fields: [
      { name: 'label', label: 'Label', type: 'text', half: true },
      {
        name: 'icon',
        label: 'Icon',
        type: 'text',
        half: true,
        help: 'A lucide icon name: Github, Linkedin, Mail, Twitter, Globe.',
      },
      { name: 'url', label: 'URL', type: 'url' },
      publishedField,
    ],
  },
}

export const NAV_RESOURCES = Object.values(RESOURCES).sort((a, b) => a.navOrder - b.navOrder)

export function isResourceKey(value: string): value is ResourceKey {
  return (RESOURCE_KEYS as readonly string[]).includes(value)
}

export function getResource(key: string): ResourceConfig | null {
  return isResourceKey(key) ? RESOURCES[key] : null
}
