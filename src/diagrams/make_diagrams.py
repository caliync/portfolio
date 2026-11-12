"""Architecture diagrams for the case studies, as plain SVG.

Each diagram comes in two shapes: wide for desktop and tall for phones, so the labels stay readable.
Colours come from the site's CSS (.dg rules in assets/site.css), so the diagrams follow light and dark mode.

    python src/diagrams/make_diagrams.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def box(x, y, w, h, title, lines, mine=False):
    cls = "node mine" if mine else "node"
    out = f'<g class="{cls}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12"/>'
    out += f'<text class="dt" x="{x + 16}" y="{y + 30}">{title}</text>'
    for i, line in enumerate(lines):
        out += f'<text class="dl" x="{x + 16}" y="{y + 54 + i * 20}">{line}</text>'
    return out + "</g>"


def arrow(mid, x1, y1, x2, y2, label=None, at=None, faint=False):
    cls = "edge faint" if faint else "edge"
    out = f'<g class="{cls}"><line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" marker-end="url(#{mid})"/>'
    if label:
        out += f'<text class="el" x="{at[0]}" y="{at[1]}">{label}</text>'
    return out + "</g>"


def svg(name, variant, size, parts):
    # Marker ids must be unique per document: both variants sit in the same page, one hidden.
    mid = f"ah-{name}-{variant}"
    defs = (f'<defs><marker id="{mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            f'orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ahead"/></marker></defs>')
    body = "".join(p(mid) if callable(p) else p for p in parts)
    with open(os.path.join(HERE, f"{name}-{variant}.svg"), "w") as f:
        f.write(f'<svg viewBox="0 0 {size[0]} {size[1]}" xmlns="http://www.w3.org/2000/svg">{defs}{body}</svg>\n')


def edge(*args, **kw):
    return lambda mid: arrow(mid, *args, **kw)


# Baylo: the web app (mine) and the team's mobile app share one backend; Firebase serves both apps.
svg("baylo", "wide", (960, 440), [
    box(20, 40, 250, 104, "Web app", ["React, TypeScript, Tailwind", "Firebase Hosting · built by me"], mine=True),
    box(20, 196, 250, 104, "Mobile app", ["Built by my teammates"]),
    box(360, 96, 260, 150, "FastAPI backend", ["9 route modules", "Docker on Google Cloud Run", "Built by me"], mine=True),
    box(710, 40, 230, 104, "PostgreSQL", ["13 tables"]),
    box(710, 196, 230, 104, "Gemini API", ["Value, category, screening,", "trade matching"]),
    box(20, 352, 920, 72, "Firebase", ["Sign-in, real-time chat and push notifications, shared by both apps"]),
    edge(270, 100, 356, 140, "HTTPS, JSON", (278, 92)),
    edge(270, 248, 356, 206),
    edge(620, 140, 706, 100, "SQL", (650, 104)),
    edge(620, 206, 706, 244, "API calls", (640, 252)),
    edge(145, 144, 145, 192, faint=True),
    edge(145, 300, 145, 348, faint=True),
])
svg("baylo", "tall", (340, 600), [
    box(10, 10, 320, 84, "Web app", ["React, TypeScript, Tailwind · by me"], mine=True),
    box(10, 110, 320, 64, "Mobile app", ["by my teammates"]),
    box(10, 230, 320, 104, "FastAPI backend", ["9 route modules", "Docker on Google Cloud Run · by me"], mine=True),
    box(10, 390, 152, 84, "PostgreSQL", ["13 tables"]),
    box(178, 390, 152, 84, "Gemini API", ["AI features"]),
    box(10, 500, 320, 84, "Firebase", ["Sign-in, chat, notifications"]),
    edge(170, 176, 170, 226, "HTTPS, JSON", (182, 206)),
    edge(86, 336, 86, 386),
    edge(254, 336, 254, 386),
])
# Lakbay Lokal: one FastAPI server; the planner decides, Gemini only rewords.
svg("lakbay", "wide", (960, 470), [
    box(20, 40, 250, 130, "Browser app", ["HTML, CSS, JavaScript", "Leaflet map", "Works offline (service worker)"], mine=True),
    box(20, 230, 250, 104, "Owner sign-up form", ["Business owners add", "their place"]),
    box(350, 40, 270, 150, "FastAPI on Render", ["Checks every request", "Rate limits, security headers", "One worker"], mine=True),
    box(350, 250, 270, 104, "Planner", ["Filter, score, fill each day", "Same trip, same plan"], mine=True),
    box(700, 40, 240, 104, "Gemini API", ["Rewords stored facts only", "Template if it fails"]),
    box(700, 250, 240, 104, "SQLite", ["220 places + tags", "Rebuilt on each deploy"]),
    box(20, 390, 920, 64, "Private GitHub repo", ["Owner sign-ups wait here until I review and approve them"]),
    edge(270, 100, 346, 110, "HTTPS, JSON", (278, 92)),
    edge(270, 282, 346, 160),
    edge(485, 190, 485, 246),
    edge(620, 300, 696, 300, "SQL", (646, 292)),
    edge(620, 92, 696, 92, "facts only", (630, 84)),
    edge(145, 334, 145, 386, faint=True),
])
svg("lakbay", "tall", (340, 700), [
    box(10, 10, 320, 104, "Browser app", ["HTML, CSS, JavaScript, Leaflet", "Works offline · by me"], mine=True),
    box(10, 170, 320, 104, "FastAPI on Render", ["Checks requests, rate limits", "by me"], mine=True),
    box(10, 330, 320, 84, "Planner", ["Filter, score, fill each day · by me"], mine=True),
    box(10, 470, 152, 104, "SQLite", ["220 places", "+ tags"]),
    box(178, 470, 152, 104, "Gemini API", ["Rewords facts", "Template fallback"]),
    box(10, 600, 320, 84, "Private GitHub repo", ["Owner sign-ups, reviewed by me"]),
    edge(170, 116, 170, 166, "HTTPS, JSON", (182, 146)),
    edge(170, 276, 170, 326),
    edge(86, 416, 86, 466),
    edge(254, 416, 254, 466),
])
print("wrote diagrams into", HERE)
