(function () {
  var LANG = (document.documentElement.lang || "en").toLowerCase();
  var isZh = LANG.indexOf("zh") === 0;
  var T = {
    close: isZh ? "关闭" : "Close",
    prev: isZh ? "上一张" : "Previous",
    next: isZh ? "下一张" : "Next",
    buy: "WhatsApp",
    hideToday: isZh ? "今日不再显示" : "Hide for today",
  };

  function shuffle(node) {
    if (!node) return;
    var items = Array.prototype.slice.call(node.children);
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    items.forEach(function (el) {
      node.appendChild(el);
    });
  }

  function parseGallery(tile) {
    var raw = tile.getAttribute("data-gallery");
    if (raw) {
      try {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) return list;
      } catch (e) {}
    }
    var href = tile.getAttribute("href");
    return href ? [href] : [];
  }

  function todayStamp() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function dismissStorageKey(lookId) {
    return "sc-buy-dismiss:" + todayStamp() + ":" + lookId;
  }

  function isBuyDismissed(lookId) {
    try {
      return localStorage.getItem(dismissStorageKey(lookId)) === "1";
    } catch (e) {
      return false;
    }
  }

  function dismissBuy(lookId) {
    try {
      localStorage.setItem(dismissStorageKey(lookId), "1");
    } catch (e) {}
  }

  function lookIdFromTile(tile, gallery) {
    return (
      tile.getAttribute("data-look") ||
      tile.getAttribute("href") ||
      (gallery && gallery[0]) ||
      tile.getAttribute("title") ||
      ""
    );
  }

  function chatIcon() {
    return (
      '<svg class="sc-lightbox__buy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M12 3C6.5 3 2 6.58 2 11c0 2.39 1.33 4.54 3.41 5.96L4 21l4.55-1.52C9.66 19.82 10.81 20 12 20c5.5 0 10-3.58 10-8s-4.5-9-10-9m0 15c-.96 0-1.9-.16-2.78-.45l-.2-.07-2.34.78.77-2.24-.15-.23C5.86 14.53 5 12.84 5 11c0-3.31 3.13-6 7-6s7 2.69 7 6-3.13 6-7 6z"/>' +
      "</svg>"
    );
  }

  var lightboxSeq = 0;

  function createLightbox() {
    var root = document.createElement("div");
    root.className = "sc-lightbox";
    root.id = "sc-lightbox-" + ++lightboxSeq;
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.innerHTML =
      '<button type="button" class="sc-lightbox__close" aria-label="' + T.close + '">&times;</button>' +
      '<button type="button" class="sc-lightbox__nav sc-lightbox__nav--prev" aria-label="' + T.prev + '">‹</button>' +
      '<figure class="sc-lightbox__stage">' +
      '<div class="sc-lightbox__media">' +
      '<img class="sc-lightbox__img" alt="">' +
      '<div class="sc-lightbox__buy-wrap" hidden>' +
      '<a class="sc-lightbox__buy" href="#" data-buy-target>' +
      chatIcon() +
      "<span>" + T.buy + "</span>" +
      "</a>" +
      '<button type="button" class="sc-lightbox__buy-dismiss" aria-label="' + T.hideToday + '">&times;</button>' +
      "</div>" +
      "</div>" +
      '<figcaption class="sc-lightbox__cap"></figcaption>' +
      "</figure>" +
      '<button type="button" class="sc-lightbox__nav sc-lightbox__nav--next" aria-label="Next">›</button>';
    document.body.appendChild(root);
    return root;
  }

  function initLightbox(wall) {
    var tiles = Array.prototype.slice.call(wall.querySelectorAll(".sc-wall__tile"));
    if (!tiles.length) return;

    var box = createLightbox();
    var img = box.querySelector(".sc-lightbox__img");
    var cap = box.querySelector(".sc-lightbox__cap");
    var buyWrap = box.querySelector(".sc-lightbox__buy-wrap");
    var buy = box.querySelector(".sc-lightbox__buy");
    var buyDismiss = box.querySelector(".sc-lightbox__buy-dismiss");
    var gallery = [];
    var title = "";
    var lookId = "";
    var buyUrl = "";
    var idx = 0;
    var open = false;
    var buyTimer = null;
    var BUY_DWELL_MS = 5000;

    function clearBuyTimer() {
      if (buyTimer) {
        clearTimeout(buyTimer);
        buyTimer = null;
      }
    }

    function hideBuyCta() {
      clearBuyTimer();
      buyWrap.classList.remove("is-visible");
      buyWrap.hidden = true;
    }

    function armBuyCta() {
      hideBuyCta();
      if (!(gallery.length > 0 && buyUrl && !isBuyDismissed(lookId))) return;
      buyWrap.hidden = false;
      // force reflow so fade-in still runs if re-armed quickly
      void buyWrap.offsetWidth;
      buyTimer = setTimeout(function () {
        buyTimer = null;
        buyWrap.classList.add("is-visible");
      }, BUY_DWELL_MS);
    }

    function show(i) {
      if (!gallery.length) return;
      idx = (i + gallery.length) % gallery.length;
      img.src = gallery[idx];
      img.alt = title;
      cap.textContent =
        gallery.length > 1
          ? (title ? title + " · " : "") + (idx + 1) + " / " + gallery.length
          : title;
      armBuyCta();
    }

    function openGallery(tile, start) {
      gallery = parseGallery(tile);
      title = tile.getAttribute("title") || "";
      lookId = lookIdFromTile(tile, gallery);
      buyUrl = tile.getAttribute("data-buy") || "";
      buy.href = buyUrl;
      show(typeof start === "number" ? start : 0);
      box.hidden = false;
      document.body.classList.add("sc-lightbox-open");
      open = true;
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove("sc-lightbox-open");
      open = false;
      gallery = [];
      lookId = "";
      hideBuyCta();
      img.removeAttribute("src");
    }

    tiles.forEach(function (tile) {
      tile.addEventListener("click", function (e) {
        e.preventDefault();
        openGallery(tile, 0);
      });
    });

    buyDismiss.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (lookId) dismissBuy(lookId);
      hideBuyCta();
    });

    box.querySelector(".sc-lightbox__close").addEventListener("click", close);
    box.querySelector(".sc-lightbox__nav--prev").addEventListener("click", function () {
      show(idx - 1);
    });
    box.querySelector(".sc-lightbox__nav--next").addEventListener("click", function () {
      show(idx + 1);
    });

    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });

    var touchX = null;
    box.addEventListener(
      "touchstart",
      function (e) {
        if (e.changedTouches && e.changedTouches[0]) {
          touchX = e.changedTouches[0].clientX;
        }
      },
      { passive: true }
    );
    box.addEventListener(
      "touchend",
      function (e) {
        if (touchX == null || !e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) < 40) return;
        if (dx > 0) show(idx - 1);
        else show(idx + 1);
      },
      { passive: true }
    );
  }

  function run() {
    var walls = document.querySelectorAll(".sc-wall");
    if (!walls.length) return;
    walls.forEach(function (wall) {
      shuffle(wall);
      initLightbox(wall);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
