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
import { productsService, sortCatalogStably, CANONICAL_PRODUCT_ORDER, MASTER_CANONICAL_ORDER } from "../src/supabaseClient.js";

// Ensure remote Supabase calls are mocked in unit tests
productsService.syncProductsOrderToSupabase = async () => {};

test("Watch Reorder: Initial master catalogue has default canonical order", () => {
  const initial = productsService.getLocalProducts();
  assert.equal(initial.length, PRODUCTS_DATA.length);
  assert.equal(initial[0].sku, MASTER_CANONICAL_ORDER[0]);
  assert.equal(initial[1].sku, MASTER_CANONICAL_ORDER[1]);
});

test("Watch Reorder: Dragging and dropping a watch model persists the new order", async () => {
  const initial = productsService.getLocalProducts();
  
  // Pick the 5th watch (index 4) and move it to the 1st position (index 0)
  const targetWatch = initial[4];
  const reordered = [...initial];
  const [moved] = reordered.splice(4, 1);
  reordered.unshift(moved);

  assert.equal(reordered[0].id, targetWatch.id, "Target watch should now be at index 0");

  // Save the new order
  const saved = await productsService.saveProductOrder(reordered);
  assert.equal(saved[0].id, targetWatch.id);
  assert.equal(saved[0].rank, 0);
  assert.equal(saved[1].rank, 1);

  // Verify getLocalProducts (refresh simulation) reflects the new order
  const refreshed = productsService.getLocalProducts();
  assert.equal(refreshed.length, PRODUCTS_DATA.length);
  assert.equal(refreshed[0].id, targetWatch.id, "Reordered watch must remain at position 1 upon refresh");
  assert.equal(refreshed[0].rank, 0);

  // Verify sortCatalogStably respects the new custom ranks
  const sorted = sortCatalogStably(refreshed);
  assert.equal(sorted[0].id, targetWatch.id);
});

test("Watch Reorder: Storefront catalog and carousel display timepieces in the exact rearranged sequence", async () => {
  const list = productsService.getLocalProducts();
  
  // Move 10th watch (e.g. index 9) to the very top (#1)
  const topWatch = list[9];
  const reordered = [...list];
  const [moved] = reordered.splice(9, 1);
  reordered.unshift(moved);

  await productsService.saveProductOrder(reordered);

  // 1. Check storefront catalog view (ProductsView logic)
  const currentCatalog = productsService.getLocalProducts();
  const catalogSorted = sortCatalogStably(currentCatalog);
  assert.equal(catalogSorted[0].id, topWatch.id, "Public catalog must show newly arranged #1 watch first");

  // 2. Check storefront homepage carousel (App.jsx WatchCarouselSection logic)
  const carouselWatches = currentCatalog.filter((p) => p.isActive !== false).slice(0, 16);
  assert.equal(carouselWatches[0].id, topWatch.id, "Vault carousel must lead with newly arranged #1 watch");

  // 3. Confirm all ranks are clean, sequential integers with no gaps
  for (let i = 0; i < currentCatalog.length; i++) {
    assert.equal(currentCatalog[i].rank, i, `Product at index ${i} must have rank ${i}`);
  }
});

test("Watch Reorder: Reordering by watch model preserves all attributes and model numbers", async () => {
  const list = productsService.getLocalProducts();
  const first = list[0];
  const second = list[1];

  // Swap first and second
  const swapped = [second, first, ...list.slice(2)];
  await productsService.saveProductOrder(swapped);

  const refreshed = productsService.getLocalProducts();
  assert.equal(refreshed[0].id, second.id);
  assert.equal(refreshed[1].id, first.id);
  assert.equal(refreshed[0].modelNumber, second.modelNumber);
  assert.equal(refreshed[1].modelNumber, first.modelNumber);
  assert.equal(refreshed[0].price, second.price);
  assert.equal(refreshed[1].price, first.price);
});

test("Watch Reorder: Moving watch to the bottom of the collection works properly", async () => {
  const list = productsService.getLocalProducts();
  const first = list[0];

  // Move first item to the very bottom
  const movedToBottom = [...list.slice(1), first];
  await productsService.saveProductOrder(movedToBottom);

  const refreshed = productsService.getLocalProducts();
  assert.equal(refreshed[refreshed.length - 1].id, first.id, "Moved watch should be at the very bottom");
  assert.equal(refreshed[refreshed.length - 1].rank, refreshed.length - 1);
});

test("Watch Reorder: resetProductOrder restores factory canonical reference sequence", async () => {
  const resetList = await productsService.resetProductOrder();
  assert.equal(resetList.length, PRODUCTS_DATA.length);
  assert.equal(resetList[0].sku, MASTER_CANONICAL_ORDER[0], "First watch should be back to factory master");
  assert.equal(resetList[1].sku, MASTER_CANONICAL_ORDER[1], "Second watch should be back to factory master");

  const refreshed = productsService.getLocalProducts();
  assert.equal(refreshed[0].sku, MASTER_CANONICAL_ORDER[0]);
});
