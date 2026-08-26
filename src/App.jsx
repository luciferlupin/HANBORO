import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ProductsView } from "./ProductsView";
import { ProductDetailPage } from "./ProductDetailPage";
import { PRODUCTS_DATA, getProductByIdOrSku } from "./productsData";
import { INDIA_MAP_VIEWBOX, MAP_CITIES, INDIA_MAP_PATHS } from "./indiaMapData";

const REVOLUTION_MS = 1800; // ms per full clock sweep revolution
const IRIS_EXPAND   = 480;  // ms: smooth iris expansion
const IRIS_RETRACT  = 560;  // ms: smooth iris retraction

/* ── scroll-reveal hook ────────────────────────────────────────────────────── */
function useScrollReveal(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    
    // Mark immediate in-viewport elements
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add("is-visible");
      }
    });

    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.05, rootMargin: "100px" }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);
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

const ROULETTE_REWARD_5PCT = {
  label: "5% COLLECTOR PRIVILEGE",
  code: "HANBORO5",
  discount: "5% OFF",
  desc: "5% Exclusive Collector Privilege applied across all Hanboro Timepiece Complications"
};

function CasinoRouletteExperience({ onInspectSku, onShopAll }) {
  const [selectedVariant, setSelectedVariant] = useState("emerald"); // 'emerald' | 'blue'
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [activeReward, setActiveReward] = useState(null);
  const [winningNumber, setWinningNumber] = useState(null);
  const [winningColor, setWinningColor] = useState(null);
  const [copied, setCopied] = useState(false);
  const animFrameRef = useRef(null);

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

  const spinRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setActiveReward(null);
    setCopied(false);

    const pocketCount = ROULETTE_NUMBERS.length;
    const targetIndex = Math.floor(Math.random() * pocketCount);
    const targetNumber = ROULETTE_NUMBERS[targetIndex];
    const color = targetNumber === 0 ? "green" : targetIndex % 2 === 0 ? "red" : "black";

    // Always award 5% discount
    const reward = ROULETTE_REWARD_5PCT;

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

    const animateSpin = (now) => {
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
        setActiveReward(reward);
        playWinSound();
      }
    };

    animFrameRef.current = requestAnimationFrame(animateSpin);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const watchImgSrc = selectedVariant === "emerald" ? "/watch-emerald-roulette.png" : "/watch-blue-roulette.png";
  const watchSku = selectedVariant === "emerald" ? "emerald-roulette" : "blue-roulette";

  return (
    <section className="stage-section stage-section--direct stage-section--roulette" id="roulette" aria-labelledby="roulette-title">
      {/* Section Header */}
      <div className="stage-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-index">03 / 03</span>
          <span className="stage-tag">MECHANICAL CASINO ROULETTE</span>
        </div>
        <h2 id="roulette-title" className="stage-title">
          The Casino Roulette <em>ceremony.</em>
        </h2>
        <p className="stage-subtitle">
          Experience the kinetic mechanical wonder of the Hanboro Roulette timepiece. Press the button below to spin the internal ball-bearing rotor and unlock your privileged collector discount.
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
              Natural wrist acceleration activates a 37-pocket European roulette wheel mounted on ultra-low-friction ceramic micro ball-bearings beneath curved sapphire crystal.
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
                onClick={spinRoulette}
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
                Natural wrist kinetic action • Guaranteed collector voucher allocation
              </div>
            </div>
          </div>

          {/* Right Column: Live Outcome / Discount Reward Card */}
          {/* Right Column: Always-Visible Live Discount Reward Card */}
          <div className="roulette-outcome-col">
            <span className="roulette-col-tag">COLLECTOR PRIVILEGE</span>
            
            <div className={`roulette-reward-card ${activeReward ? "is-unlocked" : isSpinning ? "is-spinning-state" : "is-locked"}`}>
              {activeReward ? (
                <div className="reward-unlocked-content">
                  <div className="reward-card-badge">
                    <span>POCKET #{winningNumber} • {winningColor?.toUpperCase()}</span>
                  </div>

                  <h4 className="reward-card-title">5% OFF</h4>
                  <p className="reward-card-label">5% COLLECTOR PRIVILEGE</p>
                  <p className="reward-card-desc">
                    5% Exclusive Collector Privilege applied across all Hanboro Timepiece Complications.
                  </p>

                  {/* Promo Code Box with 1-Click Copy */}
                  <div className="reward-code-box">
                    <span className="code-tag">VOUCHER CODE</span>
                    <div className="code-row">
                      <span className="code-text">HANBORO5</span>
                      <button
                        type="button"
                        className="copy-code-btn"
                        onClick={() => handleCopyCode("HANBORO5")}
                      >
                        {copied ? "COPIED ✓" : "COPY CODE"}
                      </button>
                    </div>
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
                    <button
                      type="button"
                      className="spin-again-btn"
                      onClick={spinRoulette}
                    >
                      Spin Again ↻
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
                    Calibre HB-RL07 rotating at 28,800 bph. Determining lucky winning pocket and discount voucher.
                  </p>
                </div>
              ) : (
                <div className="reward-locked-content">
                  <div className="reward-card-badge reward-card-badge--preview">
                    <span>GUARANTEED • 5% OFF</span>
                  </div>

                  <h4 className="reward-card-title">5% OFF</h4>
                  <p className="reward-card-label">COLLECTOR PRIVILEGE</p>
                  <p className="reward-card-desc">
                    Spin the mechanical roulette rotor on the left to activate your official Hanboro 5% collector discount code.
                  </p>

                  <div className="reward-code-box reward-code-box--locked">
                    <span className="code-tag">VOUCHER CODE</span>
                    <div className="code-row">
                      <span className="code-text code-text--locked">HANBORO5</span>
                      <span className="code-locked-badge">SPIN TO ACTIVATE</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="reward-idle-trigger"
                    onClick={spinRoulette}
                  >
                    Spin Roulette to Unlock ↘
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

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
    setIsMuted(nextMuted);
    // If paused, ensure it continues playing when unmuted
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

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
          preload="auto"
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
  { id: "astroworld-celestial", name: "Astroworld Celestial Tourbillon", img: "/watch-astroworld-celestial.png" },
  { id: "world-globe", name: "World Globe Tourbillon", img: "/watch-world-globe.png" },
  { id: "emerald", name: "Emerald Roulette Rose Gold", img: "/watch-emerald-roulette.png" },
  { id: "arctic-tonneau", name: "Arctic Tonneau Skeleton", img: "/watch-arctic-tonneau-white.png" },
  { id: "blue-roulette", name: "Sapphire Blue Roulette Automatic", img: "/watch-blue-roulette.png" },
  { id: "orbital-moonphase", name: "Silver Moonphase Orbital", img: "/watch-orbital-moonphase.png" },
  { id: "octagonal-blue", name: "Rose Gold Octagonal Blue Guilloché", img: "/watch-rosegold-octagonal-blue.png" },
  { id: "purple-chrono", name: "Purple Sunray Chronograph Diver", img: "/watch-purple-chronograph.png" },
  { id: "powerreserve", name: "Power Reserve 35h Automatic", img: "/watch-powerreserve-black.png" },
  { id: "green-diver", name: "Green Emerald Diver Submariner", img: "/watch-green-diver.png" },
  { id: "turquoise", name: "Turquoise Open-Heart Ring The Bell", img: "/watch-turquoise-ringbell.png" }
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
                title={`Inspect ${watch.name}`}
                role="button"
                tabIndex={0}
              >
                <img
                  src={watch.img}
                  alt={watch.name}
                  className="watch-float-img"
                  loading="lazy"
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
                title={`Inspect ${watch.name}`}
                role="button"
                tabIndex={0}
              >
                <img
                  src={watch.img}
                  alt={watch.name}
                  className="watch-float-img"
                  loading="lazy"
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
          <span>Explore All 15 Timepieces & SKUs</span>
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
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
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
            className="network-nav-link"
            onClick={() => onNavigate && onNavigate("home", "#lookbook")}
          >
            LOOKBOOK
          </button>
          <button
            type="button"
            className="network-nav-link"
            onClick={() => onNavigate && onNavigate("home", "#roulette")}
          >
            UNBOXING
          </button>
          <button
            type="button"
            className="network-nav-link is-active"
            onClick={() => onNavigate && onNavigate("stores", "#stores")}
          >
            STORE LOCATOR
            <span className="network-nav-indicator" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="network-nav-link"
            onClick={() => onNavigate && onNavigate("home", "#contact")}
          >
            CONTACT
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
  const hourHandRef = useRef(null);
  const minHandRef = useRef(null);
  const secHandRef = useRef(null);

  useEffect(() => {
    let animId;
    const updateTime = () => {
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

    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="footer-live-clock-wrap" aria-label="Real-time precision outline clock">
      <svg className="footer-clock-svg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <filter id="redSecGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Clean Horology Outline Bezel & Chapter Track */}
        <circle
          cx="50"
          cy="50"
          r="47.5"
          fill="none"
          stroke="rgba(245, 242, 237, 0.25)"
          strokeWidth="1.2"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(245, 242, 237, 0.08)"
          strokeWidth="0.6"
          strokeDasharray="1 2.5"
        />
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="rgba(250, 45, 29, 0.18)"
          strokeWidth="0.5"
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
                ? "rgba(245, 242, 237, 0.85)"
                : "rgba(245, 242, 237, 0.25)"
            }
            strokeWidth={t.isCardinal ? 1.4 : t.isHour ? 1.1 : 0.6}
            strokeLinecap="round"
          />
        ))}

        {/* Cardinal Numerals: 12, 3, 6, 9 */}
        <text x="50" y="21" textAnchor="middle" fill="rgba(245, 242, 237, 0.9)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.02em">12</text>
        <text x="81" y="52" textAnchor="middle" fill="rgba(245, 242, 237, 0.9)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">3</text>
        <text x="50" y="82.5" textAnchor="middle" fill="rgba(245, 242, 237, 0.9)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">6</text>
        <text x="19" y="52" textAnchor="middle" fill="rgba(245, 242, 237, 0.9)" fontSize="5.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace">9</text>

        {/* Subtle Hanboro Wordmark */}
        <text x="50" y="36" textAnchor="middle" fill="rgba(245, 242, 237, 0.45)" fontSize="3.2" fontWeight="700" letterSpacing="0.16em" fontFamily="'Inter', sans-serif">HANBORO</text>
        <text x="50" y="65" textAnchor="middle" fill="rgba(250, 45, 29, 0.7)" fontSize="2.6" fontWeight="600" letterSpacing="0.12em" fontFamily="'JetBrains Mono', monospace">AUTOMATIC</text>

        {/* Hour Hand (Baton Sword) */}
        <g ref={hourHandRef}>
          <line x1="50" y1="54" x2="50" y2="28" stroke="#f5f2ed" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="50" y1="52" x2="50" y2="30" stroke="#08080a" strokeWidth="0.8" strokeLinecap="round" />
        </g>

        {/* Minute Hand (Tapered Baton) */}
        <g ref={minHandRef}>
          <line x1="50" y1="56" x2="50" y2="18" stroke="#f5f2ed" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="50" y1="54" x2="50" y2="20" stroke="#fa2d1d" strokeWidth="0.6" strokeLinecap="round" />
        </g>

        {/* Second Hand (Signal Red Sweep with counterweight) */}
        <g ref={secHandRef}>
          <line x1="50" y1="60" x2="50" y2="12" stroke="#fa2d1d" strokeWidth="0.85" strokeLinecap="round" filter="url(#redSecGlow)" />
          <circle cx="50" cy="58" r="1.4" fill="#fa2d1d" />
        </g>

        {/* Center Cap & Jewel Pivot */}
        <circle cx="50" cy="50" r="2.6" fill="#f5f2ed" stroke="#08080a" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="1.2" fill="#fa2d1d" />
      </svg>
    </div>
  );
}

