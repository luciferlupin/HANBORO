import React, { useState, useEffect } from "react";
import { useStore } from "./StoreContext";
import { HanboroLogo } from "./HanboroLogo";

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    removeFromCart,
    updateQuantity,
    subtotalInr,
    discountAmount,
    finalTotalInr,
    finalTotalUsd,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    openCheckout,
  } = useStore();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [luxuryGiftBox, setLuxuryGiftBox] = useState(true);

  // Lock background body scroll and pause Lenis while Cart Drawer is open
  useEffect(() => {
    if (!isCartOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoError("");
      setPromoInput("");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="luxury-cart-backdrop"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
        data-lenis-prevent="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className="luxury-cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        data-lenis-prevent="true"
      >
        {/* Drawer Header */}
        <div className="cart-drawer-head">
          <div className="cart-head-title-wrap">
            <HanboroLogo theme="light" size={20} />
            <span className="cart-count-badge">({cartCount} {cartCount === 1 ? "piece" : "pieces"})</span>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close bag"
          >
            ✕
          </button>
        </div>

        {/* Security & White Glove Ribbon */}
        <div className="cart-security-ribbon">
          <span className="ribbon-icon">🛡️</span>
          <div className="ribbon-text">
            <strong>Complimentary Insured Courier</strong>
            <span>Direct from Official Store • Hand-Delivered with Certificate</span>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">⌚</div>
              <h3>Your Shopping Bag is Empty</h3>
              <p>Explore our limited edition timepieces and select a watch to order.</p>
              <button
                type="button"
                className="cart-browse-btn"
                onClick={() => {
                  setIsCartOpen(false);
                  window.location.hash = "#products";
                }}
              >
                Browse Watches →
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="cart-item-card">
                  <div className="cart-item-thumb">
                    <img src={product.image} alt={product.name} />
                  </div>

                  <div className="cart-item-details">
                    <div className="cart-item-top">
                      <span className="cart-item-sku">REF. {product.sku}</span>
                      <button
                        type="button"
                        className="cart-item-remove-btn"
                        onClick={() => removeFromCart(product.id)}
                        title="Remove timepiece"
                        aria-label={`Remove ${product.name}`}
                      >
                        ✕
                      </button>
                    </div>

                    <h4 className="cart-item-name">{product.name}</h4>
                    <p className="cart-item-collection">{product.collectionName}</p>

                    <div className="cart-item-bottom">
                      <div className="cart-item-qty-controls">
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-val">{quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => updateQuantity(product.id, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-pricing">
                        <span className="cart-item-price-main">{product.price}</span>
                        <span className="cart-item-price-sub">({product.priceUsd})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Complimentary Luxury Presentation Box Option */}
              <div className="cart-addon-box">
                <label className="addon-checkbox-label">
                  <input
                    type="checkbox"
                    checked={luxuryGiftBox}
                    onChange={(e) => setLuxuryGiftBox(e.target.checked)}
                  />
                  <div className="addon-text">
                    <span className="addon-title">🎁 Complimentary Wooden Luxury Presentation Box</span>
                    <span className="addon-desc">Includes micro-fiber polishing kit, warranty card, and collector guide.</span>
                  </div>
                </label>
              </div>

              {/* Promo Code Voucher Section */}
              <div className="cart-promo-section">
                {appliedPromo ? (
                  <div className="cart-applied-promo">
                    <div className="applied-promo-info">
                      <span className="promo-badge">✓ {appliedPromo.code}</span>
                      <span className="promo-desc">{appliedPromo.label}</span>
                    </div>
                    <button
                      type="button"
                      className="promo-remove-btn"
                      onClick={removePromoCode}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form className="cart-promo-form" onSubmit={handleApplyPromo}>
                    <input
                      type="text"
                      className="promo-input"
                      placeholder="Discount Code (e.g. HANBORO10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                    />
                    <button type="submit" className="promo-apply-btn">
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <p className="promo-error-msg">{promoError}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {cart.length > 0 && (
          <div className="cart-drawer-foot">
            <div className="cart-summary-table">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotalInr.toLocaleString("en-IN")}</span>
              </div>

              {appliedPromo && (
                <div className="summary-row summary-row--discount">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>−₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Insured Express Courier</span>
                <span className="free-shipping-tag">COMPLIMENTARY</span>
              </div>

              <div className="summary-row">
                <span>GST & Taxes</span>
                <span className="tax-included-tag">INCLUDED</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row summary-row--total">
                <div className="total-label-wrap">
                  <span className="total-main-label">Estimated Total</span>
                  <span className="total-usd-label">approx. ${finalTotalUsd.toLocaleString("en-US")} USD</span>
                </div>
                <span className="total-val">₹{finalTotalInr.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              type="button"
              className="cart-checkout-btn"
              onClick={() => openCheckout(null)}
            >
              <span>Proceed to Checkout</span>
              <span className="checkout-arrow">→</span>
            </button>

            <a
              href={`https://wa.me/918882069334?text=${encodeURIComponent(
                `Hello HANBORO Concierge,\n\nI would like to inquire / order the items in my shopping bag:\n${cart.map((item) => `• ${item.name} (Qty: ${item.quantity}) - ₹${(item.priceInr * item.quantity).toLocaleString("en-IN")}`).join("\n")}\n\nEstimated Total: ₹${finalTotalInr.toLocaleString("en-IN")}\n\nPlease assist with acquisition and priority courier.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cart-whatsapp-order-btn"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.33 7.34 9 7.42 8.73 7.71C8.46 8 7.7 8.72 7.7 10.18C7.7 11.64 8.76 13.05 8.91 13.25C9.06 13.45 10.97 16.4 13.88 17.66C14.58 17.96 15.12 18.14 15.54 18.28C16.24 18.5 16.88 18.47 17.39 18.39C17.96 18.31 19.14 17.68 19.39 16.99C19.64 16.3 19.64 15.71 19.56 15.58C19.48 15.46 19.28 15.39 18.98 15.24C18.68 15.09 17.21 14.37 16.94 14.27C16.67 14.17 16.47 14.12 16.27 14.42C16.07 14.72 15.5 15.39 15.33 15.58C15.16 15.77 14.99 15.8 14.69 15.65C14.39 15.5 13.43 15.19 12.29 14.17C11.4 13.38 10.8 12.4 10.63 12.1C10.46 11.8 10.61 11.64 10.76 11.49C10.9 11.35 11.07 11.13 11.22 10.96C11.37 10.79 11.42 10.66 11.52 10.47C11.62 10.27 11.57 10.1 11.5 9.95C11.42 9.8 10.85 8.4 10.61 7.82C10.38 7.27 10.14 7.34 9.96 7.33C9.79 7.33 9.59 7.34 9.53 7.34Z"/>
              </svg>
              <span>Order via WhatsApp (+91 88820 69334)</span>
            </a>

            <p className="cart-secure-notice">
              🔒 256-Bit Encrypted Secure Checkout • Official Brand Guarantee
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
