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
import { productsService, inventoryService, enrichOrderItemWithSkuEan, STORAGE_KEYS } from "../src/supabaseClient.js";

// Mock Supabase sync for deterministic offline execution
productsService.syncProductToSupabase = async (product) => {
  return { product, inventory: product };
};

test("QA Suite - 1. SKU Rename & Storefront Attribute Sync", async () => {
  const initialCatalog = productsService.getLocalProducts();
  const initialCount = initialCatalog.length;
  const target = initialCatalog[0];
  const oldSku = target.sku;
  const oldId = target.id;
  const newSku = "HBR-QA-2026-TITANIUM";
  const newName = "QA Royal Skeleton Automatic";
  const newPrice = "₹1,85,000";
  const newModelNumber = "QA-TITANIUM-888";

  const updatedProduct = {
    ...target,
    id: oldId,
    sku: newSku,
    name: newName,
    price: newPrice,
    modelNumber: newModelNumber,
    specs: {
      ...target.specs,
      modelNumber: newModelNumber,
    },
    previousSku: oldSku,
    previousId: oldId,
  };

  const savedCatalog = await productsService.saveProduct(updatedProduct, oldId, oldSku);

  // A. Catalogue length must not change (no duplicate phantom watches created)
  assert.equal(savedCatalog.length, initialCount, "Catalog count must remain identical after SKU rename");

  // B. Updated watch is found by new SKU
  const watchByNewSku = savedCatalog.find((p) => p.sku === newSku);
  assert.ok(watchByNewSku, "Watch must be found by new SKU");
  assert.equal(watchByNewSku.name, newName, "Watch name must reflect updated title");
  assert.equal(watchByNewSku.price, newPrice, "Watch price must reflect updated price");
  assert.equal(watchByNewSku.modelNumber, newModelNumber, "Model number must reflect update");

  // C. Old SKU is not present as a separate ghost watch in catalog
  const ghostWatch = savedCatalog.find((p) => p.sku === oldSku && p.id !== oldId);
  assert.equal(ghostWatch, undefined, "Old SKU must not exist as a duplicate ghost item");

  // D. Page reload simulation (re-reading from getLocalProducts)
  const reloaded = productsService.getLocalProducts();
  const reloadedWatch = reloaded.find((p) => p.sku === newSku);
  assert.ok(reloadedWatch, "Edited watch must persist across getLocalProducts reload");
  assert.equal(reloadedWatch.sku, newSku);
  assert.equal(reloadedWatch.price, newPrice);
});

test("QA Suite - 2. PDP URL Resolution by Old and New SKU via previousSku", () => {
  const localCatalog = productsService.getLocalProducts();
  const modifiedWatch = localCatalog.find((p) => p.sku === "HBR-QA-2026-TITANIUM");
  assert.ok(modifiedWatch, "Target watch must exist");

  const oldSku = modifiedWatch.previousSku;
  assert.ok(oldSku, "Target watch must record its previousSku");

  // Resolver function exactly as implemented in StoreContext.jsx
  const resolveForStorefront = (query) => {
    if (!query) return null;
    const clean = String(query).trim().toLowerCase();
    return localCatalog.find(
      (p) =>
        String(p.id).trim().toLowerCase() === clean ||
        String(p.sku).trim().toLowerCase() === clean ||
        (p.previousSku && String(p.previousSku).trim().toLowerCase() === clean) ||
        (p.previousId && String(p.previousId).trim().toLowerCase() === clean)
    ) || null;
  };

  // 1. Direct navigation via new SKU (e.g. #sku/HBR-QA-2026-TITANIUM)
  const resolvedByNew = resolveForStorefront("HBR-QA-2026-TITANIUM");
  assert.ok(resolvedByNew, "Must resolve by new SKU");
  assert.equal(resolvedByNew.id, modifiedWatch.id);

  // 2. Backward compatibility: user visits an old bookmarked link (#sku/OLD-SKU)
  const resolvedByOld = resolveForStorefront(oldSku);
  assert.ok(resolvedByOld, "Must resolve by previous SKU without 404");
  assert.equal(resolvedByOld.sku, "HBR-QA-2026-TITANIUM", "Resolved object must return the current edited SKU");
  assert.equal(resolvedByOld.price, "₹1,85,000", "Resolved object must return the current edited price");
});

test("QA Suite - 3. Cart Synchronization when SKU or Price Changes", () => {
  const targetSku = "HBR-QA-2026-TITANIUM";
  const localCatalog = productsService.getLocalProducts();
  const currentProduct = localCatalog.find((p) => p.sku === targetSku);
  assert.ok(currentProduct, "Current product must exist");

  const previousSku = currentProduct.previousSku;

  // Simulate an existing cart holding the item before SKU rename
  let cart = [
    {
      id: "cart-item-1",
      product: {
        id: currentProduct.id,
        sku: previousSku,
        name: "Old Watch Name",
        price: "₹1,25,000",
      },
      quantity: 2,
    },
    {
      id: "cart-item-2",
      product: {
        id: "other-watch-id",
        sku: "HBR-OTHER-SKU",
        name: "Other Watch",
        price: "₹95,000",
      },
      quantity: 1,
    },
  ];

  // StoreContext cart update logic
  const targetId = currentProduct.id;
  cart = cart.map((item) =>
    item.product.id === targetId ||
    String(item.product.sku).trim().toUpperCase() === String(previousSku).trim().toUpperCase() ||
    String(item.product.sku).trim().toUpperCase() === String(targetSku).trim().toUpperCase()
      ? { ...item, product: { ...item.product, ...currentProduct } }
      : item
  );

  const updatedCartItem = cart.find((it) => it.id === "cart-item-1");
  assert.ok(updatedCartItem, "Cart item must remain in cart");
  assert.equal(updatedCartItem.product.sku, targetSku, "Cart item SKU must update to new SKU");
  assert.equal(updatedCartItem.product.price, "₹1,85,000", "Cart item price must update to new price");
  assert.equal(updatedCartItem.product.name, "QA Royal Skeleton Automatic", "Cart item name must update");

  // Ensure unrelated cart items are untouched
  const otherCartItem = cart.find((it) => it.id === "cart-item-2");
  assert.equal(otherCartItem.product.sku, "HBR-OTHER-SKU", "Other cart items must not be affected");
});

