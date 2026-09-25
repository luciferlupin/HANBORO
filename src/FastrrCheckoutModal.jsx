import React, { useState, useEffect, useRef, useMemo } from "react";
import { useStore } from "./StoreContext";
import "./fastrrCheckout.css";

// Comprehensive Indian Pincode dictionary for instant auto-detection
const PINCODE_MAP = {
  // Delhi NCR
  110: { city: "New Delhi", state: "Delhi" },
  121: { city: "Faridabad", state: "Haryana" },
  122: { city: "Gurugram", state: "Haryana" },
  201: { city: "Noida", state: "Uttar Pradesh" },
  // Mumbai & Maharashtra
  400: { city: "Mumbai", state: "Maharashtra" },
  411: { city: "Pune", state: "Maharashtra" },
  440: { city: "Nagpur", state: "Maharashtra" },
  422: { city: "Nashik", state: "Maharashtra" },
  // Karnataka & Bengaluru
  560: { city: "Bengaluru", state: "Karnataka" },
  570: { city: "Mysuru", state: "Karnataka" },
  575: { city: "Mangaluru", state: "Karnataka" },
  // Telangana & Hyderabad
  500: { city: "Hyderabad", state: "Telangana" },
  // Tamil Nadu & Chennai
  600: { city: "Chennai", state: "Tamil Nadu" },
  641: { city: "Coimbatore", state: "Tamil Nadu" },
  // West Bengal & Kolkata
  700: { city: "Kolkata", state: "West Bengal" },
  // Gujarat
  380: { city: "Ahmedabad", state: "Gujarat" },
  395: { city: "Surat", state: "Gujarat" },
  390: { city: "Vadodara", state: "Gujarat" },
  // Rajasthan
  302: { city: "Jaipur", state: "Rajasthan" },
  342: { city: "Jodhpur", state: "Rajasthan" },
  313: { city: "Udaipur", state: "Rajasthan" },
  // Punjab & Chandigarh
  160: { city: "Chandigarh", state: "Punjab" },
  141: { city: "Ludhiana", state: "Punjab" },
  143: { city: "Amritsar", state: "Punjab" },
  // Uttar Pradesh
  226: { city: "Lucknow", state: "Uttar Pradesh" },
  208: { city: "Kanpur", state: "Uttar Pradesh" },
  282: { city: "Agra", state: "Uttar Pradesh" },
  221: { city: "Varanasi", state: "Uttar Pradesh" },
  // Madhya Pradesh
  452: { city: "Indore", state: "Madhya Pradesh" },
  462: { city: "Bhopal", state: "Madhya Pradesh" },
  // Kerala
  682: { city: "Kochi", state: "Kerala" },
  695: { city: "Thiruvananthapuram", state: "Kerala" },
  // Bihar & Jharkhand
  800: { city: "Patna", state: "Bihar" },
  834: { city: "Ranchi", state: "Jharkhand" },
  // Goa
  403: { city: "Panaji", state: "Goa" },
  // Assam
  781: { city: "Guwahati", state: "Assam" },
  // Odisha
  751: { city: "Bhubaneswar", state: "Odisha" },
  // Uttarakhand
  248: { city: "Dehradun", state: "Uttarakhand" },
};

function lookupPincode(pincode) {
  if (!pincode || pincode.length < 3) return null;
  const prefix = pincode.slice(0, 3);
  if (PINCODE_MAP[prefix]) return PINCODE_MAP[prefix];
  
  const d2 = pincode.slice(0, 2);
  if (d2 === "11") return { city: "Delhi", state: "Delhi" };
  if (["12", "13"].includes(d2)) return { city: "Haryana Region", state: "Haryana" };
  if (["14", "15", "16"].includes(d2)) return { city: "Punjab Region", state: "Punjab" };
  if (["17"].includes(d2)) return { city: "Shimla", state: "Himachal Pradesh" };
  if (["18", "19"].includes(d2)) return { city: "Srinagar / Jammu", state: "Jammu & Kashmir" };
  if (["20", "21", "22", "23", "24", "25", "26", "27", "28"].includes(d2)) return { city: "UP City", state: "Uttar Pradesh" };
  if (["30", "31", "32", "33", "34"].includes(d2)) return { city: "Rajasthan City", state: "Rajasthan" };
  if (["36", "37", "38", "39"].includes(d2)) return { city: "Gujarat City", state: "Gujarat" };
  if (["40", "41", "42", "43", "44"].includes(d2)) return { city: "Maharashtra City", state: "Maharashtra" };
  if (["45", "46", "47", "48"].includes(d2)) return { city: "MP City", state: "Madhya Pradesh" };
  if (["49"].includes(d2)) return { city: "Raipur", state: "Chhattisgarh" };
  if (["50", "51", "52", "53"].includes(d2)) return { city: "Telangana / AP", state: "Telangana" };
  if (["56", "57", "58", "59"].includes(d2)) return { city: "Karnataka City", state: "Karnataka" };
  if (["60", "61", "62", "63", "64"].includes(d2)) return { city: "Tamil Nadu City", state: "Tamil Nadu" };
  if (["67", "68", "69"].includes(d2)) return { city: "Kerala City", state: "Kerala" };
  if (["70", "71", "72", "73", "74"].includes(d2)) return { city: "Kolkata Region", state: "West Bengal" };
  return null;
}

