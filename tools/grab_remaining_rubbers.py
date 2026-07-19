"""Grab remaining rubber images from known retailer product pages."""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

from curl_cffi import requests

OUT = Path(r"c:\1Work\mygear-wiki\docs\images\price-list\rubbers")
PRICE = Path(r"c:\1Work\mygear-wiki\docs\shop\price-list.md")
S = requests.Session()

PAGES = {
    "yasaka-thunder-dragon": [
        "https://www.ppongsuper.com/product/yasaka-thunder-dragon-table-tennis/",
        "https://tokspin.com/product/yasaka-thunder-dragon-table-tennis-rubber/",
    ],
    "yasaka-flying-dragon": [
        "https://tokspin.com/product/yasaka-flying-dragon-table-tennis-rubber/",
        "https://www.ppongsuper.com/product/yasaka-flying-dragon-table-tennis/",
        "https://www.tabletennisempire.com/product-page/yasaka-flying-dragon-table-tennis-rubber",
    ],
    "yasaka-flying-dragon-se": [
        "https://tokspin.com/product/yasaka-flying-dragon-special-edition/",
        "https://www.ppongsuper.com/product/yasaka-flying-dragon-special-edition/",
    ],
    "yasaka-kanglong": [
        "https://tokspin.com/product/yasaka-kanglong-table-tennis-rubber/",
        "https://www.ppongsuper.com/product/yasaka-kanglong/",
    ],
    "donic-bluefire-f1": [
        "https://tokspin.com/product/donic-bluefire-f1/",
        "https://www.ppongsuper.com/product/donic-bluefire-f1/",
        "https://ttnpp.com/store/227-donic-bluefire-f1.html",
    ],
    "stiga-dna-pro": [
        "https://www.ppongsuper.com/product/stiga-dna-pro-m/",
        "https://tokspin.com/product/stiga-dna-pro-m/",
        "https://www.stigatabletennis.com/en/products/dna-pro-m",
    ],
    "tibhar-k1-plus": [
        "https://www.ppongsuper.com/product/tibhar-hybrid-k1-plus/",
        "https://tokspin.com/product/tibhar-hybrid-k1-plus/",
    ],
    "tibhar-k2": [
        "https://www.ppongsuper.com/product/tibhar-hybrid-k2/",
        "https://tokspin.com/product/tibhar-hybrid-k2/",
    ],
    "victas-v102": [
        "https://www.ppongsuper.com/product/victas-vo-102/",
        "https://tokspin.com/product/victas-vo-102/",
        "https://www.ppongsuper.com/product/victas-v-102/",
    ],
    "gewo-proton-neo-450": [
        "https://www.ppongsuper.com/product/gewo-proton-neo-450/",
        "https://tokspin.com/product/gewo-proton-neo-450/",
    ],
    "gewo-venom-green": [
        "https://www.ppongsuper.com/product/gewo-venom/",
        "https://tokspin.com/product/gewo-venom-green/",
        "https://www.ppongsuper.com/?s=venom+green",
    ],
    "reactor-platinum-power": [
        "https://www.ppongsuper.com/product/reactor-platinum-power/",
        "https://tokspin.com/product/reactor-platinum-power/",
        "https://tokspin.com/?s=reactor+platinum",
    ],
}

LABELS = {
    "yasaka-thunder-dragon": "Yasaka Thunder Dragon",
    "yasaka-flying-dragon": "Yasaka Flying Dragon",
    "yasaka-flying-dragon-se": "Yasaka Flying Dragon Special Edition",
    "yasaka-kanglong": "Yasaka Kanglong",
    "donic-bluefire-f1": "Donic Bluefire F1",
    "stiga-dna-pro": "Stiga DNA Pro",
    "tibhar-k1-plus": "Tibhar K1 Plus",
    "tibhar-k2": "Tibhar K2",
    "victas-v102": "Victas V>102",
    "gewo-proton-neo-450": "Gewo Proton Neo 450",
    "gewo-venom-green": "Gewo Venom Green",
    "reactor-platinum-power": "Reactor Platinum Power",
}


def dl(url: str, dest: Path) -> bool:
    try:
        data = urllib.request.urlopen(
            urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}),
            timeout=45,
        ).read()
    except Exception:
        try:
            data = S.get(url, impersonate="chrome124", timeout=40).content
        except Exception:
            return False
    if len(data) < 4000:
        return False
    if not (
        data[:3] == b"\xff\xd8\xff"
        or data[:8].startswith(b"\x89PNG")
        or data[:4] == b"RIFF"
    ):
        return False
    dest.write_bytes(data)
    print(f"  OK {dest.name} ({len(data)} B) <- {url[:90]}")
    return True


def grab(url: str, dest: Path) -> bool:
    print(f"> {url}")
    try:
        r = S.get(url, impersonate="chrome124", timeout=40)
    except Exception as e:
        print(f"  {type(e).__name__}")
        return False
    print(f"  status {r.status_code} len {len(r.text)}")
    if r.status_code >= 400:
        return False
    imgs: list[str] = []
    for pat in [
        r'property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
        r'content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'src=["\'](https?://[^"\']+\.(?:jpe?g|png|webp)[^"\']*)["\']',
        r'data-src=["\'](https?://[^"\']+\.(?:jpe?g|png|webp)[^"\']*)["\']',
        r'src=["\'](/[^"\']+\.(?:jpe?g|png|webp)[^"\']*)["\']',
    ]:
        for m in re.finditer(pat, r.text, re.I):
            u = urljoin(url, m.group(1))
            if any(
                x in u.lower()
                for x in ("logo", "icon", "sprite", "favicon", "payment", "avatar", "emoji")
            ):
                continue
            if u not in imgs:
                imgs.append(u)
    for u in imgs[:15]:
        if dl(u, dest):
            return True
    return False


def update_all_md() -> None:
    all_labels = {
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
    text = PRICE.read_text(encoding="utf-8")
    missing = []
    for slug, label in all_labels.items():
        dest = OUT / f"{slug}.jpg"
        if not dest.exists() or dest.stat().st_size < 3000:
            missing.append(label)
            continue
        rel = f"../images/price-list/rubbers/{slug}.jpg"
        pat = (
            r"(!\[.*?\]\()../images/price-list/(?:rubber-placeholder\.jpg|rubbers/[^)]+)(\)"
            r"\s*\|\s*" + re.escape(label) + r")"
        )
        text2, n = re.subn(pat, rf"\g<1>{rel}\g<2>", text, count=1)
        if n:
            text = text2
            print("md", label)
    PRICE.write_text(text, encoding="utf-8")
    print(f"have {len(all_labels) - len(missing)}/{len(all_labels)}")
    if missing:
        print("still missing:")
        for m in missing:
            print(" -", m)


def main() -> None:
    for slug, urls in PAGES.items():
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 5000:
            print("have", slug)
            continue
        for url in urls:
            if grab(url, dest):
                break
    update_all_md()


if __name__ == "__main__":
    main()
