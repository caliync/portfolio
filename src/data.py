"""All the portfolio's content: projects, skills, credentials and contact details.
Edit this file, then run `python src/build.py`."""
import html, os, re

ICONS = os.environ["SIMPLE_ICONS_DIR"]  # set by build.py
E = html.escape

# ---------- icons ----------
SPRITE_REF = "@@ICON_SPRITE@@"  # build.py swaps in the sprite's path and version for each page

def si_path(slug):
    svg = open(os.path.join(ICONS, slug + ".svg")).read()
    return re.search(r'<path d="([^"]+)"', svg).group(1)

def si(slug):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="{SPRITE_REF}#si-{slug}"/></svg>'

CUSTOM = {
    "outlook": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M2 5.2 13.4 3v18L2 18.8zm5.6 2.9c-2 0-3.4 1.7-3.4 3.9s1.4 3.9 3.4 3.9S11 14.2 11 12s-1.4-3.9-3.4-3.9zm0 1.7c1 0 1.6 1 1.6 2.2s-.6 2.2-1.6 2.2S6 13.2 6 12s.6-2.2 1.6-2.2zM14.6 6.5H21a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-6.4v-4.6l1.9 1.4 4.3-3.1V9.3l-4.3 3.1-1.9-1.4z"/></svg>',
    "linkedin": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M4.2 2h15.6A2.2 2.2 0 0 1 22 4.2v15.6a2.2 2.2 0 0 1-2.2 2.2H4.2A2.2 2.2 0 0 1 2 19.8V4.2A2.2 2.2 0 0 1 4.2 2zm2.9 3.7a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5zM5.6 10.3v8.2h3v-8.2zm5 0v8.2h3v-4.3c0-1.2.3-2.2 1.7-2.2s1.5 1.2 1.5 2.3v4.2h3v-4.8c0-2.5-.6-3.7-3.4-3.7-1.4 0-2.3.7-2.8 1.4v-1.1z"/></svg>',
    "sun": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
    "moon": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>',
    "back": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 5 3 12l7 7M3.5 12H21" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "out": '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}
def icon(name):
    return CUSTOM[name] if name in CUSTOM else si(name)

# tech name -> simple-icons slug (None = text only)
TECH = {
    "Python": "python", "TypeScript": "typescript", "JavaScript": "javascript", "Kotlin": "kotlin",
    "Luau": "luau", "C++": "cplusplus", "Dart": "dart", "Java": "openjdk", "PHP": "php", "SQL": None,
    "HTML and CSS": "html5", "React": "react", "Vue": "vuedotjs", "Nuxt": "nuxt", "Node.js": "nodedotjs",
    "Tailwind": "tailwindcss", "FastAPI": "fastapi", "three.js": "threedotjs", "GSAP": "greensock",
    "Firebase": "firebase", "WordPress": "wordpress", "Flutter": "flutter", "Android Studio": "androidstudio",
    "PostgreSQL": "postgresql", "SQLite": "sqlite", "Google Cloud Run": "googlecloud", "Render": "render",
    "TensorFlow": "tensorflow", "OpenCV": "opencv", "MediaPipe": "mediapipe", "Gemini API": "googlegemini",
    "Redis": "redis", "Docker": "docker", "Linux": "linux", "Git": "git", "Blender": "blender",
    "Roblox Studio": "robloxstudio", "Figma": "figma", "Spigot API": None, "JDA": "discord", "DiscordSRV": "discord", "Leaflet": None, "Canva": None,
}
def tag(name):
    slug = TECH.get(name)
    ic = si(slug) if slug else ""
    return f'<li class="tag">{ic}<span>{E(name)}</span></li>'
def tags(names, cls="tags"):
    return f'<ul class="{cls}">' + "".join(tag(n) for n in names) + "</ul>"

EMAIL = "caseyncierto@gmail.com"
LINKEDIN = "https://www.linkedin.com/in/casey-yncierto-643a59447/"
GITHUB = "https://github.com/caliync"
SITE_REPO = "caliync/portfolio"  # this site's own source, shown in the footer

def contact_icons(cls="reach-icons"):
    items = [("outlook", f"mailto:{EMAIL}", f"Email {EMAIL}"), ("linkedin", LINKEDIN, "LinkedIn"), ("github", GITHUB, "GitHub")]
    return f'<ul class="{cls}">' + "".join(
        f'<li><a href="{h}" aria-label="{E(l)}" title="{E(l)}">{icon(n)}</a></li>' for n, h, l in items) + "</ul>"

CERTS = [
    ("cyberops", "Cisco CyberOps Associate", "Cisco Networking Academy, FEU Alabang", "2026-07", "July 2026"),
    ("it-specialist-networking", "IT Specialist: Networking", "Certiport, a Pearson VUE business", "2025-03", "March 2025"),
]
PROJECTS = [
    dict(
        slug="baylo", name="Baylo",
        og='A community bartering app for Barangay Balibago. I built the web platform and its backend; 100 respondents rated it 4.89/5.',  # one line for link previews
        kind="Capstone project, 4-person team",
        summary="A community bartering app for Barangay Balibago, Santa Rosa, Laguna, built by our team of four. I was the only web developer and built the whole web platform on my own; my three teammates built the mobile app. Residents post items, chat and trade with their neighbours, and Gemini estimates each item's value and finds good trade matches.",
        stack=["React", "TypeScript", "Tailwind", "FastAPI", "PostgreSQL", "Firebase", "Gemini API", "Docker", "Google Cloud Run"],
        score=("4.89", "/5", "from 100 respondents in the ISO/IEC 25010 evaluation I led"),
        thumb="images/baylo/web1.webp",
        shots=[("images/baylo/web1.webp", "Baylo home page with the Baylo logo over a record shop photo and a row of categories", "The home page: search, categories and the app download."),
               ("images/baylo/web2.webp", "Baylo listings page with filters, trending items and recently added items", "Browsing listings, with filters for condition and price, and matches.")],
        mission=[
            "Baylo is our capstone at FEU Alabang. It lets residents of Barangay Balibago discover, swap and share items with their neighbours.",
            "We were a team of four: Ma. Samantha Elizabeth M. Depamaylo, Coleen N. Aclaro, Jinya Marray P. Gutierrez and me. My teammates built the mobile app. I built the web platform and its backend on my own, and led the research and evaluation.",
        ],
        roles=[
            ("Web platform", "built Baylo's web platform alone: a FastAPI backend with 9 route modules over a 13-table PostgreSQL database, and a React, TypeScript and Tailwind frontend where users post and trade items."),
            ("AI features", "added Gemini to estimate an item's value and category from its photos, screen listings for prohibited items, and score how well two items match for a trade (value, category, condition, interest)."),
            ("Real-time features", "wired up Firebase for sign-in, real-time chat and notifications."),
            ("Admin tools", "built an admin dashboard for users, listings, reports and trades."),
            ("Deployment", "deployed the backend to Google Cloud Run in a Docker container."),
            ("Research and evaluation", "led the survey and evaluation under ISO/IEC 25010; 100 respondents rated the platform 4.89/5."),
        ],
        arch=[("Frontend", "React, TypeScript, Tailwind"), ("Backend", "FastAPI, 9 route modules"), ("Database", "PostgreSQL, 13 tables"),
              ("AI", "Google Gemini API for item value, category, screening and trade matching"),
              ("Sign-in, chat and notifications", "Firebase"), ("Hosting", "Docker container on Google Cloud Run"),
              ("Mobile app", "built by my teammates")],
        links=[],
    ),
    dict(
        slug="lakbay-lokal", name="Lakbay Lokal",
        repos=[("caliync/LakbayLokal", "")],
        og="A trip planner that builds a timed day of small, local places near where you're staying. In progress.",  # one line for link previews
        kind="Personal project, in progress",
        summary="A free trip planner for the Philippines that I'm building on my own. It turns where you're staying and how far you'll go into a timed day of small, local places, with travel time between each stop.",
        detail='It only recommends real places from its own list of about 220 and picks checked places first, while Gemini only rewords stored facts. Plans can be edited, swapped for indoor places on rainy days, shown on a map, added to a calendar, and followed offline on the day.',
        stack=["Python", "FastAPI", "JavaScript", "SQLite", "Gemini API", "Leaflet", "Render"],
        thumb="images/projects/lakbay-plan.webp",
        shots=[("images/projects/lakbay-start.webp", "Lakbay Lokal's start screen: where you're staying, dates and who is coming, then how far you'll go, with a ring showing that distance", "Where you're staying, when, who's coming, and how far you'll go."),
               ("images/projects/lakbay-plan.webp", "A planned day in Lakbay Lokal: a timeline of stops with times and travel between them, each fact marked checked or estimated, beside a map with numbered pins", "A planned day: times, travel between stops, how sure each fact is, and the map.")],
        mission=[
            "Big travel sites send everyone to the same places. Lakbay Lokal points travellers to small, local, lesser-known places near where they're staying.",
            "It only recommends places from its own list and never makes one up. The list has about 220 real places: 34 popular Alabang and Muntinlupa places I researched from public pages, plus 186 from OpenStreetMap that the site marks \"Details not checked yet\". The planner picks checked places first.",
        ],
        roles=[
            ("Planning engine", "filters places by budget, group, opening hours and interests, scores them, and builds each day outward from the stay. Travel time comes from straight-line distance, adjusted for winding roads and a trike or jeepney's speed, plus time to find a ride."),
            ("Grounded AI", "Gemini only rewrites a stop's stored facts as a sentence or two and is told not to add any. If there's no key or the call fails, a template writes the text instead."),
            ("Traveller features", "editable plans, a rainy-day swap to indoor places, a day map, calendar and Markdown exports, saved drafts, and a guide for the day itself with a compass and directions. A service worker keeps the plan and guide working offline."),
            ("Owner sign-ups", "a form where small business owners add their place. Nothing goes live until I check it and approve it with a script."),
            ("Testing and deployment", "unit tests for the engine, browser tests with Playwright, and deployment on Render."),
        ],
        arch=[("Backend", "Python, FastAPI"), ("Data", "SQLite, with every place record checked against a JSON Schema; OpenStreetMap import scripts"),
              ("Frontend", "HTML, CSS and JavaScript, Leaflet maps"), ("AI", "Google Gemini API, free tier, with a template fallback"),
              ("Offline", "service worker"), ("Hosting", "Render")],
        links=[("Open the live site", "https://lakbay-lokal.onrender.com/")],
    ),
    dict(
        slug="wildwood", name="Wildwood",
        repos=[("caliync/wildwood-site", "Website"), ("caliync/wildwood-farm", "Game")],
        og="A cozy 3D browser game where you earn an animal's trust, plus the 3D website that opens it.",  # one line for link previews
        kind="Personal project, 3D browser game and its website",
        summary="A cozy 3D browser game where you earn an animal's trust instead of catching it, plus the 3D website I built for it, with a field guide, a map of the world and a button that opens the game. Farm by day, hold off wolf raids at night.",
        stack=["three.js", "GSAP", "JavaScript"],
        thumb="images/projects/site-world.webp",
        shots=[("images/projects/site-forest.webp", "A dark 3D forest clearing with a campfire, mist and tall pines", "The website's opening forest scene."),
               ("images/projects/site-guide.webp", "The field guide showing a 3D rusty knife with a list of weapons and its stats", "The field guide, with day, dusk and night lighting."),
               ("images/projects/site-world.webp", "A 3D map of the game world with forests, a creek, fields and clouds", "The map of six regions."),
               ("images/projects/farm-title.webp", "Wildwood Farm title screen over the farm, with Play, How to play and Settings buttons", "The game's title screen."),
               ("images/projects/farm-play.webp", "The player standing on the farm next to crop plots, with the hotbar, hearts and minimap on screen", "In the game: hotbar, hearts, day clock and minimap.")],
        mission=[
            "In Wildwood Farm you befriend animals instead of catching them. You offer the food an animal loves and stay still while its trust fills, and friends move into your barn and leave you gifts. Around that, you grow and cook crops, fish the creek, forge better weapons, and hold the farm through wolf raids at night.",
            "The game needed a home page that feels like the game before anyone presses Play, so I built a website for it. It tells the story, shows what's in the world, and opens the game.",
        ],
        roles=[
            ("Gameplay systems", "taming, farming (rain makes crops grow twice as fast), fishing with five fish that bite at different times and weather, cooking, and forging at the Blacksmith from enemy drops."),
            ("Night raids", "programmed wolf raids that players fend off with gates, watchtowers and spike traps, with a morning report after each raid night."),
            ("Walking buddy", "any barn animal can follow the player, dig up treats and warn about wolves."),
            ("Controls and saves", "playable on keyboard, mouse or touch, with progress saved in the browser."),
            ("Website forest scene", "a 3D clearing with a smoking campfire, fireflies, ground mist, and a bunny and owl living there."),
            ("Field guide and map", "weapons, animals and structures you can rotate and zoom under day, dusk and night lighting, and a 3D map of six regions where picking one flies the camera there."),
        ],
        arch=[("Rendering", "three.js r128 for both; the website adds bloom post-processing and orbit controls"),
              ("Motion", "GSAP 3.12 and ScrollTrigger on the website"),
              ("Code", "plain JavaScript, one index.html each, no build step"),
              ("Saves", "the browser's local storage"), ("Hosting", "GitHub Pages")],
        links=[("Visit the site", "https://caliync.github.io/wildwood-site/")],
    ),
]
ARSENAL = [
    ("Languages", ["Python", "TypeScript", "JavaScript", "Java", "Kotlin"]),
    ("Frontend", ["React", "Vue", "Nuxt", "Tailwind", "three.js", "GSAP"]),
    ("Backend and data", ["FastAPI", "Node.js", "Firebase", "PostgreSQL", "SQLite"]),
    ("AI and machine learning", ["Gemini API", "TensorFlow", "OpenCV"]),
    ("Cloud and tools", ["Docker", "Google Cloud Run", "Render", "Git", "Linux", "Android Studio"]),
    ("Design", ["Figma", "Blender"]),
]

SEMINARS = [
    "AI and Robotics: Extension of human intellect and its ethical consideration",
    "Kotlin Essentials: Transforming Your Coding Experience",
    "Unveiling the Future: Introduction to Cloud Computing",
    "From Sensors to Decisions: Hands-on Embedded Machine Learning with Arduino",
]
ORGS = ["Google Developer Student Clubs", "Junior Philippine Computer Society"]
