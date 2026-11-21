"""Cover art for the four project cards: flat vector scenes in the library palette.
Each is a 400x440 SVG (sliced to fill its box), with a few gentle ambient animations
(see the .a-* rules in site.css; they stop for visitors who prefer reduced motion)."""

GOLD, GOLD2, RED, RED2, CREAM = "#F5C518", "#E3B43C", "#B3122B", "#E03A4E", "#F4EAE0"


import math

BAYLO = "assets/logos/baylo-mark.png"

def _tile_base(pfx, c1, c2):
    defs = (f'<linearGradient id="{pfx}-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
            f'<linearGradient id="{pfx}-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>')
    base = (f'<rect width="120" height="120" rx="28" fill="url(#{pfx}-t)"/><rect width="120" height="120" rx="28" fill="url(#{pfx}-h)"/>'
            '<rect x=".75" y=".75" width="118.5" height="118.5" rx="27.3" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.5"/>')
    return defs, base

def tile_baylo():
    defs, base = _tile_base("tb", "#3F90D2", "#1B4F86")
    body = '<image href="{BAYLO}" x="25" y="27" width="70" height="66" preserveAspectRatio="xMidYMid meet"/>'
    return defs, base + body

def tile_lakbay():
    defs, base = _tile_base("tl", "#F7B731", "#B36B00")
    body = ('<path d="M60 20 C 43 20 31 32 31 47 C 31 67 60 94 60 94 C 60 94 89 67 89 47 C 89 32 77 20 60 20 Z" fill="#FFFFFF"/>'
            '<circle cx="60" cy="47" r="14" fill="#1C2127"/>'
            '<path d="M60 36 L63.4 44 L72 47 L63.4 50 L60 58 L56.6 50 L48 47 L56.6 44 Z" fill="#F2A516"/>'
            '<path d="M24 102 Q 60 82 96 102" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9"/>')
    return defs, base + body

def tile_farm():
    defs, base = _tile_base("tf", "#CF2440", "#6E0F1E")
    body = ('<polygon points="26,92 26,60 36,44 60,31 84,44 94,60 94,92" fill="#F7EEDC"/>'
            '<rect x="46" y="64" width="28" height="28" fill="#A5152A"/><path d="M46 64 L74 92 M74 64 L46 92" stroke="#F7EEDC" stroke-width="3"/>'
            '<rect x="46" y="64" width="28" height="28" fill="none" stroke="#F7EEDC" stroke-width="3"/>'
            '<rect x="53" y="43" width="14" height="9" rx="1.5" fill="#A5152A"/>'
            '<path d="M91 22 A9 9 0 1 0 98 35 A7 7 0 1 1 91 22 Z" fill="#F5C518"/>')
    return defs, base + body

def tile_site():
    defs, base = _tile_base("ts", "#1F5C86", "#0A1C30")
    body = ('<polygon points="60,76 96,91 60,106 24,91" fill="#5FB37A"/><polygon points="24,91 60,106 60,113 24,98" fill="#2A5A3C"/><polygon points="96,91 60,106 60,113 96,98" fill="#1B3F29"/>'
            '<rect x="57" y="72" width="6" height="9" fill="#4B2E1C"/>'
            '<polygon points="42,76 78,76 60,50" fill="#F7EEDC"/><polygon points="46,62 74,62 60,36" fill="#F7EEDC"/><polygon points="51,49 69,49 60,24" fill="#F7EEDC"/>'
            '<polygon points="60,24 69,49 60,49" fill="#D9CDB6"/><polygon points="60,36 74,62 60,62" fill="#D9CDB6"/><polygon points="60,50 78,76 60,76" fill="#D9CDB6"/>'
            '<circle cx="94" cy="28" r="6.5" fill="#F5C518"/>')
    return defs, base + body

TILES = {"baylo": tile_baylo, "lakbay-lokal": tile_lakbay, "wildwood-farm": tile_farm, "wildwood-site": tile_site}

def logo_svg(slug, baylo_href="baylo-mark.png"):
    defs, body = TILES[slug]()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 120 120" role="img" aria-label="{slug} logo">'
            f'<defs>{defs}</defs>{body.replace("{BAYLO}", baylo_href)}</svg>\n')

def card(slug, x, y, scale, baylo_href):
    """The logo as a floating card: shadow, tile and a soft glint."""
    defs, body = TILES[slug]()
    fid = "sh-" + slug[:4]
    return (f'<defs>{defs}<filter id="{fid}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".6"/></filter></defs>'
            f'<g class="a-cardfloat"><g transform="translate({x} {y}) scale({scale})" filter="url(#{fid})">{body.replace("{BAYLO}", baylo_href)}</g></g>')

