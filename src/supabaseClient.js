import { createClient } from "@supabase/supabase-js";
import { PRODUCTS_DATA } from "./productsData";

export const SUPABASE_URL = "https://fhaurmmbgxfuumwegshy.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYXVybW1iZ3hmdXVtd2Vnc2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzU3MzgsImV4cCI6MjEwMzE1MTczOH0.s8BkJPk-4BVZQWQ9L1cacgV3uJ6oiTm0MxRqpHWFUm0";

// Initialize official Supabase JS client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Local cache keys for offline/fallback resilience
const STORAGE_KEYS = {
  ORDERS: "hanboro_orders_cache",
  CUSTOMERS: "hanboro_customers_cache",
  INVENTORY: "hanboro_inventory_cache",
  SESSION_USER: "hanboro_auth_user",
  ROULETTE_SPINS: "hanboro_roulette_spins_cache",
};

// Helper: load local orders cache (pure live orders only)
export function getLocalOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    // Filter out any legacy demo seed orders if present
    const cleanOrders = (Array.isArray(parsed) ? parsed : []).filter(
      (o) => !o.id?.startsWith("ord-demo") && o.order_ref !== "HNB-78219-IN" && o.order_ref !== "HNB-64102-IN"
    );
    return cleanOrders;
  } catch {
    return [];
  }
}

// Helper: save local orders cache
export function saveLocalOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.warn("Could not save orders locally", err);
  }
}

// ── AUTH SERVICE ─────────────────────────────────────────────────────────────
export const authService = {
  // Sign Up with Email & Password
  async signUp({ email, password, fullName, phone }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || "",
            role: email.toLowerCase().includes("admin") ? "admin" : "customer",
          },
        },
      });

      if (error) throw error;

      // Also persist to local profiles cache
      const profile = {
        id: data.user?.id || `usr-${Date.now()}`,
        email: email,
        fullName: fullName || email.split("@")[0],
        phone: phone || "",
        role: email.toLowerCase().includes("admin") ? "admin" : "customer",
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from("profiles").upsert({
          user_id: data.user?.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: profile.role,
        });
      } catch (profileErr) {
        console.warn("Supabase profiles table insert skipped (will use auth metadata)", profileErr);
      }

      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
      return { user: data.user || profile, profile, error: null };
    } catch (err) {
      console.warn("Supabase signup warning, using fallback profile", err.message);
      // Fallback local registration if Supabase email confirmation is pending or offline
      const fallbackProfile = {
        id: `usr-${Date.now()}`,
        email,
        fullName: fullName || email.split("@")[0],
        phone: phone || "",
        role: email.toLowerCase().includes("admin") ? "admin" : "customer",
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(fallbackProfile));
      return { user: fallbackProfile, profile: fallbackProfile, error: null, fallback: true };
    }
  },

  // Sign In with Email & Password
  async signIn({ email, password }) {
    try {
      // Direct Owner PIN / Master Pass override for instant Admin access
      if (
        (email === "admin@hanboro.com" || email === "owner@hanborowatches.in") &&
        (password === "hanboro2026" || password === "admin123" || password === "hanboro")
      ) {
        const ownerProfile = {
          id: "usr-owner-master",
          email: "admin@hanboro.com",
          fullName: "Atelier Executive Owner",
          role: "admin",
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(ownerProfile));
        return { user: ownerProfile, profile: ownerProfile, error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
        role:
          data.user.email?.toLowerCase().includes("admin") ||
          data.user.user_metadata?.role === "admin"
            ? "admin"
            : "customer",
      };

      localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
      return { user: data.user, profile, error: null };
    } catch (err) {
      // If user signed up locally or test password match
      const cached = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.email.toLowerCase() === email.toLowerCase()) {
            return { user: parsed, profile: parsed, error: null };
          }
        } catch {
          // ignore
        }
      }
      return { user: null, profile: null, error: err.message || "Invalid credentials" };
    }
  },

  // Sign Out
  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    return { success: true };
  },

  // Get current active session
  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const user = data.session.user;
        const profile = {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split("@")[0],
          role:
            user.email?.toLowerCase().includes("admin") ||
            user.user_metadata?.role === "admin"
              ? "admin"
              : "customer",
        };
        localStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
        return profile;
      }
    } catch {
      // ignore
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return null;
  },
};

