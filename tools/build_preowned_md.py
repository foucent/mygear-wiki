"""Build docs/shop/pre-owned.md from tools/_preowned_catalog.json"""
from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "tools" / "_preowned_catalog.json"
OUT = ROOT / "docs" / "shop" / "pre-owned.md"


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def row(it: dict) -> str:
    name = it["name"]
    price = it["price"]
    sold = bool(it.get("oos"))
    gallery = it.get("gallery") or ([] if not it.get("local_img") else [it["local_img"]])
    img = it.get("local_img") or (gallery[0] if gallery else "")
    gal_attr = ""
    if len(gallery) > 1:
        gal_attr = f' data-gallery="{esc(",".join(gallery))}"'
    price_html = f"<del>${esc(price)}</del>" if sold else f"${esc(price)}"
    if not img:
        img_cell = "<td></td>"
    else:
        img_cell = (
            f'<td><img src="{esc(img)}" alt="{esc(name)}" loading="lazy"{gal_attr}></td>'
        )
    return (
        "    <tr>\n"
        f"      {img_cell}\n"
        f"      <td>{esc(name)}</td>\n"
        f'      <td style="text-align:right">{price_html}</td>\n'
        "    </tr>"
    )


def main() -> None:
    items = json.loads(CATALOG.read_text(encoding="utf-8"))
    body = "\n".join(row(it) for it in items)
    text = f"""---
icon: material/recycle-variant
source_url: https://mygear.top/product-category/pre-owned/
source_title: "Pre-owned"
imported: 2026-07-24
---

# Pre-owned

Pre-owned blades currently listed ({len(items)} items). Tap a photo to enlarge when a gallery is available; tap **+** to add to cart (one of each). Confirm stock and weight on WhatsApp before buying—listings change.

<p class="mg-price-legend" markdown="0"><span class="mg-price-legend__blade">Available</span><span class="mg-price-legend__sold">Sold / Out of stock</span></p>

<div class="mg-price-table mg-price-table--preowned" markdown="0">
<table>
  <thead>
    <tr>
      <th></th>
      <th>Product</th>
      <th style="text-align:right">Price (USD)</th>
    </tr>
  </thead>
  <tbody>
{body}
  </tbody>
</table>
</div>

!!! tip "Related"
    Checkout: [How to Order](how-to-order.md). New-gear USD references: [Blades](blades.md) · [Rubbers](rubbers.md). Policies: [FAQ & Updates](faq-and-updates.md).
"""
    OUT.write_text(text, encoding="utf-8")
    print("wrote", OUT, "rows=", len(items))


if __name__ == "__main__":
    main()
