/* ---------------------------------------------------------------------------
   Guides worth reading — lazy-loaded feed (homepage)
   Renders every article from the Guide directory as an uncrate-style card.
   Shows BATCH cards first; scrolling to the sentinel loads the next batch
   until all guides are shown (infinite scroll).
--------------------------------------------------------------------------- */
(function () {
  var MG_GUIDES = [
    {
      title: "How to Choose a Blade: All-Wood, Outer & Inner Fiber",
      href: "/guide/choosing-blade-structure/",
      img: "/images/choosing-blade-structure/01.png",
      alt: "All-wood, outer fiber and inner fiber blade structures",
      cat: "Construction",
      excerpt:
        "Where the fiber sits — above or below the strength ply, or nowhere at all — decides feel, speed, dwell, and who each structure suits.",
    },
    {
      title: "Essential Questions Before Buying",
      href: "/guide/essential-questions-before-buying/",
      img: "/images/blade-basics/01.jpg",
      alt: "Butterfly Viscaria with Tibhar Hybrid K3",
      cat: "Buying",
      excerpt:
        "A beginner-friendly checklist. Before you chase brand names, check six basics: weight, balance, face size, thickness, outer ply, and construction.",
    },
    {
      title: "Blade Performance Metrics",
      href: "/guide/blade-performance-metrics/",
      img: "/images/blade-basics/03.jpg",
      alt: "Assembled offensive table tennis setup",
      cat: "Performance",
      excerpt:
        "When you shop for a blade, brand and looks matter less than the playing qualities underneath — six metrics that decide how a blade really plays.",
    },
    {
      title: "Blade Feel Fundamentals",
      href: "/guide/blade-feel-fundamentals/",
      img: "/images/blade-basics/02.png",
      alt: "Two Yinhe blades with different handle shapes",
      cat: "Feel",
      excerpt:
        "A practical buying guide for recreational players — how elasticity, hardness, and core wood shape the feel of a blade.",
    },
    {
      title: "Accelerating With Gear",
      href: "/guide/accelerating-with-gear/",
      img: "/images/gear-acceleration/01.jpg",
      alt: "Acceleration technique and gear setup",
      cat: "Technique",
      excerpt:
        "Acceleration is first a technique story — better footwork, earlier reads, looser hands — then a gear question.",
    },
    {
      title: "Hurricane 3 Multi-Stage Boosting",
      href: "/guide/hurricane-3-multi-stage-boosting/",
      img: "/images/h3-boost-method/01.jpg",
      alt: "Boosted Hurricane 3 sponge edge",
      cat: "Boosting",
      excerpt:
        "Five thin stages to a transparent, lively H3 sponge: open it, soften it deep, lock it with glue, then give it a final charge.",
    },
    {
      title: "Harimoto SZLC vs SALC",
      href: "/guide/harimoto-szlc-vs-salc/",
      img: "/images/szlc-salc-tourney/01.jpg",
      alt: "Harimoto SZLC and SALC blades",
      cat: "Comparison",
      excerpt:
        "Two Butterfly “Super Harimoto” inner blades look almost identical on paper — this breaks down where they really differ.",
    },
    {
      title: "Outer vs Inner Fiber",
      href: "/guide/outer-vs-inner-fiber/",
      img: "/images/outer-vs-inner-fiber/01.jpg",
      alt: "Inner-fiber blade construction example",
      cat: "Construction",
      excerpt:
        "A blade is at least 85% wood. Where the fiber sits — outer or inner — changes the feel and arc more than the fiber itself.",
    },
    {
      title: "Why Tenergy Before Dignics",
      href: "/guide/why-tenergy-before-dignics/",
      img: "/images/tenergy-to-dignics/03.jpg",
      alt: "Tenergy and Dignics rubbers",
      cat: "Rubbers",
      excerpt:
        "Many Butterfly stars eventually land on Dignics — yet most of them still pass through Tenergy first.",
    },
    {
      title: "Hurricane Blue vs Orange Sponge",
      href: "/guide/hurricane-blue-vs-orange-sponge/",
      img: "/images/hurricane-blue-orange/01.png",
      alt: "Hurricane 3 blue and orange sponge",
      cat: "Rubbers",
      excerpt:
        "For amateurs, H3 sponge choice is not a color preference — it is matching the sponge to your technique.",
    },
    {
      title: "Rubber Thickness vs Hardness",
      href: "/guide/choosing-thickness-vs-hardness/",
      img: "/images/rubber-thickness/01.png",
      alt: "Rubber thickness and hardness comparison",
      cat: "Rubbers",
      excerpt:
        "Classic provincial Hurricane 3 examples — how thickness and hardness interact inside the H3 family.",
    },
    {
      title: "Boosting Truth",
      href: "/guide/boosting-truth/",
      img: "/images/boosting-truth/01.jpg",
      alt: "Chinese tacky rubber setup on the table",
      cat: "Boosting",
      excerpt:
        "Boosting is not a moral absolute — it is a tool for opening the sponge and adding spring. Here is when you actually need it.",
    },
    {
      title: "Table Tennis Kingdom Top 10 Shakehand Blades 2025",
      href: "/guide/tt-kingdom-top-10-blades-2025/",
      img: "/images/tt-kingdom-top-10-blades-2025/harimoto-super-alc.jpg",
      alt: "Table Tennis Kingdom top 10 blades",
      cat: "Blades",
      excerpt:
        "Table Tennis Kingdom's 2025 top 10 shakehand blades — from Japan's leading table tennis magazine.",
    },
    {
      title: "Joola Hugo ARY-C Review",
      href: "/guide/joola-hugo-ary-c/",
      img: "/images/joola-hugo-ary-c/01.jpg",
      alt: "Joola Hugo ARY-C blade",
      cat: "Review",
      excerpt:
        "A Korean-made inner green aramid-carbon blade — the balance, rigidity, and violence of the Hugo ARY-C.",
    },
    {
      title: "Xu Xin Blue Label vs Tibhar Felix",
      href: "/guide/xu-xin-blue-label-vs-tibhar-felix/",
      img: "/images/xu-xin-blue-label-vs-tibhar-felix/01.jpg",
      alt: "Xu Xin Blue Label and Tibhar Felix blades",
      cat: "Review",
      excerpt:
        "Two penhold blades compared — construction, player evaluation, and which one fits your game.",
    },
  ];

  var BATCH = 6;
  var grid = document.querySelector("#mg-guides-grid");
  var sentinel = document.querySelector(".mg-guides__sentinel");
  if (!grid) return;

  var idx = 0;
  var observer = null;

  function makeCard(g) {
    var a = document.createElement("a");
    a.className = "mg-guide-card";
    a.href = g.href;

    var media = document.createElement("div");
    media.className = "mg-guide-card__media";
    var img = document.createElement("img");
    img.src = g.img;
    img.alt = g.alt;
    img.loading = "lazy";
    img.decoding = "async";
    media.appendChild(img);
    a.appendChild(media);

    var body = document.createElement("div");
    body.className = "mg-guide-card__body";

    var cat = document.createElement("div");
    cat.className = "mg-guide-card__cat";
    cat.textContent = "Guide / " + g.cat;
    body.appendChild(cat);

    var title = document.createElement("div");
    title.className = "mg-guide-card__title";
    title.textContent = g.title;
    body.appendChild(title);

    var excerpt = document.createElement("div");
    excerpt.className = "mg-guide-card__excerpt";
    excerpt.textContent = g.excerpt;
    body.appendChild(excerpt);

    var link = document.createElement("div");
    link.className = "mg-guide-card__link";
    link.textContent = "Read More";
    body.appendChild(link);

    a.appendChild(body);
    return a;
  }

  function loadNext() {
    var slice = MG_GUIDES.slice(idx, idx + BATCH);
    slice.forEach(function (g) {
      grid.appendChild(makeCard(g));
    });
    idx += slice.length;
    var status = document.querySelector(".mg-guides__status");
    if (idx >= MG_GUIDES.length) {
      if (observer) observer.disconnect();
      if (sentinel) sentinel.style.display = "none";
      if (status)
        status.textContent =
          "All " + MG_GUIDES.length + " guides loaded.";
    } else if (status) {
      status.textContent = "Showing " + idx + " of " + MG_GUIDES.length + " guides";
    }
  }

  function boot() {
    loadNext();
    if ("IntersectionObserver" in window && sentinel) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) loadNext();
          });
        },
        { rootMargin: "320px 0px" }
      );
      observer.observe(sentinel);
    } else {
      // No IO support: just reveal everything.
      while (idx < MG_GUIDES.length) loadNext();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
