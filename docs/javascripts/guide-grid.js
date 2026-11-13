/* ---------------------------------------------------------------------------
   The "Popular gear" shelf — lazy-loaded (/guide/)
   Renders the /gear/ product pages as shop cards (.mg-card) into the grid
   with id #mg-guides-grid. The grid has moved twice on 2026-11-12: first off
   /setups/, where it sat under the setups cards (one flow, no headings), onto
   the home page as a band of its own under "Popular setups" (「原来的 setups
   页的其它内容可以移到首页的Popular setups下面再建立一个 热门装备（英
   文）」), and then off the home page onto /guide/ (「将Popular gear的内容都
   移到 http://127.0.0.1:8001/guide/」), where it stands below the eighteen
   article rows. A page without the grid — the home page now, and /setups/ —
   gets nothing: the script returns early.

   Fourth turn, that same day (「将 … Popular gear 的排版和 <列表里的行卡> 等
   保持一致，且删除Popular gear / 导语文字及分割符」): the shelf's heading, lead
   and hairline are gone and these cards are rows — the articles' own
   .mg-card--row recipe — so /guide/ is one list of thirty rows.
   Shows BATCH cards first; scrolling to the sentinel loads the next batch
   until all of them are shown (infinite scroll).

   The twelve entries are the /gear/ product reviews (in the order the old Hot
   Gear grid ran). The eighteen guide articles came off the same day, last
   (user: 「将首页中从Tibhar Darko Jorgic Infinity Carbon Review … 起的卡片
   删除，也就是说不在首页中展示 /guide/ 的内容」): the home page shows no
   /guide/ content — that directory keeps its own page at /guide/, which is
   still in the nav and still the full index of all eighteen, and it is where
   this feed lives now.

   The player albums joined on 2026-10-26 and lived on this list until the
   same 2026-11-04 pass (user: 「将 Sora Matsushima's Gear … 至 Fan Zhendong's
   Gear … 卡片删除」): the same eleven people stand on the home page as setup
   cards, so each album would otherwise have been shown twice on that page.
   Their pages and search entries stay.
--------------------------------------------------------------------------- */
(function () {
  var MG_GUIDES = [
    /* The twelve entries are /gear/ product pages — review, specs and live
       price on one URL. Each is a .mg-prod page whose own cover is a 1:1
       studio shot, so the 3:2 card band crops top and bottom; the shared band
       is the price of looking like the cards around it. Their covers reuse
       the page's own srcset, which stops at the 600px thumb: there is no
       larger variant on disk. */
    {
      title: "Butterfly Dignics 09C Review, Price & Specs",
      href: "/gear/dignics-09c/",
      img: "/images/dignics-09c/01.jpg",
      srcset: "/images/dignics-09c/01.thumb-240.webp 240w, /images/dignics-09c/01.thumb-480.webp 480w, /images/dignics-09c/01.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Dignics 09C table tennis rubber in red and black",
      cat: "Rubber",
      excerpt:
        "The tackier face of the Dignics family — a mildly tacky topsheet over Spring Sponge X. Line, specs, community ratings, and how it differs from Dignics 05 and Tenergy 05.",
    },
    {
      title: "Butterfly Fan Zhendong ALC Review, Price & Specs",
      href: "/gear/fan-zhendong-alc/",
      /* The one card with a video: the review's own upload, the link given by
         the user on 2026-11-04. makeCard() reads it and leads the action line
         with "Watch Details on YouTube or Read more"; every other card has no
         video field and keeps "Read more" alone. */
      video: "https://youtu.be/FYnMmWJhQyI",
      img: "/images/price-list/blades/fan-zhendong-alc.jpg",
      srcset: "/images/price-list/blades/fan-zhendong-alc.thumb-240.webp 240w, /images/price-list/blades/fan-zhendong-alc.thumb-480.webp 480w, /images/price-list/blades/fan-zhendong-alc.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Fan Zhendong ALC table tennis blade",
      cat: "Blade",
      excerpt:
        "Butterfly's outer-ALC reissue of the Viscaria formula under Fan Zhendong's name — Arylate-Carbon on the outside, firing early and easily.",
    },
    {
      title: "Butterfly Zhang Jike ALC Review, Price & Specs",
      href: "/gear/zhang-jike-alc/",
      img: "/images/price-list/blades/zhang-jike-alc.jpg",
      srcset: "/images/price-list/blades/zhang-jike-alc.thumb-240.webp 240w, /images/price-list/blades/zhang-jike-alc.thumb-480.webp 480w, /images/price-list/blades/zhang-jike-alc.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Zhang Jike ALC table tennis blade",
      cat: "Blade",
      excerpt:
        "Zhang Jike's signature outer-ALC blade, in the same classic class as the Viscaria — built to wait for the opening, then explode through the ball.",
    },
    {
      title: "Butterfly Ovtcharov Innerforce ALC Review, Price & Specs",
      href: "/gear/ovtcharov-innerforce-alc/",
      img: "/images/price-list/blades/ovtcharov-innerforce-alc.jpg",
      srcset: "/images/price-list/blades/ovtcharov-innerforce-alc.thumb-240.webp 240w, /images/price-list/blades/ovtcharov-innerforce-alc.thumb-480.webp 480w, /images/price-list/blades/ovtcharov-innerforce-alc.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Ovtcharov Innerforce ALC table tennis blade",
      cat: "Blade",
      excerpt:
        "An Innerforce board — ALC under the face wood, so it keeps a wood-like touch on light strokes and lets the fibre join in only as you commit.",
    },
    {
      title: "Butterfly Viscaria Review, Price & Specs",
      href: "/gear/viscaria/",
      img: "/images/price-list/blades/viscaria.jpg",
      srcset: "/images/price-list/blades/viscaria.thumb-240.webp 240w, /images/price-list/blades/viscaria.thumb-480.webp 480w, /images/price-list/blades/viscaria.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Viscaria table tennis blade",
      cat: "Blade",
      excerpt:
        "The blade most players picture for a modern outer-fibre shakehand board — Arylate-Carbon on the outside, active from the smallest flex.",
    },
    {
      title: "Butterfly Timo Boll ALC Review, Price & Specs",
      href: "/gear/timo-boll-alc/",
      img: "/images/price-list/blades/timo-boll-alc.jpg",
      srcset: "/images/price-list/blades/timo-boll-alc.thumb-240.webp 240w, /images/price-list/blades/timo-boll-alc.thumb-480.webp 480w, /images/price-list/blades/timo-boll-alc.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Timo Boll ALC table tennis blade",
      cat: "Blade",
      excerpt:
        "The outer-fibre Viscaria recipe tuned for Boll's all-court game: controlled power, excellent touch, and no gear change from block to loop.",
    },
    {
      title: "Butterfly Harimoto Innerforce ALC Review, Price & Specs",
      href: "/gear/harimoto-innerforce-alc/",
      img: "/images/price-list/blades/harimoto-innerforce-alc.jpg",
      srcset: "/images/price-list/blades/harimoto-innerforce-alc.thumb-240.webp 240w, /images/price-list/blades/harimoto-innerforce-alc.thumb-480.webp 480w, /images/price-list/blades/harimoto-innerforce-alc.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Harimoto Innerforce ALC table tennis blade",
      cat: "Blade",
      excerpt:
        "Harimoto's signature inner-fibre blade — wood-like at low force, firm and fast once you commit, with forgiving control at mid force.",
    },
    {
      title: "DHS Hurricane Long 5 Review, Price & Specs",
      href: "/gear/dhs-hurricane-long-5/",
      img: "/images/price-list/blades/dhs-hurricane-long-5.webp",
      srcset: "/images/price-list/blades/dhs-hurricane-long-5.thumb-240.webp 240w, /images/price-list/blades/dhs-hurricane-long-5.thumb-480.webp 480w, /images/price-list/blades/dhs-hurricane-long-5.thumb.webp 720w, /images/price-list/blades/dhs-hurricane-long-5.thumb-1000.webp 1000w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "DHS Hurricane Long 5 table tennis blade",
      cat: "Blade",
      excerpt:
        "DHS's flagship market blade and retail sibling of the W968 Ma Long plays — light swings stay wood-like, the fibre waits until you commit.",
    },
    {
      title: "Victas Koki Niwa Review, Price & Specs",
      href: "/gear/victas-koki-niwa/",
      img: "/images/price-list/blades/victas-koki-niwa.jpg",
      srcset: "/images/price-list/blades/victas-koki-niwa.thumb-240.webp 240w, /images/price-list/blades/victas-koki-niwa.thumb-480.webp 480w, /images/price-list/blades/victas-koki-niwa.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Victas Koki Niwa table tennis blade",
      cat: "Blade",
      excerpt:
        "Koki Niwa's signature blade: not about brute speed, but built to make every kind of spin easy to produce and every placement easy to reach.",
    },
    {
      title: "Butterfly ZYRE-03 Review, Price & Specs",
      href: "/gear/zyre-03/",
      img: "/images/zyre-03/01.jpg",
      srcset: "/images/zyre-03/01.thumb-240.webp 240w, /images/zyre-03/01.thumb-480.webp 480w, /images/zyre-03/01.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly ZYRE-03 table tennis rubber",
      cat: "Rubber",
      excerpt:
        "Butterfly's newest flagship rubber and the clean, non-tacky face of the family — the highest ceiling in the range, and the most demanding to unlock.",
    },
    {
      title: "Butterfly Tenergy 05 Review, Price & Specs",
      href: "/gear/tenergy-05/",
      img: "/images/tenergy-05/01.jpg",
      srcset: "/images/tenergy-05/01.thumb-240.webp 240w, /images/tenergy-05/01.thumb-480.webp 480w, /images/tenergy-05/01.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Tenergy 05 table tennis rubber",
      cat: "Rubber",
      excerpt:
        "The rubber that set the modern benchmark for high-tension play in 2008, and still the model every other performance rubber is measured against.",
    },
    {
      title: "Butterfly Dignics 05 Review, Price & Specs",
      href: "/gear/dignics-05/",
      img: "/images/dignics-05/01.jpg",
      srcset: "/images/dignics-05/01.thumb-240.webp 240w, /images/dignics-05/01.thumb-480.webp 480w, /images/dignics-05/01.thumb.webp 600w",
      sizes: "(max-width: 767px) 92vw, (max-width: 1023.98px) 31vw, 312px",
      alt: "Butterfly Dignics 05 table tennis rubber",
      cat: "Rubber",
      excerpt:
        "The clean, non-tacky flagship of the Dignics line — a code No. 05 topsheet built for spin, bonded to the firmer, more resilient Spring Sponge X.",
    },
  ];

  var BATCH = 6;
  var grid = document.querySelector("#mg-guides-grid");
  var sentinel = document.querySelector(".mg-guides__sentinel");
  if (!grid) return;

  var idx = 0;
  var observer = null;

  /* A row card — the recipe the eighteen articles above are laid out with
     (.mg-card--row in uncrate.css): a 16:9 picture on the left, the copy beside
     it. .mg-card--guide stays for the guide's own details, which the articles
     happen to share: a linked title, no lightbox, no zoom cursor.

     2026-11-12, fourth turn (「将 … Popular gear 的排版和 <列表里的行卡> 等
     保持一致，且删除Popular gear / 导语文字及分割符」): these cards were tiles
     for one afternoon — the home page's band moved here whole at noon — and are
     rows now, carrying the articles' list on instead of opening a grid of their
     own. The title is an h2 again, like every article's: nothing stands over
     these cards any more.

     The card is an <article> rather than the <a> it used to be, because the
     recipe puts real links inside it; the media band is not one of them (the
     shop cards leave theirs to the lightbox). */
  function makeCard(g) {
    var card = document.createElement("article");
    card.className = "mg-card mg-card--guide mg-card--row";

    var media = document.createElement("div");
    media.className = "mg-card__media";
    var img = document.createElement("img");
    // The row's thumbnail draws at about 312px on the desktop column; `img`
    // still names the full-size file so any no-srcset browser keeps working.
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

    /* An h2, the same as every article's headline above: no heading covers
       these rows since the fourth turn, so they are siblings of the articles
       rather than contents of a titled section. */
    var title = document.createElement("h2");
    title.className = "mg-card__title";
    var titleLink = document.createElement("a");
    titleLink.href = g.href;
    titleLink.textContent = g.title;
    title.appendChild(titleLink);
    copy.appendChild(title);

    /* The kicker the articles carry as "date · category". A product review has
       no date of its own — the /gear/ page's `updated` is when the page was
       revised, not when the review ran — so the row states the one thing the
       card knows for certain: which shelf the product sits on. */
    var meta = document.createElement("p");
    meta.className = "mg-card__meta";
    meta.textContent = g.cat;
    copy.appendChild(meta);

    var excerpt = document.createElement("p");
    excerpt.className = "mg-card__desc";
    excerpt.textContent = g.excerpt;
    copy.appendChild(excerpt);

    /* The action line is the shop cards' split one, so a lone "Read more" sits
       on the same baseline the "X or Y" pair does.

       No .mg-card__zoom: a row's excerpt runs whole, as every article's above
       does, so there is nothing for card-read-more.js to fold and the link is
       the plain article link it has always been when nothing is clipped.

       2026-11-04 (user: 「加上Watch Details on Youtube 按钮，也就是Watch
       Details on Youtube or Read more」): a card that carries a video leads
       with it — the "A or B" line the shop cards wrote before their
       one-control pass, "or" in .mg-card__or. The YouTube link is external, so
       it opens a tab of its own. */
    var more = document.createElement("p");
    more.className = "mg-card__more mg-card__more--split";
    if (g.video) {
      var watch = document.createElement("a");
      watch.href = g.video;
      watch.target = "_blank";
      watch.rel = "noopener noreferrer";
      /* The mark is drawn, not fetched: one path, the rounded badge with the
         play triangle knocked out by evenodd, so it takes the link's own ink
         (currentColor) instead of dropping a brand red into a warm-grey page.
         aria-hidden, because the words beside it already say YouTube. */
      var svgNs = "http://www.w3.org/2000/svg";
      var mark = document.createElementNS(svgNs, "svg");
      mark.setAttribute("class", "mg-card__yt");
      mark.setAttribute("viewBox", "0 0 24 17");
      mark.setAttribute("aria-hidden", "true");
      mark.setAttribute("focusable", "false");
      var shape = document.createElementNS(svgNs, "path");
      shape.setAttribute("fill-rule", "evenodd");
      shape.setAttribute(
        "d",
        "M23.5 2.66a3 3 0 0 0-2.11-2.12C19.5 0 12 0 12 0S4.5 0 2.61.54A3 3 0 0 0 .5 2.66" +
          "C0 4.57 0 8.5 0 8.5s0 3.93.5 5.84a3 3 0 0 0 2.11 2.12C4.5 17 12 17 12 17" +
          "s7.5 0 9.39-.54a3 3 0 0 0 2.11-2.12c.5-1.91.5-5.84.5-5.84s0-3.93-.5-5.84z" +
          "M9.55 12.14V4.86L15.85 8.5z"
      );
      mark.appendChild(shape);
      watch.appendChild(mark);
      watch.appendChild(document.createTextNode("Watch Details on YouTube"));
      more.appendChild(watch);
      /* The spaces are text nodes, not padding: a flex item that is nothing
         but white space is not laid out, so the line's 8px gap still sets the
         spacing while the line's text reads as a sentence — which is what a
         screen reader gets out of "Watch Details on YouTubeorRead more". */
      more.appendChild(document.createTextNode(" "));
      var or = document.createElement("em");
      or.className = "mg-card__or";
      or.textContent = "or";
      more.appendChild(or);
      more.appendChild(document.createTextNode(" "));
    }
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
    /* card-read-more.js collects guide cards as they arrive, and it is loaded
       ahead of this file. Rows are never folded — no .mg-card__zoom, no clamp
       budget — so there is nothing for it to collect here now; the announcement
       stays so the two files keep their old contract if cards are ever folded
       again. */
    if (slice.length) {
      document.dispatchEvent(new CustomEvent("mg:cards-added"));
    }
    idx += slice.length;
    var status = document.querySelector(".mg-guides__status");
    if (idx >= MG_GUIDES.length) {
      if (observer) observer.disconnect();
      if (sentinel) sentinel.style.display = "none";
      if (status)
        status.textContent =
          "All " + MG_GUIDES.length + " loaded.";
    } else if (status) {
      status.textContent = "Showing " + idx + " of " + MG_GUIDES.length;
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
