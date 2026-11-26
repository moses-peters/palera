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
    if (!saved) { trackAddedToWishlist(productData); }
    return !saved;
  }

  /* ===== Wishlist tracking: Shopify "product_added_to_wishlist" + Klaviyo =====
     Published through Shopify's own analytics bus (Customer events), so
     any custom pixel in Settings > Customer events can subscribe with
     analytics.subscribe('product_added_to_wishlist', ...). Fires only
     on add, never on remove. */
  function absoluteUrl(url) {
    if (!url) { return ''; }
    if (url.indexOf('//') === 0) { return 'https:' + url; }
    if (url.charAt(0) === '/') { return window.location.origin + url; }
    return url;
  }

  /* Klaviyo "Added to Wishlist" -- posted straight to Klaviyo's public
     Client API (same pattern as the newsletter signup and the EU
     withdrawal form). The profile is taken from, in order:
       - the logged-in customer's email,
       - the email typed into the footer newsletter form on this browser
         (saved by pm-klaviyo-signup.js),
       - the _kx token Klaviyo adds to links in its emails, saved here
         the first time the visitor lands with it in the URL.
     (klaviyo.js no longer keeps the email or _kx in its own cookie --
     only an anonymous id -- so we remember them ourselves.)
     Anonymous visitors are skipped. */
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  (function rememberKlaviyoToken() {
    try {
      var kx = new URLSearchParams(window.location.search).get('_kx');
      if (kx) { window.localStorage.setItem('pm_kl_kx', kx); }
    } catch (e) {}
  })();

  function klaviyoProfile() {
    var profile = {};
    var email = (window.theme && theme.settings && theme.settings.customerEmail) || storageGet('pm_kl_email');
    var kx = storageGet('pm_kl_kx');
    if (email) { profile.email = email; }
    if (kx) { profile._kx = kx; }
    return (profile.email || profile._kx) ? profile : null;
  }

  function sendKlaviyoEvent(name, properties) {
    var companyId = window.theme && theme.settings && theme.settings.klaviyoCompanyId;
    var profile = klaviyoProfile();
    if (!companyId || !profile || !window.fetch) { return; }
    fetch('https://a.klaviyo.com/client/events/?company_id=' + encodeURIComponent(companyId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.api+json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            properties: properties,
            value: properties.Price,
            metric: { data: { type: 'metric', attributes: { name: name } } },
            profile: { data: { type: 'profile', attributes: profile } }
          }
        }
      }),
      keepalive: true
    }).catch(function () {});
  }

  function trackAddedToWishlist(productData) {
    var price = productData.price != null ? productData.price / 100 : null;

    try {
      if (window.Shopify && Shopify.analytics && typeof Shopify.analytics.publish === 'function') {
        Shopify.analytics.publish('product_added_to_wishlist', {
          productId: productData.productId,
          variantId: productData.id,
          handle: productData.handle,
          title: productData.title,
          url: absoluteUrl(productData.url),
          image: absoluteUrl(productData.image),
          price: price,
          currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || '',
          available: productData.available,
          language: document.documentElement.lang || '',
          wishlistCount: readItems().length
        });
      }
    } catch (e) {}

    try {
      sendKlaviyoEvent('Added to Wishlist', {
        ProductName: productData.title,
        ProductID: productData.productId,
        VariantID: productData.id,
        Handle: productData.handle,
        URL: absoluteUrl(productData.url),
        ImageURL: absoluteUrl(productData.image),
        Price: price,
        Available: productData.available,
        Language: document.documentElement.lang || '',
        WishlistCount: readItems().length
      });
    } catch (e) {}
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

  function escapeAttr(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Black Friday: struck price + first-tier price for sale products
     (window.pmBf, from snippets/pm-bf-config.liquid). */
  function bfPrice(item) {
    var bf = window.pmBf;
    var inSale = bf && item.price != null &&
      ((item.productId && bf.ids.indexOf(parseInt(item.productId, 10)) !== -1) ||
       (item.handle && (bf.handles || []).indexOf(item.handle) !== -1));
    if (!inSale) { return formatMoney(item.price); }
    return '<span class="pm-bf-tile-was">' + formatMoney(item.price) + '</span> ' +
      '<span class="pm-bf-tile-now">' + formatMoney(Math.floor(item.price * (100 - bf.pct) / 100)) + '</span>';
  }

  function buildDrawerItem(item) {
    var el = document.createElement('div');
    el.className = 'pm-wishlist-item';
    el.innerHTML =
      '<a href="' + item.url + '" class="pm-wishlist-item-image" tabindex="-1" aria-hidden="true">' +
        (item.image ? '<img src="' + item.image + '" alt="" loading="lazy" width="200" height="200">' : '') +
      '</a>' +
      '<div class="pm-wishlist-item-info">' +
        '<a href="' + item.url + '" class="pm-wishlist-item-name">' + (item.title || '') + '</a>' +
        '<span class="pm-wishlist-item-price">' + bfPrice(item) + '</span>' +
        (item.available === false ? '<span class="pm-wishlist-item-soldout">' + theme.strings.wishlistSoldOut + '</span>' : '') +
        // Saved items are stored by VARIANT id (see pm-wishlist-button.liquid),
        // so the exact color/hardware that was saved is what goes in the
        // cart -- no option names are read here, so it works the same on
        // the English and Italian storefronts.
        (item.available === false ? '' :
          '<form class="pm-wishlist-item-cart" data-pm-wishlist-cart action="' + escapeAttr(theme.routes.cartAdd.replace(/\\.js$/, '')) + '" method="post">' +
            '<input type="hidden" name="id" value="' + escapeAttr(item.id) + '">' +
            '<input type="hidden" name="quantity" value="1">' +
            '<button type="submit" class="pm-wishlist-item-cart-btn">' + theme.strings.wishlistAddToCart + '</button>' +
            '<span class="pm-wishlist-item-cart-error" data-pm-wishlist-cart-error hidden></span>' +
          '</form>') +
      '</div>' +
      '<button type="button" class="pm-wishlist-item-remove" data-pm-wishlist-remove data-variant-id="' + item.id + '" aria-label="' + theme.strings.wishlistRemove + '">' +
        '<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64"><path d="m19 17.61 27.12 27.13m0-27.12L19 44.74" fill="none" stroke="currentColor" stroke-width="3"/></svg>' +
      '</button>';
    return el;
  }

  /* ===== Add to cart from the drawer =====
     Posts the saved variant to Shopify's cart, then hands over to the
     theme's own cart drawer exactly like a product page add does: the
     'ajaxProduct:added' event (dispatched from this form, which carries
     an [name="id"] input just like a real product form) makes
     theme.CartDrawer rebuild + open, and the gift-box refresh in
     layout/theme.liquid runs as usual. The wishlist entry is kept. */
  function handleCartSubmit(evt) {
    var form = evt.target.closest && evt.target.closest('[data-pm-wishlist-cart]');
    if (!form) { return; }
    evt.preventDefault();

    var button = form.querySelector('button[type="submit"]');
    var errorEl = form.querySelector('[data-pm-wishlist-cart-error]');
    if (button.classList.contains('btn--loading')) { return; }
    button.classList.add('btn--loading');
    button.disabled = true;
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }

    var body = 'id=' + encodeURIComponent(form.querySelector('[name="id"]').value) + '&quantity=1';

    fetch(theme.routes.cartAdd, {
      method: 'POST',
      body: body,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(function (response) { return response.json(); })
    .then(function (data) {
      button.classList.remove('btn--loading');
      button.disabled = false;

      if (data.status === 422 || data.status === 404 || data.status === 'bad_request') {
        if (errorEl) {
          errorEl.textContent = data.description || data.message || theme.strings.wishlistSoldOut;
          errorEl.hidden = false;
        }
        return;
      }

      if (document.body.classList.contains('template-cart')) {
        location.reload();
        return;
      }
      if (!theme.settings || theme.settings.cartType !== 'drawer') {
        location.href = theme.routes.cartPage;
        return;
      }

      // Close the wishlist first so the cart drawer can open in its place.
      if (theme.WishlistDrawer) {
        theme.WishlistDrawer.activeSource = null;
        theme.WishlistDrawer.close();
      }
      form.dispatchEvent(new CustomEvent('ajaxProduct:added', {
        detail: { product: data, addToCartBtn: button },
        bubbles: true
      }));
    })
    .catch(function () {
      button.classList.remove('btn--loading');
      button.disabled = false;
      location.href = theme.routes.cartPage;
    });
  }

  document.addEventListener('submit', handleCartSubmit);

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
