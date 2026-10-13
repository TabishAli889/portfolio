'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { SkillGroup } from '@/lib/content-types'
import { Icon } from '@/components/ui/Icon'
import { RevealItem, RevealStagger } from './Reveal'
import { SectionHeading } from './SectionHeading'

/**
 * Skills grouped by category, each with an animated proficiency bar.
 *
 * The bar is a client component because the fill animates from 0 to its level
 * when it scrolls into view. The track reserves the full width up front, so
 * the animation never shifts anything around it.
 */
export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null

  return (
    <section id="skills" className="section">
      <div className="shell">
        <SectionHeading
          index="02"
          title={
            <>
              Things I build <span className="text-gradient">with</span>
            </>
          }
          lede="Grouped by what they are for, with a rough sense of how deep I am in each."
        />

        <div className="glow-room grid gap-5 md:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="glass glass-ring glow-halo p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-neon-cyan/30 bg-neon-cyan/8 text-neon-cyan shadow-[0_0_22px_-10px_rgba(34,211,238,0.9)]">
                  <Icon name={group.icon} className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base">{group.name}</h3>
                  {group.description && (
                    <p className="mt-0.5 text-xs text-fog-500">{group.description}</p>
                  )}
                </div>
              </div>

              <RevealStagger className="mt-6 space-y-4" stagger={0.06}>
                {group.skills.map((skill) => (
                  <RevealItem key={skill.id} y={10}>
                    <SkillBar name={skill.name} level={skill.level} icon={skill.icon} />
                  </RevealItem>
                ))}
              </RevealStagger>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SkillBar({ name, level, icon }: { name: string; level: number; icon?: string }) {
  const reduceMotion = useReducedMotion()
  const clamped = Math.max(0, Math.min(100, level))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-sm text-fog-200">
          {icon && <Icon name={icon} className="size-3.5 text-fog-500" />}
          {name}
        </span>
        <span className="font-mono text-[0.7rem] text-fog-500">{clamped}%</span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name} proficiency`}
      >
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-neon-cyan),var(--color-neon-violet))]"
          initial={reduceMotion ? false : { width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          style={reduceMotion ? { width: `${clamped}%` } : undefined}
        />
      </div>
    </div>
  )
}
