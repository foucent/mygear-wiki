/* The home page's hero box and category pills (2026-11-09).

   The page is the accessories shelf rebuilt on acebase.cc's homepage layout,
   and it became the site's home the same day; it offers proxy buying from
   China, so the hero box now does what acebase's does — a product link is a
   quote request, and Get price opens WhatsApp with the link already in the
   message (this site's checkout has always been the chat, where acebase hands
   the link to its Crisp inbox instead). Anything that is not a link is a word
   to narrow the shelf with, because fourteen pieces is a shelf worth
   narrowing; the pills filter by category, and the two stack.

   A link never filters: pasting one would empty the shelf and read as broken,
   so while the box holds a link the grid ignores it and shows every card the
   pill allows.

   Only this page's markup is touched: everything lives inside .mg-sb. The
   cards carry data-category and data-search (the name plus the words a buyer
   might use for it, lower-case) in docs/index.md; a card without data-search
   simply never matches a query. */
(function () {
  "use strict";

  var root = document.querySelector(".mg-sb");
  if (!root) return;

  var grid = document.getElementById("home-grid");
  var pills = document.getElementById("home-pills");
  var form = document.getElementById("home-search-form");
  var input = document.getElementById("home-search");
  var empty = document.getElementById("home-empty");
  var note = document.getElementById("home-note");
  if (!grid || !pills) return;

  /* The same number every other link on the site opens, and the same message
     shape: the item, then where it should be shipped. */
  var WHATSAPP = "https://wa.me/8618627156285";

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".mg-sb-card"));
  var category = "all";
  var query = "";

  function words(s) {
    return String(s || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  /* A link is anything with a scheme, or a bare host with a dot in it
     ("shop.example.com/x"). A model name — "qilin shoe", "glue" — has no dot,
     so it falls through to the shelf. */
  function looksLikeLink(v) {
    var s = String(v || "").trim();
    if (!s) return false;
    if (/^https?:\/\//i.test(s)) return true;
    return /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]|$)/i.test(s);
  }

  function whatsappHref(link) {
    var msg =
      "Hello, I'd like a quote for this item:\n" +
      link +
      "\n\nShip to (city / postal code):";
    return WHATSAPP + "?text=" + encodeURIComponent(msg);
  }

  function say(text) {
    if (!note) return;
    note.textContent = text || "";
    note.hidden = !text;
  }

  function apply() {
    var terms = words(looksLikeLink(query) ? "" : query);
    var shown = 0;

    cards.forEach(function (card) {
      var okCategory =
        category === "all" || card.getAttribute("data-category") === category;
      var hay = card.getAttribute("data-search") || "";
      var okText = terms.every(function (t) {
        return hay.indexOf(t) !== -1;
      });
      var show = okCategory && okText;
      card.hidden = !show;
      if (show) shown += 1;
    });

    if (empty) empty.hidden = shown !== 0;
  }

  pills.addEventListener("click", function (ev) {
    var pill = ev.target.closest(".mg-sb-pill");
    if (!pill) return;
    category = pill.getAttribute("data-category") || "all";
    Array.prototype.forEach.call(pills.querySelectorAll(".mg-sb-pill"), function (p) {
      var on = p === pill;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-pressed", on ? "true" : "false");
    });
    apply();
  });

  if (input) {
    input.addEventListener("input", function () {
      query = input.value;
      /* A new value retires the last hand-off's note. */
      say("");
      apply();
    });
  }

  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      query = input ? input.value.trim() : "";

      if (looksLikeLink(query)) {
        /* A new tab keeps the shelf where it was; a blocked popup gets the
           same link in this one rather than nothing at all. */
        var href = whatsappHref(query);
        var win = window.open(href, "_blank");
        if (win) {
          try {
            win.opener = null;
          } catch (e) {}
        } else {
          window.location.href = href;
        }
        say("Opening WhatsApp with your link — send that message and the price comes back in the chat.");
        apply();
        return;
      }

      apply();
      var disc = document.getElementById("gear");
      if (disc) disc.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  apply();
})();
