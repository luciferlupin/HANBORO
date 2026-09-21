import React, { useState } from "react";

const WATCH_OPTIONS = [
  { label: "Casino Roulette 18K Rose Gold", photo: "/watch-casino-roulette-rosegold-wrist-angle.jpg" },
  { label: "Astonia Skeleton Chronograph", photo: "/watch-architectural-skeleton-black-front-transparent.webp" },
  { label: "Astroworld Celestial Moonphase", photo: "/watch-astroworld-moon-silver-racetrack.jpg" },
  { label: "Mecha Cantilever Flying Tourbillon", photo: "/watch-mecha-cantilever-tourbillon-iceblue-wrist.webp" },
  { label: "Volcano Glacier Compass Gold", photo: "/watch-volcano-glacier-compass-gold-macro-transparent.webp" },
  { label: "Celestial Dragon Flying Tourbillon", photo: "/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp" },
  { label: "Arctic Tonneau 10 ATM White", photo: "/watch-arctic-tonneau-10atm-white-front-transparent.webp" },
  { label: "Cyber Cogwheel Skeleton Two-Tone", photo: "/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp" },
  { label: "Clover King Imperial Emerald", photo: "/clover-king-night-glow.webp" },
  { label: "Supercar Engine Block Titanium", photo: "/watch-supercar-engine-block-silver-driving.webp" },
  { label: "Other HANBORO Timepiece", photo: "/watch-architectural-skeleton-black-front-transparent.webp" }
];