export function FastrrCheckoutModal({ onNavigateToTracking }) {
  const {
    isFastrrCheckoutOpen,
    setIsFastrrCheckoutOpen,
    fastrrCheckoutItems,
    cart,
    clearCart,
    appliedPromo,
    shopifyCustomer,
  } = useStore();

  // Active items being checked out
  const items = useMemo(() => {
    if (fastrrCheckoutItems && fastrrCheckoutItems.length > 0) {
      return fastrrCheckoutItems;
    }
    return cart || [];
  }, [fastrrCheckoutItems, cart]);

  // Steps: "phone" | "otp" | "address" | "payment" | "success"
  const [step, setStep] = useState("phone");

  // Step 1: Phone
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Step 2: Real OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const otpInputRefs = useRef([]);

  // Step 3: Address
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressError, setAddressError] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Step 5: Success
  const [placedOrder, setPlacedOrder] = useState(null);

  // Auto-fill customer profile details if logged in
  useEffect(() => {
    if (shopifyCustomer) {
      if (shopifyCustomer.displayName && !fullName) {
        setFullName(shopifyCustomer.displayName);
      }
      if (shopifyCustomer.emailAddress?.emailAddress && !email) {
        setEmail(shopifyCustomer.emailAddress.emailAddress);
      }
      if (shopifyCustomer.phoneNumber?.phoneNumber && !phone) {
        const raw = shopifyCustomer.phoneNumber.phoneNumber.replace(/\D/g, "").slice(-10);
        setPhone(raw);
      }
    }
  }, [shopifyCustomer]);

  // Reset or focus on modal open
  useEffect(() => {
    if (isFastrrCheckoutOpen) {
      if (step === "success") {
        setStep("phone");
      }
      setPhoneError("");
      setOtpError("");
      setAddressError("");
      setPaymentError("");
    }
  }, [isFastrrCheckoutOpen]);

  // OTP Resend Countdown Timer
  useEffect(() => {
    let timer = null;
    if (step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Auto-detect City and State when 6-digit pincode is entered
  useEffect(() => {
    const clean = pincode.replace(/\D/g, "");
    if (clean.length === 6) {
      const match = lookupPincode(clean);
      if (match) {
        setCity(match.city);
        setStateName(match.state);
      }
    }
  }, [pincode]);

  // Calculations for Order Summary
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const p = it.product;
      const num = p?.priceNumeric || (typeof p?.price === "string" ? parseInt(p.price.replace(/[^\d]/g, ""), 10) : 0) || 54999;
      return acc + num * (it.quantity || 1);
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.percentage) {
      return Math.round((subtotal * appliedPromo.percentage) / 100);
    }
    return 0;
  }, [appliedPromo, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  // Close modal
  const handleClose = () => {
    setIsFastrrCheckoutOpen(false);
  };

  // ── 1. SEND REAL OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setPhoneError("");
    const clean = phone.replace(/\D/g, "").slice(-10);

    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number (starting with 6-9).");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/fastrr-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: clean }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to dispatch OTP. Please verify your mobile number.");
      }

      setStep("otp");
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setPhoneError(err.message || "Failed to send OTP code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── 2. VERIFY REAL OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpError("");
    const enteredCode = otp.join("").trim();

    if (enteredCode.length !== 6) {
      setOtpError("Please enter all 6 digits of the OTP verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/fastrr-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, otp: enteredCode }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Invalid verification code.");
      }

      setStep("address");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle individual OTP box typing & pasting
  const handleOtpChange = (index, value) => {
    // Check if user pasted a multi-digit string
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // ── 3. PROCEED TO PAYMENT ───────────────────────────────────────────────────
  const handleAddressSubmit = (e) => {
    if (e) e.preventDefault();
    setAddressError("");

    if (!fullName.trim()) {
      setAddressError("Please enter your full name for boutique dispatch.");
      return;
    }
    if (!streetAddress.trim()) {
      setAddressError("Please enter your delivery street address / building name.");
      return;
    }
    const cleanPin = pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setAddressError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!city.trim() || !stateName.trim()) {
      setAddressError("Please specify your city and state.");
      return;
    }

    setStep("payment");
  };

  // ── 4. PLACE REAL ORDER & SYNC ──────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPaymentError("");
    setIsPlacingOrder(true);

    try {
      const orderData = {
        customer: {
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: `${streetAddress.trim()}${landmark ? `, ${landmark.trim()}` : ""}`,
          pincode: pincode.trim(),
          city: city.trim(),
          state: stateName.trim(),
        },
        items,
        paymentMethod,
        totalAmount: `₹${total.toLocaleString("en-IN")}`,
      };

      const res = await fetch("/api/fastrr-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) {
        throw new Error(result.error || "Order dispatch synchronization failed.");
      }

      // Store in session so TrackOrderView immediately recognizes it
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("hanboro_recent_fastrr_order", JSON.stringify(result));
      }

      setPlacedOrder(result);
      setStep("success");
      clearCart();
    } catch (err) {
      setPaymentError(err.message || "Failed to confirm order with Shiprocket. Please retry.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isFastrrCheckoutOpen) return null;

  return (
    <div className="fastrr-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="fastrr-modal-title">
      <div className="fastrr-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <header className="fastrr-header">
          <div className="fastrr-brand-group">
            <div className="fastrr-logo-badge" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="fastrr-brand-text">
              <h2 id="fastrr-modal-title" className="fastrr-title">
                FASTRR <span className="sub">by Shiprocket</span>
              </h2>
              <p className="fastrr-tagline">1-Click Precision Checkout • Official Hanboro Vault</p>
            </div>
          </div>
          <div className="fastrr-header-right">
            <div className="fastrr-ssl-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>256-Bit SSL</span>
            </div>
            <button type="button" className="fastrr-close-btn" onClick={handleClose} aria-label="Close Fastrr checkout">
              &times;
            </button>
          </div>
        </header>

        {/* Stepper Progress Bar */}
        {step !== "success" && (
          <nav className="fastrr-stepper" aria-label="Checkout Progress">
            <div className={`fastrr-step-item ${step === "phone" ? "active" : "completed"}`}>
              <span className="fastrr-step-num">{step !== "phone" ? "✓" : "1"}</span>
              <span className="lbl">Mobile</span>
            </div>
            <div className={`fastrr-step-divider ${step !== "phone" ? "filled" : ""}`} />

            <div className={`fastrr-step-item ${step === "otp" ? "active" : ["address", "payment"].includes(step) ? "completed" : ""}`}>
              <span className="fastrr-step-num">{["address", "payment"].includes(step) ? "✓" : "2"}</span>
              <span className="lbl">Verify OTP</span>
            </div>
            <div className={`fastrr-step-divider ${["address", "payment"].includes(step) ? "filled" : ""}`} />

            <div className={`fastrr-step-item ${step === "address" ? "active" : step === "payment" ? "completed" : ""}`}>
              <span className="fastrr-step-num">{step === "payment" ? "✓" : "3"}</span>
              <span className="lbl">Address</span>
            </div>
            <div className={`fastrr-step-divider ${step === "payment" ? "filled" : ""}`} />

            <div className={`fastrr-step-item ${step === "payment" ? "active" : ""}`}>
              <span className="fastrr-step-num">4</span>
              <span className="lbl">Payment</span>
            </div>
          </nav>
        )}

        {/* Modal Body: Left Flow & Right Sidebar */}
        <div className="fastrr-modal-body">
          {/* ── LEFT: INTERACTIVE STEP FLOW ── */}
          <section className="fastrr-main-flow">
            {/* STEP 1: MOBILE NUMBER */}
            {step === "phone" && (
              <div>
                <h3 className="fastrr-step-heading">Enter Mobile Number</h3>
                <p className="fastrr-step-desc">
                  Fastrr instantly looks up your saved addresses and authenticates with a live SMS code.
                </p>

                {phoneError && <div className="fastrr-error-alert" role="alert">{phoneError}</div>}

                <form onSubmit={handleSendOtp}>
                  <div className="fastrr-phone-input-wrap">
                    <div className="fastrr-country-prefix">
                      <span aria-hidden="true">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      className="fastrr-phone-field"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      autoFocus
                      required
                    />
                  </div>

                  <button type="submit" className="fastrr-cta-btn" disabled={isSendingOtp}>
                    {isSendingOtp ? "Dispatching OTP Code..." : "Continue with Fastrr OTP →"}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: REAL 6-DIGIT OTP */}
            {step === "otp" && (
              <div className="fastrr-otp-container">
                <h3 className="fastrr-step-heading">Verify with Live OTP</h3>
                <p className="fastrr-step-desc">
                  Enter the 6-digit verification code dispatched to <strong>+91 {phone}</strong>
                </p>

                {otpError && <div className="fastrr-error-alert" role="alert">{otpError}</div>}

                <form onSubmit={handleVerifyOtp} style={{ width: "100%" }}>
                  <div className="fastrr-otp-grid">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`fastrr-otp-box ${digit ? "filled" : ""}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <div className="fastrr-otp-meta">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      className="fastrr-resend-btn"
                      disabled={resendCooldown > 0 || isSendingOtp}
                      onClick={handleSendOtp}
                    >
                      {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend OTP Code"}
                    </button>
                  </div>

                  <button type="submit" className="fastrr-cta-btn" disabled={isVerifyingOtp || otp.join("").length !== 6}>
                    {isVerifyingOtp ? "Verifying Credentials..." : "Verify & Continue →"}
                  </button>

                  <button type="button" className="fastrr-back-btn" onClick={() => setStep("phone")}>
                    ← Edit phone number
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: DELIVERY ADDRESS */}
            {step === "address" && (
              <div>
                <h3 className="fastrr-step-heading">Delivery Address</h3>
                <p className="fastrr-step-desc">
                  White-glove courier dispatch coordinates for your Hanboro vault timepiece.
                </p>

                {addressError && <div className="fastrr-error-alert" role="alert">{addressError}</div>}

                <form onSubmit={handleAddressSubmit} className="fastrr-address-form">
                  <div className="fastrr-form-group">
                    <label className="fastrr-form-label">Full Name *</label>
                    <input
                      type="text"
                      className="fastrr-text-input"
                      placeholder="e.g. Vikramaditya Singhania"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="fastrr-input-row">
                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">Email Address (for order dossier)</label>
                      <input
                        type="email"
                        className="fastrr-text-input"
                        placeholder="collector@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">Verified Phone</label>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        value={`+91 ${phone}`}
                        disabled
                        style={{ opacity: 0.7, cursor: "not-allowed" }}
                      />
                    </div>
                  </div>

                  <div className="fastrr-form-group">
                    <label className="fastrr-form-label">Flat / House No. / Building / Street Address *</label>
                    <input
                      type="text"
                      className="fastrr-text-input"
                      placeholder="e.g. Penthouse 4B, The Grandeur, Golf Course Road"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="fastrr-input-row">
                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">
                        PIN Code * {city && <span className="fastrr-pincode-badge">✓ Auto-detected</span>}
                      </label>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="e.g. 110001"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                      />
                    </div>
                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">City *</label>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-row fastrr-input-row">
                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">State *</label>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="State"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">Landmark (Optional)</label>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="Near Oberoi Hotel"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="fastrr-cta-btn" style={{ marginTop: "12px" }}>
                    Continue to Payment Options →
                  </button>

                  <button type="button" className="fastrr-back-btn" onClick={() => setStep("otp")}>
                    ← Back to OTP verification
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: PAYMENT SELECTION */}
            {step === "payment" && (
              <div>
                <h3 className="fastrr-step-heading">Select Payment Method</h3>
                <p className="fastrr-step-desc">
                  Instant zero-fee settlement powered by Fastrr Shiprocket Checkout gateway.
                </p>

                {paymentError && <div className="fastrr-error-alert" role="alert">{paymentError}</div>}

                <div className="fastrr-payment-grid">
                  <div
                    className={`fastrr-pay-card ${paymentMethod === "UPI" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("UPI")}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">⚡</div>
                      <div className="fastrr-pay-title-group">
                        <span className="fastrr-pay-title">UPI Instant (Google Pay, PhonePe, Paytm)</span>
                        <span className="fastrr-pay-subtitle">Instant confirmation • Zero transaction charges</span>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "UPI" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  <div
                    className={`fastrr-pay-card ${paymentMethod === "Card" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("Card")}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">💳</div>
                      <div className="fastrr-pay-title-group">
                        <span className="fastrr-pay-title">Credit / Debit Card</span>
                        <span className="fastrr-pay-subtitle">Visa, Mastercard, RuPay & American Express</span>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "Card" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  <div
                    className={`fastrr-pay-card ${paymentMethod === "Netbanking" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("Netbanking")}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">🏛️</div>
                      <div className="fastrr-pay-title-group">
                        <span className="fastrr-pay-title">Net Banking</span>
                        <span className="fastrr-pay-subtitle">HDFC, ICICI, SBI, Axis & 50+ Top Indian Banks</span>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "Netbanking" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  <div
                    className={`fastrr-pay-card ${paymentMethod === "COD" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">📦</div>
                      <div className="fastrr-pay-title-group">
                        <span className="fastrr-pay-title">Cash on Delivery (COD)</span>
                        <span className="fastrr-pay-subtitle">Pay upon white-glove inspection • ₹0 COD surcharge</span>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "COD" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="fastrr-cta-btn"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? "Placing Order with Fastrr..." : `Place Order • ₹${total.toLocaleString("en-IN")}`}
                </button>

                <button type="button" className="fastrr-back-btn" onClick={() => setStep("address")}>
                  ← Back to delivery address
                </button>
              </div>
            )}

            {/* STEP 5: ORDER PLACED SUCCESSFULLY */}
            {step === "success" && placedOrder && (
              <div className="fastrr-success-screen">
                <div className="fastrr-success-badge">✓</div>
                <h3 className="fastrr-step-heading" style={{ fontSize: "24px" }}>
                  Order Confirmed with Fastrr!
                </h3>
                <p className="fastrr-step-desc">
                  Your luxury timepiece has been reserved and queued for white-glove courier packaging.
                </p>

                <div className="fastrr-awb-card">
                  <div className="fastrr-awb-row">
                    <span className="k">Shiprocket Order ID:</span>
                    <span className="v">{placedOrder.orderId}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Air Waybill (AWB):</span>
                    <span className="v" style={{ color: "#fa2d1d" }}>{placedOrder.awb}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Courier Partner:</span>
                    <span className="v">{placedOrder.courier}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Est. Delivery:</span>
                    <span className="v">{placedOrder.estimatedDelivery}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Customer Contact:</span>
                    <span className="v">+91 {placedOrder.customer?.phone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="fastrr-cta-btn"
                  onClick={() => {
                    handleClose();
                    if (onNavigateToTracking) {
                      onNavigateToTracking(placedOrder.orderId);
                    }
                  }}
                  style={{ maxWidth: "340px", marginBottom: "12px" }}
                >
                  Track Live on Shiprocket →
                </button>

                <button
                  type="button"
                  className="fastrr-back-btn"
                  onClick={handleClose}
                >
                  Continue Browsing Timepieces
                </button>
              </div>
            )}
          </section>

          {/* ── RIGHT: BALANCED ORDER SUMMARY SIDEBAR ── */}
          <aside className="fastrr-order-sidebar">
            <div>
              <h4 className="fastrr-sidebar-title">Selected Timepieces ({items.length})</h4>

              <div className="fastrr-order-items-scroll">
                {items.map((it, idx) => {
                  const p = it.product;
                  const itemPrice = p?.priceNumeric || (typeof p?.price === "string" ? parseInt(p.price.replace(/[^\d]/g, ""), 10) : 54999);
                  const displayPrice = `₹${(itemPrice * (it.quantity || 1)).toLocaleString("en-IN")}`;
                  const title = p?.name || p?.title || "Hanboro Horological Watch";
                  const variantTitle = p?.selectedVariantTitle || it.variant || "";

                  return (
                    <div key={`${p?.id || idx}-${idx}`} className="fastrr-item-card">
                      <img src={p?.image || p?.shopifyFeaturedImage} alt={title} className="fastrr-item-img" />
                      <div className="fastrr-item-info">
                        <div className="fastrr-item-name" title={title}>{title}</div>
                        {variantTitle && <div className="fastrr-item-edition">{variantTitle}</div>}
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Qty: {it.quantity || 1}</div>
                      </div>
                      <div className="fastrr-item-price">{displayPrice}</div>
                    </div>
                  );
                })}
              </div>

              <div className="fastrr-price-breakdown">
                <div className="fastrr-price-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="fastrr-price-row" style={{ color: "#10b981" }}>
                    <span>Promotion ({appliedPromo.code})</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="fastrr-price-row">
                  <span>Shiprocket Priority Air</span>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>FREE</span>
                </div>
                <div className="fastrr-price-row total">
                  <span>Total Payable</span>
                  <span className="val">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="fastrr-trust-badges">
              <div className="fastrr-trust-item">
                <span className="icon">🛡️</span>
                <span>1-Year Hanboro Official Warranty Card Included</span>
              </div>
              <div className="fastrr-trust-item">
                <span className="icon">✈️</span>
                <span>Dispatched via Shiprocket Express Air with Insurance</span>
              </div>
              <div className="fastrr-trust-item">
                <span className="icon">🔒</span>
                <span>White-Glove Tamper Proof Sealed Packaging</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
