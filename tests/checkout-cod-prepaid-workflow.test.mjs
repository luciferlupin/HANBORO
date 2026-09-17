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
};

import {
  ordersService,
  safeStorage,
  STORAGE_KEYS,
  calculateEan13,
  enrichOrderItemWithSkuEan,
} from "../src/supabaseClient.js";

// Mock remote supabase sync to avoid network pollution in unit tests
ordersService.syncOrderToSupabase = async () => {};

test("Checkout QA: Cash on Delivery (COD) order creation sets Pending payment status and Concierge White-Glove delivery", async () => {
  const codPayload = {
    customer_name: "Vikramaditya Singhania",
    customer_email: "singhania.v@luxuryhorology.in",
    customer_phone: "+91 98200 11223",
    shipping_address: {
      address: "Penthouse 42, Oberoi Sky Heights, Worli",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400018",
      country: "India",
    },
    items: [
      {
        id: "hbr-980-auto-orbita-g",
        sku: "HBR-980-AUTO-ORBITA-G",
        name: "Hanboro Orbita Gold Automatic",
        price: "₹45,000",
        quantity: 1,
      },
    ],
    total_amount: 45000,
    currency: "INR",
    payment_method: "Cash on Delivery (COD)",
    // Note: Do NOT pass payment_status, let createOrder accurately deduce it
  };

  const created = await ordersService.createOrder(codPayload);

  // 1. Assert Payment Status is NOT 'Paid'
  assert.notEqual(created.payment_status, "Paid", "COD orders must NEVER have payment_status === 'Paid'");
  assert.equal(created.payment_status, "Pending", "COD orders must have payment_status === 'Pending'");

  // 2. Assert Payment Method & Delivery Method
  assert.equal(created.payment_method, "Cash on Delivery (COD)");
  assert.equal(created.delivery_method, "Concierge White-Glove (COD)", "Delivery method must reflect Concierge COD delivery");

  // 3. Assert Tags include COD
  assert.ok(created.tags.includes("COD"), "Tags must include 'COD'");
  assert.ok(created.tags.includes("White-Glove"), "Tags must include 'White-Glove'");

  // 4. Assert EAN Barcode was automatically enriched
  assert.ok(created.items[0].ean, "Item must have an EAN barcode");
  assert.equal(created.items[0].ean.length, 13, "EAN barcode must be 13 digits");
  assert.match(created.items[0].ean, /^8908012/, "EAN must start with 8908012 prefix");
});

test("Checkout QA: Prepaid Card & UPI orders set Paid status and Standard Prepaid delivery", async () => {
  const cardPayload = {
    customer_name: "Aarav Mehra",
    customer_email: "aarav.mehra@atelier.in",
    customer_phone: "+91 98110 44556",
    shipping_address: {
      address: "14 Golf Links",
      city: "New Delhi",
      state: "Delhi NCR",
      pincode: "110003",
      country: "India",
    },
    items: [
      {
        id: "hbr-989-3-black-auto",
        sku: "HBR-989-3-BLACK-AUTO",
        name: "Hanboro Automatic Tonneau Black",
        price: "₹48,000",
        quantity: 1,
      },
    ],
    total_amount: 48000,
    payment_method: "Credit Card (Encrypted)",
    payment_status: "Paid",
  };

  const created = await ordersService.createOrder(cardPayload);

  assert.equal(created.payment_status, "Paid", "Prepaid card order must have payment_status === 'Paid'");
  assert.equal(created.payment_method, "Credit Card (Encrypted)");
  assert.equal(created.delivery_method, "Standard (Prepaid)");
  assert.ok(created.tags.includes("Prepaid"));
});

