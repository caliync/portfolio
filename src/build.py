"""Builds the portfolio: index.html and projects/*.html, from the content in data.py.

    python src/build.py                     # writes into the repo root
    python src/build.py --out /tmp/site     # writes somewhere else

Icons come from the simple-icons npm package (npm ci installs it).
"""
import argparse, hashlib, json, html as _html, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_args = argparse.ArgumentParser(description=__doc__.splitlines()[0])
_args.add_argument("--out", default=ROOT, help="folder to write the site into (default: the repo root)")
_args.add_argument("--icons", default=os.path.join(ROOT, "node_modules", "simple-icons", "icons"),
                   help="simple-icons SVG folder")
ARGS = _args.parse_args()
if not os.path.isdir(ARGS.icons):
    sys.exit(f"Icons not found at {ARGS.icons}. Run `npm ci` first, or pass --icons.")
os.environ["SIMPLE_ICONS_DIR"] = ARGS.icons

from data import *  # noqa: E402,F403  icons, tags, contact data, PROJECTS, ARSENAL, CERTS

OUT = ARGS.out

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Karla:ital,wght@0,400..700;1,400&display=swap">')

THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
THREE_SRI = "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu"  # same bytes as npm three@0.128.0

def webp_size(rel):
    """Width and height of a WebP file, read from its header, so <img> tags reserve their space."""
    b = open(os.path.join(ROOT, rel), "rb").read(40)
    kind = b[12:16]
    if kind == b"VP8X":
        return 1 + int.from_bytes(b[24:27], "little"), 1 + int.from_bytes(b[27:30], "little")
    if kind == b"VP8L":
        bits = int.from_bytes(b[21:25], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    return int.from_bytes(b[26:28], "little") & 0x3FFF, int.from_bytes(b[28:30], "little") & 0x3FFF

WRITTEN = []  # pages written this run; their icon references get the sprite's version at the end

def write_sprite():
    """Every brand icon the pages use, in one cached file. Pages point at it with <use> instead of
    repeating the paths. Runs last, so it holds exactly the icons that appear somewhere."""
    used = set()
    for path in WRITTEN:
        used |= set(re.findall(r"#si-([a-z0-9]+)", open(path).read()))
    syms = "".join(f'<symbol id="si-{slug}" viewBox="0 0 24 24"><path d="{si_path(slug)}"/></symbol>' for slug in sorted(used))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg">{syms}</svg>\n'
    os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)
    open(os.path.join(OUT, "assets", "icons.svg"), "w").write(svg)
    v = hashlib.sha1(svg.encode()).hexdigest()[:8]
    for path in WRITTEN:
        text = open(path).read()
        open(path, "w").write(text.replace("@@SPRITE_V@@", v))

def ver(name):
    """Short content hash, so browsers fetch a file again whenever it changes."""
    return hashlib.sha1(open(os.path.join(ROOT, "assets", name), "rb").read()).hexdigest()[:8]

