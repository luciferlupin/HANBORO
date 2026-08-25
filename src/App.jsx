import { useCallback, useEffect, useRef, useState } from "react";

const REVOLUTION_MS = 1800; // ms per full clock sweep revolution
const IRIS_EXPAND   = 460;  // ms: smooth iris expansion
const IRIS_RETRACT  = 540;  // ms: smooth iris retraction

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
export function HanboroLogo({ size = 28 }) {
  return (
    <div className="hanboro-logo" style={{ height: size }}>
      <img
        src="/hanboro-horizontal-dark.png"
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
        cbRef.current?.();
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
    >
      <div className="splash__grain"/>
      <div className="splash__header">
        <div className="s-wordmark">
          <HanboroLogo theme="light" size={26} />
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
function CloverKingExperience() {
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
          {/* Left Column: Day Specs (Matching Hero Section Coolness) */}
          <div className="apple-spec-col apple-spec-col--day">
            <span className="apple-spec-tag">DAYLIGHT EXPRESSION</span>
            <h3 className="apple-spec-heading">
              Defiant by <em>daylight.</em>
            </h3>
            <p className="apple-spec-desc">
              Sculpted in anodized signal red. Engineered to expose the kinetic heart of the four-leaf clover automatic caliber with absolute Swiss precision.
            </p>

            <div className="apple-feature-list">
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">01 /</span> Sculpted Tonneau Case
                </span>
                <span className="apple-feat-sub">Ultra-lightweight ergonomic curve with hex-socket structural bolts</span>
              </div>
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">02 /</span> Double-Domed Sapphire
                </span>
                <span className="apple-feat-sub">Diamond-knife crafted with 7-layer anti-reflective treatment</span>
              </div>
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">03 /</span> Kinetic Clover Caliber
                </span>
                <span className="apple-feat-sub">Open-worked balance wheel, Swiss gear train & exposed rubies</span>
              </div>
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">04 /</span> Fluororubber Strap
                </span>
                <span className="apple-feat-sub">Ventilated ergonomic comfort with butterfly spring deployment</span>
              </div>
            </div>
          </div>

          {/* Center Column: Interactive Split Comparison Watch (Glow reveals from Left to Right) */}
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
              {/* Background Layer: Day Watch (Signal Red Base) */}
              <div className="watch-layer watch-layer--day">
                <img
                  src="/clover-king-day.png"
                  alt="HANBORO Clover King Daytime Mechanical Expression"
                  className="watch-img"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>

              {/* Foreground Layer: Night Watch (Luminous Green Glow revealed from Left to Right) */}
              <div
                className="watch-layer watch-layer--night"
                style={{ clipPath: `inset(0 ${100 - glowProgress}% 0 0)` }}
              >
                <img
                  src="/clover-king-night.png"
                  alt="HANBORO Clover King Night Luminous Expression"
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

          {/* Right Column: Night Specs (Matching Hero Section Coolness) */}
          <div className="apple-spec-col apple-spec-col--night">
            <span className="apple-spec-tag apple-spec-tag--green">LUMINOUS NIGHT EXPRESSION</span>
            <h3 className="apple-spec-heading apple-spec-heading--green">
              Alive after <em>dark.</em>
            </h3>
            <p className="apple-spec-desc apple-spec-desc--green">
              High-charge Swiss Super-LumiNova Grade X1 radiates through zero light, illuminating the iconic clover silhouette and carbon fibers.
            </p>

            <div className="apple-feature-list apple-feature-list--green">
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">01 /</span> Luminous Carbon Bezel
                </span>
                <span className="apple-feat-sub">Micro-fiber grain glows in vibrant electric green under darkness</span>
              </div>
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">02 /</span> Lume Clover Bridges
                </span>
                <span className="apple-feat-sub">12 & 6 bridges and clover petals radiate commanding presence</span>
              </div>
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">03 /</span> Skeleton Lume Hands
                </span>
                <span className="apple-feat-sub">High-contrast instant legibility across all midnight angles</span>
              </div>
              <div className="apple-feature-item">
                <span className="apple-feat-title">
                  <span className="apple-feat-num">04 /</span> 50M Water Seal
                </span>
                <span className="apple-feat-sub">Pressure-tested for daily sport & aquatic atmospheric durability</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Slider Track */}
        <div className="clover-slider-row">
          <div className="slider-labels-top">
            <span className="slider-lbl">DAY {dayPct}%</span>
            <span className="slider-mid">DRAG TO REVEAL GLOW</span>
            <span className="slider-lbl slider-lbl--green">NIGHT {nightPct}%</span>
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

          <div className="slider-readout">
            DAY {dayPct}% &nbsp;/&nbsp; NIGHT {nightPct}%
          </div>
        </div>

        {/* Technical Precision Engine Specs Bar */}
        <div className="stage-specs-bar clover-specs-bar" data-reveal data-reveal-delay="2">
          <div className="spec-pill"><span>Caliber</span><strong>Nishitetsu 8N24 Automatic (21 Jewels)</strong></div>
          <div className="spec-pill"><span>Frequency</span><strong>21,600 VPH • 42h Power Reserve</strong></div>
          <div className="spec-pill"><span>Precision</span><strong>±5 Sec/Day • Amplitude &gt;250</strong></div>
          <div className="spec-pill"><span>Functions</span><strong>Hacking Stop-Second & Dual Winding</strong></div>
        </div>
      </div>
    </section>
  );
}

