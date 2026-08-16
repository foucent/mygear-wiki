/**
 * WhatsApp floating button for MyGear.Top
 * + window.mgOpenWhatsApp(msg) helper for site-wide CTAs
 */
(function () {
  var WA_NUMBER = "8618627156285";

  function buildUrl(msg) {
    return (
      "https://wa.me/" +
      WA_NUMBER +
      (msg ? "?text=" + encodeURIComponent(String(msg).trim()) : "")
    );
  }

  function openWa(msg) {
    window.open(buildUrl(msg), "_blank", "noopener");
  }

  window.mgOpenWhatsApp = openWa;

  // Floating button (bottom-right, where the chat bubble used to be)
  var btn = document.createElement("a");
  btn.className = "mg-wa-float";
  btn.href = buildUrl("");
  btn.target = "_blank";
  btn.rel = "noopener";
  btn.setAttribute("aria-label", "Chat on WhatsApp");
  btn.setAttribute("title", "Chat on WhatsApp");
  btn.innerHTML =
    '<img class="mg-wa-float__icon" src="/images/wa-float/icon.png" alt="" width="28" height="28" loading="lazy">';
  document.body.appendChild(btn);

  // .mg-wa-open click helper (delegated, for site-wide CTAs)
  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest
        ? e.target.closest("a.mg-wa-open, button.mg-wa-open")
        : null;
      if (!el) return;
      e.preventDefault();
      openWa(el.getAttribute("data-wa-msg") || "");
    },
    true
  );
})();
