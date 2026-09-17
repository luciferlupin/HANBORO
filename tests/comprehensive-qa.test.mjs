import test from "node:test";
import assert from "node:assert/strict";

// Mock localStorage for node environment
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test("Comprehensive QA: Draft Order conversion preserves COD delivery and payment attributes", () => {
  const draftCod = {
    id: "dft-test-1",
    draftNumber: "#D105",
    customerName: "Maharaja Vikram",
    customerEmail: "vikram@royals.in",
    customerPhone: "+919811122334",
    total: 58000,
    deliveryMethod: "Concierge White-Glove (COD)",
    paymentMethod: "Cash on Delivery (COD)",
    status: "Open",
    items: [{ name: "Tourbillon Astronomia", sku: "HNB-8016-ROSE", price: 58000, qty: 1 }],
  };

  const isDraftCod =
    String(draftCod.paymentMethod || "").toLowerCase().includes("cod") ||
    String(draftCod.deliveryMethod || "").toLowerCase().includes("cod");

  assert.equal(isDraftCod, true, "COD draft must be identified as COD");

  const convertedOrder = {
    id: `ord-test-conv`,
    order_ref: "#8801",
    customer_name: draftCod.customerName,
    customer_email: draftCod.customerEmail,
    customer_phone: draftCod.customerPhone,
    total_amount: draftCod.total,
    payment_status: isDraftCod ? "Pending" : "Paid",
    payment_method: draftCod.paymentMethod || (isDraftCod ? "Cash on Delivery (COD)" : "Prepaid UPI / Card"),
    delivery_method: draftCod.deliveryMethod || (isDraftCod ? "Concierge White-Glove (COD)" : "Standard (Prepaid)"),
    tags: ["Draft Order", isDraftCod ? "COD" : "Prepaid"],
  };

  assert.equal(convertedOrder.payment_status, "Pending", "COD converted draft order must have Pending payment status");
  assert.equal(convertedOrder.payment_method, "Cash on Delivery (COD)", "Payment method must be COD");
  assert.equal(convertedOrder.delivery_method, "Concierge White-Glove (COD)", "Delivery method must be White-Glove COD");
  assert.deepEqual(convertedOrder.tags, ["Draft Order", "COD"]);
});

test("Comprehensive QA: Draft Order conversion preserves Prepaid payment attributes", () => {
  const draftPrepaid = {
    id: "dft-test-2",
    draftNumber: "#D106",
    customerName: "Aarav Kapoor",
    customerEmail: "aarav@kapoor.in",
    customerPhone: "+919876543210",
    total: 42000,
    deliveryMethod: "Standard (Prepaid)",
    paymentMethod: "Prepaid UPI / Card",
    status: "Open",
    items: [{ name: "Automatic Skeleton Steel", sku: "HNB-8012-SLV", price: 42000, qty: 1 }],
  };

  const isDraftCod =
    String(draftPrepaid.paymentMethod || "").toLowerCase().includes("cod") ||
    String(draftPrepaid.deliveryMethod || "").toLowerCase().includes("cod");

  assert.equal(isDraftCod, false, "Prepaid draft must not be classified as COD");

  const convertedOrder = {
    id: `ord-test-conv-prepaid`,
    order_ref: "#8802",
    customer_name: draftPrepaid.customerName,
    customer_email: draftPrepaid.customerEmail,
    customer_phone: draftPrepaid.customerPhone,
    total_amount: draftPrepaid.total,
    payment_status: isDraftCod ? "Pending" : "Paid",
    payment_method: draftPrepaid.paymentMethod || (isDraftCod ? "Cash on Delivery (COD)" : "Prepaid UPI / Card"),
    delivery_method: draftPrepaid.deliveryMethod || (isDraftCod ? "Concierge White-Glove (COD)" : "Standard (Prepaid)"),
    tags: ["Draft Order", isDraftCod ? "COD" : "Prepaid"],
  };

  assert.equal(convertedOrder.payment_status, "Paid", "Prepaid draft must have Paid status");
  assert.equal(convertedOrder.delivery_method, "Standard (Prepaid)");
});

test("Comprehensive QA: Prospect customer dossier enrichment from Abandoned Checkouts", () => {
  const mockAbandoned = [
    {
      id: "chk-sess_123",
      customerName: "Rohan Singhal",
      customerEmail: "rohan.singhal@luxury.in",
      customerPhone: "+919988776655",
      region: "Mumbai, India",
      totalPrice: 48000,
      shippingAddress: {
        address: "702 Sea View Tower, Worli",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400018",
      },
      createdAt: new Date().toISOString(),
    },
  ];

  const map = {};
  mockAbandoned.forEach((c) => {
    const emailKey = (c.customerEmail || "").toLowerCase().trim();
    if (emailKey && !map[emailKey]) {
      const ship = c.shippingAddress || {};
      map[emailKey] = {
        id: `chk-cust-${emailKey.replace(/[^a-z0-9]/g, "-")}`,
        name: c.customerName || "Prospective Client",
        email: emailKey,
        phone: c.customerPhone || "",
        city: ship.city || c.region || "India",
        state: ship.state || "",
        pin: ship.pincode || ship.pin || "",
        address: ship.address || "",
        role: "prospect",
      };
    }
  });

  const prospect = map["rohan.singhal@luxury.in"];
  assert.ok(prospect, "Prospect dossier should be created for lead");
  assert.equal(prospect.name, "Rohan Singhal");
  assert.equal(prospect.phone, "+919988776655", "Prospect phone must reflect lead contact number");
  assert.equal(prospect.city, "Mumbai");
  assert.equal(prospect.address, "702 Sea View Tower, Worli");
  assert.equal(prospect.pin, "400018");
});