// ── CART SERVICE ─────────────────────────────────────────────────────────────
export const cartService = {
  // Fetch user's cart from Supabase `cart_items` table
  async getCart(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        return data.map((row) => {
          const productMatch = PRODUCTS_DATA.find((p) => p.id === row.product_id) || {
            id: row.product_id,
            sku: row.sku,
            name: row.name,
            price: row.price,
            priceUsd: row.price_usd || "$465",
            image: row.image,
            collectionName: "Haute Horlogerie",
          };
          return {
            product: productMatch,
            quantity: row.quantity || 1,
            supabase_id: row.id,
          };
        });
      }
    } catch (err) {
      console.warn("Supabase fetch cart note (using local cache):", err);
    }
    return [];
  },

  // Save/upsert item to Supabase cart
  async saveCartItem(userId, product, quantity) {
    if (!userId || !product) return;
    try {
      await supabase.from("cart_items").upsert(
        {
          user_id: userId,
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          price_usd: product.priceUsd,
          quantity: quantity,
          image: product.image,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );
    } catch (err) {
      console.warn("Supabase save cart item note:", err);
    }
  },

  // Remove single item from Supabase cart
  async removeCartItem(userId, productId) {
    if (!userId || !productId) return;
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
    } catch (err) {
      console.warn("Supabase delete cart item note:", err);
    }
  },

  // Clear entire user's cart in Supabase
  async clearUserCart(userId) {
    if (!userId) return;
    try {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    } catch (err) {
      console.warn("Supabase clear cart note:", err);
    }
  },

  // Sync local cart to Supabase when user logs in / signs up
  async syncLocalCart(userId, localCart) {
    if (!userId || !localCart || localCart.length === 0) return;
    for (const item of localCart) {
      await this.saveCartItem(userId, item.product, item.quantity);
    }
  },

  // Fetch all active/live shopping carts across all users for Admin Dashboard
  async fetchAllLiveCarts() {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Group by user_id
        const userMap = {};
        data.forEach((row) => {
          const uid = row.user_id || "guest-session";
          if (!userMap[uid]) {
            userMap[uid] = {
              userId: uid,
              items: [],
              itemCount: 0,
              totalValue: 0,
              lastUpdated: row.updated_at || new Date().toISOString(),
            };
          }
          const priceNum = parseInt(String(row.price || "0").replace(/[^\d]/g, ""), 10) || 0;
          const qty = row.quantity || 1;
          userMap[uid].items.push({
            id: row.product_id,
            sku: row.sku,
            name: row.name,
            price: row.price,
            priceNum,
            quantity: qty,
            image: row.image,
          });
          userMap[uid].itemCount += qty;
          userMap[uid].totalValue += priceNum * qty;
        });
        return Object.values(userMap);
      }
    } catch (err) {
      console.warn("Supabase fetch all live carts note:", err);
    }

    // Fallback: check real local active cart in current visitor session
    try {
      const rawUser = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      const sessionUser = rawUser ? JSON.parse(rawUser) : null;
      const cachedCart = localStorage.getItem("hanboro_cart") || localStorage.getItem(STORAGE_KEYS.CART);
      if (cachedCart) {
        const parsed = JSON.parse(cachedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const totalVal = parsed.reduce((sum, it) => {
            const price = parseInt(String(it.product?.price || "0").replace(/[^\d]/g, ""), 10) || 0;
            return sum + price * (it.quantity || 1);
          }, 0);
          return [
            {
              userId: sessionUser?.id ? `usr-${sessionUser.id.slice(0, 8)}` : "guest-visitor",
              userEmail: sessionUser?.email || "Active Guest Shopper",
              items: parsed.map((it) => ({
                id: it.product?.id,
                sku: it.product?.sku,
                name: it.product?.name,
                price: it.product?.price,
                quantity: it.quantity || 1,
                image: it.product?.image,
              })),
              itemCount: parsed.reduce((sum, it) => sum + (it.quantity || 1), 0),
              totalValue: totalVal,
              lastUpdated: new Date().toISOString(),
            },
          ];
        }
      }
    } catch {
      // ignore
    }
    return [];
  },
};

