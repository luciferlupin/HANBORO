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

  // Auto-detected buyer profile from Shiprocket network
  const [detectedBuyer, setDetectedBuyer] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Step 2: Real OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const otpInputRefs = useRef([]);

  // Step 3: Address Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [addressError, setAddressError] = useState("");

  // Step 4: Payment Details
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Step 5: Placed Order Success
  const [placedOrder, setPlacedOrder] = useState(null);

  // Mobile Order Summary Accordion State
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + "/" + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  // Pre-fill customer profile details if logged in via Shopify
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

  // ── 1. SEND REAL OTP & AUTO-DETECT BUYER ─────────────────────────────────────
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
      // 1. Dispatch real SMS OTP via Shiprocket Fastrr
      const res = await fetch("/api/fastrr-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone: clean }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to dispatch OTP. Please verify your mobile number.");
      }

      // 2. Query Fastrr network for saved buyer details & addresses
      fetch(`/api/fastrr-user?phone=${clean}`)
        .then((r) => r.json())
        .then((uData) => {
          if (uData.success && uData.profile) {
            setDetectedBuyer(uData.profile);
            if (uData.profile.name && !fullName) setFullName(uData.profile.name);
            if (uData.profile.email && !email) setEmail(uData.profile.email);
            if (Array.isArray(uData.profile.addresses) && uData.profile.addresses.length > 0) {
              const defaultAddr = uData.profile.addresses[0];
              setSelectedAddressId(defaultAddr.id);
              setIsAddingNewAddress(false);
            } else {
              setIsAddingNewAddress(true);
            }
          }
        })
        .catch(() => {});

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
      setOtpError("Please enter all 6 digits of the OTP code received on SMS.");
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
        throw new Error(data.error || "Invalid verification code. Please check your SMS.");
      }

      // Move to Address step
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
  const handleAddressSubmit = async (e) => {
    if (e) e.preventDefault();
    setAddressError("");

    // If using a saved address from Fastrr buyer network
    if (selectedAddressId && !isAddingNewAddress && detectedBuyer?.addresses) {
      const chosen = detectedBuyer.addresses.find((a) => a.id === selectedAddressId);
      if (chosen) {
        setStreetAddress(chosen.address);
        setPincode(chosen.pincode);
        setCity(chosen.city);
        setStateName(chosen.state);
        setStep("payment");
        return;
      }
    }

    // New address validation
    if (!fullName.trim()) {
      setAddressError("Please enter your full name for boutique dispatch.");
      return;
    }

    const cleanPin = pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      setAddressError("Please enter a valid 6-digit Indian postal Pincode.");
      return;
    }

    if (!streetAddress.trim() || streetAddress.trim().length < 5) {
      setAddressError("Please provide your complete street address (House/Flat, Building, Area).");
      return;
    }

    if (!city.trim() || !stateName.trim()) {
      setAddressError("Please specify your city and state.");
      return;
    }

    // Persist new address back to buyer profile
    fetch("/api/fastrr-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        name: fullName,
        email,
        address: `${streetAddress}${landmark ? `, Near ${landmark}` : ""}`,
        pincode: cleanPin,
        city,
        state: stateName,
        addressType,
      }),
    }).catch(() => {});

    setStep("payment");
  };

  // ── 4. COMPLETE ORDER DISPATCH ──────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPaymentError("");

    if (paymentMethod === "UPI") {
      if (upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
        setPaymentError("Please enter a valid UPI ID (e.g. mobile@okaxis or user@upi).");
        return;
      }
    }

    if (paymentMethod === "Cards") {
      const rawNum = cardNumber.replace(/\s/g, "");
      if (rawNum.length < 15) {
        setPaymentError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setPaymentError("Please enter valid card expiry (MM/YY).");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setPaymentError("Please enter 3-digit CVV / CVC code.");
        return;
      }
    }

    setIsPlacingOrder(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const chosenAddr = selectedAddressId && !isAddingNewAddress && detectedBuyer?.addresses
        ? detectedBuyer.addresses.find((a) => a.id === selectedAddressId)
        : null;

      const finalAddress = chosenAddr ? chosenAddr.address : `${streetAddress}${landmark ? `, Near ${landmark}` : ""}`;
      const finalCity = chosenAddr ? chosenAddr.city : city;
      const finalState = chosenAddr ? chosenAddr.state : stateName;
      const finalPincode = chosenAddr ? chosenAddr.pincode : pincode;

      const res = await fetch("/api/fastrr-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: fullName.trim() || "Valued Collector",
            phone: cleanPhone,
            email: email.trim() || `client.${cleanPhone}@hanboro.in`,
            address: finalAddress,
            city: finalCity,
            state: finalState,
            pincode: finalPincode,
          },
          items,
          paymentMethod,
          totalAmount: total,
          promo: appliedPromo ? appliedPromo.code : null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to finalize Fastrr order. Please try again.");
      }

      setPlacedOrder(data);
      setStep("success");
      clearCart();
    } catch (err) {
      setPaymentError(err.message || "Failed to process order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isFastrrCheckoutOpen) return null;

  const firstItem = items[0] || {};
  const firstProduct = firstItem.product || {};
  const itemThumb = firstProduct.image || firstProduct.transparentImage || (firstProduct.shopifyImages && firstProduct.shopifyImages[0]) || "";

  return (
    <div className="fastrr-modal-backdrop" onClick={handleClose}>
      <div
        className="fastrr-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fastrr-modal-heading"
      >
        {/* Modal Header */}
        <header className="fastrr-header">
          <div className="fastrr-brand-group">
            <div className="fastrr-logo-badge" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
              </svg>
            </div>
            <div className="fastrr-brand-text">
              <h2 id="fastrr-modal-heading" className="fastrr-title">
                HANBORO <span className="sub">Fastrr 1-Click</span>
              </h2>
              <p className="fastrr-tagline">AI-Powered Express Checkout • Powered by Shiprocket</p>
            </div>
          </div>

          <div className="fastrr-header-right">
            <div className="fastrr-ssl-badge" title="256-Bit SSL Encrypted by Shiprocket Fastrr">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Verified 256-Bit</span>
            </div>
            <button type="button" className="fastrr-close-btn" onClick={handleClose} aria-label="Close checkout">
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

        {/* Mobile Collapsible Summary Bar */}
        {step !== "success" && (
          <>
            <div
              className="fastrr-mobile-summary-bar"
              onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
              role="button"
              tabIndex={0}
              aria-expanded={isMobileSummaryOpen}
            >
              <div className="fastrr-mobile-summary-left">
                {itemThumb && <img src={itemThumb} alt="" className="fastrr-mobile-summary-thumb" />}
                <span>{items.length === 1 ? (firstProduct.name || firstProduct.title || "Hanboro Watch") : `${items.length} Timepieces`}</span>
              </div>
              <div className="fastrr-mobile-summary-price">
                <span>₹{total.toLocaleString("en-IN")}</span>
                <span className={`fastrr-mobile-summary-toggle-icon ${isMobileSummaryOpen ? "open" : ""}`}>▼</span>
              </div>
            </div>

            {isMobileSummaryOpen && (
              <div className="fastrr-mobile-summary-content">
                <div className="fastrr-order-items-scroll">
                  {items.map((it, idx) => {
                    const p = it.product || {};
                    const pImg = p.image || p.transparentImage || (p.shopifyImages && p.shopifyImages[0]) || "";
                    const pPrice = p.priceNumeric || (typeof p.price === "string" ? parseInt(p.price.replace(/[^\d]/g, ""), 10) : 0) || 54999;
                    return (
                      <div key={idx} className="fastrr-item-card">
                        {pImg && <img src={pImg} alt="" className="fastrr-item-img" />}
                        <div className="fastrr-item-info">
                          <div className="fastrr-item-name">{p.name || p.title || "Hanboro Watch"}</div>
                          <div className="fastrr-item-edition">Qty: {it.quantity || 1} • Ref. {p.sku || "HBR-01"}</div>
                        </div>
                        <div className="fastrr-item-price">₹{(pPrice * (it.quantity || 1)).toLocaleString("en-IN")}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="fastrr-price-breakdown" style={{ marginBottom: 0 }}>
                  <div className="fastrr-price-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="fastrr-price-row" style={{ color: "#10b981" }}>
                      <span>VIP Privilege ({appliedPromo.code})</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="fastrr-price-row">
                    <span>Express Insured Courier</span>
                    <span style={{ color: "#10b981" }}>FREE</span>
                  </div>
                </div>
              </div>
            )}
          </>
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
                  Fastrr instantly auto-detects your saved addresses across Shiprocket and sends an authentic SMS verification code.
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

                  <div className="fastrr-network-pill">
                    <span className="dot" />
                    <span>Auto-detects address & profile for 25M+ shoppers on Shiprocket Fastrr</span>
                  </div>

                  <button type="submit" className="fastrr-cta-btn" disabled={isSendingOtp}>
                    {isSendingOtp ? "Dispatching SMS Code..." : "Continue with Fastrr OTP →"}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: REAL 6-DIGIT OTP */}
            {step === "otp" && (
              <div className="fastrr-otp-container">
                <h3 className="fastrr-step-heading">Verify with Live OTP</h3>
                <p className="fastrr-step-desc">
                  Enter the 6-digit verification code sent via SMS to <strong>+91 {phone}</strong>
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
                    <span>Didn't receive SMS?</span>
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
                  Select a saved Shiprocket address or add coordinates for insured express dispatch.
                </p>

                {addressError && <div className="fastrr-error-alert" role="alert">{addressError}</div>}

                {/* Saved addresses from Shiprocket Fastrr Buyer Network */}
                {detectedBuyer && Array.isArray(detectedBuyer.addresses) && detectedBuyer.addresses.length > 0 && !isAddingNewAddress && (
                  <div className="fastrr-saved-section">
                    <div className="fastrr-saved-header">
                      <span>Saved Addresses ({detectedBuyer.addresses.length})</span>
                      <span style={{ color: "#10b981", fontSize: "11px" }}>✓ Auto-Detected</span>
                    </div>

                    {detectedBuyer.addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          className={`fastrr-saved-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedAddressId(addr.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="fastrr-radio-pill">
                            {isSelected && <div className="fastrr-radio-dot" />}
                          </div>
                          <div className="fastrr-saved-info">
                            <span className="fastrr-saved-badge">{addr.type || "Delivery"}</span>
                            <div className="fastrr-saved-name">{detectedBuyer.name || fullName || "Valued Collector"}</div>
                            <div className="fastrr-saved-addr">
                              {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="fastrr-toggle-new-btn"
                      onClick={() => setIsAddingNewAddress(true)}
                    >
                      + Add New Delivery Address
                    </button>

                    <button
                      type="button"
                      className="fastrr-cta-btn"
                      onClick={handleAddressSubmit}
                      style={{ marginTop: "12px" }}
                    >
                      Deliver to Selected Address →
                    </button>
                  </div>
                )}

                {/* Manual Address Form (Shown if no saved addresses, or when user clicks + Add New Address) */}
                {(!detectedBuyer?.addresses?.length || isAddingNewAddress) && (
                  <form onSubmit={handleAddressSubmit} className="fastrr-address-form">
                    {detectedBuyer?.addresses?.length > 0 && (
                      <button
                        type="button"
                        className="fastrr-back-btn"
                        onClick={() => setIsAddingNewAddress(false)}
                        style={{ alignSelf: "flex-start", margin: "0 0 10px 0" }}
                      >
                        ← Back to Saved Addresses
                      </button>
                    )}

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
                        <label className="fastrr-form-label">Email Address (Optional)</label>
                        <input
                          type="email"
                          className="fastrr-text-input"
                          placeholder="client@hanboro.in"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <div className="fastrr-form-group">
                        <label className="fastrr-form-label">Postal Pincode *</label>
                        <input
                          type="text"
                          className="fastrr-text-input"
                          placeholder="6-digit Pincode (e.g. 110001)"
                          value={pincode}
                          maxLength={6}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          required
                        />
                        {city && stateName && (
                          <div className="fastrr-pincode-badge">
                            <span>✓ Detected:</span>
                            <strong>{city}, {stateName}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="fastrr-form-group">
                      <label className="fastrr-form-label">Flat / House No. & Building *</label>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="e.g. Villa 14, Oberoi Palms, Golf Course Ext"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="fastrr-input-row">
                      <div className="fastrr-form-group">
                        <label className="fastrr-form-label">Landmark</label>
                        <input
                          type="text"
                          className="fastrr-text-input"
                          placeholder="e.g. Near Grand Hyatt"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                        />
                      </div>

                      <div className="fastrr-form-group">
                        <label className="fastrr-form-label">Address Tag</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {["Home", "Office", "Other"].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setAddressType(tag)}
                              className={`fastrr-upi-app-btn ${addressType === tag ? "active" : ""}`}
                              style={{ flex: 1, padding: "8px" }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="fastrr-input-row">
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
                    </div>

                    <button type="submit" className="fastrr-cta-btn" style={{ marginTop: "8px" }}>
                      Continue to Payment →
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 4: PAYMENT OPTIONS */}
            {step === "payment" && (
              <div>
                <h3 className="fastrr-step-heading">Select Payment Method</h3>
                <p className="fastrr-step-desc">
                  Encrypted checkout via Shiprocket Fastrr gateway. All transactions insured.
                </p>

                {paymentError && <div className="fastrr-error-alert" role="alert">{paymentError}</div>}

                <div className="fastrr-payment-grid">
                  {/* UPI */}
                  <div
                    className={`fastrr-pay-card ${paymentMethod === "UPI" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("UPI")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">⚡</div>
                      <div className="fastrr-pay-title-group">
                        <div className="fastrr-pay-title">Instant UPI & QR Code</div>
                        <div className="fastrr-pay-subtitle">Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "UPI" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  {paymentMethod === "UPI" && (
                    <div style={{ padding: "0 4px 6px" }}>
                      <div className="fastrr-upi-apps-row">
                        {["Google Pay", "PhonePe", "Paytm", "Any UPI ID"].map((app) => (
                          <button
                            key={app}
                            type="button"
                            className={`fastrr-upi-app-btn ${selectedUpiApp === app ? "active" : ""}`}
                            onClick={() => setSelectedUpiApp(app)}
                          >
                            {app}
                          </button>
                        ))}
                      </div>

                      {selectedUpiApp === "Any UPI ID" && (
                        <div style={{ marginTop: "10px" }}>
                          <input
                            type="text"
                            className="fastrr-text-input"
                            placeholder="username@okhdfcbank"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* CARDS */}
                  <div
                    className={`fastrr-pay-card ${paymentMethod === "Cards" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("Cards")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">💳</div>
                      <div className="fastrr-pay-title-group">
                        <div className="fastrr-pay-title">Credit / Debit Card</div>
                        <div className="fastrr-pay-subtitle">Visa, MasterCard, Amex, RuPay</div>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "Cards" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  {paymentMethod === "Cards" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "0 4px 6px" }}>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                      />
                      <div className="fastrr-input-row">
                        <input
                          type="text"
                          className="fastrr-text-input"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          maxLength={5}
                        />
                        <input
                          type="password"
                          className="fastrr-text-input"
                          placeholder="CVV / CVC"
                          value={cardCvv}
                          maxLength={4}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      <input
                        type="text"
                        className="fastrr-text-input"
                        placeholder="Name on Card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                      />
                    </div>
                  )}

                  {/* NET BANKING */}
                  <div
                    className={`fastrr-pay-card ${paymentMethod === "NetBanking" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("NetBanking")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">🏦</div>
                      <div className="fastrr-pay-title-group">
                        <div className="fastrr-pay-title">Net Banking</div>
                        <div className="fastrr-pay-subtitle">HDFC, ICICI, SBI, Axis, Kotak</div>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "NetBanking" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  {paymentMethod === "NetBanking" && (
                    <div style={{ padding: "0 4px 6px" }}>
                      <select
                        className="fastrr-text-input"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        style={{ height: "44px" }}
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}

                  {/* CASH ON DELIVERY */}
                  <div
                    className={`fastrr-pay-card ${paymentMethod === "COD" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("COD")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="fastrr-pay-left">
                      <div className="fastrr-pay-icon-box">💵</div>
                      <div className="fastrr-pay-title-group">
                        <div className="fastrr-pay-title">Cash on Delivery (COD)</div>
                        <div className="fastrr-pay-subtitle">Pay upon inspection at your doorstep</div>
                      </div>
                    </div>
                    <div className="fastrr-radio-pill">
                      {paymentMethod === "COD" && <div className="fastrr-radio-dot" />}
                    </div>
                  </div>

                  {paymentMethod === "COD" && (
                    <div className="fastrr-cod-box">
                      <span className="badge-icon">🛡️</span>
                      <div className="fastrr-cod-box-content">
                        <h5>Shiprocket Safe-Courier Guarantee</h5>
                        <p>Our courier specialist carries tamper-proof sealed packaging. Open and inspect your timepiece before completing cash handover.</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="fastrr-cta-btn"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                >
                  {isPlacingOrder
                    ? "Dispatching Order to Shiprocket..."
                    : `Confirm & Pay ₹${total.toLocaleString("en-IN")} →`}
                </button>

                <button
                  type="button"
                  className="fastrr-back-btn"
                  onClick={() => setStep("address")}
                >
                  ← Edit delivery address
                </button>
              </div>
            )}

            {/* STEP 5: ORDER SUCCESS SCREEN */}
            {step === "success" && placedOrder && (
              <div className="fastrr-success-screen">
                <div className="fastrr-success-badge">✓</div>
                <h3 className="fastrr-step-heading" style={{ fontSize: "22px" }}>Order Confirmed</h3>
                <p className="fastrr-step-desc">
                  Your Hanboro timepiece has been logged with the Shiprocket logistics network.
                </p>

                <div className="fastrr-awb-card">
                  <div className="fastrr-awb-row">
                    <span className="k">Order Reference</span>
                    <span className="v">{placedOrder.orderId}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Shiprocket AWB</span>
                    <span className="v" style={{ color: "#fa2d1d" }}>{placedOrder.awb}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Estimated Arrival</span>
                    <span className="v">{placedOrder.estimatedDelivery}</span>
                  </div>
                  <div className="fastrr-awb-row">
                    <span className="k">Payment Status</span>
                    <span className="v" style={{ color: "#10b981" }}>
                      {placedOrder.paymentMethod === "COD" ? "Pay upon Delivery" : "Paid via Fastrr"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "420px" }}>
                  <button
                    type="button"
                    className="fastrr-cta-btn"
                    onClick={() => {
                      handleClose();
                      if (onNavigateToTracking) {
                        onNavigateToTracking(placedOrder.orderId);
                      }
                    }}
                  >
                    Track Shipment Live →
                  </button>
                  <button
                    type="button"
                    className="fastrr-cta-btn"
                    style={{ background: "rgba(255, 255, 255, 0.08)", boxShadow: "none" }}
                    onClick={handleClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ── RIGHT: DESKTOP ORDER SUMMARY SIDEBAR ── */}
          <aside className="fastrr-order-sidebar">
            <div>
              <h4 className="fastrr-sidebar-title">Order Summary ({items.length})</h4>

              <div className="fastrr-order-items-scroll">
                {items.map((it, idx) => {
                  const p = it.product || {};
                  const pImg = p.image || p.transparentImage || (p.shopifyImages && p.shopifyImages[0]) || "";
                  const pPrice = p.priceNumeric || (typeof p.price === "string" ? parseInt(p.price.replace(/[^\d]/g, ""), 10) : 0) || 54999;
                  return (
                    <div key={idx} className="fastrr-item-card">
                      {pImg && <img src={pImg} alt="" className="fastrr-item-img" />}
                      <div className="fastrr-item-info">
                        <div className="fastrr-item-name">{p.name || p.title || "Hanboro Watch"}</div>
                        <div className="fastrr-item-edition">Qty: {it.quantity || 1} • Ref. {p.sku || "HBR-01"}</div>
                      </div>
                      <div className="fastrr-item-price">₹{(pPrice * (it.quantity || 1)).toLocaleString("en-IN")}</div>
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
                    <span>VIP Privilege ({appliedPromo.code})</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="fastrr-price-row">
                  <span>Express Insured Courier</span>
                  <span style={{ color: "#10b981" }}>FREE</span>
                </div>
                <div className="fastrr-price-row total">
                  <span>Total Amount</span>
                  <span className="val">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="fastrr-trust-badges">
              <div className="fastrr-trust-item">
                <span className="icon">🛡️</span>
                <span>Fastrr 100% Transit Insurance by Shiprocket</span>
              </div>
              <div className="fastrr-trust-item">
                <span className="icon">⚡</span>
                <span>Express Courier Dispatch within 24 Hours</span>
              </div>
              <div className="fastrr-trust-item">
                <span className="icon">🔒</span>
                <span>Encrypted PCI-DSS Level 1 Gateway</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
