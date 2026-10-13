import { cloudinaryImageUrl } from '@/lib/cloudinary'
import type { Project } from '@/lib/content-types'
import { RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'
import { ProjectCard } from './ProjectCard'

export function ProjectsSection({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null

  // Featured projects lead, then the rest, preserving the admin's order
  // within each group.
  const ordered = [
    ...projects.filter((project) => project.featured),
    ...projects.filter((project) => !project.featured),
  ]

  return (
    <section id="projects" className="section">
      <div className="shell">
        <SectionHeading
          index="04"
          title={
            <>
              Things I have <span className="text-gradient">built</span>
            </>
          }
          lede="A few projects worth explaining, with the reasoning behind them rather than just a screenshot."
        />

        {/*
          glow-room reserves space around the grid so each card's halo is not
          cut off at the grid's edge. The negative margin inside the utility
          cancels the visual indent, so the cards still line up with the
          section heading above them.
        */}
        <RevealStagger
          className="glow-room grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.09}
        >
          {ordered.map((project, index) => (
            <RevealItem
              key={project.id}
              className={project.featured ? 'sm:col-span-2 lg:col-span-2' : ''}
            >
              <ProjectCard
                project={project}
                imageUrl={
                  project.imageUrl
                    ? cloudinaryImageUrl(project.imageUrl, {
                        width: project.featured ? 1280 : 760,
                        height: project.featured ? 720 : 428,
                      })
                    : ''
                }
                // The first card can be above the fold on tall screens.
                priority={index === 0}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
