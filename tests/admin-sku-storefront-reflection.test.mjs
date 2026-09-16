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
  removeEventListener: () => {},
};

import { PRODUCTS_DATA } from "../src/productsData.js";
import { productsService, inventoryService, STORAGE_KEYS } from "../src/supabaseClient.js";

// Mock Supabase sync so test runs deterministically offline
productsService.syncProductToSupabase = async (product) => {
  return { product, inventory: product };
};

test("Admin SKU & Attribute Update reflects in Local Products Catalog", async () => {
  const initial = productsService.getLocalProducts();
  const target = initial[0];
  const oldSku = target.sku;
  const newSku = "HBR-TEST-MODIFIED-SKU-999";
  const newName = "Modified Royal Tonneau Skeleton Supreme";
  const newPrice = "₹1,45,000";
  const newModelNumber = "MOD-999-SPEC";

  const updatedProduct = {
    ...target,
    sku: newSku,
    name: newName,
    price: newPrice,
    modelNumber: newModelNumber,
    specs: {
      ...target.specs,
      modelNumber: newModelNumber,
    },
    previousSku: oldSku,
    previousId: target.id,
  };

  await productsService.saveProduct(updatedProduct, target.id, oldSku);

  // 1. Verify getLocalProducts reflects new SKU and attributes
  const localCatalog = productsService.getLocalProducts();
  const updatedInLocal = localCatalog.find((p) => p.id === target.id || p.sku === newSku);

  assert.ok(updatedInLocal, "Updated timepiece must exist in local catalog");
  assert.equal(updatedInLocal.sku, newSku, "SKU must be updated to new SKU");
  assert.equal(updatedInLocal.name, newName, "Name must be updated");
  assert.equal(updatedInLocal.price, newPrice, "Price must be updated");
  assert.equal(updatedInLocal.modelNumber, newModelNumber, "modelNumber must be updated");

  // Verify old SKU is not duplicated as a separate item
  const duplicates = localCatalog.filter((p) => p.sku === oldSku && p.id !== target.id);
  assert.equal(duplicates.length, 0, "Old SKU must not remain as duplicate item in catalog");
});

test("Inventory Mapping reflects edited SKU, Name, and Price instead of hardcoded defaults", async () => {
  const inventoryList = inventoryService.getInventory();
  assert.ok(Array.isArray(inventoryList) && inventoryList.length > 0, "Inventory must return items");

  const targetItem = inventoryList.find((it) => it.sku === "HBR-TEST-MODIFIED-SKU-999");
  assert.ok(targetItem, "Inventory item must reflect the modified SKU");
  assert.equal(targetItem.name, "Modified Royal Tonneau Skeleton Supreme", "Inventory item must reflect updated name");
  assert.equal(targetItem.price, "₹1,45,000", "Inventory item must reflect updated price");
});

test("Resolution by previousSku and previousId finds the updated timepiece", () => {
  const localCatalog = productsService.getLocalProducts();
  const modifiedWatch = localCatalog.find((p) => p.sku === "HBR-TEST-MODIFIED-SKU-999");
  assert.ok(modifiedWatch, "Modified watch must exist");

  const oldSku = modifiedWatch.previousSku;
  assert.ok(oldSku, "Watch should record previousSku");

  // Helper matching the logic in StoreContext getProductByIdOrSku
  const resolveWatch = (query) => {
    const clean = String(query).trim().toLowerCase();
    return localCatalog.find(
      (p) =>
        String(p.id).trim().toLowerCase() === clean ||
        String(p.sku).trim().toLowerCase() === clean ||
        (p.previousSku && String(p.previousSku).trim().toLowerCase() === clean) ||
        (p.previousId && String(p.previousId).trim().toLowerCase() === clean)
    );
  };

  const foundByNewSku = resolveWatch("HBR-TEST-MODIFIED-SKU-999");
  assert.ok(foundByNewSku, "Must resolve by new SKU");
  assert.equal(foundByNewSku.id, modifiedWatch.id);

  const foundByOldSku = resolveWatch(oldSku);
  assert.ok(foundByOldSku, "Must resolve by old SKU via previousSku");
  assert.equal(foundByOldSku.sku, "HBR-TEST-MODIFIED-SKU-999");
});

test("STORAGE_KEYS export is defined and contains PRODUCTS key for cross-tab sync", () => {
  assert.ok(STORAGE_KEYS, "STORAGE_KEYS must be exported");
  assert.equal(STORAGE_KEYS.PRODUCTS, "hanboro_custom_products");
  assert.equal(STORAGE_KEYS.WATCH_ORDER, "hanboro_custom_watch_order");
});