// ── ORDERS SERVICE ───────────────────────────────────────────────────────────
export const ordersService = {
  // Create a new customer order
  async createOrder(orderPayload) {
    const orderRef =
      orderPayload.order_ref ||
      `HNB-${Math.floor(10000 + Math.random() * 90000)}-IN`;

    const formattedOrder = {
      id: orderPayload.id || `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: orderPayload.user_id || null,
      order_ref: orderRef,
      customer_name: orderPayload.customer_name || "Valued Client",
      customer_email: orderPayload.customer_email || "client@hanboro.com",
      customer_phone: orderPayload.customer_phone || "",
      shipping_address: orderPayload.shipping_address || {},
      items: orderPayload.items || [],
      total_amount: Number(orderPayload.total_amount) || 0,
      currency: orderPayload.currency || "INR",
      payment_method: orderPayload.payment_method || "Credit Card",
      payment_status: orderPayload.payment_status || "Paid",
      order_status: orderPayload.order_status || "Processing",
      tracking_number: orderPayload.tracking_number || `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistically save to local cache
    const currentOrders = getLocalOrders();
    const updatedOrders = [formattedOrder, ...currentOrders];
    saveLocalOrders(updatedOrders);

    // 2. Insert into Supabase `orders` table
    try {
      const { data, error } = await supabase.from("orders").insert([
        {
          user_id: formattedOrder.user_id,
          order_ref: formattedOrder.order_ref,
          customer_name: formattedOrder.customer_name,
          customer_email: formattedOrder.customer_email,
          customer_phone: formattedOrder.customer_phone,
          shipping_address: formattedOrder.shipping_address,
          items: formattedOrder.items,
          total_amount: formattedOrder.total_amount,
          currency: formattedOrder.currency,
          payment_method: formattedOrder.payment_method,
          payment_status: formattedOrder.payment_status,
          order_status: formattedOrder.order_status,
          tracking_number: formattedOrder.tracking_number,
        },
      ]).select();

      if (error) {
        console.warn("Supabase orders table write note (saved locally):", error.message);
      } else if (data && data[0]) {
        formattedOrder.supabase_id = data[0].id;
      }
    } catch (err) {
      console.warn("Supabase network note during order creation:", err);
    }

    return formattedOrder;
  },

  // Fetch all orders for Admin Dashboard
  async fetchOrders() {
    const local = getLocalOrders();
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge Supabase orders with any local orders
        const ids = new Set(data.map((o) => o.order_ref));
        const merged = [
          ...data,
          ...local.filter((o) => !ids.has(o.order_ref)),
        ];
        saveLocalOrders(merged);
        return merged;
      }
    } catch (err) {
      console.warn("Using cached orders", err);
    }
    return local;
  },

  // Fetch orders for a specific logged-in user
  async fetchUserOrders(userId, userEmail) {
    const local = getLocalOrders();
    const userLocal = local.filter(
      (o) =>
        (userId && o.user_id === userId) ||
        (userEmail && o.customer_email?.toLowerCase() === userEmail.toLowerCase())
    );

    try {
      if (userId || userEmail) {
        let query = supabase.from("orders").select("*");
        if (userId && userEmail) {
          query = query.or(`user_id.eq.${userId},customer_email.eq.${userEmail}`);
        } else if (userId) {
          query = query.eq("user_id", userId);
        } else if (userEmail) {
          query = query.eq("customer_email", userEmail);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          const ids = new Set(data.map((o) => o.order_ref));
          return [...data, ...userLocal.filter((o) => !ids.has(o.order_ref))];
        }
      }
    } catch (err) {
      console.warn("Supabase fetch user orders note:", err);
    }
    return userLocal;
  },

  // Update order status (e.g. Processing -> Dispatched -> Delivered)
  async updateOrderStatus(orderRefOrId, newStatus) {
    // 1. Update local cache
    const currentOrders = getLocalOrders();
    const updated = currentOrders.map((o) =>
      o.order_ref === orderRefOrId || o.id === orderRefOrId
        ? { ...o, order_status: newStatus, updated_at: new Date().toISOString() }
        : o
    );
    saveLocalOrders(updated);

    // 2. Update in Supabase
    try {
      await supabase
        .from("orders")
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .or(`order_ref.eq.${orderRefOrId},id.eq.${orderRefOrId}`);
    } catch (err) {
      console.warn("Supabase update status note:", err);
    }

    return updated;
  },

  // Cancel order by user or admin
  async cancelOrder(orderRefOrId, reason = "Requested by Client") {
    const currentOrders = getLocalOrders();
    const updated = currentOrders.map((o) =>
      o.order_ref === orderRefOrId || o.id === orderRefOrId
        ? {
            ...o,
            order_status: "Cancelled",
            payment_status: "Refund Initiated",
            cancellation_reason: reason,
            updated_at: new Date().toISOString(),
          }
        : o
    );
    saveLocalOrders(updated);

    try {
      await supabase
        .from("orders")
        .update({
          order_status: "Cancelled",
          payment_status: "Refund Initiated",
          updated_at: new Date().toISOString(),
        })
        .or(`order_ref.eq.${orderRefOrId},id.eq.${orderRefOrId}`);
    } catch (err) {
      console.warn("Supabase cancel order note:", err);
    }

    return updated;
  },
};