export function ContactSection() {
  const [activeTab, setActiveTab] = useState("review"); // 'review' | 'message'
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedWatch, setSelectedWatch] = useState(WATCH_OPTIONS[0].label);
  const [authorName, setAuthorName] = useState("");
  const [location, setLocation] = useState("");
  const [quote, setQuote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Message form state
  const [msgName, setMsgName] = useState("");
  const [msgEmail, setMsgEmail] = useState("");
  const [msgTopic, setMsgTopic] = useState("Atelier Commission");
  const [msgBody, setMsgBody] = useState("");
  const [msgSuccess, setMsgSuccess] = useState(false);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!authorName.trim() || !quote.trim()) return;

    setIsSubmittingReview(true);

    const chosenOption = WATCH_OPTIONS.find((w) => w.label === selectedWatch) || WATCH_OPTIONS[0];

    const newReview = {
      id: `rev-${Date.now()}`,
      author: authorName.trim(),
      location: location.trim() || "Verified Collector",
      watchSku: "custom-review",
      watchName: chosenOption.label,
      photo: chosenOption.photo,
      quote: quote.trim(),
      rating: rating,
      isVerified: true,
      timestamp: new Date().toISOString()
    };

    // Live session notification to TestimonialsSection (no local database storage needed)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hanboro_review_added", { detail: newReview }));
    }

    setTimeout(() => {
      setIsSubmittingReview(false);
      setReviewSuccess(true);
    }, 400);
  };

  const handleResetReviewForm = () => {
    setAuthorName("");
    setLocation("");
    setQuote("");
    setRating(5);
    setReviewSuccess(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!msgName.trim() || !msgBody.trim()) return;

    const subject = encodeURIComponent(`[Concierge Inquiry - ${msgTopic}] from ${msgName.trim()}`);
    const bodyText = encodeURIComponent(
      `Name: ${msgName.trim()}\nEmail: ${msgEmail.trim()}\nTopic: ${msgTopic}\n\nMessage:\n${msgBody.trim()}`
    );

    window.open(`mailto:connect@hanborowatches.in?subject=${subject}&body=${bodyText}`, "_blank");
    setMsgSuccess(true);
  };

  return (
    <section className="contact-section" id="contact-section" aria-labelledby="contact-section-title">
      <div className="contact-container">
        <div className="contact-inner">
          {/* Left Column: Clean Editorial & Direct Channels */}
          <div className="contact-left">
            <span className="contact-eyebrow">— Get in touch</span>
            <h2 className="contact-heading" id="contact-section-title">
              We’d love to<br />
              <em>hear from you.</em>
            </h2>

            <div className="contact-direct-channels">
              <div className="contact-row">
                <span className="contact-label">Email</span>
                <a href="mailto:connect@hanborowatches.in" className="contact-link">
                  connect@hanborowatches.in
                </a>
              </div>

              <div className="contact-row">
                <span className="contact-label">Phone & WhatsApp</span>
                <a
                  href="https://wa.me/918882069334?text=Hello%20HANBORO%20Concierge%2C%20I%20would%20like%20to%20inquire%20about%20your%20luxury%20timepieces."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link contact-link--wa"
                >
                  <span className="contact-mono">+91 88820 69334</span>
                  <span className="contact-link-arrow" aria-hidden="true">↗</span>
                </a>
              </div>

              <div className="contact-row">
                <span className="contact-label">Atelier Studio</span>
                <address className="contact-address">
                  <span>Building No. 3, 4th Floor, Block M, DLF City Phase II</span>
                  <span>Sector 25, Gurugram, Haryana 122008, India</span>
                </address>
              </div>
            </div>

            <div className="contact-left-actions">
              <a href="mailto:connect@hanborowatches.in" className="contact-cta">
                <span>Write to us</span>
                <span className="contact-cta-arrow" aria-hidden="true">↗</span>
              </a>
              <a
                href="https://wa.me/918882069334?text=Hello%20HANBORO%20Concierge%2C%20I%20would%20like%20to%20inquire%20about%20your%20luxury%20timepieces."
                target="_blank"
                rel="noopener noreferrer"
                className="contact-cta contact-cta--wa"
              >
                <span>WhatsApp</span>
                <span className="contact-cta-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          {/* Right Column: High-End Interactive Review & Message Card */}
          <div className="contact-right-interactive">
            <div className="contact-card-frame">
              {/* Card Tabs Switcher */}
              <div className="contact-card-nav" role="tablist" aria-label="Contact options">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "review"}
                  className={`contact-nav-tab ${activeTab === "review" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("review")}
                >
                  <span className="contact-tab-icon">★</span>
                  <span>Write a Review</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "message"}
                  className={`contact-nav-tab ${activeTab === "message" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("message")}
                >
                  <span className="contact-tab-icon">✉</span>
                  <span>Send a Message</span>
                </button>
              </div>

              {/* TAB 1: WRITE A REVIEW FORM */}
              {activeTab === "review" && (
                <div className="contact-card-panel">
                  {reviewSuccess ? (
                    <div className="contact-success-state" role="status">
                      <div className="contact-success-icon-wrap">
                        <span className="contact-success-glyph">✓</span>
                      </div>
                      <h3 className="contact-success-title">Review Submitted</h3>
                      <p className="contact-success-desc">
                        Thank you, <strong>{authorName || "Collector"}</strong>. Your review has been added to our customer reviews registry.
                      </p>
                      <div className="contact-success-rating">
                        {Array.from({ length: rating }).map((_, i) => (
                          <span key={i} className="gold-star">★</span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="contact-reset-btn"
                        onClick={handleResetReviewForm}
                      >
                        Submit another review →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="contact-form">
                      <div className="contact-form-header">
                        <h3 className="contact-form-title">Share Your Experience</h3>
                      </div>

                      {/* Star Rating Interactive Selector */}
                      <div className="contact-rating-field">
                        <label className="contact-input-label">Your Rating</label>
                        <div className="contact-stars-interactive" role="radiogroup" aria-label="Select star rating">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = (hoverRating || rating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={rating === star}
                                aria-label={`${star} Stars`}
                                className={`star-picker-btn ${isFilled ? "is-filled" : ""}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                              >
                                ★
                              </button>
                            );
                          })}
                          <span className="contact-rating-caption">
                            {hoverRating || rating}.0
                          </span>
                        </div>
                      </div>

                      {/* Watch Model Dropdown */}
                      <div className="contact-field-group">
                        <label htmlFor="review-watch-select" className="contact-input-label">
                          Timepiece
                        </label>
                        <div className="contact-select-wrap">
                          <select
                            id="review-watch-select"
                            value={selectedWatch}
                            onChange={(e) => setSelectedWatch(e.target.value)}
                            className="contact-select-input"
                          >
                            {WATCH_OPTIONS.map((opt) => (
                              <option key={opt.label} value={opt.label}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 2-Column Inputs: Name & Location */}
                      <div className="contact-grid-2">
                        <div className="contact-field-group">
                          <label htmlFor="review-author" className="contact-input-label">
                            Name *
                          </label>
                          <input
                            id="review-author"
                            type="text"
                            required
                            placeholder="Your name"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="contact-text-input"
                          />
                        </div>
                        <div className="contact-field-group">
                          <label htmlFor="review-location" className="contact-input-label">
                            City & Country
                          </label>
                          <input
                            id="review-location"
                            type="text"
                            placeholder="City, Country"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="contact-text-input"
                          />
                        </div>
                      </div>

                      {/* Review Quote Text Area */}
                      <div className="contact-field-group">
                        <label htmlFor="review-quote" className="contact-input-label">
                          Review *
                        </label>
                        <textarea
                          id="review-quote"
                          required
                          rows={4}
                          placeholder="Share your experience with this timepiece..."
                          value={quote}
                          onChange={(e) => setQuote(e.target.value)}
                          className="contact-textarea"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="contact-submit-btn"
                      >
                        {isSubmittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: SEND A MESSAGE / CONCIERGE INQUIRY */}
              {activeTab === "message" && (
                <div className="contact-card-panel">
                  {msgSuccess ? (
                    <div className="contact-success-state" role="status">
                      <div className="contact-success-icon-wrap">
                        <span className="contact-success-glyph">✉</span>
                      </div>
                      <h3 className="contact-success-title">Message Sent</h3>
                      <p className="contact-success-desc">
                        Our concierge will respond to you within 24 hours.
                      </p>
                      <button
                        type="button"
                        className="contact-reset-btn"
                        onClick={() => {
                          setMsgName("");
                          setMsgEmail("");
                          setMsgBody("");
                          setMsgSuccess(false);
                        }}
                      >
                        Send another message →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="contact-form">
                      <div className="contact-form-header">
                        <h3 className="contact-form-title">Send a Message</h3>
                      </div>

                      <div className="contact-grid-2">
                        <div className="contact-field-group">
                          <label htmlFor="msg-name" className="contact-input-label">
                            Name *
                          </label>
                          <input
                            id="msg-name"
                            type="text"
                            required
                            placeholder="Your name"
                            value={msgName}
                            onChange={(e) => setMsgName(e.target.value)}
                            className="contact-text-input"
                          />
                        </div>
                        <div className="contact-field-group">
                          <label htmlFor="msg-email" className="contact-input-label">
                            Email
                          </label>
                          <input
                            id="msg-email"
                            type="email"
                            placeholder="your@email.com"
                            value={msgEmail}
                            onChange={(e) => setMsgEmail(e.target.value)}
                            className="contact-text-input"
                          />
                        </div>
                      </div>

                      <div className="contact-field-group">
                        <label htmlFor="msg-topic" className="contact-input-label">
                          Topic
                        </label>
                        <div className="contact-select-wrap">
                          <select
                            id="msg-topic"
                            value={msgTopic}
                            onChange={(e) => setMsgTopic(e.target.value)}
                            className="contact-select-input"
                          >
                            <option value="Atelier Commission">Bespoke Commission</option>
                            <option value="Order & Shipping Inquiry">Order & Shipping</option>
                            <option value="Warranty & Servicing">Warranty & Servicing</option>
                            <option value="Other Concierge Request">General Inquiry</option>
                          </select>
                        </div>
                      </div>

                      <div className="contact-field-group">
                        <label htmlFor="msg-body" className="contact-input-label">
                          Message *
                        </label>
                        <textarea
                          id="msg-body"
                          required
                          rows={4}
                          placeholder="How can we help you?"
                          value={msgBody}
                          onChange={(e) => setMsgBody(e.target.value)}
                          className="contact-textarea"
                        />
                      </div>

                      <button type="submit" className="contact-submit-btn">
                        Send Message ↗
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
