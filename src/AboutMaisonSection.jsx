import React, { useEffect, useRef } from "react";

const MAISON_CHAPTERS = [
  {
    number: "01",
    eyebrow: "THE MAISON",
    title: "Time, made visible.",
    copy: "HANBORO turns mechanical precision into modern sculpture — expressive on the wrist, considered in every proportion.",
    feature: "/watch-casino-roulette-silver-diamond-emerald-wheel-transparent.png",
    featureAlt: "Hanboro roulette complication",
    detail: "/pillar-03-signed-by-hand.jpg",
    detailAlt: "Hanboro hand finishing detail",
    metric: "360°",
    metricLabel: "KINETIC EXPRESSION",
  },
  {
    number: "02",
    eyebrow: "ARCHITECTURAL FORM",
    title: "Designed from the inside out.",
    copy: "Open-worked calibres, tensioned bridges and unapologetic cases reveal the energy normally hidden beneath the dial.",
    feature: "/watch-cyber-cogwheel-skeleton-rosegold-front.webp",
    featureAlt: "Hanboro open-worked rose gold watch",
    detail: "/watch-forged-carbon-ribbed-shield-supercar.jpg",
    detailAlt: "Hanboro forged carbon watch with supercar",
    metric: "01",
    metricLabel: "BOLD DESIGN LANGUAGE",
  },
  {
    number: "03",
    eyebrow: "MATERIAL INTELLIGENCE",
    title: "Engineered to be felt.",
    copy: "Sapphire crystal, stainless steel and forged-carbon forms are balanced for presence without sacrificing everyday performance.",
    feature: "/watch-powerreserve-opaline-profile-transparent.png",
    featureAlt: "Hanboro Power Reserve profile",
    detail: "/watch-celestial-pilot-moonphase-rosegold-wrist-macro.jpg",
    detailAlt: "Hanboro celestial watch worn on wrist",
    metric: "42h",
    metricLabel: "MECHANICAL RESERVE",
  },
  {
    number: "04",
    eyebrow: "A NEW GENERATION",
    title: "Luxury without convention.",
    copy: "A contemporary house for collectors who choose character over consensus and make every second distinctly their own.",
    feature: "/watch-celestial-dragon-tourbillon-silver-isometric-detail-transparent.png",
    featureAlt: "Hanboro Celestial Dragon detail",
    detail: "/store-signage.webp",
    detailAlt: "Hanboro atelier signage",
    metric: "∞",
    metricLabel: "ORIGINAL BY DESIGN",
  },
];

export function AboutMaisonSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const cards = [...section.querySelectorAll(".maison-chapter")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 760px), (max-height: 720px)");
    let frame = 0;
    let current = 0;
    let target = 0;

    const render = () => {
      current += (target - current) * 0.105;
      if (Math.abs(current - target) < 0.0005) current = target;
      section.style.setProperty("--maison-progress", current);

      cards.forEach((card, index) => {
        const distance = current * (cards.length - 1) - index;
        card.style.setProperty("--chapter-distance", distance);
        const active = Math.abs(distance) <= 0.5;
        card.classList.toggle("is-active", active);
        card.setAttribute(
          "aria-hidden",
          String(!compact.matches && !reducedMotion.matches && !active),
        );
      });

      frame = current !== target ? requestAnimationFrame(render) : 0;
    };

    const update = () => {
      const bounds = section.getBoundingClientRect();
      target = Math.max(
        0,
        Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight)),
      );
      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    reducedMotion.addEventListener("change", update);
    update();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="about-maison-section maison-scroll-story"
      id="about-maison"
      aria-labelledby="about-maison-title"
    >
      <div className="maison-stage">
        <header className="maison-story-header">
          <span>CHAPTER 01 / 07 · THE MAKING OF TIME</span>
          <h2 id="about-maison-title">Inside the <em>machine.</em></h2>
          <span>SCROLL TO EXPLORE</span>
        </header>

        <div className="maison-scenes">
          {MAISON_CHAPTERS.map((chapter, index) => (
            <article
              className={`maison-chapter ${index === 0 ? "is-active" : ""}`}
              key={chapter.eyebrow}
            >
              <div className="maison-bento">
                <div className="maison-copy-card">
                  <div className="maison-copy-meta">
                    <span>{chapter.number}</span>
                    <span>{chapter.eyebrow}</span>
                  </div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.copy}</p>
                  <div className="maison-copy-rule" aria-hidden="true" />
                </div>

                <figure className="maison-feature-card">
                  <span className="maison-corner-label">OBJECT / {chapter.number}</span>
                  <img src={chapter.feature} alt={chapter.featureAlt} loading={index === 0 ? "eager" : "lazy"} />
                  <figcaption>PRECISION IN MOTION</figcaption>
                </figure>

                <figure className="maison-detail-card">
                  <img src={chapter.detail} alt={chapter.detailAlt} loading="lazy" />
                  <figcaption>DETAIL STUDY</figcaption>
                </figure>

                <div className="maison-metric-card" aria-label={`${chapter.metric} ${chapter.metricLabel}`}>
                  <strong>{chapter.metric}</strong>
                  <span>{chapter.metricLabel}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="maison-story-footer">
          <span>FORM</span>
          <div className="maison-progress-track"><i /></div>
          <span>FUTURE</span>
        </footer>
      </div>
    </section>
  );
}

export default AboutMaisonSection;
