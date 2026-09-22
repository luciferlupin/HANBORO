import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

test("Zero Local Database: productsData.js has no STORAGE_KEYS_PRICING and no localStorage writes", async () => {
  const code = fs.readFileSync(path.join(srcDir, "productsData.js"), "utf8");
  assert.equal(code.includes("STORAGE_KEYS_PRICING"), false, "STORAGE_KEYS_PRICING must be deleted");
  assert.equal(code.includes('localStorage.setItem("hanboro_mrp_discount_config"'), false);
  assert.equal(code.includes('localStorage.getItem("hanboro_mrp_discount_config"'), false);

  const { getMrpDiscountConfig, saveMrpDiscountConfig } = await import("../src/productsData.js");
  const cfg = getMrpDiscountConfig();
  assert.equal(typeof cfg.enabled, "boolean");
  assert.equal(typeof cfg.percent, "number");
  const saved = saveMrpDiscountConfig({ enabled: true, percent: 25 });
  assert.equal(saved.percent, 25);
});

test("Zero Local Database: StoreContext.jsx has no ROULETTE_STORAGE_KEY or spin persistence", () => {
  const code = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");
  assert.equal(code.includes("ROULETTE_STORAGE_KEY"), false, "ROULETTE_STORAGE_KEY must be removed");
  assert.equal(code.includes("hanboro:mrp_discount_changed"), false, "Pricing discount event listener must be removed");
  assert.ok(code.includes("obsoleteDatabaseKeys"), "StoreContext must contain the startup legacy database purge list");
  assert.ok(code.includes('"hanboro_roulette_spins"'), "Purge list must clean hanboro_roulette_spins");
  assert.ok(code.includes('"hanboro_collector_reviews"'), "Purge list must clean hanboro_collector_reviews");
  assert.ok(code.includes('"hanboro_local_orders"'), "Purge list must clean hanboro_local_orders");
});

test("Zero Local Database: ContactSection.jsx and TestimonialsSection.jsx do not use localStorage for reviews", () => {
  const contactCode = fs.readFileSync(path.join(srcDir, "ContactSection.jsx"), "utf8");
  assert.equal(contactCode.includes('localStorage.setItem("hanboro_collector_reviews"'), false);
  assert.equal(contactCode.includes('localStorage.getItem("hanboro_collector_reviews"'), false);

  const testimonialsCode = fs.readFileSync(path.join(srcDir, "TestimonialsSection.jsx"), "utf8");
  assert.equal(testimonialsCode.includes('localStorage.getItem("hanboro_collector_reviews"'), false);
});

test("Zero Local Database: App.jsx does not query or write to a local roulette database", () => {
  const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");
  assert.equal(appCode.includes('localStorage.getItem("hanboro_roulette_customer_id")'), false);
  assert.equal(appCode.includes('localStorage.setItem("hanboro_roulette_customer_id"'), false);
  assert.equal(appCode.includes("// Check database to ensure no duplicate spins"), false);
});

test("Shopify Headless Architecture: Shopify handles checkout, live pricing, and cart", async () => {
  const { shopifyService, SHOPIFY_CONFIG } = await import("../src/shopifyClient.js");
  assert.ok(shopifyService, "shopifyService must exist");
  assert.equal(SHOPIFY_CONFIG.domain, "0h0fke-ui.myshopify.com");
  assert.equal(typeof shopifyService.createShopifyCart, "function");
  assert.equal(typeof shopifyService.fetchLiveShopifyData, "function");
  assert.equal(typeof shopifyService.getCustomerAccountUrl, "function");
});

test("Supabase is absent from runtime code and dependencies", () => {
  const packageCode = fs.readFileSync(path.join(rootDir, "package.json"), "utf8");
  const runtimeFiles = fs.readdirSync(srcDir)
    .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
    .map((file) => fs.readFileSync(path.join(srcDir, file), "utf8"))
    .join("\n");

  assert.equal(/@supabase|\bsupabase\b/i.test(packageCode), false);
  assert.equal(/@supabase|\bsupabase\b/i.test(runtimeFiles), false);
});

test("Customer account stays inside the headless storefront", () => {
  const storeContextCode = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");
  const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");
  const accountCode = fs.readFileSync(path.join(srcDir, "AccountView.jsx"), "utf8");
  const shopifyCode = fs.readFileSync(path.join(srcDir, "shopifyClient.js"), "utf8");

  assert.ok(storeContextCode.includes("buildCustomerAuthUrl(callbackUrl)"));
  assert.equal(storeContextCode.includes("window.location.href = shopifyService.getCustomerAccountUrl()"), false);
  assert.ok(appCode.includes('return { view: "account", selectedSkuId: null }'));
  assert.ok(appCode.includes('onShopNow={() => navigateTo("products", "#products")}'));
  assert.ok(accountCode.includes(">Shop now</button>"));
  assert.equal(accountCode.includes("myshopify.com"), false);
  assert.ok(shopifyCode.includes("Authorization: token"), "Customer Account API must receive the raw OAuth access token");
  assert.equal(shopifyCode.includes("Authorization: `Bearer ${token}`"), false);
  assert.ok(shopifyCode.includes('params.set("id_token_hint", idToken)'), "Shopify logout must include the OIDC ID token hint");
  assert.equal(shopifyCode.includes("/cart/${parts.join"), false, "Legacy Online Store cart permalinks must not exist");
  assert.equal(storeContextCode.includes("buildShopifyCheckoutUrl"), false, "Checkout errors must never fall back to the Online Store theme");
  assert.equal(storeContextCode.includes('window.location.href = "https://shopify.com/88860197048/account"'), false, "Sign-in errors must stay inside HANBORO");
});

test("Explicit catalogue price sorting is not overwritten by default catalogue order", () => {
  const productsViewCode = fs.readFileSync(path.join(srcDir, "ProductsView.jsx"), "utf8");
  assert.ok(productsViewCode.includes('if (sortOrder === "PRICE_DESC")'));
  assert.ok(productsViewCode.includes('else if (sortOrder === "PRICE_ASC")'));
  assert.ok(productsViewCode.includes("return list;"));
  assert.equal(productsViewCode.includes("return sortCatalogStably(list);"), false);
});
