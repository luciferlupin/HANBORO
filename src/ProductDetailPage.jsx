import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { PRODUCTS_DATA, getWatchPricing, getWatchModelKey, getWatchVariantLabel } from "./productsData";
import { useStore } from "./StoreContext";
import { forceScrollToTop } from "./scrollUtils";
import { metaPixelService } from "./metaPixel";
import { applyShopifyVariant } from "./shopifyClient";

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
    mrpDiscountConfig,
    getProductAvailability,
  } = useStore();

  const baseProduct = useMemo(() => {
    return getProductByIdOrSku(skuId) || (products && products.find((p) => p.id === skuId || p.sku === skuId)) || null;
  }, [skuId, getProductByIdOrSku, products]);

  const shopifyVariants = useMemo(
    () => Array.isArray(baseProduct?.shopifyVariants) ? baseProduct.shopifyVariants : [],
    [baseProduct],
  );
  const [selectedShopifyVariantId, setSelectedShopifyVariantId] = useState(null);
  const selectedShopifyVariant = useMemo(() => (
    shopifyVariants.find((variant) => variant.id === selectedShopifyVariantId) ||
    shopifyVariants.find((variant) => variant.id === baseProduct?.shopifyVariantId) ||
    shopifyVariants[0] ||
    null
  ), [baseProduct?.shopifyVariantId, selectedShopifyVariantId, shopifyVariants]);
  const product = useMemo(
    () => applyShopifyVariant(baseProduct, selectedShopifyVariant),
    [baseProduct, selectedShopifyVariant],
  );

  useEffect(() => {
    setSelectedShopifyVariantId(null);
  }, [skuId, baseProduct?.shopifyId]);

  const pricing = useMemo(() => getWatchPricing(product, mrpDiscountConfig), [product, mrpDiscountConfig]);

  const technicalSpecificationRows = useMemo(() => {
    if (!product) return [];
    // Compliance labels that must never appear in the specs table
    const COMPLIANCE_LABELS = /^(model|model number|reference|price|price \(mrp\)|country of origin|manufacturer|importer|packer|importer \/ packer|care instructions|warrantydetails)$/i;

    const rows = [];
    const seenLabels = new Set();

    if (Array.isArray(product.shopifySpecificationRows) && product.shopifySpecificationRows.length > 0) {
      for (const { label, value } of product.shopifySpecificationRows) {
        if (!label || !value) continue;
        const cleanL = String(label).trim();
        if (COMPLIANCE_LABELS.test(cleanL)) continue;
        const lowerL = cleanL.toLowerCase();
        if (seenLabels.has(lowerL)) continue;
        seenLabels.add(lowerL);
        rows.push({ label: cleanL, value: String(value).trim() });
      }
    }

    const specs = product.specs || {};
    const standardSpecs = [
      ["Movement", specs.movement],
      ["Frequency", specs.frequency],
      ["Power Reserve", specs.powerReserve],
      ["Power Reserve System", specs.powerReserveSystem],
      ["Jewels", specs.jewels],
      ["Case Size", specs.caseDimensions || specs.caseDiameter],
      ["Case Material", specs.caseMaterial],
      ["Bezel", specs.bezel],
      ["Glass", specs.glass],
      ["Caseback", specs.caseback],
      ["Dial", specs.dial],
      ["Hands", specs.hands],
      ["Lume", specs.lume],
      ["Crown", specs.crown],
      ["Water Resistance", specs.waterResistance],
      ["Strap", specs.strap],
      ["Clasp", specs.clasp],
      ["Lug-to-Lug", specs.lugToLug],
      ["Strap Width", specs.strapWidth],
      ["Strap Length", specs.strapLength],
      ["Thickness", specs.thickness || specs.caseThickness],
      ["Case Weight", specs.caseWeight],
      ["Winding", specs.winding],
      ["Date Display", specs.dateDisplay],
      ["Time Zone", specs.timeZone],
      ["Packaging", specs.packaging],
      ["Warranty", specs.warranty],
    ];

    for (const [label, value] of standardSpecs) {
      if (!value) continue;
      const cleanL = String(label).trim();
      const lowerL = cleanL.toLowerCase();
      if (seenLabels.has(lowerL)) continue;
      seenLabels.add(lowerL);
      rows.push({ label: cleanL, value: String(value).trim() });
    }

    return rows;
  }, [product]);

  // All color options / editions for the same watch model
  const modelVariants = useMemo(() => {
    if (!product) return [];
    const currentKey = getWatchModelKey(product);
    if (!currentKey) return [product];
    const all = Array.isArray(products) && products.length > 0 ? products : PRODUCTS_DATA;
    const matches = all.filter((p) => getWatchModelKey(p) === currentKey);
    return matches.length > 0 ? matches : [product];
  }, [product, products]);

  const [buyQty, setBuyQty] = useState(1);

  const [activeImage, setActiveImage] = useState(product?.image);
  const [isNightMode, setIsNightMode] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryContact, setInquiryContact] = useState("");
  const [inquiryCity, setInquiryCity] = useState("");
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  // Lightbox Modal state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // All images available for this timepiece with robust deduplication and metadata
  const allImages = useMemo(() => {
    if (!product) return [];
    const list = [];
    const seen = new Set();

    const pushImg = (url, title, label, caption) => {
      if (!url || typeof url !== "string" || url.endsWith(".mp4") || seen.has(url)) return;
      seen.add(url);
      list.push({
        url,
        title: title || `${product.name} — Perspective 0${list.length + 1}`,
        label: label || `0${list.length + 1} View`,
        caption: caption || `Precision horological inspection of ${product.name}.`
      });
    };

    // Primary product images
    if (Array.isArray(product.shopifyImages) && product.shopifyImages.length > 0) {
      product.shopifyImages.forEach((imgUrl, idx) => {
        pushImg(imgUrl, `${product.name} — Perspective 0${idx + 1}`, `0${idx + 1} View`, `Official boutique presentation of Reference ${product.sku}.`);
      });
    }

    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      product.gallery.forEach((g, idx) => {
        const u = typeof g === "string" ? g : g?.url;
        pushImg(u, g?.title, g?.label || `0${idx + 1} View`, g?.caption);
      });
    }

    if (Array.isArray(product.altImages)) {
      product.altImages.forEach((img, idx) => {
        const u = typeof img === "string" ? img : img?.url;
        pushImg(u, `${product.name} — Perspective 0${idx + 1}`, `0${idx + 1} View`, `Horological craftsmanship inspection of Reference ${product.sku}.`);
      });
    }

    if (list.length === 0 && product.image && !product.image.endsWith(".mp4")) {
      pushImg(product.image, `${product.name} — Front Dial View`, "01 Front View", `Official boutique presentation of ${product.name}.`);
    }

    return list;
  }, [product]);

  // Instant scroll to top on SKU change
  useLayoutEffect(() => {
    forceScrollToTop();
  }, [skuId]);

  useEffect(() => {
    if (!product) return;
    forceScrollToTop();
    const primaryImg = product.image || allImages[0]?.url;
    setActiveImage(primaryImg);
    setIsNightMode(false);
    setIsZoomed(false);
    setShowInquiryForm(false);
    setInquirySent(false);
    setLightboxIndex(null);
  }, [skuId, product, allImages]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null || allImages.length === 0) return;
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

  if (!product) {
    return (
      <div className="pdp-not-found" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⌛</div>
        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>Timepiece Not Found / Archived</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "440px", marginBottom: "24px", lineHeight: 1.5 }}>
          The requested reference ({skuId}) is no longer in the active boutique catalog or has been archived.
        </p>
        <button
          type="button"
          className="pdp-action-btn pdp-action-btn--primary"
          style={{ maxWidth: "260px", padding: "12px 24px", background: "#fa2d1d", color: "#ffffff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
          onClick={onNavigateBack}
        >
          Explore Active Collection ↗
        </button>
      </div>
    );
  }

  // Only master (non-clone) watches participate in Prev/Next reference navigation
  const masterCatalog = (products && products.length > 0 ? products : PRODUCTS_DATA)
    .filter((p) => !/-clone-/i.test(String(p.id)) && !/-clone-/i.test(String(p.sku || "")));
  const currentIndex = masterCatalog.findIndex((p) => p.id === product.id || p.sku === product.sku);
  const safeIdx = currentIndex >= 0 ? currentIndex : 0;
  const prevProduct = masterCatalog.length > 1
    ? (safeIdx > 0 ? masterCatalog[safeIdx - 1] : masterCatalog[masterCatalog.length - 1])
    : null;
  const nextProduct = masterCatalog.length > 1
    ? (safeIdx < masterCatalog.length - 1 ? masterCatalog[safeIdx + 1] : masterCatalog[0])
    : null;

  // Related products from same collection or adjacent (also no clones)
  const collectionMatches = masterCatalog
    .filter((p) => p.id !== product.id && p.sku !== product.sku)
    .filter((p) => !product.collection || p.collection === product.collection);
  const relatedProducts = (collectionMatches.length > 0 ? collectionMatches : masterCatalog.filter((p) => p.id !== product.id && p.sku !== product.sku)).slice(0, 3);

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

  // Meta Ads Pixel: Track ViewContent for the inspected timepiece
  useEffect(() => {
    if (product) {
      try {
        metaPixelService.trackViewContent(product);
      } catch (e) {
        console.warn("Meta Pixel ViewContent tracking error:", e);
      }
    }
  }, [product?.id, product?.sku]);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySent(true);

    try {
      metaPixelService.trackLead({
        content_name: product?.name,
        content_category: "Allocation Request",
        value: pricing?.salePriceNumeric || 0,
        currency: "INR",
      });
    } catch (e) {}

    const subject = encodeURIComponent(`HANBORO Allocation Request - ${product.sku} (${product.name})`);
    const body = encodeURIComponent(
      `Hello Hanboro Concierge Team,\n\nI am requesting allocation for:\nReference: ${product.sku}\nModel: ${product.name}\nPrice: ${product.price}\n\nClient Name: ${inquiryName}\nContact: ${inquiryContact}\nCity: ${inquiryCity}\n\nPlease share acquisition details and boutique availability.`
    );
    window.open(`mailto:connect@hanborowatches.in?subject=${subject}&body=${body}`, "_blank");
  };

  const shareWhatsApp = () => {
    try {
      metaPixelService.trackContact({
        method: "WhatsApp",
        sku: product?.sku,
        name: product?.name,
      });
    } catch (e) {}

    const text = encodeURIComponent(
      `Inquiring for HANBORO Timepiece:\nModel: ${product.name}\nReference SKU: ${product.sku}\nPrice: ${product.price}\nWebsite: https://www.hanborowatches.in/#sku/${product.sku}`
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
          <div className="pdp-nav-left">
            <button
              type="button"
              className="pdp-back-btn"
              onClick={() => {
                forceScrollToTop();
                onNavigateBack();
              }}
            >
              <span aria-hidden="true">←</span>
              <span>All Timepieces</span>
            </button>

            <span className="pdp-nav-divider" aria-hidden="true" />

            <div className="pdp-breadcrumbs">
              <span className="crumb-dim">Collection</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-dim">{product.collectionName || product.collection}</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-active">{product.sku}</span>
            </div>
          </div>

          <div className="pdp-sibling-nav">
            {prevProduct && (
              <button
                type="button"
                className="sibling-btn"
                onClick={() => {
                  forceScrollToTop();
                  onSelectSku(prevProduct.id);
                }}
                title={`Previous: ${prevProduct.name}`}
              >
                <span>← Prev Reference</span>
              </button>
            )}
            {nextProduct && (
              <button
                type="button"
                className="sibling-btn"
                onClick={() => {
                  forceScrollToTop();
                  onSelectSku(nextProduct.id);
                }}
                title={`Next: ${nextProduct.name}`}
              >
                <span>Next Reference →</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN PRODUCT HERO STAGE ── */}
      <section className="pdp-hero-stage">
        <div className="pdp-hero-container">
          {/* Left Column: Interactive Watch Gallery & Lens */}
          <div className="pdp-gallery-column">
            <div className="pdp-media-actions-bar">
              {product.hasNightMode && (
                <div className="pdp-lume-toggle-wrap">
                  <button
                    type="button"
                    className={`pdp-lume-btn ${isNightMode ? "is-glow" : ""}`}
                    onClick={toggleNight}
                    title="Toggle Super-LumiNova Night Illumination"
                  >
                    <span className="pdp-lume-dot" />
                    <span>{isNightMode ? "Super-LumiNova Activated" : "Daylight Mode"}</span>
                  </button>
                </div>
              )}

              {product.videoUrl && (
                <button
                  type="button"
                  className={`pdp-reel-trigger-btn ${activeImage === product.videoUrl ? "is-active" : ""}`}
                  onClick={() => {
                    if (activeImage === product.videoUrl) {
                      setActiveImage(product.image);
                    } else {
                      setActiveImage(product.videoUrl);
                      setIsNightMode(false);
                    }
                  }}
                  title="Watch Official Calibre Mechanical Movement Reel"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{activeImage === product.videoUrl ? "Return to Photos" : "Calibre Motion Reel (HD)"}</span>
                </button>
              )}
            </div>

            <div
              className={`pdp-main-image-box ${isZoomed && !activeImage?.endsWith(".mp4") ? "is-zoomed" : ""} ${activeImage?.endsWith(".mp4") ? "is-video-viewport" : ""}`}
              onMouseEnter={() => !activeImage?.endsWith(".mp4") && setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => !activeImage?.endsWith(".mp4") && openLightboxForImage(activeImage)}
              title={activeImage?.endsWith(".mp4") ? "Calibre In Motion • Official Reel" : "Click to view full-resolution lightbox gallery"}
            >
              {activeImage?.endsWith(".mp4") ? (
                <div className="pdp-video-container">
                  <video
                    src={activeImage}
                    className="pdp-main-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                  <div className="pdp-video-badge-tag">
                    <span className="pdp-video-dot" />
                    <span>CALIBRE IN MOTION • OFFICIAL REEL</span>
                  </div>
                </div>
              ) : (
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
              )}

              {!activeImage?.endsWith(".mp4") && (
                <>
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
                </>
              )}
            </div>

            {/* Thumbnail selector with photo labels and video reel */}
            {(allImages.length > 1 || product.videoUrl) && (
              <div className="pdp-thumbnails-strip" role="tablist" aria-label="Perspective thumbnails">
                {allImages.map((item, i) => {
                  const isSelected = activeImage === item.url;
                  return (
                    <button
                      key={item.url || i}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`pdp-thumb-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setActiveImage(item.url);
                        setIsNightMode(
                          item.url === product.nightImage ||
                          item.url.includes("night") ||
                          item.url.includes("lume")
                        );
                      }}
                      title={item.title || `${product.name} view ${i + 1}`}
                    >
                      <img src={item.url} alt={item.title || `${product.name} view ${i + 1}`} loading="lazy" />
                      <span className="pdp-thumb-badge">{item.label || `0${i + 1}`}</span>
                    </button>
                  );
                })}

                {product.videoUrl && (
                  <button
                    type="button"
                    className={`pdp-thumb-card pdp-thumb-video ${activeImage === product.videoUrl ? "is-selected" : ""}`}
                    onClick={() => {
                      setActiveImage(product.videoUrl);
                      setIsNightMode(false);
                    }}
                    title="Watch Official Calibre Motion Reel"
                  >
                    <div className="pdp-thumb-video-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fa2d1d">
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                    </div>
                    <span className="pdp-thumb-badge">Motion Reel</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Commercial & Key Specs */}
          <div className="pdp-details-column">
            <div className="pdp-sticky-wrap">
              <div className="pdp-meta-tags">
                <span className="pdp-category-pill">{product.collectionName || product.collection || "AUTOMATIC"}</span>
                <span className="pdp-tag-pill">{product.tag || "HAUTE HORLOGERIE"}</span>
              </div>

              <h1 className="pdp-title">{product.name}</h1>
              {product.subtitle && <p className="pdp-subtitle">{product.subtitle}</p>}

              {/* Reference SKU & Model Badge */}
              <div className="pdp-sku-row">
                {product.modelNumber && (
                  <span className="pdp-model-badge">MODEL {product.modelNumber || product.specs?.modelNumber}</span>
                )}
                <button
                  type="button"
                  className="pdp-sku-badge-btn"
                  onClick={handleCopySku}
                  aria-label="Copy reference SKU to clipboard"
                >
                  <span>{copiedSku ? "✓ COPIED" : `REF. ${product.sku}`}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>

              {/* Pricing & Availability Ribbon */}
              <div className="pdp-price-ribbon">
                <div className="pdp-price-box">
                  <div className="pdp-price-digits-row">
                    <span className="pdp-price-val">{pricing.price}</span>
                    {pricing.hasDiscount && pricing.mrp && (
                      <span className="pdp-mrp-cut">
                        <span className="pdp-mrp-label">MRP</span>
                        <span className="pdp-mrp-amount">{pricing.mrp}</span>
                      </span>
                    )}
                    {pricing.discountPercent ? (
                      <span className="pdp-discount-badge">{pricing.discountPercent}% OFF</span>
                    ) : null}
                  </div>
                  {pricing.hasDiscount && pricing.mrp && (
                    <div className="pdp-savings-callout">
                      <span className="pdp-savings-pill">
                        Special Privilege: Save {pricing.savingsFormatted} ({pricing.discountPercent}% OFF)
                      </span>
                    </div>
                  )}
                  <span className="pdp-price-subtext">Inclusive of all Taxes & Insured Express Air Courier</span>
                </div>
                <div className="pdp-avail-box">
                  <span className="pdp-avail-indicator">● {product.availability || "In Stock"}</span>
                  <span className="pdp-avail-sub">Dispatched within 24 Hours</span>
                </div>
              </div>

              {/* True Shopify variants for this exact product */}
              {shopifyVariants.length > 1 && (
                <div className="pdp-editions-section" aria-label="Choose watch variant">
                  <div className="pdp-editions-header">
                    <span className="pdp-editions-title">
                      {shopifyVariants[0]?.selectedOptions?.map((option) => option.name).join(" / ") || "Available Variants"} ({shopifyVariants.length})
                    </span>
                    <span className="pdp-editions-active-name">
                      {selectedShopifyVariant?.selectedOptions?.map((option) => option.value).join(" / ") || selectedShopifyVariant?.title}
                    </span>
                  </div>
                  <div className="pdp-editions-grid">
                    {shopifyVariants.map((variant) => {
                      const isSelected = variant.id === selectedShopifyVariant?.id;
                      const label = variant.selectedOptions?.map((option) => option.value).join(" / ") || variant.title;
                      const isOutOfStock = variant.availableForSale === false;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          className={`pdp-edition-card ${isSelected ? "is-active" : ""} ${isOutOfStock ? "is-oos" : ""}`}
                          onClick={() => setSelectedShopifyVariantId(variant.id)}
                          aria-pressed={isSelected}
                          title={`${label}${variant.sku ? ` — ${variant.sku}` : ""}`}
                        >
                          <div className="pdp-edition-thumb-wrap">
                            <img src={variant.image || baseProduct.image} alt={label} className="pdp-edition-thumb" loading="lazy" />
                            {isSelected && <span className="pdp-edition-check-badge">✓</span>}
                          </div>
                          <div className="pdp-edition-info">
                            <span className="pdp-edition-name">{label}</span>
                            <span className="pdp-edition-price">
                              {Number.isFinite(variant.price) ? `₹${variant.price.toLocaleString("en-IN")}` : pricing.price}
                            </span>
                            <span className={`pdp-edition-stock ${isOutOfStock ? "is-oos" : ""}`}>
                              {isOutOfStock ? "Sold out" : "Available"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Separate catalogue editions retained for legacy one-variant products */}
              {shopifyVariants.length <= 1 && modelVariants.length > 1 && (
                <div className="pdp-editions-section">
                  <div className="pdp-editions-header">
                    <span className="pdp-editions-title">
                      Available Editions / Colours ({modelVariants.length})
                    </span>
                    <span className="pdp-editions-active-name">
                      {getWatchVariantLabel(product)}
                    </span>
                  </div>

                  <div className="pdp-editions-grid">
                    {modelVariants.map((variant) => {
                      const isSelected = variant.id === product.id || variant.sku === product.sku;
                      const variantLabel = getWatchVariantLabel(variant);
                      const variantPricing = getWatchPricing(variant, mrpDiscountConfig);
                      const isOutOfStock = variant.stock === 0 || variant.availability === "Out of Stock";

                      return (
                        <button
                          key={variant.id || variant.sku}
                          type="button"
                          className={`pdp-edition-card ${isSelected ? "is-active" : ""} ${isOutOfStock ? "is-oos" : ""}`}
                          onClick={() => {
                            if (!isSelected && onSelectSku) {
                              onSelectSku(variant.id || variant.sku);
                            }
                          }}
                          title={`${variantLabel} — ${variantPricing.price} (${variant.sku})`}
                        >
                          <div className="pdp-edition-thumb-wrap">
                            <img
                              src={variant.image}
                              alt={variantLabel}
                              className="pdp-edition-thumb"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp";
                              }}
                            />
                            {isSelected && (
                              <span className="pdp-edition-check-badge">✓</span>
                            )}
                          </div>
                          <div className="pdp-edition-info">
                            <span className="pdp-edition-name">{variantLabel}</span>
                            <span className="pdp-edition-price">{variantPricing.price}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons / Primary Commerce Row */}
              <div className="pdp-action-section">
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

                  {(() => {
                    const avail = getProductAvailability(product);
                    return (
                      <>
                        <button
                          type="button"
                          className="pdp-add-cart-btn"
                          onClick={() => addToCart(product, buyQty, true)}
                          disabled={avail.isSoldOut}
                          style={avail.isSoldOut ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                          <span>{avail.isSoldOut ? "Sold Out" : "Add to Bag"}</span>
                        </button>

                        <button
                          type="button"
                          className="pdp-buy-now-btn"
                          onClick={() => buyNow(product)}
                          disabled={avail.isSoldOut}
                          style={avail.isSoldOut ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                        >
                          <span>{avail.isSoldOut ? "Currently Unavailable" : "Instant Buy Now"}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      </>
                    );
                  })()}
                </div>

                <div className="pdp-buttons-row">
                  <button
                    type="button"
                    className="pdp-boutique-btn"
                    onClick={onNavigateToStores}
                  >
                    <span>Find in Boutique ↗</span>
                  </button>
                </div>

                {/* VIP Video Consultation Banner */}
                <div
                  className="pdp-consultation-banner"
                  onClick={shareWhatsApp}
                  role="button"
                  tabIndex={0}
                  title="Book your video consultation on WhatsApp"
                >
                  <div className="pdp-consultation-left">
                    <div className="pdp-consultation-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.39 1.3-1.92 1.38-.51.08-1.16.12-3.76-.96-3.13-1.3-5.14-4.5-5.3-4.71-.16-.21-1.28-1.7-1.28-3.25 0-1.54.81-2.3 1.1-2.61.28-.31.62-.39.83-.39.21 0 .41 0 .59.01.19.01.44-.07.69.52.25.6.86 2.11.94 2.27.08.16.13.35.03.56-.11.21-.16.34-.32.53-.16.19-.34.42-.48.56-.16.16-.33.33-.14.65.19.32.84 1.39 1.8 2.25 1.24 1.11 2.28 1.45 2.6 1.61.32.16.51.14.7-.08.19-.22.82-.95 1.04-1.28.22-.33.44-.27.74-.16.3.11 1.91.9 2.24 1.06.33.16.55.24.63.38.08.14.08.82-.16 1.5z"/>
                      </svg>
                    </div>
                    <div className="pdp-consultation-text">
                      <div className="pdp-consultation-title">Book your</div>
                      <div className="pdp-consultation-desc">See this piece on a live call with a client advisor.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pdp-consultation-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareWhatsApp();
                    }}
                  >
                    <span>CLICK HERE</span>
                    <span className="pdp-consultation-arrow">›</span>
                  </button>
                </div>

                {/* Live Shopify Availability Badge */}
                {(() => {
                  const avail = getProductAvailability(product);
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block", flexShrink: 0 }} />
                        <span>Fastrr Fast Checkout • Express Dispatch</span>
                      </div>
                      {avail.isSoldOut ? (
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#ef4444", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", padding: "2px 8px", textTransform: "uppercase" }}>Sold Out</span>
                      ) : avail.isLowStock ? (
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "4px", padding: "2px 8px", textTransform: "uppercase" }}>Only {avail.quantityAvailable} Left</span>
                      ) : avail.isLiveSynced ? (
                        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "#10b981", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "4px", padding: "2px 8px", textTransform: "uppercase" }}>In Stock</span>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              {/* Key Bento Spec Tiles */}
              <div className="pdp-bento-preview">
                <div className="pdp-spec-card">
                  <span className="spec-card-label">CALIBER</span>
                  <span className="spec-card-val">
                    {product.specs?.movement ? product.specs.movement.split(" ").slice(0, 2).join(" ") : (product._shopifyLiveSynced ? "—" : "Automatic Calibre")}
                  </span>
                  {product.specs?.frequency && <span className="spec-card-sub">{product.specs.frequency}</span>}
                </div>
                <div className="pdp-spec-card">
                  <span className="spec-card-label">POWER RESERVE</span>
                  <span className="spec-card-val">{product.specs?.powerReserve || (product._shopifyLiveSynced ? "—" : "42 Hours")}</span>
                  {product.specs?.powerReserveSystem && <span className="spec-card-sub">{product.specs.powerReserveSystem}</span>}
                </div>
                <div className="pdp-spec-card">
                  <span className="spec-card-label">CASE & GLASS</span>
                  <span className="spec-card-val">
                    {product.specs?.caseDimensions || (product._shopifyLiveSynced ? "—" : "44mm")}
                  </span>
                  {(product.specs?.glass || product.specs?.waterResistance) && (
                    <span className="spec-card-sub">
                      {[product.specs?.glass, product.specs?.waterResistance].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary Description Narrative */}
              {(product.summary || product.description) && (
                <p className="pdp-summary-text">{product.summary || product.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: COMPLETE HOROLOGICAL SPECIFICATION MATRIX ── */}
      <section className="pdp-specs-section">
        <div className="pdp-specs-container">
          <div className="pdp-section-header">
            <span className="section-eyebrow">HOROLOGICAL ARCHITECTURE</span>
            <h2 className="section-title">Technical Specifications</h2>
          </div>

          <div className="pdp-specs-table-box">
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Model Number</span>
              <span className="spec-item-v highlight-bold">{product.modelNumber || product.specs?.modelNumber}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Reference</span>
              <span className="spec-item-v">{product.sku}</span>
            </div>
            <div className="pdp-spec-item-row">
              <span className="spec-item-k">Price (MRP)</span>
              <span className="spec-item-v highlight-red">{product.price} (Inclusive of Taxes)</span>
            </div>
            {technicalSpecificationRows.map(({ label, value }, index) => {
              const emphasized = /movement/i.test(label) ? "highlight-red" : /power reserve|water resistance/i.test(label) ? "highlight-bold" : "";
              return (
                <div className="pdp-spec-item-row" key={`${label}-${index}`}>
                  <span className="spec-item-k">{label}</span>
                  <span className={`spec-item-v ${emphasized}`.trim()}>{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION: HAUTE HORLOGERIE PHOTOGRAPHIC PORTFOLIO & GALLERY ── */}
      {allImages && allImages.length > 0 && (
        <section className="pdp-gallery-showcase-section">
          <div className="pdp-gallery-showcase-container">
            <div className="pdp-section-header">
              <span className="section-eyebrow">VISUAL HOROLOGY & PERSPECTIVES</span>
              <h2 className="section-title">Photographic Portfolio & Watch Gallery</h2>
            </div>

            <div className="pdp-gallery-grid">
              {product.videoUrl && (
                <div className="pdp-gallery-item-card pdp-gallery-video-card is-featured">
                  <div className="pdp-gallery-media-wrapper pdp-gallery-video-wrapper">
                    <video
                      src={product.videoUrl}
                      controls
                      playsInline
                      muted
                      autoPlay
                      loop
                      preload="metadata"
                      className="pdp-gallery-reel-video"
                    />
                    <div className="pdp-gallery-overlay-badge video-badge">
                      <span className="pdp-video-dot" /> OFFICIAL MOTION REEL
                    </div>
                  </div>
                  <div className="pdp-gallery-card-info">
                    <div className="pdp-gallery-card-title-row">
                      <span className="pdp-gallery-index">CALIBRE</span>
                      <h4 className="pdp-gallery-item-title">{product.name} — Calibre In Motion</h4>
                    </div>
                  </div>
                </div>
              )}

              {allImages.map((item, index) => (
                <div
                  key={index}
                  className={`pdp-gallery-item-card ${index === 0 && !product.videoUrl ? "is-featured" : ""}`}
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
                        <span>Enlarge</span>
                      </div>
                    </div>
                  </div>
                  <div className="pdp-gallery-card-info">
                    <div className="pdp-gallery-card-title-row">
                      <span className="pdp-gallery-index">0{index + 1}</span>
                      <h4 className="pdp-gallery-item-title">{item.title}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
                onClick={() => {
                  forceScrollToTop();
                  onSelectSku(rel.id);
                }}
              >
                <div className="related-media">
                  <img src={rel.image} alt={rel.name} />
                </div>
                <div className="related-details">
                  <span className="related-sku">REF. {rel.sku}</span>
                  <h3 className="related-name">{rel.name}</h3>
                  {(() => {
                    const relPricing = getWatchPricing(rel, mrpDiscountConfig);
                    return (
                      <div className="related-price-row" style={{ display: "flex", alignItems: "baseline", gap: "6px", margin: "4px 0" }}>
                        <span className="related-price">{relPricing.price}</span>
                        {relPricing.hasDiscount && relPricing.mrp && (
                          <span className="related-mrp-cut" style={{ fontSize: "11px", color: "#71717a", textDecoration: "line-through", textDecorationColor: "#ef4444" }}>
                            {relPricing.mrp}
                          </span>
                        )}
                        {relPricing.discountPercent ? (
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "#f87171", background: "rgba(239, 68, 68, 0.14)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "1px 4px", borderRadius: "3px" }}>
                            {relPricing.discountPercent}% OFF
                          </span>
                        ) : null}
                      </div>
                    );
                  })()}
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

      {/* ── MOBILE STICKY FLOATING BUY / CART BAR ── */}
      <div className="pdp-mobile-sticky-bar" aria-label="Quick Action Bar">
        <div className="pdp-mobile-sticky-info">
          <span className="pdp-mobile-sticky-sku">{product.sku}</span>
          <div className="pdp-mobile-sticky-pricing">
            <span className="pdp-mobile-sticky-price">{pricing.price}</span>
            {pricing.hasDiscount && pricing.mrp && (
              <span className="pdp-mobile-sticky-mrp">{pricing.mrp}</span>
            )}
            {pricing.discountPercent ? (
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#f87171", marginLeft: "4px" }}>
                {pricing.discountPercent}% OFF
              </span>
            ) : null}
          </div>
        </div>
        <div className="pdp-mobile-sticky-actions">
          <button
            type="button"
            className="pdp-mobile-sticky-bag-btn"
            onClick={() => addToCart(product, buyQty, true)}
            aria-label="Add to shopping bag"
          >
            Add to Bag
          </button>
          <button
            type="button"
            className="pdp-mobile-sticky-buy-btn"
            onClick={() => buyNow(product)}
            aria-label="Buy timepiece now"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
