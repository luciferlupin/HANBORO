import { createClient } from "@supabase/supabase-js";
import { PRODUCTS_DATA } from "./productsData.js";

function sanitizeSupabaseUrl(rawUrl) {
  const fallback = "https://fhaurmmbgxfuumwegshy.supabase.co";
  let url = String(rawUrl || "").trim().replace(/^["']+|["']+$/g, "").trim();
  if (!url) return fallback;
  if (/^[a-z0-9_-]{10,40}$/i.test(url) && !url.includes(".") && !url.includes("/")) {
    return `https://${url}.supabase.co`;
  }
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {}
  return fallback;
}

function sanitizeSupabaseKey(rawKey) {
  const fallback =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYXVybW1iZ3hmdXVtd2Vnc2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzU3MzgsImV4cCI6MjEwMzE1MTczOH0.s8BkJPk-4BVZQWQ9L1cacgV3uJ6oiTm0MxRqpHWFUm0";
  let key = String(rawKey || "").trim().replace(/^["']+|["']+$/g, "").trim();
  return key.length > 20 ? key : fallback;
}

const rawEnvUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : "";
const rawEnvKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : "";

export const SUPABASE_URL = sanitizeSupabaseUrl(rawEnvUrl);
export const SUPABASE_ANON_KEY = sanitizeSupabaseKey(rawEnvKey);

// Initialize official Supabase JS client with resilient fallback
function initSupabase() {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn("Could not create Supabase client with environment URL, falling back:", err);
    return createClient("https://fhaurmmbgxfuumwegshy.supabase.co", sanitizeSupabaseKey(""), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
}

export const supabase = initSupabase();

// Helper: check if a string is a valid standard UUID
export function isUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str || "").trim());
}

// Safe localStorage wrapper for SSR / worker safety
export const safeStorage = {
  getItem(k) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(k);
      }
    } catch {}
    return null;
  },
  setItem(k, v) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(k, v);
      }
    } catch {}
  },
  removeItem(k) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(k);
      }
    } catch {}
  },
};

// Local cache keys for offline/fallback resilience
const STORAGE_KEYS = {
  ORDERS: "hanboro_orders_cache",
  CUSTOMERS: "hanboro_customers_cache",
  INVENTORY: "hanboro_inventory_cache",
  SESSION_USER: "hanboro_auth_user",
  ROULETTE_SPINS: "hanboro_roulette_spins_cache",
  PRODUCTS: "hanboro_custom_products",
};

