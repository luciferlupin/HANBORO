import test from "node:test";
import assert from "node:assert/strict";

// Setup browser localStorage and window mocks
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
import { productsService } from "../src/supabaseClient.js";

// Mock Supabase sync so tests run offline
const mockRemoteDb = new Map();
productsService.syncProductToSupabase = async (product) => {
  mockRemoteDb.set(product.id, { ...product });
  return { product, inventory: product };
};

test("SKU Editing Persistence: Editing a watch SKU persists across getLocalProducts (page reload)", async () => {
  const initial = productsService.getLocalProducts();
  const target = initial[0];
  const originalSku = target.sku;
  const newSku = `${originalSku}-CUSTOM-2026`;

  // Edit the watch SKU
  const edited = {
    ...target,
    sku: newSku,
    name: "Custom Apex Rose Gold Limited Edition",
    price: "₹65,000",
  };

  await productsService.saveProduct(edited, target.id, originalSku);

  // Simulate complete page reload
  const reloaded = productsService.getLocalProducts();
  const found = reloaded.find((p) => p.id === target.id);

  assert.ok(found, "Watch must exist after reload");
  assert.equal(found.sku, newSku, `SKU must be ${newSku}, got ${found.sku}`);
  assert.equal(found.name, "Custom Apex Rose Gold Limited Edition", "Name edit must persist");
  assert.equal(found.price, "₹65,000", "Price edit must persist");
});

test("SKU Editing Persistence: Remote Supabase fetch preserves edited SKU and attributes", async () => {
  const initial = productsService.getLocalProducts();
  const target = initial[1];
  const originalSku = target.sku;
  const newSku = `${originalSku}-SUPER-EDITION`;

  const edited = {
    ...target,
    sku: newSku,
    name: "Hanboro Emerald Chrono Master",
    price: "₹88,000",
  };

  await productsService.saveProduct(edited, target.id, originalSku);

  // Simulate remote fetch with Supabase returning the updated watch
  const fetched = await productsService.fetchProducts();
  const found = fetched.find((p) => p.id === target.id);

  assert.ok(found, "Watch must exist in fetched catalog");
  assert.equal(found.sku, newSku, "SKU must persist after fetchProducts");
  assert.equal(found.name, "Hanboro Emerald Chrono Master", "Name must persist after fetchProducts");
  assert.equal(found.price, "₹88,000", "Price must persist after fetchProducts");
});

test("Watch Addition Persistence: Adding a brand new watch persists across reload and fetch", async () => {
  const newWatch = {
    id: "hbr-custom-tourbillon-prototype-9999",
    sku: "HBR-PROTO-9999-TITANIUM",
    name: "Hanboro Titanium Orbital Prototype",
    price: "₹1,95,000",
    stock: 5,
    isActive: true,
    collection: "TOURBILLON",
    collectionName: "Tourbillon & Complications",
  };

  await productsService.saveProduct(newWatch);

  // Verify immediately in local
  const localList = productsService.getLocalProducts();
  const localFound = localList.find((p) => p.id === newWatch.id);
  assert.ok(localFound, "New watch must be in getLocalProducts");
  assert.equal(localFound.sku, "HBR-PROTO-9999-TITANIUM");

  // Verify in fetchProducts
  const fetchedList = await productsService.fetchProducts();
  const fetchedFound = fetchedList.find((p) => p.id === newWatch.id);
  assert.ok(fetchedFound, "New watch must be preserved in fetchProducts");
  assert.equal(fetchedFound.sku, "HBR-PROTO-9999-TITANIUM");
});

test("Watch Deletion Persistence: Deleting a watch persists across reload and fetch without resurrecting", async () => {
  const catalogBefore = productsService.getLocalProducts();
  const watchToDelete = catalogBefore[5];
  const deleteId = watchToDelete.id;
  const deleteSku = watchToDelete.sku;

  await productsService.deleteProduct(deleteId);

  // Verify deletion on reload
  const reloadedCatalog = productsService.getLocalProducts();
  const foundAfterReload = reloadedCatalog.find((p) => p.id === deleteId || p.sku === deleteSku);
  assert.equal(foundAfterReload, undefined, "Deleted watch must NOT be resurrected on getLocalProducts reload");

  // Verify deletion after remote fetch
  const fetchedCatalog = await productsService.fetchProducts();
  const foundAfterFetch = fetchedCatalog.find((p) => p.id === deleteId || p.sku === deleteSku);
  assert.equal(foundAfterFetch, undefined, "Deleted watch must NOT be resurrected on fetchProducts");
});
