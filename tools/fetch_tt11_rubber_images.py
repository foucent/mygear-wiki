"""Fetch one product image per Hot-selling rubber: TT11 first, then fallbacks."""
from __future__ import annotations

import re
import time
import urllib.request
from pathlib import Path
from urllib.parse import quote_plus, urljoin

from curl_cffi import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "images" / "price-list" / "rubbers"
PRICE = ROOT / "docs" / "shop" / "price-list.md"
BASE = "https://www.tabletennis11.com/en/rubbers"
SEARCH = "https://www.tabletennis11.com/en/catalogsearch/result/"

# label -> (slug, match keys on TT11 / search)
TARGETS = [
    ("loki-rxton-i", "Loki RXTON I", ["rxton i", "rxton 1", "loki rxton i"]),
    ("loki-rxton-iii", "Loki RXTON III", ["rxton iii", "rxton 3", "loki rxton iii"]),
    ("loki-rxton-v", "Loki RXTON V (Orange Sponge)", ["rxton v", "rxton 5"]),
    ("loki-rxton-vii", "Loki RXTON VII", ["rxton vii", "rxton 7"]),
    ("loki-rxton-ix-national", "Loki RXTON IX National (Blue Sponge)", [
        "rxton ix", "rxton 9"
    ]),
    ("loki-arthur-china", "Loki Arthur China", ["arthur china", "loki arthur"]),
    ("friendship-729-popular", "Friendship 729 Popular", [
        "729 popular", "friendship popular", "729-2"
    ]),
    ("loki-t3", "Loki T3", ["loki t3", "loki t-3"]),
    ("palio-cj8000", "Palio CJ8000", ["cj8000", "cj 8000"]),
    ("reactor-platinum-power", "Reactor Platinum Power", [
        "platinum power", "reactor platinum"
    ]),
    ("friendship-729-battle-ii-national", "Friendship 729 Battle II National", [
        "battle ii national", "battle 2 national", "729 battle ii"
    ]),
    ("galaxy-moon-speed", "Galaxy Moon Speed", [
        "moon speed", "yinhe moon speed", "galaxy moon"
    ]),
    ("galaxy-jupiter-iii", "Galaxy Jupiter III", [
        "jupiter iii", "jupiter 3", "yinhe jupiter"
    ]),
    ("xiom-vega-asia", "XIOM Vega Asia", ["vega asia"]),
    ("xiom-vega-china", "XIOM Vega China", ["vega china"]),
    ("stiga-dna-dragon-grip", "Stiga DNA Dragon Grip", ["dna dragon grip", "dragon grip"]),
    ("stiga-dna-hybrid-m", "DNA Hybrid M (Red/Black)", [
        "dna hybrid m", "dna hybrid medium"
    ]),
    ("stiga-dna-platinum-xh", "DNA Platinum XH (Red/Black)", [
        "dna platinum xh", "platinum xh"
    ]),
    ("stiga-dna-pro", "Stiga DNA Pro", ["dna pro"]),
    ("gewo-proton-neo-450", "Gewo Proton Neo 450", ["proton neo 450"]),
    ("gewo-venom-green", "Gewo Venom Green", ["venom green"]),
    ("tibhar-k1", "Tibhar K1", ["hybrid k1", "tibhar k1"]),
    ("tibhar-k1-plus", "Tibhar K1 Plus", ["k1 plus", "hybrid k1 plus"]),
    ("tibhar-k2", "Tibhar K2", ["hybrid k2", "tibhar k2"]),
    ("tibhar-k3", "Tibhar K3", ["hybrid k3", "tibhar k3"]),
    ("tibhar-aurus", "Tibhar Aurus", ["tibhar aurus"]),
    ("donic-bluefire-f1", "Donic Bluefire F1", ["bluefire f1"]),
    ("yasaka-thunder-dragon", "Yasaka Thunder Dragon", ["thunder dragon"]),
    ("yasaka-flying-dragon", "Yasaka Flying Dragon", ["flying dragon"]),
    ("yasaka-flying-dragon-se", "Yasaka Flying Dragon Special Edition", [
        "flying dragon special", "flying dragon se"
    ]),
    ("yasaka-kanglong", "Yasaka Kanglong", ["kanglong", "kang long"]),
    ("victas-v102", "Victas V>102", ["v>102", "v 102", "v102"]),
    ("victas-spectol-s3", "Victas Spectol S3", ["spectol s3"]),
    ("victas-v15-stiff", "Victas V>15 Stiff", ["v>15 stiff", "v15 stiff", "v>15 stiff"]),
    ("flextra", "FLEXTRA", ["flextra"]),
    ("glayzer-09c", "GLAYZER 09C", ["glayzer 09c", "glayzer09c"]),
    ("tenergy-19", "Tenergy 19", ["tenergy 19"]),
    ("dignics-05", "Dignics 05", ["dignics 05"]),
]

