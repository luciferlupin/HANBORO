import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS_DATA, getMrpDiscountConfig, saveMrpDiscountConfig } from "./productsData";
import { metaPixelService } from "./metaPixel";
import { shopifyService } from "./shopifyClient";
import { getShopifyIds } from "./shopifyIdMap";

const StoreContext = createContext(null);

export const PROMO_CODES = {
  HANBORO10: { type: "percent", value: 10, label: "10% Welcome Discount" },
  VIP1000: { type: "flat", value: 1000, label: "₹1,000 Special Credit Voucher" },
  SWISS15: { type: "percent", value: 15, label: "15% Private Collector Tier" },
  HANBORO5: { type: "percent", value: 5, label: "5% Collector Privilege" },
};

function normalizeIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

const rouletteService = {
  // In-session privilege voucher validation — no local database storage
  async validateVoucher(code) {
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) return { valid: false, message: "Invalid privilege voucher." };
    if (PROMO_CODES[cleanCode]) {
      return {
        valid: true,
        promo: {
          type: PROMO_CODES[cleanCode].type,
          value: PROMO_CODES[cleanCode].value,
          label: PROMO_CODES[cleanCode].label,
        },
      };
    }
    if (cleanCode.startsWith("HNB-")) {
      const parts = cleanCode.split("-");
      const discountVal = parseInt(parts[1], 10);
      if (discountVal && discountVal > 0 && discountVal <= 25) {
        return {
          valid: true,
          promo: {
            type: "percent",
            value: discountVal,
            label: `${discountVal}% Collector Privilege`,
          },
        };
      }
    }
    return { valid: false, message: "Invalid privilege voucher." };
  },
};