function Website({ onRestart }) {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState(() => {
    const hash = window.location.hash.toLowerCase();
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

  useScrollReveal(visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 120);
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith("#stores")) {
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
      }
    };
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      clearTimeout(timer);
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
        setTimeout(() => {
          const el = document.querySelector(hashTarget);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 80);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
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
      {view === "stores" ? null : (
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

          {/* Right: Minimal Icons (Search, Account / Stores, Bag) */}
          <div className="luxury-header__actions">
            <button
              type="button"
              className="luxury-header__icon-btn"
              onClick={() => navigateTo("products", "#products")}
              aria-label="Search timepieces"
              title="Search Timepieces"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button
              type="button"
              className="luxury-header__icon-btn"
              onClick={() => navigateTo("stores", "#stores")}
              aria-label="Find a Boutique"
              title="Boutiques & Stores"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            <button
              type="button"
              className="luxury-header__icon-btn luxury-header__bag-btn"
              onClick={() => navigateTo("products", "#products")}
              aria-label="Shop all timepieces collection"
              title="Shop All"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
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
          <HanboroLogo theme="light" size={22} />
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
            <span className="drawer-link-arrow">↗</span>
          </button>

          <button
            type="button"
            className="luxury-drawer__link"
            onClick={() => navigateTo("home", "#contact")}
          >
            <span className="drawer-link-text">Contact</span>
            <span className="drawer-link-arrow">↗</span>
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

      {view === "stores" ? (
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

      <section className="statement" id="approach">
        <p className="eyebrow" data-reveal>The right moment, designed</p>
        <p className="statement__line" data-reveal data-reveal-delay="1">We build the pause that gets noticed, the signal that creates momentum, and the system that keeps it moving.</p>
      </section>

      <section className="work" id="work" aria-labelledby="work-title">
        <div className="work__heading" data-reveal>
          <p className="eyebrow">Selected momentum</p>
          <h2 id="work-title">Ideas made<br/>to <em>move.</em></h2>
        </div>
        <div className="work__list">
          <article className="project project--red" data-reveal data-reveal-delay="1">
            <span>01</span>
            <div><p>BRAND DIRECTION</p><h3>New frequency</h3></div>
            <a href="#contact" aria-label="Discuss New frequency">↗</a>
          </article>
          <article className="project project--white" data-reveal data-reveal-delay="2">
            <span>02</span>
            <div><p>DIGITAL EXPERIENCE</p><h3>Better, faster</h3></div>
            <a href="#contact" aria-label="Discuss Better, faster">↗</a>
          </article>
          <article className="project project--black" data-reveal data-reveal-delay="3">
            <span>03</span>
            <div><p>CAMPAIGN SYSTEM</p><h3>All eyes forward</h3></div>
            <a href="#contact" aria-label="Discuss All eyes forward">↗</a>
          </article>
        </div>
      </section>
        </>
      )}



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
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   APP — orchestrates: idle → exiting → entered
   Iris wipe transition effect
══════════════════════════════════════════════════════════════════════════════ */
export function App() {
  const [phase, setPhase]     = useState("idle");     // idle / exiting / entered
  const [iris, setIris]       = useState("off");      // off / expanding / retracting
  const transitioned          = useRef(false);

  const handleComplete = useCallback(() => {
    if (transitioned.current) return;
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
  }, []);

  return (
    <div className="app-root">
      {phase !== "entered" && (
        <Splash onEnter={handleComplete} exiting={phase === "exiting"}/>
      )}
      {phase === "entered" && (
        <Website visible={true}/>
      )}
      {/* Iris transition overlay */}
      {iris !== "off" && (
        <div className={`iris iris--${iris}`} aria-hidden="true"/>
      )}
    </div>
  );
}
