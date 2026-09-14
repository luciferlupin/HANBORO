import React, { useState, useMemo, useEffect } from "react";
import { CATEGORIES } from "./productsData";
import { CompareModal } from "./CompareModal";
import { useStore } from "./StoreContext";
import { sortCatalogStably } from "./supabaseClient";
import { forceScrollToTop } from "./scrollUtils";

/**
 * ProductsView (Maison Elegance Collection Page)
 * Refined luxury watch catalogue featuring minimalist filter/sort bar,
 * uniform 3-column product pedestals, interactive wishlist hearts, and fast actions.
 */

export function ProductsView({
  selectedSkuId,
  onSelectSku,
  onNavigateHome,
  onNavigateToStores
}) {
  const { products, addToCart, buyNow } = useStore();

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("DEFAULT");
  const [wishlist, setWishlist] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [comparedIds, setComparedIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Scroll to top immediately when entering catalog
  useEffect(() => {
    forceScrollToTop();
  }, []);

  const catalogList = useMemo(() => {
    return Array.isArray(products) && products.length > 0 ? products : [];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...catalogList];

    // Category filter
    if (activeCategory !== "ALL") {
      list = list.filter((p) => p.collection === activeCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.modelNumber?.toLowerCase().includes(q) ||
          p.specs?.modelNumber?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.collectionName?.toLowerCase().includes(q) ||
          p.specs?.movement?.toLowerCase().includes(q) ||
          p.tag?.toLowerCase().includes(q) ||
          p.specs?.complications?.some((c) => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortOrder === "PRICE_DESC") {
      list.sort((a, b) => parseInt(String(b.price || "0").replace(/[^\d]/g, "")) - parseInt(String(a.price || "0").replace(/[^\d]/g, "")));
    } else if (sortOrder === "PRICE_ASC") {
      list.sort((a, b) => parseInt(String(a.price || "0").replace(/[^\d]/g, "")) - parseInt(String(a.price || "0").replace(/[^\d]/g, "")));
    } else {
      list = sortCatalogStably(list);
    }

    return list;
  }, [catalogList, activeCategory, searchQuery, sortOrder]);

  const handleToggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleProductClick = (product) => {
    forceScrollToTop();
    if (onSelectSku) {
      onSelectSku(product.id);
    }
  };

  const comparedProducts = useMemo(() => {
    return catalogList.filter((p) => comparedIds.includes(p.id));
  }, [catalogList, comparedIds]);

  return (
    <div className="maison-catalog-view" id="products-catalog">
      {/* ── TOP NAVIGATION BREADCRUMB ── */}
      <header className="maison-top-bar">
        <div className="maison-top-bar__inner">
          <nav className="maison-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={onNavigateHome} className="maison-breadcrumb-btn">
              <span>← Back to Home</span>
            </button>
            <span className="maison-breadcrumb-sep">/</span>
            <span className="maison-breadcrumb-curr">Luxury Automatic Watches</span>
          </nav>

          <div className="maison-top-badge">
            <span className="top-badge-dot" />
            <span>{catalogList.length} Watches</span>
          </div>
        </div>
      </header>

      {/* ── EDITORIAL HEADER: CLEAN LUXURY TYPOGRAPHY & DUAL PARAGRAPH INTRO ── */}
      <section className="maison-editorial-header">
        <div className="maison-header-container">
          <h1 className="maison-giant-title">
            {activeCategory === "ALL" ? "COLLECTION" : activeCategory.replace(/_/g, " ")}
          </h1>

          <div className="maison-intro-columns">
            <div className="intro-column">
              <p>
                Engineered without compromise. The Hanboro catalog unites 81 avant-garde mechanical complications, from rotating 3D lunar orbits and kinetic casino roulette dials to high-frequency flying tourbillons. Each calibre operates at 28,800 BPH with synthetic ruby bearings for frictionless chronometric precision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MINIMALIST SINGLE-LINE FILTER & SORT BAR ── */}
      <section className="maison-filter-bar">
        <div className="maison-filter-inner">
          {/* Clean Series Tabs */}
          <nav className="maison-series-nav" role="tablist" aria-label="Complication Series">
            {CATEGORIES.map((cat) => {
              const count =
                cat.id === "ALL"
                  ? catalogList.length
                  : catalogList.filter((p) => p.collection === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`maison-nav-tab ${activeCategory === cat.id ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="tab-name">{cat.label.replace(" & Complications", "").replace(" Skeleton", "").replace(" & Roulette", "").replace(" & Sport Chrono", "")}</span>
                  <span className="tab-num">({count})</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Search + Sort */}
          <div className="maison-controls-group">
            <div className="maison-search-input-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="maison-search-field"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="maison-search-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="maison-sort-dropdown-wrap">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="maison-sort-dropdown"
                aria-label="Sort collection"
              >
                <option value="DEFAULT">Sort: New Arrivals</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="PRICE_ASC">Price: Low to High</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── REFINED 3-COLUMN PRODUCT GALLERY GRID ── */}
      <section className="maison-gallery-section">
        {filteredProducts.length === 0 ? (
          <div className="maison-empty-state">
            <span className="empty-symbol">✦</span>
            <h3>No Timepieces Found</h3>
            <p>No master reference matches your selected filters. Reset to view the complete catalog.</p>
            <button
              type="button"
              className="maison-reset-btn"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("ALL");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="maison-gallery-grid">
            {filteredProducts.map((watch) => {
              const isWishlisted = !!wishlist[watch.id];

              return (
                <article
                  key={watch.id}
                  className="maison-watch-card"
                  onClick={() => handleProductClick(watch)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleProductClick(watch);
                    }
                  }}
                >
                  {/* Top Header: Collection Label (Left) + Wishlist Heart (Right) */}
                  <div className="maison-card-header">
                    <span className="maison-card-badge">
                      {watch.collectionName || (watch.collection && watch.collection.replace(/_/g, " ")) || "HAUTE HORLOGERIE"}
                    </span>
                    <button
                      type="button"
                      className={`maison-wishlist-btn ${isWishlisted ? "is-active" : ""}`}
                      onClick={(e) => handleToggleWishlist(watch.id, e)}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={isWishlisted ? "var(--red)" : "none"} stroke={isWishlisted ? "var(--red)" : "currentColor"} strokeWidth="1.8">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  {/* Centered Large Watch Visual Stage */}
                  <div className="maison-card-stage">
                    <div className="maison-card-shadow" aria-hidden="true" />
                    <img
                      src={watch.image}
                      alt={watch.name}
                      className="maison-watch-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp";
                      }}
                    />
                    {watch.videoUrl && (
                      <span className="maison-stage-badge maison-stage-badge--reel" title="Mechanical Calibre Motion Reel Available">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Reel</span>
                      </span>
                    )}
                    {watch.hasNightMode && !watch.videoUrl && (
                      <span className="maison-stage-badge maison-stage-badge--lume" title="Super-LumiNova Night Illumination">
                        <span className="lume-dot-mini" />
                        <span>Lume</span>
                      </span>
                    )}
                  </div>

                  {/* Structured Middle Info: Ref/Movement Eyebrow + 2-Line Clamped Title + Specs */}
                  <div className="maison-card-body">
                    <div className="maison-card-eyebrow">
                      <span className="card-sku-code">MODEL {watch.modelNumber || watch.specs?.modelNumber || watch.sku.split("-")[1]} • REF. {watch.sku}</span>
                      <span className="card-dot">•</span>
                      <span className="card-caliber">{watch.specs?.movement ? watch.specs.movement.split(" ")[0] : "AUTOMATIC"}</span>
                    </div>

                    <h3 className="maison-card-title" title={watch.name}>
                      {watch.name}
                    </h3>

                    <div className="maison-card-specs-line">
                      <span>{watch.specs?.caseDimensions ? watch.specs.caseDimensions.split(" ")[0] : "44mm"}</span>
                      <span className="card-dot">•</span>
                      <span>{watch.specs?.glass ? watch.specs.glass.split(" ")[0] : "Sapphire"}</span>
                      <span className="card-dot">•</span>
                      <span>{watch.specs?.waterResistance || "50M WR"}</span>
                    </div>
                  </div>

                  {/* Clean Bottom Pedestal: Price & Direct Fast Actions */}
                  <div className="maison-card-footer">
                    <div className="maison-card-price-wrap">
                      <span className="maison-price-val">{watch.price}</span>
                      <span className="maison-price-note">Tax Included</span>
                    </div>

                    <div className="maison-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="maison-card-action-btn maison-card-action-btn--bag"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(watch, 1, true);
                        }}
                        title="Add to Bag"
                      >
                        <span>+ Bag</span>
                      </button>
                      <button
                        type="button"
                        className="maison-card-action-btn maison-card-action-btn--buy"
                        onClick={(e) => {
                          e.stopPropagation();
                          buyNow(watch);
                        }}
                        title="Instant Buy Now"
                      >
                        <span>Buy Now ↗</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FLOATING COMPARISON BAR ── */}
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

      {/* ── COMPARISON MODAL ── */}
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
