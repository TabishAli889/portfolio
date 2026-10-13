/**
 * Plain, serializable shapes handed to the public components.
 *
 * These are what `use cache` stores and what crosses the RSC boundary, so
 * every field is a primitive, a string array or a plain object - never an
 * ObjectId, a Date or a Mongoose document.
 */

export type Hero = {
  greeting: string
  name: string
  roles: string[]
  tagline: string
  imageUrl: string
  imageAlt: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  showResumeButton: boolean
}

export type About = {
  heading: string
  paragraphs: string[]
  facts: { label: string; value: string }[]
}

export type SiteSettings = {
  siteName: string
  tagline: string
  seoTitle: string
  seoDescription: string
  resumeUrl: string
  resumeFileName: string
  email: string
  location: string
  ogImageUrl: string
  footerNote: string
}

export type Skill = {
  id: string
  name: string
  level: number
  icon: string
}

export type SkillGroup = {
  id: string
  name: string
  icon: string
  description: string
  skills: Skill[]
}

export type Experience = {
  id: string
  role: string
  company: string
  companyUrl: string
  location: string
  employmentType: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
  techTags: string[]
}

export type Project = {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  techTags: string[]
  imageUrl: string
  imageAlt: string
  liveUrl: string
  githubUrl: string
  featured: boolean
  role: string
  year: string
  highlights: string[]
}

export type Education = {
  id: string
  degree: string
  institution: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  grade: string
  description: string
}

export type Certification = {
  id: string
  title: string
  issuer: string
  issueDate: string
  credentialId: string
  credentialUrl: string
  imageUrl: string
}

export type SocialLink = {
  id: string
  label: string
  url: string
  icon: string
}

export type AdminMessage = {
  id: string
  name: string
  email: string
  message: string
  read: boolean
  emailSent: boolean
  emailError: string
  createdAt: string
}
