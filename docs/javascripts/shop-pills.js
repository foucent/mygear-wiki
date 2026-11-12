/* The shelf's category pills (2026-11-12, user: 「将 http://127.0.0.1:8001/
   rubbers/ 的商品样式和分类模仿 https://acebase.cc/ 的 Latest prices on hot gear
   的货架效果」, then 「将 http://127.0.0.1:8001/blades/ 页也同样处理」, then
   「pre-owned 和 add-ons 页也同样处理」).

   acebase.cc's version is gear.js, where the same row also drives a search box;
   this one is the pills alone. A container marks itself .mg-shop-pills with
   data-grid naming the ids of the grids it filters — one id on /rubbers/, two
   on /blades/, which keeps its priced cards and its quote-only cards apart.
   Every pill carries data-category, and every card in those grids carries the
   same attribute. "all" shows everything back. Cards are hidden with [hidden],
   which the card's own rule already turns into display:none.

   The grids are looked up on every click, not once at load: /pre-owned/'s grid
   is built by preowned-grid.js after this file may already have run. A grid
   that builds itself can also own its cards' [hidden] flag — it registers a
   filter in window.mgGridFilters[<grid id>], and this row hands it the category
   instead of touching the cards (2026-11-12; without that, the listing's lazy
   batches would un-hide the cards a filter had just hidden).

   An element can also carry data-hide-when-empty="<grid id>": it goes away when
   that grid has no card left showing. /blades/ hangs that on the divider between
   its two runs, so the caption never stands over an empty one.

   A no-op on any page without .mg-shop-pills[data-grid], so it is safe to load
   site-wide. */
(function () {
  "use strict";

  var pills = document.querySelector(".mg-shop-pills[data-grid]");
  if (!pills) return;

  var gridIds = pills
    .getAttribute("data-grid")
    .split(/\s+/)
    .filter(Boolean);
  if (!gridIds.length) return;

  var buttons = Array.prototype.slice.call(pills.querySelectorAll(".mg-shop-pill"));
  if (!buttons.length) return;

  function grids() {
    return gridIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
  }

  function apply(category) {
    grids().forEach(function (grid) {
      var handler = (window.mgGridFilters || {})[grid.id];
      if (handler) {
        handler(category);
        return;
      }
      Array.prototype.forEach.call(
        grid.querySelectorAll("[data-category]"),
        function (card) {
          card.hidden = category !== "all" && card.getAttribute("data-category") !== category;
        }
      );
    });

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-hide-when-empty]"),
      function (el) {
        var grid = document.getElementById(el.getAttribute("data-hide-when-empty"));
        if (!grid) return;
        el.hidden = !Array.prototype.some.call(
          grid.querySelectorAll("[data-category]"),
          function (card) { return !card.hidden; }
        );
      }
    );
  }

  pills.addEventListener("click", function (ev) {
    var pill = ev.target.closest(".mg-shop-pill");
    if (!pill || buttons.indexOf(pill) === -1) return;

    buttons.forEach(function (p) {
      var on = p === pill;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-pressed", on ? "true" : "false");
    });

    apply(pill.getAttribute("data-category") || "all");
  });
})();
