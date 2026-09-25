import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

test("Shiprocket Fastrr Checkout: simulated OTP, card capture, and fake orders are not mounted", () => {
  const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");
  const storeContextCode = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");
  assert.equal(appCode.includes("FastrrCheckoutModal"), false, "The simulated checkout modal must not be mounted");
  assert.equal(storeContextCode.includes("isFastrrCheckoutOpen"), false, "Local checkout state must stay retired");
  assert.equal(storeContextCode.includes("generatedOtp"), false, "OTP codes must never be generated in the browser");
});

test("Shiprocket Fastrr Checkout: StoreContext creates a synced Shopify cart and opens its secure checkout", () => {
  const storeContextCode = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");

  assert.ok(storeContextCode.includes("shopifyService.createShopifyCart(target"), "Checkout must create a live Shopify cart");
  assert.ok(storeContextCode.includes("window.location.assign(shopifyCart.checkoutUrl)"), "Checkout must open the provider-managed URL");
  assert.ok(storeContextCode.includes("discountCodes"), "Active Shopify discounts must be forwarded to checkout");
});

test("Shiprocket Fastrr Checkout: #checkout routes into the same real checkout function", () => {
  const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");

  assert.ok(appCode.includes('target.startsWith("checkout")'), "App.jsx must handle checkout route");
  assert.ok(appCode.includes("openCheckout: true"), "Checkout route must flag openCheckout");
});

test("Shiprocket Fastrr Checkout: tracking never fabricates session orders or AWBs", () => {
  const trackOrderCode = fs.readFileSync(path.join(srcDir, "TrackOrderView.jsx"), "utf8");

  assert.equal(trackOrderCode.includes("hanboro_recent_fastrr_order"), false, "Tracking must only use the server-side provider API");
  assert.ok(trackOrderCode.includes("/api/track-order?"), "Tracking must query the server-side provider proxy");
});

test("QA Check: CartDrawer and ProductDetailPage invoke Fastrr Checkout directly", () => {
  const cartDrawerCode = fs.readFileSync(path.join(srcDir, "CartDrawer.jsx"), "utf8");
  const pdpCode = fs.readFileSync(path.join(srcDir, "ProductDetailPage.jsx"), "utf8");

  // Every entry point invokes the shared provider-managed checkout function.
  assert.ok(cartDrawerCode.includes("await openCheckout()"), "Cart drawer button must call openCheckout");
  assert.ok(cartDrawerCode.includes("Proceed to Fastrr Fast Checkout"), "Cart drawer button must show Fastrr branding");

  // PDP Instant Buy Now invokes buyNow(product, buyQty)
  assert.ok(pdpCode.includes("buyNow(product, buyQty)"), "PDP buy now must pass product and buyQty to buyNow");
});
