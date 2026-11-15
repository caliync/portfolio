// The site's content, typed. Everything lives in data/*.json so the pages, the tests and the
// Python tools (covers, link previews, GitHub numbers) all read the same files.
import projectsJson from '~~/data/projects.json'
import caseStudiesJson from '~/case-studies.json' // made from content/case-studies/*.md by scripts/prebuild.mjs
import skillsJson from '~~/data/skills.json'
import credentialsJson from '~~/data/credentials.json'
import experienceJson from '~~/data/experience.json'
import siteJson from '~~/data/site.json'
import ghStatsJson from '~~/data/github-stats.json'
import aboutJson from '~~/data/about.json'

export interface Shot { src: string; alt: string; caption: string; width: number; height: number }
export interface Labelled { label: string; text: string }
export interface Project {
  slug: string
  name: string
  og: string
  kind: string
  summary: string
  detail?: string
  stack: string[]
  score: { value: string; of: string; text: string } | null
  shots: Shot[]
  mission: string[]
  roles: { title: string; text: string }[]
  arch: Labelled[]
  links: { text: string; href: string }[]
  repos: { repo: string; label: string }[]
}
export interface CaseStudy {
  numbers: { value: string; text: string }[]
  diagram: string
  diagram_alt: string
  decisions: { title: string; text: string }[]
  api: { route: string; text: string }[]
  api_note: string
  data: Labelled[]
  lessons: string | null
}
export interface Job { title: string; type: string; where: string; points: string[] }
export interface Certificate {
  slug: string; title: string; issuer: string; date: string; dateText: string; width: number; height: number
}
export interface RepoStats { commits: number; private: boolean; pushed_at: string; url: string | null }

export const projects = projectsJson as Project[]
export const caseStudies = caseStudiesJson as Record<string, CaseStudy>
export const skills = skillsJson as { tech: Record<string, string | null>; arsenal: { group: string; items: string[] }[] }
export const credentials = credentialsJson as { seminars: string[]; organizations: string[]; certificates: Certificate[] }
export const experience = experienceJson as Job[]
export const site = siteJson as {
  name: string; fullName: string; url: string; email: string; linkedin: string; github: string
  siteRepo: string; customIcons: Record<string, string>
}
export const ghStats = ghStatsJson as Record<string, RepoStats>

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')

/** "2026-11-15T14:27:36Z" -> "Nov 15, 2026", the same format lib/githubStats.ts uses when it refreshes. */
export function ghDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`
}

export const about = aboutJson as { role: string; paragraphs: string[]; subjects: string[]; interests: string[]; contactLine: string }
