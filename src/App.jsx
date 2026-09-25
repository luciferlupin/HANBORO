import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import Lenis from "lenis";
import { INDIA_MAP_VIEWBOX, MAP_CITIES, INDIA_MAP_PATHS } from "./indiaMapData";
import { StoreProvider, useStore } from "./StoreContext";
import { forceScrollToTop } from "./scrollUtils";
import { CartDrawer } from "./CartDrawer";
import { FastrrCheckoutModal } from "./FastrrCheckoutModal";
import { getHighResWatchImage } from "./productsData";
import { TestimonialsSection } from "./TestimonialsSection";
import { MediaSection } from "./MediaSection";
import { SubtleMasterySection } from "./SubtleMasterySection";
import { CraftedWithLegacySection } from "./CraftedWithLegacySection";
import { AboutMaisonSection } from "./AboutMaisonSection";
import { ContactSection } from "./ContactSection";
import { HanboroLogo } from "./HanboroLogo";
import { metaPixelService } from "./metaPixel";

// Dynamic Code-Splitting for heavy, non-initial views
const ProductsView = lazy(() => import("./ProductsView").then((m) => ({ default: m.ProductsView })));
const ProductDetailPage = lazy(() => import("./ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const PrivacyPolicy = lazy(() => import("./PrivacyPolicy").then((m) => ({ default: m.PrivacyPolicy })));
const ShippingPolicy = lazy(() => import("./ShippingPolicy").then((m) => ({ default: m.ShippingPolicy })));
const RefundPolicy = lazy(() => import("./RefundPolicy").then((m) => ({ default: m.RefundPolicy })));
const TermsOfService = lazy(() => import("./TermsOfService").then((m) => ({ default: m.TermsOfService })));
const AccountView = lazy(() => import("./AccountView").then((m) => ({ default: m.AccountView })));
const TrackOrderView = lazy(() => import("./TrackOrderView").then((m) => ({ default: m.TrackOrderView })));

function LuxuryViewLoader() {
  return (
    <div style={{
      minHeight: "75vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "18px",
      color: "#f5f2ed",
      padding: "48px 24px"
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        border: "2px solid rgba(250, 45, 29, 0.2)",
        borderTopColor: "#fa2d1d",
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite"
      }} />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(245, 242, 237, 0.65)"
      }}>
        CALIBRATING ATELIER DOSSIER…
      </span>
    </div>
  );
}

/* ── Error Boundary ────────────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Hanboro Runtime Caught Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#08080a",
          color: "#f5f2ed",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "'Inter', sans-serif"
        }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", color: "#fa2d1d" }}>
            HANBORO WATCHES
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(245,242,237,0.7)", maxWidth: "600px", marginBottom: "16px" }}>
            An unexpected error occurred. Reloading the page will restore normal operation.
          </p>
          {typeof process !== "undefined" && process.env?.NODE_ENV === "development" && this.state.error && (
            <div style={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              padding: "16px",
              maxWidth: "800px",
              width: "90%",
              marginBottom: "20px",
              textAlign: "left"
            }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>
                Error: {this.state.error.message || String(this.state.error)}
              </div>
              {this.state.error.stack && (
                <pre style={{ color: "#a1a1aa", fontSize: "11px", overflowX: "auto", whiteSpace: "pre-wrap", margin: 0, maxHeight: "200px" }}>
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#fa2d1d",
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}
          >
            Reload Store ↻
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const REVOLUTION_MS = 1800; // ms per full clock sweep revolution
const IRIS_EXPAND   = 480;  // ms: smooth iris expansion
const IRIS_RETRACT  = 560;  // ms: smooth iris retraction

/* ── scroll-reveal & dynamic entrance motion hook ──────────────────────── */
function useScrollReveal(enabled, view, selectedSkuId) {
  useEffect(() => {
    let io = null;
    let sectionIo = null;

    const scanAndObserve = () => {
      const els = document.querySelectorAll("[data-reveal]");
      const sections = document.querySelectorAll(
        ".stage-section, .statement, .work, .footer, .watch-carousel-section, .hero-video-section, .about-maison-section, .subtle-mastery-section, .crafted-legacy-section, .media-section, .testimonials-section, .contact-section"
      );

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 900;

      // Mark immediate in-viewport elements
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight + 160 && rect.bottom > -80) {
          el.classList.add("is-visible");
        }
      });

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top < viewportHeight + 80 && rect.bottom > -40) {
          sec.classList.add("section-in-view");
        }
      });

      if (io) io.disconnect();
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          }),
        { threshold: [0.02, 0.15], rootMargin: "100px 0px -20px 0px" }
      );

      els.forEach((el) => io.observe(el));

      if (sectionIo) sectionIo.disconnect();
      sectionIo = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("section-in-view");
            }
          }),
        { threshold: 0.04, rootMargin: "60px 0px -40px 0px" }
      );

      sections.forEach((sec) => sectionIo.observe(sec));
    };

    // Scan on mount and layout stabilization frames
    scanAndObserve();
    const rId = requestAnimationFrame(scanAndObserve);
    const t1 = setTimeout(scanAndObserve, 120);
    const t2 = setTimeout(scanAndObserve, 500);

    return () => {
      cancelAnimationFrame(rId);
      clearTimeout(t1);
      clearTimeout(t2);
      if (io) io.disconnect();
      if (sectionIo) sectionIo.disconnect();
    };
  }, [enabled, view, selectedSkuId]);
}

/* ── Apple-Grade Butter Smooth Scroll Hook (Lenis Physics Engine) ────────── */
function useSmoothScroll() {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect touch-only mobile devices to let native OS compositor handle 120Hz/60Hz touch scroll
    const isTouchOnly = "ontouchstart" in window && window.innerWidth < 1024;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-grade exponential deceleration
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 0,
      syncTouch: false,
      smoothTouch: false,
      prevent: (node) => {
        if (!node) return false;
        // Never scroll page when body is locked for modal/form/dialog
        if (
          document.body.style.overflow === "hidden" ||
          document.body.classList.contains("modal-open")
        ) {
          return true;
        }
        // Never scroll background if pointer/wheel is inside any modal, drawer, or scrollable dialog
        if (typeof node.closest === "function") {
          return Boolean(
            node.closest("[data-lenis-prevent]") ||
            node.closest("[role='dialog']") ||
            node.closest(".watch-editor-overlay") ||
            node.closest(".watch-editor-modal") ||
            node.closest(".roulette-modal-overlay") ||
            node.closest(".roulette-modal-card") ||
            node.closest(".luxury-modal-backdrop") ||
            node.closest(".luxury-modal-card") ||
            node.closest(".checkout-modal-card") ||
            node.closest(".fastrr-modal-container") ||
            node.closest(".fastrr-modal-backdrop") ||
            node.closest(".apple-modal-overlay") ||
            node.closest(".apple-modal-box") ||
            node.closest(".compare-modal-overlay") ||
            node.closest(".compare-modal-box") ||
            node.closest(".luxury-cart-drawer") ||
            node.closest(".luxury-cart-backdrop") ||
            node.closest(".luxury-drawer")
          );
        }
        return false;
      },
    });

    lenisRef.current = lenis;
    window.__hanboro_lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Global listener for smooth anchor navigation
    const handleAnchorClick = (e) => {
      const target = e.target.closest("a[href^='#']");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href && href.length > 1) {
        const el = document.querySelector(href);
        if (el) {
          e.preventDefault();
          lenis.scrollTo(el, { offset: -64, duration: 1.1 });
        }
      }
    };
    document.addEventListener("click", handleAnchorClick, { passive: false });

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__hanboro_lenis = null;
    };
  }, []);

  return lenisRef;
}

export { HanboroLogo };

/* ══════════════════════════════════════════════════════════════════════════════
   CLOCK — Exact match to the reference photo:
   - 60 fine tick marks
   - Radial numerals: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60
   - Glowing red needle with motion blur / luminous trail behind it
   - Opposite tail with precision open ring loop
   - Center red hub
   - Hand reveals ticks & numerals as it sweeps clockwise
══════════════════════════════════════════════════════════════════════════════ */
// Static tick and number coordinates (pre-calculated once for zero GC / overhead)
const TICKS_DATA = Array.from({ length: 60 }, (_, i) => {
  const angle = i * 6; // 0, 6, 12, ... 354
  const isFive = i % 5 === 0;
  const rOuter = 46;
  const rInner = isFive ? 42.5 : 44.2;
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    angle,
    isFive,
    x1: 50 + rOuter * Math.cos(rad),
    y1: 50 + rOuter * Math.sin(rad),
    x2: 50 + rInner * Math.cos(rad),
    y2: 50 + rInner * Math.sin(rad),
  };
});

const NUMBERS_DATA = [
  { val: "5",  angle: 30  },
  { val: "10", angle: 60  },
  { val: "15", angle: 90  },
  { val: "20", angle: 120 },
  { val: "25", angle: 150 },
  { val: "30", angle: 180 },
  { val: "35", angle: 210 },
  { val: "40", angle: 240 },
  { val: "45", angle: 270 },
  { val: "50", angle: 300 },
  { val: "55", angle: 330 },
  { val: "60", angle: 0   },
].map(({ val, angle }) => {
  const rad = ((angle - 90) * Math.PI) / 180;
  const r = 37.5;
  return {
    val,
    angle,
    x: 50 + r * Math.cos(rad),
    y: 50 + r * Math.sin(rad),
  };
});

