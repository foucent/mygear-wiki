"""
Fetch mygear.top pre-owned catalog with a hard rate limit: max 5 HTTP requests / minute.
Saves progress so it can be resumed.
"""
from __future__ import annotations

import json
import re
import time
import urllib.request
from html import unescape
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "tools" / "_preowned_catalog.json"
STATE = ROOT / "tools" / "_preowned_fetch_state.json"
IMG_DIR = ROOT / "docs" / "images" / "pre-owned"
IMG_DIR.mkdir(parents=True, exist_ok=True)

# Hard cap: 5 requests per 60 seconds
MIN_INTERVAL = 12.5
BASE = "https://mygear.top/product-category/pre-owned/"
UA = "Mozilla/5.0 (compatible; MyGearGuideBot/1.0; +https://guide.mygear.top/)"

_last_req = 0.0
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def rate_wait() -> None:
    global _last_req
    now = time.monotonic()
    wait = MIN_INTERVAL - (now - _last_req)
    if wait > 0:
        print(f"  throttle sleep {wait:.1f}s", flush=True)
        time.sleep(wait)
    _last_req = time.monotonic()


def fetch(url: str, binary: bool = False):
    rate_wait()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    print(f"GET {url}", flush=True)
    with opener.open(req, timeout=90) as resp:
        data = resp.read()
    return data if binary else data.decode("utf-8", "replace")


def fix_url(url: str) -> str:
    url = unescape(url)
    url = re.sub(r"-\d+x\d+(?=\.(?:jpg|jpeg|png|webp))", "", url, flags=re.I)
    parts = urlsplit(url)
    path = quote(parts.path, safe="/%._-~")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def slug_from_url(url: str) -> str:
    slug = url.rstrip("/").split("/")[-1]
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", slug).strip("-").lower()
    return slug[:80] or "item"


def parse_page(html: str) -> list[dict]:
    blocks = re.findall(r'<li[^>]*class="[^"]*product[^"]*"[^>]*>[\s\S]*?</li>', html)
    items = []
    for b in blocks:
        link = re.search(r'href="(https://mygear\.top/product/[^"]+)"', b)
        title = re.search(r'class="woocommerce-loop-product__title"[^>]*>(.*?)</', b)
        img = re.search(
            r'(?:data-src|src)="(https://mygear\.top/wp-content/uploads/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            b,
            re.I,
        )
        m = re.search(
            r"Current price is:\s*(?:&#036;|\$)\s*([0-9]+(?:\.[0-9]+)?)",
            b,
        )
        if not (link and title and m):
            continue
        name = re.sub(r"<[^>]+>", "", unescape(title.group(1))).strip()
        name = re.sub(r"\s+", " ", name)
        # normalize fullwidth letters
        name = name.replace("Ｙ", "Y").replace("ｙ", "y")
        p = float(m.group(1))
        price = str(int(p)) if p == int(p) else f"{p:.2f}".rstrip("0").rstrip(".")
        oos = "outofstock" in b.lower() or "out of stock" in b.lower()
        items.append(
            {
                "url": link.group(1),
                "slug": slug_from_url(link.group(1)),
                "name": name,
                "price": price,
                "img_url": fix_url(img.group(1)) if img else "",
                "oos": oos,
            }
        )
    return items


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"pages_done": [], "items": [], "images_done": []}


def save_state(st: dict) -> None:
    STATE.write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")


def discover_page_count(html: str) -> int:
    nums = [int(x) for x in re.findall(r"/product-category/pre-owned/page/(\d+)/", html)]
    # also "1–25 of 136"
    m = re.search(r"of\s+(\d+)\s+results", html, re.I)
    if m:
        total = int(m.group(1))
        return max(1, (total + 24) // 25)
    return max(nums) if nums else 1


def existing_gallery(slug: str) -> list[str] | None:
    # Prefer already-downloaded multi-photo albums under docs/images/<slug>/
    d = ROOT / "docs" / "images" / slug
    if d.is_dir():
        imgs = sorted(d.glob("*.jpg")) + sorted(d.glob("*.png"))
        if imgs:
            return [f"/images/{slug}/{p.name}" for p in imgs]
    return None


def main() -> None:
    st = load_state()
    by_url = {it["url"]: it for it in st.get("items", [])}

    # --- Phase 1: category pages ---
    if 1 not in st["pages_done"]:
        html = fetch(BASE)
        (ROOT / "tools" / "_preowned_p1.html").write_text(html, encoding="utf-8")
        pages = discover_page_count(html)
        print(f"pages={pages}", flush=True)
        for it in parse_page(html):
            by_url[it["url"]] = {**by_url.get(it["url"], {}), **it}
        st["pages_done"] = sorted(set(st["pages_done"] + [1]))
        st["page_count"] = pages
        st["items"] = list(by_url.values())
        save_state(st)
    else:
        pages = st.get("page_count") or 6
        print(f"resume pages={pages}, done={st['pages_done']}", flush=True)

    pages = st.get("page_count") or 6
    for n in range(2, pages + 1):
        if n in st["pages_done"]:
            continue
        html = fetch(f"{BASE}page/{n}/")
        (ROOT / "tools" / f"_preowned_p{n}.html").write_text(html, encoding="utf-8")
        for it in parse_page(html):
            by_url[it["url"]] = {**by_url.get(it["url"], {}), **it}
        st["pages_done"] = sorted(set(st["pages_done"] + [n]))
        st["items"] = list(by_url.values())
        save_state(st)

    items = list(by_url.values())
    # stable order: keep first-seen order from pages
    print(f"catalog items={len(items)}", flush=True)

    # --- Phase 2: thumbnails (1 per product) ---
    images_done = set(st.get("images_done", []))
    for it in items:
        slug = it["slug"]
        # reuse local album if present
        gal = existing_gallery(slug)
        if gal:
            it["local_img"] = gal[0]
            it["gallery"] = gal
            images_done.add(slug)
            continue
        dest = IMG_DIR / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 2000:
            it["local_img"] = f"/images/pre-owned/{dest.name}"
            it["gallery"] = [it["local_img"]]
            images_done.add(slug)
            continue
        if slug in images_done:
            it["local_img"] = f"/images/pre-owned/{dest.name}"
            it["gallery"] = [it["local_img"]]
            continue
        if not it.get("img_url"):
            it["local_img"] = ""
            it["gallery"] = []
            images_done.add(slug)
            continue
        try:
            data = fetch(it["img_url"], binary=True)
            if len(data) < 1500:
                raise RuntimeError(f"small {len(data)}")
            dest.write_bytes(data)
            print(f"  saved {dest.name} ({len(data)})", flush=True)
            it["local_img"] = f"/images/pre-owned/{dest.name}"
            it["gallery"] = [it["local_img"]]
        except Exception as e:
            print(f"  FAIL img {slug}: {e}", flush=True)
            it["local_img"] = ""
            it["gallery"] = []
        images_done.add(slug)
        st["images_done"] = sorted(images_done)
        st["items"] = items
        save_state(st)

    st["images_done"] = sorted(images_done)
    st["items"] = items
    save_state(st)
    OUT_JSON.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"DONE wrote {OUT_JSON} n={len(items)}", flush=True)


if __name__ == "__main__":
    main()
