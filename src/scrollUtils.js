/**
 * scrollUtils.js
 * Comprehensive scroll-to-top utility for Hanboro Haute Horlogerie.
 * Coordinates immediate scroll reset across Lenis smooth scroll,
 * native window scroll, and document root elements.
 */

export function forceScrollToTop() {
  if (typeof window === "undefined") return;

  const performScroll = () => {
    if (window.__hanboro_lenis) {
      try {
        window.__hanboro_lenis.scrollTo(0, { immediate: true, force: true });
      } catch (_) {}
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const siteTop = document.getElementById("top");
    if (siteTop) {
      siteTop.scrollTop = 0;
    }
  };

  // 1. Immediate sync execution
  performScroll();

  // 2. Next animation frame
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      performScroll();
    });
  }

  // 3. Staggered timers for layout settle
  setTimeout(performScroll, 30);
  setTimeout(performScroll, 100);
}
