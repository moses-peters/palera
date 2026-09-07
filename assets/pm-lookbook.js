(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var containers = document.querySelectorAll('[data-pm-lookbook]');
    containers.forEach(setupLookbook);
  });

  function setupLookbook(container) {
    var pdfUrl = container.getAttribute('data-pdf-url');
    var canvas = container.querySelector('[data-pm-lookbook-canvas]');
    var loadingEl = container.querySelector('[data-pm-lookbook-loading]');
    var prevBtn = container.querySelector('[data-pm-lookbook-prev]');
    var nextBtn = container.querySelector('[data-pm-lookbook-next]');
    var currentEl = container.querySelector('[data-pm-lookbook-current]');
    var totalEl = container.querySelector('[data-pm-lookbook-total]');
    var fullscreenBtn = container.querySelector('[data-pm-lookbook-fullscreen]');
    var fullscreenLabel = container.querySelector('[data-pm-lookbook-fullscreen-label]');

    if (!pdfUrl || !canvas || typeof pdfjsLib === 'undefined') {
      if (loadingEl) loadingEl.textContent = 'Lookbook viewer failed to load.';
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.5.207/pdf.worker.min.js';

    var ctx = canvas.getContext('2d');
    var pdfDoc = null;
    var currentPage = 1;
    var rendering = false;
    var pendingPage = null;

    function updateControls(num) {
      if (currentEl) currentEl.textContent = num;
      if (prevBtn) prevBtn.disabled = num <= 1;
      if (nextBtn) nextBtn.disabled = !pdfDoc || num >= pdfDoc.numPages;
    }

    function renderPage(num) {
      if (!pdfDoc) return;
      if (rendering) { pendingPage = num; return; }
      rendering = true;
      currentPage = num;
      updateControls(num);
      if (loadingEl) { loadingEl.hidden = false; loadingEl.textContent = 'Loading lookbook…'; }

      pdfDoc.getPage(num).then(function (page) {
        var stage = canvas.parentElement;
        var maxWidth = stage.clientWidth || 900;
        var maxHeight = (window.innerHeight || 800) * (container.classList.contains('pm-is-fullscreen') ? 0.92 : 0.75);
        var unscaled = page.getViewport({ scale: 1 });
        var scale = Math.min(maxWidth / unscaled.width, maxHeight / unscaled.height, 2);
        var viewport = page.getViewport({ scale: scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        return page.render({ canvasContext: ctx, viewport: viewport }).promise;
      }).then(function () {
        rendering = false;
        if (loadingEl) loadingEl.hidden = true;
        if (pendingPage !== null) {
          var next = pendingPage;
          pendingPage = null;
          renderPage(next);
        }
      }).catch(function () {
        rendering = false;
        if (loadingEl) { loadingEl.hidden = false; loadingEl.textContent = 'Could not load this page.'; }
      });
    }

    if (loadingEl) loadingEl.textContent = 'Loading lookbook…';
    pdfjsLib.getDocument(pdfUrl).promise.then(function (doc) {
      pdfDoc = doc;
      if (totalEl) totalEl.textContent = doc.numPages;
      renderPage(1);
    }).catch(function () {
      if (loadingEl) { loadingEl.hidden = false; loadingEl.textContent = 'Could not load the lookbook PDF.'; }
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (currentPage > 1) renderPage(currentPage - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!document.body.contains(container)) return;
      if (e.key === 'ArrowLeft' && currentPage > 1) renderPage(currentPage - 1);
      if (e.key === 'ArrowRight' && pdfDoc && currentPage < pdfDoc.numPages) renderPage(currentPage + 1);
    });

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (container.requestFullscreen) {
          container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen();
        }
      });
      document.addEventListener('fullscreenchange', function () {
        var isFull = !!document.fullscreenElement;
        container.classList.toggle('pm-is-fullscreen', isFull);
        if (fullscreenLabel) fullscreenLabel.textContent = isFull ? 'Exit fullscreen' : 'Fullscreen';
        renderPage(currentPage);
      });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (pdfDoc) renderPage(currentPage);
      }, 200);
    });
  }
})();
