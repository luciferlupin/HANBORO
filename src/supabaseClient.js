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

// Safe localStorage wrapper for SSR / worker safety with in-memory fallback
const memoryStore = new Map();
export const safeStorage = {
  getItem(k) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(k);
      }
    } catch {}
    return memoryStore.get(k) ?? null;
  },
  setItem(k, v) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(k, v);
      }
    } catch {}
    memoryStore.set(k, String(v));
  },
  removeItem(k) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(k);
      }
    } catch {}
    memoryStore.delete(k);
  },
};

// Local cache keys for offline/fallback resilience
export const STORAGE_KEYS = {
  ORDERS: "hanboro_orders_cache",
  CUSTOMERS: "hanboro_customers_cache",
  PROFILES: "hanboro_profiles_cache",
  INVENTORY: "hanboro_inventory_cache",
  SESSION_USER: "hanboro_auth_user",
  ROULETTE_SPINS: "hanboro_roulette_spins_cache",
  PRODUCTS: "hanboro_custom_products",
  WATCH_ORDER: "hanboro_custom_watch_order",
  DELETED_IDS: "hanboro_deleted_product_ids",
};

export function getDeletedProductIds() {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.DELETED_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map((x) => String(x).toLowerCase().trim()) : []);
  } catch {
    return new Set();
  }
}

export function recordDeletedProductId(idOrSku) {
  if (!idOrSku) return;
  try {
    const set = getDeletedProductIds();
    set.add(String(idOrSku).toLowerCase().trim());
    safeStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(Array.from(set)));
  } catch {}
}

export function removeDeletedProductId(idOrSku) {
  if (!idOrSku) return;
  try {
    const set = getDeletedProductIds();
    const clean = String(idOrSku).toLowerCase().trim();
    if (set.has(clean)) {
      set.delete(clean);
      safeStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(Array.from(set)));
    }
  } catch {}
}

// One-time production zero database cache reset (v3) & purge of legacy 83-SKU cache / dev artifacts
if (typeof window !== "undefined" && !safeStorage.getItem("hanboro_prod_zero_db_v3")) {
  safeStorage.removeItem(STORAGE_KEYS.ORDERS);
  safeStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  safeStorage.removeItem(STORAGE_KEYS.PROFILES);
  safeStorage.removeItem("hanboro_draft_orders_cache");
  safeStorage.removeItem(STORAGE_KEYS.ROULETTE_SPINS);
  safeStorage.removeItem(STORAGE_KEYS.INVENTORY);
  safeStorage.removeItem(STORAGE_KEYS.DELETED_IDS);
  safeStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  safeStorage.removeItem(STORAGE_KEYS.WATCH_ORDER);
  safeStorage.setItem("hanboro_prod_zero_db_v3", "true");
}

/**
 * Calculates a valid 13-digit EAN-13 barcode with standard Modulo-10 check digit.
 * Luxury horology prefix: 8908012 (India / Hanboro Haute Horlogerie Ateliers)
 */
export function calculateEan13(input) {
  if (!input) return "8908012010014";
  const str = String(input).trim();
  // If already exactly 13 digits, return as-is
  if (/^\d{13}$/.test(str)) {
    return str;
  }
  // Generate deterministic 5-digit number from input string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const codeNum = String(Math.abs(hash % 90000) + 10000).padStart(5, "0");
  const base12 = `8908012${codeNum}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base12}${checkDigit}`;
}

/**
 * Enriches order items with verified SKU and valid 13-digit EAN barcode
 */
export function enrichOrderItemWithSkuEan(item, allProducts = []) {
  if (!item) return item;
  let sku = item.sku;
  let ean = item.ean;
  const name = item.name || item.title || "";

  if (!sku || !ean) {
    const matched = (allProducts || []).find(
      (p) =>
        (item.id && p.id === item.id) ||
        (item.sku && p.sku === item.sku) ||
        (name && p.name && (p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase())))
    );
    if (matched) {
      if (!sku) sku = matched.sku || matched.id;
      if (!ean) ean = matched.ean || calculateEan13(sku || matched.id);
    }
  }

  if (!sku) {
    sku = item.id || `HBR-${Math.abs(name.length * 41 + 101)}-REF`;
  }
  if (!ean) {
    ean = calculateEan13(sku || name || item.id);
  }

  return {
    ...item,
    sku: String(sku).toUpperCase(),
    ean: String(ean),
  };
}

// Master VIP Customer Profiles Seed
export const DEFAULT_CUSTOMER_PROFILES = [
  {
    id: "prof-admin-connect",
    email: "connect@hanborowatches.in",
    full_name: "Hanboro Administrator",
    phone: "+918882069334",
    role: "admin",
    vip_tier: "Executive Administrator",
    notes: "Official Hanboro Haute Horlogerie Storefront and Systems Administrator.",
    shipping_info: {
      address: "Building No. 3, 4th Floor, Block M, DLF City Phase II, Road No. 5, Sector 25",
      city: "Gurugram",
      state: "Haryana",
      pin: "122008",
      pincode: "122008",
      country: "India",
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "prof-ankan-das",
    email: "ankan.das@bengalhorology.in",
    full_name: "Ankan Das",
    phone: "+919830011223",
    role: "customer",
    vip_tier: "VIP Horology Patron",
    notes: "Astroworld Tourbillon collector. Prefers bespoke piano-lacquered wooden vault packaging.",
    shipping_info: {
      address: "Ballygunge Circular Road, Suite 4B",
      city: "Kolkata",
      state: "West Bengal",
      pin: "700019",
      pincode: "700019",
      country: "India",
    },
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "prof-shiva-karnati",
    email: "shiva.karnati@hyderabadtech.in",
    full_name: "Shiva Karnati",
    phone: "+919849012345",
    role: "customer",
    vip_tier: "Diamond Collector",
    notes: "Casino Roulette Complications connoisseur. Fastrr VIP 1-click verified patron.",
    shipping_info: {
      address: "Road No. 36, Jubilee Hills Horizon",
      city: "Hyderabad",
      state: "Telangana",
      pin: "500081",
      pincode: "500081",
      country: "India",
    },
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "prof-deepak-agarwal",
    email: "deepak.agarwal@delhiwealth.com",
    full_name: "Deepak Agarwal",
    phone: "+919811122334",
    role: "customer",
    vip_tier: "Grand Complication Connoisseur",
    notes: "Prefers Tonneau Skeleton and double tourbillon complications. Insured white-glove courier.",
    shipping_info: {
      address: "DLF Phase 5, Golf Course Road, The Crest",
      city: "Gurgaon",
      state: "Haryana",
      pin: "122002",
      pincode: "122002",
      country: "India",
    },
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "prof-goutham-s",
    email: "goutham.s@chennaiauto.com",
    full_name: "Goutham singaravelu",
    phone: "+919840012345",
    role: "customer",
    vip_tier: "Haute Horlogerie Patron",
    notes: "Celestial Dragon Tourbillon allocation holder. Pre-paid VIP client.",
    shipping_info: {
      address: "12 Boat Club Road, RA Puram",
      city: "Chennai",
      state: "Tamil Nadu",
      pin: "600004",
      pincode: "600004",
      country: "India",
    },
    created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
  },
  {
    id: "prof-nandan-shetty",
    email: "nandan.shetty@bangalorecap.in",
    full_name: "Nandan Shetty",
    phone: "+919880023456",
    role: "customer",
    vip_tier: "VIP Horology Patron",
    notes: "Cyber Cogwheel Skeleton collector.",
    shipping_info: {
      address: "Lavelle Road, Richmond Town",
      city: "Bengaluru",
      state: "Karnataka",
      pin: "560001",
      pincode: "560001",
      country: "India",
    },
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: "prof-viren-mehta",
    email: "viren.mehta@mumbaitrading.com",
    full_name: "VIREN-",
    phone: "+919821098765",
    role: "customer",
    vip_tier: "Collector Tier",
    notes: "Interested in limited edition bespoke allocations.",
    shipping_info: {
      address: "Pali Hill, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pin: "400050",
      pincode: "400050",
      country: "India",
    },
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
  },
];

// Helper: load local customer profiles cache (pure live users only)
export function getLocalProfiles() {
  try {
    const raw = safeStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Exclude any legacy mock patron seeds
      return parsed.filter(
        (p) =>
          p.email !== "ankan.das@bengalhorology.in" &&
          p.email !== "shiva.karnati@hyderabadtech.in" &&
          p.email !== "deepak.agarwal@delhiwealth.com" &&
          p.email !== "goutham.s@chennaiauto.com" &&
          p.email !== "nandan.shetty@bangalorecap.in" &&
          p.email !== "viren.mehta@mumbaitrading.com"
      );
    }
    return [];
  } catch {
    return [];
  }
}