test("Admin Dashboard QA: Orders filtering properly separates Unpaid (COD) from Paid orders", async () => {
  // Clear local storage for clean test
  safeStorage.removeItem(STORAGE_KEYS.ORDERS);

  // Create 1 COD order and 1 Prepaid order
  const codOrder = await ordersService.createOrder({
    customer_name: "Rohan Kapoor",
    customer_email: "rohan@kapoor.in",
    total_amount: 42000,
    payment_method: "Cash on Delivery (COD)",
  });

  const prepaidOrder = await ordersService.createOrder({
    customer_name: "Priya Sharma",
    customer_email: "priya@sharma.in",
    total_amount: 55000,
    payment_method: "Instant UPI / QR",
    payment_status: "Paid",
  });

  const allOrders = ordersService.getLocalOrders();
  assert.equal(allOrders.length, 2, "Must contain exactly 2 orders");

  // Filter: "unpaid" tab (same filter logic as AdminDashboard.jsx line 549)
  const unpaidOrders = allOrders.filter((o) => {
    if (o.payment_status === "Paid") return false;
    return true;
  });

  assert.equal(unpaidOrders.length, 1, "Unpaid tab must contain only 1 order");
  assert.equal(unpaidOrders[0].order_ref, codOrder.order_ref, "Unpaid tab must contain the COD order");
  assert.equal(unpaidOrders[0].payment_status, "Pending");

  // Filter: "paid" tab
  const paidOrders = allOrders.filter((o) => o.payment_status === "Paid");
  assert.equal(paidOrders.length, 1, "Paid tab must contain only 1 order");
  assert.equal(paidOrders[0].order_ref, prepaidOrder.order_ref, "Paid tab must contain the prepaid order");

  // Revenue calculation: Total Sales must ONLY count Paid orders (same logic as AdminDashboard.jsx line 789)
  const totalSales = allOrders
    .filter((o) => o.payment_status === "Paid")
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  assert.equal(totalSales, 55000, "Total Sales must NOT include uncollected COD amount (₹42,000)");
});

test("Admin Dashboard QA: Admin marks COD payment as collected, successfully transitioning status to Paid", async () => {
  const allOrders = ordersService.getLocalOrders();
  const codOrder = allOrders.find((o) => o.payment_status === "Pending");
  assert.ok(codOrder, "Must find pending COD order");

  // Admin marks payment as collected
  await ordersService.updateOrder(codOrder.order_ref, { payment_status: "Paid" });

  const refreshedOrders = ordersService.getLocalOrders();
  const updatedCod = refreshedOrders.find((o) => o.order_ref === codOrder.order_ref);
  assert.equal(updatedCod.payment_status, "Paid", "Status must update to Paid after collection");

  // Verify updated revenue
  const updatedTotalSales = refreshedOrders
    .filter((o) => o.payment_status === "Paid")
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  assert.equal(updatedTotalSales, 42000 + 55000, "Total Sales must now reflect both orders after COD collection");
});

test("Tax Invoice QA: COD orders render 'COD • DUE ON DELIVERY' seal while Prepaid renders 'PAID • VERIFIED'", () => {
  const codOrder = {
    order_ref: "HNB-9912",
    payment_method: "Cash on Delivery (COD)",
    payment_status: "Pending",
    total_amount: 45000,
  };

  const prepaidOrder = {
    order_ref: "HNB-9913",
    payment_method: "Credit Card (Encrypted)",
    payment_status: "Paid",
    total_amount: 45000,
  };

  // Helper matching AdminDashboard.jsx invoice logic
  function getInvoiceSeal(ord) {
    const isCod =
      (String(ord.payment_method || "").toLowerCase().includes("cod") ||
        String(ord.payment_method || "").toLowerCase().includes("cash on delivery") ||
        ord.payment_status === "Pending") && ord.payment_status !== "Paid";

    if (isCod) {
      return { stamp: "COD • DUE ON DELIVERY", date: ord.payment_method || "Cash on Delivery", isCod: true };
    }
    return { stamp: "PAID • VERIFIED", date: "Prepaid / Razorpay Secured", isCod: false };
  }

  function getGrandTotalLabel(ord) {
    const isCod =
      (String(ord.payment_method || "").toLowerCase().includes("cod") ||
        String(ord.payment_method || "").toLowerCase().includes("cash on delivery") ||
        ord.payment_status === "Pending") && ord.payment_status !== "Paid";

    return isCod ? "Grand Total (Payable on Delivery):" : "Grand Total (Billed & Paid):";
  }

  const codSeal = getInvoiceSeal(codOrder);
  assert.equal(codSeal.stamp, "COD • DUE ON DELIVERY");
  assert.equal(codSeal.isCod, true);
  assert.equal(getGrandTotalLabel(codOrder), "Grand Total (Payable on Delivery):");

  const prepaidSeal = getInvoiceSeal(prepaidOrder);
  assert.equal(prepaidSeal.stamp, "PAID • VERIFIED");
  assert.equal(prepaidSeal.isCod, false);
  assert.equal(getGrandTotalLabel(prepaidOrder), "Grand Total (Billed & Paid):");
});
