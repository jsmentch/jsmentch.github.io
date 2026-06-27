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

})();
