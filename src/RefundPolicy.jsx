import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";
import { PolicyNavTabs } from "./PolicyNavTabs";

export function RefundPolicy({ onNavigateHome, onNavigatePolicy, onNavigateToProducts, onNavigateToStores }) {
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
        <span className="apple-legal-eyebrow">Satisfaction & Returns</span>
        <h1 className="privacy-hero__title">Refund & Replacement Policy</h1>
        <p className="privacy-hero__desc">
          At Hanboro, we prioritize quality and customer satisfaction. Please review our policy terms for returns, replacements, and payment crediting.
        </p>

        {/* Apple-style Policy Switcher */}
        <PolicyNavTabs activePolicy="refund" onNavigatePolicy={onNavigatePolicy} />
      </section>

      {/* ── KEY METRICS GRID ── */}
      <div className="shipping-metrics-container">
        <div className="shipping-metric-card">
          <div className="apple-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </div>
          <div className="shipping-metric-card__val">5 Days</div>
          <div className="shipping-metric-card__label">Replacement Request Window</div>
          <p className="shipping-metric-card__sub">From order delivery</p>
        </div>

        <div className="shipping-metric-card">
          <div className="apple-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="shipping-metric-card__val">2 Days</div>
          <div className="shipping-metric-card__label">Inspection & Approval</div>
          <p className="shipping-metric-card__sub">Upon receipt of returned watch</p>
        </div>

        <div className="shipping-metric-card">
          <div className="apple-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div className="shipping-metric-card__val">10 Days</div>
          <div className="shipping-metric-card__label">Automatic Credit Settlement</div>
          <p className="shipping-metric-card__sub">To original payment method</p>
        </div>
      </div>

      {/* ── CONTENT SECTIONS ── */}
      <main className="shipping-content-wrap" role="main">
        {/* Section 1 */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">01</span>
            <h2>General Return Policy</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              At Hanboro, we prioritize quality and customer satisfaction. However, please note that we do not accept returns or offer refunds for purchased watches.
            </p>
          </div>
        </article>

        {/* Section 2 */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">02</span>
            <h2>Replacement Policy</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              We have a <strong>5-day return policy</strong>, which means you have <strong>5 days</strong> after receiving your item to request a return.
            </p>
            <p>
              Once the return product is received it will be inspected and the return will be approved within <strong>2 days</strong>.
            </p>
          </div>
        </article>

        {/* Section 3 */}
        <article className="privacy-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">03</span>
            <h2>Refunds & Processing</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not.
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Crediting Method:</strong> If approved, you’ll be automatically credited on your original payment method within <strong>10 business days</strong>.
              </li>
              <li>
                <strong>Banking Processing:</strong> Please remember it can take some time for your bank or credit card company to process and post the refund too.
              </li>
              <li>
                <strong>Extended Inquiry:</strong> If more than <strong>15 business days</strong> have passed since we’ve approved your return, please contact our support team.
              </li>
            </ul>
          </div>
        </article>

        {/* Section 4 */}
        <article className="privacy-card apple-highlight-card">
          <div className="privacy-card__header">
            <span className="apple-badge-num">04</span>
            <h2>How to Request a Replacement</h2>
          </div>
          <div className="privacy-card__body">
            <p>
              Please contact Hanboro’s customer service at <a href="mailto:connect@hanborowatches.in" style={{ color: "#ffffff", fontWeight: 600 }}>connect@hanborowatches.in</a> to initiate the replacement process.
            </p>

            <div className="privacy-contact-grid">
              <div className="privacy-contact-card">
                <div className="apple-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3>Customer Service Email</h3>
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
                <h3>Helpline</h3>
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
          <p>© 2026 HANBORO WATCHES • CLIENT GUARANTEE & SERVICE</p>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
