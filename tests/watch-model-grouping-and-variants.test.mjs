import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCTS_DATA, getWatchModelKey, getWatchVariantLabel, getWatchPricing } from "../src/productsData.js";

test("Watch model key grouping identifies models consistently", () => {
  // Test watches with explicit modelNumber
  const w1 = { id: "w1", modelNumber: "989-3", sku: "HBR-989-3-BLU", name: "Skeleton 989-3 Blue" };
  const w2 = { id: "w2", modelNumber: "989-3", sku: "HBR-989-3-BLK", name: "Skeleton 989-3 Black" };
  const w3 = { id: "w3", modelNumber: "8851-1", sku: "HBR-8851-1-RG", name: "Automatic 8851-1 Rose Gold" };

  assert.equal(getWatchModelKey(w1), "989-3");
  assert.equal(getWatchModelKey(w2), "989-3");
  assert.equal(getWatchModelKey(w1), getWatchModelKey(w2));
  assert.notEqual(getWatchModelKey(w1), getWatchModelKey(w3));
});

test("Watch model key fallback derives from standard HBR SKU patterns", () => {
  const wA = { id: "wa", sku: "HBR-001-BLU-STEEL", name: "Ocean 001 Blue" };
  const wB = { id: "wb", sku: "HBR-001-BLK-STEEL", name: "Ocean 001 Black" };

  assert.equal(getWatchModelKey(wA), "001");
  assert.equal(getWatchModelKey(wB), "001");
  assert.equal(getWatchModelKey(wA), getWatchModelKey(wB));
});

test("Watch variant label extracts readable colour and edition names", () => {
  const wBlue = { id: "1", name: "Hanboro Skeleton Blue Dial", sku: "HBR-989-BLU" };
  const wRose = { id: "2", name: "Hanboro Automatic 18K Rose Gold", sku: "HBR-989-RG" };

  const labelBlue = getWatchVariantLabel(wBlue);
  const labelRose = getWatchVariantLabel(wRose);

  assert.ok(labelBlue.length > 0);
  assert.ok(labelRose.length > 0);
  assert.notEqual(labelBlue, labelRose);
});

test("Catalog grouping eliminates duplicate cards for multi-colour models", () => {
  const groups = new Map();
  PRODUCTS_DATA.forEach((watch) => {
    const modelKey = getWatchModelKey(watch);
    if (!groups.has(modelKey)) {
      groups.set(modelKey, {
        modelKey,
        primaryWatch: watch,
        variants: [watch],
      });
    } else {
      groups.get(modelKey).variants.push(watch);
    }
  });

  const totalWatches = PRODUCTS_DATA.length;
  const uniqueModels = groups.size;

  // There are over 100 watches and around ~38 distinct models
  assert.ok(uniqueModels < totalWatches, "Unique model cards must be fewer than raw watch items");
  
  // Find multi-variant models
  const multiVariantGroups = Array.from(groups.values()).filter((g) => g.variants.length > 1);
  assert.ok(multiVariantGroups.length > 0, "Must have multi-colour variant models grouped together");

  // Every variant inside a group must have valid SKU and pricing
  multiVariantGroups.forEach((group) => {
    assert.ok(group.variants.length >= 2);
    group.variants.forEach((v) => {
      assert.ok(v.sku, "Variant must have SKU");
      const pricing = getWatchPricing(v);
      assert.ok(pricing.price, "Variant must have formatted price");
    });
  });
});

test("Watch model key fallback groups Shopify-only watches with handle suffixes", () => {
  const p1 = {
    id: "gid://shopify/Product/10607946367160",
    title: "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Blue Dial",
    shopifyHandle: "hanboro-018-ultra-thin-micro-rotor-automatic-watch-blue-dial"
  };
  const p2 = {
    id: "gid://shopify/Product/10608257794232",
    title: "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Black Dial",
    shopifyHandle: "hanboro-018-ultra-thin-micro-rotor-automatic-watch-black-dial"
  };

  assert.equal(getWatchModelKey(p1), "018");
  assert.equal(getWatchModelKey(p2), "018");
  assert.equal(getWatchModelKey(p1), getWatchModelKey(p2));
});

