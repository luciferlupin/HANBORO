import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";
import { PolicyNavTabs } from "./PolicyNavTabs";

export function PrivacyPolicy({ onNavigateHome, onNavigatePolicy, onNavigateToProducts, onNavigateToStores }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("shaktikart@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const sections = [
    { id: "overview", label: "Overview & Scope" },
    { id: "collected-info", label: "Information We Collect" },
    { id: "sources", label: "Information Sources" },
    { id: "usage", label: "How We Use Information" },
    { id: "disclosure", label: "Disclosure to Third Parties" },
    { id: "shopify", label: "Relationship with Shopify" },
    { id: "third-party", label: "External Sites & Links" },
    { id: "children", label: "Children's Data" },
    { id: "security-retention", label: "Security & Retention" },
    { id: "your-rights", label: "Your Rights & Choices" },
    { id: "complaints", label: "Complaints & Inquiries" },
    { id: "transfers", label: "International Transfers" },
    { id: "updates", label: "Policy Updates" },
    { id: "contact", label: "Contact & Privacy Office" },
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
      {/* ── TOP DEDICATED APPLE LUXURY NAVBAR ── */}
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
        <span className="apple-legal-eyebrow">Legal & Compliance</span>
        <h1 className="privacy-hero__title">Privacy Policy</h1>
        <p className="privacy-hero__sub">
          Last updated: October 24, 2025
        </p>
        <p className="privacy-hero__desc">
          Hanboro Watches operates this store and website to provide you with a curated, luxury horological experience. This policy explains how your personal data is collected, processed, and safeguarded.
        </p>

        {/* Apple-style Policy Switcher */}
        <PolicyNavTabs activePolicy="privacy" onNavigatePolicy={onNavigatePolicy} />
      </section>

      {/* ── MAIN CONTENT LAYOUT ── */}
      <div className="privacy-layout">
        {/* Apple-style Minimal Sticky Sidebar */}
        <aside className="privacy-sidebar" aria-label="Privacy Policy Navigation">
          <div className="privacy-sidebar__inner">
            <h2 className="privacy-sidebar__heading">Contents</h2>
            <nav className="privacy-toc-list">
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
              <span className="privacy-concierge-tag">Data Protection</span>
              <p className="privacy-concierge-text">Questions regarding your personal information or rights?</p>
              <a href="mailto:shaktikart@gmail.com" className="privacy-concierge-btn">
                Contact Privacy Desk
              </a>
            </div>
          </div>
        </aside>

        {/* Content Articles */}
        <main className="privacy-content" role="main">
          {/* Section 1 */}
          <article id="overview" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">01</span>
              <h2>Overview & Scope</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                <strong>Hanboro Watches</strong> operates this store and website, including all related information, content, features, tools, products and services in order to provide you, the customer, with a curated shopping experience (the <em>"Services"</em>). Hanboro Watches is powered by Shopify, which enables us to provide the Services to you.
              </p>
              <p>
                This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use, or make a purchase or other transaction using the Services or otherwise communicate with us.
              </p>
              <div className="privacy-callout">
                <div className="privacy-callout__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="privacy-callout__text">
                  If there is a conflict between our Terms of Service and this Privacy Policy, this Privacy Policy controls with respect to the collection, processing, and disclosure of your personal information.
                </div>
              </div>
              <p>
                Please read this Privacy Policy carefully. By using and accessing any of the Services, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described in this Privacy Policy.
              </p>
            </div>
          </article>

          {/* Section 2 */}
          <article id="collected-info" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">02</span>
              <h2>Personal Information We Collect or Process</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                When we use the term <em>"personal information,"</em> we are referring to information that identifies or can reasonably be linked to you or another person. Personal information does not include information that is collected anonymously or that has been de-identified, so that it cannot identify or be reasonably linked to you.
              </p>
              <p>
                We may collect or process the following categories of personal information, including inferences drawn from this personal information, depending on how you interact with the Services, where you live, and as permitted or required by applicable law:
              </p>

              <div className="privacy-grid">
                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <h3>Contact Details</h3>
                  </div>
                  <p>Your name, address, billing address, shipping address, phone number, and email address.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <h3>Financial Information</h3>
                  </div>
                  <p>Credit card, debit card, and financial account numbers, payment card information, financial account information, transaction details, form of payment, payment confirmation and other payment details.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <h3>Account Information</h3>
                  </div>
                  <p>Username, password, security questions, horological preferences and curated settings.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <h3>Transaction Information</h3>
                  </div>
                  <p>Items you view, put in your cart, add to your wishlist, or purchase, return, exchange or cancel and your past transactions.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3>Communications</h3>
                  </div>
                  <p>Information you include in communications with us, for example, when sending a customer support inquiry.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <h3>Device Information</h3>
                  </div>
                  <p>Information about your device, browser, or network connection, your IP address, and other unique identifiers.</p>
                </div>

                <div className="privacy-info-item privacy-info-item--full">
                  <div className="privacy-info-item__header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <h3>Usage Information</h3>
                  </div>
                  <p>Information regarding your interaction with the Services, including how and when you interact with or navigate the platform.</p>
                </div>
              </div>
            </div>
          </article>

          {/* Section 3 */}
          <article id="sources" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">03</span>
              <h2>Personal Information Sources</h2>
            </div>
            <div className="privacy-card__body">
              <p>We may collect personal information from the following sources:</p>
              <ul className="privacy-list">
                <li>
                  <strong>Directly from you:</strong> Including when you create an account, visit or use the Services, communicate with us, or otherwise provide us with your personal information.
                </li>
                <li>
                  <strong>Automatically through the Services:</strong> From your device when you use our products or services or visit our websites, and through the use of cookies and similar technologies.
                </li>
                <li>
                  <strong>From our service providers:</strong> When we engage them to enable certain technology and when they collect or process your personal information on our behalf.
                </li>
                <li>
                  <strong>From our partners or other third parties:</strong> In accordance with applicable laws.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 4 */}
          <article id="usage" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">04</span>
              <h2>How We Use Your Personal Information</h2>
            </div>
            <div className="privacy-card__body">
              <p>Depending on how you interact with us or which of the Services you use, we may use personal information for the following purposes:</p>

              <div className="privacy-features">
                <div className="privacy-feature-card">
                  <div className="apple-tag">Services</div>
                  <h4>Provide, Tailor, and Improve</h4>
                  <p>To provide you with the Services, process payments, fulfill orders, remember preferences, send account notifications, arrange shipping, facilitate returns/exchanges, enable reviews, and personalize recommendations.</p>
                </div>

                <div className="privacy-feature-card">
                  <div className="apple-tag">Promotions</div>
                  <h4>Marketing and Advertising</h4>
                  <p>To send promotional communications by email, text message, or mail, and show personalized online advertisements based on your browsing and purchases.</p>
                </div>

                <div className="privacy-feature-card">
                  <div className="apple-tag">Protection</div>
                  <h4>Security and Fraud Prevention</h4>
                  <p>To authenticate accounts, provide secure checkout, detect malicious activity, and secure the platform. <em>Keep your credentials confidential.</em></p>
                </div>

                <div className="privacy-feature-card">
                  <div className="apple-tag">Support</div>
                  <h4>Communicating with You</h4>
                  <p>To provide responsive customer support and maintain our business relationship with you.</p>
                </div>

                <div className="privacy-feature-card privacy-feature-card--full">
                  <div className="apple-tag">Statutory</div>
                  <h4>Legal Reasons</h4>
                  <p>To comply with applicable law, respond to valid legal process, participate in discovery or litigation, and enforce our terms and policies.</p>
                </div>
              </div>
            </div>
          </article>

          {/* Section 5 */}
          <article id="disclosure" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">05</span>
              <h2>How We Disclose Personal Information</h2>
            </div>
            <div className="privacy-card__body">
              <p>In certain circumstances, we may disclose your personal information to third parties for legitimate purposes subject to this Privacy Policy:</p>
              <ul className="privacy-list">
                <li>
                  <strong>With Shopify & Service Providers:</strong> Third parties who perform services on our behalf (IT management, payment processing, data analytics, customer support, cloud storage, fulfillment, and shipping).
                </li>
                <li>
                  <strong>With Business & Marketing Partners:</strong> To provide marketing services and personalized advertisements. You may opt out of targeted ad processing at any time.
                </li>
                <li>
                  <strong>Direct Consent:</strong> When you direct, request, or consent to disclosures (e.g. shipping carriers or login integrations).
                </li>
                <li>
                  <strong>Affiliates:</strong> Within our corporate group.
                </li>
                <li>
                  <strong>Legal & Corporate Transactions:</strong> In connection with a merger, acquisition, bankruptcy, or to comply with statutory legal processes and protect user rights.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 6 */}
          <article id="shopify" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">06</span>
              <h2>Relationship with Shopify</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                The Services are hosted by <strong>Shopify</strong>, which collects and processes personal information about your access to and use of the Services in order to provide and improve the platform.
              </p>
              <p>
                Information you submit to the Services will be transmitted to and shared with Shopify and third parties across global infrastructure nodes.
              </p>
              <p>
                To provide enhanced features, Shopify may process data obtained across merchant interactions. In these circumstances, Shopify is responsible for processing and responding to data rights requests.
              </p>
            </div>
          </article>

          {/* Section 7 */}
          <article id="third-party" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">07</span>
              <h2>Third Party Websites and Links</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                The Services may provide links to external websites or platforms. If you follow non-affiliated links, please review their respective privacy notices. We do not guarantee and are not responsible for the privacy practices or security of third-party domains.
              </p>
            </div>
          </article>

          {/* Section 8 */}
          <article id="children" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">08</span>
              <h2>Children's Data</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                The Services are not intended for use by children, and we do not knowingly collect personal information about children under the age of majority. If a minor has provided information, please contact us for immediate deletion. We have no actual knowledge of sharing or selling personal data of individuals under 16 years of age.
              </p>
            </div>
          </article>

          {/* Section 9 */}
          <article id="security-retention" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">09</span>
              <h2>Security and Retention of Your Information</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We implement industry-standard technical measures, but no digital security is impenetrable. We recommend avoiding unsecure channels for sensitive data.
              </p>
              <p>
                We retain your information only as long as necessary to maintain your account, deliver orders, comply with legal obligations, and enforce agreements.
              </p>
            </div>
          </article>

          {/* Section 10 */}
          <article id="your-rights" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">10</span>
              <h2>Your Rights and Choices</h2>
            </div>
            <div className="privacy-card__body">
              <p>Depending on your jurisdiction, you may have specific statutory rights:</p>

              <div className="privacy-rights-grid">
                <div className="privacy-right-box">
                  <h4>Right to Access / Know</h4>
                  <p>Request access to personal information that we hold about you.</p>
                </div>
                <div className="privacy-right-box">
                  <h4>Right to Delete</h4>
                  <p>Request that we delete personal data we maintain about you.</p>
                </div>
                <div className="privacy-right-box">
                  <h4>Right to Correct</h4>
                  <p>Request correction of inaccurate or outdated personal records.</p>
                </div>
                <div className="privacy-right-box">
                  <h4>Right of Portability</h4>
                  <p>Receive a structured, portable electronic copy of your personal data.</p>
                </div>
              </div>

              <div className="privacy-optout-note">
                <strong>Communication Preferences:</strong> Opt out of promotional emails at any time via the unsubscribe link. Essential transactional and order notices will continue to be sent.
              </div>
            </div>
          </article>

          {/* Section 11 */}
          <article id="complaints" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">11</span>
              <h2>Complaints</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                If you have complaints regarding data processing, please contact us. Depending on where you live, you may have the right to lodge a formal complaint with your local data protection authority.
              </p>
            </div>
          </article>

          {/* Section 12 */}
          <article id="transfers" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">12</span>
              <h2>International Transfers</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We may transfer and process data outside your country of residence. Where required, we rely on Standard Contractual Clauses (SCCs) and recognized cross-border transfer safeguards.
              </p>
            </div>
          </article>

          {/* Section 13 */}
          <article id="updates" className="privacy-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">13</span>
              <h2>Changes to This Privacy Policy</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We may update this Privacy Policy from time to time. Revisions will be published directly on this page with an updated "Last updated" date.
              </p>
            </div>
          </article>

          {/* Section 14: Contact */}
          <article id="contact" className="privacy-card apple-highlight-card">
            <div className="privacy-card__header">
              <span className="apple-badge-num">14</span>
              <h2>Contact</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Should you have any questions about our privacy practices or wish to exercise your rights, please contact our privacy desk:
              </p>

              <div className="privacy-contact-grid">
                <div className="privacy-contact-card">
                  <div className="apple-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h3>Direct Privacy Email</h3>
                  <a href="mailto:shaktikart@gmail.com" className="privacy-contact-link">
                    shaktikart@gmail.com
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
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3>Registered Studio</h3>
                  <address className="privacy-address">
                    opposite rapid metro pillar no. 86 N1/27 DLF PHASE 2 GURUGRAM HARYANA,<br />
                    dlf phase 2, GURUGRAM, HR, 122008, INDIA
                  </address>
                </div>

                <div className="privacy-contact-card">
                  <div className="apple-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <h3>Concierge Helpline</h3>
                  <a href="tel:+918882069334" className="privacy-contact-link">
                    +91 88820 69334
                  </a>
                  <span className="privacy-contact-hours">Mon – Sat, 10:00 AM – 8:00 PM IST</span>
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
          <p>© 2026 HANBORO WATCHES • ALL RIGHTS RESERVED</p>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
