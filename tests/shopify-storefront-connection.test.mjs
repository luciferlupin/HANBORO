import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOPIFY_CONFIG,
  setShopifyStoreDomain,
  buildShopifyCheckoutUrl,
  shopifyService,
} from "../src/shopifyClient.js";

test("Shopify Config: connects to configured store with env-provided access tokens", () => {
  assert.ok(typeof SHOPIFY_CONFIG.domain === "string", "domain must be a string");
  assert.ok(typeof SHOPIFY_CONFIG.storefrontAccessToken === "string", "storefrontAccessToken must be a string");
  assert.ok(typeof SHOPIFY_CONFIG.adminAccessToken === "string", "adminAccessToken must be a string");
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

test("Shopify Storefront Live Connection: verifies GraphQL shop endpoint response", async () => {
  const endpoint = `https://${SHOPIFY_CONFIG.domain}/api/2024-01/graphql.json`;
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
  assert.ok(json.data?.shop, "Shop data must be present");
  assert.equal(json.data.shop.name, "My Store");
  assert.equal(json.data.shop.primaryDomain.host, "0h0fke-ui.myshopify.com");
  assert.equal(json.data.shop.paymentSettings.currencyCode, "INR");
});

test("Shopify Customer Account API: Configures endpoints and OAuth client ID", async () => {
  const { SHOPIFY_CUSTOMER_CONFIG, buildCustomerAuthUrl, buildCustomerLogoutUrl } = await import("../src/shopifyClient.js");
  
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.clientId, "41118fda-4bc0-40c3-9184-48dd97a9ae40");
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.shopId, "88860197048");
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.authEndpoint, "https://shopify.com/authentication/88860197048/oauth/authorize");
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.tokenEndpoint, "https://shopify.com/authentication/88860197048/oauth/token");
  assert.equal(SHOPIFY_CUSTOMER_CONFIG.logoutEndpoint, "https://shopify.com/authentication/88860197048/logout");

  const authUrl = await buildCustomerAuthUrl("https://hanborowatches.in/callback");
  assert.ok(authUrl.startsWith("https://shopify.com/authentication/88860197048/oauth/authorize"));
  assert.ok(authUrl.includes("client_id=41118fda-4bc0-40c3-9184-48dd97a9ae40"));
  assert.ok(authUrl.includes("response_type=code"));
  assert.ok(authUrl.includes("scope=openid+email+customer-account-api%3Afull") || authUrl.includes("customer-account-api"));

  const logoutUrl = buildCustomerLogoutUrl("https://hanborowatches.in/");
  assert.equal(logoutUrl, "https://shopify.com/authentication/88860197048/logout?post_logout_redirect_uri=https%3A%2F%2Fhanborowatches.in%2F");
});

