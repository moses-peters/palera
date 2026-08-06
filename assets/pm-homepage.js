(function () {
  var els = document.querySelectorAll('.pm-reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('pm-is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pm-is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  els.forEach(function (el) { observer.observe(el); });
})();
