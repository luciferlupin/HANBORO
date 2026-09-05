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

            <p className="cart-secure-notice">
              🔒 256-Bit Encrypted Secure Checkout • Official Brand Guarantee
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
