/* ---------------------------------------------------------------------------
   Guides worth reading — lazy-loaded feed (homepage)
   Renders every article from the Guide directory as a shop card (.mg-card).
   Shows BATCH cards first; scrolling to the sentinel loads the next batch
   until all guides are shown (infinite scroll).
--------------------------------------------------------------------------- */
(function () {
  var MG_GUIDES = [
    {
      title: "Tibhar Darko Jorgic Infinity Carbon Review",
      href: "/guide/tibhar-darko-jorgic-infinity-carbon/",
      img: "/images/tibhar-darko-jorgic-infinity-carbon/blade_overall_1.webp",
      srcset: "/images/tibhar-darko-jorgic-infinity-carbon/blade_overall_1.thumb-480.webp 480w, /images/tibhar-darko-jorgic-infinity-carbon/blade_overall_1.thumb.webp 720w, /images/tibhar-darko-jorgic-infinity-carbon/blade_overall_1.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Tibhar Darko Jorgic Infinity Carbon blade",
      cat: "Review",
      excerpt:
        "An inner/outer aramid-carbon hybrid — the forehand feels like one blade, the backhand like another. Jorgic's and Li Hechen's blade, under review.",
    },
    {
      title: "How to Choose a Blade: All-Wood, Outer & Inner Fiber",
      href: "/guide/choosing-blade-structure/",
      img: "/images/choosing-blade-structure/01.webp",
      srcset: "/images/choosing-blade-structure/01.thumb-480.webp 480w, /images/choosing-blade-structure/01.thumb.webp 720w, /images/choosing-blade-structure/01.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "All-wood, outer fiber and inner fiber blade structures",
      cat: "Construction",
      excerpt:
        "Where the fiber sits — above or below the strength ply, or nowhere at all — decides feel, speed, dwell, and who each structure suits.",
    },
    {
      title: "Essential Questions Before Buying",
      href: "/guide/essential-questions-before-buying/",
      img: "/images/blade-basics/01.webp",
      srcset: "/images/blade-basics/01.thumb-480.webp 480w, /images/blade-basics/01.thumb.webp 720w, /images/blade-basics/01.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Viscaria with Tibhar Hybrid K3",
      cat: "Buying",
      excerpt:
        "A beginner-friendly checklist. Before you chase brand names, check six basics: weight, balance, face size, thickness, outer ply, and construction.",
    },
    {
      title: "Blade Performance Metrics",
      href: "/guide/blade-performance-metrics/",
      img: "/images/blade-basics/03.webp",
      srcset: "/images/blade-basics/03.thumb-480.webp 480w, /images/blade-basics/03.thumb.webp 720w, /images/blade-basics/03.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Assembled offensive table tennis setup",
      cat: "Performance",
      excerpt:
        "When you shop for a blade, brand and looks matter less than the playing qualities underneath — six metrics that decide how a blade really plays.",
    },
    {
      title: "Blade Feel Fundamentals",
      href: "/guide/blade-feel-fundamentals/",
      img: "/images/blade-basics/02.webp",
      srcset: "/images/blade-basics/02.thumb-480.webp 480w, /images/blade-basics/02.webp 674w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Two Yinhe blades with different handle shapes",
      cat: "Feel",
      excerpt:
        "A practical buying guide for recreational players — how elasticity, hardness, and core wood shape the feel of a blade.",
    },
    {
      title: "Accelerating With Gear",
      href: "/guide/accelerating-with-gear/",
      img: "/images/gear-acceleration/01.jpg",
      srcset: "/images/gear-acceleration/01.thumb-480.webp 480w, /images/gear-acceleration/01.thumb.webp 720w, /images/gear-acceleration/01.jpg 799w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Acceleration technique and gear setup",
      cat: "Technique",
      excerpt:
        "Acceleration is first a technique story — better footwork, earlier reads, looser hands — then a gear question.",
    },
    {
      title: "Hurricane 3 Multi-Stage Boosting",
      href: "/guide/hurricane-3-multi-stage-boosting/",
      img: "/images/h3-boost-method/01.webp",
      srcset: "/images/h3-boost-method/01.thumb-480.webp 360w, /images/h3-boost-method/01.thumb.webp 540w, /images/h3-boost-method/01.thumb-1000.webp 750w, /images/h3-boost-method/01.webp 768w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Boosted Hurricane 3 sponge edge",
      cat: "Boosting",
      excerpt:
        "Five thin stages to a transparent, lively H3 sponge: open it, soften it deep, lock it with glue, then give it a final charge.",
    },
    {
      title: "Harimoto SZLC vs SALC",
      href: "/guide/harimoto-szlc-vs-salc/",
      img: "/images/szlc-salc-tourney/01.jpg",
      srcset: "/images/szlc-salc-tourney/01.thumb-480.webp 480w, /images/szlc-salc-tourney/01.jpg 552w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Harimoto SZLC and SALC blades",
      cat: "Comparison",
      excerpt:
        "Two Butterfly “Super Harimoto” inner blades look almost identical on paper — this breaks down where they really differ.",
    },
    {
      title: "Outer vs Inner Fiber",
      href: "/guide/outer-vs-inner-fiber/",
      img: "/images/outer-vs-inner-fiber/01.webp",
      srcset: "/images/outer-vs-inner-fiber/01.thumb-480.webp 480w, /images/outer-vs-inner-fiber/01.thumb.webp 720w, /images/outer-vs-inner-fiber/01.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Inner-fiber blade construction example",
      cat: "Construction",
      excerpt:
        "A blade is at least 85% wood. Where the fiber sits — outer or inner — changes the feel and arc more than the fiber itself.",
    },
    {
      title: "Why Tenergy Before Dignics",
      href: "/guide/why-tenergy-before-dignics/",
      img: "/images/tenergy-to-dignics/03.webp",
      srcset: "/images/tenergy-to-dignics/03.thumb-480.webp 480w, /images/tenergy-to-dignics/03.thumb.webp 720w, /images/tenergy-to-dignics/03.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Tenergy and Dignics rubbers",
      cat: "Rubbers",
      excerpt:
        "Many Butterfly stars eventually land on Dignics — yet most of them still pass through Tenergy first.",
    },
    {
      title: "Hurricane Blue vs Orange Sponge",
      href: "/guide/hurricane-blue-vs-orange-sponge/",
      img: "/images/hurricane-blue-orange/01.webp",
      srcset: "/images/hurricane-blue-orange/01.thumb-480.webp 480w, /images/hurricane-blue-orange/01.webp 485w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Hurricane 3 blue and orange sponge",
      cat: "Rubbers",
      excerpt:
        "For amateurs, H3 sponge choice is not a color preference — it is matching the sponge to your technique.",
    },
    {
      title: "Rubber Thickness vs Hardness",
      href: "/guide/choosing-thickness-vs-hardness/",
      img: "/images/rubber-thickness/01.webp",
      srcset: "/images/rubber-thickness/01.thumb-480.webp 480w, /images/rubber-thickness/01.webp 656w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Rubber thickness and hardness comparison",
      cat: "Rubbers",
      excerpt:
        "Classic provincial Hurricane 3 examples — how thickness and hardness interact inside the H3 family.",
    },
    {
      title: "Boosting Truth",
      href: "/guide/boosting-truth/",
      img: "/images/boosting-truth/01.webp",
      srcset: "/images/boosting-truth/01.thumb-480.webp 480w, /images/boosting-truth/01.thumb.webp 720w, /images/boosting-truth/01.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Chinese tacky rubber setup on the table",
      cat: "Boosting",
      excerpt:
        "Boosting is not a moral absolute — it is a tool for opening the sponge and adding spring. Here is when you actually need it.",
    },
    {
      title: "Table Tennis Kingdom Top 10 Shakehand Blades 2025",
      href: "/guide/tt-kingdom-top-10-blades-2025/",
      img: "/images/tt-kingdom-top-10-blades-2025/harimoto-super-alc.webp",
      srcset: "/images/tt-kingdom-top-10-blades-2025/harimoto-super-alc.thumb-480.webp 480w, /images/tt-kingdom-top-10-blades-2025/harimoto-super-alc.thumb.webp 720w, /images/tt-kingdom-top-10-blades-2025/harimoto-super-alc.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Table Tennis Kingdom top 10 blades",
      cat: "Blades",
      excerpt:
        "Table Tennis Kingdom's 2025 top 10 shakehand blades — from Japan's leading table tennis magazine.",
    },
    {
      title: "Joola Hugo ARY-C Review",
      href: "/guide/joola-hugo-ary-c/",
      img: "/images/joola-hugo-ary-c/01.webp",
      srcset: "/images/joola-hugo-ary-c/01.thumb-480.webp 480w, /images/joola-hugo-ary-c/01.thumb.webp 720w, /images/joola-hugo-ary-c/01.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Joola Hugo ARY-C blade",
      cat: "Review",
      excerpt:
        "A Korean-made inner green aramid-carbon blade — the balance, rigidity, and violence of the Hugo ARY-C.",
    },
    {
      title: "Xu Xin Blue Label vs Tibhar Felix",
      href: "/guide/xu-xin-blue-label-vs-tibhar-felix/",
      img: "/images/xu-xin-blue-label-vs-tibhar-felix/01.webp",
      srcset: "/images/xu-xin-blue-label-vs-tibhar-felix/01.thumb-240.webp 240w, /images/xu-xin-blue-label-vs-tibhar-felix/01.thumb-480.webp 480w, /images/xu-xin-blue-label-vs-tibhar-felix/01.thumb.webp 720w, /images/xu-xin-blue-label-vs-tibhar-felix/01.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
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

  /* A guide card is a shop card — /gear/'s .mg-card recipe, class for class, so
     the two grids are one system and the stylesheet needs no guide-specific
     rules. What differs is only what the card is made of: no kicker, no price,
     and a "Read more" where a build offers its photos and a quote.

     The card is an <article> rather than the <a> it used to be, because the
     recipe puts real links inside it; the media band is not one of them (the
     shop cards leave theirs to the lightbox). */
  function makeCard(g) {
    var card = document.createElement("article");
    card.className = "mg-card";

    var media = document.createElement("div");
    media.className = "mg-card__media";
    var img = document.createElement("img");
    // The card draws at 462px; `img` still names the full-size file so the
    // lightbox and any no-srcset browser keep working.
    img.src =
      window.mgImgThumbs && !window.mgImgThumbs.isThumb(g.img)
        ? window.mgImgThumbs.thumbSrc(g.img)
        : g.img;
    img.setAttribute("data-full-src", g.img);
    img.alt = g.alt;
    img.loading = "lazy";
    img.decoding = "async";
    if (g.srcset) {
      img.srcset = g.srcset;
      img.sizes = g.sizes;
      // srcset wins over src, so a missing variant has to drop the pair before
      // the full-size file can take over.
      img.addEventListener(
        "error",
        function () {
          img.removeAttribute("srcset");
          img.removeAttribute("sizes");
          img.src = g.img;
        },
        { once: true }
      );
    }
    media.appendChild(img);
    card.appendChild(media);

    var copy = document.createElement("div");
    copy.className = "mg-card__copy";

    var title = document.createElement("h3");
    title.className = "mg-card__title";
    var titleLink = document.createElement("a");
    titleLink.href = g.href;
    titleLink.textContent = g.title;
    title.appendChild(titleLink);
    copy.appendChild(title);

    var excerpt = document.createElement("p");
    excerpt.className = "mg-card__desc";
    excerpt.textContent = g.excerpt;
    copy.appendChild(excerpt);

    /* The action line is the shop cards' split one, so a lone "Read more" sits
       on the same baseline the "X or Y" pair does. It carries no
       .mg-card__zoom: card-read-more.js reads that class as the disclosure for
       a clipped description, and a guide's excerpt is short enough to be shown
       whole — naming it here would turn the link into a toggle and take the
       article away from the reader. */
    var more = document.createElement("p");
    more.className = "mg-card__more mg-card__more--split";
    var link = document.createElement("a");
    link.href = g.href;
    link.textContent = "Read more";
    more.appendChild(link);
    copy.appendChild(more);

    card.appendChild(copy);
    return card;
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
