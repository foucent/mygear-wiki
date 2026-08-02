(function () {
  function bind() {
    document.querySelectorAll(".mg-bio").forEach(function (bio) {
      var toggle = bio.querySelector(".mg-bio__toggle");
      if (!toggle || toggle.dataset.bound === "1") return;
      toggle.dataset.bound = "1";

      var more = bio.querySelector(".mg-bio__more");
      var label = bio.querySelector(".mg-bio__label");

      toggle.addEventListener("click", function () {
        var open = bio.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        if (label) label.textContent = open ? "Read Less" : "Read More";
        if (open && more) more.focus({ preventScroll: true });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
