(function () {
  var items = [];
  var index = 0;

  function ensureLightbox() {
    var root = document.getElementById("mg-lightbox");
    if (root) return root;

    root = document.createElement("div");
    root.id = "mg-lightbox";
    root.className = "mg-lightbox";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Image preview");
    root.innerHTML =
      '<button type="button" class="mg-lightbox__close" aria-label="Close">×</button>' +
      '<button type="button" class="mg-lightbox__nav mg-lightbox__prev" aria-label="Previous">‹</button>' +
      '<button type="button" class="mg-lightbox__nav mg-lightbox__next" aria-label="Next">›</button>' +
      '<div class="mg-lightbox__stage">' +
      '  <img class="mg-lightbox__img" alt="">' +
      '  <div class="mg-lightbox__counter" aria-live="polite"></div>' +
      "</div>";
    document.body.appendChild(root);

    var closeBtn = root.querySelector(".mg-lightbox__close");
    var prevBtn = root.querySelector(".mg-lightbox__prev");
    var nextBtn = root.querySelector(".mg-lightbox__next");
    var img = root.querySelector(".mg-lightbox__img");
    var counter = root.querySelector(".mg-lightbox__counter");

    function show(i) {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      var item = items[index];
      img.src = item.href;
      img.alt = item.alt || "";
      counter.textContent = index + 1 + " / " + items.length;
      var multi = items.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
      counter.hidden = !multi;
    }

    function close() {
      root.hidden = true;
      img.removeAttribute("src");
      items = [];
      document.body.classList.remove("mg-lightbox-open");
    }

    function open(list, start) {
      items = list;
      root.hidden = false;
      document.body.classList.add("mg-lightbox-open");
      show(start);
    }

    root.addEventListener("click", function (e) {
      if (e.target === root) close();
    });
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      close();
    });
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      show(index - 1);
    });
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      show(index + 1);
    });
    img.addEventListener("click", function (e) {
      e.stopPropagation();
      if (items.length > 1) show(index + 1);
    });
    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
    });

    root._open = open;
    return root;
  }

  function galleryItems(gallery) {
    return Array.prototype.slice
      .call(gallery.querySelectorAll("a[href]"))
      .map(function (a) {
        var thumb = a.querySelector("img");
        return {
          href: a.href,
          alt: (thumb && thumb.alt) || "",
        };
      });
  }

  function imageItems(container) {
    return Array.prototype.slice.call(container.querySelectorAll("img")).map(function (img) {
      return {
        href: img.currentSrc || img.src,
        alt: img.alt || "",
      };
    });
  }

  function bindGalleries() {
    var root = ensureLightbox();

    document.querySelectorAll(".mg-gallery").forEach(function (gallery) {
      var links = gallery.querySelectorAll("a[href]");
      links.forEach(function (a, i) {
        if (a.dataset.mgLightboxBound === "1") return;
        a.dataset.mgLightboxBound = "1";
        a.addEventListener("click", function (e) {
          e.preventDefault();
          root._open(galleryItems(gallery), i);
        });
      });
    });

    document.querySelectorAll(".mg-price-table").forEach(function (tableWrap) {
      var imgs = tableWrap.querySelectorAll("img");
      var items = imageItems(tableWrap);
      imgs.forEach(function (img, i) {
        if (img.dataset.mgLightboxBound === "1") return;
        img.dataset.mgLightboxBound = "1";
        img.classList.add("mg-price-thumb");
        img.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          root._open(items, i);
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindGalleries);
  } else {
    bindGalleries();
  }
})();
