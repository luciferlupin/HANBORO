import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";

export function ShippingPolicy({ onNavigateHome, onNavigateToProducts, onNavigateToStores, onOpenConcierge }) {
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
    <div className="privacy-page-root shipping-page-root">
      {/* ── TOP DEDICATED LUXURY NAVBAR ── */}
      <header className="privacy-navbar" role="banner">
        <div className="privacy-navbar__left">
          <button
            type="button"
            className="privacy-back-btn"
            onClick={onNavigateHome}
            aria-label="Return to Hanboro Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Return to Boutique</span>
          </button>
        </div>

        <button
          type="button"
          className="privacy-navbar__brand"
          onClick={onNavigateHome}
          aria-label="Hanboro Home"
        >
          <HanboroLogo theme="light" size={24} />
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

      {/* ── HERO BANNER ── */}
      <section className="privacy-hero">
        <div className="privacy-hero__badge">
          <span className="privacy-hero__badge-dot" />
          <span>Fulfillment & Dispatch Protocol</span>
        </div>
        <h1 className="privacy-hero__title">Shipping Policy</h1>
        <p className="privacy-hero__desc">
          Thank you for choosing Hanboro. We strive to provide a seamless shopping experience with timely deliveries for all our luxury horological timepieces.
        </p>
      </section>

      {/* ── KEY SHIPPING METRICS GRID ── */}
      <div className="shipping-metrics-container">
        <div className="shipping-metric-card">
          <div className="shipping-metric-card__icon">⏱️</div>
          <div className="shipping-metric-card__val">3 – 14 Days</div>
          <div className="shipping-metric-card__label">Estimated Shipping Time (India)</div>
          <p className="shipping-metric-card__sub">From date of order confirmation</p>
        </div>

        <div className="shipping-metric-card">
          <div className="shipping-metric-card__icon">⚙️</div>
          <div className="shipping-metric-card__val">3 – 7 Days</div>
          <div className="shipping-metric-card__label">Order Processing & Quality Check</div>
          <p className="shipping-metric-card__sub">Dispatched on business days (Mon–Fri)</p>
        </div>

        <div className="shipping-metric-card">
          <div className="shipping-metric-card__icon">🛡️</div>
          <div className="shipping-metric-card__val">100% Insured</div>
          <div className="shipping-metric-card__label">Secure Armored Transit</div>
          <p className="shipping-metric-card__sub">Tamper-evident luxury packaging</p>
        </div>
      </div>

      {/* ── MAIN CONTENT SECTIONS ── */}
      <main className="shipping-content-wrap" role="main">
        {/* Section: Shipping Time */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="privacy-section-number">01</span>
            <h2>Shipping Time</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              Orders within India are typically delivered within <strong>3 to 14 business days</strong> after receiving an order confirmation.
            </p>
            <div className="privacy-callout">
              <div className="privacy-callout__icon">📍</div>
              <div className="privacy-callout__text">
                Please note that the shipping time may vary depending on the destination location, regional accessibility, and selected courier service partner.
              </div>
            </div>
          </div>
        </article>

        {/* Section: Processing Time */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="privacy-section-number">02</span>
            <h2>Processing & Dispatch Time</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              All orders are delivered within <strong>3 to 7 business days</strong> processing window. Each timepiece undergoes rigorous horological calibration, multi-point water-resistance verification, and cosmetic inspection prior to boxing.
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Operating Schedule:</strong> Orders are not shipped or delivered on weekends (Saturday & Sunday) or recognized national/gazetted holidays.
              </li>
              <li>
                <strong>High Volume Periods:</strong> If we are experiencing a high volume of orders (such as during festive seasons or limited edition chronograph launches), shipments may be delayed by a few days. Please allow additional days in transit for delivery.
              </li>
              <li>
                <strong>Direct Client Notification:</strong> If there will be a significant delay in the shipment of your order, our concierge team will contact you promptly via email or phone.
              </li>
            </ul>
          </div>
        </article>

        {/* Section: Packaging & Tracking */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="privacy-section-number">03</span>
            <h2>Luxury Packaging & Tracking</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              Every Hanboro timepiece is housed within our signature velvet-lined presentation vault box, accompanied by the international warranty card and user manual.
            </p>
            <p>
              Once your timepiece has been dispatched from our central atelier in Gurugram, you will receive an automated tracking link via email and SMS with real-time live milestone updates.
            </p>
          </div>
        </article>

        {/* Section: Inquiries & Support */}
        <article className="privacy-card privacy-card--highlight">
          <div className="privacy-card__header">
            <span className="privacy-section-number">04</span>
            <h2>Customer Support & Order Inquiries</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              For any issues, shipping queries, address modifications, or further tracking inquiries, please reach out directly to our dedicated customer service team:
            </p>

            <div className="privacy-contact-grid">
              <div className="privacy-contact-card">
                <span className="privacy-contact-icon">✉️</span>
                <h3>Concierge Support Email</h3>
                <a href="mailto:connect@hanborowatches.in" className="privacy-contact-link">
                  connect@hanborowatches.in
                </a>
                <button
                  type="button"
                  className="privacy-copy-btn"
                  onClick={copyEmailToClipboard}
                >
                  {copiedEmail ? "✓ Email Copied" : "Copy Email Address"}
                </button>
              </div>

              <div className="privacy-contact-card">
                <span className="privacy-contact-icon">📞</span>
                <h3>Atelier Support Helpline</h3>
                <a href="tel:+918882069334" className="privacy-contact-link">
                  +91 88820 69334
                </a>
                <span className="privacy-contact-hours">Mon – Sat, 10:00 AM – 8:00 PM IST</span>
              </div>

              <div className="privacy-contact-card">
                <span className="privacy-contact-icon">🏛️</span>
                <h3>Central Studio & Fulfillment</h3>
                <address className="privacy-address">
                  opposite rapid metro pillar no. 86 N1/27 DLF PHASE 2 GURUGRAM HARYANA,<br />
                  dlf phase 2, GURUGRAM, HR, 122008, INDIA
                </address>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* ── FOOTER ── */}
      <footer className="privacy-footer">
        <div className="privacy-footer__inner">
          <HanboroLogo theme="light" size={20} />
          <p>© 2026 HANBORO WATCHES • GLOBAL HOROLOGICAL LOGISTICS</p>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
