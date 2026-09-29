(function () {
  // `X.thumb.webp` is the 720px thumb every image beside it has. The numbered
  // ones -- X.thumb-240.webp, X.thumb-480.webp, X.thumb-1000.webp -- are the
  // srcset steps, written by tools/generate_shop_thumbs.py and chosen per slot.
  function thumbSrc(src, size) {
    var s = String(src || "");
    var m = s.match(/^(.*?)(\.(?:jpe?g|png|webp))(\?.*)?$/i);
    if (!m) return s;
    var base = m[1].replace(/\.thumb(?:-\d+)?$/i, "");
    return base + (size ? ".thumb-" + size : ".thumb") + ".webp" + (m[4] || "");
  }

  function isThumb(src) {
    return /\.thumb(?:-\d+)?\./i.test(String(src || ""));
  }

  // Bring one <img> down to its thumb, keeping the full file reachable for the
  // lightbox. Since the markup declares the thumb itself (and carries the full
  // path in data-full-src), this is usually a no-op -- the point of it now is
  // the images a script builds, and the fallback if a thumb is ever missing.
  function applyListThumb(img) {
    if (!img || img.dataset.mgThumbApplied === "1") return;
    var src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    var full = img.getAttribute("data-full-src") || "";

    if (full && isThumb(src)) {
      // Already the right file. Swapping would re-point src at the URL the
      // browser is fetching right now, which is what used to cost a second
      // copy of every hero image.
      img.dataset.mgThumbApplied = "1";
      return;
    }
    if (!full) {
      if (!src || isThumb(src)) return;
      full = src;
      img.setAttribute("data-full-src", full);
    }
    img.dataset.mgThumbApplied = "1";
    var want = thumbSrc(full);
    if (src !== want) img.src = want;
    img.addEventListener(
      "error",
      function onThumbErr() {
        img.removeEventListener("error", onThumbErr);
        // srcset wins over src, so a broken variant has to be dropped for the
        // fallback to take effect at all.
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        if (img.getAttribute("data-full-src")) {
          img.src = img.getAttribute("data-full-src");
        }
      },
      { once: true }
    );
  }

  window.mgImgThumbs = {
    thumbSrc: thumbSrc,
    isThumb: isThumb,
    applyListThumb: applyListThumb,
  };
})();
