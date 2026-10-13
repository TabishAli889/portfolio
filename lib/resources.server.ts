import 'server-only'
import type { Model } from 'mongoose'
import {
  About,
  Certification,
  Education,
  Experience,
  Hero,
  Project,
  Skill,
  SkillCategory,
  SiteSettings,
  SocialLink,
} from '@/models'
import { CACHE_TAGS } from './cache-tags'
import type { ResourceKey } from './resources'

/**
 * Server-side half of the resource registry: which Mongoose model backs each
 * resource, and which cache tag to purge when it changes.
 *
 * Split from `lib/resources.ts` so the client bundle never pulls in Mongoose.
 */

export type ResourceBinding = {
  // The models have different document shapes; the generic admin only ever
  // uses the shared Model surface (find/create/updateOne/deleteOne), so an
  // untyped document here is deliberate and contained to this map.
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  model: Model<any>
  tag: string
  /** Extra tags to purge, for resources the public site reads together. */
  alsoPurge?: string[]
}

export const RESOURCE_MODELS: Record<ResourceKey, ResourceBinding> = {
  hero: { model: Hero, tag: CACHE_TAGS.hero },
  about: { model: About, tag: CACHE_TAGS.about },
  settings: { model: SiteSettings, tag: CACHE_TAGS.settings },
  projects: { model: Project, tag: CACHE_TAGS.projects },
  // Skills are read grouped under their category, so either side changing
  // invalidates the other.
  'skill-categories': {
    model: SkillCategory,
    tag: CACHE_TAGS.skillCategories,
    alsoPurge: [CACHE_TAGS.skills],
  },
  skills: { model: Skill, tag: CACHE_TAGS.skills, alsoPurge: [CACHE_TAGS.skillCategories] },
  experience: { model: Experience, tag: CACHE_TAGS.experience },
  education: { model: Education, tag: CACHE_TAGS.education },
  certifications: { model: Certification, tag: CACHE_TAGS.certifications },
  'social-links': { model: SocialLink, tag: CACHE_TAGS.socialLinks },
}

/** Every tag a change to `key` should purge. */
export function tagsFor(key: ResourceKey): string[] {
  const binding = RESOURCE_MODELS[key]
  return [binding.tag, ...(binding.alsoPurge ?? [])]
}
