import { useCallback, useEffect, useRef, useState } from "react";

const REVOLUTION_MS = 1800; // ms per full clock sweep revolution
const IRIS_EXPAND   = 460;  // ms: smooth iris expansion
const IRIS_RETRACT  = 540;  // ms: smooth iris retraction

/* ── scroll-reveal hook ────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
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
// REAL 3D FLIPPING LOOKBOOK COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
function LookbookBook() {
  const [spread, setSpread] = useState(1); // 1 = pages 1-2, 2 = pages 3-4
  const [isFlipping, setIsFlipping] = useState(false);

  const flipForward = () => {
    if (spread === 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setSpread(2);
        setIsFlipping(false);
      }, 700);
    }
  };

  const flipBackward = () => {
    if (spread === 2 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setSpread(1);
        setIsFlipping(false);
      }, 700);
    }
  };

  return (
    <div className="lookbook-stage" data-reveal data-reveal-delay="1">
      {/* 3D Book Container */}
      <div className={`book-3d ${isFlipping ? "is-flipping" : ""} spread-${spread}`}>
        {/* Left Side of the Open Book */}
        <div
          className="book-page-leaf book-page-leaf--left"
          onClick={flipBackward}
          title={spread === 2 ? "Click to flip back to Pages 01-02" : "Page 01"}
        >
          <img
            src={spread === 1 ? "/lookbook-p1.png" : "/lookbook-p3.png"}
            alt={spread === 1 ? "HANBORO Lookbook Page 01: Swiss Essence" : "HANBORO Lookbook Page 03: The Collection"}
            className="book-page-img"
            loading="lazy"
          />
          {spread === 2 && (
            <button className="page-turn-hint page-turn-hint--left" onClick={(e) => { e.stopPropagation(); flipBackward(); }} aria-label="Turn to previous page">
              <span>❮ Flip to Page 01-02</span>
            </button>
          )}
        </div>

        {/* Central Book Spine Shadow */}
        <div className="book-spine" aria-hidden="true" />

        {/* Right Side of the Open Book */}
        <div
          className="book-page-leaf book-page-leaf--right"
          onClick={flipForward}
          title={spread === 1 ? "Click to flip to Pages 03-04" : "Page 04"}
        >
          <img
            src={spread === 1 ? "/lookbook-p2.png" : "/lookbook-p4.png"}
            alt={spread === 1 ? "HANBORO Lookbook Page 02: Our Story" : "HANBORO Lookbook Page 04: Orbita-980-1"}
            className="book-page-img"
            loading="lazy"
          />
          {spread === 1 && (
            <button className="page-turn-hint page-turn-hint--right" onClick={(e) => { e.stopPropagation(); flipForward(); }} aria-label="Turn to next page">
              <span>Flip to Page 03-04 ❯</span>
            </button>
          )}
        </div>

        {/* Dynamic 3D Flipping Sheet (animates during page turn) */}
        {isFlipping && (
          <div className={`flipping-leaf ${spread === 1 ? "flipping-leaf--forward" : "flipping-leaf--backward"}`}>
            <div className="flipping-leaf__front">
              <img src={spread === 1 ? "/lookbook-p2.png" : "/lookbook-p1.png"} alt="Flipping page front" />
              <div className="page-lighting-shadow page-lighting-shadow--front" />
            </div>
            <div className="flipping-leaf__back">
              <img src={spread === 1 ? "/lookbook-p3.png" : "/lookbook-p4.png"} alt="Flipping page back" />
              <div className="page-lighting-shadow page-lighting-shadow--back" />
            </div>
          </div>
        )}
      </div>

      {/* Book Navigation Toolbar */}
      <div className="book-controls">
        <button
          className={`book-nav-btn ${spread === 1 ? "is-disabled" : ""}`}
          onClick={flipBackward}
          disabled={spread === 1 || isFlipping}
          aria-label="Previous page spread"
        >
          <span aria-hidden="true">❮</span> Previous Page
        </button>

        <div className="book-page-counter">
          <span className="page-badge">
            {spread === 1 ? "PAGES 01 — 02" : "PAGES 03 — 04"}
          </span>
          <span className="page-sub">
            {spread === 1 ? "BRAND ESSENCE & STORY" : "THE COLLECTION & ORBITA"}
          </span>
        </div>

        <button
          className={`book-nav-btn ${spread === 2 ? "is-disabled" : ""}`}
          onClick={flipForward}
          disabled={spread === 2 || isFlipping}
          aria-label="Next page spread"
        >
          Next Page <span aria-hidden="true">❯</span>
        </button>
      </div>

      {/* Dynamic Spec Pills matching active spread */}
      <div className="stage-specs-bar" data-reveal data-reveal-delay="2">
        {spread === 1 ? (
          <>
            <div className="spec-pill"><span>Heritage</span><strong>Swiss Inspiration & Design</strong></div>
            <div className="spec-pill"><span>Philosophy</span><strong>Crafted for Visionaries</strong></div>
            <div className="spec-pill"><span>Atelier</span><strong>Artisan Movement Assembly</strong></div>
            <div className="spec-pill"><span>Vision</span><strong>Time Crafted For You</strong></div>
          </>
        ) : (
          <>
            <div className="spec-pill"><span>Flagship</span><strong>Orbita-980-1 Skeleton</strong></div>
            <div className="spec-pill"><span>Caliber</span><strong>Automatic Open-Worked Movement</strong></div>
            <div className="spec-pill"><span>Material</span><strong>18k Rose Gold & Titanium</strong></div>
            <div className="spec-pill"><span>Glass</span><strong>Sapphire Anti-Reflective</strong></div>
          </>
        )}
      </div>
    </div>
  );
}