function Clock({ onComplete }) {
  const handRef = useRef(null);
  const trailRef = useRef(null);
  const tickRefs = useRef([]);
  const numRefs = useRef([]);
  const cbRef = useRef(onComplete);
  useEffect(() => { cbRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const t0 = performance.now();
    let id;
    let done = false;

    const tick = (now) => {
      const deg = Math.min(((now - t0) / REVOLUTION_MS) * 360, 360);
      
      // Direct DOM updates for ultra-smooth 60fps/120fps mobile animation
      if (handRef.current) {
        handRef.current.setAttribute("transform", `rotate(${deg}, 50, 50)`);
      }
      if (trailRef.current) {
        trailRef.current.setAttribute("transform", `rotate(${deg}, 50, 50)`);
        if (deg >= 360) {
          trailRef.current.style.display = "none";
        }
      }

      // Update ticks revelation
      TICKS_DATA.forEach((t, i) => {
        const el = tickRefs.current[i];
        if (!el) return;
        if (deg >= 360 || (deg > t.angle && t.angle > 0)) {
          el.style.opacity = "1";
          const isFresh = deg < 360 && (deg - t.angle) < 24;
          el.setAttribute("stroke", isFresh ? "#fa2d1d" : t.isFive ? "rgba(245, 242, 237, 0.85)" : "rgba(245, 242, 237, 0.35)");
        }
      });

      // Update numbers revelation
      NUMBERS_DATA.forEach((n, i) => {
        const el = numRefs.current[i];
        if (!el) return;
        if (deg >= 360 || (deg > n.angle && n.angle > 0)) {
          el.style.opacity = "1";
          const isFresh = deg < 360 && (deg - n.angle) < 30;
          el.setAttribute("fill", isFresh ? "#fa2d1d" : "rgba(245, 242, 237, 0.82)");
        }
      });

      if (!done && deg >= 360) {
        done = true;
        setTimeout(() => {
          cbRef.current?.();
        }, 180);
        return;
      }
      if (!done) id = requestAnimationFrame(tick);
    };

    id = requestAnimationFrame(tick);

    // Guaranteed fallback timer in case background tab freezes requestAnimationFrame
    const fallbackTimer = setTimeout(() => {
      if (!done) {
        done = true;
        cbRef.current?.();
      }
    }, REVOLUTION_MS + 250);

    return () => {
      cancelAnimationFrame(id);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="clock" aria-label="Analogue clock animation">
      <svg className="clock__svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <filter id="handGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fa2d1d" stopOpacity="0" />
            <stop offset="100%" stopColor="#fa2d1d" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* ── MOTION TRAIL FAN BEHIND THE NEEDLE ── */}
        <path
          ref={trailRef}
          d="M 50 50 L 50 4 A 46 46 0 0 0 40 5.2 Z"
          fill="url(#trailGrad)"
          transform="rotate(0, 50, 50)"
          opacity="0.75"
        />

        {/* ── TICK MARKS ── */}
        {TICKS_DATA.map((t, i) => (
          <line
            key={i}
            ref={(el) => (tickRefs.current[i] = el)}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.isFive ? "rgba(245, 242, 237, 0.85)" : "rgba(245, 242, 237, 0.35)"}
            strokeWidth={t.isFive ? "0.9" : "0.45"}
            strokeLinecap="round"
            style={{ opacity: 0, transition: "stroke 0.3s ease, opacity 0.15s ease" }}
          />
        ))}

        {/* ── NUMERALS (5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60) ── */}
        {NUMBERS_DATA.map((n, i) => (
          <text
            key={n.val}
            ref={(el) => (numRefs.current[i] = el)}
            x={n.x}
            y={n.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(245, 242, 237, 0.82)"
            fontSize="3.8"
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            letterSpacing="-0.2"
            transform={`rotate(${n.angle}, ${n.x}, ${n.y})`}
            style={{ opacity: 0, transition: "fill 0.35s ease, opacity 0.15s ease" }}
          >
            {n.val}
          </text>
        ))}

        {/* ── BRAND NAME ── */}
        <text
          x="50"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(245, 242, 237, 0.55)"
          fontSize="3.4"
          fontFamily="'Inter', sans-serif"
          fontWeight="800"
          letterSpacing="1.8"
        >
          HANBORO
        </text>

        {/* ── RED HAND (with needle, motion glow & counter-weight loop) ── */}
        <g ref={handRef} transform="rotate(0, 50, 50)" filter="url(#handGlow)">
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="5"
            stroke="#fa2d1d"
            strokeWidth="0.85"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="22"
            stroke="#fa2d1d"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="60"
            stroke="#fa2d1d"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="65"
            r="2.8"
            fill="none"
            stroke="#fa2d1d"
            strokeWidth="1.0"
          />
        </g>

        {/* ── CENTER HUB ── */}
        <circle cx="50" cy="50" r="2.2" fill="#fa2d1d" />
        <circle cx="50" cy="50" r="0.9" fill="#080808" />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SPLASH
══════════════════════════════════════════════════════════════════════════════ */
function Splash({ onEnter, exiting }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSplashInteraction = (e) => {
    // Synchronously prime audio context and hero video on user touch gesture
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__hanboro_actx) {
          window.__hanboro_actx = new AudioCtx();
        }
        if (window.__hanboro_actx.state === "suspended") {
          window.__hanboro_actx.resume().catch(() => {});
        }
      }
      const heroVideo = document.querySelector(".hero-video-media");
      if (heroVideo && !window.__hanboro_user_explicitly_muted) {
        heroVideo.setAttribute("playsinline", "");
        heroVideo.setAttribute("webkit-playsinline", "");
        heroVideo.muted = false;
        heroVideo.volume = 1;
        const p = heroVideo.play();
        if (p !== undefined) {
          p.catch(() => {
            heroVideo.muted = true;
            heroVideo.play().catch(() => {});
          });
        }
      }
    } catch {}
    onEnter?.();
  };

  return (
    <section
      className={["splash", mounted ? "splash--in" : "", exiting ? "splash--exit" : ""].filter(Boolean).join(" ")}
      aria-label="Hanboro intro"
      onClick={handleSplashInteraction}
      onTouchStart={handleSplashInteraction}
      onPointerDown={handleSplashInteraction}
    >
      <div className="splash__grain"/>
      <div className="splash__header">
        <div className="s-wordmark">
          <HanboroLogo theme="dark" size={26} />
        </div>
      </div>
      <div className="splash__content">
        <div className="s-clock">
          <Clock onComplete={onEnter} />
        </div>
      </div>
      <div className="splash__footer s-footer">
        <button
          className="text-button"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSplashInteraction(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleSplashInteraction(e);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleSplashInteraction(e);
          }}
        >
          Skip intro
        </button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   WEBSITE
══════════════════════════════════════════════════════════════════════════════ */


// ══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE EXPERIENCE 002: CLOVER KING DAY vs NIGHT REVEAL
// ══════════════════════════════════════════════════════════════════════════════
function CloverKingExperience({ onInspectSku }) {
  const [glowProgress, setGlowProgress] = useState(50); // 0 = 100% Day, 100 = 100% Night (glow sweeps left-to-right)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Scroll color transition tracker for headline
  const headerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!headerRef.current || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (!headerRef.current) {
          ticking = false;
          return;
        }
        const rect = headerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const start = windowHeight * 0.95;
        const end = windowHeight * 0.35;
        const raw = (start - rect.top) / (start - end);
        const clamped = Math.min(Math.max(raw, 0), 1);
        setScrollProgress(clamped);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update slider directly from pointer position on watch stage
  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setGlowProgress(Math.round(xPct));
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    handlePointerMove(e);
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const dayPct = 100 - glowProgress;
  const nightPct = glowProgress;

  return (
    <section className="stage-section stage-section--direct stage-section--interactive" id="interactive" aria-labelledby="clover-title">
      {/* Section Header */}
      <div ref={headerRef} className="stage-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-tag stage-tag--lumen">
            <span className="lumen-beacon-dot" aria-hidden="true" />
            DAY & NIGHT LUMEN
          </span>
        </div>
        <h2 id="clover-title" className="stage-title stage-title--lumen-clean">
          How rare does time <span className="stage-title-accent">need to be?</span>
        </h2>
        <p className="stage-subtitle">
          Slide to reveal the day and night luminous transition.
        </p>
      </div>

      {/* Main Interactive Stage Display */}
      <div className="clover-interactive-stage" data-reveal data-reveal-delay="1">
        <div className="clover-showcase">
          {/* Left Column: Day Specs (Clean Point-to-Point) */}
          <div className="clover-expr-col clover-expr-col--day">
            <span className="clover-expr-tag">DAYLIGHT EXPRESSION</span>
            <h3 className="clover-expr-heading">
              Defiant by <em>daylight.</em>
            </h3>

            <ul className="clover-points">
              <li><span className="clover-bullet" aria-hidden="true"></span> Sculpted Anodized Tonneau Case</li>
              <li><span className="clover-bullet" aria-hidden="true"></span> Double-Domed Sapphire Glass</li>
              <li><span className="clover-bullet" aria-hidden="true"></span> Skeletonized Automatic Movement</li>
              <li><span className="clover-bullet" aria-hidden="true"></span> Ergonomic Fluororubber Strap</li>
            </ul>
          </div>

          {/* Center Column: Interactive Watch & Slider Track */}
          <div className="clover-stage-main">
            <div
              className={`clover-center ${isDragging ? "is-dragging" : ""}`}
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDragStart={(e) => e.preventDefault()}
              style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
            >
              <div className="clover-watch-stage">
                {/* Background Layer: Day Watch */}
                <div className="watch-layer watch-layer--day">
                  <img
                    src="/clover-king-day.png"
                    alt="HANBORO Red Tonneau Daytime Expression"
                    className="watch-img"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>

                {/* Foreground Layer: Night Watch */}
                <div
                  className="watch-layer watch-layer--night"
                  style={{ clipPath: `inset(0 ${100 - glowProgress}% 0 0)` }}
                >
                  <img
                    src="/clover-king-night.png"
                    alt="HANBORO Red Tonneau Night Luminous Expression"
                    className="watch-img"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>

                {/* Vertical Drag Handle Line */}
                <div
                  className={`clover-divider-line ${isDragging ? "is-active" : ""}`}
                  style={{ left: `${glowProgress}%` }}
                >
                  <div className="clover-handle-thumb">
                    <span>&lt; | &gt;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Drag Slider Track */}
            <div className="clover-slider-row">
              <div className="slider-labels-top">
                <span className={`slider-lbl ${glowProgress < 50 ? "is-active-side" : ""}`}>DAY {dayPct}%</span>
                <span className="slider-mid">DRAG TO REVEAL GLOW</span>
                <span className={`slider-lbl slider-lbl--green ${glowProgress >= 50 ? "is-active-side" : ""}`}>NIGHT {nightPct}%</span>
              </div>

              <div className="slider-track-wrap">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={glowProgress}
                  onChange={(e) => setGlowProgress(Number(e.target.value))}
                  className="clover-range-input"
                  aria-label="Drag slider to reveal glow from left to right"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Night Specs (Clean Point-to-Point) */}
          <div className="clover-expr-col clover-expr-col--night">
            <span className="clover-expr-tag clover-expr-tag--green">LUMINOUS NIGHT EXPRESSION</span>
            <h3 className="clover-expr-heading clover-expr-heading--green">
              Alive after <em>dark.</em>
            </h3>

            <ul className="clover-points clover-points--green">
              <li><span className="clover-bullet green" aria-hidden="true"></span> Swiss Super-LumiNova Grade X1</li>
              <li><span className="clover-bullet green" aria-hidden="true"></span> Glowing Clover Bridges & Indices</li>
              <li><span className="clover-bullet green" aria-hidden="true"></span> High-Contrast Midnight Hands</li>
              <li><span className="clover-bullet green" aria-hidden="true"></span> 50M Pressure Aquatic Seal</li>
            </ul>
          </div>
        </div>

        {/* Movement Information Strip */}
        <div className="movement-strip" data-reveal data-reveal-delay="2">
          <div className="movement-strip__label">MOVEMENT SPECIFICATIONS</div>
          <div className="movement-strip__grid">
            <div className="movement-spec">
              <span className="movement-spec__value">Automatic</span>
              <span className="movement-spec__key">Movement Type</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">Citizen 8N24</span>
              <span className="movement-spec__key">Calibre</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">~42h</span>
              <span className="movement-spec__key">Power Reserve</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">21,600 bph</span>
              <span className="movement-spec__key">Frequency</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">21</span>
              <span className="movement-spec__key">Jewels</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">Skeletonized</span>
              <span className="movement-spec__key">Architecture</span>
            </div>
          </div>
          <p className="movement-strip__desc">
            The Japanese <strong>CITIZEN 8N24</strong> mechanical movement is a beautifully engineered, skeletonized automatic caliber with a slim 5.55mm profile, 21 jewels, and 21,600 vibrations per hour. Featuring automatic and manual winding with a stop-second (hacking) mechanism and ~42 hours of power reserve.
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "28px" }} data-reveal data-reveal-delay="3">
          <button
            type="button"
            className="view-all-skus-cta"
            onClick={() => onInspectSku && onInspectSku("clover-king-crimson")}
          >
            <span>View Clover King Specs & Details (REF. HBR-7701-CK)</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE EXPERIENCE 002: REAL CASINO ROULETTE WATCH WITH LIVE DISCOUNT
// ══════════════════════════════════════════════════════════════════════════════
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const PREDEFINED_ROULETTE_OUTCOMES = [
  {
    code: "HANBORO10",
    discount: "10% OFF",
    label: "10% WELCOME DISCOUNT",
    desc: "10% Exclusive discount applied across all Hanboro watches."
  },
  {
    code: "VIP1000",
    discount: "₹1,000 OFF",
    label: "₹1,000 COLLECTOR CREDIT",
    desc: "₹1,000 Direct Credit applied to your Hanboro watch purchase."
  },
  {
    code: "SWISS15",
    discount: "15% OFF",
    label: "15% SPECIAL DISCOUNT",
    desc: "15% Special Discount applied across your entire order."
  },
  {
    code: "HANBORO5",
    discount: "5% OFF",
    label: "5% MEMBER DISCOUNT",
    desc: "5% Exclusive discount applied across all Hanboro watches."
  }
];

