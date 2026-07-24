(function () {
  var PER_PAGE = 12;

  function pageFromHash(pageCount) {
    var m = (location.hash || "").match(/^#page-(\d+)$/i);
    if (!m) return 1;
    var n = parseInt(m[1], 10);
    if (!n || n < 1) return 1;
    if (n > pageCount) return pageCount;
    return n;
  }

  function setHash(page) {
    var next = page <= 1 ? location.pathname + location.search : location.pathname + location.search + "#page-" + page;
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

  function initPager(wrap) {
    if (wrap.dataset.mgPager === "1") return;
    var table = wrap.querySelector("table");
    if (!table) return;
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
    if (rows.length <= PER_PAGE) return;
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
      rows.forEach(function (tr, i) {
        tr.hidden = i < start || i >= end;
      });
      meta.textContent =
        "Showing " + (start + 1) + "–" + end + " of " + rows.length;
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

    window.addEventListener("hashchange", function () {
      var next = pageFromHash(pageCount);
      if (next !== current) show(next);
    });
  }

  function updateAvailableCount(wrap) {
    var el = document.querySelector(".mg-preowned-count");
    if (!el) return;
    var table = wrap.querySelector("table");
    if (!table) return;
    var available = 0;
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (tr) {
      var priceCell = tr.cells && tr.cells[2];
      if (priceCell && !priceCell.querySelector("del")) available += 1;
    });
    el.textContent = String(available);
  }

  function boot() {
    document.querySelectorAll(".mg-price-table--preowned").forEach(function (wrap) {
      updateAvailableCount(wrap);
      initPager(wrap);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
