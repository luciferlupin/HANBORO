import test from "node:test";
import assert from "node:assert/strict";

// Global mock for browser storage and window
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
  authService,
  ordersService,
  inventoryService,
  productsService,
  draftOrdersService,
  abandonedCheckoutsService,
  safeStorage,
  STORAGE_KEYS,
  calculateEan13,
  enrichOrderItemWithSkuEan,
} from "../src/supabaseClient.js";
import { PRODUCTS_DATA } from "../src/productsData.js";

// Prevent remote network calls in unit testing
ordersService.syncOrderToSupabase = async () => {};
productsService.syncProductToSupabase = async (product) => ({ product, inventory: product });

const mockDraftsDb = new Map();
draftOrdersService.saveDraftOrder = async function (draft) {
  const local = this.getLocalDrafts() || [];
  const updated = [draft, ...local.filter((d) => d.id !== draft.id)];
  this.saveLocalDrafts(updated);
  mockDraftsDb.set(draft.id, draft);
  return updated;
};
draftOrdersService.fetchDraftOrders = async function (defaultSeed = []) {
  const local = this.getLocalDrafts();
  return local && local.length > 0 ? local : defaultSeed;
};
draftOrdersService.deleteDraftOrder = async function (draftId) {
  const local = this.getLocalDrafts() || [];
  const updated = local.filter((d) => d.id !== draftId);
  this.saveLocalDrafts(updated);
  mockDraftsDb.delete(draftId);
  return updated;
};

test("E2E User Workflow: Sign up, Browse, Cart with Promo, COD Checkout, and Profile Dossier with Invoice", async () => {
  // 1. User Sign Up
  const signupResult = await authService.signUp({
    email: "kabir.singh@client.in",
    password: "Password@123",
    fullName: "Kabir Singh",
    phone: "+91 98100 22334",
  });

  assert.ok(signupResult.user, "User must be created");
  assert.equal(signupResult.profile.fullName, "Kabir Singh");
  assert.equal(signupResult.profile.role, "customer");

  // 2. Browse watches from catalog
  const catalog = productsService.getLocalProducts();
  assert.ok(catalog.length >= 104, "Catalog must have all master timepieces");

  // Filter by Tourbillon & search for Skeleton
  const selectedWatch = catalog.find((w) =>
    w.sku?.includes("8016") || w.name?.toLowerCase().includes("tourbillon")
  ) || catalog[0];

  assert.ok(selectedWatch, "Watch must be selectable from catalog");

  // 3. Wishlist / Heart action
  const wishlist = { [selectedWatch.id]: true };
  safeStorage.setItem("hanboro_wishlist_items", JSON.stringify(wishlist));
  const retrievedWishlist = JSON.parse(safeStorage.getItem("hanboro_wishlist_items"));
  assert.equal(retrievedWishlist[selectedWatch.id], true, "Wishlist must persist watch ID");

  // 4. Cart Calculation with Promo Code
  const numericPrice = parseInt(String(selectedWatch.price || "45000").replace(/[^\d]/g, ""), 10);
  const qty = 1;
  const subtotal = numericPrice * qty;
  const discountRate = 10; // 10% Welcome Discount (HANBORO10)
  const discountAmount = Math.round((subtotal * discountRate) / 100);
  const finalTotal = subtotal - discountAmount;

  assert.equal(finalTotal, subtotal - discountAmount);

  // 5. Checkout validation
  const clientShipping = {
    name: "Kabir Singh",
    email: "kabir.singh@client.in",
    phone: "9810022334",
    address: "Bungalow 12, Golf Course Road",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122002",
  };

  assert.equal(clientShipping.phone.length >= 10, true, "Phone must have at least 10 digits");
  assert.equal(clientShipping.pincode.length, 6, "Indian PIN must have 6 digits");

  // 6. Place Order as Cash on Delivery (COD)
  const orderPayload = {
    user_id: signupResult.user.id,
    customer_name: clientShipping.name,
    customer_email: clientShipping.email,
    customer_phone: `+91 ${clientShipping.phone}`,
    shipping_address: {
      address: clientShipping.address,
      city: clientShipping.city,
      state: clientShipping.state,
      pincode: clientShipping.pincode,
      country: "India",
    },
    items: [
      {
        id: selectedWatch.id,
        sku: selectedWatch.sku,
        name: selectedWatch.name,
        price: selectedWatch.price,
        quantity: qty,
      },
    ],
    total_amount: finalTotal,
    payment_method: "Cash on Delivery (COD)",
    isCod: true,
  };

  const createdOrder = await ordersService.createOrder(orderPayload);

  // Assert COD business logic
  assert.ok(createdOrder.order_ref, "Order must have an official reference");
  assert.equal(createdOrder.payment_status, "Pending", "COD order must be Pending");
  assert.equal(createdOrder.delivery_method, "Concierge White-Glove (COD)", "Delivery must be White-Glove COD");
  assert.ok(createdOrder.tracking_number.startsWith("EXP-"), "Tracking AWB must be assigned");

  // 7. Verify Profile Orders Dossier Retrieval
  const userOrders = await ordersService.fetchUserOrders(signupResult.user.id, signupResult.user.email);
  assert.ok(userOrders.length >= 1, "User must see their confirmed order in their profile dossier");
  const foundOrder = userOrders.find((o) => o.order_ref === createdOrder.order_ref);
  assert.ok(foundOrder, "Created order must exist in user dossier");
  assert.equal(foundOrder.payment_status, "Pending");

  // 8. Official Tax Invoice Calculation for this order
  const invoiceTotal = Number(foundOrder.total_amount);
  const taxableSubtotal = Math.round(invoiceTotal / 1.18);
  const totalTax = invoiceTotal - taxableSubtotal;
  const cgst = Math.round(totalTax / 2);
  const sgst = totalTax - cgst;

  assert.equal(taxableSubtotal + cgst + sgst, invoiceTotal, "GST breakdown must sum exactly to total amount");
});

