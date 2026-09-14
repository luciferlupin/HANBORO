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
  assert.equal(PRODUCTS_DATA.length, 104, "Master catalogue must contain all 104 authenticated timepieces");
  PRODUCTS_DATA.forEach((p) => {
    assert.ok(p.id, "Every watch must have an ID");
    assert.ok(p.sku, "Every watch must have a valid SKU");
    assert.ok(p.price, "Every watch must have a price");
    assert.ok(p.image, "Every watch must have an authentic image");
  });
});

test("Excel Data Integrity: Watch Model Number matches name and pricing across all timepieces", () => {
  assert.equal(PRODUCTS_DATA.length, 104);
  const invalidInternalIds = new Set(["1270347", "2538803", "CERAMIC", "7200", "8022"]);

  PRODUCTS_DATA.forEach((p) => {
    // Model Number verification
    assert.ok(p.modelNumber, `Watch ${p.sku} must have a top-level modelNumber`);
    assert.ok(p.specs?.modelNumber, `Watch ${p.sku} must have specs.modelNumber`);
    assert.equal(
      p.modelNumber,
      p.specs.modelNumber,
      `Top-level modelNumber must match specs.modelNumber for ${p.sku}`
    );
    assert.equal(
      invalidInternalIds.has(p.modelNumber),
      false,
      `Watch ${p.sku} must not have raw ID or placeholder '${p.modelNumber}'`
    );

    // Pricing verification
    assert.ok(p.priceNumeric > 0, `Watch ${p.sku} must have valid positive numeric price`);
    assert.equal(
      p.price,
      `₹${p.priceNumeric.toLocaleString("en-IN")}`,
      `Price string formatting must match numeric price for ${p.sku}`
    );
    assert.ok(p.priceUsd?.startsWith("$"), `Price USD must be formatted with $ for ${p.sku}`);

    // Name sanitization verification
    assert.ok(p.name && p.name.trim().length > 0, `Watch ${p.sku} must have a non-empty name`);
    assert.equal(p.name.includes('"'), false, `Watch ${p.sku} name must not contain stray quotes: '${p.name}'`);
    assert.equal(p.name.includes("\n"), false, `Watch ${p.sku} name must not contain newlines`);
    assert.equal(p.name.includes("Worl Cup"), false, `Watch ${p.sku} name must not have typo 'Worl Cup'`);
  });
});

