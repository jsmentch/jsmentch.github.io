(function () {
  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var motionAllowed = root.classList.contains("motion-init");
  var ticking = false;

  function updateScrollState() {
    var scrollTop = window.pageYOffset || root.scrollTop || 0;
    var maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, scrollTop / maxScroll));

    root.style.setProperty("--scroll-progress", progress.toFixed(4));

    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 12);
    }

    ticking = false;
  }

  function requestScrollUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollState();

  var nodes = document.querySelectorAll(".motion-reveal, .motion-reveal-stagger");

  function revealAll() {
    nodes.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (!motionAllowed || !nodes.length || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "32px 0px -8% 0px", threshold: 0.05 }
    );

    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  // Lightbox: click a project figure to view it at full resolution.
  var figureImages = document.querySelectorAll(".project-figure img");

  if (figureImages.length) {
    var lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Close image">\u00d7</button>' +
      '<img class="lightbox-img" alt="">';
    document.body.appendChild(lightbox);

    var stageImg = lightbox.querySelector(".lightbox-img");
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var lastFocused = null;

    function openLightbox(src, alt) {
      stageImg.src = src;
      stageImg.alt = alt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-active");
      lastFocused = document.activeElement;
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-active");
      stageImg.removeAttribute("src");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    figureImages.forEach(function (img) {
      img.classList.add("is-zoomable");
      img.setAttribute("title", "Click to view full size");
      img.addEventListener("click", function () {
        openLightbox(img.currentSrc || img.src, img.alt);
      });
    });

    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLightbox();
    });

    lightbox.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

})();
