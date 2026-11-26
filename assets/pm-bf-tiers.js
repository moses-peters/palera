/* Black Friday tiers: cart tier bar + product page discounted price.
   See snippets/pm-bf-tiers-bar.liquid and snippets/pm-bf-product-price.liquid. */
(function () {
  if (window.__pmBfTiers) return;
  window.__pmBfTiers = true;

  function rate() {
    var r = window.Shopify && Shopify.currency && parseFloat(Shopify.currency.rate);
    return r && r > 0 ? r : 1;
  }
  function money(cents) {
    if (window.theme && theme.Currency && theme.settings && theme.settings.moneyFormat) {
      return theme.Currency.formatMoney(cents, theme.settings.moneyFormat);
    }
    var cur = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'EUR';
    return new Intl.NumberFormat(document.documentElement.lang || undefined, { style: 'currency', currency: cur }).format(cents / 100);
  }
  function fill(tpl, vars) {
    return tpl.replace(/\[(\w+)\]/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  }

  /* ---- cart tier bar ---- */
  function renderBars(cart) {
    var bars = document.querySelectorAll('[data-pm-bf-tiers]');
    if (!bars.length) return;
    bars.forEach(function (bar) {
      if (!cart || !cart.item_count) { bar.hidden = true; return; }
      var d = bar.dataset, r = rate();
      /* Only Black Friday items count (the discounts apply to that collection only) */
      var bf = window.pmBf || { ids: [] };
      var total = 0;
      (cart.items || []).forEach(function (it) {
        if (bf.ids.indexOf(it.product_id) !== -1 || (bf.handles || []).indexOf(it.handle) !== -1) total += it.original_line_price;
      });
      if (!total) { bar.hidden = true; return; }
      var t1 = +d.t1, t2 = +d.t2, t3 = +d.t3;
      var m2 = Math.round(+d.t2Min * 100 * r), m3 = Math.round(+d.t3Min * 100 * r);
      var text, current, next, nextMin;
      if (total >= m3) { current = t3; }
      else if (total >= m2) { current = t2; next = t3; nextMin = m3; }
      else { current = t1; next = t2; nextMin = m2; }
      if (next) {
        text = fill(d.msgCurrent, { percent: current }) + ' ' + fill(d.msgNext, { amount: '<strong>' + money(nextMin - total) + '</strong>', percent: next });
      } else {
        text = fill(d.msgTop, { percent: current });
      }
      bar.querySelector('[data-pm-bf-tiers-text]').innerHTML = text;
      var pct = Math.max(0, Math.min(100, total / m3 * 100));
      bar.querySelector('[data-pm-bf-tiers-fill]').style.width = pct + '%';
      bar.querySelector('[data-pm-bf-tiers-mark]').style.left = (m2 / m3 * 100) + '%';
      bar.hidden = false;
    });
  }
  function refresh() {
    if (!document.querySelector('[data-pm-bf-tiers]')) return;
    fetch((window.Shopify && Shopify.routes && Shopify.routes.root || '/') + 'cart.js', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(renderBars)
      .catch(function () {});
  }
  var timer;
  function refreshSoon() { clearTimeout(timer); timer = setTimeout(refresh, 150); }

  document.addEventListener('cart:updated', function (e) {
    if (e.detail && e.detail.cart && e.detail.cart.items) renderBars(e.detail.cart); else refreshSoon();
  });
  document.addEventListener('ajaxProduct:added', refreshSoon);
  document.addEventListener('cart:open', refreshSoon);
  /* ---- product page price ---- */
  function updateProductPrice(variant) {
    if (!variant) return;
    document.querySelectorAll('[data-pm-bf-price]').forEach(function (el) {
      var keep = 100 - (+el.dataset.pct || 0);
      var target = el.querySelector('[data-pm-bf-price-new]');
      if (target) target.textContent = money(Math.floor(variant.price * keep / 100)).replace(/<[^>]*>/g, '');
    });
  }
  document.addEventListener('variant:change', function (e) {
    updateProductPrice(e.detail && e.detail.variant);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
})();