def page(path, title, desc, body, r="", bg="intro"):
    # The home page draws the 3D library; library.js fetches three.js itself, and falls back to the
    # still picture for reduced motion or when WebGL is missing. Other pages only ever show the still picture.
    if bg == "intro":
        background = '<canvas class="bg3d" aria-hidden="true"></canvas>'
        library = (f'<script src="{r}assets/library.js?v={ver("library.js")}" data-three="{THREE_URL}" '
                   f'data-three-sri="{THREE_SRI}" defer></script>')
    else:
        background = '<div class="bg-still" aria-hidden="true"></div>'
        library = ""
    doc = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<script>try{{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="icon" type="image/svg+xml" href="{r}assets/logo.svg?v={ver('logo.svg')}">
{FONTS}
<link rel="stylesheet" href="{r}assets/site.css?v={ver('site.css')}">
</head>
<body data-bg="{bg}">
<a class="skip" href="#main">Skip to content</a>
{background}
{body}
<script src="{r}assets/site.js?v={ver('site.js')}" defer></script>
{library}
</body>
</html>
"""
    doc = doc.replace(SPRITE_REF, f"{r}assets/icons.svg?v=@@SPRITE_V@@")
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full) or OUT, exist_ok=True)
    open(full, "w").write(doc)
    WRITTEN.append(full)

def theme_btn():
    return f'<button type="button" class="theme" data-theme-toggle aria-label="Switch to light mode"><span class="i-sun">{icon("sun")}</span><span class="i-moon">{icon("moon")}</span></button>'

def foot():
    return f"""<footer class="foot">
  <div class="foot-in">
    <p>© 2026 Casey Allison R. Yncierto</p>
    {contact_icons()}
  </div>
</footer>"""

DL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def score_html(p):
    if not p.get("score"):
        return ""
    n, of, t = p["score"]
    return f'<p class="score"><span class="score-n">{n}<span class="score-of">{of}</span></span><span class="score-t">{E(t)}</span></p>'

# ---------- the one page ----------
NAV = [("About", "#about"), ("Experience", "#experience"), ("Projects", "#projects"), ("Skills", "#skills"), ("Credentials", "#credentials"), ("Contact", "#contact")]

ICON_EYE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'

def card(p):
    shots_json = _html.escape(json.dumps([{"src": a, "alt": b} for a, b, c in p["shots"]]), quote=True)
    links = "".join(f'<a href="{h}">{E(t)}</a>' for t, h in p["links"])
    links += f'<a href="projects/{p["slug"]}.html">How I built it</a>'
    return f"""
      <article class="card">
        <div class="card-img art-box" data-shots="{shots_json}">
          <button type="button" class="art-scene" aria-label="Show the real screens of {E(p['name'])}">
            <img class="art-svg art-cover" src="images/covers/{p['slug']}.webp" alt="{E(p['name'])} cover" width="991" height="1300" decoding="async">
            <span class="art-hint">{ICON_EYE}<span>See the real screens</span></span>
          </button>
          <div class="art-real" inert>
            <img class="art-img" alt="" decoding="async">
            <div class="art-bar">
              <button type="button" class="art-prev" aria-label="Previous screen">&#8249;</button>
              <span class="art-count" aria-live="polite">1 / {len(p['shots'])}</span>
              <button type="button" class="art-next" aria-label="Next screen">&#8250;</button>
              <button type="button" class="art-back">Back to cover</button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <p class="kind">{E(p['kind'])}</p>
          <h3><a href="projects/{p['slug']}.html">{E(p['name'])}</a></h3>
          <p>{E(p['summary'])}</p>
          {f'<p>{E(p["detail"])}</p>' if p.get('detail') else ''}
          {score_html(p)}
          {tags(p['stack'], 'tags tags-sm')}
          <p class="card-links">{links}</p>
        </div>
      </article>"""

seminars = "".join(f'<li class="cred-item">{E(t)}</li>' for t in SEMINARS)
orgs = "".join(f'<li class="cred-item">{E(t)}</li>' for t in ORGS)
arsenal = "".join(f'<div class="kit"><h3 class="sub">{E(t)}</h3>{tags(n)}</div>' for t, n in ARSENAL)
certs = "".join(f"""
        <li class="cert">
          <figure class="cert-img"><a href="images/certs/{s}.webp"><img src="images/certs/{s}.webp" alt="{E(t)} certificate" width="{webp_size(f'images/certs/{s}.webp')[0]}" height="{webp_size(f'images/certs/{s}.webp')[1]}" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true"></a></figure>
          <div class="cert-text">
            <h3>{E(t)}</h3>
            <p>{E(i)}</p>
            <p class="cert-date"><time datetime="{d}">{E(dd)}</time></p>
          </div>
        </li>""" for s, t, i, d, dd in CERTS)

home = f"""
<header class="bar">
  <div class="bar-in">
    <a class="mark" href="#top" aria-label="Casey Yncierto, back to top"><img src="assets/logo.svg?v={ver('logo.svg')}" alt="CY" width="44" height="44"></a>
    <nav aria-label="Sections">{"".join(f'<a href="{h}">{E(t)}</a>' for t, h in NAV)}</nav>
    {theme_btn()}
  </div>
</header>
<main id="main" class="col">
  <section class="hero" id="top" aria-labelledby="name">
    <h1 id="name" class="name">Casey Yncierto</h1>
    <p class="role">Web and mobile application developer</p>
    <div class="reach-row">
      {contact_icons("reach-icons")}
      <div class="dl">
        <a class="dl-btn dl-solid" href="casey-cv.pdf" target="_blank" rel="noopener">{icon('out')}<span>CV</span></a>
        <a class="dl-btn dl-solid" href="casey-ats-resume.pdf" target="_blank" rel="noopener">{icon('out')}<span>ATS</span></a>
      </div>
    </div>
  </section>

  <section class="box" id="about" aria-labelledby="about-h">
    <h2 id="about-h">About me</h2>
    <div class="prose">
      <p>I'm a fourth year student at Far Eastern University - Alabang, taking a Bachelor of Science in Information Technology with a specialization in web and mobile applications. I build full-stack web and mobile apps: the interface people use, the backend behind it, and the deployment that keeps it live.</p>
      <p>I focus on web and mobile development, system design, UI/UX design and machine learning. Most of what I know comes from building real projects: the web platform for my capstone, gameplay systems for a Roblox team, Java plugins for a Minecraft server with thousands of players, and Lakbay Lokal, a trip planner I'm building on my own.</p>
    </div>
    <div class="two-col">
      <div>
        <h3 class="sub">Core subjects</h3>
        <ul class="list">
          <li>Web and mobile development</li>
          <li>Software development</li>
          <li>Database management</li>
          <li>System design</li>
        </ul>
      </div>
      <div>
        <h3 class="sub">Research interests</h3>
        <ul class="list">
          <li>Assistive technology</li>
          <li>Machine learning</li>
          <li>Component-based JavaScript frameworks</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="box" id="experience" aria-labelledby="exp-h">
    <h2 id="exp-h">Experience</h2>
    <article class="job job-split">
        <div class="job-photos">
        <figure class="job-photo">
          <img src="images/baylo/group_photo.webp" alt="The Baylo team and our adviser at the capstone presentation, with the title slide behind us" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true">
          <figcaption>Presenting Baylo with my team at FEU Alabang.</figcaption>
        </figure>
        <!-- Second photo is a placeholder: swap in another capstone photo when you have one. -->
        <figure class="job-photo">
          <img src="images/baylo/web1.webp" alt="Baylo's home page" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true">
          <figcaption>Baylo's home page.</figcaption>
        </figure>
      </div>
      <div class="job-text">
        <h3>Capstone Project Developer &amp; Researcher</h3>
        <p class="kind">Baylo, FEU Alabang capstone, 4-person team</p>
        <ul class="list">
          <li>Worked in a team of four: my three teammates built the mobile app, and I built the web platform and its backend on my own.</li>
          <li>Connected the web platform to the team's mobile app through a shared backend and Firebase, so accounts, listings, chat and notifications are the same on web and mobile.</li>
          <li>Planned the system with the team, from research and wireframes to the final design, and kept the web and mobile sides in step as features changed.</li>
          <li>Led the research: ran the survey and the ISO/IEC 25010 evaluation, where 100 respondents rated the platform 4.89/5.</li>
          <li>Presented and defended Baylo with the team at our capstone presentation.</li>
        </ul>
      </div>
    </article>
    <article class="job job-split">
      <div class="job-photos">
        <figure class="job-photo">
          <img src="images/corestudio/live-feed.png" alt="The anti-exploit admin dashboard's live feed, listing recent detections such as teleport, fly and walkspeed with the action taken for each" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true">
          <figcaption>The admin dashboard's live feed of detections.</figcaption>
        </figure>
      </div>
      <div class="job-text">
        <h3>UI/UX Designer and Gameplay Scripter</h3>
        <p class="kind"><span class="emp">Freelance</span> CoreStudio, Roblox game team, 2026</p>
        <ul class="list">
          <li>Joined CoreStudio's Roblox team to design the game's UI/UX and write gameplay scripts in Luau.</li>
          <li>Built a modular, server-authoritative anti-exploit system that catches speed hacks, teleporting, flying, jump cheats, humanoid tampering and remote spam.</li>
          <li>Added an in-game admin dashboard, saved bans, optional Discord webhook alerts, and a configurable strike system that kicks and then bans repeat offenders.</li>
        </ul>
      </div>
    </article>
    <article class="job job-split">
      <div class="job-photos">
        <figure class="job-photo">
          <a href="images/battleasya/ticket-discord.webp"><img src="images/battleasya/ticket-discord.webp" alt="The Discord ticket channel: a staff member tells the player who stole their diamonds, the player answers from in-game through the plugin, the staff member warns the other player, and the ticket is closed" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true"></a>
          <figcaption>Replies typed in-game appear in the Discord ticket.</figcaption>
        </figure>
        <figure class="job-photo">
          <a href="images/battleasya/ticket-transcript.webp"><img src="images/battleasya/ticket-transcript.webp" alt="The saved transcript of the same ticket, dated August 2026" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true"></a>
          <figcaption>The saved transcript, from August 2026. Names are hidden.</figcaption>
        </figure>
      </div>
      <div class="job-text">
        <h3>Server Admin and Plugin Developer</h3>
        <p class="kind"><span class="emp">Part-time</span> BattleAsya Minecraft server, 2019 to 2022</p>
        <ul class="list">
          <li>Helped run BattleAsya as an admin and developer. The server had about 14,000 players, with up to 5,000 online at once, and kept that player base for several years.</li>
          <li>Built custom Java plugins with the Spigot API, so they ran on Spigot, Paper and Bukkit servers.</li>
          <li>Built a report and ticket system: when a player reports a cheater in-game, a Discord bot I made with JDA and DiscordSRV opens a ticket channel on the server's Discord, so staff can review it.</li>
          <li>Wrote plugins that fixed bugs and blocked exploits, keeping the server stable for a large live player base.</li>
          <li>The server still runs my ticket and report plugin today, years after I built it.</li>
        </ul>
      </div>
    </article>
  </section>

  <section class="box" id="projects" aria-labelledby="proj-h">
    <h2 id="proj-h">Projects</h2>
    <div class="cards">{"".join(card(p) for p in PROJECTS)}
    </div>
  </section>

  <section class="box" id="skills" aria-labelledby="skills-h">
    <h2 id="skills-h">My arsenal</h2>
    <div class="arsenal">{arsenal}</div>
  </section>

  <section class="box" id="credentials" aria-labelledby="cred-h">
    <h2 id="cred-h">Credentials</h2>
    <div class="cred-block"><h3 class="cred-sub">Seminars</h3>
      <ul class="cred-grid">{seminars}</ul>
      <h3 class="cred-sub cred-sub-2">Organizations</h3>
      <ul class="cred-grid">{orgs}</ul></div>
    <!--cred-split-->
    <div class="cred-block"><h3 class="cred-sub">Certificates</h3>
      <ul class="certs">{certs}
      </ul></div>
  </section>

  <section class="box" id="contact" aria-labelledby="contact-h">
    <h2 id="contact-h">Contact</h2>
    <p class="contact-line">I'm open to frontend and full-stack internships.</p>
    <dl class="rows copy-ok">
      <div><dt>Email</dt><dd><a href="mailto:{EMAIL}">{EMAIL}</a></dd></div>
      <div><dt>LinkedIn</dt><dd><a href="{LINKEDIN}">linkedin.com/in/casey-yncierto</a></dd></div>
      <div><dt>GitHub</dt><dd><a href="{GITHUB}">github.com/caliync</a></dd></div>
    </dl>
  </section>
</main>
{foot()}
"""

import re as _re
def to_panels(html):
    head, rest = html.split('<main id="main" class="col">', 1)
    main, tail = rest.split('</main>', 1)
    secs = _re.findall(r'  <section .*?\n  </section>', main, _re.S)
    out = []
    def panel(pid, inner, cls="", label=None):
        idattr = f' id="{pid}"' if pid else ''
        lab = f' aria-label="{label}"' if label else ''
        return f'  <section class="panel {cls}"{idattr}{lab}>\n{inner}\n  </section>'
    for sec in secs:
        m = _re.match(r'  <section class="([^"]*)" id="([^"]+)"', sec)
        cls, sid = m.group(1), m.group(2)
        body = sec.split('>', 1)[1].rsplit('</section>', 1)[0]
        if sid == 'top':
            out.append(panel('top', '    <div class="hero">' + body.replace('\n    ', '\n      ') + '\n      <p class="hs-hint" aria-hidden="true"><span class="h-scroll">Scroll to browse the shelves</span><span class="h-swipe">Swipe to browse the shelves</span> <span class="arrow">&rarr;</span></p>\n    </div>', 'panel-hero', 'Introduction'))
            continue
        h2 = _re.search(r'<h2 id="([^"]+)">(.*?)</h2>', body)
        title = h2.group(2)
        if sid == 'experience':
            jobs = _re.findall(r'    <article class="job.*?\n    </article>', body, _re.S)
            for i, j in enumerate(jobs):
                # Experience is text only; photos and screenshots live in Projects.
                j = _re.sub(r'\n\s*<div class="job-photos">.*?</div>', '', j, count=1, flags=_re.S)
                j = j.replace('class="job job-split"', 'class="job"')
                hid = 'exp-h' if i == 0 else f'exp-h{i+1}'
                inner = (f'    <div class="box panel-box">\n      <h2 id="{hid}">{title}<span class="count">{i+1} of {len(jobs)}</span></h2>\n'
                         + j + '\n    </div>')
                out.append(panel('experience' if i == 0 else f'experience-{i+1}', inner, 'panel-exp'))
            continue
        if sid == 'projects':
            cards = _re.findall(r'      <article class="card">.*?</article>', body, _re.S)
            for i, c in enumerate(cards):
                hid = 'proj-h' if i == 0 else f'proj-h{i+1}'
                inner = (f'    <div class="box panel-box">\n      <h2 id="{hid}">{title}<span class="count">{i+1} of {len(cards)}</span></h2>\n'
                         + c + '\n    </div>')
                out.append(panel('projects' if i == 0 else f'projects-{i+1}', inner, 'panel-proj'))
            continue
        if sid == 'credentials':
            parts = [x for x in body.split('<!--cred-split-->')]
            blocks = [_re.search(r'<div class="cred-block">.*</div>', x, _re.S).group(0) for x in parts]
            for i, blk in enumerate(blocks):
                hid = 'cred-h' if i == 0 else f'cred-h{i+1}'
                inner = (f'    <div class="box panel-box">\n      <h2 id="{hid}">Credentials<span class="count">{i+1} of {len(blocks)}</span></h2>\n'
                         + blk + '\n    </div>')
                out.append(panel('credentials' if i == 0 else f'credentials-{i+1}', inner, 'panel-cred'))
            continue
        extra = ''
        if sid == 'contact':
            extra = '\n      <p class="panel-foot">&copy; 2026 Casey Allison R. Yncierto</p>'
        out.append(panel(sid, '    <div class="box panel-box">' + body + extra + '\n    </div>'))
    main_html = ('<main id="main" class="hs">\n<div class="hs-sticky">\n<div class="hs-track col">\n'
                 + '\n'.join(out) + '\n</div>\n</div>\n<div class="hs-progress" aria-hidden="true"><span></span></div>\n')
    return head + main_html + '</main>' + tail
home = to_panels(home)
page("index.html", "Casey Yncierto", "Casey Allison R. Yncierto, web and mobile application developer and IT student at FEU Alabang.", home)

# Old pages send visitors to the right part of the one page.
for old, anchor in [("student.html", "#about"), ("developer.html", "#projects")]:
    open(os.path.join(OUT, old), "w").write(
        f'<!doctype html><meta charset="utf-8"><title>Casey Yncierto</title>'
        f'<meta http-equiv="refresh" content="0; url=index.html{anchor}"><link rel="canonical" href="index.html">'
        f'<p><a href="index.html{anchor}">Go to the portfolio</a></p>')

# ---------- project pages: flat background, plain readable boxes ----------
for i, p in enumerate(PROJECTS):
    r = "../"
    nxt = PROJECTS[(i + 1) % len(PROJECTS)]
    shots = "".join(f'<figure class="shot"><img src="{r}{s}" alt="{E(a)}" width="{webp_size(s)[0]}" height="{webp_size(s)[1]}" loading="lazy" decoding="async" onerror="this.closest(\'figure\').hidden=true"><figcaption>{E(c)}</figcaption></figure>' for s, a, c in p["shots"])
    roles = "".join(f"<li><strong>{E(k)}:</strong> {E(v)}</li>" for k, v in p["roles"])
    arch = "".join(f"<div><dt>{E(k)}</dt><dd>{E(v)}</dd></div>" for k, v in p["arch"])
    links = "".join(f'<a class="btn{" btn-solid" if j == 0 else ""}" href="{h}">{E(t)}</a>' for j, (t, h) in enumerate(p["links"]))
    body = f"""
<header class="bar">
  <div class="bar-in">
    <a class="mark" href="{r}index.html" aria-label="Casey Yncierto, home"><img src="{r}assets/logo.svg?v={ver('logo.svg')}" alt="CY" width="44" height="44"></a>
    <nav aria-label="Project"><a href="{r}index.html#projects">{icon("back")} Back to projects</a>{"".join(f'<a href="{h}">{E(t)} {icon("out")}</a>' for t, h in p["links"])}</nav>
    {theme_btn()}
  </div>
</header>
<main id="main" class="col">
  <header class="box box-head">
    <p class="kind">{E(p['kind'])}</p>
    <h1 class="page-title">{E(p['name'])}</h1>
    <p class="lede">{E(p['summary'])}</p>
    {score_html(p)}
    {tags(p['stack'])}
  </header>

  <section class="box" aria-labelledby="design-h">
    <h2 id="design-h">The design</h2>
    <div class="shots">{shots}</div>
  </section>

  <section class="box" aria-labelledby="mission-h">
    <h2 id="mission-h">The mission</h2>
    <div class="prose">{"".join(f"<p>{E(x)}</p>" for x in p["mission"])}</div>
  </section>

  <section class="box" aria-labelledby="roles-h">
    <h2 id="roles-h">What I did</h2>
    <ul class="list roles">{roles}</ul>
  </section>

  <section class="box" aria-labelledby="arch-h">
    <h2 id="arch-h">The architecture</h2>
    <dl class="rows">{arch}</dl>
  </section>

  <nav class="box box-end" aria-label="More">
    {f'<p class="btns">{links}</p>' if links else ''}
    <p class="next">Next project: <a href="{nxt['slug']}.html">{E(nxt['name'])}</a></p>
  </nav>
</main>
{foot()}
"""
    page(f"projects/{p['slug']}.html", f"{p['name']} - Casey Yncierto", p["summary"], body, r, bg="flat")

# The two Wildwood pages became one; keep their old links working.
for old in ("wildwood-farm", "wildwood-site"):
    with open(os.path.join(OUT, "projects", old + ".html"), "w") as f:
        f.write('<!doctype html><meta charset="utf-8"><title>Wildwood - Casey Yncierto</title>'
                '<meta http-equiv="refresh" content="0; url=wildwood.html"><link rel="canonical" href="wildwood.html">'
                '<p><a href="wildwood.html">Go to the Wildwood project</a></p>')

write_sprite()
print("built")
