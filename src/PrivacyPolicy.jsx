import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";

export function PrivacyPolicy({ onNavigateHome, onNavigateToProducts, onNavigateToStores, onOpenConcierge }) {
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
    { id: "overview", label: "1. Overview & Scope" },
    { id: "collected-info", label: "2. Information Collected" },
    { id: "sources", label: "3. Information Sources" },
    { id: "usage", label: "4. How We Use Data" },
    { id: "disclosure", label: "5. Disclosure to Third Parties" },
    { id: "shopify", label: "6. Relationship with Shopify" },
    { id: "third-party", label: "7. External Sites & Links" },
    { id: "children", label: "8. Children's Data" },
    { id: "security-retention", label: "9. Security & Retention" },
    { id: "your-rights", label: "10. Your Rights & Choices" },
    { id: "complaints", label: "11. Complaints & Appeals" },
    { id: "transfers", label: "12. International Transfers" },
    { id: "updates", label: "13. Policy Updates" },
    { id: "contact", label: "14. Contact & Inquiries" },
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
    <div className="privacy-page-root">
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
          <span>Legal & Transparency Protocol</span>
        </div>
        <h1 className="privacy-hero__title">Privacy Policy</h1>
        <p className="privacy-hero__sub">
          Last updated: <span className="privacy-highlight-date">October 24, 2025</span>
        </p>
        <p className="privacy-hero__desc">
          Hanboro Watches operates this store and website to provide you with a curated, luxury horological shopping experience. This document outlines our transparent practices regarding the collection, processing, and protection of your personal information.
        </p>
      </section>

      {/* ── MAIN CONTENT WRAPPER WITH TABLE OF CONTENTS ── */}
      <div className="privacy-layout">
        {/* Sticky Table of Contents Navigation */}
        <aside className="privacy-sidebar" aria-label="Privacy Policy Sections">
          <div className="privacy-sidebar__inner">
            <h2 className="privacy-sidebar__heading">Table of Contents</h2>
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
              <span className="privacy-concierge-tag">Legal Concierge</span>
              <p className="privacy-concierge-text">Questions regarding your privacy rights or data deletion?</p>
              <a href="mailto:shaktikart@gmail.com" className="privacy-concierge-btn">
                Contact DPO / Concierge
              </a>
            </div>
          </div>
        </aside>

        {/* Policy Body */}
        <main className="privacy-content" role="main">
          {/* Section 1: Overview */}
          <article id="overview" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">01</span>
              <h2>Overview & Service Architecture</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                <strong>Hanboro Watches</strong> operates this store and website, including all related information, content, features, tools, products, and services, in order to provide you, the customer, with a curated shopping experience (the <em>"Services"</em>).
              </p>
              <p>
                Hanboro Watches is powered by Shopify, which enables us to provide the Services to you. This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use, or make a purchase or other transaction using the Services or otherwise communicate with us.
              </p>
              <div className="privacy-callout">
                <div className="privacy-callout__icon">⚖️</div>
                <div className="privacy-callout__text">
                  <strong>Conflict Resolution:</strong> If there is a conflict between our Terms of Service and this Privacy Policy, this Privacy Policy controls with respect to the collection, processing, and disclosure of your personal information.
                </div>
              </div>
              <p>
                Please read this Privacy Policy carefully. By using and accessing any of the Services, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described in this Privacy Policy.
              </p>
            </div>
          </article>

          {/* Section 2: Personal Information Collected */}
          <article id="collected-info" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">02</span>
              <h2>Personal Information We Collect or Process</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                When we use the term <strong>"personal information,"</strong> we are referring to information that identifies or can reasonably be linked to you or another person. Personal information does not include information that is collected anonymously or that has been de-identified, so that it cannot identify or be reasonably linked to you.
              </p>
              <p>
                We may collect or process the following categories of personal information, including inferences drawn from this personal information, depending on how you interact with the Services, where you live, and as permitted or required by applicable law:
              </p>

              <div className="privacy-grid">
                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">📇</span>
                    <h3>Contact Details</h3>
                  </div>
                  <p>Your full legal name, residential address, billing address, global shipping address, verified phone number, and email address.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">💳</span>
                    <h3>Financial & Payment Data</h3>
                  </div>
                  <p>Credit card, debit card, and financial account numbers, encrypted payment card tokens, transaction logs, form of payment, payment confirmations, and related settlement details.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">🔐</span>
                    <h3>Account Credentials</h3>
                  </div>
                  <p>Client dossier username, password hash, biometric tokens where supported, security question parameters, horological preferences, and curated site settings.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">📦</span>
                    <h3>Transaction Information</h3>
                  </div>
                  <p>Timepieces viewed, items added to bag or wishlist, purchased chronographs, returns, bespoke exchanges, cancellations, and historical purchase records.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">💬</span>
                    <h3>Client Communications</h3>
                  </div>
                  <p>Direct inquiries submitted to our concierge, customer support dialogues, email correspondence, and feedback transcripts.</p>
                </div>

                <div className="privacy-info-item">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">💻</span>
                    <h3>Device & Network Data</h3>
                  </div>
                  <p>Information about your operating system, browser engine, network routing, IP address, device fingerprints, and cryptographic unique session identifiers.</p>
                </div>

                <div className="privacy-info-item privacy-info-item--full">
                  <div className="privacy-info-item__header">
                    <span className="privacy-info-icon">📊</span>
                    <h3>Usage & Behavioral Diagnostics</h3>
                  </div>
                  <p>Granular interactions regarding navigation rhythms, stage scroll depths, timepiece configuration clicks, and how you discover and interact with the Services.</p>
                </div>
              </div>
            </div>
          </article>

          {/* Section 3: Sources */}
          <article id="sources" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">03</span>
              <h2>Personal Information Sources</h2>
            </div>
            <div className="privacy-card__body">
              <p>We may collect personal information from the following verified sources:</p>
              <ul className="privacy-list">
                <li>
                  <strong>Directly from you:</strong> When you create an account, complete a timepiece order, communicate with our concierge, or otherwise provide us with your information.
                </li>
                <li>
                  <strong>Automatically through the Services:</strong> From your device as you navigate our platform, via secure telemetry, cookies, local storage tokens, and modern tracking safeguards.
                </li>
                <li>
                  <strong>From our service providers:</strong> When we engage vetted infrastructure partners to enable payment processing, cloud hosting, and horological fulfillment.
                </li>
                <li>
                  <strong>From our partners or other third parties:</strong> Including verified advertising networks and horology marketplace partners.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 4: How We Use Your Personal Information */}
          <article id="usage" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">04</span>
              <h2>How We Use Your Personal Information</h2>
            </div>
            <div className="privacy-card__body">
              <p>Depending on how you interact with us or which of the Services you use, we utilize personal information for the following operational purposes:</p>

              <div className="privacy-features">
                <div className="privacy-feature-card">
                  <div className="privacy-feature-badge">Fulfillment</div>
                  <h4>Provide, Tailor, and Improve the Services</h4>
                  <p>
                    To execute our purchase contract with you, process payments, fulfill bespoke timepiece orders, remember horology preferences, dispatch status notifications, manage your account, arrange armored/express shipping, facilitate returns/exchanges, enable verified reviews, and curate personalized product recommendations.
                  </p>
                </div>

                <div className="privacy-feature-card">
                  <div className="privacy-feature-badge">Curation</div>
                  <h4>Marketing and Advertising</h4>
                  <p>
                    To send marketing, advertising, and promotional communications by email, SMS, or direct post, and to present tailored showcase advertisements on our platform or partner websites based on your browsing patterns and cart additions.
                  </p>
                </div>

                <div className="privacy-feature-card">
                  <div className="privacy-feature-badge">Integrity</div>
                  <h4>Security and Fraud Prevention</h4>
                  <p>
                    To authenticate account access, detect and prevent malicious or unauthorized transactions, safeguard customer assets, enforce account safety protocols, and ensure platform integrity. <em>Note: Never share your credentials with unauthorized third parties.</em>
                  </p>
                </div>

                <div className="privacy-feature-card">
                  <div className="privacy-feature-badge">Dialogue</div>
                  <h4>Communicating with You</h4>
                  <p>
                    To deliver white-glove customer concierge service, provide prompt responses to technical or order queries, and maintain a seamless client relationship.
                  </p>
                </div>

                <div className="privacy-feature-card privacy-feature-card--full">
                  <div className="privacy-feature-badge">Compliance</div>
                  <h4>Legal and Regulatory Reasons</h4>
                  <p>
                    To comply with applicable statutory laws, respond to lawful subpoenas or court warrants, conduct necessary civil discovery, participate in litigation, and uphold our contractual terms.
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Section 5: How We Disclose Personal Information */}
          <article id="disclosure" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">05</span>
              <h2>How We Disclose Personal Information</h2>
            </div>
            <div className="privacy-card__body">
              <p>In specific circumstances, we may disclose your personal information to third parties for legitimate business purposes:</p>
              <ul className="privacy-list">
                <li>
                  <strong>Shopify & Infrastructure Vendors:</strong> Trusted third parties performing services on our behalf (IT management, encrypted payment gateways, data analytics, customer support, cloud storage, logistics, and global courier dispatch).
                </li>
                <li>
                  <strong>Business & Marketing Partners:</strong> To provide targeted advertising. For example, we utilize Shopify systems to support personalized advertisements across digital networks. You retain the right to opt out of targeted ad processing at any time.
                </li>
                <li>
                  <strong>User-Directed Third Parties:</strong> When you direct or explicitly consent to disclosure, such as for specialized courier tracking or social authentication widgets.
                </li>
                <li>
                  <strong>Corporate Affiliates:</strong> Within our luxury horology corporate group for unified customer experience management.
                </li>
                <li>
                  <strong>Corporate Transactions & Legal Obligations:</strong> In connection with a merger, acquisition, restructuring, or bankruptcy; or to satisfy valid statutory obligations and protect our platform and community rights.
                </li>
              </ul>
            </div>
          </article>

          {/* Section 6: Relationship with Shopify */}
          <article id="shopify" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">06</span>
              <h2>Relationship with Shopify</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                The Services are hosted on and powered by <strong>Shopify</strong>, which collects and processes personal information regarding your access to and usage of the store in order to facilitate and enhance the shopping ecosystem.
              </p>
              <p>
                Information you submit to the Services is transmitted to and shared with Shopify and its global infrastructure nodes across various jurisdictions to ensure uninterrupted transaction processing.
              </p>
              <p>
                Additionally, to help protect, develop, and refine our services, we deploy certain Shopify enhanced analytics features that evaluate cross-merchant interactions. In these contexts, Shopify acts as an independent or joint controller for specific processing tasks, including fulfilling applicable data subject requests.
              </p>
            </div>
          </article>

          {/* Section 7: Third Party Websites & Links */}
          <article id="third-party" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">07</span>
              <h2>Third Party Websites and Links</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Our Services may contain links to external websites, boutique registries, or social platforms. If you navigate to non-affiliated third-party domains, please review their respective privacy and security statements.
              </p>
              <p>
                We do not warrant or assume liability for the practices, accuracy, or security standards of third-party platforms. Any personal data shared in public horology forums or social networks will be accessible according to those third-party platforms' rules.
              </p>
            </div>
          </article>

          {/* Section 8: Children's Data */}
          <article id="children" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">08</span>
              <h2>Children's Privacy Protection</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                The Services are strictly designed for adult collectors and consumers and are not intended for use by minors under the age of majority in their applicable jurisdiction. We do not knowingly collect personal data from children.
              </p>
              <p>
                If you are a parent or guardian and believe your child has submitted personal details to our store, please reach out to our privacy concierge to have the information promptly purged. As of the Effective Date, we have no actual knowledge of selling or sharing data of individuals under 16 years of age.
              </p>
            </div>
          </article>

          {/* Section 9: Security and Retention of Your Information */}
          <article id="security-retention" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">09</span>
              <h2>Security and Retention of Your Information</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We implement industry-standard encryption, SSL transport safeguards, and strict database access controls. However, no digital transmission or electronic storage protocol can be guaranteed to be 100% impenetrable. We advise clients to protect their credentials and avoid transmitting sensitive financial data over insecure public channels.
              </p>
              <p>
                <strong>Data Retention:</strong> We retain your personal data only as long as necessary to maintain your account, deliver purchased timepieces, comply with statutory tax and accounting laws, settle dispute arbitrations, and enforce our binding agreements.
              </p>
            </div>
          </article>

          {/* Section 10: Your Rights and Choices */}
          <article id="your-rights" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">10</span>
              <h2>Your Rights and Choices</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Depending on your jurisdiction (such as under GDPR, UK GDPR, CCPA/CPRA, or the Digital Personal Data Protection laws), you may hold specific legal rights:
              </p>

              <div className="privacy-rights-grid">
                <div className="privacy-right-box">
                  <h4>Right to Access / Know</h4>
                  <p>Request disclosure of the specific categories and pieces of personal data we retain about you.</p>
                </div>
                <div className="privacy-right-box">
                  <h4>Right to Delete</h4>
                  <p>Request permanent deletion or erasure of your personal data from our operational repositories.</p>
                </div>
                <div className="privacy-right-box">
                  <h4>Right to Correct</h4>
                  <p>Request rectification of any inaccurate, outdated, or incomplete personal records.</p>
                </div>
                <div className="privacy-right-box">
                  <h4>Right to Portability</h4>
                  <p>Receive an electronic export of your data in a structured, commonly used machine-readable format.</p>
                </div>
              </div>

              <div className="privacy-optout-note">
                <strong>Marketing Communication Preferences:</strong> You can opt out of promotional emails at any time by clicking the <em>"Unsubscribe"</em> link included in every newsletter. Essential transactional notices (such as order status and shipping tracking) will continue to be delivered.
              </div>

              <p style={{ marginTop: "16px" }}>
                <strong>Verification & Authorized Agents:</strong> To protect your privacy, we may verify your identity before fulfilling rights requests. You may designate an authorized legal agent by submitting documented power of attorney or verified authorization.
              </p>
            </div>
          </article>

          {/* Section 11: Complaints */}
          <article id="complaints" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">11</span>
              <h2>Complaints and Regulatory Inquiries</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                If you have concerns regarding our processing of your personal information, please contact our Data Protection Concierge. Depending on your location, you may also have the right to lodge a formal complaint with your local supervisory or data protection authority.
              </p>
            </div>
          </article>

          {/* Section 12: International Transfers */}
          <article id="transfers" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">12</span>
              <h2>International Transfers</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Please note that we may store and process your personal data across secure servers outside your home country.
              </p>
              <p>
                If data is transferred outside the European Economic Area (EEA) or the United Kingdom, we implement recognized cross-border transfer mechanisms, including European Commission Standard Contractual Clauses (SCCs) and UK International Data Transfer Agreements, ensuring equivalent security standards.
              </p>
            </div>
          </article>

          {/* Section 13: Policy Updates */}
          <article id="updates" className="privacy-card">
            <div className="privacy-card__header">
              <span className="privacy-section-number">13</span>
              <h2>Changes to This Privacy Policy</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                We may periodically update this Privacy Policy to reflect evolving horological operations, regulatory mandates, or technological updates. Any modifications will be posted directly to this URL with a revised <strong>"Last updated"</strong> timestamp.
              </p>
            </div>
          </article>

          {/* Section 14: Contact Information */}
          <article id="contact" className="privacy-card privacy-card--highlight">
            <div className="privacy-card__header">
              <span className="privacy-section-number">14</span>
              <h2>Contact Our Horological Concierge</h2>
            </div>
            <div className="privacy-card__body">
              <p>
                Should you have any questions regarding this Privacy Policy, wish to exercise your legal privacy rights, or request account data removal, please connect with our team:
              </p>

              <div className="privacy-contact-grid">
                <div className="privacy-contact-card">
                  <span className="privacy-contact-icon">✉️</span>
                  <h3>Direct Privacy Email</h3>
                  <a href="mailto:shaktikart@gmail.com" className="privacy-contact-link">
                    shaktikart@gmail.com
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
                  <span className="privacy-contact-icon">📍</span>
                  <h3>Registered Studio & HQ</h3>
                  <address className="privacy-address">
                    opposite rapid metro pillar no. 86 N1/27 DLF PHASE 2 GURUGRAM HARYANA,<br />
                    dlf phase 2, GURUGRAM, HR, 122008, INDIA
                  </address>
                </div>

                <div className="privacy-contact-card">
                  <span className="privacy-contact-icon">📞</span>
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
          <HanboroLogo theme="light" size={20} />
          <p>© 2026 HANBORO WATCHES • ALL RIGHTS RESERVED</p>
          <button type="button" className="privacy-footer-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
