import React, { useState, useRef } from "react";

/**
 * ArchitecturalExhibitionSection
 * Inspired by high-horology flagship boutique installations (e.g. Louvre/Geneva maison exhibitions).
 * Features 6 vertical architectural panel slats, spanning "REDEFINED TIME" luxury typography,
 * glowing 3D celestial Moon orb, high-precision Astroworld watch centerpiece, QR provenance plaque,
 * and specular obsidian floor reflection.
 */
export default function ArchitecturalExhibitionSection({ onInspectSku }) {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const watchSku = "astroworld-tourbillon-fluted-silver";
  const watchImg = "/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp";

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section
      className="architectural-stage-section"
      id="exhibition"
      aria-label="Hanboro Architectural Exhibition"
    >
      {/* Top Section Meta */}
      <div className="stage-header" data-reveal>
        <div className="stage-meta">
          <span className="stage-index">CHAPTER 04 / 07</span>
          <span className="stage-tag">FLAGSHIP INSTALLATION</span>
        </div>
        <h2 className="stage-title">
          The art of <em>kinetic permanence.</em>
        </h2>
      </div>

      {/* Main Exhibition Atrium Gallery */}
      <div
        ref={containerRef}
        className="exhibition-atrium"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Upper Architecture Archway Lighting */}
        <div className="atrium-ceiling-ambient" aria-hidden="true" />

        {/* The 6-Slat Architectural Billboard Wall */}
        <div className="slat-billboard-wall">
          {/* Volumetric Lunar Clouds / Mist Backdrop */}
          <div className="billboard-sky-backdrop" aria-hidden="true">
            <div className="lunar-clouds-layer clouds-layer--1" />
            <div className="lunar-clouds-layer clouds-layer--2" />
          </div>

          {/* Slat Lines Background (6 Vertical Slat Panels) */}
          <div className="billboard-slats-grid" aria-hidden="true">
            <div className="slat-panel slat-panel--1" />
            <div className="slat-panel slat-panel--2" />
            <div className="slat-panel slat-panel--3" />
            <div className="slat-panel slat-panel--4" />
            <div className="slat-panel slat-panel--5" />
            <div className="slat-panel slat-panel--6" />
          </div>

          {/* Top Brand Maison Crest */}
          <div className="billboard-crest">
            <div className="crest-emblem">
              <span className="crest-symbol">✦</span>
              <span className="crest-title">HANBORO MAISON</span>
              <span className="crest-symbol">✦</span>
            </div>
          </div>

          {/* Giant Spanning Billboard Typography (REDEFINED TIME) */}
          <div className="billboard-typography-layer" aria-hidden="true">
            <span className="billboard-word billboard-word--left">REDEFINED</span>
            <span className="billboard-word billboard-word--right">TIME</span>
          </div>

          {/* Centerpiece 3D Moon & Floating Timepiece */}
          <div
            className="billboard-hero-composite"
            style={{
              transform: `perspective(1000px) rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg) translateZ(${isHovered ? 16 : 0}px)`,
            }}
          >
            {/* Photorealistic Glowing Celestial Moon Orb */}
            <div className="celestial-moon-orb" aria-hidden="true">
              <div className="moon-ambient-glow" />
              <div className="moon-surface-texture" />
            </div>

            {/* High-Precision Transparent Watch Face */}
            <div
              className="exhibition-watch-wrap"
              onClick={() => onInspectSku && onInspectSku(watchSku)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onInspectSku && onInspectSku(watchSku)}
              aria-label="Inspect Astroworld Celestial Tourbillon Silver"
            >
              <img
                src={watchImg}
                alt="HANBORO Astroworld Celestial Tourbillon Silver"
                className="exhibition-watch-img"
                draggable={false}
              />
              <div className="watch-interaction-badge">
                <span>INSPECT CALIBRE</span>
                <span aria-hidden="true">↗</span>
              </div>
            </div>
          </div>

          {/* Bottom-Left: Luxury QR Code Digital Provenance Certificate Plaque */}
          <div className="billboard-qr-plaque">
            <div className="qr-box">
              <svg className="qr-code-svg" viewBox="0 0 100 100" aria-label="Digital Passport QR Code">
                {/* Clean luxury stylized QR matrix */}
                <rect x="0" y="0" width="100" height="100" fill="#f5f2ed" rx="4" />
                {/* Corner markers */}
                <rect x="8" y="8" width="26" height="26" fill="#111113" rx="2" />
                <rect x="12" y="12" width="18" height="18" fill="#f5f2ed" />
                <rect x="16" y="16" width="10" height="10" fill="#111113" />

                <rect x="66" y="8" width="26" height="26" fill="#111113" rx="2" />
                <rect x="70" y="12" width="18" height="18" fill="#f5f2ed" />
                <rect x="74" y="16" width="10" height="10" fill="#111113" />

                <rect x="8" y="66" width="26" height="26" fill="#111113" rx="2" />
                <rect x="12" y="70" width="18" height="18" fill="#f5f2ed" />
                <rect x="16" y="74" width="10" height="10" fill="#111113" />

                {/* Stylized Data Bits */}
                <rect x="40" y="10" width="6" height="6" fill="#111113" />
                <rect x="52" y="10" width="6" height="12" fill="#111113" />
                <rect x="40" y="24" width="18" height="6" fill="#111113" />
                
                <rect x="10" y="42" width="12" height="6" fill="#111113" />
                <rect x="30" y="42" width="6" height="16" fill="#111113" />
                <rect x="44" y="38" width="14" height="14" fill="#fa2d1d" rx="1" />
                <rect x="66" y="42" width="24" height="6" fill="#111113" />
                <rect x="78" y="52" width="12" height="8" fill="#111113" />

                <rect x="40" y="66" width="18" height="6" fill="#111113" />
                <rect x="40" y="78" width="6" height="12" fill="#111113" />
                <rect x="54" y="76" width="12" height="14" fill="#111113" />
                <rect x="74" y="72" width="16" height="18" fill="#111113" />
              </svg>
            </div>
            <div className="qr-meta">
              <span className="qr-tag">AR PASSPORT</span>
              <span className="qr-title">SCAN TO VERIFY</span>
            </div>
          </div>

          {/* Bottom-Center Horology Inscription */}
          <div className="billboard-bottom-stamp">
            <span>SINCE 1866 • HAUTE HORLOGERIE GENÈVE</span>
          </div>
        </div>

        {/* Polished Obsidian Marble Floor Specular Reflection */}
        <div className="atrium-floor-plane" aria-hidden="true">
          <div className="floor-tiles-grid" />
          <div className="floor-reflection-fade">
            <div className="floor-reflection-glow" />
          </div>
        </div>
      </div>
    </section>
  );
}