def _arrowhead(cx, cy, r, deg, color, size=9):
    a = math.radians(deg); px, py = cx + r * math.cos(a), cy + r * math.sin(a)
    tx, ty = -math.sin(a), math.cos(a); rx, ry = math.cos(a), math.sin(a)
    tip = (px + tx * size, py + ty * size); b1 = (px - rx * size * .8, py - ry * size * .8); b2 = (px + rx * size * .8, py + ry * size * .8)
    return f'<polygon points="{tip[0]:.1f},{tip[1]:.1f} {b1[0]:.1f},{b1[1]:.1f} {b2[0]:.1f},{b2[1]:.1f}" fill="{color}"/>'

def _arc(cx, cy, r, d0, d1):
    p = lambda d: (cx + r * math.cos(math.radians(d)), cy + r * math.sin(math.radians(d)))
    (x0, y0), (x1, y1) = p(d0), p(d1)
    return f'<path d="M{x0:.1f} {y0:.1f} A{r} {r} 0 0 1 {x1:.1f} {y1:.1f}"/>'

def _wrap(inner, defs, label):
    return (f'<svg class="art-svg" viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice" '
            f'xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><title>{label}</title>'
            f'<defs>{defs}</defs>{inner}</svg>')

def _stars(pts, fill=CREAM):
    return "".join(f'<circle class="a-twinkle" style="--d:{(i * 0.7) % 3:.1f}s" cx="{x}" cy="{y}" r="{r}" fill="{fill}" opacity=".7"/>' for i, (x, y, r) in enumerate(pts))

# ---------------------------------------------------------------- Baylo: a swap between neighbours
def baylo():
    houses = ""
    hs = [34, 28, 38, 30, 36, 28, 34]; lit = [1, 0, 1, 1, 0, 1, 1]
    for i, h in enumerate(hs):
        x = 9 + i * 56; top = 394 - h
        houses += (f'<rect x="{x}" y="{top}" width="46" height="{h}" fill="#2B0E14"/>'
                   f'<polygon points="{x - 4},{top} {x + 23},{top - 20} {x + 50},{top}" fill="#4A1520"/>'
                   f'<rect x="{x + 17}" y="{top + 9}" width="12" height="12" rx="2" fill="{GOLD}" opacity="{0.95 if lit[i] else 0.18}"/>')
    defs = (f'<linearGradient id="bg-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3C101B"/><stop offset="1" stop-color="#150709"/></linearGradient>'
            f'<radialGradient id="gl-b"><stop offset="0" stop-color="#7FC4F2" stop-opacity=".26"/><stop offset=".55" stop-color="{GOLD}" stop-opacity=".10"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>')
    ring = (f'<g class="a-swap" fill="none" stroke="{GOLD}" stroke-width="5" stroke-linecap="round" opacity=".9">' + _arc(200, 212, 118, -158, -26) + _arc(200, 212, 118, 22, 154) + '</g>'
            + _arrowhead(200, 212, 118, -26, GOLD) + _arrowhead(200, 212, 118, 154, GOLD))
    vinyl = ('<g transform="translate(66 112) scale(.62)" class="a-float"><circle r="66" fill="#1B0A0E" stroke="#5A1F2B" stroke-width="3"/><circle r="55" fill="none" stroke="#2D1017" stroke-width="2"/><circle r="45" fill="none" stroke="#2D1017" stroke-width="2"/><circle r="35" fill="none" stroke="#2D1017" stroke-width="2"/>'
             f'<circle r="22" fill="{RED}"/><circle r="22" fill="none" stroke="{GOLD}" stroke-width="2"/><circle r="4" fill="#150709"/></g>')
    camera = ('<g transform="translate(336 322) scale(.62)" class="a-float" style="--d:-2.4s"><rect x="-54" y="-38" width="108" height="76" rx="14" fill="#E8DCCB"/>'
              '<path d="M-54 -14 H54 V24 a14 14 0 0 1 -14 14 H-40 a14 14 0 0 1 -14 -14 Z" fill="#2A1214"/><rect x="-28" y="-50" width="40" height="16" rx="5" fill="#D8C9B2"/>'
              f'<rect x="28" y="-30" width="14" height="9" rx="2" fill="{GOLD}"/><circle cy="6" r="27" fill="#1B0A0E" stroke="#C8B79B" stroke-width="5"/><circle cy="6" r="17" fill="#5E1019"/><circle cy="6" r="7" fill="#150709"/></g>')
    inner = ('<rect width="400" height="440" fill="url(#bg-b)"/><circle cx="200" cy="212" r="190" fill="url(#gl-b)"/>'
             + _stars([(40, 60, 1.6), (360, 48, 1.4), (320, 130, 1.2), (110, 52, 1.3), (200, 34, 1.5), (380, 220, 1.2), (20, 250, 1.3), (350, 270, 1.1)])
             + ring + vinyl + camera + card("baylo", 125, 137, 1.25, BAYLO)
             + '<rect x="0" y="394" width="400" height="46" fill="#0E0507"/>' + houses)
    return _wrap(inner, defs, "The Baylo logo, circled by arrows, with a record and a camera being swapped")

