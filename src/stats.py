"""Snapshot of each project's GitHub repository: commit count and last update.

    python src/stats.py      # then: npm run build

Writes src/github_stats.json, which build.py bakes into the pages, so the numbers show without
JavaScript. For public repos, site.js also refreshes them live in the visitor's browser.

Private repos (Lakbay Lokal) can only be read with a token: set GITHUB_TOKEN to one that can read them.
Only the count and the date are kept; nothing else about a private repo reaches the site.
Uses only per-repository endpoints (/repos/owner/name/...).
"""
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "github_stats.json")
API = "https://api.github.com/repos/"
os.environ.setdefault("SIMPLE_ICONS_DIR", "")  # data.py reads it at import; stats don't need icons
sys.path.insert(0, HERE)
from data import PROJECTS, SITE_REPO  # noqa: E402

TOKEN = os.environ.get("GITHUB_TOKEN", "")
CTX = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or None)


def get(url):
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "portfolio-stats",
                                               **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {})})
    with urllib.request.urlopen(req, context=CTX, timeout=20) as r:
        return json.load(r), r.headers.get("Link", "")


def repo_stats(full):
    info, _ = get(API + full)
    # One commit per page: the page number of the "last" link is the commit count on the default branch.
    commits, link = get(f"{API}{full}/commits?per_page=1&sha={info['default_branch']}")
    last = re.search(r'[?&]page=(\d+)>; rel="last"', link)
    return {"commits": int(last.group(1)) if last else len(commits), "pushed_at": info["pushed_at"],
            "private": bool(info["private"]), "url": None if info["private"] else info["html_url"]}


def main():
    repos = sorted({full for p in PROJECTS for full, _ in p.get("repos", [])} | {SITE_REPO})
    old = json.load(open(OUT)) if os.path.exists(OUT) else {}
    stats = {}
    for full in repos:
        try:
            stats[full] = repo_stats(full)
            print(f"{full}: {stats[full]['commits']} commits, updated {stats[full]['pushed_at'][:10]}")
        except (urllib.error.URLError, KeyError, ValueError) as e:
            if full in old:   # keep the last good snapshot rather than dropping a project's numbers
                stats[full] = old[full]
                print(f"{full}: kept the previous numbers ({e})")
            else:
                print(f"{full}: skipped ({e})")
    with open(OUT, "w") as f:
        json.dump(stats, f, indent=2, sort_keys=True)
        f.write("\n")


if __name__ == "__main__":
    main()
