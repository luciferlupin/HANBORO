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
    watchSku: "blue-roulette",
    watchName: "Casino Roulette 18K Rose Gold",
    watchRef: "REF. HBR-7705-RG",
    duration: "0:24",
    videoSrc: "/hero-astonia-video.mp4"
  },
  {
    id: "media-2",
    num: "02",
    title: "Celestial Moonphase Luminescent Transition",
    subtitle: "Astronomical Calibre",
    category: "COSMIC HOROLOGY",
    caption: "3D micro-sculpted Moon sphere orbiting above a sunburst aventurine starry matrix under ultraviolet activation.",
    poster: "/watch-astroworld-moon-silver-racetrack.jpg",
    watchSku: "astroworld-moon",
    watchName: "Astroworld Celestial Moonphase",
    watchRef: "REF. HBR-AST-01",
    duration: "0:30",
    videoSrc: "/hero-astonia-video.mp4"
  },
  {
    id: "media-3",
    num: "03",
    title: "3D Dragon Flying Tourbillon Cage Rotation",
    subtitle: "Haute Horlogerie",
    category: "FLYING TOURBILLON",
    caption: "Hand-chiseled 18K rose gold dragon chassis coiling around a 28,800 BPH cantilevered tourbillon cage.",
    poster: "/watch-celestial-dragon-tourbillon-rosegold-wrist.jpg",
    watchSku: "celestial-dragon",
    watchName: "Celestial Dragon Flying Tourbillon",
    watchRef: "REF. HBR-DRG-01",
    duration: "0:18",
    videoSrc: "/hero-astonia-video.mp4"
  },
  {
    id: "media-4",
    num: "04",
    title: "Openworked Cyber Skeleton Architectural Depth",
    subtitle: "Micromechanical Mastery",
    category: "SKELETON CALIBRE",
    caption: "Multi-layered titanium skeleton architecture showcasing exposed escapement wheel, bridges, and ruby pivots.",
    poster: "/watch-cyber-cogwheel-skeleton-steel-tactical.jpg",
    watchSku: "cyber-cogwheel",
    watchName: "Cyber Cogwheel Skeleton Steel",
    watchRef: "REF. HBR-CYB-02",
    duration: "0:22",
    videoSrc: "/hero-astonia-video.mp4"
  },
  {
    id: "media-5",
    num: "05",
    title: "Clover King Phosphorescent Matrix Reveal",
    subtitle: "Day & Night Alchemy",
    category: "LUMINESCENT DIAL",
    caption: "Instant phosphorescent reaction revealing concealed luminescent clover dials under darkness.",
    poster: "/clover-king-night-glow.webp",
    watchSku: "clover-king",
    watchName: "Clover King Imperial Emerald",
    watchRef: "REF. HBR-8802-EM",
    duration: "0:28",
    videoSrc: "/hero-astonia-video.mp4"
  },
  {
    id: "media-6",
    num: "06",
    title: "Aurora Celestial Frost Macro Crystal Polish",
    subtitle: "Material Precision",
    category: "SAPPHIRE ARTISTRY",
    caption: "Dual-domed anti-reflective sapphire crystal capturing ambient light across the gradient volcanic dial.",
    poster: "/watch-aurora-celestial-frost-wrist-macro.jpg",
    watchSku: "aurora-celestial",
    watchName: "Aurora Celestial Frost Titanium",
    watchRef: "REF. HBR-AUR-03",
    duration: "0:20",
    videoSrc: "/hero-astonia-video.mp4"
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

  return (
    <section className="our-media-section" id="media" aria-labelledby="media-title">
      <div className="our-media-container" data-reveal>
        {/* Apple-Grade Header Row */}
        <div className="our-media-header">
          <div className="our-media-heading-group">
            <div className="our-media-eyebrow">
              <span className="eyebrow-bracket">{"{"}</span>
              <span className="eyebrow-text">OUR MEDIA</span>
              <span className="eyebrow-bracket">{"}"}</span>
            </div>
            <h2 id="media-title" className="our-media-title">
              Genesis of Kinetic Time
            </h2>
          </div>

          <p className="our-media-subtitle-editorial">
            HANBORO — a silent process where micromechanical precision becomes shape, and kinetic mastery becomes art.
          </p>
        </div>

        {/* Full-Width Apple-Grade Accordion Slat Gallery Strip */}
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
                aria-label={`${item.title} - ${isActive ? "Active view" : "Click to view"}`}
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
                    <button
                      type="button"
                      className="our-media-play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPlayer(item);
                      }}
                      aria-label={`Play video for ${item.title}`}
                    >
                      <div className="our-media-play-circle">
                        <svg viewBox="0 0 24 24" className="our-media-play-icon" aria-hidden="true">
                          <polygon points="8,5 20,12 8,19" fill="currentColor" />
                        </svg>
                      </div>
                    </button>

                    <div className="our-media-feature-caption">
                      <span className="our-media-tag-pill">{item.category}</span>
                      <h3 className="our-media-feature-title">{item.title}</h3>
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

        {/* Bottom Centered Navigation & Pagination Controls */}
        <div className="our-media-nav-controls">
          <button
            type="button"
            className="our-media-arrow-btn our-media-arrow-btn--prev"
            onClick={handlePrev}
            aria-label="Previous media slide"
          >
            <svg viewBox="0 0 24 24" className="our-media-nav-chevron" aria-hidden="true">
              <polygon points="15,4 7,12 15,20" fill="currentColor" />
            </svg>
          </button>

          <div className="our-media-nav-index">
            <span className="nav-bar-line" aria-hidden="true">|</span>
            <span className="nav-index-current">{activeIndex + 1}</span>
            <span className="nav-bar-line" aria-hidden="true">|</span>
          </div>

          <button
            type="button"
            className="our-media-arrow-btn our-media-arrow-btn--next"
            onClick={handleNext}
            aria-label="Next media slide"
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
                className="our-media-modal-video"
              />
            </div>

            <div className="our-media-modal-details">
              <div className="our-media-modal-meta">
                <span className="modal-category">{selectedMedia.category}</span>
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
