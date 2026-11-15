// Reads content/case-studies/*.md and returns the same shape the pages use.
//
// A case study is a Markdown file. The numbers and the diagram go in the header (YAML); the rest
// is plain Markdown, one heading per section:
//
//   ## Key decisions    each "### Title" is followed by its paragraph
//   ## The API          a paragraph, then "- `/route`: what it does"
//   ## The data         "- **Label**: text"
//   ## What I'd change  a paragraph (leave the section out until there is something honest to say)
//
// Unfilled blanks are written ?{like this}; the build stops while any remain.
import { readdirSync, readFileSync } from 'node:fs'
import { parse as yaml } from 'yaml'

const SECTIONS = { 'Key decisions': 'decisions', 'The API': 'api', 'The data': 'data', "What I'd change": 'lessons' }

function splitSections(body, file) {
  const out = {}
  let name = null
  for (const line of body.split('\n')) {
    const h = line.match(/^## (.+?)\s*$/)
    if (h) {
      name = SECTIONS[h[1]]
      if (!name) throw new Error(`${file}: unknown section "## ${h[1]}"`)
      out[name] = []
    } else if (name) out[name].push(line)
  }
  return out
}

const paragraphs = (lines) => lines.join('\n').split(/\n\s*\n/).map((p) => p.trim().replace(/\s*\n\s*/g, ' ')).filter(Boolean)

export function parseCaseStudy(text, file = 'case study') {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error(`${file}: missing the --- header`)
  const head = yaml(m[1])
  const sec = splitSections(m[2], file)
  const study = {
    numbers: head.numbers.map((n) => ({ value: String(n.value), text: n.text })),
    diagram: head.diagram,
    diagram_alt: head.diagram_alt.trim(),
    decisions: [],
    api: [],
    api_note: '',
    data: [],
    lessons: null,
  }

  let cur = null
  for (const line of sec.decisions ?? []) {
    const h = line.match(/^### (.+?)\s*$/)
    if (h) study.decisions.push((cur = { title: h[1], text: [] }))
    else if (cur) cur.text.push(line)
  }
  study.decisions = study.decisions.map((d) => ({ title: d.title, text: paragraphs(d.text).join(' ') }))

  const api = sec.api ?? []
  const firstItem = api.findIndex((l) => l.startsWith('- '))
  study.api_note = paragraphs(api.slice(0, firstItem < 0 ? api.length : firstItem)).join(' ')
  for (const l of api.filter((x) => x.startsWith('- '))) {
    const r = l.match(/^- `(.+?)`: (.+)$/)
    if (!r) throw new Error(`${file}: API line should look like - \`/route\`: text, got: ${l}`)
    study.api.push({ route: r[1], text: r[2] })
  }

  for (const l of (sec.data ?? []).filter((x) => x.startsWith('- '))) {
    const r = l.match(/^- \*\*(.+?)\*\*: (.+)$/)
    if (!r) throw new Error(`${file}: data line should look like - **Label**: text, got: ${l}`)
    study.data.push({ label: r[1], text: r[2] })
  }

  if (sec.lessons) study.lessons = paragraphs(sec.lessons).join(' ') || null
  return study
}

export function readCaseStudies(dir) {
  const out = {}
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
    out[f.replace(/\.md$/, '')] = parseCaseStudy(readFileSync(new URL(f, dir), 'utf8'), f)
  }
  return out
}
