"""Fetch one TT11 product image per Hot-selling blade via curl_cffi."""
from __future__ import annotations

import re
import time
from pathlib import Path
from urllib.parse import urljoin

from curl_cffi import requests

OUT_DIR = Path(__file__).resolve().parents[1] / "docs" / "images" / "price-list" / "blades"
PRICE_LIST = Path(__file__).resolve().parents[1] / "docs" / "shop" / "price-list.md"
BASE = "https://www.tabletennis11.com/en/blades"
SEARCH = "https://www.tabletennis11.com/en/catalogsearch/result/"

TARGETS = [
    ("maze-advance", "Maze Advance", ["maze advance", "andrej maze"]),
    ("yasaka-ma-lin-carbon", "Yasaka Ma Lin Carbon", ["ma lin carbon", "malin carbon"]),
    ("nittaku-acoustic-carbon-g-revision", "Nittaku Acoustic Carbon G-Revision", [
        "acoustic carbon g-revision", "acoustic carbon g revision", "acoustic carbon"
    ]),
    ("dhs-hurricane-long-5", "DHS Hurricane Long 5", ["hurricane long 5"]),
    ("donic-zhang-jike-original-carbon", "Donic Zhang Jike Original Carbon", [
        "zhang jike original carbon", "original carbon"
    ]),
    ("harimoto-innerforce-alc", "Harimoto Innerforce ALC", [
        "harimoto innerforce alc", "tomokazu harimoto innerforce alc"
    ]),
    ("xiom-an-jaehyun-tmxi-pro", "Xiom An Jaehyun TMXi PRO", [
        "an jaehyun tmxi", "tmxi pro"
    ]),
    ("timo-boll-alc", "Timo Boll ALC", ["timo boll alc"]),
    ("viscaria", "Viscaria", ["viscaria"]),
    ("taksim-butterfly-king", "Taksim (Butterfly King)", ["taksim", "butterfly king"]),
    ("nittaku-goriki", "Nittaku Goriki", ["goriki"]),
    ("ovtcharov-innerforce-alc", "Ovtcharov Innerforce ALC", [
        "ovtcharov innerforce alc", "dimitrij ovtcharov innerforce alc"
    ]),
    ("xiom-chrome-xaxi", "Xiom Chrome XAXi", ["chrome xaxi"]),
    ("fan-zhendong-alc", "Fan Zhendong ALC", ["fan zhendong alc"]),
    ("zhang-jike-alc", "Zhang Jike ALC", ["zhang jike alc"]),
    ("stiga-cybershape-carbon-cwt-truls", "Stiga Cybershape Carbon CWT Truls Edition", [
        "cybershape carbon cwt", "cybershape carbon cwt truls"
    ]),
]

SESSION = requests.Session()


def get(url: str) -> str:
    r = SESSION.get(url, impersonate="chrome124", timeout=60)
    r.raise_for_status()
    return r.text


def prefer_larger(url: str) -> str:
    # Magento 2 cache hashes vary; try swapping small_image size segments if present
    for a, b in (
        ("/small_image/149x110/", "/image/600x600/"),
        ("/small_image/210x/", "/image/600x600/"),
        ("/thumbnail/", "/image/"),
    ):
        if a in url:
            return url.replace(a, b)
    return url


def match_target(name: str, left: list) -> tuple | None:
    n = name.lower().strip()
    n = re.sub(r"^view\s+", "", n, flags=re.I)
    for item in left:
        slug, label, keys = item
        for k in keys:
            if k not in n:
                continue
            if slug == "dhs-hurricane-long-5" and (
                "long 5x" in n or "national" in n or "w968" in n
            ):
                continue
            if slug == "zhang-jike-alc" and ("original" in n or "new era" in n or "donic" in n):
                continue
            if slug == "timo-boll-alc" and "spirit" in n:
                continue
            if slug == "viscaria" and any(x in n for x in ("super", "light", "edition", "inner")):
                continue
            if slug == "nittaku-acoustic-carbon-g-revision":
                if "acoustic carbon" not in n:
                    continue
                if "g-revision" not in n and "g revision" not in n and "revision" not in n:
                    # accept plain Acoustic Carbon only if G-Revision not required yet
                    if n.rstrip() == "nittaku acoustic carbon":
                        pass
                    elif "g" not in n:
                        continue
            if slug == "stiga-cybershape-carbon-cwt-truls":
                if "cybershape" not in n:
                    continue
            return item
    return None


