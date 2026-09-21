import test from "node:test";
import assert from "node:assert/strict";
import { mergeProductsWithShopifyData } from "../src/shopifyClient.js";

test("Shopify product edits replace live commerce fields and preserve curated local media", () => {
  const localProduct = {
    id: "local-1",
    sku: "HBR-TEST-1",
    name: "Old product name",
    description: "Old description",
    price: "₹10,000",
    priceNumeric: 10000,
    mrp: "₹12,000",
    mrpNumeric: 12000,
    image: "/watch-approved.webp",
    gallery: ["/watch-approved.webp", "/watch-approved-detail.webp"],
  };
  const liveMap = new Map([["hbr-test-1", {
    shopifyId: "gid://shopify/Product/1",
    shopifyVariantId: "gid://shopify/ProductVariant/2",
    shopifyHandle: "hbr-test-1",
    shopifyTitle: "Updated in Shopify",
    shopifyDescription: "Updated Shopify description",
    shopifyPrice: 11500,
    shopifyComparePrice: 13500,
    availableForSale: false,
    quantityAvailable: 0,
    shopifyImages: ["https://cdn.shopify.com/unapproved-image.jpg"],
  }]]);

  const [merged] = mergeProductsWithShopifyData([localProduct], liveMap);

  assert.equal(merged.name, "Updated in Shopify");
  assert.equal(merged.description, "Updated Shopify description");
  assert.equal(merged.price, "₹11,500");
  assert.equal(merged.mrp, "₹13,500");
  assert.equal(merged.availableForSale, false);
  assert.equal(merged.quantityAvailable, 0);
  assert.equal(merged.image, "/watch-approved.webp");
  assert.deepEqual(merged.gallery, localProduct.gallery);
  assert.equal(merged._shopifyLiveSynced, true);
});

test("Shopify sync excludes products that are not published in the Storefront API", () => {
  assert.deepEqual(mergeProductsWithShopifyData([{ sku: "UNPUBLISHED" }], new Map()), []);
});
