/* HWK — micro-interactions
   Tasteful, performant, accessibility-aware (prefers-reduced-motion). */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---- Build converging fans (data-fan) ----
     Dense, fine, contained — generated so density is tunable. */
  document.querySelectorAll("svg[data-fan]").forEach(function (svg) {
    var vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);
    var W = vb[2], H = vb[3];
    var fx = parseFloat(svg.dataset.fanX);
    var fy = parseFloat(svg.dataset.fanY);
    var n = parseInt(svg.dataset.fanN || "52", 10);
    var g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "mono-stroke");
    g.setAttribute("stroke-width", ".7");
    g.setAttribute("opacity", ".4");
    // Even radial fan opening to the right; every ray ends exactly on the
    // viewBox border, so the whole fan is visible and balanced (like Figma).
    var a0 = -1.5, a1 = 1.5;            // ≈ ±86°
    for (var i = 0; i < n; i++) {
      var ang = a0 + (i * (a1 - a0)) / (n - 1);
      var cos = Math.cos(ang), sin = Math.sin(ang);
      var tX = cos > 1e-6 ? (W - fx) / cos : Infinity;
      var tY = sin > 1e-6 ? (H - fy) / sin
             : sin < -1e-6 ? (0 - fy) / sin : Infinity;
      var t = Math.min(tX, tY);
      var ln = document.createElementNS(SVGNS, "line");
      ln.setAttribute("class", "draw");
      ln.setAttribute("x1", fx);
      ln.setAttribute("y1", fy);
      ln.setAttribute("x2", fx + cos * t);
      ln.setAttribute("y2", fy + sin * t);
      g.appendChild(ln);
    }
    svg.insertBefore(g, svg.firstChild); // node circles stay on top
  });

  /* ---- Sticky nav state ---- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Scroll reveal + SVG draw ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  var drawSvgs = document.querySelectorAll("[data-draw]");

  // prime each drawable path with its own length so dashes are exact
  drawSvgs.forEach(function (svg) {
    svg.querySelectorAll(".draw").forEach(function (p) {
      try {
        var len = Math.ceil(p.getTotalLength());
        p.style.setProperty("--len", len);
      } catch (e) {}
    });
  });

  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
    drawSvgs.forEach(function (s) { s.classList.add("is-drawn"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in", "is-drawn");
        io.unobserve(en.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    drawSvgs.forEach(function (s) { io.observe(s); });
  }

  /* ---- Hero art: subtle pointer parallax ---- */
  var art = document.querySelector("[data-parallax]");
  if (art && !reduce && window.matchMedia("(pointer:fine)").matches) {
    var hero = art.closest(".hero") || document.body;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      art.style.transform =
        "translate3d(" + dx * 16 + "px," + dy * 16 + "px,0)";
    });
    hero.addEventListener("pointerleave", function () {
      art.style.transform = "translate3d(0,0,0)";
    });
    art.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
  }

  /* ---- FAQ: single-open accordion (native <details>) ---- */
  var faqs = document.querySelectorAll(".faq-item");
  faqs.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        faqs.forEach(function (o) { if (o !== d) o.open = false; });
      }
    });
  });

  /* ---- Mobile menu toggle ---- */
  var burger = document.querySelector(".nav-burger");
  var links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---- Ripple on solid/accent buttons ---- */
  if (!reduce) {
    document.querySelectorAll(".btn--solid,.btn--accent,.btn--snow,.nav-cta")
      .forEach(function (b) {
        b.style.position = b.style.position || "relative";
        b.style.overflow = "hidden";
        b.addEventListener("pointerdown", function (e) {
          var r = b.getBoundingClientRect();
          var s = document.createElement("span");
          var d = Math.max(r.width, r.height);
          s.style.cssText =
            "position:absolute;border-radius:50%;pointer-events:none;" +
            "width:" + d + "px;height:" + d + "px;left:" +
            (e.clientX - r.left - d / 2) + "px;top:" +
            (e.clientY - r.top - d / 2) + "px;" +
            "background:currentColor;opacity:.18;transform:scale(0);" +
            "transition:transform .6s cubic-bezier(.22,1,.36,1),opacity .8s";
          b.appendChild(s);
          requestAnimationFrame(function () {
            s.style.transform = "scale(1)";
            s.style.opacity = "0";
          });
          setTimeout(function () { s.remove(); }, 850);
        });
      });
  }
})();
