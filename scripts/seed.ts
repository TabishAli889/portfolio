/**
 * Seeds the database with Tabish Ali's content so the site looks complete on
 * first run.
 *
 *   npm run seed            # fills empty collections, leaves existing data alone
 *   npm run seed -- --reset # wipes the portfolio collections first
 *
 * Contact messages are never touched by either mode - deleting real enquiries
 * as a side effect of re-seeding content would be unforgivable.
 */
import mongoose from 'mongoose'
import {
  About,
  Certification,
  Education,
  Experience,
  Hero,
  Project,
  SiteSettings,
  Skill,
  SkillCategory,
  SocialLink,
  SINGLETON_KEY,
} from '../models'

const RESET = process.argv.includes('--reset')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Create .env.local from .env.example first.')
  process.exit(1)
}

// --- Content --------------------------------------------------------------

const hero = {
  key: SINGLETON_KEY,
  greeting: 'Hi, I am',
  name: 'Tabish Ali',
  roles: [
    'AI Engineer',
    'Full-Stack Developer',
    'RAG Systems Builder',
    'Final-Year CS Student',
  ],
  tagline:
    'I build AI systems that actually ship - retrieval pipelines, local-first assistants and the web apps around them.',
  primaryCtaLabel: 'View my work',
  primaryCtaHref: '#projects',
  secondaryCtaLabel: 'Get in touch',
  secondaryCtaHref: '#contact',
  showResumeButton: true,
}

const about = {
  key: SINGLETON_KEY,
  heading: 'About me',
  paragraphs: [
    'I am a final-year Computer Science student at the University of Management and Technology in Lahore, focused on applied AI engineering - the unglamorous part where a model becomes a product people can rely on.',
    'Most of my work sits around retrieval-augmented generation: chunking and embedding strategies, vector search, prompt orchestration with LangChain, and FastAPI services to put it all behind a clean interface. As an AI Engineering Intern at Excellence Code Solutions I built RAG systems end to end, from document ingestion through to evaluation.',
    'I care about systems that degrade gracefully. Kalvara, my local-first AI assistant, falls back across multiple providers so a dead API key never means a dead app. That instinct - plan for the failure, not the demo - is what I bring to a team.',
  ],
  imageUrl: '',
  facts: [
    { label: 'Based in', value: 'Lahore, Pakistan' },
    { label: 'Focus', value: 'Applied AI & RAG' },
    { label: 'Studying', value: 'BS Computer Science, UMT' },
    { label: 'Open to', value: 'AI engineering roles' },
  ],
}

const siteSettings = {
  key: SINGLETON_KEY,
  siteName: 'Tabish Ali',
  tagline: 'AI Engineer & Full-Stack Developer',
  seoTitle: 'Tabish Ali - AI Engineer & Full-Stack Developer',
  seoDescription:
    'Final-year CS student and AI engineering intern in Lahore. I build RAG systems, local-first AI assistants and the full-stack apps around them with Python, FastAPI, LangChain and Next.js.',
  resumeUrl: '',
  resumeFileName: 'Tabish-Ali-Resume.pdf',
  email: '',
  location: 'Lahore, Pakistan',
  ogImageUrl: '',
  footerNote: 'Built with Next.js, MongoDB and far too much coffee.',
}

const skillCategories = [
  {
    name: 'Languages',
    icon: 'Code2',
    description: 'What I write day to day.',
    order: 0,
    skills: [
      { name: 'Python', level: 92 },
      { name: 'TypeScript', level: 85 },
      { name: 'JavaScript', level: 88 },
      { name: 'SQL', level: 80 },
    ],
  },
  {
    name: 'AI & Machine Learning',
    icon: 'Brain',
    description: 'Retrieval, orchestration and evaluation.',
    order: 1,
    skills: [
      { name: 'RAG Systems', level: 90 },
      { name: 'LangChain', level: 88 },
      { name: 'Vector Databases', level: 84 },
      { name: 'Prompt Engineering', level: 86 },
    ],
  },
  {
    name: 'Frameworks',
    icon: 'Rocket',
    description: 'How the work reaches people.',
    order: 2,
    skills: [
      { name: 'FastAPI', level: 90 },
      { name: 'Next.js', level: 84 },
      { name: 'React', level: 86 },
      { name: 'Node.js', level: 78 },
    ],
  },
  {
    name: 'Data & Infrastructure',
    icon: 'Database',
    description: 'Storage, containers and version control.',
    order: 3,
    skills: [
      { name: 'MongoDB', level: 82 },
      { name: 'PostgreSQL', level: 76 },
      { name: 'Docker', level: 75 },
      { name: 'Git', level: 88 },
    ],
  },
]

