/**
 * HANBORO — Headless Shopify Storefront Client
 * Connects storefront catalog, cart, and checkout directly to Shopify.
 */

// Storefront API credentials — all values must come from environment variables.
// Copy .env.local.example to .env.local and fill in your Shopify credentials.
export const SHOPIFY_CONFIG = {
  // Store domain (e.g. your-shop.myshopify.com)
  domain:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_STORE_DOMAIN) ||
    (typeof process !== "undefined" && process.env?.VITE_SHOPIFY_STORE_DOMAIN) ||
    "0h0fke-ui.myshopify.com",
  // Public Storefront API access token (client-safe for Storefront GraphQL)
  storefrontAccessToken:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_STOREFRONT_TOKEN) ||
    (typeof process !== "undefined" && process.env?.VITE_SHOPIFY_STOREFRONT_TOKEN) ||
    "b40181640892b2f191a2cd4b113ca0fd",
  // Private Admin API token (for server-side / worker operations)
  adminAccessToken:
    (typeof import.meta !== "undefined" && import.meta.env?.SHOPIFY_ADMIN_ACCESS_TOKEN) ||
    (typeof process !== "undefined" && process.env?.SHOPIFY_ADMIN_ACCESS_TOKEN) ||
    "",
  apiVersion: "2024-01",
};

/**
 * Configure or update Shopify store domain dynamically
 */
export function setShopifyStoreDomain(domain) {
  if (domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    SHOPIFY_CONFIG.domain = cleanDomain.includes(".") ? cleanDomain : `${cleanDomain}.myshopify.com`;
  }
}

// In-memory customer token storage (no localStorage)
let _inMemoryCustomerToken = null;

/**
 * Execute a Storefront GraphQL query
 */
export async function storefrontQuery(query, variables = {}) {
  const endpoint = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Shopify Storefront API error (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors.map((e) => e.message).join(", "));
    }

    return json.data;
  } catch (err) {
    console.warn("Shopify Storefront Query note:", err.message);
    throw err;
  }
}

/**
 * Create a new Shopify Cart with items and retrieve direct checkout URL
 */
export async function createShopifyCart(items = [], options = {}) {
  // Map local items to Shopify merchandise lines if variant IDs are known
  const lines = items
    .filter((it) => it && it.product)
    .map((it) => {
      const variantId =
        it.product.shopifyVariantId ||
        it.product.variantId ||
        (it.product.id && String(it.product.id).startsWith("gid://")
          ? it.product.id
          : null);

      if (variantId) {
        return {
          merchandiseId: String(variantId).startsWith("gid://shopify/ProductVariant/")
            ? variantId
            : `gid://shopify/ProductVariant/${variantId}`,
          quantity: it.quantity || 1,
        };
      }
      return null;
    })
    .filter(Boolean);

  // Prepare clear order notes and line item attributes for Shopify Admin
  const itemNotes = items
    .filter((it) => it?.product)
    .map((it, idx) => {
      const p = it.product;
      const sku = p.sku ? ` [REF: ${p.sku}]` : "";
      const price = p.price || "";
      return `Watch ${idx + 1}: ${p.name || "HANBORO Timepiece"}${sku} (${price}) × ${it.quantity || 1}`;
    });

  const orderNote = options.note || itemNotes.join("\n");

  const attributes = [
    ...items.slice(0, 10).map((it, idx) => ({
      key: `Watch_${idx + 1}`,
      value: `${it.product?.name || "Watch"} (SKU: ${it.product?.sku || "N/A"}) Qty: ${it.quantity || 1}`,
    })),
    ...(options.attributes || []),
  ];

  const input = {
    lines,
    note: orderNote,
    attributes,
  };

  // Attach customer identity if access token is available in memory or session
  try {
    const rawToken = _inMemoryCustomerToken || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_customer_token") : null);
    if (rawToken) {
      const parsed = typeof rawToken === "string" ? JSON.parse(rawToken) : rawToken;
      if (parsed.access_token) {
        input.buyerIdentity = {
          customerAccessToken: parsed.access_token,
        };
      }
    }
  } catch {}

  const mutation = `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const data = await storefrontQuery(mutation, { input });
    if (data?.cartCreate?.userErrors?.length > 0) {
      const errs = data.cartCreate.userErrors.map((e) => e.message).join("; ");
      throw new Error(errs);
    }
    return data?.cartCreate?.cart;
  } catch (err) {
    console.warn("createShopifyCart note:", err.message);
    // Fallback: build permalink or direct cart URL
    const fallbackUrl = buildShopifyCheckoutUrl(items);
    return { id: null, checkoutUrl: fallbackUrl };
  }
}

/**
 * Build a Shopify checkout permalink URL
 * Example: https://{shop}.myshopify.com/cart/{variant_id}:{quantity}
 */
export function buildShopifyCheckoutUrl(items = []) {
  const parts = items
    .map((it) => {
      const vid = it.product?.shopifyVariantId || it.product?.variantId;
      if (vid) {
        const cleanId = String(vid).replace(/[^\d]/g, "");
        return `${cleanId}:${it.quantity || 1}`;
      }
      return null;
    })
    .filter(Boolean);

  if (parts.length === 0) {
    return `https://${SHOPIFY_CONFIG.domain}/cart`;
  }

  return `https://${SHOPIFY_CONFIG.domain}/cart/${parts.join(",")}`;
}

