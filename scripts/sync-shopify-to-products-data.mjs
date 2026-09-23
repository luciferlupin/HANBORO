/**
 * sync-shopify-to-products-data.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronizes src/productsData.js directly with the live Shopify Storefront catalog.
 * Shopify is the single authoritative source of truth for:
 * - Product Title & Name
 * - Product Description & Narrative
 * - Product Images & Perspective Gallery (uploaded to Shopify)
 * - Technical Specifications & Compliance Rows
 * - SKU, Model Numbers & Collection Classification (zero tags required)
 * - Pricing & Live Inventory
 *
 * Usage: node scripts/sync-shopify-to-products-data.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PRODUCTS_DATA_PATH = path.join(ROOT, "src", "productsData.js");
const SHOPIFY_ID_MAP_PATH = path.join(ROOT, "src", "shopifyIdMap.js");

const DOMAIN = "0h0fke-ui.myshopify.com";
const TOKEN = "b40181640892b2f191a2cd4b113ca0fd";
const VERSION = "2026-07";

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
  "bezel": "bezel",
  "bezel material": "bezel",
  "bezel type": "bezel",
  "bezel insert": "bezel",
  "crown": "crown",
  "crown type": "crown",
  "winding crown": "crown",
  "hands": "hands",
  "hand finish": "hands",
  "hands finish": "hands",
  "lume": "lume",
  "lume material": "lume",
  "luminous": "lume",
  "luminous material": "lume",
  "luminescence": "lume",
  "super-luminova": "lume",
  "winding": "winding",
  "winding type": "winding",
  "winding system": "winding",
  "date": "dateDisplay",
  "date display": "dateDisplay",
  "date window": "dateDisplay",
  "date complication": "dateDisplay",
  "bracelet": "strap",
  "bracelet material": "strap",
  "bracelet type": "strap",
  "band type": "strap",
  "strap width": "strapWidth",
  "strap length": "strapLength",
  "band width": "strapWidth",
  "weight": "caseWeight",
  "case weight": "caseWeight",
  "net weight": "caseWeight",
  "time zone": "timeZone",
  "gmt": "timeZone",
  "utc offset": "timeZone",
  "water pressure": "waterResistance",
  "atm": "waterResistance",
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

function parseShopifySpecifications(descriptionHtml = "") {
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

function detectShopifyCollection(item = {}) {
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

async function fetchShopifyProducts() {
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
                image {
                  url
                  altText
                }
              }
            }
          }
          images(first: 20) {
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

  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Shopify responded ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join(", "));
  return json.data.products.edges.map(e => e.node);
}

async function run() {
  console.log("Fetching authoritative products from Shopify Storefront API …");
  const rawProducts = await fetchShopifyProducts();
  console.log(`  ✓ Received ${rawProducts.length} products from Shopify.`);

  const idMapEntries = [];
  const productsDataList = [];

  rawProducts.forEach((node, index) => {
    const primaryVariant = node.variants?.edges?.[0]?.node;
    if (!primaryVariant) return;

    const liveImages = (node.images?.edges || []).map(img => img.node.url).filter(Boolean);
    const featuredImageUrl = node.featuredImage?.url || primaryVariant.image?.url || liveImages[0] || "";
    const primaryImage = featuredImageUrl || liveImages[0] || "";
    const allImages = liveImages.length > 0 ? liveImages : (primaryImage ? [primaryImage] : []);

    const parsedSpecs = parseShopifySpecifications(node.descriptionHtml || node.description || "");
    const modelTag = (node.tags || []).find((tag) => /^model[-:\s]/i.test(tag));
    const modelNumber = parsedSpecs.specs.modelNumber || modelTag?.replace(/^model[-:\s]*/i, "").trim() || "";

    const sku = (primaryVariant.sku?.trim() || node.handle.toUpperCase());
    const livePrice = primaryVariant.price?.amount ? Math.round(parseFloat(primaryVariant.price.amount)) : 0;
    const liveComparePrice = primaryVariant.compareAtPrice?.amount ? Math.round(parseFloat(primaryVariant.compareAtPrice.amount)) : null;

    const collectionInfo = detectShopifyCollection({
      shopifyTitle: node.title,
      shopifyProductType: node.productType,
      shopifyDescription: node.description,
      shopifyHandle: node.handle,
      shopifyTags: node.tags,
    });

    const genericTags = new Set(["automatic", "hanboro", "luxury watches", "skeleton"]);
    const productTag = (node.tags || []).find(t => !genericTags.has(t.toLowerCase())) || "HANBORO";

    // Build ID map entry
    idMapEntries.push({
      handle: node.handle,
      title: node.title,
      sku,
      shopifyId: node.id,
      shopifyVariantId: primaryVariant.id,
      shopifyPrice: livePrice,
      availableForSale: primaryVariant.availableForSale ?? true,
      image: primaryImage,
    });

    // Build complete product definition
    const productEntry = {
      id: node.handle,
      sku,
      modelNumber,
      name: node.title,
      title: node.title,
      subtitle: node.description || "",
      summary: node.description || "",
      description: node.description || "",
      collection: collectionInfo.collection,
      collectionName: collectionInfo.collectionName,
      tag: productTag,
      image: primaryImage,
      transparentImage: primaryImage,
      altImages: allImages,
      gallery: allImages.map((imgUrl, i) => ({
        url: imgUrl,
        title: `${node.title} — Perspective 0${i + 1}`,
        label: `0${i + 1} View`,
        caption: `Official boutique presentation of ${node.title} (Reference ${sku}).`
      })),
      price: `₹${livePrice.toLocaleString("en-IN")}`,
      priceNumeric: livePrice,
      mrp: liveComparePrice !== null ? `₹${liveComparePrice.toLocaleString("en-IN")}` : null,
      mrpNumeric: liveComparePrice,
      stock: primaryVariant.quantityAvailable ?? null,
      availability: primaryVariant.availableForSale === false ? "Out of Stock" : "In Stock",
      availableForSale: primaryVariant.availableForSale ?? true,
      quantityAvailable: primaryVariant.quantityAvailable ?? null,
      specs: parsedSpecs.specs,
      shopifySpecificationRows: parsedSpecs.rows,
      shopifyId: node.id,
      shopifyVariantId: primaryVariant.id,
      shopifyHandle: node.handle,
      shopifyFeaturedImage: featuredImageUrl,
      shopifyImages: allImages,
      catalogOrder: index + 1,
      _shopifyLiveSynced: true,
    };

    productsDataList.push(productEntry);
  });

  // Generate src/shopifyIdMap.js
  const mapContent = `// AUTO-GENERATED — do not edit by hand
// Run: node scripts/sync-shopify-to-products-data.mjs
// Last sync: ${new Date().toISOString()}
// Products: ${idMapEntries.length}

export const SHOPIFY_ID_MAP = {
${idMapEntries.map(p => `  "${p.handle}": ${JSON.stringify(p)}`).join(",\n")}
};

export function getShopifyIds(sku) {
  if (!sku) return null;
  const rawKey = String(sku).toLowerCase().trim();
  const sanitizedKey = rawKey.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return SHOPIFY_ID_MAP[sanitizedKey] || SHOPIFY_ID_MAP[rawKey] || null;
}
`;
  fs.writeFileSync(SHOPIFY_ID_MAP_PATH, mapContent, "utf8");
  console.log(`  ✓ Updated ${SHOPIFY_ID_MAP_PATH} (${idMapEntries.length} entries).`);

  // Generate src/productsData.js
  const productsDataContent = `// ══════════════════════════════════════════════════════════════════════════════
// HANBORO OFFICIAL MASTER PRODUCTS & SKU CATALOG
// Authoritatively Synchronized with Live Shopify Storefront API
// Every timepiece reflects its exact Shopify uploaded media, title, description & specs
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: "ALL", label: "All Timepieces" },
  { id: "TOURBILLON", label: "Tourbillon & Complications" },
  { id: "TONNEAU", label: "Tonneau Skeleton" },
  { id: "ROULETTE", label: "Casino & Roulette" },
  { id: "OCTAGONAL", label: "Royal Octagonal" },
  { id: "DIVER_SPORT", label: "Diver & Sport Chrono" },
  { id: "CLASSIC", label: "Classic & Moonphase" },
];

export function getHighResWatchImage(src) {
  if (!src || typeof src !== "string") return "/watch-astroworld-moon-rosegold-front-transparent.webp";
  return src;
}

const RAW_PRODUCTS_DATA = ${JSON.stringify(productsDataList, null, 2)};

export const PRODUCTS_DATA = RAW_PRODUCTS_DATA.map((p, idx) => ({
  ...p,
  catalogOrder: idx + 1,
}));

export function getProductAvailability(product) {
  if (!product) return { isAvailable: false, isSoldOut: true, isLowStock: false, quantityAvailable: 0 };
  const isAvailable = product.availableForSale !== false && (product.quantityAvailable === null || product.quantityAvailable > 0);
  const isSoldOut = !isAvailable;
  const isLowStock = isAvailable && product.quantityAvailable !== null && product.quantityAvailable <= 3 && product.quantityAvailable > 0;
  return {
    isAvailable,
    isSoldOut,
    isLowStock,
    quantityAvailable: product.quantityAvailable,
    isLiveSynced: Boolean(product._shopifyLiveSynced),
  };
}

export function getMrpDiscountConfig() {
  return { percent: 20, enabled: true, defaultDiscountPercent: 20 };
}

export function saveMrpDiscountConfig(config) {
  return config;
}

export function getWatchPricing(watch, customConfig = null) {
  if (!watch) {
    return {
      price: "₹0",
      priceNumeric: 0,
      mrp: null,
      mrpNumeric: 0,
      hasDiscount: false,
      discountPercent: 0,
      savings: 0,
      savingsFormatted: "₹0",
    };
  }

  const priceStr = watch.price || "₹0";
  const priceNum = Number.isFinite(watch.priceNumeric) ? watch.priceNumeric : parseInt(String(priceStr).replace(/[^\\d]/g, ""), 10) || 0;
  const mrpStr = watch.mrp;
  const mrpNum = Number.isFinite(watch.mrpNumeric) ? watch.mrpNumeric : (mrpStr ? parseInt(String(mrpStr).replace(/[^\\d]/g, ""), 10) : null);

  if (mrpNum && mrpNum > priceNum && priceNum > 0) {
    const savings = mrpNum - priceNum;
    const discountPercent = Math.round((savings / mrpNum) * 100);
    return {
      price: priceStr,
      priceNumeric: priceNum,
      mrp: mrpStr || \`₹\${mrpNum.toLocaleString("en-IN")}\`,
      mrpNumeric: mrpNum,
      hasDiscount: true,
      discountPercent,
      savings,
      savingsFormatted: \`₹\${savings.toLocaleString("en-IN")}\`,
    };
  }

  return {
    price: priceStr,
    priceNumeric: priceNum,
    mrp: null,
    mrpNumeric: mrpNum || priceNum,
    hasDiscount: false,
    discountPercent: 0,
    savings: 0,
    savingsFormatted: "₹0",
  };
}

export function getWatchModelKey(watch) {
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
      if (parts.length >= 3 && /^\\d+$/.test(parts[2])) {
        return \`\${parts[1]}-\${parts[2]}\`;
      }
      return parts[1];
    }
  }

  return String(watch.id || watch.sku || "").trim();
}

export function getWatchVariantLabel(watch) {
  if (!watch) return "Standard Edition";
  if (watch.color && typeof watch.color === "string") return watch.color;
  if (watch.edition && typeof watch.edition === "string") return watch.edition;
  if (watch.variantName && typeof watch.variantName === "string") return watch.variantName;

  const parenMatch = String(watch.name || "").match(/\\(([^)]+)\\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = parenMatch[1].trim();
    if (/edition|color|gold|steel|black|blue|green|red|silver|white|dial|strap|starfield|design/i.test(inside)) {
      return inside.replace(/ Edition$/i, "").replace(/ Design$/i, "").trim();
    }
  }

  const targetText = \`\${watch.sku || ""} \${watch.name || ""} \${watch.subtitle || ""}\`.toUpperCase();
  if (targetText.includes("STEEL-BLUE") || targetText.includes("STEEL BLUE") || targetText.includes("ICE BLUE")) return "Steel Blue";
  if (targetText.includes("ROSE GOLD & SADDLE BROWN") || targetText.includes("R.GOLD-BROWN")) return "Rose Gold & Brown";
  if (targetText.includes("ROSE GOLD & SILVER") || targetText.includes("R.GOLD-SILVER")) return "Rose Gold & Silver";
  if (targetText.includes("ROSE GOLD") || targetText.includes("ROSEGOLD") || targetText.includes("R.GOLD")) return "Rose Gold";
  if (targetText.includes("ROYAL GOLD") || targetText.includes("YELLOW GOLD") || targetText.includes("GOLD") || targetText.includes("GLD")) return "Royal Gold";
  if (targetText.includes("SILVER STARFIELD") || targetText.includes("ORBITA-S")) return "Silver Starfield";
  if (targetText.includes("SILVER") || targetText.includes("SLV") || targetText.includes("STEEL")) return "Sculpted Steel";
  if (targetText.includes("EMERALD") || targetText.includes("GREEN")) return "Emerald Green";
  if (targetText.includes("SUNSET ORANGE") || targetText.includes("ORANGE") || targetText.includes("AMBER")) return "Sunset Orange";
  if (targetText.includes("PURE WHITE") || targetText.includes("WHITE") || targetText.includes("FROST")) return "Pure White";
  if (targetText.includes("OCEAN BLUE") || targetText.includes("BLUE")) return "Ocean Blue";
  if (targetText.includes("CRIMSON") || targetText.includes("RED")) return "Crimson Red";
  if (targetText.includes("MIDNIGHT") || targetText.includes("BLACK") || targetText.includes("BLK") || targetText.includes("DLC") || targetText.includes("ONYX")) return "Midnight Black";
  if (targetText.includes("CARBON") || targetText.includes("FORGED")) return "Forged Carbon";

  return watch.name?.split("–")[1]?.trim() || watch.name || "Default Edition";
}
`;

  fs.writeFileSync(PRODUCTS_DATA_PATH, productsDataContent, "utf8");
  console.log(`  ✓ Updated ${PRODUCTS_DATA_PATH} with ${productsDataList.length} authoritative Shopify products.`);
}

run().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