function Website({ onRestart }) {
  const [visible, setVisible] = useState(false);

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

      {/* ── STAGE 01: HAUTE HORLOGERIE LOOKBOOK & CATALOG (REAL 3D FLIPPING BOOK) ── */}
      <section className="stage-section stage-section--direct" id="lookbook" aria-labelledby="lookbook-title">
        <div className="stage-header" data-reveal>
          <div className="stage-meta">
            <span className="stage-index">01 / 02</span>
            <span className="stage-tag">EDITORIAL LOOKBOOK</span>
          </div>
          <h2 id="lookbook-title" className="stage-title">Where time becomes <em>art.</em></h2>
          <p className="stage-subtitle">
            Flip through the official Hanboro Lookbook. Experience our heritage, collection, and precision horology.
          </p>
        </div>

        <LookbookBook />
      </section>

      {/* ── STAGE 02: BESPOKE PACKAGING & SKELETON TIMEPIECE ── */}
      <section className="stage-section stage-section--direct" id="packaging" aria-labelledby="packaging-title">
        <div className="stage-header" data-reveal>
          <div className="stage-meta">
            <span className="stage-index">02 / 02</span>
            <span className="stage-tag">THE UNBOXING CEREMONY</span>
          </div>
          <h2 id="packaging-title" className="stage-title">Bespoke <em>presentation.</em></h2>
          <p className="stage-subtitle">
            Crafted for the collector. Each Hanboro timepiece arrives in custom matte black presentation packaging with hand-braided cords and technical blueprint passport.
          </p>
        </div>

        <div className="direct-stage-display" data-reveal data-reveal-delay="1">
          <img
            src="/hanboro-bag-transparent.png"
            alt="HANBORO luxury packaging shopping bag and rose gold skeleton tourbillon"
            className="direct-stage__img direct-stage__img--packaging"
            loading="lazy"
          />
        </div>

        <div className="stage-specs-bar" data-reveal data-reveal-delay="2">
          <div className="spec-pill"><span>Vault</span><strong>Matte Black Magnetic Box</strong></div>
          <div className="spec-pill"><span>Protection</span><strong>Hand-Stitched Suede Pillow</strong></div>
          <div className="spec-pill"><span>Passport</span><strong>Laser-Engraved Warranty Card</strong></div>
          <div className="spec-pill"><span>Care</span><strong>Microfiber Polishing Cloth</strong></div>
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
