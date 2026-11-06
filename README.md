# portfolio

My portfolio site. I'm Casey, a 4th year BSIT student at FEU Alabang (Web and Mobile Applications), looking for a frontend or full-stack internship.

Live at https://caliync.github.io/portfolio/

The background is a 3D library made with three.js. On a laptop, scrolling slides you sideways along the shelves, one section at a time. On a phone you swipe between sections instead. If your browser can't run WebGL or you have reduced motion turned on, you get a normal page with a still picture of the library.

## What's in here

There's no build step, just HTML, CSS and JavaScript.

```
index.html            the whole site: about, experience, projects, skills, credentials, contact
projects/             a "How I built it" page for each project
student.html          old link, redirects to index.html
developer.html        old link, redirects to index.html
assets/site.css       styles, light and dark mode
assets/site.js        theme switch, menu, sideways scrolling, image viewer
assets/library.js     the 3D library background (three.js r128)
assets/logo.svg       my CY logo, also the tab icon
assets/logos/         logos for Baylo, Lakbay Lokal, Wildwood Site and Wildwood Farm
images/covers/        the poster covers on the project cards
images/projects/      screenshots I took of each project
images/baylo/         Baylo screenshots and our team photo
images/certs/         my certificates
casey-cv.pdf          my CV
casey-ats-resume.pdf  my ATS resume
```

Click a project cover to see the real screenshots.

## Running it locally

```bash
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Projects on the site

- **Baylo**: our capstone, a bartering app for Barangay Balibago, Santa Rosa, Laguna. There were four of us; I built the web platform and my teammates built the mobile app.
- **Lakbay Lokal**: a day planner for small local places near where you're staying. Still working on it.
- **Wildwood Site**: the website for my game.
- **Wildwood Farm**: a 3D farming game you play in the browser.

## Contact

caseyncierto@gmail.com
