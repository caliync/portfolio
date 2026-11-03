# Casey Yncierto, portfolio

Static site: `index.html`, `styles.css`, `main.js`. No build step.

## Run it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish on GitHub Pages

Settings → Pages → Deploy from a branch → pick the branch and `/ (root)`.
The site will be at https://caliync.github.io/portfolio/.

## Things to fill in

- **Contact details:** in `index.html`, under `id="contact"`, replace the commented-out email, phone, location and LinkedIn rows and remove the comment marks. Rows you leave commented out don't show.
- **Roblox role:** add the team name and dates in the commented line under that job.
- **CV and ATS resume:** add `casey-cv.pdf` and `casey-ats-resume.pdf` to the repo root. The two download buttons stay hidden until the files exist.

## Type and color

- Display: Anybody, a variable grotesk. The hero name widens near the pointer, using its width axis.
- Body: Newsreader.
- Colors: harbor mist `#E9EEF2`, night sea `#132238`, slate `#3F5873`, jeepney yellow `#F3B61F`, mangrove `#22685B`. Dark mode follows the system setting.
