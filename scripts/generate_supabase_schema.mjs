import fs from "fs";
import { PRODUCTS_DATA } from "../src/productsData.js";

function escapeSql(str) {
  if (str === null || str === undefined) return "NULL";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function escapeJson(obj) {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

let sql = `-- ==============================================================================
-- HANBORO HAUTE HORLOGERIE - OFFICIAL SUPABASE MASTER SCHEMA & MIGRATIONS
-- Project Ref: fhaurmmbgxfuumwegshy
--
-- HOW TO USE:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/fhaurmmbgxfuumwegshy
-- 2. Go to SQL Editor -> "+ New Query"
-- 3. Paste this ENTIRE file into the editor and click "Run" (CMD+Enter or CTRL+Enter)
-- 4. All tables, columns, RLS security policies, and 84 master timepiece SKUs will be created & seeded.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE (Customers, VIPs & Concierge Staff)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    shipping_info JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. CART ITEMS TABLE (Live Persistent Shopping Bags & Abandoned Checkouts)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    sku TEXT,
    name TEXT,
    price TEXT,
    price_usd TEXT,
    quantity INTEGER DEFAULT 1,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. ORDERS TABLE (Storefront Purchases, Draft Conversions & Allocations)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    order_ref TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL DEFAULT 'Credit Card (Encrypted)',
    payment_status TEXT DEFAULT 'Paid',
    order_status TEXT DEFAULT 'Processing',
    fulfillment_status TEXT DEFAULT 'Unfulfilled',
    delivery_status TEXT DEFAULT 'Processing',
    delivery_method TEXT DEFAULT 'Standard (Prepaid)',
    channel TEXT DEFAULT 'Online Store',
    tracking_number TEXT,
    items_count TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    discount_applied JSONB,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrations for existing orders table (if table already exists in Supabase)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'Unfulfilled';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'Processing';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'Standard (Prepaid)';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'Online Store';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_count TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_applied JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. PRODUCTS TABLE (Dynamic Horological Catalog & SKU Directory)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT,
    collection TEXT NOT NULL DEFAULT 'TOURBILLON',
    collection_name TEXT NOT NULL DEFAULT 'Tourbillon & Complications',
    tag TEXT DEFAULT 'Haute Horlogerie',
    price TEXT NOT NULL,
    price_usd TEXT,
    availability TEXT DEFAULT 'In Stock',
    year TEXT DEFAULT '2026',
    summary TEXT,
    image TEXT NOT NULL,
    transparent_image TEXT,
    alt_images JSONB DEFAULT '[]'::jsonb,
    gallery JSONB DEFAULT '[]'::jsonb,
    specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    stock INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrations for existing products table if any columns are missing
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS transparent_image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS alt_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. INVENTORY TABLE (Multi-Warehouse Stock Counts & Delta Adjustments)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    collection TEXT DEFAULT 'Tourbillon & Complications',
    stock INTEGER DEFAULT 10,
    price_inr NUMERIC,
    price_usd NUMERIC,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS collection TEXT DEFAULT 'Tourbillon & Complications';
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS image TEXT;

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. ROULETTE SPINS TABLE (Privilege Wheel & Single-Use Customer Vouchers)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roulette_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_identifier TEXT UNIQUE NOT NULL,
    winning_pocket INTEGER,
    winning_color TEXT,
    discount_tier TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC NOT NULL,
    voucher_code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    used_order_ref TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. DRAFT ORDERS TABLE (Shopify-Style Phone/VIP Concierge Order Preparation)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.draft_orders (
    id TEXT PRIMARY KEY,
    draft_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'Open',
    items JSONB DEFAULT '[]'::jsonb,
    delivery_method TEXT DEFAULT 'Standard (Prepaid)',
    payment_method TEXT DEFAULT 'Prepaid UPI / Card',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. DISCOUNTS & PROMO CODES TABLE (Shopify-Style Vouchers & Marketing Codes)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.discounts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'percent',
    value NUMERIC NOT NULL DEFAULT 15,
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY (RLS) & PUBLIC ANON ACCESS POLICIES
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Anon public full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon public full access cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Anon public full access orders" ON public.orders;
DROP POLICY IF EXISTS "Anon public full access products" ON public.products;
DROP POLICY IF EXISTS "Anon public full access inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anon public full access roulette_spins" ON public.roulette_spins;
DROP POLICY IF EXISTS "Anon public full access draft_orders" ON public.draft_orders;
DROP POLICY IF EXISTS "Anon public full access discounts" ON public.discounts;

-- Create ultra-permissive policies for storefront & atelier portal
CREATE POLICY "Anon public full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access cart_items" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access roulette_spins" ON public.roulette_spins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access draft_orders" ON public.draft_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access discounts" ON public.discounts FOR ALL USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. HIGH-PERFORMANCE DATABASE INDICES
-- ──────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders (order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_collection ON public.products (collection);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory (sku);
CREATE INDEX IF NOT EXISTS idx_roulette_identifier ON public.roulette_spins (customer_identifier);
CREATE INDEX IF NOT EXISTS idx_roulette_voucher ON public.roulette_spins (voucher_code);
CREATE INDEX IF NOT EXISTS idx_draft_orders_num ON public.draft_orders (draft_number);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts (code);

-- ──────────────────────────────────────────────────────────────────────────────
-- 11. SEED PROMO DISCOUNTS
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO public.discounts (id, code, type, value, label, is_active)
VALUES
  ('dsc-welcome10', 'WELCOME10', 'percent', 10, 'WELCOME10: 10% Welcome Concession', true),
  ('dsc-royal15', 'ROYAL15', 'percent', 15, 'ROYAL15: 15% Atelier Privilege', true),
  ('dsc-hanborovip', 'HANBOROVIP', 'flat', 25000, 'HANBOROVIP: ₹25,000 Private Client Concession', true),
  ('dsc-sihh2026', 'SIHH2026', 'percent', 20, 'SIHH2026: 20% Geneva Watch Fair Celebration', true)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active;

-- ──────────────────────────────────────────────────────────────────────────────
-- 12. SEED MASTER TIMEPIECE CATALOG & INVENTORY (84 WATCH SKUs)
-- ──────────────────────────────────────────────────────────────────────────────
`;

for (let i = 0; i < PRODUCTS_DATA.length; i++) {
  const p = PRODUCTS_DATA[i];
  const stock = Math.max(1, 12 - (i % 8));
  const priceNum = parseInt(String(p.price || "0").replace(/[^\d]/g, ""), 10) || 45000;
  const priceUsdNum = parseInt(String(p.priceUsd || "0").replace(/[^\d]/g, ""), 10) || 550;

  sql += `
-- ${i + 1}. ${p.name} (${p.sku})
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    ${escapeSql(p.id)},
    ${escapeSql(p.sku)},
    ${escapeSql(p.name)},
    ${escapeSql(p.subtitle || "")},
    ${escapeSql(p.collection || "TOURBILLON")},
    ${escapeSql(p.collectionName || "Tourbillon & Complications")},
    ${escapeSql(p.tag || "Haute Horlogerie")},
    ${escapeSql(p.price)},
    ${escapeSql(p.priceUsd || "$1,200")},
    ${escapeSql(p.availability || "In Stock")},
    ${escapeSql(p.year || "2026")},
    ${escapeSql(p.summary || "")},
    ${escapeSql(p.image)},
    ${escapeSql(p.transparentImage || p.image)},
    ${escapeJson(p.altImages || [p.image])},
    ${escapeJson(p.gallery || [])},
    ${escapeJson(p.specs || {})},
    ${stock},
    true
)
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    subtitle = EXCLUDED.subtitle,
    collection = EXCLUDED.collection,
    collection_name = EXCLUDED.collection_name,
    tag = EXCLUDED.tag,
    price = EXCLUDED.price,
    price_usd = EXCLUDED.price_usd,
    availability = EXCLUDED.availability,
    year = EXCLUDED.year,
    summary = EXCLUDED.summary,
    image = EXCLUDED.image,
    transparent_image = EXCLUDED.transparent_image,
    alt_images = EXCLUDED.alt_images,
    gallery = EXCLUDED.gallery,
    specs = EXCLUDED.specs,
    stock = EXCLUDED.stock,
    is_active = EXCLUDED.is_active;

INSERT INTO public.inventory (
    id, sku, name, collection, stock, price_inr, price_usd, image, is_active
) VALUES (
    ${escapeSql(p.id)},
    ${escapeSql(p.sku)},
    ${escapeSql(p.name)},
    ${escapeSql(p.collectionName || p.collection)},
    ${stock},
    ${priceNum},
    ${priceUsdNum},
    ${escapeSql(p.image)},
    true
)
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    collection = EXCLUDED.collection,
    stock = EXCLUDED.stock,
    price_inr = EXCLUDED.price_inr,
    price_usd = EXCLUDED.price_usd,
    image = EXCLUDED.image,
    is_active = EXCLUDED.is_active;
`;
}

fs.writeFileSync("./src/supabase_schema.sql", sql, "utf8");
console.log("Successfully generated ./src/supabase_schema.sql with", PRODUCTS_DATA.length, "watches!");