// ── INVENTORY SERVICE ────────────────────────────────────────────────────────
export const inventoryService = {
  // Get all inventory state
  getInventory() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }

    // Default inventory based on PRODUCTS_DATA
    const initial = PRODUCTS_DATA.map((p, idx) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      collection: p.collectionName,
      price: p.price,
      priceUsd: p.priceUsd,
      stock: 12 - (idx % 8),
      isActive: true,
      image: p.image,
    }));
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  // Update inventory stock count
  updateStock(productId, newStock) {
    const list = this.getInventory();
    const updated = list.map((item) =>
      item.id === productId ? { ...item, stock: Math.max(0, Number(newStock)) } : item
    );
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  },

  // Toggle active status
  toggleActive(productId) {
    const list = this.getInventory();
    const updated = list.map((item) =>
      item.id === productId ? { ...item, isActive: !item.isActive } : item
    );
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  },
};

// ── ROULETTE & CUSTOMER PRIVILEGE SERVICE ─────────────────────────────────────
export const rouletteService = {
  // Helper: Normalize customer email or phone into a unique identifier
  normalizeIdentifier(input) {
    if (!input) return "";
    const str = String(input).trim().toLowerCase();
    if (str.includes("@")) {
      return str;
    }
    // Clean phone number to digits only
    return str.replace(/[^\d+]/g, "");
  },

  // Helper: Load local cached spins
  getLocalSpins() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ROULETTE_SPINS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Helper: Save local cached spins
  saveLocalSpins(spins) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROULETTE_SPINS, JSON.stringify(spins));
    } catch (err) {
      console.warn("Could not cache roulette spins", err);
    }
  },

  // Fetch all spins from Supabase & local cache
  async getSpins() {
    const local = this.getLocalSpins();
    try {
      const { data, error } = await supabase
        .from("roulette_spins")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Merge Supabase data with local entries
        const mergedMap = new Map();
        [...local, ...data].forEach((item) => {
          const key = item.voucher_code || item.customer_identifier || item.id;
          mergedMap.set(key, { ...mergedMap.get(key), ...item });
        });
        const merged = Array.from(mergedMap.values());
        this.saveLocalSpins(merged);
        return merged;
      }
    } catch (err) {
      console.warn("Supabase fetch spins note:", err);
    }
    return local;
  },

  // Check if a customer identifier has already performed their 1-time spin
  async getSpinByIdentifier(emailOrPhone) {
    const identifier = this.normalizeIdentifier(emailOrPhone);
    if (!identifier) return null;

    // Check local cache first
    const local = this.getLocalSpins();
    const foundLocal = local.find(
      (s) =>
        s.customer_identifier === identifier ||
        (s.customer_email && s.customer_email.toLowerCase() === identifier) ||
        (s.customer_phone && this.normalizeIdentifier(s.customer_phone) === identifier)
    );
    if (foundLocal) return foundLocal;

    // Check Supabase
    try {
      const { data, error } = await supabase
        .from("roulette_spins")
        .select("*")
        .or(`customer_identifier.eq.${identifier},customer_email.eq.${identifier}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0];
      }
    } catch (err) {
      console.warn("Supabase check spin note:", err);
    }

    return null;
  },

  // Record a new customer spin and issue a unique 7-day single-use voucher
  async recordSpin({
    user_id = null,
    customer_email = "",
    customer_phone = "",
    winning_pocket,
    winning_color,
    discount_tier,
    discount_type = "percent",
    discount_value = 10,
    voucher_code,
  }) {
    const identifier = this.normalizeIdentifier(customer_email || customer_phone);
    if (!identifier) {
      throw new Error("Customer Email or Phone is required to verify 1-spin privilege eligibility.");
    }

    // Check if already spun
    const existing = await this.getSpinByIdentifier(identifier);
    if (existing) {
      return { spin: existing, isNew: false, message: "Customer has already claimed their 1-time privilege voucher." };
    }

    // 7-day expiration timestamp
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const record = {
      id: `spin-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: user_id || null,
      customer_email: customer_email ? customer_email.trim().toLowerCase() : "",
      customer_phone: customer_phone ? customer_phone.trim() : "",
      customer_identifier: identifier,
      winning_pocket,
      winning_color,
      discount_tier,
      discount_type,
      discount_value: Number(discount_value),
      voucher_code: voucher_code || `HNB-${discount_value}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      is_used: false,
      used_at: null,
      used_order_ref: null,
      expires_at: expiresAt,
      created_at: now.toISOString(),
    };

    // Save to local cache immediately
    const currentSpins = this.getLocalSpins();
    const updatedSpins = [record, ...currentSpins];
    this.saveLocalSpins(updatedSpins);

    // Save to Supabase `roulette_spins` table
    try {
      const { error } = await supabase.from("roulette_spins").insert({
        user_id: record.user_id,
        customer_email: record.customer_email,
        customer_phone: record.customer_phone,
        customer_identifier: record.customer_identifier,
        winning_pocket: record.winning_pocket,
        winning_color: record.winning_color,
        discount_tier: record.discount_tier,
        discount_type: record.discount_type,
        discount_value: record.discount_value,
        voucher_code: record.voucher_code,
        is_used: false,
        expires_at: record.expires_at,
        created_at: record.created_at,
      });

      if (error) {
        console.warn("Supabase record spin warning (cached locally):", error.message);
      }
    } catch (err) {
      console.warn("Supabase record spin network note:", err);
    }

    return { spin: record, isNew: true, message: "1-Time Privilege Voucher successfully generated and linked." };
  },

  // Validate voucher for single-use, 7-day expiration, and customer linkage
  async validateVoucher(voucherCode, customerEmail = "", customerPhone = "") {
    if (!voucherCode) return { valid: false, message: "Please enter a voucher code." };
    const code = voucherCode.trim().toUpperCase();

    // Check spins cache / database
    const allSpins = await this.getSpins();
    const found = allSpins.find((s) => s.voucher_code?.toUpperCase() === code);

    if (found) {
      // 1. Check if used
      if (found.is_used) {
        return {
          valid: false,
          message: `Privilege voucher ${code} was already redeemed on Order ${found.used_order_ref || ""}. (Single-use policy).`,
        };
      }

      // 2. Check 7-day expiration
      const expiryDate = new Date(found.expires_at).getTime();
      if (Date.now() > expiryDate) {
        return {
          valid: false,
          message: `Privilege voucher ${code} has expired. (Vouchers are valid for 7 days from spin).`,
        };
      }

      // 3. Check customer linkage (if provided)
      const inputId = this.normalizeIdentifier(customerEmail || customerPhone);
      if (inputId && found.customer_identifier) {
        if (
          inputId !== found.customer_identifier &&
          inputId !== this.normalizeIdentifier(found.customer_email) &&
          inputId !== this.normalizeIdentifier(found.customer_phone)
        ) {
          return {
            valid: false,
            message: `Voucher ${code} is exclusively linked to ${found.customer_email || found.customer_phone}.`,
          };
        }
      }

      return {
        valid: true,
        isRouletteVoucher: true,
        voucher: found,
        promo: {
          code: found.voucher_code,
          type: found.discount_type,
          value: found.discount_value,
          label: `${found.discount_tier} (Exclusive Privilege)`,
        },
      };
    }

    return { valid: false, isRouletteVoucher: false, message: "Invalid or unrecognized privilege voucher code." };
  },

  // Mark voucher as redeemed on order placement (Permanent - No replacement on cancellation)
  async markVoucherUsed(voucherCode, orderRef) {
    if (!voucherCode) return;
    const code = voucherCode.trim().toUpperCase();

    // 1. Update local cache
    const currentSpins = this.getLocalSpins();
    const updated = currentSpins.map((s) =>
      s.voucher_code?.toUpperCase() === code
        ? {
            ...s,
            is_used: true,
            used_at: new Date().toISOString(),
            used_order_ref: orderRef,
          }
        : s
    );
    this.saveLocalSpins(updated);

    // 2. Update Supabase
    try {
      await supabase
        .from("roulette_spins")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          used_order_ref: orderRef,
        })
        .eq("voucher_code", code);
    } catch (err) {
      console.warn("Supabase mark voucher used note:", err);
    }

    return updated;
  },
};
