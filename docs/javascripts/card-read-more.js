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
 * A grid whose descriptions are all long has no median worth taking — /setups/
 * is eleven builds and every one of them is a paragraph — so it states its own
 * budget with data-mg-clamp-fixed. That number lives in uncrate.css, where the
 * media query that changes it with the column also lives, and this file reads it
 * back off the cascade rather than keeping a second copy of it in step.
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
      var desc = card.querySelector(".mg-card__desc");
      var zoom = card.querySelector(".mg-card__zoom");
      /* A description with no link to open it would be clipped shut with no way
         back, so a card without one is left out of this and left whole. */
      if (!desc || !zoom) return;
      card.dataset.mgReadMore = "1";
      var item = {
        desc: desc,
        zoom: zoom,
        label: zoom.textContent,
        lines: 0,
        fixed: !!card.closest("[data-mg-clamp-fixed]"),
      };
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

    /* The page's own median, for the grids that have a normal description
       length to measure it from. A grid that states its own budget is left out
       of the count: its long paragraphs would drag the median up with them. */
    var counted = items
      .filter(function (it) { return !it.fixed; })
      .map(function (it) { return it.lines; })
      .sort(function (a, b) { return a - b; });
    var norm = counted.length ? counted[Math.floor((counted.length - 1) / 2)] : 0;

    items.forEach(function (it) {
      var budget = it.fixed ? fixedBudget(it.desc) : norm;
      var long = budget > 0 && it.lines > budget;
      /* A stated budget stays in the stylesheet: set inline it would out-rank
         the media query that changes it in a narrow column. */
      if (!it.fixed) it.desc.style.setProperty("--mg-clamp-lines", budget);
      it.desc.classList.toggle(CLAMP, long);
      if (!long) it.desc.classList.remove(OPEN);
      render(it);
    });
  }

  /* The budget a data-mg-clamp-fixed grid states for itself, read off the
     cascade rather than passed in, so the number is written once — in
     uncrate.css, beside the media query that changes it with the column.
     Nothing stated means nothing to enforce: 0 clamps no card rather than
     hiding text behind a guessed limit. */
  function fixedBudget(desc) {
    return (
      parseInt(
        getComputedStyle(desc).getPropertyValue("--mg-clamp-lines"),
        10
      ) || 0
    );
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
