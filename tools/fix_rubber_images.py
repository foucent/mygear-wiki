"""Fix Butterfly rubber SKUs and fill remaining images."""
from __future__ import annotations

import re
import urllib.request
from pathlib import Path
from urllib.parse import urljoin

from curl_cffi import requests

OUT = Path(r"c:\1Work\mygear-wiki\docs\images\price-list\rubbers")
PRICE = Path(r"c:\1Work\mygear-wiki\docs\shop\price-list.md")
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


def dl(url: str, dest: Path) -> bool:
    try:
        data = urllib.request.urlopen(
            urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}),
            timeout=60,
        ).read()
    except Exception:
        try:
            data = S.get(url, impersonate="chrome124", timeout=45).content
        except Exception as e:
            print(" fail", e)
            return False
    if len(data) > 3000 and (
        data[:3] == b"\xff\xd8\xff"
        or data[:8].startswith(b"\x89PNG")
        or data[:4] == b"RIFF"
    ):
        dest.write_bytes(data)
        print("OK", dest.name, len(data))
        return True
    print("no", dest.name, len(data))
    return False


def bigger(u: str) -> str:
    return u.replace("w=350", "w=800").replace("h=350", "h=800") if "w=350" in u else u


def main() -> None:
    # Correct Butterfly SKUs
    for code, slug in [
        ("05210", "flextra"),
        ("06110", "glayzer-09c"),
        ("06090", "tenergy-19"),
        ("06040", "dignics-05"),
    ]:
        dl(f"https://www.butterfly-global.com/en/products/item/{code}.jpg", OUT / f"{slug}.jpg")

    # tabletennisspin product pages
    tts = {
        "donic-bluefire-f1": "rubbers/donic-bluefire-f1.html",
        "stiga-dna-pro": "rubbers/stiga-dna-pro-m.html",
        "tibhar-k2": "rubbers/tibhar-hybrid-k2.html",
        "tibhar-k1-plus": "rubbers/tibhar-hybrid-k1-plus.html",
        "victas-v102": "rubbers/victas-vo-102.html",
        "yasaka-thunder-dragon": "rubbers/yasaka-thunder-dragon.html",
        "yasaka-flying-dragon": "rubbers/yasaka-flying-dragon.html",
        "yasaka-kanglong": "rubbers/yasaka-kanglong.html",
        "gewo-proton-neo-450": "rubbers/gewo-proton-neo-450.html",
        "reactor-platinum-power": "rubbers/reactor-platinum-power.html",
        "yasaka-flying-dragon-se": "rubbers/yasaka-flying-dragon-special-edition.html",
        "gewo-venom-green": "rubbers/gewo-venom.html",
    }
    for slug, path in tts.items():
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 5000:
            print("have", slug)
            continue
        url = "https://tabletennisspin.com/" + path
        try:
            r = S.get(url, impersonate="chrome124", timeout=35)
        except Exception as e:
            print(path, type(e).__name__)
            continue
        print("tts", path, r.status_code)
        if r.status_code != 200:
            continue
        imgs = re.findall(
            r"(https://tabletennisspin\.com/[0-9]+[^\"']*\.(?:jpg|jpeg|png|webp))",
            r.text,
            re.I,
        )
        imgs += [
            urljoin(url, m)
            for m in re.findall(r'src=["\']([^"\']+\.(?:jpg|jpeg|png|webp))["\']', r.text, re.I)
        ]
        for u in imgs[:12]:
            if any(x in u.lower() for x in ("logo", "icon", "payment", "banner")):
                continue
            if dl(u, dest):
                break

    # chtt product URLs for tibhar hybrid if exist
    for slug, path in [
        ("tibhar-k1-plus", "https://chtt.se/en/varumarken/tibhar/tibhargummi/tibhar-hybrid-k1-plus"),
        ("tibhar-k2", "https://chtt.se/en/varumarken/tibhar/tibhargummi/tibhar-hybrid-k2"),
        ("stiga-dna-pro", "https://chtt.se/en/varumarken/stiga/stigagummi/stiga-dna-pro-m"),
        ("donic-bluefire-f1", "https://chtt.se/en/varumarken/donic/donicgummi/donic-bluefire-f1"),
        ("victas-v102", "https://chtt.se/en/varumarken/victas/victasgummi/victas-vo-102"),
        ("gewo-proton-neo-450", "https://chtt.se/en/varumarken/gewo/gewogummi/gewo-proton-neo-450"),
        ("reactor-platinum-power", "https://chtt.se/en/varumarken/reactor/reactorgummi/reactor-platinum-power"),
        ("yasaka-thunder-dragon", "https://chtt.se/en/varumarken/yasaka/yasakagummi/yasaka-thunder-dragon"),
        ("yasaka-flying-dragon", "https://chtt.se/en/varumarken/yasaka/yasakagummi/yasaka-flying-dragon"),
        ("yasaka-kanglong", "https://chtt.se/en/varumarken/yasaka/yasakagummi/yasaka-kanglong"),
    ]:
        dest = OUT / f"{slug}.jpg"
        if dest.exists() and dest.stat().st_size > 5000:
            continue
        try:
            r = S.get(path, impersonate="chrome124", timeout=35)
        except Exception:
            continue
        print("chtt", slug, r.status_code)
        if r.status_code != 200:
            continue
        for m in re.finditer(r"(https://cdn\.quickbutik\.com/images/[^\"']+)", r.text):
            if dl(bigger(m.group(1)), dest):
                break

    # Update markdown
    text = PRICE.read_text(encoding="utf-8")
    missing = []
    for slug, label in LABELS.items():
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
    print(f"have {len(LABELS) - len(missing)}/{len(LABELS)}")
    for m in missing:
        print(" -", m)


if __name__ == "__main__":
    main()
