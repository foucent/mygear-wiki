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
      '  <div class="mg-lightbox__meta">' +
      '    <div class="mg-lightbox__counter" aria-live="polite"></div>' +
      '    <div class="mg-lightbox__hint">More photos — swipe or use arrows</div>' +
      "  </div>" +
      '  <div class="mg-lightbox__dots" aria-hidden="true"></div>' +
      "</div>";
    document.body.appendChild(root);

    var closeBtn = root.querySelector(".mg-lightbox__close");
    var prevBtn = root.querySelector(".mg-lightbox__prev");
    var nextBtn = root.querySelector(".mg-lightbox__next");
    var img = root.querySelector(".mg-lightbox__img");
    var counter = root.querySelector(".mg-lightbox__counter");
    var hint = root.querySelector(".mg-lightbox__hint");
    var dots = root.querySelector(".mg-lightbox__dots");

    function renderDots() {
      if (items.length <= 1) {
        dots.hidden = true;
        dots.innerHTML = "";
        return;
      }
      dots.hidden = false;
      dots.innerHTML = items
        .map(function (_, i) {
          return (
            '<button type="button" class="mg-lightbox__dot' +
            (i === index ? " is-active" : "") +
            '" data-index="' +
            i +
            '" aria-label="Photo ' +
            (i + 1) +
            '"></button>'
          );
        })
        .join("");
    }

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
      hint.hidden = !multi;
      renderDots();
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
    dots.addEventListener("click", function (e) {
      var dot = e.target.closest(".mg-lightbox__dot");
      if (!dot) return;
      e.stopPropagation();
      show(parseInt(dot.getAttribute("data-index"), 10) || 0);
    });
    var touchX = 0;
    var touchY = 0;
    var swiped = false;

    img.addEventListener("click", function (e) {
      e.stopPropagation();
      if (swiped) {
        swiped = false;
        return;
      }
      if (items.length > 1) show(index + 1);
    });
    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
    });

    root.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length !== 1) return;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        swiped = false;
      },
      { passive: true }
    );
    root.addEventListener(
      "touchmove",
      function (e) {
        if (e.touches.length !== 1 || items.length <= 1) return;
        var dx = e.touches[0].clientX - touchX;
        var dy = e.touches[0].clientY - touchY;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
          swiped = true;
        }
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      function (e) {
        if (items.length <= 1 || e.changedTouches.length !== 1) return;
        var t = e.changedTouches[0];
        var dx = t.clientX - touchX;
        var dy = t.clientY - touchY;
        var absX = Math.abs(dx);
        var absY = Math.abs(dy);
        if (absX < 48 || absX < absY * 1.15) return;
        swiped = true;
        if (dx < 0) show(index + 1);
        else show(index - 1);
      },
      { passive: true }
    );

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

  function fullHref(img) {
    return (
      (img &&
        (img.getAttribute("data-full-src") ||
          img.currentSrc ||
          img.src)) ||
      ""
    );
  }

  function imageItems(container) {
    return Array.prototype.slice
      .call(container.querySelectorAll("img"))
      .map(function (img) {
        return {
          href: fullHref(img),
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

    // .mg-card-grid is the add-ons card grid; it carries its images the same
    // way a price table does (an <img> with an optional data-gallery list), so
    // it rides the same binding rather than getting a second one.
    document
      .querySelectorAll(".mg-price-table, .mg-card-grid")
      .forEach(function (tableWrap) {
      var imgs = tableWrap.querySelectorAll("img");
      var fallbackItems = imageItems(tableWrap);
      var isPreowned = tableWrap.classList.contains("mg-price-table--preowned");

      imgs.forEach(function (img, i) {
        if (img.dataset.mgLightboxBound === "1") return;
        if (img.closest(".mg-price-more")) return;
        img.dataset.mgLightboxBound = "1";
        img.classList.add("mg-price-thumb");

        var gallery = (img.getAttribute("data-gallery") || "")
          .split(",")
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);
        var count = gallery.length || 1;
        var galleryItemsList = gallery.length
          ? gallery.map(function (href) {
              return { href: href, alt: img.alt || "" };
            })
          : null;

        // A pre-owned card is one 240px photo with the number of photos on it.
        // The strip of thumbnails that used to sit under the picture is gone:
        // it made the card twice as tall as its copy needed and pulled eight
        // more files per listing, all of them for a 70px square. The number is
        // the count the strip used to show by showing it; the picture opens the
        // set — the main photo first, the rest on the arrows or the dots.
        if (isPreowned && gallery.length > 1) {
          var card = img.closest(".mg-preowned-card");
          var media =
            (card && card.querySelector(".mg-preowned-card__media")) ||
            img.parentElement;
          if (media && !media.querySelector(".mg-preowned-card__count")) {
            var countPill = document.createElement("span");
            countPill.className = "mg-preowned-card__count";
            /* A bare number reads as nothing to a screen reader, so the label
               carries the words the badge no longer shows. */
            countPill.textContent = String(count);
            countPill.setAttribute("role", "img");
            countPill.setAttribute("aria-label", count + " photos");
            media.appendChild(countPill);
          }
        } else if (count > 1) {
          var wrap = img.parentElement;
          if (wrap && !wrap.classList.contains("mg-price-thumb-wrap")) {
            wrap.classList.add("mg-price-thumb-wrap");
          }
          if (wrap && !wrap.querySelector(".mg-price-thumb-count")) {
            var badge2 = document.createElement("span");
            badge2.className = "mg-price-thumb-count";
            badge2.textContent = String(count);
            badge2.title = count + " photos";
            wrap.appendChild(badge2);
          }
        }

        // A card owns its own pictures: with a data-gallery list that list is
        // the set, and without one the card is a single photo. Only outside a
        // card (a price table) does an unlisted image fall back to the whole
        // container, which is that layout's "browse them all" behaviour.
        var cardScope = img.closest(".mg-card");
        var cardItems = galleryItemsList || [
          { href: fullHref(img), alt: img.alt || "" },
        ];
        var items = cardScope ? cardItems : galleryItemsList || fallbackItems;
        /* Which photo it opens on. A card, or a listing that carries its own
           gallery list, starts at the first — that is its cover. A price table
           with neither opens on the photo that was clicked, which is where in
           the container's own run of photos it sits. */
        var start = cardScope || galleryItemsList ? 0 : i;

        img.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          root._open(items, start);
        });

        // The card's "View photo(s)" link opens the same set the image does,
        // instead of navigating off to a bare JPEG.
        var zoomLink = cardScope && cardScope.querySelector(".mg-card__zoom");
        if (zoomLink && zoomLink.dataset.mgLightboxBound !== "1") {
          zoomLink.dataset.mgLightboxBound = "1";
          zoomLink.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            root._open(items, 0);
          });
        }
      });
    });
  }

  function initPriceSlides(slides) {
    // Kept for compatibility; Pre-owned no longer builds slideshows.
    var imgs = Array.prototype.slice.call(
      slides.querySelectorAll(".mg-price-slides__img")
    );
    if (imgs.length < 2) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var index = imgs.findIndex(function (el) {
      return el.classList.contains("is-active");
    });
    if (index < 0) {
      index = 0;
      imgs[0].classList.add("is-active");
    }

    var timer = null;
    var interval = 3600 + Math.floor(Math.random() * 900);
    var visible = false;

    var show = function (next) {
      imgs[index].classList.remove("is-active");
      index = next;
      imgs[index].classList.add("is-active");
    };

    var stop = function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    var start = function () {
      stop();
      if (reduceMotion.matches || !visible) return;
      timer = window.setInterval(function () {
        show((index + 1) % imgs.length);
      }, interval);
    };

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          visible = entries.some(function (e) {
            return e.isIntersecting;
          });
          if (visible) start();
          else stop();
        },
        { rootMargin: "80px 0px", threshold: 0.2 }
      );
      io.observe(slides);
    } else {
      visible = true;
      start();
    }

    reduceMotion.addEventListener("change", start);
    slides.addEventListener(
      "mouseenter",
      function () {
        if (!window.matchMedia("(hover: hover)").matches) return;
        stop();
      },
      { passive: true }
    );
    slides.addEventListener(
      "mouseleave",
      function () {
        if (!window.matchMedia("(hover: hover)").matches) return;
        start();
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindGalleries);
  } else {
    bindGalleries();
  }
})();
