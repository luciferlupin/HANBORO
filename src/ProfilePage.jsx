import React, { useState, useEffect } from "react";
import { useStore } from "./StoreContext";
import { ordersService, SUPABASE_URL } from "./supabaseClient";
import { HanboroLogo } from "./HanboroLogo";

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

  // If user is not logged in, prompt sign in
  useEffect(() => {
    if (!user) {
      // Auto open auth modal if guest lands on profile
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

  if (!user) {
    return (
      <div className="profile-page-guest-fallback">
        <div className="profile-guest-card">
          <div className="guest-emblem">
            <HanboroLogo theme="light" size={28} />
          </div>
          <h2 className="guest-title">Private Vault & Client Dossier</h2>
          <p className="guest-subtitle">
            Please sign in to access your personal watch allocations, active database shopping bag, and shipment tracking.
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

  return (
    <div className="profile-page-root">
      {/* ── PROFILE TOP BAR ── */}
      <header className="profile-topbar">
        <div className="profile-topbar-left">
          <button
            type="button"
            className="profile-back-link"
            onClick={() => onNavigate && onNavigate("products", "#products")}
          >
            ← Return to Timepieces
          </button>
          <div className="profile-brand-wrap">
            <HanboroLogo theme="light" size={20} />
            <span className="profile-brand-tag">CLIENT VAULT</span>
          </div>
        </div>

        <div className="profile-topbar-right">
          <div className="profile-db-status-pill">
            <span className="live-dot" />
            <span>Private Vault Active</span>
          </div>
          {isAdmin && (
            <button
              type="button"
              className="profile-admin-nav-btn"
              onClick={() => onNavigate && onNavigate("admin", "#admin")}
            >
              ⚙️ Admin Suite ↗
            </button>
          )}
          <button
            type="button"
            className="profile-topbar-logout"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="profile-main-container">
        
        {/* ── TOP HERO DOSSIER CARD ── */}
        <section className="profile-hero-card">
          <div className="profile-hero-left">
            <div className="profile-avatar-large">
              <span>{userInitial}</span>
            </div>
            <div className="profile-hero-info">
              <div className="hero-name-row">
                <h1 className="hero-user-name">{user.fullName || "Valued Client"}</h1>
                <span className="hero-tier-badge">
                  {isAdmin ? "✦ Verified Atelier Executive" : "✦ Private Vault Member"}
                </span>
              </div>
              <p className="hero-user-email">{user.email}</p>
              {user.phone && <p className="hero-user-phone">📞 {user.phone}</p>}
            </div>
          </div>

          <div className="profile-hero-stats">
            <div className="profile-stat-box">
              <span className="stat-label">COLLECTOR REFERENCE</span>
              <span className="stat-val stat-val--code">
                {user.id ? `HNB-${user.id.slice(0, 8).toUpperCase()}` : "HNB-MEMBER"}
              </span>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">BAG ITEMS</span>
              <span className="stat-val">{cartCount} Timepieces</span>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">CONFIRMED ORDERS</span>
              <span className="stat-val">{userOrders.length} Allocations</span>
            </div>
          </div>
        </section>

        {/* ── PAGE NAVIGATION TABS ── */}
        <nav className="profile-section-nav" aria-label="Profile Tabs">
          <button
            type="button"
            className={`profile-nav-pill ${activeTab === "bag" ? "is-active" : ""}`}
            onClick={() => setActiveTab("bag")}
          >
            <span className="pill-icon">🛍️</span>
            <span className="pill-title">Active Shopping Bag</span>
            <span className="pill-badge">{cartCount}</span>
          </button>

          <button
            type="button"
            className={`profile-nav-pill ${activeTab === "orders" ? "is-active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span className="pill-icon">📦</span>
            <span className="pill-title">Orders & Allocations</span>
            <span className="pill-badge">{userOrders.length}</span>
          </button>

          <button
            type="button"
            className={`profile-nav-pill ${activeTab === "settings" ? "is-active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <span className="pill-icon">🛡️</span>
            <span className="pill-title">Client Profile & Privileges</span>
          </button>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: ACTIVE DATABASE BAG
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "bag" && (
          <section className="profile-pane-card">
            <div className="pane-title-row">
              <div>
                <h2 className="pane-heading">Active Shopping Bag</h2>
                <p className="pane-subtext">
                  Your selected timepieces are persistently stored in the Supabase <code>cart_items</code> database.
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="pane-clear-cart-btn"
                  onClick={clearCart}
                >
                  Clear Bag
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="profile-empty-bag-state">
                <div className="empty-bag-icon">🛍️</div>
                <h3 className="empty-bag-title">Your Database Bag is Empty</h3>
                <p className="empty-bag-desc">
                  Browse the Hanboro Haute Horlogerie catalog and allocate masterpieces directly to your account.
                </p>
                <button
                  type="button"
                  className="profile-action-btn profile-action-btn--primary"
                  onClick={() => onNavigate && onNavigate("products", "#products")}
                >
                  Explore Timepiece Collection →
                </button>
              </div>
            ) : (
              <div className="profile-cart-table-wrap">
                <div className="profile-table-container">
                  <table className="profile-cart-table">
                    <thead>
                      <tr>
                        <th>Timepiece</th>
                        <th>Reference</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const numericPrice =
                          parseInt(
                            item.product.price.toString().replace(/[^\d]/g, ""),
                            10
                          ) || 0;
                        const lineTotal = numericPrice * item.quantity;

                        return (
                          <tr key={item.product.id}>
                            <td className="timepiece-cell">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="timepiece-cell-img"
                              />
                              <div>
                                <strong className="timepiece-cell-name">{item.product.name}</strong>
                                <span className="timepiece-cell-collection">{item.product.collectionName || "Haute Horlogerie"}</span>
                              </div>
                            </td>
                            <td>
                              <code className="timepiece-cell-sku">{item.product.sku}</code>
                            </td>
                            <td>
                              <span className="timepiece-cell-price">{item.product.price}</span>
                            </td>
                            <td>
                              <div className="profile-table-qty-stepper">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                >
                                  −
                                </button>
                                <span className="qty-val">{item.quantity}</span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>
                              <strong className="timepiece-cell-total">
                                ₹{lineTotal.toLocaleString("en-IN")}
                              </strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="table-remove-btn"
                                onClick={() => removeFromCart(item.product.id)}
                                title="Remove from bag"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cart Summary Banner */}
                <div className="profile-cart-summary-banner">
                  <div className="summary-banner-left">
                    <span className="banner-tag">COMPLIMENTARY PRIVILEGE</span>
                    <p className="banner-desc">
                      ✓ Insured White-Glove Express Courier & Wooden Presentation Case included.
                    </p>
                  </div>

                  <div className="summary-banner-right">
                    <div className="summary-price-col">
                      <span className="summary-price-label">ESTIMATED TOTAL</span>
                      <span className="summary-price-val">₹{subtotalInr.toLocaleString("en-IN")}</span>
                    </div>

                    <button
                      type="button"
                      className="profile-checkout-primary-btn"
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
            TAB 2: ORDERS & ALLOCATIONS HISTORY
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <section className="profile-pane-card">
            <div className="pane-title-row">
              <div>
                <h2 className="pane-heading">Your Order Allocations</h2>
                <p className="pane-subtext">
                  Direct history of confirmed purchases and delivery dossiers stored in Supabase <code>orders</code>.
                </p>
              </div>
            </div>

            {loadingOrders ? (
              <div className="profile-loading-orders-state">
                <span className="btn-spinner">Querying Supabase Database...</span>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="profile-empty-orders-state">
                <div className="empty-orders-icon">📦</div>
                <h3 className="empty-orders-title">No Confirmed Orders Found</h3>
                <p className="empty-orders-desc">
                  You haven't placed any watch orders yet. Your confirmed purchases and tracking airway bills will appear here.
                </p>
                <button
                  type="button"
                  className="profile-action-btn profile-action-btn--primary"
                  onClick={() => onNavigate && onNavigate("products", "#products")}
                >
                  Browse Catalog →
                </button>
              </div>
            ) : (
              <div className="profile-orders-grid">
                {userOrders.map((ord) => (
                  <div key={ord.id || ord.order_ref} className="profile-full-order-card">
                    <div className="order-card-header">
                      <div className="order-header-left">
                        <span className="order-ref-title">{ord.order_ref}</span>
                        <span className="order-placed-date">
                          Placed on {new Date(ord.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="order-header-right">
                        <span className={`order-status-badge order-status-badge--${ord.order_status?.toLowerCase()}`}>
                          {ord.order_status || "Processing"}
                        </span>
                      </div>
                    </div>

                    <div className="order-card-body">
                      <div className="order-items-sublist">
                        {ord.items &&
                          ord.items.map((it, idx) => (
                            <div key={idx} className="order-item-detail-row">
                              {it.image && (
                                <img src={it.image} alt={it.name} className="order-item-thumb" />
                              )}
                              <div className="order-item-desc">
                                <strong className="order-item-title">{it.name}</strong>
                                <span className="order-item-ref">SKU: {it.sku}</span>
                              </div>
                              <div className="order-item-qty-price">
                                <span>Qty: {it.quantity || 1}</span>
                                <strong>{it.price || `₹${ord.total_amount}`}</strong>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="order-card-footer-info">
                        <div className="footer-info-block">
                          <span className="info-block-label">PAYMENT METHOD</span>
                          <span className="info-block-val">{ord.payment_method || "Credit Card"}</span>
                        </div>
                        <div className="footer-info-block">
                          <span className="info-block-label">AIRWAY BILL / TRACKING</span>
                          <span className="info-block-val tracking-code">{ord.tracking_number || "Awaiting Dispatch"}</span>
                        </div>
                        <div className="footer-info-block footer-info-block--total">
                          <span className="info-block-label">TOTAL ALLOCATION</span>
                          <span className="info-block-total-val">₹{Number(ord.total_amount).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: CLIENT PRIVILEGES & ACCOUNT DETAILS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <section className="profile-pane-card">
            <div className="pane-title-row">
              <div>
                <h2 className="pane-heading">Client Profile & Atelier Privileges</h2>
                <p className="pane-subtext">
                  Your registered collector identity, private concierge status, and delivery preferences.
                </p>
              </div>
            </div>

            <div className="profile-settings-grid">
              <div className="settings-card">
                <h3 className="settings-card-title">Collector Profile</h3>
                <div className="settings-row">
                  <span className="settings-label">Full Name</span>
                  <span className="settings-val">{user.fullName || "Valued Client"}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Email Address</span>
                  <span className="settings-val">{user.email}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Contact Phone</span>
                  <span className="settings-val">{user.phone || "Not provided"}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Membership Tier</span>
                  <span className="settings-val">{isAdmin ? "Atelier Executive" : "Private Vault Collector"}</span>
                </div>
              </div>

              <div className="settings-card">
                <h3 className="settings-card-title">Private Vault Privileges</h3>
                <div className="settings-row">
                  <span className="settings-label">Collector Reference</span>
                  <span className="settings-val settings-val--code">
                    {user.id ? `HNB-${user.id.slice(0, 8).toUpperCase()}` : "HNB-MEMBER"}
                  </span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">White-Glove Shipping</span>
                  <span className="settings-val text-green">✓ Complimentary Insured Courier</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Horology Concierge</span>
                  <span className="settings-val text-green">🟢 Active & Available</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Presentation Packaging</span>
                  <span className="settings-val text-green">✓ Lacquer Display Box Included</span>
                </div>
              </div>
            </div>

            <div className="profile-settings-actions">
              <button
                type="button"
                className="profile-logout-danger-btn"
                onClick={logout}
              >
                Sign Out of Hanboro Atelier
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
