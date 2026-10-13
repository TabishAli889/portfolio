/**
 * Cache tags shared between the public readers (which attach them with
 * `cacheTag`) and the admin server actions (which purge them with `updateTag`).
 *
 * Keeping them in one plain module — no 'server-only', no imports — means both
 * sides agree on the exact strings and a typo becomes a type error.
 */
export const CACHE_TAGS = {
  hero: 'hero',
  about: 'about',
  settings: 'settings',
  skills: 'skills',
  skillCategories: 'skill-categories',
  experience: 'experience',
  projects: 'projects',
  education: 'education',
  certifications: 'certifications',
  socialLinks: 'social-links',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]
