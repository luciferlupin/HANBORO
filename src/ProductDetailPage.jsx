import React, { useState, useEffect, useMemo } from "react";
import { PRODUCTS_DATA } from "./productsData";
import { useStore } from "./StoreContext";

export function ProductDetailPage({
  skuId,
  onNavigateBack,
  onSelectSku,
  onNavigateToStores
}) {
  const {
    products,
    getProductByIdOrSku,
    addToCart,
    buyNow,
  } = useStore();

  const product = useMemo(() => {
    return getProductByIdOrSku(skuId) || (products && products[0]) || PRODUCTS_DATA[0];
  }, [skuId, getProductByIdOrSku, products]);

  const [buyQty, setBuyQty] = useState(1);

  const [activeImage, setActiveImage] = useState(product?.image);
  const [isNightMode, setIsNightMode] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryContact, setInquiryContact] = useState("");
  const [inquiryCity, setInquiryCity] = useState("");
  const [inquirySent, setInquirySent] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  // Lightbox Modal state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // All images available for this timepiece
  const allImages = product.gallery && product.gallery.length > 0
    ? product.gallery
    : (product.altImages || [product.image]).map((img, i) => ({
        url: img,
        title: `${product.name} — View ${i + 1}`,
        label: `View 0${i + 1}`,
        caption: `Precision horological inspection of ${product.name}.`
      }));

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveImage(product.image);
    setIsNightMode(false);
    setIsZoomed(false);
    setShowInquiryForm(false);
    setInquirySent(false);
    setLightboxIndex(null);
  }, [skuId, product]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  const currentIndex = PRODUCTS_DATA.findIndex((p) => p.id === product.id);
  const prevProduct = currentIndex > 0 ? PRODUCTS_DATA[currentIndex - 1] : PRODUCTS_DATA[PRODUCTS_DATA.length - 1];
  const nextProduct = currentIndex < PRODUCTS_DATA.length - 1 ? PRODUCTS_DATA[currentIndex + 1] : PRODUCTS_DATA[0];

  // Related products from same collection or adjacent
  const relatedProducts = PRODUCTS_DATA.filter((p) => p.id !== product.id).slice(0, 3);

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const toggleNight = () => {
    if (!product.hasNightMode) return;
    const next = !isNightMode;
    setIsNightMode(next);
    setActiveImage(next ? product.nightImage : product.image);
  };

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySent(true);
    const subject = encodeURIComponent(`HANBORO Allocation Request - ${product.sku} (${product.name})`);
    const body = encodeURIComponent(
      `Hello Hanboro Concierge Team,\n\nI am requesting allocation for:\nReference: ${product.sku}\nModel: ${product.name}\nPrice: ${product.price}\n\nClient Name: ${inquiryName}\nContact: ${inquiryContact}\nCity: ${inquiryCity}\n\nPlease share acquisition details and boutique availability.`
    );
    window.open(`mailto:connect@hanborowatches.in?subject=${subject}&body=${body}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Inquiring for HANBORO Timepiece:\nModel: ${product.name}\nReference SKU: ${product.sku}\nPrice: ${product.price}\nWebsite: https://hanborowatches.in/#sku/${product.sku}`
    );
    window.open(`https://wa.me/918882069334?text=${text}`, "_blank");
  };

  const openLightboxForImage = (imgUrl) => {
    const idx = allImages.findIndex((item) => item.url === imgUrl);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  return (
    <div className="pdp-page-root">
      {/* ── TOP NAV BAR & BREADCRUMB ── */}
      <nav className="pdp-top-nav" aria-label="Breadcrumb navigation">
        <div className="pdp-nav-container">
          <button
            type="button"
            className="pdp-back-btn"
            onClick={onNavigateBack}
          >
            <span aria-hidden="true">←</span>
            <span>All Timepieces</span>
          </button>

          <div className="pdp-breadcrumbs">
            <span className="crumb-dim">Atelier</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-dim">{product.collectionName}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">{product.sku}</span>
          </div>

          <div className="pdp-sibling-nav">
            <button
              type="button"
              className="sibling-btn"
              onClick={() => onSelectSku(prevProduct.id)}
              title={`Previous: ${prevProduct.name}`}
            >
              <span>← Prev Reference</span>
            </button>
            <button
              type="button"
              className="sibling-btn"
              onClick={() => onSelectSku(nextProduct.id)}
              title={`Next: ${nextProduct.name}`}
            >
              <span>Next Reference →</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN PRODUCT HERO STAGE ── */}
      <section className="pdp-hero-stage">
        <div className="pdp-hero-container">
          {/* Left Column: Interactive Watch Gallery & Lens */}
          <div className="pdp-gallery-column">
            <div className="pdp-gallery-aura" />

            {product.hasNightMode && (
              <div className="pdp-lume-toggle-wrap">
                <button
                  type="button"
                  className={`pdp-lume-btn ${isNightMode ? "is-glow" : ""}`}
                  onClick={toggleNight}
                >
                  <span className="pdp-lume-dot" />
                  <span>{isNightMode ? "Super-LumiNova Activated" : "Daylight Mode"}</span>
                </button>
              </div>
            )}

            <div
              className={`pdp-main-image-box ${isZoomed ? "is-zoomed" : ""}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => openLightboxForImage(activeImage)}
              title="Click to view full-resolution lightbox gallery"
            >
              <img
                src={activeImage}
                alt={product.name}
                className="pdp-main-img"
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transform: "scale(2.2)"
                      }
                    : undefined
                }
              />
              <div className="pdp-zoom-guide">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Hover to zoom • Click for Fullscreen HD</span>
              </div>

              <button
                type="button"
                className="pdp-fullscreen-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightboxForImage(activeImage);
                }}
                aria-label="View fullscreen gallery"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            </div>

            {/* Thumbnail selector with photo labels */}
            {product.altImages && product.altImages.length > 1 && (
              <div className="pdp-thumbnails-strip">
                {product.altImages.map((img, i) => {
                  const galleryItem = product.gallery && product.gallery[i];
                  const label = galleryItem?.label || `View 0${i + 1}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`pdp-thumb-card ${activeImage === img ? "is-selected" : ""}`}
                      onClick={() => {
                        setActiveImage(img);
                        setIsNightMode(img.includes("night"));
                      }}
                      title={galleryItem?.title || `${product.name} view ${i + 1}`}
                    >
                      <img src={img} alt={`${product.name} view ${i + 1}`} />
                      <span className="pdp-thumb-badge">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Commercial & Key Specs */}
          <div className="pdp-details-column">
            <div className="pdp-sticky-wrap">
              <div className="pdp-meta-tags">
                <span className="pdp-category-pill">{product.collectionName}</span>
                <span className="pdp-tag-pill">{product.tag}</span>
              </div>

              <h1 className="pdp-title">{product.name}</h1>
              <p className="pdp-subtitle">{product.subtitle}</p>

              {/* Reference SKU & Copy Badge */}
              <div className="pdp-sku-row">
                <span className="sku-label">OFFICIAL REFERENCE:</span>
                <button
                  type="button"
                  className="pdp-sku-badge-btn"
                  onClick={handleCopySku}
                  title="Click to copy Reference SKU"
                >
                  <span>{copiedSku ? "✓ COPIED TO CLIPBOARD" : product.sku}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>

              {/* Pricing & Availability Ribbon */}
              <div className="pdp-price-ribbon">
                <div className="pdp-price-box">
                  <span className="pdp-price-val">{product.price}</span>
                  <span className="pdp-price-usd">({product.priceUsd} USD)</span>
                </div>
                <div className="pdp-avail-box">
                  <span className="pdp-avail-indicator">● {product.availability}</span>
                  <span className="pdp-avail-sub">Direct Allocation</span>
                </div>
              </div>

              {/* Summary Description */}
              <p className="pdp-summary-text">{product.summary}</p>

              {/* Key Bento Spec Tiles */}
              <div className="pdp-bento-preview">
                <div className="pdp-spec-card">
                  <span className="spec-card-label">CALIBER</span>
                  <span className="spec-card-val">{product.specs.movement.split(" ")[0]} {product.specs.movement.split(" ")[1]}</span>
                  <span className="spec-card-sub">{product.specs.frequency}</span>
                </div>
                <div className="pdp-spec-card">
                  <span className="spec-card-label">POWER RESERVE</span>
                  <span className="spec-card-val">{product.specs.powerReserve.split(" ")[0]} {product.specs.powerReserve.split(" ")[1]}</span>
                  <span className="spec-card-sub">Twin-Barrel</span>
                </div>
                <div className="pdp-spec-card">
                  <span className="spec-card-label">CASE PROFILE</span>
                  <span className="spec-card-val">{product.specs.caseDimensions.split(" ")[0]}</span>
                  <span className="spec-card-sub">{product.specs.waterResistance}</span>
                </div>
              </div>

              {/* Action Buttons / Commerce & Concierge Inquire */}
              <div className="pdp-action-section">
                {/* ── HIGH-CONVERSION COMMERCE ROW (ADD TO CART & BUY NOW) ── */}
                <div className="pdp-commerce-cta-row">
                  <div className="pdp-qty-stepper">
                    <button
                      type="button"
                      className="pdp-qty-btn"
                      onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="pdp-qty-val">{buyQty}</span>
                    <button
                      type="button"
                      className="pdp-qty-btn"
                      onClick={() => setBuyQty((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="pdp-add-cart-btn"
                    onClick={() => addToCart(product, buyQty, true)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>Add to Bag</span>
                  </button>

                  <button
                    type="button"
                    className="pdp-buy-now-btn"
                    onClick={() => buyNow(product)}
                  >
                    <span>Instant Buy Now</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>

                {!showInquiryForm ? (
                  <div className="pdp-buttons-row">
                    <button
                      type="button"
                      className="pdp-inquire-btn"
                      onClick={() => setShowInquiryForm(true)}
                    >
                      <span>Request Allocation & Viewing</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="pdp-whatsapp-btn"
                      onClick={shareWhatsApp}
                      title="Direct WhatsApp Consultation"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.39 1.3-1.92 1.38-.51.08-1.16.12-3.76-.96-3.13-1.3-5.14-4.5-5.3-4.71-.16-.21-1.28-1.7-1.28-3.25 0-1.54.81-2.3 1.1-2.61.28-.31.62-.39.83-.39.21 0 .41 0 .59.01.19.01.44-.07.69.52.25.6.86 2.11.94 2.27.08.16.13.35.03.56-.11.21-.16.34-.32.53-.16.19-.34.42-.48.56-.16.16-.33.33-.14.65.19.32.84 1.39 1.8 2.25 1.24 1.11 2.28 1.45 2.6 1.61.32.16.51.14.7-.08.19-.22.82-.95 1.04-1.28.22-.33.44-.27.74-.16.3.11 1.91.9 2.24 1.06.33.16.55.24.63.38.08.14.08.82-.16 1.5z"/>
                      </svg>
                      <span>WhatsApp VIP</span>
                    </button>

                    <button
                      type="button"
                      className="pdp-boutique-btn"
                      onClick={onNavigateToStores}
                    >
                      <span>Find in Boutique ↗</span>
                    </button>
                  </div>
                ) : (
                  <form className="pdp-inquiry-box" onSubmit={handleInquirySubmit}>
                    <div className="inquiry-box-head">
                      <h4>Reserve Allocation — {product.sku}</h4>
                      <button
                        type="button"
                        className="inquiry-box-close"
                        onClick={() => setShowInquiryForm(false)}
                      >
                        Cancel
                      </button>
                    </div>

                    {inquirySent ? (
                      <div className="inquiry-box-sent">
                        <p>✓ Allocation request prepared! Our concierge will contact you regarding <strong>{product.sku}</strong>.</p>
                      </div>
                    ) : (
                      <div className="inquiry-form-fields">
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name *"
                          value={inquiryName}
                          onChange={(e) => setInquiryName(e.target.value)}
                          className="pdp-input"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Phone / Email *"
                          value={inquiryContact}
                          onChange={(e) => setInquiryContact(e.target.value)}
                          className="pdp-input"
                        />
                        <input
                          type="text"
                          placeholder="City / Country"
                          value={inquiryCity}
                          onChange={(e) => setInquiryCity(e.target.value)}
                          className="pdp-input"
                        />
                        <button type="submit" className="pdp-submit-btn">
                          Submit Allocation Request ↗
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: HAUTE HORLOGERIE PHOTOGRAPHIC PORTFOLIO & GALLERY ── */}
      {allImages && allImages.length > 0 && (
        <section className="pdp-gallery-showcase-section">
          <div className="pdp-gallery-showcase-container">
            <div className="pdp-section-header">
              <span className="section-eyebrow">VISUAL HOROLOGY & PERSPECTIVES</span>
              <h2 className="section-title">Photographic Portfolio & Atelier Gallery</h2>
              <p className="section-desc">
                High-definition studio, sartorial on-wrist, and cinematic captures of Reference {product.sku}. Click any image to view in ultra-high resolution.
              </p>
            </div>

            <div className="pdp-gallery-grid">
              {allImages.map((item, index) => (
                <div
                  key={index}
                  className={`pdp-gallery-item-card ${index === 0 ? "is-featured" : ""}`}
                  onClick={() => setLightboxIndex(index)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setLightboxIndex(index); }}
                >
                  <div className="pdp-gallery-media-wrapper">
                    <img src={item.url} alt={item.title || product.name} loading="lazy" />
                    <div className="pdp-gallery-overlay">
                      <div className="pdp-gallery-overlay-badge">{item.label || `Angle 0${index + 1}`}</div>
                      <div className="pdp-gallery-overlay-action">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          <line x1="11" y1="8" x2="11" y2="14" />
                          <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                        <span>Enlarge Micro-Horology</span>
                      </div>
                    </div>
                  </div>
                  <div className="pdp-gallery-card-info">
                    <div className="pdp-gallery-card-title-row">
                      <span className="pdp-gallery-index">0{index + 1}</span>
                      <h4 className="pdp-gallery-item-title">{item.title}</h4>
                    </div>
                    {item.caption && <p className="pdp-gallery-item-caption">{item.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION: COMPLETE HOROLOGICAL SPECIFICATION MATRIX ── */}
      <section className="pdp-specs-section">
        <div className="pdp-specs-container">
          <div className="pdp-section-header">
            <span className="section-eyebrow">HOROLOGICAL ARCHITECTURE</span>
            <h2 className="section-title">Technical Specifications</h2>
            <p className="section-desc">
              Every component of {product.name} is meticulously assembled with Swiss-inspired precision.
            </p>
          </div>

          <div className="pdp-specs-table-box">
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Caliber / Movement</span>
              <span className="spec-item-v highlight-red">{product.specs.movement}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Frequency & Beat Rate</span>
              <span className="spec-item-v">{product.specs.frequency}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Power Reserve</span>
              <span className="spec-item-v highlight-bold">{product.specs.powerReserve}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Jewel Bearings</span>
              <span className="spec-item-v">{product.specs.jewels}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Case Dimensions</span>
              <span className="spec-item-v">{product.specs.caseDimensions} (Lug-to-Lug: {product.specs.lugToLug})</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Case Material & Finish</span>
              <span className="spec-item-v">{product.specs.caseMaterial}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Crystal Optics</span>
              <span className="spec-item-v">{product.specs.glass}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Caseback</span>
              <span className="spec-item-v">{product.specs.caseback}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Dial Finishing</span>
              <span className="spec-item-v">{product.specs.dial}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Water Resistance</span>
              <span className="spec-item-v highlight-bold">{product.specs.waterResistance}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Strap & Clasp</span>
              <span className="spec-item-v">{product.specs.strap} ({product.specs.clasp})</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Vault Packaging</span>
              <span className="spec-item-v">{product.specs.packaging}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: COMPLICATIONS SPOTLIGHT ── */}
      {product.specs?.complications && (
        <section className="pdp-complications-section">
          <div className="pdp-complications-container">
            <div className="pdp-section-header">
              <span className="section-eyebrow">KEY COMPLICATIONS</span>
              <h2 className="section-title">Master Complications</h2>
            </div>

            <div className="pdp-complications-grid">
              {product.specs.complications.map((comp, idx) => (
                <div key={idx} className="pdp-comp-card">
                  <span className="comp-card-num">0{idx + 1}</span>
                  <h3 className="comp-card-title">{comp}</h3>
                  <p className="comp-card-desc">
                    Engineered to the highest tolerances of Haute Horlogerie, delivering sublime tactile feedback and enduring mechanical reliability.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION: YOU MAY ALSO ADMIRE (RELATED TIMEPIECES) ── */}
      <section className="pdp-related-section">
        <div className="pdp-related-container">
          <div className="pdp-section-header">
            <span className="section-eyebrow">REPERTOIRE COMPANIONS</span>
            <h2 className="section-title">You May Also Admire</h2>
          </div>

          <div className="pdp-related-grid">
            {relatedProducts.map((rel) => (
              <article
                key={rel.id}
                className="pdp-related-card"
                onClick={() => onSelectSku(rel.id)}
              >
                <div className="related-media">
                  <img src={rel.image} alt={rel.name} />
                </div>
                <div className="related-details">
                  <span className="related-sku">REF. {rel.sku}</span>
                  <h3 className="related-name">{rel.name}</h3>
                  <span className="related-price">{rel.price}</span>
                  <span className="related-btn">Explore Reference ↗</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULLSCREEN HD LIGHTBOX MODAL ── */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div
          className="pdp-lightbox-backdrop"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="High Resolution Photo Gallery"
        >
          <div
            className="pdp-lightbox-stage"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Counter & Close */}
            <div className="pdp-lightbox-header">
              <div className="pdp-lightbox-counter">
                <span className="lightbox-cur">0{lightboxIndex + 1}</span>
                <span className="lightbox-slash">/</span>
                <span className="lightbox-tot">0{allImages.length}</span>
                <span className="lightbox-tag">— {allImages[lightboxIndex].label || `Perspective 0${lightboxIndex + 1}`}</span>
              </div>

              <div className="pdp-lightbox-tools">
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setLightboxIndex(null)}
                  title="Close Lightbox (Esc)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Stage Image */}
            <div className="pdp-lightbox-viewport">
              <button
                type="button"
                className="lightbox-nav-btn is-prev"
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                aria-label="Previous photo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="pdp-lightbox-img-wrap">
                <img
                  src={allImages[lightboxIndex].url}
                  alt={allImages[lightboxIndex].title}
                  className="pdp-lightbox-img"
                />
              </div>

              <button
                type="button"
                className="lightbox-nav-btn is-next"
                onClick={() => setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                aria-label="Next photo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Caption bar & thumbnail strip */}
            <div className="pdp-lightbox-footer">
              <div className="lightbox-caption-box">
                <h3 className="lightbox-img-title">{allImages[lightboxIndex].title}</h3>
                {allImages[lightboxIndex].caption && (
                  <p className="lightbox-img-desc">{allImages[lightboxIndex].caption}</p>
                )}
              </div>

              <div className="lightbox-thumb-tray">
                {allImages.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`lightbox-thumb-btn ${idx === lightboxIndex ? "is-active" : ""}`}
                    onClick={() => setLightboxIndex(idx)}
                    title={item.title}
                  >
                    <img src={item.url} alt={item.title} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