const experience = [
  {
    role: 'AI Engineering Intern',
    company: 'Excellence Code Solutions',
    location: 'Lahore, Pakistan',
    employmentType: 'Internship',
    startDate: 'Jun 2025',
    endDate: '',
    current: true,
    bullets: [
      'Built retrieval-augmented generation pipelines end to end: document ingestion, chunking, embedding and vector search over client knowledge bases.',
      'Orchestrated multi-step LLM workflows with LangChain, including tool use and structured output parsing for downstream services.',
      'Exposed the pipelines as FastAPI services with request validation, streaming responses and structured logging.',
      'Tuned chunk sizes, overlap and retrieval depth against a hand-labelled question set, measurably improving answer relevance over the first naive implementation.',
      'Containerised the services with Docker so the same image runs locally and in staging.',
    ],
    techTags: ['Python', 'LangChain', 'FastAPI', 'Vector Databases', 'Docker'],
    order: 0,
  },
]

const projects = [
  {
    title: 'Kalvara',
    slug: 'kalvara',
    summary:
      'A local-first AI chat assistant with multi-provider fallback, vision and real-time voice - built so a single dead API key never takes the app down.',
    description: `Kalvara is a desktop-class AI assistant that treats the network as unreliable by design.

## Why it exists

Most AI chat apps assume one provider, one API key and a working connection. The moment any of those fails, the product fails. Kalvara inverts that: local models run first where they can, and remote providers are a tier in a fallback chain rather than a hard dependency.

## How it works

- **Multi-provider fallback.** Requests walk an ordered chain of providers. A timeout, a rate limit or a 500 demotes a provider and the request continues down the chain instead of surfacing an error.
- **Vision.** Images are passed to vision-capable models, with graceful degradation to a text-only path when the active provider cannot see.
- **Real-time voice.** Streaming speech-to-text into the model and audio back out, so a conversation stays a conversation.
- **Local-first storage.** Chat history lives on the machine, not in someone else's database.

## What I took from it

The fallback chain was the hard part - not writing it, but deciding what counts as failure. A slow response is not the same as a dead provider, and treating them identically made the app feel worse, not better.`,
    techTags: ['Python', 'Local LLMs', 'Vision Models', 'Speech-to-Text', 'Multi-Provider'],
    liveUrl: '',
    githubUrl: '',
    featured: true,
    role: 'Solo developer',
    year: '2025',
    highlights: [
      'Ordered provider fallback chain with failure classification',
      'Vision support with text-only degradation',
      'Real-time streaming voice conversation',
      'Local-first chat history, no server round trip required',
    ],
    order: 0,
  },
  {
    title: 'Study Buddy',
    slug: 'study-buddy',
    summary:
      'Turns raw lecture notes into structured summaries and practice quizzes. Live on Vercel and used by actual classmates.',
    description: `Study Buddy takes the notes you already have and turns them into the two things that actually help before an exam: a tight summary and a quiz that tests you on it.

## The flow

1. Paste or upload your notes.
2. The app produces a structured summary - key concepts first, detail underneath.
3. It then generates multiple-choice questions from that same material, with answers and explanations.

## Design decisions

The summary and the quiz are generated from the same extracted concept list rather than independently from the raw text. Generating them separately produced quizzes that asked about things the summary never mentioned, which is exactly the wrong way round for revision.

Deployed on Vercel, so there is no server for a student to set up - the link is the product.`,
    techTags: ['Next.js', 'TypeScript', 'LLM APIs', 'Vercel'],
    liveUrl: '',
    githubUrl: '',
    featured: true,
    role: 'Solo developer',
    year: '2025',
    highlights: [
      'Notes to structured summary in one step',
      'Quiz generated from the same concept list as the summary',
      'Deployed and in use by classmates',
    ],
    order: 1,
  },
  {
    title: 'Buddy',
    slug: 'buddy',
    summary:
      'A fully offline chatbot running on local Ollama models - no API keys, no network, no data leaving the machine.',
    description: `Buddy is the minimal version of the local-first idea: a chatbot that works with the Wi-Fi off.

It runs against [Ollama](https://ollama.com) on the local machine, so every token is generated on-device. No API key, no per-request cost and no conversation leaving the laptop.

## Why bother

Two reasons. First, privacy that is structural rather than promised - there is no server to trust. Second, it is the cheapest possible way to iterate on prompt and conversation design, because experimenting costs nothing but electricity.

Building it is also what convinced me that local models are good enough for a large class of everyday tasks, which became the premise behind Kalvara.`,
    techTags: ['Python', 'Ollama', 'Local LLMs', 'CLI'],
    liveUrl: '',
    githubUrl: '',
    featured: false,
    role: 'Solo developer',
    year: '2024',
    highlights: [
      'Runs entirely offline against local Ollama models',
      'No API keys or per-request cost',
      'Conversation data never leaves the device',
    ],
    order: 2,
  },
  {
    title: 'Expense Tracker',
    slug: 'expense-tracker',
    summary:
      'A FastAPI and SQLAlchemy expense tracker that goes past charts into AI-generated spending insights.',
    description: `An expense tracker where the interesting part is not the CRUD.

## The stack

- **FastAPI** for the API, with Pydantic models validating every request and response.
- **SQLAlchemy** over a relational schema - expenses, categories and recurring entries, with proper foreign keys rather than a single wide table.
- **AI insights** layered on top: the model receives aggregated category totals and trends, never raw transaction rows, and writes a short plain-language read on where the money went.

## The design decision worth explaining

Sending raw transactions to a model would have been easier and worse: more tokens, more noise and a privacy problem for no benefit. Aggregating first means the insight layer sees "groceries up 18% month on month" instead of a list of shop names - which is both cheaper and what a human actually wants to hear.`,
    techTags: ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL', 'LLM APIs'],
    liveUrl: '',
    githubUrl: '',
    featured: false,
    role: 'Solo developer',
    year: '2024',
    highlights: [
      'Normalised relational schema with SQLAlchemy',
      'Pydantic-validated FastAPI endpoints',
      'Insights generated from aggregates, not raw transactions',
    ],
    order: 3,
  },
]