# ---------------------------------------------------------------- Lakbay Lokal: a day route on a map
def _pin(x, y, fill, dot):
    return (f'<g transform="translate({x} {y})"><path d="M0 0 C -9 -14 -12 -20 -12 -26 A12 12 0 1 1 12 -26 C 12 -20 9 -14 0 0 Z" fill="{fill}" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>'
            f'<circle cy="-26" r="4.8" fill="{dot}"/></g>')

def lakbay():
    defs = ('<linearGradient id="bg-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3128"/><stop offset="1" stop-color="#0B1411"/></linearGradient>'
            '<clipPath id="cp-l"><rect x="36" y="88" width="328" height="290" rx="16"/></clipPath>'
            '<filter id="sh-l" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="11" flood-color="#000" flood-opacity=".55"/></filter>'
            f'<radialGradient id="sun-l"><stop offset="0" stop-color="{GOLD}" stop-opacity=".5"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>')
    trees = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#6E8C58"/><circle cx="{x - 2}" cy="{y - 2}" r="{r * 0.55:.1f}" fill="#86A56B"/>'
                    for x, y, r in [(64, 300, 9), (130, 340, 7), (250, 350, 8), (336, 236, 9), (110, 160, 7), (300, 330, 6), (60, 200, 6)])
    route = "M84 332 C 66 300 74 262 96 236 S 112 132 164 120 S 262 110 300 152 S 326 252 306 316"
    inner = (
        '<rect width="400" height="440" fill="url(#bg-l)"/><circle cx="352" cy="62" r="70" fill="url(#sun-l)"/>'
        + _stars([(36, 54, 1.4), (70, 90, 1.2), (180, 40, 1.4), (240, 70, 1.2), (20, 160, 1.2)])
        + '<g transform="rotate(-3 200 233)"><g filter="url(#sh-l)"><rect x="36" y="88" width="328" height="290" rx="16" fill="#EFE3CC"/></g>'
          '<g clip-path="url(#cp-l)"><rect x="36" y="88" width="328" height="290" fill="#EFE3CC"/>'
          '<path d="M36 262 C 90 224 130 256 170 232 S 250 264 300 240 S 340 262 364 252 V378 H36 Z" fill="#CBD6A8"/>'
          '<path d="M36 342 C 100 312 150 342 210 322 S 310 342 364 322 V378 H36 Z" fill="#B3C48C"/>'
          '<path d="M36 186 C 100 160 150 202 205 176 S 300 212 364 176" fill="none" stroke="#8FB2C9" stroke-width="16" stroke-linecap="round"/>'
          '<ellipse cx="190" cy="352" rx="38" ry="14" fill="#8FB2C9"/>'
          + trees +
          f'<path class="a-route" d="{route}" fill="none" stroke="{RED}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 12"/>'
          + _pin(84, 332, RED, CREAM) + _pin(96, 236, RED, CREAM) + _pin(300, 152, RED, CREAM) + _pin(306, 316, GOLD, "#2A1214")
          + '<g transform="translate(332 122)"><circle r="22" fill="#F7EEDC" stroke="#B7A27C" stroke-width="2"/>'
            f'<polygon points="0,-17 5,0 0,-3 -5,0" fill="{RED}"/><polygon points="0,17 5,0 0,3 -5,0" fill="#B7A27C"/></g>'
          '</g></g>'
        + card("lakbay-lokal", 125, 150, 1.25, BAYLO)
        + "".join(f'<rect x="{x}" y="394" width="96" height="22" rx="11" fill="#2A1A1A" stroke="#5A3A3A"/><circle cx="{x + 14}" cy="405" r="5" fill="{GOLD}"/><rect x="{x + 28}" y="401" width="{w}" height="8" rx="4" fill="{CREAM}" opacity=".5"/>'
                  for x, w in [(48, 52), (152, 40), (256, 58)])
    )
    return _wrap(inner, defs, "The Lakbay Lokal logo above a map with a dotted route")