function Website({ onRestart }) {
  const [visible, setVisible] = useState(false);
  useScrollReveal(visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className={["site", visible ? "site--visible" : ""].filter(Boolean).join(" ")} id="top">
      <header className="site__header">
        <a href="#top" aria-label="Hanboro home" className="site__brand">
          <HanboroLogo theme="dark" size={28} />
        </a>
        <nav aria-label="Primary navigation" className="site__nav">
          <a href="#lookbook">Lookbook</a>
          <a href="#interactive">Clover King</a>
          <a href="#packaging">Unboxing</a>
          <a href="#approach">Approach</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="header__cta-btn" href="mailto:connect@hanborowatches.in">
          <span>Inquire Now</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow h-eyebrow">Independent creative direction</p>
          <h1 id="hero-title" className="h-h1">Make time<br/><em>matter.</em></h1>
          <p className="hero__description h-desc">HANBORO shapes striking identities and digital experiences for brands that refuse to stand still.</p>
          <a className="primary-link h-cta" href="#contact">Start a conversation <span aria-hidden="true">↘</span></a>
        </div>
      </section>

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

        <div className="stage-specs-bar" data-reveal data-reveal-delay="2">
          <div className="spec-pill"><span>Heritage</span><strong>Swiss Inspiration & Design</strong></div>
          <div className="spec-pill"><span>Philosophy</span><strong>Crafted for Visionaries</strong></div>
          <div className="spec-pill"><span>Atelier</span><strong>Artisan Movement Assembly</strong></div>
          <div className="spec-pill"><span>Vision</span><strong>Time Crafted For You</strong></div>
        </div>
      </section>

      {/* ── STAGE 02: CLOVER KING DAY vs NIGHT INTERACTIVE REVEAL ── */}
      <CloverKingExperience />

      {/* ── STAGE 03: BESPOKE PACKAGING & SKELETON TIMEPIECE ── */}
      <section className="stage-section stage-section--direct" id="packaging" aria-labelledby="packaging-title">
        <div className="stage-header" data-reveal>
          <div className="stage-meta">
            <span className="stage-index">03 / 03</span>
            <span className="stage-tag">THE UNBOXING CEREMONY</span>
          </div>
          <h2 id="packaging-title" className="stage-title">Bespoke <em>presentation.</em></h2>
          <p className="stage-subtitle">
            Crafted for the collector. Each Hanboro Celestial Tourbillon timepiece arrives presented in a piano-black lacquered wooden presentation vault with circular port glass, matte outer gift sleeve, and serialized owner passport.
          </p>
        </div>

        <div className="direct-stage-display" data-reveal data-reveal-delay="1">
          <img
            src="/hanboro-luxury-packaging.png"
            alt="HANBORO Celestial Tourbillon Timepiece presented with piano-black lacquered presentation vault and outer gift sleeve"
            className="direct-stage__img direct-stage__img--packaging"
            loading="lazy"
          />
        </div>

        <div className="stage-specs-bar" data-reveal data-reveal-delay="2">
          <div className="spec-pill"><span>Complication</span><strong>3D Celestial Globe & Tourbillon</strong></div>
          <div className="spec-pill"><span>Vault</span><strong>Piano-Black Lacquer Box</strong></div>
          <div className="spec-pill"><span>Display</span><strong>Circular Port Viewing Lid</strong></div>
          <div className="spec-pill"><span>Passport</span><strong>Serialized Warranty Card</strong></div>
        </div>
      </section>

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

      <footer className="footer" id="contact">
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

        <div className="footer__bottom" data-reveal data-reveal-delay="3">
          <HanboroLogo size={20} />
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
      {phase !== "idle" && (
        <Website visible={phase === "entered"}/>
      )}
      {/* Iris transition overlay */}
      {iris !== "off" && (
        <div className={`iris iris--${iris}`} aria-hidden="true"/>
      )}
    </div>
  );
}
