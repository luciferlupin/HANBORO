import React, { useState, useEffect, useRef } from "react";

export const TESTIMONIALS_DATA = [
  {
    id: "rev-1",
    author: "Sophia Bennett",
    location: "London, Mayfair",
    watchSku: "astonia-chronograph",
    watchName: "Astonia Skeleton Chronograph",
    photo: "/watch-architectural-skeleton-black-front-transparent.webp",
    quote:
      "I couldn't be happier with my purchase! The watch is absolutely stunning and exudes elegance. The quality is impeccable, and it has quickly become my favourite accessory, perfect for both daily wear and special occasions.",
    rating: 5,
  },
  {
    id: "rev-2",
    author: "Alexander Vance",
    location: "Geneva, Switzerland",
    watchSku: "world-map-tourbillon",
    watchName: "World Map Tourbillon Rosegold",
    photo: "/watch-world-map-tourbillon-rosegold-front-transparent.webp",
    quote:
      "The cartographic dial is a work of art in itself. Every continent is hand-etched with extraordinary precision, and the flying tourbillon bridges the gap between horology and fine jewellery.",
    rating: 5,
  },
  {
    id: "rev-3",
    author: "Dr. Vikramaditya Singhania",
    location: "Mumbai & Dubai",
    watchSku: "volcano-compass",
    watchName: "Volcano Glacier Compass Gold",
    photo: "/watch-volcano-glacier-compass-gold-macro-transparent.webp",
    quote:
      "The compass bezel spins with a satisfying mechanical click. It is the single most complimented timepiece in my collection — everyone asks where I found it.",
    rating: 5,
  },
  {
    id: "rev-4",
    author: "Julian K. Sommer",
    location: "Munich, Germany",
    watchSku: "celestial-dragon",
    watchName: "Celestial Dragon Flying Tourbillon",
    photo: "/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp",
    quote:
      "Sculptural wrist architecture in the purest sense. The hand-engraved dragon wrapping around the flying tourbillon cage balances mythology with brutalist geometry unlike anything I have seen.",
    rating: 5,
  },
  {
    id: "rev-5",
    author: "Kenji Takahashi",
    location: "Tokyo, Ginza",
    watchSku: "arctic-tonneau",
    watchName: "Arctic Tonneau 10 ATM White",
    photo: "/watch-arctic-tonneau-10atm-white-front-transparent.webp",
    quote:
      "The tonneau case sits perfectly on the wrist, and the white ceramic finish has stayed flawless through daily wear. A modern masterpiece that looks equally at home with a suit or streetwear.",
    rating: 5,
  },
  {
    id: "rev-6",
    author: "Elena Rostova",
    location: "New York, Manhattan",
    watchSku: "cyber-cogwheel",
    watchName: "Cyber Cogwheel Skeleton Two-Tone",
    photo: "/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp",
    quote:
      "From the bespoke presentation box to the weight distribution on the wrist, Hanboro sets a new standard for modern avant-garde luxury. Every detail commands attention.",
    rating: 5,
  },
];

function StarRating({ count = 5 }) {
  return (
    <span className="cr-stars" aria-label={`${count} stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export function TestimonialsSection({ onInspectSku }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const total = TESTIMONIALS_DATA.length;

  const goto = (idx, dir) => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((idx + total) % total);
      setIsAnimating(false);
    }, 320);
  };

  const handlePrev = () => goto(activeIndex - 1, -1);
  const handleNext = () => goto(activeIndex + 1, 1);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => handleNext(), 7000);
    return () => clearInterval(timerRef.current);
  }, [isPaused, activeIndex, isAnimating]);

  const current = TESTIMONIALS_DATA[activeIndex];
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section
      className="cr-section"
      id="acclaim"
      aria-labelledby="cr-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Section heading */}
      <div className="cr-heading">
        <span className="cr-dash" aria-hidden="true">—</span>
        <h2 className="cr-title" id="cr-title">Customer Reviews</h2>
      </div>

      {/* Main stage */}
      <div className="cr-stage">
        {/* Prev arrow */}
        <button
          type="button"
          className="cr-arrow cr-arrow--prev"
          onClick={handlePrev}
          aria-label="Previous review"
        >
          &#8249;
        </button>

        {/* Content row */}
        <div className={`cr-content ${isAnimating ? (direction > 0 ? "cr-exit-left" : "cr-exit-right") : ""}`}>
          {/* Photo */}
          <div className="cr-photo-wrap">
            <img
              key={current.id}
              src={current.photo}
              alt={current.watchName}
              className="cr-photo"
              loading="eager"
            />
          </div>

          {/* Text */}
          <div className="cr-text-col">
            <p className="cr-quote">{current.quote}</p>

            <div className="cr-meta">
              <div className="cr-meta-left">
                <span className="cr-author">{current.author}</span>
                <StarRating count={current.rating} />
              </div>
              <span className="cr-counter" aria-live="polite">
                {pad(activeIndex + 1)}/{pad(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Next arrow */}
        <button
          type="button"
          className="cr-arrow cr-arrow--next"
          onClick={handleNext}
          aria-label="Next review"
        >
          &#8250;
        </button>
      </div>
    </section>
  );
}
