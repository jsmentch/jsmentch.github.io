(function () {
  var root = document.documentElement;
  if (!root.classList.contains("motion-init")) return;

  var nodes = document.querySelectorAll(".motion-reveal, .motion-reveal-stagger");
  if (!nodes.length) return;

  function revealAll() {
    nodes.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (!("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

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
})();
