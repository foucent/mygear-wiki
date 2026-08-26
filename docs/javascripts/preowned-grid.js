(function () {
  var WA_NUMBER = "8618627156285";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function parsePrice(text) {
    var m = String(text || "").replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
    return m ? parseFloat(m[1]) : NaN;
  }

  function money(n) {
    return "$" + (Math.round(n * 100) / 100).toFixed(2);
  }

  function waUrl(name, price, sold) {
    var lines = [
      sold
        ? "Hi, I'd like to pre-order this blade:"
        : "Hi, I'd like this pre-owned blade:",
      "",
      "Product: " + name,
      "Price: " + money(price),
      "",
      "Ship to (city / postal code):",
      "",
      "Please confirm stock + shipping. Thanks!",
    ];
    return (
      "https://wa.me/" +
      WA_NUMBER +
      "?text=" +
      encodeURIComponent(lines.join("\n"))
    );
  }

  function waIcon() {
    return (
      '<svg class="mg-preowned-card__wa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>' +
      "</svg>"
    );
  }

  function appendShopPriceBlock(card, priceEl, img, tr) {
    var aeUrl =
      (img && img.getAttribute("data-aliexpress-url")) ||
      tr.getAttribute("data-aliexpress-url") ||
      "";
    var aePriceRaw =
      (img && img.getAttribute("data-aliexpress-price")) ||
      tr.getAttribute("data-aliexpress-price") ||
      "";
    var aePrice = parsePrice(aePriceRaw);
    var hasAe = aeUrl || aePrice >= 0;

    if (!hasAe) {
      card.appendChild(priceEl);
      return;
    }

    var wrap = document.createElement("div");
    wrap.className = "mg-preowned-card__prices";

    var rowShop = document.createElement("div");
    rowShop.className = "mg-preowned-card__price-row";
    var shopLabel = document.createElement("span");
    shopLabel.className = "mg-preowned-card__price-label";
    shopLabel.textContent = "MyGear";
    priceEl.classList.add("mg-preowned-card__price-value");
    rowShop.appendChild(shopLabel);
    rowShop.appendChild(priceEl);
    wrap.appendChild(rowShop);

    var rowAe = document.createElement("div");
    rowAe.className =
      "mg-preowned-card__price-row mg-preowned-card__price-row--ae";
    var aeLabel = document.createElement("span");
    aeLabel.className = "mg-preowned-card__price-label";
    aeLabel.textContent = "AliExpress";
    rowAe.appendChild(aeLabel);
    if (aePrice >= 0) {
      var aeVal = document.createElement("span");
      aeVal.className =
        "mg-preowned-card__price-value mg-preowned-card__ae-price";
      aeVal.textContent = money(aePrice);
      rowAe.appendChild(aeVal);
    }
    if (aeUrl) {
      var aeLink = document.createElement("a");
      aeLink.className = "mg-preowned-card__ae-link";
      aeLink.href = aeUrl;
      aeLink.target = "_blank";
      aeLink.rel = "noopener noreferrer";
      aeLink.textContent = "Buy";
      rowAe.appendChild(aeLink);
    }
    wrap.appendChild(rowAe);
    card.appendChild(wrap);
  }

  function buildGrid() {
    var wrap = $(".mg-price-table--preowned");
    if (!wrap || wrap.dataset.mgGridReady === "1") return;
    var table = wrap.querySelector("table");
    if (!table) return;
    wrap.dataset.mgGridReady = "1";

    var grid = document.createElement("div");
    grid.className = "mg-preowned-grid";
    grid.setAttribute("role", "list");

    var available = 0;
    var total = 0;
    var stockCards = [];
    var soldCards = [];

    $all("tbody tr", table).forEach(function (tr) {
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) return;
      var img = cells[0].querySelector("img");
      var name = (cells[1].textContent || "").trim();
      var priceCell = cells[2];
      var sold = !!priceCell.querySelector("del");
      var price = parsePrice(priceCell.textContent);
      if (!name || !(price >= 0)) return;

      total += 1;
      if (!sold) available += 1;

      var card = document.createElement("article");
      card.className =
        "mg-preowned-card" + (sold ? " mg-preowned-card--sold" : "");
      card.setAttribute("role", "listitem");
      card.dataset.name = name;
      card.dataset.price = String(price);
      if (sold) card.dataset.sold = "1";

      var media = document.createElement("div");
      media.className = "mg-preowned-card__media";
      if (img) {
        if (window.mgImgThumbs) window.mgImgThumbs.applyListThumb(img);
        media.appendChild(img);
      }
      if (sold) {
        var oos = document.createElement("span");
        oos.className = "mg-preowned-card__oos";
        oos.textContent = "OUT OF STOCK";
        media.appendChild(oos);
      }

      var title = document.createElement("h3");
      title.className = "mg-preowned-card__title";
      title.textContent = name;

      var priceEl = document.createElement("p");
      priceEl.className = "mg-preowned-card__price";
      if (sold) {
        var del = document.createElement("del");
        del.textContent = money(price);
        priceEl.appendChild(del);
      } else {
        priceEl.textContent = money(price);
      }

      var cta;
      if (sold) {
        cta = document.createElement("button");
        cta.type = "button";
        cta.className =
          "mg-preowned-card__wa mg-preowned-card__wa--preorder";
        cta.addEventListener("click", function () {
          if (window.mgOpenWhatsApp) {
            window.mgOpenWhatsApp(
              "This blade is out of stock. Could you recommend a similar one? " + name + " (" + money(price) + ")."
            );
          }
        });
        cta.textContent = "Find Similar";
      } else {
        cta = document.createElement("button");
        cta.type = "button";
        cta.className = "mg-cart-add mg-preowned-card__cart";
        cta.setAttribute("aria-label", "Add " + name + " to cart");
        cta.setAttribute("data-name", "Pre-owned · " + name);
        cta.setAttribute("data-price", String(price));
        cta.setAttribute("data-unique", "1");
        cta.innerHTML = "<span aria-hidden='true'>+</span><span>Add to cart</span>";
      }

      card.appendChild(media);
      card.appendChild(title);
      card.appendChild(priceEl);
      card.appendChild(cta);
      if (sold) soldCards.push(card);
      else stockCards.push(card);
    });

    stockCards.forEach(function (card) {
      grid.appendChild(card);
    });
    soldCards.forEach(function (card) {
      grid.appendChild(card);
    });

    wrap.appendChild(grid);

    // Remove the source table entirely so mobile never shows
    // leftover "Product / Price (USD)" headers or text-only rows.
    var tableShell = table.closest(".md-typeset__table") || table.parentElement;
    if (tableShell && tableShell !== wrap && tableShell.contains(table)) {
      tableShell.remove();
    } else {
      table.remove();
    }

    var countEl = $(".mg-preowned-count");
    if (countEl) countEl.textContent = String(available);

    var meta = $(".mg-preowned-showing");
    if (meta) {
      meta.textContent =
        "Showing " + total + " results · " + available + " available";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildGrid);
  } else {
    buildGrid();
  }

  function srcPath(src) {
    return String(src || "").toLowerCase();
  }

  function buildShopGrid(opts) {
    var wrap = $(opts.wrap);
    if (!wrap || wrap.dataset.mgGridReady === "1") return;
    var table = wrap.querySelector("table");
    if (!table) return;
    wrap.dataset.mgGridReady = "1";

    var grid = document.createElement("div");
    grid.className =
      "mg-preowned-grid mg-preowned-grid--shop" +
      (opts.gridClass ? " " + opts.gridClass : "");
    grid.setAttribute("role", "list");

    var stock = 0;
    var total = 0;
    var showBadge = opts.showBadge !== false;

    $all("tbody tr", table).forEach(function (tr) {
      var cells = tr.querySelectorAll("td");
      if (cells.length < 3) return;
      var img = cells[0].querySelector("img");
      var name = (cells[1].textContent || "").trim();
      var priceCell = cells[2];
      var price = parsePrice(priceCell.textContent);
      if (!name || !(price >= 0)) return;

      total += 1;
      var src =
        (img && (img.getAttribute("src") || img.getAttribute("data-src"))) || "";
      var inStock = opts.isStock(srcPath(src));
      if (inStock) stock += 1;

      var card = document.createElement("article");
      card.className =
        "mg-preowned-card" +
        (inStock ? " mg-preowned-card--stock" : " mg-preowned-card--proxy");
      card.setAttribute("role", "listitem");
      card.dataset.name = name;
      card.dataset.price = String(price);

      var media = document.createElement("div");
      media.className = "mg-preowned-card__media";
      if (img) {
        img.alt = name;
        if (window.mgImgThumbs) window.mgImgThumbs.applyListThumb(img);
        media.appendChild(img);
      }
      if (showBadge) {
        var badge = document.createElement("span");
        badge.className =
          "mg-preowned-card__badge" +
          (inStock
            ? " mg-preowned-card__badge--stock"
            : " mg-preowned-card__badge--proxy");
        badge.textContent = inStock ? "In stock" : "Proxy";
        media.appendChild(badge);
      }

      var title = document.createElement("h3");
      title.className = "mg-preowned-card__title";
      title.textContent = name;

      var priceEl = document.createElement("p");
      priceEl.className = "mg-preowned-card__price";
      priceEl.textContent = money(price);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-cart-add mg-preowned-card__cart";
      btn.setAttribute("aria-label", "Add " + name + " to cart");
      btn.setAttribute("data-name", name);
      btn.setAttribute("data-price", String(price));
      btn.innerHTML =
        "<span aria-hidden='true'>+</span><span>Add to cart</span>";

      card.appendChild(media);
      card.appendChild(title);

      var optsRaw =
        (img && img.getAttribute("data-options")) ||
        tr.getAttribute("data-options") ||
        "";
      var options = optsRaw
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      if (options.length) {
        var optWrap = document.createElement("div");
        optWrap.className = "mg-preowned-card__opts";
        var label = document.createElement("label");
        label.className = "mg-preowned-card__opts-label";
        label.textContent = "Option";
        var sel = document.createElement("select");
        sel.className = "mg-preowned-card__opts-select";
        sel.setAttribute("aria-label", name + " option");
        options.forEach(function (opt, i) {
          var o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          if (i === 0) o.selected = true;
          sel.appendChild(o);
        });
        function syncCartName() {
          var full = name + " · " + sel.value;
          btn.setAttribute("data-name", full);
          btn.setAttribute("aria-label", "Add " + full + " to cart");
        }
        sel.addEventListener("change", syncCartName);
        syncCartName();
        optWrap.appendChild(label);
        optWrap.appendChild(sel);
        card.appendChild(optWrap);
      }

      appendShopPriceBlock(card, priceEl, img, tr);
      card.appendChild(btn);
      grid.appendChild(card);
    });

    wrap.appendChild(grid);

    var tableShell = table.closest(".md-typeset__table") || table.parentElement;
    if (tableShell && tableShell !== wrap && tableShell.contains(table)) {
      tableShell.remove();
    } else {
      table.remove();
    }

    var meta = opts.meta ? $(opts.meta) : null;
    if (meta) {
      if (showBadge) {
        meta.textContent =
          "Showing " + total + " results · " + stock + " in stock";
      } else {
        meta.textContent = "Showing " + total + " results";
      }
    }
  }

  function pathHas(src, fragment) {
    return src.indexOf(fragment) !== -1;
  }

  function initShopGrids() {
    buildShopGrid({
      wrap: ".mg-price-table--rubbers",
      gridClass: "mg-preowned-grid--rubbers",
      // The in-stock table only holds own-inventory rubbers, so every card is stock.
      isStock: function () {
        return true;
      },
    });
    buildShopGrid({
      wrap: ".mg-price-table--blades",
      meta: ".mg-blades-showing",
      gridClass: "mg-preowned-grid--blades",
      isStock: function (src) {
        return pathHas(src, "/stock-blades/") || pathHas(src, "\\stock-blades\\");
      },
    });
    buildShopGrid({
      wrap: ".mg-price-table--addons",
      meta: ".mg-addons-showing",
      showBadge: false,
      isStock: function () {
        return true;
      },
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShopGrids);
  } else {
    initShopGrids();
  }
})();
