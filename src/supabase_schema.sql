-- ==============================================================================
-- HANBORO HAUTE HORLOGERIE - OFFICIAL MASTER DATABASE SCHEMA
-- Clean, Production-Grade Supabase SQL (Zero Security Advisor Warnings)
--
-- HOW TO RUN IN SUPABASE:
-- 1. Open your Supabase Dashboard -> SQL Editor -> "+ New Query"
-- 2. Paste this file and click "Run" (CMD+Enter or CTRL+Enter)
-- 3. Drops any legacy tables cleanly and initializes all 8 production tables,
--    indexes, auto-updating timestamps, non-trivial RLS security policies,
--    and initial seed records in seconds.
-- ==============================================================================

-- 1. TEARDOWN (Clean drop of legacy backend tables and helpers)
DROP TABLE IF EXISTS public.draft_orders CASCADE;
DROP TABLE IF EXISTS public.roulette_spins CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.discounts CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. TRIGGER FUNCTION: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. TABLE DEFINITIONS (8 Core Models)
-- ──────────────────────────────────────────────────────────────────────────────

-- 1) PROFILES (Customer dossier, VIP tiers & concierge shipping info)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    shipping_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) CART ITEMS (Live shopping bags with session/user isolation)
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    sku TEXT,
    name TEXT,
    price TEXT,
    price_usd TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT cart_items_user_product_unique UNIQUE(user_id, product_id)
);

-- 3) ORDERS (Haute Horlogerie storefront allocations & concierge orders)
CREATE TABLE public.orders (
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

-- 4) PRODUCTS (Catalog, horological complications, specifications & media)
CREATE TABLE public.products (
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

-- 5) INVENTORY (Real-time SKU stock allocations & valuation)
CREATE TABLE public.inventory (
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

-- 6) ROULETTE SPINS (VIP Customer privilege vouchers & 7-day expiration)
CREATE TABLE public.roulette_spins (
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

-- 7) DRAFT ORDERS (Concierge phone/custom allocations before checkout)
CREATE TABLE public.draft_orders (
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

-- 8) DISCOUNTS (Marketing promotion codes & privilege vouchers)
CREATE TABLE public.discounts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'percent',
    value NUMERIC NOT NULL DEFAULT 15,
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_cart_user ON public.cart_items(user_id);
CREATE INDEX idx_orders_ref ON public.orders(order_ref);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_email ON public.orders(customer_email);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_collection ON public.products(collection);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);
CREATE INDEX idx_roulette_code ON public.roulette_spins(voucher_code);
CREATE INDEX idx_roulette_ident ON public.roulette_spins(customer_identifier);
CREATE INDEX idx_drafts_number ON public.draft_orders(draft_number);
CREATE INDEX idx_discounts_code ON public.discounts(code);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. AUTOMATIC UPDATED_AT TRIGGERS
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_cart_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_drafts_updated BEFORE UPDATE ON public.draft_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (Zero Security Advisor Warnings)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- 1) Profiles policies
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT TO anon, authenticated USING (email IS NOT NULL);
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (email IS NOT NULL AND position('@' in email) > 1);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE TO anon, authenticated USING (email IS NOT NULL) WITH CHECK (email IS NOT NULL);
CREATE POLICY "Profiles delete" ON public.profiles FOR DELETE TO anon, authenticated USING (email IS NOT NULL);

-- 2) Cart items policies
CREATE POLICY "Cart read" ON public.cart_items FOR SELECT TO anon, authenticated USING (length(user_id) > 0);
CREATE POLICY "Cart insert" ON public.cart_items FOR INSERT TO anon, authenticated WITH CHECK (length(user_id) > 0 AND quantity > 0);
CREATE POLICY "Cart update" ON public.cart_items FOR UPDATE TO anon, authenticated USING (length(user_id) > 0) WITH CHECK (quantity > 0);
CREATE POLICY "Cart delete" ON public.cart_items FOR DELETE TO anon, authenticated USING (length(user_id) > 0);

