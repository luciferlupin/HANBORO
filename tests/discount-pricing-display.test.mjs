import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCTS_DATA, getWatchPricing } from "../src/productsData.js";
import { productsService, inventoryService } from "../src/supabaseClient.js";

test("Master Catalogue: All 104 watches have active 20% discount and MRP cut-line data", () => {
  assert.equal(PRODUCTS_DATA.length, 104, "Must contain all 104 timepieces");

  PRODUCTS_DATA.forEach((p) => {
    // 1. MRP verification
    assert.ok(p.mrpNumeric > 0, `Watch ${p.sku} must have a positive numeric MRP`);
    assert.equal(
      p.mrp,
      `₹${p.mrpNumeric.toLocaleString("en-IN")}`,
      `MRP string format must match numeric MRP for ${p.sku}`
    );

    // 2. Selling Price verification
    assert.ok(p.priceNumeric > 0, `Watch ${p.sku} must have positive numeric price`);
    assert.equal(
      p.price,
      `₹${p.priceNumeric.toLocaleString("en-IN")}`,
      `Price string format must match numeric price for ${p.sku}`
    );

    // 3. Discount relationship
    assert.ok(
      p.priceNumeric < p.mrpNumeric,
      `Selling price (${p.priceNumeric}) must be strictly lower than MRP (${p.mrpNumeric}) for ${p.sku}`
    );
    const expectedDiscounted = Math.round(p.mrpNumeric * 0.8);
    assert.equal(
      p.priceNumeric,
      expectedDiscounted,
      `Price for ${p.sku} must reflect 20% discount off MRP (${p.mrpNumeric} * 0.8 = ${expectedDiscounted})`
    );
    assert.equal(p.discountPercent, 20, `Discount percent must be 20 for ${p.sku}`);
  });
});

test("getWatchPricing Helper: Calculates savings and discount metadata accurately", () => {
  const sampleWatch = PRODUCTS_DATA[0];
  const pricing = getWatchPricing(sampleWatch);

  assert.equal(pricing.hasDiscount, true, "Must detect active discount");
  assert.equal(pricing.discountPercent, 20, "Must calculate 20% discount");
  assert.equal(pricing.price, sampleWatch.price, "Price must match discounted selling price");
  assert.equal(pricing.mrp, sampleWatch.mrp, "MRP must match catalogue MRP");
  assert.equal(pricing.savings, sampleWatch.mrpNumeric - sampleWatch.priceNumeric, "Savings must match difference");
  assert.equal(pricing.savingsFormatted, `₹${(sampleWatch.mrpNumeric - sampleWatch.priceNumeric).toLocaleString("en-IN")}`);
});

test("productsService.getLocalProducts: Reflects discounted price, cut MRP, and discountPercent", () => {
  const localList = productsService.getLocalProducts();
  assert.equal(localList.length, 104);

  localList.forEach((p) => {
    assert.ok(p.mrp, `Product ${p.sku} in local catalog must have MRP`);
    assert.ok(p.mrpNumeric, `Product ${p.sku} in local catalog must have mrpNumeric`);
    assert.ok(p.priceNumeric < p.mrpNumeric, `Product ${p.sku} priceNumeric must be less than mrpNumeric`);
    assert.equal(p.discountPercent, 20);
  });
});

test("inventoryService.getInventory: Retains MRP and discountPercent", () => {
  const invList = inventoryService.getInventory();
  assert.equal(invList.length, 104);

  invList.forEach((it) => {
    assert.ok(it.price, `Inventory item ${it.sku} must have price`);
    assert.ok(it.mrp, `Inventory item ${it.sku} must have MRP`);
    assert.equal(it.discountPercent, 20, `Inventory item ${it.sku} must have 20% discount`);
  });
});
