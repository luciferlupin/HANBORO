import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOPIFY_CONFIG,
  setShopifyStoreDomain,
  getCustomerAccountUrl,
  mergeProductsWithShopifyData,
  parseShopifySpecifications,
  shopifyService,
} from "../src/shopifyClient.js";

test("Shopify specifications: parses live product-description rows into storefront fields", () => {
  const parsed = parseShopifySpecifications(`
    <h3>Specifications</h3>
    <ul>
      <li><strong>Movement:</strong> Citizen 8N24 Automatic</li>
      <li><strong>Power Reserve:</strong> 48 Hours</li>
      <li><strong>Power Reserve System:</strong> Twin-Barrel System</li>
      <li><strong>Case Diameter:</strong> 41mm</li>
      <li><strong>Water Resistance:</strong> 50M (5 ATM)</li>
      <li><strong>Warranty:</strong> 24 Months</li>
    </ul>
  `);

  assert.deepEqual(parsed.specs, {
    movement: "Citizen 8N24 Automatic",
    powerReserve: "48 Hours",
    powerReserveSystem: "Twin-Barrel System",
    caseDimensions: "41mm",
    waterResistance: "50M (5 ATM)",
    warranty: "24 Months",
  });
  assert.equal(parsed.rows.length, 6);
  assert.deepEqual(parsed.rows[3], { label: "Case Diameter", value: "41mm" });
});

test("Shopify specifications: live values override local product specs", () => {
  const liveMap = new Map([["watch-sku", {
    shopifyTitle: "Live Watch",
    shopifySpecifications: { powerReserve: "72 Hours", waterResistance: "100M" },
    shopifySpecificationRows: [
      { label: "Power Reserve", value: "72 Hours" },
      { label: "Water Resistance", value: "100M" },
    ],
  }]]);

  const [merged] = mergeProductsWithShopifyData([{
    id: "watch",
    sku: "WATCH-SKU",
    name: "Local Watch",
    specs: { powerReserve: "42 Hours", movement: "Automatic" },
  }], liveMap);

  assert.equal(merged.specs.powerReserve, "72 Hours");
  assert.equal(merged.specs.waterResistance, "100M");
  assert.equal(merged.specs.movement, "Automatic");
  assert.deepEqual(merged.shopifySpecificationRows, liveMap.get("watch-sku").shopifySpecificationRows);
});

test("Shopify catalogue: newly published products are appended without importing Shopify imagery", () => {
  const newProduct = {
    shopifyId: "gid://shopify/Product/99",
    shopifyVariantId: "gid://shopify/ProductVariant/100",
    shopifyHandle: "new-shopify-watch",
    shopifySku: "HBR-NEW-001",
    shopifyTitle: "New Shopify Watch",
    shopifyDescription: "A newly published watch.",
    shopifyProductType: "Automatic Watches",
    shopifyTags: ["Automatic"],
    shopifyPrice: 25000,
    shopifyComparePrice: 30000,
    shopifyImages: ["https://cdn.shopify.com/example.jpg"],
    shopifySpecifications: { movement: "Automatic" },
    shopifySpecificationRows: [{ label: "Movement", value: "Automatic" }],
    availableForSale: true,
    quantityAvailable: 4,
  };
  const liveMap = new Map();
  liveMap.shopifyProducts = [newProduct];

  const [added] = mergeProductsWithShopifyData([], liveMap);
  assert.equal(added.name, "New Shopify Watch");
  assert.equal(added.sku, "HBR-NEW-001");
  assert.equal(added.price, "₹25,000");
  assert.equal(added.shopifyVariantId, newProduct.shopifyVariantId);
  assert.equal(added._shopifyOnlyProduct, true);
  assert.equal(added.image.startsWith("https://cdn.shopify.com"), false);
});

test("Shopify catalogue: live SKU and model tag control the displayed reference fields", () => {
  const live = {
    shopifyId: "gid://shopify/Product/7",
    shopifyVariantId: "gid://shopify/ProductVariant/8",
    shopifyHandle: "updated-watch",
    shopifySku: "HBR-LIVE-REFERENCE",
    shopifyModelNumber: "LIVE-989",
    shopifyTitle: "Updated Watch",
    shopifySpecifications: {},
    shopifySpecificationRows: [],
  };
  const liveMap = new Map([
    ["old-sku", live],
    [live.shopifyId, live],
  ]);
  liveMap.shopifyProducts = [live];

  const [merged] = mergeProductsWithShopifyData([{ id: "old", sku: "OLD-SKU", name: "Old Watch", specs: {} }], liveMap);
  assert.equal(merged.sku, "HBR-LIVE-REFERENCE");
  assert.equal(merged.modelNumber, "LIVE-989");
});

