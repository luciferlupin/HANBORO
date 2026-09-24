import test from "node:test";
import assert from "node:assert/strict";
import { applyShopifyVariant, hasMeaningfulShopifyOptions, mergeProductsWithShopifyData } from "../src/shopifyClient.js";

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

test("old single-variant products and future multi-option variants use the same normalized shape", () => {
  const product = {
    id: "legacy-watch",
    sku: "LEGACY-001",
    name: "Legacy Watch",
    price: "₹20,000",
    priceNumeric: 20000,
    image: "/legacy.webp",
    shopifyImages: ["/legacy.webp"],
  };
  const oldVariant = {
    id: "gid://shopify/ProductVariant/old",
    title: "Default Title",
    sku: "LEGACY-001",
    selectedOptions: [{ name: "Title", value: "Default Title" }],
    price: 20000,
    compareAtPrice: null,
    availableForSale: true,
    quantityAvailable: 2,
    image: "",
  };
  const futureVariant = {
    id: "gid://shopify/ProductVariant/future",
    title: "Black / Steel",
    sku: "LEGACY-001-BLK-STL",
    selectedOptions: [
      { name: "Dial color", value: "Black" },
      { name: "Bracelet", value: "Steel" },
    ],
    price: 22500,
    compareAtPrice: 25000,
    availableForSale: true,
    quantityAvailable: 7,
    image: "/black-steel.webp",
  };

  const legacy = applyShopifyVariant(product, oldVariant);
  assert.equal(legacy.image, "/legacy.webp");
  assert.equal(legacy.shopifyVariantId, oldVariant.id);
  assert.equal(legacy.quantityAvailable, 2);

  const future = applyShopifyVariant(product, futureVariant);
  assert.equal(future.shopifyVariantId, futureVariant.id);
  assert.equal(future.sku, "LEGACY-001-BLK-STL");
  assert.deepEqual(future.selectedOptions, futureVariant.selectedOptions);
  assert.equal(future.price, "₹22,500");
  assert.equal(future.mrp, "₹25,000");
  assert.equal(future.image, "/black-steel.webp");
});

test("a newly published Shopify-only watch retains every variant without a local catalogue record", () => {
  const variants = [
    {
      id: "gid://shopify/ProductVariant/new-blue",
      title: "Blue / Steel",
      sku: "HBR-NEW-BLUE-STL",
      selectedOptions: [
        { name: "Dial color", value: "Blue" },
        { name: "Bracelet", value: "Steel" },
      ],
      price: 31000,
      compareAtPrice: 35000,
      availableForSale: true,
      quantityAvailable: 4,
      image: "https://cdn.shopify.com/new-blue.jpg",
    },
    {
      id: "gid://shopify/ProductVariant/new-black",
      title: "Black / Leather",
      sku: "HBR-NEW-BLACK-LTH",
      selectedOptions: [
        { name: "Dial color", value: "Black" },
        { name: "Bracelet", value: "Leather" },
      ],
      price: 32000,
      compareAtPrice: null,
      availableForSale: false,
      quantityAvailable: 0,
      image: "https://cdn.shopify.com/new-black.jpg",
    },
  ];
  const liveProduct = {
    shopifyId: "gid://shopify/Product/new-watch",
    shopifyVariantId: variants[0].id,
    shopifyHandle: "new-automatic-watch",
    shopifySku: variants[0].sku,
    shopifyTitle: "New Automatic Watch",
    shopifyDescription: "Newly published watch",
    shopifyPrice: variants[0].price,
    shopifyComparePrice: variants[0].compareAtPrice,
    shopifyFeaturedImage: variants[0].image,
    shopifyImages: variants.map((variant) => variant.image),
    shopifyVariants: variants,
    shopifySpecifications: { movement: "Automatic" },
    shopifySpecificationRows: [{ label: "Movement", value: "Automatic" }],
    availableForSale: true,
    quantityAvailable: 4,
  };
  const liveMap = new Map();
  liveMap.shopifyProducts = [liveProduct];

  const [added] = mergeProductsWithShopifyData([], liveMap);
  assert.equal(added.name, "New Automatic Watch");
  assert.equal(added._shopifyOnlyProduct, true);
  assert.equal(added.shopifyVariants.length, 2);
  assert.deepEqual(added.shopifyVariants, variants);

  const soldOutSelection = applyShopifyVariant(added, variants[1]);
  assert.equal(soldOutSelection.shopifyVariantId, variants[1].id);
  assert.equal(soldOutSelection.sku, "HBR-NEW-BLACK-LTH");
  assert.equal(soldOutSelection.availableForSale, false);
  assert.equal(soldOutSelection.quantityAvailable, 0);
  assert.equal(soldOutSelection.image, variants[1].image);
});

test("a single real Shopify option is visible while Default Title remains hidden", () => {
  assert.equal(hasMeaningfulShopifyOptions([{
    id: "gid://shopify/ProductVariant/black",
    selectedOptions: [{ name: "colour variant", value: "black" }],
  }]), true);

  assert.equal(hasMeaningfulShopifyOptions([{
    id: "gid://shopify/ProductVariant/default",
    selectedOptions: [{ name: "Title", value: "Default Title" }],
  }]), false);
});
