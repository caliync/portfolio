// Runs before `nuxt generate`. It writes the files that are made from the content:
//   public/assets/icons.svg   the brand icons the pages use, in one cached file
//   public/sitemap.xml        for search engines
//   public/assets/js/         the browser script (app/lib/entry.ts), bundled
//   app/generated.json        short content hashes, so browsers fetch a file again when it changes
//   app/case-studies.json     the case studies, read from content/case-studies/*.md
// It also stops the build if a case study still has an unfilled ?{blank}.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { rmSync } from 'node:fs'
import { build } from 'esbuild'
import { readCaseStudies } from './case-studies.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url))
const json = (p) => JSON.parse(read(p))
const write = (p, s) => writeFileSync(new URL(`../${p}`, import.meta.url), s)
const hash = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 8)

const projects = json('data/projects.json')
const skills = json('data/skills.json')
const site = json('data/site.json')
const caseStudies = readCaseStudies(new URL('../content/case-studies/', import.meta.url))
write('app/case-studies.json', JSON.stringify(caseStudies, null, 2) + '\n')

// Case studies: no ?{blanks} may reach the live site.
const blanks = JSON.stringify(caseStudies).match(/\?\{[^}]*\}/g) ?? []
if (blanks.length) {
  console.error(`${blanks.length} case-study blanks still need filling in content/case-studies/*.md, starting with ${blanks[0]}`)
  process.exit(1)
}

// Icon sprite: exactly the simple-icons the pages show.
const used = new Set(['github'])
const names = [...projects.flatMap((p) => p.stack), ...skills.arsenal.flatMap((g) => g.items)]
for (const n of names) {
  const slug = skills.tech[n]
  if (slug && !site.customIcons[slug]) used.add(slug)
}
const dir = new URL('../node_modules/simple-icons/icons/', import.meta.url).pathname
const symbols = [...used].sort().map((slug) => {
  const path = readFileSync(dir + slug + '.svg', 'utf8').match(/<path d="([^"]+)"/)[1]
  return `<symbol id="si-${slug}" viewBox="0 0 24 24"><path d="${path}"/></symbol>`
})
const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`
write('public/assets/icons.svg', sprite)

const urls = [site.url, `${site.url}how-its-built.html`, ...projects.map((p) => `${site.url}projects/${p.slug}.html`)]
write('public/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `  <url><loc>${u}</loc></url>\n`).join('') + '</urlset>\n')

// The browser script: app/lib/entry.ts and what it imports, bundled and minified. The 3D library
// is split into its own file, which the page fetches only when it has a canvas for it.
const jsDir = new URL('../public/assets/js/', import.meta.url).pathname
rmSync(jsDir, { recursive: true, force: true })
await build({
  entryPoints: { site: new URL('../app/lib/entry.ts', import.meta.url).pathname },
  outdir: jsDir,
  bundle: true,
  splitting: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  legalComments: 'none',
  tsconfigRaw: { compilerOptions: { target: 'es2020' } },
})

const versions = { icons: hash(sprite) }
for (const f of ['site.css', 'logo.svg', 'js/site.js']) versions[f] = hash(read(`public/assets/${f}`))
write('app/generated.json', JSON.stringify(versions, null, 2) + '\n')
console.log(`prebuild: ${used.size} icons, ${urls.length} sitemap urls`)
