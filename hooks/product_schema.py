"""Inject schema.org JSON-LD into /gear/<slug>/ product and /guide/<slug>/ article pages.

Each entry holds the facts already published on the matching page and in the
price tables (docs/blades.md / docs/rubbers.md): product name, brand, primary
product photo and list price in USD. Keep these tables in sync when a page or
its price changes.

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


# Guide/article pages translated from Chinese source material.
# slug -> (headline, lead image path or None)
ARTICLES = {
    "blade-thickness-and-flatness": (
        "Blade Thickness — Penetration, Spin vs. Speed, and Flatness",
        "images/blade-thickness/01.png"),
    "rubber-lifespan-and-durability": (
        "How Long Do Table Tennis Rubbers Last?",
        None),
}


def _add_updated_line(page):
    """Mirror the frontmatter `updated:` date as a small line under the H1.

    Opt-in per page, so bump `updated:` whenever the content is revised. The
    returned date feeds the matching JSON-LD `dateModified`, keeping the crawl
    date in step with the date a visitor actually reads.
    """
    updated = page.meta.get("updated")
    if not updated:
        return None
    updated_str = str(updated)[:10]

    marker = "</h1>"
    i = page.content.find(marker)
    if i == -1:
        return updated_str
    j = i + len(marker)
    page.content = (page.content[:j]
                    + '\n<p class="mg-updated">Updated '
                      f'<time datetime="{updated_str}">{updated_str}</time></p>'
                    + page.content[j:])
    return updated_str


def _emit(page, ld):
    page.content += ('\n<script type="application/ld+json">'
                     + json.dumps(ld, ensure_ascii=False) + "</script>")


def on_page_context(context, page, config, nav):
    updated_str = _add_updated_line(page)

    if not page.url.endswith("/"):
        return
    site = config["site_url"].rstrip("/")
    page_url = f"{site}/{page.url}"

    if page.url.startswith("guide/"):
        slug = page.url[len("guide/"):-1]
        if slug not in ARTICLES or not page.meta.get("description"):
            return
        headline, img = ARTICLES[slug]
        publisher = {"@type": "Organization", "name": config["site_name"],
                     "url": site}
        ld = {
            "@context": "https://schema.org/",
            "@type": "Article",
            "headline": headline,
            "description": page.meta["description"],
            "url": page_url,
            "mainEntityOfPage": {"@type": "WebPage", "@id": page_url},
            "author": publisher,
            "publisher": publisher,
        }
        if img:
            ld["image"] = f"{site}/{img}"
        # `imported:` marks when the translation went live.
        published = page.meta.get("imported")
        if published:
            ld["datePublished"] = str(published)[:10]
        if updated_str:
            ld["dateModified"] = updated_str
        _emit(page, ld)
        return

    if not page.url.startswith("gear/"):
        return
    slug = page.url[len("gear/"):-1]
    if slug not in PRODUCTS:
        return
    name, brand, img, price, mpn = PRODUCTS[slug]
    if not page.meta.get("description"):
        return

    image = f"{site}/{img}"

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

    _emit(page, ld)
