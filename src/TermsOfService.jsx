import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";
import { PolicyNavTabs } from "./PolicyNavTabs";

export function TermsOfService({ onNavigateHome, onNavigatePolicy, onNavigateToProducts, onNavigateToStores }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("connect@hanborowatches.in");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "sec-1", label: "1. Access and Account" },
    { id: "sec-2", label: "2. Our Products" },
    { id: "sec-3", label: "3. Orders" },
    { id: "sec-4", label: "4. Prices and Billing" },
    { id: "sec-5", label: "5. Shipping and Delivery" },
    { id: "sec-6", label: "6. Intellectual Property" },
    { id: "sec-7", label: "7. Optional Tools" },
    { id: "sec-8", label: "8. Third-Party Services" },
    { id: "sec-9", label: "9. Relationship with Shopify" },
    { id: "sec-10", label: "10. Privacy Policy" },
    { id: "sec-11", label: "11. Feedback" },
    { id: "sec-12", label: "12. Errors and Omissions" },
    { id: "sec-13", label: "13. Prohibited Use" },
    { id: "sec-14", label: "14. Termination" },
    { id: "sec-15", label: "15. Disclaimer of Warranties" },
    { id: "sec-16", label: "16. Limitation of Liability" },
    { id: "sec-17", label: "17. Indemnification" },
    { id: "sec-18", label: "18. Severability" },
    { id: "sec-19", label: "19. Entire Agreement" },
    { id: "sec-20", label: "20. Governing Law" },
    { id: "sec-21", label: "21. Contact Information" },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
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
        <span className="apple-legal-eyebrow">Legal Terms</span>
        <h1 className="privacy-hero__title">Terms of Service</h1>
        <p className="privacy-hero__sub">
          Rise N Be Original Lifestyle Pvt. Ltd.
        </p>
        <p className="privacy-hero__desc">
          These Terms of Service describe your rights and responsibilities when using Hanboro Watches e-commerce store and services.
        </p>

        {/* Apple-style Policy Switcher */}
        <PolicyNavTabs activePolicy="terms" onNavigatePolicy={onNavigatePolicy} />
      </section>

      {/* ── MAIN CONTENT LAYOUT ── */}
      <div className="privacy-layout">
        {/* Apple Sticky Sidebar */}
        <aside className="privacy-sidebar" aria-label="Terms Navigation">
          <div className="privacy-sidebar__inner">
            <h2 className="privacy-sidebar__heading">Contents</h2>
            <nav className="privacy-toc-list" style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className={`privacy-toc-link ${activeSection === sec.id ? "is-active" : ""}`}
                  onClick={() => scrollToSection(sec.id)}
                >
                  {sec.label}
                </button>
              ))}
            </nav>

            <div className="privacy-sidebar__concierge-box">
              <span className="privacy-concierge-tag">Corporate Office</span>
              <p className="privacy-concierge-text">Legal notices and corporate compliance inquiries</p>
              <a href="mailto:connect@hanborowatches.in" className="privacy-concierge-btn">
                Contact Legal Desk
              </a>
            </div>
          </div>
        </aside>

        {/* Content Articles */}
        <main className="privacy-content" role="main">
          {/* Overview */}
          <article id="overview" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">00</span>
              <h2>Overview</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Welcome to <strong>Hanboro Watches</strong>! The terms “we”, “us” and “our” refer to Hanboro Watches. Hanboro Watches operates this store and website, including all related information, content, features, tools, products and services in order to provide you, the customer, with a curated shopping experience (the “Services”). Hanboro Watches is powered by Shopify, which enables us to provide the Services to you.
              </p>
              <p>
                The below terms and conditions, together with any policies referenced herein (these “Terms of Service” or “Terms”) describe your rights and responsibilities when you use the Services.
              </p>
              <div className="privacy-callout">
                <div className="privacy-callout__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="privacy-callout__text">
                  Please read these Terms of Service carefully, as they include important information about your legal rights and cover areas such as warranty disclaimers and limitations of liability. By visiting, interacting with or using our Services, you agree to be bound by these Terms of Service and our Privacy Policy as available on our website. If you do not agree to these Terms or the Privacy Policy, you should not use or access our Services.
                </div>
              </div>
            </div>
          </article>

          {/* Section 1 */}
          <article id="sec-1" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">01</span>
              <h2>Access and Account</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                By agreeing to these Terms of Service, you represent that you are at least the age of majority in your place of residence and that you have the legal capacity to enter into a binding agreement.
              </p>
              <p>
                To use the Services, including browsing our online store or making a purchase, you may be required to provide certain information such as your email address, billing details, payment information, and shipping address. You confirm that all information provided by you is accurate, current, and complete.
              </p>
              <p>
                You are solely responsible for maintaining the confidentiality of your account credentials and for all activities carried out under your account. You may not transfer, sell, or assign your account to any other person.
              </p>
            </div>
          </article>

          {/* Section 2 */}
          <article id="sec-2" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">02</span>
              <h2>Our Products</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We make every effort to display accurate product details on our website. However, actual product colors, finishes, or appearances may vary depending on your device display and settings.
              </p>
              <p>
                We do not guarantee that the product appearance or quality will meet individual expectations. Product descriptions, pricing, and availability are subject to change without prior notice. We reserve the right to discontinue or limit the sale of any product at our discretion.
              </p>
            </div>
          </article>

          {/* Section 3 */}
          <article id="sec-3" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">03</span>
              <h2>Orders</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Placing an order constitutes an offer to purchase. Hanboro Watches reserves the right to accept or reject any order for any reason.
              </p>
              <p>
                An order is considered confirmed only after payment is successfully processed and order confirmation is issued. Once an order is confirmed, cancellation may not be possible.
              </p>
              <p>
                Returns or exchanges are governed strictly by our Refund & Return Policy available on our website.
              </p>
              <p>
                All purchases are intended for personal use only and not for resale or commercial purposes.
              </p>
            </div>
          </article>

          {/* Section 4 */}
          <article id="sec-4" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">04</span>
              <h2>Prices and Billing</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                All prices are subject to change without notice. Prices listed do not include applicable taxes, shipping, or handling charges unless stated otherwise.
              </p>
              <p>
                You agree to provide accurate payment and billing information and authorize us to charge your selected payment method for all purchases.
              </p>
            </div>
          </article>

          {/* Section 5 */}
          <article id="sec-5" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">05</span>
              <h2>Shipping and Delivery</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Delivery timelines are estimates and not guaranteed. We are not responsible for delays caused by courier partners, customs, or unforeseen circumstances.
              </p>
              <p>
                Once the product is handed over to the courier, the risk of loss passes to the customer.
              </p>
            </div>
          </article>

          {/* Section 6 */}
          <article id="sec-6" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">06</span>
              <h2>Intellectual Property</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                All content on the website, including text, images, logos, designs, videos, and trademarks, is owned by or licensed to Hanboro Watches and is protected by applicable intellectual property laws.
              </p>
              <p>
                You may not reproduce, copy, distribute, or exploit any part of the Services without prior written permission.
              </p>
            </div>
          </article>

          {/* Section 7 */}
          <article id="sec-7" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">07</span>
              <h2>Optional Tools</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We may provide access to third-party tools “as is” without any warranties. We are not responsible for issues arising from the use of such tools.
              </p>
            </div>
          </article>

          {/* Section 8 */}
          <article id="sec-8" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">08</span>
              <h2>Third-Party Services</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                The Services may include content or services provided by third parties. We are not responsible for their accuracy, policies, or practices. Any interaction with third-party services is at your own risk.
              </p>
            </div>
          </article>

          {/* Section 9 */}
          <article id="sec-9" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">09</span>
              <h2>Relationship with Shopify</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Hanboro Watches uses Shopify as its e-commerce platform. All transactions are directly between you and Hanboro Watches. Shopify is not responsible for product sales, warranties, or disputes.
              </p>
            </div>
          </article>

          {/* Section 10 */}
          <article id="sec-10" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">10</span>
              <h2>Privacy Policy</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                All personal information collected is governed by our Privacy Policy available on our website. By using our Services, you consent to the collection and use of information in accordance with applicable laws.
              </p>
              <p>
                Shopify may also process personal data as part of hosting and operating the platform.
              </p>
            </div>
          </article>

          {/* Section 11 */}
          <article id="sec-11" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">11</span>
              <h2>Feedback</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Any feedback, reviews, or suggestions submitted to us may be used by Hanboro Watches for business and promotional purposes without compensation.
              </p>
            </div>
          </article>

          {/* Section 12 */}
          <article id="sec-12" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">12</span>
              <h2>Errors and Omissions</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We reserve the right to correct any errors or inaccuracies and to cancel orders if information is found to be incorrect at any time.
              </p>
            </div>
          </article>

          {/* Section 13 */}
          <article id="sec-13" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">13</span>
              <h2>Prohibited Use</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                You agree not to misuse the Services, violate laws, infringe intellectual property rights, or engage in fraudulent or harmful activities.
              </p>
            </div>
          </article>

          {/* Section 14 */}
          <article id="sec-14" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">14</span>
              <h2>Termination</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We reserve the right to terminate or suspend access to the Services at any time without notice for violations of these Terms.
              </p>
            </div>
          </article>

          {/* Section 15 */}
          <article id="sec-15" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">15</span>
              <h2>Disclaimer of Warranties</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                All Services and products are provided “as is” and “as available” without warranties of any kind, except where prohibited by law.
              </p>
            </div>
          </article>

          {/* Section 16 */}
          <article id="sec-16" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">16</span>
              <h2>Limitation of Liability</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                To the maximum extent permitted by law, Hanboro Watches shall not be liable for any indirect, incidental, or consequential damages arising from the use of our Services or products.
              </p>
            </div>
          </article>

          {/* Section 17 */}
          <article id="sec-17" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">17</span>
              <h2>Indemnification</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                You agree to indemnify and hold Hanboro Watches harmless from any claims arising from your violation of these Terms.
              </p>
            </div>
          </article>

          {/* Section 18 */}
          <article id="sec-18" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">18</span>
              <h2>Severability</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                If any provision is found unenforceable, the remaining provisions shall remain valid.
              </p>
            </div>
          </article>

          {/* Section 19 */}
          <article id="sec-19" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">19</span>
              <h2>Entire Agreement</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                These Terms constitute the entire agreement between you and Hanboro Watches.
              </p>
            </div>
          </article>

          {/* Section 20 */}
          <article id="sec-20" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">20</span>
              <h2>Governing Law</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                These Terms shall be governed by and interpreted in accordance with the laws of <strong>India</strong>, and courts having jurisdiction where Hanboro Watches is headquartered shall have exclusive jurisdiction.
              </p>
            </div>
          </article>

          {/* Section 21 */}
          <article id="sec-21" className="privacy-card apple-highlight-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">21</span>
              <h2>Contact Information</h2>
            </div>
            <div className="privacy-card__body">
              <div className="privacy-contact-grid">
                <div className="privacy-contact-card">
                  <div className="apple-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <h3>Registered Company</h3>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>
                    Rise N Be Original Lifestyle Pvt. Ltd.
                  </p>
                  <span style={{ fontSize: "12px", color: "#a1a1a6", fontFamily: "-apple-system, monospace" }}>
                    GSTIN: 07AAMCR0380F1ZE
                  </span>
                </div>

                <div className="privacy-contact-card">
                  <div className="apple-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h3>Email</h3>
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
                  <h3>Phone</h3>
                  <a href="tel:+918076656702" className="privacy-contact-link">
                    +91-8076656702
                  </a>
                </div>

                <div className="privacy-contact-card privacy-info-item--full">
                  <div className="apple-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3>Address</h3>
                  <address className="privacy-address">
                    N1/27, DLF Phase 2, Gurugram, Haryana – 122008
                  </address>
                </div>
              </div>
            </div>
          </article>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="privacy-footer">
        <div className="privacy-footer__inner">
          <HanboroLogo theme="light" size={18} />
          <p>© 2026 HANBORO WATCHES • RISE N BE ORIGINAL LIFESTYLE PVT. LTD.</p>
          <div className="footer-policies-list">
            <button type="button" className="footer-privacy-link" onClick={() => onNavigatePolicy && onNavigatePolicy("privacy")}>Privacy Policy</button>
            <span className="footer-policy-dot">•</span>
            <button type="button" className="footer-privacy-link" onClick={() => onNavigatePolicy && onNavigatePolicy("shipping")}>Shipping Policy</button>
            <span className="footer-policy-dot">•</span>
            <button type="button" className="footer-privacy-link" onClick={() => onNavigatePolicy && onNavigatePolicy("refund")}>Refund Policy</button>
            <span className="footer-policy-dot">•</span>
            <button type="button" className="footer-privacy-link" onClick={() => onNavigatePolicy && onNavigatePolicy("terms")}>Terms of Service</button>
          </div>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
