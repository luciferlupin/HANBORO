import test from "node:test";
import assert from "node:assert/strict";
import { applyShopifyVariant, mergeProductsWithShopifyData } from "../src/shopifyClient.js";

test("Shopify product edits authoritatively update live images, title, description, and pricing", () => {
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
    shopifyFeaturedImage: "https://cdn.shopify.com/newly-uploaded-watch.jpg",
    shopifyImages: ["https://cdn.shopify.com/newly-uploaded-watch.jpg"],
  }]]);

  const [merged] = mergeProductsWithShopifyData([localProduct], liveMap);

  assert.equal(merged.name, "Updated in Shopify");
  assert.equal(merged.description, "Updated Shopify description");
  assert.equal(merged.price, "₹11,500");
  assert.equal(merged.mrp, "₹13,500");
  assert.equal(merged.availableForSale, false);
  assert.equal(merged.quantityAvailable, 0);
  assert.equal(merged.image, "https://cdn.shopify.com/newly-uploaded-watch.jpg");
  assert.equal(merged.gallery[0].url, "https://cdn.shopify.com/newly-uploaded-watch.jpg");
  assert.equal(merged._shopifyLiveSynced, true);
});

test("Shopify sync excludes products that are not published in the Storefront API", () => {
  assert.deepEqual(mergeProductsWithShopifyData([{ sku: "UNPUBLISHED" }], new Map()), []);
});

test("Shopify variant selection updates checkout identity, SKU, price, image, and availability", () => {
  const product = {
    id: "watch-1",
    sku: "WATCH-SILVER",
    shopifyVariantId: "gid://shopify/ProductVariant/1",
    price: "₹54,999",
    priceNumeric: 54999,
    image: "https://cdn.shopify.com/silver.jpg",
    shopifyImages: ["https://cdn.shopify.com/silver.jpg", "https://cdn.shopify.com/detail.jpg"],
  };
  const black = {
    id: "gid://shopify/ProductVariant/2",
    sku: "WATCH-BLACK",
    title: "Black",
    selectedOptions: [{ name: "Dial color", value: "Black" }],
    price: 57999,
    compareAtPrice: 62999,
    availableForSale: false,
    quantityAvailable: 0,
    image: "https://cdn.shopify.com/black.jpg",
  };

  const selected = applyShopifyVariant(product, black);
  assert.equal(selected.shopifyVariantId, black.id);
  assert.equal(selected.sku, "WATCH-BLACK");
  assert.equal(selected.price, "₹57,999");
  assert.equal(selected.mrp, "₹62,999");
  assert.equal(selected.image, black.image);
  assert.equal(selected.shopifyImages[0], black.image);
  assert.equal(selected.availableForSale, false);
  assert.equal(selected.quantityAvailable, 0);
});
