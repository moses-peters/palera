/* "See all colors" drawer -- opened by the "+N" button after the first
   4 color swatches, shows every color as a larger tile with its name
   underneath. Picking a tile clicks the real (hidden) radio input so
   the theme's own variant-change handling (price/image/availability
   updates) runs exactly as if the swatch itself had been clicked. */
(function () {
  var openDrawer = null;

  function closeDrawer() {
    if (!openDrawer) return;
    openDrawer.hidden = true;
    openDrawer.classList.remove('pm-color-drawer--open');
    document.body.classList.remove('pm-color-drawer-open');
    openDrawer = null;
  }

  document.addEventListener('click', function (event) {
    var moreBtn = event.target.closest('[data-pm-color-more]');
    if (moreBtn) {
      var targetId = moreBtn.getAttribute('data-pm-color-drawer-target');
      var drawer = targetId && document.getElementById(targetId);
      if (drawer) {
        drawer.hidden = false;
        // Next tick, so the hidden -> visible change transitions in.
        requestAnimationFrame(function () {
          drawer.classList.add('pm-color-drawer--open');
        });
        document.body.classList.add('pm-color-drawer-open');
        openDrawer = drawer;
      }
      return;
    }

    if (event.target.closest('[data-pm-color-drawer-close]')) {
      closeDrawer();
      return;
    }

    var tile = event.target.closest('[data-pm-color-pick]');
    if (tile) {
      var inputId = tile.getAttribute('data-target');
      var input = inputId && document.getElementById(inputId);
      if (input) input.click();
      closeDrawer();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && openDrawer) closeDrawer();
  });
})();
