"""Poster-style project covers (991x1300). Writes one HTML page per cover into out/;
shoot.js then screenshots them into images/covers/. Run: python src/covers/make_covers.py && node src/covers/shoot.js

Real screenshot behind a colour wash, the project's own fonts, and the logo tile
standing on the real screen laid flat like a print on a table."""
import sys, os, base64
import logos as art

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, "out")   # scratch folder, not committed
os.makedirs(OUT, exist_ok=True)

def uri(path):
    ext = path.rsplit(".", 1)[1].replace("jpg", "jpeg")
    return f"data:image/{ext};base64," + base64.b64encode(open(path, "rb").read()).decode()

def tile_uri(slug):
    return "data:image/svg+xml;base64," + base64.b64encode(art.logo_svg(slug).encode()).decode()

P = [
    dict(slug="lakbay-lokal", bg="images/projects/lakbay-start.webp", floor="images/projects/lakbay-plan.webp",
         fonts="family=Newsreader:ital,opsz,wght@1,6..72,500&family=Schibsted+Grotesk:wght@500;700;800",
         wash="linear-gradient(180deg, rgba(232,244,238,.90) 0%, rgba(214,236,228,.82) 55%, rgba(18,74,66,.55) 100%)",
         word='<span style="font-family:Schibsted Grotesk;font-weight:800;color:#123F3A;letter-spacing:-.04em">Lakbay</span> '
              '<span style="font-family:Newsreader;font-style:italic;font-weight:500;color:#B8860B;letter-spacing:-.02em">Lokal</span>',
         wsize=122, glow="#F7F1E1", sub_font="Schibsted Grotesk", sub_color="#123F3A",
         sub="A day planner for small, local places<br>near where you're staying<br>Alabang, Muntinlupa",
         floor_tint="rgba(18,74,66,.10)", base="#0E3F39"),
    dict(slug="wildwood-site", cover="wildwood", hero="images/projects/farm-title.webp", bg="images/projects/site-forest.webp", floor="images/projects/site-world.webp",
         fonts="family=Marcellus&family=Barlow+Condensed:wght@600;700",
         wash="linear-gradient(180deg, rgba(10,22,20,.55) 0%, rgba(10,22,20,.35) 50%, rgba(6,12,11,.80) 100%)",
         word='<span style="font-family:Marcellus;color:#EFE6D2;letter-spacing:.14em">WILDWOOD</span>',
         wsize=100, glow="rgba(0,0,0,.0)", sub_font="Barlow Condensed", sub_color="#E9C46A",
         sub="A cozy 3D farming and survival game<br>and the website that opens it<br>Six regions, one creek",
         floor_tint="rgba(0,0,0,.15)", base="#060C0B", dark=True),
]

TPL = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?{fonts}&display=block" rel="stylesheet">
<style>
html,body{{margin:0;width:991px;height:1300px;overflow:hidden;background:{base}}}
.bg{{position:absolute;inset:-40px;background:url({bg}) center/cover;filter:blur(10px) saturate(1.05);}}
.wash{{position:absolute;inset:0;background:{wash}}}
.grain{{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")}}
.mark{{position:absolute;top:40px;right:44px;width:92px;height:92px;border-radius:22px;box-shadow:0 10px 24px -10px rgba(0,0,0,.5)}}
.word{{position:absolute;top:270px;left:0;right:0;text-align:center;font-size:{wsize}px;line-height:1;white-space:nowrap;
  filter:drop-shadow(0 0 1px {glow}) drop-shadow(0 0 2px {glow}) drop-shadow(0 0 3px {glow}) drop-shadow(0 10px 18px rgba(0,0,0,.18))}}
.sub{{position:absolute;top:{subtop}px;left:60px;right:60px;text-align:center;font:800 27px/1.32 "{sub_font}";letter-spacing:.04em;text-transform:uppercase;color:{sub_color}}}
.stage{{position:absolute;left:0;right:0;bottom:0;height:560px;perspective:1100px;perspective-origin:50% 0%}}
.floor{{position:absolute;left:50%;bottom:-120px;width:1180px;height:740px;margin-left:-590px;border-radius:26px;overflow:hidden;
  transform:rotateX(64deg);transform-origin:50% 100%;background:url({floor}) center/cover;
  box-shadow:0 -2px 0 rgba(255,255,255,.35) inset, 0 40px 80px rgba(0,0,0,.6)}}
.floor:after{{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),{floor_tint} 45%,rgba(0,0,0,.05))}}
.fade{{position:absolute;left:0;right:0;bottom:0;height:560px;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 70%,rgba(0,0,0,.28) 100%)}}
.shadow{{position:absolute;left:50%;bottom:150px;width:360px;height:70px;margin-left:-180px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.62),rgba(0,0,0,.28) 55%,rgba(0,0,0,0));filter:blur(6px)}}
.photo{{position:absolute;left:50%;bottom:330px;width:400px;height:250px;margin-left:-200px;border:8px solid #F4EAE0;border-radius:16px;
  background:center/cover;transform:perspective(1200px) rotateX(9deg) rotateY(-7deg) rotateZ(-2deg);transform-origin:50% 100%;
  box-shadow:0 2px 0 #CBBFA9, 0 34px 50px -18px rgba(0,0,0,.75), 0 8px 18px rgba(0,0,0,.35)}}
.photo:after{{content:"";position:absolute;inset:0;border-radius:6px;background:linear-gradient(120deg,rgba(255,255,255,.22),rgba(255,255,255,0) 35%,rgba(0,0,0,0) 70%,rgba(0,0,0,.2))}}
.pshadow{{position:absolute;left:50%;bottom:306px;width:440px;height:46px;margin-left:-220px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(0,0,0,.6),rgba(0,0,0,.25) 55%,rgba(0,0,0,0));filter:blur(8px)}}
.tile{{position:absolute;left:50%;bottom:178px;width:300px;height:300px;margin-left:-150px;transform:perspective(900px) rotateY(-14deg) rotateX(4deg);
  border-radius:68px;box-shadow:16px 0 0 -2px rgba(0,0,0,.22), 0 30px 50px -20px rgba(0,0,0,.55)}}
.tile img{{width:100%;height:100%;display:block;border-radius:68px}}
.tile:after{{content:"";position:absolute;inset:0;border-radius:68px;background:linear-gradient(115deg,rgba(255,255,255,.28),rgba(255,255,255,0) 40%,rgba(0,0,0,0) 70%,rgba(0,0,0,.18))}}
</style></head><body>
<div class="bg"></div><div class="wash"></div>
<img class="mark" src="{tile}">
<div class="word">{word}</div>
<div class="sub">{sub}</div>
<div class="stage"><div class="floor"></div><div class="fade"></div></div>
{hero_html}
<div class="grain"></div>
</body></html>"""

for p in P:
    if p.get("hero"):
        hero_html = f'<div class="pshadow"></div><div class="photo" style="background-image:url({uri(os.path.join(ROOT, p["hero"]))})"></div>'
    else:
        hero_html = '<div class="shadow"></div><div class="tile"><img src="' + tile_uri(p["slug"]) + '"></div>'
    html = TPL.format(hero_html=hero_html, bg=uri(os.path.join(ROOT, p["bg"])), floor=uri(os.path.join(ROOT, p["floor"])),
                      tile=tile_uri(p["slug"]), subtop=270 + p["wsize"] + 44, **{k: v for k, v in p.items() if k not in ("bg", "floor", "hero", "cover")})
    open(os.path.join(OUT, p.get("cover", p["slug"]) + ".html"), "w").write(html)
print("ok")
