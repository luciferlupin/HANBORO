import test from "node:test";
import assert from "node:assert/strict";
import { productsService, sortCatalogStably } from "../src/supabaseClient.js";
import { PRODUCTS_DATA } from "../src/productsData.js";

test("Phone and Desktop listing parity: Fresh device catalog matches canonical sequence", async () => {
  // 1. Simulating fresh phone load (empty local storage)
  const localCatalog = productsService.getLocalProducts();
  assert.equal(localCatalog.length, 104, "Phone must load all 104 master timepieces");

  // 2. Simulating remote cloud sync on phone
  const remoteCatalog = await productsService.fetchProducts();
  assert.equal(remoteCatalog.length, 104, "Cloud sync must preserve all 104 timepieces on phone");

  // 3. Verify exact 1:1 ID and sequence alignment between desktop canonical and phone catalog
  const canonical = sortCatalogStably(PRODUCTS_DATA);
  for (let i = 0; i < 104; i++) {
    assert.equal(
      remoteCatalog[i].id,
      canonical[i].id,
      `Timepiece at position ${i} must match between phone and desktop: expected ${canonical[i].id}, got ${remoteCatalog[i].id}`
    );
    assert.equal(
      remoteCatalog[i].sku.toUpperCase(),
      canonical[i].sku.toUpperCase(),
      `SKU at position ${i} must match between phone and desktop`
    );
    assert.equal(
      remoteCatalog[i].name,
      canonical[i].name,
      `Name at position ${i} must match between phone and desktop`
    );
    assert.equal(
      remoteCatalog[i].price,
      canonical[i].price,
      `Price at position ${i} must match between phone and desktop`
    );
  }
});
