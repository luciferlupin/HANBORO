import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCTS_DATA, getWatchPricing } from "../src/productsData.js";
import { productsService, inventoryService } from "../src/supabaseClient.js";

test("Remote Sync & Master Pricing: All 104 timepieces retain discounted selling price and cut MRP", async () => {
  const products = await productsService.fetchProducts();
  assert.equal(products.length, 104, "Must contain all 104 timepieces");

  let withDiscount = 0;
  let withoutDiscount = 0;
  const failures = [];

  products.forEach((p) => {
    const pNum = p.priceNumeric || parseInt(String(p.price).replace(/[^\d]/g, ""), 10);
    const mNum = p.mrpNumeric || (p.mrp ? parseInt(String(p.mrp).replace(/[^\d]/g, ""), 10) : 0);

    const hasDiscount = Boolean(p.mrp && p.mrp !== p.price && mNum > pNum && p.discountPercent > 0);
    if (hasDiscount) {
      withDiscount++;
    } else {
      withoutDiscount++;
      failures.push({
        sku: p.sku,
        name: p.name,
        price: p.price,
        mrp: p.mrp,
        pNum,
        mNum,
        discountPercent: p.discountPercent,
      });
    }

    // Verify format and strikethrough conditions
    assert.ok(p.price.startsWith("₹"), `Price must start with ₹ for ${p.sku}`);
    assert.ok(p.mrp.startsWith("₹"), `MRP must start with ₹ for ${p.sku}`);
    assert.notEqual(p.price, p.mrp, `Price must not equal MRP for ${p.sku}`);
    assert.ok(pNum < mNum, `Price numeric (${pNum}) must be less than MRP numeric (${mNum}) for ${p.sku}`);
    assert.equal(p.discountPercent, 20, `Discount percent must be 20 for ${p.sku}`);
  });

  assert.equal(withDiscount, 104, `All 104 timepieces must have active discount, got ${withDiscount}`);
  assert.equal(withoutDiscount, 0, `Zero timepieces should be undiscounted`);
});

test("getWatchPricing Helper: Bulletproof discount recovery on degenerate inputs", () => {
  // 1. Degenerate watch with price === mrp
  const badWatch = {
    id: "hbr-985-auto-apex-rg-blk",
    sku: "HBR-985-AUTO-APEX-RG-BLK",
    price: "₹59,999",
    mrp: "₹59,999",
  };
  const pricing1 = getWatchPricing(badWatch);
  assert.equal(pricing1.hasDiscount, true);
  assert.equal(pricing1.price, "₹47,999");
  assert.equal(pricing1.mrp, "₹59,999");
  assert.equal(pricing1.discountPercent, 20);
  assert.equal(pricing1.savingsFormatted, "₹12,000");

  // 2. Watch with missing MRP
  const noMrpWatch = {
    id: "hbr-989-3-black-auto",
    sku: "HBR-989-3-BLACK-AUTO",
    price: "₹42,399",
  };
  const pricing2 = getWatchPricing(noMrpWatch);
  assert.equal(pricing2.hasDiscount, true);
  assert.equal(pricing2.price, "₹42,399");
  assert.equal(pricing2.mrp, "₹52,999");
  assert.equal(pricing2.discountPercent, 20);

  // 3. Custom watch with no canonical master
  const customWatch = {
    id: "custom-atelier-chrono-x",
    sku: "CUST-CHRONO-X",
    price: "₹60,000",
    mrp: "₹60,000",
  };
  const pricing3 = getWatchPricing(customWatch);
  assert.equal(pricing3.hasDiscount, true);
  assert.equal(pricing3.price, "₹60,000");
  assert.equal(pricing3.mrp, "₹75,000");
  assert.equal(pricing3.discountPercent, 20);
});

test("Inventory Service: Preserves discounted prices and cut MRP", async () => {
  const inv = await inventoryService.fetchInventory();
  assert.equal(inv.length, 104);

  inv.forEach((it) => {
    assert.ok(it.price.startsWith("₹"), `Inventory price must start with ₹ for ${it.sku}`);
    assert.ok(it.mrp.startsWith("₹"), `Inventory MRP must start with ₹ for ${it.sku}`);
    assert.notEqual(it.price, it.mrp, `Inventory price must not equal MRP for ${it.sku}`);
    assert.equal(it.discountPercent, 20);
  });
});
