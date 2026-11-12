# portfolio

My portfolio site. I'm Casey, a 4th year BSIT student at FEU Alabang (Web and Mobile Applications), looking for a frontend or full-stack internship.

Live at https://caliync.github.io/portfolio/

The background is a 3D library made with three.js. On a laptop, scrolling slides you sideways along the shelves, one section at a time. On a phone you swipe between sections instead. If your browser can't run WebGL or you have reduced motion turned on, you get a normal page with a still picture of the library.

## What's in here

The pages are plain HTML, CSS and JavaScript, so nothing has to be built for the site to run. The HTML is generated from one content file by a small Python script, so I edit my projects and skills in one place.

```
src/data.py           all the content: projects, skills, credentials, contact
src/build.py          turns data.py into index.html and projects/*.html
src/casestudies.py    the engineering case studies on the project pages (architecture, decisions, API, data)
src/diagrams/         the architecture diagrams, as SVG
src/stats.py          takes a snapshot of each project's GitHub numbers into src/github_stats.json
src/covers/           makes the poster covers on the project cards
src/resume/           my CV and ATS resume as HTML, and the script that prints them to PDF
src/og/               makes the link-preview images in images/og/

index.html            the whole site (generated)
projects/             a "How I built it" page for each project (generated)
assets/site.css       styles, light and dark mode
assets/site.js        theme switch, menu, sideways scrolling, image viewer
assets/library.js     the 3D library background; it fetches three.js r128 only when the library will move
assets/icons.svg      the brand icons the pages use, in one cached file (generated)
assets/logo.svg       my CY logo, also the tab icon
assets/logos/         project logos
images/               covers, screenshots and certificates
images/library-*.webp the still library shown on project pages, with reduced motion, or when 3D can't run
casey-cv.pdf          my CV
casey-ats-resume.pdf  my ATS resume
```

Click a project cover on the site to see the real screenshots.

## Running it locally

```bash
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Changing the content

Edit `src/data.py`, then rebuild:

```bash
npm ci
```

```bash
npm run build
```

`npm ci` only installs the icon set the build reads from. A GitHub Action rebuilds the pages on every push and fails if the committed HTML doesn't match `src/`, so the two can't drift apart.

The covers and PDFs need [Playwright](https://playwright.dev) with Chromium installed:

```bash
npm run covers
```

```bash
npm run pdfs
```

```bash
npm run og
```

`npm run stats` refreshes the GitHub numbers (commits, last update) before a build; reading the private Lakbay Lokal repo needs a `GITHUB_TOKEN`. On the live site, the numbers for public repos also refresh in the visitor's browser.

`npm run og` remakes the link-preview images. The build also writes `sitemap.xml` for search engines.

## Projects on the site

- **Baylo**: our capstone, a bartering app for Barangay Balibago, Santa Rosa, Laguna. There were four of us; I built the web platform and my teammates built the mobile app.
- **Lakbay Lokal**: a day planner for small local places near where you're staying. Still working on it.
- **Wildwood**: a 3D farming game you play in the browser, and the 3D website I made for it. The website links to the game.

## Contact

caseyncierto@gmail.com
