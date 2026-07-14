(function () {
  function buildMessage(unit) {
    var model = unit.getAttribute("data-model") || "";
    var id = unit.getAttribute("data-unit") || "";
    var handle = unit.getAttribute("data-handle") || "";
    var weight = unit.getAttribute("data-weight") || "";
    var serial = unit.getAttribute("data-serial") || "";
    var condition = unit.getAttribute("data-condition") || "";
    var lines = [
      "Hi MyGear, I'd like this used unit:",
      "",
      "Model: " + model,
      "Unit ID: " + id,
    ];
    if (handle) lines.push("Handle: " + handle);
    if (weight) lines.push("Weight: " + weight);
    if (serial) lines.push("Serial: " + serial);
    if (condition) lines.push("Condition: " + condition);
    lines.push("Page: " + window.location.href.split("#")[0]);
    lines.push("");
    lines.push("Please confirm price + shipping. Thanks!");
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function bind() {
    document.querySelectorAll(".mg-unit").forEach(function (unit) {
      var btn = unit.querySelector(".mg-copy-wa");
      if (!btn || btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";
      var label = btn.textContent;
      btn.addEventListener("click", function () {
        var text = buildMessage(unit);
        copyText(text).then(
          function () {
            btn.textContent = "Copied — paste in WhatsApp";
            btn.classList.add("mg-copy-wa--done");
            setTimeout(function () {
              btn.textContent = label;
              btn.classList.remove("mg-copy-wa--done");
            }, 2200);
          },
          function () {
            btn.textContent = "Copy failed — select table text";
            setTimeout(function () {
              btn.textContent = label;
            }, 2200);
          }
        );
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