# ---------------------------------------------------------------- Wildwood Site: a forest island at night
def _pine(x, y, s=1.0):
    def p(pts, fill): return f'<polygon points="{" ".join(f"{x + px * s:.1f},{y + py * s:.1f}" for px, py in pts)}" fill="{fill}"/>'
    return (f'<rect x="{x - 2.5 * s:.1f}" y="{y - 4 * s:.1f}" width="{5 * s:.1f}" height="{8 * s:.1f}" fill="#3B2418"/>'
            + p([(-15, -2), (15, -2), (0, -27)], "#1D5636") + p([(-12, -15), (12, -15), (0, -38)], "#236640") + p([(-9, -28), (9, -28), (0, -50)], "#2C7748")
            + p([(0, -27), (15, -2), (6, -2)], "#10351F") + p([(0, -38), (12, -15), (5, -15)], "#133B24"))

def wildwood_site():
    defs = ('<linearGradient id="bg-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1322"/><stop offset=".55" stop-color="#10253A"/><stop offset="1" stop-color="#0E1A14"/></linearGradient>'
            '<linearGradient id="gr-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A7A4C"/><stop offset="1" stop-color="#1F4F33"/></linearGradient>'
            '<clipPath id="cp-s"><polygon points="200,160 340,230 200,300 60,230"/></clipPath>'
            '<radialGradient id="fire-s"><stop offset="0" stop-color="#FFB547" stop-opacity=".75"/><stop offset="1" stop-color="#FF8A2A" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="moon-s"><stop offset="0" stop-color="{CREAM}" stop-opacity=".35"/><stop offset="1" stop-color="{CREAM}" stop-opacity="0"/></radialGradient>')
    trees = "".join(_pine(x, y, s) for x, y, s in sorted([(184, 188, 0.9), (214, 204, 1.0), (246, 220, 1.05), (270, 238, .95), (140, 236, 1.0), (116, 224, .85), (170, 258, 1.05), (236, 284, 1.1), (96, 232, .7), (206, 222, .8)], key=lambda t: t[1]))
    flies = "".join(f'<circle class="a-twinkle" style="--d:{i * 0.5:.1f}s" cx="{x}" cy="{y}" r="2.2" fill="{GOLD}"/>' for i, (x, y) in enumerate([(150, 180), (262, 196), (110, 256), (300, 246), (190, 150), (228, 168), (84, 210)]))
    inner = (
        '<rect width="400" height="440" fill="url(#bg-s)"/>'
        '<circle cx="338" cy="70" r="64" fill="url(#moon-s)"/>'
        f'<circle cx="338" cy="70" r="20" fill="{CREAM}"/>'
        + _stars([(40, 58, 1.6), (90, 100, 1.2), (150, 48, 1.4), (240, 90, 1.2), (370, 150, 1.3), (30, 170, 1.2), (210, 36, 1.5), (280, 52, 1.1)])
        + '<g class="a-cloud"><ellipse cx="90" cy="130" rx="46" ry="10" fill="#fff" opacity=".10"/><ellipse cx="116" cy="122" rx="30" ry="9" fill="#fff" opacity=".10"/></g>'
        + '<g class="a-cloud" style="--d:-5s"><ellipse cx="300" cy="150" rx="40" ry="9" fill="#fff" opacity=".08"/></g>'
        # island
        + '<g transform="translate(0 52)"><ellipse cx="200" cy="338" rx="150" ry="22" fill="#000" opacity=".4"/>'
          '<polygon points="60,230 200,300 200,338 60,268" fill="#4B2E1C"/><polygon points="340,230 200,300 200,338 340,268" fill="#33200F"/>'
          '<polygon points="200,160 340,230 200,300 60,230" fill="url(#gr-s)"/>'
          '<g clip-path="url(#cp-s)"><path d="M118 186 Q175 214 200 232 T282 276" fill="none" stroke="#3E86B8" stroke-width="15"/>'
          '<path d="M118 186 Q175 214 200 232 T282 276" fill="none" stroke="#8CC6EC" stroke-width="3" opacity=".6"/></g>'
        + trees
        # campfire
        + '<circle class="a-flicker" cx="214" cy="270" r="40" fill="url(#fire-s)"/>'
          '<rect x="204" y="270" width="22" height="5" rx="2" fill="#3B2418" transform="rotate(-14 215 272)"/><rect x="204" y="270" width="22" height="5" rx="2" fill="#4B2E1C" transform="rotate(14 215 272)"/>'
          f'<path class="a-flicker" d="M214 246 C 224 256 226 266 214 272 C 202 266 204 256 214 246 Z" fill="#FF9A2E"/><path class="a-flicker" d="M214 256 C 219 261 220 267 214 271 C 208 267 209 261 214 256 Z" fill="{GOLD}"/>'
        + flies
        + '<ellipse cx="200" cy="310" rx="130" ry="10" fill="#fff" opacity=".06"/></g>'
        + card("wildwood-site", 125, 78, 1.25, BAYLO)
    )
    return _wrap(inner, defs, "The Wildwood Site logo floating above a forest island at night")