// Zero Local Database Startup Routine: Purge any obsolete local storage keys
if (typeof window !== "undefined") {
  const obsoleteDatabaseKeys = [
    "hanboro_roulette_spins",
    "hanboro_collector_reviews",
    "hanboro_local_orders",
    "hanboro_cart",
    "hanboro_wishlist",
    "hanboro_mrp_discount_config",
  ];
  obsoleteDatabaseKeys.forEach((key) => {
    try {
      window.localStorage?.removeItem(key);
    } catch (_) {}
  });
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => {
    // Immediately enrich every local watch with real Shopify IDs from the baked-in map.
    // This means checkout works on first page load — no network round-trip required.
    return PRODUCTS_DATA.map((p) => {
      const ids = getShopifyIds(p.sku);
      if (!ids) return p;
      return {
        ...p,
        shopifyId: ids.shopifyId,
        shopifyVariantId: ids.shopifyVariantId,
        shopifyHandle: ids.handle,
        availableForSale: ids.availableForSale,
      };
    });
  });
  const [isShopifySynced, setIsShopifySynced] = useState(true); // already synced via static map
  const [shopifyCustomer, setShopifyCustomer] = useState(null);
  const [shopifyCheckoutUrl, setShopifyCheckoutUrl] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [mrpDiscountConfig, setMrpDiscountConfigState] = useState(() => getMrpDiscountConfig());
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  // ── LIVE SHOPIFY DATA LAYER ──────────────────────────────────────────────
  // On every page load, fetch fresh prices, availability and titles from
  // Shopify Storefront API. This means any change made in Shopify Admin
  // (price edit, stock change, product name update) is reflected immediately
  // on the website — no redeploy required.
  useEffect(() => {
    let cancelled = false;
    async function liveShopifySync() {
      try {
        const liveMap = await shopifyService.fetchLiveShopifyData();
        if (cancelled || liveMap.size === 0) return;
        setProducts((current) =>
          current.map((p) => {
            // Match by the shopifyHandle that was baked in, or derive from SKU
            const handle =
              p.shopifyHandle ||
              String(p.sku || p.id || "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/, "");
            const skuKey = String(p.sku || "").trim().toLowerCase();
            const live = liveMap.get(handle.toLowerCase()) || liveMap.get(handle) || (skuKey ? liveMap.get(skuKey) : null);
            if (!live) return p;

            const livePrice = live.shopifyPrice
              ? `₹${live.shopifyPrice.toLocaleString("en-IN")}`
              : p.price;
            const liveMrp = live.shopifyComparePrice
              ? `₹${live.shopifyComparePrice.toLocaleString("en-IN")}`
              : p.mrp;
            return {
              ...p,
              name: live.shopifyTitle || p.name,
              price: livePrice,
              priceNumeric: live.shopifyPrice || p.priceNumeric,
              mrp: liveMrp,
              mrpNumeric: live.shopifyComparePrice || p.mrpNumeric,
              availableForSale: live.availableForSale,
              quantityAvailable: live.quantityAvailable,
              shopifyId: live.shopifyId || p.shopifyId,
              shopifyVariantId: live.shopifyVariantId || p.shopifyVariantId,
              shopifyHandle: live.shopifyHandle || p.shopifyHandle || handle,
              _shopifyLiveSynced: true,
            };
          })
        );
      } catch (err) {
        // Live sync failed — static map values remain in use
        console.warn("Live Shopify sync note:", err.message);
      }
    }
    liveShopifySync();
    return () => { cancelled = true; };
  }, []);

  // Customer Account: handle OAuth callback code from Shopify on page load,
  // and silently restore any existing logged-in customer session.
  useEffect(() => {
    async function handleCustomerAuth() {
      if (typeof window === "undefined") return;
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      if (code) {
        try {
          await shopifyService.exchangeCustomerToken({ code, state });
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
          const profile = await shopifyService.fetchCustomerProfile();
          if (profile) {
            setShopifyCustomer(profile);
            showToast(`Welcome, ${profile.firstName || profile.displayName || "Collector"}`);
          }
        } catch (authErr) {
          console.warn("Customer auth exchange note:", authErr);
        }
      } else {
        // Silently restore previously-stored customer session
        shopifyService.fetchCustomerProfile()
          .then((profile) => { if (profile) setShopifyCustomer(profile); })
          .catch(() => {});
      }
    }
    handleCustomerAuth();
  }, []);

  // Update Shopify Cart whenever local items change
  useEffect(() => {
    if (cart.length === 0) {
      setShopifyCheckoutUrl("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const sc = await shopifyService.createShopifyCart(cart);
        if (sc?.checkoutUrl) {
          setShopifyCheckoutUrl(sc.checkoutUrl);
        }
      } catch (err) {
        // Local cart remains active
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cart]);

  // Complete purge: ensure zero localStorage usage across the entire storefront
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {}
    }
  }, []);

  const showToast = useCallback((message, duration = 3200) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => current === message ? null : current);
    }, duration);
  }, []);

  const toggleWishlist = useCallback((productId) => {
    if (!productId) return;
    setWishlist((current) => ({ ...current, [productId]: !current[productId] }));
  }, []);

  const isWishlisted = useCallback((productId) => Boolean(wishlist[productId]), [wishlist]);

  const getProductByIdOrSku = useCallback((idOrSku) => {
    const query = normalizeIdentifier(idOrSku);
    if (!query) return null;
    return products.find((product) => (
      normalizeIdentifier(product.id) === query || normalizeIdentifier(product.sku) === query
    )) || null;
  }, [products]);

  const addToCart = useCallback((product, quantity = 1, openDrawer = true) => {
    if (!product) return;
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) => item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }
      return [...current, { product, quantity, addedAt: new Date().toISOString() }];
    });
    metaPixelService.trackAddToCart(product, quantity);
    showToast(`Added ${product.name} to Luxury Bag`);
    if (openDrawer) setIsCartOpen(true);
  }, [showToast]);

  const removeFromCart = useCallback((productId) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, delta) => {
    setCart((current) => current.flatMap((item) => {
      if (item.product.id !== productId) return [item];
      const quantity = item.quantity + delta;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedPromo(null);
  }, []);

  const proceedToShopifyCheckout = useCallback(async (itemsToCheckout = null) => {
    const target = itemsToCheckout || cart;
    if (!target || target.length === 0) return;
    if (shopifyCheckoutUrl) {
      window.location.href = shopifyCheckoutUrl;
      return;
    }
    try {
      const sc = await shopifyService.createShopifyCart(target);
      if (sc?.checkoutUrl) {
        window.location.href = sc.checkoutUrl;
        return;
      }
    } catch (e) {
      console.warn("proceedToShopifyCheckout note:", e);
    }
    const fallbackUrl = shopifyService.buildShopifyCheckoutUrl(target);
    window.location.href = fallbackUrl;
  }, [cart, shopifyCheckoutUrl]);

  const buyNow = useCallback(async (product) => {
    if (!product) return;
    addToCart(product, 1, false);
    showToast("Connecting to Shopify Checkout...");
    try {
      const shopifyCart = await shopifyService.createShopifyCart([{ product, quantity: 1 }]);
      if (shopifyCart?.checkoutUrl) {
        window.location.href = shopifyCart.checkoutUrl;
        return;
      }
    } catch (err) {
      console.warn("Shopify checkout note:", err);
    }
    setIsCartOpen(true);
  }, [addToCart, showToast]);

  const openCheckout = useCallback((directItem = null) => {
    if (directItem) {
      buyNow(directItem);
      return;
    }
    proceedToShopifyCheckout();
  }, [buyNow, proceedToShopifyCheckout]);

  const loginWithShopify = useCallback((redirectUri, useHeadlessOAuth = false) => {
    if (useHeadlessOAuth) {
      shopifyService.buildCustomerAuthUrl(redirectUri).then((authUrl) => {
        window.location.href = authUrl;
      }).catch((err) => {
        console.warn("Shopify OAuth error:", err);
        window.location.href = shopifyService.getCustomerAccountUrl();
      });
      return;
    }
    // Direct Official Shopify Customer Account Portal (No redirect_uri error)
    window.location.href = shopifyService.getCustomerAccountUrl();
  }, []);

  const logoutFromShopify = useCallback((redirectUri) => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("shopify_customer_token");
    }
    setShopifyCustomer(null);
    const logoutUrl = shopifyService.buildCustomerLogoutUrl(redirectUri);
    window.location.href = logoutUrl;
  }, []);

  const applyPromoCode = useCallback(async (codeValue, customerEmail = "", customerPhone = "") => {
    const code = String(codeValue || "").trim().toUpperCase();
    if (!code) return { success: false, message: "Please enter a privilege voucher code." };
    if (PROMO_CODES[code]) {
      setAppliedPromo({ code, isRouletteVoucher: false, ...PROMO_CODES[code] });
      return { success: true, message: PROMO_CODES[code].label };
    }
    const validation = await rouletteService.validateVoucher(code, customerEmail, customerPhone);
    if (!validation.valid) return { success: false, message: validation.message };
    setAppliedPromo({ code, isRouletteVoucher: true, ...validation.promo });
    return { success: true, message: validation.promo.label };
  }, []);

  const removePromoCode = useCallback(() => setAppliedPromo(null), []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotalInr = useMemo(() => cart.reduce((sum, item) => {
    const price = Number.parseInt(String(item.product.price || 0).replace(/[^\d]/g, ""), 10) || 0;
    return sum + price * item.quantity;
  }, 0), [cart]);
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percent") {
      return Math.round(subtotalInr * Math.min(100, Math.max(0, appliedPromo.value)) / 100);
    }
    return Math.min(subtotalInr, Number(appliedPromo.value) || 0);
  }, [appliedPromo, subtotalInr]);
  const finalTotalInr = Math.max(0, subtotalInr - discountAmount);

  const updateMrpDiscountConfig = useCallback((config) => {
    const updated = saveMrpDiscountConfig(config);
    setMrpDiscountConfigState(updated);
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicMuted((current) => {
      const next = !current;
      const heroVideo = document.querySelector(".hero-video-media");
      if (heroVideo) {
        heroVideo.muted = next;
        if (!next && heroVideo.paused) heroVideo.play().catch(() => {});
      }
      return next;
    });
  }, []);

  const value = {
    products,
    productsLoading: false,
    getProductByIdOrSku,
    cart,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    wishlist,
    toggleWishlist,
    isWishlisted,
    subtotalInr,
    discountAmount,
    finalTotalInr,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    buyNow,
    openCheckout,
    proceedToShopifyCheckout,
    isShopifyConnected: true,
    isShopifySynced,
    shopifyCustomer,
    shopifyCheckoutUrl,
    loginWithShopify,
    logoutFromShopify,
    shopifyService,
    rouletteService,
    showToast,
    toastMessage,
    mrpDiscountConfig,
    updateMrpDiscountConfig,
    isMusicPlaying,
    setIsMusicPlaying,
    isMusicMuted,
    setIsMusicMuted,
    toggleMusic,
    metaPixelService,
    // Live Shopify availability helper — call with product object
    getProductAvailability: (p) => ({
      availableForSale: p?.availableForSale !== false,
      quantityAvailable: p?.quantityAvailable ?? null,
      isLowStock: typeof p?.quantityAvailable === "number" && p.quantityAvailable > 0 && p.quantityAvailable <= 3,
      isSoldOut: p?.availableForSale === false,
      isLiveSynced: Boolean(p?._shopifyLiveSynced),
    }),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
}
