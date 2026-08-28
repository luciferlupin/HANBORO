import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ProductsView } from "./ProductsView";
import { ProductDetailPage } from "./ProductDetailPage";
import { PRODUCTS_DATA, getProductByIdOrSku } from "./productsData";
import { INDIA_MAP_VIEWBOX, MAP_CITIES, INDIA_MAP_PATHS } from "./indiaMapData";
import { StoreProvider, useStore } from "./StoreContext";
import { AuthModal } from "./AuthModal";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { CheckoutPage } from "./CheckoutPage";
import { AdminDashboard } from "./AdminDashboard";
import { ProfilePage } from "./ProfilePage";

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
    console.error("Hanboro Atelier Runtime Caught Error:", error, errorInfo);
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
            HANBORO ATELIER
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(245,242,237,0.7)", maxWidth: "480px", marginBottom: "24px" }}>
            An unexpected complication occurred. Reloading the atelier will restore precision movement.
          </p>
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
            Reload Hanboro Atelier ↻
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

/* ── scroll-reveal hook ────────────────────────────────────────────────────── */
function useScrollReveal(enabled, view, selectedSkuId) {
  useEffect(() => {
    let io = null;
    const scanAndObserve = () => {
      const els = document.querySelectorAll("[data-reveal]");
      if (!els.length) return;

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 900;

      // Mark immediate in-viewport elements as visible
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight + 250 && rect.bottom > -150) {
          el.classList.add("is-visible");
        }
      });

      if (io) io.disconnect();
      io = new IntersectionObserver(
        (entries) => entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
        { threshold: 0.01, rootMargin: "200px" }
      );

      els.forEach(el => {
        if (!el.classList.contains("is-visible")) {
          io.observe(el);
        }
      });
    };

    // 1. Immediate scan
    scanAndObserve();

    // 2. Next animation frame and delayed scans for smooth mounting
    const rId = requestAnimationFrame(scanAndObserve);
    const t1 = setTimeout(scanAndObserve, 50);
    const t2 = setTimeout(scanAndObserve, 250);
    const t3 = setTimeout(scanAndObserve, 600);

    // 3. MutationObserver to handle dynamically mounted stage sections
    const mo = new MutationObserver(() => {
      scanAndObserve();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      mo.disconnect();
      if (io) io.disconnect();
    };
  }, [enabled, view, selectedSkuId]);
}

/* ══════════════════════════════════════════════════════════════════════════════
   OFFICIAL HANBORO LOGO (Direct from source image - Dark version only)
══════════════════════════════════════════════════════════════════════════════ */
export function HanboroLogo({ size = 28, theme = "dark" }) {
  const src = theme === "light" ? "/hanboro-horizontal-light.png" : "/hanboro-horizontal-dark.png";
  return (
    <div className="hanboro-logo" style={{ height: size }}>
      <img
        src={src}
        alt="HANBORO"
        className="hanboro-logo__img"
        style={{ height: size, width: "auto", display: "block", objectFit: "contain" }}
      />
    </div>
  );
}

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
        }, 220);
        return;
      }
      if (!done) id = requestAnimationFrame(tick);
    };

    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
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

  return (
    <section
      className={["splash", mounted ? "splash--in" : "", exiting ? "splash--exit" : ""].filter(Boolean).join(" ")}
      aria-label="Hanboro intro"
      onClick={onEnter}
    >
      <div className="splash__grain"/>
      <div className="splash__header">
        <div className="s-wordmark">
          <HanboroLogo theme="dark" size={26} />
        </div>
      </div>
      <div className="splash__content">
        <div className="s-clock">
          <Clock onComplete={onEnter}/>
        </div>
      </div>
      <div className="splash__footer s-footer">
        <button className="text-button" type="button" onClick={onEnter}>Skip intro</button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   WEBSITE
══════════════════════════════════════════════════════════════════════════════ */
// ══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE EXPERIENCE 001: CLOVER KING DAY vs NIGHT REVEAL
// ══════════════════════════════════════════════════════════════════════════════
function CloverKingExperience({ onInspectSku }) {
  const [glowProgress, setGlowProgress] = useState(50); // 0 = 100% Day, 100 = 100% Night (glow sweeps left-to-right)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

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
      <div className="stage-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-index">02 / 03</span>
          <span className="stage-tag">INTERACTIVE EXPERIENCE</span>
        </div>
        <h2 id="clover-title" className="stage-title">
          How rare does time <em>need to be?</em>
        </h2>
        <p className="stage-subtitle">
          Drag the interactive divider to reveal the Clover King from its refined daytime mechanical presence to its electric green luminous night expression.
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
              <li><span className="clover-bullet" aria-hidden="true">•</span> Sculpted Anodized Tonneau Case</li>
              <li><span className="clover-bullet" aria-hidden="true">•</span> Double-Domed Sapphire Glass</li>
              <li><span className="clover-bullet" aria-hidden="true">•</span> Skeletonized Automatic Movement</li>
              <li><span className="clover-bullet" aria-hidden="true">•</span> Ergonomic Fluororubber Strap</li>
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
              <li><span className="clover-bullet green" aria-hidden="true">•</span> Swiss Super-LumiNova Grade X1</li>
              <li><span className="clover-bullet green" aria-hidden="true">•</span> Glowing Clover Bridges & Indices</li>
              <li><span className="clover-bullet green" aria-hidden="true">•</span> High-Contrast Midnight Hands</li>
              <li><span className="clover-bullet green" aria-hidden="true">•</span> 50M Pressure Aquatic Seal</li>
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
              <span className="movement-spec__value">HB-SK01</span>
              <span className="movement-spec__key">Calibre</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">42h</span>
              <span className="movement-spec__key">Power Reserve</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">28,800 bph</span>
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
        </div>

        <div style={{ textAlign: "center", marginTop: "28px" }} data-reveal data-reveal-delay="3">
          <button
            type="button"
            className="view-all-skus-cta"
            onClick={() => onInspectSku && onInspectSku("clover-king-crimson")}
          >
            <span>Inspect Clover King Dossier & Full Specs (REF. HBR-7701-CK)</span>
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
    label: "10% ATELIER WELCOME PRIVILEGE",
    desc: "10% Exclusive Collector Privilege applied across all Hanboro Timepiece Complications."
  },
  {
    code: "VIP1000",
    discount: "₹1,000 OFF",
    label: "₹1,000 HOROLOGY COLLECTOR CREDIT",
    desc: "₹1,000 Direct Collector Credit applied to your Hanboro timepiece acquisition."
  },
  {
    code: "SWISS15",
    discount: "15% OFF",
    label: "15% PRIVATE COLLECTOR TIER",
    desc: "15% Private Collector Tier privilege applied across your entire atelier acquisition."
  },
  {
    code: "HANBORO5",
    discount: "5% OFF",
    label: "5% COLLECTOR PRIVILEGE",
    desc: "5% Exclusive Collector Privilege applied across all Hanboro Timepiece Complications."
  }
];

