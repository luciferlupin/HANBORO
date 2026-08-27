import React, { useState, useEffect } from "react";
import { useStore } from "./StoreContext";

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    activeCheckoutItems,
    subtotalInr,
    discountAmount,
    finalTotalInr,
    finalTotalUsd,
    appliedPromo,
    user,
    isAdmin,
    placeOrder,
  } = useStore();

  // Multi-step checkout states: 1 = Shipping, 2 = Payment, 3 = Confirmation
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Maharashtra");
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

  // Reset steps when modal opens/closes
  useEffect(() => {
    if (isCheckoutOpen) {
      setStep(1);
      setCompletedOrder(null);
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  const handleGoToPayment = (e) => {
    e.preventDefault();
    if (!name || !email || !address || !city || !pincode) {
      alert("Please fill in all required shipping details.");
      return;
    }
    setStep(2);
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
    } catch (err) {
      alert("Could not process order: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="luxury-modal-backdrop checkout-backdrop" onClick={closeCheckout}>
      <div
        className="luxury-modal-card checkout-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        {/* Header with Step Indicator */}
        <div className="checkout-modal-header">
          <div className="checkout-head-left">
            <span className="checkout-brand">HANBORO</span>
            <h2 id="checkout-modal-title" className="checkout-title">
              {step === 1
                ? "Atelier Allocation & Shipping"
                : step === 2
                ? "Secure Atelier Payment"
                : "Acquisition Confirmed"}
            </h2>
          </div>

          {step < 3 && (
            <div className="checkout-step-progress">
              <span className={`step-dot ${step >= 1 ? "is-active" : ""}`}>1</span>
              <span className="step-line" />
              <span className={`step-dot ${step >= 2 ? "is-active" : ""}`}>2</span>
            </div>
          )}

          <button
            type="button"
            className="luxury-modal-close"
            onClick={closeCheckout}
            aria-label="Close checkout"
          >
            ✕
          </button>
        </div>

        {/* ── STEP 1: SHIPPING & CONTACT ── */}
        {step === 1 && (
          <form className="checkout-step-form" onSubmit={handleGoToPayment}>
            {/* Order Items Preview Ribbon */}
            <div className="checkout-items-preview">
              <div className="checkout-items-scroll">
                {activeCheckoutItems.map((item) => (
                  <div key={item.product.id} className="checkout-mini-item">
                    <img src={item.product.image} alt={item.product.name} />
                    <div className="mini-item-info">
                      <span className="mini-name">{item.product.name}</span>
                      <span className="mini-sku">REF. {item.product.sku} • Qty: {item.quantity}</span>
                    </div>
                    <span className="mini-price">{item.product.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="checkout-form-grid">
              <div className="form-col-full">
                <label className="checkout-label">Full Name / Title</label>
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="e.g. Lord Alexander Sterling"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!cardHolder) setCardHolder(e.target.value.toUpperCase());
                  }}
                  required
                />
              </div>

              <div className="form-col-half">
                <label className="checkout-label">Email Address (for Certificate & Tracking)</label>
                <input
                  type="email"
                  className="checkout-input"
                  placeholder="client@luxury-domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-col-half">
                <label className="checkout-label">Contact Phone / VIP Concierge</label>
                <input
                  type="tel"
                  className="checkout-input"
                  placeholder="+91 98200 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-col-full">
                <label className="checkout-label">Delivery Address (Apartment, Suite, Street)</label>
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="e.g. 14 Altamount Road, Penthouse B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-col-third">
                <label className="checkout-label">City</label>
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="form-col-third">
                <label className="checkout-label">State</label>
                <select
                  className="checkout-input"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Other">Other States</option>
                </select>
              </div>

              <div className="form-col-third">
                <label className="checkout-label">PIN Code</label>
                <input
                  type="text"
                  className="checkout-input"
                  placeholder="400026"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Price Preview Footer */}
            <div className="checkout-action-footer">
              <div className="checkout-footer-price">
                <span className="footer-price-sub">Total Payable</span>
                <span className="footer-price-val">₹{finalTotalInr.toLocaleString("en-IN")}</span>
              </div>

              <button type="submit" className="checkout-primary-btn">
                <span>Continue to Payment Method</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: PAYMENT METHOD ── */}
        {step === 2 && (
          <div className="checkout-step-payment">
            {/* Payment Method Selector Tabs */}
            <div className="payment-methods-grid">
              <button
                type="button"
                className={`payment-method-card ${paymentMethod === "card" ? "is-selected" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <div className="method-icon">💳</div>
                <div className="method-text">
                  <strong>Credit / Debit Card</strong>
                  <span>Amex, Visa, Mastercard, RuPay</span>
                </div>
                <span className="method-radio">{paymentMethod === "card" ? "●" : "○"}</span>
              </button>

              <button
                type="button"
                className={`payment-method-card ${paymentMethod === "upi" ? "is-selected" : ""}`}
                onClick={() => setPaymentMethod("upi")}
              >
                <div className="method-icon">⚡</div>
                <div className="method-text">
                  <strong>Instant UPI & QR</strong>
                  <span>GPay, PhonePe, Paytm, BHIM</span>
                </div>
                <span className="method-radio">{paymentMethod === "upi" ? "●" : "○"}</span>
              </button>

              <button
                type="button"
                className={`payment-method-card ${paymentMethod === "cod" ? "is-selected" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <div className="method-icon">🏛️</div>
                <div className="method-text">
                  <strong>Concierge White-Glove COD</strong>
                  <span>Inspect in person before payment</span>
                </div>
                <span className="method-radio">{paymentMethod === "cod" ? "●" : "○"}</span>
              </button>
            </div>

            {/* Payment Sub-view: Card Details Simulator */}
            {paymentMethod === "card" && (
              <div className="card-simulator-wrap">
                {/* Virtual Black Luxury Card Visual */}
                <div className="luxury-credit-card-mockup">
                  <div className="card-chip" />
                  <div className="card-brand-logo">HANBORO PRIVATE VAULT</div>
                  <div className="card-mock-number">{cardNumber}</div>
                  <div className="card-mock-bottom">
                    <div>
                      <span className="card-mock-sub">CARD HOLDER</span>
                      <span className="card-mock-val">{cardHolder || "VALUED CLIENT"}</span>
                    </div>
                    <div>
                      <span className="card-mock-sub">EXPIRES</span>
                      <span className="card-mock-val">{cardExpiry}</span>
                    </div>
                  </div>
                </div>

                <div className="card-input-grid">
                  <div className="form-col-full">
                    <label className="checkout-label">Card Number</label>
                    <input
                      type="text"
                      className="checkout-input"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-col-half">
                    <label className="checkout-label">Valid Thru</label>
                    <input
                      type="text"
                      className="checkout-input"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="form-col-half">
                    <label className="checkout-label">CVV / CVC</label>
                    <input
                      type="password"
                      className="checkout-input"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Sub-view: UPI Simulator */}
            {paymentMethod === "upi" && (
              <div className="upi-simulator-wrap">
                <div className="upi-qr-box">
                  <div className="qr-frame">
                    <svg viewBox="0 0 100 100" width="130" height="130" className="qr-mock-svg">
                      <rect x="0" y="0" width="100" height="100" fill="#f5f2ed" />
                      <rect x="10" y="10" width="25" height="25" fill="#080808" />
                      <rect x="15" y="15" width="15" height="15" fill="#f5f2ed" />
                      <rect x="65" y="10" width="25" height="25" fill="#080808" />
                      <rect x="70" y="15" width="15" height="15" fill="#f5f2ed" />
                      <rect x="10" y="65" width="25" height="25" fill="#080808" />
                      <rect x="15" y="70" width="15" height="15" fill="#f5f2ed" />
                      <circle cx="50" cy="50" r="10" fill="#fa2d1d" />
                      <rect x="42" y="20" width="16" height="8" fill="#080808" />
                      <rect x="45" y="70" width="12" height="15" fill="#080808" />
                      <rect x="70" y="45" width="15" height="10" fill="#080808" />
                    </svg>
                  </div>
                  <div className="qr-info">
                    <strong>Scan with any UPI App</strong>
                    <p>GPay • PhonePe • Paytm • Cred • Apple Pay UPI</p>
                    <span className="upi-vpa-pill">hanborowatches@icici</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Sub-view: COD Notice */}
            {paymentMethod === "cod" && (
              <div className="cod-notice-box">
                <span className="cod-badge">✦ White-Glove VIP Service</span>
                <p>
                  Our armed luxury logistics partner will deliver your timepiece in an encrypted security box.
                  You may inspect the authenticity documents and timekeeping accuracy prior to settlement.
                </p>
              </div>
            )}

            {/* Payment Footer Actions */}
            <div className="checkout-action-footer">
              <button
                type="button"
                className="checkout-back-link"
                onClick={() => setStep(1)}
              >
                ← Back to Shipping
              </button>

              <button
                type="button"
                className="checkout-primary-btn"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="btn-spinner">Securing Allocation & Order...</span>
                ) : (
                  <span>Authorize ₹{finalTotalInr.toLocaleString("en-IN")} →</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: ORDER SUCCESS CONFIRMATION ── */}
        {step === 3 && completedOrder && (
          <div className="checkout-confirmation-view">
            <div className="conf-seal">
              <span className="conf-seal-icon">✓</span>
            </div>

            <span className="conf-tag">SWISS PRECISION ALLOCATION CONFIRMED</span>
            <h3 className="conf-title">Masterpiece Reserved for Delivery</h3>

            <p className="conf-desc">
              Thank you, <strong>{completedOrder.customer_name}</strong>. Your acquisition dossier has been
              transmitted to our master horologists. We have recorded your order under reference:
            </p>

            <div className="conf-ref-card">
              <div className="ref-item">
                <span className="ref-label">OFFICIAL ORDER REFERENCE</span>
                <span className="ref-val">{completedOrder.order_ref}</span>
              </div>
              <div className="ref-item">
                <span className="ref-label">SECURE TRACKING AIRWAY BILL</span>
                <span className="ref-val">{completedOrder.tracking_number}</span>
              </div>
              <div className="ref-item">
                <span className="ref-label">AMOUNT AUTHORIZED</span>
                <span className="ref-val">₹{completedOrder.total_amount?.toLocaleString("en-IN")} INR</span>
              </div>
            </div>

            <div className="conf-items-summary">
              <h4>Allocated Timepieces:</h4>
              {completedOrder.items?.map((it, idx) => (
                <div key={idx} className="conf-item-row">
                  <img src={it.image} alt={it.name} />
                  <div>
                    <strong>{it.name}</strong>
                    <span>REF. {it.sku} • Qty: {it.quantity}</span>
                  </div>
                  <span>{it.price}</span>
                </div>
              ))}
            </div>

            <div className="conf-actions-row">
              <button
                type="button"
                className="conf-close-btn"
                onClick={closeCheckout}
              >
                Return to Hanboro Atelier
              </button>

              {isAdmin && (
                <a
                  href="#admin"
                  className="conf-admin-link"
                  onClick={() => {
                    closeCheckout();
                    window.location.hash = "#admin";
                  }}
                >
                  View in Admin Dashboard ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