// Helper: load local orders cache (pure live orders only)
export function getLocalOrders() {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.ORDERS);
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
    safeStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
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

      safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
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
      safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(fallbackProfile));
      return { user: fallbackProfile, profile: fallbackProfile, error: null, fallback: true };
    }
  },

  // Sign In with Email & Password
  async signIn({ email, password }) {
    try {
      // Direct Owner PIN / Master Pass override for instant Admin access
      if (
        (email === "admin@hanboro.com" || email === "owner@hanborowatches.in" || email === "chaitanya@hanboro.com" || email === "chaitanya@hanborowatches.in") &&
        (password === "hanboro2026" || password === "admin123" || password === "hanboro" || password === "owner2026" || password === "chaitanya")
      ) {
        const ownerProfile = {
          id: "usr-owner-master",
          email: email || "owner@hanborowatches.in",
          fullName: "Chaitanya (Owner)",
          role: "admin",
          created_at: new Date().toISOString(),
        };
        safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(ownerProfile));
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

      safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
      return { user: data.user, profile, error: null };
    } catch (err) {
      // If user signed up locally or test password match
      const cached = safeStorage.getItem(STORAGE_KEYS.SESSION_USER);
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
    safeStorage.removeItem(STORAGE_KEYS.SESSION_USER);
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
        safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
        return profile;
      }
    } catch {
      // ignore
    }

    try {
      const cached = safeStorage.getItem(STORAGE_KEYS.SESSION_USER);
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
      const rawUser = safeStorage.getItem(STORAGE_KEYS.SESSION_USER);
      const sessionUser = rawUser ? JSON.parse(rawUser) : null;
      const cachedCart = safeStorage.getItem("hanboro_cart") || safeStorage.getItem(STORAGE_KEYS.CART);
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
      id: isUuid(orderPayload.id) ? orderPayload.id : `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: orderPayload.user_id || null,
      order_ref: orderRef,
      customer_name: orderPayload.customer_name || "Valued Client",
      customer_email: orderPayload.customer_email || "client@hanboro.com",
      customer_phone: orderPayload.customer_phone || "",
      shipping_address: orderPayload.shipping_address || {},
      items: orderPayload.items || [],
      total_amount: Number(orderPayload.total_amount) || 0,
      currency: orderPayload.currency || "INR",
      payment_method: orderPayload.payment_method || "Credit Card (Encrypted)",
      payment_status: orderPayload.payment_status || "Paid",
      order_status: orderPayload.order_status || "Processing",
      fulfillment_status: orderPayload.fulfillment_status || "Unfulfilled",
      delivery_status: orderPayload.delivery_status || "Processing",
      delivery_method: orderPayload.delivery_method || "Standard (Prepaid)",
      channel: orderPayload.channel || "Online Store",
      tracking_number: orderPayload.tracking_number || `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      items_count: orderPayload.items_count || `${orderPayload.items?.length || 1} item`,
      tags: orderPayload.tags || [],
      discount_applied: orderPayload.discount_applied || null,
      notes: orderPayload.notes || null,
      created_at: orderPayload.created_at || new Date().toISOString(),
    };

    // 1. Optimistically save to local cache
    const currentOrders = getLocalOrders();
    const updatedOrders = [formattedOrder, ...currentOrders.filter((o) => o.order_ref !== orderRef)];
    saveLocalOrders(updatedOrders);

    // 2. Insert into Supabase `orders` table
    try {
      const dbInsertPayload = {
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
      };

      // Only pass id if it is a valid UUID, otherwise allow DB default gen_random_uuid()
      if (isUuid(formattedOrder.id)) {
        dbInsertPayload.id = formattedOrder.id;
      }

      const { data, error } = await supabase.from("orders").insert([dbInsertPayload]).select();

      if (error) {
        console.warn("Supabase orders table write note (saved locally):", error.message);
      } else if (data && data[0]) {
        formattedOrder.supabase_id = data[0].id;
        formattedOrder.id = data[0].id;
        // Update local cache with assigned UUID
        const refreshed = getLocalOrders().map((o) => (o.order_ref === orderRef ? { ...o, id: data[0].id, supabase_id: data[0].id } : o));
        saveLocalOrders(refreshed);
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

  // Update order fields safely (by order_ref or UUID)
  async updateOrder(orderRefOrId, updates = {}) {
    const cleanTarget = String(orderRefOrId || "").trim();
    // 1. Update local cache
    const currentOrders = getLocalOrders();
    const updated = currentOrders.map((o) =>
      o.order_ref === cleanTarget || o.id === cleanTarget || (o.supabase_id && o.supabase_id === cleanTarget)
        ? { ...o, ...updates, updated_at: new Date().toISOString() }
        : o
    );
    saveLocalOrders(updated);

    // 2. Update in Supabase safely
    try {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from("orders").update(payload);
      if (isUuid(cleanTarget)) {
        query = query.or(`id.eq.${cleanTarget},order_ref.eq.${cleanTarget}`);
      } else {
        query = query.eq("order_ref", cleanTarget);
      }
      const { error } = await query;
      if (error) {
        // Fallback: try updating only core order_status if custom schema columns are not migrated yet
        if (error.code === "PGRST204" && (updates.fulfillment_status || updates.order_status)) {
          const corePayload = {
            order_status: updates.order_status || updates.fulfillment_status,
            updated_at: new Date().toISOString(),
          };
          if (isUuid(cleanTarget)) {
            await supabase.from("orders").update(corePayload).or(`id.eq.${cleanTarget},order_ref.eq.${cleanTarget}`);
          } else {
            await supabase.from("orders").update(corePayload).eq("order_ref", cleanTarget);
          }
        } else {
          console.warn("Supabase update order note:", error.message);
        }
      }
    } catch (err) {
      console.warn("Supabase update status note:", err);
    }

    return updated;
  },

  // Update order status (e.g. Processing -> Dispatched -> Delivered)
  async updateOrderStatus(orderRefOrId, newStatus) {
    if (typeof newStatus === "object" && newStatus !== null) {
      return this.updateOrder(orderRefOrId, newStatus);
    }
    return this.updateOrder(orderRefOrId, { order_status: newStatus });
  },

  // Cancel order by user or admin
  async cancelOrder(orderRefOrId, reason = "Requested by Client") {
    return this.updateOrder(orderRefOrId, {
      order_status: "Cancelled",
      payment_status: "Refund Initiated",
      cancellation_reason: reason,
    });
  },
};

// ── INVENTORY SERVICE ────────────────────────────────────────────────────────
export const inventoryService = {
  // Asynchronously fetch inventory from Supabase and sync local
  async fetchInventory() {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map((row) => ({
          id: row.id,
          sku: row.sku,
          name: row.name,
          collection: row.collection || "Tourbillon & Complications",
          price: row.price_inr ? `₹${Number(row.price_inr).toLocaleString("en-IN")}` : "₹45,000",
          priceUsd: row.price_usd ? `$${Number(row.price_usd).toLocaleString()}` : "$550",
          stock: typeof row.stock === "number" ? row.stock : 10,
          isActive: row.is_active !== false,
          image: row.image,
        }));
        safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn("Supabase fetch inventory note:", err);
    }
    return this.getInventory();
  },

  // Get all inventory state
  getInventory() {
    let list = [];
    try {
      const cached = safeStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (cached) list = JSON.parse(cached);
    } catch {
      // ignore
    }

    if (!Array.isArray(list) || list.length === 0) {
      list = PRODUCTS_DATA.map((p, idx) => ({
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
    }

    // Sync any custom products saved locally that aren't yet in inventory
    try {
      const customRaw = safeStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (customRaw) {
        const customProducts = JSON.parse(customRaw);
        if (Array.isArray(customProducts)) {
          let hasNew = false;
          customProducts.forEach((cp) => {
            if (!list.some((it) => it.id === cp.id)) {
              list.push({
                id: cp.id,
                sku: cp.sku,
                name: cp.name,
                collection: cp.collectionName || cp.collection,
                price: cp.price,
                priceUsd: cp.priceUsd,
                stock: typeof cp.stock === "number" ? Math.max(0, cp.stock) : 10,
                isActive: cp.isActive !== false,
                image: cp.image,
              });
              hasNew = true;
            }
          });
          if (hasNew) {
            safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(list));
          }
        }
      }
    } catch {
      // ignore
    }

    return list;
  },

  // Upsert a product into inventory (handles creations, clones, and ID renames)
  async upsertInventoryItem(product, previousId = null) {
    const list = this.getInventory();
    const targetId = previousId || product.id;
    const idx = list.findIndex(
      (item) => item.id === targetId || (targetId && item.id === targetId)
    );

    const safeStock = typeof product.stock === "number" && !isNaN(product.stock) ? Math.max(0, product.stock) : 10;
    const safeSku = String(product.sku || "").trim().toUpperCase();
    const safeName = String(product.name || product.sku || "Untitled Timepiece").trim();
    const safeImage = product.image || "/watch-astroworld-moon-rosegold-front-transparent.webp";

    const inventoryEntry = {
      id: product.id,
      sku: safeSku,
      name: safeName,
      collection: product.collectionName || product.collection || "Tourbillon & Complications",
      price: product.price || "₹45,000",
      priceUsd: product.priceUsd || "$550",
      stock: safeStock,
      isActive: product.isActive !== false,
      image: safeImage,
    };

    let updated;
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...updated[idx], ...inventoryEntry };
    } else {
      updated = [inventoryEntry, ...list];
    }

    try {
      safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
      const priceNum = parseInt(String(product.price || "0").replace(/[^\d]/g, ""), 10) || 45000;
      const priceUsdNum = parseInt(String(product.priceUsd || "0").replace(/[^\d]/g, ""), 10) || Math.round(priceNum / 83);

      if (previousId && previousId !== product.id) {
        await supabase.from("inventory").delete().eq("id", previousId);
      }

      await supabase.from("inventory").upsert({
        id: product.id,
        sku: safeSku,
        name: safeName,
        collection: inventoryEntry.collection,
        stock: inventoryEntry.stock,
        price_inr: priceNum,
        price_usd: priceUsdNum,
        image: safeImage,
        is_active: inventoryEntry.isActive,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase upsert inventory note:", err);
    }
    return updated;
  },

  // Update inventory stock count
  async updateStock(productId, newStock) {
    const list = this.getInventory();
    const cleanId = String(productId || "").trim();
    const cleanLower = cleanId.toLowerCase();
    const stockVal = Math.max(0, Number(newStock));
    const targetItem = list.find((item) => item.id?.toLowerCase() === cleanLower || item.sku?.toLowerCase() === cleanLower);
    const targetId = targetItem?.id || cleanId;
    const targetSku = targetItem?.sku || cleanId;

    const updated = list.map((item) =>
      item.id?.toLowerCase() === cleanLower || item.sku?.toLowerCase() === cleanLower ? { ...item, stock: stockVal } : item
    );

    try {
      safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
      await Promise.all([
        supabase
          .from("inventory")
          .update({ stock: stockVal, updated_at: new Date().toISOString() })
          .or(`id.eq.${targetId},sku.ilike.${targetSku}`),
        supabase
          .from("products")
          .update({ stock: stockVal, updated_at: new Date().toISOString() })
          .or(`id.eq.${targetId},sku.ilike.${targetSku}`)
      ]);
    } catch (err) {
      console.warn("Supabase update inventory stock note:", err);
    }
    return updated;
  },

  // Toggle active status
  async toggleActive(productId) {
    const list = this.getInventory();
    const cleanId = String(productId || "").trim();
    const cleanLower = cleanId.toLowerCase();
    const targetItem = list.find((item) => item.id?.toLowerCase() === cleanLower || item.sku?.toLowerCase() === cleanLower);
    const targetId = targetItem?.id || cleanId;
    const targetSku = targetItem?.sku || cleanId;

    let nextActive = true;
    const updated = list.map((item) => {
      if (item.id?.toLowerCase() === cleanLower || item.sku?.toLowerCase() === cleanLower) {
        nextActive = !item.isActive;
        return { ...item, isActive: nextActive };
      }
      return item;
    });

    try {
      safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
      await Promise.all([
        supabase
          .from("inventory")
          .update({ is_active: nextActive, updated_at: new Date().toISOString() })
          .or(`id.eq.${targetId},sku.ilike.${targetSku}`),
        supabase
          .from("products")
          .update({ is_active: nextActive, updated_at: new Date().toISOString() })
          .or(`id.eq.${targetId},sku.ilike.${targetSku}`)
      ]);
    } catch (err) {
      console.warn("Supabase toggle active inventory note:", err);
    }
    return updated;
  },

  // Delete an item from inventory
  async deleteItem(productId) {
    const list = this.getInventory();
    const cleanId = String(productId || "").trim();
    const cleanLower = cleanId.toLowerCase();
    const targetItem = list.find((item) => item.id?.toLowerCase() === cleanLower || item.sku?.toLowerCase() === cleanLower);
    const targetId = targetItem?.id || cleanId;
    const targetSku = targetItem?.sku || cleanId;

    const updated = list.filter((item) => item.id?.toLowerCase() !== cleanLower && item.sku?.toLowerCase() !== cleanLower);
    try {
      safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
      await supabase.from("inventory").delete().or(`id.eq.${targetId},sku.ilike.${targetSku}`);
    } catch (err) {
      console.warn("Supabase delete inventory item note:", err);
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
      const raw = safeStorage.getItem(STORAGE_KEYS.ROULETTE_SPINS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Helper: Save local cached spins
  saveLocalSpins(spins) {
    try {
      safeStorage.setItem(STORAGE_KEYS.ROULETTE_SPINS, JSON.stringify(spins));
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

// ── PRODUCTS SERVICE ─────────────────────────────────────────────────────────
export const productsService = {
  // Get locally cached products or fallback to default PRODUCTS_DATA
  getLocalProducts() {
    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, idx) => ({
            ...p,
            stock: typeof p.stock === "number" && !isNaN(p.stock) ? p.stock : Math.max(1, 12 - (idx % 8)),
          }));
        }
      }
    } catch (e) {
      console.warn("Could not parse cached products:", e);
    }
    return PRODUCTS_DATA.map((p, idx) => ({
      ...p,
      stock: typeof p.stock === "number" && !isNaN(p.stock) ? p.stock : Math.max(1, 12 - (idx % 8)),
    }));
  },

  // Save full products list to local storage with quota resilience
  saveLocalProducts(products) {
    if (!Array.isArray(products)) return;
    try {
      safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn("Storage quota warning, pruning old caches:", e);
      // Attempt quota recovery: prune old caches
      try {
        safeStorage.removeItem(STORAGE_KEYS.ROULETTE_SPINS);
        safeStorage.removeItem("hanboro_orders_cache_backup");
        safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      } catch (err2) {
        console.error("Critical storage quota failure:", err2);
      }
    }
  },

  // Fetch products from Supabase with intelligent merge against local additions
  async fetchProducts() {
    const local = this.getLocalProducts();
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        // Map database columns to application format
        const mapped = data.map((row) => ({
          id: row.id,
          sku: row.sku,
          name: row.name,
          subtitle: row.subtitle || "",
          collection: row.collection || "TOURBILLON",
          collectionName: row.collection_name || "Tourbillon & Complications",
          tag: row.tag || "Haute Horlogerie",
          price: row.price,
          priceUsd: row.price_usd || "$1,200",
          availability: row.availability || "In Stock",
          year: row.year || "2026",
          summary: row.summary || "",
          image: row.image,
          transparentImage: row.transparent_image || row.image,
          altImages: Array.isArray(row.alt_images) ? row.alt_images : [row.image],
          gallery: Array.isArray(row.gallery) ? row.gallery : [],
          specs: typeof row.specs === "object" && row.specs !== null ? row.specs : {},
          stock: typeof row.stock === "number" ? row.stock : 10,
          isActive: row.is_active !== false,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        // INTELLIGENT MERGE: Do not let remote overwrite local products that were newly created or have newer timestamps
        const remoteIds = new Set(mapped.map((p) => String(p.id).toLowerCase()));
        const remoteSkus = new Set(mapped.map((p) => String(p.sku || "").toLowerCase()));

        const localOnly = local.filter((lp) => {
          const lId = String(lp.id).toLowerCase();
          const lSku = String(lp.sku || "").toLowerCase();
          return !remoteIds.has(lId) && (!lSku || !remoteSkus.has(lSku));
        });

        // Combined: local new additions first, followed by remote products
        const merged = [...localOnly, ...mapped];
        this.saveLocalProducts(merged);

        // Auto-sync any local-only timepieces up to Supabase
        if (localOnly.length > 0) {
          localOnly.forEach((lp) => {
            this.syncProductToSupabase(lp).catch(() => {});
          });
        }

        return merged;
      } else if (!error && (!data || data.length === 0)) {
        // Table exists in Supabase but has 0 rows -> auto-seed from master catalog in background
        this.seedSupabaseCatalog().catch(() => {});
      }
    } catch (err) {
      console.warn("Supabase fetch products note:", err);
    }

    return local;
  },

  // Helper: direct sync single product to Supabase
  async syncProductToSupabase(product) {
    const fallbackImage = "/watch-astroworld-moon-rosegold-front-transparent.webp";
    const safeImage = (product.image && typeof product.image === "string" && product.image.trim().length > 0)
      ? product.image.trim()
      : fallbackImage;
    const safeTransparent = (product.transparentImage && typeof product.transparentImage === "string" && product.transparentImage.trim().length > 0)
      ? product.transparentImage.trim()
      : safeImage;
    const safePrice = (product.price && String(product.price).trim().length > 0)
      ? (String(product.price).trim().startsWith("₹") ? String(product.price).trim() : `₹${String(product.price).trim()}`)
      : "₹45,000";
    const safeName = (product.name && String(product.name).trim().length > 0)
      ? String(product.name).trim()
      : (product.sku || "Hanboro Timepiece");
    const safeSku = String(product.sku || "").trim().toUpperCase() || `HBR-${Math.floor(1000 + Math.random() * 9000)}-X`;
    const safeStock = Math.max(0, typeof product.stock === "number" && !isNaN(product.stock) ? product.stock : 10);
    const priceInr = parseInt(safePrice.replace(/[^\d]/g, ""), 10) || 45000;
    const priceUsd = parseInt(String(product.priceUsd || "0").replace(/[^\d]/g, ""), 10) || Math.round(priceInr / 83);

    const dbPayload = {
      id: product.id,
      sku: safeSku,
      name: safeName,
      subtitle: product.subtitle || "",
      collection: product.collection || "TOURBILLON",
      collection_name: product.collectionName || "Tourbillon & Complications",
      tag: product.tag || "Haute Horlogerie",
      price: safePrice,
      price_usd: product.priceUsd || `$${priceUsd.toLocaleString()}`,
      availability: product.availability || "In Stock",
      year: product.year || "2026",
      summary: product.summary || "",
      image: safeImage,
      transparent_image: safeTransparent,
      alt_images: Array.isArray(product.altImages) && product.altImages.length > 0 ? product.altImages : [safeImage],
      gallery: Array.isArray(product.gallery) && product.gallery.length > 0 ? product.gallery : [],
      specs: typeof product.specs === "object" && product.specs !== null ? product.specs : {},
      stock: safeStock,
      is_active: product.isActive !== false,
      updated_at: new Date().toISOString(),
    };

    const [prodRes, invRes] = await Promise.all([
      supabase.from("products").upsert(dbPayload).select("id, sku"),
      supabase.from("inventory").upsert({
        id: product.id,
        sku: safeSku,
        name: dbPayload.name,
        collection: dbPayload.collection_name,
        stock: dbPayload.stock,
        price_inr: priceInr,
        price_usd: priceUsd,
        image: safeImage,
        is_active: dbPayload.is_active,
        updated_at: new Date().toISOString(),
      }).select("id, sku"),
    ]);

    if (prodRes.error) {
      console.error("Supabase products upsert error:", prodRes.error);
      throw new Error(`Products table error: ${prodRes.error.message}`);
    }
    if (invRes.error) {
      console.error("Supabase inventory upsert error:", invRes.error);
      throw new Error(`Inventory table error: ${invRes.error.message}`);
    }

    return { product: prodRes.data?.[0], inventory: invRes.data?.[0] };
  },

  // Auto-seed Supabase products table if empty
  async seedSupabaseCatalog() {
    try {
      const master = PRODUCTS_DATA.map((p, idx) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: p.subtitle || "",
        collection: p.collection || "TOURBILLON",
        collection_name: p.collectionName || "Tourbillon & Complications",
        tag: p.tag || "Haute Horlogerie",
        price: p.price,
        price_usd: p.priceUsd || "$1,200",
        availability: p.availability || "In Stock",
        year: p.year || "2026",
        summary: p.summary || "",
        image: p.image,
        transparent_image: p.transparentImage || p.image,
        alt_images: p.altImages || [p.image],
        gallery: p.gallery || [],
        specs: p.specs || {},
        stock: Math.max(1, 12 - (idx % 8)),
        is_active: true,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("products").upsert(master);
      console.log("Master watch catalog synced to Supabase");
    } catch (e) {
      console.warn("Supabase auto-seed note:", e);
    }
  },

  // Save (insert or update) a product
  async saveProduct(product, previousId = null) {
    const local = this.getLocalProducts();
    const targetId = previousId ? String(previousId).trim().toLowerCase() : String(product.id || "").trim().toLowerCase();
    const targetSku = String(product.sku || "").trim().toLowerCase();

    // Clean and validate product fields
    const safeProduct = {
      ...product,
      sku: String(product.sku || "").trim().toUpperCase(),
      name: String(product.name || "").trim(),
      updatedAt: new Date().toISOString(),
    };

    // Find if the product already exists by ID or SKU
    let existingIndex = local.findIndex((p) => 
      (p.id && String(p.id).trim().toLowerCase() === targetId) ||
      (previousId && p.id && String(p.id).trim().toLowerCase() === String(previousId).trim().toLowerCase()) ||
      (targetSku && p.sku && String(p.sku).trim().toLowerCase() === targetSku)
    );

    let updated;
    if (existingIndex >= 0) {
      updated = [...local];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...safeProduct,
      };
    } else {
      updated = [safeProduct, ...local];
    }

    // If ID or SKU was changed, clean up any old reference locally
    if (previousId && String(previousId).trim().toLowerCase() !== String(safeProduct.id).trim().toLowerCase()) {
      const prevClean = String(previousId).trim().toLowerCase();
      updated = updated.filter((p, idx) => idx === existingIndex || String(p.id).trim().toLowerCase() !== prevClean);
    }

    this.saveLocalProducts(updated);

    // CRITICAL: If ID changed, delete previous record in Supabase FIRST to avoid unique constraint conflict on SKU
    if (previousId && previousId !== safeProduct.id) {
      try {
        await Promise.all([
          supabase.from("products").delete().eq("id", previousId),
          supabase.from("inventory").delete().eq("id", previousId)
        ]);
      } catch (delErr) {
        console.warn("Could not delete previous record before rename:", delErr);
      }
    }

    // Direct sync to Supabase (upsert into both products and inventory)
    await this.syncProductToSupabase(safeProduct);

    return updated;
  },

  // Delete a product by id or sku
  async deleteProduct(productId) {
    const local = this.getLocalProducts();
    const clean = String(productId || "").trim().toLowerCase();
    const target = local.find((p) => String(p.id).trim().toLowerCase() === clean || String(p.sku).trim().toLowerCase() === clean);
    const updated = local.filter((p) => String(p.id).trim().toLowerCase() !== clean && String(p.sku).trim().toLowerCase() !== clean);
    this.saveLocalProducts(updated);

    const targetId = target?.id || productId;
    const targetSku = target?.sku || productId;

    try {
      if (targetId) {
        await Promise.all([
          supabase.from("products").delete().or(`id.eq.${targetId},sku.ilike.${targetSku}`),
          supabase.from("inventory").delete().or(`id.eq.${targetId},sku.ilike.${targetSku}`)
        ]);
      }
    } catch (err) {
      console.warn("Supabase delete product note:", err);
    }

    return updated;
  },

  // Factory reset to master factory catalog
  async resetToMaster() {
    safeStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    const defaults = [...PRODUCTS_DATA];
    this.saveLocalProducts(defaults);
    return defaults;
  },
};

// ── DRAFT ORDERS SERVICE ─────────────────────────────────────────────────────
export const draftOrdersService = {
  getLocalDrafts() {
    try {
      const raw = safeStorage.getItem("hanboro_draft_orders_cache");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveLocalDrafts(drafts) {
    try {
      safeStorage.setItem("hanboro_draft_orders_cache", JSON.stringify(drafts));
    } catch {}
  },

  async fetchDraftOrders(defaultSeed = []) {
    const local = this.getLocalDrafts();
    try {
      const { data, error } = await supabase
        .from("draft_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((d) => ({
          id: d.id,
          draftNumber: d.draft_number,
          customerName: d.customer_name,
          customerEmail: d.customer_email,
          customerPhone: d.customer_phone,
          total: Number(d.total) || 0,
          status: d.status || "Open",
          createdAt: d.created_at ? new Date(d.created_at).toLocaleDateString() : "Recently",
          items: Array.isArray(d.items) ? d.items : [],
          notes: d.notes,
        }));
        this.saveLocalDrafts(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Supabase fetch draft orders note:", err);
    }
    return local || defaultSeed;
  },

  async saveDraftOrder(draft) {
    const local = this.getLocalDrafts() || [];
    const updated = [draft, ...local.filter((d) => d.id !== draft.id)];
    this.saveLocalDrafts(updated);

    try {
      await supabase.from("draft_orders").upsert({
        id: draft.id,
        draft_number: draft.draftNumber,
        customer_name: draft.customerName,
        customer_email: draft.customerEmail,
        customer_phone: draft.customerPhone,
        total: draft.total,
        status: draft.status || "Open",
        items: draft.items || [],
        notes: draft.notes,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase upsert draft order note:", err);
    }
    return updated;
  },

  async deleteDraftOrder(draftId) {
    const local = this.getLocalDrafts() || [];
    const updated = local.filter((d) => d.id !== draftId);
    this.saveLocalDrafts(updated);

    try {
      await supabase.from("draft_orders").delete().eq("id", draftId);
    } catch (err) {
      console.warn("Supabase delete draft order note:", err);
    }
    return updated;
  },
};

// ── DISCOUNTS SERVICE ────────────────────────────────────────────────────────
export const discountsService = {
  getLocalDiscounts() {
    try {
      const raw = safeStorage.getItem("hanboro_custom_promos");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveLocalDiscounts(discounts) {
    try {
      safeStorage.setItem("hanboro_custom_promos", JSON.stringify(discounts));
    } catch {}
  },

  async fetchDiscounts(defaultSeed = {}) {
    const local = this.getLocalDiscounts();
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        const mapped = {};
        data.forEach((d) => {
          mapped[d.code] = {
            id: d.id,
            type: d.type,
            value: Number(d.value) || 15,
            label: d.label || `${d.code}: ${d.value}${d.type === "percent" ? "%" : " INR"} OFF`,
          };
        });
        const combined = { ...defaultSeed, ...mapped, ...(local || {}) };
        this.saveLocalDiscounts(combined);
        return combined;
      }
    } catch (err) {
      console.warn("Supabase fetch discounts note:", err);
    }
    return local || defaultSeed;
  },

  async saveDiscount(promoCode, config) {
    const local = this.getLocalDiscounts() || {};
    const updated = { ...local, [promoCode]: config };
    this.saveLocalDiscounts(updated);

    try {
      await supabase.from("discounts").upsert({
        id: config.id || `dsc-${promoCode.toLowerCase()}`,
        code: promoCode,
        type: config.type || "percent",
        value: Number(config.value) || 15,
        label: config.label || `${promoCode}: ${config.value} OFF`,
        is_active: true,
      });
    } catch (err) {
      console.warn("Supabase upsert discount note:", err);
    }
    return updated;
  },
};

// ── SUPABASE CLOUD DATABASE HEALTH SERVICE ───────────────────────────────────
export const databaseHealthService = {
  // Check connectivity, row counts, and status for all 8 active database tables
  async checkAllTables() {
    const tableNames = [
      "products",
      "inventory",
      "orders",
      "profiles",
      "cart_items",
      "roulette_spins",
      "draft_orders",
      "discounts"
    ];
    const results = {};
    const startTime = performance.now();

    await Promise.all(
      tableNames.map(async (table) => {
        const t0 = performance.now();
        try {
          const { count, error, status } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });
          const latency = Math.round(performance.now() - t0);
          results[table] = {
            active: !error && (status === 200 || status === 206),
            status: status || 200,
            count: typeof count === "number" ? count : 0,
            latency,
            error: error ? error.message : null,
          };
        } catch (err) {
          results[table] = {
            active: false,
            status: 500,
            count: 0,
            latency: Math.round(performance.now() - t0),
            error: err.message,
          };
        }
      })
    );

    const totalLatency = Math.round(performance.now() - startTime);
    const allActive = Object.values(results).every((r) => r.active);

    return {
      success: allActive,
      totalLatency,
      tables: results,
      checkedAt: new Date().toISOString(),
    };
  },
};
