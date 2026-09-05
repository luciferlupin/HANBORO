import React, { useState, useMemo, useEffect } from "react";
import { CATEGORIES } from "./productsData";
import { CompareModal } from "./CompareModal";
import { useStore } from "./StoreContext";

/**
 * ProductsView (Maison Elegance Collection Page)
 * Inspired by high-fashion Behance editorial watch catalogues.
 * Features giant "ELEGANCE" title, dual-column editorial intro,
 * refined minimalist filter/sort bar, luxury 3-column product pedestals,
 * interactive wishlist hearts, and interstitial editorial showcase banners.
 */
const INTERSTITIAL_SPOTLIGHTS = {
  3: {
    sku: "astroworld-tourbillon-fluted-silver",
    bg: "/watch-astroworld-moon-silver-moon.webp",
    tag: "CELESTIAL COMPLICATION",
    title: "Astroworld Celestial Tourbillon",
    desc: "Photorealistic 3D cratered Moonphase complication with unconstrained kinetic balance."
  },
  8: {
    sku: "casino-roulette-wheel-diamond-emerald",
    bg: "/watch-casino-roulette-diamond-emerald-felt.webp",
    tag: "CASINO ROULETTE COLLECTION",
    title: "Casino Roulette Automatic Watch",
    desc: "Precision weighted rotor with ceramic bearings and authentic spinning roulette wheel."
  },
  15: {
    sku: "arctic-tonneau-white-10atm",
    bg: "/watch-arctic-tonneau-10atm-white-straps.webp",
    tag: "FORGED CARBON COLLECTION",
    title: "Damascus Carbon 10ATM Chronometer",
    desc: "Ultralight forged carbon architecture with scratchproof sapphire crystal and 100M water resistance."
  },
  22: {
    sku: "cyber-cogwheel-skeleton-steel",
    bg: "/watch-cyber-cogwheel-skeleton-steel-tactical.webp",
    tag: "SKELETON AUTOMATIC",
    title: "Cyber Cogwheel Dual-Axis Skeleton",
    desc: "Openworked kinetic dial with 28,800 BPH movement and exposed skeleton gear-trains."
  },
  29: {
    sku: "celestial-dragon-tourbillon-rosegold",
    bg: "/watch-celestial-dragon-tourbillon-rosegold-lantern.webp",
    tag: "SPECIAL EDITION",
    title: "Celestial Imperial Dragon Tourbillon",
    desc: "Hand-crafted 3D rose-gold dragon coiling through the flying tourbillon cage."
  },
  38: {
    sku: "aurora-celestial-frost",
    bg: "/watch-aurora-celestial-frost-aurora.webp",
    tag: "COSMIC LUMINESCENCE",
    title: "Aurora Celestial Frost Edition",
    desc: "Super-LumiNova BGW9 celestial map illuminated under anti-reflective sapphire crystal."
  }
};

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
    window.scrollTo({ top: 0, behavior: "instant" });
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
    }

    return list;
  }, [catalogList, activeCategory, searchQuery, sortOrder]);

  const handleToggleWishlist = (id, e) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleProductClick = (product) => {
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
            {filteredProducts.map((watch, index) => {
              const isWishlisted = !!wishlist[watch.id];

              // Render an interstitial 2-span editorial poster at key rhythmic intervals
              const spotlight = INTERSTITIAL_SPOTLIGHTS[index];

              return (
                <React.Fragment key={watch.id}>
                  {spotlight && (
                    <div
                      className="maison-interstitial-card"
                      onClick={() => onSelectSku && onSelectSku(spotlight.sku)}
                    >
                      <div
                        className="interstitial-bg-img"
                        style={{ backgroundImage: `url('${spotlight.bg}')` }}
                      />
                      <div className="interstitial-overlay">
                        <span className="interstitial-tag">{spotlight.tag}</span>
                        <h3 className="interstitial-title">{spotlight.title}</h3>
                        <p className="interstitial-desc">{spotlight.desc}</p>
                        <span className="interstitial-cta">Explore Watch Details →</span>
                      </div>
                    </div>
                  )}

                  <article
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
                    {/* Top Wishlist Heart Button */}
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
                    </div>

                    {/* Clean Single-Line Bottom Info: Model Name (Left) + Price (Right) */}
                    <div className="maison-card-footer">
                      <div className="maison-card-title-wrap">
                        <h3 className="maison-card-title">{watch.name}</h3>
                        {watch.collectionName && (
                          <span className="maison-card-collection">{watch.collectionName}</span>
                        )}
                      </div>

                      <div className="maison-card-price-wrap">
                        <span className="maison-price-val">{watch.price}</span>
                      </div>
                    </div>

                    {/* Hover Quick Actions */}
                    <div className="maison-card-hover-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="maison-quick-bag-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(watch, 1, true);
                        }}
                      >
                        <span>+ Add to Bag</span>
                      </button>
                      <button
                        type="button"
                        className="maison-quick-buy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          buyNow(watch);
                        }}
                      >
                        <span>Buy Now ↗</span>
                      </button>
                    </div>
                  </article>
                </React.Fragment>
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
