import React, { useState, useEffect } from "react";
import { HanboroLogo } from "./HanboroLogo";

export function TrackOrderView({ onNavigateHome, onNavigatePolicy, onNavigateToProducts, onNavigateToStores }) {
  const [queryValue, setQueryValue] = useState("");
  const [searchType, setSearchType] = useState("auto"); // "auto", "orderId", "awb"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingResult, setTrackingResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    // Check if query params exist in window.location (e.g. ?awb=... or ?orderId=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const initialAwb = urlParams.get("awb") || hashParams.get("awb");
      const initialOrder = urlParams.get("orderId") || urlParams.get("order") || hashParams.get("orderId") || hashParams.get("order");

      if (initialAwb) {
        setQueryValue(initialAwb);
        setSearchType("awb");
        performTrack(initialAwb, "awb");
      } else if (initialOrder) {
        setQueryValue(initialOrder);
        setSearchType("orderId");
        performTrack(initialOrder, "orderId");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const performTrack = async (valueToTrack, type) => {
    const trimmed = (valueToTrack || queryValue).trim();
    if (!trimmed) {
      setError("Please enter your Order Number or Courier AWB Tracking Number.");
      return;
    }

    setLoading(true);
    setError(null);
    setTrackingResult(null);
    setHasSearched(true);

    try {
      // Auto-detect if not specified: AWBs are typically purely numeric or long tracking codes
      let paramKey = "awb";
      if (type === "orderId" || (type === "auto" && (trimmed.startsWith("#") || trimmed.toUpperCase().startsWith("HAN") || /^\d{4,6}$/.test(trimmed)))) {
        paramKey = "orderId";
      }

      // Strip leading # if present for order ID
      const cleanedValue = trimmed.replace(/^#/, "");

      const res = await fetch(`/api/track-order?${paramKey}=${encodeURIComponent(cleanedValue)}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Unable to retrieve tracking details. Please verify your number.");
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "No tracking information found for this consignment.");
      }

      setTrackingResult(json.data);
    } catch (err) {
      setError(err.message || "Unable to connect to order tracking service. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performTrack(queryValue, searchType);
  };

  // Determine stage progression for luxury stepper (0 to 4)
  const getProgressStage = (status) => {
    if (!status) return 1;
    const s = String(status).toUpperCase();
    if (s.includes("DELIVERED")) return 4;
    if (s.includes("OUT FOR DELIVERY") || s.includes("OUT_FOR_DELIVERY")) return 3;
    if (s.includes("TRANSIT") || s.includes("REACHED") || s.includes("SHIPPED") || s.includes("DISPATCHED")) return 2;
    if (s.includes("CONFIRMED") || s.includes("PROCESSING") || s.includes("PICKED") || s.includes("MANIFESTED")) return 1;
    return 1;
  };

  const currentStage = trackingResult ? getProgressStage(trackingResult.status) : 0;

  return (
    <div className="privacy-page-root apple-legal-page track-order-page" style={{ minHeight: "100vh", backgroundColor: "#060606", color: "#f5f5f7" }}>
      {/* ── TOP DEDICATED LUXURY NAVBAR ── */}
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
      <section className="privacy-hero" style={{ paddingBottom: "32px" }}>
        <span className="apple-legal-eyebrow" style={{ color: "#fa2d1d", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Order Concierge & Logistics
        </span>
        <h1 className="privacy-hero__title" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, margin: "8px 0 12px" }}>
          Track Your Timepiece
        </h1>
        <p className="privacy-hero__sub" style={{ color: "#a1a1a6", fontSize: "15px", maxWidth: "620px", margin: "0 auto" }}>
          Real-time insured express dispatch, transit, and delivery status for your Hanboro order.
        </p>
      </section>

      {/* ── MAIN TRACKING CONTAINER ── */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 20px 80px" }}>
        
        {/* Search Input Card */}
        <div style={{
          backgroundColor: "#111111",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          padding: "28px 24px",
          marginBottom: "32px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <label htmlFor="trackInput" style={{ fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#86868b", fontWeight: 600 }}>
                Order ID or Courier AWB Number
              </label>
              
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { id: "auto", label: "Auto Detect" },
                  { id: "orderId", label: "Order ID" },
                  { id: "awb", label: "AWB / Waybill" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSearchType(mode.id)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      borderRadius: "12px",
                      border: "none",
                      backgroundColor: searchType === mode.id ? "#fa2d1d" : "rgba(255, 255, 255, 0.06)",
                      color: searchType === mode.id ? "#ffffff" : "#a1a1a6",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px", position: "relative" }}>
                <input
                  id="trackInput"
                  type="text"
                  value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                  placeholder="e.g. #HAN1024 or 143249021489"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#181818",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    color: "#ffffff",
                    fontSize: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#fa2d1d";
                    e.target.style.boxShadow = "0 0 0 3px rgba(250, 45, 29, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "14px 28px",
                  backgroundColor: loading ? "#444444" : "#fa2d1d",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  letterSpacing: "0.04em",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.2s ease, transform 0.1s ease",
                  minWidth: "140px",
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Track Order</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#6e6e73", lineHeight: 1.5 }}>
              Tip: You can find your order number in your confirmation email or SMS received upon checkout.
            </p>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: "rgba(250, 45, 29, 0.08)",
            border: "1px solid rgba(250, 45, 29, 0.3)",
            borderRadius: "14px",
            padding: "18px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fa2d1d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#fa2d1d" }}>
                Tracking Details Unavailable
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#d1d1d6", lineHeight: 1.5 }}>
                {error}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#a1a1a6" }}>
                If you placed your order recently, please allow up to 12-24 hours for courier tracking coordinates to propagate. For instant assistance, connect with our concierge below.
              </p>
            </div>
          </div>
        )}

        {/* Tracking Results View */}
        {trackingResult && (
          <div style={{
            backgroundColor: "#111111",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "32px 28px",
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.8)",
            marginBottom: "32px",
          }}>
            {/* Status Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "24px",
              marginBottom: "28px",
              flexWrap: "wrap",
              gap: "16px",
            }}>
              <div>
                <span style={{ fontSize: "12px", color: "#86868b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Consignment Status
                </span>
                <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0 6px", color: "#ffffff" }}>
                  {trackingResult.status || "Order Confirmed"}
                </h2>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#a1a1a6" }}>
                  {trackingResult.orderId && (
                    <span>Order: <strong style={{ color: "#ffffff" }}>#{trackingResult.orderId}</strong></span>
                  )}
                  {trackingResult.awb && (
                    <span>AWB: <strong style={{ color: "#ffffff" }}>{trackingResult.awb}</strong></span>
                  )}
                  {trackingResult.courier && (
                    <span>Partner: <strong style={{ color: "#ffffff" }}>{trackingResult.courier}</strong></span>
                  )}
                </div>
              </div>

              {trackingResult.estimatedDelivery && (
                <div style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  textAlign: "right",
                }}>
                  <span style={{ fontSize: "11px", color: "#86868b", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                    Estimated Delivery
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#fa2d1d" }}>
                    {trackingResult.estimatedDelivery}
                  </span>
                </div>
              )}
            </div>

            {/* Step Progress Bar */}
            <div style={{ margin: "32px 0 40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: "8px" }}>
                {/* Background Connecting Line */}
                <div style={{
                  position: "absolute",
                  top: "14px",
                  left: "20px",
                  right: "20px",
                  height: "2px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  zIndex: 1,
                }} />
                
                {/* Active Connecting Line */}
                <div style={{
                  position: "absolute",
                  top: "14px",
                  left: "20px",
                  width: `${Math.min(100, Math.max(0, (currentStage - 1) * 33.33))}%`,
                  height: "2px",
                  backgroundColor: "#fa2d1d",
                  zIndex: 2,
                  transition: "width 0.6s ease",
                }} />

                {[
                  { step: 1, label: "Confirmed" },
                  { step: 2, label: "Dispatched" },
                  { step: 3, label: "In Transit" },
                  { step: 4, label: "Delivered" },
                ].map((st) => {
                  const isCompleted = currentStage >= st.step;
                  const isCurrent = currentStage === st.step;
                  return (
                    <div key={st.step} style={{ position: "relative", zIndex: 3, textAlign: "center", width: "70px" }}>
                      <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: isCompleted ? "#fa2d1d" : "#1a1a1a",
                        border: isCompleted ? "2px solid #fa2d1d" : "2px solid rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                        boxShadow: isCurrent ? "0 0 12px rgba(250, 45, 29, 0.6)" : "none",
                      }}>
                        {isCompleted ? "✓" : st.step}
                      </div>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCompleted ? "#ffffff" : "#6e6e73",
                        display: "block",
                      }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Activities */}
            {trackingResult.activities && trackingResult.activities.length > 0 ? (
              <div>
                <h3 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#86868b", marginBottom: "18px" }}>
                  Transit Scan History
                </h3>
                <div style={{ borderLeft: "2px solid rgba(255, 255, 255, 0.1)", paddingLeft: "20px", marginLeft: "10px" }}>
                  {trackingResult.activities.map((act, idx) => (
                    <div key={idx} style={{ position: "relative", marginBottom: "20px" }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: "absolute",
                        left: "-27px",
                        top: "4px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: idx === 0 ? "#fa2d1d" : "rgba(255, 255, 255, 0.3)",
                        border: "2px solid #111111",
                      }} />
                      
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "2px" }}>
                        {act.activity || act.status}
                      </div>
                      <div style={{ fontSize: "12px", color: "#a1a1a6", display: "flex", gap: "12px" }}>
                        <span>{act.date}</span>
                        {act.location && <span>• {act.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ margin: "20px 0 0", fontSize: "13px", color: "#86868b", fontStyle: "italic" }}>
                Detailed checkpoint scan logs are being updated by the logistics carrier.
              </p>
            )}
          </div>
        )}

        {/* Concierge Support Box */}
        <div style={{
          backgroundColor: "#111111",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "18px",
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}>
          <div>
            <span style={{ fontSize: "11px", color: "#fa2d1d", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Atelier Hanboro Concierge
            </span>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "4px 0 2px", color: "#ffffff" }}>
              Require priority assistance with your delivery?
            </h3>
            <p style={{ fontSize: "13px", color: "#86868b", margin: 0 }}>
              Our Gurugram boutique dispatch team is on standby 7 days a week.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="https://wa.me/918882069334?text=Hello%20Hanboro%2C%20I%20would%20like%20to%20inquire%20about%20my%20order%20status."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 18px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "10px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              WhatsApp Concierge
            </a>
            <a
              href="tel:+918882069334"
              style={{
                padding: "10px 18px",
                backgroundColor: "rgba(250, 45, 29, 0.15)",
                color: "#fa2d1d",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "10px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              +91 88820 69334
            </a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="privacy-footer">
        <div className="privacy-footer__inner">
          <HanboroLogo theme="light" size={18} />
          <p>© 2026 HANBORO WATCHES • RISE N BE ORIGINAL LIFESTYLE PRIVATE LIMITED</p>
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