SESSION = requests.Session()


def get_html(url: str) -> str:
    r = SESSION.get(url, impersonate="chrome124", timeout=60)
    r.raise_for_status()
    return r.text


def parse_products(html: str, page_url: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    seen = set()
    for block in re.finditer(
        r'<li[^>]*class="[^"]*product-item[^"]*"[\s\S]*?</li>', html, re.I
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
            r'class="[^"]*product-item-link[^"]*"[^>]*>([^<]+)<', chunk, re.I
        )
        if link_m:
            name = re.sub(r"\s+", " ", link_m.group(1)).strip()
        if not name:
            alt_m = re.search(r'<img[^>]+alt=["\']([^"\']+)["\']', chunk, re.I)
            if alt_m:
                name = re.sub(r"^View\s+", "", alt_m.group(1), flags=re.I).strip()
        if not name:
            continue
        key = name.lower() + "|" + img
        if key in seen:
            continue
        seen.add(key)
        out.append((name, img))
    return out


def match_target(name: str, left: list) -> tuple | None:
    n = name.lower().strip()
    for item in left:
        slug, label, keys = item
        for k in keys:
            if k not in n:
                continue
            # disambiguation
            if slug == "tibhar-k1" and ("plus" in n or "k1+" in n or "k2" in n or "k3" in n):
                continue
            if slug == "tibhar-k1-plus" and "plus" not in n and "k1+" not in n:
                continue
            if slug == "tibhar-k2" and ("k1" in n or "k3" in n) and "k2" not in n:
                continue
            if slug == "tibhar-k3" and "k3" not in n:
                continue
            if slug == "tibhar-aurus" and ("sound" in n or "select" in n or "prime" in n):
                continue
            if slug == "yasaka-flying-dragon" and (
                "special" in n or " se" in n or "edition" in n
            ):
                continue
            if slug == "stiga-dna-pro" and (
                "hybrid" in n or "platinum" in n or "dragon" in n or "pro h" in n
            ):
                continue
            if slug == "xiom-vega-asia" and "china" in n:
                continue
            if slug == "xiom-vega-china" and "asia" in n:
                continue
            if slug == "loki-rxton-i" and any(
                x in n for x in ("iii", " vii", " ix", " v ", "rxton v", "rxton 5")
            ):
                # allow exact "rxton i" / "rxton 1"
                if not re.search(r"rxton\s*(i|1)\b", n):
                    continue
            if slug == "dignics-05" and ("09" in n or "64" in n or "80" in n):
                continue
            if slug == "tenergy-19" and "19" not in n:
                continue
            if slug == "flextra" and "glayzer" in n:
                continue
            return item
    return None


def prefer_larger_cache(url: str) -> list[str]:
    """Return candidate URLs preferring Magento larger caches / originals."""
    cands = []
    m = re.search(r"(/[a-z0-9]/[a-z0-9]/[^/?#]+)$", url, re.I)
    if m:
        cands.append("https://static.tabletennis11.com/media/catalog/product" + m.group(1))
    # known larger cache hash from blades run
    if "/cache/" in url:
        cands.append(
            re.sub(
                r"/cache/[a-f0-9]+/",
                "/cache/207e23213cf636ccdef205098cf3c8a3/",
                url,
            )
        )
        cands.append(url)
    else:
        cands.append(url)
    # unique preserve order
    seen = set()
    out = []
    for u in cands:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def download(url: str, dest: Path) -> bool:
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.tabletennis11.com/",
    }
    for u in prefer_larger_cache(url) if "tabletennis11" in url else [url]:
        try:
            req = urllib.request.Request(u, headers=headers)
            data = urllib.request.urlopen(req, timeout=90).read()
        except Exception:
            try:
                r = SESSION.get(u, impersonate="chrome124", timeout=90, headers=headers)
                data = r.content
                if r.status_code != 200:
                    continue
            except Exception as e:
                print(f"    fail {u[:90]}: {e}")
                continue
        if len(data) < 2000:
            continue
        if not (
            data[:3] == b"\xff\xd8\xff"
            or data[:8] == b"\x89PNG\r\n\x1a\n"
            or data[:4] == b"RIFF"
        ):
            continue
        dest.write_bytes(data)
        print(f"    saved {dest.name} ({len(data)} B)")
        return True
    return False


