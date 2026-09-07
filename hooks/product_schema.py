"""Inject schema.org Product JSON-LD into /gear/<slug>/ product pages.

Each entry holds the facts already published on the matching page and in the
price tables (docs/blades.md / docs/rubbers.md): product name, brand, primary
product photo and list price in USD. Keep this table in sync when a product
page or its price changes.

No aggregateRating / Review is emitted: the rating bars shown on the pages
are community samples displayed as plain content, not on-page user reviews,
so an AggregateRating here could read as self-serving review markup.
"""

import json

# slug -> (name, brand, image path, price USD, mpn)
PRODUCTS = {
    "fan-zhendong-alc": (
        "Butterfly Fan Zhendong ALC", "Butterfly",
        "images/price-list/blades/fan-zhendong-alc.jpg", 159, None),
    "zhang-jike-alc": (
        "Butterfly Zhang Jike ALC", "Butterfly",
        "images/price-list/blades/zhang-jike-alc.jpg", 169, None),
    "ovtcharov-innerforce-alc": (
        "Butterfly Ovtcharov Innerforce ALC", "Butterfly",
        "images/price-list/blades/ovtcharov-innerforce-alc.jpg", 149, None),
    "viscaria": (
        "Butterfly Viscaria", "Butterfly",
        "images/price-list/blades/viscaria.jpg", 133, None),
    "timo-boll-alc": (
        "Butterfly Timo Boll ALC", "Butterfly",
        "images/price-list/blades/timo-boll-alc.jpg", 133, None),
    "harimoto-innerforce-alc": (
        "Butterfly Harimoto Innerforce ALC", "Butterfly",
        "images/price-list/blades/harimoto-innerforce-alc.jpg", 130, None),
    "dhs-hurricane-long-5": (
        "DHS Hurricane Long 5", "DHS",
        "images/price-list/blades/dhs-hurricane-long-5.thumb.webp", 112, None),
    "victas-koki-niwa": (
        "Victas Koki Niwa", "Victas",
        "images/price-list/blades/victas-koki-niwa.jpg", 145, None),
    "dignics-09c": (
        "Butterfly Dignics 09C", "Butterfly",
        "images/dignics-09c/01.jpg", 73, "06070"),
    "zyre-03": (
        "Butterfly ZYRE-03", "Butterfly",
        "images/zyre-03/01.jpg", 89, "06140"),
    "tenergy-05": (
        "Butterfly Tenergy 05", "Butterfly",
        "images/tenergy-05/01.jpg", 68, "05800"),
    "dignics-05": (
        "Butterfly Dignics 05", "Butterfly",
        "images/dignics-05/01.jpg", 68, "06040"),
}


def on_page_context(context, page, config, nav):
    if not page.url.startswith("gear/") or not page.url.endswith("/"):
        return
    slug = page.url[len("gear/"):-1]
    if slug not in PRODUCTS:
        return
    name, brand, img, price, mpn = PRODUCTS[slug]
    if not page.meta.get("description"):
        return

    site = config["site_url"].rstrip("/")
    page_url = f"{site}/{page.url}"
    image = f"{site}/{img}"

    # Content freshness: "Updated on <date>" as a small line under the H1, and
    # dateModified mirrored in the JSON-LD so the crawl date matches what the
    # visitor sees. Bump `updated:` in the page frontmatter whenever the page
    # content is revised.
    updated = page.meta.get("updated")
    updated_str = str(updated)[:10] if updated else None
    if updated_str:
        sub = ('<p class="mg-updated">Updated '
               f'<time datetime="{updated_str}">{updated_str}</time></p>')
        marker = "</h1>"
        i = page.content.find(marker)
        if i != -1:
            j = i + len(marker)
            page.content = page.content[:j] + "\n" + sub + page.content[j:]

    ld = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": name,
        "image": image,
        "description": page.meta["description"],
        "brand": {"@type": "Brand", "name": brand},
        "itemCondition": "https://schema.org/NewCondition",
        "offers": {
            "@type": "Offer",
            "url": page_url,
            "priceCurrency": "USD",
            "price": str(price),
            "availability": "https://schema.org/InStock",
        },
        "url": page_url,
    }
    if updated_str:
        ld["dateModified"] = updated_str
    if mpn:
        ld["mpn"] = mpn

    script = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>"
    page.content += "\n" + script
