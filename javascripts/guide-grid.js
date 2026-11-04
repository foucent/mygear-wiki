/* ---------------------------------------------------------------------------
   The homepage feed — lazy-loaded (homepage)
   Renders the /gear/ product pages as shop cards (.mg-card), appending them
   to the grid that already holds the twelve setup cards: since 2026-11-04 the
   page is one flow with no category headings over it (user: 「将首页的Setups 和
   Reviews & guides 之类的文字删除，意思就是不要分类，让他们融合在一起」), so
   this file names no grid of its own. Shows BATCH cards first; scrolling to
   the sentinel loads the next batch until all of them are shown (infinite
   scroll).

   The twelve entries are the /gear/ product reviews (in the order the old Hot
   Gear grid ran). The eighteen guide articles came off the same day, last
   (user: 「将首页中从Tibhar Darko Jorgic Infinity Carbon Review … 起的卡片
   删除，也就是说不在首页中展示 /guide/ 的内容」): the homepage shows no
   /guide/ content now — that directory keeps its own page at /guide/, which
   is still in the nav and still the full index of all eighteen.

   The player albums joined on 2026-10-26 and lived on this list until the
   same 2026-11-04 pass (user: 「将 Sora Matsushima's Gear … 至 Fan Zhendong's
   Gear … 卡片删除」): the same eleven people stand on the homepage as setup
   cards now, above this feed, so each album would have been shown twice on
   one page. Their pages and search entries stay.
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
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Dignics 09C table tennis rubber in red and black",
      cat: "Review",
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
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Fan Zhendong ALC table tennis blade",
      cat: "Review",
      excerpt:
        "Butterfly's outer-ALC reissue of the Viscaria formula under Fan Zhendong's name — Arylate-Carbon on the outside, firing early and easily.",
    },
    {
      title: "Butterfly Zhang Jike ALC Review, Price & Specs",
      href: "/gear/zhang-jike-alc/",
      img: "/images/price-list/blades/zhang-jike-alc.jpg",
      srcset: "/images/price-list/blades/zhang-jike-alc.thumb-240.webp 240w, /images/price-list/blades/zhang-jike-alc.thumb-480.webp 480w, /images/price-list/blades/zhang-jike-alc.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Zhang Jike ALC table tennis blade",
      cat: "Review",
      excerpt:
        "Zhang Jike's signature outer-ALC blade, in the same classic class as the Viscaria — built to wait for the opening, then explode through the ball.",
    },
    {
      title: "Butterfly Ovtcharov Innerforce ALC Review, Price & Specs",
      href: "/gear/ovtcharov-innerforce-alc/",
      img: "/images/price-list/blades/ovtcharov-innerforce-alc.jpg",
      srcset: "/images/price-list/blades/ovtcharov-innerforce-alc.thumb-240.webp 240w, /images/price-list/blades/ovtcharov-innerforce-alc.thumb-480.webp 480w, /images/price-list/blades/ovtcharov-innerforce-alc.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Ovtcharov Innerforce ALC table tennis blade",
      cat: "Review",
      excerpt:
        "An Innerforce board — ALC under the face wood, so it keeps a wood-like touch on light strokes and lets the fibre join in only as you commit.",
    },
    {
      title: "Butterfly Viscaria Review, Price & Specs",
      href: "/gear/viscaria/",
      img: "/images/price-list/blades/viscaria.jpg",
      srcset: "/images/price-list/blades/viscaria.thumb-240.webp 240w, /images/price-list/blades/viscaria.thumb-480.webp 480w, /images/price-list/blades/viscaria.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Viscaria table tennis blade",
      cat: "Review",
      excerpt:
        "The blade most players picture for a modern outer-fibre shakehand board — Arylate-Carbon on the outside, active from the smallest flex.",
    },
    {
      title: "Butterfly Timo Boll ALC Review, Price & Specs",
      href: "/gear/timo-boll-alc/",
      img: "/images/price-list/blades/timo-boll-alc.jpg",
      srcset: "/images/price-list/blades/timo-boll-alc.thumb-240.webp 240w, /images/price-list/blades/timo-boll-alc.thumb-480.webp 480w, /images/price-list/blades/timo-boll-alc.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Timo Boll ALC table tennis blade",
      cat: "Review",
      excerpt:
        "The outer-fibre Viscaria recipe tuned for Boll's all-court game: controlled power, excellent touch, and no gear change from block to loop.",
    },
    {
      title: "Butterfly Harimoto Innerforce ALC Review, Price & Specs",
      href: "/gear/harimoto-innerforce-alc/",
      img: "/images/price-list/blades/harimoto-innerforce-alc.jpg",
      srcset: "/images/price-list/blades/harimoto-innerforce-alc.thumb-240.webp 240w, /images/price-list/blades/harimoto-innerforce-alc.thumb-480.webp 480w, /images/price-list/blades/harimoto-innerforce-alc.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Harimoto Innerforce ALC table tennis blade",
      cat: "Review",
      excerpt:
        "Harimoto's signature inner-fibre blade — wood-like at low force, firm and fast once you commit, with forgiving control at mid force.",
    },
    {
      title: "DHS Hurricane Long 5 Review, Price & Specs",
      href: "/gear/dhs-hurricane-long-5/",
      img: "/images/price-list/blades/dhs-hurricane-long-5.webp",
      srcset: "/images/price-list/blades/dhs-hurricane-long-5.thumb-240.webp 240w, /images/price-list/blades/dhs-hurricane-long-5.thumb-480.webp 480w, /images/price-list/blades/dhs-hurricane-long-5.thumb.webp 720w, /images/price-list/blades/dhs-hurricane-long-5.thumb-1000.webp 1000w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "DHS Hurricane Long 5 table tennis blade",
      cat: "Review",
      excerpt:
        "DHS's flagship market blade and retail sibling of the W968 Ma Long plays — light swings stay wood-like, the fibre waits until you commit.",
    },
    {
      title: "Victas Koki Niwa Review, Price & Specs",
      href: "/gear/victas-koki-niwa/",
      img: "/images/price-list/blades/victas-koki-niwa.jpg",
      srcset: "/images/price-list/blades/victas-koki-niwa.thumb-240.webp 240w, /images/price-list/blades/victas-koki-niwa.thumb-480.webp 480w, /images/price-list/blades/victas-koki-niwa.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Victas Koki Niwa table tennis blade",
      cat: "Review",
      excerpt:
        "Koki Niwa's signature blade: not about brute speed, but built to make every kind of spin easy to produce and every placement easy to reach.",
    },
    {
      title: "Butterfly ZYRE-03 Review, Price & Specs",
      href: "/gear/zyre-03/",
      img: "/images/zyre-03/01.jpg",
      srcset: "/images/zyre-03/01.thumb-240.webp 240w, /images/zyre-03/01.thumb-480.webp 480w, /images/zyre-03/01.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly ZYRE-03 table tennis rubber",
      cat: "Review",
      excerpt:
        "Butterfly's newest flagship rubber and the clean, non-tacky face of the family — an ultra-thin Ricosheet that loses less energy to the topsheet.",
    },
    {
      title: "Butterfly Tenergy 05 Review, Price & Specs",
      href: "/gear/tenergy-05/",
      img: "/images/tenergy-05/01.jpg",
      srcset: "/images/tenergy-05/01.thumb-240.webp 240w, /images/tenergy-05/01.thumb-480.webp 480w, /images/tenergy-05/01.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Tenergy 05 table tennis rubber",
      cat: "Review",
      excerpt:
        "The rubber that set the modern benchmark for high-tension play in 2008, and still the model every other performance rubber is measured against.",
    },
    {
      title: "Butterfly Dignics 05 Review, Price & Specs",
      href: "/gear/dignics-05/",
      img: "/images/dignics-05/01.jpg",
      srcset: "/images/dignics-05/01.thumb-240.webp 240w, /images/dignics-05/01.thumb-480.webp 480w, /images/dignics-05/01.thumb.webp 600w",
      sizes: "(max-width: 759.98px) 88vw, 462px",
      alt: "Butterfly Dignics 05 table tennis rubber",
      cat: "Review",
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

  /* A guide card is a shop card — /gear/'s .mg-card recipe, class for class, so
     the grid it joins is one system. What differs is only what the card is
     made of: no kicker, no price, and a "Read more" where a build offers its
     photos and a quote. .mg-card--guide is the one class the stylesheet keys
     on: the handful of rules that are about a guide and not about the setup
     cards beside it (the 200px copy block, the link-coloured title) hang off
     it rather than off a wrapper, because both kinds of card share a grid.

     The card is an <article> rather than the <a> it used to be, because the
     recipe puts real links inside it; the media band is not one of them (the
     shop cards leave theirs to the lightbox). */
  function makeCard(g) {
    var card = document.createElement("article");
    card.className = "mg-card mg-card--guide";

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

    /* An h2, as the setup cards' titles are: the two kinds of card are peers
       in one grid and there is no section heading above them for an h2 to sit
       under, so an h3 here would skip a level on the way down from the h1. */
    var title = document.createElement("h2");
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
       on the same baseline the "X or Y" pair does.

       The link carries .mg-card__zoom, which hands it to card-read-more.js as
       the disclosure for a clipped description. That class used to be left off
       on the argument that a guide's excerpt is short enough to show whole;
       what changed is that the feed's copy block is a fixed height now, so the
       excerpts that do not fit have to be reachable rather than cut. Left
       unclipped the link is still a plain link to the article, which is what
       card-read-more.js does with a card it did not clip — so a short excerpt
       keeps its old behaviour exactly.

       2026-11-04 (user: 「加上Watch Details on Youtube 按钮，也就是Watch
       Details on Youtube or Read more」): a card that carries a video leads
       with it — the "A or B" line the shop cards wrote before their
       one-control pass, "or" in .mg-card__or. The YouTube link is external, so
       it opens a tab of its own; .mg-card__zoom stays on "Read more" alone,
       because that is the disclosure card-read-more.js and the lightbox look
       for. */
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
    link.className = "mg-card__zoom";
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
    /* card-read-more.js clips the excerpts that do not fit the fixed copy
       block, and it is loaded and started ahead of this file — so it has
       already collected by the time the first batch exists, and the later
       batches arrive after it. Announcing each batch, once its cards are in
       the DOM, is how the two stay in step. */
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
