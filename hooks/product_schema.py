"""Inject schema.org JSON-LD into /gear/<slug>/ product and /guide/<slug>/ article pages.

Each entry holds the facts already published on the matching page and in the
price tables (docs/blades.md / docs/rubbers.md): product name, brand, primary
product photo and list price in USD. Keep these tables in sync when a page or
its price changes.

The /blades/ listing page is the exception: it is not one product, so it is
not in the tables above. It emits an ItemList read out of its own cards at
build time — see the block below.

The rating bars on the pages are community samples, not reviews left on this
site, so no AggregateRating is emitted by default — it could read as
self-serving review markup. RATINGS below opts a page in only where the page
itself prints the number, and says which sample it is.

A page that ends with a `## Frequently Asked Questions` section gets a FAQPage
built from that section's own H3/P pairs, so the markup cannot say anything the
reader cannot see. Parse it or emit nothing: no empty schema.

Breadcrumbs are opt-in per page (BREADCRUMBS) and describe the trail the site
actually offers — Home > Gear > <shop page> > product.
"""

import html
import json
import re

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


# slug -> (ratingValue, reviewCount) for pages that print the community rating.
# The scale is 1-10 on every radar on this site, hence bestRating/worstRating.
# Keep in step with the radar's aria-label: if the number changes on the page
# and not here, the markup starts lying.
RATINGS = {
    "dignics-09c": (9.54, 113),
    "zyre-03": (9.84, 31),
    "dignics-05": (9.59, 135),
    "tenergy-05": (9.34, 275),
}

# slug -> the trail above the product, (name, path from the site root).
# Only the page's own URL is added automatically; the shop page it belongs to
# is the opinion this table records.
BREADCRUMBS = {
    "dignics-09c": [("Home", ""), ("Gear", "gear/"), ("Rubbers", "rubbers/")],
    "zyre-03": [("Home", ""), ("Gear", "gear/"), ("Rubbers", "rubbers/")],
    "dignics-05": [("Home", ""), ("Gear", "gear/"), ("Rubbers", "rubbers/")],
    "tenergy-05": [("Home", ""), ("Gear", "gear/"), ("Rubbers", "rubbers/")],
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


# --- /blades/ -----------------------------------------------------------------
# A listing, not a product, so it gets no hand-kept table of its own: the
# ItemList is read out of the page's own cards at build time. Every priced card
# already carries the name and the price in its cart button and the badge that
# says how it is bought, so the markup cannot drift from what the page says —
# change a price in docs/blades.md and the JSON-LD changes with it. That is the
# point: a 41-row table kept by hand would be wrong the first time a price
# moved.
#
# Two deliberate omissions. No `brand`: most cards name a model ("Viscaria",
# "Fan Zhendong ALC") without naming its maker, and guessing a maker would put
# a fact nobody checked into structured data. No aggregateRating, for the
# reason in the module docstring.
#
# The page also takes no `updated:` frontmatter, because its only H1 is the
# hero banner and `_add_updated_line` would splice the date line into the
# banner. Add one and that line lands there.

BADGE_AVAILABILITY = {
    "In stock": "https://schema.org/InStock",
    "Pre-order": "https://schema.org/PreOrder",
    "Proxy buy": "https://schema.org/InStock",
}

_CARD_RE = re.compile(r'<article class="mg-preowned-card".*?</article>', re.S)
_CART_RE = re.compile(r"<button[^>]*\bmg-cart-add\b[^>]*>")
_BADGE_RE = re.compile(r'<span class="mg-preowned-card__badge[^"]*">([^<]*)</span>')
_IMG_RE = re.compile(r"<img\b[^>]*>")


def _attr(tag, name):
    """One attribute off one tag, entities resolved."""
    m = re.search(r'\b%s="([^"]*)"' % re.escape(name), tag)
    return html.unescape(m.group(1)).strip() if m else None


def _text(fragment):
    """The words a reader sees.

    Tags come out to nothing rather than to a space, which is what textContent
    does — so an inline link inside a sentence leaves the sentence's own
    spacing alone and the text here is the text on the page, word for word.
    """
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def _blades_item_list(content, site, page_url):
    items = []
    for card in _CARD_RE.findall(content):
        cart = _CART_RE.search(card)
        if not cart:
            continue  # a card with no price to declare: "Contact for Price"
        name = _attr(cart.group(0), "data-name")
        price = _attr(cart.group(0), "data-price")
        if not name or not price:
            continue

        product = {
            "@type": "Product",
            "name": name,
            "url": page_url,
            "itemCondition": "https://schema.org/NewCondition",
            "offers": {
                "@type": "Offer",
                "url": page_url,
                "priceCurrency": "USD",
                "price": price,
            },
        }
        img = _IMG_RE.search(card)
        if img:
            src = _attr(img.group(0), "data-full-src") or _attr(img.group(0), "src")
            if src:
                product["image"] = src if src.startswith("http") else f"{site}{src}"

        badge = _BADGE_RE.search(card)
        badge = _text(badge.group(1)) if badge else None
        if badge in BADGE_AVAILABILITY:
            product["offers"]["availability"] = BADGE_AVAILABILITY[badge]

        items.append({"@type": "ListItem", "position": len(items) + 1,
                      "item": product})

    if not items:
        return None
    return {
        "@context": "https://schema.org/",
        "@type": "ItemList",
        "name": "Table Tennis Blades",
        "url": page_url,
        "numberOfItems": len(items),
        "itemListElement": items,
    }


_FAQ_HEADING = re.compile(
    r'<h2[^>]*>\s*Frequently Asked Questions\s*</h2>(.*?)(?=<h2\b|$)', re.S)
_QA_PAIR = re.compile(r"<h3[^>]*>(.*?)</h3>\s*<p>(.*?)</p>", re.S)


def _faq_page(content):
    """FAQPage out of the page's own FAQ section, word for word.

    The question is the H3, the answer the paragraph right after it. Anything
    else in the section is left alone. No section, or no pairs -> None, so a
    page never carries an FAQPage the reader cannot see.
    """
    m = _FAQ_HEADING.search(content)
    if not m:
        return None
    qa = [(q, a) for q, a in _QA_PAIR.findall(m.group(1))
          if _text(q) and _text(a)]
    if not qa:
        return None
    return {
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": _text(q),
                "acceptedAnswer": {"@type": "Answer", "text": _text(a)},
            }
            for q, a in qa
        ],
    }


def _breadcrumb_list(slug, name, site, page_url):
    trail = BREADCRUMBS.get(slug)
    if trail is None:
        return None
    items = []
    for label, path in trail:
        items.append({"@type": "ListItem", "position": len(items) + 1,
                      "name": label, "item": f"{site}/{path}"})
    items.append({"@type": "ListItem", "position": len(items) + 1,
                  "name": name, "item": page_url})
    return {
        "@context": "https://schema.org/",
        "@type": "BreadcrumbList",
        "itemListElement": items,
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

    if page.url == "blades/":
        ld = _blades_item_list(page.content, site, page_url)
        if ld:
            _emit(page, ld)
        return

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
    if slug in RATINGS:
        value, count = RATINGS[slug]
        ld["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": str(value),
            "reviewCount": str(count),
            "bestRating": "10",
            "worstRating": "1",
        }

    _emit(page, ld)

    crumbs = _breadcrumb_list(slug, name, site, page_url)
    if crumbs:
        _emit(page, crumbs)

    faq = _faq_page(page.content)
    if faq:
        _emit(page, faq)
