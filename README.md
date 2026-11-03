# Casey Yncierto, portfolio

A static site with no build step.

- `index.html`: the whole portfolio on one scrolling page (about, projects, skills, experience, certifications, contact)
- `projects/*.html`: a "How I built it" page for each project
- `student.html` and `developer.html`: old links that now redirect to the matching section of `index.html`
- `assets/site.css`: styles, with light and dark mode
- `assets/site.js`: the light/dark switch and menu highlighting
- `assets/waves.js`: the background, 3D flowing lines drawn with plain WebGL. They hold still for visitors who have reduced motion turned on.
- `assets/logo.svg`: the neon CY logo, used in the navbar and as the browser-tab icon

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

Settings → Pages → Deploy from a branch → pick the branch and `/ (root)`.
The site will be at https://caliync.github.io/portfolio/.

## Images

- `images/baylo/web1.jpg`, `web2.jpg`, `group_photo.jpg`: Baylo's home page, its listings page, and the team at the capstone presentation
- `images/projects/`: screenshots taken from each project running locally

## Still to add

Anything missing stays hidden on the page until the file exists.

- `images/certs/cyberops.jpg`, `images/certs/linux-essentials.jpg`, `images/certs/it-specialist-networking.jpg`: the three certificates
- `casey-cv.pdf` and `casey-ats-resume.pdf` at the repo root: the Download CV and ATS resume buttons show up once these exist
- Roblox role: add the team name and dates in the commented line in `index.html`, under Experience
