import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

test("Meta Pixel: Dataset ID is configured as 1069596304671544 across codebase", async (t) => {
  const metaPixelModule = await import("../src/metaPixel.js");
  assert.equal(metaPixelModule.META_DATASET_ID, "1069596304671544");

  const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  assert.ok(
    indexHtml.includes("1069596304671544"),
    "index.html must include Meta Dataset ID 1069596304671544 in base script"
  );
  assert.ok(
    indexHtml.includes("https://www.facebook.com/tr?id=1069596304671544&ev=PageView&noscript=1"),
    "index.html must include noscript pixel tracking fallback"
  );
  assert.ok(
    indexHtml.includes("connect.facebook.net/en_US/fbevents.js"),
    "index.html must load the official fbevents.js script"
  );
});

test("Meta Pixel: safeFbq and event dispatch operate reliably in all environments", async (t) => {
  const { metaPixelService, META_DATASET_ID } = await import("../src/metaPixel.js");

  // Mock global window & custom event dispatcher for node environment
  const calls = [];
  const events = [];

  globalThis.window = {
    fbq: (...args) => calls.push(args),
    dispatchEvent: (evt) => events.push(evt),
  };

  globalThis.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  metaPixelService.clearHistory();

  // Test 1: PageView
  metaPixelService.trackPageView("atelier-catalog");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "track");
  assert.equal(calls[0][1], "PageView");
  assert.equal(calls[0][2].page_path, "atelier-catalog");

  // Test 2: ViewContent
  const sampleWatch = {
    id: "hbr-3001-rose",
    sku: "HBR-3001-RG",
    name: "Hanboro Skeleton Automatique Rose Gold",
    price: "₹38,500",
    category: "Skeleton Automatic",
  };
  metaPixelService.trackViewContent(sampleWatch);
  assert.equal(calls.length, 2);
  assert.equal(calls[1][1], "ViewContent");
  assert.equal(calls[1][2].content_name, "Hanboro Skeleton Automatique Rose Gold");
  assert.equal(calls[1][2].content_type, "product");
  assert.equal(calls[1][2].value, 38500);
  assert.equal(calls[1][2].currency, "INR");
  assert.deepEqual(calls[1][2].content_ids, ["HBR-3001-RG"]);

  // Test 3: AddToCart
  metaPixelService.trackAddToCart(sampleWatch, 2);
  assert.equal(calls.length, 3);
  assert.equal(calls[2][1], "AddToCart");
  assert.equal(calls[2][2].value, 77000);
  assert.equal(calls[2][2].currency, "INR");

  // Test 4: Contact & Lead
  metaPixelService.trackContact({ method: "WhatsApp", sku: "HBR-3001-RG" });
  metaPixelService.trackLead({ content_name: "VIP Allocation", value: 38500 });
  assert.equal(calls.length, 5);
  assert.equal(calls[3][1], "Contact");
  assert.equal(calls[4][1], "Lead");

  // Verify history retention (latest first)
  const history = metaPixelService.getEventHistory();
  assert.equal(history.length, 5);
  assert.equal(history[0].eventName, "Lead");
  assert.equal(history[history.length - 1].eventName, "PageView");

  // Test 5: Resilient behavior when window.fbq is missing (e.g. ad-blocker)
  delete globalThis.window.fbq;
  assert.doesNotThrow(() => {
    metaPixelService.trackPageView("adblock-test");
  }, "Ad-blocker absence of window.fbq must never crash the application");

  // Cleanup
  delete globalThis.window;
  delete globalThis.CustomEvent;
});

test("Meta Pixel: StoreContext wires Dataset ID correctly", async () => {
  const storeContextCode = fs.readFileSync(path.join(rootDir, "src", "StoreContext.jsx"), "utf8");
  assert.ok(
    storeContextCode.includes('import { metaPixelService } from "./metaPixel"'),
    "StoreContext.jsx must import metaPixelService"
  );
  assert.ok(
    storeContextCode.includes("metaPixelService.trackAddToCart"),
    "StoreContext.jsx must track AddToCart"
  );
  assert.ok(!storeContextCode.includes("trackInitiateCheckout"), "Retired checkout tracking must stay removed");
  assert.ok(!storeContextCode.includes("trackPurchase"), "Purchase tracking waits for the Shopify integration");
});
