/* Generic slide-in drawer, used by: the "see all colors" swatch picker,
   and the Shipping/Ask a Question info panels. Any trigger element with
   data-pm-drawer-open="<id>" opens the drawer with that id; anything
   with data-pm-drawer-close (inside it, or its overlay) closes it.
   Picking a color tile (data-pm-color-pick) additionally clicks the
   real (hidden) variant radio input so the theme's own variant-change
   handling (price/image/availability updates) runs exactly as if the
   swatch itself had been clicked. */
(function () {
  var openDrawerEl = null;

  function closeDrawer() {
    if (!openDrawerEl) return;
    openDrawerEl.classList.remove('pm-drawer--open');
    var el = openDrawerEl;
    openDrawerEl = null;
    document.body.classList.remove('pm-drawer-open');
    window.setTimeout(function () {
      el.hidden = true;
    }, 300);
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-pm-drawer-open]');
    if (opener) {
      var targetId = opener.getAttribute('data-pm-drawer-open');
      var drawer = targetId && document.getElementById(targetId);
      if (drawer) {
        drawer.hidden = false;
        requestAnimationFrame(function () {
          drawer.classList.add('pm-drawer--open');
        });
        document.body.classList.add('pm-drawer-open');
        openDrawerEl = drawer;
      }
      return;
    }

    if (event.target.closest('[data-pm-drawer-close]')) {
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
    if (event.key === 'Escape' && openDrawerEl) closeDrawer();
  });
})();
