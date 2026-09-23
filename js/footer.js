(function initSiteFooter() {
  var backToTop = document.querySelector(".site-footer__back-to-top");
  if (!backToTop) return;

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function toggleBackToTop() {
    backToTop.hidden = window.scrollY < 320;
  }

  toggleBackToTop();
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
})();
