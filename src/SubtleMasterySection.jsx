import React, { useEffect, useRef, useState, useLayoutEffect, memo, useCallback } from "react";

const ADVANTAGES_DATA = [
  {
    num: "01",
    tag: "JAPANESE AUTOMATIC MOVEMENTS",
    title: "Precision in Every Revolution",
    desc: "Selected automatic movements engineered for reliable performance and the mechanical experience that defines true watchmaking."
  },
  {
    num: "02",
    tag: "BOLD DESIGN LANGUAGE",
    title: "Built to Be Noticed",
    desc: "From skeleton dials and tonneau cases to racing-inspired forms, every HANBORO timepiece is designed to make a statement."
  },
  {
    num: "03",
    tag: "PREMIUM MATERIALS",
    title: "Crafted Beyond the Surface",
    desc: "Sapphire crystal, stainless steel, carbon-inspired construction and carefully selected materials built for everyday performance."
  },
  {
    num: "04",
    tag: "MADE FOR THE NEXT GENERATION",
    title: "Luxury Without Convention",
    desc: "HANBORO combines traditional mechanical watchmaking with bold contemporary design—created for those who choose their own direction."
  }
];

export function SubtleMasterySection({ onExploreCatalog }) {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const fillBarRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [inView, setInView] = useState(false);
  const [spineStyle, setSpineStyle] = useState({ top: 16, height: 360 });
  const itemRefs = useRef([]);

  // Refs for 120fps requestAnimationFrame LERP loop
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const rafIdRef = useRef(null);
  const inViewRef = useRef(false);
  const isLerpingRef = useRef(false);

  // Cached geometry bounds to eliminate DOM reflows during scroll
  const boundsRef = useRef({
    firstNodeCenter: 0,
    lastNodeCenter: 0,
    totalDistance: 1
  });

  // Measure exact distance between the center of Node 01 and Node 04
  const updateSpineDimensions = useCallback(() => {
    if (!containerRef.current || !itemRefs.current[0] || !itemRefs.current[3]) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const firstNode = itemRefs.current[0].querySelector(".vertical-step-node");
    const lastNode = itemRefs.current[3].querySelector(".vertical-step-node");

    if (firstNode && lastNode) {
      const firstRect = firstNode.getBoundingClientRect();
      const lastRect = lastNode.getBoundingClientRect();

      const top = firstRect.top + firstRect.height / 2 - containerRect.top;
      const bottom = lastRect.top + lastRect.height / 2 - containerRect.top;
      const height = Math.max(bottom - top, 80);

      setSpineStyle({ top, height });

      // Cache viewport-independent relative metrics
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      boundsRef.current = {
        firstNodeCenter: firstRect.top + firstRect.height / 2 + scrollY,
        lastNodeCenter: lastRect.top + lastRect.height / 2 + scrollY,
        totalDistance: Math.max((lastRect.top + lastRect.height / 2) - (firstRect.top + firstRect.height / 2), 1)
      };
    }
  }, []);

  useLayoutEffect(() => {
    updateSpineDimensions();
    window.addEventListener("resize", updateSpineDimensions);
    return () => window.removeEventListener("resize", updateSpineDimensions);
  }, [updateSpineDimensions]);

  // High-performance direct LERP loop
  const startLerp = useCallback(() => {
    if (isLerpingRef.current) return;
    isLerpingRef.current = true;

    const step = () => {
      if (!inViewRef.current) {
        isLerpingRef.current = false;
        return;
      }

      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) < 0.0004) {
        currentProgressRef.current = targetProgressRef.current;
        if (fillBarRef.current) {
          fillBarRef.current.style.transform = `scaleY(${currentProgressRef.current})`;
        }
        isLerpingRef.current = false;
        return;
      }

      currentProgressRef.current += diff * 0.16;
      if (fillBarRef.current) {
        fillBarRef.current.style.transform = `scaleY(${currentProgressRef.current})`;
      }
      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setInView(true);
          updateSpineDimensions();
          startLerp();
        }
      },
      { threshold: 0.05 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Scroll listener using cached geometry — 0ms reflow, pure math
    let ticking = false;
    const handleScroll = () => {
      if (!inViewRef.current || ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const { firstNodeCenter, totalDistance } = boundsRef.current;
        if (totalDistance > 1) {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          const triggerY = scrollY + window.innerHeight * 0.5;

          const rawProgress = (triggerY - firstNodeCenter) / totalDistance;
          const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
          targetProgressRef.current = clampedProgress;

          // Smooth step thresholds matching the 3 timeline segments
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

          setActiveStep((prev) => (prev !== currentStep ? currentStep : prev));
          startLerp();
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      isLerpingRef.current = false;
    };
  }, [updateSpineDimensions, startLerp]);

  return (
    <section
      ref={sectionRef}
      className={`subtle-mastery-section ${inView ? "is-in-view" : ""}`}
      id="subtle-mastery"
      aria-labelledby="subtle-mastery-title"
    >
      <div className="subtle-mastery__container">
        {/* Centered Editorial Heading on Top */}
        <div className="subtle-mastery__header" data-reveal>
          <span className="subtle-mastery__kicker">ATELIER ARCHITECTURE</span>
          <h2 id="subtle-mastery-title" className="subtle-mastery__title">
            The Art <em>of Modern Horology</em>
          </h2>
          <div className="subtle-mastery__divider" aria-hidden="true" />
        </div>

        {/* Centered Alternating Timeline: Left & Right steps around Center Line */}
        <div ref={containerRef} className="timeline-center-stage">
          {/* Aesthetic Thin Center Line */}
          <div
            className="timeline-center-spine"
            style={{
              top: `${spineStyle.top}px`,
              height: `${spineStyle.height}px`
            }}
            aria-hidden="true"
          >
            <div className="timeline-center-spine__bg" />
            <div
              ref={fillBarRef}
              className="timeline-center-spine__fill"
            />
          </div>

          {/* 4 Alternating Step Rows */}
          <div className="timeline-center-rows">
            {ADVANTAGES_DATA.map((item, idx) => {
              const isLeft = idx % 2 === 0;
              const isCurrent = idx === activeStep;
              const isActive = idx <= activeStep;

              return (
                <div
                  key={item.num}
                  ref={(el) => (itemRefs.current[idx] = el)}
                  className={`timeline-row timeline-row--${isLeft ? "left" : "right"} ${isActive ? "is-active" : ""} ${isCurrent ? "is-current" : ""}`}
                >
                  {/* Left Column */}
                  {isLeft ? (
                    <div className="timeline-col timeline-col--card timeline-col--left">
                      <article
                        className="timeline-card timeline-card--left"
                        onClick={() => setActiveStep(idx)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="timeline-card__meta">
                          <span className="timeline-card__badge">{item.tag}</span>
                          <span className="timeline-card__sep" aria-hidden="true">—</span>
                          <span className="timeline-card__num">{item.num}</span>
                        </div>
                        <h3 className="timeline-card__title">{item.title}</h3>
                        <p className="timeline-card__desc">{item.desc}</p>
                      </article>
                    </div>
                  ) : (
                    <div className="timeline-col timeline-col--spacer" aria-hidden="true" />
                  )}

                  {/* Center Column: Beacon Node dead-center on the line */}
                  <div
                    className="timeline-col timeline-col--node"
                    onClick={() => setActiveStep(idx)}
                    style={{ cursor: "pointer" }}
                    title={`Step ${item.num}: ${item.title}`}
                  >
                    <div className="vertical-step-node">
                      <div className="vertical-node-pulse" />
                      <div className="vertical-node-dot">
                        <span className="vertical-node-core" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  {!isLeft ? (
                    <div className="timeline-col timeline-col--card timeline-col--right">
                      <article
                        className="timeline-card timeline-card--right"
                        onClick={() => setActiveStep(idx)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="timeline-card__meta">
                          <span className="timeline-card__num">{item.num}</span>
                          <span className="timeline-card__sep" aria-hidden="true">—</span>
                          <span className="timeline-card__badge">{item.tag}</span>
                        </div>
                        <h3 className="timeline-card__title">{item.title}</h3>
                        <p className="timeline-card__desc">{item.desc}</p>
                      </article>
                    </div>
                  ) : (
                    <div className="timeline-col timeline-col--spacer" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SubtleMasterySection;