// Helper: save local customer profiles cache
export function saveLocalProfiles(profiles) {
  try {
    safeStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.warn("Could not save profiles locally", err);
  }
}

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
      (o) =>
        !o.id?.startsWith("ord-demo") &&
        !o.id?.startsWith("ord-100") &&
        o.order_ref !== "HNB-78219-IN" &&
        o.order_ref !== "HNB-64102-IN" &&
        o.customer_email !== "ankan.das@bengalhorology.in" &&
        o.customer_email !== "shiva.karnati@hyderabadtech.in"
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
      const cleanEmail = (email || "").trim().toLowerCase();
      const isAdminEmail = cleanEmail.includes("admin") || cleanEmail === "connect@hanborowatches.in";

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || "",
            role: isAdminEmail ? "admin" : "customer",
          },
        },
      });

      if (error) throw error;

      // Also persist to local profiles cache
      const profile = {
        id: data.user?.id || `usr-${Date.now()}`,
        email: cleanEmail,
        fullName: fullName || (cleanEmail === "connect@hanborowatches.in" ? "Hanboro Administrator" : cleanEmail.split("@")[0]),
        phone: phone || "",
        role: isAdminEmail ? "admin" : "customer",
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from("profiles").upsert({
          user_id: data.user?.id,
          email: cleanEmail,
          full_name: profile.fullName,
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
      const cleanEmail = (email || "").trim().toLowerCase();
      const isAdminEmail = cleanEmail.includes("admin") || cleanEmail === "connect@hanborowatches.in";
      // Fallback local registration if Supabase email confirmation is pending or offline
      const fallbackProfile = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        fullName: fullName || (cleanEmail === "connect@hanborowatches.in" ? "Hanboro Administrator" : cleanEmail.split("@")[0]),
        phone: phone || "",
        role: isAdminEmail ? "admin" : "customer",
        created_at: new Date().toISOString(),
      };
      safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(fallbackProfile));
      return { user: fallbackProfile, profile: fallbackProfile, error: null, fallback: true };
    }
  },

  // Sign In with Email & Password
  async signIn({ email, password }) {
    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      const cleanPassword = (password || "").trim();

      // Direct Owner & Official Admin Master Pass override for instant Admin access
      const isOfficialAdmin =
        cleanEmail === "connect@hanborowatches.in" ||
        cleanEmail === "admin@hanboro.com" ||
        cleanEmail === "owner@hanborowatches.in" ||
        cleanEmail === "chaitanya@hanboro.com" ||
        cleanEmail === "chaitanya@hanborowatches.in";

      const isValidAdminPass =
        cleanPassword === "Jaiwebsite@2026" ||
        cleanPassword === "hanboro2026" ||
        cleanPassword === "admin123" ||
        cleanPassword === "hanboro" ||
        cleanPassword === "owner2026" ||
        cleanPassword === "chaitanya";

      if (isOfficialAdmin && isValidAdminPass) {
        const isConnectAdmin = cleanEmail === "connect@hanborowatches.in";
        const adminProfile = {
          id: isConnectAdmin ? "usr-admin-connect" : "usr-owner-master",
          email: cleanEmail,
          fullName: isConnectAdmin ? "Hanboro Administrator" : "Chaitanya (Owner)",
          role: "admin",
          created_at: new Date().toISOString(),
        };
        safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(adminProfile));
        return { user: adminProfile, profile: adminProfile, error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) throw error;

      const isUserAdmin =
        data.user.email?.toLowerCase().includes("admin") ||
        data.user.email?.toLowerCase() === "connect@hanborowatches.in" ||
        data.user.email?.toLowerCase() === "owner@hanborowatches.in" ||
        data.user.user_metadata?.role === "admin";

      const profile = {
        id: data.user.id,
        email: data.user.email,
        fullName:
          data.user.user_metadata?.full_name ||
          (data.user.email?.toLowerCase() === "connect@hanborowatches.in"
            ? "Hanboro Administrator"
            : data.user.email?.split("@")[0]),
        role: isUserAdmin ? "admin" : "customer",
      };

      safeStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(profile));
      return { user: data.user, profile, error: null };
    } catch (err) {
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
        const isUserAdmin =
          user.email?.toLowerCase().includes("admin") ||
          user.email?.toLowerCase() === "connect@hanborowatches.in" ||
          user.email?.toLowerCase() === "owner@hanborowatches.in" ||
          user.user_metadata?.role === "admin";

        const profile = {
          id: user.id,
          email: user.email,
          fullName:
            user.user_metadata?.full_name ||
            (user.email?.toLowerCase() === "connect@hanborowatches.in"
              ? "Hanboro Administrator"
              : user.email?.split("@")[0]),
          role: isUserAdmin ? "admin" : "customer",
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

export function getOrCreateGuestSessionId() {
  try {
    let sess = safeStorage.getItem("hanboro_guest_session_id");
    if (!sess) {
      sess = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      safeStorage.setItem("hanboro_guest_session_id", sess);
    }
    return sess;
  } catch {
    return `guest_${Date.now()}`;
  }
}

// ── CART SERVICE ─────────────────────────────────────────────────────────────
export const cartService = {
  // Fetch user's cart from Supabase `cart_items` table
  async getCart(userId) {
    const targetUserId = userId || getOrCreateGuestSessionId();
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", targetUserId);

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
    const targetUserId = userId || getOrCreateGuestSessionId();
    if (!product) return;
    try {
      await supabase.from("cart_items").upsert(
        {
          user_id: targetUserId,
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
    const targetUserId = userId || getOrCreateGuestSessionId();
    if (!productId) return;
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", targetUserId)
        .eq("product_id", productId);
    } catch (err) {
      console.warn("Supabase delete cart item note:", err);
    }
  },

  // Clear entire user's cart in Supabase
  async clearUserCart(userId) {
    const targetUserId = userId || getOrCreateGuestSessionId();
    try {
      await supabase.from("cart_items").delete().eq("user_id", targetUserId);
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
  getLocalOrders() {
    return getLocalOrders();
  },

  // Create a new customer order
  async createOrder(orderPayload) {
    const orderRef =
      orderPayload.order_ref ||
      `HNB-${Math.floor(10000 + Math.random() * 90000)}-IN`;

    const rawItems = orderPayload.items || [];

    const isCod =
      String(orderPayload.payment_method || "").toLowerCase().includes("cod") ||
      String(orderPayload.payment_method || "").toLowerCase().includes("cash on delivery") ||
      String(orderPayload.delivery_method || "").toLowerCase().includes("cod") ||
      String(orderPayload.payment_status || "").toLowerCase() === "pending" ||
      orderPayload.isCod === true;

    const resolvedPaymentMethod =
      orderPayload.payment_method || (isCod ? "Cash on Delivery (COD)" : "Credit Card (Encrypted)");
    const resolvedPaymentStatus =
      orderPayload.payment_status || (isCod ? "Pending" : "Paid");
    const resolvedDeliveryMethod =
      orderPayload.delivery_method || (isCod ? "Concierge White-Glove (COD)" : "Standard (Prepaid)");
    const defaultTags = isCod ? ["COD", "White-Glove"] : ["Prepaid", "Standard"];

    const formattedOrder = {
      id: isUuid(orderPayload.id) ? orderPayload.id : `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: orderPayload.user_id || null,
      order_ref: orderRef,
      customer_name: orderPayload.customer_name || "Valued Client",
      customer_email: orderPayload.customer_email || "client@hanboro.com",
      customer_phone: orderPayload.customer_phone || "",
      shipping_address: orderPayload.shipping_address || {},
      items: rawItems.map((it) => enrichOrderItemWithSkuEan(it)),
      total_amount: Number(orderPayload.total_amount) || 0,
      currency: orderPayload.currency || "INR",
      payment_method: resolvedPaymentMethod,
      payment_status: resolvedPaymentStatus,
      order_status: orderPayload.order_status || "Processing",
      fulfillment_status: orderPayload.fulfillment_status || "Unfulfilled",
      delivery_status: orderPayload.delivery_status || "Processing",
      delivery_method: resolvedDeliveryMethod,
      channel: orderPayload.channel || "Online Store",
      tracking_number: orderPayload.tracking_number || `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      items_count: orderPayload.items_count || `${orderPayload.items?.length || 1} item`,
      tags: orderPayload.tags && orderPayload.tags.length > 0 ? orderPayload.tags : defaultTags,
      discount_applied: orderPayload.discount_applied || null,
      notes: orderPayload.notes || null,
      created_at: orderPayload.created_at || new Date().toISOString(),
    };

    // 1. Optimistically save to local cache
    const currentOrders = getLocalOrders();
    const updatedOrders = [formattedOrder, ...currentOrders.filter((o) => o.order_ref !== orderRef)];
    saveLocalOrders(updatedOrders);

    // Also auto-sync/upsert into local customer profile database
    if (formattedOrder.customer_email) {
      profilesService.upsertProfile({
        email: formattedOrder.customer_email,
        full_name: formattedOrder.customer_name,
        phone: formattedOrder.customer_phone,
        shipping_info: formattedOrder.shipping_address,
      }).catch(() => {});
    }

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
        fulfillment_status: formattedOrder.fulfillment_status,
        delivery_status: formattedOrder.delivery_status,
        delivery_method: formattedOrder.delivery_method,
        channel: formattedOrder.channel,
        tracking_number: formattedOrder.tracking_number,
        items_count: formattedOrder.items_count,
        tags: formattedOrder.tags,
        discount_applied: formattedOrder.discount_applied,
        notes: formattedOrder.notes,
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
        // Merge Supabase orders with any local orders and enrich with SKU + EAN
        const ids = new Set(data.map((o) => o.order_ref));
        const merged = [
          ...data.map((o) => ({
            ...o,
            items: (o.items || []).map((it) => enrichOrderItemWithSkuEan(it)),
          })),
          ...local.filter((o) => !ids.has(o.order_ref)).map((o) => ({
            ...o,
            items: (o.items || []).map((it) => enrichOrderItemWithSkuEan(it)),
          })),
        ];
        saveLocalOrders(merged);
        return merged;
      }
    } catch (err) {
      console.warn("Using cached orders", err);
    }
    return local.map((o) => ({
      ...o,
      items: (o.items || []).map((it) => enrichOrderItemWithSkuEan(it)),
    }));
  },

  // Fetch orders for a specific logged-in user
  async fetchUserOrders(userId, userEmail) {
    const local = getLocalOrders();
    const userLocal = local.filter(
      (o) =>
        (userId && o.user_id === userId) ||
        (userEmail && o.customer_email?.toLowerCase() === userEmail.toLowerCase())
    ).map((o) => ({
      ...o,
      items: (o.items || []).map((it) => enrichOrderItemWithSkuEan(it)),
    }));

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
          const enrichedRemote = data.map((o) => ({
            ...o,
            items: (o.items || []).map((it) => enrichOrderItemWithSkuEan(it)),
          }));
          return [...enrichedRemote, ...userLocal.filter((o) => !ids.has(o.order_ref))];
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

// ── PROFILES SERVICE (Customer Dossier & VIP Database) ────────────────────────
export const profilesService = {
  // Fetch all customer profiles for Admin Dashboard
  async fetchProfiles() {
    const local = getLocalProfiles();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const liveOnly = data.filter(
          (p) =>
            p.email !== "ankan.das@bengalhorology.in" &&
            p.email !== "shiva.karnati@hyderabadtech.in" &&
            p.email !== "deepak.agarwal@delhiwealth.com" &&
            p.email !== "goutham.s@chennaiauto.com" &&
            p.email !== "nandan.shetty@bangalorecap.in" &&
            p.email !== "viren.mehta@mumbaitrading.com"
        );
        const emailSet = new Set(liveOnly.map((p) => p.email?.toLowerCase()));
        const merged = [
          ...liveOnly,
          ...local.filter((p) => !emailSet.has(p.email?.toLowerCase())),
        ];
        saveLocalProfiles(merged);
        return merged;
      }
    } catch (err) {
      console.warn("Supabase profiles query note (using local profiles):", err);
    }
    return local;
  },

  // Save or update customer profile dossier
  async upsertProfile(profilePayload) {
    const local = getLocalProfiles();
    const email = (profilePayload.email || "client@hanborowatches.in").toLowerCase().trim();
    const existingIndex = local.findIndex((p) => p.email?.toLowerCase() === email);

    const updatedProfile = {
      id: profilePayload.id || (existingIndex >= 0 ? local[existingIndex].id : `prof-${Date.now()}`),
      email: email,
      full_name: profilePayload.full_name || profilePayload.fullName || profilePayload.name || (existingIndex >= 0 ? local[existingIndex].full_name : "Valued Client"),
      phone: profilePayload.phone || (existingIndex >= 0 ? local[existingIndex].phone : ""),
      role: profilePayload.role || (existingIndex >= 0 ? local[existingIndex].role : "customer"),
      vip_tier: profilePayload.vip_tier || (existingIndex >= 0 ? local[existingIndex].vip_tier : "VIP Horology Patron"),
      notes: profilePayload.notes || (existingIndex >= 0 ? local[existingIndex].notes : ""),
      shipping_info: profilePayload.shipping_info || profilePayload.shippingAddress || (existingIndex >= 0 ? local[existingIndex].shipping_info : {}),
      created_at: profilePayload.created_at || (existingIndex >= 0 ? local[existingIndex].created_at : new Date().toISOString()),
      updated_at: new Date().toISOString(),
    };

    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...local];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...updatedProfile };
    } else {
      updatedList = [updatedProfile, ...local];
    }
    saveLocalProfiles(updatedList);

    try {
      const dbPayload = {
        email: updatedProfile.email,
        full_name: updatedProfile.full_name,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        vip_tier: updatedProfile.vip_tier,
        notes: updatedProfile.notes,
        shipping_info: updatedProfile.shipping_info,
      };
      if (isUuid(updatedProfile.id)) {
        dbPayload.id = updatedProfile.id;
      }
      await supabase.from("profiles").upsert([dbPayload], { onConflict: "email" });
    } catch (err) {
      console.warn("Supabase profiles upsert note:", err);
    }

    return updatedProfile;
  },

  // Delete customer profile
  async deleteProfile(profileIdOrEmail) {
    const clean = String(profileIdOrEmail || "").toLowerCase().trim();
    const local = getLocalProfiles();
    const filtered = local.filter((p) => p.id !== clean && p.email?.toLowerCase() !== clean);
    saveLocalProfiles(filtered);

    try {
      if (clean.includes("@")) {
        await supabase.from("profiles").delete().eq("email", clean);
      } else if (isUuid(clean)) {
        await supabase.from("profiles").delete().eq("id", clean);
      }
    } catch (err) {
      console.warn("Supabase profile deletion warning:", err);
    }
    return filtered;
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

      const remoteMap = new Map();
      if (!error && Array.isArray(data)) {
        data
          .filter(
            (row) =>
              row &&
              !/-clone-/i.test(String(row.id || "")) &&
              !/-clone-/i.test(String(row.sku || "")) &&
              !/\(Variant\)/i.test(String(row.name || "")) &&
              !String(row.name || "").includes("WITH Planetarium Design")
          )
          .forEach((row) => {
            if (row.id) remoteMap.set(String(row.id).toLowerCase(), row);
            if (row.sku) remoteMap.set(String(row.sku).toUpperCase(), row);
          });
      }

      // Merge remote stock/pricing updates onto canonical 104 PRODUCTS_DATA
      const mergedInventory = PRODUCTS_DATA.map((p, idx) => {
        const pId = String(p.id).toLowerCase();
        const pSku = String(p.sku).toUpperCase();
        const remote = remoteMap.get(pId) || remoteMap.get(pSku);
        return {
          id: remote?.id || p.id,
          sku: remote?.sku || p.sku,
          name: remote?.name || p.name,
          collection: remote?.collection || p.collectionName || p.collection || "Tourbillon & Complications",
          price: remote?.price || (remote?.price_inr ? `₹${Number(remote.price_inr).toLocaleString("en-IN")}` : p.price),
          priceUsd: remote?.price_usd || p.priceUsd,
          stock: typeof remote?.stock === "number" ? remote.stock : (typeof p.stock === "number" ? p.stock : Math.max(1, 12 - (idx % 8))),
          isActive: remote ? remote.is_active !== false : (p.isActive !== false),
          image: remote?.image || p.image,
        };
      });

      safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(mergedInventory));
      return mergedInventory;
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
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          list = parsed.filter(
            (it) =>
              it &&
              !/-clone-/i.test(String(it.id || "")) &&
              !/-clone-/i.test(String(it.sku || "")) &&
              !/\(Variant\)/i.test(String(it.name || "")) &&
              !String(it.name || "").includes("WITH Planetarium Design")
          );
        }
      }
    } catch {
      // ignore
    }

    if (!Array.isArray(list) || list.length < PRODUCTS_DATA.length) {
      let customCatalog = [];
      try {
        const rawCustom = safeStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (rawCustom) {
          const parsedCustom = JSON.parse(rawCustom);
          if (Array.isArray(parsedCustom)) customCatalog = parsedCustom;
        }
      } catch {}

      const customMap = new Map();
      customCatalog.forEach((cp) => {
        if (cp.id) customMap.set(String(cp.id).toLowerCase(), cp);
        if (cp.sku) customMap.set(String(cp.sku).toUpperCase(), cp);
        if (cp.previousId) customMap.set(String(cp.previousId).toLowerCase(), cp);
        if (cp.previousSku) customMap.set(String(cp.previousSku).toUpperCase(), cp);
      });

      const existingMap = new Map();
      if (Array.isArray(list)) {
        list.forEach((it) => {
          if (it.id) existingMap.set(String(it.id).toLowerCase(), it);
          if (it.sku) existingMap.set(String(it.sku).toUpperCase(), it);
        });
      }
      list = PRODUCTS_DATA.map((p, idx) => {
        const cp = customMap.get(String(p.id).toLowerCase()) || customMap.get(String(p.sku).toUpperCase());
        const existing = existingMap.get(String(p.id).toLowerCase()) || existingMap.get(String(p.sku).toUpperCase());
        return {
          id: cp?.id || existing?.id || p.id,
          sku: cp?.sku || existing?.sku || p.sku,
          name: cp?.name || existing?.name || p.name,
          collection: cp?.collectionName || cp?.collection || existing?.collection || p.collectionName || p.collection,
          price: cp?.price || existing?.price || p.price,
          priceUsd: cp?.priceUsd || existing?.priceUsd || p.priceUsd,
          stock: typeof cp?.stock === "number" ? cp.stock : (typeof existing?.stock === "number" ? existing.stock : (typeof p.stock === "number" ? p.stock : Math.max(1, 12 - (idx % 8)))),
          isActive: cp ? cp.isActive !== false : (existing ? existing.isActive !== false : (p.isActive !== false)),
          image: cp?.image || existing?.image || p.image,
        };
      });
      safeStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(list));
    }

    return list;
  },

  // Upsert a product into inventory (handles creations, clones, SKU migrations, and ID renames)
  async upsertInventoryItem(product, previousId = null, previousSku = null) {
    const list = this.getInventory();
    const targetId = previousId || product.id;
    const oldSku = previousSku ? String(previousSku).trim().toUpperCase() : null;
    const safeSku = String(product.sku || "").trim().toUpperCase();
    const idx = list.findIndex(
      (item) => item.id === targetId || (oldSku && item.sku === oldSku) || item.sku === safeSku
    );

    const safeStock = typeof product.stock === "number" && !isNaN(product.stock) ? Math.max(0, product.stock) : 10;
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

      const idChanged = previousId && String(previousId).trim().toLowerCase() !== String(product.id).trim().toLowerCase();
      const skuChanged = oldSku && oldSku !== safeSku;

      if (idChanged || skuChanged) {
        const cleanOldId = previousId ? String(previousId).trim() : null;
        if (cleanOldId && oldSku) {
          await supabase.from("inventory").delete().or(`id.eq.${cleanOldId},sku.ilike.${oldSku}`);
        } else if (cleanOldId) {
          await supabase.from("inventory").delete().eq("id", cleanOldId);
        } else if (oldSku) {
          await supabase.from("inventory").delete().ilike("sku", oldSku);
        }
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

// ── PRODUCTS SERVICE & DETERMINISTIC RANKING ────────────────────────────────
// 104 master timepieces canonical ordering matching desktop boutique sequence (#1: HBR-980-AUTO-ORBITA-G)
export const MASTER_CANONICAL_ORDER = [
  "HBR-980-AUTO-ORBITA-G",
  "HBR-989-3-BLACK-AUTO",
  "HBR-989-3-GREEN-AUTO",
  "HBR-989-3-ORANGE-AUTO",
  "HBR-989-3-WHITE-AUTO",
  "HBR-989-3-RED-AUTO",
  "HBR-8851-1-SILVER",
  "HBR-8851-1-R.GOLD-SILVER",
  "HBR-8851-1-R.GOLD-BROWN",
  "HBR-985-AUTO-APEX-RG-BLK",
  "HBR-985-AUTO-APEX-RG-RED",
  "HBR-985-AUTO-APEX-SLV-RED",
  "HBR-985-AUTO-APEX-SLV-YLW",
  "HBR-985-AUTO-APEX-RG-FBLK",
  "HBR-985-AUTO-APEX-slvr",
  "HBR-989-3-BLUE-AUTO",
  "HBR-980-AUTO-ORBITA-S",
  "HBR-995-1-AUTO-G",
  "HBR-995-1-AUTO-S",
  "HBR-995-1-AUTO-RED",
  "HBR-927-SLV-BLK",
  "HBR-927-RG-BLK",
  "HBR-927-RG-RED",
  "HBR-30027-1-AUTO-GEAR-SLV-BLK",
  "HBR-30027-1-AUTO-GEAR-GLD-BLK",
  "HBR-30027-1-AUTO-GEAR-blk",
  "HBR-8824-AUTO-NAVIGATOR-BLK",
  "HBR-8824-AUTO-NAVIGATOR-RG-WYT",
  "HBR-1018-AUTO-ZOD-GLD",
  "HBR-1018-AUTO-ZOD-SLV",
  "HBR-1001-1-AUTO-ROULETTE-GLD",
  "HBR-1001-1-AUTO-ROULETTE-SLV",
  "HBR-1001-2-AUTO-ROULETTE-GLD",
  "HBR-1001-2-AUTO-ROULETTE-SLV",
  "HBR-1020-AUTO-AST-GLD",
  "HBR-1020-AUTO-AST-SLV",
  "HBR-2003-AUTO-HIVE-aquablue",
  "HBR-2003-AUTO-HIVE-BLK",
  "HBR-2003-AUTO-HIVE-DEEPSEABLUE",
  "HBR-933-AUTO-FALCONX-BLK",
  "HBR-933-AUTO-FALCONX-BLUE",
  "HBR-848-AUTO-NEBULA-BLK",
  "vHBR-848-AUTO-NEBULA-Blue",
  "HBR-8821-AUTO-ASTRO-BLUE",
  "HBR-8821-AUTO-ASTRO-RG-WYT",
  "HBR-8821-AUTO-ASTRO-BLACK",
  "HBR-918-AUTO-TORQUE-SLV",
  "HBR-918-AUTO-TORQUE-GREEN",
  "HBR-918-AUTO-TORQUE-GLD",
  "HBR-703-2-AUTO-PRISM",
  "HBR-917-AUTO-AVENGER-SLV",
  "HBR-917-AUTO-AVENGER-GOLD",
  "HBR-RING-5378-2TIFFANY",
  "HBR-RING-5378-BLUE",
  "HBR-906-AUTO-RGSL",
  "HBR-906-AUTO-SILVER",
  "HBR-906-AUTO-BLACK",
  "HBR-9038-AUTO-BLACK",
  "HBR-9038-AUTO-BLUE",
  "HBR-8821-2-AUTO-ASTRO-rslvr",
  "HBR-8821-2-AUTO-ASTRO-slvr",
  "HBR-1001-2-AUTO-ROULETTE-SLV-RED",
  "HBR-1001-2-AUTO-ROULETTE-SLV-BLUE",
  "HBR-1001-2-AUTO-ROULETTE-SLV-GREEN",
  "HBR-902-AUTO-A200-BLACK-SILVER",
  "HBR-902-AUTO-A200-SILVER-RG",
  "HBR-902-AUTO-A200-BLACK",
  "HBR-824-2-AUTO-BLUE-RG",
  "HBR-824-2-AUTO-BROWN-RG",
  "HBR-824-2-AUTO-GREEN-SILVER",
  "HBR-1309-AUTO-PURPLE",
  "HBR-1309-AUTO-BLUE",
  "HBR-1309-AUTO-ORANGE",
  "HBR-8824-AUTO-NS-BLACK",
  "HBR-1001-2-AUTO-ROULETTE-RG-RED",
  "HBR-1309-AUTO-GREEN",
  "HBR-8824-AUTO-NS-BLUE",
  "HBR-8824-AUTO-NS-RG-BROWN",
  "HBR-981-AUTO-RGOLD",
  "HBR-981-AUTO-SILVER",
  "HBR-2712-AUTO-SILVER",
  "HBR-2712-AUTO-RG-TIRANGA",
  "HBR-2712-AUTO-SLV-TIRANGA",
  "HBR-972-AUTO-RGLD",
  "HBR-981-AUTO-GOLD",
  "HBR-2712-AUTO-RGOLD",
  "HBR-945-3-AUTO-BLACK",
  "HBR-945-3-AUTO-WHITE",
  "HBR-1307-AUTO-EMERALD",
  "HBR-8022-1-AUTO-STELLAR",
  "HBR-900-3-AUTO-BLACK",
  "HBR-980-AUTO-ORBITA-GOLD",
  "HBR-995-1-AUTO-GOLD",
  "HBR-927-RGOLD-BLK",
  "HBR-AERO-997-RG-BLK",
  "HBR-AERO-997-BLK",
  "HBR-AERO-997-SILVER",
  "HBR-ZODIAC-1027-2-BLUE",
  "HBR-ZODIAC-1027-2-BLACK",
  "HBR-WC-1038-RG-BLK",
  "HBR-WC-1038-SILVER-BLK",
  "HBR-1308-AUTO-SAPPHIRE",
  "HBR-902-AUTO-A200-SILVER",
  "HBR-927-GOLD-BLK"
];

export const CANONICAL_PRODUCT_ORDER = new Map();
MASTER_CANONICAL_ORDER.forEach((sku, rank) => {
  const cleanSku = String(sku).trim().toUpperCase();
  CANONICAL_PRODUCT_ORDER.set(cleanSku, rank);
  const match = PRODUCTS_DATA.find((p) => String(p.sku || "").trim().toUpperCase() === cleanSku);
  if (match?.id) {
    CANONICAL_PRODUCT_ORDER.set(String(match.id).trim().toLowerCase(), rank);
  }
});

// Fallback for any product in PRODUCTS_DATA not in master list
PRODUCTS_DATA.forEach((p, idx) => {
  const pId = String(p.id || "").trim().toLowerCase();
  const pSku = String(p.sku || "").trim().toUpperCase();
  if (pId && !CANONICAL_PRODUCT_ORDER.has(pId)) {
    CANONICAL_PRODUCT_ORDER.set(pId, 104 + idx);
  }
  if (pSku && !CANONICAL_PRODUCT_ORDER.has(pSku)) {
    CANONICAL_PRODUCT_ORDER.set(pSku, 104 + idx);
  }
});

// Deterministic stable sorting function for products catalog
export function sortCatalogStably(items) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const aId = String(a.id || "").trim().toLowerCase();
    const aSku = String(a.sku || "").trim().toUpperCase();
    const bId = String(b.id || "").trim().toLowerCase();
    const bSku = String(b.sku || "").trim().toUpperCase();

    const aRank = a.rank !== undefined && typeof a.rank === "number" && !isNaN(a.rank)
      ? a.rank
      : (a.specs && typeof a.specs.rank === "number" && !isNaN(a.specs.rank)
        ? a.specs.rank
        : (CANONICAL_PRODUCT_ORDER.get(aId) ?? CANONICAL_PRODUCT_ORDER.get(aSku) ?? 9999));
    const bRank = b.rank !== undefined && typeof b.rank === "number" && !isNaN(b.rank)
      ? b.rank
      : (b.specs && typeof b.specs.rank === "number" && !isNaN(b.specs.rank)
        ? b.specs.rank
        : (CANONICAL_PRODUCT_ORDER.get(bId) ?? CANONICAL_PRODUCT_ORDER.get(bSku) ?? 9999));

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aTime !== bTime) {
      return aTime - bTime;
    }
    return aId.localeCompare(bId);
  });
}

