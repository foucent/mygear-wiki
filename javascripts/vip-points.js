/* VIP points lookup — /vip/.
 *
 * The form POSTs the member's phone number to the VIP worker and renders what
 * comes back: {found: true, tier, points} or {found: false, message}. Every value
 * from the worker is written with textContent, never innerHTML — it is data
 * from another origin, not markup.
 *
 * The worker is cross-origin, so a browser-side failure (CORS answer, offline,
 * non-2xx) all land in the same catch and show the retry line.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://mygear-vip-api.foucent.workers.dev/";
  var WHATSAPP = "https://wa.me/8618627156285?text=Hi%2C%20I%27d%20like%20to%20redeem%20my%20VIP%20points.";

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function bind() {
    var form = document.getElementById("vip-form");
    var phone = document.getElementById("vip-phone");
    var button = document.getElementById("vip-submit");
    var result = document.getElementById("vip-result");
    if (!form || !phone || !button || !result) return;

    function clear() {
      result.textContent = "";
    }

    function show(kind, text) {
      clear();
      result.appendChild(el("p", "mg-vip__note mg-vip__note--" + kind, text));
    }

    // A failed lookup is not a "wrong number" — the member may not be on file
    // at all — so the line hands them the WhatsApp route instead of a retry.
    function showFailure() {
      clear();
      var note = el("p", "mg-vip__note mg-vip__note--error");
      note.appendChild(document.createTextNode("We can't check your points right now — message me on "));
      var link = el("a", null, "WhatsApp");
      link.href = WHATSAPP;
      note.appendChild(link);
      note.appendChild(document.createTextNode(" to check whether your membership details are registered."));
      result.appendChild(note);
    }

    function showFound(data) {
      clear();
      var card = el("div", "mg-vip__card");

      card.appendChild(el("p", "mg-vip__card-title", "🎉 VIP status verified"));

      var tier = el("p", "mg-vip__line");
      tier.appendChild(document.createTextNode("VIP tier: "));
      tier.appendChild(el("strong", null, String(data.tier)));
      card.appendChild(tier);

      var points = el("p", "mg-vip__line");
      points.appendChild(document.createTextNode("Points balance: "));
      points.appendChild(el("strong", "mg-vip__points", String(data.points)));
      card.appendChild(points);

      var note = el("p", "mg-vip__redeem");
      note.appendChild(document.createTextNode("To redeem rewards or take the discount on your next racket assembly, message us on "));
      var link = el("a", null, "WhatsApp");
      link.href = WHATSAPP;
      note.appendChild(link);
      note.appendChild(document.createTextNode("."));
      card.appendChild(note);

      result.appendChild(card);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Digits, spaces, dashes, dots, brackets and one leading "+" — enough for
      // any national format, with 6–15 digits as the actual length check.
      var value = phone.value.trim();
      var digits = value.replace(/\D/g, "");
      if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 6 || digits.length > 15) {
        show("error", "Please enter a valid phone number.");
        phone.focus();
        return;
      }

      clear();
      result.appendChild(el("p", "mg-vip__note", "⏳ Searching…"));
      button.disabled = true;

      // A hung request (blocked network, a proxy that never answers) would
      // otherwise leave "Searching…" on screen forever.
      var abort = new AbortController();
      var timer = setTimeout(function () { abort.abort(); }, 15000);

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: value }),
        signal: abort.signal
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (data) {
          if (data && data.found) {
            showFound(data);
          } else {
            show("empty", (data && data.message) || "No VIP record found for that phone number.");
          }
        })
        .catch(showFailure)
        .then(function () {
          clearTimeout(timer);
          button.disabled = false;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