def parse_products(html: str, page_url: str) -> list[tuple[str, str]]:
    """Return (name, image_url) pairs from catalog/search HTML."""
    out: list[tuple[str, str]] = []
    seen = set()

    # Magento product-item blocks
    for block in re.finditer(
        r'<li[^>]*class="[^"]*product-item[^"]*"[\s\S]*?</li>',
        html,
        re.I,
    ):
        chunk = block.group(0)
        img_m = re.search(
            r'<img[^>]+(?:src|data-src)=["\']([^"\']+catalog/product[^"\']+)["\']',
            chunk,
            re.I,
        )
        if not img_m:
            continue
        img = urljoin(page_url, img_m.group(1))
        name = ""
        link_m = re.search(
            r'class="[^"]*product-item-link[^"]*"[^>]*>([^<]+)<',
            chunk,
            re.I,
        )
        if link_m:
            name = re.sub(r"\s+", " ", link_m.group(1)).strip()
        if not name:
            alt_m = re.search(r'<img[^>]+alt=["\']([^"\']+)["\']', chunk, re.I)
            if alt_m:
                name = re.sub(r"\s+", " ", alt_m.group(1)).strip()
                name = re.sub(r"^View\s+", "", name, flags=re.I)
        if not name:
            continue
        key = name.lower() + "|" + img
        if key in seen:
            continue
        seen.add(key)
        out.append((name, img))

    if out:
        return out

    # Fallback: img alt containing product names near static CDN
    for m in re.finditer(
        r'<img[^>]+(?:src|data-src)=["\'](https?://static\.tabletennis11\.com/media/catalog/product[^"\']+)["\'][^>]*>',
        html,
        re.I,
    ):
        tag = m.group(0)
        img = m.group(1)
        alt_m = re.search(r'alt=["\']([^"\']+)["\']', tag, re.I)
        if not alt_m:
            continue
        name = re.sub(r"\s+", " ", alt_m.group(1)).strip()
        name = re.sub(r"^View\s+", "", name, flags=re.I)
        if len(name) < 3:
            continue
        key = name.lower() + "|" + img
        if key in seen:
            continue
        seen.add(key)
        out.append((name, img))
    return out


def download(url: str, dest: Path) -> bool:
    candidates = []
    larger = prefer_larger(url)
    if larger != url:
        candidates.append(larger)
    candidates.append(url)
    # Uncached original: .../product/x/y/file.jpg after last /hash/ folders
    m = re.search(r"/product/(?:cache/[^/]+/)*(?:[^/]+/)*([a-z0-9]/[a-z0-9]/[^/?#]+)$", url, re.I)
    if m:
        # Prefer last path segment pattern a/b/file
        tail = re.search(r"(/[a-z0-9]/[a-z0-9]/[^/?#]+)$", url, re.I)
        if tail:
            candidates.insert(0, "https://static.tabletennis11.com/media/catalog/product" + tail.group(1))

    for u in candidates:
        try:
            r = SESSION.get(
                u,
                impersonate="chrome124",
                timeout=60,
                headers={"Referer": "https://www.tabletennis11.com/"},
            )
            if r.status_code == 200 and len(r.content) > 1500:
                dest.write_bytes(r.content)
                print(f"  saved {dest.name} ({len(r.content)} B) <- {u[:100]}")
                return True
            print(f"  skip {r.status_code} {len(r.content)} {u[:100]}")
        except Exception as e:
            print(f"  fail {u[:100]}: {e}")
    return False


