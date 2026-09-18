import React, { useState, useEffect } from "react";

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

function ReviewCard({ review }) {
  return (
    <div className="cr-card">
      <div className="cr-card-top">
        <div className="cr-stars" aria-label={`${review.rating || 5} out of 5 stars`}>
          ★★★★★
        </div>
        <div className="cr-verified-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Verified Collector</span>
        </div>
      </div>

      <p className="cr-quote">"{review.quote}"</p>

      <div className="cr-author-row">
        <div className="cr-watch-thumb" aria-hidden="true">
          <img
            src={review.photo || "/watch-architectural-skeleton-black-front-transparent.webp"}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="cr-author-info">
          <span className="cr-author-name">{review.author}</span>
          {review.location && (
            <span className="cr-author-location">{review.location}</span>
          )}
          {review.watchName && (
            <span className="cr-watch-model">{review.watchName}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection({ onInspectSku }) {
  const [reviewsList, setReviewsList] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("hanboro_collector_reviews");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return [...parsed, ...TESTIMONIALS_DATA];
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return TESTIMONIALS_DATA;
  });

  // Live-update when new reviews are submitted in ContactSection
  useEffect(() => {
    const handleReviewAdded = () => {
      try {
        const saved = localStorage.getItem("hanboro_collector_reviews");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviewsList([...parsed, ...TESTIMONIALS_DATA]);
          }
        }
      } catch (e) {}
    };

    window.addEventListener("hanboro_review_added", handleReviewAdded);
    return () => window.removeEventListener("hanboro_review_added", handleReviewAdded);
  }, []);

  return (
    <section className="cr-section" id="acclaim" aria-labelledby="cr-title">
      {/* Editorial Header */}
      <div className="cr-header" data-reveal>
        <div className="cr-eyebrow">
          <span className="cr-beacon-dot" aria-hidden="true" />
          <span>VERIFIED PATRONS & REVIEWS</span>
        </div>
        <h2 className="cr-title" id="cr-title">
          Customer Reviews
        </h2>
        <p className="cr-subtitle">
          Authentic impressions and on-wrist experiences from collectors worldwide.
        </p>
      </div>

      {/* Seamless Continuous Loop Moving Carousel (No Hover Interruption) */}
      <div className="cr-carousel-wrapper" aria-label="Customer reviews marquee">
        <div className="cr-carousel-track">
          {/* Primary Group */}
          <div className="cr-carousel-group">
            {reviewsList.map((review, i) => (
              <ReviewCard key={`rev-a-${review.id || i}`} review={review} />
            ))}
          </div>
          {/* Duplicate Group for Seamless Infinite Loop */}
          <div className="cr-carousel-group" aria-hidden="true">
            {reviewsList.map((review, i) => (
              <ReviewCard key={`rev-b-${review.id || i}`} review={review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