function CasinoRouletteExperience({ onInspectSku, onShopAll }) {
  const { rouletteService, showToast } = useStore();
  const [selectedVariant, setSelectedVariant] = useState("blue"); // Sapphire Blue edition
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [activeReward, setActiveReward] = useState(null);
  const [existingSpin, setExistingSpin] = useState(null);
  const [winningNumber, setWinningNumber] = useState(null);
  const [winningColor, setWinningColor] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showIdentifierModal, setShowIdentifierModal] = useState(false);
  const [identifierInput, setIdentifierInput] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [verifiedIdentifier, setVerifiedIdentifier] = useState("");
  const animFrameRef = useRef(null);

  // Lock body scroll and pause Lenis while roulette verification modal is open
  useEffect(() => {
    if (!showIdentifierModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [showIdentifierModal]);

  // Synthesize realistic horological ticking and winning chime sound
  const playTickSound = (pitch = 900) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  };

  const playWinSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch {}
  };

  // Initiate Spin Button Handler
  const handleInitiateSpin = () => {
    if (isSpinning) return;

    if (activeReward) {
      showToast?.(`You already have an active privilege voucher: ${activeReward.code}`);
      return;
    }

    if (!verifiedIdentifier) {
      setShowIdentifierModal(true);
      return;
    }

    executeSpinWithIdentifier(verifiedIdentifier);
  };

  // Execute Spin with Verified Customer Identity (In-session privilege voucher)
  const executeSpinWithIdentifier = async (identifier) => {
    if (isSpinning) return;
    setVerifiedIdentifier(identifier);
    setIsSpinning(true);
    setActiveReward(null);
    setCopied(false);

    const pocketCount = ROULETTE_NUMBERS.length;
    const targetIndex = Math.floor(Math.random() * pocketCount);
    const targetNumber = ROULETTE_NUMBERS[targetIndex];
    const color = targetNumber === 0 ? "green" : targetIndex % 2 === 0 ? "red" : "black";

    // Random selection from predefined outcomes (capped at 15% maximum discount)
    const outcomeIndex = Math.floor(Math.random() * PREDEFINED_ROULETTE_OUTCOMES.length);
    const predefinedOutcome = PREDEFINED_ROULETTE_OUTCOMES[outcomeIndex];

    // Generate unique single-use voucher code e.g. HNB-10-8K2F or HNB-15-X91A
    const codeTag = predefinedOutcome.discount.replace(/[^\d]/g, "");
    const uniqueVoucherCode = `HNB-${codeTag || "VIP"}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const extraWheelSpins = 5 + Math.floor(Math.random() * 3);
    const extraBallSpins = -(7 + Math.floor(Math.random() * 3));
    const targetAngle = (targetIndex / pocketCount) * 360;

    const startWheel = wheelRotation % 360;
    const endWheel = startWheel + extraWheelSpins * 360 + targetAngle;
    const startBall = ballRotation % 360;
    const endBall = startBall + extraBallSpins * 360 - targetAngle;

    const duration = 4000; // 4.0s realistic spin
    const startTime = performance.now();
    let lastTick = 0;

    const animateSpin = async (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Custom smooth deceleration cubic-bezier
      const ease = 1 - Math.pow(1 - progress, 3.5);

      const currentWheel = startWheel + (endWheel - startWheel) * ease;
      const currentBall = startBall + (endBall - startBall) * ease;

      setWheelRotation(currentWheel);
      setBallRotation(currentBall);

      // Sound ticks during spin
      if (now - lastTick > 70 + progress * 240) {
        lastTick = now;
        playTickSound(750 + (1 - progress) * 450);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        setIsSpinning(false);
        setWinningNumber(targetNumber);
        setWinningColor(color);

        const nowTime = new Date();
        const expiry = new Date(nowTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        setActiveReward({
          code: uniqueVoucherCode,
          discount: predefinedOutcome.discount,
          label: predefinedOutcome.label,
          desc: predefinedOutcome.desc,
          expiresAt: expiry,
          isUsed: false,
          usedOrderRef: null,
          linkedTo: identifier,
        });

        playWinSound();
        showToast?.(`Privilege Voucher ${uniqueVoucherCode} unlocked and linked to ${identifier}!`);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateSpin);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const clean = identifierInput.trim();
    if (!clean) {
      setIdentifierError("Please enter a valid email or mobile number.");
      return;
    }
    const isEmail = clean.includes("@") && clean.includes(".");
    const isPhone = clean.replace(/[^\d+]/g, "").length >= 8;
    if (!isEmail && !isPhone) {
      setIdentifierError("Please enter a valid email address or mobile number.");
      return;
    }

    setIdentifierError("");
    setShowIdentifierModal(false);
    executeSpinWithIdentifier(clean);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
    showToast?.(`Privilege Voucher ${code} copied to clipboard!`);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const watchImgSrc = "/watch-blue-roulette.webp";
  const watchSku = "blue-roulette";
  const daysLeft = activeReward?.expiresAt
    ? Math.max(0, Math.ceil((new Date(activeReward.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  return (
    <section className="stage-section stage-section--direct stage-section--roulette" id="roulette" aria-labelledby="roulette-title">
      <div className="roulette-stage-container" data-reveal data-reveal-delay="1">
        
        {/* Left Column: Editorial & Interactive Terminal */}
        <div className="roulette-editorial-col">
          <div className="stage-meta">
            <span className="stage-index">CHAPTER 07 / 07</span>
            <span className="stage-tag">KINETIC CHANCE</span>
          </div>

          <h2 id="roulette-title" className="roulette-stage-title">
            Discover your <em>privilege.</em>
          </h2>

          <p className="roulette-stage-desc">
            Engineered with a free-spinning micro-ceramic rotor. Flick the mechanical roulette dial to unlock up to 15% instant collector allocation.
          </p>

          {/* Quick Technical Horology Badges */}
          <div className="roulette-quick-specs">
            <div className="roulette-spec-pill">
              <span className="pill-dot" aria-hidden="true" />
              <span>0.002mm Ceramic Track</span>
            </div>
            <div className="roulette-spec-pill">
              <span className="pill-dot" aria-hidden="true" />
              <span>28,800 BPH Kinetic Escapement</span>
            </div>
            <div className="roulette-spec-pill">
              <span className="pill-dot" aria-hidden="true" />
              <span>Single-Use Vault Lock</span>
            </div>
          </div>

          {/* Spin Action CTA / Unlocked Privilege Terminal */}
          <div className="roulette-terminal-wrap">
            {activeReward ? (
              <div className="roulette-reward-unlocked-banner">
                <div className="reward-unlocked-header">
                  <span className="reward-pill-badge">
                    {winningNumber !== null ? `POCKET #${winningNumber} · ${winningColor?.toUpperCase()}` : "PRIVILEGE UNLOCKED"}
                  </span>
                  <span className="reward-tier-text">{activeReward.discount} COLLECTOR PRIVILEGE</span>
                </div>
                <div className="reward-code-strip">
                  <span className="reward-voucher-code">{activeReward.code}</span>
                  <button
                    type="button"
                    className="reward-copy-btn"
                    onClick={() => handleCopyCode(activeReward.code)}
                  >
                    {copied ? "COPIED ✓" : "COPY CODE"}
                  </button>
                  <button
                    type="button"
                    className="reward-claim-btn"
                    onClick={onShopAll}
                  >
                    <span>Claim & Shop All</span>
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
                <div className="reward-meta-sub">
                  <span>⏳ Valid for {daysLeft} days</span>
                  <span>•</span>
                  <span>Single-use code linked to profile</span>
                </div>
              </div>
            ) : (
              <div className="roulette-action-box">
                <button
                  type="button"
                  className={`roulette-spin-btn ${isSpinning ? "is-spinning-active" : ""}`}
                  onClick={handleInitiateSpin}
                  disabled={isSpinning}
                >
                  <svg className="spin-btn-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                  </svg>
                  <span className="spin-btn-label">
                    {isSpinning ? "Spinning Rotor at 28,800 BPH..." : "Spin Casino Roulette"}
                  </span>
                </button>

                <div className="roulette-spin-subtext">
                  1 allocation per collector • Valid for 7 days • Direct checkout redemption
                </div>
              </div>
            )}
          </div>

          {/* Watch Details Action Link */}
          <button
            type="button"
            className="roulette-dossier-link"
            onClick={() => onInspectSku && onInspectSku(watchSku)}
          >
            <span>View Watch Details & Specs (REF. HBR-7705-BL)</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>

        {/* Right Column: Dramatic Majestic Roulette Timepiece */}
        <div className="roulette-visual-col">
          <div className="roulette-watch-display">
            <div className="roulette-watch-halo" aria-hidden="true" />
            {/* Real Watch Base Image */}
            <img
              src={watchImgSrc}
              alt="HANBORO Sapphire Blue Steel Casino Roulette Watch (REF. HBR-7705-BL)"
              className="roulette-watch-img"
              draggable={false}
            />

            {/* Authentic Kinetic Ceramic Ball Orbit along real watch roulette track */}
            <div className="roulette-track-overlay">
              <div
                className={`roulette-ball-orbit ${isSpinning ? "is-spinning" : ""}`}
                style={{ transform: `rotate(${ballRotation}deg)` }}
              >
                <div className="roulette-ball-dot" />
              </div>
            </div>
          </div>
        </div>

      </div>

        {/* ── CUSTOMER VERIFICATION MODAL FOR 1-SPIN ENFORCEMENT ── */}
        {showIdentifierModal && (
          <div className="roulette-modal-overlay" onClick={() => setShowIdentifierModal(false)} data-lenis-prevent="true">
            <div className="roulette-modal-card" onClick={(e) => e.stopPropagation()} data-lenis-prevent="true">
              <button
                type="button"
                className="roulette-modal-close"
                onClick={() => setShowIdentifierModal(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <div className="roulette-modal-badge">1-TIME COLLECTOR PRIVILEGE</div>
              <h3 className="roulette-modal-title">Verify Collector Identity</h3>
              <p className="roulette-modal-desc">
                Each collector is entitled to <strong>one exclusive Roulette spin</strong>. Enter your email or mobile number to link your unique 7-day privilege voucher.
              </p>

              <form onSubmit={handleModalSubmit} className="roulette-modal-form">
                <input
                  type="text"
                  placeholder="Email Address or Mobile Number"
                  value={identifierInput}
                  onChange={(e) => {
                    setIdentifierInput(e.target.value);
                    setIdentifierError("");
                  }}
                  className={`roulette-modal-input ${identifierError ? "is-error" : ""}`}
                  autoFocus
                />
                {identifierError && (
                  <div className="roulette-modal-error">{identifierError}</div>
                )}

                <button type="submit" className="roulette-modal-submit">
                  Verify & Spin Rotor →
                </button>
              </form>

              <div className="roulette-modal-footer">
                <span>🔒 Single-use voucher • Max 15% discount • Expires in 7 days</span>
              </div>
            </div>
          </div>
        )}

        {/* Direct Action to Product Sku Detail */}
        <div className="roulette-bottom-action" data-reveal data-reveal-delay="2">
          <button
            type="button"
            className="view-all-skus-cta"
            onClick={() => onInspectSku && onInspectSku(watchSku)}
          >
            <span>View Full Watch Details & Specifications (REF. HBR-7705-BL)</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC VIDEO HERO SECTION (Exact Match to Photo Layout + Apple Controls)
// ══════════════════════════════════════════════════════════════════════════════
function HeroVideoSection({ onDiscover }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Unified high-performance 720p video stream for both desktop and mobile
  const videoSrc = "/Hanboro-V1-720p.mp4";
  const posterSrc = isMobile ? "/hero-video-poster-mobile.jpg" : "/hero-video-poster.jpg";

  // Helper to detect automated bots/crawlers/headless browsers so they do not stream video
  const isBotCrawler = typeof navigator !== "undefined" && (
    Boolean(navigator.webdriver) ||
    /bot|crawler|spider|googlebot|facebookexternalhit|meta-externalagent|bingbot|slurp|duckduckbot|baiduspider|yandex/i.test(navigator.userAgent || "")
  );

  // Video and soundtrack always playing and looping unmuted by default upon splash exit
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isBotCrawler) return;

    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const playWithAudio = () => {
      if (!video || isBotCrawler) return;

      if (!window.__hanboro_user_explicitly_muted) {
        video.muted = false;
        video.volume = 1;
        const playPromise = video.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsMuted(false);
            })
            .catch((err) => {
              console.info("Autoplay with sound deferred on mobile pending gesture, starting muted fallback:", err);
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });
        }
      } else {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      }
    };

    if (typeof window !== "undefined" && window.__hanboro_entered) {
      playWithAudio();
    }

    const handleSplashExit = () => {
      if (typeof window !== "undefined") {
        window.__hanboro_entered = true;
      }
      playWithAudio();
    };

    const handleSoundUnmuted = () => {
      setIsMuted(false);
    };

    window.addEventListener("hanboro_splash_exit", handleSplashExit);
    window.addEventListener("hanboro_video_sound_unmuted", handleSoundUnmuted);

    return () => {
      window.removeEventListener("hanboro_splash_exit", handleSplashExit);
      window.removeEventListener("hanboro_video_sound_unmuted", handleSoundUnmuted);
    };
  }, [videoSrc, isBotCrawler]);

  // Pause video playback when scrolled out of viewport or when tab is hidden in background
  // to completely eliminate redundant CDN data transfer and runaway Edge Requests
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibilityChange = () => {
      if (!video || isBotCrawler) return;
      if (document.hidden) {
        if (!video.paused) {
          video.pause();
        }
      } else {
        if (video.paused && !window.__hanboro_user_paused && window.__hanboro_entered) {
          video.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (video.paused && !window.__hanboro_user_paused && window.__hanboro_entered && !document.hidden && !isBotCrawler) {
              video.play().catch(() => {});
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        },
        { threshold: 0.08 }
      );
      observer.observe(video);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (observer) observer.disconnect();
    };
  }, [isBotCrawler]);

  // One-time mobile interaction listener: unmutes automatically on the very first touch/scroll of the page
  useEffect(() => {
    const tryUnmuteOnInteraction = () => {
      if (window.__hanboro_user_explicitly_muted) return;
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        video.volume = 1;
        const p = video.play();
        if (p !== undefined) {
          p.then(() => {
            setIsMuted(false);
          }).catch(() => {});
        }
      }
    };

    const interactionEvents = ["touchstart", "touchend", "pointerdown", "pointerup", "click", "scroll"];
    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, tryUnmuteOnInteraction, { capture: true, passive: true });
    });

    return () => {
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, tryUnmuteOnInteraction, true);
      });
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    window.__hanboro_user_explicitly_muted = nextMuted;
    video.muted = nextMuted;
    if (!nextMuted) {
      video.volume = 1;
      if (video.paused) {
        video.play().catch(() => {});
      }
    }
    setIsMuted(nextMuted);
  };

  return (
    <section className="hero-video-section" aria-label="CarbonX Chronotech Video Showcase">
      {/* Full-bleed video background with seamless loop, zero initial preload, and stream-on-enter */}
      <div className="hero-video-container">
        <video
          ref={videoRef}
          className="hero-video-media"
          src={videoSrc}
          poster={posterSrc}
          loop
          muted={isMuted}
          playsInline
          preload="none"
        />
        <div className="hero-video-overlay" aria-hidden="true" />
      </div>

      {/* Centered Typography & CTA — CarbonX Chronotech */}
      <div className="hero-photo-content">
        <h1 className="hero-photo-title hero-photo-title--carbonx">
          <span className="hero-title-brand">CARBONX</span>
          <span className="hero-title-model">CHRONOTECH</span>
        </h1>
        <p className="hero-photo-subtitle">Powered by a Seiko automatic movement. Engineered with racing DNA.</p>
        <button
          type="button"
          className="hero-photo-cta"
          onClick={onDiscover}
        >
          <span>DISCOVER CARBONX</span>
          <span className="hero-cta-arrow" aria-hidden="true">↗</span>
        </button>
      </div>

      {/* Floating Glassmorphism Mute / Unmute Button */}
      <button
        type="button"
        className={`hero-mute-btn ${isMuted ? "is-muted" : "is-active"}`}
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
        title={isMuted ? "Unmute Sound" : "Mute Sound"}
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE HOROLOGICAL TICKER MARQUEE (Between Hero & Collection)
// ══════════════════════════════════════════════════════════════════════════════
const TICKER_ITEMS = [
  "SWISS-INSPIRED TONNEAU ARCHITECTURE",
  "28,800 BPH HIGH-BEAT ESCAPEMENT",
  "37-POCKET KINETIC ROULETTE ROTORS",
  "DOUBLE-DOMED SAPPHIRE CRYSTAL",
  "100M WATER RESISTANCE",
  "SUPER-LUMINOVA DUAL MATRIX",
  "2-YEAR INTERNATIONAL WARRANTY",
  "GLOBAL BOUTIQUE NETWORK"
];

function HeroBrandTicker() {
  return (
    <div className="hero-brand-ticker" aria-label="Brand Engineering Highlights">
      <div className="ticker-track-wrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
          <div key={`tick-${idx}`} className="ticker-item">
            <span className="ticker-dot" aria-hidden="true">◆</span>
            <span className="ticker-text">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BRAND MANIFESTO STATEMENT SECTION
// ══════════════════════════════════════════════════════════════════════════════
function BrandManifestoSection({ onExplore }) {
  return (
    <section className="statement" id="approach" data-reveal>
      <div className="stage-meta" style={{ justifyContent: "center", marginBottom: "16px" }}>
        <span className="stage-index">CHAPTER 02 / 08</span>
        <span className="stage-tag">THE PHILOSOPHY</span>
      </div>
      <h2 className="statement__line">
        WE DO NOT MEASURE SECONDS. WE SCULPT <em>MOMENTUM.</em>
      </h2>
      <p className="stage-subtitle" style={{ maxWidth: "680px", margin: "14px auto 0", textAlign: "center" }}>
        Every calibre is an architectural manifesto of precision horology, fusing high-frequency Swiss escapements with sculptural titanium architecture.
      </p>
    </section>
  );
}



// ══════════════════════════════════════════════════════════════════════════════
// WATCH COLLECTION CAROUSEL LOOP (Directly after Hero Section)
// ══════════════════════════════════════════════════════════════════════════════
const WATCH_COLLECTION = [
  { id: "astroworld-celestial", name: "Astroworld Celestial Moon Rose Gold", img: "/watch-astroworld-moon-rosegold-front-transparent.webp" },
  { id: "astroworld-celestial-silver", name: "Astroworld Celestial Moon Silver", img: "/watch-astroworld-moon-silver-front-transparent.webp" },
  { id: "astroworld-tourbillon-black-dlc", name: "Astroworld Celestial Tourbillon Black DLC", img: "/watch-astroworld-tourbillon-dlc-front-transparent.webp" },
  { id: "astroworld-tourbillon-fluted-silver", name: "Astroworld Celestial Tourbillon Classic Silver", img: "/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp" },
  { id: "volcano-glacier-compass-gold", name: "Volcano Glacier Compass Gold", img: "/watch-volcano-glacier-compass-gold-macro-transparent.webp" },
  { id: "supercar-engine-block-rosegold", name: "V12 Engine Supercar Rose Gold", img: "/watch-supercar-engine-block-rosegold-front-transparent.webp" },
  { id: "casino-roulette-wheel-silver", name: "Casino Roulette Classic Silver", img: "/watch-casino-roulette-silver-front-transparent.webp" },
  { id: "casino-roulette-wheel-diamond-emerald", name: "Casino Roulette Baguette Diamond", img: "/watch-casino-roulette-diamond-emerald-front-transparent.webp" },
  { id: "celestial-dragon-tourbillon-rosegold", name: "Celestial Dragon Tourbillon Rose Gold", img: "/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp" },
  { id: "green-diver", name: "SeaKing Sapphire Automatic Diver Watch", img: "/transparent/hbr-1307-auto-emerald.webp" },
  { id: "mecha-cantilever-tourbillon-iceblue", name: "Mecha Cantilever Tourbillon Ice Blue", img: "/watch-mecha-cantilever-tourbillon-iceblue-front-transparent.webp" },
  { id: "world-map-tourbillon-rosegold", name: "World Map Tourbillon Rose Gold", img: "/watch-world-map-tourbillon-rosegold-front-transparent.webp" },
  { id: "cyber-cogwheel-skeleton-rosegold", name: "Cyber Cogwheel Skeleton Rose Gold", img: "/watch-cyber-cogwheel-skeleton-rosegold-front-transparent.webp" },
  { id: "sapphire-kanagawa-wave", name: "Great Wave Ocean Sapphire Tonneau", img: "/watch-sapphire-kanagawa-wave-front-transparent.webp" },
  { id: "octagonal-blue", name: "Rose Gold Octagonal Blue Guilloché", img: "/transparent/octagonal-blue.webp" },
  { id: "forged-carbon-ribbed-shield", name: "Forged Carbon Ribbed Shield", img: "/transparent/forged-carbon-tonneau-tourbillon.webp" }
];

function WatchCarouselSection({ onSelectProduct, onViewAllProducts }) {
  const { products } = useStore();
  const carouselItems = useMemo(() => {
    if (Array.isArray(products) && products.length > 0) {
      return products
        .filter((p) => p.isActive !== false)
        .slice(0, 16)
        .map((p) => ({
          id: p.id || p.sku,
          name: p.name,
          img: getHighResWatchImage(p.transparentImage || p.image),
        }));
    }
    return WATCH_COLLECTION;
  }, [products]);

  return (
    <section className="watch-carousel-section" id="collection" aria-labelledby="collection-title">
      <div className="carousel-section-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-tag">THE VAULT</span>
        </div>
        <h2 id="collection-title" className="carousel-heading">
          <img
            src="/logo-text-light.png"
            alt="HANBORO"
            className="carousel-heading-logo"
            draggable={false}
          />
          <em>collection.</em>
        </h2>
      </div>

      {/* Apple-Grade Seamless Tiling Endless Marquee */}
      <div className="carousel-track-wrapper" data-reveal data-reveal-delay="1">
        <div className="carousel-track">
          <div className="carousel-group">
            {carouselItems.map((watch, index) => (
              <div
                className="watch-float-item"
                key={`a-${watch.id}-${index}`}
                onClick={() => onSelectProduct && onSelectProduct(watch.id)}
                aria-label={`Select ${watch.name}`}
                role="button"
                tabIndex={0}
              >
                <img
                  src={watch.img}
                  alt={watch.name}
                  className="watch-float-img"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
            ))}
          </div>
          <div className="carousel-group" aria-hidden="true">
            {carouselItems.map((watch, index) => (
              <div
                className="watch-float-item"
                key={`b-${watch.id}-${index}`}
                onClick={() => onSelectProduct && onSelectProduct(watch.id)}
                aria-label={`Select ${watch.name}`}
                role="button"
                tabIndex={0}
              >
                <img
                  src={watch.img}
                  alt={watch.name}
                  className="watch-float-img"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OFFICIAL STORE LOCATOR DIRECTORY DATA
// ══════════════════════════════════════════════════════════════════════════════
const STORES_DATA = [
  {
    id: "nagpal-watches-karnal",
    name: "NAGPAL WATCHES",
    city: "Karnal",
    state: "Haryana",
    country: "India",
    address: "Shop No. 2, Near Reliance Trends, Kunjpura Road, Karnal, Haryana – 132001",
    phone: "+91 90341 38000",
    phoneRaw: "+919034138000",
    hours: "10:00 AM – 9:00 PM (All Days)",
    image: "/store-nagpal-watches.jpg",
    mapUrl: "https://maps.google.com/?q=Nagpal+Watches+Kunjpura+Road+Karnal",
    type: "Authorized Hanboro Retailer",
    isFeatured: true,
    keywords: "Nagpal Watches Haryana Karnal Kunjpura Road 132001"
  },
  {
    id: "time-point-pitampura",
    name: "TIME POINT",
    city: "Delhi",
    area: "Pitampura",
    state: "Delhi",
    country: "India",
    address: "Shop No. 9, JD Market, Main Road, Opposite Metro Pillar 359, Pitampura, New Delhi – 110034",
    phone: "+91 99993 03888",
    phoneRaw: "+919999303888",
    hours: "11:00 AM – 9:00 PM (All Days)",
    image: "/store-time-point-pitampura.jpg",
    mapUrl: "https://maps.google.com/?q=Time+Point+JD+Market+Pitampura+Delhi",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Time Point Pitampura Delhi New Delhi NCR JD Market Metro Pillar 359 110034"
  },
  {
    id: "time-planet-bahadurgarh",
    name: "TIME PLANET",
    city: "Bahadurgarh",
    area: "Rohtak Road",
    state: "Haryana",
    country: "India",
    address: "Metro Pillar No. 840, Delhi - Rohtak Road, Opposite ICICI Bank, Dharampura, Bahadurgarh, Haryana – 124507",
    phone: "+91 89015 09654",
    phoneRaw: "+918901509654",
    hours: "10:00 AM – 9:00 PM (All Days)",
    image: "/store-time-planet-bahadurgarh.jpg",
    mapUrl: "https://www.google.com/maps/place/TIME+PLANET/@28.6909983,76.9295432,17z/data=!3m1!4b1!4m6!3m5!1s0x390d09994b76e7cd:0x30fc8774131e9375!8m2!3d28.6909983!4d76.9321181!16s%2Fg%2F11fwhzlwvn?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Time Planet Bahadurgarh Haryana Rohtak Road Dharampura Metro Pillar 840 124507"
  },
  {
    id: "sharma-bhiwadi",
    name: "SHARMA WATCH HOUSE",
    city: "Bhiwadi",
    state: "Rajasthan",
    country: "India",
    address: "Titan Building, Samtel Road, Central Market, Neelam Chowk, Bhiwadi, Rajasthan – 301019",
    phone: "+91 94609 65959",
    phoneRaw: "+919460965959",
    hours: "9:30 AM – 9:00 PM (All Days)",
    image: "/store-sharma-bhiwadi.jpg",
    mapUrl: "https://maps.google.com/?q=Sharma+Watch+Company+Samtel+Road+Bhiwadi",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Sharma Watch House Company Bhiwadi Rajasthan NCR Central Market Samtel Road 301019"
  },
  {
    id: "prakash-watch-mathura",
    name: "PRAKASH WATCH & OPTICALS",
    city: "Mathura",
    area: "Krishna Nagar",
    state: "Uttar Pradesh",
    country: "India",
    address: "Shop 2-B, Near Rahul Bakers, Krishna Nagar, Mathura, Uttar Pradesh – 281004",
    phone: "+91 97607 29270",
    phoneRaw: "+919760729270",
    hours: "10:00 AM – 9:00 PM (All Days)",
    image: "/store-prakash-mathura.jpg",
    mapUrl: "https://maps.google.com/?q=Prakash+Watch+and+Opticals+Krishna+Nagar+Mathura",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Prakash Watch and Opticals Mathura Krishna Nagar Rahul Bakers Uttar Pradesh 281004 Braj"
  },
  {
    id: "elephanta-jhansi",
    name: "ELEPHANTA WATCH COMPANY",
    city: "Jhansi",
    state: "Uttar Pradesh",
    country: "India",
    address: "380, Sadar Bazaar, Main Market, Opposite Axis Bank, Cantt, Jhansi, Uttar Pradesh – 284001",
    phone: "+91 91986 67170",
    phoneRaw: "+919198667170",
    hours: "10:30 AM – 9:00 PM (All Days)",
    image: "/store-elephanta-jhansi.jpg",
    mapUrl: "https://maps.google.com/?q=Elephanta+Watch+Company+Sadar+Bazaar+Jhansi",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Elephanta Watch Company Jhansi Uttar Pradesh Sadar Bazaar Cantt 284001"
  },
  {
    id: "the-watch-store-mumbai",
    name: "THE WATCH STORE",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    address: "Shop No. 9 & 10, Building B/69, Sector 1, Shanti Nagar, Opposite TMT Bus Stop, Mira Road East, Mumbai MMR / Thane – 401107",
    phone: "+91 99870 50065",
    phoneRaw: "+919987050065",
    hours: "10:30 AM – 10:00 PM (All Days)",
    image: "/store-the-watch-store-mumbai.jpg",
    mapUrl: "https://maps.google.com/?q=The+Watch+Store+Mira+Road+East+Thane",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "The Watch Store Mumbai Thane Mira Road East Shanti Nagar 401107 Maharashtra"
  },
  {
    id: "lokhandwala-watches-mumbai",
    name: "LOKHANDWALA WATCHES PVT LTD",
    city: "Mumbai",
    area: "Andheri West",
    state: "Maharashtra",
    country: "India",
    address: "Shop No. 3 & 4, Swiss Palace, Shastri Nagar Lane 1, Near Lokhandwala Circle, Andheri West, Mumbai, Maharashtra – 400053",
    phone: "+91 93231 25650",
    phoneRaw: "+919323125650",
    hours: "10:00 AM – 10:00 PM (All Days)",
    image: "/store-lokhandwala-watches-mumbai.jpg",
    mapUrl: "https://maps.google.com/?q=Lokhandwala+Watches+Pvt+Ltd+Swiss+Palace+Andheri+West+Mumbai",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Lokhandwala Watches Pvt Ltd Mumbai Maharashtra Andheri West Swiss Palace Shastri Nagar Lokhandwala Circle 400053"
  },
  {
    id: "arihant-virar",
    name: "ARIHANT WATCHES & OPTICAL STUDIO",
    city: "Virar",
    state: "Maharashtra",
    country: "India",
    address: "Shop No. 4–7, Gopani Centre, Agashi Road, Opposite Hotel On The Way, Virar West, Maharashtra – 401303",
    phone: "+91 73037 57498",
    phoneRaw: "+917303757498",
    hours: "10:00 AM – 9:00 PM (All Days)",
    image: "/store-arihant-virar.jpg",
    mapUrl: "https://maps.google.com/?q=Arihant+Watches+Gopani+Centre+Virar+West",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Arihant Watches Optical Studio Virar Mumbai Maharashtra Gopani Centre Agashi Road 401303"
  },
  {
    id: "timeland-tirupati",
    name: "TIME LAND",
    city: "Tirupati",
    state: "Andhra Pradesh",
    country: "India",
    address: "Opp. Lalitha Jewellery & KFC, V.V. Mahal Road, Bhavani Nagar, Tirupati, Andhra Pradesh – 517501",
    phone: "+91 85007 34343",
    phoneRaw: "+918500734343",
    hours: "9:30 AM – 9:30 PM (All Days)",
    image: "/store-timeland-tirupati.jpg",
    mapUrl: "https://www.google.com/maps/place/TIMELAND/@13.6407904,79.4133274,17z/data=!4m6!3m5!1s0x3a4d4bca23fb2c8f:0x299e298b0d1e8085!8m2!3d13.637068!4d79.4206308!16s%2Fg%2F11whwgkqfc?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Time Land Timeland Tirupati Andhra Pradesh South India 517501 Lalitha Jewellery"
  },
  {
    id: "timeland-visakhapatnam",
    name: "TIME LAND",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    address: "D.No. 10/50/84, Waltair Main Road, Opposite Dr. Agarwal's Eye Hospital, Ram Nagar, Visakhapatnam, Andhra Pradesh – 530002",
    phone: "+91 81426 00001",
    phoneRaw: "+918142600001",
    hours: "11:00 AM – 9:30 PM (All Days)",
    image: "/store-timeland-vizag.jpg",
    mapUrl: "https://maps.google.com/?q=Time+Land+Waltair+Main+Road+Visakhapatnam",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Time Land Timeland Visakhapatnam Vizag Andhra Pradesh Waltair Main Road Ram Nagar 530002"
  },
  {
    id: "madina-nellore",
    name: "MADINA WATCHES",
    city: "Nellore",
    state: "Andhra Pradesh",
    country: "India",
    address: "Trunk Road, Opposite Sunday Market, Near Gandhi Statue, Nellore, Andhra Pradesh – 524001",
    phone: "+91 861 232 9401",
    phoneRaw: "+918612329401",
    hours: "9:30 AM – 9:30 PM (All Days)",
    image: "/store-madina-nellore.jpg",
    mapUrl: "https://maps.google.com/?q=Madina+Watches+Trunk+Road+Nellore",
    type: "Authorized Hanboro Retailer",
    isFeatured: false,
    keywords: "Madina Watches Watch Agencies Nellore Andhra Pradesh Trunk Road 524001"
  }
];



// ══════════════════════════════════════════════════════════════════════════════
// DEDICATED STORE LOCATOR PAGE COMPONENT (Exact Match to Design Reference)
// ══════════════════════════════════════════════════════════════════════════════


const CITY_FILTERS = [
  "ALL",
  "DELHI",
  "HARYANA",
  "MUMBAI",
  "PITAMPURA",
  "BAHADURGARH",
  "KARNAL",
  "ANDHERI WEST",
  "THANE",
  "VIRAR",
  "BHIWADI",
  "MATHURA",
  "JHANSI",
  "TIRUPATI",
  "VISAKHAPATNAM",
  "NELLORE"
];

function StoreLocatorView({ onNavigate, onOpenConcierge }) {
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStoreId, setActiveStoreId] = useState("nagpal-watches-karnal");
  const [mobileViewTab, setMobileViewTab] = useState("stores"); // "stores" | "map"
  const featuredCardRef = useRef(null);

  // Selected or active featured store
  const activeStore = STORES_DATA.find((s) => s.id === activeStoreId) || STORES_DATA[0];

  // Filtering logic
  const filteredStores = STORES_DATA.filter((store) => {
    const filterUpper = selectedCity.trim().toUpperCase();
    let matchesCity = false;
    if (filterUpper === "ALL") {
      matchesCity = true;
    } else if (filterUpper === "DELHI") {
      // Delhi strictly matches only Delhi stores (Time Point in Pitampura)
      matchesCity = store.city.toUpperCase() === "DELHI" || (store.state && store.state.toUpperCase() === "DELHI");
    } else if (filterUpper === "HARYANA") {
      // Haryana matches Nagpal Watches (Karnal) and Time Planet (Bahadurgarh)
      matchesCity = store.state && store.state.toUpperCase() === "HARYANA";
    } else {
      matchesCity =
        store.city.toUpperCase() === filterUpper ||
        (store.state && store.state.toUpperCase() === filterUpper) ||
        (store.area && store.area.toUpperCase() === filterUpper) ||
        (store.keywords && store.keywords.toUpperCase().includes(filterUpper));
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      store.name.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      (store.area && store.area.toLowerCase().includes(q)) ||
      store.state.toLowerCase().includes(q) ||
      store.address.toLowerCase().includes(q) ||
      (store.keywords && store.keywords.toLowerCase().includes(q));
    return matchesCity && matchesQuery;
  });

  // Only show locations where we have stores located (matching active filter)
  const visibleMapCities = MAP_CITIES.filter((city) => {
    return filteredStores.some(
      (store) =>
        store.city.toUpperCase() === city.name ||
        (store.area && store.area.toUpperCase() === city.name) ||
        (store.state && store.state.toUpperCase() === city.name) ||
        (store.keywords && store.keywords.toUpperCase().includes(city.name))
    );
  });

  const handleSelectCity = (cityUpper) => {
    setSelectedCity(cityUpper);
    if (cityUpper !== "ALL") {
      const match = STORES_DATA.find((s) => {
        if (cityUpper === "DELHI") {
          return s.city.toUpperCase() === "DELHI" || (s.state && s.state.toUpperCase() === "DELHI");
        }
        if (cityUpper === "HARYANA") {
          return s.state && s.state.toUpperCase() === "HARYANA";
        }
        return (
          s.city.toUpperCase() === cityUpper ||
          (s.state && s.state.toUpperCase() === cityUpper) ||
          (s.area && s.area.toUpperCase() === cityUpper) ||
          (s.keywords && s.keywords.toUpperCase().includes(cityUpper))
        );
      });
      if (match) {
        setActiveStoreId(match.id);
      }
    }
  };

  const handleSelectStore = (store) => {
    setActiveStoreId(store.id);
    if (featuredCardRef.current) {
      featuredCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="hanboro-network-page">
      {/* ── TOP LUXURY NAVIGATION BAR (Exact Match to Design) ── */}
      <header className="network-navbar" role="banner">
        <div className="network-navbar__left">
          <button
            type="button"
            className="network-navbar__brand"
            onClick={() => onNavigate && onNavigate("home", "#top")}
            aria-label="Hanboro Home"
          >
            <HanboroLogo theme="light" size={20} />
          </button>
        </div>

        <nav className="network-navbar__center" aria-label="Main Navigation">
          <button
            type="button"
            className="network-nav-link"
            onClick={() => onNavigate && onNavigate("products", "#products")}
          >
            COLLECTION
          </button>
          <button
            type="button"
            className="network-nav-link is-active"
            onClick={() => onNavigate && onNavigate("stores", "#stores")}
          >
            STORE LOCATOR
            <span className="network-nav-indicator" aria-hidden="true" />
          </button>
        </nav>

        <div className="network-navbar__right">
          <button
            type="button"
            className="network-inquire-btn"
            onClick={() => onOpenConcierge ? onOpenConcierge() : (onNavigate && onNavigate("home", "#contact"))}
          >
            <span>INQUIRE NOW</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      {/* ── HERO SECTION: THE HANBORO NETWORK + DOTTED INDIA MAP ── */}
      <section className="network-hero-section">
        <div className="network-hero-container">
          
          {/* Left Column: Heading & Network Stats */}
          <div className="network-hero-left">
            <span className="network-tag">STORE LOCATOR</span>
            
            <h1 className="network-heading">
              THE HANBORO <br />
              <span className="network-heading--red">NETWORK</span>
            </h1>

            <p className="network-subtitle">
              Find Hanboro at our {STORES_DATA.length} verified authorized showrooms across India.
            </p>

            {/* Network Stat Boxes */}
            <div className="network-stats-wrap">
              <div className="network-stat-card">
                <div className="stat-card__icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fa2d1d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__number">{STORES_DATA.length}</span>
                  <span className="stat-card__label">AUTHORIZED RETAILERS</span>
                </div>
              </div>

              <div className="network-stat-card">
                <div className="stat-card__icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fa2d1d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__number">100%</span>
                  <span className="stat-card__label">AUTHENTIC • TRUSTED • VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Mobile View Switcher (Segmented Control) */}
            <div className="network-mobile-tabs" role="tablist" aria-label="Showroom view toggle">
              <button
                type="button"
                role="tab"
                aria-selected={mobileViewTab === "stores"}
                className={`network-mobile-tab ${mobileViewTab === "stores" ? "is-active" : ""}`}
                onClick={() => setMobileViewTab("stores")}
              >
                <span className="tab-icon" aria-hidden="true">📍</span>
                <span>Showrooms ({filteredStores.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mobileViewTab === "map"}
                className={`network-mobile-tab ${mobileViewTab === "map" ? "is-active" : ""}`}
                onClick={() => setMobileViewTab("map")}
              >
                <span className="tab-icon" aria-hidden="true">🗺️</span>
                <span>India Map ({visibleMapCities.length})</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Real India Map with Verified Store Location Pins */}
          <div className={`network-hero-right ${mobileViewTab === "map" ? "is-mobile-visible" : "is-mobile-hidden"}`}>
            <div className="network-map-wrap">
              <svg
                className="network-india-map-svg"
                viewBox={INDIA_MAP_VIEWBOX}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Map of authorized Hanboro retailers in India"
              >
                {/* Real India Geographic State Boundaries with Clean Luxury Silhouette */}
                <g className="india-map-regions">
                  {INDIA_MAP_PATHS.map((region) => (
                    <path
                      key={region.id}
                      d={region.path}
                      fill="rgba(255, 255, 255, 0.04)"
                      stroke="rgba(255, 255, 255, 0.16)"
                      strokeWidth="0.85"
                      className="india-state-shape"
                    />
                  ))}
                </g>

                {/* City Location Pins - Only those locations where stores are located */}
                {visibleMapCities.map((city) => {
                  const isCityActive =
                    selectedCity === city.name ||
                    (selectedCity === "ALL" && activeStore?.city.toUpperCase() === city.name);

                  return (
                    <g
                      key={city.name}
                      className={`map-city-node ${isCityActive ? "is-city-active" : ""}`}
                      onClick={() => handleSelectCity(city.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectCity(city.name);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${city.name} boutiques`}
                    >
                      {/* Clean Static Location Dot - Bubble Animation Removed */}
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r={isCityActive ? "5.5" : "4.5"}
                        fill="#fa2d1d"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="node-core-dot"
                      />

                      {/* City Text Label */}
                      <text
                        x={city.x + (city.labelDx || 14)}
                        y={city.y + (city.labelDy || 4)}
                        textAnchor={city.textAnchor || "start"}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="'JetBrains Mono', monospace"
                        letterSpacing="0.08em"
                        className="node-city-label"
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* ── SEARCH BAR SECTION ── */}
      <section className="network-search-section">
        <div className="network-search-bar-wrap">
          <div className="network-search-input-box">
            <svg
              className="search-lens-icon"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(245, 242, 237, 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search city, area or pincode"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="network-search-input"
              aria-label="Search city, area or pincode"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURED STORE SHOWCASE CARD (Nagpal Watches & Active Boutique) ── */}
      <section className="network-featured-section" ref={featuredCardRef}>
        <div className="network-featured-card">
          
          {/* Left Column: Real Storefront Facade Image */}
          <div className="featured-card__media">
            <img
              src={activeStore.image}
              alt={`${activeStore.name} Luxury Boutique Storefront`}
              className="featured-card__img"
              loading="lazy"
            />
            <div className="featured-card__overlay" aria-hidden="true" />
          </div>

          {/* Right Column: Store Details & Actions */}
          <div className="featured-card__body">
            <span className="featured-tag">FEATURED STORE</span>
            
            <h2 className="featured-store-name">{activeStore.name}</h2>
            <p className="featured-store-location">
              {activeStore.city.toUpperCase()}{activeStore.area ? ` • ${activeStore.area.toUpperCase()}` : ""}, {activeStore.country?.toUpperCase() || "INDIA"}
            </p>

            <div className="featured-auth-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>{activeStore.type.toUpperCase()}</span>
            </div>

            <div className="featured-details-list">
              <div className="featured-detail-item">
                <svg className="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{activeStore.address}</span>
              </div>

              {activeStore.phone && (
                <div className="featured-detail-item">
                  <svg className="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <a href={`tel:${activeStore.phoneRaw}`} className="featured-phone-link">
                    {activeStore.phone}
                  </a>
                </div>
              )}

              <div className="featured-detail-item">
                <svg className="detail-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{activeStore.hours || "10:30 AM – 8:30 PM (All Days)"}</span>
              </div>
            </div>

            {/* Action Buttons: Get Directions & Call Store */}
            <div className="featured-actions-row">
              <a
                href={activeStore.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-directions-btn"
              >
                <span>GET DIRECTIONS</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </a>

              {activeStore.phoneRaw && (
                <a
                  href={`tel:${activeStore.phoneRaw}`}
                  className="featured-call-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>CALL STORE</span>
                </a>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── CITY FILTER PILLS BAR ── */}
      <section className="network-filters-section">
        <div className="network-filters-container">
          <span className="filters-eyebrow">FIND HANBORO NEAR YOU</span>

          <div className="filters-row">
            <div className="filters-chips-scroll">
              {CITY_FILTERS.map((city) => (
                <button
                  type="button"
                  key={city}
                  className={`filter-chip ${selectedCity === city ? "is-active" : ""}`}
                  onClick={() => handleSelectCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="filters-carousel-arrows">
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => {
                  const idx = CITY_FILTERS.indexOf(selectedCity);
                  const prev = idx > 0 ? CITY_FILTERS[idx - 1] : CITY_FILTERS[CITY_FILTERS.length - 1];
                  handleSelectCity(prev);
                }}
                aria-label="Previous city filter"
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => {
                  const idx = CITY_FILTERS.indexOf(selectedCity);
                  const next = idx < CITY_FILTERS.length - 1 ? CITY_FILTERS[idx + 1] : CITY_FILTERS[0];
                  handleSelectCity(next);
                }}
                aria-label="Next city filter"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4-COLUMN RETAILER BOUTIQUE CARDS GRID ── */}
      <section className={`network-grid-section ${mobileViewTab === "stores" ? "is-mobile-visible" : "is-mobile-hidden"}`}>
        <div className="network-grid-container">
          <div className="network-cards-grid">
            {filteredStores.map((store) => {
              const isCurrentActive = store.id === activeStore.id;

              return (
                <article
                  key={store.id}
                  className={`boutique-card ${isCurrentActive ? "is-selected-boutique" : ""}`}
                  onClick={() => handleSelectStore(store)}
                >
                  <div className="boutique-card__media">
                    <img
                      src={store.image}
                      alt={store.name}
                      className="boutique-card__img"
                      loading="lazy"
                    />
                    <div className="boutique-card__gradient" aria-hidden="true" />
                  </div>

                  <div className="boutique-card__body">
                    <h3 className="boutique-card__title">{store.name}</h3>
                    <p className="boutique-card__city">
                      {store.city.toUpperCase()}{store.area ? ` • ${store.area.toUpperCase()}` : ""}
                    </p>
                    <p className="boutique-card__tag">Authorized Hanboro Retailer</p>

                    <div className="boutique-card__actions">
                      <button
                        type="button"
                        className="boutique-card__link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStore(store);
                        }}
                      >
                        <span>VIEW STORE</span>
                        <span className="link-arrow" aria-hidden="true">→</span>
                      </button>

                      <a
                        href={store.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="boutique-card__quick-dir"
                        onClick={(e) => e.stopPropagation()}
                        title="Directions"
                        aria-label={`Get directions to ${store.name}`}
                      >
                        <span>Directions ↗</span>
                      </a>

                      {store.phoneRaw && (
                        <a
                          href={`tel:${store.phoneRaw}`}
                          className="boutique-card__quick-call"
                          onClick={(e) => e.stopPropagation()}
                          title="Call"
                          aria-label={`Call ${store.name}`}
                        >
                          <span>Call 📞</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredStores.length === 0 && (
            <div className="network-empty-state">
              <p>No authorized boutiques found matching your search.</p>
              <button
                type="button"
                className="network-reset-btn"
                onClick={() => {
                  setSelectedCity("ALL");
                  setSearchQuery("");
                }}
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FOOTER REAL-TIME LIVE OUTLINE CLOCK
   Precision Swiss-horology outline clock displaying active local system time
══════════════════════════════════════════════════════════════════════════════ */
const FOOTER_CLOCK_TICKS = Array.from({ length: 60 }, (_, i) => {
  const angle = i * 6;
  const isHour = i % 5 === 0;
  const isCardinal = i % 15 === 0;
  const rOuter = 46.5;
  const rInner = isCardinal ? 40.5 : isHour ? 42.5 : 44.5;
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    angle,
    isHour,
    isCardinal,
    x1: 50 + rOuter * Math.cos(rad),
    y1: 50 + rOuter * Math.sin(rad),
    x2: 50 + rInner * Math.cos(rad),
    y2: 50 + rInner * Math.sin(rad),
  };
});

function FooterLiveClock() {
  const containerRef = useRef(null);
  const hourHandRef = useRef(null);
  const minHandRef = useRef(null);
  const secHandRef = useRef(null);

  useEffect(() => {
    let animId;
    let isClockVisible = false;
    const updateTime = () => {
      if (!isClockVisible) return;
      const now = new Date();
      const ms = now.getMilliseconds();
      const s = now.getSeconds() + ms / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      const secDeg = s * 6;
      const minDeg = m * 6;
      const hourDeg = h * 30;

      if (hourHandRef.current) {
        hourHandRef.current.setAttribute("transform", `rotate(${hourDeg}, 50, 50)`);
      }
      if (minHandRef.current) {
        minHandRef.current.setAttribute("transform", `rotate(${minDeg}, 50, 50)`);
      }
      if (secHandRef.current) {
        secHandRef.current.setAttribute("transform", `rotate(${secDeg}, 50, 50)`);
      }

      animId = requestAnimationFrame(updateTime);
    };

    const clockObserver = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isClockVisible;
        isClockVisible = entry.isIntersecting;
        if (isClockVisible && !wasVisible) {
          cancelAnimationFrame(animId);
          animId = requestAnimationFrame(updateTime);
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      clockObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animId);
      clockObserver.disconnect();
    };
  }, []);

  return (
    <div className="footer-live-clock-wrap" ref={containerRef} aria-label="Real-time precision outline clock">
      <svg className="footer-clock-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <filter id="redSecGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Clean Horology Outline Bezel & Chapter Tracks */}
        <circle
          cx="50"
          cy="50"
          r="47.5"
          fill="none"
          stroke="rgba(245, 242, 237, 0.3)"
          strokeWidth="1.3"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(245, 242, 237, 0.12)"
          strokeWidth="0.7"
          strokeDasharray="1 2.5"
        />
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="rgba(250, 45, 29, 0.22)"
          strokeWidth="0.6"
        />

        {/* 60 Precision Dial Ticks */}
        {FOOTER_CLOCK_TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={
              t.isCardinal
                ? "#fa2d1d"
                : t.isHour
                ? "rgba(245, 242, 237, 0.9)"
                : "rgba(245, 242, 237, 0.3)"
            }
            strokeWidth={t.isCardinal ? 1.6 : t.isHour ? 1.2 : 0.65}
            strokeLinecap="round"
          />
        ))}

        {/* Cardinal Numerals: 12, 3, 6, 9 */}
        <text x="50" y="20.5" textAnchor="middle" fill="rgba(245, 242, 237, 0.92)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.02em">12</text>
        <text x="81.5" y="52" textAnchor="middle" fill="rgba(245, 242, 237, 0.92)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">3</text>
        <text x="50" y="83" textAnchor="middle" fill="rgba(245, 242, 237, 0.92)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">6</text>
        <text x="18.5" y="52" textAnchor="middle" fill="rgba(245, 242, 237, 0.92)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">9</text>

        {/* Subtle Hanboro Wordmark */}
        <text x="50" y="34.5" textAnchor="middle" fill="rgba(245, 242, 237, 0.55)" fontSize="3.3" fontWeight="800" letterSpacing="0.18em" fontFamily="'Inter', sans-serif">HANBORO</text>
        <text x="50" y="65.5" textAnchor="middle" fill="rgba(250, 45, 29, 0.75)" fontSize="2.6" fontWeight="600" letterSpacing="0.14em" fontFamily="'JetBrains Mono', monospace">AUTOMATIC</text>

        {/* Central Hands Pivot Underlay */}
        <circle cx="50" cy="50" r="3.2" fill="#0d0d10" stroke="rgba(245, 242, 237, 0.35)" strokeWidth="0.8" />

        {/* Hour Hand (Luxury Sword Baton) */}
        <g ref={hourHandRef}>
          <line x1="50" y1="52" x2="50" y2="27" stroke="rgba(0,0,0,0.8)" strokeWidth="3.4" strokeLinecap="round" />
          <line x1="50" y1="52" x2="50" y2="27" stroke="#f5f2ed" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="50" y1="50" x2="50" y2="30" stroke="#08080a" strokeWidth="0.8" strokeLinecap="round" />
        </g>

        {/* Minute Hand (Tapered Precision Baton) */}
        <g ref={minHandRef}>
          <line x1="50" y1="54" x2="50" y2="16" stroke="rgba(0,0,0,0.8)" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="50" y1="54" x2="50" y2="16" stroke="#f5f2ed" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="50" y1="52" x2="50" y2="18" stroke="#fa2d1d" strokeWidth="0.7" strokeLinecap="round" />
        </g>

        {/* Second Hand (Signature Hanboro Signal-Red Needle & Open Ring Counterweight) */}
        <g ref={secHandRef}>
          {/* Subtle Red Energy Aura */}
          <line
            x1="50"
            y1="64"
            x2="50"
            y2="7"
            stroke="#fa2d1d"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.32"
            filter="url(#redSecGlow)"
          />
          {/* Main Needle Shaft (Extended to outer track at y=7) */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="7"
            stroke="#fa2d1d"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Reinforced Hand Center Body */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="24"
            stroke="#fa2d1d"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          {/* Opposing Counter-Balance Tail */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="61"
            stroke="#fa2d1d"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Precision Open Counter-Balance Ring */}
          <circle
            cx="50"
            cy="65"
            r="3.2"
            fill="none"
            stroke="#fa2d1d"
            strokeWidth="1.2"
          />
          {/* Tail Extension Tip */}
          <line
            x1="50"
            y1="68.2"
            x2="50"
            y2="71"
            stroke="#fa2d1d"
            strokeWidth="1.0"
            strokeLinecap="round"
          />
          {/* Center Hub Boss */}
          <circle cx="50" cy="50" r="2.5" fill="#fa2d1d" />
          <circle cx="50" cy="50" r="1.0" fill="#08080a" />
          <circle cx="49.5" cy="49.5" r="0.45" fill="#ffffff" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}


function Website({ onRestart }) {
  const { cartCount, setIsCartOpen, openCheckout, shopifyCustomer, customerAuthError, isCustomerAuthLoading, loginWithShopify, logoutFromShopify } = useStore();
  const [visible, setVisible] = useState(true);
  const getRouteState = () => {
    if (typeof window === "undefined") return { view: "home", selectedSkuId: null };
    const hash = (window.location.hash || "").toLowerCase();
    const pathname = (window.location.pathname || "").toLowerCase().replace(/^\/+|\/+$/g, "");
    
    // Check hash first, then pathname for direct Google sitelinks & shared URLs
    const target = hash ? hash.replace(/^#/, "") : pathname;

    if (target.startsWith("admin")) return { view: "home", selectedSkuId: null };
    if (target.startsWith("checkout")) return { view: "products", selectedSkuId: null, openCheckout: true };
    if (target.startsWith("profile") || target.startsWith("account") || target.startsWith("dossier")) {
      return { view: "account", selectedSkuId: null };
    }
    if (target.startsWith("stores") || target.startsWith("boutiques")) {
      return { view: "stores", selectedSkuId: null };
    }
    if (target.startsWith("privacy")) return { view: "privacy", selectedSkuId: null };
    if (target.startsWith("shipping")) return { view: "shipping", selectedSkuId: null };
    if (target.startsWith("refund") || target.startsWith("returns") || target.startsWith("replacement")) {
      return { view: "refund", selectedSkuId: null };
    }
    if (target.startsWith("track") || target.startsWith("order-tracking") || target.startsWith("shipment")) {
      return { view: "tracking", selectedSkuId: null };
    }
    if (target.startsWith("terms") || target.startsWith("tos") || target.startsWith("legal")) {
      return { view: "terms", selectedSkuId: null };
    }
    if (target.startsWith("sku/")) {
      return { view: "products", selectedSkuId: target.replace(/^sku\//, "").trim() };
    }
    if (target.startsWith("product/")) {
      return { view: "products", selectedSkuId: target.replace(/^product\//, "").trim() };
    }
    if (target.startsWith("watch/")) {
      return { view: "products", selectedSkuId: target.replace(/^watch\//, "").trim() };
    }
    if (target.startsWith("cart") || target === "bag") {
      return { view: "home", selectedSkuId: null, openCart: true };
    }
    if (target.startsWith("products") || target.startsWith("collections") || target.startsWith("collection") || target.startsWith("archive") || target.startsWith("timepieces")) {
      return { view: "products", selectedSkuId: null };
    }
    return { view: "home", selectedSkuId: null };
  };

  const initialRoute = getRouteState();
  const [view, setView] = useState(initialRoute.view);
  const [selectedSkuId, setSelectedSkuId] = useState(initialRoute.selectedSkuId);

  useEffect(() => {
    if (initialRoute.openCart) {
      setIsCartOpen(true);
    }
    if (initialRoute.openCheckout) {
      openCheckout();
    }
  }, []);

  useScrollReveal(visible, view, selectedSkuId);

  // Update document title and ensure favicon tags across all link views
  useEffect(() => {
    const titles = {
      home: "Hanboro — Make time matter",
      products: "Hanboro — Masterpiece Timepieces | Haute Horlogerie India",
      stores: "Hanboro — Flagship Boutiques | DLF Phase II",
      shipping: "Hanboro — Insured Express Delivery Policy",
      refund: "Hanboro — Authenticity Guarantee & Returns",
      terms: "Hanboro — Terms of Haute Horlogerie",
      privacy: "Hanboro — Client Privacy & Confidentiality",
      account: "Hanboro — Collector Account",
      tracking: "Hanboro — Track Your Consignment | Order Logistics",
    };
    if (typeof document !== "undefined") {
      document.title = titles[view] || "Hanboro — Make time matter";
    }
    // Meta Ads Pixel / Dataset 1069596304671544: Track PageView on route navigation
    try {
      metaPixelService.trackPageView(view);
    } catch (pixelErr) {
      console.warn("Meta Pixel PageView tracking warning:", pixelErr);
    }
  }, [view]);

  useEffect(() => {
    const syncRoute = () => {
      const { view: nextView, selectedSkuId: nextSkuId, openCart, openCheckout: routeOpenCheckout } = getRouteState();
      setView(nextView);
      setSelectedSkuId(nextSkuId);
      if (openCart) {
        setIsCartOpen(true);
      }
      if (routeOpenCheckout) {
        openCheckout();
      }
      if (nextView !== "home") {
        forceScrollToTop();
      }
    };

    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);

    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  // Lock background scroll and pause Lenis while menu drawer is open
  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [menuOpen]);

  const navigateTo = (newView, hashTarget) => {
    setView(newView);
    setMenuOpen(false);
    if (newView !== "products") {
      setSelectedSkuId(null);
    }
    if (hashTarget) {
      window.location.hash = hashTarget;
      if (newView === "home") {
        if (hashTarget === "#top" || hashTarget === "#home") {
          forceScrollToTop();
        } else {
          setTimeout(() => {
            const el = document.querySelector(hashTarget);
            if (el) {
              if (window.__hanboro_lenis) {
                window.__hanboro_lenis.scrollTo(el, { offset: -64, duration: 0.8 });
              } else {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }
          }, 60);
        }
      } else {
        forceScrollToTop();
      }
    } else {
      forceScrollToTop();
    }
  };

  const handleOpenSku = (skuOrId) => {
    setSelectedSkuId(skuOrId);
    setMenuOpen(false);
    setView("products");
    window.location.hash = `#sku/${skuOrId}`;
    forceScrollToTop();
  };

  return (
    <main className={["site", visible ? "site--visible" : ""].filter(Boolean).join(" ")} id="top">
      {/* ── LUXURY FILM GRAIN TEXTURE OVERLAY ── */}
      <div className="site__grain-overlay" aria-hidden="true" />

      {/* ── LUXURY HEADER (Exact Match to Photo Reference) ── */}
      {view === "stores" || view === "privacy" || view === "shipping" || view === "refund" || view === "terms" ? null : (
        <header className="luxury-header" role="banner">
          {/* Left: Minimal Hamburger Menu */}
          <button
            type="button"
            className="luxury-header__icon-btn luxury-header__menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            <span className="luxury-menu-bars" aria-hidden="true">
              <span className={`menu-bar menu-bar--top ${menuOpen ? "is-open" : ""}`} />
              <span className={`menu-bar menu-bar--bottom ${menuOpen ? "is-open" : ""}`} />
            </span>
          </button>

          {/* Center: Real Hanboro Official Logo */}
          <button
            type="button"
            onClick={() => navigateTo("home", "#top")}
            aria-label="Hanboro home"
            className="luxury-header__brand-btn"
          >
            <HanboroLogo theme="light" size={24} />
          </button>

          {/* Right: Minimal Icons (Stores, Bag with badge) */}
          <div className="luxury-header__actions">
            <button
              type="button"
              className="luxury-header__icon-btn"
              onClick={() => navigateTo("stores", "#stores")}
              aria-label="Find a Boutique"
              title="Boutiques & Stores"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>

            {/* Shopify Customer Account / Profile Button */}
            <button
              type="button"
              className="luxury-header__icon-btn"
              onClick={() => {
                navigateTo("account", "#account");
              }}
              aria-label={shopifyCustomer ? `Shopify Account: ${shopifyCustomer.displayName || "Customer"}` : "Account & Collector Dossier"}
              title={shopifyCustomer ? `Open account for ${shopifyCustomer.displayName || "Customer"}` : "Account & Collector Dossier"}
              style={{ position: "relative" }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {shopifyCustomer && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                  }}
                />
              )}
            </button>

            {/* Bag / Cart Button with live Badge */}
            <button
              type="button"
              className="luxury-header__icon-btn luxury-header__bag-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping Bag (${cartCount} items)`}
              title="Shopping Bag"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && <span className="header-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </header>
      )}

      {/* ── LUXURY OFF-CANVAS MENU DRAWER ── */}
      <div
        className={`luxury-drawer-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
        data-lenis-prevent="true"
      />
      <aside
        className={`luxury-drawer ${menuOpen ? "is-open" : ""}`}
        aria-label="Site navigation menu"
        aria-hidden={!menuOpen}
        data-lenis-prevent="true"
      >
        <div className="luxury-drawer__head">
          <button
            type="button"
            onClick={() => navigateTo("home", "#top")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            aria-label="Hanboro Home"
          >
            <HanboroLogo theme="light" size={22} />
          </button>
          <button
            type="button"
            className="luxury-drawer__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="luxury-drawer__nav">
          <button
            type="button"
            className={`luxury-drawer__link ${view === "products" ? "is-active" : ""}`}
            onClick={() => navigateTo("products", "#products")}
          >
            <span className="drawer-link-text">Shop All Watches</span>
            <span className="drawer-link-arrow">↗</span>
          </button>

          <button
            type="button"
            className={`luxury-drawer__link ${view === "stores" ? "is-active" : ""}`}
            onClick={() => navigateTo("stores", "#stores")}
          >
            <span className="drawer-link-text">Store Locator</span>
            <span className="drawer-link-arrow">📍</span>
          </button>

          <button
            type="button"
            className="luxury-drawer__link"
            onClick={() => {
              setMenuOpen(false);
              navigateTo("account", "#account");
            }}
          >
            <span className="drawer-link-text">
              {shopifyCustomer ? `Account (${shopifyCustomer.firstName || "Signed In"})` : "Collector Account"}
            </span>
            <span className="drawer-link-arrow">👤</span>
          </button>

          <button
            type="button"
            className={`luxury-drawer__link ${view === "tracking" ? "is-active" : ""}`}
            onClick={() => {
              setMenuOpen(false);
              navigateTo("tracking", "#track");
            }}
          >
            <span className="drawer-link-text">Track Your Order</span>
            <span className="drawer-link-arrow">📦</span>
          </button>

          <button
            type="button"
            className="luxury-drawer__link"
            onClick={() => {
              setMenuOpen(false);
              setIsCartOpen(true);
            }}
          >
            <span className="drawer-link-text">Shopping Bag ({cartCount})</span>
            <span className="drawer-link-arrow">🛍️</span>
          </button>
        </nav>

        <div className="luxury-drawer__foot">
          <a
            href="mailto:connect@hanborowatches.in"
            className="luxury-drawer__inquire-btn"
          >
            Inquire Concierge
          </a>
          <p className="luxury-drawer__copyright">
            © 2026 HANBORO • Swiss Precision & Horology
          </p>
        </div>
      </aside>

      <Suspense fallback={<LuxuryViewLoader />}>
        {view === "privacy" ? (
          <PrivacyPolicy
            onNavigateHome={() => navigateTo("home", "#top")}
            onNavigatePolicy={(target) => navigateTo(target, `#${target}`)}
            onNavigateToProducts={() => navigateTo("products", "#products")}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
            onOpenConcierge={() => navigateTo("home", "#contact")}
          />
        ) : view === "shipping" ? (
          <ShippingPolicy
            onNavigateHome={() => navigateTo("home", "#top")}
            onNavigatePolicy={(target) => navigateTo(target, `#${target}`)}
            onNavigateToProducts={() => navigateTo("products", "#products")}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
            onOpenConcierge={() => navigateTo("home", "#contact")}
          />
        ) : view === "refund" ? (
          <RefundPolicy
            onNavigateHome={() => navigateTo("home", "#top")}
            onNavigatePolicy={(target) => navigateTo(target, `#${target}`)}
            onNavigateToProducts={() => navigateTo("products", "#products")}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
            onOpenConcierge={() => navigateTo("home", "#contact")}
          />
        ) : view === "terms" ? (
          <TermsOfService
            onNavigateHome={() => navigateTo("home", "#top")}
            onNavigatePolicy={(target) => navigateTo(target, `#${target}`)}
            onNavigateToProducts={() => navigateTo("products", "#products")}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
            onOpenConcierge={() => navigateTo("home", "#contact")}
          />
        ) : view === "stores" ? (
          <StoreLocatorView
            onNavigate={(targetView, hash) => navigateTo(targetView, hash)}
            onOpenConcierge={() => navigateTo("home", "#contact")}
          />
        ) : view === "account" ? (
          <AccountView
            customer={shopifyCustomer}
            authError={customerAuthError}
            authLoading={isCustomerAuthLoading}
            onLogin={() => loginWithShopify()}
            onLogout={() => logoutFromShopify()}
            onShopNow={() => navigateTo("products", "#products")}
            onNavigateHome={() => navigateTo("home", "#top")}
          />
        ) : view === "tracking" ? (
          <TrackOrderView
            onNavigateHome={() => navigateTo("home", "#top")}
            onNavigatePolicy={(target) => navigateTo(target, `#${target}`)}
            onNavigateToProducts={() => navigateTo("products", "#products")}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
          />
        ) : selectedSkuId ? (
          <ProductDetailPage
            skuId={selectedSkuId}
            onNavigateBack={() => {
              setSelectedSkuId(null);
              navigateTo("products", "#products");
              forceScrollToTop();
            }}
            onSelectSku={(skuId) => handleOpenSku(skuId)}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
          />
        ) : view === "products" ? (
          <ProductsView
            onSelectSku={(skuId) => handleOpenSku(skuId)}
            onNavigateHome={() => navigateTo("home", "#top")}
            onNavigateToStores={() => navigateTo("stores", "#stores")}
          />
        ) : (
          <>
            {/* ── ACT I: CINEMATIC VIDEO HERO ── */}
            <HeroVideoSection onDiscover={() => navigateTo("products", "#products")} />

            {/* ── ACT II: ABOUT THE MAISON / ATELIER HANBORO ── */}
            <AboutMaisonSection />

            {/* ── ACT III: THE ART OF MODERN HOROLOGY (4 Pillars / Advantages) ── */}
            <SubtleMasterySection onExploreCatalog={() => navigateTo("products", "#products")} />

            {/* ── ACT IV: CRAFTED WITH LEGACY IN MIND (Philosophy Mosaic Banner) ── */}
            <CraftedWithLegacySection onExploreCatalog={() => navigateTo("products", "#products")} />

            {/* ── ACT V: THE VAULT / ICONIC TIMEPIECE CAROUSEL LOOP ── */}
            <WatchCarouselSection
              onSelectProduct={handleOpenSku}
              onViewAllProducts={() => navigateTo("products", "#products")}
            />

            {/* ── ACT VI: CLOVER KING DAY VS NIGHT KINETIC REVEAL ── */}
            <CloverKingExperience onInspectSku={handleOpenSku} />

            {/* ── ACT VII: OUR MEDIA (Live On-Wrist Instagram Reels) ── */}
            <MediaSection onInspectSku={handleOpenSku} />

            {/* ── ACT VIII: CUSTOMER REVIEWS (Collector Acclaim & Reviews) ── */}
            <TestimonialsSection onInspectSku={handleOpenSku} />

            {/* ── ACT IX: CONTACT & COLLECTOR CONCIERGE ── */}
            <ContactSection />

          </>
        )}
      </Suspense>



      {view !== "stores" && view !== "privacy" && view !== "shipping" && view !== "refund" && view !== "terms" && view !== "account" && view !== "tracking" && (
        <footer className="footer is-always-visible" id="contact" style={{ position: 'relative' }}>
          <div className="footer__top-wrap">
            <div className="footer__main-col">
              <p className="eyebrow">Have a moment?</p>
              <a className="footer__email" href="mailto:connect@hanborowatches.in">
                connect@hanborowatches.in
              </a>

              <div className="footer__address">
                <p className="eyebrow">Studio Location</p>
                <address className="footer__address-text">
                  Building No. 3, 4th Floor, Block M, DLF City Phase II<br />
                  Road Number 5, Sector 25, Gurugram, Haryana 122008, India
                </address>
              </div>

              <div className="footer__address">
                <p className="eyebrow">Call Us</p>
                <a className="footer__phone" href="tel:+918882069334">+91 88820 69334</a>
              </div>
            </div>

            <div className="footer__clock-col">
              <FooterLiveClock />
            </div>
          </div>


          <div className="footer__bottom is-always-visible">
            <div className="footer-bottom-brand-group">
              <HanboroLogo size={20} theme="light" />
              <span>© 2026 RISE N BE ORIGINAL LIFESTYLE PRIVATE LIMITED • ALL RIGHTS RESERVED</span>
            </div>

            <div className="footer-policies-list">
              <a
                href="#track"
                className="footer-privacy-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("tracking", "#track");
                }}
              >
                Track Order
              </a>
              <span className="footer-policy-dot">•</span>
              <a
                href="#privacy"
                className="footer-privacy-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("privacy", "#privacy");
                }}
              >
                Privacy Policy
              </a>
              <span className="footer-policy-dot">•</span>
              <a
                href="#shipping"
                className="footer-privacy-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("shipping", "#shipping");
                }}
              >
                Shipping Policy
              </a>
              <span className="footer-policy-dot">•</span>
              <a
                href="#refund"
                className="footer-privacy-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("refund", "#refund");
                }}
              >
                Refund Policy
              </a>
              <span className="footer-policy-dot">•</span>
              <a
                href="#terms"
                className="footer-privacy-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("terms", "#terms");
                }}
              >
                Terms of Service
              </a>
            </div>

            <div className="footer-bottom-links-group">
              <a href="#top">Back to top ↑</a>
            </div>
          </div>
        </footer>
      )}

      {/* ── LUXURY MODALS & DRAWERS ── */}
      <CartDrawer />
      <FastrrCheckoutModal onNavigateToTracking={(orderId) => navigateTo("tracking", `#track?orderId=${encodeURIComponent(orderId)}`)} />
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   APP — orchestrates: idle → exiting → entered
   Iris wipe transition effect & Store Provider
══════════════════════════════════════════════════════════════════════════════ */
export function App() {
  useSmoothScroll();



  // Global Media & Audio Engine Auto-Unlocker: Unlock AudioContext and Video Sound on Any Gesture
  useEffect(() => {
    const gestureEvents = ["pointerdown", "touchstart", "click", "keydown"];

    const unlockMediaAudio = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!window.__hanboro_actx) {
            window.__hanboro_actx = new AudioCtx();
          }
          if (window.__hanboro_actx.state === "suspended") {
            window.__hanboro_actx.resume().catch(() => {});
          }
        }

        if (!window.__hanboro_user_explicitly_muted) {
          const heroVideo = document.querySelector(".hero-video-media");
          if (heroVideo) {
            heroVideo.setAttribute("playsinline", "");
            heroVideo.setAttribute("webkit-playsinline", "");
            if (heroVideo.muted || heroVideo.paused) {
              heroVideo.muted = false;
              heroVideo.volume = 1;
              const p = heroVideo.play();
              if (p !== undefined) {
                p.then(() => {
                  window.dispatchEvent(new CustomEvent("hanboro_video_sound_unmuted"));
                }).catch(() => {});
              }
            }
          }
        }
      } catch {}
    };

    gestureEvents.forEach((evt) =>
      window.addEventListener(evt, unlockMediaAudio, { capture: true, passive: true })
    );

    return () => {
      gestureEvents.forEach((evt) =>
        window.removeEventListener(evt, unlockMediaAudio, true)
      );
    };
  }, []);

  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const isIntroSeen = typeof sessionStorage !== "undefined" && Boolean(sessionStorage.getItem("hanboro_intro_seen"));
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const hasAuthCode = Boolean(urlParams?.has("code"));
  const hasDirectRoute = Boolean((hash && hash !== "#top" && hash !== "#home") || isIntroSeen || hasAuthCode);
  const [phase, setPhase]     = useState(hasDirectRoute ? "entered" : "idle");     // idle / exiting / entered
  const [iris, setIris]       = useState("off");      // off / expanding / retracting
  const transitioned          = useRef(hasDirectRoute);

  // Prevent background scrolling while splash screen is active
  useEffect(() => {
    if (phase !== "entered") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  const handleComplete = useCallback(() => {
    if (transitioned.current) return;
    transitioned.current = true;

    // Immediately trigger unmuted video audio playback synchronously
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__hanboro_actx) {
          window.__hanboro_actx = new AudioCtx();
        }
        if (window.__hanboro_actx.state === "suspended") {
          window.__hanboro_actx.resume().catch(() => {});
        }
      }

      const heroVideo = document.querySelector(".hero-video-media");
      const isBot = typeof navigator !== "undefined" && (
        Boolean(navigator.webdriver) ||
        /bot|crawler|spider|googlebot|facebookexternalhit|meta-externalagent|bingbot/i.test(navigator.userAgent || "")
      );
      if (!isBot && heroVideo) {
        heroVideo.setAttribute("playsinline", "");
        heroVideo.setAttribute("webkit-playsinline", "");
        if (!window.__hanboro_user_explicitly_muted) {
          heroVideo.muted = false;
          heroVideo.volume = 1;
          const p = heroVideo.play();
          if (p !== undefined) {
            p.catch(() => {
              // Mobile policy fallback: play muted immediately so video never freezes
              heroVideo.muted = true;
              heroVideo.play().catch(() => {});
            });
          }
        } else {
          heroVideo.muted = true;
          heroVideo.play().catch(() => {});
        }
      }
    } catch {}

    if (typeof window !== "undefined") {
      window.__hanboro_entered = true;
    }
    window.dispatchEvent(new CustomEvent("hanboro_splash_exit"));

    // 1. Start splash exit + iris expand simultaneously
    setPhase("exiting");
    setIris("expanding");

    // 2. At iris peak → mount website + start iris retract
    setTimeout(() => {
      setPhase("entered");
      setIris("retracting");
      try {
        sessionStorage.setItem("hanboro_intro_seen", "1");
      } catch {}
    }, IRIS_EXPAND);

    // 3. Iris done → hide it
    setTimeout(() => {
      setIris("off");
    }, IRIS_EXPAND + IRIS_RETRACT);
  }, []);

  // Failsafe auto-transition: guarantee the site opens even on slow devices or background tabs
  useEffect(() => {
    if (phase === "entered") return;
    const timer = setTimeout(() => {
      handleComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase, handleComplete]);

  // Keyboard accessibility: press any key to enter immediately
  useEffect(() => {
    if (phase === "entered") return;
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        handleComplete();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleComplete]);

  return (
    <ErrorBoundary>
      <StoreProvider>
        <div className="app-root">
          <Website />
          {phase !== "entered" && (
            <Splash onEnter={handleComplete} exiting={phase === "exiting"} />
          )}
          {/* Iris transition overlay */}
          {iris !== "off" && (
            <div className={`iris iris--${iris}`} aria-hidden="true"/>
          )}
        </div>
      </StoreProvider>
    </ErrorBoundary>
  );
}