const education = [
  {
    degree: 'BS Computer Science',
    institution: 'University of Management and Technology (UMT)',
    location: 'Lahore, Pakistan',
    startDate: '2023',
    endDate: 'Present',
    current: true,
    grade: '',
    description:
      'Final-year student. Coursework across data structures, algorithms, databases, operating systems and machine learning, with project work focused on applied AI.',
    order: 0,
  },
]

const certifications: {
  title: string
  issuer: string
  issueDate: string
  credentialUrl: string
  order: number
}[] = [
  // Intentionally empty: the brief listed no certifications, and inventing
  // credentials on a resume site would be worse than an empty section (which
  // the public page hides automatically). Add real ones in the admin.
]

const socialLinks = [
  { label: 'GitHub', url: 'https://github.com/TabishAli889', icon: 'Github', order: 0 },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/', icon: 'Linkedin', order: 1 },
  { label: 'Email', url: 'mailto:you@example.com', icon: 'Mail', order: 2 },
]

// --- Runner ---------------------------------------------------------------

async function seedSingleton(
  label: string,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  model: any,
  data: Record<string, unknown>,
) {
  const existing = await model.findOne({ key: SINGLETON_KEY })
  if (existing && !RESET) {
    console.log(`  - ${label}: already set, left alone`)
    return
  }
  await model.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { $set: data },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
  console.log(`  ${existing ? '~' : '+'} ${label}: ${existing ? 'overwritten' : 'created'}`)
}

async function seedCollection(
  label: string,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  model: any,
  docs: Record<string, unknown>[],
) {
  if (docs.length === 0) {
    console.log(`  - ${label}: nothing to seed`)
    return
  }

  const count = await model.countDocuments()
  if (count > 0 && !RESET) {
    console.log(`  - ${label}: ${count} existing document(s), left alone`)
    return
  }

  if (RESET) await model.deleteMany({})
  await model.insertMany(docs.map((doc) => ({ ...doc, published: true })))
  console.log(`  + ${label}: ${docs.length} document(s)`)
}

async function main() {
  console.log(`\nSeeding ${RESET ? '(reset mode - content will be replaced)' : '(additive mode)'}\n`)

  await mongoose.connect(MONGODB_URI!)
  console.log('Connected to MongoDB\n')

  await seedSingleton('Hero', Hero, hero)
  await seedSingleton('About', About, about)
  await seedSingleton('Site settings', SiteSettings, siteSettings)

  // Skills reference their category, so categories are created first and the
  // generated ids are threaded through.
  const skillCount = await Skill.countDocuments()
  const categoryCount = await SkillCategory.countDocuments()

  if ((skillCount > 0 || categoryCount > 0) && !RESET) {
    console.log(`  - Skills: ${categoryCount} categor(ies), ${skillCount} skill(s), left alone`)
  } else {
    if (RESET) {
      await Promise.all([SkillCategory.deleteMany({}), Skill.deleteMany({})])
    }

    let created = 0
    for (const category of skillCategories) {
      const { skills, ...categoryData } = category
      const doc = await SkillCategory.create({ ...categoryData, published: true })
      await Skill.insertMany(
        skills.map((skill, index) => ({
          ...skill,
          category: doc._id,
          order: index,
          published: true,
        })),
      )
      created += skills.length
    }
    console.log(`  + Skills: ${skillCategories.length} categories, ${created} skills`)
  }

  await seedCollection('Experience', Experience, experience)
  await seedCollection('Projects', Project, projects)
  await seedCollection('Education', Education, education)
  await seedCollection('Certifications', Certification, certifications)
  await seedCollection('Social links', SocialLink, socialLinks)

  console.log('\nDone. Contact messages were not touched.\n')
  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('\nSeed failed:', error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
