import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

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
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3D SPATIAL HERO WATCHES DATASET (COKECAN SPATIAL EXPERIENCE)
// ══════════════════════════════════════════════════════════════════════════════
// HERO SECTION INTERACTIVE 3D WATCH SHOWCASE (WATCH ANIMATION ONLY)
// ══════════════════════════════════════════════════════════════════════════════
const HERO_WATCH_IMAGES = [
  { id: "emerald-roulette", image: "/watch-emerald-roulette.png", name: "Clover King Emerald Roulette" },
  { id: "octagonal-blue", image: "/watch-rosegold-octagonal-blue.png", name: "Royal Octagonal Blue" },
  { id: "astroworld-celestial", image: "/watch-astroworld-celestial.png", name: "Astroworld Celestial Tourbillon" },
  { id: "arctic-tonneau", image: "/watch-arctic-tonneau-white.png", name: "Arctic Tonneau Skeleton" },
  { id: "blue-roulette", image: "/watch-blue-roulette.png", name: "Sapphire Blue Roulette" },
  { id: "world-globe", image: "/watch-world-globe.png", name: "World Time Celestial Globe" }
];

function HeroWatchShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const handleSelectWatch = useCallback((index) => {
    if (index === currentIndexRef.current || index < 0 || index >= HERO_WATCH_IMAGES.length) return;
    setCurrentIndex(index);
  }, []);

  const handlePrev = useCallback(() => {
    const nextIdx = (currentIndexRef.current - 1 + HERO_WATCH_IMAGES.length) % HERO_WATCH_IMAGES.length;
    handleSelectWatch(nextIdx);
  }, [handleSelectWatch]);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndexRef.current + 1) % HERO_WATCH_IMAGES.length;
    handleSelectWatch(nextIdx);
  }, [handleSelectWatch]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const isMobile = width < 768;
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const updateCameraView = (w, h) => {
      const asp = w / h;
      camera.aspect = asp;
      const mob = w < 768;
      const zPos = mob ? (asp < 1.0 ? 11.6 : 10.4) : (asp < 1.25 ? 10.2 : 9.5);
      camera.position.set(0, mob ? 0.08 : 0, zPos);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    updateCameraView(width, height);

    // Natural studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    // Pure clean watch meshes with soft ground shadow
    const textureLoader = new THREE.TextureLoader();
    const watchMeshes = [];
    const watchCount = HERO_WATCH_IMAGES.length;

    const getSlotTransform = (slot) => {
      const mob = container ? container.clientWidth < 768 : false;
      if (slot === 0) {
        return { x: 0, y: mob ? 0.08 : -0.05, z: 1.2, scale: mob ? 1.22 : 1.28 };
      }
      const sign = Math.sign(slot);
      const n = Math.abs(slot);
      if (n === 1) {
        return {
          x: sign * (mob ? 1.65 : 1.95),
          y: (mob ? 0.08 : -0.05) + 0.04,
          z: -0.25,
          scale: mob ? 0.82 : 0.88
        };
      }
      if (n === 2) {
        return {
          x: sign * (mob ? 2.75 : 3.25),
          y: (mob ? 0.08 : -0.05) + 0.08,
          z: -1.4,
          scale: mob ? 0.56 : 0.62
        };
      }
      return {
        x: sign * (mob ? 3.5 : 4.1),
        y: (mob ? 0.08 : -0.05) + 0.12,
        z: -2.6,
        scale: 0.38
      };
    };

    HERO_WATCH_IMAGES.forEach((watchData, i) => {
      const watchGroup = new THREE.Group();
      watchGroup.userData = { index: i };

      const texture = textureLoader.load(watchData.image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;

      const faceGeo = new THREE.PlaneGeometry(2.35, 3.52);
      const faceMat = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xaaaaaa,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      watchGroup.add(faceMesh);

      // Subtle soft grounding shadow
      const shadowGeo = new THREE.CircleGeometry(1.2, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.28
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -1.95;
      watchGroup.add(shadowMesh);

      let slot = i - currentIndexRef.current;
      if (slot > 3) slot -= watchCount;
      if (slot < -3) slot += watchCount;
      const initialSlot = getSlotTransform(slot);
      watchGroup.position.set(initialSlot.x, initialSlot.y, initialSlot.z);
      watchGroup.scale.set(initialSlot.scale, initialSlot.scale, initialSlot.scale);
      watchGroup.rotation.set(0, 0, 0);

      scene.add(watchGroup);
      watchMeshes.push({
        group: watchGroup,
        index: i
      });
    });

    let isDragging = false;
    let dragStartTime = 0;
    let dragStartPos = { x: 0, y: 0 };
    let dragDeltaX = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      isDragging = true;
      dragStartTime = Date.now();
      const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      dragStartPos = { x: cx, y: cy };
      dragDeltaX = 0;
    };

    const onPointerMove = (e) => {
      const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      if (isDragging) {
        dragDeltaX = cx - dragStartPos.x;
      }
    };

    const onPointerUp = (e) => {
      isDragging = false;
      const cx = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 0;
      const cy = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || 0;
      const dragDist = Math.hypot(cx - dragStartPos.x, cy - dragStartPos.y);
      const dragDuration = Date.now() - dragStartTime;

      if (Math.abs(dragDeltaX) > 50 && dragDuration < 400) {
        if (dragDeltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
        return;
      }

      if (dragDist < 8 && dragDuration < 280) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          watchMeshes.map((w) => w.group),
          true
        );

        if (intersects.length > 0) {
          let hitGroup = intersects[0].object;
          while (hitGroup.parent && hitGroup.parent !== scene) {
            hitGroup = hitGroup.parent;
          }
          const hitIdx = hitGroup.userData && hitGroup.userData.index;
          if (hitIdx !== undefined && hitIdx !== currentIndexRef.current) {
            handleSelectWatch(hitIdx);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      updateCameraView(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);

    let animId;
    let clock = 0;
    const animate = () => {
      clock += 0.025;
      const activeIdx = currentIndexRef.current;
      watchMeshes.forEach((w) => {
        let slot = w.index - activeIdx;
        if (slot > 3) slot -= watchCount;
        if (slot < -3) slot += watchCount;

        const target = getSlotTransform(slot);
        let bobY = 0;
        if (slot === 0) {
          bobY = Math.sin(clock * 1.8) * 0.07;
        }

        w.group.position.x += (target.x - w.group.position.x) * 0.1;
        w.group.position.y += (target.y + bobY - w.group.position.y) * 0.1;
        w.group.position.z += (target.z - w.group.position.z) * 0.1;

        const s = w.group.scale.x;
        const nextScale = s + (target.scale - s) * 0.1;
        w.group.scale.set(nextScale, nextScale, nextScale);

        w.group.rotation.set(0, 0, 0);
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [handlePrev, handleNext, handleSelectWatch]);

  return (
    <div className="hero__watch-stage">
      <div className="hero__watch-canvas-wrap" ref={containerRef} />
    </div>
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

function WatchCarouselSection() {
  return (
    <section className="watch-carousel-section" id="collection" aria-labelledby="collection-title">
      <div className="carousel-section-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-tag">THE ESSENTIALS</span>
        </div>
        <h2 id="collection-title" className="carousel-heading">
          HANBORO <em>collection.</em>
        </h2>
      </div>

      {/* Apple-Grade Seamless Tiling Endless Marquee */}
      <div className="carousel-track-wrapper" data-reveal data-reveal-delay="1">
        <div className="carousel-track">
          <div className="carousel-group">
            {WATCH_COLLECTION.map((watch, index) => (
              <div className="watch-float-item" key={`a-${watch.id}-${index}`}>
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
              <div className="watch-float-item" key={`b-${watch.id}-${index}`}>
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
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OFFICIAL STORE LOCATOR DIRECTORY DATA
// ══════════════════════════════════════════════════════════════════════════════
const STORES_DATA = [
  {
    id: "time-planet-bahadurgarh",
    name: "Time Planet",
    city: "Bahadurgarh",
    state: "Haryana",
    pincode: "124507",
    address: "Metro pillar no. 840, Delhi - Rohtak Road, Opposite ICICI BANK opposite Campus, Bahadurgarh, Haryana 124507",
    phone: "+91 8901509654",
    phoneRaw: "8901509654",
    image: "/store-signage.jpg",
    mapUrl: "https://www.google.com/maps/place/TIME+PLANET/@28.6909983,76.9295432,17z/data=!3m1!4b1!4m6!3m5!1s0x390d09994b76e7cd:0x30fc8774131e9375!8m2!3d28.6909983!4d76.9321181!16s%2Fg%2F11fwhzlwvn?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Authorized Retailer"
  },
  {
    id: "nagpal-karnal",
    name: "Nagpal Watches & Optics",
    city: "Karnal",
    state: "Haryana",
    pincode: "132001",
    address: "Shop no. 2, Kunjpura Rd, near Trends, Dyal Singh Colony, Karnal, Haryana 132001",
    phone: "+91 9034138000",
    phoneRaw: "+919034138000",
    image: "/store-interior.jpg",
    mapUrl: "https://maps.app.goo.gl/pGcSPgW9hyT1PdbA9?g_st=ic",
    type: "Authorized Retailer"
  },
  {
    id: "lokhandwala-mumbai",
    name: "Lokhandwala Watches Pvt Ltd",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400053",
    address: "Shop No. 3 & 4, Swiss Palace, Circle, Shastri Nagar Lane 1, near Lokhandwala, Shastri Nagar, Andheri West, Mumbai, Maharashtra 400053",
    phone: null,
    image: "/store-facade.jpg",
    mapUrl: "https://share.google/xh5hdAmb4gvSvE7Oz",
    type: "Official Boutique Partner"
  },
  {
    id: "the-watch-store-thane",
    name: "The Watch Store",
    city: "Thane",
    state: "Maharashtra",
    pincode: "401107",
    address: "Building no. B/69, Shop Number 9 & 10, opposite TMT Bus Stop, next to Patanjali Store, Sector 1, Shanti Nagar, Mira Road East, Thane, Maharashtra 401107",
    phone: null,
    image: "/store-interior.jpg",
    mapUrl: "https://maps.app.goo.gl/WNC6G6Qqx3zhMXvd7",
    type: "Authorized Retailer"
  },
  {
    id: "arihant-virar",
    name: "Arihant Watches & Optical Studio",
    city: "Virar",
    state: "Maharashtra",
    pincode: "401303",
    address: "Shop no 4-7, Gopani Centre, Agashi Rd, opposite Hotel On The Way, Doghar Pada, Sheetal Nagar, Virar West, Thane, Virar, Maharashtra 401303",
    phone: null,
    image: "/store-signage.jpg",
    mapUrl: "https://maps.app.goo.gl/GwqV316xrD9AEL9p7",
    type: "Authorized Retailer"
  },
  {
    id: "shree-krishna-ghaziabad",
    name: "Shree Krishna Watch Company",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    pincode: "201014",
    address: "Shop No. 308 & 309, Indirapuram Habitat Center, Ahinsa Khand 1, Indirapuram, Ghaziabad, Uttar Pradesh 201014",
    phone: "+91 9990003645",
    phoneRaw: "+919990003645",
    image: "/store-facade.jpg",
    mapUrl: "https://www.google.com/maps/place/SHREE+KRISHNA+WATCH+COMPANY/@28.6395064,77.3664638,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfaad730492af:0x3ad8fa0c462e2b6e!8m2!3d28.6395064!4d77.3690387!16s%2Fg%2F11dxkvg522?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Authorized Retailer"
  },
  {
    id: "prakash-mathura",
    name: "Prakash Watch & Opticals",
    city: "Mathura",
    state: "Uttar Pradesh",
    pincode: "281004",
    address: "Shop No 2 B, Near Rahul Bakers, Krishna Nagar, Mathura, Uttar Pradesh 281004",
    phone: null,
    image: "/store-interior.jpg",
    mapUrl: "https://maps.app.goo.gl/JG5pRMNSayya7LZv7?g_st=ic",
    type: "Authorized Retailer"
  },
  {
    id: "timeland-tirupati",
    name: "Timeland",
    city: "Tirupati",
    state: "Andhra Pradesh",
    pincode: "517501",
    address: "VV Mahal Rd, opp. Lalitaa Jewellery, Bhavani Nagar, Tirupati, Andhra Pradesh 517501",
    phone: null,
    image: "/store-signage.jpg",
    mapUrl: "https://www.google.com/maps/place/TIMELAND/@13.6407904,79.4133274,17z/data=!4m6!3m5!1s0x3a4d4bca23fb2c8f:0x299e298b0d1e8085!8m2!3d13.637068!4d79.4206308!16s%2Fg%2F11whwgkqfc?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Official Boutique Partner"
  },
  {
    id: "timeland-vizag",
    name: "Timeland",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    pincode: "530002",
    address: "D No, 10/50/84, Waltair Main Rd, opposite Dr. Agarwals EYE Hospital, Ram Nagar, Visakhapatnam, Andhra Pradesh 530002",
    phone: null,
    image: "/store-facade.jpg",
    mapUrl: "https://www.google.com/maps/place/TIMELAND/@13.6370544,79.338229,12z/data=!4m6!3m5!1s0x3a4d4bca23fb2c8f:0x299e298b0d1e8085!8m2!3d13.637068!4d79.4206308!16s%2Fg%2F11whwgkqfc?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Official Boutique Partner"
  },
  {
    id: "madina-nellore",
    name: "Madina Watch Agencies",
    city: "Nellore",
    state: "Andhra Pradesh",
    pincode: "524001",
    address: "Plot No. 9, Grand Trunk Road, opposite Sunday Market, Nellore, Andhra Pradesh 524001",
    phone: null,
    image: "/store-interior.jpg",
    mapUrl: "https://maps.app.goo.gl/grWXe6cLMxadhUe7A?g_st=ipc",
    type: "Authorized Retailer"
  },
  {
    id: "good-things-nellore",
    name: "Good Things",
    city: "Nellore",
    state: "Andhra Pradesh",
    pincode: "524003",
    address: "Bollineni Centre, 24-3-221, Dargamitta, Nellore, Andhra Pradesh 524003",
    phone: null,
    image: "/store-signage.jpg",
    mapUrl: "https://www.google.com/maps/place/Good+Things/@14.4340382,79.9656465,17z/data=!3m1!4b1!4m6!3m5!1s0x3a4cf3195dd069b7:0xfdeb0fdd57399f16!8m2!3d14.4340382!4d79.9682214!16s%2Fg%2F11fn908t8h?entry=ttu&g_ep=EgoyMDI1MDcwNy4wIKXMDSoASAFQAw%3D%3D",
    type: "Authorized Retailer"
  },
  {
    id: "sharma-bhiwadi",
    name: "Sharma Watch Co.",
    city: "Bhiwadi",
    state: "Rajasthan",
    pincode: "301019",
    address: "Samtal chowk, near Central Market, Bhiwadi, Rajasthan 301019",
    phone: null,
    image: "/store-facade.jpg",
    mapUrl: "https://www.google.com/maps/search/Sharma+Watch+Co.+Samtal+chowk+Bhiwadi",
    type: "Authorized Retailer"
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
// DEDICATED STORE LOCATOR PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
function StoreLocatorView({ onNavigateHome }) {
  const [selectedState, setSelectedState] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const states = ["ALL", "HARYANA", "MAHARASHTRA", "UTTAR PRADESH", "ANDHRA PRADESH", "RAJASTHAN"];

  const filteredStores = STORES_DATA.filter((store) => {
    const matchesState = selectedState === "ALL" || store.state.toUpperCase() === selectedState;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      store.name.toLowerCase().includes(q) ||
      store.city.toLowerCase().includes(q) ||
      store.state.toLowerCase().includes(q) ||
      store.address.toLowerCase().includes(q) ||
      store.pincode.includes(q);
    return matchesState && matchesQuery;
  });

  return (
    <div className="store-locator-page">
      {/* Bluorng-Style 3D Globe & Overlapping Store Cards Hero */}
      <section className="locator-hero" aria-label="Interactive 3D World Globe and Featured Stores">
        <InteractiveDottedGlobe />

        {/* Overlapping Showcase Boutique Cards (Bluorng layout) */}
        <div className="store-hero-carousel-wrap">
          <div className="store-hero-carousel" tabIndex={0} aria-label="Featured Stores Gallery">
            {STORES_DATA.map((store) => (
              <article key={store.id} className="store-hero-card">
                <div className="store-hero-card__media">
                  <img
                    src={store.image}
                    alt={store.name}
                    className="store-hero-card__img"
                    loading="lazy"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Search & State Filter Navigation */}
      <section className="locator-directory-section">
        <div className="locator-controls-wrap" data-reveal>
          {/* Search Input Bar */}
          <div className="locator-search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by city, store name, state or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="locator-search-input"
              aria-label="Search retail stores"
            />
            {searchQuery && (
              <button
                type="button"
                className="locator-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Filter Pills */}
          <div className="locator-state-pills" role="tablist" aria-label="Filter stores by state">
            {states.map((st) => {
              const count = st === "ALL"
                ? STORES_DATA.length
                : STORES_DATA.filter((s) => s.state.toUpperCase() === st).length;
              return (
                <button
                  type="button"
                  key={st}
                  role="tab"
                  aria-selected={selectedState === st}
                  className={`locator-filter-btn ${selectedState === st ? "is-active" : ""}`}
                  onClick={() => setSelectedState(st)}
                >
                  <span>{st === "ALL" ? "ALL LOCATIONS" : st}</span>
                  <span className="locator-filter-count">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Store Results Counter */}
        <div className="locator-results-meta" data-reveal>
          <span>Showing {filteredStores.length} {filteredStores.length === 1 ? "Boutique" : "Boutiques"} in India</span>
        </div>

        {/* Stores Grid Display */}
        <div className="locator-grid">
          {filteredStores.map((store) => (
            <article className="store-card" key={store.id} data-reveal>
              <div className="store-card__header">
                <div className="store-card__region">
                  <span className="store-card__state">{store.state}</span>
                  <span className="store-card__city">• {store.city}</span>
                </div>
                <span className="store-card__badge">{store.type}</span>
              </div>

              <h2 className="store-card__name">{store.name}</h2>

              <p className="store-card__address">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{store.address}</span>
              </p>

              {store.phone && (
                <div className="store-card__contact">
                  <a href={`tel:${store.phoneRaw}`} className="store-card__phone-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{store.phone}</span>
                  </a>
                </div>
              )}

              <div className="store-card__actions">
                <a
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-card__directions-btn"
                  aria-label={`Get directions to ${store.name}`}
                >
                  <span>Get Directions</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="locator-empty-state" data-reveal>
            <p>No authorized boutiques found matching your search.</p>
            <button
              type="button"
              className="locator-reset-btn"
              onClick={() => {
                setSelectedState("ALL");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Website({ onRestart }) {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState(() => {
    return window.location.hash === "#stores" ? "stores" : "home";
  });

  useScrollReveal(visible);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 120);
    const handleHashChange = () => {
      if (window.location.hash === "#stores") {
        setView("stores");
      } else if (window.location.hash === "#home" || window.location.hash === "#top" || !window.location.hash) {
        setView("home");
      }
    };
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const navigateTo = (newView, hashTarget) => {
    setView(newView);
    if (hashTarget) {
      window.location.hash = hashTarget;
      if (newView === "home") {
        setTimeout(() => {
          const el = document.querySelector(hashTarget);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 80);
      }
    }
  };

  return (
    <main className={["site", visible ? "site--visible" : ""].filter(Boolean).join(" ")} id="top">
      <header className="site__header">
        <button
          type="button"
          onClick={() => navigateTo("home", "#top")}
          aria-label="Hanboro home"
          className="site__brand site__brand-btn"
        >
          <HanboroLogo theme="dark" size={28} />
        </button>
        <nav aria-label="Primary navigation" className="site__nav">
          <button
            type="button"
            className={`site__nav-link ${view === "home" ? "is-active" : ""}`}
            onClick={() => navigateTo("home", "#collection")}
          >
            Collection
          </button>
          <button
            type="button"
            className="site__nav-link"
            onClick={() => navigateTo("home", "#lookbook")}
          >
            Lookbook
          </button>
          <button
            type="button"
            className="site__nav-link"
            onClick={() => navigateTo("home", "#packaging")}
          >
            Unboxing
          </button>
          <button
            type="button"
            className={`site__nav-link site__nav-link--store-pill ${view === "stores" ? "is-active" : ""}`}
            onClick={() => navigateTo("stores", "#stores")}
          >
            Store Locator
          </button>
          <button
            type="button"
            className="site__nav-link"
            onClick={() => navigateTo("home", "#contact")}
          >
            Contact
          </button>
        </nav>
        <a className="header__cta-btn" href="mailto:connect@hanborowatches.in">
          <span>Inquire Now</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </header>

      {view === "stores" ? (
        <StoreLocatorView onNavigateHome={() => navigateTo("home", "#top")} />
      ) : (
        <>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero__copy">
              <p className="eyebrow h-eyebrow">Independent creative direction</p>
              <h1 id="hero-title" className="h-h1">Make time<br/><em>matter.</em></h1>
              <p className="hero__description h-desc">HANBORO shapes striking identities and digital experiences for brands that refuse to stand still.</p>
              <div className="hero__btn-row">
                <a className="primary-link h-cta" href="#contact">Start a conversation <span aria-hidden="true">↘</span></a>
                <button
                  type="button"
                  className="secondary-btn h-stores-btn"
                  onClick={() => navigateTo("stores", "#stores")}
                >
                  Find a Store ↗
                </button>
              </div>
            </div>

            <HeroWatchShowcase />
          </section>

          {/* ── WATCH COLLECTION CAROUSEL LOOP (Just after Hero) ── */}
          <WatchCarouselSection />

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

        {/* Stage 03 Bespoke Packaging Grid */}
        <div className="stage-editorial-grid" data-reveal data-reveal-delay="2">
          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">01</span>
              <span className="editorial-card__tag">COMPLICATION</span>
            </div>
            <h3 className="editorial-card__title">3D Celestial Globe & Tourbillon</h3>
            <p className="editorial-card__desc">
              Continuous 24-hour revolving world sphere paired with exposed high-beat tourbillon cage.
            </p>
          </div>

          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">02</span>
              <span className="editorial-card__tag">VAULT</span>
            </div>
            <h3 className="editorial-card__title">Piano-Black Presentation Case</h3>
            <p className="editorial-card__desc">
              Heavy multi-coat high-gloss lacquer case lined in anti-magnetic micro-suede velvet.
            </p>
          </div>

          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">03</span>
              <span className="editorial-card__tag">PORTAL</span>
            </div>
            <h3 className="editorial-card__title">Circular Port Viewing Lid</h3>
            <p className="editorial-card__desc">
              Domed scratch-resistant observation lens enabling full dial visibility even while vaulted.
            </p>
          </div>

          <div className="editorial-card">
            <div className="editorial-card__top">
              <span className="editorial-card__idx">04</span>
              <span className="editorial-card__tag">PASSPORT</span>
            </div>
            <h3 className="editorial-card__title">Serialized Owner Certificate</h3>
            <p className="editorial-card__desc">
              Individual collector registry documentation with matching laser-engraved caliber serials.
            </p>
          </div>
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
        </>
      )}

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

        <div className="footer__address" data-reveal data-reveal-delay="2">
          <p className="eyebrow">Call Us</p>
          <a className="footer__phone" href="tel:+918882069334">+91 88820 69334</a>
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
