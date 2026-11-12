"""Link-preview images (1200x630) for the home page and each project, in the site's style.
Writes one HTML page per image into out/; shoot.js screenshots them into images/og/.

    python src/og/make_og.py && node src/og/shoot.js
"""
import base64, html, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

# data.py reads the icon folder from the environment; previews don't use icons, so any path will do.
os.environ.setdefault("SIMPLE_ICONS_DIR", os.path.join(ROOT, "node_modules", "simple-icons", "icons"))
sys.path.insert(0, os.path.dirname(HERE))
from data import PROJECTS  # noqa: E402

E = html.escape


def uri(rel):
    path = os.path.join(ROOT, rel)
    kind = {"webp": "image/webp", "svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg"}[rel.rsplit(".", 1)[1]]
    return f"data:{kind};base64," + base64.b64encode(open(path, "rb").read()).decode()


CSS = """
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; background: #160A0C; color: #F4EAE0; font-family: Karla, sans-serif; }
.bg { position: absolute; inset: 0; background: url(BG) center / cover; filter: saturate(1.1); }
.glow { position: absolute; inset: 0; background:
  radial-gradient(60% 80% at 22% 55%, rgba(22, 10, 12, .92), rgba(22, 10, 12, .55) 70%, rgba(22, 10, 12, .35)),
  radial-gradient(40% 50% at 80% 10%, rgba(255, 196, 110, .14), transparent 70%); }
.top { position: absolute; top: 44px; left: 64px; display: flex; align-items: center; gap: 16px; font-size: 22px; color: #C2ADA6; letter-spacing: .02em; }
.top img { width: 56px; height: 56px; }
.text { position: absolute; left: 64px; bottom: 64px; width: WIDTHpx; }
.kicker { font-size: 24px; font-style: italic; color: #C2ADA6; margin: 0 0 12px; }
h1 { font-family: "Young Serif", Georgia, serif; font-weight: 400; font-size: HSIZEpx; line-height: 1.02; margin: 0; color: #F4EAE0; }
.rule { width: 120px; height: 4px; border-radius: 2px; margin: 24px 0 22px; background: linear-gradient(90deg, #F5C518, #E03A4E); }
.role { font-family: "Young Serif", Georgia, serif; font-size: 36px; color: #FF6B7C; margin: 0 0 16px; }
.line { font-size: 27px; line-height: 1.4; color: #EADBCC; margin: 0; }
.tags { display: flex; gap: 10px; margin-top: 24px; }
.tags span { padding: 6px 14px; border: 1px solid rgba(244, 234, 224, .22); border-radius: 999px; font-size: 19px; color: #F4EAE0; background: rgba(244, 234, 224, .06); }
.cover { position: absolute; right: 64px; top: 50%; width: 384px; height: 504px; transform: translateY(-50%) rotate(2deg); border-radius: 18px;
  background: center / cover; box-shadow: 0 30px 60px -20px rgba(0, 0, 0, .8), 0 0 0 1px rgba(244, 234, 224, .16); }
"""

FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Karla:ital,wght@0,400;0,700;1,400&display=block" rel="stylesheet">')


def card(name, inner, width, hsize):
    css = CSS.replace("BG", uri("images/library-dark.webp")).replace("WIDTH", str(width)).replace("HSIZE", str(hsize))
    doc = (f'<!doctype html><html><head><meta charset="utf-8">{FONTS}<style>{css}</style></head><body>'
           f'<div class="bg"></div><div class="glow"></div>'
           f'<div class="top"><img src="{uri("assets/logo.svg")}" alt="">caliync.github.io/portfolio</div>{inner}</body></html>')
    open(os.path.join(OUT, name + ".html"), "w").write(doc)


card("home", """<div class="text">
  <h1>Casey Yncierto</h1>
  <div class="rule"></div>
  <p class="role">Web and mobile application developer</p>
  <p class="line">Fourth-year IT student at FEU Alabang, open to frontend and full-stack internships.</p>
</div>""", 1000, 96)

for p in PROJECTS:
    tags = "".join(f"<span>{E(t)}</span>" for t in p["stack"][:4])
    card(p["slug"], f"""<div class="text">
  <p class="kicker">{E(p['kind'])}</p>
  <h1>{E(p['name'])}</h1>
  <div class="rule"></div>
  <p class="line">{E(p['og'])}</p>
  <div class="tags">{tags}</div>
</div>
<div class="cover" style="background-image:url({uri('images/covers/' + p['slug'] + '.webp')})"></div>""", 640, 80)

print("wrote", len(PROJECTS) + 1, "pages into", OUT)
