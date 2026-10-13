import {
  getAbout,
  getCertifications,
  getEducation,
  getExperience,
  getHero,
  getProjects,
  getCurrentYear,
  getSiteSettings,
  getSkillGroups,
  getSocialLinks,
} from "@/lib/data";
import { AuroraBackground } from "@/components/public/AuroraBackground";
import { CursorGlow } from "@/components/public/CursorGlow";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { Hero } from "@/components/public/Hero";
import { AboutSection } from "@/components/public/AboutSection";
import { SkillsSection } from "@/components/public/SkillsSection";
import { ExperienceSection } from "@/components/public/ExperienceSection";
import { ProjectsSection } from "@/components/public/ProjectsSection";
import { EducationSection } from "@/components/public/EducationSection";
import { CertificationsSection } from "@/components/public/CertificationsSection";
import { ContactSection } from "@/components/public/ContactSection";

/**
 * The single-page public site.
 *
 * Every reader here is a `use cache` scope (see lib/data.ts), so this whole
 * page prerenders into a static shell at build time and is served without
 * touching MongoDB. An admin save purges the matching tag and the next request
 * re-renders with the new content.
 */
export default async function HomePage() {
  // One round of parallel reads; each is independently cached and tagged.
  const [
    hero,
    about,
    settings,
    skillGroups,
    experience,
    projects,
    education,
    certifications,
    socialLinks,
    year,
  ] = await Promise.all([
    getHero(),
    getAbout(),
    getSiteSettings(),
    getSkillGroups(),
    getExperience(),
    getProjects(),
    getEducation(),
    getCertifications(),
    getSocialLinks(),
    getCurrentYear(),
  ]);

  // The nav is built from the sections that actually have content, so an empty
  // Certifications collection does not leave a link pointing at nothing.
  const sections = [
    about.paragraphs.length > 0 || about.facts.length > 0
      ? { id: "about", label: "About" }
      : null,
    skillGroups.length > 0 ? { id: "skills", label: "Skills" } : null,
    experience.length > 0 ? { id: "experience", label: "Experience" } : null,
    projects.length > 0 ? { id: "projects", label: "Projects" } : null,
    education.length > 0 ? { id: "education", label: "Education" } : null,
    certifications.length > 0
      ? { id: "certifications", label: "Certifications" }
      : null,
    { id: "contact", label: "Contact" },
  ].filter(
    (section): section is { id: string; label: string } => section !== null,
  );

  return (
    <>
      <AuroraBackground />
      <CursorGlow />

      <SiteHeader
        siteName={settings.siteName}
        sections={sections}
        resumeUrl={settings.resumeUrl}
        resumeFileName={settings.resumeFileName}
      />

      {/* Offset for the fixed header; `#top` is the Back to top target. */}
      <div id="top" className="pt-(--header-height)" />

      <main className="relative flex-1">
        <Hero hero={hero} settings={settings} />
        <AboutSection about={about} />
        <SkillsSection groups={skillGroups} />
        <ExperienceSection experience={experience} />
        <ProjectsSection projects={projects} />
        <EducationSection education={education} />
        <CertificationsSection certifications={certifications} />
        <ContactSection settings={settings} socialLinks={socialLinks} />
      </main>

      <SiteFooter settings={settings} socialLinks={socialLinks} year={year} />
    </>
  );
}
