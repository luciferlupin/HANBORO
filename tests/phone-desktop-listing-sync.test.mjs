import test from "node:test";
import assert from "node:assert/strict";
import { productsService, sortCatalogStably, safeStorage, STORAGE_KEYS, CANONICAL_PRODUCT_ORDER } from "../src/supabaseClient.js";
import { PRODUCTS_DATA } from "../src/productsData.js";

test("Phone and Desktop listing parity: Fresh device catalog loads all 104 watches in canonical sequence", async () => {
  // 1. Simulating fresh phone load (empty local storage)
  const localCatalog = productsService.getLocalProducts();
  assert.equal(localCatalog.length, 104, "Phone must load all 104 master timepieces");
  assert.equal(localCatalog[0].sku, "HBR-980-AUTO-ORBITA-G", "Position #1 on phone must be Hanboro Orbita Gold");
  assert.equal(localCatalog[0].rank, 0, "Rank #0 must belong to Hanboro Orbita Gold");

  // 2. Simulating remote cloud sync on phone
  const remoteCatalog = await productsService.fetchProducts();
  assert.equal(remoteCatalog.length, 104, "Cloud sync must preserve all 104 timepieces on phone");
  assert.equal(remoteCatalog[0].sku, "HBR-980-AUTO-ORBITA-G", "Position #1 after cloud sync must remain Hanboro Orbita Gold");
  assert.equal(remoteCatalog[0].rank, 0, "Rank #0 after cloud sync must remain Hanboro Orbita Gold");

  // 3. Verify exact 1:1 sequence alignment between desktop canonical and phone catalog
  const canonical = sortCatalogStably(PRODUCTS_DATA);
  for (let i = 0; i < 104; i++) {
    assert.equal(
      remoteCatalog[i].id,
      canonical[i].id,
      `Timepiece at position ${i} must match: expected ${canonical[i].id}, got ${remoteCatalog[i].id}`
    );
    assert.equal(
      remoteCatalog[i].sku.toUpperCase(),
      canonical[i].sku.toUpperCase(),
      `SKU at position ${i} must match`
    );
    assert.equal(
      remoteCatalog[i].name,
      canonical[i].name,
      `Name at position ${i} must match`
    );
    assert.equal(
      remoteCatalog[i].price,
      canonical[i].price,
      `Price at position ${i} must match`
    );
  }
});

test("Stale 83-SKU phone cache auto-upgrade: Upgrades to full 104 SKUs without staying truncated", async () => {
  // Simulate a phone with a legacy 83-product cache in localStorage
  const legacy83 = PRODUCTS_DATA.slice(0, 83);
  safeStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(legacy83));
  assert.equal(JSON.parse(safeStorage.getItem(STORAGE_KEYS.PRODUCTS)).length, 83, "Simulated stale cache has 83 items");

  // getLocalProducts should automatically detect stale truncated cache and restore all 104
  const restoredLocal = productsService.getLocalProducts();
  assert.equal(restoredLocal.length, 104, "getLocalProducts must discard stale 83-item cache and return all 104");

  // fetchProducts should also maintain all 104
  const restoredRemote = await productsService.fetchProducts();
  assert.equal(restoredRemote.length, 104, "fetchProducts must maintain all 104");
});

test("Category Breakdown Verification: All 6 Complication Series have accurate counts", async () => {
  const catalog = await productsService.fetchProducts();
  assert.equal(catalog.length, 104, "Total catalog must be 104");

  const byCollection = {};
  catalog.forEach((p) => {
    byCollection[p.collection] = (byCollection[p.collection] || 0) + 1;
  });

  assert.equal(byCollection.TOURBILLON, 21, "Tourbillon count must be 21");
  assert.equal(byCollection.TONNEAU, 30, "Tonneau count must be 30");
  assert.equal(byCollection.CLASSIC, 25, "Classic count must be 25");
  assert.equal(byCollection.OCTAGONAL, 12, "Octagonal count must be 12");
  assert.equal(byCollection.ROULETTE, 8, "Roulette count must be 8");
  assert.equal(byCollection.DIVER_SPORT, 8, "Diver Sport count must be 8");
});

