import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "./StoreContext";
import { ordersService, enrichOrderItemWithSkuEan } from "./supabaseClient";
import { PRODUCTS_DATA, getWatchPricing } from "./productsData";
import { HanboroLogo } from "./HanboroLogo";

/* ── APPLE-GRADE MINIMALIST VECTOR ICONS (No child/cartoon emojis) ── */
const Icons = {
  Bag: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Box: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Shield: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Heart: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  FileText: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  LogOut: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

export function ProfilePage({ onNavigate }) {
  const {
    user,
    isAdmin,
    cart,
    cartCount,
    subtotalInr,
    updateQuantity,
    removeFromCart,
    clearCart,
    openCheckout,
    logout,
    openAuthModal,
    products,
    wishlist,
    toggleWishlist,
    addToCart,
  } = useStore();

  const [activeTab, setActiveTab] = useState("bag"); // "bag" | "orders" | "wishlist" | "settings"
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(null);
  const [viewingInvoiceOrder, setViewingInvoiceOrder] = useState(null);

  const savedWatches = useMemo(() => {
    if (!wishlist || typeof wishlist !== "object") return [];
    const all = Array.isArray(products) && products.length > 0 ? products : PRODUCTS_DATA;
    return all.filter((p) => wishlist[p.id]);
  }, [wishlist, products]);

  const handleCopyTracking = (code) => {
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedTrackingId(code);
      setTimeout(() => setCopiedTrackingId(null), 2500);
    } catch {}
  };

  // If user is not logged in, prompt sign in
  useEffect(() => {
    if (!user) {
      openAuthModal("signin");
    }
  }, [user, openAuthModal]);

  // Fetch logged in user's orders from Supabase
  useEffect(() => {
    async function loadOrders() {
      if (user?.id || user?.email) {
        setLoadingOrders(true);
        const orders = await ordersService.fetchUserOrders(user.id, user.email);
        setUserOrders(orders || []);
        setLoadingOrders(false);
      }
    }
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Lock body scroll and pause Lenis while cancellation modal is open
  useEffect(() => {
    if (!orderToCancel) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [orderToCancel]);

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelling(true);
    try {
      await ordersService.cancelOrder(orderToCancel.order_ref || orderToCancel.id);
      setUserOrders((prev) =>
        prev.map((o) =>
          o.order_ref === orderToCancel.order_ref || o.id === orderToCancel.id
            ? { ...o, order_status: "Cancelled", payment_status: "Refund Initiated" }
            : o
        )
      );
    } catch (err) {
      console.warn("Cancellation error:", err);
    } finally {
      setCancelling(false);
      setOrderToCancel(null);
    }
  };

  if (!user) {
    return (
      <div className="profile-page-guest-fallback">
        <div className="profile-guest-card">
          <div className="guest-emblem">
            <HanboroLogo theme="light" size={28} />
          </div>
          <h2 className="guest-title">Your Account & Orders</h2>
          <p className="guest-subtitle">
            Sign in to view your orders, saved watches, and active shopping bag.
          </p>
          <div className="guest-actions">
            <button
              type="button"
              className="guest-signin-btn"
              onClick={() => openAuthModal("signin")}
            >
              Sign In to Your Account →
            </button>
            <button
              type="button"
              className="guest-browse-btn"
              onClick={() => onNavigate && onNavigate("products", "#products")}
            >
              Browse Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = (user.fullName || user.email || "H").charAt(0).toUpperCase();
  const collectorRef = user.id ? `HNB-${user.id.slice(0, 8).toUpperCase()}` : "HNB-MEMBER";

  return (
    <div className="apple-profile-root">
      {/* ── MINIMAL APPLE-STYLE TOP BAR ── */}
      <header className="apple-profile-topbar">
        <div className="apple-topbar-inner">
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
            className="apple-topbar-brand"
            onClick={() => onNavigate && onNavigate("home", "#top")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0 }}
            aria-label="Hanboro Home"
          >
            <HanboroLogo theme="light" size={22} />
            <span className="apple-topbar-badge">ACCOUNT VAULT</span>
          </button>

          <div className="apple-topbar-actions">
            {isAdmin && (
              <button
                type="button"
                className="apple-admin-btn"
                onClick={() => onNavigate && onNavigate("admin", "#admin")}
              >
                Admin Suite ↗
              </button>
            )}
            <button
              type="button"
              className="apple-logout-btn"
              onClick={logout}
              title="Sign Out"
            >
              <Icons.LogOut />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="apple-profile-container">
        
        {/* ── APPLE-TIER HERO DOSSIER CARD ── */}
        <section className="apple-hero-card">
          <div className="apple-hero-glow" />
          <div className="apple-hero-body">
            <div className="apple-hero-identity">
              <div className="apple-avatar-wrap">
                <span className="apple-avatar-text">{userInitial}</span>
              </div>
              <div className="apple-user-details">
                <div className="apple-user-headline">
                  <h1 className="apple-user-name">{user.fullName || "Valued Client"}</h1>
                  <span className="apple-tier-tag">
                    {isAdmin ? "Verified Executive" : "Private Vault Member"}
                  </span>
                </div>
                <p className="apple-user-email">{user.email}</p>
                {user.phone && <p className="apple-user-phone">{user.phone}</p>}
              </div>
            </div>

            <div className="apple-hero-metrics">
              <div className="apple-metric-item">
                <span className="metric-title">COLLECTOR REF</span>
                <span className="metric-value metric-value--mono">{collectorRef}</span>
              </div>
              <div className="apple-metric-divider" />
              <div className="apple-metric-item">
                <span className="metric-title">SAVED WATCHES</span>
                <span className="metric-value">{savedWatches.length} {savedWatches.length === 1 ? "Piece" : "Pieces"}</span>
              </div>
              <div className="apple-metric-divider" />
              <div className="apple-metric-item">
                <span className="metric-title">BAG ALLOCATION</span>
                <span className="metric-value">{cartCount} {cartCount === 1 ? "Piece" : "Pieces"}</span>
              </div>
              <div className="apple-metric-divider" />
              <div className="apple-metric-item">
                <span className="metric-title">CONFIRMED ORDERS</span>
                <span className="metric-value">{userOrders.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEGMENTED APPLE CONTROL TABS (No emojis, clean vector icons) ── */}
        <nav className="apple-segmented-nav" aria-label="Profile Tabs">
          <button
            type="button"
            className={`apple-segment-btn ${activeTab === "bag" ? "is-active" : ""}`}
            onClick={() => setActiveTab("bag")}
          >
            <Icons.Bag />
            <span>Shopping Bag</span>
            {cartCount > 0 && <span className="segment-counter">{cartCount}</span>}
          </button>

          <button
            type="button"
            className={`apple-segment-btn ${activeTab === "orders" ? "is-active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <Icons.Box />
            <span>Orders & Tracking</span>
            {userOrders.length > 0 && <span className="segment-counter">{userOrders.length}</span>}
          </button>

          <button
            type="button"
            className={`apple-segment-btn ${activeTab === "wishlist" ? "is-active" : ""}`}
            onClick={() => setActiveTab("wishlist")}
          >
            <Icons.Heart />
            <span>Saved Watches</span>
            {savedWatches.length > 0 && <span className="segment-counter">{savedWatches.length}</span>}
          </button>

          <button
            type="button"
            className={`apple-segment-btn ${activeTab === "settings" ? "is-active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Icons.Shield />
            <span>Account Profile</span>
          </button>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: SHOPPING BAG
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "bag" && (
          <section className="apple-pane-card">
            <div className="apple-pane-header">
              <div>
                <h2 className="apple-pane-title">Active Timepiece Selection</h2>
                <p className="apple-pane-desc">
                  Curated watches allocated to your private collector account.
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="apple-clear-btn"
                  onClick={clearCart}
                >
                  <Icons.Trash />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="apple-empty-state">
                <div className="apple-empty-icon">
                  <Icons.Bag />
                </div>
                <h3 className="apple-empty-title">Your Private Bag is Empty</h3>
                <p className="apple-empty-text">
                  Discover exquisite skeleton and tourbillon creations in our latest catalog.
                </p>
                <button
                  type="button"
                  className="apple-primary-btn"
                  onClick={() => onNavigate && onNavigate("products", "#products")}
                >
                  Explore Collection →
                </button>
              </div>
            ) : (
              <div className="apple-cart-layout">
                <div className="apple-cart-items-grid">
                  {cart.map((item) => {
                    const numericPrice =
                      parseInt(
                        item.product.price.toString().replace(/[^\d]/g, ""),
                        10
                      ) || 0;
                    const lineTotal = numericPrice * item.quantity;

                    return (
                      <div key={item.product.id} className="apple-cart-card">
                        <div className="apple-cart-card-img-wrap">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="apple-cart-card-img"
                          />
                        </div>

                        <div className="apple-cart-card-info">
                          <span className="apple-cart-sku">{item.product.sku}</span>
                          <h4 className="apple-cart-name">{item.product.name}</h4>
                          {(() => {
                            const pricing = getWatchPricing(item.product);
                            return (
                              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                <span className="apple-cart-unit-price">{pricing.price}</span>
                                {pricing.hasDiscount && pricing.mrp && (
                                  <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through", textDecorationColor: "#ef4444" }}>
                                    {pricing.mrp}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="apple-cart-card-controls">
                          <div className="apple-qty-stepper">
                            <button
                              type="button"
                              className="apple-qty-btn"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="apple-qty-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="apple-qty-btn"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <span className="apple-line-total">
                            ₹{lineTotal.toLocaleString("en-IN")}
                          </span>

                          <button
                            type="button"
                            className="apple-remove-btn"
                            onClick={() => removeFromCart(item.product.id)}
                            title="Remove watch"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal & Checkout Card */}
                <div className="apple-summary-card">
                  <div className="apple-summary-perks">
                    <div className="apple-perk-row">
                      <Icons.Check />
                      <span>Complimentary Insured Express Courier</span>
                    </div>
                    <div className="apple-perk-row">
                      <Icons.Check />
                      <span>Wooden Lacquered Presentation Box</span>
                    </div>
                    <div className="apple-perk-row">
                      <Icons.Check />
                      <span>2-Year International Brand Guarantee</span>
                    </div>
                  </div>

                  <div className="apple-summary-checkout-col">
                    <div className="apple-summary-amount-block">
                      <span className="amount-label">ESTIMATED TOTAL</span>
                      <span className="amount-num">₹{subtotalInr.toLocaleString("en-IN")}</span>
                    </div>

                    <button
                      type="button"
                      className="apple-checkout-btn"
                      onClick={() => openCheckout()}
                    >
                      Proceed to Secure Checkout →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: ORDERS & TRACKING
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <section className="apple-pane-card">
            <div className="apple-pane-header">
              <div>
                <h2 className="apple-pane-title">Order Allocations & Shipment</h2>
                <p className="apple-pane-desc">
                  Real-time status of your confirmed timepiece purchases.
                </p>
              </div>
            </div>

            {loadingOrders ? (
              <div className="apple-loading-state">
                <span className="apple-spinner" />
                <span>Loading your allocations...</span>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="apple-empty-state">
                <div className="apple-empty-icon">
                  <Icons.Box />
                </div>
                <h3 className="apple-empty-title">No Prior Orders</h3>
                <p className="apple-empty-text">
                  Confirmed timepiece allocations and tracking airway bills will appear here once purchased.
                </p>
                <button
                  type="button"
                  className="apple-primary-btn"
                  onClick={() => onNavigate && onNavigate("products", "#products")}
                >
                  Browse Catalog →
                </button>
              </div>
            ) : (
              <div className="apple-orders-stack">
                {userOrders.map((ord) => {
                  const isCancelled = ord.order_status?.toLowerCase() === "cancelled";
                  const isDelivered = ord.order_status?.toLowerCase() === "delivered";
                  const canCancel = !isCancelled && !isDelivered;

                  return (
                    <div key={ord.id || ord.order_ref} className={`apple-order-card ${isCancelled ? "apple-order-card--cancelled" : ""}`}>
                      <div className="apple-order-top">
                        <div className="apple-order-ref-wrap">
                          <span className="apple-order-ref">{ord.order_ref}</span>
                          <span className="apple-order-date">
                            {new Date(ord.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="apple-order-actions-top">
                          {(() => {
                            const isCod =
                              String(ord.payment_method || "").toLowerCase().includes("cod") ||
                              String(ord.payment_method || "").toLowerCase().includes("cash on delivery") ||
                              ord.payment_status === "Pending";
                            const isPaid = ord.payment_status === "Paid";

                            return (
                              <span
                                className="apple-status-pill"
                                style={{
                                  background: isPaid ? "#dcfce7" : isCancelled ? "#fee2e2" : "#fef3c7",
                                  color: isPaid ? "#15803d" : isCancelled ? "#b91c1c" : "#b45309",
                                  fontWeight: 600,
                                }}
                              >
                                ● {isPaid ? "Paid" : isCancelled ? "Refund Initiated" : isCod ? "Due on Delivery" : (ord.payment_status || "Pending")}
                              </span>
                            );
                          })()}

                          <span className={`apple-status-pill apple-status-pill--${ord.order_status?.toLowerCase() || "processing"}`}>
                            {ord.order_status || "Processing"}
                          </span>

                          {canCancel && (
                            <button
                              type="button"
                              className="apple-order-cancel-trigger"
                              onClick={() => setOrderToCancel(ord)}
                              title="Request order cancellation"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="apple-order-items">
                        {ord.items &&
                          ord.items.map((it, idx) => (
                            <div key={idx} className="apple-order-item-row">
                              {it.image && (
                                <img src={it.image} alt={it.name} className="apple-order-item-img" />
                              )}
                              <div className="apple-order-item-details">
                                <span className="apple-order-item-name">{it.name}</span>
                                <span className="apple-order-item-sku">REF: {it.sku}</span>
                              </div>
                              <div className="apple-order-item-pricing">
                                <span>Qty: {it.quantity || 1}</span>
                                <strong>{it.price || `₹${ord.total_amount}`}</strong>
                              </div>
                            </div>
                          ))}
                      </div>

                      {isCancelled && (
                        <div className="apple-order-cancelled-notice">
                          <span className="notice-dot" />
                          <span>Order cancelled • Full refund initiated to original payment source</span>
                        </div>
                      )}

                      <div className="apple-order-footer">
                        <div className="apple-footer-stat">
                          <span className="stat-label">PAYMENT METHOD</span>
                          <span className="stat-value">{ord.payment_method || "Credit Card"}</span>
                        </div>
                        <div className="apple-footer-stat">
                          <span className="stat-label">PAYMENT STATUS</span>
                          <span
                            className="stat-value"
                            style={{
                              color: ord.payment_status === "Paid" ? "#15803d" : "#b45309",
                              fontWeight: 600,
                            }}
                          >
                            {ord.payment_status === "Paid"
                              ? "Paid (Verified)"
                              : String(ord.payment_method || "").toLowerCase().includes("cod")
                              ? "Pending (Due on Delivery)"
                              : (ord.payment_status || "Pending")}
                          </span>
                        </div>
                        <div className="apple-footer-stat">
                          <span className="stat-label">AIRWAY BILL / TRACKING</span>
                          <span className="stat-value stat-value--mono" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {ord.tracking_number || "Awaiting Dispatch"}
                            {ord.tracking_number && (
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(ord.tracking_number)}
                                style={{
                                  background: copiedTrackingId === ord.tracking_number ? "#dcfce7" : "#f1f5f9",
                                  color: copiedTrackingId === ord.tracking_number ? "#15803d" : "#475569",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "4px",
                                  padding: "2px 8px",
                                  fontSize: "10.5px",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                                title="Copy tracking code"
                              >
                                {copiedTrackingId === ord.tracking_number ? "✓ Copied" : "Copy"}
                              </button>
                            )}
                          </span>
                        </div>
                        <div className="apple-footer-stat apple-footer-stat--total">
                          <span className="stat-label">TOTAL ALLOCATION</span>
                          <span className="stat-value-total">
                            ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                            {String(ord.payment_method || "").toLowerCase().includes("cod") && ord.payment_status !== "Paid" ? (
                              <span style={{ display: "block", fontSize: "10.5px", color: "#b45309", fontWeight: 600, letterSpacing: "0.02em" }}>
                                Payable on Handover
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>

                      <div className="apple-order-bill-row" style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setViewingInvoiceOrder(ord)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#0f172a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 14px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          <Icons.FileText />
                          <span>View Official Tax Invoice & Bill</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: WISHLIST / SAVED WATCHES
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "wishlist" && (
          <section className="apple-pane-card">
            <div className="apple-pane-header">
              <div>
                <h2 className="apple-pane-title">Saved Timepieces</h2>
                <p className="apple-pane-desc">
                  Your private curation of Haute Horlogerie masterpieces.
                </p>
              </div>
            </div>

            {savedWatches.length === 0 ? (
              <div className="apple-empty-state">
                <div className="apple-empty-icon">
                  <Icons.Heart />
                </div>
                <h3 className="apple-empty-title">No Saved Timepieces</h3>
                <p className="apple-empty-text">
                  Heart any timepiece in the boutique catalog to save it in your private collector curation.
                </p>
                <button
                  type="button"
                  className="apple-primary-btn"
                  onClick={() => onNavigate && onNavigate("products", "#products")}
                >
                  Explore Collection →
                </button>
              </div>
            ) : (
              <div className="apple-cart-items-stack">
                {savedWatches.map((watch) => (
                  <div key={watch.id} className="apple-cart-card">
                    <div
                      className="apple-cart-card-img-wrap"
                      onClick={() => onNavigate && onNavigate("products", `#sku/${watch.sku || watch.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={watch.image}
                        alt={watch.name}
                        className="apple-cart-card-img"
                      />
                    </div>

                    <div
                      className="apple-cart-card-info"
                      onClick={() => onNavigate && onNavigate("products", `#sku/${watch.sku || watch.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="apple-cart-sku">{watch.sku}</span>
                      <h4 className="apple-cart-name">{watch.name}</h4>
                      {(() => {
                        const pricing = getWatchPricing(watch);
                        return (
                          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                            <span className="apple-cart-unit-price">{pricing.price}</span>
                            {pricing.hasDiscount && pricing.mrp && (
                              <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through", textDecorationColor: "#ef4444" }}>
                                {pricing.mrp}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="apple-cart-card-controls">
                      <button
                        type="button"
                        className="apple-primary-btn"
                        style={{ padding: "8px 16px", fontSize: "12px", width: "auto" }}
                        onClick={() => {
                          addToCart(watch, 1, true);
                        }}
                      >
                        + Add to Bag
                      </button>

                      <button
                        type="button"
                        className="apple-remove-btn"
                        onClick={() => toggleWishlist(watch.id)}
                        title="Remove from saved watches"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: ACCOUNT & PROFILE DETAILS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <section className="apple-pane-card">
            <div className="apple-pane-header">
              <div>
                <h2 className="apple-pane-title">Account Profile</h2>
                <p className="apple-pane-desc">
                  Your registered client details and account credentials.
                </p>
              </div>
            </div>

            <div className="apple-profile-details-card">
              <div className="apple-subcard-row">
                <span className="subcard-label">Full Name</span>
                <span className="subcard-value">{user.fullName || "Valued Client"}</span>
              </div>
              <div className="apple-subcard-row">
                <span className="subcard-label">Registered Email</span>
                <span className="subcard-value">{user.email}</span>
              </div>
              <div className="apple-subcard-row">
                <span className="subcard-label">Contact Phone</span>
                <span className="subcard-value">{user.phone || "Not provided"}</span>
              </div>
              <div className="apple-subcard-row">
                <span className="subcard-label">Collector Reference</span>
                <span className="subcard-value subcard-value--mono">{collectorRef}</span>
              </div>
              <div className="apple-subcard-row">
                <span className="subcard-label">Account Status</span>
                <span className="subcard-value text-green">
                  <Icons.Check /> Active & Verified
                </span>
              </div>
            </div>

            <div className="apple-pane-footer">
              <button
                type="button"
                className="apple-signout-btn"
                onClick={logout}
              >
                <Icons.LogOut />
                <span>Sign Out of Hanboro</span>
              </button>
            </div>
          </section>
        )}

      </main>

      {/* ── CANCELLATION CONFIRMATION MODAL ── */}
      {orderToCancel && (
        <div className="apple-modal-overlay" onClick={() => !cancelling && setOrderToCancel(null)} data-lenis-prevent="true">
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()} data-lenis-prevent="true">
            <div className="modal-alert-symbol">⚠️</div>
            <h3 className="modal-title">Cancel Order Allocation?</h3>
            <p className="modal-text">
              Are you sure you want to cancel order <strong>{orderToCancel.order_ref}</strong>? Your reserved timepiece will be released back to store inventory and a full refund of <strong>₹{Number(orderToCancel.total_amount).toLocaleString("en-IN")}</strong> will be credited to your account.
            </p>
            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-keep-btn"
                disabled={cancelling}
                onClick={() => setOrderToCancel(null)}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="modal-cancel-confirm-btn"
                disabled={cancelling}
                onClick={handleConfirmCancelOrder}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICIAL TAX INVOICE MODAL ── */}
      {viewingInvoiceOrder && (() => {
        const ord = viewingInvoiceOrder;
        const total = Number(ord.total_amount || 0);
        const taxableSubtotal = Math.round(total / 1.18);
        const totalTax = total - taxableSubtotal;
        const cgst = Math.round(totalTax / 2);
        const sgst = totalTax - cgst;
        const invoiceYear = new Date(ord.created_at || Date.now()).getFullYear();
        const invoiceNum = `INV-HNB-${invoiceYear}-${String(ord.order_ref || ord.id || "1001").replace(/[^\d]/g, "").slice(-4).padStart(4, "0")}`;
        const invoiceDate = new Date(ord.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const allProds = products && products.length > 0 ? products : PRODUCTS_DATA;
        const items = (ord.items || []).map((it) => enrichOrderItemWithSkuEan(it, allProds));
        const custName = ord.customer_name || (ord.shipping_address && ord.shipping_address.name) || user?.fullName || "Valued Horology Patron";
        const custEmail = ord.customer_email || user?.email || "client@hanborowatches.in";
        const custPhone = ord.customer_phone || (ord.shipping_address && ord.shipping_address.phone) || user?.phone || "+91 98300 11223";
        const shipAddress = ord.shipping_address || {};

        const isCod =
          (String(ord.payment_method || "").toLowerCase().includes("cod") ||
           String(ord.payment_method || "").toLowerCase().includes("cash on delivery") ||
           ord.payment_status === "Pending") && ord.payment_status !== "Paid";

        return (
          <div className="sp-invoice-overlay" role="dialog" aria-modal="true" data-lenis-prevent="true">
            <div className="sp-invoice-backdrop" onClick={() => setViewingInvoiceOrder(null)} />
            
            <div className="sp-invoice-toolbar">
              <div className="sp-invoice-toolbar-title">
                <span>Official Tax Invoice Preview</span>
                <code>{invoiceNum}</code>
              </div>
              <div className="sp-invoice-toolbar-actions">
                <button
                  type="button"
                  className="sp-btn sp-btn--primary"
                  onClick={() => window.print()}
                >
                  <span>Print Invoice / Save PDF</span>
                </button>
                <button
                  type="button"
                  className="sp-close-btn"
                  onClick={() => setViewingInvoiceOrder(null)}
                  title="Close Invoice Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="sp-invoice-sheet" id="hanboro-tax-invoice-sheet">
              <div className="sp-invoice-header">
                <div className="sp-invoice-brand">
                  <h1 className="sp-invoice-logo">HANBORO</h1>
                  <span className="sp-invoice-sublogo">HAUTE HORLOGERIE • ATELIER SUISSE & INDIA</span>
                  <div className="sp-invoice-issuer-details">
                    <strong>RISE N BE ORIGINAL LIFESTYLE PRIVATE LIMITED</strong><br />
                    Fourth Floor, Building No. 3, Block M, DLF City Phase II, Road Number 5, Sector 25<br />
                    Gurugram, Haryana - 122008, India<br />
                    <span><strong>GSTIN:</strong> 06AAMCR0380F1ZG</span> &nbsp;|&nbsp; <span><strong>HSN:</strong> 9102 (Wrist Watches)</span><br />
                    <span><strong>Concierge Desk:</strong> +91 88820 69334 &nbsp;|&nbsp; connect@hanborowatches.in</span>
                  </div>
                </div>

                <div className="sp-invoice-badge-box">
                  <div className="sp-invoice-title-badge">TAX INVOICE & BILL OF SUPPLY</div>
                  <div className="sp-invoice-meta-grid">
                    <div className="sp-inv-meta-row">
                      <span>Invoice Number:</span>
                      <strong>{invoiceNum}</strong>
                    </div>
                    <div className="sp-inv-meta-row">
                      <span>Invoice Date:</span>
                      <strong>{invoiceDate}</strong>
                    </div>
                    <div className="sp-inv-meta-row">
                      <span>Order Reference:</span>
                      <strong>{ord.order_ref || ord.id || "#1001"}</strong>
                    </div>
                  </div>

                  {isCod ? (
                    <div className="sp-invoice-paid-seal" style={{ borderColor: "#d97706", color: "#b45309" }}>
                      <span className="sp-paid-stamp" style={{ borderColor: "#d97706", color: "#b45309" }}>COD • DUE ON DELIVERY</span>
                      <span className="sp-paid-date">{ord.payment_method || "Cash on Delivery"}</span>
                    </div>
                  ) : (
                    <div className="sp-invoice-paid-seal">
                      <span className="sp-paid-stamp">PAID • VERIFIED</span>
                      <span className="sp-paid-date">{ord.payment_method || "Electronic Transfer"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="sp-invoice-addresses">
                <div className="sp-inv-address-box">
                  <div className="sp-inv-address-title">Billed & Consigned To:</div>
                  <strong>{custName}</strong><br />
                  {shipAddress.address ? <span>{shipAddress.address}<br /></span> : null}
                  <span>{shipAddress.city || "City"}, {shipAddress.state || "State"} {shipAddress.pin || shipAddress.pincode || ""}</span><br />
                  <span>India</span><br />
                  <span>Phone: {custPhone}</span><br />
                  <span>Email: {custEmail}</span>
                </div>
                <div className="sp-inv-address-box">
                  <div className="sp-inv-address-title">Shipment & Delivery Protocol:</div>
                  <strong>Delivery Channel:</strong> {ord.delivery_method || (isCod ? "Concierge White-Glove (COD)" : "Standard (Prepaid)")}<br />
                  <strong>Airway Bill (AWB):</strong> {ord.tracking_number || "EXP-983011"}<br />
                  <strong>Fulfillment Status:</strong> {ord.fulfillment_status || "In progress"}<br />
                  <strong>Packaging:</strong> Armored Tamper-Proof Wooden Presentation Box
                </div>
              </div>

              <table className="sp-invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Timepiece Reference & Description</th>
                    <th>HSN</th>
                    <th>Qty</th>
                    <th>Rate (₹)</th>
                    <th>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const itPrice = parseInt(String(it.price || total).replace(/[^\d]/g, ""), 10) || total;
                    const itQty = it.qty || it.quantity || 1;
                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{it.name}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            SKU: {it.sku} &bull; Model: {it.modelNumber || "Automatic"}
                          </div>
                        </td>
                        <td>9102</td>
                        <td>{itQty}</td>
                        <td>₹{itPrice.toLocaleString("en-IN")}</td>
                        <td>₹{(itPrice * itQty).toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="sp-invoice-totals-wrap">
                <div className="sp-invoice-totals">
                  <div className="sp-inv-tot-row">
                    <span>Taxable Subtotal (Excl. GST):</span>
                    <strong>₹{taxableSubtotal.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="sp-inv-tot-row">
                    <span>CGST (9%):</span>
                    <span>₹{cgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="sp-inv-tot-row">
                    <span>SGST (9%):</span>
                    <span>₹{sgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="sp-inv-tot-row sp-inv-tot-row--grand">
                    <span>Total Amount Billed (INR):</span>
                    <strong>₹{total.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              <div className="sp-invoice-footer">
                <p>This is an official computer-generated Tax Invoice and Bill of Supply issued by Rise N Be Original Lifestyle Pvt. Ltd., authorized distributor of Hanboro Haute Horlogerie in India.</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
