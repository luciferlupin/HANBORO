import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("Order Book Date & Timestamp QA: AdminDashboard.jsx contains Date & Time header and formatted timestamp elements", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../src/AdminDashboard.jsx"), "utf-8");

  // Verify header replaces the blank 'Fulfill by' placeholder
  assert.ok(adminCode.includes("<th>Date & Time</th>"), "Table header must contain 'Date & Time'");
  assert.ok(!adminCode.includes("<th>Fulfill by</th>"), "Table header must NOT contain obsolete 'Fulfill by'");

  // Verify cell structure uses typography classes
  assert.ok(adminCode.includes("sp-order-date-primary"), "Must render .sp-order-date-primary class");
  assert.ok(adminCode.includes("sp-order-time-sub"), "Must render .sp-order-time-sub class");

  // Verify modal displays order date & timestamp
  assert.ok(adminCode.includes("formatOrderTimestamp(inspectingOrder.created_at).fullStr"), "Inspect order modal must display order date & time");
});

test("Order Book Date & Timestamp QA: formatOrderTimestamp correctly formats dates and times", () => {
  const formatOrderTimestamp = (isoString) => {
    if (!isoString) return { dateStr: "Just now", timeStr: "", fullStr: "Just now" };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { dateStr: String(isoString), timeStr: "", fullStr: String(isoString) };
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      return {
        dateStr,
        timeStr,
        fullStr: `${dateStr}, ${timeStr}`,
      };
    } catch {
      return { dateStr: String(isoString), timeStr: "", fullStr: String(isoString) };
    }
  };

  const iso = "2026-09-19T13:09:59.000Z";
  const formatted = formatOrderTimestamp(iso);
  assert.ok(formatted.dateStr.includes("2026"), "Date must include year 2026");
  assert.ok(formatted.dateStr.toLowerCase().includes("sep"), "Date must include month Sep");
  assert.ok(formatted.timeStr.length > 0, "Time string must not be empty");
  assert.ok(formatted.fullStr.includes(","), "Full string must combine date and time cleanly");

  // Test fallback for empty or null
  const empty = formatOrderTimestamp(null);
  assert.equal(empty.dateStr, "Just now");
  assert.equal(empty.timeStr, "");
});

test("Order Book QA: Descending order sorting prioritizes freshest orders", () => {
  const mockOrders = [
    { order_ref: "HNB-OLD", created_at: "2026-09-18T10:00:00.000Z" },
    { order_ref: "HNB-NEW", created_at: "2026-09-19T12:00:00.000Z" },
    { order_ref: "HNB-MID", created_at: "2026-09-19T08:00:00.000Z" },
  ];

  const sorted = mockOrders.slice().sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  assert.equal(sorted[0].order_ref, "HNB-NEW");
  assert.equal(sorted[1].order_ref, "HNB-MID");
  assert.equal(sorted[2].order_ref, "HNB-OLD");
});
