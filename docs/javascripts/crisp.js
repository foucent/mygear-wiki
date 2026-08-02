/**
 * Crisp live chat bootstrap for MyGear.Top
 * + custom close button (top-right) when chat is open
 * + .mg-crisp-open click helper for site-wide CTAs
 */
(function () {
  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = "7e271486-98c1-4394-a6be-b323024b43cb";

  function openCrisp(prefill) {
    window.$crisp = window.$crisp || [];
    var msg = (prefill || "").trim();
    if (msg) {
      window.$crisp.push(["set", "message:text", msg]);
    }
    window.$crisp.push(["do", "chat:open"]);
  }

  window.mgOpenCrisp = openCrisp;

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest
        ? e.target.closest("a.mg-crisp-open, button.mg-crisp-open")
        : null;
      if (!el) return;
      e.preventDefault();
      openCrisp(el.getAttribute("data-crisp-msg") || "");
    },
    true
  );

  function ensureCloseButton() {
    var btn = document.getElementById("mg-crisp-close");
    if (btn) return btn;

    btn = document.createElement("button");
    btn.id = "mg-crisp-close";
    btn.type = "button";
    btn.className = "mg-crisp-close";
    btn.setAttribute("aria-label", "Close chat");
    btn.setAttribute("title", "Close chat");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"/>' +
      "</svg>";
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.$crisp.push(["do", "chat:close"]);
    });
    document.body.appendChild(btn);
    return btn;
  }

  function setCloseVisible(on) {
    var btn = ensureCloseButton();
    btn.classList.toggle("is-visible", !!on);
    btn.setAttribute("aria-hidden", on ? "false" : "true");
  }

  window.$crisp.push(["on", "chat:opened", function () {
    setCloseVisible(true);
  }]);
  window.$crisp.push(["on", "chat:closed", function () {
    setCloseVisible(false);
  }]);

  if (document.getElementById("mg-crisp-sdk")) return;

  var s = document.createElement("script");
  s.id = "mg-crisp-sdk";
  s.src = "https://client.crisp.chat/l.js";
  s.async = true;
  document.head.appendChild(s);
})();
