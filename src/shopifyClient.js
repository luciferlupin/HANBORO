/**
 * HANBORO — Headless Shopify Storefront Client
 * Connects storefront catalog, cart, and checkout directly to Shopify.
 */

// Storefront API credentials. The public Storefront token is safe for browser
// use; private Admin API credentials must never be added to this client bundle.
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
  apiVersion: "2026-07",
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

export function clearCustomerSession() {
  _inMemoryCustomerToken = null;
  if (typeof sessionStorage !== "undefined") {
    [
      "shopify_customer_token",
      "shopify_oauth_state",
      "shopify_oauth_nonce",
      "shopify_code_verifier",
      "shopify_redirect_uri",
    ].forEach((key) => sessionStorage.removeItem(key));
  }
}

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
  let resolvedItems = items;

  // The generated ID map is a startup hint, not a commerce authority. Resolve
  // unsynced items by SKU before checkout so recreated Shopify variants cannot
  // strand a buyer on a cart URL containing a deleted merchandise ID.
  if (items.some((item) => item?.product && !item.product._shopifyLiveSynced)) {
    const liveMap = await fetchLiveShopifyData();
    if (liveMap.size === 0) {
      throw new Error("Shopify catalog is temporarily unavailable. Please try again.");
    }

    resolvedItems = items.map((item) => {
      const product = item?.product;
      if (!product) return item;
      const sku = String(product.sku || "").trim();
      const handle = String(product.shopifyHandle || product.id || "").trim();
      const sanitizedSku = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const sanitizedHandle = handle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const live =
        (sku ? liveMap.get(sku.toLowerCase()) || liveMap.get(sku) || liveMap.get(sanitizedSku) : null) ||
        (handle ? liveMap.get(handle.toLowerCase()) || liveMap.get(handle) || liveMap.get(sanitizedHandle) : null) ||
        (product.id ? liveMap.get(product.id.toLowerCase()) || liveMap.get(product.id) : null) ||
        (product.shopifyId ? liveMap.get(product.shopifyId) : null) ||
        (product.shopifyVariantId ? liveMap.get(product.shopifyVariantId) : null);

      if (!live?.shopifyVariantId) {
        throw new Error(`${product.name || sku || "This product"} is not currently published on Shopify.`);
      }

      return {
        ...item,
        product: { ...product, ...live, _shopifyLiveSynced: true },
      };
    });
  }

  // Map local items to Shopify merchandise lines if variant IDs are known
  const lines = resolvedItems
    .filter((it) => it && it.product)
    .map((it) => {
      const variantId =
        it.product.shopifyVariantId ||
        it.product.variantId ||
        (it.product.id && String(it.product.id).startsWith("gid://shopify/ProductVariant/")
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
  const itemNotes = resolvedItems
    .filter((it) => it?.product)
    .map((it, idx) => {
      const p = it.product;
      const sku = p.sku ? ` [REF: ${p.sku}]` : "";
      const price = p.price || "";
      const selectedOptions = Array.isArray(p.selectedOptions) && p.selectedOptions.length
        ? ` — ${p.selectedOptions.map((option) => `${option.name}: ${option.value}`).join(", ")}`
        : "";
      return `Watch ${idx + 1}: ${p.name || "HANBORO Timepiece"}${selectedOptions}${sku} (${price}) × ${it.quantity || 1}`;
    });

  const orderNote = options.note || itemNotes.join("\n");

  const attributes = [
    ...resolvedItems.slice(0, 10).map((it, idx) => ({
      key: `Watch_${idx + 1}`,
      value: `${it.product?.name || "Watch"}${Array.isArray(it.product?.selectedOptions) && it.product.selectedOptions.length ? ` — ${it.product.selectedOptions.map((option) => `${option.name}: ${option.value}`).join(", ")}` : ""} (SKU: ${it.product?.sku || "N/A"}) Qty: ${it.quantity || 1}`,
    })),
    ...(options.attributes || []),
  ];

  const input = {
    lines,
    note: orderNote,
    attributes,
    ...(options.discountCodes?.length ? { discountCodes: options.discountCodes } : {}),
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

  if (options.buyerIdentity) {
    input.buyerIdentity = {
      ...(input.buyerIdentity || {}),
      ...options.buyerIdentity,
    };
  }

  const mutation = `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
            totalAmount {
              amount
              currencyCode
            }
          }
          discountCodes {
            code
            applicable
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
    const cart = data?.cartCreate?.cart;
    if (options.requireApplicableDiscount && options.discountCodes?.length) {
      const inactiveCodes = (cart?.discountCodes || [])
        .filter((entry) => !entry.applicable)
        .map((entry) => entry.code);
      if (inactiveCodes.length > 0) {
        throw new Error(`Shopify discount is no longer active: ${inactiveCodes.join(", ")}`);
      }
    }
    return cart;
  } catch (err) {
    console.warn("createShopifyCart note:", err.message);
    // Never fall back to the legacy Online Store cart/theme. A failed Cart API
    // request stays inside HANBORO so the buyer can retry safely.
    throw err;
  }
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
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  sku
                  selectedOptions {
                    name
                    value
                  }
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
                  image {
                    url
                    altText
                  }
                  metafields(identifiers: [
                    { namespace: "custom", key: "image" },
                    { namespace: "custom", key: "images" },
                    { namespace: "custom", key: "variant_media" },
                    { namespace: "custom", key: "smind_variant_media" },
                    { namespace: "custom", key: "smind_-_variant_media" },
                    { namespace: "custom", key: "smind-variant-media" },
                    { namespace: "custom", key: "smind_variant_images" },
                    { namespace: "custom", key: "smind_media" },
                    { namespace: "custom", key: "media" },
                    { namespace: "custom", key: "photos" },
                    { namespace: "custom", key: "gallery" },
                    { namespace: "smind", key: "variant_media" },
                    { namespace: "smind", key: "variant-media" },
                    { namespace: "smind", key: "media" },
                    { namespace: "smind_sections", key: "variant_media" },
                    { namespace: "smind_sections", key: "variant-media" },
                    { namespace: "app--01a0d3c9-249a-7281-b443-d89d4893d6dd", key: "variant_media" },
                    { namespace: "app--01a0d3c9-249a-7281-b443-d89d4893d6dd", key: "smind_variant_media" }
                  ]) {
                    namespace
                    key
                    value
                    type
                    reference {
                      ... on MediaImage {
                        image {
                          url
                          altText
                        }
                      }
                      ... on GenericFile {
                        url
                      }
                    }
                    references(first: 25) {
                      edges {
                        node {
                          ... on MediaImage {
                            image {
                              url
                              altText
                            }
                          }
                          ... on GenericFile {
                            url
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            images(first: 50) {
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

const SHOPIFY_SPEC_KEY_ALIASES = {
  "model": "modelNumber",
  "model number": "modelNumber",
  "reference model": "modelNumber",
  "reference": "modelNumber",
  "movement": "movement",
  "calibre": "movement",
  "caliber": "movement",
  "movement type": "movement",
  "frequency": "frequency",
  "beat rate": "frequency",
  "power reserve": "powerReserve",
  "power reserve system": "powerReserveSystem",
  "reserve system": "powerReserveSystem",
  "jewels": "jewels",
  "jewel count": "jewels",
  "case size": "caseDimensions",
  "case diameter": "caseDimensions",
  "case dimensions": "caseDimensions",
  "diameter": "caseDimensions",
  "case material": "caseMaterial",
  "material": "caseMaterial",
  "glass": "glass",
  "crystal": "glass",
  "crystal type": "glass",
  "caseback": "caseback",
  "case back": "caseback",
  "case back type": "caseback",
  "dial": "dial",
  "dial color": "dial",
  "dial type": "dial",
  "water resistance": "waterResistance",
  "water resistant": "waterResistance",
  "strap": "strap",
  "band": "strap",
  "band material": "strap",
  "strap material": "strap",
  "clasp": "clasp",
  "clasp type": "clasp",
  "buckle": "clasp",
  "packaging": "packaging",
  "package contents": "packaging",
  "warranty": "warranty",
  "warranty period": "warranty",
  "lug to lug": "lugToLug",
  "lug-to-lug": "lugToLug",
  "lug width": "lugWidth",
  "thickness": "thickness",
  "case thickness": "thickness",
  "height": "thickness",
  "complications": "complicationsText",
  "functions": "complicationsText",
  "features": "complicationsText",
  // Bezel
  "bezel": "bezel",
  "bezel material": "bezel",
  "bezel type": "bezel",
  "bezel insert": "bezel",
  // Crown
  "crown": "crown",
  "crown type": "crown",
  "winding crown": "crown",
  // Hands
  "hands": "hands",
  "hand finish": "hands",
  "hands finish": "hands",
  // Lume
  "lume": "lume",
  "lume material": "lume",
  "luminous": "lume",
  "luminous material": "lume",
  "luminescence": "lume",
  "super-luminova": "lume",
  // Winding
  "winding": "winding",
  "winding type": "winding",
  "winding system": "winding",
  // Date
  "date": "dateDisplay",
  "date display": "dateDisplay",
  "date window": "dateDisplay",
  "date complication": "dateDisplay",
  // Bracelet / strap dimensions
  "bracelet": "strap",
  "bracelet material": "strap",
  "bracelet type": "strap",
  "band type": "strap",
  "strap width": "strapWidth",
  "strap length": "strapLength",
  "band width": "strapWidth",
  // Case weight
  "weight": "caseWeight",
  "case weight": "caseWeight",
  "net weight": "caseWeight",
  // Time zones / GMT
  "time zone": "timeZone",
  "gmt": "timeZone",
  "utc offset": "timeZone",
  // Water pressure
  "water pressure": "waterResistance",
  "atm": "waterResistance",
  // Compliance & Origin Aliases
  "country of origin": "countryOfOrigin",
  "origin": "countryOfOrigin",
  "manufacturer": "manufacturer",
  "importer / packer": "importer",
  "importer": "importer",
  "packer": "importer",
  "generic name": "genericName",
  "net quantity": "netQuantity",
  "month and year of manufacture": "manufactureDate",
};

function decodeShopifyHtml(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

/**
 * Parse the Specifications list authored in Shopify's product description or metafields.
 * Supports:
 *   1. HTML Tables (<tr><td>Label</td><td>Value</td></tr>)
 *   2. HTML Lists (<li><strong>Label:</strong> Value</li> or <li>Label: Value</li>)
 *   3. HTML Paragraphs (<p><strong>Label:</strong> Value</p>)
 *   4. Multi-line plain text (Label: Value per line)
 *   5. Inline sentence format ("...Case Diameter: 40mm. Case Thickness: 9mm. Movement: Automatic.")
 * Shopify is authoritative for these values; local specs remain a fallback.
 */
export function parseShopifySpecifications(descriptionHtml = "") {
  const specs = {};
  const rows = [];
  const seen = new Set();

  function processMatch(rawLabel, rawValue) {
    const label = decodeShopifyHtml(rawLabel).replace(/[\n\r]+/g, " ").replace(/:\s*$/, "").trim();
    const value = decodeShopifyHtml(rawValue).replace(/[\n\r]+/g, " ").replace(/^:\s*/, "").replace(/[;,.\s]+$/, "").trim();
    if (!label || !value) return;
    if (label.length > 50 || value.length > 300) return;
    const lowerLabel = label.toLowerCase();
    if (seen.has(lowerLabel)) return;
    seen.add(lowerLabel);
    rows.push({ label, value });
    const canonicalKey = SHOPIFY_SPEC_KEY_ALIASES[lowerLabel];
    if (canonicalKey) specs[canonicalKey] = value;
  }

  // Strategy 1: HTML Tables (<tr><td>Label</td><td>Value</td></tr>)
  const tableRowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = tableRowPattern.exec(descriptionHtml)) !== null) {
    const cells = trMatch[1].match(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (cells && cells.length >= 2) {
      const l = cells[0].replace(/<[^>]+>/g, "");
      const v = cells[1].replace(/<[^>]+>/g, "");
      processMatch(l, v);
    }
  }

  // Strategy 2: <li> tags: <li><strong>Label:</strong> Value</li> or <li>Label: Value</li>
  const listItemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = listItemPattern.exec(descriptionHtml)) !== null) {
    const liContent = liMatch[1];
    const strongMatch = liContent.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>\s*:?\s*([\s\S]*)/i);
    if (strongMatch) {
      processMatch(strongMatch[1], strongMatch[2]);
    } else {
      const colonIdx = liContent.indexOf(":");
      if (colonIdx > 0 && colonIdx < 40) {
        processMatch(liContent.slice(0, colonIdx), liContent.slice(colonIdx + 1));
      }
    }
  }

  // Strategy 3: <p><strong>Label:</strong> Value</p>
  if (rows.length === 0) {
    const pPattern = /<p\b[^>]*>\s*<strong\b[^>]*>([\s\S]*?)<\/strong>\s*:?\s*([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pPattern.exec(descriptionHtml)) !== null) {
      processMatch(pMatch[1], pMatch[2]);
    }
  }

  // Strategy 4: Line-by-line in plain text (split by newlines/<br>/<p>)
  if (rows.length === 0) {
    const textWithNewlines = decodeShopifyHtml(descriptionHtml);
    const lines = textWithNewlines.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 1 && colonIdx < 40) {
        const potentialLabel = trimmed.slice(0, colonIdx).trim().toLowerCase();
        if (SHOPIFY_SPEC_KEY_ALIASES[potentialLabel] || /^(case|strap|dial|glass|crystal|movement|calibre|caliber|water|jewels|frequency|power|warranty|clasp|bezel|thickness|crown|lume|weight|country|manufacturer|importer)/i.test(potentialLabel)) {
          processMatch(trimmed.slice(0, colonIdx), trimmed.slice(colonIdx + 1));
        }
      }
    }
  }

  // Strategy 5: Inline sentence format (e.g. "...Case Diameter: 40mm. Case Thickness: 9mm. Movement: Automatic.")
  if (rows.length === 0) {
    const plainText = decodeShopifyHtml(descriptionHtml);
    const segments = plainText.split(/[\r\n•;]+|[.](?=\s+[A-Z])/);
    for (const seg of segments) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 1 && colonIdx < 40) {
        const rawL = trimmed.slice(0, colonIdx).trim();
        const rawV = trimmed.slice(colonIdx + 1).trim();
        const lowerL = rawL.toLowerCase();
        if (SHOPIFY_SPEC_KEY_ALIASES[lowerL] || /^(case|strap|dial|glass|crystal|movement|calibre|caliber|water|jewels|frequency|power|warranty|clasp|bezel|thickness|crown|lume|weight|country|manufacturer|importer)/i.test(lowerL)) {
          processMatch(rawL, rawV);
        }
      }
    }
  }

  return { specs, rows };
}

/**
 * Intelligent collection detector that requires ZERO tags in Shopify.
 * Automatically scans Title, Product Type, Description, and Handle.
 */
export function detectShopifyCollection(item = {}) {
  const text = [
    item.shopifyTitle || item.title || item.name || "",
    item.shopifyProductType || item.productType || "",
    item.shopifyDescription || item.description || "",
    item.shopifyHandle || item.handle || item.id || "",
    ...(item.shopifyTags || item.tags || []),
  ].join(" ").toLowerCase();

  if (/tourbillon|complication|celestial|cosmos|astroworld|orbit/i.test(text)) {
    return { collection: "TOURBILLON", collectionName: "Tourbillon & Complications" };
  }
  if (/roulette|casino/i.test(text)) {
    return { collection: "ROULETTE", collectionName: "Casino & Roulette" };
  }
  if (/octagonal|royal octagonal|diamond octagonal/i.test(text)) {
    return { collection: "OCTAGONAL", collectionName: "Royal Octagonal" };
  }
  if (/tonneau|skeleton|clover|carbonx|\bcarbon\b|fighter|sichuan|cantilever/i.test(text)) {
    return { collection: "TONNEAU", collectionName: "Tonneau Skeleton" };
  }
  if (/\b(diver|chronograph|chrono|oceanic|seamaster|sport|200m)\b/i.test(text)) {
    return { collection: "DIVER_SPORT", collectionName: "Diver & Sport Chrono" };
  }
  return {
    collection: "CLASSIC",
    collectionName: item.shopifyProductType || item.productType || "Classic & Moonphase"
  };
}

/**
 * ── LIVE SHOPIFY DATA LAYER ──────────────────────────────────────────────────
 * Fetches live product media, copy, pricing, availability, inventory, and
 * identifiers from Shopify in a single GraphQL query (250 max).
 *
 * Shopify is the single authoritative source for images, specs, and details.
 * No tags are required in Shopify.
 */
let _liveShopifyDataPromise = null;
let _liveShopifyDataCache = null;
let _liveShopifyDataCacheTime = 0;
const LIVE_DATA_CACHE_TTL = 15000;

export async function fetchLiveShopifyData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _liveShopifyDataCache && (now - _liveShopifyDataCacheTime < LIVE_DATA_CACHE_TTL)) {
    return _liveShopifyDataCache;
  }
  if (!forceRefresh && _liveShopifyDataPromise) {
    return _liveShopifyDataPromise;
  }

  _liveShopifyDataPromise = (async () => {
    const query = `{
    products(first: 250) {
      edges {
        node {
          id
          handle
          title
          description
          descriptionHtml
          vendor
          productType
          tags
          featuredImage {
            url
            altText
            width
            height
          }
          variants(first: 250) {
            edges {
              node {
                id
                sku
                title
                selectedOptions { name value }
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                availableForSale
                quantityAvailable
                image {
                  url
                  altText
                }
                metafields(identifiers: [
                  { namespace: "custom", key: "image" },
                  { namespace: "custom", key: "images" },
                  { namespace: "custom", key: "variant_media" },
                  { namespace: "custom", key: "smind_variant_media" },
                  { namespace: "custom", key: "smind_-_variant_media" },
                  { namespace: "custom", key: "smind-variant-media" },
                  { namespace: "custom", key: "smind_variant_images" },
                  { namespace: "custom", key: "smind_media" },
                  { namespace: "custom", key: "media" },
                  { namespace: "custom", key: "photos" },
                  { namespace: "custom", key: "gallery" },
                  { namespace: "smind", key: "variant_media" },
                  { namespace: "smind", key: "variant-media" },
                  { namespace: "smind", key: "media" },
                  { namespace: "smind_sections", key: "variant_media" },
                  { namespace: "smind_sections", key: "variant-media" },
                  { namespace: "app--01a0d3c9-249a-7281-b443-d89d4893d6dd", key: "variant_media" },
                  { namespace: "app--01a0d3c9-249a-7281-b443-d89d4893d6dd", key: "smind_variant_media" }
                ]) {
                  namespace
                  key
                  value
                  type
                  reference {
                    ... on MediaImage {
                      image {
                        url
                        altText
                      }
                    }
                    ... on GenericFile {
                      url
                    }
                  }
                  references(first: 25) {
                    edges {
                      node {
                        ... on MediaImage {
                          image {
                            url
                            altText
                          }
                        }
                        ... on GenericFile {
                          url
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          images(first: 50) {
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
  }`;

  try {
    const data = await storefrontQuery(query, {});
    const liveMap = new Map();
    for (const edge of (data?.products?.edges || [])) {
      const node = edge.node;
      const primaryVariant = node.variants?.edges?.[0]?.node;
      if (!primaryVariant) continue;

      const liveImageObjects = (node.images?.edges || [])
        .map((img) => ({
          url: img.node.url,
          altText: img.node.altText || "",
        }))
        .filter((img) => Boolean(img.url));
      const liveImages = liveImageObjects.map((img) => img.url);
      const featuredImageUrl = node.featuredImage?.url || primaryVariant.image?.url || liveImages[0] || "";
      const parsedSpecifications = parseShopifySpecifications(node.descriptionHtml || node.description || "");
      const shopifyVariants = (node.variants?.edges || []).map(({ node: variant }) => {
        const metafieldImages = [];
        if (Array.isArray(variant.metafields)) {
          for (const mf of variant.metafields) {
            if (!mf) continue;
            // 1. Single reference (MediaImage or GenericFile)
            if (mf.reference?.image?.url) {
              const u = mf.reference.image.url;
              if (u && !metafieldImages.includes(u)) metafieldImages.push(u);
            } else if (mf.reference?.url) {
              const u = mf.reference.url;
              if (u && !metafieldImages.includes(u)) metafieldImages.push(u);
            }
            // 2. List of references (MediaImage or GenericFile)
            if (Array.isArray(mf.references?.edges)) {
              for (const edge of mf.references.edges) {
                const u = edge?.node?.image?.url || edge?.node?.url;
                if (u && !metafieldImages.includes(u)) metafieldImages.push(u);
              }
            }
            // 3. Raw value parsing (JSON array of URLs or direct URL string)
            if (mf.value && typeof mf.value === "string") {
              try {
                const parsed = JSON.parse(mf.value);
                if (Array.isArray(parsed)) {
                  for (const item of parsed) {
                    if (typeof item === "string" && item.startsWith("http") && !metafieldImages.includes(item)) {
                      metafieldImages.push(item);
                    }
                  }
                } else if (typeof parsed === "string" && parsed.startsWith("http") && !metafieldImages.includes(parsed)) {
                  metafieldImages.push(parsed);
                }
              } catch (_) {
                if (mf.value.startsWith("http") && !metafieldImages.includes(mf.value)) {
                  metafieldImages.push(mf.value);
                }
              }
            }
          }
        }
        return {
          id: variant.id,
          title: variant.title || "",
          sku: variant.sku?.trim() || "",
          selectedOptions: Array.isArray(variant.selectedOptions) ? variant.selectedOptions : [],
          price: variant.price?.amount ? Math.round(parseFloat(variant.price.amount)) : null,
          compareAtPrice: variant.compareAtPrice?.amount ? Math.round(parseFloat(variant.compareAtPrice.amount)) : null,
          availableForSale: variant.availableForSale ?? true,
          quantityAvailable: variant.quantityAvailable ?? null,
          image: variant.image?.url || "",
          imageAlt: variant.image?.altText || "",
          metafieldImages,
        };
      });
      
      // Extract model number from description specs, or derive from SKU / title without requiring tags
      const modelTag = (node.tags || []).find((tag) => /^model[-:\s]/i.test(tag));
      const shopifyModelNumber = parsedSpecifications.specs.modelNumber || modelTag?.replace(/^model[-:\s]*/i, "").trim() || "";
      
      const baseInfo = {
        shopifyId: node.id,
        shopifyHandle: node.handle,
        shopifyTitle: node.title,
        shopifyDescription: node.description || "",
        shopifyDescriptionHtml: node.descriptionHtml || "",
        shopifySpecifications: parsedSpecifications.specs,
        shopifySpecificationRows: parsedSpecifications.rows,
        shopifyVendor: node.vendor || "",
        shopifyProductType: node.productType || "",
        shopifyTags: Array.isArray(node.tags) ? node.tags : [],
        shopifySku: primaryVariant.sku?.trim() || "",
        shopifyModelNumber,
        shopifyPrice: primaryVariant.price?.amount ? Math.round(parseFloat(primaryVariant.price.amount)) : null,
        shopifyComparePrice: primaryVariant.compareAtPrice?.amount ? Math.round(parseFloat(primaryVariant.compareAtPrice.amount)) : null,
        availableForSale: primaryVariant.availableForSale ?? true,
        quantityAvailable: primaryVariant.quantityAvailable ?? null,
        shopifyVariantId: primaryVariant.id,
        shopifyFeaturedImage: featuredImageUrl,
        shopifyImages: liveImages.length > 0 ? liveImages : (featuredImageUrl ? [featuredImageUrl] : []),
        shopifyMedia: liveImageObjects,
        shopifyVariants,
      };

      // Key by handle (lowercase, exact, sanitized) as well as Shopify product GID
      const handleLower = node.handle.toLowerCase();
      const handleSanitized = handleLower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      liveMap.set(handleLower, baseInfo);
      liveMap.set(node.handle, baseInfo);
      liveMap.set(handleSanitized, baseInfo);
      if (node.id) liveMap.set(node.id, baseInfo);

      // Key by every variant SKU and variant ID
      for (const vEdge of (node.variants?.edges || [])) {
        const v = vEdge.node;
        const variantImageUrl = v?.image?.url || featuredImageUrl;
        const variantInfo = {
          ...baseInfo,
          shopifySku: v?.sku?.trim() || baseInfo.shopifySku,
          shopifyVariantId: v?.id || baseInfo.shopifyVariantId,
          shopifyPrice: v?.price?.amount ? Math.round(parseFloat(v.price.amount)) : baseInfo.shopifyPrice,
          shopifyComparePrice: v?.compareAtPrice?.amount ? Math.round(parseFloat(v.compareAtPrice.amount)) : baseInfo.shopifyComparePrice,
          availableForSale: v?.availableForSale ?? baseInfo.availableForSale,
          quantityAvailable: v?.quantityAvailable ?? baseInfo.quantityAvailable,
          shopifyVariantImage: variantImageUrl,
        };
        if (v?.id) liveMap.set(v.id, variantInfo);
        if (v?.sku) {
          const skuRaw = v.sku.trim();
          const skuKey = skuRaw.toLowerCase();
          const skuSanitized = skuKey.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          liveMap.set(skuKey, variantInfo);
          liveMap.set(skuRaw, variantInfo);
          liveMap.set(skuSanitized, variantInfo);
        }
      }
    }
    liveMap.shopifyProducts = Array.from(
      new Map(
        Array.from(liveMap.values())
          .filter((item) => item?.shopifyId)
          .map((item) => [item.shopifyId, item]),
      ).values(),
    );
      _liveShopifyDataCache = liveMap;
      _liveShopifyDataCacheTime = Date.now();
      return liveMap;
    } catch (err) {
      console.warn("fetchLiveShopifyData note:", err.message);
      return new Map();
    } finally {
      _liveShopifyDataPromise = null;
    }
  })();

  return _liveShopifyDataPromise;
}

/**
 * Merge Shopify's live commerce fields, uploaded photography, and specifications
 * into the catalog. Shopify is the single authoritative source of truth.
 *
 * Whatever is edited or uploaded in Shopify Admin reflects accurately and exclusively.
 */
export function mergeProductsWithShopifyData(localProducts = [], liveMap = new Map()) {
  const matchedShopifyProductIds = new Set();
  const mergedLocalProducts = localProducts.flatMap((product) => {
    const handle =
      product.shopifyHandle ||
      String(product.sku || product.id || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const sku = String(product.sku || "").trim();
    const id = String(product.id || "").trim();
    const sanitizedSku = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const sanitizedId = id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const live =
      liveMap.get(handle.toLowerCase()) ||
      liveMap.get(handle) ||
      (sku ? liveMap.get(sku.toLowerCase()) || liveMap.get(sku) || liveMap.get(sanitizedSku) : null) ||
      (id ? liveMap.get(id.toLowerCase()) || liveMap.get(id) || liveMap.get(sanitizedId) : null) ||
      (product.shopifyId ? liveMap.get(product.shopifyId) : null) ||
      (product.shopifyVariantId ? liveMap.get(product.shopifyVariantId) : null);

    // Shopify is the source of truth for which products are published.
    if (!live) return [];
    if (live.shopifyId) matchedShopifyProductIds.add(live.shopifyId);

    const livePrice = Number.isFinite(live.shopifyPrice) ? live.shopifyPrice : null;
    const liveComparePrice = Number.isFinite(live.shopifyComparePrice)
      ? live.shopifyComparePrice
      : null;

    // Use live Shopify uploaded images authoritatively
    const primaryLiveImage = live.shopifyFeaturedImage || (live.shopifyImages?.length > 0 ? live.shopifyImages[0] : product.image);
    const allLiveImages = live.shopifyImages?.length > 0 ? live.shopifyImages : (product.altImages || [primaryLiveImage]);
    const liveGallery = live.shopifyImages?.length > 0
      ? live.shopifyImages.map((imgUrl, i) => ({
          url: imgUrl,
          title: `${live.shopifyTitle || product.name} — Perspective 0${i + 1}`,
          label: `0${i + 1} View`,
          caption: `Official presentation of Reference ${live.shopifySku || product.sku}.`
        }))
      : product.gallery;

    // Auto-detect collection without tags
    const collectionInfo = detectShopifyCollection({ ...product, ...live });
    const genericTags = new Set(["automatic", "hanboro", "luxury watches", "skeleton"]);
    const liveTag = (live.shopifyTags || []).find((tag) => !genericTags.has(String(tag).toLowerCase()))
      || live.shopifyVendor
      || "HANBORO";

    return [{
      ...product,
      name: live.shopifyTitle || product.name,
      title: live.shopifyTitle || product.title || product.name,
      sku: live.shopifySku || product.sku,
      modelNumber: live.shopifyModelNumber || live.shopifySpecifications?.modelNumber || "",
      description: live.shopifyDescription || "",
      summary: live.shopifyDescription || "",
      subtitle: live.shopifyDescription || "",
      collection: collectionInfo.collection,
      collectionName: collectionInfo.collectionName,
      tag: liveTag,
      specs: { ...(live.shopifySpecifications || {}) },
      shopifySpecificationRows: live.shopifySpecificationRows || [],
      image: primaryLiveImage,
      transparentImage: primaryLiveImage,
      altImages: allLiveImages,
      gallery: liveGallery,
      price: livePrice !== null ? `₹${livePrice.toLocaleString("en-IN")}` : product.price,
      priceNumeric: livePrice ?? product.priceNumeric,
      mrp: liveComparePrice !== null
        ? `₹${liveComparePrice.toLocaleString("en-IN")}`
        : null,
      mrpNumeric: liveComparePrice,
      stock: live.quantityAvailable,
      availability: live.availableForSale === false ? "Out of Stock" : "In Stock",
      availableForSale: live.availableForSale,
      quantityAvailable: live.quantityAvailable,
      shopifyId: live.shopifyId || product.shopifyId,
      shopifyVariantId: live.shopifyVariantId || product.shopifyVariantId,
      shopifyHandle: live.shopifyHandle || product.shopifyHandle || handle,
      shopifyFeaturedImage: live.shopifyFeaturedImage || "",
      shopifyImages: live.shopifyImages || [],
      shopifyMedia: live.shopifyMedia || [],
      shopifyVariants: live.shopifyVariants || [],
      _shopifyLiveSynced: true,
    }];
  });

  const shopifyOnlyProducts = (liveMap.shopifyProducts || [])
    .filter((live) => live?.shopifyId && !matchedShopifyProductIds.has(live.shopifyId))
    .map((live, index) => {
      const fallbackSku = live.shopifySku || String(live.shopifyHandle || `shopify-${index + 1}`).toUpperCase();
      const livePrice = Number.isFinite(live.shopifyPrice) ? live.shopifyPrice : 0;
      const liveComparePrice = Number.isFinite(live.shopifyComparePrice) ? live.shopifyComparePrice : null;

      // Smart collection detection without tags
      const collectionInfo = detectShopifyCollection(live);

      // Pick the most informative tag for the badge if tags exist, else fallback to brand
      const genericTags = new Set(["automatic", "hanboro", "luxury watches", "skeleton"]);
      const productTag = (live.shopifyTags || []).find(t => !genericTags.has(t.toLowerCase())) || "HANBORO";

      const primaryLiveImage = live.shopifyFeaturedImage || live.shopifyImages?.[0] || "/watch-architectural-skeleton-black-front-transparent.webp";
      const allLiveImages = live.shopifyImages?.length > 0 ? live.shopifyImages : [primaryLiveImage];

      return {
        id: live.shopifyHandle || live.shopifyId,
        sku: fallbackSku,
        modelNumber: live.shopifyModelNumber || live.shopifySpecifications?.modelNumber || "",
        name: live.shopifyTitle || "HANBORO Timepiece",
        title: live.shopifyTitle || "HANBORO Timepiece",
        subtitle: live.shopifyDescription || "",
        summary: live.shopifyDescription || "",
        description: live.shopifyDescription || "",
        collection: collectionInfo.collection,
        collectionName: collectionInfo.collectionName,
        tag: productTag,
        image: primaryLiveImage,
        transparentImage: primaryLiveImage,
        altImages: allLiveImages,
        gallery: allLiveImages.map((imgUrl, i) => ({
          url: imgUrl,
          title: `${live.shopifyTitle || "HANBORO Timepiece"} — View 0${i + 1}`,
          label: `0${i + 1} View`,
          caption: `${live.shopifyTitle || "HANBORO Timepiece"} official boutique presentation.`
        })),
        specs: { ...(live.shopifySpecifications || {}) },
        shopifySpecificationRows: live.shopifySpecificationRows || [],
        price: `₹${livePrice.toLocaleString("en-IN")}`,
        priceNumeric: livePrice,
        mrp: liveComparePrice !== null ? `₹${liveComparePrice.toLocaleString("en-IN")}` : null,
        mrpNumeric: liveComparePrice,
        stock: live.quantityAvailable,
        availability: live.availableForSale === false ? "Out of Stock" : "In Stock",
        availableForSale: live.availableForSale,
        quantityAvailable: live.quantityAvailable,
        shopifyId: live.shopifyId,
        shopifyVariantId: live.shopifyVariantId,
        shopifyHandle: live.shopifyHandle,
        shopifyFeaturedImage: live.shopifyFeaturedImage,
        shopifyImages: allLiveImages,
        shopifyMedia: live.shopifyMedia || [],
        shopifyVariants: live.shopifyVariants || [],
        catalogOrder: Number.MAX_SAFE_INTEGER - 1000 + index,
        _shopifyLiveSynced: true,
        _shopifyOnlyProduct: true,
      };
    });

  return [...mergedLocalProducts, ...shopifyOnlyProducts];
}

/**
 * Filter images belonging strictly to a selected variant.
 * 1. Variant's explicit image is first.
 * 2. Additional images whose Alt Text or filename contains the variant title or option values are included.
 * 3. Images belonging to or tagged for other variants are strictly excluded.
 * 4. Non-conflicting generic detail images (e.g. movement, caseback, presentation box) can follow.
 * 5. Supports unlimited photos per variant by setting the variant name in Shopify Media Alt Text or filename.
 */
export function filterImagesForVariant(product, variant, allProducts = []) {
  if (!product) return [];
  const allMedia = Array.isArray(product.shopifyMedia) && product.shopifyMedia.length > 0
    ? product.shopifyMedia
    : (Array.isArray(product.shopifyImages)
      ? product.shopifyImages.map((u) => (typeof u === "string" ? { url: u, altText: "" } : u))
      : []);

  const fallbackSingleImage = variant?.image || product.shopifyFeaturedImage || product.image;
  const allVariants = Array.isArray(product.shopifyVariants) ? product.shopifyVariants : [];

  if (allVariants.length <= 1) {
    const list = allMedia.map((m) => m?.url).filter(Boolean);
    if (fallbackSingleImage && !list.includes(fallbackSingleImage)) {
      return [fallbackSingleImage, ...list];
    }
    return list.length > 0 ? list : (fallbackSingleImage ? [fallbackSingleImage] : []);
  }

  const currentTokens = [
    ...(variant?.selectedOptions || [])
      .filter((o) => !/^(watch\s*display|display|model)$/i.test(o.name))
      .map((o) => String(o.value || "")),
    String(variant?.title || ""),
    String(variant?.sku || ""),
  ]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "default title" && s !== "analog");

  const otherVariants = allVariants.filter((v) => v.id !== variant?.id);
  const otherVariantImageUrls = new Set(otherVariants.map((v) => v.image).filter(Boolean));
  const otherTokens = otherVariants
    .flatMap((v) => [
      ...(v.selectedOptions || [])
        .filter((o) => !/^(watch\s*display|display|model)$/i.test(o.name))
        .map((o) => String(o.value || "")),
      String(v.title || ""),
      String(v.sku || ""),
    ])
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "default title" && s !== "analog");

  const GENERIC_DETAIL_REGEX = /(?:movement|calibre|caliber|mechanism|caseback|back-view|buckle|clasp|strap-detail|packaging|box|manual|warranty|lifestyle|wrist-size|crown)/i;
  const COLOR_WORDS_REGEX = /(?:black|blue|silver|gold|green|white|red|orange|beige|grey|gray|rose|yellow|brown|emerald|crimson)/i;

  // Check if variant.image is actually authentic to this variant or an auto-copied default:
  let rawVariantImage = variant?.image;
  let isSharedOrMismatchedImage = false;
  if (rawVariantImage) {
    const isSharedFeatured = rawVariantImage === product.shopifyFeaturedImage && (
      otherVariants.some((o) => o.image === rawVariantImage) ||
      (currentTokens.length > 0 && !currentTokens.some((tok) => rawVariantImage.toLowerCase().includes(tok)))
    );
    const hasColorConflict = otherTokens.some((tok) => tok && rawVariantImage.toLowerCase().includes(tok)) &&
                             !currentTokens.some((tok) => tok && rawVariantImage.toLowerCase().includes(tok));
    if (isSharedFeatured || hasColorConflict) {
      isSharedOrMismatchedImage = true;
    }
  }

  const variantImage = isSharedOrMismatchedImage ? null : rawVariantImage;

  const matchingMedia = [];
  const genericDetails = [];

  // 1. Include primary direct variant image first
  if (variantImage && !matchingMedia.includes(variantImage)) {
    matchingMedia.push(variantImage);
  }

  // 2. Include any additional images attached explicitly to this variant via metafields (e.g. Smind or custom variant media)
  if (Array.isArray(variant?.metafieldImages) && variant.metafieldImages.length > 0) {
    for (const mUrl of variant.metafieldImages) {
      if (mUrl && !matchingMedia.includes(mUrl)) {
        matchingMedia.push(mUrl);
      }
    }
  }

  for (const item of allMedia) {
    const url = item?.url;
    if (!url || typeof url !== "string" || url.endsWith(".mp4")) continue;

    // 1. Direct variant image
    if (variantImage && url === variantImage) {
      if (!matchingMedia.includes(url)) matchingMedia.push(url);
      continue;
    }

    // 2. Belongs explicitly to another variant
    if (otherVariantImageUrls.has(url)) {
      continue;
    }

    const alt = String(item.altText || "").toLowerCase();
    const filename = url.split("?")[0].split("/").pop().toLowerCase();

    const matchesCurrent = currentTokens.some((tok) => tok && (alt.includes(tok) || filename.includes(tok)));
    const matchesOther = otherTokens.some((tok) => tok && (alt.includes(tok) || filename.includes(tok)));

    if (matchesCurrent && !matchesOther) {
      if (!matchingMedia.includes(url)) matchingMedia.push(url);
    } else if (matchesOther) {
      continue;
    } else {
      // Non-conflicting generic details (box, movement, caseback) without color references
      const isGeneric = (GENERIC_DETAIL_REGEX.test(alt) || GENERIC_DETAIL_REGEX.test(filename)) &&
                        !COLOR_WORDS_REGEX.test(alt) && !COLOR_WORDS_REGEX.test(filename);
      if (isGeneric && !genericDetails.includes(url)) {
        genericDetails.push(url);
      }
    }
  }

  if (variantImage && !matchingMedia.includes(variantImage)) {
    matchingMedia.unshift(variantImage);
  }

  if (matchingMedia.length > 0) {
    return [...matchingMedia, ...genericDetails];
  }

  // Check sibling products in allProducts / modelVariants for matching color
  if (Array.isArray(allProducts) && allProducts.length > 0 && currentTokens.length > 0) {
    const baseKey = resolveModelKey(product);
    for (const tok of currentTokens) {
      const sibling = allProducts.find((p) => {
        if (p.id === product.id) return false;
        if (baseKey && resolveModelKey(p) !== baseKey) return false;
        const pTitle = String(p.shopifyTitle || p.title || p.name || "").toLowerCase();
        const pHandle = String(p.shopifyHandle || p.handle || "").toLowerCase();
        return pTitle.includes(tok) || pHandle.includes(tok);
      });
      if (sibling) {
        const siblingImgs = Array.isArray(sibling.shopifyImages) && sibling.shopifyImages.length > 0
          ? sibling.shopifyImages
          : (sibling.image ? [sibling.image] : []);
        if (siblingImgs.length > 0) {
          return siblingImgs.filter((u) => u && !otherVariantImageUrls.has(u));
        }
      }
    }
  }

  if (rawVariantImage) {
    return [rawVariantImage, ...genericDetails];
  }

  const fallback = allMedia
    .map((m) => m?.url)
    .filter((u) => u && !otherVariantImageUrls.has(u));

  return fallback.length > 0 ? fallback : (product.image ? [product.image] : []);
}

function resolveModelKey(watch) {
  if (!watch) return "";
  const explicit = String(watch.modelNumber || watch.specs?.modelNumber || "").trim();
  if (
    explicit &&
    explicit !== "—" &&
    explicit.toLowerCase() !== "automatic" &&
    explicit.toLowerCase() !== "tourbillon" &&
    explicit.toLowerCase() !== "luxury automatic watches"
  ) {
    return explicit.toUpperCase();
  }
  if (watch.sku) {
    const parts = String(watch.sku).toUpperCase().split("-");
    if (parts.length >= 2 && parts[0] === "HBR") {
      if (parts.length >= 3 && /^\d+$/.test(parts[2])) {
        return `${parts[1]}-${parts[2]}`;
      }
      return parts[1];
    }
  }
  const text = (String(watch.name || watch.title || watch.shopifyTitle || "") + " " + String(watch.shopifyHandle || watch.handle || "")).toUpperCase();
  const match = text.match(/(?:HANBORO|HBR)[-\s]+([0-9]{3,4}(?:-[0-9]+)?)/i);
  if (match && match[1]) {
    return match[1];
  }
  return String(watch.id || watch.shopifyId || watch.sku || "").trim();
}

/**
 * Returns a variant-specific display title (e.g. "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Silver Dial")
 */
export function getVariantDisplayName(baseProduct, variant, allProducts = []) {
  const baseName = (typeof baseProduct === "string" ? baseProduct : (baseProduct?.name || baseProduct?.title || "")).trim();
  if (!variant) return baseName;
  const variantTitle = String(variant.title || "").trim();
  if (!variantTitle || variantTitle.toLowerCase() === "default title") {
    return baseName;
  }

  const options = Array.isArray(variant.selectedOptions) ? variant.selectedOptions : [];
  const colorOption = options.find((o) => /^(dial\s*color|color|colour|edition|style)$/i.test(o.name))?.value ||
                      options.find((o) => !/^(watch\s*display|display|size|model)$/i.test(o.name))?.value ||
                      options[0]?.value ||
                      variantTitle.split("/")[0].trim();

  const variantLabel = (colorOption || variantTitle).trim();

  // If a sibling product for the SAME model has this exact colorway title, use it
  if (Array.isArray(allProducts) && allProducts.length > 0 && typeof baseProduct === "object") {
    const modelKey = resolveModelKey(baseProduct);
    const sibling = allProducts.find((p) => {
      if (p.id === baseProduct.id) return false;
      if (modelKey && resolveModelKey(p) !== modelKey) return false;
      const pTitle = String(p.shopifyTitle || p.title || p.name || "").toLowerCase();
      const pHandle = String(p.shopifyHandle || p.handle || "").toLowerCase();
      const tok = variantLabel.toLowerCase();
      return pTitle.includes(tok) || pHandle.includes(tok);
    });

    if (sibling && (sibling.shopifyTitle || sibling.title || sibling.name)) {
      return sibling.shopifyTitle || sibling.title || sibling.name;
    }
  }

  // Handle "– <Color> Dial" pattern
  if (/[\u2013\u2014-]\s*[^–—\-]+(?:Dial|Edition)?$/i.test(baseName)) {
    const hasDialWord = /Dial/i.test(baseName);
    const suffix = hasDialWord && !/Dial/i.test(variantLabel)
      ? `${variantLabel} Dial`
      : variantLabel;
    return baseName.replace(/[\u2013\u2014-]\s*[^–—\-]+$/i, `– ${suffix}`);
  }

  // Handle "(<Edition>)" pattern
  if (/\([^)]+\)$/.test(baseName)) {
    return baseName.replace(/\([^)]+\)$/, `(${variantLabel})`);
  }

  return `${baseName} – ${variantLabel}`;
}

export function applyShopifyVariant(product, variant, allProducts = []) {
  if (!product || !variant) return product;
  const price = Number.isFinite(variant.price) ? variant.price : product.priceNumeric;
  const compareAtPrice = Number.isFinite(variant.compareAtPrice) ? variant.compareAtPrice : null;
  const variantImages = filterImagesForVariant(product, variant, allProducts);
  const variantImage = (variantImages && variantImages.length > 0)
    ? variantImages[0]
    : (variant.image || product.shopifyFeaturedImage || product.image);

  const updatedName = getVariantDisplayName(product.name || product.title, variant, allProducts);
  const updatedTitle = getVariantDisplayName(product.title || product.name, variant, allProducts);

  return {
    ...product,
    name: updatedName,
    title: updatedTitle,
    sku: variant.sku || product.sku,
    shopifySku: variant.sku || product.shopifySku || product.sku,
    shopifyVariantId: variant.id || product.shopifyVariantId,
    selectedOptions: variant.selectedOptions || [],
    selectedVariantTitle: variant.title || "",
    price: Number.isFinite(price) ? `₹${price.toLocaleString("en-IN")}` : product.price,
    priceNumeric: price,
    mrp: Number.isFinite(compareAtPrice) ? `₹${compareAtPrice.toLocaleString("en-IN")}` : null,
    mrpNumeric: compareAtPrice,
    availableForSale: variant.availableForSale,
    quantityAvailable: variant.quantityAvailable,
    stock: variant.quantityAvailable,
    availability: variant.availableForSale === false ? "Out of Stock" : "In Stock",
    image: variantImage,
    transparentImage: variantImage,
    shopifyVariantImage: variantImage,
    shopifyImages: variantImages,
  };
}

export function hasMeaningfulShopifyOptions(variants = []) {
  return variants.some((variant) => (
    Array.isArray(variant?.selectedOptions) && variant.selectedOptions.some((option) => {
      const name = String(option?.name || "").trim().toLowerCase();
      const value = String(option?.value || "").trim().toLowerCase();
      return Boolean(name && value) && !(name === "title" && value === "default title");
    })
  ));
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
  customerGraphQLEndpoint:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_CUSTOMER_GRAPHQL_ENDPOINT) ||
    "https://shopify.com/88860197048/account/customer/api/2026-07/graphql",
  redirectUri:
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHOPIFY_CUSTOMER_REDIRECT_URI) ||
    "",
};

let _customerDiscoveryPromise = null;

export async function discoverCustomerAccountEndpoints() {
  if (_customerDiscoveryPromise) return _customerDiscoveryPromise;

  _customerDiscoveryPromise = Promise.all([
    fetch(`https://${SHOPIFY_CONFIG.domain}/.well-known/openid-configuration`),
    fetch(`https://${SHOPIFY_CONFIG.domain}/.well-known/customer-account-api`),
  ]).then(async ([openidResponse, customerApiResponse]) => {
    if (!openidResponse.ok || !customerApiResponse.ok) {
      return {
        authEndpoint: SHOPIFY_CUSTOMER_CONFIG.authEndpoint,
        tokenEndpoint: SHOPIFY_CUSTOMER_CONFIG.tokenEndpoint,
        logoutEndpoint: SHOPIFY_CUSTOMER_CONFIG.logoutEndpoint,
        customerGraphQLEndpoint: SHOPIFY_CUSTOMER_CONFIG.customerGraphQLEndpoint,
      };
    }

    const [openid, customerApi] = await Promise.all([
      openidResponse.json(),
      customerApiResponse.json(),
    ]);
    const endpoints = {
      authEndpoint: openid.authorization_endpoint || SHOPIFY_CUSTOMER_CONFIG.authEndpoint,
      tokenEndpoint: openid.token_endpoint || SHOPIFY_CUSTOMER_CONFIG.tokenEndpoint,
      logoutEndpoint: openid.end_session_endpoint || SHOPIFY_CUSTOMER_CONFIG.logoutEndpoint,
      customerGraphQLEndpoint: customerApi.graphql_api || SHOPIFY_CUSTOMER_CONFIG.customerGraphQLEndpoint,
    };

    Object.assign(SHOPIFY_CUSTOMER_CONFIG, endpoints);
    return endpoints;
  }).catch((error) => {
    console.warn("Using default verified Shopify Customer OAuth endpoints:", error?.message || error);
    return {
      authEndpoint: SHOPIFY_CUSTOMER_CONFIG.authEndpoint,
      tokenEndpoint: SHOPIFY_CUSTOMER_CONFIG.tokenEndpoint,
      logoutEndpoint: SHOPIFY_CUSTOMER_CONFIG.logoutEndpoint,
      customerGraphQLEndpoint: SHOPIFY_CUSTOMER_CONFIG.customerGraphQLEndpoint,
    };
  });

  return _customerDiscoveryPromise;
}

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
  const authEndpoint = SHOPIFY_CUSTOMER_CONFIG.authEndpoint || "https://shopify.com/authentication/88860197048/oauth/authorize";
  const redirectUri =
    customRedirectUri ||
    SHOPIFY_CUSTOMER_CONFIG.redirectUri ||
    (typeof window !== "undefined" ? `${window.location.origin}/` : "http://localhost:5173/");

  if (new URL(redirectUri).protocol !== "https:") {
    throw new Error("Shopify Customer Account sign-in requires a registered HTTPS callback URL.");
  }

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

  return `${authEndpoint}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Customer Access Tokens
 */
export async function exchangeCustomerToken({ code, state }) {
  const { tokenEndpoint } = await discoverCustomerAccountEndpoints();
  const savedState = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_oauth_state") : null;
  const codeVerifier = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_code_verifier") : "";
  const redirectUri = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_redirect_uri") : "";

  if (!savedState || !state || savedState !== state) {
    throw new Error("Invalid OAuth state parameter (CSRF detected)");
  }
  if (!codeVerifier || !redirectUri) {
    throw new Error("Missing OAuth PKCE session. Please restart Shopify sign-in.");
  }

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: SHOPIFY_CUSTOMER_CONFIG.clientId,
    redirect_uri: redirectUri || (typeof window !== "undefined" ? window.location.origin : ""),
    code,
    code_verifier: codeVerifier || "",
  });

  const res = await fetch(tokenEndpoint, {
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
    const storedToken = {
      ...tokenData,
      expires_at: Date.now() + (Number(tokenData.expires_in) || 0) * 1000,
    };
    _inMemoryCustomerToken = storedToken;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("shopify_customer_token", JSON.stringify(storedToken));
      sessionStorage.removeItem("shopify_oauth_state");
      sessionStorage.removeItem("shopify_oauth_nonce");
      sessionStorage.removeItem("shopify_code_verifier");
      sessionStorage.removeItem("shopify_redirect_uri");
    }
  }
  return _inMemoryCustomerToken || tokenData;
}

function getStoredCustomerToken() {
  try {
    if (_inMemoryCustomerToken?.access_token) return _inMemoryCustomerToken;
    const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("shopify_customer_token") : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function refreshCustomerToken(refreshToken = "") {
  const currentToken = getStoredCustomerToken();
  const tokenToRefresh = refreshToken || currentToken?.refresh_token;
  if (!tokenToRefresh) return null;

  const { tokenEndpoint } = await discoverCustomerAccountEndpoints();
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: SHOPIFY_CUSTOMER_CONFIG.clientId,
      refresh_token: tokenToRefresh,
    }).toString(),
  });

  if (!res.ok) {
    clearCustomerSession();
    return null;
  }

  const refreshed = await res.json();
  const storedToken = {
    ...currentToken,
    ...refreshed,
    refresh_token: refreshed.refresh_token || tokenToRefresh,
    expires_at: Date.now() + (Number(refreshed.expires_in) || 0) * 1000,
  };
  _inMemoryCustomerToken = storedToken;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("shopify_customer_token", JSON.stringify(storedToken));
  }
  return storedToken;
}

/**
 * Fetch Customer Account Profile & Orders via Customer Account GraphQL API
 */
export async function fetchCustomerProfile(accessToken) {
  let tokenData = getStoredCustomerToken();
  if (!accessToken && tokenData?.expires_at && tokenData.expires_at <= Date.now() + 30_000) {
    tokenData = await refreshCustomerToken(tokenData.refresh_token);
  }
  const token = accessToken || tokenData?.access_token;

  if (!token) return null;

  const { customerGraphQLEndpoint } = await discoverCustomerAccountEndpoints();

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
    const res = await fetch(customerGraphQLEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Customer Account API expects the access token itself, not the
        // Storefront/Admin API "Bearer" authentication scheme.
        Authorization: token,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Shopify Customer Account API error (${res.status})`);
    }
    const json = await res.json();
    if (json?.errors?.length) {
      throw new Error(json.errors.map((error) => error.message).filter(Boolean).join("; ") || "Shopify customer profile query failed");
    }
    return json?.data?.customer || null;
  } catch (err) {
    console.warn("fetchCustomerProfile notice:", err.message);
    return null;
  }
}

/**
 * Get the account route on this headless storefront. Customer profile UI is
 * rendered locally; never send buyers to the legacy Shopify Online Store.
 */
export function getCustomerAccountUrl() {
  const configuredOrigin =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_STOREFRONT_PUBLIC_URL) ||
    (typeof process !== "undefined" && process.env?.VITE_STOREFRONT_PUBLIC_URL) ||
    "";
  const origin = configuredOrigin || (typeof window !== "undefined" ? window.location.origin : "https://www.hanborowatches.in");
  return `${origin.replace(/\/$/, "")}/#account`;
}

/**
 * Build Customer Logout URL
 */
export async function buildCustomerLogoutUrl(postLogoutRedirectUri = "") {
  const { logoutEndpoint } = await discoverCustomerAccountEndpoints();
  const returnTo = postLogoutRedirectUri || (typeof window !== "undefined" ? window.location.origin : "");
  const idToken = getStoredCustomerToken()?.id_token;
  const params = new URLSearchParams({ post_logout_redirect_uri: returnTo });
  if (idToken) params.set("id_token_hint", idToken);
  return `${logoutEndpoint}?${params.toString()}`;
}

export const shopifyService = {
  config: SHOPIFY_CONFIG,
  customerConfig: SHOPIFY_CUSTOMER_CONFIG,
  clearCustomerSession,
  setStoreDomain: setShopifyStoreDomain,
  storefrontQuery,
  createShopifyCart,
  fetchShopifyProducts,
  fetchLiveShopifyData,
  mergeProductsWithShopifyData,
  discoverCustomerAccountEndpoints,
  buildCustomerAuthUrl,
  exchangeCustomerToken,
  refreshCustomerToken,
  fetchCustomerProfile,
  buildCustomerLogoutUrl,
  getCustomerAccountUrl,
};

export default shopifyService;
