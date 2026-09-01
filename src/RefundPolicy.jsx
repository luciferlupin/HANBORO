import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";

export function RefundPolicy({ onNavigateHome, onNavigateToProducts, onNavigateToStores, onOpenConcierge }) {
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
    <div className="privacy-page-root refund-page-root">
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
          <span>Client Satisfaction & Replacement Protocol</span>
        </div>
        <h1 className="privacy-hero__title">Refund & Replacement Policy</h1>
        <p className="privacy-hero__desc">
          At Hanboro, we prioritize quality, artisan precision, and customer satisfaction. Please review our comprehensive return, replacement, and refund terms below.
        </p>
      </section>

      {/* ── KEY METRICS / HIGHLIGHTS ── */}
      <div className="shipping-metrics-container">
        <div className="shipping-metric-card">
          <div className="shipping-metric-card__icon">🛡️</div>
          <div className="shipping-metric-card__val">5 Days</div>
          <div className="shipping-metric-card__label">Replacement Request Window</div>
          <p className="shipping-metric-card__sub">From date of order delivery</p>
        </div>

        <div className="shipping-metric-card">
          <div className="shipping-metric-card__icon">🔍</div>
          <div className="shipping-metric-card__val">2 Days</div>
          <div className="shipping-metric-card__label">Atelier Quality Inspection</div>
          <p className="shipping-metric-card__sub">Approval within 48 hours of receipt</p>
        </div>

        <div className="shipping-metric-card">
          <div className="shipping-metric-card__icon">💳</div>
          <div className="shipping-metric-card__val">10 Days</div>
          <div className="shipping-metric-card__label">Automatic Credit Settlement</div>
          <p className="shipping-metric-card__sub">To original payment method when approved</p>
        </div>
      </div>

      {/* ── MAIN CONTENT WRAPPER ── */}
      <main className="shipping-content-wrap" role="main">
        {/* Section 1: Standard Policy Notice */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="privacy-section-number">01</span>
            <h2>General Return & Refund Stance</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              At Hanboro, we prioritize quality and customer satisfaction. However, please note that we do not accept regular change-of-mind returns or offer unconditional refunds for purchased watches.
            </p>
            <div className="privacy-callout">
              <div className="privacy-callout__icon">⚠️</div>
              <div className="privacy-callout__text">
                Every Hanboro timepiece is a precision mechanical instrument tested and certified prior to dispatch. General returns and refunds are not accepted once the seal has been broken unless covered under our 5-day replacement terms.
              </div>
            </div>
          </div>
        </article>

        {/* Section 2: Replacement Policy */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="privacy-section-number">02</span>
            <h2>5-Day Replacement Policy</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              We have a <strong>5-day return policy</strong>, which means you have <strong>5 days</strong> after receiving your item to request a return or replacement in the event of manufacturing defects, cosmetic transit damage, or horological discrepancies.
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Inspection & Approval:</strong> Once the returned product is received at our central atelier, it will be thoroughly inspected by our watchmakers, and the return will be approved or resolved within <strong>2 business days</strong>.
              </li>
              <li>
                <strong>Item Condition:</strong> Timepieces sent for replacement must be in their original unworn condition, with all protective wraps intact, and accompanied by the original luxury vault box, warranty card, and accessories.
              </li>
            </ul>
          </div>
        </article>

        {/* Section 3: Refunds & Settlement Process */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="privacy-section-number">03</span>
            <h2>Refunds & Crediting Terms</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              We will notify you once we’ve received and inspected your return, and let you know if the refund/replacement was approved or not.
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Payment Method:</strong> If approved, you’ll be automatically credited on your original payment method within <strong>10 business days</strong>.
              </li>
              <li>
                <strong>Banking Processing Times:</strong> Please remember it can take some time for your bank or credit card company to process and post the refund to your statement too.
              </li>
              <li>
                <strong>Extended Settlement Inquiries:</strong> If more than <strong>15 business days</strong> have passed since we’ve approved your return and you have not received your credit, please contact our concierge immediately.
              </li>
            </ul>
          </div>
        </article>

        {/* Section 4: How to Request a Replacement */}
        <article className="privacy-card privacy-card--highlight">
          <div className="privacy-card__header">
            <span className="privacy-section-number">04</span>
            <h2>How to Request a Replacement</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              Please contact Hanboro’s customer service team at <a href="mailto:connect@hanborowatches.in" style={{ color: "#ffd700", fontWeight: 700 }}>connect@hanborowatches.in</a> to initiate the replacement process.
            </p>
            <p>
              Please provide your order confirmation number, high-resolution photographs or video of the issue, and your registered contact details for expedited concierge processing.
            </p>

            <div className="privacy-contact-grid">
              <div className="privacy-contact-card">
                <span className="privacy-contact-icon">✉️</span>
                <h3>Replacement Desk Email</h3>
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
                <h3>Studio & Return Facility</h3>
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
          <p>© 2026 HANBORO WATCHES • CLIENT GUARANTEE & SERVICE</p>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
