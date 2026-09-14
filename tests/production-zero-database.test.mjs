import test from "node:test";
import assert from "node:assert/strict";
import {
  getLocalOrders,
  getLocalProfiles,
  ordersService,
  draftOrdersService,
  profilesService,
  inventoryService,
  productsService,
} from "../src/supabaseClient.js";
import { PRODUCTS_DATA } from "../src/productsData.js";

test("Production clean-slate: getLocalOrders returns empty array when unseeded", () => {
  const orders = getLocalOrders();
  assert.equal(Array.isArray(orders), true);
  assert.equal(orders.length, 0, "Initial production orders must be 0");
});

test("Production clean-slate: getLocalProfiles returns empty array when unseeded", () => {
  const profiles = getLocalProfiles();
  assert.equal(Array.isArray(profiles), true);
  assert.equal(profiles.length, 0, "Initial customer profiles must be 0");
});

test("Production clean-slate: draftOrdersService.fetchDraftOrders returns 0 drafts by default", async () => {
  const drafts = await draftOrdersService.fetchDraftOrders([]);
  assert.equal(Array.isArray(drafts), true);
  assert.equal(drafts.length, 0, "Initial draft orders must be 0");
});

test("Inventory Check: Master watch catalogue and inventory allocations are 100% intact", () => {
  assert.equal(PRODUCTS_DATA.length, 98, "Master catalogue must contain all 98 timepieces");
  PRODUCTS_DATA.forEach((p) => {
    assert.ok(p.id, "Every watch must have an ID");
    assert.ok(p.sku, "Every watch must have a valid SKU");
    assert.ok(p.price, "Every watch must have a price");
    assert.ok(p.image, "Every watch must have an authentic image");
  });
});