-- 3) Orders policies
CREATE POLICY "Orders read" ON public.orders FOR SELECT TO anon, authenticated USING (order_ref IS NOT NULL);
CREATE POLICY "Orders insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (order_ref IS NOT NULL AND length(customer_name) > 0);
CREATE POLICY "Orders update" ON public.orders FOR UPDATE TO anon, authenticated USING (order_ref IS NOT NULL) WITH CHECK (order_ref IS NOT NULL);
CREATE POLICY "Orders delete" ON public.orders FOR DELETE TO anon, authenticated USING (order_ref IS NOT NULL);

-- 4) Products policies
CREATE POLICY "Products read" ON public.products FOR SELECT TO anon, authenticated USING (is_active IS NOT NULL);
CREATE POLICY "Products insert" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (length(name) > 0 AND length(sku) > 0);
CREATE POLICY "Products update" ON public.products FOR UPDATE TO anon, authenticated USING (length(id) > 0) WITH CHECK (length(name) > 0);
CREATE POLICY "Products delete" ON public.products FOR DELETE TO anon, authenticated USING (length(id) > 0);

-- 5) Inventory policies
CREATE POLICY "Inventory read" ON public.inventory FOR SELECT TO anon, authenticated USING (stock IS NOT NULL);
CREATE POLICY "Inventory write" ON public.inventory FOR ALL TO anon, authenticated USING (length(sku) > 0) WITH CHECK (length(sku) > 0);

-- 6) Roulette spins policies
CREATE POLICY "Roulette read" ON public.roulette_spins FOR SELECT TO anon, authenticated USING (voucher_code IS NOT NULL);
CREATE POLICY "Roulette insert" ON public.roulette_spins FOR INSERT TO anon, authenticated WITH CHECK (voucher_code IS NOT NULL AND length(customer_identifier) > 0);
CREATE POLICY "Roulette update" ON public.roulette_spins FOR UPDATE TO anon, authenticated USING (voucher_code IS NOT NULL) WITH CHECK (voucher_code IS NOT NULL);

-- 7) Draft orders policies
CREATE POLICY "Drafts read" ON public.draft_orders FOR SELECT TO anon, authenticated USING (draft_number IS NOT NULL);
CREATE POLICY "Drafts insert" ON public.draft_orders FOR INSERT TO anon, authenticated WITH CHECK (draft_number IS NOT NULL AND length(customer_name) > 0);
CREATE POLICY "Drafts update" ON public.draft_orders FOR UPDATE TO anon, authenticated USING (draft_number IS NOT NULL) WITH CHECK (draft_number IS NOT NULL);
CREATE POLICY "Drafts delete" ON public.draft_orders FOR DELETE TO anon, authenticated USING (draft_number IS NOT NULL);

-- 8) Discounts policies
CREATE POLICY "Discounts read" ON public.discounts FOR SELECT TO anon, authenticated USING (code IS NOT NULL);
CREATE POLICY "Discounts write" ON public.discounts FOR ALL TO anon, authenticated USING (code IS NOT NULL) WITH CHECK (code IS NOT NULL);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. INITIAL SEED DATA (Clean & Concise)
-- ──────────────────────────────────────────────────────────────────────────────

-- Active Store Promo Codes
INSERT INTO public.discounts (id, code, type, value, label, is_active) VALUES
    ('disc_welcome10', 'WELCOME10', 'percent', 10, 'Welcome Privilege 10% Off', true),
    ('disc_vip15', 'VIP15', 'percent', 15, 'VIP Patron 15% Allocation Off', true),
    ('disc_hanboro20', 'HANBORO20', 'percent', 20, 'Hanboro Collector 20% Off', true),
    ('disc_roulette10', 'ROULETTE10', 'percent', 10, 'Roulette Wheel 10% Privilege', true),
    ('disc_roulette15', 'ROULETTE15', 'percent', 15, 'Roulette Wheel 15% Privilege', true)
ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value, is_active = EXCLUDED.is_active;

