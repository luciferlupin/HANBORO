import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("Admin Cleanup QA: Verify removal of Smind, Agentic AI, Facebook & IG, Marketing, and Content", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../src/AdminDashboard.jsx"), "utf-8");

  // 1. Verify Smind section is completely removed
  assert.ok(!adminCode.includes("Smind Sections"), "Admin must NOT contain Smind Sections");
  assert.ok(!adminCode.includes("IconSmind"), "Admin must NOT import or use IconSmind");

  // 2. Verify Agentic AI is completely removed
  assert.ok(!adminCode.includes("Agentic AI"), "Admin must NOT contain Agentic AI");
  assert.ok(!adminCode.includes("IconAgentic"), "Admin must NOT import or use IconAgentic");

  // 3. Verify Facebook and IG sales channel is completely removed
  assert.ok(!adminCode.includes("Facebook & Instagram"), "Admin must NOT contain Facebook & Instagram in sidebar");
  assert.ok(!adminCode.includes("IconSocial"), "Admin must NOT import or use IconSocial");

  // 4. Verify Growth & Marketing Operations is completely removed
  assert.ok(!adminCode.includes("Growth & Marketing Operations"), "Admin must NOT contain Growth & Marketing Operations");
  assert.ok(!adminCode.includes("activeTab === \"growth\""), "Admin must NOT contain growth tab view");
  assert.ok(!adminCode.includes("IconGrowth"), "Admin must NOT import or use IconGrowth");

  // 5. Verify Content & Editorial Dossiers is completely removed
  assert.ok(!adminCode.includes("Content & Editorial Dossiers"), "Admin must NOT contain Content & Editorial Dossiers");
  assert.ok(!adminCode.includes("activeTab === \"content\""), "Admin must NOT contain content tab view");

  // 6. Verify essential features remain active and intact
  assert.ok(adminCode.includes("Date & Time"), "Order book Date & Time must remain intact");
  assert.ok(adminCode.includes("activeTab === \"orders\""), "Orders tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"drafts\""), "Draft orders tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"abandoned\""), "Abandoned checkouts tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"products\""), "Products & Inventory tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"customers\""), "Customers tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"audit\""), "Team Audit tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"discounts\""), "Discounts tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"markets\""), "Markets tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"analytics\""), "Analytics tab must remain intact");
  assert.ok(adminCode.includes("activeTab === \"whatsapp\""), "WhatsApp app must remain intact");
  assert.ok(adminCode.includes("activeTab === \"settings\""), "Settings must remain intact");
});
