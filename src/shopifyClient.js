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
      const handle = String(product.shopifyHandle || "").trim();
      const live =
        (sku ? liveMap.get(sku.toLowerCase()) || liveMap.get(sku) : null) ||
        (handle ? liveMap.get(handle.toLowerCase()) || liveMap.get(handle) : null) ||
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
  const itemNotes = resolvedItems
    .filter((it) => it?.product)
    .map((it, idx) => {
      const p = it.product;
      const sku = p.sku ? ` [REF: ${p.sku}]` : "";
      const price = p.price || "";
      return `Watch ${idx + 1}: ${p.name || "HANBORO Timepiece"}${sku} (${price}) × ${it.quantity || 1}`;
    });

  const orderNote = options.note || itemNotes.join("\n");

  const attributes = [
    ...resolvedItems.slice(0, 10).map((it, idx) => ({
      key: `Watch_${idx + 1}`,
      value: `${it.product?.name || "Watch"} (SKU: ${it.product?.sku || "N/A"}) Qty: ${it.quantity || 1}`,
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
};

function decodeShopifyHtml(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse the Specifications list authored in Shopify's product description.
 * Supports two formats:
 *   1. <li><strong>Label:</strong> Value</li>  (preferred list format)
 *   2. <p><strong>Label:</strong> Value</p>      (paragraph format)
 * Shopify is authoritative for these values; local specs remain a fallback.
 */
export function parseShopifySpecifications(descriptionHtml = "") {
  const specs = {};
  const rows = [];
  const seen = new Set();

  function processMatch(rawLabel, rawValue) {
    const label = decodeShopifyHtml(rawLabel).replace(/:\s*$/, "").trim();
    const value = decodeShopifyHtml(rawValue).replace(/^:\s*/, "").trim();
    if (!label || !value) return;
    // Deduplicate by label (first occurrence wins)
    if (seen.has(label.toLowerCase())) return;
    seen.add(label.toLowerCase());
    rows.push({ label, value });
    const canonicalKey = SHOPIFY_SPEC_KEY_ALIASES[label.toLowerCase()];
    if (canonicalKey) specs[canonicalKey] = value;
  }

  // Format 1: <li><strong>Label:</strong> Value</li>
  const listItemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = listItemPattern.exec(descriptionHtml)) !== null) {
    const strongMatch = match[1].match(/<strong\b[^>]*>([\s\S]*?)<\/strong>([\s\S]*)/i);
    if (!strongMatch) continue;
    processMatch(strongMatch[1], strongMatch[2]);
  }

  // Format 2: <p><strong>Label:</strong> Value</p> — only if list format found nothing
  if (rows.length === 0) {
    const paraPattern = /<p[^>]*>\s*<strong\b[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/gi;
    while ((match = paraPattern.exec(descriptionHtml)) !== null) {
      processMatch(match[1], match[2]);
    }
  }

  // Format 3: Inline "Label: Value." sentences at end of plain-text paragraphs
  // e.g. "...Case Diameter: 40mm. Case Thickness: 9mm. Movement: Automatic."
  // Only activates if no structured specs were found above.
  if (rows.length === 0) {
    const plainText = decodeShopifyHtml(descriptionHtml);
    // Find all "Word(s): Value." or "Word(s): Value," patterns
    const knownLabels = Object.keys(SHOPIFY_SPEC_KEY_ALIASES);
    // Build a pattern that matches "Known Label: value until next period/end"
    const inlinePattern = /([A-Za-z][A-Za-z\s\-]{2,30}?):\s*([^.]+?)(?:\.|$)/g;
    while ((match = inlinePattern.exec(plainText)) !== null) {
      const label = match[1].trim();
      const value = match[2].trim();
      if (!label || !value || value.length > 200) continue;
      // Only extract if label matches a known alias (to avoid false positives in prose)
      if (knownLabels.includes(label.toLowerCase())) {
        processMatch(label, value);
      }
    }
  }

  return { specs, rows };
}

/**
 * ── LIVE SHOPIFY DATA LAYER ──────────────────────────────────────────────────
 * Fetches live product copy, pricing, availability, inventory, identifiers,
 * and media metadata from Shopify in a single GraphQL query (250 max). The
 * storefront merge intentionally keeps the approved local product imagery.
 *
 * Returns a Map keyed by Shopify handle, product ID, variant ID, and SKU.
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
          descriptionHtml
          vendor
          productType
          tags
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

      const liveImages = (node.images?.edges || []).map(img => img.node.url).filter(Boolean);
      const parsedSpecifications = parseShopifySpecifications(node.descriptionHtml || "");
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
        shopifyImages: liveImages,
      };

      // Key by handle (lowercase and exact) as well as Shopify product GID
      liveMap.set(node.handle.toLowerCase(), baseInfo);
      liveMap.set(node.handle, baseInfo);
      if (node.id) liveMap.set(node.id, baseInfo);

      // Key by every variant SKU and variant ID
      for (const vEdge of (node.variants?.edges || [])) {
        const v = vEdge.node;
        const variantInfo = {
          ...baseInfo,
          shopifySku: v?.sku?.trim() || baseInfo.shopifySku,
          shopifyVariantId: v?.id || baseInfo.shopifyVariantId,
          shopifyPrice: v?.price?.amount ? Math.round(parseFloat(v.price.amount)) : baseInfo.shopifyPrice,
          shopifyComparePrice: v?.compareAtPrice?.amount ? Math.round(parseFloat(v.compareAtPrice.amount)) : baseInfo.shopifyComparePrice,
          availableForSale: v?.availableForSale ?? baseInfo.availableForSale,
          quantityAvailable: v?.quantityAvailable ?? baseInfo.quantityAvailable,
        };
        if (v?.id) liveMap.set(v.id, variantInfo);
        if (v?.sku) {
          const skuKey = v.sku.trim().toLowerCase();
          liveMap.set(skuKey, variantInfo);
          liveMap.set(v.sku.trim(), variantInfo);
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
    return liveMap;
  } catch (err) {
    console.warn("fetchLiveShopifyData note:", err.message);
    return new Map();
  }
}

/**
 * Merge Shopify's live commerce fields into the editorial catalogue.
 *
 * Product photography deliberately remains local: the storefront's approved
 * imagery is curated in PRODUCTS_DATA, while Shopify is authoritative for
 * product copy, price, availability, inventory, and checkout identifiers.
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
    const live =
      liveMap.get(handle.toLowerCase()) ||
      liveMap.get(handle) ||
      (sku ? liveMap.get(sku.toLowerCase()) || liveMap.get(sku) : null) ||
      (id ? liveMap.get(id.toLowerCase()) || liveMap.get(id) : null) ||
      (product.shopifyId ? liveMap.get(product.shopifyId) : null) ||
      (product.shopifyVariantId ? liveMap.get(product.shopifyVariantId) : null);

    // Shopify is the source of truth for which products are published.
    if (!live) return [];
    if (live.shopifyId) matchedShopifyProductIds.add(live.shopifyId);

    const livePrice = Number.isFinite(live.shopifyPrice) ? live.shopifyPrice : null;
    const liveComparePrice = Number.isFinite(live.shopifyComparePrice)
      ? live.shopifyComparePrice
      : null;

    return [{
      ...product,
      name: live.shopifyTitle || product.name,
      title: live.shopifyTitle || product.title || product.name,
      sku: live.shopifySku || product.sku,
      modelNumber: live.shopifyModelNumber || product.modelNumber,
      description: live.shopifyDescription || product.description,
      specs: {
        ...(product.specs || {}),
        ...(live.shopifySpecifications || {}),
      },
      shopifySpecificationRows: live.shopifySpecificationRows || [],
      price: livePrice !== null ? `₹${livePrice.toLocaleString("en-IN")}` : product.price,
      priceNumeric: livePrice ?? product.priceNumeric,
      mrp: liveComparePrice !== null
        ? `₹${liveComparePrice.toLocaleString("en-IN")}`
        : product.mrp,
      mrpNumeric: liveComparePrice ?? product.mrpNumeric,
      availableForSale: live.availableForSale,
      quantityAvailable: live.quantityAvailable,
      shopifyId: live.shopifyId || product.shopifyId,
      shopifyVariantId: live.shopifyVariantId || product.shopifyVariantId,
      shopifyHandle: live.shopifyHandle || product.shopifyHandle || handle,
      _shopifyLiveSynced: true,
    }];
  });

  const COLLECTION_TAG_MAP = {
    "tourbillon": "TOURBILLON",
    "skeleton": "TONNEAU",
    "tonneau": "TONNEAU",
    "roulette": "ROULETTE",
    "casino": "ROULETTE",
    "octagonal": "OCTAGONAL",
    "royal octagonal": "OCTAGONAL",
    "diver": "DIVER_SPORT",
    "chronograph": "DIVER_SPORT",
    "sport": "DIVER_SPORT",
    "classic": "CLASSIC",
    "moonphase": "CLASSIC",
    "moon phase": "CLASSIC",
  };

  const shopifyOnlyProducts = (liveMap.shopifyProducts || [])
    .filter((live) => live?.shopifyId && !matchedShopifyProductIds.has(live.shopifyId))
    .map((live, index) => {
      const fallbackSku = live.shopifySku || String(live.shopifyHandle || `shopify-${index + 1}`).toUpperCase();
      const livePrice = Number.isFinite(live.shopifyPrice) ? live.shopifyPrice : 0;
      const liveComparePrice = Number.isFinite(live.shopifyComparePrice) ? live.shopifyComparePrice : null;

      // Smart collection detection: scan tags and productType for known collection identifiers
      const allTagsLower = [
        ...(live.shopifyTags || []),
        live.shopifyProductType || "",
        live.shopifyTitle || "",
      ].map(s => s.toLowerCase());
      let collection = "CLASSIC";
      let collectionName = live.shopifyProductType || "Classic & Moonphase";
      for (const [keyword, collId] of Object.entries(COLLECTION_TAG_MAP)) {
        if (allTagsLower.some(t => t.includes(keyword))) {
          collection = collId;
          // Human-readable collection name
          collectionName = {
            TOURBILLON: "Tourbillon & Complications",
            TONNEAU: "Tonneau Skeleton",
            ROULETTE: "Casino & Roulette",
            OCTAGONAL: "Royal Octagonal",
            DIVER_SPORT: "Diver & Sport Chrono",
            CLASSIC: "Classic & Moonphase",
          }[collId] || live.shopifyProductType || "HANBORO Collection";
          break;
        }
      }
      if (live.shopifyProductType && collection === "CLASSIC") {
        collectionName = live.shopifyProductType;
      }

      // Pick the most informative tag for the product tag badge (skip generic ones)
      const genericTags = new Set(["automatic", "hanboro", "luxury watches", "skeleton"]);
      const productTag = (live.shopifyTags || []).find(t => !genericTags.has(t.toLowerCase())) || "HANBORO";

      return {
        id: live.shopifyHandle || live.shopifyId,
        sku: fallbackSku,
        modelNumber: live.shopifyModelNumber || live.shopifySpecifications?.modelNumber || "",
        name: live.shopifyTitle || "HANBORO Timepiece",
        title: live.shopifyTitle || "HANBORO Timepiece",
        subtitle: live.shopifyDescription || "",
        summary: live.shopifyDescription || "",
        description: live.shopifyDescription || "",
        collection,
        collectionName,
        tag: productTag,
        image: "/watch-architectural-skeleton-black-front-transparent.webp",
        transparentImage: "/watch-architectural-skeleton-black-front-transparent.webp",
        altImages: ["/watch-architectural-skeleton-black-front-transparent.webp"],
        gallery: [],
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
        catalogOrder: Number.MAX_SAFE_INTEGER - 1000 + index,
        _shopifyLiveSynced: true,
        _shopifyOnlyProduct: true,
      };
    });

  return [...mergedLocalProducts, ...shopifyOnlyProducts];
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
