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
          var tr = img.closest("tr");
          var nameCell = tr && tr.cells[1];
          if (nameCell && !nameCell.querySelector(".mg-price-more")) {
            var strip = document.createElement("div");
            strip.className = "mg-price-more";
            var extras = gallery.slice(1);
            var showMore = gallery.length > 6;
            var normalExtras = showMore ? extras.slice(0, 5) : extras;
            var openAt = function (startIndex) {
              return function (e) {
                e.preventDefault();
                e.stopPropagation();
                root._open(galleryItemsList, startIndex);
              };
            };

            normalExtras.forEach(function (href, j) {
              var thumb = document.createElement("img");
              thumb.src = href;
              thumb.alt = (img.alt || "") + " (" + (j + 2) + ")";
              thumb.loading = "lazy";
              thumb.className = "mg-price-more__thumb";
              thumb.dataset.mgLightboxBound = "1";
              thumb.addEventListener("click", openAt(j + 1));
              strip.appendChild(thumb);
            });

            if (showMore) {
              var moreBtn = document.createElement("button");
              moreBtn.type = "button";
              moreBtn.className = "mg-price-more__more";
              moreBtn.setAttribute(
                "aria-label",
                "View all " + gallery.length + " photos"
              );
              moreBtn.dataset.mgLightboxBound = "1";
              var moreImg = document.createElement("img");
              moreImg.src = extras[5];
              moreImg.alt = "";
              moreImg.loading = "lazy";
              moreImg.dataset.mgLightboxBound = "1";
              var moreLabel = document.createElement("span");
              moreLabel.className = "mg-price-more__more-label";
              moreLabel.textContent = "+" + (gallery.length - 6);
              moreBtn.appendChild(moreImg);
              moreBtn.appendChild(moreLabel);
              moreBtn.addEventListener("click", openAt(6));
              strip.appendChild(moreBtn);
            }

            nameCell.appendChild(strip);
          }
        } else if (count > 1) {
          var wrap = img.parentElement;
          if (wrap && !wrap.classList.contains("mg-price-thumb-wrap")) {
            wrap.classList.add("mg-price-thumb-wrap");
          }
          if (wrap && !wrap.querySelector(".mg-price-thumb-count")) {
            var badge = document.createElement("span");
            badge.className = "mg-price-thumb-count";
            badge.textContent = String(count);
            badge.title = count + " photos";
            wrap.appendChild(badge);
          }
        }

        img.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var items = galleryItemsList || fallbackItems;
          var start = galleryItemsList ? 0 : i;
          root._open(items, start);
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
