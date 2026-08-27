import React, { useState, useMemo, useRef, useEffect } from "react";
import { CATEGORIES, PRODUCTS_DATA } from "./productsData";
import { CompareModal } from "./CompareModal";
import { useStore } from "./StoreContext";

export function ProductsView({
  selectedSkuId,
  onSelectSku,
  onNavigateHome,
  onNavigateToStores
}) {
  const { addToCart, buyNow } = useStore();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [comparedIds, setComparedIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [sortOrder, setSortOrder] = useState("DEFAULT");

  const heroSpotlightList = useMemo(() => {
    return [
      PRODUCTS_DATA.find((p) => p.id === "stealth-fighter-jet-tonneau") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "sichuan-opera-diamond-tonneau") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "arachnid-geometric-skeleton") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "architectural-skeleton-black") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "forged-carbon-tonneau-tourbillon") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "aurora-celestial-frost") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "octagonal-diamond-celestial") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "octagonal-diamond-bronze") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "octagonal-diamond-emerald") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "astroworld-celestial") || PRODUCTS_DATA[0],
      PRODUCTS_DATA.find((p) => p.id === "clover-king-crimson") || PRODUCTS_DATA[1],
      PRODUCTS_DATA.find((p) => p.id === "emerald-roulette") || PRODUCTS_DATA[2],
      PRODUCTS_DATA.find((p) => p.id === "octagonal-blue") || PRODUCTS_DATA[3]
    ].filter(Boolean);
  }, []);

  const activeHeroWatch = heroSpotlightList[activeHeroIndex] || heroSpotlightList[0];

  // Active product for detail modal
  const activeProduct = useMemo(() => {
    if (!selectedSkuId) return null;
    return (
      PRODUCTS_DATA.find(
        (p) => p.id === selectedSkuId || p.sku.toLowerCase() === selectedSkuId.toLowerCase()
      ) || null
    );
  }, [selectedSkuId]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS_DATA];

    // Category filter
    if (activeCategory !== "ALL") {
      list = list.filter((p) => p.collection === activeCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.collectionName.toLowerCase().includes(q) ||
          p.specs.movement.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q) ||
          p.specs.complications?.some((c) => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortOrder === "PRICE_DESC") {
      list.sort((a, b) => parseInt(b.price.replace(/[^\d]/g, "")) - parseInt(a.price.replace(/[^\d]/g, "")));
    } else if (sortOrder === "PRICE_ASC") {
      list.sort((a, b) => parseInt(a.price.replace(/[^\d]/g, "")) - parseInt(b.price.replace(/[^\d]/g, "")));
    }

    return list;
  }, [activeCategory, searchQuery, sortOrder]);

  // Comparison helpers
  const handleToggleCompare = (product, e) => {
    if (e) e.stopPropagation();
    setComparedIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 timepieces simultaneously.");
        return prev;
      }
      return [...prev, product.id];
    });
  };

  const comparedProducts = useMemo(() => {
    return PRODUCTS_DATA.filter((p) => comparedIds.includes(p.id));
  }, [comparedIds]);

  const handleProductClick = (product) => {
    if (onSelectSku) {
      onSelectSku(product.id);
    }
  };

  const closeModal = () => {
    if (onSelectSku) {
      onSelectSku(null);
    }
  };

  return (
    <div className="apple-catalog-view" id="products-catalog">
      {/* ── CINEMATIC APPLE-STYLE SPOTLIGHT STAGE ── */}
      <section className="apple-spotlight-stage" aria-label="Featured Masterpiece Spotlight">
        <div className="spotlight-stage__backdrop" />
        <div className="spotlight-stage__aura" />

        <div className="spotlight-stage__container">
          <div className="spotlight-content-side">
            <div className="spotlight-eyebrow">
              <span className="spotlight-pill">ATELIER SPOTLIGHT</span>
              <span className="spotlight-sku-ref">REF. {activeHeroWatch.sku}</span>
            </div>

            <h1 className="spotlight-title">{activeHeroWatch.name}</h1>
            <p className="spotlight-desc">{activeHeroWatch.summary}</p>

            {/* Apple-grade Key Specs Pill Row */}
            <div className="spotlight-specs-row">
              <div className="spotlight-spec-chip">
                <span className="chip-value">{activeHeroWatch.specs.frequency}</span>
                <span className="chip-label">High-Beat Beat</span>
              </div>
              <div className="spotlight-spec-chip">
                <span className="chip-value">{activeHeroWatch.specs.powerReserve}</span>
                <span className="chip-label">Power Reserve</span>
              </div>
              <div className="spotlight-spec-chip">
                <span className="chip-value">{activeHeroWatch.specs.waterResistance}</span>
                <span className="chip-label">Aquatic Seal</span>
              </div>
            </div>

            <div className="spotlight-cta-row">
              <button
                type="button"
                className="apple-primary-btn"
                onClick={() => handleProductClick(activeHeroWatch)}
              >
                <span>Inspect Timepiece</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <button
                type="button"
                className="spotlight-add-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(activeHeroWatch, 1, true);
                }}
                title="Add to Luxury Bag"
              >
                <span>+ Add to Bag</span>
              </button>

              <button
                type="button"
                className="spotlight-buy-now-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  buyNow(activeHeroWatch);
                }}
                title="Instant Buy Now"
              >
                <span>Buy Now</span>
              </button>

              <span className="spotlight-price-tag">{activeHeroWatch.price}</span>
            </div>

            {/* Spotlight Watch Pagination Dots */}
            <div className="spotlight-carousel-dots">
              {heroSpotlightList.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`spotlight-dot ${activeHeroIndex === idx ? "is-active" : ""}`}
                  onClick={() => setActiveHeroIndex(idx)}
                  aria-label={`Show ${item.name}`}
                >
                  <span className="dot-label">{item.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="spotlight-visual-side" onClick={() => handleProductClick(activeHeroWatch)}>
            <div className="spotlight-watch-halo" />
            <img
              key={activeHeroWatch.id}
              src={activeHeroWatch.image}
              alt={activeHeroWatch.name}
              className="spotlight-watch-img"
            />
            <div className="spotlight-inspect-hint">
              <span>Click to view technical dossier ↗</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MINIMAL APPLE-STYLE FILTER BAR ── */}
      <section className="apple-filter-bar">
        <div className="apple-filter-container">
          <div className="filter-bar-top">
            <div className="filter-headline">
              <h2 className="catalog-section-title">The Complete Collection</h2>
              <p className="catalog-section-sub">
                Explore all <strong>{PRODUCTS_DATA.length}</strong> master references engineered with avant-garde horology.
              </p>
            </div>

            {/* Minimal Search & Sort Pill */}
            <div className="filter-search-group">
              <div className="apple-search-input-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by SKU, complication or series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="apple-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="apple-search-clear"
                    onClick={() => setSearchQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="apple-sort-select"
                aria-label="Sort products"
              >
                <option value="DEFAULT">Featured Order</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="PRICE_ASC">Price: Low to High</option>
              </select>
            </div>
          </div>

          {/* Segmented Series Navigation Tabs (Apple Style) */}
          <div className="apple-series-tabs" role="tablist">
            {CATEGORIES.map((cat) => {
              const count =
                cat.id === "ALL"
                  ? PRODUCTS_DATA.length
                  : PRODUCTS_DATA.filter((p) => p.collection === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`apple-tab-btn ${activeCategory === cat.id ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="tab-text">{cat.label}</span>
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LUXURY APPLE-GRADE PRODUCT SHOWCASE GRID ── */}
      <section className="apple-grid-section">
        {filteredProducts.length === 0 ? (
          <div className="apple-empty-state">
            <div className="empty-symbol">✦</div>
            <h3>No Timepieces Found</h3>
            <p>No reference matches your search criteria. Try adjusting keywords or clear filters.</p>
            <button
              type="button"
              className="apple-reset-btn"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("ALL");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="apple-product-grid">
            {filteredProducts.map((watch) => {
              const isCompared = comparedIds.includes(watch.id);
              return (
                <article
                  key={watch.id}
                  className="apple-watch-card"
                  onClick={() => handleProductClick(watch)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleProductClick(watch);
                    }
                  }}
                >
                  {/* Subtle Light Aura */}
                  <div className="card-aura-glow" />

                  {/* Card Header Info */}
                  <div className="card-header-meta">
                    <span className="card-series-tag">{watch.collectionName}</span>
                    <span className="card-sku-code">{watch.sku}</span>
                  </div>

                  {/* High-Resolution Watch Visual */}
                  <div className="card-media-stage">
                    <img
                      src={watch.image}
                      alt={watch.name}
                      className="card-watch-photo"
                      loading="lazy"
                    />
                  </div>

                  {/* Card Descriptive Content */}
                  <div className="card-body-content">
                    <h3 className="card-watch-title">{watch.name}</h3>
                    <p className="card-watch-tagline">{watch.subtitle}</p>

                    {/* Apple-style Specs Pills */}
                    <div className="card-feature-chips">
                      <span className="feature-chip">{watch.specs.caseDimensions.split(" ")[0]}</span>
                      <span className="feature-chip">{watch.specs.powerReserve.split(" ")[0]} {watch.specs.powerReserve.split(" ")[1]}</span>
                      <span className="feature-chip">{watch.specs.waterResistance.split(" ")[0]}</span>
                    </div>

                    {/* Bottom Price & Compare Row */}
                    <div className="card-pricing-meta-row">
                      <div className="card-price-display">
                        <span className="price-main">{watch.price}</span>
                        <span className="price-usd">{watch.priceUsd}</span>
                      </div>

                      <button
                        type="button"
                        className={`card-compare-action-btn ${isCompared ? "is-selected" : ""}`}
                        onClick={(e) => handleToggleCompare(watch, e)}
                        title={isCompared ? "Remove from comparison" : "Compare with another SKU"}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                        </svg>
                        <span>{isCompared ? "Comparing" : "Compare"}</span>
                      </button>
                    </div>

                    {/* Apple-Grade Action Buttons */}
                    <div className="card-cta-btn-group" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="card-cta-bag-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(watch, 1, true);
                        }}
                        title="Add to Shopping Bag"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>+ Bag</span>
                      </button>

                      <button
                        type="button"
                        className="card-cta-buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          buyNow(watch);
                        }}
                        title="Instant Acquisition"
                      >
                        <span>Buy Now</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FLOATING APPLE-STYLE COMPARISON BAR ── */}
      {comparedProducts.length > 0 && (
        <aside className="apple-compare-dock">
          <div className="dock-glass-wrap">
            <div className="dock-left">
              <span className="dock-badge">COMPARE ({comparedProducts.length}/4)</span>
              <div className="dock-watch-avatars">
                {comparedProducts.map((p) => (
                  <div key={p.id} className="dock-avatar" title={p.name}>
                    <img src={p.image} alt={p.name} />
                    <button
                      type="button"
                      className="dock-avatar-remove"
                      onClick={() => setComparedIds((prev) => prev.filter((id) => id !== p.id))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="dock-right">
              <button
                type="button"
                className="dock-clear-action"
                onClick={() => setComparedIds([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="dock-launch-btn"
                onClick={() => setShowCompareModal(true)}
              >
                <span>View Comparison</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── SIDE-BY-SIDE TECHNICAL COMPARISON MODAL ── */}
      {showCompareModal && (
        <CompareModal
          comparedProducts={comparedProducts}
          onRemove={(id) => setComparedIds((prev) => prev.filter((i) => i !== id))}
          onClear={() => {
            setComparedIds([]);
            setShowCompareModal(false);
          }}
          onClose={() => setShowCompareModal(false)}
          onSelectProduct={(p) => {
            setShowCompareModal(false);
            if (onSelectSku) onSelectSku(p.id);
          }}
        />
      )}
    </div>
  );
}
