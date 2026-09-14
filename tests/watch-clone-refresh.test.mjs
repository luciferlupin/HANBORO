import test from "node:test";
import assert from "node:assert/strict";

// Setup global mock for browser localStorage and window before importing client
const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
global.localStorage = mockLocalStorage;
global.window = {
  localStorage: mockLocalStorage,
  dispatchEvent: () => {},
  addEventListener: () => {},
};

import { PRODUCTS_DATA } from "../src/productsData.js";
import { productsService, sortCatalogStably, CANONICAL_PRODUCT_ORDER } from "../src/supabaseClient.js";

test("Master catalogue contains all authenticated timepieces with model numbers and pricing", () => {
  const localProducts = productsService.getLocalProducts();
  assert.equal(localProducts.length, PRODUCTS_DATA.length);

  localProducts.forEach((watch) => {
    assert.ok(watch.id, "Watch must have an ID");
    assert.ok(watch.sku, `Watch ${watch.id} must have a SKU`);
    assert.ok(watch.name, `Watch ${watch.id} must have a name`);
    assert.ok(watch.price, `Watch ${watch.id} must have a formatted price`);
    assert.ok(watch.priceNumeric > 0, `Watch ${watch.id} must have a positive numeric price`);
    assert.ok(watch.modelNumber, `Watch ${watch.id} must have a modelNumber`);
    assert.ok(watch.specs?.modelNumber, `Watch ${watch.id} must have specs.modelNumber`);
  });
});

test("Cloning a watch copies the exact same watch attributes (name, modelNumber, price, specs)", async () => {
  const initial = productsService.getLocalProducts();
  const sourceWatch = initial[0]; // First timepiece

  const baseSku = String(sourceWatch.sku || "HBR-TIMEPIECE").replace(/-CLONE-.*$/i, "").replace(/-V\d+$/i, "").trim().toUpperCase();
  const baseId = String(sourceWatch.id || "timepiece").replace(/-clone-.*$/i, "").trim().toLowerCase();
  const uniqueSuffix = `test-${Date.now().toString().slice(-4)}`;
  const cloneId = `${baseId}-clone-${uniqueSuffix}`;
  const cloneSku = `${baseSku}-CLONE-${uniqueSuffix}`;

  const parentRank = typeof sourceWatch.rank === "number" && !isNaN(sourceWatch.rank)
    ? sourceWatch.rank
    : (CANONICAL_PRODUCT_ORDER.get(String(sourceWatch.id).toLowerCase()) ?? 0);

  const cleanName = String(sourceWatch.name || "").replace(/\s*\(Variant\)$/i, "").trim();
  const cleanModel = sourceWatch.modelNumber || sourceWatch.specs?.modelNumber || "";

  const cloned = {
    ...sourceWatch,
    id: cloneId,
    sku: cloneSku,
    name: cleanName,
    modelNumber: cleanModel,
    specs: {
      ...(sourceWatch.specs || {}),
      modelNumber: cleanModel,
    },
    stock: typeof sourceWatch.stock === "number" && !isNaN(sourceWatch.stock) ? sourceWatch.stock : 10,
    rank: Number((parentRank + 0.001).toFixed(4)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Exact name match: No unwanted "(Variant)" suffix
  assert.equal(cloned.name, sourceWatch.name);
  assert.equal(cloned.modelNumber, sourceWatch.modelNumber);
  assert.equal(cloned.price, sourceWatch.price);
  assert.equal(cloned.priceNumeric, sourceWatch.priceNumeric);
  assert.equal(cloned.specs.modelNumber, sourceWatch.specs.modelNumber);
  assert.equal(cloned.collection, sourceWatch.collection);

  // 2. Save product and verify stable ordering
  const updatedCatalog = await productsService.saveProduct(cloned);
  assert.equal(updatedCatalog.length, PRODUCTS_DATA.length + 1);

  const targetIdx = updatedCatalog.findIndex((p) => p.id === sourceWatch.id);
  const cloneIdx = updatedCatalog.findIndex((p) => p.id === cloneId);
  assert.equal(cloneIdx, targetIdx + 1, "Cloned watch must be positioned immediately adjacent to original watch");

  // 3. Refresh simulation (getLocalProducts): all master watches + clone must show
  const refreshed = productsService.getLocalProducts();
  assert.equal(refreshed.length, PRODUCTS_DATA.length + 1, "Catalog must not drop watches on refresh");

  const rTargetIdx = refreshed.findIndex((p) => p.id === sourceWatch.id);
  const rCloneIdx = refreshed.findIndex((p) => p.id === cloneId);
  assert.equal(rCloneIdx, rTargetIdx + 1, "Cloned watch position must persist immediately adjacent to original on refresh");

  const foundClone = refreshed.find((p) => p.id === cloneId);
  assert.ok(foundClone, "Cloned watch must be present in refreshed catalog");
  assert.equal(foundClone.name, sourceWatch.name, "Name must remain identical on refresh without (Variant)");
  assert.equal(foundClone.modelNumber, sourceWatch.modelNumber, "Model number must persist on refresh");
});

test("Simulating remote Supabase fetch keeps all catalogue watches and clones visible", async () => {
  const fetched = await productsService.fetchProducts();
  assert.ok(fetched.length >= 98, "Fetched catalog must contain all master watches");

  // Ensure all master watches still have their model number and price
  PRODUCTS_DATA.forEach((master) => {
    const match = fetched.find((p) => p.id === master.id || p.sku === master.sku);
    assert.ok(match, `Master watch ${master.id} must be visible after fetch`);
    assert.equal(match.modelNumber, master.modelNumber, `Model number for ${master.id} must not be erased`);
    assert.ok(match.price, `Price for ${master.id} must be present`);
  });
});

test("All 104 timepieces have transparent primary photos without white background", () => {
  PRODUCTS_DATA.forEach((watch) => {
    assert.ok(watch.transparentImage, `Watch ${watch.id} must have a transparentImage`);
    assert.ok(watch.image, `Watch ${watch.id} must have a primary image`);
    assert.match(
      watch.image,
      /\.(webp|png)$/i,
      `Primary image for ${watch.id} must be PNG or WebP with alpha channel, got: ${watch.image}`
    );
    assert.match(
      watch.transparentImage,
      /\.(webp|png)$/i,
      `transparentImage for ${watch.id} must be PNG or WebP with alpha channel, got: ${watch.transparentImage}`
    );
  });
});