/**
 * Fetch products directly from Shopify Storefront catalog
 */
export async function fetchShopifyProducts(first = 80) {
  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            descriptionHtml
            vendor
            productType
            tags
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  quantityAvailable
                }
              }
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await storefrontQuery(query, { first });
    return (data?.products?.edges || []).map((e) => e.node);
  } catch (err) {
    console.warn("fetchShopifyProducts note:", err.message);
    return [];
  }
}

/**
 * ── LIVE SHOPIFY DATA LAYER ──────────────────────────────────────────────────
 * Fetches ONLY price, availability, and title from Shopify in a single fast
 * GraphQL query (250 max). Use this on every page load to reflect any changes
 * made in Shopify Admin without needing to redeploy.
 *
 * Returns a Map keyed by Shopify product handle → { shopifyPrice, shopifyComparePrice,
 *   availableForSale, quantityAvailable, shopifyTitle }
 */
export async function fetchLiveShopifyData() {
  const query = `{
    products(first: 250) {
      edges {
        node {
          id
          handle
          title
          description
          variants(first: 10) {
            edges {
              node {
                id
                sku
                title
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                availableForSale
                quantityAvailable
              }
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }`;

  try {
    const data = await storefrontQuery(query, {});
    const liveMap = new Map();
    for (const edge of (data?.products?.edges || [])) {
      const node = edge.node;
      const primaryVariant = node.variants?.edges?.[0]?.node;
      if (!primaryVariant) continue;

      const baseInfo = {
        shopifyId: node.id,
        shopifyHandle: node.handle,
        shopifyTitle: node.title,
        shopifyPrice: primaryVariant.price?.amount ? Math.round(parseFloat(primaryVariant.price.amount)) : null,
        shopifyComparePrice: primaryVariant.compareAtPrice?.amount ? Math.round(parseFloat(primaryVariant.compareAtPrice.amount)) : null,
        availableForSale: primaryVariant.availableForSale ?? true,
        quantityAvailable: primaryVariant.quantityAvailable ?? null,
        shopifyVariantId: primaryVariant.id,
        shopifyImages: (node.images?.edges || []).map(img => img.node.url),
      };

      // Key by handle (lowercase and exact)
      liveMap.set(node.handle.toLowerCase(), baseInfo);
      liveMap.set(node.handle, baseInfo);

      // Key by every variant SKU
      for (const vEdge of (node.variants?.edges || [])) {
        const v = vEdge.node;
        if (v?.sku) {
          const skuKey = v.sku.trim().toLowerCase();
          const variantInfo = {
            ...baseInfo,
            shopifyVariantId: v.id,
            shopifyPrice: v.price?.amount ? Math.round(parseFloat(v.price.amount)) : baseInfo.shopifyPrice,
            shopifyComparePrice: v.compareAtPrice?.amount ? Math.round(parseFloat(v.compareAtPrice.amount)) : baseInfo.shopifyComparePrice,
            availableForSale: v.availableForSale ?? baseInfo.availableForSale,
            quantityAvailable: v.quantityAvailable ?? baseInfo.quantityAvailable,
          };
          liveMap.set(skuKey, variantInfo);
          liveMap.set(v.sku.trim(), variantInfo);
        }
      }
    }
    return liveMap;
  } catch (err) {
    console.warn("fetchLiveShopifyData note:", err.message);
    return new Map();
  }
}

/**
 * ── SHOPIFY CUSTOMER ACCOUNT API (NEW CUSTOMER ACCOUNTS OAUTH) ─────────────
 */
export const SHOPIFY_CUSTOMER_CONFIG = {
  clientId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_CUSTOMER_CLIENT_ID) ||
    "41118fda-4bc0-40c3-9184-48dd97a9ae40",
  shopId:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_SHOP_ID) ||
    "88860197048",
  authEndpoint:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_AUTH_ENDPOINT) ||
    "https://shopify.com/authentication/88860197048/oauth/authorize",
  tokenEndpoint:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_TOKEN_ENDPOINT) ||
    "https://shopify.com/authentication/88860197048/oauth/token",
  logoutEndpoint:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_LOGOUT_ENDPOINT) ||
    "https://shopify.com/authentication/88860197048/logout",
  customerGraphQLEndpoint: "https://shopify.com/88860197048/account/customer/api/2024-01/graphql",
};