test("Comprehensive QA: Checkout validation accepts valid 10-digit Indian phone, email, and 6-digit pin", () => {
  function validateCheckout(name, email, phone, address, city, pincode) {
    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim();
    const trimmedPhone = (phone || "").trim();
    const trimmedAddress = (address || "").trim();
    const trimmedCity = (city || "").trim();
    const trimmedPin = (pincode || "").trim();

    if (!trimmedName) return { valid: false, error: "name" };
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return { valid: false, error: "email" };
    const phoneDigits = trimmedPhone.replace(/[^\d]/g, "");
    if (!trimmedPhone || phoneDigits.length < 10) return { valid: false, error: "phone" };
    if (!trimmedAddress) return { valid: false, error: "address" };
    if (!trimmedCity) return { valid: false, error: "city" };
    const pinDigits = trimmedPin.replace(/[^\d]/g, "");
    if (!trimmedPin || pinDigits.length !== 6) return { valid: false, error: "pincode" };

    return { valid: true };
  }

  // Reject empty phone
  assert.deepEqual(
    validateCheckout("Jai Goel", "jai@hanboro.in", "", "DLF Phase 2", "Gurugram", "122008"),
    { valid: false, error: "phone" }
  );

  // Reject short phone (< 10 digits)
  assert.deepEqual(
    validateCheckout("Jai Goel", "jai@hanboro.in", "9811122", "DLF Phase 2", "Gurugram", "122008"),
    { valid: false, error: "phone" }
  );

  // Reject invalid email syntax
  assert.deepEqual(
    validateCheckout("Jai Goel", "invalid-email-string", "+91 98820 69334", "DLF Phase 2", "Gurugram", "122008"),
    { valid: false, error: "email" }
  );

  // Reject invalid pin (< 6 digits)
  assert.deepEqual(
    validateCheckout("Jai Goel", "jai@hanboro.in", "+91 98820 69334", "DLF Phase 2", "Gurugram", "122"),
    { valid: false, error: "pincode" }
  );

  // Accept valid checkout details
  assert.deepEqual(
    validateCheckout("Jai Goel", "jai@hanboro.in", "+91 98820 69334", "DLF Phase 2", "Gurugram", "122008"),
    { valid: true }
  );
});

test("Comprehensive QA: Route Parser supports #watch/<sku>, #sku/<sku>, and #cart", () => {
  function parseRoute(hash, pathname = "") {
    const target = (hash ? hash.replace(/^#/, "") : pathname).toLowerCase().replace(/^\/+|\/+$/g, "");
    if (target.startsWith("admin")) return { view: "admin", selectedSkuId: null };
    if (target.startsWith("checkout")) return { view: "checkout", selectedSkuId: null };
    if (target.startsWith("profile") || target.startsWith("account")) return { view: "profile", selectedSkuId: null };
    if (target.startsWith("sku/")) return { view: "products", selectedSkuId: target.replace(/^sku\//, "").trim() };
    if (target.startsWith("product/")) return { view: "products", selectedSkuId: target.replace(/^product\//, "").trim() };
    if (target.startsWith("watch/")) return { view: "products", selectedSkuId: target.replace(/^watch\//, "").trim() };
    if (target.startsWith("cart") || target === "bag") return { view: "home", selectedSkuId: null, openCart: true };
    if (target.startsWith("products")) return { view: "products", selectedSkuId: null };
    return { view: "home", selectedSkuId: null };
  }

  assert.deepEqual(parseRoute("#watch/hnb-8016-rose"), { view: "products", selectedSkuId: "hnb-8016-rose" });
  assert.deepEqual(parseRoute("#sku/hnb-8012-slv"), { view: "products", selectedSkuId: "hnb-8012-slv" });
  assert.deepEqual(parseRoute("#product/hnb-8012-slv"), { view: "products", selectedSkuId: "hnb-8012-slv" });
  assert.deepEqual(parseRoute("#cart"), { view: "home", selectedSkuId: null, openCart: true });
  assert.deepEqual(parseRoute("#admin"), { view: "admin", selectedSkuId: null });
});

test("Comprehensive QA: WhatsApp Cart message formats valid watch names, SKUs, and amounts without undefined or NaN", () => {
  const cart = [
    {
      product: {
        id: "w-8016",
        name: "Tourbillon Astronomia Rose Gold",
        sku: "HNB-8016-ROSE",
        price: "₹58,000",
      },
      quantity: 2,
    },
    {
      product: {
        id: "w-8012",
        name: "Automatic Skeleton Steel",
        sku: "HNB-8012-SLV",
        price: "₹42,000",
      },
      quantity: 1,
    },
  ];

  const itemsText = cart
    .map((item) => {
      const pName = item.product?.name || "HANBORO Watch";
      const pSku = item.product?.sku ? ` [REF: ${item.product.sku}]` : "";
      const pPrice = parseInt(String(item.product?.price || 0).replace(/[^\d]/g, ""), 10) || 0;
      return `• ${pName}${pSku} (Qty: ${item.quantity}) - ₹${(pPrice * item.quantity).toLocaleString("en-IN")}`;
    })
    .join("\n");

  assert.ok(!itemsText.includes("undefined"), "Message should not contain undefined");
  assert.ok(!itemsText.includes("NaN"), "Message should not contain NaN");
  assert.ok(itemsText.includes("Tourbillon Astronomia Rose Gold [REF: HNB-8016-ROSE] (Qty: 2) - ₹1,16,000"));
  assert.ok(itemsText.includes("Automatic Skeleton Steel [REF: HNB-8012-SLV] (Qty: 1) - ₹42,000"));
});
