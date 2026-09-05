import React, { useState, useEffect } from "react";
import { useStore } from "./StoreContext";
import { HanboroLogo } from "./HanboroLogo";

/* ── APPLE-GRADE MINIMALIST VECTOR ICONS ── */
const Icons = {
  ArrowLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Lock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Card: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  Qr: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Cash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Shield: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Box: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
};

export function CheckoutPage({ onNavigate }) {
  const {
    activeCheckoutItems,
    subtotalInr,
    finalTotalInr,
    user,
    isAdmin,
    placeOrder,
  } = useStore();

  const [step, setStep] = useState(1); // 1 = Shipping, 2 = Payment, 3 = Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Delhi NCR");
  const [pincode, setPincode] = useState("");

  // Payment method: "card" | "upi" | "cod"
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Simulated Card Details
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8829");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("892");
  const [cardHolder, setCardHolder] = useState("");

  // Auto-fill from logged-in user profile
  useEffect(() => {
    if (user) {
      if (user.fullName) {
        setName(user.fullName);
        setCardHolder(user.fullName.toUpperCase());
      }
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const handleGoToPayment = (e) => {
    e.preventDefault();
    if (!name || !email || !address || !city || !pincode) {
      alert("Please fill in all required shipping details.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderData = {
        name,
        email,
        phone,
        address,
        city,
        state: stateName,
        pincode,
        paymentMethod:
          paymentMethod === "card"
            ? "Credit Card (Encrypted)"
            : paymentMethod === "upi"
            ? "Instant UPI / QR"
            : "White-Glove Concierge COD",
      };

      const order = await placeOrder(orderData);
      setCompletedOrder(order);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert("Could not process order: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeCheckoutItems.length === 0 && step !== 3) {
    return (
      <div className="apple-checkout-root">
        <header className="apple-checkout-topbar">
          <div className="apple-checkout-topbar-inner">
            <button
              type="button"
              className="apple-back-btn"
              onClick={() => onNavigate && onNavigate("products", "#products")}
            >
              <Icons.ArrowLeft />
              <span>Timepieces</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("home", "#top")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              aria-label="Hanboro Home"
            >
              <HanboroLogo theme="light" size={22} />
            </button>
            <div className="apple-secure-badge">
              <Icons.Lock />
              <span>256-Bit Encrypted</span>
            </div>
          </div>
        </header>

        <div className="apple-checkout-empty-container">
          <div className="apple-empty-icon">
            <Icons.Box />
          </div>
          <h2 className="apple-empty-title">No Timepieces Selected for Acquisition</h2>
          <p className="apple-empty-text">
            Your shopping bag is currently empty. Please select a timepiece from the collection to proceed.
          </p>
          <button
            type="button"
            className="apple-primary-btn"
            onClick={() => onNavigate && onNavigate("products", "#products")}
          >
            Explore Collection →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-checkout-root">
      {/* ── TOP BAR ── */}
      <header className="apple-checkout-topbar">
        <div className="apple-checkout-topbar-inner">
          <button
            type="button"
            className="apple-back-btn"
            onClick={() => {
              if (step === 2) {
                setStep(1);
              } else if (step === 3) {
                onNavigate && onNavigate("products", "#products");
              } else {
                onNavigate && onNavigate("products", "#products");
              }
            }}
          >
            <Icons.ArrowLeft />
            <span>{step === 2 ? "Shipping Details" : "Timepieces"}</span>
          </button>

          <button
            type="button"
            className="apple-checkout-brand"
            onClick={() => onNavigate && onNavigate("home", "#top")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0 }}
            aria-label="Hanboro Home"
          >
            <HanboroLogo theme="light" size={22} />
            <span className="apple-checkout-brand-sub">CHECKOUT</span>
          </button>

          <div className="apple-secure-badge">
            <Icons.Lock />
            <span>256-Bit SSL</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CHECKOUT CONTAINER ── */}
      <main className="apple-checkout-container">
        
        {/* ── PROGRESS STEP INDICATOR ── */}
        {step < 3 && (
          <div className="apple-checkout-stepper">
            <div className={`stepper-step ${step >= 1 ? "is-active" : ""}`}>
              <span className="stepper-num">{step > 1 ? "✓" : "1"}</span>
              <span className="stepper-text">Shipping & Contact</span>
            </div>
            <div className={`stepper-line ${step >= 2 ? "is-active" : ""}`} />
            <div className={`stepper-step ${step >= 2 ? "is-active" : ""}`}>
              <span className="stepper-num">2</span>
              <span className="stepper-text">Payment Method</span>
            </div>
          </div>
        )}

        {/* ── 2-COLUMN CHECKOUT LAYOUT ── */}
        <div className={`apple-checkout-layout ${step === 3 ? "apple-checkout-layout--confirmed" : ""}`}>
          
          {/* ════ LEFT COLUMN: MAIN FORM ════ */}
          <div className="apple-checkout-main-col">
            
            {/* ── STEP 1: SHIPPING & CONTACT DETAILS ── */}
            {step === 1 && (
              <form className="apple-checkout-form" onSubmit={handleGoToPayment}>
                <div className="apple-form-card">
                  <h2 className="apple-form-card-title">1. Client & Contact Information</h2>
                  
                  <div className="apple-form-group">
                    <label htmlFor="chk-name" className="apple-form-label">Full Name / Title *</label>
                    <input
                      id="chk-name"
                      type="text"
                      className="apple-form-input"
                      placeholder="e.g. Jai Goel"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setCardHolder(e.target.value.toUpperCase());
                      }}
                      required
                    />
                  </div>

                  <div className="apple-form-row apple-form-row--two">
                    <div className="apple-form-group">
                      <label htmlFor="chk-email" className="apple-form-label">Email Address (For Tracking & Invoice) *</label>
                      <input
                        id="chk-email"
                        type="email"
                        className="apple-form-input"
                        placeholder="yourname@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="apple-form-group">
                      <label htmlFor="chk-phone" className="apple-form-label">Contact Phone / VIP Concierge *</label>
                      <input
                        id="chk-phone"
                        type="tel"
                        className="apple-form-input"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="apple-form-card">
                  <h2 className="apple-form-card-title">2. Shipping & Delivery Address</h2>

                  <div className="apple-form-group">
                    <label htmlFor="chk-address" className="apple-form-label">Delivery Address (Apartment, Suite, Street) *</label>
                    <input
                      id="chk-address"
                      type="text"
                      className="apple-form-input"
                      placeholder="e.g. Penthouse 4B, Luxury Boulevard"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="apple-form-row apple-form-row--three">
                    <div className="apple-form-group">
                      <label htmlFor="chk-city" className="apple-form-label">City *</label>
                      <input
                        id="chk-city"
                        type="text"
                        className="apple-form-input"
                        placeholder="e.g. New Delhi"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="apple-form-group">
                      <label htmlFor="chk-state" className="apple-form-label">State *</label>
                      <div className="apple-select-wrap">
                        <select
                          id="chk-state"
                          className="apple-form-select"
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                        >
                          <option value="Delhi NCR">Delhi NCR</option>
                          <option value="Maharashtra">Maharashtra (Mumbai)</option>
                          <option value="Karnataka">Karnataka (Bengaluru)</option>
                          <option value="Telangana">Telangana (Hyderabad)</option>
                          <option value="Tamil Nadu">Tamil Nadu (Chennai)</option>
                          <option value="Gujarat">Gujarat (Ahmedabad)</option>
                          <option value="West Bengal">West Bengal (Kolkata)</option>
                          <option value="Rajasthan">Rajasthan (Jaipur)</option>
                          <option value="Haryana">Haryana (Gurugram)</option>
                          <option value="Uttar Pradesh">Uttar Pradesh (Noida)</option>
                          <option value="Other States">Other States / UT</option>
                        </select>
                        <div className="apple-select-chevron">
                          <Icons.ChevronDown />
                        </div>
                      </div>
                    </div>

                    <div className="apple-form-group">
                      <label htmlFor="chk-pin" className="apple-form-label">PIN Code *</label>
                      <input
                        id="chk-pin"
                        type="text"
                        className="apple-form-input"
                        placeholder="110001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="apple-courier-banner">
                    <div className="apple-courier-icon">
                      <Icons.Check />
                    </div>
                    <div className="apple-courier-text">
                      <strong>Complimentary Insured White-Glove Delivery</strong>
                      <p>Dispatched in tamper-proof armored presentation packaging with GPS tracking.</p>
                    </div>
                  </div>
                </div>

                <div className="apple-form-actions">
                  <button type="submit" className="apple-primary-submit-btn">
                    <span>Continue to Payment Method →</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 2: PAYMENT METHOD ── */}
            {step === 2 && (
              <div className="apple-checkout-payment-step">
                <div className="apple-form-card">
                  <h2 className="apple-form-card-title">Select Acquisition Payment Mode</h2>
                  
                  <div className="apple-payment-grid">
                    <label
                      className={`apple-payment-pill ${paymentMethod === "card" ? "is-selected" : ""}`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                      />
                      <div className="apple-payment-info">
                        <div className="apple-payment-head">
                          <Icons.Card />
                          <span className="apple-payment-title">Credit / Debit Card</span>
                        </div>
                        <span className="apple-payment-desc">Visa, Mastercard, Amex, Diners</span>
                      </div>
                    </label>

                    <label
                      className={`apple-payment-pill ${paymentMethod === "upi" ? "is-selected" : ""}`}
                      onClick={() => setPaymentMethod("upi")}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                      />
                      <div className="apple-payment-info">
                        <div className="apple-payment-head">
                          <Icons.Qr />
                          <span className="apple-payment-title">Instant UPI / QR Code</span>
                        </div>
                        <span className="apple-payment-desc">GPay, PhonePe, Paytm, BHIM</span>
                      </div>
                    </label>

                    <label
                      className={`apple-payment-pill ${paymentMethod === "cod" ? "is-selected" : ""}`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      <div className="apple-payment-info">
                        <div className="apple-payment-head">
                          <Icons.Cash />
                          <span className="apple-payment-title">White-Glove COD</span>
                        </div>
                        <span className="apple-payment-desc">Pay upon delivery verification</span>
                      </div>
                    </label>
                  </div>

                  {/* Card Simulator */}
                  {paymentMethod === "card" && (
                    <div className="apple-card-simulator">
                      <div className="apple-black-card">
                        <div className="apple-card-top">
                          <span className="apple-card-chip">■■</span>
                          <HanboroLogo theme="light" size={16} />
                        </div>
                        <div className="apple-card-number">{cardNumber}</div>
                        <div className="apple-card-bottom">
                          <div>
                            <span className="card-lbl">CARDHOLDER</span>
                            <span className="card-val">{cardHolder || "VALUED CLIENT"}</span>
                          </div>
                          <div>
                            <span className="card-lbl">EXPIRES</span>
                            <span className="card-val">{cardExpiry}</span>
                          </div>
                        </div>
                      </div>

                      <div className="apple-card-inputs">
                        <div className="apple-form-group">
                          <label className="apple-form-label">Card Number</label>
                          <input
                            type="text"
                            className="apple-form-input"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>
                        <div className="apple-form-group">
                          <label className="apple-form-label">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            className="apple-form-input"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="apple-form-group">
                          <label className="apple-form-label">CVV</label>
                          <input
                            type="password"
                            maxLength="4"
                            className="apple-form-input"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Simulator */}
                  {paymentMethod === "upi" && (
                    <div className="apple-upi-box">
                      <div className="apple-upi-qr">
                        <div className="apple-qr-grid" />
                      </div>
                      <div className="apple-upi-details">
                        <span className="apple-upi-id">hanboro.official@icici</span>
                        <span className="apple-upi-sub">Scan using any UPI App or authorize request</span>
                      </div>
                    </div>
                  )}

                  {/* COD info */}
                  {paymentMethod === "cod" && (
                    <div className="apple-cod-box">
                      <p>
                        An executive horology courier will personally hand-deliver the timepiece in an armored presentation case. Card, UPI, and Cash accepted upon inspection.
                      </p>
                    </div>
                  )}
                </div>

                <div className="apple-form-actions">
                  <button
                    type="button"
                    className="apple-secondary-btn"
                    onClick={() => setStep(1)}
                  >
                    ← Edit Shipping
                  </button>

                  <button
                    type="button"
                    className="apple-primary-submit-btn"
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                  >
                    {isSubmitting ? (
                      <span>Securing Allocation...</span>
                    ) : (
                      <span>Complete Acquisition (Pay ₹{finalTotalInr.toLocaleString("en-IN")}) →</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: ORDER CONFIRMED ── */}
            {step === 3 && completedOrder && (
              <div className="apple-confirmation-card">
                <div className="confirm-icon-wrap">
                  <Icons.Check />
                </div>

                <span className="confirm-tag">ACQUISITION COMPLETE</span>
                <h1 className="confirm-title">Timepiece Allocation Confirmed</h1>
                <p className="confirm-desc">
                  Thank you, <strong>{completedOrder.customer_name}</strong>. Your horological allocation has been confirmed and saved to your account.
                </p>

                <div className="confirm-dossier-box">
                  <div className="dossier-row">
                    <span className="dossier-label">Official Order Reference</span>
                    <strong className="dossier-ref">{completedOrder.order_ref}</strong>
                  </div>
                  <div className="dossier-row">
                    <span className="dossier-label">Airway Bill / Tracking</span>
                    <code className="dossier-tracking">{completedOrder.tracking_number}</code>
                  </div>
                  <div className="dossier-row">
                    <span className="dossier-label">Destination</span>
                    <span>{completedOrder.shipping_address?.address}, {completedOrder.shipping_address?.city}</span>
                  </div>
                  <div className="dossier-row">
                    <span className="dossier-label">Payment Mode</span>
                    <span>{completedOrder.payment_method}</span>
                  </div>
                  <div className="dossier-row dossier-row--total">
                    <span className="dossier-label">Total Amount Paid</span>
                    <strong className="dossier-total-num">₹{Number(completedOrder.total_amount).toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                <div className="confirm-actions">
                  <button
                    type="button"
                    className="apple-primary-btn"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate("profile", "#profile");
                      } else {
                        window.location.hash = "#profile";
                      }
                    }}
                  >
                    View in My Account →
                  </button>
                  <button
                    type="button"
                    className="apple-secondary-btn"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate("products", "#products");
                      } else {
                        window.location.hash = "#products";
                      }
                    }}
                  >
                    Return to Catalog
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ════ RIGHT COLUMN: ORDER SUMMARY DOSSIER (Sticky) ════ */}
          {step < 3 && (
            <aside className="apple-checkout-summary-col">
              <div className="apple-summary-card-body">
                <h3 className="apple-summary-title">Allocation Summary</h3>

                <div className="apple-summary-list">
                  {activeCheckoutItems.map((item) => {
                    const priceNum = parseInt(item.product.price.toString().replace(/[^\d]/g, ""), 10) || 0;
                    const lineTotal = priceNum * item.quantity;

                    return (
                      <div key={item.product.id} className="apple-summary-item-card">
                        <div className="summary-thumb-wrap">
                          <img src={item.product.image} alt={item.product.name} className="summary-thumb" />
                          <span className="summary-qty-badge">{item.quantity}</span>
                        </div>
                        <div className="summary-item-meta">
                          <span className="summary-item-sku">{item.product.sku}</span>
                          <span className="summary-item-name">{item.product.name}</span>
                          <span className="summary-item-unit-price">{item.product.price}</span>
                        </div>
                        <div className="summary-item-total">
                          ₹{lineTotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="apple-summary-totals">
                  <div className="totals-row">
                    <span className="totals-label">Subtotal</span>
                    <span className="totals-val">₹{subtotalInr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="totals-row">
                    <span className="totals-label">Insured White-Glove Courier</span>
                    <span className="totals-val text-green">FREE</span>
                  </div>
                  <div className="totals-row">
                    <span className="totals-label">Lacquered Presentation Box</span>
                    <span className="totals-val text-green">FREE</span>
                  </div>
                  <div className="totals-row totals-row--grand">
                    <span className="grand-label">Total Payable</span>
                    <span className="grand-val">₹{finalTotalInr.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="apple-summary-badges">
                  <div className="badge-item">
                    <Icons.Shield />
                    <span>100% Genuine Certified</span>
                  </div>
                  <div className="badge-item">
                    <Icons.Check />
                    <span>2-Year Brand Guarantee</span>
                  </div>
                </div>
              </div>
            </aside>
          )}

        </div>
      </main>
    </div>
  );
}
