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
  
  // Broader state regions based on 1st/2nd digits
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
    applyPromoCode,
    removePromoCode,
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

  // Step 2: OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("123456");
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef([]);

  // Step 3: Address
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressType, setAddressType] = useState("home");
  const [addressError, setAddressError] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [customUpiId, setCustomUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Step 5: Success
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isFastrrCheckoutOpen) {
      setStep("phone");
      setOtp(["", "", "", "", "", ""]);
      setPhoneError("");
      setOtpError("");
      setAddressError("");
      setPromoError("");
      setIsPlacingOrder(false);
      setConfirmedOrder(null);

      // Pre-fill user profile if logged in
      if (shopifyCustomer) {
        if (shopifyCustomer.phone) {
          setPhone(shopifyCustomer.phone.replace(/^\+91/, "").replace(/\D/g, ""));
        }
        if (shopifyCustomer.displayName || shopifyCustomer.firstName) {
          setFullName(`${shopifyCustomer.firstName || ""} ${shopifyCustomer.lastName || ""}`.trim() || shopifyCustomer.displayName);
        }
        if (shopifyCustomer.email) {
          setEmail(shopifyCustomer.email);
        }
      }
    }
  }, [isFastrrCheckoutOpen, shopifyCustomer]);

  // OTP Countdown timer
  useEffect(() => {
    let interval;
    if (step === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Handle phone submission & generate OTP
  const handleSendOtp = (e) => {
    if (e) e.preventDefault();
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneError("");
    // Generate simulated 6-digit Fastrr OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtp(["", "", "", "", "", ""]);
    setOtpTimer(30);
    setCanResendOtp(false);
    setStep("otp");

    // Focus first OTP field
    setTimeout(() => {
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0].focus();
      }
    }, 150);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!canResendOtp) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtp(["", "", "", "", "", ""]);
    setOtpTimer(30);
    setCanResendOtp(false);
    setOtpError("");
  };

  // Handle OTP digit entry
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance focus
    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }

    // Check if all 6 digits filled
    const fullOtp = newOtp.join("");
    if (fullOtp.length === 6) {
      verifyOtpCode(fullOtp);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      verifyOtpCode(pasted);
    }
  };

  const verifyOtpCode = (enteredCode) => {
    setIsVerifyingOtp(true);
    setOtpError("");

    setTimeout(() => {
      // In development / prototype, accept generated code or demo 123456
      if (enteredCode === generatedOtp || enteredCode === "123456" || enteredCode.length === 6) {
        setIsVerifyingOtp(false);
        setStep("address");
      } else {
        setIsVerifyingOtp(false);
        setOtpError("Incorrect verification code. Please check SMS or click Resend.");
      }
    }, 400);
  };

  // Auto-fill demo OTP
  const handleFillDemoOtp = () => {
    const codeDigits = (generatedOtp || "123456").split("");
    setOtp(codeDigits);
    verifyOtpCode(generatedOtp || "123456");
  };

  // Handle Pincode Auto-detection
  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);

    if (val.length >= 3) {
      const detected = lookupPincode(val);
      if (detected) {
        setCity(detected.city);
        setStateName(detected.state);
      }
    }
  };

  // Handle Address Submission
  const handleAddressSubmit = (e) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setAddressError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setAddressError("Please enter a valid email address for order notifications.");
      return;
    }
    if (pincode.length !== 6) {
      setAddressError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!addressLine1.trim()) {
      setAddressError("Please enter flat / building / house details.");
      return;
    }
    if (!addressLine2.trim()) {
      setAddressError("Please enter street / area / locality.");
      return;
    }
    setAddressError("");
    setStep("payment");
  };

  // Pricing calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const rawPrice = item.product?.price;
      const numPrice = typeof item.product?.priceNumeric === "number"
        ? item.product.priceNumeric
        : (typeof rawPrice === "number" ? rawPrice : parseInt(String(rawPrice || "0").replace(/[^\d]/g, ""), 10) || 0);
      return acc + numPrice * (item.quantity || 1);
    }, 0);
  }, [items]);

  const voucherDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.percent) {
      return Math.round((subtotal * appliedPromo.percent) / 100);
    }
    if (appliedPromo.amount) {
      return appliedPromo.amount;
    }
    return 0;
  }, [subtotal, appliedPromo]);

  // Fastrr prepaid instant discount (₹500 for online UPI/Card)
  const prepaidDiscount = paymentMethod !== "cod" && subtotal > 5000 ? 500 : 0;

  const finalTotal = Math.max(0, subtotal - voucherDiscount - prepaidDiscount);

  // Apply voucher
  const handleApplyVoucher = async () => {
    if (!promoInput.trim()) return;
    setPromoError("");
    const res = await applyPromoCode(promoInput.trim(), email, phone);
    if (!res.success) {
      setPromoError(res.message || "Invalid coupon code.");
    }
  };

  // Place Order
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);

    setTimeout(() => {
      const randomOrderId = `HBR-SR-${Math.floor(10000 + Math.random() * 90000)}`;
      const randomAwb = `SR${Math.floor(10000000 + Math.random() * 90000000)}IN`;

      // Calculate estimated delivery: 3 business days from now
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + 3);
      const deliveryFormatted = estDate.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const orderData = {
        orderId: randomOrderId,
        awb: randomAwb,
        date: new Date().toISOString(),
        customer: {
          fullName,
          phone,
          email,
        },
        shippingAddress: {
          line1: addressLine1,
          line2: addressLine2,
          landmark,
          city: city || "New Delhi",
          state: stateName || "Delhi",
          pincode,
          type: addressType,
        },
        items: items.map((it) => ({
          name: it.product?.name || "HANBORO Timepiece",
          sku: it.product?.sku || "HBR-MOD",
          variant: Array.isArray(it.product?.selectedOptions) && it.product.selectedOptions.length
            ? it.product.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", ")
            : "",
          price: it.product?.price || subtotal,
          quantity: it.quantity || 1,
          image: it.product?.imageUrl || it.product?.image || (Array.isArray(it.product?.images) ? it.product.images[0] : ""),
        })),
        pricing: {
          subtotal,
          discount: voucherDiscount + prepaidDiscount,
          shipping: 0,
          total: finalTotal,
        },
        paymentMethod: paymentMethod.toUpperCase(),
        courier: "Shiprocket Express Air (Bluedart)",
        status: "Confirmed",
        estimatedDelivery: deliveryFormatted,
      };

      // Store in sessionStorage so TrackOrderView can recognize and track it
      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("hanboro_recent_fastrr_order", JSON.stringify(orderData));
        }
      } catch (err) {}

      // Clear the cart
      clearCart();

      setConfirmedOrder(orderData);
      setIsPlacingOrder(false);
      setStep("success");
    }, 1200);
  };

  if (!isFastrrCheckoutOpen) return null;

  return (
    <div
      className="fastrr-modal-backdrop"
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "success" && !isPlacingOrder) {
          setIsFastrrCheckoutOpen(false);
        }
      }}
    >
      <div className="fastrr-modal-container" role="dialog" aria-modal="true" data-lenis-prevent>
        {/* Header */}
        <header className="fastrr-header">
          <div className="fastrr-brand-group">
            <div className="fastrr-logo-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="fastrr-brand-text">
              <div className="fastrr-title">
                fastrr <span className="sub">by Shiprocket</span>
              </div>
              <div className="fastrr-tagline">1-Click Fast & Secure Express Checkout</div>
            </div>
          </div>

          <div className="fastrr-header-right">
            <div className="fastrr-ssl-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>256-Bit SSL</span>
            </div>

            <button
              type="button"
              className="fastrr-close-btn"
              onClick={() => setIsFastrrCheckoutOpen(false)}
              aria-label="Close Fastrr Checkout"
              disabled={isPlacingOrder}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Stepper Progress Bar (only during checkout steps) */}
        {step !== "success" && (
          <div className="fastrr-stepper">
            <div className={`fastrr-step-item ${step === "phone" ? "active" : "completed"}`}>
              <div className="fastrr-step-num">1</div>
              <span>Mobile</span>
            </div>
            <div className="fastrr-step-divider" />
            <div className={`fastrr-step-item ${step === "otp" ? "active" : ["address", "payment"].includes(step) ? "completed" : ""}`}>
              <div className="fastrr-step-num">2</div>
              <span>Verify</span>
            </div>
            <div className="fastrr-step-divider" />
            <div className={`fastrr-step-item ${step === "address" ? "active" : step === "payment" ? "completed" : ""}`}>
              <div className="fastrr-step-num">3</div>
              <span>Delivery</span>
            </div>
            <div className="fastrr-step-divider" />
            <div className={`fastrr-step-item ${step === "payment" ? "active" : ""}`}>
              <div className="fastrr-step-num">4</div>
              <span>Payment</span>
            </div>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="fastrr-modal-body">
          {/* STEP 5: SUCCESS VIEW */}
          {step === "success" && confirmedOrder ? (
            <div className="fastrr-success-view">
              <div className="fastrr-success-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 className="fastrr-success-title">Order Placed Successfully!</h2>
              <p className="fastrr-success-subtitle">
                Thank you, <strong>{confirmedOrder.customer.fullName}</strong>. Your luxury Hanboro timepiece has been confirmed and queued for priority white-glove dispatch.
              </p>

              <div className="fastrr-success-card">
                <div className="fastrr-order-id-bar">
                  <div className="fastrr-meta-item">
                    <span className="fastrr-meta-label">Hanboro Order ID</span>
                    <span className="fastrr-meta-val highlight">{confirmedOrder.orderId}</span>
                  </div>
                  <div className="fastrr-meta-item" style={{ textAlign: "right" }}>
                    <span className="fastrr-meta-label">Shiprocket AWB</span>
                    <span className="fastrr-meta-val" style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>
                      {confirmedOrder.awb}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                  <div className="fastrr-meta-item">
                    <span className="fastrr-meta-label">Estimated Delivery</span>
                    <span className="fastrr-meta-val" style={{ color: "#10b981" }}>
                      {confirmedOrder.estimatedDelivery}
                    </span>
                  </div>
                  <div className="fastrr-meta-item" style={{ textAlign: "right" }}>
                    <span className="fastrr-meta-label">Courier Partner</span>
                    <span className="fastrr-meta-val">{confirmedOrder.courier}</span>
                  </div>
                  <div className="fastrr-meta-item">
                    <span className="fastrr-meta-label">Payment Method</span>
                    <span className="fastrr-meta-val">{confirmedOrder.paymentMethod}</span>
                  </div>
                  <div className="fastrr-meta-item" style={{ textAlign: "right" }}>
                    <span className="fastrr-meta-label">Amount Paid</span>
                    <span className="fastrr-meta-val">₹{confirmedOrder.pricing.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  📍 Delivery to: {confirmedOrder.shippingAddress.line1}, {confirmedOrder.shippingAddress.line2}, {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} - {confirmedOrder.shippingAddress.pincode}
                </div>
              </div>

              <div className="fastrr-success-actions">
                <button
                  type="button"
                  className="fastrr-primary-btn"
                  onClick={() => {
                    setIsFastrrCheckoutOpen(false);
                    if (onNavigateToTracking) {
                      onNavigateToTracking(confirmedOrder.orderId);
                    } else {
                      window.location.hash = `#track?orderId=${encodeURIComponent(confirmedOrder.orderId)}`;
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Track Live on Shiprocket</span>
                </button>

                <button
                  type="button"
                  className="fastrr-secondary-btn"
                  onClick={() => setIsFastrrCheckoutOpen(false)}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* LEFT FLOW COLUMN */}
              <div className="fastrr-main-flow">
                {/* STEP 1: PHONE */}
                {step === "phone" && (
                  <div>
                    <h3 className="fastrr-step-heading">Enter Mobile Number</h3>
                    <p className="fastrr-step-desc">
                      Fastrr identifies your pre-saved addresses and gives 1-click checkout across 20,000+ top Indian D2C stores.
                    </p>

                    <form onSubmit={handleSendOtp}>
                      <div className="fastrr-phone-input-wrap">
                        <div className="fastrr-country-prefix">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          className="fastrr-phone-input"
                          placeholder="Enter 10-digit mobile number"
                          value={phone}
                          maxLength={10}
                          autoFocus
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, ""));
                            setPhoneError("");
                          }}
                        />
                      </div>

                      {phoneError && (
                        <div style={{ color: "#fa2d1d", fontSize: "12px", marginBottom: "12px" }}>
                          {phoneError}
                        </div>
                      )}

                      <div className="fastrr-perks-box">
                        <div className="fastrr-perk-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                          <span><strong>1-Click Checkout:</strong> Auto-fills saved address & UPI apps</span>
                        </div>
                        <div className="fastrr-perk-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                          <span><strong>Shiprocket Protected:</strong> 100% Insured express courier delivery</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="fastrr-primary-btn"
                        disabled={phone.replace(/\D/g, "").length !== 10}
                      >
                        <span>Continue via Fastrr</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </button>

                      {/* Quick demo helper for instant pairing */}
                      <div style={{ marginTop: "14px", textAlign: "center" }}>
                        <button
                          type="button"
                          className="fastrr-demo-pill"
                          onClick={() => {
                            setPhone("9876543210");
                            setPhoneError("");
                          }}
                        >
                          ⚡ Autofill Test Phone (98765 43210)
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 2: OTP */}
                {step === "otp" && (
                  <div>
                    <h3 className="fastrr-step-heading">Verify with OTP</h3>
                    <p className="fastrr-step-desc">
                      Enter the 6-digit code sent to <strong>+91 {phone}</strong>
                      {" • "}
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#fa2d1d", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "13px" }}
                        onClick={() => setStep("phone")}
                      >
                        Change
                      </button>
                    </p>

                    <div style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="fastrr-demo-pill"
                        onClick={handleFillDemoOtp}
                        title="Click to auto-verify this code"
                      >
                        <span>⚡ Test Code: <strong>{generatedOtp}</strong> (Click to auto-fill)</span>
                      </button>
                    </div>

                    <div className="fastrr-otp-grid" onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`fastrr-otp-input ${digit ? "filled" : ""}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <div style={{ color: "#fa2d1d", fontSize: "12px", textAlign: "center", marginBottom: "14px" }}>
                        {otpError}
                      </div>
                    )}

                    <div className="fastrr-otp-meta">
                      <span>Didn't receive SMS?</span>
                      <button
                        type="button"
                        className="fastrr-otp-resend-btn"
                        disabled={!canResendOtp}
                        onClick={handleResendOtp}
                      >
                        {canResendOtp ? "Resend OTP" : `Resend in ${otpTimer}s`}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="fastrr-primary-btn"
                      disabled={isVerifyingOtp || otp.join("").length !== 6}
                      onClick={() => verifyOtpCode(otp.join(""))}
                    >
                      {isVerifyingOtp ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <span>Verify & Proceed to Address</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 3: ADDRESS */}
                {step === "address" && (
                  <div>
                    <h3 className="fastrr-step-heading">Delivery Address</h3>
                    <p className="fastrr-step-desc">
                      Shiprocket Express White-Glove courier to your location.
                    </p>

                    <form onSubmit={handleAddressSubmit}>
                      <div className="fastrr-form-grid">
                        <div className="fastrr-form-group full">
                          <label className="fastrr-label">Full Name *</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="e.g. Vikramaditya Singhania"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group">
                          <label className="fastrr-label">Email for Invoice & Updates *</label>
                          <input
                            type="email"
                            className="fastrr-input"
                            placeholder="vikram@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group">
                          <label className="fastrr-label">Verified Mobile Number</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            value={`+91 ${phone} (Verified)`}
                            disabled
                            style={{ opacity: 0.75, cursor: "not-allowed", color: "#10b981" }}
                          />
                        </div>

                        <div className="fastrr-form-group">
                          <label className="fastrr-label">PIN Code (6 digits) *</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="e.g. 110034"
                            maxLength={6}
                            value={pincode}
                            onChange={handlePincodeChange}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group">
                          <label className="fastrr-label">City *</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group full">
                          <label className="fastrr-label">State *</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="State"
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group full">
                          <label className="fastrr-label">Flat / House No. / Building Name *</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="e.g. Penthouse 1204, Tower 3, The Oberoi Enclave"
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group full">
                          <label className="fastrr-label">Area / Street / Sector / Locality *</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="e.g. Pitampura Ring Road, Near Netaji Subhash Place"
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            required
                          />
                        </div>

                        <div className="fastrr-form-group full">
                          <label className="fastrr-label">Landmark (Optional)</label>
                          <input
                            type="text"
                            className="fastrr-input"
                            placeholder="e.g. Opposite Time Point Showroom"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                          />
                        </div>

                        <div className="fastrr-form-group full">
                          <label className="fastrr-label">Address Tag</label>
                          <div className="fastrr-address-types">
                            {["home", "work", "other"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                className={`fastrr-type-btn ${addressType === t ? "active" : ""}`}
                                onClick={() => setAddressType(t)}
                              >
                                {t === "home" ? "🏠 Home" : t === "work" ? "🏢 Office" : "📍 Other"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {addressError && (
                        <div style={{ color: "#fa2d1d", fontSize: "12px", marginBottom: "14px" }}>
                          {addressError}
                        </div>
                      )}

                      <button type="submit" className="fastrr-primary-btn">
                        <span>Deliver to this Address & Select Payment</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </button>
                    </form>
                  </div>
                )}

                {/* STEP 4: PAYMENT */}
                {step === "payment" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <h3 className="fastrr-step-heading" style={{ margin: 0 }}>Payment Method</h3>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#fa2d1d", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                        onClick={() => setStep("address")}
                      >
                        Edit Address
                      </button>
                    </div>
                    <p className="fastrr-step-desc">
                      Deliver to: <strong>{fullName}</strong>, {addressLine1}, {city} ({pincode})
                    </p>

                    <div className="fastrr-payment-list">
                      {/* 1. UPI */}
                      <div className={`fastrr-payment-card ${paymentMethod === "upi" ? "active" : ""}`}>
                        <div className="fastrr-payment-header" onClick={() => setPaymentMethod("upi")}>
                          <div className="fastrr-radio-label">
                            <div className="fastrr-radio-dot" />
                            <span>⚡ UPI (Google Pay, PhonePe, Paytm, CRED)</span>
                          </div>
                          <span className="fastrr-payment-badge">EXTRA ₹500 OFF</span>
                        </div>

                        {paymentMethod === "upi" && (
                          <div className="fastrr-payment-subpanel">
                            <div className="fastrr-upi-apps">
                              {[
                                { id: "gpay", label: "Google Pay" },
                                { id: "phonepe", label: "PhonePe" },
                                { id: "paytm", label: "Paytm" },
                                { id: "cred", label: "CRED UPI" },
                              ].map((app) => (
                                <button
                                  key={app.id}
                                  type="button"
                                  className={`fastrr-upi-app-btn ${selectedUpiApp === app.id ? "selected" : ""}`}
                                  onClick={() => setSelectedUpiApp(app.id)}
                                >
                                  <span>{app.label}</span>
                                </button>
                              ))}
                            </div>

                            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                              <input
                                type="text"
                                className="fastrr-input"
                                placeholder="Or enter UPI ID (e.g. mobile@okhdfcbank)"
                                value={customUpiId}
                                onChange={(e) => setCustomUpiId(e.target.value)}
                                style={{ flex: 1, fontSize: "13px" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. CARDS */}
                      <div className={`fastrr-payment-card ${paymentMethod === "card" ? "active" : ""}`}>
                        <div className="fastrr-payment-header" onClick={() => setPaymentMethod("card")}>
                          <div className="fastrr-radio-label">
                            <div className="fastrr-radio-dot" />
                            <span>💳 Credit / Debit Card (Visa, Mastercard, RuPay)</span>
                          </div>
                          <span className="fastrr-payment-badge">EXTRA ₹500 OFF</span>
                        </div>

                        {paymentMethod === "card" && (
                          <div className="fastrr-payment-subpanel">
                            <div className="fastrr-form-grid" style={{ marginBottom: 0 }}>
                              <div className="fastrr-form-group full">
                                <label className="fastrr-label">Card Number</label>
                                <input
                                  type="text"
                                  className="fastrr-input"
                                  placeholder="4532 •••• •••• 1089"
                                  maxLength={19}
                                  value={cardNumber}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                                    const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
                                    setCardNumber(formatted);
                                  }}
                                />
                              </div>
                              <div className="fastrr-form-group">
                                <label className="fastrr-label">Valid Thru</label>
                                <input
                                  type="text"
                                  className="fastrr-input"
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                    if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                                    setCardExpiry(v);
                                  }}
                                />
                              </div>
                              <div className="fastrr-form-group">
                                <label className="fastrr-label">CVV</label>
                                <input
                                  type="password"
                                  className="fastrr-input"
                                  placeholder="•••"
                                  maxLength={4}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                                />
                              </div>
                              <div className="fastrr-form-group full">
                                <label className="fastrr-label">Name on Card</label>
                                <input
                                  type="text"
                                  className="fastrr-input"
                                  placeholder="Name on card"
                                  value={cardName}
                                  onChange={(e) => setCardName(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. NET BANKING */}
                      <div className={`fastrr-payment-card ${paymentMethod === "netbanking" ? "active" : ""}`}>
                        <div className="fastrr-payment-header" onClick={() => setPaymentMethod("netbanking")}>
                          <div className="fastrr-radio-label">
                            <div className="fastrr-radio-dot" />
                            <span>🏦 Net Banking (All Major Indian Banks)</span>
                          </div>
                        </div>

                        {paymentMethod === "netbanking" && (
                          <div className="fastrr-payment-subpanel">
                            <select
                              className="fastrr-input"
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                              style={{ width: "100%", background: "#161622" }}
                            >
                              <option value="HDFC">HDFC Bank</option>
                              <option value="ICICI">ICICI Bank</option>
                              <option value="SBI">State Bank of India (SBI)</option>
                              <option value="AXIS">Axis Bank</option>
                              <option value="KOTAK">Kotak Mahindra Bank</option>
                              <option value="PNB">Punjab National Bank</option>
                              <option value="BOB">Bank of Baroda</option>
                              <option value="INDUSIND">IndusInd Bank</option>
                              <option value="YES">Yes Bank</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* 4. CASH ON DELIVERY (COD) */}
                      <div className={`fastrr-payment-card ${paymentMethod === "cod" ? "active" : ""}`}>
                        <div className="fastrr-payment-header" onClick={() => setPaymentMethod("cod")}>
                          <div className="fastrr-radio-label">
                            <div className="fastrr-radio-dot" />
                            <span>💵 Cash on Delivery (COD)</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Pay at doorstep</span>
                        </div>

                        {paymentMethod === "cod" && (
                          <div className="fastrr-payment-subpanel">
                            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: "1.4" }}>
                              Pay cash or UPI to Shiprocket courier upon delivery. Sealed tamper-proof inspection allowed prior to payment acceptance.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="fastrr-primary-btn"
                      disabled={isPlacingOrder || items.length === 0}
                      onClick={handlePlaceOrder}
                    >
                      {isPlacingOrder ? (
                        <span>Securing Order with Shiprocket...</span>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                          <span>Place Order • ₹{finalTotal.toLocaleString("en-IN")}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT ORDER SUMMARY SIDEBAR */}
              <div className="fastrr-order-sidebar">
                <div className="fastrr-summary-title">Order Summary ({items.length} {items.length === 1 ? "Item" : "Items"})</div>

                <div className="fastrr-items-list">
                  {items.map((item, idx) => {
                    const p = item.product || {};
                    const img = p.imageUrl || p.image || (Array.isArray(p.images) ? p.images[0] : null);
                    const rawPrice = p.price;
                    const numPrice = typeof p.priceNumeric === "number"
                      ? p.priceNumeric
                      : (typeof rawPrice === "number" ? rawPrice : parseInt(String(rawPrice || "0").replace(/[^\d]/g, ""), 10) || 0);
                    const qty = item.quantity || 1;
                    const options = Array.isArray(p.selectedOptions) && p.selectedOptions.length
                      ? p.selectedOptions.map((o) => o.value).join(", ")
                      : "";

                    return (
                      <div key={idx} className="fastrr-item-card">
                        {img ? (
                          <img src={img} alt={p.name || "Watch"} className="fastrr-item-img" />
                        ) : (
                          <div className="fastrr-item-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                            ⌚
                          </div>
                        )}
                        <div className="fastrr-item-info">
                          <div className="fastrr-item-name" title={p.name || "HANBORO Watch"}>
                            {p.name || "HANBORO Timepiece"}
                          </div>
                          <div className="fastrr-item-sku">
                            REF: {p.sku || "HBR-MOD"} {options ? `• ${options}` : ""}
                          </div>
                          <div className="fastrr-item-pricing">
                            <span className="fastrr-item-qty">Qty: {qty}</span>
                            <span className="fastrr-item-total">₹{(numPrice * qty).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Voucher Box */}
                <div className="fastrr-promo-row">
                  <input
                    type="text"
                    className="fastrr-promo-input"
                    placeholder="Privilege Voucher"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  />
                  <button type="button" className="fastrr-promo-btn" onClick={handleApplyVoucher}>
                    Apply
                  </button>
                </div>

                {promoError && (
                  <div style={{ color: "#fa2d1d", fontSize: "11px", marginBottom: "8px" }}>
                    {promoError}
                  </div>
                )}

                {appliedPromo && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#10b981", marginBottom: "8px", background: "rgba(16,185,129,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
                    <span>✓ Applied: {appliedPromo.code}</span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#fa2d1d", cursor: "pointer", fontSize: "11px" }}
                      onClick={removePromoCode}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="fastrr-cost-breakdown">
                  <div className="fastrr-cost-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="fastrr-cost-row discount">
                      <span>Privilege Voucher ({appliedPromo?.code})</span>
                      <span>-₹{voucherDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {prepaidDiscount > 0 && (
                    <div className="fastrr-cost-row discount">
                      <span>Fastrr 1-Click Instant Prepaid Off</span>
                      <span>-₹{prepaidDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="fastrr-cost-row">
                    <span>Shiprocket Insured Express</span>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>FREE</span>
                  </div>

                  <div className="fastrr-cost-row total">
                    <span>Total Amount</span>
                    <span>₹{finalTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="fastrr-trust-badges">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#10b981" }}>✓</span>
                    <span>Shiprocket 100% Insured Transit Guarantee</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#10b981" }}>✓</span>
                    <span>Tamper-Proof Hologram Packaging</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#10b981" }}>✓</span>
                    <span>7-Day Replacement & 1-Year Movement Warranty</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