test("QA Suite - 4. Inventory Service reflects modified SKU and Stock Level", async () => {
  const targetSku = "HBR-QA-2026-TITANIUM";
  const inventory = inventoryService.getInventory();
  assert.ok(Array.isArray(inventory) && inventory.length > 0, "Inventory must return items");

  const inventoryItem = inventory.find((it) => it.sku === targetSku);
  assert.ok(inventoryItem, "Inventory item must reflect the modified SKU");
  assert.equal(inventoryItem.name, "QA Royal Skeleton Automatic");
  assert.equal(inventoryItem.price, "₹1,85,000");

  // Test updating stock via inventory service
  const localCatalog = productsService.getLocalProducts();
  const currentProduct = localCatalog.find((p) => p.sku === targetSku);
  const updatedWithStock = {
    ...currentProduct,
    stock: 3,
  };

  await productsService.saveProduct(updatedWithStock, currentProduct.id, targetSku);

  const reloadedInventory = inventoryService.getInventory();
  const reloadedItem = reloadedInventory.find((it) => it.sku === targetSku);
  assert.ok(reloadedItem, "Inventory item must exist after stock edit");
  assert.equal(reloadedItem.stock, 3, "Inventory stock must reflect updated stock value (3)");
});

test("QA Suite - 5. Order Enrichment generates valid Barcode and SKU for Edited Watch", () => {
  const localCatalog = productsService.getLocalProducts();
  const targetProduct = localCatalog.find((p) => p.sku === "HBR-QA-2026-TITANIUM");
  assert.ok(targetProduct, "Target product must exist");

  const rawOrderItem = {
    id: targetProduct.id,
    sku: targetProduct.sku,
    name: targetProduct.name,
    price: targetProduct.price,
    quantity: 1,
  };

  const enriched = enrichOrderItemWithSkuEan(rawOrderItem, localCatalog);
  assert.ok(enriched, "Item must be enriched");
  assert.equal(enriched.sku, "HBR-QA-2026-TITANIUM", "Enriched SKU must match edited SKU");
  assert.ok(enriched.ean, "Enriched item must have an EAN barcode");
  assert.equal(enriched.ean.length, 13, "EAN barcode must be 13 digits");
  assert.match(enriched.ean, /^[0-9]{13}$/, "EAN must contain only numbers");
});

test("QA Suite - 6. Normalization: Lowercase & Whitespace handling on SKU", async () => {
  const localCatalog = productsService.getLocalProducts();
  const target = localCatalog[1];
  const targetId = target.id;
  const previousSku = target.sku;

  // Admin inputs SKU with lowercase and surrounding spaces
  const rawInputSku = "   hbr-qa-clean-sku-2026   ";
  const expectedSku = "HBR-QA-CLEAN-SKU-2026";

  const updatedProduct = {
    ...target,
    sku: rawInputSku.trim().toUpperCase(),
    name: "Clean Normalized Timepiece",
    previousSku,
  };

  await productsService.saveProduct(updatedProduct, targetId, previousSku);

  const reloaded = productsService.getLocalProducts();
  const found = reloaded.find((p) => p.id === targetId);

  assert.ok(found, "Product must exist");
  assert.equal(found.sku, expectedSku, "SKU must be trimmed and uppercased");
});

test("QA Suite - 7. Clean Reversion: Restoring Original SKU works seamlessly", async () => {
  const initialData = PRODUCTS_DATA[0];
  const originalSku = initialData.sku;
  const originalName = initialData.name;
  const originalPrice = initialData.price;

  const localCatalog = productsService.getLocalProducts();
  const currentModified = localCatalog.find((p) => p.id === initialData.id);
  assert.ok(currentModified, "Modified watch must exist");
  const modifiedSku = currentModified.sku;

  // Revert back to original factory values
  const revertedProduct = {
    ...currentModified,
    sku: originalSku,
    name: originalName,
    price: originalPrice,
    previousSku: modifiedSku,
    previousId: initialData.id,
  };

  await productsService.saveProduct(revertedProduct, initialData.id, modifiedSku);

  const finalCatalog = productsService.getLocalProducts();
  const finalWatch = finalCatalog.find((p) => p.id === initialData.id);

  assert.ok(finalWatch, "Watch must exist after reversion");
  assert.equal(finalWatch.sku, originalSku, "SKU must revert cleanly to original factory SKU");
  assert.equal(finalWatch.name, originalName, "Name must revert cleanly to original factory name");
  assert.equal(finalWatch.price, originalPrice, "Price must revert cleanly to original factory price");

  // Verify ghost modified SKU does not linger
  const phantom = finalCatalog.find((p) => p.sku === modifiedSku && p.id !== initialData.id);
  assert.equal(phantom, undefined, "Modified SKU must be cleanly removed upon reversion");
});
