import React, { useState, useEffect } from "react";
import { useStore } from "./StoreContext";
import { ordersService } from "./supabaseClient";
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
  } = useStore();

  const [activeTab, setActiveTab] = useState("bag"); // "bag" | "orders" | "settings"
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

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
          <h2 className="guest-title">Private Vault & Client Dossier</h2>
          <p className="guest-subtitle">
            Sign in to access your personal timepiece collection, active shopping bag, and shipment tracking.
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
            <span className="apple-topbar-badge">ATELIER VAULT</span>
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
                          <span className="apple-cart-unit-price">{item.product.price}</span>
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
                      <span>2-Year International Atelier Guarantee</span>
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
                          <span className="stat-label">AIRWAY BILL / TRACKING</span>
                          <span className="stat-value stat-value--mono">{ord.tracking_number || "Awaiting Dispatch"}</span>
                        </div>
                        <div className="apple-footer-stat apple-footer-stat--total">
                          <span className="stat-label">TOTAL ALLOCATION</span>
                          <span className="stat-value-total">₹{Number(ord.total_amount).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                <span>Sign Out of Hanboro Atelier</span>
              </button>
            </div>
          </section>
        )}

      </main>

      {/* ── CANCELLATION CONFIRMATION MODAL ── */}
      {orderToCancel && (
        <div className="apple-modal-overlay" onClick={() => !cancelling && setOrderToCancel(null)}>
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-alert-symbol">⚠️</div>
            <h3 className="modal-title">Cancel Order Allocation?</h3>
            <p className="modal-text">
              Are you sure you want to cancel order <strong>{orderToCancel.order_ref}</strong>? Your reserved timepiece will be released back to atelier inventory and a full refund of <strong>₹{Number(orderToCancel.total_amount).toLocaleString("en-IN")}</strong> will be credited to your account.
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
    </div>
  );
}
