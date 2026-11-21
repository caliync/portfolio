import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain JavaScript module, used by the build
import { parseCaseStudy, readCaseStudies } from '../../scripts/case-studies.mjs'

const SAMPLE = `---
diagram: demo
diagram_alt: "A box and an arrow."
numbers:
  - value: "9"
    text: "route modules"
  - value: 4.89
    text: "rating"
---

## Key decisions

### First choice

It was the simpler option.
It also cost less.

### Second choice

Another paragraph.

## The API

Both apps send a token.

- \`/api/items\`: Listings.
- \`/api/users\`: Profiles.

## The data

- **Users**: One user posts many items.
`

describe('parseCaseStudy', () => {
  const c = parseCaseStudy(SAMPLE, 'sample.md')

  it('reads the header', () => {
    expect(c.diagram).toBe('demo')
    expect(c.diagram_alt).toBe('A box and an arrow.')
    expect(c.numbers).toEqual([{ value: '9', text: 'route modules' }, { value: '4.89', text: 'rating' }])
  })

  it('reads each decision, joining wrapped lines into one paragraph', () => {
    expect(c.decisions).toEqual([
      { title: 'First choice', text: 'It was the simpler option. It also cost less.' },
      { title: 'Second choice', text: 'Another paragraph.' },
    ])
  })

  it('reads the API note and routes', () => {
    expect(c.api_note).toBe('Both apps send a token.')
    expect(c.api).toEqual([{ route: '/api/items', text: 'Listings.' }, { route: '/api/users', text: 'Profiles.' }])
  })

  it('reads the data rows, and leaves lessons empty when there is no such section', () => {
    expect(c.data).toEqual([{ label: 'Users', text: 'One user posts many items.' }])
    expect(c.lessons).toBeNull()
  })

  it('reads "What I\'d change" when it is there', () => {
    const withLessons = parseCaseStudy(`${SAMPLE}\n## What I'd change\n\nI would add tests first.\n`, 'x.md')
    expect(withLessons.lessons).toBe('I would add tests first.')
  })

  it('stops with the file name on a mistyped section heading', () => {
    expect(() => parseCaseStudy(`${SAMPLE}\n## Key decison\n`, 'baylo.md')).toThrow(/baylo\.md: unknown section "## Key decison"/)
  })

  it('stops on an API line that is not "- `/route`: text"', () => {
    expect(() => parseCaseStudy(SAMPLE.replace('- `/api/users`: Profiles.', '- /api/users - Profiles.'), 'baylo.md')).toThrow(/API line/)
  })

  it('stops when the header is missing', () => {
    expect(() => parseCaseStudy('## The API\n', 'baylo.md')).toThrow(/missing the --- header/)
  })
})

describe('the real case studies', () => {
  const all = readCaseStudies(pathToFileURL(`${process.cwd()}/content/case-studies/`))

  it('are there for Baylo and Lakbay Lokal', () => {
    expect(Object.keys(all).sort()).toEqual(['baylo', 'lakbay-lokal'])
  })

  it('have no unfilled ?{blanks} (the build refuses to publish them)', () => {
    expect(JSON.stringify(all)).not.toMatch(/\?\{/)
  })

  it('each have numbers, decisions and an API list', () => {
    for (const c of Object.values(all) as { numbers: unknown[]; decisions: unknown[]; api: unknown[] }[]) {
      expect(c.numbers.length).toBeGreaterThan(0)
      expect(c.decisions.length).toBeGreaterThan(0)
      expect(c.api.length).toBeGreaterThan(0)
    }
  })
})
