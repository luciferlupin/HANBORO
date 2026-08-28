import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { authService, ordersService, inventoryService, cartService } from "./supabaseClient";
import { PRODUCTS_DATA } from "./productsData";

const StoreContext = createContext(null);

const CART_STORAGE_KEY = "hanboro_cart_items";

// Built-in Luxury Promo Codes
export const PROMO_CODES = {
  HANBORO10: { type: "percent", value: 10, label: "10% Atelier Welcome Privilege" },
  VIP1000: { type: "flat", value: 1000, label: "₹1,000 Horology Collector Credit" },
  SWISS15: { type: "percent", value: 15, label: "15% Private Collector Tier" },
  HANBORO5: { type: "percent", value: 5, label: "5% Collector Privilege" },
};

export function StoreProvider({ children }) {
  // ── AUTH STATE ──
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("signin"); // "signin" | "signup" | "admin"

  // ── CART STATE ──
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  // ── CHECKOUT STATE ──
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [directCheckoutItem, setDirectCheckoutItem] = useState(null);
  const [recentOrder, setRecentOrder] = useState(null);

  // ── TOAST NOTIFICATIONS ──
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, duration = 3200) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, duration);
  };

  // Sync initial user session & Supabase cart
  useEffect(() => {
    async function loadUserAndCart() {
      setAuthLoading(true);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      if (currentUser?.id) {
        // 1. Sync any existing local cart items to Supabase
        const currentLocal = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        if (currentLocal.length > 0) {
          await cartService.syncLocalCart(currentUser.id, currentLocal);
        }
        // 2. Fetch latest cart from Supabase database
        const remoteCart = await cartService.getCart(currentUser.id);
        if (remoteCart.length > 0) {
          setCart(remoteCart);
        }
      }
      setAuthLoading(false);
    }
    loadUserAndCart();
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not persist cart", e);
    }
  }, [cart]);

  // Auth actions
  const login = async ({ email, password }) => {
    const res = await authService.signIn({ email, password });
    if (!res.error && res.profile) {
      setUser(res.profile);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${res.profile.fullName || res.profile.email}`);

      // Sync & pull cart from Supabase for this logged-in user
      if (res.profile.id) {
        if (cart.length > 0) {
          await cartService.syncLocalCart(res.profile.id, cart);
        }
        const userDbCart = await cartService.getCart(res.profile.id);
        if (userDbCart.length > 0) {
          setCart(userDbCart);
        }
      }
      window.location.hash = "#profile";
    }
    return res;
  };

  const signup = async ({ email, password, fullName, phone }) => {
    const res = await authService.signUp({ email, password, fullName, phone });
    if (!res.error && res.profile) {
      setUser(res.profile);
      setIsAuthModalOpen(false);
      showToast(`Account created. Welcome to Hanboro, ${res.profile.fullName}`);

      // Sync active cart to newly registered Supabase user id
      if (res.profile.id && cart.length > 0) {
        await cartService.syncLocalCart(res.profile.id, cart);
      }
      window.location.hash = "#profile";
    }
    return res;
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    showToast("Signed out of Hanboro Atelier");
  };

  const openAuthModal = (tab = "signin") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAdmin = Boolean(
    user?.role === "admin" ||
    user?.email?.toLowerCase().includes("admin") ||
    user?.email === "admin@hanboro.com" ||
    user?.email === "owner@hanborowatches.in"
  );

  // Cart actions with live Supabase database sync
  const addToCart = (product, quantity = 1, openDrawer = true) => {
    if (!product) return;

    let targetQty = quantity;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        targetQty = existing.quantity + quantity;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: targetQty }
            : item
        );
      }
      return [...prev, { product, quantity, addedAt: new Date().toISOString() }];
    });

    // Save directly to Supabase `cart_items` table if logged in
    if (user?.id) {
      cartService.saveCartItem(user.id, product, targetQty);
    }

    showToast(`Added ${product.name} to Luxury Bag`);
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (user?.id) {
      cartService.removeCartItem(user.id, productId);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      const nextQty = item.quantity + delta;

      if (nextQty <= 0) {
        if (user?.id) cartService.removeCartItem(user.id, productId);
        return prev.filter((i) => i.product.id !== productId);
      }

      if (user?.id) cartService.saveCartItem(user.id, item.product, nextQty);
      return prev.map((i) => (i.product.id === productId ? { ...i, quantity: nextQty } : i));
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
    if (user?.id) {
      cartService.clearUserCart(user.id);
    }
  };

  // Buy Now: instantly triggers checkout for single product or active cart
  const buyNow = (product) => {
    if (product) {
      setDirectCheckoutItem({ product, quantity: 1 });
      setIsCartOpen(false);
      window.location.hash = "#checkout";
    } else if (cart.length > 0) {
      setDirectCheckoutItem(null);
      setIsCartOpen(false);
      window.location.hash = "#checkout";
    } else {
      showToast("Your cart is empty. Please select a timepiece.");
    }
  };

  // Open & Close Checkout Page
  const openCheckout = (directItem = null) => {
    setDirectCheckoutItem(directItem);
    setIsCartOpen(false);
    window.location.hash = "#checkout";
  };

  const closeCheckout = () => {
    setDirectCheckoutItem(null);
    window.location.hash = "#profile";
  };

  // Apply promo code or unique roulette privilege voucher (No stacking - 1 active promo)
  const applyPromoCode = async (codeStr, customerEmail = "", customerPhone = "") => {
    if (!codeStr) return { success: false, message: "Please enter a privilege voucher code." };
    const clean = codeStr.toUpperCase().trim();

    // 1. Check built-in static promo codes
    if (PROMO_CODES[clean]) {
      setAppliedPromo({ code: clean, isRouletteVoucher: false, ...PROMO_CODES[clean] });
      showToast(`Privilege code ${clean} applied!`);
      return { success: true, message: PROMO_CODES[clean].label };
    }

    // 2. Check dynamic single-use 7-day Roulette Privilege vouchers
    try {
      const emailToCheck = customerEmail || user?.email || "";
      const phoneToCheck = customerPhone || user?.phone || "";
      const valRes = await rouletteService.validateVoucher(clean, emailToCheck, phoneToCheck);

      if (valRes.valid && valRes.promo) {
        // Enforce maximum 15% discount ceiling
        let discountValue = valRes.promo.value;
        if (valRes.promo.type === "percent" && discountValue > 15) {
          discountValue = 15;
        }

        setAppliedPromo({
          code: clean,
          isRouletteVoucher: true,
          type: valRes.promo.type,
          value: discountValue,
          label: valRes.promo.label,
        });
        showToast(`Exclusive Privilege ${clean} applied!`);
        return { success: true, message: valRes.promo.label };
      } else {
        return { success: false, message: valRes.message || "Invalid or expired privilege voucher." };
      }
    } catch (err) {
      console.warn("Voucher validation error:", err);
    }

    return { success: false, message: "Invalid or expired privilege voucher." };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  // Calculate totals
  const activeCheckoutItems = useMemo(() => {
    if (directCheckoutItem) {
      return [directCheckoutItem];
    }
    return cart;
  }, [directCheckoutItem, cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotalInr = useMemo(() => {
    return activeCheckoutItems.reduce((sum, item) => {
      const numericPrice = parseInt(
        item.product.price.toString().replace(/[^\d]/g, ""),
        10
      ) || 0;
      return sum + numericPrice * item.quantity;
    }, 0);
  }, [activeCheckoutItems]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percent") {
      // Hard cap at max 15% discount
      const cappedPercent = Math.min(15, appliedPromo.value);
      return Math.round((subtotalInr * cappedPercent) / 100);
    }
    return Math.min(appliedPromo.value, subtotalInr);
  }, [appliedPromo, subtotalInr]);

  const finalTotalInr = Math.max(0, subtotalInr - discountAmount);
  const finalTotalUsd = Math.round(finalTotalInr / 83);

  // Place Order handler
  const placeOrder = async (orderCustomerData) => {
    const formattedItems = activeCheckoutItems.map((item) => ({
      id: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      price: item.product.price,
      priceUsd: item.product.priceUsd,
      quantity: item.quantity,
      image: item.product.image,
    }));

    const orderPayload = {
      user_id: user?.id || null,
      customer_name: orderCustomerData.name,
      customer_email: orderCustomerData.email,
      customer_phone: orderCustomerData.phone,
      shipping_address: {
        address: orderCustomerData.address,
        city: orderCustomerData.city,
        state: orderCustomerData.state,
        pincode: orderCustomerData.pincode,
        country: "India",
      },
      items: formattedItems,
      total_amount: finalTotalInr,
      currency: "INR",
      payment_method: orderCustomerData.paymentMethod || "Credit Card",
      payment_status: "Paid",
      order_status: "Processing",
      discount_applied: appliedPromo ? { code: appliedPromo.code, amount: discountAmount } : null,
    };

    const created = await ordersService.createOrder(orderPayload);
    setRecentOrder(created);

    // If a dynamic roulette single-use voucher was applied, mark it permanently redeemed
    if (appliedPromo?.isRouletteVoucher) {
      await rouletteService.markVoucherUsed(appliedPromo.code, created.order_ref);
    }

    // If it was standard cart, clear it locally and in Supabase
    if (!directCheckoutItem) {
      clearCart();
      if (user?.id) {
        cartService.clearUserCart(user.id);
      }
    }

    showToast(`Order Confirmed! Ref: ${created.order_ref}`);
    return created;
  };

  return (
    <StoreContext.Provider
      value={{
        // Auth
        user,
        isAdmin,
        authLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        logout,

        // Cart
        cart,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,

        // Checkout & Buy Now
        isCheckoutOpen,
        directCheckoutItem,
        activeCheckoutItems,
        subtotalInr,
        discountAmount,
        finalTotalInr,
        finalTotalUsd,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        openCheckout,
        closeCheckout,
        buyNow,
        placeOrder,
        recentOrder,
        showToast,
        toastMessage,

        // Roulette & Privilege Services
        rouletteService,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
