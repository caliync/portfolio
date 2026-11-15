# portfolio

My portfolio site. I'm Casey, a 4th year BSIT student at FEU Alabang (Web and Mobile Applications), looking for a frontend or full-stack internship.

Live at https://caliync.github.io/portfolio/

The background is a 3D library made with three.js. On a laptop, scrolling slides you sideways along the shelves, one section at a time. On a phone you swipe between sections instead. If your browser can't run WebGL or you have reduced motion turned on, you get a normal page with a still picture of the library.

## What's in here

The site is built with Nuxt (Vue 3 and TypeScript) and generated to plain static HTML, so GitHub Pages serves finished pages and the content is readable before any JavaScript runs. All the content lives in JSON files in `data/`, so I edit my projects and skills in one place.

```
data/                 all the content: projects, case studies, skills, credentials, experience, contact
app/pages/            the home page and the "How I built it" page for each project
app/components/       the pieces the pages are made of: project cards, tags, GitHub numbers, case study
app/utils/content.ts  types for the content, so a typo in data/ fails the type check
scripts/prebuild.mjs  makes the icon sprite and sitemap, and stops the build if a case study has a blank
scripts/serve.mjs     serves the built site under /portfolio/, like GitHub Pages
public/assets/        styles (light and dark mode), site.js (theme, sideways scrolling, image viewer)
                      and library.js (the 3D library; it fetches three.js r128 only when it will move)
public/images/        covers, screenshots, certificates and link-preview images
src/diagrams/         the architecture diagrams, as SVG
src/stats.py          takes a snapshot of each project's GitHub numbers into data/github-stats.json
src/covers/           makes the poster covers on the project cards
src/resume/           my CV and ATS resume as HTML, and the script that prints them to PDF
src/og/               makes the link-preview images
```

Click a project cover on the site to see the real screenshots.

## Running it locally

```bash
npm ci
```

```bash
npm run dev
```

Or build the real static site and look at it the way GitHub Pages serves it:

```bash
npm run generate
```

```bash
npm run preview
```

Then go to http://127.0.0.1:4173/portfolio/.

## Changing the content

Edit the files in `data/`, then `npm run generate`. `npm run typecheck` checks the content and the code against their types.

The covers, link previews and PDFs need [Playwright](https://playwright.dev) with Chromium installed:

```bash
npm run covers
```

```bash
npm run og
```

```bash
npm run pdfs
```

`npm run stats` refreshes the GitHub numbers (commits, last update); reading the private Lakbay Lokal repo needs a `GITHUB_TOKEN`. On the live site, the numbers for public repos also refresh in the visitor's browser.

## Tests

```bash
npm test
```

27 checks in a real browser (Playwright), run against the generated site: every page loads without errors and fits phone, tablet and desktop screens; passes automated accessibility checks (axe) in light and dark mode; has no broken local links or files; shows link previews; and skips three.js where the library doesn't move. The first time, install the browser with `npx playwright install chromium`.

On every push, a GitHub Action type-checks, generates and tests the site. Pushes to `cali/portfolio` then publish that build to GitHub Pages.

## Projects on the site

- **Baylo**: our capstone, a bartering app for Barangay Balibago, Santa Rosa, Laguna. There were four of us; I built the web platform and my teammates built the mobile app.
- **Lakbay Lokal**: a day planner for small local places near where you're staying. Still working on it.
- **Wildwood**: a 3D farming game you play in the browser, and the 3D website I made for it. The website links to the game.

## Contact

caseyncierto@gmail.com
