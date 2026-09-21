/**
 * generate-shopify-id-map.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches all live Shopify product + variant IDs from the Storefront API and
 * generates src/shopifyIdMap.js — a static map keyed by SKU (handle) so every
 * watch can open a real Shopify checkout without waiting for a runtime sync.
 *
 * Usage: node scripts/generate-shopify-id-map.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT  = path.join(ROOT, "src", "shopifyIdMap.js");

const DOMAIN  = "0h0fke-ui.myshopify.com";
const TOKEN   = "b40181640892b2f191a2cd4b113ca0fd";
const VERSION = "2024-01";

async function fetchAllProducts() {
  const query = `{
    products(first: 250) {
      edges {
        node {
          id
          handle
          title
          variants(first: 1) {
            edges {
              node {
                id
                price { amount }
                availableForSale
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

  if (!res.ok) throw new Error(`Shopify responded ${res.status}`);
  const json = await res.json();
  return json.data.products.edges.map((e) => ({
    handle: e.node.handle,
    title: e.node.title,
    shopifyId: e.node.id,
    shopifyVariantId: e.node.variants.edges[0]?.node.id ?? null,
    shopifyPrice: e.node.variants.edges[0]?.node.price?.amount ?? null,
    availableForSale: e.node.variants.edges[0]?.node.availableForSale ?? true,
  }));
}

async function run() {
  console.log("Fetching live Shopify catalog …");
  const products = await fetchAllProducts();
  console.log(`  → ${products.length} products found in Shopify`);

  // Build a Map keyed by handle (= lowercase SKU)
  const mapEntries = products.map((p) =>
    `  "${p.handle}": ${JSON.stringify(p)}`
  );

  const src = `// AUTO-GENERATED — do not edit by hand
// Run: node scripts/generate-shopify-id-map.mjs
// Last sync: ${new Date().toISOString()}
// Products: ${products.length}

export const SHOPIFY_ID_MAP = {
${mapEntries.join(",\n")}
};

/**
 * Look up Shopify IDs for a local product by SKU.
 * Returns { shopifyId, shopifyVariantId, shopifyPrice, availableForSale }
 * or null if not yet in Shopify.
 */
export function getShopifyIds(sku) {
  if (!sku) return null;
  const key = String(sku).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/, "");
  return SHOPIFY_ID_MAP[key] ?? null;
}
`;

  fs.writeFileSync(OUT, src, "utf8");
  console.log(`  ✓ Written to ${OUT}`);

  // Quick sanity check — count matched products vs PRODUCTS_DATA
  const { PRODUCTS_DATA } = await import("../src/productsData.js");
  const shopifyMapObj = products.reduce((acc, p) => { acc[p.handle] = p; return acc; }, {});
  let matched = 0;
  for (const p of PRODUCTS_DATA) {
    const key = String(p.sku || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/, "");
    if (shopifyMapObj[key]) matched++;
  }
  console.log(`  ✓ ${matched}/${PRODUCTS_DATA.length} HANBORO watches matched to live Shopify IDs`);
}

run().catch((err) => { console.error(err); process.exit(1); });
