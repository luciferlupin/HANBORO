import React, { useState, useEffect } from "react";
import { useStore } from "./StoreContext";
import { ordersService } from "./supabaseClient";
import { HanboroLogo } from "./HanboroLogo";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    login,
    signup,
    user,
    logout,
    isAdmin,
    cart,
    cartCount,
    subtotalInr,
    updateQuantity,
    removeFromCart,
    openCheckout,
  } = useStore();

  const [tab, setTab] = useState("signin"); // "signin" | "signup"
  const [profileSection, setProfileSection] = useState("bag"); // "bag" | "orders"
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync tab with external caller & reset inputs on open
  useEffect(() => {
    if (authModalTab === "signup") {
      setTab("signup");
    } else {
      setTab("signin");
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [authModalTab, isAuthModalOpen]);

  // Load user orders whenever logged-in user opens modal
  useEffect(() => {
    async function loadOrders() {
      if (user?.id || user?.email) {
        setLoadingOrders(true);
        const orders = await ordersService.fetchUserOrders(user.id, user.email);
        setUserOrders(orders || []);
        setLoadingOrders(false);
      }
    }
    if (isAuthModalOpen && user) {
      loadOrders();
    }
  }, [user, isAuthModalOpen]);

  // Lock body scroll and pause Lenis while Auth Modal is open
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg("Please enter both your email address and password.");
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (tab === "signin") {
        const res = await login({ email: cleanEmail, password: cleanPassword });
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setEmail("");
          setPassword("");
        }
      } else {
        if (!cleanName) {
          setErrorMsg("Please provide your full name for your atelier account.");
          setLoading(false);
          return;
        }

        const res = await signup({
          email: cleanEmail,
          password: cleanPassword,
          fullName: cleanName,
          phone: cleanPhone,
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg("Account created successfully!");
          setEmail("");
          setPassword("");
          setFullName("");
          setPhone("");
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="luxury-modal-backdrop" onClick={closeAuthModal} data-lenis-prevent="true">
      <div
        className={`luxury-modal-card auth-modal-card ${user ? "auth-modal-card--profile" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        data-lenis-prevent="true"
      >
        {/* Close Button */}
        <button
          type="button"
          className="luxury-modal-close"
          onClick={closeAuthModal}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-emblem">
            <HanboroLogo theme="light" size={26} />
            <span className="auth-brand-sub">HAUTE HORLOGERIE</span>
          </div>

          <h2 id="auth-modal-title" className="auth-modal-title">
            {user
              ? `Client Profile & Database Dossier`
              : tab === "signin"
              ? "Sign In to Your Account"
              : "Create Collector Account"}
          </h2>
          <p className="auth-modal-desc">
            {user
              ? "Your private allocations, real-time database cart, and order tracking."
              : tab === "signin"
              ? "Access your personal timepiece collection, order tracking, and private privileges."
              : "Join Hanboro Haute Horlogerie for private vault allocations and complimentary courier service."}
          </p>
        </div>

        {/* ════ LOGGED-IN USER PROFILE & DATABASE VIEW ════ */}
        {user ? (
          <div className="auth-profile-view">
            {/* Top User Badge */}
            <div className="profile-badge-card">
              <div className="profile-avatar">
                {(user.fullName || user.email || "H").charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <div className="profile-name-row">
                  <h3 className="profile-name">{user.fullName || "Valued Client"}</h3>
                  <span className="profile-role-pill">
                    {isAdmin ? "✦ Verified Executive" : "✦ Collector Tier"}
                  </span>
                </div>
                <p className="profile-email">{user.email}</p>
                {user.phone && <p className="profile-phone">📞 {user.phone}</p>}
                
                <div className="profile-db-meta">
                  <span className="db-sync-indicator">✦ Private Vault Active</span>
                  <span className="db-user-id">REF: <code>{user.id ? `HNB-${user.id.slice(0, 8).toUpperCase()}` : "HNB-MEMBER"}</code></span>
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs (Bag vs Orders) */}
            <div className="profile-nav-tabs">
              <button
                type="button"
                className={`profile-tab-btn ${profileSection === "bag" ? "is-active" : ""}`}
                onClick={() => setProfileSection("bag")}
              >
                <span>🛍️ Active Bag in Database</span>
                <span className="profile-tab-count">{cartCount}</span>
              </button>

              <button
                type="button"
                className={`profile-tab-btn ${profileSection === "orders" ? "is-active" : ""}`}
                onClick={() => setProfileSection("orders")}
              >
                <span>📦 Orders & Allocations</span>
                <span className="profile-tab-count">{userOrders.length}</span>
              </button>
            </div>

            {/* ── SUB-SECTION: ACTIVE CART IN DATABASE ── */}
            {profileSection === "bag" && (
              <div className="profile-cart-section">
                {cart.length === 0 ? (
                  <div className="profile-cart-empty">
                    <p className="empty-cart-text">Your private bag is currently empty in the database.</p>
                    <button
                      type="button"
                      className="profile-explore-btn"
                      onClick={() => {
                        closeAuthModal();
                        window.location.hash = "#products";
                      }}
                    >
                      Explore Haute Horlogerie Timepieces →
                    </button>
                  </div>
                ) : (
                  <div className="profile-cart-content">
                    <div className="profile-cart-items-list">
                      {cart.map((item) => (
                        <div key={item.product.id} className="profile-cart-item-row">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="profile-item-img"
                          />
                          <div className="profile-item-meta">
                            <span className="profile-item-sku">{item.product.sku}</span>
                            <h4 className="profile-item-name">{item.product.name}</h4>
                            <span className="profile-item-price">{item.product.price}</span>
                          </div>

                          <div className="profile-item-controls">
                            <div className="profile-qty-stepper">
                              <button
                                type="button"
                                className="profile-qty-btn"
                                onClick={() => updateQuantity(item.product.id, -1)}
                              >
                                −
                              </button>
                              <span className="profile-qty-num">{item.quantity}</span>
                              <button
                                type="button"
                                className="profile-qty-btn"
                                onClick={() => updateQuantity(item.product.id, 1)}
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="profile-item-delete"
                              onClick={() => removeFromCart(item.product.id)}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="profile-cart-footer">
                      <div className="profile-cart-subtotal">
                        <span className="subtotal-label">Database Bag Total</span>
                        <span className="subtotal-val">₹{subtotalInr.toLocaleString("en-IN")}</span>
                      </div>

                      <button
                        type="button"
                        className="profile-checkout-cta"
                        onClick={() => {
                          closeAuthModal();
                          openCheckout();
                        }}
                      >
                        Proceed to Secure Checkout →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SUB-SECTION: ORDERS HISTORY ── */}
            {profileSection === "orders" && (
              <div className="profile-orders-section">
                {loadingOrders ? (
                  <div className="profile-loading-orders">Loading your orders...</div>
                ) : userOrders.length === 0 ? (
                  <div className="profile-orders-empty">
                    <p>No previous orders registered under this account.</p>
                  </div>
                ) : (
                  <div className="profile-orders-list">
                    {userOrders.map((ord) => (
                      <div key={ord.id || ord.order_ref} className="profile-order-card">
                        <div className="profile-order-top">
                          <div>
                            <span className="order-ref-badge">{ord.order_ref}</span>
                            <span className="order-date-text">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`status-pill status-pill--${ord.order_status?.toLowerCase()}`}>
                            {ord.order_status || "Processing"}
                          </span>
                        </div>

                        <div className="profile-order-items">
                          {ord.items && ord.items.map((it, idx) => (
                            <div key={idx} className="order-item-snippet">
                              <span>• {it.name || "Timepiece"} ({it.sku || "REF"}) × {it.quantity || 1}</span>
                              <strong>{it.price || `₹${ord.total_amount}`}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="profile-order-bottom">
                          <span>Total: <strong>₹{Number(ord.total_amount).toLocaleString("en-IN")}</strong></span>
                          {ord.tracking_number && (
                            <span className="order-tracking-num">AWB: {ord.tracking_number}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Footer Actions */}
            <div className="profile-bottom-actions">
              {isAdmin && (
                <button
                  type="button"
                  className="profile-admin-btn"
                  onClick={() => {
                    closeAuthModal();
                    window.location.hash = "#admin";
                  }}
                >
                  ⚙️ Atelier Executive Suite ↗
                </button>
              )}

              <button
                type="button"
                className="profile-signout-btn"
                onClick={logout}
              >
                Sign Out of Account
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Nav Tabs for Guest Sign In / Register */}
            <div className="auth-tabs-row" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "signin"}
                className={`auth-tab-btn ${tab === "signin" ? "is-active" : ""}`}
                onClick={() => handleTabChange("signin")}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "signup"}
                className={`auth-tab-btn ${tab === "signup" ? "is-active" : ""}`}
                onClick={() => handleTabChange("signup")}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="auth-error-banner" role="alert">
                <span className="error-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="auth-success-banner" role="status">
                <span className="success-icon">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit}>
              {tab === "signup" && (
                <>
                  <div className="auth-field-group">
                    <label htmlFor="auth-name" className="auth-label">
                      Full Name *
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      className="auth-input"
                      placeholder="Your Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="auth-phone" className="auth-label">
                      Phone Number (Optional)
                    </label>
                    <input
                      id="auth-phone"
                      type="tel"
                      className="auth-input"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </>
              )}

              <div className="auth-field-group">
                <label htmlFor="auth-email" className="auth-label">
                  Email Address *
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="yourname@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field-group">
                <div className="auth-label-row">
                  <label htmlFor="auth-password" className="auth-label">
                    Password *
                  </label>
                  <button
                    type="button"
                    className="auth-show-pass-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder={tab === "signup" ? "At least 6 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === "signup" ? "new-password" : "current-password"}
                  required
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-spinner">Authenticating...</span>
                ) : (
                  <span>
                    {tab === "signin"
                      ? "Sign In →"
                      : "Create Account →"}
                  </span>
                )}
              </button>

              <div className="auth-switch-prompt">
                {tab === "signin" ? (
                  <p>
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => handleTabChange("signup")}
                    >
                      Create Account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => handleTabChange("signin")}
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
