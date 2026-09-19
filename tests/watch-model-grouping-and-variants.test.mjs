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
