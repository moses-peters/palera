/*
  Palera Milano — wishlist
  ------------------------
  Single source of truth for the wishlist, built in-house to replace the
  removed Wishlist Hero app. Saved per-browser (localStorage), keyed by
  product (not variant) so a color-variant product only ever has one
  entry regardless of which variant was showing when it was saved.

  Every heart button on the site (product cards, the product page, and
  the drawer's own remove buttons) is a plain <button data-pm-wishlist-toggle>
  carrying the product's display data as data-* attributes. A single
  delegated click listener here handles all of them, so new buttons that
  appear later (predictive search results, AJAX-loaded recommendations,
  re-rendered sections in the theme editor) work automatically without
  needing their own listener wired up.
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'pm_wishlist';
  var hasStorage = (function () {
    try {
      var testKey = '__pm_wishlist_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  })();

  // In-memory fallback so the feature still works (just non-persistent)
  // if storage is blocked (private browsing edge cases, storage full, etc).
  var memoryItems = [];

  function readItems() {
    if (!hasStorage) { return memoryItems; }
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) { return []; }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeItems(items) {
    if (!hasStorage) {
      memoryItems = items;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // Storage full or blocked mid-session -- keep working in memory
      // for the rest of this page view rather than losing the toggle.
      memoryItems = items;
    }
  }

  function findIndex(items, id) {
    for (var i = 0; i < items.length; i++) {
      if (String(items[i].id) === String(id)) { return i; }
    }
    return -1;
  }

  function isSaved(id) {
    return findIndex(readItems(), id) !== -1;
  }

  function add(productData) {
    var items = readItems();
    if (findIndex(items, productData.id) !== -1) { return items; }
    items.push(productData);
    writeItems(items);
    return items;
  }

  function remove(id) {
    var items = readItems();
    var index = findIndex(items, id);
    if (index === -1) { return items; }
    items.splice(index, 1);
    writeItems(items);
    return items;
  }

  function toggle(productData) {
    var saved = isSaved(productData.id);
    var items = saved ? remove(productData.id) : add(productData);
    broadcastChange(items);
    return !saved;
  }

  function broadcastChange(items) {
    document.dispatchEvent(new CustomEvent('pm:wishlist:change', {
      detail: { items: items }
    }));
  }

  function productDataFromButton(button) {
    var price = parseInt(button.getAttribute('data-product-price'), 10);
    return {
      id: button.getAttribute('data-variant-id'),
      productId: button.getAttribute('data-product-id'),
      handle: button.getAttribute('data-product-handle'),
      title: button.getAttribute('data-product-title'),
      image: button.getAttribute('data-product-image'),
      price: isNaN(price) ? null : price,
      url: button.getAttribute('data-product-url'),
      available: button.getAttribute('data-product-available') === 'true'
    };
  }

  // Keeps every button for a given VARIANT (there can be several on one
  // page -- a card in a recommendations rail and the same variant's own
  // product page, for instance) in sync after any toggle, from any of
  // them. Buttons for other colors/variants of the same product are
  // untouched, since each is saved (or not) independently.
  function syncButtons(id, saved) {
    var selector = '[data-pm-wishlist-toggle][data-variant-id="' + cssEscape(id) + '"]';
    document.querySelectorAll(selector).forEach(function (button) {
      button.classList.toggle('is-active', saved);
      button.setAttribute('aria-pressed', saved ? 'true' : 'false');
      button.setAttribute('aria-label', saved ? theme.strings.wishlistRemove : theme.strings.wishlistAdd);
      var label = button.querySelector('[data-pm-wishlist-label]');
      if (label) { label.textContent = saved ? theme.strings.wishlistRemove : theme.strings.wishlistAdd; }
    });
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) { return CSS.escape(value); }
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function syncAllButtons() {
    var items = readItems();
    var seen = {};
    document.querySelectorAll('[data-pm-wishlist-toggle]').forEach(function (button) {
      var id = button.getAttribute('data-variant-id');
      if (seen[id]) { return; }
      seen[id] = true;
      syncButtons(id, findIndex(items, id) !== -1);
    });
  }

  function updateCount(items) {
    var count = items.length;
    document.querySelectorAll('[data-pm-wishlist-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('pm-wishlist-count--visible', count > 0);
    });
  }

  function handleToggleClick(evt) {
    var button = evt.target.closest('[data-pm-wishlist-toggle]');
    if (!button) { return; }

    // Every card's heart sits over (or beside) a product link -- this
    // must never let the click fall through to that link or bubble up
    // into a parent card's own click handling.
    evt.preventDefault();
    evt.stopPropagation();

    var productData = productDataFromButton(button);
    if (!productData.id) { return; }

    var saved = toggle(productData);
    syncButtons(productData.id, saved);
  }

  function handleRemoveClick(evt) {
    var button = evt.target.closest('[data-pm-wishlist-remove]');
    if (!button) { return; }

    evt.preventDefault();
    var id = button.getAttribute('data-variant-id');
    if (!id) { return; }

    var items = remove(id);
    broadcastChange(items);
    syncButtons(id, false);
  }

  document.addEventListener('click', handleToggleClick);
  document.addEventListener('click', handleRemoveClick);

  /* ===== Drawer rendering =====
     The drawer never asks the server for anything -- everything it needs
     (image, title, price, url, availability) was already captured on the
     heart button at the moment a product was saved, so re-rendering it is
     pure client-side DOM building from whatever's in storage right now. */
  function formatMoney(cents) {
    if (cents == null || isNaN(cents)) { return ''; }
    if (window.theme && theme.Currency && typeof theme.Currency.formatMoney === 'function') {
      return theme.Currency.formatMoney(cents, theme.settings.moneyFormat);
    }
    return (cents / 100).toFixed(2);
  }

  function buildDrawerItem(item) {
    var el = document.createElement('div');
    el.className = 'pm-wishlist-item';
    el.innerHTML =
      '<a href="' + item.url + '" class="pm-wishlist-item-link">' +
        '<span class="pm-wishlist-item-image">' +
          (item.image ? '<img src="' + item.image + '" alt="" loading="lazy" width="200" height="200">' : '') +
        '</span>' +
        '<span class="pm-wishlist-item-info">' +
          '<span class="pm-wishlist-item-name">' + (item.title || '') + '</span>' +
          '<span class="pm-wishlist-item-price">' + formatMoney(item.price) + '</span>' +
          (item.available === false ? '<span class="pm-wishlist-item-soldout">' + theme.strings.wishlistSoldOut + '</span>' : '') +
        '</span>' +
      '</a>' +
      '<button type="button" class="pm-wishlist-item-remove" data-pm-wishlist-remove data-variant-id="' + item.id + '" aria-label="' + theme.strings.wishlistRemove + '">' +
        '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64"><path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" fill="none" stroke="currentColor" stroke-width="3"/></svg>' +
      '</button>';
    return el;
  }

  function renderDrawer() {
    var list = document.querySelector('[data-pm-wishlist-list]');
    if (!list) { return; }

    var items = readItems();
    list.innerHTML = '';

    var drawer = document.getElementById('WishlistDrawer');
    if (drawer) {
      drawer.classList.toggle('pm-wishlist-drawer--empty', items.length === 0);
    }

    items.forEach(function (item) {
      list.appendChild(buildDrawerItem(item));
    });
  }

  document.addEventListener('pm:wishlist:change', function (evt) {
    updateCount(evt.detail.items);
    renderDrawer();
  });

  /* The product-page buttons (title area + the checker under Add to
     Cart) are rendered server-side for whatever variant was selected
     on load. If the shopper changes color/size with the page's own
     variant picker before toggling the heart, theme.js's global
     "variant:change" event (see theme.js's _onSelectChange) is the only
     signal that the variant now showing is a different one -- re-point
     each button's data-* at it so a save always captures what the
     shopper is actually looking at, not stale load-time data. Scoped to
     .pm-product so a recommendation card for a *different* product
     elsewhere on the page is never touched by this. */
  document.addEventListener('variant:change', function (evt) {
    var newVariant = evt.detail && evt.detail.variant;
    if (!newVariant) { return; }

    document.querySelectorAll('.pm-product [data-pm-wishlist-toggle]').forEach(function (button) {
      button.setAttribute('data-variant-id', newVariant.id);
      button.setAttribute('data-product-price', newVariant.price);
      button.setAttribute('data-product-available', newVariant.available ? 'true' : 'false');

      if (newVariant.featured_image && newVariant.featured_image.src) {
        button.setAttribute('data-product-image', newVariant.featured_image.src);
      }

      var baseUrl = button.getAttribute('data-product-url').split('?')[0];
      button.setAttribute('data-product-url', baseUrl + '?variant=' + newVariant.id);

      var baseTitle = button.getAttribute('data-product-title').split(' — ')[0];
      if (newVariant.public_title && newVariant.public_title !== 'Default Title') {
        button.setAttribute('data-product-title', baseTitle + ' — ' + newVariant.public_title);
      } else {
        button.setAttribute('data-product-title', baseTitle);
      }
    });

    syncAllButtons();
  });

  // Matches the cart drawer's own "drawerOpen.<id>" event name (see
  // theme.Drawers / theme.CartDrawer in theme.js) -- re-render right as
  // the drawer opens so it's never showing stale content from a previous
  // open earlier in the session.
  document.addEventListener('drawerOpen.WishlistDrawer', renderDrawer);

  function init() {
    updateCount(readItems());
    syncAllButtons();
    renderDrawer();

    // theme.Drawers wires up open/close for any element matching
    // #WishlistDrawer + .js-drawer-open-wishlist itself (see theme.js) --
    // it just needs constructing once, same as theme.CartDrawer/NavDrawer.
    if (window.theme && theme.Drawers && document.getElementById('WishlistDrawer')) {
      theme.WishlistDrawer = new theme.Drawers('WishlistDrawer', 'wishlist');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-sync whenever a section reloads in the theme editor (new card
  // markup means freshly-unsynced buttons), and whenever recommendation
  // grids or predictive search inject new cards via AJAX.
  document.addEventListener('shopify:section:load', syncAllButtons);
  document.addEventListener('recommendations:loaded', syncAllButtons);

  window.PMWishlist = {
    getItems: readItems,
    isSaved: isSaved,
    remove: function (id) {
      var items = remove(id);
      broadcastChange(items);
      syncButtons(id, false);
      return items;
    }
  };
})();
