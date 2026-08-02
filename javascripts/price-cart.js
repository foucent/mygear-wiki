(function () {
  var STORAGE_KEY = "mg-price-cart-v1";
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
    return "$" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function cartCount(cart) {
    return cart.reduce(function (sum, item) {
      return sum + (item.qty || 0);
    }, 0);
  }

  function cartTotal(cart) {
    return cart.reduce(function (sum, item) {
      return sum + (item.price || 0) * (item.qty || 0);
    }, 0);
  }

  function upsert(cart, name, price, unique) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        if (unique || cart[i].unique) {
          cart[i].qty = 1;
          cart[i].unique = true;
          return { cart: cart, status: "exists" };
        }
        cart[i].qty += 1;
        return { cart: cart, status: "updated" };
      }
    }
    cart.push({ name: name, price: price, qty: 1, unique: !!unique });
    return { cart: cart, status: "added" };
  }

  function setQty(cart, name, qty) {
    qty = Math.max(0, parseInt(qty, 10) || 0);
    return cart
      .map(function (item) {
        if (item.name !== name) return item;
        if (item.unique && qty > 1) qty = 1;
        return {
          name: item.name,
          price: item.price,
          qty: qty,
          unique: !!item.unique,
        };
      })
      .filter(function (item) {
        return item.qty > 0;
      });
  }

  function normalizeCart(cart) {
    return cart.map(function (item) {
      var unique =
        !!item.unique || String(item.name || "").indexOf("Pre-owned · ") === 0;
      return {
        name: item.name,
        price: item.price,
        qty: unique ? Math.min(1, item.qty || 1) : item.qty || 1,
        unique: unique,
      };
    });
  }

  function buildWaUrl(cart) {
    var lines = [
      "Hello, I'd like a quote for:",
      "",
    ];
    cart.forEach(function (item, i) {
      lines.push(
        i + 1 + ". " + item.name + " × " + item.qty + " — " + money(item.price) + " each"
      );
    });
    lines.push("");
    lines.push("Ship to (city / postal code):");
    lines.push("");
    lines.push("Please confirm final total + shipping. Thanks!");
    return (
      "https://wa.me/" +
      WA_NUMBER +
      "?text=" +
      encodeURIComponent(lines.join("\n"))
    );
  }

  function buildCrispMsg(cart) {
    var lines = [
      "Hello, I'd like a quote for:",
      "",
    ];
    cart.forEach(function (item, i) {
      lines.push(
        i + 1 + ". " + item.name + " × " + item.qty + " — " + money(item.price) + " each"
      );
    });
    lines.push("");
    lines.push("Ship to (city / postal code):");
    lines.push("");
    lines.push("Please confirm final total + shipping. Thanks!");
    return lines.join("\n");
  }

  function itemId(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/^pre-owned · /, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
  }

  function toGaItem(item, qty) {
    var name = item.name || "";
    var preowned = /^pre-owned · /i.test(name);
    return {
      item_id: itemId(name),
      item_name: name.replace(/^Pre-owned · /, ""),
      item_category: preowned ? "Pre-owned" : "Shop",
      price: item.price || 0,
      quantity: qty != null ? qty : item.qty || 1,
    };
  }

  function trackGa(eventName, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params || {});
      }
    } catch (e) {}
  }

  function trackAddToCart(name, price, qty) {
    var q = qty || 1;
    var item = toGaItem({ name: name, price: price, qty: q }, q);
    trackGa("add_to_cart", {
      currency: "USD",
      value: (price || 0) * q,
      items: [item],
    });
  }

  function trackBeginCheckout(cart) {
    if (!cart || !cart.length) return;
    trackGa("begin_checkout", {
      currency: "USD",
      value: cartTotal(cart),
      items: cart.map(function (item) {
        return toGaItem(item);
      }),
    });
  }

  function enhanceTables() {
    $all(".mg-price-table table").forEach(function (table) {
      if (table.dataset.mgCartReady === "1") return;
      table.dataset.mgCartReady = "1";

      var headRow = table.querySelector("thead tr");
      if (headRow && !headRow.querySelector(".mg-cart-col")) {
        var th = document.createElement("th");
        th.className = "mg-cart-col";
        th.textContent = "";
        headRow.appendChild(th);
      }

      $all("tbody tr", table).forEach(function (tr) {
        if (tr.querySelector(".mg-cart-add") || tr.querySelector(".mg-cart-col")) return;
        var cells = tr.querySelectorAll("td");
        if (cells.length < 3) return;
        var name = (cells[1].textContent || "").trim();
        var priceCell = cells[2];
        var price = parsePrice(priceCell.textContent);
        if (!name || !(price >= 0)) return;

        var preownedWrap = table.closest(".mg-price-table--preowned");
        var shopWrap =
          table.closest(".mg-price-table--rubbers") ||
          table.closest(".mg-price-table--blades") ||
          table.closest(".mg-price-table--addons");
        var preowned = !!preownedWrap;
        // Card grids handle CTAs; leave the source table alone.
        if (
          (preowned && preownedWrap.querySelector(".mg-preowned-grid")) ||
          (shopWrap && shopWrap.querySelector(".mg-preowned-grid"))
        ) {
          return;
        }
        var sold = !!priceCell.querySelector("del");
        var img = cells[0].querySelector("img");
        var src = ((img && (img.getAttribute("src") || img.getAttribute("data-src"))) || "").toLowerCase();
        var isStockRubber =
          src.indexOf("/stock-rubbers/") !== -1 ||
          src.indexOf("\\stock-rubbers\\") !== -1;
        var isFeaturedRubber =
          src.indexOf("/featured-rubbers/") !== -1 ||
          src.indexOf("\\featured-rubbers\\") !== -1;
        var isStockBlade =
          src.indexOf("/stock-blades/") !== -1 ||
          src.indexOf("\\stock-blades\\") !== -1;
        var isAddon =
          src.indexOf("/add-ons/") !== -1 || src.indexOf("\\add-ons\\") !== -1;
        var isProxyRubber =
          isFeaturedRubber ||
          src.indexOf("/price-list/rubbers/") !== -1 ||
          src.indexOf("\\price-list\\rubbers\\") !== -1 ||
          ((!isStockRubber &&
            (src.indexOf("/rubbers/") !== -1 || src.indexOf("\\rubbers\\") !== -1)));
        var isBlade =
          (!isStockBlade &&
            (src.indexOf("/blades/") !== -1 || src.indexOf("\\blades\\") !== -1)) ||
          (src.indexOf("/price-list/blades/") !== -1 ||
            src.indexOf("\\price-list\\blades\\") !== -1);
        // Pre-owned blades are unique listings.
        var uniqueBlade =
          preowned && !isStockRubber && !isFeaturedRubber && !isStockBlade && !isAddon;
        if (isStockBlade || isStockRubber || isAddon || (uniqueBlade && !sold)) {
          tr.classList.add("mg-price-row--stock");
        } else if (isBlade || isProxyRubber) {
          // Amber = proxy-buy (blades + rubbers).
          tr.classList.add("mg-price-row--blade");
        }

        if (sold) {
          tr.classList.add("mg-price-row--sold");
          var titleTag = cells[1].querySelector(".mg-price-sold-tag");
          if (titleTag) titleTag.remove();
          var soldThumb = cells[0];
          if (soldThumb && !soldThumb.querySelector(".mg-price-sold-tag")) {
            soldThumb.classList.add("mg-price-thumb-wrap");
            var tag = document.createElement("span");
            tag.className = "mg-price-sold-tag";
            tag.textContent = "Sold";
            soldThumb.appendChild(tag);
          }
          var empty = document.createElement("td");
          empty.className = "mg-cart-col";
          tr.appendChild(empty);
          return;
        }

        var cartName = uniqueBlade ? "Pre-owned · " + name : name;
        var td = document.createElement("td");
        td.className = "mg-cart-col";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mg-cart-add";
        btn.setAttribute("aria-label", "Add " + name + " to cart");
        btn.setAttribute("data-name", cartName);
        btn.setAttribute("data-price", String(price));
        if (uniqueBlade) btn.setAttribute("data-unique", "1");
        btn.innerHTML = "<span aria-hidden='true'>+</span>";
        td.appendChild(btn);
        tr.appendChild(td);
      });
    });
  }

  function enhanceListings() {
    $all(".mg-listing").forEach(function (listing) {
      if (listing.classList.contains("mg-listing--sold")) return;
      if (listing.querySelector(".mg-cart-add")) return;

      var h3 = listing.querySelector("h3");
      if (!h3) return;
      var text = (h3.textContent || "").replace(/\s+/g, " ").trim();
      var m = text.match(/^(.*?)\s*[—–-]\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*$/);
      if (!m) return;

      var title = m[1].trim();
      var price = parseFloat(m[2]);
      if (!title || !(price >= 0)) return;

      var name = "Pre-owned · " + title;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mg-cart-add mg-listing__cart-btn";
      btn.setAttribute("aria-label", "Add " + title + " to cart");
      btn.setAttribute("data-name", name);
      btn.setAttribute("data-price", String(price));
      btn.setAttribute("data-unique", "1");
      btn.innerHTML = "<span aria-hidden='true'>+</span>";

      var actions = listing.querySelector(".mg-listing__wa");
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "mg-listing__wa";
        listing.appendChild(actions);
      }
      actions.classList.add("mg-listing__actions");
      actions.insertBefore(btn, actions.firstChild);
    });
  }

  function ensureUi() {
    if ($("#mg-cart-root")) return $("#mg-cart-root");

    var root = document.createElement("div");
    root.id = "mg-cart-root";
    root.innerHTML =
      '<div class="mg-float-stack">' +
      '<button type="button" class="mg-cart-fab" id="mg-cart-fab" aria-label="Open cart" hidden>' +
      '  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.45c.75 0 1.4-.41 1.73-1.07L21 6H6.2l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 16.37 5.48 18 7 18h12v-2H7.2l1-1.8z"/></svg>' +
      '  <span class="mg-cart-fab__count" id="mg-cart-count">0</span>' +
      "</button>" +
      "</div>" +
      '<div class="mg-cart-toast" id="mg-cart-toast" hidden role="status" aria-live="polite"></div>' +
      '<div class="mg-cart-drawer" id="mg-cart-drawer" hidden>' +
      '  <div class="mg-cart-drawer__backdrop" data-cart-close="1"></div>' +
      '  <div class="mg-cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Cart">' +
      '    <div class="mg-cart-drawer__head">' +
      "      <strong>Cart</strong>" +
      '      <button type="button" class="mg-cart-drawer__x" data-cart-close="1" aria-label="Close">×</button>' +
      "    </div>" +
      '    <div class="mg-cart-drawer__body" id="mg-cart-items"></div>' +
      '    <div class="mg-cart-drawer__foot">' +
      '      <div class="mg-cart-drawer__total">Subtotal <span id="mg-cart-total">$0</span></div>' +
      '      <a class="mg-cart-drawer__wa" id="mg-cart-wa" href="#">Checkout on WhatsApp</a>' +
      '      <button type="button" class="mg-cart-drawer__crisp" id="mg-cart-crisp">Checkout on Live Chat</button>' +
      '      <button type="button" class="mg-cart-drawer__clear" id="mg-cart-clear">Clear cart</button>' +
      "    </div>" +
      "  </div>" +
      "</div>";
    document.body.appendChild(root);
    return root;
  }

  var toastTimer = null;
  function showToast(message) {
    var toast = $("#mg-cart-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
      toastTimer = setTimeout(function () {
        toast.hidden = true;
      }, 220);
    }, 1800);
  }

  function render(cart) {
    var fab = $("#mg-cart-fab");
    var countEl = $("#mg-cart-count");
    var itemsEl = $("#mg-cart-items");
    var totalEl = $("#mg-cart-total");
    var wa = $("#mg-cart-wa");
    var count = cartCount(cart);

    if (!fab || !itemsEl) return;

    fab.hidden = count === 0;
    countEl.textContent = String(count);
    totalEl.textContent = money(cartTotal(cart));

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="mg-cart-empty">Cart is empty. Tap + on a product to add it.</p>';
      wa.setAttribute("href", "#");
      wa.setAttribute("aria-disabled", "true");
      wa.classList.add("is-disabled");
    } else {
      itemsEl.innerHTML = cart
        .map(function (item) {
          var qtyHtml = item.unique
            ? '<div class="mg-cart-line__qty mg-cart-line__qty--fixed"><span>1</span></div>'
            : '<div class="mg-cart-line__qty">' +
              '<button type="button" class="mg-cart-qty" data-delta="-1" aria-label="Decrease">−</button>' +
              "<span>" +
              item.qty +
              "</span>" +
              '<button type="button" class="mg-cart-qty" data-delta="1" aria-label="Increase">+</button>' +
              "</div>";
          return (
            '<div class="mg-cart-line" data-name="' +
            item.name.replace(/"/g, "&quot;") +
            '"' +
            (item.unique ? ' data-unique="1"' : "") +
            ">" +
            '<div class="mg-cart-line__meta">' +
            '<div class="mg-cart-line__name">' +
            item.name +
            "</div>" +
            '<div class="mg-cart-line__price">' +
            money(item.price) +
            (item.unique ? "" : " each") +
            "</div>" +
            "</div>" +
            qtyHtml +
            '<button type="button" class="mg-cart-remove" aria-label="Remove">×</button>' +
            "</div>"
          );
        })
        .join("");
      wa.href = buildWaUrl(cart);
      wa.removeAttribute("aria-disabled");
      wa.classList.remove("is-disabled");
    }
  }

  function openDrawer(open) {
    var drawer = $("#mg-cart-drawer");
    if (!drawer) return;
    drawer.hidden = !open;
    document.body.classList.toggle("mg-cart-open", !!open);
  }

  function flashAdd(btn) {
    btn.classList.add("mg-cart-add--done");
    setTimeout(function () {
      btn.classList.remove("mg-cart-add--done");
    }, 650);
  }

  function init() {
    if (!$(".mg-price-table") && !$(".mg-listing")) return;

    enhanceTables();
    enhanceListings();
    ensureUi();

    var cart = normalizeCart(loadCart());
    saveCart(cart);
    render(cart);

    document.addEventListener("click", function (e) {
      var add = e.target.closest(".mg-cart-add");
      if (add) {
        var name = add.getAttribute("data-name");
        var price = parseFloat(add.getAttribute("data-price"));
        var unique = add.getAttribute("data-unique") === "1";
        var shortName = name.replace(/^Pre-owned · /, "");
        var result = upsert(cart, name, price, unique);
        cart = result.cart;
        saveCart(cart);
        render(cart);
        flashAdd(add);
        if (result.status === "exists") {
          showToast("Already in cart — only 1 available");
        } else if (result.status === "updated") {
          trackAddToCart(name, price, 1);
          showToast("Updated: " + shortName);
        } else {
          trackAddToCart(name, price, 1);
          showToast("Added to cart: " + shortName);
        }
        return;
      }

      var waCheckout = e.target.closest("#mg-cart-wa");
      if (waCheckout && cart.length) {
        trackBeginCheckout(cart);
      }

      var crispCheckout = e.target.closest("#mg-cart-crisp");
      if (crispCheckout && cart.length) {
        trackBeginCheckout(cart);
        if (window.mgOpenCrisp) {
          window.mgOpenCrisp(buildCrispMsg(cart));
          openDrawer(false);
        }
        return;
      }

      if (e.target.closest("#mg-cart-fab")) {
        openDrawer(true);
        return;
      }

      if (e.target.closest("[data-cart-close]")) {
        openDrawer(false);
        return;
      }

      if (e.target.closest("#mg-cart-clear")) {
        cart = [];
        saveCart(cart);
        render(cart);
        return;
      }

      var line = e.target.closest(".mg-cart-line");
      if (!line) return;
      var lineName = line.getAttribute("data-name");
      var qtyBtn = e.target.closest(".mg-cart-qty");
      if (qtyBtn) {
        var delta = parseInt(qtyBtn.getAttribute("data-delta"), 10) || 0;
        var current = cart.find(function (x) {
          return x.name === lineName;
        });
        var next = current ? current.qty + delta : 0;
        cart = setQty(cart, lineName, next);
        saveCart(cart);
        render(cart);
        return;
      }
      if (e.target.closest(".mg-cart-remove")) {
        cart = setQty(cart, lineName, 0);
        saveCart(cart);
        render(cart);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
