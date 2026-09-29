"""Give the guide articles' inline photographs a thumb, a srcset and lazy loading.

Every other image on the site is hand-written markup that already carries
`.thumb.webp` in its `src` and a full-size path in `data-full-src`. The guide
articles are the exception: their photographs are written as Markdown, so
Python-Markdown emits a bare `<img src="../../images/foo/01.webp">` and the page
downloads the full-size file for a slot that is never wider than the content
column.

Rewriting those 49 references by hand would work once and then be wrong the
next time an article is added, so the fix lives here instead: any image the
Markdown renderer produced (i.e. an `<img>` with no `class`) is pointed at the
720px thumb that `tools/generate_shop_thumbs.py` already wrote, offered the
sized variants that exist beside it, and marked lazy.

Nothing here invents a file. A candidate is only offered when it is on disk, and
an image whose thumb is missing is still marked lazy but otherwise left alone.
"""

import os
import re
from pathlib import Path

# An <img> Python-Markdown wrote has no class attribute; everything hand-written
# on this site has one (mg-card__media, mg-hero-slides__img, ...). Matching on
# the class keeps this hook clear of the markup that is already tuned.
IMG = re.compile(r"""<img\b(?:[^>"']|"[^"]*"|'[^']*')*>""", re.I)
CLASS = re.compile(r"""\sclass\s*=""", re.I)
SRC = re.compile(r"""(?<![\w-])src=(["'])([^"']*)\1""", re.I)
LOADING = re.compile(r"""\sloading\s*=""", re.I)

# <prefix>images/<rel>, where the prefix is "" for an absolute URL and "../../"
# for the relative one Python-Markdown writes on a nested page.
PATH = re.compile(r"""^(.*?)images/([\w./\-]+\.(?:jpe?g|png|webp))$""", re.I)

SIZES = "(min-width: 1220px) 976px, 92vw"
STEPS = (240, 480, 720, 1000)

_w: dict[Path, int] = {}


def _width(p: Path) -> int:
    if p not in _w:
        from PIL import Image

        with Image.open(p) as im:
            _w[p] = im.size[0]
    return _w[p]


def candidates(full: Path) -> list[tuple[str, int]]:
    """(filename, pixel width) for the variants that exist beside `full`.

    The original joins them only when it is itself <= 1000px wide: it is then
    the best copy that exists and there is no larger variant to fall back to.
    A wider original is left out on purpose -- it is the file that made these
    pages heavy.
    """
    out: list[tuple[str, int]] = []
    fw = _width(full)
    for size in STEPS:
        v = full.with_name("%s.thumb%s.webp" % (full.stem, "" if size == 720 else "-%d" % size))
        if not v.exists():
            continue
        w = _width(v)
        if w < fw:
            out.append((v.name, w))
    if fw <= 1000:
        out.append((full.name, fw))
    out.sort(key=lambda t: t[1])
    return out


def on_page_content(html, *, page, config, files):
    if "<img" not in html:
        return html

    docs = Path(config["docs_dir"])

    def one(m: re.Match) -> str:
        tag = m.group(0)
        if CLASS.search(tag):
            return tag
        sm = SRC.search(tag)
        if not sm:
            return tag
        q, src = sm.group(1), sm.group(2)
        pm = PATH.match(src)
        if not pm:
            return tag
        prefix, rel = pm.group(1), pm.group(2)
        full = docs / "images" / rel.replace("/", os.sep)
        if not full.exists():
            return tag
        # the URL up to and including the image's own folder, so a variant name
        # can be appended to it
        base = prefix + "images/" + (rel[: rel.rfind("/") + 1] if "/" in rel else "")

        thumb = full.with_name(full.stem + ".thumb.webp")
        add = ""
        if thumb.exists():
            cands = candidates(full)
            if len(cands) > 1:
                srcset = ", ".join("%s%s %dw" % (base, n, w) for n, w in cands)
                add = ' srcset="%s" sizes="%s"' % (srcset, SIZES)
            add += ' data-full-src="%s%s"' % (base, full.name)
            src = base + thumb.name

        # splice on the original tag first -- the src match's offsets are only
        # valid there -- and add the loading attributes to the result.
        out = tag[: sm.start()] + "src=%s%s%s%s" % (q, src, q, add) + tag[sm.end():]
        if not LOADING.search(tag):
            out = out.replace("<img", '<img loading="lazy" decoding="async"', 1)
        return out

    return IMG.sub(one, html)
