# Casey Yncierto, portfolio

A static site with no build step:

| Page | File |
| --- | --- |
| Home (name, Student or Developer, contact icons) | `index.html` |
| Student (school, coursework, research interests, certifications) | `student.html` |
| Developer (projects, arsenal, experience, contact) | `developer.html` |
| One page per project | `projects/*.html` |

`assets/site.css` holds the styles, `assets/site.js` the theme switch and the hero name effect, and `assets/sea.js` the 3D background. The background is a sea of lights drawn with plain WebGL. It stops moving for visitors who have reduced motion turned on.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

Settings → Pages → Deploy from a branch → pick the branch and `/ (root)`.
The site will be at https://caliync.github.io/portfolio/.

## Images to add

Missing images are hidden on the page until the file exists, so nothing looks broken.

- `images/baylo/home.jpg`: the Baylo home page
- `images/baylo/browse.jpg`: the Baylo listings page
- `images/baylo/defense.jpg`: the team photo at the capstone presentation
- `images/certs/cyberops.jpg`, `images/certs/linux-essentials.jpg`, `images/certs/it-specialist-networking.jpg`: the three certificates
- `casey-cv.pdf` and `casey-ats-resume.pdf` at the repo root: the Download CV and ATS resume buttons on the Developer page show up once these exist

The project screenshots in `images/projects/` were taken from each project running locally.

## Still to fill in

- Roblox role: add the team name and dates in the commented line in `developer.html`.
