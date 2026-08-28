-- ==============================================================================
-- HANBORO HAUTE HORLOGERIE - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Project: fhaurmmbgxfuumwegshy
-- Run this SQL in your Supabase Project Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Create `profiles` table for registered customers & staff
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

-- 2. Create `cart_items` table for persistent user shopping bags
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

-- 3. Create `orders` table for customer purchases & allocations
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    order_ref TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'Paid',
    order_status TEXT DEFAULT 'Processing',
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create `inventory` table for stock tracking & overrides
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    stock INTEGER DEFAULT 10,
    price_inr NUMERIC,
    price_usd NUMERIC,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create `roulette_spins` table for tracking customer privilege spins & single-use vouchers
CREATE TABLE IF NOT EXISTS public.roulette_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_identifier TEXT UNIQUE NOT NULL, -- normalized email or phone for 1-spin enforcement
    winning_pocket INTEGER,
    winning_color TEXT,
    discount_tier TEXT NOT NULL, -- '10% OFF', '15% OFF', '₹1,000 OFF', '5% OFF'
    discount_type TEXT NOT NULL, -- 'percent' | 'flat'
    discount_value NUMERIC NOT NULL,
    voucher_code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    used_order_ref TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_spins ENABLE ROW LEVEL SECURITY;

-- 7. Public Anon Key Policies (Allow read/write from storefront & admin)
DROP POLICY IF EXISTS "Anon public full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon public full access cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Anon public full access orders" ON public.orders;
DROP POLICY IF EXISTS "Anon public full access inventory" ON public.inventory;
DROP POLICY IF EXISTS "Anon public full access roulette_spins" ON public.roulette_spins;

CREATE POLICY "Anon public full access profiles" ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon public full access cart_items" ON public.cart_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon public full access orders" ON public.orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon public full access inventory" ON public.inventory
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon public full access roulette_spins" ON public.roulette_spins
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. Indices for fast lookup
CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders (order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roulette_identifier ON public.roulette_spins (customer_identifier);
CREATE INDEX IF NOT EXISTS idx_roulette_voucher ON public.roulette_spins (voucher_code);
CREATE INDEX IF NOT EXISTS idx_roulette_created ON public.roulette_spins (created_at DESC);
