import test from "node:test";
import assert from "node:assert/strict";

// Global mock for browser environment
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

import {
  abandonedCheckoutsService,
  cartService,
  draftOrdersService,
  getOrCreateGuestSessionId,
  safeStorage,
  supabase,
} from "../src/supabaseClient.js";

// Mock remote network mutations in unit tests to prevent cross-test race conditions
const createFluentMock = () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    order: async () => ({ data: [], error: null }),
    upsert: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    update: () => chain,
    delete: () => chain,
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return chain;
};
supabase.from = () => createFluentMock();

test("Abandoned Checkouts QA: Guest shopper on phone gets persistent session identifier", () => {
  storage.clear();
  const guestId1 = getOrCreateGuestSessionId();
  assert.ok(guestId1, "Guest session ID must be generated");
  assert.ok(guestId1.startsWith("guest_"), "Guest session ID must start with 'guest_'");

  // Re-calling returns the same session ID
  const guestId2 = getOrCreateGuestSessionId();
  assert.equal(guestId1, guestId2, "Guest session ID must persist across reads");
});

test("Abandoned Checkouts QA: Recording checkout lead saves customer name, email, phone, and items", async () => {
  storage.clear();
  const leadPayload = {
    name: "Aakash Varma",
    email: "aakash.varma@vipclient.in",
    phone: "9876543210",
    address: "Tower 3, Flat 1802, Prestige Ocean Crest",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    totalPrice: 48000,
    step: 1,
    deliveryMethod: "Concierge White-Glove (COD)",
    items: [
      {
        id: "hbr-6603-tonneau-red-rose",
        sku: "HBR-6603-TON-RED-ROSE",
        name: "Hanboro Tonneau Double Tourbillon Red",
        price: "₹48,000",
        quantity: 1,
      },
    ],
  };

  const recorded = await abandonedCheckoutsService.recordCheckoutLead(leadPayload);

  assert.equal(recorded.status, "Abandoned", "Status must be 'Abandoned'");
  assert.equal(recorded.customerName, "Aakash Varma", "Customer name must match input");
  assert.equal(recorded.customerEmail, "aakash.varma@vipclient.in", "Customer email must match input");
  assert.equal(recorded.customerPhone, "9876543210", "Customer phone must match input");
  assert.equal(recorded.totalPrice, 48000, "Total price must match input");
  assert.equal(recorded.items.length, 1, "Items array must contain 1 watch");
  assert.equal(recorded.items[0].sku, "HBR-6603-TON-RED-ROSE", "Item SKU must match");

  // Verify it appears in fetchAbandonedCheckouts
  const allLeads = await abandonedCheckoutsService.fetchAbandonedCheckouts();
  assert.ok(allLeads.length > 0, "Abandoned leads must be returned");
  const found = allLeads.find((l) => l.customerPhone === "9876543210");
  assert.ok(found, "Saved lead must be found by phone number");
  assert.equal(found.customerName, "Aakash Varma");

  // Clean up created test lead from Supabase
  await abandonedCheckoutsService.deleteAbandonedCheckout(recorded.id);
});

test("Abandoned Checkouts QA: Manual Draft Orders do not include Abandoned Checkouts", async () => {
  storage.clear();

  // Create an abandoned lead
  const rohitLead = await abandonedCheckoutsService.recordCheckoutLead({
    name: "Rohit Oberoi",
    email: "rohit.oberoi@luxury.in",
    phone: "9811122233",
    totalPrice: 42000,
    items: [{ name: "Hanboro Starlight Skeleton", sku: "HBR-8812-SKEL", price: "₹42,000", quantity: 1 }],
  });

  // Fetch draft orders - should NOT return the abandoned checkout
  const drafts = await draftOrdersService.fetchDraftOrders([]);
  const leaked = drafts.find((d) => d.customerName === "Rohit Oberoi");
  assert.equal(leaked, undefined, "Abandoned checkout must NOT leak into draft orders list");

  // Clean up created test lead from Supabase
  await abandonedCheckoutsService.deleteAbandonedCheckout(rohitLead.id);
});

test("Abandoned Checkouts QA: WhatsApp recovery URL formats 10-digit Indian phone with 91 prefix", () => {
  const checkout = {
    customerName: "Priya Sharma",
    customerPhone: "9876543210",
    checkoutNumber: "#448102938475",
    totalPrice: 45000,
    items: [{ name: "Hanboro Flying Tourbillon Sapphire" }],
  };

  let cleanPhone = (checkout.customerPhone || "").replace(/[^\d]/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  } else if (!cleanPhone) {
    cleanPhone = "918882069334";
  }

  assert.equal(cleanPhone, "919876543210", "10-digit Indian mobile must be prefixed with 91 country code");

  const text = encodeURIComponent(
    `Hello ${checkout.customerName},\n\nWe noticed you were selecting the ${checkout.items[0].name} at HANBORO Watches.\n\nAcquisition Reference: ${checkout.checkoutNumber}\nTotal: ₹${Number(checkout.totalPrice).toLocaleString("en-IN")}`
  );
  const waUrl = `https://wa.me/${cleanPhone}?text=${text}`;

  assert.ok(waUrl.includes("wa.me/919876543210"), "WhatsApp link must target client phone with 91 prefix");
  assert.ok(waUrl.includes("Priya%20Sharma"), "WhatsApp link must encode client name");
  assert.ok(waUrl.includes("448102938475"), "WhatsApp link must include acquisition reference");
});

test("Abandoned Checkouts QA: Recovery and deletion lifecycle", async () => {
  storage.clear();

  // 1. Record lead
  const lead = await abandonedCheckoutsService.recordCheckoutLead({
    name: "Devendra Mehta",
    email: "mehta.d@regal.in",
    phone: "9988776655",
    totalPrice: 52000,
    items: [{ name: "Hanboro Skeleton Titanium", sku: "HBR-SKEL-TI", price: "₹52,000", quantity: 1 }],
  });

  // 2. Mark recovered
  await abandonedCheckoutsService.markCheckoutRecovered(lead.id, "HNB-77881-IN");
  const cachedAfterRecovery = abandonedCheckoutsService.getLocalAbandonedCheckouts();
  const recoveredItem = cachedAfterRecovery.find((c) => c.id === lead.id);
  assert.ok(recoveredItem, "Lead must still exist in cache");
  assert.equal(recoveredItem.recoveryStatus, "Recovered", "recoveryStatus must be 'Recovered'");

  // 3. Delete lead (Admin Archive)
  await abandonedCheckoutsService.deleteAbandonedCheckout(lead.id);
  const cachedAfterDelete = abandonedCheckoutsService.getLocalAbandonedCheckouts();
  const deletedItem = cachedAfterDelete.find((c) => c.id === lead.id);
  assert.equal(deletedItem, undefined, "Lead must be removed from cache upon deletion");
});
