"""Give every product card its own anchor, and its own line in the search index.

mkdocs indexes a page by its headings, and keeps a heading's section only when
that heading's id is in the page's table of contents (mkdocs/contrib/search/
search_index.py, create_entry_for_section). The shop cards are raw HTML — their
grids sit in <div class="mg-card-grid" markdown="0"> — so the cards' <h3
class="mg-card__title"> never reach the toc extension. A whole shop page
therefore collapses into a single index entry with no anchor, and searching
"Viscaria" drops you at the top of /blades/ to find the card yourself.

So this hook puts an id on every card, and then rewrites
site/search/search_index.json once the search plugin has written it: one entry
per card, and the page's own entry cut back to the text that sits outside the
cards, so a product name matches the card rather than the card and the page.

Rewriting the index needs no priority games — hooks are registered after
plugins (mkdocs/config/config_options.py, Hooks.post_validation), so this
on_post_build runs after the search plugin's. The index carries no prebuilt
lunr tree (lunr is built in the browser), so replacing "docs" is enough.

Standard library only, on purpose: requirements.txt is what CI installs, and
BeautifulSoup is not in it.
"""

import html
import json
import os
import re
from html.parser import HTMLParser

_ARTICLE_CARD = "mg-card"
_PREOWNED_TABLE = "mg-price-table--preowned"
_SLUG_MAX = 60

_TAG = re.compile(r"<[^>]+>")

# page.url -> {"text": page text outside the cards, "entries": [card entries]}
_pages = {}


def _collapse(text):
    """Single spaces, no ends — how the index stores text."""
    return re.sub(r"\s+", " ", text).strip()


def _slug(name, prefix, index):
    """A readable, stable fragment: the card's name, lowercased and hyphenated.

    A name with no ASCII in it — the odd Chinese listing — falls back to the
    card's position on the page, unique and stable as long as the order holds.
    """
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    if len(base) > _SLUG_MAX:
        base = base[:_SLUG_MAX].rstrip("-")
    return prefix + base if base else "%s%d" % (prefix, index)


def _unique(base, taken):
    """Within one page, no two cards may share an anchor."""
    candidate = base
    n = 2
    while candidate in taken:
        candidate = "%s-%d" % (base, n)
        n += 1
    taken.add(candidate)
    return candidate


def _line_starts(source):
    """Offset of the first character of each line, for getpos() arithmetic."""
    starts = [0]
    for i, char in enumerate(source):
        if char == "\n":
            starts.append(i + 1)
    return starts


class _CardScanner(HTMLParser):
    """Walk one rendered page, hand back its cards and the text around them.

    A card is either an <article class="mg-card"> — the four shop pages, one
    per product — or a <tr> with at least three cells inside the pre-owned
    price table, which preowned-grid.js later turns into the same card shape.

    Depth is tracked with counters rather than an element stack: HTML is full
    of void tags (<img>, <br>) that would push without ever popping.
    """

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self._line_starts = _line_starts(source)

        self.cards = []
        self.page_text = []

        self._article = 0  # open article.mg-card
        self._row = 0  # open <tr>, inside the pre-owned table's <tbody>
        self._tbody = 0
        self._div = 0
        self._table_div = 0  # depth of the wrapper div, 0 when not inside it
        self._title = 0  # open .mg-card__title
        self._price = 0  # open .mg-card__price
        self._cell = -1
        self._card = None

    # -- bookkeeping -------------------------------------------------------

    def _offset(self):
        line, col = self.getpos()
        return self._line_starts[line - 1] + col

    def _open_card(self, tag):
        self._card = {
            "tag": tag,
            "start": self._offset(),
            "raw": self.get_starttag_text(),
            "name": [],
            "price": [],
            "text": [],
            "cells": [],
        }
        self._cell = -1
        self.cards.append(self._card)

    def _close_card(self):
        card, self._card = self._card, None
        if card["tag"] == "tr":
            # The product cell and the price cell; a short row is a layout row,
            # not a card, and gets dropped.
            if len(card["cells"]) < 3:
                self.cards.remove(card)
                return
            card["name"] = card["cells"][1]
            card["price"] = card["cells"][2]
        card["name"] = _collapse("".join(card["name"]))
        card["price"] = _collapse("".join(card["price"]))
        card["text"] = _collapse(" ".join(card["text"]))
        if not card["name"]:
            self.cards.remove(card)

    # -- parser callbacks --------------------------------------------------

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = (attrs.get("class") or "").split()

        if tag == "div":
            self._div += 1
            if _PREOWNED_TABLE in classes:
                self._table_div = self._div
        elif tag == "tbody" and self._table_div:
            self._tbody += 1

        if tag == "article" and _ARTICLE_CARD in classes and not self._article:
            self._article = 1
            self._open_card("article")
        elif tag == "tr" and self._tbody and not self._row:
            self._row = 1
            self._open_card("tr")
        elif tag == "h3" and "mg-card__title" in classes and self._card:
            self._title += 1
        elif tag == "span" and "mg-card__price" in classes and self._card:
            self._price += 1
        elif tag == "td" and self._card and self._card["tag"] == "tr":
            self._cell += 1
            self._card["cells"].append([])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == "div":
            self._div -= 1
            if self._table_div and self._div < self._table_div:
                self._table_div = 0
                self._tbody = 0
        elif tag == "tbody":
            self._tbody = max(0, self._tbody - 1)

        if tag == "h3" and self._title:
            self._title -= 1
        elif tag == "span" and self._price:
            self._price -= 1
        elif tag == "article" and self._article:
            self._article = 0
            if self._card and self._card["tag"] == "article":
                self._close_card()
        elif tag == "tr" and self._row:
            self._row = 0
            if self._card and self._card["tag"] == "tr":
                self._close_card()

    def handle_data(self, data):
        card = self._card
        if card is None:
            self.page_text.append(data)
            return
        card["text"].append(data)
        if self._cell >= 0:
            card["cells"][self._cell].append(data)
        if self._title and not self._price:
            card["name"].append(data)
        elif self._price:
            card["price"].append(data)


