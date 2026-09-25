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

test("Shiprocket Fastrr Checkout: FastrrCheckoutModal component and styles are installed", () => {
  const modalPath = path.join(srcDir, "FastrrCheckoutModal.jsx");
  const cssPath = path.join(srcDir, "fastrrCheckout.css");

  assert.ok(fs.existsSync(modalPath), "FastrrCheckoutModal.jsx must exist");
  assert.ok(fs.existsSync(cssPath), "fastrrCheckout.css must exist");

  const modalCode = fs.readFileSync(modalPath, "utf8");
  const cssCode = fs.readFileSync(cssPath, "utf8");

  // Real OTP flow & verification
  assert.ok(modalCode.includes("/api/fastrr-otp"), "Must query real server-side OTP API endpoint");
  assert.ok(modalCode.includes("handleSendOtp"), "Must handle dispatching real OTP");
  assert.ok(modalCode.includes("handleVerifyOtp"), "Must handle verifying real OTP");
  assert.equal(modalCode.includes('setGeneratedOtp("123456")'), false, "Must never hardcode fake OTP in the browser");

  // Precision card alignment & structure
  assert.ok(cssCode.includes(".fastrr-modal-backdrop"), "CSS must style backdrop");
  assert.ok(cssCode.includes(".fastrr-modal-container"), "CSS must style container");
  assert.ok(cssCode.includes("margin: auto"), "Modal must be centered with automatic margins");
  assert.ok(cssCode.includes("display: grid"), "Modal body must use balanced grid layout");
  assert.ok(cssCode.includes(".fastrr-otp-grid"), "CSS must align 6-digit OTP input grid");
});

test("Shiprocket Fastrr Checkout: Real OTP and Order API handlers exist", () => {
  const otpApiPath = path.join(apiDir, "fastrr-otp.js");
  const orderApiPath = path.join(apiDir, "fastrr-order.js");

  assert.ok(fs.existsSync(otpApiPath), "api/fastrr-otp.js must exist for live SMS dispatch and verification");
  assert.ok(fs.existsSync(orderApiPath), "api/fastrr-order.js must exist for Shiprocket order sync");

  const otpCode = fs.readFileSync(otpApiPath, "utf8");
  assert.ok(otpCode.includes("cleanedPhone"), "Must sanitize Indian phone number");
  assert.ok(otpCode.includes("action === \"send\""), "Must support send OTP action");
  assert.ok(otpCode.includes("action === \"verify\""), "Must support verify OTP action");
});

test("Shiprocket Fastrr Checkout: StoreContext manages Fastrr modal and active items", () => {
  const storeContextCode = fs.readFileSync(path.join(srcDir, "StoreContext.jsx"), "utf8");

  assert.ok(storeContextCode.includes("isFastrrCheckoutOpen"), "StoreContext must expose isFastrrCheckoutOpen state");
  assert.ok(storeContextCode.includes("setIsFastrrCheckoutOpen"), "StoreContext must expose setIsFastrrCheckoutOpen");
  assert.ok(storeContextCode.includes("fastrrCheckoutItems"), "StoreContext must expose fastrrCheckoutItems");
  assert.ok(storeContextCode.includes("openFastrrCheckout"), "StoreContext must expose openFastrrCheckout");
});

test("Shiprocket Fastrr Checkout: App.jsx mounts modal and routes #checkout", () => {
  const appCode = fs.readFileSync(path.join(srcDir, "App.jsx"), "utf8");

  assert.ok(appCode.includes("<FastrrCheckoutModal"), "App.jsx must render FastrrCheckoutModal");
  assert.ok(appCode.includes('target.startsWith("checkout")'), "App.jsx must handle checkout route");
  assert.ok(appCode.includes("openCheckout: true"), "Checkout route must flag openCheckout");
  assert.ok(appCode.includes("fastrr-modal-container"), "Scroll prevention must recognize Fastrr modal");
});

test("QA Check: CartDrawer and ProductDetailPage invoke Fastrr Checkout directly", () => {
  const cartDrawerCode = fs.readFileSync(path.join(srcDir, "CartDrawer.jsx"), "utf8");
  const pdpCode = fs.readFileSync(path.join(srcDir, "ProductDetailPage.jsx"), "utf8");

  assert.ok(cartDrawerCode.includes("await openCheckout()"), "Cart drawer button must call openCheckout");
  assert.ok(cartDrawerCode.includes("Proceed to Fastrr Fast Checkout"), "Cart drawer button must show Fastrr branding");

  // PDP Instant Buy Now invokes buyNow(product, buyQty)
  assert.ok(pdpCode.includes("buyNow(product, buyQty)"), "PDP buy now must pass product and buyQty to buyNow");
});
