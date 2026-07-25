(() => {
  const INTERVAL_MS = 4200;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initHero(hero) {
    const slides = Array.from(hero.querySelectorAll(".mg-hero-slides__img"));
    if (slides.length < 2) return;

    let index = slides.findIndex((el) => el.classList.contains("is-active"));
    if (index < 0) {
      index = 0;
      slides[0].classList.add("is-active");
    }

    let timer = null;

    const show = (next) => {
      slides[index].classList.remove("is-active");
      index = next;
      slides[index].classList.add("is-active");
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      stop();
      if (reduceMotion.matches) return;
      timer = window.setInterval(() => {
        show((index + 1) % slides.length);
      }, INTERVAL_MS);
    };

    reduceMotion.addEventListener("change", start);
    start();

    hero.addEventListener(
      "mouseenter",
      () => {
        if (!window.matchMedia("(hover: hover)").matches) return;
        stop();
      },
      { passive: true }
    );
    hero.addEventListener(
      "mouseleave",
      () => {
        if (!window.matchMedia("(hover: hover)").matches) return;
        start();
      },
      { passive: true }
    );
  }

  const boot = () => {
    document.querySelectorAll(".mg-hero-slides").forEach(initHero);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