def _inject_ids(html, cards):
    """Splice an id into each card's opening tag, last card first."""
    for card in reversed(cards):
        raw = card["raw"]
        end = card["start"] + len(raw)
        if html[card["start"]:end] != raw:  # offsets are the whole basis here
            raise ValueError("card offsets drifted: %r" % raw)
        html = html[: card["start"]] + raw[:-1] + ' id="%s">' % card["id"] + html[end:]
    return html


def _without_cards(text, entries):
    """Cut the card text out of a heading section that spans the cards.

    A section's text is the page's raw HTML runs joined with spaces — tags and
    all, entities still escaped — while a card's is its text nodes only, already
    decoded. Dropping the tags and the escapes from the section side leaves the
    same words in the same order, and the cut lands.
    """
    stripped = _collapse(html.unescape(_TAG.sub(" ", text)))
    for entry in entries:
        if entry["text"]:
            stripped = stripped.replace(entry["text"], " ")
    return _collapse(stripped)


def on_page_content(html, *, page, config, files):
    if _ARTICLE_CARD not in html and _PREOWNED_TABLE not in html:
        return html

    scanner = _CardScanner(html)
    scanner.feed(html)
    scanner.close()
    if not scanner.cards:
        return html

    taken = set()
    for index, card in enumerate(scanner.cards, 1):
        is_row = card["tag"] == "tr"
        prefix = "pre-owned-" if is_row else "card-"
        card["id"] = _unique(_slug(card["name"], prefix, index), taken)
        card["title"] = (
            card["name"] + " " + card["price"] if card["price"] else card["name"]
        )

    _pages[page.url] = {
        "text": _collapse(" ".join(scanner.page_text)),
        "entries": [
            {
                "location": page.url + "#" + card["id"],
                "title": card["title"],
                "text": card["text"],
            }
            for card in scanner.cards
        ],
    }
    return _inject_ids(html, scanner.cards)


def on_post_build(*, config):
    if not _pages:
        return

    path = os.path.join(config["site_dir"], "search", "search_index.json")
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as fh:
        index = json.load(fh)

    docs = []
    for entry in index["docs"]:
        url = entry["location"].split("#", 1)[0]
        recorded = _pages.get(url)
        if recorded is None:
            docs.append(entry)
            continue
        if entry["location"] == url:
            docs.append(dict(entry, text=recorded["text"]))
            docs.extend(recorded["entries"])
            continue
        # A section heading that spans the cards — "Shop add-ons", the
        # pre-owned list. Keep it for its own words, drop the cards'.
        text = _without_cards(entry["text"], recorded["entries"])
        if text:
            docs.append(dict(entry, text=text))

    index["docs"] = docs
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(index, fh, sort_keys=True, separators=(",", ":"))
