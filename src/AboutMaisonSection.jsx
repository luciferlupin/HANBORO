import React, { useState, useEffect, useRef } from "react";

export const MANIFESTO_PARAGRAPHS = [
  "The project represents an unconstrained vision for a modern horological house, shaped by centuries of high-frequency Swiss watchmaking heritage and micromechanical mastery.",
  "It tells the story of the HANBORO atelier through the lens of pure kinetic brilliance, where value is found in proportion, zero-wobble ceramic engineering, and time itself — rather than overt expression.",
  "HANBORO draws inspiration from celestial tourbillons, casino roulette complications, and open-worked skeleton calibres, reflecting an architectural approach to design, restrained elegance, and the ability to turn mechanical form into a lasting symbol."
];

export function AboutMaisonSection() {
  const sectionRef = useRef(null);
  const [isArrived, setIsArrived] = useState(false);

  // Trigger arrival smoothly when entering viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsArrived(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`about-maison-section ${isArrived ? "is-arrived" : ""}`}
      id="about-maison"
      aria-labelledby="about-maison-title"
    >
      {/* Hairline Architectural Perspective Rays in Signature Signal Red */}
      <div className="about-maison__geometry-bg" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="about-perspective-svg">
          <line
            x1="120"
            y1="0"
            x2="720"
            y2="780"
            stroke="rgba(217, 20, 20, 0.12)"
            strokeWidth="1"
            className="about-perspective-ray"
          />
          <line
            x1="0"
            y1="60"
            x2="720"
            y2="780"
            stroke="rgba(217, 20, 20, 0.08)"
            strokeWidth="1"
            className="about-perspective-ray"
          />
          <line
            x1="1320"
            y1="0"
            x2="720"
            y2="780"
            stroke="rgba(217, 20, 20, 0.12)"
            strokeWidth="1"
            className="about-perspective-ray"
          />
          <line
            x1="1440"
            y1="60"
            x2="720"
            y2="780"
            stroke="rgba(217, 20, 20, 0.08)"
            strokeWidth="1"
            className="about-perspective-ray"
          />
          <line
            x1="280"
            y1="780"
            x2="1160"
            y2="780"
            stroke="rgba(217, 20, 20, 0.08)"
            strokeWidth="1"
            strokeDasharray="3 6"
            className="about-perspective-baseline"
          />
        </svg>
      </div>

      <div className="about-maison__container">
        {/* Iconic Editorial Heading */}
        <h2 id="about-maison-title" className="about-maison__title">
          ABOUT
        </h2>

        {/* 3 Editorial Manifesto Paragraphs with Fluid Hardware-Accelerated Staggered Reveal */}
        <div className="about-maison__content">
          {MANIFESTO_PARAGRAPHS.map((fullParaText, index) => (
            <p
              key={index}
              className={`about-maison__paragraph about-maison__paragraph--clean ${isArrived ? "is-visible" : ""}`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {fullParaText}
            </p>
          ))}
        </div>

        {/* Harmonious Outro: Horizontal CRAFTED BY kicker, Master Signature & Complication Seal */}
        <div className="about-maison__outro">
          <div className="about-maison__kicker-wrap">
            <span className="about-maison__kicker-line" aria-hidden="true" />
            <span className="about-maison__kicker-text">CRAFTED BY</span>
            <span className="about-maison__kicker-line" aria-hidden="true" />
          </div>

          <div className="about-maison__signature-wrap">
            <span className="about-maison__signature">Atelier Hanboro</span>
          </div>

          <div className="about-maison__complication" aria-hidden="true">
            <svg viewBox="0 0 240 160" className="complication-dial-svg">
              <line x1="120" y1="26" x2="120" y2="8" stroke="#d91414" strokeWidth="1" opacity="0.6" />
              <line x1="82" y1="36" x2="68" y2="22" stroke="#d91414" strokeWidth="1" opacity="0.6" />
              <line x1="158" y1="36" x2="172" y2="22" stroke="#d91414" strokeWidth="1" opacity="0.6" />
              <line x1="48" y1="70" x2="28" y2="65" stroke="#d91414" strokeWidth="1" opacity="0.6" />
              <line x1="192" y1="70" x2="212" y2="65" stroke="#d91414" strokeWidth="1" opacity="0.6" />

              <circle cx="120" cy="80" r="62" fill="none" stroke="#d91414" strokeWidth="1" opacity="0.32" />
              <circle cx="120" cy="80" r="48" fill="none" stroke="#d91414" strokeWidth="1" strokeDasharray="2 4" opacity="0.45" />
              <circle cx="120" cy="80" r="34" fill="none" stroke="#d91414" strokeWidth="1.2" opacity="0.75" />

              <path
                d="M 66 80 A 54 54 0 0 0 174 80 L 160 80 A 40 40 0 0 1 80 80 Z"
                fill="rgba(217, 20, 20, 0.08)"
                stroke="#d91414"
                strokeWidth="1.2"
              />

              <path
                d="M 88 80 A 32 32 0 0 0 152 80"
                fill="none"
                stroke="#d91414"
                strokeWidth="1"
                opacity="0.6"
              />

              <circle cx="120" cy="80" r="13" fill="#f7f4ee" stroke="#d91414" strokeWidth="1.5" />
              <circle cx="120" cy="80" r="7.5" fill="#121214" stroke="#d91414" strokeWidth="1" />
              <circle cx="120" cy="80" r="3" fill="#d91414" />

              <g className="complication-balance-wheel">
                <line x1="120" y1="80" x2="120" y2="52" stroke="#d91414" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="120" y1="80" x2="145" y2="94" stroke="#121214" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutMaisonSection;
