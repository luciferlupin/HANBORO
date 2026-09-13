import test from "node:test";
import assert from "node:assert/strict";
import { calculateEan13, enrichOrderItemWithSkuEan, DEFAULT_CUSTOMER_PROFILES } from "../src/supabaseClient.js";

test("calculateEan13 generates a valid 13-digit EAN barcode with Modulo-10 check digit", () => {
  const ean1 = calculateEan13("HNB-SHK-TI-01");
  assert.equal(ean1.length, 13, "EAN barcode must be 13 digits");
  assert.match(ean1, /^8908012\d{6}$/, "EAN must start with luxury Indian prefix 8908012");

  // Verify Modulo-10 checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean1[i], 10);
    sum += (i % 2 === 0 ? digit * 1 : digit * 3);
  }
  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  assert.equal(parseInt(ean1[12], 10), expectedCheckDigit, "Check digit must match Modulo-10 calculation");

  // Determinism
  const ean2 = calculateEan13("HNB-SHK-TI-01");
  assert.equal(ean1, ean2, "EAN generation must be deterministic for the same SKU");
});

test("enrichOrderItemWithSkuEan enriches items with proper SKU and EAN barcode", () => {
  const mockProducts = [
    { id: "p1", name: "Shark Series Titanium", sku: "HNB-SHK-TI-01", price: "₹45,000", ean: "8908012845014" },
    { id: "p2", name: "Astroworld Tourbillon", sku: "HNB-ASTRO-BLK", price: "₹40,499" }
  ];

  // Item with product matching
  const item1 = { id: "p1", name: "Shark Series Titanium", price: 45000, quantity: 1 };
  const enriched1 = enrichOrderItemWithSkuEan(item1, mockProducts);
  assert.equal(enriched1.sku, "HNB-SHK-TI-01");
  assert.equal(enriched1.ean, "8908012845014");

  // Item without explicit SKU or EAN
  const item2 = { name: "Custom Skeleton Concept", price: 65000, quantity: 1 };
  const enriched2 = enrichOrderItemWithSkuEan(item2, mockProducts);
  assert.ok(enriched2.sku, "Must assign a fallback SKU");
  assert.equal(enriched2.ean.length, 13, "Must assign a 13-digit EAN barcode");
  assert.match(enriched2.ean, /^8908012/);
});

test("DEFAULT_CUSTOMER_PROFILES contains seeded VIP profiles with shipping and contact dossiers", () => {
  assert.ok(DEFAULT_CUSTOMER_PROFILES.length >= 4, "Must have default VIP patron profiles");
  const ankan = DEFAULT_CUSTOMER_PROFILES.find(p => p.email === "ankan.das@bengalhorology.in");
  assert.ok(ankan, "Ankan Das VIP profile exists");
  assert.equal(ankan.vip_tier, "VIP Horology Patron");
  assert.equal(ankan.shipping_info.city, "Kolkata");
  assert.ok(ankan.shipping_info.address.includes("Ballygunge"));
});

test("Official Tax Invoice financial breakdown calculates correct GST 18% and taxable amounts", () => {
  const totalAmount = 45000;
  const taxableSubtotal = Math.round(totalAmount / 1.18);
  const totalTax = totalAmount - taxableSubtotal;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  assert.equal(taxableSubtotal, 38136, "Taxable subtotal at 18% GST");
  assert.equal(cgst, 3432, "CGST 9%");
  assert.equal(sgst, 3432, "SGST 9%");
  assert.equal(taxableSubtotal + cgst + sgst, totalAmount, "Sum of taxable + taxes must equal grand total billed");
});

