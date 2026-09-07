import React, { useState } from "react";

export const MEDIA_GALLERY_DATA = [
  {
    id: "media-1",
    num: "01",
    title: "Monte Carlo Roulette Rotor in High-Beat Motion",
    subtitle: "Kinetic Brilliance",
    category: "ROULETTE COMPLICATION",
    caption: "Micro-ceramic ball bearing track delivering a 20-second frictionless hypnotic spin on the wrist with zero wobble.",
    poster: "/watch-casino-roulette-rosegold-wrist-angle.jpg",
    watchSku: "casino-roulette-wheel-rosegold",
    watchName: "Casino Roulette 18K Rose Gold",
    watchRef: "REF. HBR-7705-RG",
    duration: "0:24",
    views: "342K views",
    audio: "Original Audio • Frictionless Spin",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-2",
    num: "02",
    title: "Astroworld Celestial Moonphase Orbit",
    subtitle: "Astronomical Calibre",
    category: "COSMIC HOROLOGY",
    caption: "3D micro-sculpted Moon sphere orbiting above a sunburst aventurine starry matrix under ultraviolet activation.",
    poster: "/watch-astroworld-moon-silver-racetrack.jpg",
    watchSku: "astroworld-celestial-silver",
    watchName: "Astroworld Celestial Moonphase",
    watchRef: "REF. HBR-AST-01",
    duration: "0:30",
    views: "286K views",
    audio: "Ambient Horizon • Aventurine Drift",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-3",
    num: "03",
    title: "Supercar Engine Block Cockpit Dyno Run",
    subtitle: "Racing Horology",
    category: "RACING DNA",
    caption: "Tonneau racing architecture captured on track in full sunlight, showcasing openworked cylinder skeleton bridges.",
    poster: "/watch-supercar-engine-block-silver-driving.webp",
    watchSku: "supercar-engine-block-silver",
    watchName: "Supercar Engine Block Titanium",
    watchRef: "REF. HBR-MEC-01",
    duration: "0:26",
    views: "512K views",
    audio: "Twin-Turbo V8 • 8,200 RPM",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-4",
    num: "04",
    title: "Mecha Cantilever Flying Tourbillon in Direct Sunlight",
    subtitle: "Haute Horlogerie",
    category: "FLYING TOURBILLON",
    caption: "High-frequency 28,800 BPH cantilevered tourbillon cage floating freely without an upper bridge.",
    poster: "/watch-mecha-cantilever-tourbillon-iceblue-wrist.webp",
    watchSku: "mecha-cantilever-tourbillon-iceblue",
    watchName: "Mecha Cantilever Tourbillon Ice Blue",
    watchRef: "REF. HBR-CAN-03",
    duration: "0:22",
    views: "198K views",
    audio: "Tourbillon Escapement • 28,800 BPH",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-5",
    num: "05",
    title: "CarbonX Forged Carbon Tonneau Macro Weave",
    subtitle: "Carbon Innovation",
    category: "FORGED CARBON",
    caption: "Ultra-dense forged carbon fiber tonneau casing with individual marbling, paired with an openworked skeleton dial.",
    poster: "/watch-forged-carbon-tonneau-wrist-macro.webp",
    watchSku: "forged-carbon-tonneau-tourbillon",
    watchName: "Forged Carbon Tonneau Tourbillon",
    watchRef: "REF. HBR-CRB-04",
    duration: "0:20",
    views: "415K views",
    audio: "Mechanical Heartbeat • Carbon Weave",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-6",
    num: "06",
    title: "Seamaster Chrono Diver Trackside with Supercar",
    subtitle: "Trackside Velocity",
    category: "SPORT CHRONOGRAPH",
    caption: "High-contrast chronograph subdials and dual-bezel tachymeter captured in the paddock beside a track beast.",
    poster: "/watch-seamaster-chronograph-diver-violet-supercar.webp",
    watchSku: "seamaster-chronograph-diver-violet",
    watchName: "Seamaster Chrono Violet Supercar Edition",
    watchRef: "REF. HBR-SEA-09",
    duration: "0:19",
    views: "230K views",
    audio: "Supercar Idle • Chrono Clicks",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-7",
    num: "07",
    title: "Clover King Imperial Phosphorescent Night Reveal",
    subtitle: "Day & Night Alchemy",
    category: "LUMINESCENT MATRIX",
    caption: "Instant phosphorescent reaction revealing concealed luminescent clover dials under pitch-black darkness.",
    poster: "/clover-king-night-glow.webp",
    watchSku: "clover-king",
    watchName: "Clover King Imperial Emerald",
    watchRef: "REF. HBR-8802-EM",
    duration: "0:28",
    views: "389K views",
    audio: "Ultraviolet Luminescence Shift",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-8",
    num: "08",
    title: "3D Celestial Dragon Flying Tourbillon Hand Chisel",
    subtitle: "Metiers d'Art",
    category: "FLYING TOURBILLON",
    caption: "Hand-chiseled 18K rose gold dragon chassis coiling around a 28,800 BPH cantilevered tourbillon cage.",
    poster: "/watch-celestial-dragon-tourbillon-rosegold-wrist.jpg",
    watchSku: "celestial-dragon-tourbillon-rosegold",
    watchName: "Celestial Dragon Flying Tourbillon",
    watchRef: "REF. HBR-DRG-01",
    duration: "0:18",
    views: "620K views",
    audio: "Haute Horlogerie Atelier Sound",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-9",
    num: "09",
    title: "Sichuan Opera Face-Changing Diamond Tonneau",
    subtitle: "Kinetic Mask Mystery",
    category: "KINETIC MASK",
    caption: "Secret complication with rotating theatrical expressions revealed through mechanical push-button cycles.",
    poster: "/watch-sichuan-opera-diamond-wrist-angle.webp",
    watchSku: "sichuan-opera-diamond-tonneau",
    watchName: "Sichuan Opera Diamond Tonneau",
    watchRef: "REF. HBR-OPR-01",
    duration: "0:25",
    views: "475K views",
    audio: "Mask Shift Kinetic Click",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-10",
    num: "10",
    title: "Supercar Engine Block Rose Gold at the Track Vault",
    subtitle: "Engineered Speed",
    category: "TRACKSIDE HOROLOGY",
    caption: "Piston-inspired skeleton movement encased in satin-brushed 18K rose gold on an ergonomic vulcanized strap.",
    poster: "/watch-supercar-engine-block-rosegold-racetrack.webp",
    watchSku: "supercar-engine-block-rosegold",
    watchName: "Supercar Engine Block Rose Gold",
    watchRef: "REF. HBR-MEC-02",
    duration: "0:21",
    views: "318K views",
    audio: "Pit Lane Exhaust & Chrono Beat",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-11",
    num: "11",
    title: "Oceanic Diver 200M Sartorial Emerald on the Wrist",
    subtitle: "Subaquatic Depth",
    category: "PROFESSIONAL DIVER",
    caption: "120-click ceramic unidirectional rotating bezel and high-legibility Super-LumiNova markers in outdoor light.",
    poster: "/watch-oceanic-diver-200m-green-wrist-sartorial.webp",
    watchSku: "oceanic-diver-200m-green",
    watchName: "Oceanic Diver 200M Emerald Green",
    watchRef: "REF. HBR-SEA-01",
    duration: "0:23",
    views: "164K views",
    audio: "120-Click Ceramic Bezel Audio",
    videoSrc: "/Hanboro V1.mp4"
  },
  {
    id: "media-12",
    num: "12",
    title: "Cyber Cogwheel Openworked Tactical Skeleton",
    subtitle: "Micromechanical Mastery",
    category: "TACTICAL SKELETON",
    caption: "Multi-layered steel skeleton architecture showcasing exposed escapement wheel, bridges, and ruby pivots.",
    poster: "/watch-cyber-cogwheel-skeleton-steel-tactical.jpg",
    watchSku: "cyber-cogwheel-skeleton-steel",
    watchName: "Cyber Cogwheel Skeleton Steel",
    watchRef: "REF. HBR-CYB-02",
    duration: "0:22",
    views: "290K views",
    audio: "21,600 BPH Hacking Escapement",
    videoSrc: "/Hanboro V1.mp4"
  }
];

