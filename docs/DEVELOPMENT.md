# Development notes

How this portfolio is built and run. The short introduction is in the [README](../README.md).

## Built with

- **Nuxt 4 and Vue 3**, in **TypeScript**. Nuxt builds every page into plain HTML ahead of time, so GitHub Pages serves finished pages and Vue never runs in the visitor's browser.
- **Hand-written CSS** with design tokens for colour, spacing, type and motion, in light and dark mode. No CSS framework.
- **Small TypeScript modules** for the parts that move (sideways scroll, theme switch, image viewer, live GitHub numbers), bundled with esbuild into one script of about 5 KB.
- **three.js** (r128) for the 3D library, loaded only on the home page and only when it will move.
- **Vitest**, **Playwright** with axe, and **Lighthouse** for the checks, run by **GitHub Actions**, which also deploys to **GitHub Pages**.

## What's where

```
app/
  pages/              the home page, a "How I built it" page per project, and "How this site is built"
  components/         the pieces the pages are made of: project cards, tags, GitHub numbers, case study
  lib/                the browser-side behaviour, one typed module each; entry.ts starts them
  utils/content.ts    types for the content, so a typo in data/ fails the type check
data/                 the content: projects, skills, experience, credentials, about, contact
content/
  case-studies/       one Markdown file per case study
  diagrams/           the architecture diagrams, as SVG
public/
  assets/             the stylesheet, fonts and logo
  images/             covers, screenshots, certificates and link-preview images
  casey-cv.pdf        my CV
  casey-ats-resume.pdf  my ATS resume
scripts/              build scripts: prebuild (icons, sitemap, browser bundle), the local server,
                      the Lighthouse check and the case-study reader
tools/                helpers I run by hand: covers, link previews, diagrams, resume PDFs, GitHub numbers
tests/
  unit/               Vitest: components, the case-study reader and the browser modules
  e2e/                Playwright: the generated site in a real browser
```

## Running it locally

You need Node 22.

```bash
npm ci
```

```bash
npm run dev
```

The browser script is bundled when the command starts, so restart it after changing `app/lib/`.

To see the real static build the way GitHub Pages serves it:

```bash
npm run generate
```

```bash
npm run preview
```

Then go to http://127.0.0.1:4173/portfolio/.

## Changing the content

Edit the files in `data/` or `content/case-studies/`, then run `npm run generate`. `npm run typecheck` checks the content and the code against their types, and the build stops if a case study has a heading it doesn't know or a blank that was never filled in.

The helpers in `tools/` need Python 3, and Playwright with Chromium for the ones that take screenshots:

| Command | What it does |
| --- | --- |
| `npm run covers` | Remakes the poster covers on the project cards |
| `npm run og` | Remakes the link-preview images |
| `npm run diagrams` | Redraws the architecture diagrams |
| `npm run pdfs` | Prints my CV and ATS resume to PDF |
| `npm run stats` | Refreshes the GitHub numbers. Only private repos need a `GITHUB_TOKEN`. |

## Checks

```bash
npm run test:unit
```

36 fast checks in a simulated browser (Vitest): the Markdown case-study reader and the errors it must give, the case-study text, the GitHub numbers display, and the browser behaviours.

```bash
npm test
```

34 checks in a real browser (Playwright) against the generated site: every page loads without errors and fits phone, tablet and desktop screens; passes automated accessibility checks (axe) in light and dark mode; has no broken links or files; shows link previews; and falls back to the still library for reduced motion and when WebGL is missing. The first time, install the browser with `npx playwright install chromium`.

```bash
npm run lighthouse
```

Runs Lighthouse on the home page and a project page on a throttled phone profile, and fails if performance drops under 85 or accessibility, best practices or SEO under 95. The home page is measured with the still library, because a CI machine has no graphics card to draw the 3D scene.

## How changes go live

`main` is the live branch. Every change goes on its own branch and into a pull request. GitHub Actions type-checks, tests and runs Lighthouse on every push and pull request, and when a pull request is merged into `main` it builds the site and publishes it to GitHub Pages.
