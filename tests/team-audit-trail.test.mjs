import test from "node:test";
import assert from "node:assert/strict";
import {
  teamAuditService,
  productsService,
  ordersService,
  profilesService,
  discountsService,
  safeStorage,
  STORAGE_KEYS,
} from "../src/supabaseClient.js";

test("teamAuditService initializes with Genesis activation event if empty ('from now onwards')", () => {
  // Clear any existing cache to test genesis seeding
  safeStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);

  const logs = teamAuditService.getAuditLogs();
  assert.ok(Array.isArray(logs), "Audit logs must be an array");
  assert.ok(logs.length >= 1, "Must contain at least 1 genesis entry");
  const genesis = logs[0];
  assert.equal(genesis.action, "SYSTEM_INITIALIZED");
  assert.equal(genesis.category, "Security");
  assert.ok(genesis.summary.includes("from now onwards"));
  assert.ok(genesis.id.startsWith("audit-"));
  assert.ok(genesis.timestamp, "Must have an ISO timestamp");
});

test("teamAuditService.recordLog adds structured event to the top of ledger", () => {
  const newLog = teamAuditService.recordLog({
    category: "Catalogue",
    action: "PRODUCT_EDIT",
    actor: "atelier.horologist@hanboro.com",
    actorRole: "Horology Master",
    target: "HNB-ASTRO-BLK",
    summary: "Updated Astroworld Tourbillon pricing to ₹42,000",
    details: {
      sku: "HNB-ASTRO-BLK",
      price: "₹42,000",
      previousPrice: "₹40,499",
      diffs: ["Price: ₹40,499 → ₹42,000"],
    },
  });

  assert.ok(newLog, "recordLog must return the created log entry");
  assert.equal(newLog.category, "Catalogue");
  assert.equal(newLog.action, "PRODUCT_EDIT");
  assert.equal(newLog.actor, "atelier.horologist@hanboro.com");
  assert.equal(newLog.target, "HNB-ASTRO-BLK");
  assert.equal(newLog.details.sku, "HNB-ASTRO-BLK");

  const latestLogs = teamAuditService.getAuditLogs();
  assert.equal(latestLogs[0].id, newLog.id, "Latest recorded log must be the first item in the ledger");
});

test("teamAuditService subscribers receive real-time updates", () => {
  let receivedLogs = null;
  const unsubscribe = teamAuditService.subscribe((logs) => {
    receivedLogs = logs;
  });

  teamAuditService.recordLog({
    category: "Security",
    action: "TEST_HEARTBEAT",
    actor: "QA Test Runner",
    summary: "Validation heartbeat ping",
  });

  assert.ok(receivedLogs, "Subscriber should have received updated logs");
  assert.equal(receivedLogs[0].action, "TEST_HEARTBEAT");

  // Cleanup subscriber
  unsubscribe();
});

test("productsService.saveProduct automatically logs PRODUCT_EDIT with diffs", async () => {
  const testSku = "HNB-TEST-AUDIT-01";
  const testProduct = {
    id: "test-watch-audit-01",
    sku: testSku,
    name: "Hanboro Test Chrono",
    price: "₹35,000",
    stock: 8,
    category: "AUTOMATIC",
  };

  // 1. Initial save
  await productsService.saveProduct(testProduct);

  let logs = teamAuditService.getAuditLogs();
  const createLog = logs.find((l) => l.target === testSku && (l.action === "PRODUCT_CREATE" || l.action === "PRODUCT_EDIT"));
  assert.ok(createLog, "Must have recorded an audit log for saving product");

  // 2. Edit price and stock
  await productsService.saveProduct({
    ...testProduct,
    price: "₹38,500",
    stock: 12,
  });

  logs = teamAuditService.getAuditLogs();
  const editLog = logs[0];
  assert.equal(editLog.category, "Catalogue");
  assert.equal(editLog.action, "PRODUCT_EDIT");
  assert.equal(editLog.target, testSku);
  assert.ok(editLog.summary.includes("Price:") || editLog.summary.includes(testSku));
  assert.ok(editLog.details.diffs && editLog.details.diffs.length > 0, "Must record detected diffs");

  // Cleanup
  await productsService.deleteProduct("test-watch-audit-01");
});