test("Shopify Config: connects to configured store with env-provided access tokens", () => {
  assert.ok(typeof SHOPIFY_CONFIG.domain === "string", "domain must be a string");
  assert.ok(typeof SHOPIFY_CONFIG.storefrontAccessToken === "string", "storefrontAccessToken must be a string");
  assert.equal(SHOPIFY_CONFIG.apiVersion, "2026-07");
});

test("Shopify Client: setShopifyStoreDomain normalizes domains cleanly", () => {
  setShopifyStoreDomain("https://custom-shop.myshopify.com/");
  assert.equal(SHOPIFY_CONFIG.domain, "custom-shop.myshopify.com");

  setShopifyStoreDomain("0h0fke-ui");
  assert.equal(SHOPIFY_CONFIG.domain, "0h0fke-ui.myshopify.com");
});

test("Headless account route never points to the legacy Shopify Online Store", () => {
  const accountUrl = getCustomerAccountUrl();
  assert.equal(accountUrl, "https://www.hanborowatches.in/#account");
  assert.equal(accountUrl.includes("myshopify.com/account"), false);
});

test("Shopify Storefront Live Connection: verifies GraphQL shop endpoint response", async () => {
  const endpoint = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_CONFIG.storefrontAccessToken,
    },
    body: JSON.stringify({
      query: "{ shop { name primaryDomain { host } paymentSettings { currencyCode } } }",
    }),
  });

  assert.equal(res.status, 200, "Storefront API must return HTTP 200");
  const json = await res.json();
  assert.ok(json.data.shop.name.includes("Hanboro") || json.data.shop.name.length > 0);
  assert.ok(json.data.shop.primaryDomain.host.includes("hanborowatches.in") || json.data.shop.primaryDomain.host.includes("myshopify.com"));
  assert.equal(json.data.shop.paymentSettings.currencyCode, "INR");
});

test("Shopify Cart: refreshes stale variant IDs from the live SKU before checkout", async () => {
  const cart = await shopifyService.createShopifyCart([{
    product: {
      sku: "HBR-989-3-BLACK-AUTO",
      name: "Clover King",
      shopifyVariantId: "gid://shopify/ProductVariant/1",
    },
    quantity: 1,
  }]);

  assert.ok(
    new URL(cart.checkoutUrl).pathname.includes("/checkouts/") ||
    new URL(cart.checkoutUrl).pathname.startsWith("/cart/c/") ||
    new URL(cart.checkoutUrl).host.includes("checkout.shopify.com")
  );
});

test("Shopify Customer Account API: discovers current endpoints and configures OAuth client ID", async () => {
  const { SHOPIFY_CUSTOMER_CONFIG, discoverCustomerAccountEndpoints, buildCustomerAuthUrl, buildCustomerLogoutUrl } = await import("../src/shopifyClient.js");
  
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.clientId, "41118fda-4bc0-40c3-9184-48dd97a9ae40");
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.shopId, "88860197048");
  const endpoints = await discoverCustomerAccountEndpoints();
  assert.ok(endpoints.authEndpoint.endsWith("/oauth/authorize"));
  assert.ok(endpoints.tokenEndpoint.endsWith("/oauth/token"));
  assert.ok(endpoints.logoutEndpoint.endsWith("/logout"));
  assert.ok(endpoints.customerGraphQLEndpoint.includes("/account/customer/api/2026-07/graphql"));

  const authUrl = await buildCustomerAuthUrl("https://www.hanborowatches.in/callback");
  assert.ok(authUrl.startsWith("https://shopify.com/authentication/88860197048/oauth/authorize"));
  assert.ok(authUrl.includes("client_id=41118fda-4bc0-40c3-9184-48dd97a9ae40"));
  assert.ok(authUrl.includes("response_type=code"));
  assert.ok(authUrl.includes("scope=openid+email+customer-account-api%3Afull") || authUrl.includes("customer-account-api"));
  await assert.rejects(
    buildCustomerAuthUrl("http://127.0.0.1:5173/"),
    /registered HTTPS callback URL/,
  );

  const logoutUrl = await buildCustomerLogoutUrl("https://www.hanborowatches.in/");
  assert.equal(logoutUrl, "https://shopify.com/authentication/88860197048/logout?post_logout_redirect_uri=https%3A%2F%2Fwww.hanborowatches.in%2F");
});
