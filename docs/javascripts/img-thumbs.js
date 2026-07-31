(function () {
  function thumbSrc(src) {
    var s = String(src || "");
    if (!s || /\.thumb\.(webp|jpe?g|png)(\?|$)/i.test(s)) return s;
    return s.replace(/\.(jpe?g|png|webp)(\?.*)?$/i, ".thumb.webp$2");
  }

  function fullSrc(src) {
    var s = String(src || "");
    return s.replace(/\.thumb\.webp(\?.*)?$/i, ".jpg$1");
  }

  function applyListThumb(img) {
    if (!img || img.dataset.mgThumbApplied === "1") return;
    var full =
      img.getAttribute("data-full-src") ||
      img.getAttribute("src") ||
      img.getAttribute("data-src") ||
      "";
    if (!full || /\.thumb\./i.test(full)) return;
    img.dataset.mgThumbApplied = "1";
    img.setAttribute("data-full-src", full);
    img.src = thumbSrc(full);
    img.addEventListener(
      "error",
      function onThumbErr() {
        img.removeEventListener("error", onThumbErr);
        if (img.getAttribute("data-full-src")) {
          img.src = img.getAttribute("data-full-src");
        }
      },
      { once: true }
    );
  }

  window.mgImgThumbs = {
    thumbSrc: thumbSrc,
    fullSrc: fullSrc,
    applyListThumb: applyListThumb,
  };
})();