export function MediaSection({ onInspectSku }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlayingModal, setIsPlayingModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? MEDIA_GALLERY_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === MEDIA_GALLERY_DATA.length - 1 ? 0 : prev + 1));
  };

  const handleOpenPlayer = (item) => {
    setSelectedMedia(item);
    setIsPlayingModal(true);
  };

  const activeItem = MEDIA_GALLERY_DATA[activeIndex] || MEDIA_GALLERY_DATA[0];

  return (
    <section className="our-media-section" id="media" aria-labelledby="media-title">
      <div className="our-media-container" data-reveal>
        {/* Luxury Social Reels Header Row */}
        <div className="our-media-header">
          <div className="our-media-heading-group">
            <div className="our-media-eyebrow">
              <span className="eyebrow-bracket">{"{"}</span>
              <svg
                className="our-media-ig-icon"
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="eyebrow-text">INSTAGRAM REELS • @HANBOROWATCHES</span>
              <span className="eyebrow-bracket">{"}"}</span>
            </div>
            <h2 id="media-title" className="our-media-title">
              Mechanical Cinema on the Wrist
            </h2>
          </div>

          <div className="our-media-subtitle-group">
            <p className="our-media-subtitle-editorial">
              Raw wrist presence, high-frequency rotor spins, and luminous skeleton architecture captured live in the wild. Experience how HANBORO moves beyond the studio.
            </p>
            <a
              href="https://www.instagram.com/hanborowatches/"
              target="_blank"
              rel="noopener noreferrer"
              className="our-media-ig-badge"
              aria-label="Follow HANBORO on Instagram"
            >
              <span className="ig-pulse-dot" aria-hidden="true" />
              <span>Watch on Instagram</span>
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          </div>
        </div>

        {/* Full-Width Accordion Slat Gallery Strip (12 Reels) */}
        <div className="our-media-gallery-strip" role="region" aria-label="Media Gallery Accordion">
          {MEDIA_GALLERY_DATA.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={item.id}
                className={`our-media-slat ${isActive ? "is-active-feature" : "is-collapsed-slat"}`}
                onClick={() => {
                  if (!isActive) {
                    setActiveIndex(idx);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
                aria-label={`${item.title} - Reel ${item.num} of ${MEDIA_GALLERY_DATA.length}`}
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  className="our-media-slat-img"
                  loading="lazy"
                />
                <div className="our-media-slat-overlay" />

                {/* Active Feature Center Card Content */}
                {isActive && (
                  <div className="our-media-feature-content">
                    {/* Top Social Reel Header Badges */}
                    <div className="our-media-feature-topbar">
                      <div className="our-media-reel-badge">
                        <span className="reel-icon-glyph">▶</span>
                        <span>REEL</span>
                        <span className="reel-sep">•</span>
                        <span className="reel-views-count">{item.views}</span>
                      </div>
                      {item.audio && (
                        <div className="our-media-audio-badge" title={item.audio}>
                          <span className="audio-music-icon">♫</span>
                          <span className="audio-music-title">{item.audio}</span>
                        </div>
                      )}
                    </div>

                    {/* Center Play Button */}
                    <button
                      type="button"
                      className="our-media-play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPlayer(item);
                      }}
                      aria-label={`Play reel video for ${item.title}`}
                    >
                      <div className="our-media-play-circle">
                        <svg viewBox="0 0 24 24" className="our-media-play-icon" aria-hidden="true">
                          <polygon points="8,5 20,12 8,19" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="our-media-play-hint">WATCH REEL</span>
                    </button>

                    {/* Bottom Feature Caption */}
                    <div className="our-media-feature-caption">
                      <div className="our-media-caption-meta">
                        <span className="our-media-tag-pill">{item.category}</span>
                        <span className="our-media-time-pill">⏱ {item.duration}</span>
                      </div>
                      <h3 className="our-media-feature-title">{item.title}</h3>
                      <p className="our-media-feature-desc">{item.caption}</p>
                    </div>
                  </div>
                )}

                {/* Slat Index label for collapsed slices */}
                {!isActive && (
                  <div className="our-media-slat-num" aria-hidden="true">
                    <span>{item.num}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Centered Navigation & Reel Pagination Dots */}
        <div className="our-media-nav-controls">
          <button
            type="button"
            className="our-media-arrow-btn our-media-arrow-btn--prev"
            onClick={handlePrev}
            aria-label="Previous reel"
          >
            <svg viewBox="0 0 24 24" className="our-media-nav-chevron" aria-hidden="true">
              <polygon points="15,4 7,12 15,20" fill="currentColor" />
            </svg>
          </button>

          {/* Reel Dot Selectors */}
          <div className="our-media-dots-track" role="tablist" aria-label="Reel selection dots">
            {MEDIA_GALLERY_DATA.map((dotItem, dotIdx) => (
              <button
                key={dotItem.id}
                type="button"
                role="tab"
                aria-selected={dotIdx === activeIndex}
                aria-label={`Jump to reel ${dotItem.num}: ${dotItem.title}`}
                className={`our-media-dot-item ${dotIdx === activeIndex ? "is-active" : ""}`}
                onClick={() => setActiveIndex(dotIdx)}
              >
                <span className="dot-fill" />
              </button>
            ))}
          </div>

          <div className="our-media-nav-index">
            <span className="nav-index-current">{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className="nav-bar-line" aria-hidden="true">/</span>
            <span className="nav-index-total">{String(MEDIA_GALLERY_DATA.length).padStart(2, "0")}</span>
          </div>

          <button
            type="button"
            className="our-media-arrow-btn our-media-arrow-btn--next"
            onClick={handleNext}
            aria-label="Next reel"
          >
            <svg viewBox="0 0 24 24" className="our-media-nav-chevron" aria-hidden="true">
              <polygon points="9,4 17,12 9,20" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cinematic Media Video Modal */}
      {isPlayingModal && selectedMedia && (
        <div
          className="our-media-modal-backdrop"
          onClick={() => setIsPlayingModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedMedia.title}
        >
          <div className="our-media-modal-body" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="our-media-modal-close"
              onClick={() => setIsPlayingModal(false)}
              aria-label="Close media player"
            >
              ✕
            </button>

            <div className="our-media-modal-media-wrap">
              <video
                src={selectedMedia.videoSrc}
                poster={selectedMedia.poster}
                controls
                autoPlay
                playsInline
                className="our-media-modal-video"
              />
            </div>

            <div className="our-media-modal-details">
              <div className="our-media-modal-meta">
                <div className="modal-meta-left">
                  <span className="modal-category">{selectedMedia.category}</span>
                  <span className="modal-views">⚡ {selectedMedia.views}</span>
                </div>
                <span className="modal-duration">⏱ {selectedMedia.duration}</span>
              </div>
              <h3 className="our-media-modal-title">{selectedMedia.title}</h3>
              <p className="our-media-modal-desc">{selectedMedia.caption}</p>

              {selectedMedia.watchSku && (
                <button
                  type="button"
                  className="our-media-modal-inspect-btn"
                  onClick={() => {
                    setIsPlayingModal(false);
                    onInspectSku && onInspectSku(selectedMedia.watchSku);
                  }}
                >
                  Inspect {selectedMedia.watchName} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export const ReelsSection = MediaSection;
export default MediaSection;
