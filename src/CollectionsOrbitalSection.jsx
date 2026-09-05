import React, { useEffect, useRef, useState } from "react";

const FEATURED_COLLECTIONS = [
  {
    id: "astroworld",
    skuId: "astroworld-tourbillon-black-dlc",
    name: "HANBORO Astroworld",
    subtitle: "Astronomical Tourbillon",
    img: "/watch-world-map-tourbillon-silver-front-transparent.webp",
    position: "top-left"
  },
  {
    id: "casino-roulette",
    skuId: "blue-roulette",
    name: "Casino Roulette",
    subtitle: "Dynamic Kinetic Rotor",
    img: "/watch-casino-roulette-diamond-emerald-front-transparent.webp",
    position: "top-right"
  },
  {
    id: "celestial-dragon",
    skuId: "celestial-dragon",
    name: "Celestial Dragon",
    subtitle: "Rose Gold High Horology",
    img: "/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp",
    position: "bottom-left"
  },
  {
    id: "cyber-cogwheel",
    skuId: "cyber-cogwheel",
    name: "Cyber Cogwheel",
    subtitle: "Openworked Tonneau",
    img: "/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp",
    position: "bottom-right"
  }
];

export function CollectionsOrbitalSection({ onSelectSku, onDiscover }) {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [scrollRotation, setScrollRotation] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        setScrollRotation(progress * 180);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`collections-orbital-section ${inView ? "is-in-view" : ""}`}
      id="collections-orbital"
      aria-labelledby="collections-orbital-title"
    >
      <div className="collections-orbital__container">
        {/* Header Title & Eyebrow */}
        <div className="collections-orbital__header" data-reveal>
          <div className="collections-orbital__eyebrow">
            <span className="eyebrow-bracket">[</span>
            <span className="eyebrow-text">OUR WATCHES</span>
            <span className="eyebrow-bracket">]</span>
          </div>
          <h2 id="collections-orbital-title" className="collections-orbital__title">
            Collections
          </h2>
        </div>

        {/* Main Stage: 4 Corner Watches + Rotating Central Astrological Sacred Geometry */}
        <div className="collections-orbital__stage">
          {/* Animated Central Concentric Sacred Geometry Dial */}
          <div className="orbital-dial-centerpiece" aria-hidden="true">
            {/* Outer Slow Ambient + Scroll Driven Rotation Ring */}
            <svg
              className="orbital-svg orbital-svg--outer"
              viewBox="0 0 600 600"
              style={{
                transform: `rotate(${scrollRotation * 0.8}deg)`
              }}
            >
              {/* Outer Ticks Ring */}
              <circle
                cx="300"
                cy="300"
                r="285"
                fill="none"
                stroke="rgba(184, 150, 98, 0.22)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
              <circle
                cx="300"
                cy="300"
                r="260"
                fill="none"
                stroke="rgba(184, 150, 98, 0.35)"
                strokeWidth="1"
              />
              {/* 12-Facet Geometric Star Polyline */}
              <polygon
                points="300,45 365,135 480,120 465,235 555,300 465,365 480,480 365,465 300,555 235,465 120,480 135,365 45,300 135,235 120,120 235,135"
                fill="none"
                stroke="rgba(184, 150, 98, 0.2)"
                strokeWidth="1"
              />
              {/* Radial Cross Axes */}
              <line x1="15" y1="300" x2="585" y2="300" stroke="rgba(184, 150, 98, 0.2)" strokeWidth="1" />
              <line x1="300" y1="15" x2="300" y2="585" stroke="rgba(184, 150, 98, 0.2)" strokeWidth="1" />
              <line x1="98" y1="98" x2="502" y2="502" stroke="rgba(184, 150, 98, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
              <line x1="502" y1="98" x2="98" y2="502" stroke="rgba(184, 150, 98, 0.15)" strokeWidth="1" strokeDasharray="3 6" />
            </svg>

            {/* Inner Counter-Rotating Precision Ring */}
            <svg
              className="orbital-svg orbital-svg--inner"
              viewBox="0 0 600 600"
              style={{
                transform: `rotate(${scrollRotation * -1.2}deg)`
              }}
            >
              <circle
                cx="300"
                cy="300"
                r="215"
                fill="none"
                stroke="rgba(184, 150, 98, 0.4)"
                strokeWidth="1.5"
              />
              <circle
                cx="300"
                cy="300"
                r="180"
                fill="none"
                stroke="rgba(184, 150, 98, 0.25)"
                strokeWidth="1"
                strokeDasharray="6 6"
              />
              {/* 8-Point Compass Diamond */}
              <polygon
                points="300,85 340,260 515,300 340,340 300,515 260,340 85,300 260,260"
                fill="none"
                stroke="rgba(184, 150, 98, 0.28)"
                strokeWidth="1"
              />
            </svg>

            {/* Central Editorial Content Card */}
            <div className="orbital-center-card">
              <p className="orbital-center-desc">
                Crafted in silence. Defined by time.<br />
                Discover limited pieces where heritage meets precision and elegance transcends trends.
              </p>
              <button
                type="button"
                className="orbital-center-cta"
                onClick={onDiscover}
              >
                <span>Discover the Collections</span>
              </button>
            </div>
          </div>

          {/* 4 Watch Quadrant Cards */}
          <div className="orbital-quadrant-grid">
            {FEATURED_COLLECTIONS.map((item) => (
              <div
                key={item.id}
                className={`orbital-watch-card orbital-watch-card--${item.position}`}
                onClick={() => onSelectSku?.(item.skuId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectSku?.(item.skuId);
                  }
                }}
              >
                <div className="orbital-watch-frame">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="orbital-watch-img"
                    loading="lazy"
                  />
                </div>
                <div className="orbital-watch-label">
                  <span className="orbital-watch-name">{item.name}</span>
                  <span className="orbital-watch-sub">{item.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CollectionsOrbitalSection;
