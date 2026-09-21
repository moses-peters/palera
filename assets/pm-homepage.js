(function () {
  var els = document.querySelectorAll('.pm-reveal');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('pm-is-visible'); });
    return;
  }

  // rootMargin used to be negative ("-60px" on the bottom), which shrinks
  // the area counted as "visible" -- anything in roughly the last 60px of
  // the actual screen was treated as NOT visible yet. On mobile that
  // meant a tile sitting just below the first one (e.g. the homepage's
  // second product-pair tile) could load fully in range of a normal
  // screen and still sit invisible (opacity: 0, but still taking up its
  // full height) until the visitor scrolled further than the eye could
  // tell was needed -- a blank white gap where a photo/video should be.
  // A positive rootMargin does the opposite: it starts revealing an
  // element slightly *before* it reaches the visible area, so by the
  // time it's actually on screen it's already faded in.
  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pm-is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px 200px 0px' }
  );
  els.forEach(function (el) { observer.observe(el); });
})();
