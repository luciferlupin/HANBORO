import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const apiDir = path.join(rootDir, "api");

const indexCode = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const storeContextCode = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");
const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");
const trackViewCode = fs.readFileSync(path.join(srcDir, "TrackOrderView.jsx"), "utf8");
const trackingApiCode = fs.readFileSync(path.join(apiDir, "track-order.js"), "utf8");

test("fastrr uses Shiprocket's official Shopify checkout runtime", () => {
  assert.match(indexCode, /https:\/\/fastrr-boost-ui\.pickrr\.com\/assets\/js\/channels\/shopify\.js/);
  assert.match(indexCode, /id="sellerDomain" value="hanborowatches\.in"/);
  assert.ok(storeContextCode.includes("window.shiprocketCheckoutDirectHandler"));
  assert.ok(storeContextCode.includes("fallbackUrl: shopifyCart.checkoutUrl"));
  assert.ok(storeContextCode.includes("shopifyService.createShopifyCart"));
});

test("OTP, address and payment are not reimplemented or exposed locally", () => {
  for (const retiredFile of ["fastrr-otp.js", "fastrr-user.js", "fastrr-order.js"]) {
    assert.equal(fs.existsSync(path.join(apiDir, retiredFile)), false, `${retiredFile} must stay retired`);
  }

  assert.equal(fs.existsSync(path.join(srcDir, "FastrrCheckoutModal.jsx")), false);
  assert.equal(fs.existsSync(path.join(srcDir, "fastrrCheckout.css")), false);
  assert.equal(appCode.includes("FastrrCheckoutModal"), false);
  assert.equal(storeContextCode.includes("/api/fastrr-otp"), false);
  assert.equal(storeContextCode.includes("otpCode"), false);
});

test("checkout passes real Shopify product and variant identity to fastrr", () => {
  assert.ok(storeContextCode.includes("productId: stripShopifyGid(product.shopifyId)"));
  assert.ok(storeContextCode.includes("variantId: stripShopifyGid(product.shopifyVariantId"));
  assert.ok(storeContextCode.includes("couponCode: appliedPromo?.code || null"));
  assert.ok(storeContextCode.includes('type: target.length === 1 ? "product" : "cart"'));
});

test("Buy Now and bag checkout share the authoritative fastrr handoff", () => {
  const cartDrawerCode = fs.readFileSync(path.join(srcDir, "CartDrawer.jsx"), "utf8");
  const pdpCode = fs.readFileSync(path.join(srcDir, "ProductDetailPage.jsx"), "utf8");

  assert.ok(cartDrawerCode.includes("await openCheckout()"));
  assert.ok(cartDrawerCode.includes("Proceed to Fastrr Fast Checkout"));
  assert.ok(pdpCode.includes("buyNow(product, buyQty)"));
  assert.ok(storeContextCode.includes("return openFastrrCheckout([{ product, quantity: qty }])"));
});

test("tracking never invents an order, AWB, courier or shipment activity", () => {
  assert.equal(trackViewCode.includes("hanboro_recent_fastrr_order"), false);
  assert.equal(trackingApiCode.includes("Bluedart Priority"), false);
  assert.equal(trackingApiCode.includes("Math.random"), false);
  assert.equal(trackingApiCode.includes("VITE_FASTRR_PUBLIC_KEY"), false);
  assert.equal(trackingApiCode.includes("FASTRR_PRIVATE_KEY"), false);
  assert.ok(trackingApiCode.includes("process.env.SHIPROCKET_EMAIL"));
  assert.ok(trackingApiCode.includes("process.env.SHIPROCKET_PASSWORD"));
});
