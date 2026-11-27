/* The pre-order form on /pre-owned/ (2026-11-28, user: 「将 /pre-owned/ 模仿
   / 页面中的 Racket Advice 功能，为用户提供二手球拍的预定（型号、87/90/93
   ±1 克重、备注或特殊要求）」, then 「像首页的 Racket Advice 一样分几步提问
   让用户进交，以减少网页的空间」).

   Same hand-off as docs/javascripts/racket-advisor.js: nothing is recommended
   or stored here — the submit builds a WhatsApp message with the answers and
   opens the chat. The flow asks one question at a time inside the long box:
   model (free text with a datalist) → weight (87/90/93 ±1) → optional notes.
   The handle is not a field: FL is the only one we take and the intro says so.

   Every selector lives inside #preorder-form / #preorder-result, so this is a
   no-op on any page without the form. */
(function () {
  "use strict";

  var form = document.getElementById("preorder-form");
  if (!form) return;

  var result = document.getElementById("preorder-result");
  var note = document.getElementById("preorder-note");
  var chat = document.getElementById("preorder-chat");
  var screens = Array.prototype.slice.call(
    form.querySelectorAll(".mg-adv-screen")
  );
  var back = form.querySelector(".mg-adv-back");
  var next = form.querySelector(".mg-adv-next");
  var submit = form.querySelector(".mg-adv-submit");
  var model = document.getElementById("preorder-model");
  var weight = document.getElementById("preorder-weight");
  var label = document.getElementById("preorder-step-label");
  var fill = document.getElementById("preorder-progress-fill");
  var names = [
    "Question 1 of 2 · The blade",
    "Question 2 of 2 · The weight",
    "Last step · Anything else?"
  ];
  var WHATSAPP = "https://wa.me/8618627156285";
  var current = 0;
  var timer = null;

  function show(index) {
    current = Math.max(0, Math.min(screens.length - 1, index));
    screens.forEach(function (screen, i) {
      screen.hidden = i !== current;
    });
    label.textContent = names[current];
    fill.style.width = Math.round(((current + 1) / screens.length) * 100) + "%";
    back.hidden = current === 0;
    submit.hidden = current !== screens.length - 1;
    note.hidden = true;

    if (current === 0) {
      /* The model is typed, not picked, so Continue is the way forward and
         stays disabled until there is something to send. */
      next.hidden = false;
      next.disabled = !model.value.trim();
    } else if (current === 1) {
      /* Picking a weight advances on its own; Continue only appears when a
         revisited dropdown already holds a value. */
      next.hidden = !weight.value;
      next.disabled = false;
    } else {
      next.hidden = true;
    }

    var field = screens[current].querySelector("input, select, textarea");
    if (field) field.focus({ preventScroll: true });
    screens[current].setAttribute("tabindex", "-1");
  }

  /* The short pause lets the pick register before the screen changes. */
  function scheduleAdvance() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (current < screens.length - 1) show(current + 1);
    }, 220);
  }

  form.addEventListener("change", function (event) {
    if (event.target === weight && weight.value) scheduleAdvance();
  });

  model.addEventListener("input", function () {
    if (current === 0) next.disabled = !model.value.trim();
  });

  back.addEventListener("click", function () {
    clearTimeout(timer);
    show(current - 1);
  });

  next.addEventListener("click", function () {
    clearTimeout(timer);
    show(current + 1);
  });

  function whatsappHref(order) {
    var lines = [
      "Hi, I'd like to pre-order a pre-owned blade from mygear.top.",
      "Model: " + order.model,
      "Target weight: " + order.weight + "g (±1g)"
    ];
    if (order.notes) lines.push("Notes: " + order.notes);
    lines.push("", "Ship to (city / postal code):");
    return WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearTimeout(timer);

    var data = new FormData(form);
    var order = {
      model: String(data.get("model") || "").trim(),
      weight: String(data.get("weight") || ""),
      notes: String(data.get("notes") || "").trim()
    };

    if (!order.model) {
      show(0);
      note.textContent = "Add the model you are looking for.";
      note.hidden = false;
      return;
    }
    if (!order.weight) {
      show(1);
      note.textContent = "Pick a target weight — 87, 90 or 93 grams.";
      note.hidden = false;
      return;
    }

    var href = whatsappHref(order);
    chat.href = href;

    /* A new tab keeps the page where it was; a blocked popup leaves the
       confirmation's own link as the way through. */
    var win = window.open(href, "_blank");
    if (win) {
      try {
        win.opener = null;
      } catch (e) {}
    }

    form.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  show(0);

  /* Edit request brings the questions back with the picks intact. */
  result.addEventListener("click", function (event) {
    if (event.target.closest(".mg-adv-result__again")) {
      clearTimeout(timer);
      result.hidden = true;
      form.hidden = false;
      show(0);
    }
  });
})();
