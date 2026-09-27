/* Card copy that runs past four lines (the Xiom Hugo Supreme ALXi on /blades/,
 * which carries its article text whole) is clipped at the fold and its photo
 * link reads "Read more". Cards that fit are left alone — the clamp class goes
 * on only after measuring, so nothing here touches the other thirty.
 *
 * The paragraph then opens over the card's media band rather than pushing the
 * card taller: rows are 1fr, and an auto-height grid resolves every 1fr row to
 * the tallest, so a card that grew would have grown all sixteen rows with it
 * and moved itself 300px down the page. See uncrate.css.
 *
 * Which means the opened text covers the photo, so the link stays a disclosure
 * for as long as the card has one — "Read more" / "Read less" — and the picture
 * is reached by clicking it with the text closed, the way the other thirty
 * cards work.
 */
(function () {
  var LINES = 4;
  var CLAMP = "mg-card__desc--clamp";
  var OPEN = "is-open";

  function lineHeight(el) {
    var lh = parseFloat(getComputedStyle(el).lineHeight);
    if (!lh || isNaN(lh)) {
      lh = (parseFloat(getComputedStyle(el).fontSize) || 15) * 1.5;
    }
    return lh;
  }

  /* Natural height, with the clip taken off for the measurement. The class is
     put back before the browser gets a chance to paint the unclipped state. */
  function unclippedHeight(el) {
    var clipped = el.classList.contains(CLAMP);
    if (clipped) el.classList.remove(CLAMP);
    var h = el.scrollHeight;
    if (clipped) el.classList.add(CLAMP);
    return h;
  }

  function setup(card) {
    var desc = card.querySelector(".mg-card__desc");
    var zoom = card.querySelector(".mg-card__zoom");

    /* A description with no link to open it would be clipped shut with no way
       back, so it is left whole instead. */
    if (!desc || !zoom || desc.dataset.mgReadMore === "1") return;
    if (unclippedHeight(desc) <= lineHeight(desc) * LINES + 1) return;

    desc.dataset.mgReadMore = "1";
    desc.classList.add(CLAMP);

    function setOpen(open) {
      desc.classList.toggle(OPEN, open);
      zoom.textContent = open ? "Read less" : "Read more";
      zoom.setAttribute("aria-expanded", open ? "true" : "false");
    }

    setOpen(false);

    /* The click is caught on the card in the capture phase so that it can be
       decided before gallery-lightbox.js's own listener on that anchor runs —
       a capture listener on an ancestor is the one place guaranteed to be
       earlier, whatever order the two files are loaded in. stopPropagation
       there keeps the event from ever reaching the anchor. */
    card.addEventListener(
      "click",
      function (e) {
        if (e.target.closest && e.target.closest(".mg-card__zoom") !== zoom) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        setOpen(!desc.classList.contains(OPEN));
      },
      true
    );
  }

  function bind() {
    document.querySelectorAll(".mg-card").forEach(setup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