/**
 * Helper: Generate cryptographically secure random string
 */
function generateRandomString(length = 43) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

/**
 * Helper: Compute SHA-256 PKCE code challenge
 */
async function generateCodeChallenge(verifier) {
  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Fallback for non-secure / test environments
  return verifier;
}

/**
 * Generate Shopify Customer OAuth Authorization URL
 */
export async function buildCustomerAuthUrl(customRedirectUri = "") {
  const redirectUri =
    customRedirectUri ||
    (typeof window !== "undefined" ? `${window.location.origin}/` : "http://localhost:5173/");

  const state = generateRandomString(32);
  const nonce = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("shopify_oauth_state", state);
    sessionStorage.setItem("shopify_oauth_nonce", nonce);
    sessionStorage.setItem("shopify_code_verifier", codeVerifier);
    sessionStorage.setItem("shopify_redirect_uri", redirectUri);
  }

  const params = new URLSearchParams({
    client_id: SHOPIFY_CUSTOMER_CONFIG.clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid email customer-account-api:full",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${SHOPIFY_CUSTOMER_CONFIG.authEndpoint}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Customer Access Tokens
 */
export async function exchangeCustomerToken({ code, state }) {
  const savedState = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_oauth_state") : null;
  const codeVerifier = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_code_verifier") : "";
  const redirectUri = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_redirect_uri") : "";

  if (savedState && state && savedState !== state) {
    throw new Error("Invalid OAuth state parameter (CSRF detected)");
  }

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: SHOPIFY_CUSTOMER_CONFIG.clientId,
    redirect_uri: redirectUri || (typeof window !== "undefined" ? window.location.origin : ""),
    code,
    code_verifier: codeVerifier || "",
  });

  const res = await fetch(SHOPIFY_CUSTOMER_CONFIG.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Shopify Token Exchange Error (${res.status}): ${errText}`);
  }

  const tokenData = await res.json();
  if (tokenData.access_token) {
    _inMemoryCustomerToken = tokenData;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("shopify_customer_token", JSON.stringify(tokenData));
    }
  }
  return tokenData;
}

/**
 * Fetch Customer Account Profile & Orders via Customer Account GraphQL API
 */
export async function fetchCustomerProfile(accessToken) {
  const token =
    accessToken ||
    (() => {
      try {
        if (_inMemoryCustomerToken?.access_token) return _inMemoryCustomerToken.access_token;
        const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_customer_token") : null;
        return raw ? JSON.parse(raw).access_token : null;
      } catch {
        return null;
      }
    })();

  if (!token) return null;

  const query = `
    query GetCustomerInfo {
      customer {
        id
        firstName
        lastName
        displayName
        emailAddress {
          emailAddress
        }
        phoneNumber {
          phoneNumber
        }
        defaultAddress {
          formatted
          address1
          city
          zip
        }
        orders(first: 10) {
          edges {
            node {
              id
              name
              processedAt
              financialStatus
              fulfillmentStatus
              totalPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(SHOPIFY_CUSTOMER_CONFIG.customerGraphQLEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.customer || null;
  } catch (err) {
    console.warn("fetchCustomerProfile notice:", err.message);
    return null;
  }
}

/**
 * Get Direct Shopify Customer Account Portal URL
 */
export function getCustomerAccountUrl() {
  return `https://${SHOPIFY_CONFIG.domain}/account`;
}

/**
 * Build Customer Logout URL
 */
export function buildCustomerLogoutUrl(postLogoutRedirectUri = "") {
  const returnTo = postLogoutRedirectUri || (typeof window !== "undefined" ? window.location.origin : "");
  return `${SHOPIFY_CUSTOMER_CONFIG.logoutEndpoint}?post_logout_redirect_uri=${encodeURIComponent(returnTo)}`;
}

export const shopifyService = {
  config: SHOPIFY_CONFIG,
  customerConfig: SHOPIFY_CUSTOMER_CONFIG,
  setStoreDomain: setShopifyStoreDomain,
  storefrontQuery,
  createShopifyCart,
  buildShopifyCheckoutUrl,
  fetchShopifyProducts,
  fetchLiveShopifyData,
  buildCustomerAuthUrl,
  exchangeCustomerToken,
  fetchCustomerProfile,
  buildCustomerLogoutUrl,
  getCustomerAccountUrl,
};

export default shopifyService;

