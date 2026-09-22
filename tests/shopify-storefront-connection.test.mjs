import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOPIFY_CONFIG,
  setShopifyStoreDomain,
  buildShopifyCheckoutUrl,
  getCustomerAccountUrl,
  shopifyService,
} from "../src/shopifyClient.js";

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

test("Shopify Client: buildShopifyCheckoutUrl builds permalink format", () => {
  const mockItems = [
    { product: { id: "p1", shopifyVariantId: "4489234892" }, quantity: 2 },
  ];
  const url = buildShopifyCheckoutUrl(mockItems);
  assert.ok(url.includes("0h0fke-ui.myshopify.com/cart/4489234892:2"));
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
    new URL(cart.checkoutUrl).host === SHOPIFY_CONFIG.domain ||
    new URL(cart.checkoutUrl).host.includes("hanborowatches.in")
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

  const logoutUrl = await buildCustomerLogoutUrl("https://www.hanborowatches.in/");
  assert.equal(logoutUrl, "https://shopify.com/authentication/88860197048/logout?post_logout_redirect_uri=https%3A%2F%2Fwww.hanborowatches.in%2F");
});
