import React, { useEffect, useRef, useState } from "react";

export function CraftedWithLegacySection({ onExploreCatalog }) {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        } else if (entry.boundingClientRect.top > window.innerHeight) {
          setInView(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const totalDist = windowHeight + rect.height;
      const currentDist = windowHeight - rect.top;
      const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Graceful sine curve opacity with subtle slow parallax
  const opacity = Math.min(1, Math.max(0, Math.sin(scrollProgress * Math.PI) * 1.35));
  const parallaxOffset = (scrollProgress - 0.5) * 35;

  return (
    <section
      ref={sectionRef}
      className={`crafted-legacy-section ${inView ? "is-in-view" : ""}`}
      id="philosophy"
      aria-labelledby="philosophy-title"
      data-reveal
    >
      <div
        className="crafted-legacy__container"
        style={{
          opacity: inView ? opacity : 0,
          transform: `translateY(${parallaxOffset * 0.3}px)`,
          transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s ease-out"
        }}
      >
        {/* Interleaved Typographic & Theme Pill Mosaic */}
        <div className="crafted-legacy__mosaic">
          {/* ROW 1: [Capsule Pill with Ruby Crown] + "CRAFTED WITH" */}
          <div
            className="mosaic-row mosaic-row--1"
            style={{
              transform: `translateY(${parallaxOffset * -0.25}px)`
            }}
          >
            <div className="mosaic-pill-track">
              <div className="mosaic-pill mosaic-pill--seal" data-pill="1">
                <img
                  src="/pill-hanboro-crown.jpg"
                  alt="Hanboro Rose Gold Crown & Ruby Jewel Flank"
                  className="mosaic-pill-img mosaic-pill-img--seal"
                  loading="lazy"
                />
              </div>
            </div>

            <h2 id="philosophy-title" className="mosaic-text mosaic-text--crafted">
              <span className="motion-text-reveal">CRAFTED WITH</span>
            </h2>
          </div>

          {/* ROW 2: "LEGACY" + [Capsule Pill with Casino Roulette Tourbillon Calibre] + Philosophy Text */}
          <div
            className="mosaic-row mosaic-row--2"
            style={{
              transform: `translateY(${parallaxOffset * -0.08}px)`
            }}
          >
            <span className="mosaic-text mosaic-text--legacy">
              <span className="motion-text-reveal">LEGACY</span>
            </span>

            <div className="mosaic-pill-track">
              <div className="mosaic-pill mosaic-pill--dial" data-pill="2">
                <img
                  src="/pill-hanboro-roulette.jpg"
                  alt="Hanboro Casino Roulette Tourbillon Movement"
                  className="mosaic-pill-img mosaic-pill-img--dial"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="mosaic-desc-block">
              <p className="motion-text-fade">
                We believe time is more than movement. It's memory, presence, and identity — shaped with precision and restraint.
              </p>
            </div>
          </div>

          {/* ROW 3: [Elongated Pill with Hanboro Tonneau Wrist Shot] + "IN MIND" */}
          <div
            className="mosaic-row mosaic-row--3"
            style={{
              transform: `translateY(${parallaxOffset * 0.18}px)`
            }}
          >
            <div className="mosaic-pill-track">
              <div className="mosaic-pill mosaic-pill--wrist" data-pill="3">
                <img
                  src="/pill-hanboro-wrist.jpg"
                  alt="Hanboro Red Tonneau Automatic Watch on Wrist"
                  className="mosaic-pill-img mosaic-pill-img--wrist"
                  loading="lazy"
                />
              </div>
            </div>

            <span className="mosaic-text mosaic-text--inmind">
              <span className="motion-text-reveal">IN MIND</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CraftedWithLegacySection;
