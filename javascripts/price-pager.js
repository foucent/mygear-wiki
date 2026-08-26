(function () {
  var PER_PAGE = 15;
  var CAT_ORDER = { Blade: 0, Rubber: 1, "Add-on": 2 };

  function pageFromHash(pageCount) {
    var m = (location.hash || "").match(/^#page-(\d+)$/i);
    if (!m) return 1;
    var n = parseInt(m[1], 10);
    if (!n || n < 1) return 1;
    if (n > pageCount) return pageCount;
    return n;
  }

  function setHash(page) {
    var next =
      page <= 1
        ? location.pathname + location.search
        : location.pathname + location.search + "#page-" + page;
    var cur = location.pathname + location.search + (location.hash || "");
    if (cur === next) return;
    history.replaceState(null, "", next);
  }

  function buildPageList(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, function (_, i) {
        return i + 1;
      });
    }
    var pages = [1];
    var start = Math.max(2, current - 1);
    var end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push("…");
    for (var i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("…");
    pages.push(total);
    return pages;
  }

  function collectItems(wrap) {
    var cards = Array.prototype.slice.call(
      wrap.querySelectorAll(".mg-preowned-grid .mg-preowned-card")
    );
    if (cards.length) return cards;
    var table = wrap.querySelector("table");
    if (!table) return [];
    return Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
  }

  function colIndex(ths, text) {
    for (var i = 0; i < ths.length; i++) {
      if ((ths[i].textContent || "").trim() === text) return i;
    }
    return -1;
  }

  // Product-name cell minus any option <select> appended by the cart script.
  function cellName(cell) {
    if (!cell) return "";
    if (!cell.querySelector(".mg-cart-row-options")) {
      return (cell.textContent || "").trim();
    }
    var clone = cell.cloneNode(true);
    var opts = clone.querySelector(".mg-cart-row-options");
    if (opts && opts.parentNode) opts.parentNode.removeChild(opts);
    return (clone.textContent || "").trim();
  }

  // —— Sortable columns on .mg-price-table--all tables (Price List / blades bottom table) ——
  function initSorting(wrap, table, rows, refresh) {
    if (!table || !wrap.classList.contains("mg-price-table--all")) return;
    var ths = table.querySelectorAll("thead th");
    var iName = colIndex(ths, "Product");
    var iPrice = colIndex(ths, "Price (USD)");
    var iCat = colIndex(ths, "Category");
    if (iName < 0 || iPrice < 0) return;

    var sortData = rows.map(function (tr) {
      var cells = tr.querySelectorAll("td");
      var name = cellName(cells[iName]);
      var priceM = String(
        cells[iPrice] && cells[iPrice].textContent || ""
      )
        .replace(/,/g, "")
        .match(/([0-9]+(?:\.[0-9]+)?)/);
      var cat =
        iCat >= 0 && cells[iCat] ? (cells[iCat].textContent || "").trim() : "";
      return {
        tr: tr,
        nameKey: name.toLowerCase(),
        price: priceM ? parseFloat(priceM[1]) : NaN,
        cat: cat,
      };
    });
    var sortState = { key: null, dir: 1 };

    function sortCompare(a, b, key) {
      if (key === "price") return a.price - b.price;
      if (key === "cat") {
        var x = CAT_ORDER[a.cat] != null ? CAT_ORDER[a.cat] : 99;
        var y = CAT_ORDER[b.cat] != null ? CAT_ORDER[b.cat] : 99;
        return x - y;
      }
      return a.nameKey.localeCompare(b.nameKey);
    }

    function applySort() {
      var ordered = sortData.slice();
      if (sortState.key) {
        ordered.sort(function (a, b) {
          var r = sortCompare(a, b, sortState.key);
          return sortState.dir === 1 ? r : -r;
        });
      }
      var tbody = table.querySelector("tbody");
      ordered.forEach(function (row) {
        tbody.appendChild(row.tr);
      });
      rows.length = 0;
      ordered.forEach(function (row) {
        rows.push(row.tr);
      });
      Array.prototype.forEach.call(
        table.querySelectorAll("th.mg-sortable .mg-sort-ind"),
        function (ind) {
          var key = ind.parentNode.getAttribute("data-sort");
          ind.textContent =
            sortState.key === key
              ? sortState.dir === 1
                ? "↑"
                : "↓"
              : "↕";
        }
      );
      if (refresh) refresh();
    }

    var sortCols = [];
    if (iName >= 0) sortCols.push({ key: "name", th: ths[iName] });
    if (iPrice >= 0) sortCols.push({ key: "price", th: ths[iPrice] });
    if (iCat >= 0) sortCols.push({ key: "cat", th: ths[iCat] });

    sortCols.forEach(function (col) {
      col.th.classList.add("mg-sortable");
      col.th.setAttribute("data-sort", col.key);
      col.th.innerHTML =
        (col.th.textContent || "").trim() +
        '<span class="mg-sort-ind">↕</span>';
      col.th.addEventListener("click", function () {
        if (sortState.key === col.key && sortState.dir === 1) {
          sortState.dir = -1;
        } else if (sortState.key === col.key && sortState.dir === -1) {
          sortState.key = null;
          sortState.dir = 1;
        } else {
          sortState.key = col.key;
          sortState.dir = 1;
        }
        applySort();
      });
    });
  }

  function initPager(wrap, metaSel) {
    if (wrap.dataset.mgPager === "1") return;
    var rows = collectItems(wrap);
    var table = wrap.querySelector("table");
    var noPager = wrap.classList.contains("mg-price-table--nopager");

    // Full-list tables show every row — sorting only, no pagination.
    if (noPager) {
      wrap.dataset.mgPager = "1";
      initSorting(wrap, table, rows, null);
      return;
    }

    if (rows.length <= PER_PAGE) {
      updateShowing(metaSel, 1, rows.length, rows.length);
      initSorting(wrap, table, rows, null);
      return;
    }
    wrap.dataset.mgPager = "1";

    var pageCount = Math.ceil(rows.length / PER_PAGE);
    var meta = document.createElement("p");
    meta.className = "mg-pager__meta";
    meta.setAttribute("aria-live", "polite");

    var nav = document.createElement("nav");
    nav.className = "mg-pager";
    nav.setAttribute("aria-label", "Product pages");

    wrap.appendChild(meta);
    wrap.appendChild(nav);

    var current = 1;
    var skipScroll = true;

    function renderNav() {
      nav.innerHTML = "";

      var prev = document.createElement("button");
      prev.type = "button";
      prev.className = "mg-pager__btn";
      prev.textContent = "Prev";
      prev.disabled = current <= 1;
      prev.addEventListener("click", function () {
        go(current - 1);
      });
      nav.appendChild(prev);

      buildPageList(current, pageCount).forEach(function (item) {
        if (item === "…") {
          var dots = document.createElement("span");
          dots.className = "mg-pager__ellipsis";
          dots.textContent = "…";
          nav.appendChild(dots);
          return;
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "mg-pager__btn" + (item === current ? " mg-pager__btn--active" : "");
        btn.textContent = String(item);
        if (item === current) btn.setAttribute("aria-current", "page");
        btn.addEventListener("click", function () {
          go(item);
        });
        nav.appendChild(btn);
      });

      var next = document.createElement("button");
      next.type = "button";
      next.className = "mg-pager__btn";
      next.textContent = "Next";
      next.disabled = current >= pageCount;
      next.addEventListener("click", function () {
        go(current + 1);
      });
      nav.appendChild(next);
    }

    function show(page) {
      current = Math.max(1, Math.min(pageCount, page));
      var start = (current - 1) * PER_PAGE;
      var end = Math.min(start + PER_PAGE, rows.length);
      rows.forEach(function (el, i) {
        el.hidden = i < start || i >= end;
      });
      meta.textContent =
        "Showing " + (start + 1) + "–" + end + " of " + rows.length;
      updateShowing(metaSel, start + 1, end, rows.length);
      renderNav();
      setHash(current);
      if (!skipScroll) {
        wrap.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      skipScroll = false;
    }

    function go(page) {
      if (page === current) return;
      show(page);
    }

    show(pageFromHash(pageCount));
    skipScroll = false;

    initSorting(wrap, table, rows, function () {
      show(current);
    });

    window.addEventListener("hashchange", function () {
      var next = pageFromHash(pageCount);
      if (next !== current) show(next);
    });
  }

  function updateShowing(metaSel, from, to, total) {
    if (!metaSel) return;
    var meta = document.querySelector(metaSel);
    if (meta) {
      meta.textContent = "Showing " + from + "–" + to + " of " + total + " results";
    }
  }

  function updateAvailableCount(wrap) {
    var el = document.querySelector(".mg-preowned-count");
    if (!el) return;
    var cards = wrap.querySelectorAll(".mg-preowned-card:not(.mg-preowned-card--sold)");
    if (cards.length) {
      el.textContent = String(cards.length);
      return;
    }
    var table = wrap.querySelector("table");
    if (!table) return;
    var available = 0;
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (tr) {
      var priceCell = tr.cells && tr.cells[2];
      if (priceCell && !priceCell.querySelector("del")) available += 1;
    });
    el.textContent = String(available);
  }

  var PAGER_TARGETS = [
    { wrap: ".mg-price-table--preowned", meta: ".mg-preowned-showing" },
    { wrap: ".mg-price-table--rubbers", meta: ".mg-rubbers-showing" },
    { wrap: ".mg-price-table--blades", meta: ".mg-blades-showing" },
    { wrap: ".mg-price-table--addons", meta: ".mg-addons-showing" },
    { wrap: ".mg-price-table--all", meta: ".mg-all-showing" },
  ];

  function boot() {
    PAGER_TARGETS.forEach(function (target) {
      document.querySelectorAll(target.wrap).forEach(function (wrap) {
        updateAvailableCount(wrap);
        initPager(wrap, target.meta);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
