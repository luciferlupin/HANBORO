import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

test("Shiprocket Fastrr Checkout: FastrrCheckoutModal component and styles are installed", () => {
  const modalPath = path.join(srcDir, "FastrrCheckoutModal.jsx");
  const cssPath = path.join(srcDir, "fastrrCheckout.css");

  assert.ok(fs.existsSync(modalPath), "FastrrCheckoutModal.jsx must exist");
  assert.ok(fs.existsSync(cssPath), "fastrrCheckout.css must exist");

  const modalCode = fs.readFileSync(modalPath, "utf8");
  const cssCode = fs.readFileSync(cssPath, "utf8");

  // Step 1: Mobile & Phone
  assert.ok(modalCode.includes("Enter Mobile Number"), "Must have mobile number step");
  assert.ok(modalCode.includes("+91"), "Must format Indian country code +91");

  // Step 2: OTP verification
  assert.ok(modalCode.includes("Verify with OTP"), "Must have OTP verification step");
  assert.ok(modalCode.includes("fastrr-otp-grid"), "Must have 6-digit OTP input grid");

  // Step 3: Delivery address
  assert.ok(modalCode.includes("Delivery Address"), "Must have address collection step");
  assert.ok(modalCode.includes("lookupPincode"), "Must support Indian pincode auto-fill");

  // Step 4: Payment methods
  assert.ok(modalCode.includes("Payment Method"), "Must have payment selection step");
  assert.ok(modalCode.includes("UPI"), "Must support UPI payment");
  assert.ok(modalCode.includes("Credit / Debit Card"), "Must support Card payment");
  assert.ok(modalCode.includes("Cash on Delivery"), "Must support COD");

  // Step 5: Success & Live Shiprocket Tracking
  assert.ok(modalCode.includes("Order Placed Successfully!"), "Must have order confirmation screen");
  assert.ok(modalCode.includes("Shiprocket AWB"), "Must generate Shiprocket AWB reference");
  assert.ok(modalCode.includes("Track Live on Shiprocket"), "Must provide direct track order action");

  // Fastrr styling & branding
  assert.ok(cssCode.includes(".fastrr-modal-backdrop"), "CSS must style backdrop");
  assert.ok(cssCode.includes(".fastrr-logo-badge"), "CSS must style brand badge");
  assert.ok(cssCode.includes("#fa2d1d"), "CSS must include signal red accents");
});

test("Shiprocket Fastrr Checkout: StoreContext opens Fastrr checkout instead of redirecting to Shopify", () => {
  const storeContextCode = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");

  assert.ok(storeContextCode.includes("isFastrrCheckoutOpen"), "StoreContext must expose isFastrrCheckoutOpen");
  assert.ok(storeContextCode.includes("setIsFastrrCheckoutOpen(true)"), "openCheckout/buyNow must open Fastrr checkout modal");
  assert.equal(storeContextCode.includes("window.location.href = sc.checkoutUrl"), false, "Must never redirect to Shopify checkout page");
  assert.equal(storeContextCode.includes("window.location.href = shopifyCart.checkoutUrl"), false, "Must never redirect to Shopify checkout page on buy now");
});

test("Shiprocket Fastrr Checkout: App.jsx mounts modal and routes #checkout", () => {
  const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");

  assert.ok(appCode.includes("<FastrrCheckoutModal"), "App.jsx must render FastrrCheckoutModal");
  assert.ok(appCode.includes('target.startsWith("checkout")'), "App.jsx must handle checkout route");
  assert.ok(appCode.includes("openCheckout: true"), "Checkout route must flag openCheckout");
  assert.ok(appCode.includes("fastrr-modal-container"), "Lenis scroll prevention must support fastrr-modal-container");
});

test("Shiprocket Fastrr Checkout: TrackOrderView recognizes session Fastrr orders", () => {
  const trackOrderCode = fs.readFileSync(path.join(srcDir, "TrackOrderView.jsx"), "utf8");

  assert.ok(trackOrderCode.includes("hanboro_recent_fastrr_order"), "TrackOrderView must check recent Fastrr order session");
});

test("QA Check: ZERO Shopify checkout redirects anywhere in codebase", () => {
  const allFiles = fs.readdirSync(srcDir);
  for (const file of allFiles) {
    if (file.endsWith(".jsx") || file.endsWith(".js")) {
      const code = fs.readFileSync(path.join(srcDir, file), "utf8");
      assert.equal(
        code.includes("window.location.href = sc.checkoutUrl") ||
        code.includes("window.location.href = shopifyCart.checkoutUrl") ||
        code.includes("window.location = shopifyCart") ||
        code.includes("location.href = checkoutUrl"),
        false,
        `File ${file} must never redirect to a Shopify checkout URL`
      );
    }
  }
});

test("QA Check: CartDrawer and ProductDetailPage invoke Fastrr Checkout directly", () => {
  const cartDrawerCode = fs.readFileSync(path.join(srcDir, "CartDrawer.jsx"), "utf8");
  const pdpCode = fs.readFileSync(path.join(srcDir, "ProductDetailPage.jsx"), "utf8");

  // CartDrawer button invokes openCheckout() which opens Fastrr
  assert.ok(cartDrawerCode.includes("await openCheckout()"), "Cart drawer button must call openCheckout");
  assert.ok(cartDrawerCode.includes("Proceed to Fastrr Fast Checkout"), "Cart drawer button must show Fastrr branding");

  // PDP Instant Buy Now invokes buyNow(product, buyQty)
  assert.ok(pdpCode.includes("buyNow(product, buyQty)"), "PDP buy now must pass product and buyQty to buyNow");
});
