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

  function trackBeginCheckout(name, price) {
    try {
      if (typeof window.gtag !== "function") return;
      var id = String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);
      window.gtag("event", "begin_checkout", {
        currency: "USD",
        value: price || 0,
        items: [
          {
            item_id: id,
            item_name: name,
            item_category: "Pre-owned",
            price: price || 0,
            quantity: 1,
          },
        ],
      });
    } catch (e) {}
  }

  function waIcon() {
    return (
      '<svg class="mg-preowned-card__wa-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>' +
      "</svg>"
    );
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

      var cta = document.createElement("a");
      cta.className =
        "mg-preowned-card__wa" +
        (sold ? " mg-preowned-card__wa--preorder" : "");
      cta.href = waUrl(name, price, sold);
      cta.target = "_blank";
      cta.rel = "noopener";
      cta.addEventListener("click", function () {
        trackBeginCheckout(name, price);
      });
      if (sold) {
        cta.textContent = "Pre-order Now";
      } else {
        cta.innerHTML = waIcon() + "<span>Buy via WhatsApp</span>";
      }

      card.appendChild(media);
      card.appendChild(title);
      card.appendChild(priceEl);
      card.appendChild(cta);
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
    grid.className = "mg-preowned-grid mg-preowned-grid--shop";
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
      card.appendChild(priceEl);
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
      meta: ".mg-rubbers-showing",
      isStock: function (src) {
        return pathHas(src, "/stock-rubbers/") || pathHas(src, "\\stock-rubbers\\");
      },
    });
    buildShopGrid({
      wrap: ".mg-price-table--blades",
      meta: ".mg-blades-showing",
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
