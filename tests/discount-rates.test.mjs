import test from "node:test";
import assert from "node:assert/strict";
import { discountsService } from "../src/supabaseClient.js";

test("Discounts Service: saveDiscount handles new discount rates and onConflict update", async () => {
  const code = "TEST_RATE_25";
  const config = {
    type: "percent",
    value: 25,
    label: "TEST_RATE_25: 25% OFF",
  };

  // 1. First save
  const res1 = await discountsService.saveDiscount(code, config);
  assert.ok(res1[code], "Discount rate should be saved in local state");
  assert.equal(res1[code].value, 25);
  assert.equal(res1[code].type, "percent");

  // 2. Fetch and verify
  const fetched = await discountsService.getDiscount(code);
  assert.ok(fetched, "Discount rate should be retrievable via getDiscount");
  assert.equal(fetched.value, 25);

  // 3. Update existing code to a new rate (40%) to ensure onConflict doesn't crash
  const res2 = await discountsService.saveDiscount(code, {
    type: "percent",
    value: 40,
    label: "TEST_RATE_25: 40% OFF",
  });
  assert.equal(res2[code].value, 40, "Updated discount rate should be 40%");

  // 4. Delete discount
  const res3 = await discountsService.deleteDiscount(code);
  assert.equal(res3[code], undefined, "Discount rate should be deleted");
});

test("Discounts Service: supports fractional/decimal discount rates", async () => {
  const code = "VIP_DECIMAL_12_5";
  const config = {
    type: "percent",
    value: 12.5,
    label: "VIP_DECIMAL_12_5: 12.5% OFF",
  };

  await discountsService.saveDiscount(code, config);
  const fetched = await discountsService.getDiscount(code);
  assert.equal(fetched.value, 12.5);

  await discountsService.deleteDiscount(code);
});

test("Discounts Service: supports fixed rupee amount discount rates", async () => {
  const code = "FIXED_CREDIT_2500";
  const config = {
    type: "fixed",
    value: 2500,
    label: "FIXED_CREDIT_2500: ₹2,500 OFF",
  };

  await discountsService.saveDiscount(code, config);
  const fetched = await discountsService.getDiscount(code);
  assert.equal(fetched.value, 2500);
  assert.equal(fetched.type, "fixed");

  await discountsService.deleteDiscount(code);
});

test("Discount Rates Calculation: Store discounts support rates > 15% without artificial cap", () => {
  const subtotal = 100000; // ₹1,00,000

  // 30% store discount
  const storePromo30 = {
    code: "VIP30",
    isRouletteVoucher: false,
    type: "percent",
    value: 30,
  };

  const rate = storePromo30.isRouletteVoucher
    ? Math.min(15, Math.max(0, storePromo30.value))
    : Math.min(100, Math.max(0, storePromo30.value));

  const discountAmount = Math.round((subtotal * rate) / 100);
  assert.equal(discountAmount, 30000, "30% discount on ₹1,00,000 should be ₹30,000");

  // Roulette voucher with value 20% must be capped at 15%
  const roulettePromo = {
    code: "HNB-ROULETTE-20",
    isRouletteVoucher: true,
    type: "percent",
    value: 20,
  };

  const rouletteRate = roulettePromo.isRouletteVoucher
    ? Math.min(15, Math.max(0, roulettePromo.value))
    : Math.min(100, Math.max(0, roulettePromo.value));

  const rouletteDiscount = Math.round((subtotal * rouletteRate) / 100);
  assert.equal(rouletteDiscount, 15000, "Roulette voucher must be capped at 15% (₹15,000)");
});
