import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";
import { PolicyNavTabs } from "./PolicyNavTabs";

export function ShippingPolicy({ onNavigateHome, onNavigatePolicy, onNavigateToProducts, onNavigateToStores }) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("connect@hanborowatches.in");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="privacy-page-root apple-legal-page">
      {/* ── TOP DEDICATED APPLE NAVBAR ── */}
      <header className="privacy-navbar" role="banner">
        <div className="privacy-navbar__left">
          <button
            type="button"
            className="privacy-back-btn"
            onClick={onNavigateHome}
            aria-label="Return to Hanboro Home"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Boutique</span>
          </button>
        </div>

        <button
          type="button"
          className="privacy-navbar__brand"
          onClick={onNavigateHome}
          aria-label="Hanboro Home"
        >
          <HanboroLogo theme="light" size={22} />
        </button>

        <div className="privacy-navbar__actions">
          {onNavigateToProducts && (
            <button
              type="button"
              className="privacy-nav-btn"
              onClick={onNavigateToProducts}
            >
              Timepieces
            </button>
          )}
          {onNavigateToStores && (
            <button
              type="button"
              className="privacy-nav-btn"
              onClick={onNavigateToStores}
            >
              Boutiques
            </button>
          )}
        </div>
      </header>

      {/* ── HERO HEADER ── */}
      <section className="privacy-hero">
        <span className="apple-legal-eyebrow">Logistics & Delivery</span>
        <h1 className="privacy-hero__title">Shipping Policy</h1>
        <p className="privacy-hero__desc">
          Thank you for choosing Hanboro. We strive to provide a seamless shopping experience with timely deliveries for all our luxury horological timepieces.
        </p>

        {/* Apple-style Policy Switcher */}
        <PolicyNavTabs activePolicy="shipping" onNavigatePolicy={onNavigatePolicy} />
      </section>

      {/* ── KEY METRICS GRID ── */}
      <div className="shipping-metrics-container">
        <div className="shipping-metric-card">
          <div className="apple-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="shipping-metric-card__val">3 – 14 Days</div>
          <div className="shipping-metric-card__label">Shipping Time (India)</div>
          <p className="shipping-metric-card__sub">From order confirmation</p>
        </div>

        <div className="shipping-metric-card">
          <div className="apple-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className="shipping-metric-card__val">3 – 7 Days</div>
          <div className="shipping-metric-card__label">Order Processing</div>
          <p className="shipping-metric-card__sub">Dispatched on business days</p>
        </div>

        <div className="shipping-metric-card">
          <div className="apple-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="shipping-metric-card__val">100% Insured</div>
          <div className="shipping-metric-card__label">Secure Transit</div>
          <p className="shipping-metric-card__sub">Tamper-evident packaging</p>
        </div>
      </div>

      {/* ── CONTENT SECTIONS ── */}
      <main className="shipping-content-wrap" role="main">
        {/* Section 1 */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">01</span>
            <h2>Shipping Time</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              Orders within India are typically delivered within <strong>3 to 14 business days</strong> after receiving an order confirmation.
            </p>
            <div className="privacy-callout">
              <div className="privacy-callout__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="privacy-callout__text">
                Please note that the shipping time may vary depending on the location and courier service.
              </div>
            </div>
          </div>
        </article>

        {/* Section 2 */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">02</span>
            <h2>Processing Time & Operating Schedule</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              All orders are delivered within <strong>3 to 7 business days</strong>. Orders are not shipped or delivered on weekends or holidays.
            </p>
            <ul className="privacy-list">
              <li>
                <strong>High Volume Shipments:</strong> If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
              </li>
              <li>
                <strong>Significant Delay Notice:</strong> If there will be a significant delay in the shipment of your order, we will contact you via email or phone.
              </li>
            </ul>
          </div>
        </article>

        {/* Section 3 */}
        <article className="privacy-card apple-highlight-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">03</span>
            <h2>Customer Inquiries</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              For any issues or further inquiries, please contact our customer service team:
            </p>

            <div className="privacy-contact-grid">
              <div className="privacy-contact-card">
                <div className="apple-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3>Concierge Support Email</h3>
                <a href="mailto:connect@hanborowatches.in" className="privacy-contact-link">
                  connect@hanborowatches.in
                </a>
                <button
                  type="button"
                  className="privacy-copy-btn"
                  onClick={copyEmailToClipboard}
                >
                  {copiedEmail ? "Copied" : "Copy Email"}
                </button>
              </div>

              <div className="privacy-contact-card">
                <div className="apple-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3>Atelier Phone</h3>
                <a href="tel:+918882069334" className="privacy-contact-link">
                  +91 88820 69334
                </a>
                <span className="privacy-contact-hours">Mon – Sat, 10:00 AM – 8:00 PM IST</span>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* ── FOOTER ── */}
      <footer className="privacy-footer">
        <div className="privacy-footer__inner">
          <HanboroLogo theme="light" size={18} />
          <p>© 2026 HANBORO WATCHES • GLOBAL HOROLOGICAL LOGISTICS</p>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
