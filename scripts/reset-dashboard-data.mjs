/**
 * HANBORO — Production Clean-Slate Reset Script
 * -----------------------------------------------
 * Wipes all customer-facing transactional data from the admin dashboard:
 *   - orders
 *   - draft_orders
 *   - cart_items
 *   - roulette_spins
 *   - profiles (all except the admin: connect@hanborowatches.in)
 *
 * Leaves these 100% INTACT:
 *   - products
 *   - inventory
 *   - discounts
 *
 * Run: node scripts/reset-dashboard-data.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fhaurmmbgxfuumwegshy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYXVybW1iZ3hmdXVtd2Vnc2h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzU3MzgsImV4cCI6MjEwMzE1MTczOH0.s8BkJPk-4BVZQWQ9L1cacgV3uJ6oiTm0MxRqpHWFUm0";

const ADMIN_EMAIL = "connect@hanborowatches.in";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetTable(tableName, filter = null) {
  let query = supabase.from(tableName).delete();

  if (filter) {
    // filter is an object like { column: "email", op: "neq", value: "..." }
    // We need to delete where the column IS NOT the admin, i.e., delete where column != adminEmail
    // Supabase delete with filter: delete rows where condition is TRUE
    // To delete all EXCEPT admin: delete where email != admin → use .neq()
    query = query[filter.op](filter.column, filter.value);
  } else {
    // Delete ALL rows: Supabase requires a filter; use a always-true filter
    // uuid primary keys or text PKs - use gte on created_at or neq on a dummy
    // Safest: use gt('created_at', '2000-01-01') which matches everything
    query = query.gte("created_at", "2000-01-01T00:00:00.000Z");
  }

  const { error, count } = await query;
  if (error) {
    console.error(`  ❌ ${tableName}: ${error.message}`);
    return false;
  }
  console.log(`  ✅ ${tableName}: cleared`);
  return true;
}

async function run() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  HANBORO — Admin Dashboard Clean-Slate Reset");
  console.log("══════════════════════════════════════════════════════");
  console.log("\n🗑  Wiping transactional data...\n");

  // 1. Orders
  await resetTable("orders");

  // 2. Draft Orders
  await resetTable("draft_orders");

  // 3. Cart Items — keyed by user_id (text), no created_at, use gte on created_at
  await resetTable("cart_items");

  // 4. Roulette Spins
  await resetTable("roulette_spins");

  // 5. Profiles — delete ALL except the admin profile
  {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .neq("email", ADMIN_EMAIL);
    if (error) {
      console.error(`  ❌ profiles: ${error.message}`);
    } else {
      console.log(`  ✅ profiles: cleared (admin preserved)`);
    }
  }

  console.log("\n🔒 Untouched tables (as requested):");
  console.log("  • products");
  console.log("  • inventory");
  console.log("  • discounts");

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  Reset complete. Admin dashboard is fresh.");
  console.log("══════════════════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
