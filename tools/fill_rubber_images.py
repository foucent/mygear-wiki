"""Fill remaining Hot-selling rubber images from TT11 / chtt / manufacturers."""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, quote_plus, urlparse, parse_qs, urlencode, urlunparse

from curl_cffi import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "images" / "price-list" / "rubbers"
PRICE = ROOT / "docs" / "shop" / "price-list.md"
OUT.mkdir(parents=True, exist_ok=True)

S = requests.Session()

LABELS = {
    "loki-rxton-i": "Loki RXTON I",
    "loki-rxton-iii": "Loki RXTON III",
    "loki-rxton-v": "Loki RXTON V (Orange Sponge)",
    "loki-rxton-vii": "Loki RXTON VII",
    "loki-rxton-ix-national": "Loki RXTON IX National (Blue Sponge)",
    "loki-arthur-china": "Loki Arthur China",
    "friendship-729-popular": "Friendship 729 Popular",
    "loki-t3": "Loki T3",
    "palio-cj8000": "Palio CJ8000",
    "reactor-platinum-power": "Reactor Platinum Power",
    "friendship-729-battle-ii-national": "Friendship 729 Battle II National",
    "galaxy-moon-speed": "Galaxy Moon Speed",
    "galaxy-jupiter-iii": "Galaxy Jupiter III",
    "xiom-vega-asia": "XIOM Vega Asia",
    "xiom-vega-china": "XIOM Vega China",
    "stiga-dna-dragon-grip": "Stiga DNA Dragon Grip",
    "stiga-dna-hybrid-m": "DNA Hybrid M (Red/Black)",
    "stiga-dna-platinum-xh": "DNA Platinum XH (Red/Black)",
    "stiga-dna-pro": "Stiga DNA Pro",
    "gewo-proton-neo-450": "Gewo Proton Neo 450",
    "gewo-venom-green": "Gewo Venom Green",
    "tibhar-k1": "Tibhar K1",
    "tibhar-k1-plus": "Tibhar K1 Plus",
    "tibhar-k2": "Tibhar K2",
    "tibhar-k3": "Tibhar K3",
    "tibhar-aurus": "Tibhar Aurus",
    "donic-bluefire-f1": "Donic Bluefire F1",
    "yasaka-thunder-dragon": "Yasaka Thunder Dragon",
    "yasaka-flying-dragon": "Yasaka Flying Dragon",
    "yasaka-flying-dragon-se": "Yasaka Flying Dragon Special Edition",
    "yasaka-kanglong": "Yasaka Kanglong",
    "victas-v102": "Victas V>102",
    "victas-spectol-s3": "Victas Spectol S3",
    "victas-v15-stiff": "Victas V>15 Stiff",
    "flextra": "FLEXTRA",
    "glayzer-09c": "GLAYZER 09C",
    "tenergy-19": "Tenergy 19",
    "dignics-05": "Dignics 05",
}


def dl(url: str, dest: Path, referer: str = "") -> bool:
    headers = {"User-Agent": "Mozilla/5.0"}
    if referer:
        headers["Referer"] = referer
    try:
        data = urllib.request.urlopen(
            urllib.request.Request(url, headers=headers), timeout=90
        ).read()
    except Exception:
        try:
            data = S.get(url, impersonate="chrome124", timeout=90, headers=headers).content
        except Exception as e:
            print(f"  fail {e}")
            return False
    if len(data) < 2500:
        return False
    if not (
        data[:3] == b"\xff\xd8\xff"
        or data[:8].startswith(b"\x89PNG")
        or data[:4] == b"RIFF"
    ):
        return False
    dest.write_bytes(data)
    print(f"  OK {dest.name} ({len(data)} B)")
    return True


def bigger_cdn(url: str) -> str:
    """Bump quickbutik / similar CDN size params."""
    if "w=350" in url:
        return url.replace("w=350", "w=800").replace("h=350", "h=800")
    return url