test("Variant image filtering: isolates variant photos and supports multiple photos via Alt Text", async () => {
  const { filterImagesForVariant } = await import("../src/shopifyClient.js");

  const product = {
    id: "gid://shopify/Product/9999",
    name: "HANBORO Multi-Variant Timepiece",
    shopifyMedia: [
      { url: "https://cdn.shopify.com/blue-main.png", altText: "Blue Dial Front View" },
      { url: "https://cdn.shopify.com/blue-side.png", altText: "Blue Dial Side Profile" },
      { url: "https://cdn.shopify.com/silver-main.png", altText: "Silver Dial Front View" },
      { url: "https://cdn.shopify.com/silver-caseback.png", altText: "Silver Dial Exhibition Caseback" },
      { url: "https://cdn.shopify.com/silver-wrist.png", altText: "Silver Dial On Wrist" },
      { url: "https://cdn.shopify.com/black-main.png", altText: "Black Dial Front" },
      { url: "https://cdn.shopify.com/packaging-box.png", altText: "Luxury Presentation Packaging Box" },
    ],
    shopifyVariants: [
      {
        id: "var_silver",
        title: "Silver",
        image: "https://cdn.shopify.com/silver-main.png",
        selectedOptions: [{ name: "Dial color", value: "Silver" }],
      },
      {
        id: "var_black",
        title: "Black",
        image: "https://cdn.shopify.com/black-main.png",
        selectedOptions: [{ name: "Dial color", value: "Black" }],
      },
      {
        id: "var_blue",
        title: "Blue",
        image: "https://cdn.shopify.com/blue-main.png",
        selectedOptions: [{ name: "Dial color", value: "Blue" }],
      },
    ]
  };

  // Silver variant must receive all 3 silver photos + generic box, NEVER black or blue
  const silverImages = filterImagesForVariant(product, product.shopifyVariants[0]);
  assert.equal(silverImages.includes("https://cdn.shopify.com/silver-main.png"), true);
  assert.equal(silverImages.includes("https://cdn.shopify.com/silver-caseback.png"), true);
  assert.equal(silverImages.includes("https://cdn.shopify.com/silver-wrist.png"), true);
  assert.equal(silverImages.includes("https://cdn.shopify.com/packaging-box.png"), true);
  assert.equal(silverImages.includes("https://cdn.shopify.com/black-main.png"), false);
  assert.equal(silverImages.includes("https://cdn.shopify.com/blue-main.png"), false);
  assert.equal(silverImages.includes("https://cdn.shopify.com/blue-side.png"), false);

  // Black variant must receive black-main + generic box, NEVER silver or blue
  const blackImages = filterImagesForVariant(product, product.shopifyVariants[1]);
  assert.equal(blackImages.includes("https://cdn.shopify.com/black-main.png"), true);
  assert.equal(blackImages.includes("https://cdn.shopify.com/silver-main.png"), false);
  assert.equal(blackImages.includes("https://cdn.shopify.com/silver-caseback.png"), false);
  assert.equal(blackImages.includes("https://cdn.shopify.com/blue-main.png"), false);

  // Blue variant must receive blue-main and blue-side + box, NEVER silver or black
  const blueImages = filterImagesForVariant(product, product.shopifyVariants[2]);
  assert.equal(blueImages.includes("https://cdn.shopify.com/blue-main.png"), true);
  assert.equal(blueImages.includes("https://cdn.shopify.com/blue-side.png"), true);
  assert.equal(blueImages.includes("https://cdn.shopify.com/silver-main.png"), false);
  assert.equal(blueImages.includes("https://cdn.shopify.com/black-main.png"), false);
});

test("Variant selection updates timepiece name, title, and image dynamically", async () => {
  const { applyShopifyVariant } = await import("../src/shopifyClient.js");

  const baseProduct = {
    id: "p1",
    name: "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Blue Dial",
    title: "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Blue Dial",
    shopifyFeaturedImage: "https://cdn.shopify.com/blue.png",
    image: "https://cdn.shopify.com/blue.png",
    shopifyVariants: [
      {
        id: "v_silver",
        title: "Silver / Analog",
        image: "https://cdn.shopify.com/silver.png",
        selectedOptions: [{ name: "Dial color", value: "Silver" }, { name: "Watch display", value: "Analog" }]
      },
      {
        id: "v_black",
        title: "Black / Analog",
        image: "https://cdn.shopify.com/blue.png", // Shared placeholder
        selectedOptions: [{ name: "Dial color", value: "Black" }, { name: "Watch display", value: "Analog" }]
      }
    ]
  };

  const siblingBlack = {
    id: "p2",
    shopifyTitle: "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Black Dial",
    shopifyHandle: "hanboro-018-ultra-thin-micro-rotor-automatic-watch-black-dial",
    image: "https://cdn.shopify.com/black.png",
    shopifyImages: ["https://cdn.shopify.com/black.png"]
  };

  // Silver selection
  const silverApplied = applyShopifyVariant(baseProduct, baseProduct.shopifyVariants[0], [baseProduct, siblingBlack]);
  assert.equal(silverApplied.name, "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Silver Dial");
  assert.equal(silverApplied.title, "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Silver Dial");
  assert.equal(silverApplied.image, "https://cdn.shopify.com/silver.png");

  // Black selection
  const blackApplied = applyShopifyVariant(baseProduct, baseProduct.shopifyVariants[1], [baseProduct, siblingBlack]);
  assert.equal(blackApplied.name, "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Black Dial");
  assert.equal(blackApplied.title, "HANBORO 018 Ultra-Thin Micro-Rotor Automatic Watch – Black Dial");
  assert.equal(blackApplied.image, "https://cdn.shopify.com/black.png");
});