# ---------------------------------------------------------------- Wildwood Farm: a farm at dusk
def wildwood_farm():
    defs = ('<linearGradient id="bg-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24102E"/><stop offset=".45" stop-color="#7A2A45"/><stop offset=".72" stop-color="#E0764F"/><stop offset="1" stop-color="#F0A25A"/></linearGradient>'
            '<radialGradient id="sun-f"><stop offset="0" stop-color="#FFE29A" stop-opacity=".9"/><stop offset="1" stop-color="#FFB05A" stop-opacity="0"/></radialGradient>'
            f'<radialGradient id="eye-f"><stop offset="0" stop-color="{GOLD}" stop-opacity=".9"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>')
    rows = ""
    for j, y in enumerate([368, 394, 420]):
        rows += f'<rect x="30" y="{y}" width="340" height="16" rx="4" fill="#3E2216"/>'
        for i in range(14):
            x = 46 + i * 24
            rows += f'<path d="M{x} {y + 6} q -5 -9 -2 -13 q 3 4 2 13 q 5 -10 9 -12 q -1 6 -7 12 Z" fill="#6FA85A"/>'
    fence = "".join(f'<rect x="{x}" y="296" width="4" height="26" fill="#2A1418"/>' for x in range(176, 262, 17)) + '<rect x="174" y="302" width="92" height="3" fill="#2A1418"/><rect x="174" y="312" width="92" height="3" fill="#2A1418"/>'
    inner = (
        '<rect width="400" height="440" fill="url(#bg-f)"/>'
        + _stars([(50, 50, 1.6), (110, 90, 1.2), (170, 40, 1.4), (240, 70, 1.3), (30, 140, 1.2), (370, 40, 1.3), (350, 150, 1.2)])
        + f'<path d="M334 66 A26 26 0 1 0 346 108 A20 20 0 1 1 334 66 Z" fill="{CREAM}"/>'
        + '<g transform="translate(0 30)">'
        + '<circle cx="118" cy="292" r="86" fill="url(#sun-f)"/><circle cx="118" cy="292" r="46" fill="#FFD27A"/>'
        + '<path d="M0 300 Q 90 262 200 292 T 400 282 V440 H0 Z" fill="#46182B"/>'
        # barn
        + '<g><rect x="70" y="262" width="86" height="58" fill="#A5152A"/><polygon points="60,266 113,230 166,266" fill="#5E0F1B"/>'
          f'<rect x="97" y="288" width="32" height="32" fill="#7A0F1E"/><path d="M97 288 L129 320 M129 288 L97 320" stroke="{CREAM}" stroke-width="2.4"/>'
          f'<rect x="97" y="288" width="32" height="32" fill="none" stroke="{CREAM}" stroke-width="2.4"/>'
          f'<rect x="104" y="250" width="18" height="12" fill="#2A0A10"/><rect x="104" y="250" width="18" height="12" fill="none" stroke="{CREAM}" stroke-width="1.8"/></g>'
        + fence
        + '<path d="M0 346 Q 120 318 230 342 T 400 328 V440 H0 Z" fill="#240F18"/>'
        + rows
        # wolf, watching from the hill
        + '<g fill="#100508"><path d="M268 306 Q 270 274 292 266 L 300 252 L 306 266 L 314 252 L 318 268 Q 344 274 352 300 L 352 322 L 334 322 L 332 304 L 296 304 L 294 322 L 276 322 Z"/>'
          '<path d="M268 280 L 252 290 L 266 294 Z"/><path d="M350 304 q 26 -2 26 -26" fill="none" stroke="#100508" stroke-width="9" stroke-linecap="round"/></g>'
        + '<g class="a-eyes"><circle cx="276" cy="283" r="9" fill="url(#eye-f)"/><circle cx="276" cy="283" r="2.6" fill="#FFE29A"/><circle cx="288" cy="281" r="9" fill="url(#eye-f)"/><circle cx="288" cy="281" r="2.6" fill="#FFE29A"/></g>'
        + '</g>' + card("wildwood-farm", 125, 92, 1.25, BAYLO)
    )
    return _wrap(inner, defs, "A farm at dusk: a red barn, crops, the moon rising and a wolf watching from the hill")

ART = {"baylo": baylo, "lakbay-lokal": lakbay, "wildwood-site": wildwood_site, "wildwood-farm": wildwood_farm}