def update_price_list(mapping: dict[str, str]) -> None:
    text = PRICE_LIST.read_text(encoding="utf-8")
    for label, rel in mapping.items():
        # Replace placeholder only on the matching product row
        pattern = (
            r"(!\[.*?\]\()../images/price-list/(?:placeholder\.jpg|blades/[^)]+)(\)"
            r"\s*\|\s*" + re.escape(label) + r")"
        )
        repl = r"\1" + rel + r"\2"
        new_text, n = re.subn(pattern, repl, text, count=1)
        if n:
            text = new_text
            print(f"  md updated: {label}")
        else:
            print(f"  md miss row: {label}")
    PRICE_LIST.write_text(text, encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    found: dict[str, tuple[str, str, str]] = {}
    left = list(TARGETS)

    for page_num in range(1, 40):
        url = BASE if page_num == 1 else f"{BASE}?p={page_num}"
        print(f"\n=== page {page_num}: {url}")
        html = get(url)
        items = parse_products(html, url)
        print(f"  products: {len(items)}")
        if not items:
            print("  empty, stop")
            break
        for name, img in items:
            hit = match_target(name, left)
            if not hit:
                continue
            slug, label, _ = hit
            found[slug] = (label, name, img)
            left = [t for t in left if t[0] != slug]
            print(f"  MATCH {label} <- {name}")
            print(f"    {img}")
        if not left:
            break
        time.sleep(0.4)

    # Search fallback
    for slug, label, keys in list(left):
        from urllib.parse import quote_plus

        q = keys[0]
        url = f"{SEARCH}?q={quote_plus(q)}"
        print(f"\n=== search: {label} ({q})")
        try:
            html = get(url)
        except Exception as e:
            print("  search fail", e)
            continue
        for name, img in parse_products(html, url):
            hit = match_target(name, [(slug, label, keys)])
            if not hit:
                continue
            found[slug] = (label, name, img)
            left = [t for t in left if t[0] != slug]
            print(f"  MATCH {label} <- {name}")
            print(f"    {img}")
            break
        time.sleep(0.3)

    # Direct product URL guesses for Butterfly / missing
    guesses = {
        "viscaria": ["butterfly-viscaria", "viscaria"],
        "timo-boll-alc": ["butterfly-timo-boll-alc", "timo-boll-alc"],
        "harimoto-innerforce-alc": [
            "butterfly-tomokazu-harimoto-innerforce-alc",
            "butterfly-harimoto-innerforce-alc",
            "tomokazu-harimoto-innerforce-alc",
        ],
        "ovtcharov-innerforce-alc": [
            "butterfly-ovtcharov-innerforce-alc",
            "butterfly-dimitrij-ovtcharov-innerforce-alc",
        ],
        "fan-zhendong-alc": ["butterfly-fan-zhendong-alc", "fan-zhendong-alc"],
        "zhang-jike-alc": ["butterfly-zhang-jike-alc", "zhang-jike-alc"],
        "maze-advance": ["maze-advance", "victas-maze-advance", "andrej-maze-advance"],
        "taksim-butterfly-king": ["taksim", "yinhe-taksim", "butterfly-king-taksim"],
    }
    for slug, label, keys in list(left):
        for key in guesses.get(slug, []):
            for prefix in ("en", "other_eng"):
                url = f"https://www.tabletennis11.com/{prefix}/{key}"
                print(f"\n=== direct: {url}")
                try:
                    html = get(url)
                except Exception as e:
                    print("  ", e)
                    continue
                if "404" in html[:500].lower() or "was not found" in html.lower():
                    print("  404")
                    continue
                # gallery / og:image
                imgs = re.findall(
                    r'(?:og:image"|product-image|gallery)[^>]+(?:content|src|data-src)=["\']([^"\']+catalog/product[^"\']+)',
                    html,
                    re.I,
                )
                imgs += re.findall(
                    r'(https?://static\.tabletennis11\.com/media/catalog/product/[^"\']+)',
                    html,
                    re.I,
                )
                title_m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
                name = re.sub(r"<[^>]+>", "", title_m.group(1)).strip() if title_m else label
                if imgs:
                    found[slug] = (label, name, imgs[0])
                    left = [t for t in left if t[0] != slug]
                    print(f"  MATCH {label} <- {name}")
                    print(f"    {imgs[0]}")
                    break
            if slug not in {t[0] for t in left}:
                break

    print("\n=== download ===")
    mapping: dict[str, str] = {}
    for slug, label, _ in TARGETS:
        if slug not in found:
            print(f"MISSING: {label}")
            continue
        _, name, img = found[slug]
        ext = ".jpg"
        m = re.search(r"\.(jpe?g|png|webp)(?:\?|$)", img, re.I)
        if m:
            ext = "." + m.group(1).lower().replace("jpeg", "jpg")
        dest = OUT_DIR / f"{slug}{ext}"
        if download(img, dest):
            mapping[label] = f"../images/price-list/blades/{dest.name}"

    print("\n=== update markdown ===")
    update_price_list(mapping)

    map_path = OUT_DIR / "_mapping.txt"
    map_path.write_text(
        "\n".join(f"{k}\t{v}" for k, v in mapping.items()) + "\n",
        encoding="utf-8",
    )
    print(f"done: {len(mapping)}/{len(TARGETS)}")
    if left:
        print("still missing:")
        for _, label, _ in left:
            print(" -", label)


if __name__ == "__main__":
    main()