function CasinoRouletteExperience({ onInspectSku, onShopAll }) {
  const { user, rouletteService, showToast } = useStore();
  const [selectedVariant, setSelectedVariant] = useState("emerald"); // 'emerald' | 'blue'
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
  const animFrameRef = useRef(null);

  // Check if current user or saved local session has already claimed their 1-time spin
  useEffect(() => {
    async function checkUserSpin() {
      const idToCheck = user?.email || user?.phone || localStorage.getItem("hanboro_roulette_customer_id");
      if (idToCheck && rouletteService) {
        const found = await rouletteService.getSpinByIdentifier(idToCheck);
        if (found) {
          setExistingSpin(found);
          setWinningNumber(found.winning_pocket);
          setWinningColor(found.winning_color);
          setActiveReward({
            code: found.voucher_code,
            discount: found.discount_tier,
            label: found.discount_tier,
            desc: `Exclusive 1-Time Collector Privilege linked to ${found.customer_email || found.customer_phone || found.customer_identifier}`,
            expiresAt: found.expires_at,
            isUsed: found.is_used,
            usedOrderRef: found.used_order_ref,
            linkedTo: found.customer_email || found.customer_phone || found.customer_identifier,
          });
        }
      }
    }
    checkUserSpin();
  }, [user, rouletteService]);

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

    if (existingSpin) {
      if (existingSpin.is_used) {
        showToast?.(`You have already redeemed your 1-time privilege voucher on Order #${existingSpin.used_order_ref || ""}.`);
      } else {
        const isExp = new Date(existingSpin.expires_at).getTime() < Date.now();
        if (isExp) {
          showToast?.("Your 1-time privilege voucher has expired after 7 days.");
        } else {
          showToast?.(`You already have an active privilege voucher: ${existingSpin.voucher_code}`);
        }
      }
      return;
    }

    const currentId = user?.email || user?.phone || localStorage.getItem("hanboro_roulette_customer_id");
    if (!currentId) {
      setShowIdentifierModal(true);
      return;
    }

    executeSpinWithIdentifier(currentId);
  };

  // Execute Spin with Verified Customer Identity (1-spin enforcement)
  const executeSpinWithIdentifier = async (identifier) => {
    if (isSpinning) return;

    // Check database to ensure no duplicate spins for this identifier
    if (rouletteService) {
      const found = await rouletteService.getSpinByIdentifier(identifier);
      if (found) {
        setExistingSpin(found);
        setWinningNumber(found.winning_pocket);
        setWinningColor(found.winning_color);
        setActiveReward({
          code: found.voucher_code,
          discount: found.discount_tier,
          label: found.discount_tier,
          desc: `Exclusive 1-Time Collector Privilege linked to ${found.customer_email || found.customer_phone || found.customer_identifier}`,
          expiresAt: found.expires_at,
          isUsed: found.is_used,
          usedOrderRef: found.used_order_ref,
          linkedTo: found.customer_email || found.customer_phone || found.customer_identifier,
        });
        showToast?.(`Retrieved your existing 1-time voucher: ${found.voucher_code}`);
        return;
      }
    }

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

    const isEmail = identifier.includes("@");
    const customerEmail = isEmail ? identifier : user?.email || "";
    const customerPhone = !isEmail ? identifier : user?.phone || "";

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

        // Record spin to Supabase internal audit log and generate 7-day single-use voucher
        let savedSpinRecord = null;
        if (rouletteService) {
          try {
            const spinRes = await rouletteService.recordSpin({
              user_id: user?.id || null,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              winning_pocket: targetNumber,
              winning_color: color,
              discount_tier: predefinedOutcome.discount,
              discount_type: predefinedOutcome.code.includes("1000") ? "flat" : "percent",
              discount_value: predefinedOutcome.code.includes("1000") ? 1000 : parseInt(codeTag, 10) || 10,
              voucher_code: uniqueVoucherCode,
            });
            savedSpinRecord = spinRes.spin;
            setExistingSpin(savedSpinRecord);
            localStorage.setItem("hanboro_roulette_customer_id", identifier);
          } catch (recErr) {
            console.warn("Could not record roulette spin:", recErr);
          }
        }

        const nowTime = new Date();
        const expiry = new Date(nowTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        setActiveReward({
          code: uniqueVoucherCode,
          discount: predefinedOutcome.discount,
          label: predefinedOutcome.label,
          desc: predefinedOutcome.desc,
          expiresAt: savedSpinRecord?.expires_at || expiry,
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

  const watchImgSrc = selectedVariant === "emerald" ? "/watch-emerald-roulette.webp" : "/watch-blue-roulette.webp";
  const watchSku = selectedVariant === "emerald" ? "emerald-roulette" : "blue-roulette";
  const daysLeft = activeReward?.expiresAt
    ? Math.max(0, Math.ceil((new Date(activeReward.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  return (
    <section className="stage-section stage-section--direct stage-section--roulette" id="roulette" aria-labelledby="roulette-title">
      {/* Section Header */}
      <div className="stage-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-index">03 / 03</span>
          <span className="stage-tag">MECHANICAL CASINO ROULETTE</span>
        </div>
        <h2 id="roulette-title" className="stage-title">
          DISCOVER YOUR <em>PRIVILEGE.</em>
        </h2>
        <p className="stage-subtitle">
          Interact with the Casino Roulette and reveal your exclusive Hanboro offer.
        </p>
      </div>

      {/* Main Interactive Stage Display */}
      <div className="roulette-interactive-stage" data-reveal data-reveal-delay="1">
        <div className="roulette-showcase-grid">
          
          {/* Left Column: Watch Specs & Variant Switcher */}
          <div className="roulette-specs-col">
            <span className="roulette-col-tag">HOROLOGICAL MECHANISM</span>
            <h3 className="roulette-col-heading">
              Kinetic <em>momentum.</em>
            </h3>

            <p className="roulette-col-desc">
              The customer spins the watch/roulette visually, but the discount should be limited to predefined outcomes.
            </p>

            {/* Edition Switcher */}
            <div className="roulette-variant-selector">
              <span className="variant-label">TIMEPIECE REFERENCE</span>
              <div className="variant-pills">
                <button
                  type="button"
                  className={`variant-pill ${selectedVariant === "emerald" ? "is-active" : ""}`}
                  onClick={() => setSelectedVariant("emerald")}
                >
                  <span className="variant-dot variant-dot--emerald" />
                  <span>Emerald Green Gold (REF. HBR-7704-EM)</span>
                </button>
                <button
                  type="button"
                  className={`variant-pill ${selectedVariant === "blue" ? "is-active" : ""}`}
                  onClick={() => setSelectedVariant("blue")}
                >
                  <span className="variant-dot variant-dot--blue" />
                  <span>Sapphire Blue Steel (REF. HBR-7705-BL)</span>
                </button>
              </div>
            </div>

            <ul className="roulette-points">
              <li><span className="roulette-bullet">•</span> 37 Enamel European Numbered Pockets</li>
              <li><span className="roulette-bullet">•</span> Free-Spinning Micro Ceramic Ball-Bearing Track</li>
              <li><span className="roulette-bullet">•</span> Double-Domed Curved 3D Sapphire Glass</li>
              <li><span className="roulette-bullet">•</span> Ergonomic 316L Tonneau Architecture</li>
            </ul>

            {/* Privilege Rules Summary */}
            <div className="privilege-rules-box">
              <div className="privilege-rules-title">Privilege Terms & Conditions</div>
              <ul className="privilege-rules-list">
                <li>• 1 unique voucher per user (linked to email/phone)</li>
                <li>• Voucher expires in 7 days • Single-use only</li>
                <li>• No stacking with other coupons • No cash alternative</li>
                <li>• Maximum discount strictly capped at 15%</li>
                <li>• Cancelled/returned orders don't generate replacement spin</li>
              </ul>
            </div>
          </div>

          {/* Center Column: Interactive Roulette Watch Dial Stage */}
          <div className="roulette-watch-center">
            <div className="roulette-watch-display">
              {/* Real Watch Base Image */}
              <img
                src={watchImgSrc}
                alt={`HANBORO ${selectedVariant === "emerald" ? "Emerald Rose Gold" : "Sapphire Blue"} Casino Roulette Watch`}
                className="roulette-watch-img"
                draggable={false}
              />

              {/* Realistic Kinetic Roulette Rotor Overlay on Dial Center */}
              <div className="roulette-rotor-container">
                <div
                  className={`roulette-rotor-disc ${isSpinning ? "is-spinning-fast" : ""}`}
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  <svg className="roulette-rotor-svg" viewBox="0 0 300 300" aria-hidden="true">
                    <defs>
                      <radialGradient id="rotorMetal" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#2a2a2e" />
                        <stop offset="60%" stopColor="#18181b" />
                        <stop offset="100%" stopColor="#0c0c0e" />
                      </radialGradient>
                      <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f5f2ed" />
                        <stop offset="50%" stopColor="#c0bbb4" />
                        <stop offset="100%" stopColor="#807b74" />
                      </linearGradient>
                    </defs>

                    {/* Outer Bezel */}
                    <circle cx="150" cy="150" r="146" fill="none" stroke="url(#goldRim)" strokeWidth="5" />
                    <circle cx="150" cy="150" r="140" fill="#08080a" />

                    {/* 37 Roulette Pockets */}
                    {ROULETTE_NUMBERS.map((num, i) => {
                      const angle = (i * 360) / 37;
                      const isZero = num === 0;
                      const isRed = !isZero && i % 2 === 0;
                      const fillColor = isZero ? "#008f4c" : isRed ? "#d91a1a" : "#121214";
                      const rad1 = ((angle - 90 - 180 / 37) * Math.PI) / 180;
                      const rad2 = ((angle - 90 + 180 / 37) * Math.PI) / 180;
                      const rOuter = 138;
                      const rInner = 82;

                      const x1 = 150 + rOuter * Math.cos(rad1);
                      const y1 = 150 + rOuter * Math.sin(rad1);
                      const x2 = 150 + rOuter * Math.cos(rad2);
                      const y2 = 150 + rOuter * Math.sin(rad2);
                      const x3 = 150 + rInner * Math.cos(rad2);
                      const y3 = 150 + rInner * Math.sin(rad2);
                      const x4 = 150 + rInner * Math.cos(rad1);
                      const y4 = 150 + rInner * Math.sin(rad1);

                      const numRad = ((angle - 90) * Math.PI) / 180;
                      const numR = 110;
                      const numX = 150 + numR * Math.cos(numRad);
                      const numY = 150 + numR * Math.sin(numRad);

                      return (
                        <g key={`pocket-${num}-${i}`}>
                          <path
                            d={`M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`}
                            fill={fillColor}
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth="0.8"
                          />
                          <text
                            x={numX}
                            y={numY}
                            fill="#ffffff"
                            fontSize="8.5"
                            fontWeight="800"
                            fontFamily="'Inter', sans-serif"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${angle}, ${numX}, ${numY})`}
                          >
                            {num}
                          </text>
                        </g>
                      );
                    })}

                    {/* Inner Hub & Four-Leaf Clover Axis */}
                    <circle cx="150" cy="150" r="78" fill="url(#rotorMetal)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    <circle cx="150" cy="150" r="54" fill="#050507" stroke="#fa2d1d" strokeWidth="1.2" />
                    
                    {/* Clover Turret Cone */}
                    <circle cx="150" cy="150" r="28" fill="#18181c" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                    <path
                      d="M 150 126 C 144 138 144 144 132 150 C 144 156 144 162 150 174 C 156 162 156 156 168 150 C 156 144 156 138 150 126 Z"
                      fill="#ffffff"
                      opacity="0.9"
                    />
                    <circle cx="150" cy="150" r="6" fill="#fa2d1d" />
                  </svg>
                </div>

                {/* Counter-Spinning Ceramic Roulette Ball */}
                <div
                  className={`roulette-ball-orbit ${isSpinning ? "is-spinning" : ""}`}
                  style={{ transform: `rotate(${ballRotation}deg)` }}
                >
                  <div className="roulette-ball-dot" />
                </div>
              </div>
            </div>

            {/* Main Spin Action CTA Button */}
            <div className="roulette-cta-wrap">
              <button
                type="button"
                className={`roulette-spin-btn ${isSpinning ? "is-spinning-active" : ""}`}
                onClick={handleInitiateSpin}
                disabled={isSpinning || Boolean(existingSpin)}
              >
                <svg className="spin-btn-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span className="spin-btn-label">
                  {isSpinning
                    ? "Spinning Rotor at 28,800 BPH..."
                    : existingSpin
                    ? "1-Time Spin Claimed"
                    : "Spin Casino Roulette"}
                </span>
              </button>

              <div className="roulette-spin-subtext">
                {existingSpin
                  ? `Voucher assigned to ${existingSpin.customer_email || existingSpin.customer_phone || existingSpin.customer_identifier}`
                  : "1 spin per customer • Linked to email/phone • Expires in 7 days"}
              </div>
            </div>
          </div>

          {/* Right Column: Always-Visible Live Discount Reward Card */}
          <div className="roulette-outcome-col">
            <span className="roulette-col-tag">COLLECTOR PRIVILEGE</span>
            
            <div className={`roulette-reward-card ${activeReward ? "is-unlocked" : isSpinning ? "is-spinning-state" : "is-locked"}`}>
              {activeReward ? (
                <div className="reward-unlocked-content">
                  <div className="reward-card-badge">
                    <span>
                      {winningNumber !== null ? `POCKET #${winningNumber} • ${winningColor?.toUpperCase()}` : "EXCLUSIVE PRIVILEGE"}
                    </span>
                  </div>

                  <h4 className="reward-card-title">{activeReward.discount}</h4>
                  <p className="reward-card-label">{activeReward.label}</p>
                  <p className="reward-card-desc">
                    {activeReward.desc}
                  </p>

                  {/* Promo Code Box with 1-Click Copy */}
                  <div className="reward-code-box">
                    <span className="code-tag">UNIQUE VOUCHER CODE</span>
                    <div className="code-row">
                      <span className="code-text">{activeReward.code}</span>
                      <button
                        type="button"
                        className="copy-code-btn"
                        onClick={() => handleCopyCode(activeReward.code)}
                      >
                        {copied ? "COPIED ✓" : "COPY CODE"}
                      </button>
                    </div>
                  </div>

                  {/* Validity and Status Details */}
                  <div className="reward-validity-bar">
                    <span className="validity-chip">
                      ⏳ {activeReward.isUsed ? "Redeemed" : `Valid for ${daysLeft} days`}
                    </span>
                    <span className="validity-chip validity-chip--secondary">
                      🔒 Single-use only
                    </span>
                  </div>

                  <div className="reward-action-buttons">
                    <button
                      type="button"
                      className="apply-code-cta"
                      onClick={onShopAll}
                    >
                      <span>Claim & Shop All Timepieces</span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>
              ) : isSpinning ? (
                <div className="reward-spinning-inner">
                  <div className="reward-spin-spinner">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="spin-btn-icon-svg">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                  </div>
                  <h4 className="reward-spinning-title">Spinning Kinetic Rotor...</h4>
                  <p className="reward-spinning-desc">
                    Calibre HB-RL07 rotating at 28,800 bph. Determining winning pocket and generating your unique 7-day privilege voucher...
                  </p>
                </div>
              ) : (
                <div className="reward-locked-content">
                  <div className="reward-card-badge reward-card-badge--preview">
                    <span>EXCLUSIVE OFFER</span>
                  </div>

                  <h4 className="reward-card-title">EXCLUSIVE PRIVILEGE</h4>
                  <p className="reward-card-label">COLLECTOR TIERS (MAX 15% OFF)</p>
                  <p className="reward-card-desc">
                    Spin the mechanical roulette rotor to reveal your exclusive Hanboro offer. 1 unique voucher per user, valid for 7 days.
                  </p>

                  <div className="reward-code-box reward-code-box--locked">
                    <span className="code-tag">VOUCHER CODE</span>
                    <div className="code-row">
                      <span className="code-text code-text--locked">HNB-PRIVILEGE</span>
                      <span className="code-locked-badge">SPIN TO ACTIVATE</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="reward-idle-trigger"
                    onClick={handleInitiateSpin}
                  >
                    Spin Roulette to Unlock ↘
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── CUSTOMER VERIFICATION MODAL FOR 1-SPIN ENFORCEMENT ── */}
        {showIdentifierModal && (
          <div className="roulette-modal-overlay" onClick={() => setShowIdentifierModal(false)}>
            <div className="roulette-modal-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="roulette-modal-close"
                onClick={() => setShowIdentifierModal(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <div className="roulette-modal-badge">1-TIME CUSTOMER PRIVILEGE</div>
              <h3 className="roulette-modal-title">Verify Your Collector Identity</h3>
              <p className="roulette-modal-desc">
                Each customer is entitled to <strong>one exclusive Roulette spin</strong>. Enter your email or mobile number to link your unique 7-day privilege voucher.
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
                  Verify & Spin Roulette →
                </button>
              </form>

              <div className="roulette-modal-footer">
                <span>🔒 Single-use voucher • Max 15% discount • Expires in 7 days</span>
              </div>
            </div>
          </div>
        )}

        {/* Technical Movement Specifications Strip */}
        <div className="movement-strip" data-reveal data-reveal-delay="2">
          <div className="movement-strip__label">ROULETTE HOROLOGICAL SPECIFICATIONS</div>
          <div className="movement-strip__grid">
            <div className="movement-spec">
              <span className="movement-spec__value">Automatic</span>
              <span className="movement-spec__key">Movement Type</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">HB-RL07</span>
              <span className="movement-spec__key">Calibre</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">48h</span>
              <span className="movement-spec__key">Power Reserve</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">28,800 bph</span>
              <span className="movement-spec__key">Frequency</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">25</span>
              <span className="movement-spec__key">Jewels</span>
            </div>
            <div className="movement-spec">
              <span className="movement-spec__value">Micro Ceramic</span>
              <span className="movement-spec__key">Ball Bearing Track</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "28px" }} data-reveal data-reveal-delay="3">
          <button
            type="button"
            className="view-all-skus-cta"
            onClick={() => onInspectSku && onInspectSku(watchSku)}
          >
            <span>Inspect Casino Roulette Dossier & Specs (REF. {selectedVariant === "emerald" ? "HBR-7704-EM" : "HBR-7705-BL"})</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CINEMATIC VIDEO HERO SECTION (Exact Match to Photo Layout + Apple Controls)
// ══════════════════════════════════════════════════════════════════════════════
function HeroVideoSection({ onDiscover }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Toggle video play / pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Toggle audio mute / unmute (Apple-style sound toggle)
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Pause video when scrolled out of viewport to free mobile/laptop decoders
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (video.paused && isPlaying) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [isPlaying]);

  return (
    <section className="hero-video-section" aria-label="Astonia Chronograph Video Showcase">
      {/* Full-bleed video background */}
      <div className="hero-video-container">
        <video
          ref={videoRef}
          className="hero-video-media"
          src="/Hanboro V1.mp4"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <div className="hero-video-overlay" aria-hidden="true" />
      </div>

      {/* Centered Typography & CTA — Exact Match to Reference Photo */}
      <div className="hero-photo-content">
        <span className="hero-photo-eyebrow">LIMITED EDITION</span>
        <h1 className="hero-photo-title">ASTONIA</h1>
        <p className="hero-photo-subtitle">A Swiss chronograph, Built for momentum.</p>
        <button
          type="button"
          className="hero-photo-cta"
          onClick={onDiscover}
        >
          Discover Astonia
        </button>
      </div>

      {/* Apple-Style Glassmorphism Play / Pause & Sound Video Controls */}
      <div className="apple-video-controls" role="toolbar" aria-label="Hero video controls">
        <button
          type="button"
          className={`apple-ctrl-btn ${isPlaying ? "is-playing" : "is-paused"}`}
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <rect x="5" y="4" width="4.5" height="16" rx="1.5" />
              <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M7 4.5v15c0 .85.92 1.38 1.66.95l12-7.5c.74-.46.74-1.44 0-1.9l-12-7.5C7.92 3.12 7 3.65 7 4.5z" />
            </svg>
          )}
        </button>

        <span className="apple-ctrl-divider" aria-hidden="true" />

        <button
          type="button"
          className={`apple-ctrl-btn ${!isMuted ? "is-active-sound" : ""}`}
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 5" fill="currentColor" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WATCH COLLECTION CAROUSEL LOOP (Directly after Hero Section)
// ══════════════════════════════════════════════════════════════════════════════
const WATCH_COLLECTION = [
  { id: "astroworld-celestial", name: "Astroworld Celestial Moon Rose Gold", img: "/watch-astroworld-moon-rosegold-front-transparent-thumb.webp" },
  { id: "astroworld-celestial-silver", name: "Astroworld Celestial Moon Silver", img: "/watch-astroworld-moon-silver-front-transparent-thumb.webp" },
  { id: "astroworld-tourbillon-black-dlc", name: "Astroworld Celestial Tourbillon Black DLC", img: "/watch-astroworld-tourbillon-dlc-front-transparent-thumb.webp" },
  { id: "astroworld-tourbillon-fluted-rosegold", name: "Astroworld Celestial Tourbillon Rose Gold", img: "/watch-astroworld-tourbillon-fluted-rosegold-front-transparent-thumb.webp" },
  { id: "astroworld-tourbillon-fluted-silver", name: "Astroworld Celestial Tourbillon Classic Silver", img: "/watch-astroworld-tourbillon-fluted-silver-front-transparent-thumb.webp" },
  { id: "volcano-glacier-compass-gold", name: "Volcano Glacier Compass Gold", img: "/watch-volcano-glacier-compass-gold-front-transparent-thumb.webp" },
  { id: "volcano-glacier-compass-rosegold", name: "Volcano Glacier Compass Rose Gold", img: "/watch-volcano-glacier-compass-rosegold-front-transparent-thumb.webp" },
  { id: "volcano-glacier-compass-silver", name: "Volcano Glacier Compass Silver", img: "/watch-volcano-glacier-compass-silver-front-transparent-thumb.webp" },
  { id: "supercar-engine-block-rosegold", name: "V12 Engine Supercar Rose Gold", img: "/watch-supercar-engine-block-rosegold-front-transparent-thumb.webp" },
  { id: "supercar-engine-block-silver", name: "V12 Engine Supercar Silver", img: "/watch-supercar-engine-block-silver-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-rosegold", name: "Casino Roulette Rose Gold", img: "/watch-casino-roulette-rosegold-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-silver", name: "Casino Roulette Classic Silver", img: "/watch-casino-roulette-silver-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-diamond-emerald", name: "Casino Roulette Baguette Diamond", img: "/watch-casino-roulette-diamond-emerald-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-sapphire-diamond", name: "Casino Roulette Blue Sapphire", img: "/watch-casino-roulette-sapphire-diamond-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-emerald-alligator", name: "Casino Roulette Imperial Emerald", img: "/watch-casino-roulette-emerald-alligator-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-ruby-diamond", name: "Casino Roulette Pigeon Blood Ruby", img: "/watch-casino-roulette-ruby-diamond-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-silver-diamond-emerald", name: "Casino Roulette Silver Diamond", img: "/watch-casino-roulette-silver-diamond-emerald-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-silver-sapphire-diamond", name: "Casino Roulette Silver Sapphire", img: "/watch-casino-roulette-silver-sapphire-diamond-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-silver-emerald-alligator", name: "Casino Roulette Silver Emerald", img: "/watch-casino-roulette-silver-emerald-alligator-front-transparent-thumb.webp" },
  { id: "casino-roulette-wheel-silver-ruby-diamond", name: "Casino Roulette Silver Ruby", img: "/watch-casino-roulette-silver-ruby-diamond-front-transparent-thumb.webp" },
  { id: "celestial-dragon-tourbillon-rosegold", name: "Celestial Dragon Tourbillon Rose Gold", img: "/watch-celestial-dragon-tourbillon-rosegold-front-transparent-thumb.webp" },
  { id: "celestial-dragon-tourbillon-silver", name: "Celestial Dragon Tourbillon Silver", img: "/watch-celestial-dragon-tourbillon-silver-front-transparent-thumb.webp" },
  { id: "planetary-cosmos-tourbillon-rosegold", name: "Planetary Cosmos Tourbillon Rose Gold", img: "/watch-planetary-cosmos-tourbillon-rosegold-front-transparent-thumb.webp" },
  { id: "planetary-cosmos-tourbillon-silver", name: "Planetary Cosmos Tourbillon Silver", img: "/watch-planetary-cosmos-tourbillon-silver-front-transparent-thumb.webp" },
  { id: "oceanic-diver-200m-green", name: "Oceanic Pro Diver 200M Emerald", img: "/watch-oceanic-diver-200m-green-front-transparent-thumb.webp" },
  { id: "seamaster-chronograph-diver-teal", name: "Seamaster Chronograph Diver Teal", img: "/watch-seamaster-chronograph-diver-teal-front-transparent-thumb.webp" },
  { id: "seamaster-chronograph-diver-olive", name: "Seamaster Chronograph Diver Olive", img: "/watch-seamaster-chronograph-diver-olive-front-transparent-thumb.webp" },
  { id: "seamaster-chronograph-diver-amber", name: "Seamaster Chronograph Diver Amber", img: "/watch-seamaster-chronograph-diver-amber-front-transparent-thumb.webp" },
  { id: "seamaster-chronograph-diver-violet", name: "Seamaster Chronograph Diver Violet", img: "/watch-seamaster-chronograph-diver-violet-front-transparent-thumb.webp" },
  { id: "mecha-cantilever-tourbillon-iceblue", name: "Mecha Cantilever Tourbillon Ice Blue", img: "/watch-mecha-cantilever-tourbillon-iceblue-front-transparent-thumb.webp" },
  { id: "world-map-tourbillon-rosegold", name: "World Map Tourbillon Rose Gold", img: "/watch-world-map-tourbillon-rosegold-front-transparent-thumb.webp" },
  { id: "world-map-tourbillon-blue", name: "World Map Tourbillon Royal Blue", img: "/watch-world-map-tourbillon-blue-front-transparent-thumb.webp" },
  { id: "world-map-tourbillon-silver", name: "World Map Tourbillon Silver", img: "/watch-world-map-tourbillon-silver-front-transparent-thumb.webp" },
  { id: "world-map-tourbillon-silver-dual", name: "World Map Tourbillon Silver Dual", img: "/watch-world-map-tourbillon-silver-dual-front-transparent-thumb.webp" },
  { id: "overseas-perpetual-skeleton-steel", name: "Overseas Perpetual Skeleton Steel", img: "/watch-overseas-perpetual-skeleton-steel-front-transparent-thumb.webp" },
  { id: "celestial-pilot-moonphase-black", name: "Celestial Pilot Moonphase Black", img: "/watch-celestial-pilot-moonphase-black-front-transparent-thumb.webp" },
  { id: "celestial-pilot-moonphase-rosegold", name: "Celestial Pilot Moonphase Rose Gold", img: "/watch-celestial-pilot-moonphase-rosegold-front-transparent-thumb.webp" },
  { id: "dual-hemispheres-moonphase-steel", name: "Dual Hemispheres Moonphase Steel", img: "/watch-dual-hemispheres-moonphase-steel-front-transparent-thumb.webp" },
  { id: "dual-hemispheres-moonphase-blue", name: "Dual Hemispheres Moonphase Blue", img: "/watch-dual-hemispheres-moonphase-blue-front-transparent-thumb.webp" },
  { id: "dual-hemispheres-moonphase-rosegold", name: "Dual Hemispheres Moonphase Rose Gold", img: "/watch-dual-hemispheres-moonphase-rosegold-front-transparent-thumb.webp" },
  { id: "sonnerie-bell-iceblue", name: "Mechanical Sonnerie Bell Ice Blue", img: "/watch-sonnerie-bell-iceblue-front-transparent-thumb.webp" },
  { id: "sonnerie-bell-blue", name: "Mechanical Sonnerie Bell Royal Blue", img: "/watch-sonnerie-bell-blue-front-transparent-thumb.webp" },
  { id: "cyber-cogwheel-skeleton-rosegold", name: "Cyber Cogwheel Skeleton Rose Gold", img: "/watch-cyber-cogwheel-skeleton-rosegold-front-transparent-thumb.webp" },
  { id: "cyber-cogwheel-skeleton-twotone", name: "Cyber Cogwheel Skeleton Two-Tone", img: "/watch-cyber-cogwheel-skeleton-twotone-front-transparent-thumb.webp" },
  { id: "cyber-cogwheel-skeleton-steel", name: "Cyber Cogwheel Skeleton Classic Steel", img: "/watch-cyber-cogwheel-skeleton-steel-front-transparent-thumb.webp" },
  { id: "sapphire-kanagawa-wave", name: "Great Wave Ocean Sapphire Tonneau", img: "/watch-sapphire-kanagawa-wave-front-transparent-thumb.webp" },
  { id: "stealth-fighter-jet-tonneau", name: "Stealth Fighter Jet Earth Diamond", img: "/watch-stealth-fighter-jet-front-transparent-thumb.webp" },
  { id: "sichuan-opera-diamond-tonneau", name: "Sichuan Opera Diamond Rose Gold", img: "/watch-sichuan-opera-diamond-front-transparent-thumb.webp" },
  { id: "sichuan-opera-diamond-steel", name: "Sichuan Opera Diamond Silver Steel", img: "/watch-sichuan-opera-steel-front-transparent-thumb.webp" },
  { id: "forged-carbon-tonneau-tourbillon", name: "Forged Carbon Damascus Lume", img: "/watch-forged-carbon-tonneau-front-transparent-thumb.webp" },
  { id: "forged-carbon-damascus-10atm", name: "Forged Carbon Damascus 100M", img: "/watch-forged-carbon-damascus-10atm-front-transparent-thumb.webp" },
  { id: "arctic-tonneau-10atm-white", name: "Arctic White Ceramic 100M", img: "/watch-arctic-tonneau-10atm-white-front-transparent-thumb.webp" },
  { id: "forged-carbon-ribbed-shield", name: "Forged Carbon Ribbed Shield", img: "/watch-forged-carbon-ribbed-shield-front-transparent-thumb.webp" },
  { id: "forged-carbon-ribbed-shield-blue", name: "Forged Carbon Ribbed Blue", img: "/watch-forged-carbon-ribbed-shield-blue-front-transparent-thumb.webp" },
  { id: "forged-carbon-ribbed-shield-green", name: "Forged Carbon Ribbed Green", img: "/watch-forged-carbon-ribbed-shield-green-front-transparent-thumb.webp" },
  { id: "forged-carbon-ribbed-shield-red", name: "Forged Carbon Ribbed Rosso Corsa", img: "/watch-forged-carbon-ribbed-shield-red-front-transparent-thumb.webp" },
  { id: "forged-carbon-ribbed-shield-white", name: "Forged Carbon Ribbed Arctic White", img: "/watch-forged-carbon-ribbed-shield-white-front-transparent-thumb.webp" },
  { id: "double-balance-cantilever-rosegold", name: "Twin-Turbine Double Balance Rose Gold", img: "/watch-double-balance-cantilever-rosegold-front-transparent-thumb.webp" },
  { id: "double-balance-cantilever-yellow", name: "Twin-Turbine Double Balance Yellow", img: "/watch-double-balance-cantilever-yellow-front-transparent-thumb.webp" },
  { id: "double-balance-cantilever-red", name: "Twin-Turbine Double Balance Red", img: "/watch-double-balance-cantilever-red-front-transparent-thumb.webp" },
  { id: "aurora-celestial-frost", name: "Aurora Celestial Frost Automatic", img: "/watch-aurora-celestial-frost-front-transparent-thumb.webp" },
  { id: "octagonal-diamond-celestial", name: "Royal Octagonal Diamond Celestial", img: "/watch-diamond-octagonal-front-transparent-thumb.webp" },
  { id: "octagonal-diamond-bronze", name: "Royal Octagonal Diamond Tobacco Bronze", img: "/watch-diamond-octagonal-bronze-front-transparent-thumb.webp" },
  { id: "octagonal-diamond-emerald", name: "Royal Octagonal Diamond Emerald Forest", img: "/watch-diamond-octagonal-green-front-transparent-thumb.webp" },
  { id: "arachnid-geometric-skeleton", name: "Arachnid Geometric Skeleton", img: "/watch-arachnid-geometric-front-transparent-thumb.webp" },
  { id: "cyber-green-skeleton", name: "Cyber Octagonal Neon Green", img: "/watch-cyber-green-skeleton-front-transparent-thumb.webp" },
  { id: "world-globe", name: "World Globe Tourbillon", img: "/watch-world-globe-thumb.webp" },
  { id: "architectural-skeleton-black", name: "Architectural Skeleton DLC", img: "/watch-architectural-skeleton-black-front-transparent-thumb.webp" },
  { id: "architectural-skeleton-rosegold", name: "Architectural Skeleton Two-Tone", img: "/watch-architectural-skeleton-rosegold-front-transparent-thumb.webp" },
  { id: "emerald", name: "Emerald Roulette Rose Gold", img: "/watch-emerald-roulette-thumb.webp" },
  { id: "arctic-tonneau", name: "Arctic Tonneau Skeleton", img: "/watch-arctic-tonneau-white-thumb.webp" },
  { id: "blue-roulette", name: "Sapphire Blue Roulette Automatic", img: "/watch-blue-roulette-thumb.webp" },
  { id: "orbital-moonphase", name: "Silver Moonphase Orbital", img: "/watch-orbital-moonphase-thumb.webp" },
  { id: "octagonal-blue", name: "Rose Gold Octagonal Blue Guilloché", img: "/watch-rosegold-octagonal-blue-thumb.webp" },
  { id: "powerreserve-black", name: "Power Reserve 35h Midnight", img: "/watch-powerreserve-midnight-front-transparent-thumb.webp" },
  { id: "powerreserve-silver", name: "Power Reserve 35h Classic Silver", img: "/watch-powerreserve-silver-front-transparent-thumb.webp" },
  { id: "powerreserve-opaline", name: "Power Reserve 35h Opaline Silver", img: "/watch-powerreserve-opaline-front-transparent-thumb.webp" },
  { id: "powerreserve-twotone", name: "Power Reserve 35h Two-Tone", img: "/watch-powerreserve-twotone-front-transparent-thumb.webp" },
  { id: "green-diver", name: "Green Emerald Diver Submariner", img: "/watch-green-diver-thumb.webp" },
  { id: "turquoise", name: "Turquoise Open-Heart Ring The Bell", img: "/watch-turquoise-ringbell-thumb.webp" }
];

function WatchCarouselSection({ onSelectProduct, onViewAllProducts }) {
  return (
    <section className="watch-carousel-section" id="collection" aria-labelledby="collection-title">
      <div className="carousel-section-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-tag">THE ESSENTIALS</span>
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
            {WATCH_COLLECTION.map((watch, index) => (
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
            {WATCH_COLLECTION.map((watch, index) => (
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

      {/* Direct CTA to All Products / SKUs Archive */}
      <div className="carousel-action-bar" data-reveal data-reveal-delay="2">
        <button
          type="button"
          className="view-all-skus-cta"
          onClick={onViewAllProducts}
        >
          <span>Explore All 81 Timepieces &amp; SKUs</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OFFICIAL STORE LOCATOR DIRECTORY DATA
// ══════════════════════════════════════════════════════════════════════════════
// OFFICIAL STORE LOCATOR DIRECTORY DATA
// ══════════════════════════════════════════════════════════════════════════════
const STORES_DATA = [
  {
    id: "nagpal-watches-delhi",
    name: "NAGPAL WATCHES",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    address: "16/29, Roop Nagar, Kamla Nagar, New Delhi – 110007",
    phone: "+91 11 4321 1234",
    phoneRaw: "+911143211234",
    hours: "10:30 AM – 8:30 PM (All Days)",
    image: "/store-nagpal-watches.jpg",
    mapUrl: "https://maps.google.com/?q=Nagpal+Watches+Kamla+Nagar+Delhi",
    type: "Authorized Hanboro Retailer",
    isFeatured: true
  },
  {
    id: "the-time-avenue-mumbai",
    name: "THE TIME AVENUE",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    address: "142, Turner Rd, near National College, Bandra West, Mumbai – 400050",
    phone: "+91 22 2640 5555",
    phoneRaw: "+912226405555",
    hours: "11:00 AM – 9:00 PM (All Days)",
    image: "/store-time-avenue.jpg",
    mapUrl: "https://maps.google.com/?q=The+Time+Avenue+Bandra+Mumbai",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "time-craft-bangalore",
    name: "TIME CRAFT",
    subtitle: "WATCH BOUTIQUE",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    address: "No. 88, Brigade Road, Ashok Nagar, Bengaluru – 560001",
    phone: "+91 80 4112 8899",
    phoneRaw: "+918041128899",
    hours: "10:30 AM – 8:30 PM (All Days)",
    image: "/store-time-craft.jpg",
    mapUrl: "https://maps.google.com/?q=Time+Craft+Brigade+Road+Bangalore",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "the-watch-gallery-hyderabad",
    name: "THE WATCH GALLERY",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    address: "Road No. 36, Jubilee Hills, near Peddamma Temple, Hyderabad – 500033",
    phone: "+91 40 6688 2244",
    phoneRaw: "+914066882244",
    hours: "11:00 AM – 9:00 PM (All Days)",
    image: "/store-watch-gallery.jpg",
    mapUrl: "https://maps.google.com/?q=The+Watch+Gallery+Jubilee+Hills+Hyderabad",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "ethos-chandigarh",
    name: "ETHOS BOUTIQUE",
    city: "Chandigarh",
    state: "Punjab",
    country: "India",
    address: "Elante Mall, 178-178A, Purv Marg, Industrial Area Phase I, Chandigarh – 160002",
    phone: "+91 172 466 2200",
    phoneRaw: "+911724662200",
    hours: "11:00 AM – 9:30 PM (All Days)",
    image: "/store-facade.jpg",
    mapUrl: "https://maps.google.com/?q=Ethos+Watches+Elante+Mall+Chandigarh",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "swiss-gallery-kolkata",
    name: "SWISS WATCH SALON",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    address: "Quest Mall, 33, Syed Amir Ali Ave, Park Circus, Kolkata – 700017",
    phone: "+91 33 2287 9000",
    phoneRaw: "+913322879000",
    hours: "10:30 AM – 8:30 PM (All Days)",
    image: "/store-interior.jpg",
    mapUrl: "https://maps.google.com/?q=Swiss+Watch+Gallery+Quest+Mall+Kolkata",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "time-collective-chennai",
    name: "THE TIME COLLECTIVE",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    address: "Express Avenue Mall, Club House Road, Royapettah, Chennai – 600002",
    phone: "+91 44 2846 4400",
    phoneRaw: "+914428464400",
    hours: "10:30 AM – 9:00 PM (All Days)",
    image: "/store-signage.jpg",
    mapUrl: "https://maps.google.com/?q=Express+Avenue+Chennai+Watches",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "horology-house-ahmedabad",
    name: "HOROLOGY HOUSE",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    address: "Sindhu Bhavan Marg, Bodakdev, Ahmedabad, Gujarat – 380054",
    phone: "+91 79 4001 8800",
    phoneRaw: "+917940018800",
    hours: "11:00 AM – 8:30 PM (All Days)",
    image: "/store-time-avenue.jpg",
    mapUrl: "https://maps.google.com/?q=Sindhu+Bhavan+Ahmedabad+Watches",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  },
  {
    id: "royal-chronos-lucknow",
    name: "ROYAL CHRONOS",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    address: "Phoenix Palassio, Sector 7, Gomti Nagar Extension, Lucknow – 226010",
    phone: "+91 522 667 3300",
    phoneRaw: "+915226673300",
    hours: "11:00 AM – 9:00 PM (All Days)",
    image: "/store-interior.jpg",
    mapUrl: "https://maps.google.com/?q=Phoenix+Palassio+Lucknow",
    type: "Authorized Hanboro Retailer",
    isFeatured: false
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// THREE.JS 3D INTERACTIVE DOTTED MATRIX GLOBE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
function InteractiveDottedGlobe() {
  const mountRef = useRef(null);
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0.22, y: -1.35, vx: 0, vy: 0.0016 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 2000);
    camera.position.set(0, 20, 480);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeRadius = 240;
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, -60, 0);
    globeGroup.rotation.x = rotRef.current.x;
    globeGroup.rotation.y = rotRef.current.y;
    scene.add(globeGroup);

    // 1. Deep black core sphere
    const coreGeo = new THREE.SphereGeometry(globeRadius * 0.988, 64, 64);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x050810,
      transparent: true,
      opacity: 0.96,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Helper: Circle glow dot texture
    const createDotTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.35, "rgba(240, 245, 255, 0.96)");
      grad.addColorStop(0.7, "rgba(200, 225, 255, 0.25)");
      grad.addColorStop(1, "rgba(200, 225, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    // Helper: lat/lon to vector3
    const latLonToVec3 = (lat, lon, r) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(r * Math.sin(phi) * Math.cos(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    // 2. Load continent land mask and generate exact dot matrix
    const mapImg = new Image();
    mapImg.crossOrigin = "anonymous";
    mapImg.src = "/world-map-mask.png";
    mapImg.onload = () => {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = mapImg.width;
      offCanvas.height = mapImg.height;
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(mapImg, 0, 0);
      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;

      const dotPositions = [];
      const dotColors = [];

      const rows = 160;
      for (let latIdx = 0; latIdx <= rows; latIdx++) {
        const lat = 90 - (latIdx / rows) * 180;
        const circumference = Math.cos((lat * Math.PI) / 180);
        const cols = Math.max(8, Math.floor(320 * circumference));

        for (let lonIdx = 0; lonIdx < cols; lonIdx++) {
          const lon = -180 + (lonIdx / cols) * 360;

          const px = Math.floor(((lon + 180) / 360) * offCanvas.width);
          const py = Math.floor(((90 - lat) / 180) * offCanvas.height);
          const idx = (py * offCanvas.width + px) * 4;

          if (imgData[idx] > 120) {
            const v = latLonToVec3(lat, lon, globeRadius + 0.6);
            dotPositions.push(v.x, v.y, v.z);

            // Radiant white for India, warm platinum for other continents
            if (lat > 7 && lat < 37 && lon > 67 && lon < 98) {
              dotColors.push(1.0, 1.0, 1.0);
            } else {
              dotColors.push(0.88, 0.90, 0.94);
            }
          }
        }
      }

      const dotsGeo = new THREE.BufferGeometry();
      dotsGeo.setAttribute("position", new THREE.Float32BufferAttribute(dotPositions, 3));
      dotsGeo.setAttribute("color", new THREE.Float32BufferAttribute(dotColors, 3));

      const dotsMat = new THREE.PointsMaterial({
        size: 3.6,
        vertexColors: true,
        map: createDotTexture(),
        transparent: true,
        opacity: 0.98,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const dotsMesh = new THREE.Points(dotsGeo, dotsMat);
      globeGroup.add(dotsMesh);
    };

    // 3. Interactive 3D Store Pins on Globe
    const pinGroup = new THREE.Group();
    globeGroup.add(pinGroup);

    const storePins = [
      { id: "haryana", name: "Haryana (Bahadurgarh & Karnal)", lat: 28.69, lon: 76.93 },
      { id: "mumbai", name: "Mumbai & Thane / Virar", lat: 19.07, lon: 72.87 },
      { id: "up", name: "Ghaziabad & Mathura, UP", lat: 28.64, lon: 77.37 },
      { id: "andhra", name: "Visakhapatnam, Tirupati, Nellore", lat: 14.44, lon: 79.97 },
      { id: "rajasthan", name: "Bhiwadi, Rajasthan", lat: 28.21, lon: 76.86 }
    ];

    const pinMeshes = [];
    storePins.forEach((pin) => {
      const pGroup = new THREE.Group();
      const pos = latLonToVec3(pin.lat, pin.lon, globeRadius + 1.4);
      pGroup.position.copy(pos);

      // Core red marker dot
      const dotGeo = new THREE.SphereGeometry(3.0, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xff2d1d });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      pGroup.add(dot);

      // Outer radar pulse ring
      const ringGeo = new THREE.RingGeometry(3.4, 6.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff2d1d,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.lookAt(pos.clone().multiplyScalar(2));
      pGroup.add(ring);

      pinGroup.add(pGroup);
      pinMeshes.push({ group: pGroup, ring, ringMat, pin });
    });

    // 4. Drag & Swipe Interaction (Full Unrestricted 360° Rotation)
    const onPointerDown = (e) => {
      isDraggingRef.current = true;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };
      rotRef.current.vx = 0;
      rotRef.current.vy = 0;
      if (container) container.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerRef.current.x;
      const dy = e.clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: e.clientX, y: e.clientY };

      rotRef.current.y += dx * 0.0055;
      rotRef.current.x += dy * 0.0055;

      rotRef.current.vx = dy * 0.0055;
      rotRef.current.vy = dx * 0.0055;
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      if (container) container.style.cursor = "grab";
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    // 5. Animation loop (Smooth continuous auto-spin with physics damping)
    let animId;
    let clock = 0;
    const animate = () => {
      clock += 0.035;

      if (!isDraggingRef.current) {
        rotRef.current.vy = rotRef.current.vy * 0.95 + 0.0016 * 0.05;
        rotRef.current.vx = rotRef.current.vx * 0.95;
        rotRef.current.y += rotRef.current.vy;
        rotRef.current.x += rotRef.current.vx;
      }

      rotRef.current.x = Math.max(-0.7, Math.min(0.7, rotRef.current.x));

      globeGroup.rotation.x = rotRef.current.x;
      globeGroup.rotation.y = rotRef.current.y;

      // Animate pin rings
      pinMeshes.forEach((item, idx) => {
        const pulse = (Math.sin(clock * 2.2 + idx * 1.2) + 1) / 2;
        const scale = 1 + pulse * 1.8;
        item.ring.scale.set(scale, scale, scale);
        item.ringMat.opacity = Math.max(0, 0.85 - pulse * 0.8);
      });

      renderer.render(scene, camera);
      if (isGlobeVisible) {
        animId = requestAnimationFrame(animate);
      }
    };

    let isGlobeVisible = true;
    const globeObserver = new IntersectionObserver(
      ([entry]) => {
        isGlobeVisible = entry.isIntersecting;
        if (isGlobeVisible) {
          cancelAnimationFrame(animId);
          animId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.05 }
    );
    globeObserver.observe(container);

    animate();

    return () => {
      cancelAnimationFrame(animId);
      globeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="interactive-globe-wrapper" ref={mountRef}>
      <div className="globe-stores-pill">
        <span className="globe-stores-dot" />
        <span>Stores across India</span>
      </div>
      <div className="globe-drag-indicator">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Drag to rotate globe</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEDICATED STORE LOCATOR PAGE COMPONENT (Exact Match to Design Reference)
// ══════════════════════════════════════════════════════════════════════════════


const CITY_FILTERS = [
  "ALL",
  "DELHI",
  "MUMBAI",
  "BANGALORE",
  "HYDERABAD",
  "CHANDIGARH",
  "KOLKATA",
  "CHENNAI",
  "AHMEDABAD"
];

function StoreLocatorView({ onNavigate, onOpenConcierge }) {
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStoreId, setActiveStoreId] = useState("nagpal-watches-delhi");
  const featuredCardRef = useRef(null);

  // Selected or active featured store
  const activeStore = STORES_DATA.find((s) => s.id === activeStoreId) || STORES_DATA[0];

  // Filtering logic
  const filteredStores = STORES_DATA.filter((store) => {
    const matchesCity =
      selectedCity === "ALL" || store.city.toUpperCase() === selectedCity;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      store.name.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      store.state.toLowerCase().includes(q) ||
      store.address.toLowerCase().includes(q);
    return matchesCity && matchesQuery;
  });

  const handleSelectCity = (cityUpper) => {
    setSelectedCity(cityUpper);
    if (cityUpper !== "ALL") {
      const match = STORES_DATA.find(
        (s) => s.city.toUpperCase() === cityUpper
      );
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
              Find Hanboro at an authorized retailer near you.
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
                  <span className="stat-card__number">28+</span>
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
          </div>

          {/* Right Column: Dotted Interactive Real India Map with Glowing City Nodes */}
          <div className="network-hero-right">
            <div className="network-map-wrap">
              <svg
                className="network-india-map-svg"
                viewBox={INDIA_MAP_VIEWBOX}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Map of authorized Hanboro retailers in India"
              >
                <defs>
                  {/* High-tech Halftone Dot Pattern */}
                  <pattern
                    id="indiaMeshPattern"
                    x="0"
                    y="0"
                    width="12"
                    height="12"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="3.5" cy="3.5" r="1.3" fill="rgba(255, 255, 255, 0.2)" />
                  </pattern>

                  {/* Pulsing Radial Glow Gradient */}
                  <radialGradient id="nodePulseGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fa2d1d" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#fa2d1d" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#fa2d1d" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Real India Geographic State Boundaries with Halftone Mesh Fill */}
                <g className="india-map-regions">
                  {INDIA_MAP_PATHS.map((region) => (
                    <path
                      key={region.id}
                      d={region.path}
                      fill="url(#indiaMeshPattern)"
                      stroke="rgba(255, 255, 255, 0.18)"
                      strokeWidth="0.85"
                      className="india-state-shape"
                    />
                  ))}
                </g>

                {/* City Location Pins & Text Labels */}
                {MAP_CITIES.map((city) => {
                  const isCityActive =
                    selectedCity === city.name ||
                    (selectedCity === "ALL" && activeStore?.city.toUpperCase() === city.name);

                  return (
                    <g
                      key={city.name}
                      className={`map-city-node ${isCityActive ? "is-city-active" : ""}`}
                      onClick={() => handleSelectCity(city.name)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${city.name} boutiques`}
                    >
                      {/* Pulsing Signal Red Rings */}
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r="14"
                        fill="url(#nodePulseGlow)"
                        className="node-ripple"
                      />
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r="4.5"
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
              {activeStore.city.toUpperCase()}, {activeStore.country?.toUpperCase() || "INDIA"}
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
      <section className="network-grid-section">
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
                    <p className="boutique-card__city">{store.city.toUpperCase()}</p>
                    <p className="boutique-card__tag">Authorized Hanboro Retailer</p>

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
    let isClockVisible = true;
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
        isClockVisible = entry.isIntersecting;
        if (isClockVisible) {
          cancelAnimationFrame(animId);
          animId = requestAnimationFrame(updateTime);
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      clockObserver.observe(containerRef.current);
    }

    animId = requestAnimationFrame(updateTime);
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
  const { user, isAdmin, cartCount, openAuthModal, setIsCartOpen } = useStore();
  const [visible, setVisible] = useState(true);
  const [view, setView] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith("#admin")) return "admin";
    if (hash.startsWith("#checkout")) return "checkout";
    if (hash.startsWith("#profile") || hash.startsWith("#account") || hash.startsWith("#dossier")) return "profile";
    if (hash.startsWith("#stores")) return "stores";
    if (hash.startsWith("#sku/") || hash.startsWith("#product/") || hash.startsWith("#products") || hash.startsWith("#archive")) {
      return "products";
    }
    return "home";
  });
  const [selectedSkuId, setSelectedSkuId] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith("#sku/")) return hash.replace("#sku/", "").trim();
    if (hash.startsWith("#product/")) return hash.replace("#product/", "").trim();
    return null;
  });

  useScrollReveal(visible, view, selectedSkuId);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith("#admin")) {
        setView("admin");
        setSelectedSkuId(null);
      } else if (hash.startsWith("#checkout")) {
        setView("checkout");
        setSelectedSkuId(null);
      } else if (hash.startsWith("#profile") || hash.startsWith("#account") || hash.startsWith("#dossier")) {
        setView("profile");
        setSelectedSkuId(null);
      } else if (hash.startsWith("#stores")) {
        setView("stores");
        setSelectedSkuId(null);
      } else if (hash.startsWith("#sku/")) {
        setView("products");
        setSelectedSkuId(hash.replace("#sku/", "").trim());
      } else if (hash.startsWith("#product/")) {
        setView("products");
        setSelectedSkuId(hash.replace("#product/", "").trim());
      } else if (hash.startsWith("#products") || hash.startsWith("#archive") || hash.startsWith("#timepieces")) {
        setView("products");
        setSelectedSkuId(null);
      } else if (hash === "#home" || hash === "#top" || !hash || hash.startsWith("#collection") || hash.startsWith("#lookbook") || hash.startsWith("#packaging") || hash.startsWith("#contact")) {
        setView("home");
        setSelectedSkuId(null);
      }
    };
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);

  const navigateTo = (newView, hashTarget) => {
    setView(newView);
    setMenuOpen(false);
    if (newView !== "products") {
      setSelectedSkuId(null);
    }
    if (hashTarget) {
      window.location.hash = hashTarget;
      if (newView === "home") {
        window.scrollTo({ top: 0, behavior: "instant" });
        setTimeout(() => {
          if (hashTarget !== "#top" && hashTarget !== "#home") {
            const el = document.querySelector(hashTarget);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 50);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOpenSku = (skuOrId) => {
    setSelectedSkuId(skuOrId);
    setMenuOpen(false);
    setView("products");
    window.location.hash = `#sku/${skuOrId}`;
  };

  return (
    <main className={["site", visible ? "site--visible" : ""].filter(Boolean).join(" ")} id="top">
      {/* ── LUXURY HEADER (Exact Match to Photo Reference) ── */}
      {view === "stores" || view === "admin" || view === "profile" || view === "checkout" ? null : (
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

          {/* Right: Minimal Icons (Stores, Account / Profile, Bag with badge) */}
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

            {/* Account / User Button */}
            <button
              type="button"
              className={`luxury-header__icon-btn luxury-header__user-btn ${user ? "is-logged-in" : ""}`}
              onClick={() => {
                if (user) {
                  navigateTo("profile", "#profile");
                } else {
                  openAuthModal("signin");
                }
              }}
              aria-label={user ? `Account Profile: ${user.fullName || user.email}` : "Client Sign In"}
              title={user ? `Signed in as ${user.fullName || user.email} (View Vault Profile)` : "Client Login / Register"}
            >
              {user ? (
                <span className="header-avatar-circle">
                  {(user.fullName || user.email || "H").charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
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
      />
      <aside
        className={`luxury-drawer ${menuOpen ? "is-open" : ""}`}
        aria-label="Site navigation menu"
        aria-hidden={!menuOpen}
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
            <span className="drawer-link-text">Shop All</span>
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
            className={`luxury-drawer__link ${view === "profile" ? "is-active" : ""}`}
            onClick={() => {
              setMenuOpen(false);
              if (user) {
                navigateTo("profile", "#profile");
              } else {
                openAuthModal("signin");
              }
            }}
          >
            <span className="drawer-link-text">
              {user ? `Private Dossier (${user.fullName?.split(" ")[0] || "Profile"})` : "Client Sign In / Register"}
            </span>
            <span className="drawer-link-arrow">👤</span>
          </button>

          <button
            type="button"
            className="luxury-drawer__link"
            onClick={() => {
              setMenuOpen(false);
              setIsCartOpen(true);
            }}
          >
            <span className="drawer-link-text">Atelier Bag ({cartCount})</span>
            <span className="drawer-link-arrow">🛍️</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`luxury-drawer__link ${view === "admin" ? "is-active" : ""}`}
              onClick={() => navigateTo("admin", "#admin")}
            >
              <span className="drawer-link-text">Staff Dashboard</span>
              <span className="drawer-link-arrow">⚙️</span>
            </button>
          )}
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

      {view === "admin" ? (
        <AdminDashboard onNavigateHome={() => navigateTo("home", "#top")} />
      ) : view === "checkout" ? (
        <CheckoutPage onNavigate={(targetView, hash) => navigateTo(targetView, hash)} />
      ) : view === "profile" ? (
        <ProfilePage onNavigate={(targetView, hash) => navigateTo(targetView, hash)} />
      ) : view === "stores" ? (
        <StoreLocatorView
          onNavigate={(targetView, hash) => navigateTo(targetView, hash)}
          onOpenConcierge={() => navigateTo("home", "#contact")}
        />
      ) : selectedSkuId ? (
        <ProductDetailPage
          skuId={selectedSkuId}
          onNavigateBack={() => {
            setSelectedSkuId(null);
            navigateTo("products", "#products");
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
          {/* ── CINEMATIC VIDEO HERO SECTION ONLY (Exact match to photo + Apple controls) ── */}
          <HeroVideoSection onDiscover={() => navigateTo("products", "#products")} />

          {/* ── WATCH COLLECTION CAROUSEL LOOP (Just after Hero) ── */}
          <WatchCarouselSection
            onSelectProduct={handleOpenSku}
            onViewAllProducts={() => navigateTo("products", "#products")}
          />

          {/* ── STAGE 01: HAUTE HORLOGERIE LOOKBOOK & CATALOG ── */}
      <section className="stage-section stage-section--direct" id="lookbook" aria-labelledby="lookbook-title">
        <div className="stage-header" data-reveal>
          <div className="stage-meta">
            <span className="stage-index">01 / 03</span>
            <span className="stage-tag">EDITORIAL LOOKBOOK</span>
          </div>
          <h2 id="lookbook-title" className="stage-title">Where time becomes <em>art.</em></h2>
          <p className="stage-subtitle">
            The official Hanboro Lookbook. Experience our heritage, Swiss-inspired design, and fine horological precision.
          </p>
        </div>

        <div className="direct-stage-display" data-reveal data-reveal-delay="1">
          <img
            src="/lookbook-spread-1.png"
            alt="HANBORO luxury watch open editorial catalog — Pages 01 and 02"
            className="direct-stage__img direct-stage__img--brochure"
            loading="lazy"
          />
        </div>

        {/* Stage 01 Editorial Pillars Grid */}
        <div className="stage-editorial-grid" data-reveal data-reveal-delay="2">
          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">01</span>
              <span className="editorial-card__tag">HERITAGE</span>
            </div>
            <h3 className="editorial-card__title">Swiss Inspiration & Design</h3>
            <p className="editorial-card__desc">
              Alpine horological mastery married to futuristic tonneau geometry and openworked mechanics.
            </p>
          </div>

          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">02</span>
              <span className="editorial-card__tag">PHILOSOPHY</span>
            </div>
            <h3 className="editorial-card__title">Crafted for Visionaries</h3>
            <p className="editorial-card__desc">
              Engineered for those who move with distinct purpose, commanding momentum and timeless presence.
            </p>
          </div>

          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">03</span>
              <span className="editorial-card__tag">ATELIER</span>
            </div>
            <h3 className="editorial-card__title">Artisan Assembly</h3>
            <p className="editorial-card__desc">
              Hand-finished movement bridges, high-frequency balance wheels, and exposed synthetic ruby bearings.
            </p>
          </div>

          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">04</span>
              <span className="editorial-card__tag">VISION</span>
            </div>
            <h3 className="editorial-card__title">Time as Modern Art</h3>
            <p className="editorial-card__desc">
              Sculptural wrist architecture designed to transform each passing second into an expressive statement.
            </p>
          </div>
        </div>
      </section>

      {/* ── STAGE 02: CLOVER KING DAY vs NIGHT INTERACTIVE REVEAL ── */}
      <CloverKingExperience onInspectSku={handleOpenSku} />

      {/* ── STAGE 03: MECHANICAL CASINO ROULETTE WATCH & DISCOUNT CEREMONY ── */}
      <CasinoRouletteExperience
        onInspectSku={handleOpenSku}
        onShopAll={() => navigateTo("products", "#products")}
      />

      {/* ── STATEMENT: HAUTE HORLOGERIE PHILOSOPHY ── */}
      <section className="statement" id="approach">
        <p className="eyebrow" data-reveal>HAUTE HORLOGERIE PHILOSOPHY</p>
        <p className="statement__line" data-reveal data-reveal-delay="1">
          Every Hanboro timepiece is an encounter with mechanical mastery — sculpted from forged carbon, high-grade titanium, and sapphire crystal to make time an art form.
        </p>
      </section>

      {/* ── ATELIER PILLARS & DIRECT EXPLORATION ── */}
      <section className="work" id="work" aria-labelledby="work-title">
        <div className="work__heading" data-reveal>
          <p className="eyebrow">HAUTE HORLOGERIE ATELIER</p>
          <h2 id="work-title">Artistry in<br/>every <em>calibre.</em></h2>
          <p className="work__subdesc">
            Explore the signature complications, kinetic innovations, and material engineering that define the Hanboro collection.
          </p>
          <button
            type="button"
            className="view-all-skus-cta"
            style={{ marginTop: "24px" }}
            onClick={() => navigateTo("products", "#products")}
          >
            <span>Explore All 81 Complications</span>
            <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="work__list">
          {/* Card 01: Tourbillons & Dual Balance */}
          <article
            className="project project--red"
            data-reveal
            data-reveal-delay="1"
            onClick={() => navigateTo("products", "#products")}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
          >
            <span>01</span>
            <div>
              <p>AVANT-GARDE COMPLICATIONS</p>
              <h3>Twin-Turbine & Tourbillon Calibres</h3>
              <div className="project__detail">
                Synchronized dual-balance cantilever escapements operating at 28,800 BPH with 3D open-worked titanium bridges.
              </div>
            </div>
            <span className="project-arrow" aria-label="Explore Dual Balance">↗</span>
          </article>

          {/* Card 02: Casino & Clover Complications */}
          <article
            className="project project--white"
            data-reveal
            data-reveal-delay="2"
            onClick={() => {
              const el = document.getElementById("roulette");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
          >
            <span>02</span>
            <div>
              <p>KINETIC MECHANISMS</p>
              <h3>Roulette & Clover Day/Night Dials</h3>
              <div className="project__detail">
                Patented 37-pocket micro-bearing rotors and luminescent Swiss Super-LumiNova dual daylight/night transitions.
              </div>
            </div>
            <span className="project-arrow" aria-label="Explore Roulette Mechanism">↘</span>
          </article>

          {/* Card 03: Materials & Warranty */}
          <article
            className="project project--black"
            data-reveal
            data-reveal-delay="3"
            onClick={() => navigateTo("stores", "#stores")}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
          >
            <span>03</span>
            <div>
              <p>PRECISION & PRIVILEGE</p>
              <h3>Damascus Carbon & Boutique Warranty</h3>
              <div className="project__detail">
                High-density forged carbon, double-domed sapphire crystal, 100M water resistance, and 2-Year International Atelier Warranty.
              </div>
            </div>
            <span className="project-arrow" aria-label="Visit Boutique Network">↗</span>
          </article>
        </div>
      </section>
        </>
      )}



      {view !== "admin" && view !== "profile" && view !== "checkout" && view !== "stores" && (
        <footer className="footer" id="contact">
          <div className="footer__top-wrap">
            <div className="footer__main-col">
              <p className="eyebrow" data-reveal>Have a moment?</p>
              <a className="footer__email" href="mailto:connect@hanborowatches.in" data-reveal data-reveal-delay="1">
                connect@hanborowatches.in
              </a>

              <div className="footer__address" data-reveal data-reveal-delay="2">
                <p className="eyebrow">Studio Location</p>
                <address className="footer__address-text">
                  M5 M-Block, DLF Phase-2, Sector 25<br />
                  Gurgaon, Haryana 122002, India
                </address>
              </div>

              <div className="footer__address" data-reveal data-reveal-delay="2">
                <p className="eyebrow">Call Us</p>
                <a className="footer__phone" href="tel:+918882069334">+91 88820 69334</a>
              </div>
            </div>

            <div className="footer__clock-col" data-reveal data-reveal-delay="1">
              <FooterLiveClock />
            </div>
          </div>

          <div className="footer__bottom" data-reveal data-reveal-delay="3">
            <HanboroLogo size={20} theme="light" />
            <span>© 2026 HANBORO</span>
            {isAdmin && (
              <a
                href="#admin"
                className="footer-admin-portal-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("admin", "#admin");
                }}
              >
                Atelier Owner Portal ↗
              </a>
            )}
            <a href="#top">Back to top ↑</a>
          </div>
        </footer>
      )}

      {/* ── LUXURY MODALS & DRAWERS ── */}
      <AuthModal />
      <CartDrawer />
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   APP — orchestrates: idle → exiting → entered
   Iris wipe transition effect & Store Provider
══════════════════════════════════════════════════════════════════════════════ */
export function App() {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const hasDirectRoute = Boolean(hash && hash !== "#top" && hash !== "#home");
  const [phase, setPhase]     = useState(hasDirectRoute ? "entered" : "idle");     // idle / exiting / entered
  const [iris, setIris]       = useState("off");      // off / expanding / retracting
  const transitioned          = useRef(hasDirectRoute);

  const handleComplete = useCallback(() => {
    if (transitioned.current && phase === "entered") return;
    transitioned.current = true;

    // 1. Start splash exit + iris expand simultaneously
    setPhase("exiting");
    setIris("expanding");

    // 2. At iris peak → mount website + start iris retract
    setTimeout(() => {
      setPhase("entered");
      setIris("retracting");
    }, IRIS_EXPAND);

    // 3. Iris done → hide it
    setTimeout(() => {
      setIris("off");
    }, IRIS_EXPAND + IRIS_RETRACT);
  }, [phase]);

  // Failsafe auto-transition: guarantee the site opens even on slow devices or background tabs
  useEffect(() => {
    if (phase === "entered") return;
    const timer = setTimeout(() => {
      handleComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [phase, handleComplete]);

  return (
    <ErrorBoundary>
      <StoreProvider>
        <div className="app-root">
          {phase !== "entered" && (
            <Splash onEnter={handleComplete} exiting={phase === "exiting"}/>
          )}
          {phase === "entered" && (
            <Website />
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
