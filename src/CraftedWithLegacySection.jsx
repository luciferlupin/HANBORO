import React, { useEffect, useRef, useState } from "react";

export function CraftedWithLegacySection({ onExploreCatalog }) {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0.5);

  useEffect(() => {
    // Check initial visibility immediately on mount
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setInView(true);
      }
    }

    // IntersectionObserver for entrance reveal (fade one)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.06, rootMargin: "80px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Scroll progress handler for interactive photo parallax (scroll one)
    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        if (sectionRef.current) {
          const rect = sectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const totalDist = windowHeight + rect.height;
          const currentDist = windowHeight - rect.top;
          const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);
          setScrollProgress(progress);

          // If within range, ensure inView is active
          if (currentDist > 0 && currentDist < totalDist + 200) {
            setInView(true);
          }
        }
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Fallback timer: ensure inView is always active after 800ms so nothing stays hidden
    const fallbackTimer = setTimeout(() => {
      setInView(true);
    }, 800);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Compute centered scroll factor (-1 to +1, 0 when centered in viewport)
  const centered = (scrollProgress - 0.5) * 2;
  
  // Parallax offsets for photo capsules (opposite directions for kinetic rhythm)
  const pill1Offset = centered * -48;
  const pill2Offset = centered * 56;
  const pill3Offset = centered * -64;

  // Inner image counter-translation for depth inside the capsule window
  const img1Offset = centered * 16;
  const img2Offset = centered * -20;
  const img3Offset = centered * 24;

  return (
    <section
      ref={sectionRef}
      className={`crafted-legacy-section ${inView ? "is-in-view" : ""}`}
      id="philosophy"
      aria-labelledby="philosophy-title"
    >
      <div className="crafted-legacy__container">
        {/* Interleaved Typographic & Theme Pill Mosaic */}
        <div className="crafted-legacy__mosaic">
          {/* ROW 1: [Capsule Pill with Ruby Crown] + "CRAFTED WITH" */}
          <div className="mosaic-row mosaic-row--1">
            <div
              className="mosaic-pill-track"
              style={{
                transform: `translate3d(${pill1Offset}px, ${centered * 12}px, 0)`,
                transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
              }}
            >
              <div className="mosaic-pill mosaic-pill--seal" data-pill="1">
                <img
                  src="/pill-hanboro-crown.jpg"
                  alt="Hanboro Rose Gold Crown & Ruby Jewel Flank"
                  className="mosaic-pill-img mosaic-pill-img--seal"
                  style={{
                    transform: `scale(1.14) translate3d(${img1Offset}px, 0, 0)`,
                    transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
                  }}
                  loading="lazy"
                />
              </div>
            </div>

            <h2 id="philosophy-title" className="mosaic-text mosaic-text--crafted">
              <span className="motion-text-reveal">CRAFTED WITH</span>
            </h2>
          </div>

          {/* ROW 2: "LEGACY" + [Capsule Pill with Casino Roulette Tourbillon Calibre] + Philosophy Text */}
          <div className="mosaic-row mosaic-row--2">
            <span className="mosaic-text mosaic-text--legacy">
              <span className="motion-text-reveal">LEGACY</span>
            </span>

            <div
              className="mosaic-pill-track"
              style={{
                transform: `translate3d(${pill2Offset}px, ${centered * -14}px, 0)`,
                transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
              }}
            >
              <div className="mosaic-pill mosaic-pill--dial" data-pill="2">
                <img
                  src="/pill-hanboro-roulette.jpg"
                  alt="Hanboro Casino Roulette Tourbillon Movement"
                  className="mosaic-pill-img mosaic-pill-img--dial"
                  style={{
                    transform: `scale(1.14) translate3d(${img2Offset}px, 0, 0)`,
                    transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
                  }}
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
          <div className="mosaic-row mosaic-row--3">
            <div
              className="mosaic-pill-track"
              style={{
                transform: `translate3d(${pill3Offset}px, ${centered * 16}px, 0)`,
                transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
              }}
            >
              <div className="mosaic-pill mosaic-pill--wrist" data-pill="3">
                <img
                  src="/pill-hanboro-wrist.jpg"
                  alt="Hanboro Red Tonneau Automatic Watch on Wrist"
                  className="mosaic-pill-img mosaic-pill-img--wrist"
                  style={{
                    transform: `scale(1.14) translate3d(${img3Offset}px, 0, 0)`,
                    transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
                  }}
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
