"""Patch Hot-selling blades image paths in price-list.md."""
from __future__ import annotations

import re
from pathlib import Path

PRICE = Path(__file__).resolve().parents[1] / "docs" / "shop" / "price-list.md"
OUT = Path(__file__).resolve().parents[1] / "docs" / "images" / "price-list" / "blades"

MAPPING = {
    "Maze Advance": "maze-advance.jpg",
    "Yasaka Ma Lin Carbon": "yasaka-ma-lin-carbon.jpg",
    "Nittaku Acoustic Carbon G-Revision": "nittaku-acoustic-carbon-g-revision.jpg",
    "DHS Hurricane Long 5": "dhs-hurricane-long-5.jpg",
    "Donic Zhang Jike Original Carbon": "donic-zhang-jike-original-carbon.jpg",
    "Harimoto Innerforce ALC": "harimoto-innerforce-alc.jpg",
    "Xiom An Jaehyun TMXi PRO": "xiom-an-jaehyun-tmxi-pro.jpg",
    "Timo Boll ALC": "timo-boll-alc.jpg",
    "Viscaria": "viscaria.jpg",
    "Taksim (Butterfly King)": "taksim-butterfly-king.jpg",
    "Nittaku Goriki": "nittaku-goriki.jpg",
    "Ovtcharov Innerforce ALC": "ovtcharov-innerforce-alc.jpg",
    "Xiom Chrome XAXi": "xiom-chrome-xaxi.jpg",
    "Fan Zhendong ALC": "fan-zhendong-alc.jpg",
    "Zhang Jike ALC": "zhang-jike-alc.jpg",
    "Stiga Cybershape Carbon CWT Truls Edition": "stiga-cybershape-carbon-cwt-truls.jpg",
}


def main() -> None:
    text = PRICE.read_text(encoding="utf-8")
    for label, fname in MAPPING.items():
        if not (OUT / fname).exists():
            print("missing file", fname)
            continue
        rel = f"../images/price-list/blades/{fname}"
        pattern = (
            r"(!\[.*?\]\()../images/price-list/(?:placeholder\.jpg|blades/[^)]+)(\)"
            r"\s*\|\s*" + re.escape(label) + r")"
        )
        text2, n = re.subn(pattern, rf"\g<1>{rel}\g<2>", text, count=1)
        if n:
            text = text2
            print("updated", label)
        else:
            print("row not found", label)
    PRICE.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
