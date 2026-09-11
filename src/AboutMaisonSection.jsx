import React, { useEffect, useRef, useState } from "react";

export function AboutMaisonSection() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0.5);

  useEffect(() => {
    // Check initial visibility on mount
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setInView(true);
      }
    }

    // IntersectionObserver for entrance reveal
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.05, rootMargin: "60px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Scroll progress handler for interactive motion scroll parallax
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

          if (currentDist > 0 && currentDist < totalDist + 200) {
            setInView(true);
          }
        }
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Fallback timer ensures elements are never stuck hidden
    const fallbackTimer = setTimeout(() => {
      setInView(true);
    }, 700);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Centered scroll factor (-1 to +1, 0 when centered in screen)
  const centered = (scrollProgress - 0.5) * 2;

  // Kinetic scroll offsets for layered perspective
  const raysOffset = centered * 36;
  const titleOffset = centered * -24;
  const p1Offset = centered * -14;
  const p2Offset = centered * -4;
  const p3Offset = centered * 8;
  const signatureOffset = centered * 16;
  const dialOffset = centered * 24;
  const dialRotation = centered * 28;

  return (
    <section
      ref={sectionRef}
      className={`about-maison-section ${inView ? "is-in-view" : ""}`}
      id="about-maison"
      aria-labelledby="about-maison-title"
    >
      {/* Hairline Architectural Perspective Rays in Signature Signal Red with Scroll Motion */}
      <div
        className="about-maison__geometry-bg"
        aria-hidden="true"
        style={{
          transform: `translate3d(0, ${raysOffset}px, 0) scale(${1 + (1 - Math.abs(centered)) * 0.05})`,
          transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
        }}
      >
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="about-perspective-svg">
          {/* Perspective Ray from top-left */}
          <line x1="120" y1="0" x2="720" y2="780" stroke="rgba(217, 20, 20, 0.4)" strokeWidth="1" />
          <line x1="0" y1="60" x2="720" y2="780" stroke="rgba(217, 20, 20, 0.16)" strokeWidth="1" />
          
          {/* Perspective Ray from top-right */}
          <line x1="1320" y1="0" x2="720" y2="780" stroke="rgba(217, 20, 20, 0.4)" strokeWidth="1" />
          <line x1="1440" y1="60" x2="720" y2="780" stroke="rgba(217, 20, 20, 0.16)" strokeWidth="1" />
          
          {/* Subtle horizontal baseline */}
          <line x1="280" y1="780" x2="1160" y2="780" stroke="rgba(217, 20, 20, 0.14)" strokeWidth="1" strokeDasharray="3 6" />
        </svg>
      </div>

      <div className="about-maison__container">
        {/* Editorial Heading with Motion Scroll Float */}
        <h2
          id="about-maison-title"
          className="about-maison__title"
          style={{
            transform: `translate3d(0, ${titleOffset}px, 0)`,
            transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
          }}
        >
          ABOUT
        </h2>

        {/* 3 Editorial Manifesto Paragraphs with Staggered Kinetic Motion */}
        <div className="about-maison__content">
          <p
            className="about-maison__paragraph about-maison__paragraph--1"
            style={{
              transform: `translate3d(0, ${p1Offset}px, 0)`,
              transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
            }}
          >
            The project represents an unconstrained vision for a modern horological house, shaped by centuries of high-frequency Swiss watchmaking heritage and micromechanical mastery.
          </p>

          <p
            className="about-maison__paragraph about-maison__paragraph--2"
            style={{
              transform: `translate3d(0, ${p2Offset}px, 0)`,
              transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
            }}
          >
            It tells the story of the HANBORO atelier through the lens of pure kinetic brilliance, where value is found in proportion, zero-wobble ceramic engineering, and time itself — rather than overt expression.
          </p>

          <p
            className="about-maison__paragraph about-maison__paragraph--3"
            style={{
              transform: `translate3d(0, ${p3Offset}px, 0)`,
              transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
            }}
          >
            HANBORO draws inspiration from celestial tourbillons, casino roulette complications, and open-worked skeleton calibres, reflecting an architectural approach to design, restrained elegance, and the ability to turn mechanical form into a lasting symbol.
          </p>
        </div>

        {/* Vertical Kicker with Kinetic Drift */}
        <div className="about-maison__crafted-by">
          <span>C</span>
          <span>R</span>
          <span>A</span>
          <span>F</span>
          <span>T</span>
          <span>E</span>
          <span>D</span>
          <span className="crafted-space" />
          <span>B</span>
          <span>Y</span>
        </div>

        {/* Master Horologer Cursive Signature with Dynamic Rotation */}
        <div
          className="about-maison__signature-wrap"
          style={{
            transform: `translate3d(0, ${signatureOffset}px, 0) rotate(${-3 + centered * 4}deg)`,
            transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
          }}
        >
          <span className="about-maison__signature">Atelier Hanboro</span>
        </div>

        {/* Center Complication Dial / Tourbillon Escapement with Dynamic Scroll Rotation */}
        <div
          className="about-maison__complication"
          aria-hidden="true"
          style={{
            transform: `translate3d(0, ${dialOffset}px, 0) rotate(${dialRotation}deg)`,
            transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)"
          }}
        >
          <svg viewBox="0 0 240 160" className="complication-dial-svg">
            {/* Upper radiating rays */}
            <line x1="120" y1="26" x2="120" y2="8" stroke="#d91414" strokeWidth="1" opacity="0.6" />
            <line x1="82" y1="36" x2="68" y2="22" stroke="#d91414" strokeWidth="1" opacity="0.6" />
            <line x1="158" y1="36" x2="172" y2="22" stroke="#d91414" strokeWidth="1" opacity="0.6" />
            <line x1="48" y1="70" x2="28" y2="65" stroke="#d91414" strokeWidth="1" opacity="0.6" />
            <line x1="192" y1="70" x2="212" y2="65" stroke="#d91414" strokeWidth="1" opacity="0.6" />

            {/* Outer Concentric Dials */}
            <circle cx="120" cy="80" r="62" fill="none" stroke="#d91414" strokeWidth="1" opacity="0.32" />
            <circle cx="120" cy="80" r="48" fill="none" stroke="#d91414" strokeWidth="1" strokeDasharray="2 4" opacity="0.45" />
            <circle cx="120" cy="80" r="34" fill="none" stroke="#d91414" strokeWidth="1.2" opacity="0.75" />

            {/* Lower Crescent Tourbillon Bridge */}
            <path
              d="M 66 80 A 54 54 0 0 0 174 80 L 160 80 A 40 40 0 0 1 80 80 Z"
              fill="rgba(217, 20, 20, 0.08)"
              stroke="#d91414"
              strokeWidth="1.2"
            />

            {/* Sub-crescent inner arch */}
            <path
              d="M 88 80 A 32 32 0 0 0 152 80"
              fill="none"
              stroke="#d91414"
              strokeWidth="1"
              opacity="0.6"
            />

            {/* Center Pivot Ring & Solid Core */}
            <circle cx="120" cy="80" r="13" fill="#f7f4ee" stroke="#d91414" strokeWidth="1.5" />
            <circle cx="120" cy="80" r="7.5" fill="#121214" stroke="#d91414" strokeWidth="1" />
            <circle cx="120" cy="80" r="3" fill="#d91414" />

            {/* Subtle rotating kinetic balance indicator */}
            <g className="complication-balance-wheel">
              <line x1="120" y1="80" x2="120" y2="52" stroke="#d91414" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="120" y1="80" x2="145" y2="94" stroke="#121214" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}

export default AboutMaisonSection;
