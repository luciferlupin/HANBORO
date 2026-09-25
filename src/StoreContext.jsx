import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS_DATA, getMrpDiscountConfig, saveMrpDiscountConfig } from "./productsData";
import { metaPixelService } from "./metaPixel";
import { shopifyService } from "./shopifyClient";
import { getShopifyIds } from "./shopifyIdMap";

const StoreContext = createContext(null);

const LOCAL_PRODUCTS_WITH_SHOPIFY_IDS = PRODUCTS_DATA.map((product) => {
  const ids = getShopifyIds(product.sku);
  if (!ids) return product;
  return {
    ...product,
    shopifyId: ids.shopifyId,
    shopifyVariantId: ids.shopifyVariantId,
    shopifyHandle: ids.handle,
    availableForSale: ids.availableForSale,
  };
});

export const PROMO_CODES = {
  HANBORO10: { type: "percent", value: 10, label: "10% Welcome Discount" },
  VIP1000: { type: "flat", value: 1000, label: "₹1,000 Special Credit Voucher" },
  SWISS15: { type: "percent", value: 15, label: "15% Private Collector Tier" },
  HANBORO5: { type: "percent", value: 5, label: "5% Collector Privilege" },
};

function normalizeIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function getCartLineId(product) {
  return product?.shopifyVariantId || product?.variantId || product?.id;
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
  // Checkout IDs are ready immediately; live catalogue fields arrive asynchronously.
  const [products, setProducts] = useState(() => LOCAL_PRODUCTS_WITH_SHOPIFY_IDS);
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);
  const [isShopifySynced, setIsShopifySynced] = useState(false);
  const [shopifyCustomer, setShopifyCustomer] = useState(null);
  const [customerAuthError, setCustomerAuthError] = useState("");
  const [isCustomerAuthLoading, setIsCustomerAuthLoading] = useState(false);
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
        if (cancelled) return;
        if (liveMap.size === 0) {
          setIsShopifyConnected(false);
          setIsShopifySynced(false);
          return;
        }

        const syncedProducts = shopifyService.mergeProductsWithShopifyData(
          LOCAL_PRODUCTS_WITH_SHOPIFY_IDS,
          liveMap,
        );
        setProducts(syncedProducts);
        setIsShopifyConnected(true);
        setIsShopifySynced(syncedProducts.length > 0);
      } catch (err) {
        // Live sync failed — static map values remain in use
        setIsShopifyConnected(false);
        setIsShopifySynced(false);
        console.warn("Live Shopify sync note:", err.message);
      }
    }

    liveShopifySync();

    // Re-sync immediately when merchant tabs back from Shopify Admin, and every 20 seconds
    const onFocus = () => liveShopifySync();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    const interval = setInterval(liveShopifySync, 20000);

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
      clearInterval(interval);
    };
  }, []);

  // Customer Account: handle OAuth callback code from Shopify on page load,
  // and silently restore any existing logged-in customer session.
  useEffect(() => {
    async function handleCustomerAuth() {
      if (typeof window === "undefined") return;
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const oauthError = urlParams.get("error");
      const oauthErrorDescription = urlParams.get("error_description");
      const finishOnAccount = () => {
        window.history.replaceState({}, document.title, `${window.location.pathname}#account`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      };
      if (oauthError) {
        setCustomerAuthError(oauthErrorDescription || "Shopify sign-in was not completed. Please try again.");
        finishOnAccount();
        return;
      }
      if (code) {
        setIsCustomerAuthLoading(true);
        setCustomerAuthError("");
        try {
          await shopifyService.exchangeCustomerToken({ code, state });
          const profile = await shopifyService.fetchCustomerProfile();
          if (!profile) throw new Error("Shopify returned no customer profile.");
          setShopifyCustomer(profile);
          finishOnAccount();
          showToast(`Welcome, ${profile.firstName || profile.displayName || "Collector"}`);
        } catch (authErr) {
          console.warn("Customer auth exchange note:", authErr);
          setCustomerAuthError("We couldn't finish signing you in with Shopify. Please try again.");
          finishOnAccount();
        } finally {
          setIsCustomerAuthLoading(false);
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
      const lineId = getCartLineId(product);
      const existing = current.find((item) => getCartLineId(item.product) === lineId);
      if (existing) {
        return current.map((item) => getCartLineId(item.product) === lineId
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }
      return [...current, { product, quantity, addedAt: new Date().toISOString() }];
    });
    metaPixelService.trackAddToCart(product, quantity);
    showToast(`Added ${product.name} to Luxury Bag`);
    if (openDrawer) setIsCartOpen(true);
  }, [showToast]);

  const removeFromCart = useCallback((lineId) => {
    setCart((current) => current.filter((item) => getCartLineId(item.product) !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId, delta) => {
    setCart((current) => current.flatMap((item) => {
      if (getCartLineId(item.product) !== lineId) return [item];
      const quantity = item.quantity + delta;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedPromo(null);
  }, []);

  // ── SHIPROCKET FASTRR PORTAL — HEADLESS INTEGRATION ─────────────────────
  // The Fastrr shopify.js is designed for Shopify liquid themes and calls
  // /cart.js internally — which doesn't exist on our headless domain.
  // The correct headless API is window.shiprocketCheckoutDirectHandler which
  // accepts a products array in Fastrr's format directly. We also build a
  // Shopify cart first so we have a checkoutUrl fallback.
  const _buildFastrrProducts = useCallback((items) => {
    return items
      .filter((it) => it?.product)
      .map((it) => {
        const p = it.product;
        const rawVariantId =
          p.shopifyVariantId || p.variantId || p.id || "";
        const variantId = String(rawVariantId).replace(
          "gid://shopify/ProductVariant/",
          ""
        );
        const rawProductId = String(p.shopifyId || "").replace(
          "gid://shopify/Product/",
          ""
        );
        const price = Number.parseFloat(
          String(p.price || "0").replace(/[^\d.]/g, "")
        ) || 0;
        return {
          variantId,
          productId: rawProductId || undefined,
          title: p.name || p.title || "HANBORO Timepiece",
          quantity: it.quantity || 1,
          price,
          image: p.images?.[0] || p.image || undefined,
        };
      })
      .filter((li) => li.variantId);
  }, []);

  const _triggerFastrr = useCallback(async (items) => {
    if (!items || items.length === 0) return;
    setIsCartOpen(false);

    // Build Shopify cart to get the checkout URL fallback
    let shopifyCart = null;
    try {
      shopifyCart = await shopifyService.createShopifyCart(items);
    } catch (err) {
      console.warn("Fastrr cart creation note:", err.message);
    }

    const fastrrProducts = _buildFastrrProducts(items);
    const fallbackUrl = shopifyCart?.checkoutUrl || null;

    // Use the correct Fastrr headless API: shiprocketCheckoutDirectHandler
    // This bypasses /cart.js and accepts products directly.
    const directHandler = window.shiprocketCheckoutDirectHandler;
    if (typeof directHandler === "function" && fastrrProducts.length > 0) {
      try {
        directHandler({
          type: "cart",
          products: fastrrProducts,
          ...(fallbackUrl ? { fallbackUrl } : {}),
        });
        return;
      } catch (sdkErr) {
        console.warn("Fastrr directHandler error:", sdkErr);
      }
    }

    // Fallback: redirect to Shopify checkout URL
    if (fallbackUrl) {
      window.location.href = fallbackUrl;
    } else {
      showToast("Checkout is temporarily unavailable. Please try again.");
    }
  }, [shopifyService, showToast, _buildFastrrProducts]);

  const openFastrrCheckout = useCallback(async (itemsToCheckout = null) => {
    const target = itemsToCheckout || cart;
    if (!target || target.length === 0) {
      setIsCartOpen(true);
      return;
    }
    return _triggerFastrr(target);
  }, [cart, _triggerFastrr]);

  const proceedToShopifyCheckout = useCallback(async (itemsToCheckout = null) => {
    return openFastrrCheckout(itemsToCheckout);
  }, [openFastrrCheckout]);

  const buyNow = useCallback(async (product, quantity = 1) => {
    if (!product) return;
    const qty = typeof quantity === "number" && quantity > 0 ? quantity : 1;

    // Build Shopify cart first for the fallback checkoutUrl
    let shopifyCart = null;
    try {
      shopifyCart = await shopifyService.createShopifyCart([{ product, quantity: qty }]);
    } catch (err) {
      console.warn("Fastrr buyNow cart note:", err.message);
    }

    const fastrrProducts = _buildFastrrProducts([{ product, quantity: qty }]);
    const fallbackUrl = shopifyCart?.checkoutUrl || null;

    const directHandler = window.shiprocketCheckoutDirectHandler;
    if (typeof directHandler === "function" && fastrrProducts.length > 0) {
      try {
        directHandler({
          type: "product",
          products: fastrrProducts,
          ...(fallbackUrl ? { fallbackUrl } : {}),
        });
        return;
      } catch (sdkErr) {
        console.warn("Fastrr buyNow error:", sdkErr);
      }
    }

    // Fallback to Shopify checkout
    if (fallbackUrl) {
      window.location.href = fallbackUrl;
    } else {
      showToast("Checkout is temporarily unavailable. Please try again.");
    }
  }, [shopifyService, showToast, _buildFastrrProducts]);

  const openCheckout = useCallback(async (directItem = null) => {
    if (directItem) {
      return buyNow(directItem);
    }
    return openFastrrCheckout();
  }, [buyNow, openFastrrCheckout]);

  const loginWithShopify = useCallback((redirectUri) => {
    setCustomerAuthError("");
    shopifyService.buildCustomerAuthUrl(redirectUri || "").then((authUrl) => {
      if (!authUrl) throw new Error("Shopify did not return an authorization URL.");
      window.location.href = authUrl;
    }).catch((err) => {
      console.warn("Shopify OAuth start note:", err);
      setCustomerAuthError("Shopify sign-in is temporarily unavailable. Please try again.");
    });
  }, []);

  const logoutFromShopify = useCallback((redirectUri) => {
    const returnTo = redirectUri || (typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}#top` : "");
    shopifyService.buildCustomerLogoutUrl(returnTo)
      .then((logoutUrl) => {
        shopifyService.clearCustomerSession();
        setShopifyCustomer(null);
        window.location.href = logoutUrl;
      })
      .catch(() => {
        shopifyService.clearCustomerSession();
        setShopifyCustomer(null);
        window.location.hash = "#top";
      });
  }, []);

  const applyPromoCode = useCallback(async (codeValue, customerEmail = "", customerPhone = "") => {
    const code = String(codeValue || "").trim().toUpperCase();
    if (!code) return { success: false, message: "Please enter a privilege voucher code." };
    const localPromo = PROMO_CODES[code] || (await rouletteService.validateVoucher(
      code,
      customerEmail,
      customerPhone,
    )).promo || { type: "flat", value: 0, label: "Shopify discount" };

    try {
      const shopifyCart = await shopifyService.createShopifyCart(cart, {
        discountCodes: [code],
      });
      const shopifyCode = shopifyCart?.discountCodes?.find(
        (entry) => entry.code?.toUpperCase() === code,
      );
      if (!shopifyCode?.applicable) {
        return { success: false, message: "This discount code is not active in Shopify." };
      }

      const subtotal = Number(shopifyCart?.cost?.subtotalAmount?.amount);
      const total = Number(shopifyCart?.cost?.totalAmount?.amount);
      const liveDiscount = Number.isFinite(subtotal) && Number.isFinite(total)
        ? Math.max(0, Math.round(subtotal - total))
        : 0;
      const promo = liveDiscount > 0
        ? { type: "flat", value: liveDiscount, label: `${code} Shopify discount` }
        : localPromo;
      setAppliedPromo({ code, isRouletteVoucher: code.startsWith("HNB-"), ...promo });
      return { success: true, message: promo.label };
    } catch (error) {
      console.warn("Shopify discount validation note:", error);
      return { success: false, message: "Unable to validate this code with Shopify. Please try again." };
    }
  }, [cart]);

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
    openFastrrCheckout,
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
    isShopifyConnected,
    isShopifySynced,
    shopifyCustomer,
    customerAuthError,
    isCustomerAuthLoading,
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
