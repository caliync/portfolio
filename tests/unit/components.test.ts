import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Cs from '~/components/Cs.vue'
import GhStats from '~/components/GhStats.vue'
import ProjectCard from '~/components/ProjectCard.vue'
import { ghDate, ghStats, projects } from '~/utils/content'

// The brand-icon component needs Nuxt's router; the tests only care that it's there.
const stubs = { Ico: { template: '<svg class="ico" />' }, TagList: true, ScoreLine: true, GhStats: true }

describe('Cs (case-study text)', () => {
  // Cs has several root nodes, so mount it inside a paragraph like the pages do.
  const inParagraph = (text: string) => mount({ components: { Cs }, props: ['text'], template: '<p><Cs :text="text" /></p>' }, { props: { text } })

  it('shows plain text as plain text', () => {
    const w = inParagraph('Nine route modules.')
    expect(w.element.textContent).toBe('Nine route modules.')
    expect(w.find('mark').exists()).toBe(false)
  })

  it('shows an unfilled ?{blank} as a highlighted note, keeping the spaces around it', () => {
    const w = inParagraph('Rated ?{where does 4.89 come from?} by users.')
    expect(w.find('mark.fill').text()).toBe('where does 4.89 come from?')
    expect(w.element.textContent).toBe('Rated where does 4.89 come from? by users.')
  })
})

describe('ghDate', () => {
  it('formats like the live refresh does', () => {
    expect(ghDate('2026-11-15T14:27:36Z')).toBe('Nov 15, 2026')
    expect(ghDate('2026-01-05T00:00:00Z')).toBe('Jan 5, 2026')
  })
})

describe('GhStats', () => {
  const mountStats = (repos: { repo: string; label: string }[]) => mount(GhStats, { props: { repos }, global: { stubs } })

  it('links a public repository and keeps the numbers the live refresh looks for', () => {
    const w = mountStats([{ repo: 'caliync/wildwood-site', label: 'Website' }])
    const li = w.get('li[data-gh-repo="caliync/wildwood-site"]')
    expect(li.get('a').attributes('href')).toBe('https://github.com/caliync/wildwood-site')
    expect(li.get('[data-gh="commits"]').text()).toMatch(/^\d+$/)
    expect(li.get('time[data-gh="updated"]').attributes('datetime')).toMatch(/^\d{4}-\d\d-\d\dT/)
    expect(li.get('.gh-label').text()).toBe('Website:')
    // the space after the label is easy to lose when the template is compiled; it must be there
    expect(li.element.textContent).toMatch(/Website: \d+ commits/)
  })

  it('shows a private repository without a link, and says so', () => {
    // None of the portfolio's repos is private now, so add one just for this test.
    ghStats['caliync/private-example'] = { commits: 12, private: true, pushed_at: '2026-11-14T03:03:23Z', url: null }
    const w = mountStats([{ repo: 'caliync/private-example', label: '' }])
    expect(w.find('a').exists()).toBe(false)
    expect(w.find('li[data-gh-repo]').exists()).toBe(false)   // the live refresh must never try a private repo
    expect(w.text()).toContain('private repository')
  })

  it('shows nothing for a repository it has no numbers for', () => {
    expect(mountStats([{ repo: 'caliync/unknown', label: '' }]).find('ul').exists()).toBe(false)
  })
})

describe('ProjectCard', () => {
  const baylo = projects.find((p) => p.slug === 'baylo')!
  const w = mount(ProjectCard, { props: { p: baylo }, global: { stubs } })

  it('links the project page', () => {
    expect(w.get('h3 a').attributes('href')).toBe('projects/baylo.html')
    expect(w.get('.card-links').text()).toContain('How I built it')
  })

  it('shows the cover as a plain image, with no button over it', () => {
    const img = w.get('.card-img img')
    expect(img.attributes('src')).toBe('images/covers/baylo.webp')
    expect(img.attributes('alt')).toBe('Baylo cover')
    expect(w.find('.card-img button').exists()).toBe(false)
    expect(w.text()).not.toContain('See the real screens')
  })
})