def extract_imgs(html: str, base: str) -> list[str]:
    imgs = []
    pats = [
        r'property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
        r'content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'data-zoom-image=["\']([^"\']+)',
        r'(https?://static\.tabletennis11\.com/media/catalog/product/[^"\']+)',
        r'src=["\'](https?://[^"\']+\.(?:jpe?g|png|webp)[^"\']*)["\']',
    ]
    for pat in pats:
        for m in re.finditer(pat, html, re.I):
            u = urljoin(base, m.group(1))
            if any(x in u.lower() for x in ("logo", "icon", "sprite", "favicon", "placeholder")):
                continue
            if u not in imgs:
                imgs.append(u)
    return imgs


def update_md(mapping: dict[str, str]) -> None:
    text = PRICE.read_text(encoding="utf-8")
    for label, rel in mapping.items():
        pattern = (
            r"(!\[.*?\]\()../images/price-list/(?:rubber-placeholder\.jpg|rubbers/[^)]+)(\)"
            r"\s*\|\s*" + re.escape(label) + r")"
        )
        text2, n = re.subn(pattern, rf"\g<1>{rel}\g<2>", text, count=1)
        if n:
            text = text2
            print(f"  md {label}")
        else:
            print(f"  md miss {label}")
    PRICE.write_text(text, encoding="utf-8")


# Fallback pages when not on TT11 (Chinese brands / Butterfly geo)
FALLBACKS: dict[str, list[str]] = {
    # Butterfly global item pages / codes
    "flextra": [
        "https://www.butterfly-global.com/en/products/detail/06070.html",
    ],
    "glayzer-09c": [
        "https://www.butterfly-global.com/en/products/detail/06110.html",
    ],
    "tenergy-19": [
        "https://www.butterfly-global.com/en/products/detail/06090.html",
    ],
    "dignics-05": [
        "https://www.butterfly-global.com/en/products/detail/06050.html",
    ],
    # mygear / other retailers — filled dynamically via search URLs below
}


def try_butterfly_item(slug: str, dest: Path) -> bool:
    """Guess Butterfly Global item JPG codes from known rubber SKUs."""
    codes = {
        "flextra": ["06070", "06070m"],
        "glayzer-09c": ["06110", "06110m", "06100"],
        "tenergy-19": ["06090", "06090m", "06080"],
        "dignics-05": ["06050", "06050m", "06040"],
    }.get(slug, [])
    for code in codes:
        for ext in (f"{code}.jpg", f"{code}m.jpg", f"{code}m-2.jpg"):
            url = f"https://www.butterfly-global.com/en/products/item/{ext}"
            if download(url, dest):
                return True
    # list page alt scrape
    html = get_html("https://www.butterfly-global.com/en/products/rubber/")
    want = {
        "flextra": "flextra",
        "glayzer-09c": "glayzer 09c",
        "tenergy-19": "tenergy 19",
        "dignics-05": "dignics 05",
    }.get(slug, "")
    for m in re.finditer(
        r'alt="([^"]+)"[\s\S]{0,400}?detail/(\d+)\.html|detail/(\d+)\.html[\s\S]{0,400}?alt="([^"]+)"',
        html,
        re.I,
    ):
        if m.group(1) and m.group(2):
            alt, pid = m.group(1), m.group(2)
        else:
            pid, alt = m.group(3), m.group(4)
        if want and want in alt.lower() and "09c" not in want or (
            want and want.replace(" ", "") in alt.lower().replace(" ", "")
        ):
            if want == "dignics 05" and ("09" in alt or "64" in alt or "80" in alt):
                continue
            if want == "glayzer 09c" and "09c" not in alt.lower():
                continue
            url = f"https://www.butterfly-global.com/en/products/item/{pid}.jpg"
            if download(url, dest):
                return True
    # simpler: find detail id by exact alt
    for m in re.finditer(r'alt="([^"]+)"', html, re.I):
        pass
    for m in re.finditer(
        rf'alt="([^"]*{re.escape(want)}[^"]*)"[\s\S]{{0,500}}?item/(\d+)',
        html,
        re.I,
    ):
        pass
    # walk detail ids near product names in links
    for m in re.finditer(
        r'href="(/en/products/detail/(\d+)\.html)"[^>]*>\s*([^<]+)', html, re.I
    ):
        name = re.sub(r"\s+", " ", m.group(3)).strip().lower()
        pid = m.group(2)
        if slug == "flextra" and name == "flextra":
            return download(
                f"https://www.butterfly-global.com/en/products/item/{pid}.jpg", dest
            )
        if slug == "glayzer-09c" and "glayzer 09c" in name:
            return download(
                f"https://www.butterfly-global.com/en/products/item/{pid}.jpg", dest
            )
        if slug == "tenergy-19" and name == "tenergy 19":
            return download(
                f"https://www.butterfly-global.com/en/products/item/{pid}.jpg", dest
            )
        if slug == "dignics-05" and name == "dignics 05":
            return download(
                f"https://www.butterfly-global.com/en/products/item/{pid}.jpg", dest
            )
    return False


def try_external_search(slug: str, label: str, dest: Path) -> bool:
    """Last-resort: manufacturer / shop product pages via curated queries."""
    # Chinese brands — try common shop paths / open search pages
    queries = {
        "loki-rxton-i": [
            "https://www.megaspin.net/store/item.asp?item=loki-rxton-1",
        ],
    }
    # Broad: scan butterfly rubber list already; also try mygear.top WooCommerce
    mygear_guesses = {
        "dignics-05": "https://mygear.top/product/butterfly-dignics-05/",
        "tenergy-19": "https://mygear.top/product/butterfly-tenergy-19/",
        "glayzer-09c": "https://mygear.top/product/butterfly-glayzer-09c/",
        "flextra": "https://mygear.top/product/butterfly-flextra/",
        "xiom-vega-asia": "https://mygear.top/product/xiom-vega-asia/",
        "xiom-vega-china": "https://mygear.top/product/xiom-vega-china/",
    }
    if slug in mygear_guesses:
        try:
            html = get_html(mygear_guesses[slug])
            for img in extract_imgs(html, mygear_guesses[slug]):
                if "wp-content" in img or "uploads" in img:
                    if download(img, dest):
                        return True
        except Exception as e:
            print(f"    mygear fail {e}")

    if slug in (
        "flextra",
        "glayzer-09c",
        "tenergy-19",
        "dignics-05",
    ):
        if try_butterfly_item(slug, dest):
            return True

    # Alibaba-style unlikely. Try tabletennisdb / tt11 search done already.
    return False


def product_page_large(name_img_url: str, product_name: str) -> str | None:
    """If we only have listing thumb, try to find product URL from name slug."""
    return None


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    found: dict[str, tuple[str, str, str]] = {}
    left = list(TARGETS)

    print("=== paginate TT11 rubbers ===")
    for page_num in range(1, 50):
        url = BASE if page_num == 1 else f"{BASE}?p={page_num}"
        print(f"\npage {page_num}")
        try:
            html = get_html(url)
        except Exception as e:
            print("  stop", e)
            break
        items = parse_products(html, url)
        print(f"  products {len(items)}")
        if not items:
            break
        for name, img in items:
            hit = match_target(name, left)
            if not hit:
                continue
            slug, label, _ = hit
            found[slug] = (label, name, img)
            left = [t for t in left if t[0] != slug]
            print(f"  MATCH {label} <- {name}")
        if not left:
            break
        time.sleep(0.25)

    print("\n=== search fallback ===")
    for slug, label, keys in list(left):
        q = keys[0]
        url = f"{SEARCH}?q={quote_plus(q)}"
        print(f"search {label} ({q})")
        try:
            html = get_html(url)
        except Exception as e:
            print("  fail", e)
            continue
        for name, img in parse_products(html, url):
            hit = match_target(name, [(slug, label, keys)])
            if hit:
                found[slug] = (label, name, img)
                left = [t for t in left if t[0] != slug]
                print(f"  MATCH {label} <- {name}")
                break
        time.sleep(0.2)

    # Direct product URL guesses from name
    print("\n=== direct product URLs ===")
    guesses = {
        "xiom-vega-asia": ["xiom-vega-asia"],
        "xiom-vega-china": ["xiom-vega-china"],
        "stiga-dna-dragon-grip": ["stiga-dna-dragon-grip"],
        "stiga-dna-hybrid-m": ["stiga-dna-hybrid-m", "stiga-dna-hybrid-m-red"],
        "stiga-dna-platinum-xh": ["stiga-dna-platinum-xh"],
        "stiga-dna-pro": ["stiga-dna-pro-s", "stiga-dna-pro-m", "stiga-dna-pro"],
        "gewo-proton-neo-450": ["gewo-proton-neo-450"],
        "gewo-venom-green": ["gewo-naxxo-50-hard", "gewo-venom"],  # may miss
        "tibhar-k1": ["tibhar-hybrid-k1"],
        "tibhar-k1-plus": ["tibhar-hybrid-k1-plus"],
        "tibhar-k2": ["tibhar-hybrid-k2"],
        "tibhar-k3": ["tibhar-hybrid-k3"],
        "tibhar-aurus": ["tibhar-aurus"],
        "donic-bluefire-f1": ["donic-bluefire-f1"],
        "victas-v102": ["victas-v-102", "victas-v102"],
        "victas-spectol-s3": ["victas-spectol-s3"],
        "victas-v15-stiff": ["victas-v-15-stiff", "victas-v15-stiff"],
        "yasaka-thunder-dragon": ["yasaka-thunder-dragon"],
        "yasaka-flying-dragon": ["yasaka-flying-dragon"],
        "yasaka-kanglong": ["yasaka-kanglong"],
        "palio-cj8000": ["palio-cj8000"],
        "galaxy-moon-speed": ["yinhe-moon-speed", "galaxy-moon-speed"],
        "galaxy-jupiter-iii": ["yinhe-jupiter-3", "yinhe-jupiter-iii"],
    }
    for slug, label, keys in list(left):
        for key in guesses.get(slug, []):
            for prefix in ("en",):
                url = f"https://www.tabletennis11.com/{prefix}/{key}"
                try:
                    html = get_html(url)
                except Exception:
                    continue
                if "404" in (re.search(r"<title>(.*?)</title>", html) or [""])[0]:
                    continue
                imgs = extract_imgs(html, url)
                title_m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
                name = (
                    re.sub(r"<[^>]+>", "", title_m.group(1)).strip()
                    if title_m
                    else label
                )
                cat_imgs = [u for u in imgs if "catalog/product" in u]
                if cat_imgs:
                    found[slug] = (label, name, cat_imgs[0])
                    left = [t for t in left if t[0] != slug]
                    print(f"  MATCH {label} <- {name}")
                    break
            if slug not in {t[0] for t in left}:
                break

    print("\n=== download ===")
    mapping: dict[str, str] = {}
    for slug, label, _ in TARGETS:
        dest = OUT / f"{slug}.jpg"
        if slug in found:
            _, name, img = found[slug]
            # upgrade via product page if listing thumb
            print(f"{label} ({name})")
            # try product page from listing URL pattern using name
            ok = download(img, dest)
            if ok and dest.stat().st_size < 15000:
                # try larger cache already in download(); also hit product page
                pass
            if ok:
                mapping[label] = f"../images/price-list/rubbers/{dest.name}"
                continue
        print(f"{label} — external")
        if try_external_search(slug, label, dest):
            mapping[label] = f"../images/price-list/rubbers/{dest.name}"
        else:
            print(f"  STILL MISSING: {label}")

    print("\n=== update markdown ===")
    update_md(mapping)
    print(f"done {len(mapping)}/{len(TARGETS)}")
    missing = [label for _, label, _ in TARGETS if label not in mapping]
    if missing:
        print("missing:")
        for m in missing:
            print(" -", m)


if __name__ == "__main__":
    main()