test("productsService.deleteProduct logs PRODUCT_DELETE in audit trail", async () => {
  const deleteSku = "HNB-DELETE-ME";
  await productsService.saveProduct({
    id: "watch-to-delete",
    sku: deleteSku,
    name: "Watch To Delete",
    price: "₹20,000",
  });

  await productsService.deleteProduct("watch-to-delete");

  const logs = teamAuditService.getAuditLogs();
  const delLog = logs[0];
  assert.equal(delLog.action, "PRODUCT_DELETE");
  assert.equal(delLog.category, "Catalogue");
  assert.ok(delLog.summary.includes(deleteSku) || delLog.summary.includes("Watch To Delete"));
});

test("ordersService.createOrder and updateOrder record audit entries", async () => {
  const testOrderRef = `HNB-TEST-${Date.now()}`;
  const testOrder = {
    order_ref: testOrderRef,
    customer_name: "Audit Test Customer",
    customer_email: "audit.test@example.com",
    total_amount: 54000,
    payment_method: "Prepaid Razorpay",
    payment_status: "Paid",
    items: [{ sku: "HNB-SHK-01", name: "Shark Series", price: 54000, quantity: 1 }],
  };

  await ordersService.createOrder(testOrder);

  let logs = teamAuditService.getAuditLogs();
  const orderLog = logs.find((l) => l.target === testOrderRef && l.action === "ORDER_CREATED");
  assert.ok(orderLog, "Must log ORDER_CREATED for new customer order");
  assert.equal(orderLog.category, "Orders");
  assert.ok(orderLog.summary.includes(testOrderRef));
  assert.equal(orderLog.details.totalAmount, 54000);

  // Update order status
  await ordersService.updateOrder(testOrderRef, {
    order_status: "Dispatched",
    tracking_number: "EXP-992211",
  });

  logs = teamAuditService.getAuditLogs();
  const updateLog = logs[0];
  assert.equal(updateLog.category, "Orders");
  assert.equal(updateLog.action, "ORDER_STATUS_UPDATE");
  assert.ok(updateLog.summary.includes("Dispatched"));
  assert.equal(updateLog.target, testOrderRef);
});

test("profilesService.upsertProfile records CUSTOMER_REGISTERED or CUSTOMER_UPDATED", async () => {
  const testEmail = `vip.client.${Date.now()}@hanborowatches.in`;
  await profilesService.upsertProfile({
    email: testEmail,
    full_name: "Maharaja of Jodhpur",
    phone: "+91 98290 12345",
    vip_tier: "VIP Imperial Member",
  });

  const logs = teamAuditService.getAuditLogs();
  const profileLog = logs.find((l) => l.target === testEmail);
  assert.ok(profileLog, "Must log profile registration in audit trail");
  assert.equal(profileLog.category, "Customers");
  assert.ok(profileLog.action === "CUSTOMER_REGISTERED" || profileLog.action === "CUSTOMER_UPDATED");
  assert.ok(profileLog.summary.includes("Maharaja of Jodhpur"));
});

test("discountsService records DISCOUNT_SAVED and DISCOUNT_DELETED in audit ledger", async () => {
  const testPromo = `TESTAUDIT${Math.floor(100 + Math.random() * 900)}`;

  await discountsService.saveDiscount(testPromo, {
    type: "percent",
    value: 20,
    label: `${testPromo}: 20% OFF`,
  });

  let logs = teamAuditService.getAuditLogs();
  const discLog = logs[0];
  assert.equal(discLog.category, "Discounts");
  assert.equal(discLog.action, "DISCOUNT_SAVED");
  assert.equal(discLog.target, testPromo);

  await discountsService.deleteDiscount(testPromo);

  logs = teamAuditService.getAuditLogs();
  const delDiscLog = logs[0];
  assert.equal(delDiscLog.category, "Discounts");
  assert.equal(delDiscLog.action, "DISCOUNT_DELETED");
  assert.equal(delDiscLog.target, testPromo);
});

test("teamAuditService.clearAuditLogs clears history and preserves AUDIT_LEDGER_CLEARED event", () => {
  const resetLogs = teamAuditService.clearAuditLogs();
  assert.equal(resetLogs.length, 1, "Clear must leave exactly 1 reset log");
  assert.equal(resetLogs[0].action, "AUDIT_LEDGER_CLEARED");
  assert.equal(resetLogs[0].category, "Security");
  assert.ok(resetLogs[0].summary.includes("archived and reset"));
});
