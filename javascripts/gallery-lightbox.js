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

  function thumbHref(href) {
    return window.mgImgThumbs ? window.mgImgThumbs.thumbSrc(href) : href;
  }

  function imageItems(container) {
    return Array.prototype.slice
      .call(container.querySelectorAll("img"))
      .filter(function (img) {
        return !img.closest(".mg-preowned-card__thumbs");
      })
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

    document.querySelectorAll(".mg-price-table").forEach(function (tableWrap) {
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

        if (isPreowned && gallery.length > 1) {
          var card = img.closest(".mg-preowned-card");
          var media =
            (card && card.querySelector(".mg-preowned-card__media")) ||
            img.parentElement;
          if (
            card &&
            media &&
            !card.querySelector(".mg-preowned-card__thumbs")
          ) {
            var extras = gallery.slice(1);
            var maxThumbs = 8; // 2 rows × 4 cols
            var showMore = extras.length > maxThumbs;
            var visible = showMore ? extras.slice(0, maxThumbs - 1) : extras;
            var strip = document.createElement("div");
            strip.className = "mg-preowned-card__thumbs";
            strip.setAttribute("role", "list");

            visible.forEach(function (href, j) {
              var galleryIndex = j + 1; // skip main (0)
              var thumb = document.createElement("button");
              thumb.type = "button";
              thumb.className = "mg-preowned-card__thumb";
              thumb.setAttribute("role", "listitem");
              thumb.setAttribute(
                "aria-label",
                (img.alt || "Photo") + " " + (galleryIndex + 1)
              );
              thumb.dataset.mgLightboxBound = "1";

              var thumbImg = document.createElement("img");
              thumbImg.src = thumbHref(href);
              thumbImg.alt = "";
              thumbImg.loading = "lazy";
              thumbImg.dataset.mgLightboxBound = "1";
              thumb.appendChild(thumbImg);

              thumb.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                img.setAttribute("data-full-src", href);
                img.src = thumbHref(href);
                img.dataset.galleryIndex = String(galleryIndex);
                strip
                  .querySelectorAll(".mg-preowned-card__thumb")
                  .forEach(function (el) {
                    el.classList.toggle("is-active", el === thumb);
                  });
              });

              strip.appendChild(thumb);
            });

            if (showMore) {
              var moreIdx = maxThumbs - 1 + 1; // first hidden extra's gallery index
              var moreHref = extras[maxThumbs - 1];
              var moreBtn = document.createElement("button");
              moreBtn.type = "button";
              moreBtn.className =
                "mg-preowned-card__thumb mg-preowned-card__thumb--more";
              moreBtn.setAttribute("role", "listitem");
              moreBtn.setAttribute(
                "aria-label",
                "View all " + gallery.length + " photos"
              );
              moreBtn.dataset.mgLightboxBound = "1";
              var moreImg = document.createElement("img");
              moreImg.src = thumbHref(moreHref);
              moreImg.alt = "";
              moreImg.loading = "lazy";
              moreImg.dataset.mgLightboxBound = "1";
              var moreLabel = document.createElement("span");
              moreLabel.className = "mg-preowned-card__thumb-more-label";
              moreLabel.textContent = "+" + (extras.length - (maxThumbs - 1));
              moreBtn.appendChild(moreImg);
              moreBtn.appendChild(moreLabel);
              moreBtn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                root._open(galleryItemsList, moreIdx);
              });
              strip.appendChild(moreBtn);
            }

            media.insertAdjacentElement("afterend", strip);
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

        img.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var items = galleryItemsList || fallbackItems;
          var start = galleryItemsList
            ? parseInt(img.dataset.galleryIndex || "0", 10) || 0
            : i;
          root._open(items, start);
        });
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
