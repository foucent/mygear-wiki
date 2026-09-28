/* Card copy that outgrows the page's other cards — the Xiom Hugo Supreme ALXi
 * on /blades/, which carries its article text whole — is clipped at the fold
 * and faded out, and its photo link reads "Read more" until it is opened.
 *
 * "Outgrows" is measured against the page, not against a number of lines. A
 * fixed four would have been right in the wide column on /blades/ and wrong
 * everywhere else: the descriptions that are perfectly normal there wrap to six
 * lines in the narrow column, so a flat four put "Read more" on all thirty-one
 * cards on a phone. The median of the page's own descriptions is what a card
 * costs at the width it is actually being read at — and it is the height the
 * grid has settled on anyway, so a clipped card is exactly as tall as its
 * neighbours and the rows do not move.
 *
 * The paragraph then opens over the card rather than growing it: rows are 1fr,
 * and an auto-height grid resolves every 1fr row to the tallest, so a card that
 * grew would have grown all its rows with it and moved itself down the page.
 * See uncrate.css.
 *
 * Which means the opened text covers the photo, so the link stays a disclosure
 * for as long as the card has one — "Read more" / "Read less" — and the picture
 * is reached by clicking it with the text closed, the way every other card
 * works.
 *
 * A grid can opt out with data-mg-no-clamp, and /setups/'s does. There the copy
 * is the exhibit — each card is one build, and its paragraph is the whole of
 * what there is to read — so folding the longer of two builds behind a link
 * costs the reader the text and the "View N photos" label both, while buying
 * nothing: 1fr rows make the two cards the same height either way.
 */
(function () {
  var CLAMP = "mg-card__desc--clamp";
  var OPEN = "is-open";

  var items = [];

  function lineHeight(el) {
    var lh = parseFloat(getComputedStyle(el).lineHeight);
    if (!lh || isNaN(lh)) {
      lh = (parseFloat(getComputedStyle(el).fontSize) || 15) * 1.5;
    }
    return lh;
  }

  function render(item) {
    var clamped = item.desc.classList.contains(CLAMP);
    var open = clamped && item.desc.classList.contains(OPEN);
    item.zoom.textContent = !clamped
      ? item.label
      : open
      ? "Read less"
      : "Read more";
    if (clamped) {
      item.zoom.setAttribute("aria-expanded", open ? "true" : "false");
    } else {
      /* Unclamped, the link is a plain photo link again, so the disclosure
         attribute would be a lie and has to come off. */
      item.zoom.removeAttribute("aria-expanded");
    }
  }

  /* The click is caught on the card in the capture phase so that it can be
     decided before gallery-lightbox.js's own listener on that anchor runs — a
     capture listener on an ancestor is the one place guaranteed to be earlier,
     whatever order the two files are loaded in. stopPropagation there keeps the
     event from ever reaching the anchor. */
  function onClick(item, e) {
    if (!e.target.closest || e.target.closest(".mg-card__zoom") !== item.zoom) {
      return;
    }
    if (!item.desc.classList.contains(CLAMP)) return; /* photo link: the lightbox's */
    e.preventDefault();
    e.stopPropagation();
    item.desc.classList.toggle(OPEN);
    render(item);
  }

  function collect() {
    document.querySelectorAll(".mg-card").forEach(function (card) {
      if (card.dataset.mgReadMore === "1") return;
      if (card.closest("[data-mg-no-clamp]")) return;
      var desc = card.querySelector(".mg-card__desc");
      var zoom = card.querySelector(".mg-card__zoom");
      /* A description with no link to open it would be clipped shut with no way
         back, so a card without one is left out of this and left whole. */
      if (!desc || !zoom) return;
      card.dataset.mgReadMore = "1";
      var item = { desc: desc, zoom: zoom, label: zoom.textContent, lines: 0 };
      card.addEventListener("click", function (e) { onClick(item, e); }, true);
      items.push(item);
    });
  }

  function apply() {
    if (!items.length) return;

    /* One layout for the page: every clip off, every height read, then the
       clips put back — rather than a read and a write per card. */
    var clipped = items.filter(function (it) {
      return it.desc.classList.contains(CLAMP);
    });
    clipped.forEach(function (it) { it.desc.classList.remove(CLAMP); });
    items.forEach(function (it) {
      it.lines = Math.round(it.desc.scrollHeight / lineHeight(it.desc));
    });
    clipped.forEach(function (it) { it.desc.classList.add(CLAMP); });

    var counts = items
      .map(function (it) { return it.lines; })
      .sort(function (a, b) { return a - b; });
    var norm = counts[Math.floor((counts.length - 1) / 2)];

    items.forEach(function (it) {
      var long = it.lines > norm;
      it.desc.style.setProperty("--mg-clamp-lines", norm);
      it.desc.classList.toggle(CLAMP, long);
      if (!long) it.desc.classList.remove(OPEN);
      render(it);
    });
  }

  function start() {
    collect();
    apply();
    /* The median is a property of the column width, so the answer changes when
       the window does. Nothing is re-bound, only re-measured. */
    var pending;
    window.addEventListener("resize", function () {
      clearTimeout(pending);
      pending = setTimeout(apply, 150);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
