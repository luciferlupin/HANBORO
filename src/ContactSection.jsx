import React, { useRef, useState } from "react";

const MAX_REVIEW_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ContactSection() {
  const [activeTab, setActiveTab] = useState("review"); // 'review' | 'message'
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [watchName, setWatchName] = useState("");
  const [reviewPhoto, setReviewPhoto] = useState("");
  const [reviewPhotoName, setReviewPhotoName] = useState("");
  const [reviewPhotoError, setReviewPhotoError] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [location, setLocation] = useState("");
  const [quote, setQuote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const reviewPhotoInputRef = useRef(null);

  // Message form state
  const [msgName, setMsgName] = useState("");
  const [msgEmail, setMsgEmail] = useState("");
  const [msgTopic, setMsgTopic] = useState("Atelier Commission");
  const [msgBody, setMsgBody] = useState("");
  const [msgSuccess, setMsgSuccess] = useState(false);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!authorName.trim() || !watchName.trim() || !quote.trim() || !reviewPhoto) {
      if (!reviewPhoto) setReviewPhotoError("Please add a photo of your watch.");
      return;
    }

    setIsSubmittingReview(true);

    const newReview = {
      id: `rev-${Date.now()}`,
      author: authorName.trim(),
      location: location.trim(),
      watchSku: "custom-review",
      watchName: watchName.trim(),
      photo: reviewPhoto,
      quote: quote.trim(),
      rating: rating,
      isVerified: false,
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

  const handleReviewPhotoChange = (event) => {
    const file = event.target.files?.[0];
    setReviewPhotoError("");

    if (!file) return;
    if (!ALLOWED_REVIEW_PHOTO_TYPES.includes(file.type)) {
      setReviewPhoto("");
      setReviewPhotoName("");
      setReviewPhotoError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_REVIEW_PHOTO_BYTES) {
      setReviewPhoto("");
      setReviewPhotoName("");
      setReviewPhotoError("The photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReviewPhoto(typeof reader.result === "string" ? reader.result : "");
      setReviewPhotoName(file.name);
    };
    reader.onerror = () => {
      setReviewPhotoError("We couldn't read that photo. Please choose another image.");
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const clearReviewPhoto = () => {
    setReviewPhoto("");
    setReviewPhotoName("");
    setReviewPhotoError("");
    if (reviewPhotoInputRef.current) reviewPhotoInputRef.current.value = "";
  };

  const handleResetReviewForm = () => {
    setAuthorName("");
    setLocation("");
    setWatchName("");
    setQuote("");
    setRating(5);
    clearReviewPhoto();
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
                        Thank you, <strong>{authorName || "Collector"}</strong>. Your review is now shown in the customer reviews on this page.
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

                      {/* Customer-entered watch name */}
                      <div className="contact-field-group">
                        <label htmlFor="review-watch-name" className="contact-input-label">
                          Watch name *
                        </label>
                        <input
                          id="review-watch-name"
                          type="text"
                          required
                          maxLength={80}
                          placeholder="e.g. Clover King Imperial Emerald"
                          value={watchName}
                          onChange={(e) => setWatchName(e.target.value)}
                          className="contact-text-input"
                        />
                      </div>

                      {/* Customer watch photo */}
                      <div className="contact-field-group">
                        <label htmlFor="review-photo" className="contact-input-label">
                          Watch photo *
                        </label>
                        <div className={`contact-photo-upload ${reviewPhoto ? "has-photo" : ""}`}>
                          {reviewPhoto ? (
                            <>
                              <img src={reviewPhoto} alt="Selected watch preview" className="contact-photo-preview" />
                              <div className="contact-photo-meta">
                                <span className="contact-photo-name">{reviewPhotoName}</span>
                                <button type="button" className="contact-photo-remove" onClick={clearReviewPhoto}>
                                  Remove photo
                                </button>
                              </div>
                            </>
                          ) : (
                            <label htmlFor="review-photo" className="contact-photo-prompt">
                              <span className="contact-photo-icon" aria-hidden="true">＋</span>
                              <span>
                                <strong>Add your watch photo</strong>
                                <small>JPG, PNG or WebP · up to 5 MB</small>
                              </span>
                            </label>
                          )}
                          <input
                            ref={reviewPhotoInputRef}
                            id="review-photo"
                            type="file"
                            required={!reviewPhoto}
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleReviewPhotoChange}
                            className="contact-photo-input"
                            aria-describedby={reviewPhotoError ? "review-photo-error" : undefined}
                          />
                        </div>
                        {reviewPhotoError && (
                          <p className="contact-field-error" id="review-photo-error" role="alert">
                            {reviewPhotoError}
                          </p>
                        )}
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