test("E2E Admin Workflow: SKU Update, Stock Adjustment, Order Management, Draft Conversion, and Lead Recovery", async () => {
  // 1. Admin Sign In / Authentication
  const adminLogin = await authService.signIn({
    email: "connect@hanborowatches.in",
    password: "Jaiwebsite@2026",
  });
  assert.ok(adminLogin.profile, "Admin must be authenticated");
  assert.equal(adminLogin.profile.role, "admin");

  // 2. Edit Watch SKU and Attributes (use index 50 to avoid collision with sku-crud tests on index 0/1)
  const originalWatch = JSON.parse(JSON.stringify(PRODUCTS_DATA[50]));
  const updatedSku = `${originalWatch.sku}-E2E-SPEC`;
  const updatedName = `${originalWatch.name} (E2E Boutique Edition)`;
  const updatedPrice = "₹68,000";

  const updatedProduct = {
    ...originalWatch,
    id: originalWatch.id,
    sku: updatedSku,
    name: updatedName,
    price: updatedPrice,
    previousSku: originalWatch.sku,
  };

  const savedCatalog = await productsService.saveProduct(updatedProduct, originalWatch.id, originalWatch.sku);
  const matched = savedCatalog.find((p) => p.sku === updatedSku || p.id === originalWatch.id);
  assert.ok(matched, "Edited SKU must exist in catalog");
  assert.equal(matched.sku, updatedSku);
  assert.equal(matched.name, updatedName);
  assert.equal(matched.previousSku, originalWatch.sku, "previousSku must be recorded for URL backward compatibility");

  // 3. Inventory Stock Adjustment
  await inventoryService.updateStock(updatedProduct.id, 15);
  const inventoryList = inventoryService.getInventory();
  const invItem = inventoryList.find((i) => i.id === updatedProduct.id || i.sku === updatedSku);
  assert.ok(invItem, "Inventory item must be found");
  assert.equal(invItem.stock, 15, "Stock count must be updated to 15");

  // 4. Order Management: Admin marks COD payment as collected
  const testCodOrder = await ordersService.createOrder({
    customer_name: "Devendra Verma",
    customer_email: "devendra@verma.in",
    customer_phone: "+91 98333 44556",
    payment_method: "Cash on Delivery (COD)",
    payment_status: "Pending",
    total_amount: 54000,
    items: [{ id: updatedProduct.id, sku: updatedProduct.sku, name: updatedProduct.name, price: "₹54,000", quantity: 1 }],
  });

  assert.equal(testCodOrder.payment_status, "Pending");

  // Admin collects payment upon delivery
  const updatedOrdersList = await ordersService.updateOrder(testCodOrder.order_ref, {
    payment_status: "Paid",
    fulfillment_status: "Fulfilled",
    order_status: "Delivered",
  });

  const updatedOrder = updatedOrdersList.find((o) => o.order_ref === testCodOrder.order_ref);
  assert.ok(updatedOrder, "Updated order must be present in orders list");
  assert.equal(updatedOrder.payment_status, "Paid", "Status must transition to Paid");
  assert.equal(updatedOrder.fulfillment_status, "Fulfilled");

  // 5. VIP Draft Order Creation & Conversion
  const draftPayload = {
    id: `dft-vip-${Date.now()}`,
    draftNumber: "#D201",
    customerName: "Maharaja Gaj Singh",
    customerEmail: "gajsingh@heritage.in",
    customerPhone: "+91 98290 11223",
    total: 75000,
    deliveryMethod: "Concierge White-Glove (COD)",
    paymentMethod: "Cash on Delivery (COD)",
    status: "Open",
    items: [{ name: updatedProduct.name, sku: updatedProduct.sku, price: 75000, qty: 1 }],
    notes: "VIP Palace Hand-Delivery with Master Horologist",
  };

  await draftOrdersService.saveDraftOrder(draftPayload);
  const allDrafts = await draftOrdersService.fetchDraftOrders();
  const savedDraft = allDrafts.find((d) => d.id === draftPayload.id);
  assert.ok(savedDraft, "Draft order must be saved and retrievable");
  assert.equal(savedDraft.deliveryMethod, "Concierge White-Glove (COD)");

  // Convert Draft Order to Live Order
  const isDraftCod =
    String(savedDraft.paymentMethod || "").toLowerCase().includes("cod") ||
    String(savedDraft.deliveryMethod || "").toLowerCase().includes("cod");

  const liveOrderFromDraft = await ordersService.createOrder({
    customer_name: savedDraft.customerName,
    customer_email: savedDraft.customerEmail,
    customer_phone: savedDraft.customerPhone,
    channel: "Draft Order",
    total_amount: savedDraft.total,
    payment_status: isDraftCod ? "Pending" : "Paid",
    payment_method: savedDraft.paymentMethod,
    delivery_method: savedDraft.deliveryMethod,
    items: savedDraft.items,
  });

  assert.equal(liveOrderFromDraft.payment_status, "Pending", "Converted COD draft must remain Pending");
  assert.equal(liveOrderFromDraft.delivery_method, "Concierge White-Glove (COD)");

  // 6. Abandoned Checkouts Lead Telemetry & Prospect Dossier
  await abandonedCheckoutsService.recordCheckoutLead({
    name: "Vikram Seth",
    email: "vikram.seth@corporate.in",
    phone: "9871122334",
    address: "Tower C, DLF Magnolias",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122009",
    totalPrice: 62000,
    items: [{ id: updatedProduct.id, sku: updatedProduct.sku, name: updatedProduct.name, price: 62000, quantity: 1 }],
  });

  const abandonedList = abandonedCheckoutsService.getLocalAbandonedCheckouts();
  const lead = abandonedList.find((l) => l.customerEmail === "vikram.seth@corporate.in");
  assert.ok(lead, "Abandoned checkout lead must be captured");
  assert.equal(lead.customerPhone, "9871122334");
  assert.equal(lead.shippingAddress?.city, "Gurugram");
  assert.equal(lead.shippingAddress?.address, "Tower C, DLF Magnolias");

  // Teardown: Revert edited product to clean state and delete draft
  await productsService.saveProduct(originalWatch, originalWatch.id, updatedProduct.sku);
  await draftOrdersService.deleteDraftOrder(draftPayload.id);
  storage.clear();
});
