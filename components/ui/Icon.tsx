import type { ComponentType, SVGProps } from 'react'
import {
  Award,
  Brain,
  Briefcase,
  Cloud,
  Code2,
  Container,
  Cpu,
  Database,
  FileCode2,
  FileText,
  FolderGit2,
  GitBranch,
  Globe,
  GraduationCap,
  LayoutGrid,
  Library,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Palette,
  Phone,
  Rocket,
  Server,
  Settings,
  Sparkles,
  Terminal,
  User,
  Wrench,
  Zap,
} from 'lucide-react'
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
  YoutubeIcon,
} from './BrandIcons'

/**
 * Icons are stored in the database as names, so the admin can type "Github"
 * and change a social link without a deploy.
 *
 * Only the icons in this map are reachable. An unknown name falls back to a
 * neutral icon rather than crashing the page, and the fixed import list keeps
 * the bundle small - lucide ships 3,700+ icons and a dynamic import would
 * defeat tree-shaking.
 *
 * lucide 1.x no longer ships brand marks, so those come from BrandIcons.
 */
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const ICONS: Record<string, IconComponent> = {
  // Generic
  Award,
  Brain,
  Briefcase,
  Cloud,
  Code2,
  Container,
  Cpu,
  Database,
  FileCode2,
  FileText,
  FolderGit2,
  GitBranch,
  Globe,
  GraduationCap,
  LayoutGrid,
  Library,
  Link: Link2,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Palette,
  Phone,
  Rocket,
  Server,
  Settings,
  Sparkles,
  Terminal,
  User,
  Wrench,
  Zap,
  // Brands
  Github: GithubIcon,
  Linkedin: LinkedinIcon,
  Twitter: XIcon,
  X: XIcon,
  Instagram: InstagramIcon,
  Youtube: YoutubeIcon,
}

export const ICON_NAMES = Object.keys(ICONS).sort()

export function Icon({
  name,
  className,
  fallback = 'Sparkles',
}: {
  name?: string | null
  className?: string
  fallback?: string
}) {
  const Component = (name ? ICONS[name] : undefined) ?? ICONS[fallback] ?? Sparkles
  return <Component className={className} aria-hidden />
}
