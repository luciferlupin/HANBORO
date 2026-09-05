import React, { useEffect, useRef, useState, useLayoutEffect } from "react";

const ADVANTAGES_DATA = [
  {
    num: "01",
    tag: "EXCLUSIVITY",
    title: "Timed Rarity",
    desc: "Limited to 100 pieces per reference. No reissues. No exceptions. True exclusivity you can wear with pride."
  },
  {
    num: "02",
    tag: "BALL BEARING CALIBRE",
    title: "Invisible Craft",
    desc: "Hand-finished down to the core. Micro-ceramic ball bearings ensure zero wobble and a 20-second frictionless hypnotic rotor spin."
  },
  {
    num: "03",
    tag: "CHRONOMETER TESTING",
    title: "Signed by Hand",
    desc: "500 hours of master chronometer calibration. Assembled with extreme care, tested for 100M water resistance."
  },
  {
    num: "04",
    tag: "HIGH FREQUENCY",
    title: "Swiss-Inspired Precision",
    desc: "Operating at 28,800 BPH high frequency. Crafted from 316L surgical steel, forged Damascus carbon, and double-domed sapphire."
  }
];

export function SubtleMasterySection({ onExploreCatalog }) {
  const sectionRef = useRef(null);
  const containerRightRef = useRef(null);
  const fillBarRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [spineStyle, setSpineStyle] = useState({ top: 12, height: 360 });
  const itemRefs = useRef([]);

  // Refs for velvety Apple LERP physics loop
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef(null);

  // Measure exact distance between the center of Node 01 and Node 04
  const updateSpineDimensions = () => {
    if (!containerRightRef.current || !itemRefs.current[0] || !itemRefs.current[3]) return;
    const rightRect = containerRightRef.current.getBoundingClientRect();
    const firstNode = itemRefs.current[0].querySelector(".vertical-step-node");
    const lastNode = itemRefs.current[3].querySelector(".vertical-step-node");

    if (firstNode && lastNode) {
      const firstRect = firstNode.getBoundingClientRect();
      const lastRect = lastNode.getBoundingClientRect();

      const top = firstRect.top + firstRect.height / 2 - rightRect.top;
      const bottom = lastRect.top + lastRect.height / 2 - rightRect.top;
      const height = Math.max(bottom - top, 80);

      setSpineStyle({ top, height });
    }
  };

  useLayoutEffect(() => {
    updateSpineDimensions();
    window.addEventListener("resize", updateSpineDimensions);
    return () => window.removeEventListener("resize", updateSpineDimensions);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          updateSpineDimensions();
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const handleScroll = () => {
      if (!itemRefs.current[0] || !itemRefs.current[3]) return;
      const firstNode = itemRefs.current[0].querySelector(".vertical-step-node");
      const lastNode = itemRefs.current[3].querySelector(".vertical-step-node");
      if (!firstNode || !lastNode) return;

      const windowHeight = window.innerHeight;
      const triggerY = windowHeight * 0.5;

      const firstCenterY = firstNode.getBoundingClientRect().top + firstNode.getBoundingClientRect().height / 2;
      const lastCenterY = lastNode.getBoundingClientRect().top + lastNode.getBoundingClientRect().height / 2;
      const totalDistance = lastCenterY - firstCenterY;

      if (totalDistance > 0) {
        const rawProgress = (triggerY - firstCenterY) / totalDistance;
        const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
        targetProgressRef.current = clampedProgress;

        // Clean milestone activation: 01, 02, 03, 04
        let currentStep = 0;
        if (clampedProgress >= 0.85) {
          currentStep = 3;
        } else if (clampedProgress >= 0.52) {
          currentStep = 2;
        } else if (clampedProgress >= 0.18) {
          currentStep = 1;
        } else {
          currentStep = 0;
        }
        setActiveStep(currentStep);
      }
    };

    // Apple 60/120fps LERP smoothing loop
    const lerpLoop = () => {
      // Smooth lerp damping
      currentProgressRef.current += (targetProgressRef.current - currentProgressRef.current) * 0.1;

      if (fillBarRef.current) {
        const scale = Math.min(Math.max(currentProgressRef.current, 0), 1);
        fillBarRef.current.style.transform = `scaleY(${scale})`;
      }

      rafIdRef.current = requestAnimationFrame(lerpLoop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    rafIdRef.current = requestAnimationFrame(lerpLoop);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`subtle-mastery-section ${inView ? "is-in-view" : ""}`}
      id="subtle-mastery"
      aria-labelledby="subtle-mastery-title"
    >
      <div className="subtle-mastery__container subtle-mastery__container--vertical">
        {/* Left Column: Sticky Centered Editorial Headline */}
        <div className="vertical-timeline__left" data-reveal>
          <h2 id="subtle-mastery-title" className="vertical-timeline__title">
            The Art<br />
            <span>of Subtle Mastery</span>
          </h2>
        </div>

        {/* Right Column: Compact Perfectly Framed Timeline */}
        <div ref={containerRightRef} className="vertical-timeline__right">
          {/* Vertical Laser Spine Line mathematically anchored from Dot 01 to Dot 04 */}
          <div
            className="vertical-spine"
            style={{
              top: `${spineStyle.top}px`,
              height: `${spineStyle.height}px`
            }}
            aria-hidden="true"
          >
            <div className="vertical-spine__bg" />
            <div
              ref={fillBarRef}
              className="vertical-spine__fill"
            />
          </div>

          {/* 4 Vertical Step Cards */}
          <div className="vertical-timeline__items">
            {ADVANTAGES_DATA.map((item, idx) => {
              const isPassed = idx < activeStep;
              const isCurrent = idx === activeStep;
              const isActive = idx <= activeStep;

              return (
                <article
                  key={item.num}
                  ref={(el) => (itemRefs.current[idx] = el)}
                  className={`vertical-step-card ${isActive ? "is-active" : ""} ${isCurrent ? "is-current" : ""}`}
                >
                  {/* Step Beacon Node placed dead-center on the vertical line */}
                  <div className="vertical-step-node">
                    <div className="vertical-node-pulse" />
                    <div className="vertical-node-dot">
                      <span className="vertical-node-core" />
                    </div>
                  </div>

                  {/* Step Card Content */}
                  <div className="vertical-step-content">
                    <div className="vertical-step-meta">
                      <span className="vertical-step-num">{item.num}</span>
                      <span className="vertical-step-badge">
                        {isCurrent ? "ACTIVE" : isPassed ? "VERIFIED" : "ATELIER"}
                      </span>
                    </div>
                    <h3 className="vertical-step-title">{item.title}</h3>
                    <p className="vertical-step-desc">{item.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SubtleMasterySection;