// Helper: identify stale test clones or polluted Orbita variant clones that should be purged
export function isStaleClone(p) {
  if (!p) return false;
  const id = String(p.id || "").toLowerCase();
  const sku = String(p.sku || "").toUpperCase();
  const name = String(p.name || "");

  // Never flag canonical master watches
  const isCanonicalMaster = PRODUCTS_DATA.some(
    (m) => String(m.id).toLowerCase() === id || String(m.sku).toUpperCase() === sku
  );
  if (isCanonicalMaster) return false;

  return (
    id.startsWith("astroworld-celestial-clone-") ||
    id.startsWith("astroworld-tourbillon-fluted-rosegold-clone-") ||
    id.startsWith("volcano-glacier-compass-gold-clone-") ||
    (sku.includes("ORBITA") && sku.includes("CLONE") && (sku.includes("LEGACY") || id.includes("legacy") || sku.includes("TEST-STALE"))) ||
    name.includes("WITH Planetarium Design") ||
    /\(Variant\)/i.test(name)
  );
}

export const productsService = {
  // Get locally cached products or fallback to default PRODUCTS_DATA with stable ordering
  getLocalProducts() {
    const deletedIds = getDeletedProductIds();
    let customOrderMap = null;
    try {
      const rawOrder = safeStorage.getItem(STORAGE_KEYS.WATCH_ORDER);
      if (rawOrder) {
        const parsedOrder = JSON.parse(rawOrder);
        if (Array.isArray(parsedOrder)) {
          customOrderMap = new Map();
          parsedOrder.forEach((key, idx) => {
            if (key) {
              const strKey = String(key).trim().toLowerCase();
              customOrderMap.set(strKey, idx);
            }
          });
        }
      }
    } catch {}

    try {
      const raw = safeStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (raw) {
        let parsed = JSON.parse(raw);
        // Discard stale or incomplete cached product list (e.g. legacy 83-item cache)
        if (Array.isArray(parsed) && parsed.length < PRODUCTS_DATA.length) {
          safeStorage.removeItem(STORAGE_KEYS.PRODUCTS);
          parsed = null;
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          // ── Auto-purge stale test clones and legacy Orbita variant clones ──
          const hadStaleClones = parsed.some(isStaleClone);
          if (hadStaleClones) {
            parsed = parsed.filter((p) => !isStaleClone(p));
            safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed));
          }

          const consumedCachedIds = new Set();
          const consumedCachedSkus = new Set();

          // Build master catalogue starting from canonical PRODUCTS_DATA with cached overrides
          const baseMaster = [];
          for (let idx = 0; idx < PRODUCTS_DATA.length; idx++) {
            const m = PRODUCTS_DATA[idx];
            const mId = String(m.id || "").toLowerCase().trim();
            const mSku = String(m.sku || "").toLowerCase().trim();

            // If product was explicitly deleted, do NOT resurrect it!
            if (deletedIds.has(mId) || deletedIds.has(mSku)) {
              continue;
            }

            // Find cached version
            const cachedMatch = parsed.find(
              (p) =>
                (p.id && String(p.id).toLowerCase().trim() === mId) ||
                (p.previousId && String(p.previousId).toLowerCase().trim() === mId) ||
                (p.previousSku && String(p.previousSku).toLowerCase().trim() === mSku) ||
                (p.sku && String(p.sku).toLowerCase().trim() === mSku)
            );

            const customRank = customOrderMap ? (customOrderMap.get(mId) ?? customOrderMap.get(mSku)) : undefined;
            const canonicalRank = CANONICAL_PRODUCT_ORDER.get(mId) ?? CANONICAL_PRODUCT_ORDER.get(mSku) ?? idx;
            let rankVal = canonicalRank;
            if (typeof customRank === "number") {
              rankVal = customRank;
            } else if (cachedMatch && typeof cachedMatch.rank === "number" && !isNaN(cachedMatch.rank)) {
              rankVal = cachedMatch.rank;
            }

            if (!cachedMatch) {
              baseMaster.push({
                ...m,
                stock: typeof m.stock === "number" && !isNaN(m.stock) ? m.stock : Math.max(1, 12 - (idx % 8)),
                rank: rankVal,
              });
            } else {
              consumedCachedIds.add(String(cachedMatch.id || mId).toLowerCase().trim());
              if (cachedMatch.previousId) consumedCachedIds.add(String(cachedMatch.previousId).toLowerCase().trim());
              consumedCachedIds.add(mId);
              if (cachedMatch.sku) consumedCachedSkus.add(String(cachedMatch.sku).toLowerCase().trim());
              if (cachedMatch.previousSku) consumedCachedSkus.add(String(cachedMatch.previousSku).toLowerCase().trim());
              consumedCachedSkus.add(mSku);

              baseMaster.push({
                ...m,
                ...cachedMatch,
                id: String(cachedMatch.id || mId).trim().toLowerCase(),
                sku: String(cachedMatch.sku || m.sku || "").trim().toUpperCase(),
                name: String(cachedMatch.name || m.name || "").trim(),
                price: cachedMatch.price || m.price,
                priceNumeric: parseInt(String(cachedMatch.price || m.price || "0").replace(/[^\d]/g, ""), 10) || m.priceNumeric || 45000,
                modelNumber: cachedMatch.modelNumber || cachedMatch.specs?.modelNumber || m.modelNumber || "",
                collection: cachedMatch.collection || m.collection,
                collectionName: cachedMatch.collectionName || m.collectionName,
                tag: cachedMatch.tag || m.tag,
                image: cachedMatch.image || m.image,
                transparentImage: cachedMatch.transparentImage || cachedMatch.image || m.transparentImage || m.image,
                altImages: Array.isArray(cachedMatch.altImages) && cachedMatch.altImages.length > 0 ? cachedMatch.altImages : m.altImages,
                gallery: Array.isArray(cachedMatch.gallery) && cachedMatch.gallery.length > 0 ? cachedMatch.gallery : m.gallery,
                specs: {
                  ...(m.specs || {}),
                  ...(cachedMatch.specs || {}),
                  modelNumber: cachedMatch.modelNumber || cachedMatch.specs?.modelNumber || m.modelNumber || "",
                },
                stock: typeof cachedMatch.stock === "number" && !isNaN(cachedMatch.stock) ? cachedMatch.stock : (m.stock || 12),
                isActive: cachedMatch.isActive !== false,
                rank: rankVal,
              });
            }
          }

          // Unconsumed custom/cloned/added products in parsed
          const customClones = parsed
            .filter((p) => {
              if (!p || typeof p !== "object" || !p.id) return false;
              const pId = String(p.id).toLowerCase().trim();
              const pSku = String(p.sku || "").toLowerCase().trim();
              if (deletedIds.has(pId) || (pSku && deletedIds.has(pSku))) return false;
              if (isStaleClone(p)) return false;
              if (consumedCachedIds.has(pId) || (pSku && consumedCachedSkus.has(pSku))) return false;
              return true;
            })
            .map((p, idx) => {
              const baseId = String(p.id).replace(/-clone-.*$/i, "").trim().toLowerCase();
              const parent = PRODUCTS_DATA.find((m) => String(m.id).toLowerCase() === baseId);
              const safeImage = p.image || parent?.image || "/watch-astroworld-moon-rosegold-front-transparent.webp";
              const parentRank = parent ? (CANONICAL_PRODUCT_ORDER.get(String(parent.id).toLowerCase()) ?? 0) : 9999;
              const pId = String(p.id || "").toLowerCase().trim();
              const pSku = String(p.sku || "").toLowerCase().trim();
              const customRank = customOrderMap ? (customOrderMap.get(pId) ?? customOrderMap.get(pSku)) : undefined;
              const safeRank = typeof customRank === "number"
                ? customRank
                : (typeof p.rank === "number" && !isNaN(p.rank) ? p.rank : Number((parentRank + 0.001 + (idx * 0.0001)).toFixed(5)));
              const cleanName = String(p.name || parent?.name || "Hanboro Timepiece").replace(/\s*\(Variant\)$/i, "").trim();

              return {
                ...(parent || {}),
                ...p,
                name: cleanName,
                image: safeImage,
                transparentImage: p.transparentImage || safeImage,
                altImages: Array.isArray(p.altImages) && p.altImages.length > 0 ? p.altImages : (parent?.altImages || [safeImage]),
                gallery: Array.isArray(p.gallery) ? p.gallery : (parent?.gallery || []),
                modelNumber: p.modelNumber || p.specs?.modelNumber || parent?.modelNumber || "",
                specs: {
                  ...(parent?.specs || {}),
                  ...(p.specs || {}),
                  modelNumber: p.modelNumber || p.specs?.modelNumber || parent?.modelNumber || "",
                },
                rank: safeRank,
              };
            });

          const combined = [...baseMaster, ...customClones];
          return sortCatalogStably(combined);
        }
      }
    } catch (e) {
      console.warn("Could not parse cached products:", e);
    }
    const base = PRODUCTS_DATA
      .filter((p) => {
        const pId = String(p.id || "").toLowerCase().trim();
        const pSku = String(p.sku || "").toLowerCase().trim();
        return !deletedIds.has(pId) && !deletedIds.has(pSku);
      })
      .map((p, idx) => {
        const pId = String(p.id || "").toLowerCase();
        const pSku = String(p.sku || "").toUpperCase();
        const customRank = customOrderMap ? (customOrderMap.get(pId) ?? customOrderMap.get(pSku)) : undefined;
        const canonicalRank = CANONICAL_PRODUCT_ORDER.get(pId) ?? CANONICAL_PRODUCT_ORDER.get(pSku) ?? idx;
        const rankVal = typeof customRank === "number" ? customRank : canonicalRank;
        return {
          ...p,
          stock: typeof p.stock === "number" && !isNaN(p.stock) ? p.stock : Math.max(1, 12 - (idx % 8)),
          rank: rankVal,
        };
      });
    return sortCatalogStably(base);
  },

  // Save full products list to local storage with quota resilience
  saveLocalProducts(products) {
    if (!Array.isArray(products)) return;
    try {
      const sorted = sortCatalogStably(products);
      safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sorted));
    } catch (e) {
      console.warn("Storage quota warning, pruning old caches:", e);
      try {
        safeStorage.removeItem(STORAGE_KEYS.ROULETTE_SPINS);
        safeStorage.removeItem("hanboro_orders_cache_backup");
        safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      } catch (err2) {
        console.error("Critical storage quota failure:", err2);
      }
    }
  },

  // Fetch products from Supabase with stable in-place merge (never scrambles or wipes watches on refresh)
  async fetchProducts() {
    const local = this.getLocalProducts();
    const deletedIds = getDeletedProductIds();
    let customOrderMap = null;
    try {
      const rawOrder = safeStorage.getItem(STORAGE_KEYS.WATCH_ORDER);
      if (rawOrder) {
        const parsedOrder = JSON.parse(rawOrder);
        if (Array.isArray(parsedOrder)) {
          customOrderMap = new Map();
          parsedOrder.forEach((key, idx) => {
            if (key) {
              const strKey = String(key).trim().toLowerCase();
              customOrderMap.set(strKey, idx);
            }
          });
        }
      }
    } catch {}
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        // Map database columns to application format
        const mapped = data
          .filter((row) => {
            const rId = String(row.id || "").toLowerCase().trim();
            const rSku = String(row.sku || "").toLowerCase().trim();
            return !deletedIds.has(rId) && !deletedIds.has(rSku);
          })
          .map((row) => {
            const rowSpecs = typeof row.specs === "object" && row.specs !== null ? row.specs : {};
            const rowModel = rowSpecs.modelNumber || "";
            return {
              id: row.id,
              sku: String(row.sku || "").trim().toUpperCase(),
              name: String(row.name || "").replace(/\s*\(Variant\)$/i, "").trim(),
              subtitle: row.subtitle || "",
              collection: row.collection || "TOURBILLON",
              collectionName: row.collection_name || "Tourbillon & Complications",
              tag: row.tag || "Haute Horlogerie",
              price: row.price,
              priceNumeric: parseInt(String(row.price || "0").replace(/[^\d]/g, ""), 10) || 45000,
              priceUsd: row.price_usd || "$1,200",
              availability: row.availability || "In Stock",
              year: row.year || "2026",
              summary: row.summary || "",
              image: row.image,
              transparentImage: row.transparent_image || row.image,
              altImages: Array.isArray(row.alt_images) && row.alt_images.length > 0 ? row.alt_images : [row.image],
              gallery: Array.isArray(row.gallery) && row.gallery.length > 0 ? row.gallery : [],
              specs: rowSpecs,
              modelNumber: rowModel,
              stock: typeof row.stock === "number" ? row.stock : 10,
              isActive: row.is_active !== false,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              isCustom: row.is_custom === true || rowSpecs.isCustom === true,
            };
          });

        const remoteById = new Map();
        const remoteBySku = new Map();
        mapped.forEach((rp) => {
          if (rp.id) remoteById.set(String(rp.id).toLowerCase().trim(), rp);
          if (rp.sku) remoteBySku.set(String(rp.sku).toUpperCase().trim(), rp);
        });

        const consumedRemoteIds = new Set();
        const consumedRemoteSkus = new Set();

        const updatedExisting = local
          .filter((lp) => {
            const lId = String(lp.id || "").toLowerCase().trim();
            const lSku = String(lp.sku || "").toLowerCase().trim();
            return !deletedIds.has(lId) && !deletedIds.has(lSku);
          })
          .map((lp, idx) => {
            const lId = String(lp.id || "").toLowerCase().trim();
            const lSku = String(lp.sku || "").toUpperCase().trim();
            const prevId = lp.previousId ? String(lp.previousId).toLowerCase().trim() : null;
            const prevSku = lp.previousSku ? String(lp.previousSku).toUpperCase().trim() : null;

            const remote = remoteById.get(lId) ||
              (prevId && remoteById.get(prevId)) ||
              remoteBySku.get(lSku) ||
              (prevSku && remoteBySku.get(prevSku));

            if (remote) {
              consumedRemoteIds.add(String(remote.id).toLowerCase().trim());
              if (remote.sku) consumedRemoteSkus.add(String(remote.sku).toUpperCase().trim());
              consumedRemoteIds.add(lId);
              consumedRemoteSkus.add(lSku);
              if (prevId) consumedRemoteIds.add(prevId);
              if (prevSku) consumedRemoteSkus.add(prevSku);

              const remoteRank = typeof remote.specs?.rank === "number" && !isNaN(remote.specs.rank) ? remote.specs.rank : undefined;
              const hasLocalCustomOrder = customOrderMap && (customOrderMap.has(lId) || customOrderMap.has(lSku));
              const resolvedRank = hasLocalCustomOrder
                ? (customOrderMap.get(lId) ?? customOrderMap.get(lSku))
                : (remoteRank !== undefined
                  ? remoteRank
                  : (typeof lp.rank === "number" && !isNaN(lp.rank)
                    ? lp.rank
                    : (CANONICAL_PRODUCT_ORDER.get(lId) ?? CANONICAL_PRODUCT_ORDER.get(lSku) ?? idx)));

              // If local copy was updated more recently than remote, preserve local edits
              const lpTime = lp.updatedAt ? new Date(lp.updatedAt).getTime() : 0;
              const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
              const preferLocal = lpTime > remoteTime + 1000;

              const baseObj = preferLocal ? { ...remote, ...lp } : { ...lp, ...remote };

              return {
                ...baseObj,
                id: preferLocal ? (lp.id || remote.id) : (remote.id || lp.id),
                sku: preferLocal ? (lp.sku || remote.sku) : (remote.sku || lp.sku),
                name: preferLocal ? (lp.name || remote.name) : (remote.name || lp.name),
                price: preferLocal ? (lp.price || remote.price) : (remote.price || lp.price),
                priceNumeric: parseInt(String(preferLocal ? (lp.price || remote.price || "0") : (remote.price || lp.price || "0")).replace(/[^\d]/g, ""), 10) || 45000,
                modelNumber: preferLocal
                  ? (lp.modelNumber || lp.specs?.modelNumber || remote.modelNumber || remote.specs?.modelNumber || "")
                  : (remote.modelNumber || remote.specs?.modelNumber || lp.modelNumber || lp.specs?.modelNumber || ""),
                collection: preferLocal ? (lp.collection || remote.collection) : (remote.collection || lp.collection),
                collectionName: preferLocal ? (lp.collectionName || remote.collectionName) : (remote.collectionName || lp.collectionName),
                tag: preferLocal ? (lp.tag || remote.tag) : (remote.tag || lp.tag),
                image: preferLocal ? (lp.image || remote.image) : (remote.image || lp.image),
                transparentImage: preferLocal ? (lp.transparentImage || remote.transparentImage) : (remote.transparentImage || lp.transparentImage),
                specs: {
                  ...(preferLocal ? (remote.specs || {}) : (lp.specs || {})),
                  ...(preferLocal ? (lp.specs || {}) : (remote.specs || {})),
                  modelNumber: preferLocal
                    ? (lp.modelNumber || lp.specs?.modelNumber || remote.modelNumber || remote.specs?.modelNumber || "")
                    : (remote.modelNumber || remote.specs?.modelNumber || lp.modelNumber || lp.specs?.modelNumber || ""),
                },
                stock: typeof remote.stock === "number" ? remote.stock : lp.stock,
                isActive: remote.isActive !== false,
                rank: resolvedRank,
                altImages: (Array.isArray(preferLocal ? lp.altImages : remote.altImages) && (preferLocal ? lp.altImages : remote.altImages).length > 0)
                  ? (preferLocal ? lp.altImages : remote.altImages)
                  : (Array.isArray(preferLocal ? remote.altImages : lp.altImages) && (preferLocal ? remote.altImages : lp.altImages).length > 0
                    ? (preferLocal ? remote.altImages : lp.altImages)
                    : [preferLocal ? lp.image : remote.image]),
                gallery: (Array.isArray(preferLocal ? lp.gallery : remote.gallery) && (preferLocal ? lp.gallery : remote.gallery).length > 0)
                  ? (preferLocal ? lp.gallery : remote.gallery)
                  : (Array.isArray(preferLocal ? remote.gallery : lp.gallery) ? (preferLocal ? remote.gallery : lp.gallery) : []),
              };
            }

            return lp;
          });

        // Any custom / cloned / added timepieces in Supabase not matching local
        const brandNewRemote = mapped
          .filter((rp) => {
            const rId = String(rp.id).toLowerCase().trim();
            const rSku = String(rp.sku || "").toUpperCase().trim();
            return (
              !consumedRemoteIds.has(rId) &&
              (!rSku || !consumedRemoteSkus.has(rSku)) &&
              !deletedIds.has(rId) &&
              !deletedIds.has(rSku.toLowerCase()) &&
              !["flying-skeleton", "celestial-tourbillon"].includes(rId) &&
              !["HBR-702-TOURB-SKELETON", "HBR-901-ASTRONOMICAL"].includes(rSku) &&
              !isStaleClone(rp)
            );
          })
          .map((rp, idx) => {
            const baseId = String(rp.id).replace(/-clone-.*$/i, "").trim().toLowerCase();
            const parent = PRODUCTS_DATA.find((m) => String(m.id).toLowerCase() === baseId);
            const parentRank = parent ? (CANONICAL_PRODUCT_ORDER.get(String(parent.id).toLowerCase()) ?? 0) : 10000;
            const safeRank = Number((parentRank + 0.001 + (idx * 0.0001)).toFixed(5));
            const cleanName = String(rp.name || parent?.name || "Hanboro Timepiece").replace(/\s*\(Variant\)$/i, "").trim();

            return {
              ...(parent || {}),
              ...rp,
              name: cleanName,
              modelNumber: rp.modelNumber || rp.specs?.modelNumber || parent?.modelNumber || rp.sku?.split("-")[1] || "980",
              specs: {
                ...(parent?.specs || {}),
                ...(rp.specs || {}),
                modelNumber: rp.modelNumber || rp.specs?.modelNumber || parent?.modelNumber || rp.sku?.split("-")[1] || "980",
              },
              rank: safeRank,
            };
          });

        const merged = [...updatedExisting, ...brandNewRemote];

        // Guarantee all 104 canonical products are present in the final merged array
        const mergedMap = new Set(merged.map((p) => String(p.id || "").toLowerCase().trim()));
        const mergedSkuMap = new Set(merged.map((p) => String(p.sku || "").toUpperCase().trim()));
        for (let idx = 0; idx < PRODUCTS_DATA.length; idx++) {
          const m = PRODUCTS_DATA[idx];
          const mId = String(m.id || "").toLowerCase().trim();
          const mSku = String(m.sku || "").toUpperCase().trim();
          if (!mergedMap.has(mId) && !mergedSkuMap.has(mSku) && !deletedIds.has(mId) && !deletedIds.has(mSku.toLowerCase())) {
            const mRank = CANONICAL_PRODUCT_ORDER.get(mId) ?? CANONICAL_PRODUCT_ORDER.get(mSku) ?? idx;
            merged.push({ ...m, rank: mRank });
            mergedMap.add(mId);
            mergedSkuMap.add(mSku);
          }
        }

        const stablySorted = sortCatalogStably(merged);
        this.saveLocalProducts(stablySorted);
        return stablySorted;
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
      ? String(product.name).replace(/\s*\(Variant\)$/i, "").trim()
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
      ean: product.ean || calculateEan13(safeSku || product.id),
      specs: {
        ...(typeof product.specs === "object" && product.specs !== null ? product.specs : {}),
        modelNumber: product.modelNumber || product.specs?.modelNumber || "",
        rank: typeof product.rank === "number" ? product.rank : (product.specs?.rank ?? undefined),
      },
      stock: safeStock,
      is_active: product.isActive !== false,
      updated_at: new Date().toISOString(),
    };

    try {
      const [prodRes, invRes] = await Promise.all([
        supabase.from("products").upsert(dbPayload, { onConflict: "id" }).select("id, sku"),
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
        }, { onConflict: "id" }).select("id, sku"),
      ]);

      if (prodRes?.error) {
        console.warn("Supabase products upsert note:", prodRes.error.message);
      }
      if (invRes?.error) {
        console.warn("Supabase inventory upsert note:", invRes.error.message);
      }

      return { product: prodRes?.data?.[0], inventory: invRes?.data?.[0] };
    } catch (err) {
      console.warn("Supabase syncProduct note:", err);
      return null;
    }
  },

  // Auto-seed Supabase products table if empty
  async seedSupabaseCatalog() {
    try {
      const sorted = sortCatalogStably(PRODUCTS_DATA);
      const master = sorted.map((p, idx) => ({
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
        specs: {
          ...(p.specs || {}),
          rank: idx,
        },
        stock: typeof p.stock === "number" && !isNaN(p.stock) ? p.stock : Math.max(1, 12 - (idx % 8)),
        is_active: p.isActive !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      for (let i = 0; i < master.length; i += 20) {
        const chunk = master.slice(i, i + 20);
        const { error } = await supabase
          .from("products")
          .upsert(chunk, { onConflict: "id", ignoreDuplicates: false });
        if (error) {
          console.warn("Supabase auto-seed products warning:", error.message);
        }
      }
    } catch (e) {
      console.warn("Supabase auto-seed note:", e);
    }
  },

  // Save (insert or update) a product with complete SKU & ID migration safety
  async saveProduct(product, previousId = null, previousSku = null) {
    const local = this.getLocalProducts();
    const targetId = previousId ? String(previousId).trim().toLowerCase() : String(product.id || "").trim().toLowerCase();
    const oldSku = previousSku ? String(previousSku).trim().toUpperCase() : null;
    const newSku = String(product.sku || "").trim().toUpperCase();

    // Clean and validate product fields
    const safeProduct = {
      ...product,
      previousId: previousId ? String(previousId).trim().toLowerCase() : (product.previousId || null),
      previousSku: oldSku || product.previousSku || null,
      id: String(product.id || targetId).trim().toLowerCase(),
      sku: newSku,
      name: String(product.name || "").replace(/\s*\(Variant\)$/i, "").trim(),
      updatedAt: new Date().toISOString(),
    };

    // Unmark from deleted IDs if previously deleted
    removeDeletedProductId(safeProduct.id);
    if (newSku) removeDeletedProductId(newSku);
    if (previousId) removeDeletedProductId(previousId);
    if (oldSku) removeDeletedProductId(oldSku);

    // Find if the product already exists by ID or SKU
    let existingIndex = local.findIndex((p) => 
      (p.id && String(p.id).trim().toLowerCase() === targetId) ||
      (previousId && p.id && String(p.id).trim().toLowerCase() === String(previousId).trim().toLowerCase()) ||
      (oldSku && p.sku && String(p.sku).trim().toUpperCase() === oldSku) ||
      (newSku && p.sku && String(p.sku).trim().toUpperCase() === newSku)
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
    if (previousId && String(previousId).trim().toLowerCase() !== safeProduct.id) {
      const prevClean = String(previousId).trim().toLowerCase();
      updated = updated.filter((p, idx) => idx === existingIndex || String(p.id).trim().toLowerCase() !== prevClean);
    }

    const sortedUpdated = sortCatalogStably(updated);
    this.saveLocalProducts(sortedUpdated);

    // CRITICAL: If ID or SKU changed, delete previous record in Supabase FIRST to avoid unique constraint conflict on SKU
    const idChanged = previousId && String(previousId).trim().toLowerCase() !== safeProduct.id;
    const skuChanged = oldSku && oldSku !== newSku;

    if (idChanged || skuChanged) {
      try {
        const delOps = [];
        if (idChanged && previousId) {
          delOps.push(supabase.from("products").delete().eq("id", String(previousId).trim()));
          delOps.push(supabase.from("inventory").delete().eq("id", String(previousId).trim()));
        }
        if (skuChanged && oldSku) {
          delOps.push(supabase.from("products").delete().ilike("sku", oldSku));
          delOps.push(supabase.from("inventory").delete().ilike("sku", oldSku));
        }
        if (delOps.length > 0) {
          await Promise.all(delOps);
        }
      } catch (delErr) {
        console.warn("Could not purge previous timepiece records before rename:", delErr);
      }
    }

    // Direct sync to Supabase (upsert into both products and inventory)
    try {
      await this.syncProductToSupabase(safeProduct);
    } catch (syncErr) {
      console.warn("Supabase syncProduct warning (local persistence succeeded):", syncErr);
    }

    // Keep local inventory cache in lockstep
    try {
      await inventoryService.upsertInventoryItem(safeProduct, previousId, previousSku);
    } catch (invErr) {
      console.warn("Local inventory cache sync warning:", invErr);
    }

    return sortedUpdated;
  },

  // Delete a product by id or sku
  async deleteProduct(productId) {
    const local = this.getLocalProducts();
    const clean = String(productId || "").trim().toLowerCase();
    const target = local.find((p) => String(p.id).trim().toLowerCase() === clean || String(p.sku).trim().toLowerCase() === clean);

    // Permanently record in deleted IDs to prevent resurrecting on reload
    recordDeletedProductId(clean);
    if (target?.id) recordDeletedProductId(target.id);
    if (target?.sku) recordDeletedProductId(target.sku);

    const updated = local.filter((p) => {
      const pId = String(p.id || "").trim().toLowerCase();
      const pSku = String(p.sku || "").trim().toLowerCase();
      if (pId === clean || pSku === clean) return false;
      if (target && (pId === String(target.id).trim().toLowerCase() || pSku === String(target.sku).trim().toLowerCase())) return false;
      return true;
    });
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

  // Save rearranged watch order across local storage and remote Supabase
  async saveProductOrder(orderedProducts) {
    if (!Array.isArray(orderedProducts)) return [];
    const withRanks = orderedProducts.map((p, idx) => ({
      ...p,
      rank: idx,
      specs: {
        ...(typeof p.specs === "object" && p.specs !== null ? p.specs : {}),
        rank: idx,
      },
    }));

    // Persist ordered list of IDs / SKUs in dedicated custom watch order key
    const orderList = withRanks.map((p) => String(p.id || p.sku || "").trim().toLowerCase()).filter(Boolean);
    try {
      safeStorage.setItem(STORAGE_KEYS.WATCH_ORDER, JSON.stringify(orderList));
    } catch (e) {
      console.warn("Could not save watch order mapping:", e);
    }

    this.saveLocalProducts(withRanks);

    // Sync in background to Supabase
    this.syncProductsOrderToSupabase(withRanks).catch((err) => {
      console.warn("Background watch order Supabase sync note:", err);
    });

    return withRanks;
  },

  // Asynchronously sync new watch order to Supabase
  async syncProductsOrderToSupabase(orderedProducts) {
    if (!Array.isArray(orderedProducts) || orderedProducts.length === 0) return;
    try {
      const updates = orderedProducts.map((p) => ({
        id: p.id,
        sku: p.sku || "HBR-REF",
        name: p.name || "HANBORO Watch",
        price: p.price || "₹45,000",
        image: p.image || "/transparent/forged-carbon-tonneau-tourbillon.webp",
        collection: p.collection || "TOURBILLON",
        collection_name: p.collectionName || "Tourbillon & Complications",
        specs: {
          ...(typeof p.specs === "object" && p.specs !== null ? p.specs : {}),
          rank: p.rank,
        },
        updated_at: new Date().toISOString(),
      }));

      for (let i = 0; i < updates.length; i += 25) {
        const chunk = updates.slice(i, i + 25);
        await supabase.from("products").upsert(chunk, { onConflict: "id", ignoreDuplicates: false });
      }
    } catch (e) {
      console.warn("Supabase watch order sync exception:", e);
    }
  },

  // Reset only the order back to canonical factory reference sequence without wiping inventory or clones
  async resetProductOrder() {
    try {
      safeStorage.removeItem(STORAGE_KEYS.WATCH_ORDER);
    } catch {}
    const local = this.getLocalProducts();
    const reordered = [...local].map((p) => {
      const pId = String(p.id || "").trim().toLowerCase();
      const pSku = String(p.sku || "").trim().toUpperCase();
      const canonRank = CANONICAL_PRODUCT_ORDER.get(pId) ?? CANONICAL_PRODUCT_ORDER.get(pSku) ?? 9999;
      return {
        ...p,
        rank: canonRank,
        specs: {
          ...(typeof p.specs === "object" && p.specs !== null ? p.specs : {}),
          rank: canonRank,
        },
      };
    });
    const sorted = sortCatalogStably(reordered);
    this.saveLocalProducts(sorted);
    this.syncProductsOrderToSupabase(sorted).catch(() => {});
    return sorted;
  },

  // Factory reset to master factory catalog
  async resetToMaster() {
    safeStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    safeStorage.removeItem(STORAGE_KEYS.INVENTORY);
    safeStorage.removeItem(STORAGE_KEYS.WATCH_ORDER);
    const defaults = PRODUCTS_DATA.map((p, idx) => {
      const pId = String(p.id || "").toLowerCase().trim();
      const pSku = String(p.sku || "").toUpperCase().trim();
      const canonRank = CANONICAL_PRODUCT_ORDER.get(pId) ?? CANONICAL_PRODUCT_ORDER.get(pSku) ?? idx;
      return { ...p, rank: canonRank };
    });
    const sorted = sortCatalogStably(defaults);
    this.saveLocalProducts(sorted);
    return sorted;
  },
};

// ── DRAFT ORDERS SERVICE ─────────────────────────────────────────────────────
export const draftOrdersService = {
  getLocalDrafts() {
    try {
      const raw = safeStorage.getItem("hanboro_draft_orders_cache");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((d) => d.id !== "dft-101" && d.id !== "dft-102") : [];
    } catch {
      return [];
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
        .neq("status", "Abandoned")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data
          .filter((d) => d.status !== "Abandoned")
          .map((d) => ({
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

// ── ABANDONED CHECKOUTS SERVICE ──────────────────────────────────────────────
export const abandonedCheckoutsService = {
  getGuestCheckoutSessionId() {
    try {
      let sess = safeStorage.getItem("hanboro_checkout_session_id");
      if (!sess) {
        sess = `chk_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        safeStorage.setItem("hanboro_checkout_session_id", sess);
      }
      return sess;
    } catch {
      return `chk_sess_${Date.now()}`;
    }
  },

  hashCode(str) {
    let hash = 0;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  },

  getLocalAbandonedCheckouts() {
    try {
      const raw = safeStorage.getItem("hanboro_abandoned_checkouts_cache");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalAbandonedCheckouts(checkouts) {
    try {
      safeStorage.setItem("hanboro_abandoned_checkouts_cache", JSON.stringify(checkouts));
    } catch {}
  },

  async recordCheckoutLead(payload = {}) {
    const sessionId = this.getGuestCheckoutSessionId();
    const id = `chk-${sessionId}`;
    const checkoutNumber =
      payload.checkoutNumber || `#${44800000000000 + (this.hashCode(sessionId) % 900000000)}`;
    const customerName = String(payload.name || payload.customerName || "").trim() || "Active Guest Shopper";
    const customerEmail = String(payload.email || payload.customerEmail || "").trim();
    const customerPhone = String(payload.phone || payload.customerPhone || "").trim();
    const total = Number(payload.totalPrice || payload.total || 0);

    const items = (payload.items || []).map((it) => ({
      id: it.product?.id || it.id,
      sku: it.product?.sku || it.sku,
      name: it.product?.name || it.name,
      price: it.product?.price || it.price,
      quantity: it.quantity || 1,
      image: it.product?.image || it.image,
    }));

    const region = payload.city
      ? `${payload.city}, India`
      : payload.state
      ? `${payload.state}, India`
      : "India";

    const notesObj = {
      address: payload.address || "",
      city: payload.city || "",
      state: payload.state || "",
      pincode: payload.pincode || "",
      region,
      step: payload.step || 1,
      updatedAt: new Date().toISOString(),
    };

    const checkoutRecord = {
      id,
      checkoutNumber,
      customerName,
      customerEmail: customerEmail || "shopper@hanborowatches.in",
      customerPhone: customerPhone || "",
      totalPrice: total,
      status: "Abandoned",
      recoveryStatus: "Not recovered",
      emailStatus: "Not sent",
      region,
      items,
      createdAt: new Date().toISOString(),
      shippingAddress: notesObj,
    };

    // 1. Update local cache
    const local = this.getLocalAbandonedCheckouts();
    const updated = [checkoutRecord, ...local.filter((c) => c.id !== id)];
    this.saveLocalAbandonedCheckouts(updated);

    // 2. Persist to Supabase draft_orders table with status 'Abandoned'
    try {
      await supabase.from("draft_orders").upsert(
        {
          id,
          draft_number: checkoutNumber,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          total,
          status: "Abandoned",
          items,
          delivery_method: payload.deliveryMethod || "Concierge White-Glove (COD)",
          notes: JSON.stringify(notesObj),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.warn("Supabase record checkout lead note:", err);
    }

    // 3. Also sync items to cart_items under sessionId if not empty
    if (items.length > 0) {
      for (const it of items) {
        cartService.saveCartItem(sessionId, it, it.quantity).catch(() => {});
      }
    }

    return checkoutRecord;
  },

  async fetchAbandonedCheckouts() {
    const local = this.getLocalAbandonedCheckouts();
    try {
      // 1. Fetch from draft_orders where status is 'Abandoned'
      const { data: abandonedDrafts, error: draftErr } = await supabase
        .from("draft_orders")
        .select("*")
        .eq("status", "Abandoned")
        .order("updated_at", { ascending: false });

      // 2. Also fetch live carts from cartService
      const liveCarts = await cartService.fetchAllLiveCarts().catch(() => []);

      const recordsMap = new Map();

      // Add Supabase abandoned drafts
      if (!draftErr && Array.isArray(abandonedDrafts)) {
        abandonedDrafts.forEach((d) => {
          let notesObj = {};
          try {
            notesObj = typeof d.notes === "string" && d.notes.startsWith("{") ? JSON.parse(d.notes) : {};
          } catch {}

          recordsMap.set(d.id, {
            id: d.id,
            checkoutNumber: d.draft_number,
            customerName: d.customer_name || "Active Guest Shopper",
            customerEmail: d.customer_email || "shopper@hanborowatches.in",
            customerPhone: d.customer_phone || "",
            emailStatus: "Not sent",
            recoveryStatus: d.status === "Recovered" ? "Recovered" : "Not recovered",
            region: notesObj.region || (notesObj.city ? `${notesObj.city}, India` : "India"),
            totalPrice: Number(d.total) || 0,
            createdAt: d.created_at
              ? new Date(d.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now",
            items: Array.isArray(d.items) ? d.items : [],
            shippingAddress: notesObj,
          });
        });
      }

      // Merge uncaptured live carts into abandoned list
      if (Array.isArray(liveCarts)) {
        liveCarts.forEach((cart, idx) => {
          const cartId = `chk-cart-${cart.userId || idx}`;
          if (!recordsMap.has(cartId)) {
            recordsMap.set(cartId, {
              id: cartId,
              checkoutNumber: `#${44800000000000 + Math.floor(Math.random() * 999999999)}`,
              customerName: cart.userEmail || cart.userId || "Active Guest Shopper",
              customerEmail: cart.userEmail?.includes("@") ? cart.userEmail : "shopper@hanborowatches.in",
              customerPhone: cart.userPhone || "",
              emailStatus: "Not sent",
              region: "India",
              recoveryStatus: "Not recovered",
              totalPrice: cart.totalValue || 45000,
              createdAt: "Just now",
              items: cart.items || [],
              shippingAddress: {},
            });
          }
        });
      }

      // Merge with local fallback if Supabase returned nothing
      if (recordsMap.size === 0 && Array.isArray(local) && local.length > 0) {
        local.forEach((c) => recordsMap.set(c.id, c));
      }

      const merged = Array.from(recordsMap.values());
      this.saveLocalAbandonedCheckouts(merged);
      return merged;
    } catch (err) {
      console.warn("Supabase fetch abandoned checkouts note:", err);
    }
    return local;
  },

  async markCheckoutRecovered(checkoutId, orderRef = "") {
    const local = this.getLocalAbandonedCheckouts().map((c) =>
      c.id === checkoutId ? { ...c, recoveryStatus: "Recovered", orderRef } : c
    );
    this.saveLocalAbandonedCheckouts(local);

    try {
      await supabase
        .from("draft_orders")
        .update({
          status: "Recovered",
          notes: `Recovered in order ${orderRef}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkoutId);
    } catch (err) {
      console.warn("Supabase mark checkout recovered note:", err);
    }
  },

  async deleteAbandonedCheckout(checkoutId) {
    const local = this.getLocalAbandonedCheckouts().filter((c) => c.id !== checkoutId);
    this.saveLocalAbandonedCheckouts(local);

    try {
      await supabase.from("draft_orders").delete().eq("id", checkoutId);
    } catch (err) {
      console.warn("Supabase delete abandoned checkout note:", err);
    }
    return local;
  },

  clearCheckoutSession() {
    try {
      const sessId = safeStorage.getItem("hanboro_checkout_session_id");
      if (sessId) {
        cartService.clearUserCart(sessId).catch(() => {});
        safeStorage.removeItem("hanboro_checkout_session_id");
      }
    } catch {}
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
            code: d.code,
            type: d.type || "percent",
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

  async getDiscount(code) {
    if (!code) return null;
    const clean = code.toUpperCase().trim();

    // 1. Check local cache
    const local = this.getLocalDiscounts();
    if (local && local[clean]) {
      return local[clean];
    }

    // 2. Query remote Supabase database
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .ilike("code", clean)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        const disc = {
          id: data.id,
          code: data.code,
          type: data.type || "percent",
          value: Number(data.value),
          label: data.label || `${data.code}: ${data.value}${data.type === "percent" ? "%" : " INR"} OFF`,
        };
        // Cache locally for fast subsequent lookups
        const updated = { ...(local || {}), [clean]: disc };
        this.saveLocalDiscounts(updated);
        return disc;
      }
    } catch (err) {
      console.warn("Supabase getDiscount note:", err);
    }
    return null;
  },

  async saveDiscount(promoCode, config) {
    const cleanCode = promoCode.toUpperCase().trim();
    const local = this.getLocalDiscounts() || {};
    const formattedConfig = {
      id: config.id || `dsc-${cleanCode.toLowerCase()}`,
      code: cleanCode,
      type: config.type || "percent",
      value: Number(config.value) || 15,
      label: config.label || `${cleanCode}: ${config.value}${config.type === "percent" ? "%" : " INR"} OFF`,
      is_active: config.is_active !== undefined ? config.is_active : true,
    };

    const updated = { ...local, [cleanCode]: formattedConfig };
    this.saveLocalDiscounts(updated);

    try {
      const { data, error } = await supabase.from("discounts").upsert(
        {
          id: formattedConfig.id,
          code: cleanCode,
          type: formattedConfig.type,
          value: formattedConfig.value,
          label: formattedConfig.label,
          is_active: formattedConfig.is_active,
        },
        { onConflict: "code" }
      );

      if (error) {
        console.warn("Supabase upsert discount warning:", error);
      }
    } catch (err) {
      console.warn("Supabase upsert discount exception:", err);
    }
    return updated;
  },

  async deleteDiscount(promoCode) {
    const cleanCode = promoCode.toUpperCase().trim();
    const local = this.getLocalDiscounts() || {};
    delete local[cleanCode];
    this.saveLocalDiscounts(local);

    try {
      const { error } = await supabase
        .from("discounts")
        .delete()
        .eq("code", cleanCode);

      if (error) {
        console.warn("Supabase delete discount warning:", error);
      }
    } catch (err) {
      console.warn("Supabase delete discount exception:", err);
    }
    return local;
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