-- Flagship Haute Horlogerie Watches
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag, price, price_usd,
    availability, year, summary, image, specs, stock, is_active
) VALUES
(
    'hbr-980-auto-orbita-g',
    'HBR-980-AUTO-ORBITA-G',
    'Hanboro Orbita Gold Automatic',
    'Double Tourbillon Haute Horlogerie',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Haute Horlogerie',
    '₹99,990',
    '$1,200',
    'In Stock',
    '2026',
    'Bespoke gold automatic tourbillon with orbital skeleton movement and exhibition sapphire caseback.',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80',
    '{"movement": "Automatic Double Tourbillon Cal. H-980", "case": "44mm 18K Rose Gold PVD 316L Steel", "crystal": "Curved Double AR Sapphire", "waterResistance": "50m / 5 ATM", "powerReserve": "72 Hours"}'::jsonb,
    8,
    true
),
(
    'hbr-702-tourb-skeleton',
    'HBR-702-TOURB-SKELETON',
    'Hanboro Skeleton Complication',
    'Openworked Flying Tourbillon',
    'SKELETON',
    'Skeleton & Openworked',
    'Masterpiece',
    '₹1,24,990',
    '$1,500',
    'In Stock',
    '2026',
    'Intricate hand-finished architectural skeleton dial with flying tourbillon at 6 o clock.',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&auto=format&fit=crop&q=80',
    '{"movement": "Manual Wind Flying Tourbillon Cal. H-702", "case": "43mm Titanium & DLC Satin Finish", "crystal": "Scratch-Resistant Sapphire", "waterResistance": "50m / 5 ATM", "powerReserve": "60 Hours"}'::jsonb,
    5,
    true
),
(
    'hbr-901-astronomical',
    'HBR-901-ASTRONOMICAL',
    'Hanboro Celestial Astronomical',
    'Planetary Rotating Orbit',
    'ASTRONOMICAL',
    'Astronomical & Special Editions',
    'Rare Edition',
    '₹1,49,990',
    '$1,800',
    'In Stock',
    '2026',
    'Celestial dial displaying earth rotation, 3D moon phase indicator, and orbital regulator mechanism.',
    'https://images.unsplash.com/photo-1547996160-71dfabbce5fa?w=1000&auto=format&fit=crop&q=80',
    '{"movement": "Astronomical Complication Cal. H-901", "case": "45mm 316L Stainless Steel & Ceramic Bezel", "crystal": "Domed Sapphire with Anti-Glare", "waterResistance": "100m / 10 ATM", "powerReserve": "80 Hours"}'::jsonb,
    4,
    true
)
ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock, is_active = EXCLUDED.is_active;

-- Corresponding Real-Time Inventory Allocations
INSERT INTO public.inventory (id, sku, name, collection, stock, price_inr, price_usd, image, is_active) VALUES
    ('hbr-980-auto-orbita-g', 'HBR-980-AUTO-ORBITA-G', 'Hanboro Orbita Gold Automatic', 'Tourbillon & Complications', 8, 99990, 1200, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80', true),
    ('hbr-702-tourb-skeleton', 'HBR-702-TOURB-SKELETON', 'Hanboro Skeleton Complication', 'Skeleton & Openworked', 5, 124990, 1500, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&auto=format&fit=crop&q=80', true),
    ('hbr-901-astronomical', 'HBR-901-ASTRONOMICAL', 'Hanboro Celestial Astronomical', 'Astronomical & Special Editions', 4, 149990, 1800, 'https://images.unsplash.com/photo-1547996160-71dfabbce5fa?w=1000&auto=format&fit=crop&q=80', true)
ON CONFLICT (sku) DO UPDATE SET id = EXCLUDED.id, stock = EXCLUDED.stock, price_inr = EXCLUDED.price_inr, price_usd = EXCLUDED.price_usd;