def imgs(html: str, base: str) -> list[str]:
    out = []
    for pat in [
        r'property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
        r'content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'(https://cdn\.quickbutik\.com/images/[^"\']+)',
        r'(https://static\.tabletennis11\.com/media/catalog/product/[^"\']+)',
        r'(https://www\.butterfly-global\.com/en/products/item/[^"\']+\.jpg)',
        r'src=["\'](https?://[^"\']+\.(?:jpe?g|png|webp)[^"\']*)["\']',
        r'data-src=["\'](https?://[^"\']+\.(?:jpe?g|png|webp)[^"\']*)["\']',
    ]:
        for m in re.finditer(pat, html, re.I):
            u = urljoin(base, m.group(1))
            if any(x in u.lower() for x in ("logo", "icon", "sprite", "favicon", "payment", "flag")):
                continue
            if u not in out:
                out.append(u)
    return out


def grab_page(url: str, dest: Path) -> bool:
    print(f"page {url}")
    try:
        r = S.get(url, impersonate="chrome124", timeout=60)
    except Exception as e:
        print(f"  {e}")
        return False
    if r.status_code >= 400:
        print(f"  status {r.status_code}")
        return False
    for u in imgs(r.text, url):
        u2 = bigger_cdn(u)
        if dl(u2, dest, referer=url) or (u2 != u and dl(u, dest, referer=url)):
            return True
    return False


def chtt_loki() -> None:
    url = "https://chtt.se/en/varumarken/loki/lokigummi"
    html = S.get(url, impersonate="chrome124", timeout=60).text
    # map alt -> first jpeg/png/webp
    found: dict[str, str] = {}
    for m in re.finditer(r'<img[^>]+>', html, re.I):
        tag = m.group(0)
        alt_m = re.search(r'alt=["\']([^"\']+)["\']', tag, re.I)
        src_m = re.search(r'(?:src|data-src)=["\']([^"\']+)["\']', tag, re.I)
        if not alt_m or not src_m:
            continue
        alt = alt_m.group(1).strip().lower()
        src = src_m.group(1)
        if alt not in found and "cdn.quickbutik" in src:
            found[alt] = urljoin(url, src)

    mapping = {
        "loki-rxton-i": "loki - rxton i",
        "loki-rxton-iii": "loki - rxton iii",
        "loki-rxton-v": "loki - rxton v",
        "loki-rxton-vii": "loki - rxton vii",
        "loki-rxton-ix-national": "loki - rxton ix",
        "loki-arthur-china": "loki - arthur china",
        "loki-t3": "loki - t3 speed",
    }
    for slug, key in mapping.items():
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 8000:
            print(f"keep {slug}")
            continue
        # exact preferred over special/train
        url_img = None
        for alt, src in found.items():
            if alt == key:
                url_img = src
                break
        if not url_img:
            for alt, src in found.items():
                if key in alt and "special" not in alt and "train" not in alt and "pro" not in alt:
                    url_img = src
                    break
        if not url_img:
            print(f"miss loki key {key}")
            continue
        print(f"loki {slug} <- {key}")
        dl(bigger_cdn(url_img), dest, referer=url)


def chtt_brand(path: str, slug: str, name_substr: str) -> None:
    dest = OUT / f"{slug}.jpg"
    if dest.exists() and dest.stat().st_size > 8000:
        print(f"keep {slug}")
        return
    url = f"https://chtt.se/en/{path}"
    try:
        html = S.get(url, impersonate="chrome124", timeout=60).text
    except Exception as e:
        print(slug, e)
        return
    for m in re.finditer(r'<img[^>]+>', html, re.I):
        tag = m.group(0)
        alt = (re.search(r'alt=["\']([^"\']+)["\']', tag, re.I) or [None, ""])[1].lower()
        src = (re.search(r'(?:src|data-src)=["\']([^"\']+)["\']', tag, re.I) or [None, ""])[1]
        if name_substr in alt and src:
            print(f"chtt {slug} <- {alt}")
            if dl(bigger_cdn(urljoin(url, src)), dest, referer=url):
                return
    # try product page search on chtt
    search = f"https://chtt.se/en/search?q={quote_plus(name_substr)}"
    grab_page(search, dest)


def tt11(slug: str, paths: list[str]) -> None:
    dest = OUT / f"{slug}.jpg"
    # always refresh platinum XH if forced
    for path in paths:
        url = f"https://www.tabletennis11.com/en/{path}"
        try:
            r = S.get(url, impersonate="chrome124", timeout=45)
        except Exception:
            continue
        title = (re.search(r"<title>(.*?)</title>", r.text) or [None, ""])[1]
        if r.status_code == 404 or "404" in title:
            continue
        print(f"tt11 {slug} <- {path}")
        for u in imgs(r.text, url):
            if "catalog/product" not in u:
                continue
            cands = [
                re.sub(r"/cache/[a-f0-9]+/", "/cache/207e23213cf636ccdef205098cf3c8a3/", u),
                u,
            ]
            m = re.search(r"(/[a-z0-9]/[a-z0-9]/[^/?#]+)$", u, re.I)
            if m:
                cands.insert(
                    0,
                    "https://static.tabletennis11.com/media/catalog/product" + m.group(1),
                )
            for c in cands:
                if dl(c, dest, referer=url):
                    return


def update_md() -> None:
    text = PRICE.read_text(encoding="utf-8")
    for slug, label in LABELS.items():
        dest = OUT / f"{slug}.jpg"
        if not dest.exists() or dest.stat().st_size < 2500:
            print(f"md skip {label}")
            continue
        rel = f"../images/price-list/rubbers/{slug}.jpg"
        pattern = (
            r"(!\[.*?\]\()../images/price-list/(?:rubber-placeholder\.jpg|rubbers/[^)]+)(\)"
            r"\s*\|\s*" + re.escape(label) + r")"
        )
        text2, n = re.subn(pattern, rf"\g<1>{rel}\g<2>", text, count=1)
        if n:
            text = text2
            print(f"md {label}")
        else:
            print(f"md miss row {label}")
    PRICE.write_text(text, encoding="utf-8")


def main() -> None:
    print("=== Loki from chtt.se ===")
    chtt_loki()

    print("\n=== TT11 fixes ===")
    tt11("stiga-dna-platinum-xh", ["stiga-dna-platinum-xh"])
    tt11("donic-bluefire-f1", ["donic-bluefire-m1", "donic-bluefire-f1"])  # M1 fallback last resort skip
    # Don't use M1 for F1 - try other sites instead

    print("\n=== chtt / other brands ===")
    brand_pages = [
        ("varumarken/friendship-729", "friendship-729-popular", "729 popular"),
        ("varumarken/friendship-729", "friendship-729-popular", "popular"),
        ("varumarken/palio", "palio-cj8000", "cj8000"),
        ("varumarken/reactor", "reactor-platinum-power", "platinum"),
        ("varumarken/stiga", "stiga-dna-pro", "dna pro"),
        ("varumarken/gewo", "gewo-proton-neo-450", "proton neo"),
        ("varumarken/gewo", "gewo-venom-green", "venom"),
        ("varumarken/tibhar", "tibhar-k1-plus", "k1 plus"),
        ("varumarken/tibhar", "tibhar-k2", "hybrid k2"),
        ("varumarken/tibhar", "tibhar-k2", "k2"),
        ("varumarken/donic", "donic-bluefire-f1", "bluefire f1"),
        ("varumarken/yasaka", "yasaka-thunder-dragon", "thunder dragon"),
        ("varumarken/yasaka", "yasaka-flying-dragon", "flying dragon"),
        ("varumarken/yasaka", "yasaka-kanglong", "kanglong"),
        ("varumarken/victas", "victas-v102", "v>102"),
        ("varumarken/victas", "victas-v102", "v 102"),
    ]
    for path, slug, key in brand_pages:
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 8000 and slug != "stiga-dna-platinum-xh":
            # re-check friendship popular maybe wrong
            if slug == "friendship-729-popular" and dest.stat().st_size > 0:
                pass
            else:
                print(f"keep {slug}")
                continue
        chtt_brand(path, slug, key)

    # Direct product pages on chtt
    print("\n=== chtt product pages ===")
    pages = {
        "loki-rxton-i": "https://chtt.se/en/varumarken/loki/lokigummi/loki-rxton-i",
        "loki-rxton-iii": "https://chtt.se/en/varumarken/loki/lokigummi/loki-rxton-iii",
        "loki-rxton-v": "https://chtt.se/en/varumarken/loki/lokigummi/loki-rxton-v",
        "loki-rxton-vii": "https://chtt.se/en/varumarken/loki/lokigummi/loki-rxton-vii",
        "loki-rxton-ix-national": "https://chtt.se/en/varumarken/loki/lokigummi/loki-rxton-ix",
        "loki-arthur-china": "https://chtt.se/en/varumarken/loki/lokigummi/loki-arthur-china",
        "loki-t3": "https://chtt.se/en/varumarken/loki/lokigummi/loki-t3-speed",
    }
    for slug, url in pages.items():
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 8000:
            continue
        grab_page(url, dest)

    # Butterfly verify from listing alts → item URLs via rubber list HTML item/ IDs
    print("\n=== butterfly item codes ===")
    html = S.get(
        "https://www.butterfly-global.com/en/products/rubber/", impersonate="chrome124", timeout=60
    ).text
    # Find product tiles: alt + nearby detail id in larger window
    for want, slug in [
        ("Flextra", "flextra"),
        ("Glayzer 09C", "glayzer-09c"),
        ("Tenergy 19", "tenergy-19"),
        ("Dignics 05", "dignics-05"),
    ]:
        dest = OUT / f"{slug}.jpg"
        # search pattern around alt
        m = re.search(
            rf'{re.escape(want)}[\s\S]{{0,800}}?/en/products/(?:detail|item)/(\d+)',
            html,
            re.I,
        )
        if not m:
            m = re.search(
                rf'/en/products/(?:detail|item)/(\d+)[\s\S]{{0,800}}?{re.escape(want)}',
                html,
                re.I,
            )
        if m:
            pid = m.group(1)
            print(want, pid)
            dl(f"https://www.butterfly-global.com/en/products/item/{pid}.jpg", dest)
        else:
            print("no id", want)

    # More retailer pages for stubborn EU/CN items
    print("\n=== retailer fallbacks ===")
    retailers = {
        "stiga-dna-pro": [
            "https://www.stigatabletennis.com/en/products/dna-pro-m-red",
            "https://tabletennis11.com/en/catalogsearch/result/?q=DNA+Pro+M",
            "https://www.megaspin.net/store/default.asp?cat=108",
        ],
        "donic-bluefire-f1": [
            "https://www.tabletennis11.com/en/catalogsearch/result/?q=Bluefire+F1",
            "https://www.megaspin.net/store/item.asp?item=donic-bluefire-f1",
            "https://chtt.se/en/search?q=Bluefire+F1",
        ],
        "tibhar-k1-plus": [
            "https://chtt.se/en/search?q=Hybrid+K1+Plus",
            "https://www.tabletennis11.com/en/catalogsearch/result/?q=Hybrid+K1+Plus",
        ],
        "tibhar-k2": [
            "https://chtt.se/en/search?q=Hybrid+K2",
            "https://www.tabletennis11.com/en/catalogsearch/result/?q=Hybrid+K2",
        ],
        "gewo-proton-neo-450": [
            "https://chtt.se/en/search?q=Proton+Neo+450",
            "https://www.gewo-tabletennis.com/",
        ],
        "gewo-venom-green": [
            "https://chtt.se/en/search?q=Venom+Green",
            "https://chtt.se/en/search?q=GEWO+Venom",
        ],
        "yasaka-thunder-dragon": [
            "https://chtt.se/en/search?q=Thunder+Dragon",
            "https://www.megaspin.net/store/default.asp?cat=yasaka",
        ],
        "yasaka-flying-dragon": [
            "https://chtt.se/en/search?q=Flying+Dragon",
        ],
        "yasaka-flying-dragon-se": [
            "https://chtt.se/en/search?q=Flying+Dragon+Special",
        ],
        "yasaka-kanglong": [
            "https://chtt.se/en/search?q=Kanglong",
        ],
        "victas-v102": [
            "https://chtt.se/en/search?q=V%3E102",
            "https://chtt.se/en/search?q=V102",
            "https://www.victas.com/en_eu/product/v-102/",
        ],
        "palio-cj8000": [
            "https://chtt.se/en/search?q=CJ8000",
            "https://chtt.se/en/search?q=Palio+CJ",
        ],
        "reactor-platinum-power": [
            "https://chtt.se/en/search?q=Reactor+Platinum",
            "https://chtt.se/en/search?q=Platinum+Power",
        ],
        "friendship-729-popular": [
            "https://chtt.se/en/search?q=729+Popular",
            "https://chtt.se/en/search?q=Friendship+Popular",
        ],
    }
    for slug, urls in retailers.items():
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 8000:
            print(f"keep {slug}")
            continue
        for u in urls:
            if grab_page(u, dest):
                break

    print("\n=== update markdown ===")
    update_md()
    missing = []
    for slug, label in LABELS.items():
        dest = OUT / f"{slug}.jpg"
        if not dest.exists() or dest.stat().st_size < 2500:
            missing.append(label)
    print(f"have {len(LABELS)-len(missing)}/{len(LABELS)}")
    if missing:
        print("still missing:")
        for m in missing:
            print(" -", m)


if __name__ == "__main__":
    main()
