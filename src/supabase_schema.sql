-- ==============================================================================
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

-- 1. Astroworld Celestial Moon Tourbillon Rose Gold (HBR-8801-TG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'astroworld-celestial',
    'HBR-8801-TG',
    'Astroworld Celestial Moon Tourbillon Rose Gold',
    '3D Spherical Orbiting Moon • 24H Rotating Earth Disk • Co-Axial Tourbillon • Aventurine Star Dial',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Flagship Grand Complication',
    '₹1,48,000',
    '$1,780',
    'Limited Allocation',
    '2026',
    'The crown jewel of Hanboro''s astronomical complications. Features a three-dimensional textured micro-sculpted Moon sphere orbiting inside an extended lower panoramic sapphire crystal chamber at 6 o''clock. A high-precision co-axial flying tourbillon pulses at the center axis, flanked by a revolving northern hemisphere Earth disk with a 24-hour GMT dual-time track at 9 o''clock, a deep-space starry aventurine sky with crescent moon at 3 o''clock, and an off-center primary time dial at 12 o''clock, encased in sculptured 18K rose gold.',
    '/watch-astroworld-moon-rosegold-front-transparent.webp',
    '/watch-astroworld-moon-rosegold-front-transparent.webp',
    '["/watch-astroworld-moon-rosegold-front-transparent.webp","/watch-astroworld-moon-rosegold-isometric-transparent.webp","/watch-astroworld-moon-rosegold-profile-transparent.webp","/watch-astroworld-moon-rosegold-neon.webp","/watch-astroworld-moon-rosegold-macro.webp"]'::jsonb,
    '[{"url":"/watch-astroworld-moon-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold organic case showcasing the 3D micro-carved moon sphere in the lower sapphire chamber, central tourbillon, 24H earth disk, and aventurine dial."},{"url":"/watch-astroworld-moon-rosegold-isometric-transparent.webp","title":"Three-Quarter Moon Chamber Isometric","label":"02 3D Moon Chamber","caption":"Isometric studio perspective with a transparent view into the extended panoramic lower sapphire chamber housing the 3D textured moon sphere."},{"url":"/watch-astroworld-moon-rosegold-profile-transparent.webp","title":"Rose Gold Sculptural Profile","label":"03 Sculptural Profile","caption":"Side profile angle highlighting the flowing ergonomic rose gold case flanks, titanium bezel screws, and knurled crown."},{"url":"/watch-astroworld-moon-rosegold-neon.webp","title":"Sartorial Neon Festival Presence","label":"04 Neon Lifestyle","caption":"Dynamic on-wrist presence framed against vibrant Japanese neon street festival lights, capturing the celestial reflections."},{"url":"/watch-astroworld-moon-rosegold-macro.webp","title":"Macro Celestial Micro-Horology","label":"05 Macro Horizon","caption":"Macro on-wrist capture under neon illumination revealing the craters of the 3D moon sphere, the pulsing tourbillon cage, and the rotating Earth disk."}]'::jsonb,
    '{"movement":"Caliber H-9001 In-House Astronomical Moon & Earth Co-Axial Tourbillon Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours (Twin-Barrel High-Torque System)","jewels":"33 Synthetic Rubies","caseMaterial":"Sculpted 316L Surgical Stainless Steel with Multi-Layer 18K Rose Gold PVD & Brushed Planes","caseDimensions":"44.0 mm × 53.0 mm Organic Curved × 14.8 mm","lugToLug":"53.0 mm","glass":"Bespoke Multi-Curved Panoramic Sapphire Crystal with Lower Moon Chamber & Dual AR Coating","caseback":"Full Exhibition Sapphire Crystal Caseback with Laser Serialization","dial":"Deep-Space Aventurine Starry Dial with 3D Textured Moon Sphere & 24H Rotating Earth Disk","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Vertical Grooves","clasp":"18K Rose Gold PVD Double-Security Push-Button Deployant Clasp","complications":["3D Spherical Textured Orbiting Moon in Lower Panoramic Sapphire Chamber","Co-Axial Center Flying Tourbillon Regulating Assembly","3D Rotating 24-Hour Celestial Blue Northern Hemisphere Earth Disk","Deep-Space Aventurine Night Sky Dial with Crescent Moon & Stars","Off-Center Primary Time Display with Luminous Skeleton Hands"],"packaging":"Piano-Black Lacquered Wooden Vault with Domed Viewing Port & Collector Passport"}'::jsonb,
    12,
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
    'astroworld-celestial',
    'HBR-8801-TG',
    'Astroworld Celestial Moon Tourbillon Rose Gold',
    'Tourbillon & Complications',
    12,
    148000,
    1780,
    '/watch-astroworld-moon-rosegold-front-transparent.webp',
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

-- 2. Astroworld Celestial Moon Tourbillon Classic Silver (HBR-8801-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'astroworld-celestial-silver',
    'HBR-8801-SS',
    'Astroworld Celestial Moon Tourbillon Classic Silver',
    '3D Spherical Orbiting Moon • 24H Rotating Earth Disk • Co-Axial Tourbillon • 316L Steel & Aventurine Sky',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Flagship Grand Complication',
    '₹1,45,000',
    '$1,745',
    'Limited Allocation',
    '2026',
    'Pure astronomical precision in surgical stainless steel. Highlights the three-dimensional textured micro-sculpted Moon sphere orbiting within the lower panoramic sapphire bubble at 6 o''clock. Synchronized with a center-axis flying tourbillon, 24-hour rotating northern hemisphere Earth disk at 9 o''clock, shimmering aventurine starry sky at 3 o''clock, and off-center primary time dial at 12 o''clock in hand-finished 316L steel on a fluted fluororubber strap.',
    '/watch-astroworld-moon-silver-front-transparent.webp',
    '/watch-astroworld-moon-silver-front-transparent.webp',
    '["/watch-astroworld-moon-silver-front-transparent.webp","/watch-astroworld-moon-silver-racetrack.webp","/watch-astroworld-moon-silver-wrist.webp","/watch-astroworld-moon-silver-moon.webp"]'::jsonb,
    '[{"url":"/watch-astroworld-moon-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel organic case showcasing the 3D micro-carved moon sphere in the lower sapphire chamber, central tourbillon, 24H earth disk, and aventurine dial."},{"url":"/watch-astroworld-moon-silver-racetrack.webp","title":"Motorsport Circuit Track Setting","label":"02 Racetrack Setting","caption":"Dynamic composition on high-speed racing circuit asphalt alongside red supercar."},{"url":"/watch-astroworld-moon-silver-wrist.webp","title":"Cockpit On-Wrist Denim Sartorial Presence","label":"03 Cockpit On-Wrist","caption":"On-wrist perspective in supercar cockpit paired with denim jacket exhibiting the organic steel curves."},{"url":"/watch-astroworld-moon-silver-moon.webp","title":"Lunar Surface Horizon Perspective","label":"04 Lunar Horizon","caption":"Studio astronomical composition resting on lunar surface with planet Earth floating in deep space."}]'::jsonb,
    '{"movement":"Caliber H-9001 In-House Astronomical Moon & Earth Co-Axial Tourbillon Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours (Twin-Barrel High-Torque System)","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44.0 mm × 53.0 mm Organic Curved × 14.8 mm","lugToLug":"53.0 mm","glass":"Bespoke Multi-Curved Panoramic Sapphire Crystal with Lower Moon Chamber & Dual AR Coating","caseback":"Full Exhibition Sapphire Crystal Caseback with Laser Serialization","dial":"Deep-Space Aventurine Starry Dial with 3D Textured Moon Sphere & 24H Rotating Earth Disk","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Vertical Grooves","clasp":"Solid 316L Stainless Steel Double-Security Push-Button Deployant Clasp","complications":["3D Spherical Textured Orbiting Moon in Lower Panoramic Sapphire Chamber","Co-Axial Center Flying Tourbillon Regulating Assembly","3D Rotating 24-Hour Celestial Blue Northern Hemisphere Earth Disk","Deep-Space Aventurine Night Sky Dial with Crescent Moon & Stars","Off-Center Primary Time Display with Luminous Skeleton Hands"],"packaging":"Piano-Black Lacquered Wooden Vault with Domed Viewing Port & Collector Passport"}'::jsonb,
    11,
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
    'astroworld-celestial-silver',
    'HBR-8801-SS',
    'Astroworld Celestial Moon Tourbillon Classic Silver',
    'Tourbillon & Complications',
    11,
    145000,
    1745,
    '/watch-astroworld-moon-silver-front-transparent.webp',
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

-- 3. Astroworld Celestial Co-Axial Tourbillon Midnight Black DLC (HBR-8801-BK)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'astroworld-tourbillon-black-dlc',
    'HBR-8801-BK',
    'Astroworld Celestial Co-Axial Tourbillon Midnight Black DLC',
    'Co-Axial Flying Tourbillon • Fluted Sunray Dial • Twin Planetary Gears • Diamond-Frosted 24H Ring',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Astronomical Tourbillon',
    '₹1,38,000',
    '$1,660',
    'Limited Allocation',
    '2026',
    'Grand astronomical complication executed in high-hardness midnight black Diamond-Like Carbon (DLC) coated 316L stainless steel. At 12 o''clock, the off-center primary time dial features deep radial vinyl fluting, applied mirror-polished indices, and luminous skeleton hands, encircled by an outer diamond-frosted celestial 24-hour GMT calibration ring. At 6 o''clock, an oversized openwork flying tourbillon carriage rotates smoothly with exposed balance wheel, blue screws, and synthetic ruby pivot. Flanked symmetrically by twin exposed planetary gear wheels at 9 and 3 o''clock with synthetic ruby capstones, and a deep-space starry night disc. Mounted on a hand-stitched alligator-embossed midnight black Italian calfskin leather strap with black DLC deployant clasp.',
    '/watch-astroworld-tourbillon-dlc-front-transparent.webp',
    '/watch-astroworld-tourbillon-dlc-front-transparent.webp',
    '["/watch-astroworld-tourbillon-dlc-front-transparent.webp","/watch-astroworld-tourbillon-dlc-landscape.webp","/watch-astroworld-tourbillon-dlc-pedestal.webp","/watch-astroworld-tourbillon-dlc-wrist.webp"]'::jsonb,
    '[{"url":"/watch-astroworld-tourbillon-dlc-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical midnight black DLC round case with off-center fluted dial, diamond-frosted ring, twin planetary gears, and flying tourbillon."},{"url":"/watch-astroworld-tourbillon-dlc-landscape.webp","title":"Volcanic Horizon Astronomical Setting","label":"02 Volcanic Horizon","caption":"Editorial astronomical composition on dark volcanic sand landscape with horizon backdrop."},{"url":"/watch-astroworld-tourbillon-dlc-pedestal.webp","title":"Volcanic Monolith Pedestal Perspective","label":"03 Volcanic Pedestal","caption":"Angled isometric studio perspective resting on rugged volcanic rock bedrock."},{"url":"/watch-astroworld-tourbillon-dlc-wrist.webp","title":"Sartorial Formal On-Wrist Horizon","label":"04 Formal Wrist","caption":"On-wrist perspective in formal dark tailoring showcasing the stealth DLC profile and tourbillon presence."}]'::jsonb,
    '{"movement":"Caliber H-8801 Co-Axial Flying Tourbillon Astronomical Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"65 Hours","jewels":"31 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Midnight Black Diamond-Like Carbon (DLC) Coating","caseDimensions":"44.0 mm Diameter × 14.2 mm Thickness","lugToLug":"51.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Openworked Skeleton Rotor","dial":"Radial Fluted Obsidian Black Dial with Diamond-Frosted 24H Outer Ring & Openwork Tourbillon","lume":"Swiss Super-LumiNova BGW9 on Skeleton Hands and Hour Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Midnight Black DLC Push-Button Deployant Clasp","complications":["Openwork Co-Axial Center-Axis Flying Tourbillon Carriage at 6 O''Clock","Off-Center Radial Fluted Main Time Dial with Diamond-Frosted 24H Ring at 12 O''Clock","Twin Exposed Planetary Gear Trains at 9 O''Clock and 3 O''Clock with Ruby Bearings","Starry Night Sky Arc Aperture on Left Outer Flank","Scratch-Resistant Midnight Black Diamond-Like Carbon (DLC) Armor Coating"],"packaging":"Astroworld Celestial Lacquered Vault Box with NFC Certificate of Authenticity"}'::jsonb,
    10,
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
    'astroworld-tourbillon-black-dlc',
    'HBR-8801-BK',
    'Astroworld Celestial Co-Axial Tourbillon Midnight Black DLC',
    'Tourbillon & Complications',
    10,
    138000,
    1660,
    '/watch-astroworld-tourbillon-dlc-front-transparent.webp',
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

-- 4. Astroworld Celestial Co-Axial Tourbillon 18K Rose Gold (HBR-8801-FRG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'astroworld-tourbillon-fluted-rosegold',
    'HBR-8801-FRG',
    'Astroworld Celestial Co-Axial Tourbillon 18K Rose Gold',
    'Co-Axial Flying Tourbillon • Fluted Sunray Dial • Twin Planetary Gears • 18K Rose Gold 24H Ring',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Astronomical Tourbillon',
    '₹1,42,000',
    '$1,710',
    'Limited Allocation',
    '2026',
    'Grand astronomical complication encased in luxurious 18K rose gold PVD surgical stainless steel. At 12 o''clock, the off-center primary time dial features deep radial vinyl fluting, applied rose gold indices, and faceted luminous hands, encircled by an outer diamond-frosted 18K rose gold celestial 24-hour GMT calibration ring. At 6 o''clock, an oversized openwork flying tourbillon carriage rotates smoothly with exposed rose gold balance wheel, blue screws, and synthetic ruby pivot. Flanked symmetrically by twin exposed planetary gear wheels at 9 and 3 o''clock with synthetic ruby capstones, and a deep-space starry night arc. Mounted on a hand-stitched alligator-embossed genuine black Italian calfskin leather strap with 18K rose gold butterfly deployant clasp.',
    '/watch-astroworld-tourbillon-fluted-rosegold-front-transparent.webp',
    '/watch-astroworld-tourbillon-fluted-rosegold-front-transparent.webp',
    '["/watch-astroworld-tourbillon-fluted-rosegold-front-transparent.webp","/watch-astroworld-tourbillon-fluted-rosegold-isometric-transparent.webp","/watch-astroworld-tourbillon-fluted-rosegold-wrist.webp"]'::jsonb,
    '[{"url":"/watch-astroworld-tourbillon-fluted-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with off-center fluted dial, diamond-frosted rose gold ring, twin planetary gears, and flying tourbillon."},{"url":"/watch-astroworld-tourbillon-fluted-rosegold-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on white showcasing the curved bezel, domed sapphire crystal, and open 18K rose gold deployant clasp."},{"url":"/watch-astroworld-tourbillon-fluted-rosegold-wrist.webp","title":"Sartorial Formal On-Wrist Horizon","label":"03 Formal Wrist","caption":"On-wrist perspective in formal dark tailoring showcasing the warm rose gold facets and flying tourbillon presence."}]'::jsonb,
    '{"movement":"Caliber H-8801 Co-Axial Flying Tourbillon Astronomical Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"65 Hours","jewels":"31 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"44.0 mm Diameter × 14.2 mm Thickness","lugToLug":"51.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Openworked Skeleton Rotor","dial":"Radial Fluted Obsidian Black Dial with 18K Rose Gold Diamond-Frosted 24H Outer Ring & Openwork Tourbillon","lume":"Swiss Super-LumiNova BGW9 on Skeleton Hands and Hour Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel 18K Rose Gold Push-Button Butterfly Deployant Clasp","complications":["Openwork Co-Axial Center-Axis Flying Tourbillon Carriage at 6 O''Clock","Off-Center Radial Fluted Main Time Dial with 18K Rose Gold 24H Ring at 12 O''Clock","Twin Exposed Planetary Gear Trains at 9 O''Clock and 3 O''Clock with Ruby Bearings","Starry Night Sky Arc Aperture on Left Outer Flank","18K Rose Gold PVD Case & Butterfly Deployant Clasp"],"packaging":"Astroworld Celestial Lacquered Vault Box with NFC Certificate of Authenticity"}'::jsonb,
    9,
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
    'astroworld-tourbillon-fluted-rosegold',
    'HBR-8801-FRG',
    'Astroworld Celestial Co-Axial Tourbillon 18K Rose Gold',
    'Tourbillon & Complications',
    9,
    142000,
    1710,
    '/watch-astroworld-tourbillon-fluted-rosegold-front-transparent.webp',
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

-- 5. Astroworld Celestial Co-Axial Tourbillon Classic Silver Steel (HBR-8801-FSS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'astroworld-tourbillon-fluted-silver',
    'HBR-8801-FSS',
    'Astroworld Celestial Co-Axial Tourbillon Classic Silver Steel',
    'Co-Axial Flying Tourbillon • Fluted Sunray Dial • Twin Planetary Gears • 21-Jewel Golden Rotor',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Astronomical Tourbillon',
    '₹1,35,000',
    '$1,630',
    'Limited Allocation',
    '2026',
    'Grand astronomical complication crafted from solid 316L surgical stainless steel. At 12 o''clock, the off-center primary time dial features deep radial vinyl fluting, applied mirror-polished indices, and faceted luminous hands, encircled by an outer diamond-frosted celestial 24-hour GMT calibration ring. At 6 o''clock, an oversized openwork flying tourbillon carriage rotates smoothly with exposed balance wheel, blue screws, and synthetic ruby pivot. Flanked symmetrically by twin exposed planetary gear wheels at 9 and 3 o''clock with synthetic ruby capstones, and a deep-space starry night arc. The exhibition sapphire crystal back reveals a decorated automatic movement with 21 jewels and custom radial sunburst fluted golden rotor. Mounted on a hand-stitched alligator-embossed genuine black Italian calfskin leather strap with solid steel butterfly deployant clasp.',
    '/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp',
    '/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp',
    '["/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp","/watch-astroworld-tourbillon-fluted-silver-isometric-transparent.webp","/watch-astroworld-tourbillon-fluted-silver-caseback.webp","/watch-astroworld-tourbillon-fluted-silver-display.webp","/watch-astroworld-tourbillon-fluted-silver-wrist.webp"]'::jsonb,
    '[{"url":"/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel round case with off-center fluted dial, diamond-frosted ring, twin planetary gears, and flying tourbillon."},{"url":"/watch-astroworld-tourbillon-fluted-silver-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on white showcasing the mirror-polished steel bezel, domed sapphire crystal, and open deployant clasp."},{"url":"/watch-astroworld-tourbillon-fluted-silver-caseback.webp","title":"Exhibition Sapphire Movement Caseback","label":"03 Movement Caseback","caption":"High-definition caseback perspective revealing the 21-jewel automatic movement, radial sunburst golden rotor, and Côtes de Genève stripes."},{"url":"/watch-astroworld-tourbillon-fluted-silver-display.webp","title":"Studio Display Horizon","label":"04 Display Horizon","caption":"Three-quarter display perspective on midnight blue leather backdrop highlighting dial depth and planetary gears."},{"url":"/watch-astroworld-tourbillon-fluted-silver-wrist.webp","title":"Sartorial On-Wrist Horizon","label":"05 Sartorial Wrist","caption":"On-wrist perspective in studio tailoring showcasing the natural steel reflections, fluted dial, and tourbillon presence."}]'::jsonb,
    '{"movement":"Caliber H-8801 Co-Axial Flying Tourbillon Decorated Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"65 Hours","jewels":"21 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Mirror-Polished Stepped Bezel","caseDimensions":"44.0 mm Diameter × 14.2 mm Thickness","lugToLug":"51.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Radial Sunburst Golden Oscillating Rotor","dial":"Radial Fluted Obsidian Black Dial with Diamond-Frosted 24H Outer Ring & Openwork Tourbillon","lume":"Swiss Super-LumiNova BGW9 on Skeleton Hands and Hour Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Push-Button Butterfly Deployant Clasp","complications":["Openwork Co-Axial Center-Axis Flying Tourbillon Carriage at 6 O''Clock","Off-Center Radial Fluted Main Time Dial with Diamond-Frosted 24H Ring at 12 O''Clock","Twin Exposed Planetary Gear Trains at 9 O''Clock and 3 O''Clock with Ruby Bearings","Starry Night Sky Arc Aperture on Left Outer Flank","Exhibition Sapphire Back with Sunburst Fluted Golden Oscillating Rotor"],"packaging":"Astroworld Celestial Lacquered Vault Box with NFC Certificate of Authenticity"}'::jsonb,
    8,
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
    'astroworld-tourbillon-fluted-silver',
    'HBR-8801-FSS',
    'Astroworld Celestial Co-Axial Tourbillon Classic Silver Steel',
    'Tourbillon & Complications',
    8,
    135000,
    1630,
    '/watch-astroworld-tourbillon-fluted-silver-front-transparent.webp',
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

-- 6. Dual Elements Volcano & Glacier Compass Tourbillon 18K Gold (HBR-8803-VG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'volcano-glacier-compass-gold',
    'HBR-8803-VG',
    'Dual Elements Volcano & Glacier Compass Tourbillon 18K Gold',
    'Molten Magma & Glacial Frost Dial • 3D Navigational Compass Sphere • Central Tourbillon • Bioluminescent Glow',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Dual Elements & Compass',
    '₹1,52,000',
    '$1,830',
    'Limited Allocation',
    '2026',
    'An elemental clash of primal forces housed in sculptural 18K yellow gold. The dial presents a split dichotomy: blazing molten volcanic magma rock on the left and crystalline glacial frost ice on the right. An operative 3D micro-navigational compass sphere with cardinal directions orbits inside the lower panoramic sapphire bubble at 6 o''clock. Powered by a high-beat center flying tourbillon, openworked 12H time dial, and full bioluminescent night luminescence that illuminates the magma and glacier landscapes in green.',
    '/watch-volcano-glacier-compass-gold-front-transparent.webp',
    '/watch-volcano-glacier-compass-gold-front-transparent.webp',
    '["/watch-volcano-glacier-compass-gold-front-transparent.webp","/watch-volcano-glacier-compass-gold-night-glow.webp","/watch-volcano-glacier-compass-gold-isometric-transparent.webp","/watch-volcano-glacier-compass-gold-macro-transparent.webp"]'::jsonb,
    '[{"url":"/watch-volcano-glacier-compass-gold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K gold case showcasing the split molten magma & glacial frost dial, central tourbillon, and 3D spherical compass."},{"url":"/watch-volcano-glacier-compass-gold-night-glow.webp","title":"Bioluminescent Dial & Index Night Glow","label":"02 Night Glow","caption":"Phosphor-infused night illumination revealing glowing green magma fissures, glacial terrain, and Super-LumiNova markers."},{"url":"/watch-volcano-glacier-compass-gold-isometric-transparent.webp","title":"Three-Quarter Compass Bubble Isometric","label":"03 3D Compass Bubble","caption":"Angled perspective highlighting the panoramic lower sapphire bubble, navigational compass sphere, and gold butterfly deployant clasp."},{"url":"/watch-volcano-glacier-compass-gold-macro-transparent.webp","title":"Macro Texture & Dial Dichotomy","label":"04 Macro Dichotomy","caption":"High-contrast macro view of the textured volcanic rock fissures, frost crystals, and central tourbillon escapement."}]'::jsonb,
    '{"movement":"Caliber H-9003 Dual Elements Expedition Flying Tourbillon Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Sculpted 316L Surgical Stainless Steel with 18K Yellow Gold PVD & Brushed Chamfers","caseDimensions":"44.0 mm × 53.0 mm Organic Curved × 14.8 mm","lugToLug":"53.0 mm","glass":"Bespoke Multi-Curved Panoramic Sapphire Crystal with Lower Compass Bubble & Dual AR Coating","caseback":"Full Exhibition Sapphire Crystal Caseback with Laser Serialization","dial":"Split Volcanic Magma Rock & Glacial Ice Crystal Dial with 3D Spherical Navigational Compass","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Vertical Grooves","clasp":"18K Yellow Gold PVD Double-Security Push-Button Deployant Clasp","complications":["3D Spherical Navigational Compass in Lower Panoramic Sapphire Bubble","Co-Axial Center Flying Tourbillon Assembly with Arched Black PVD Bridges","Dual Elements Split Dial (Molten Volcanic Magma & Glacial Frost Ice)","Bioluminescent Green Dial & Index Night Glow (Day/Night Mode)","Off-Center Primary Time Display with Skeleton Gear Trains"],"packaging":"Piano-Black Lacquered Explorer Presentation Vault with UV Glow Torch & NFC Authenticity Passport"}'::jsonb,
    7,
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
    'volcano-glacier-compass-gold',
    'HBR-8803-VG',
    'Dual Elements Volcano & Glacier Compass Tourbillon 18K Gold',
    'Tourbillon & Complications',
    7,
    152000,
    1830,
    '/watch-volcano-glacier-compass-gold-front-transparent.webp',
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

-- 7. Dual Elements Volcano & Glacier Compass Tourbillon Rose Gold (HBR-8803-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'volcano-glacier-compass-rosegold',
    'HBR-8803-RG',
    'Dual Elements Volcano & Glacier Compass Tourbillon Rose Gold',
    'Molten Magma & Glacial Frost Dial • 3D Navigational Compass Sphere • Central Tourbillon • 18K Rose Gold',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Dual Elements & Compass',
    '₹1,55,000',
    '$1,860',
    'Limited Allocation',
    '2026',
    'A breathtaking juxtaposition of extreme fire and ice wrapped in warm 18K rose gold. The dial presents a split dichotomy: blazing molten volcanic magma rock on the left and crystalline glacial frost ice on the right. An operative 3D micro-navigational compass sphere with cardinal directions orbits inside the lower panoramic sapphire bubble at 6 o''clock. Powered by a high-beat center flying tourbillon, openworked 12H time dial, and full bioluminescent night luminescence that illuminates the magma and glacier landscapes in green.',
    '/watch-volcano-glacier-compass-rosegold-front-transparent.webp',
    '/watch-volcano-glacier-compass-rosegold-front-transparent.webp',
    '["/watch-volcano-glacier-compass-rosegold-front-transparent.webp","/watch-volcano-glacier-compass-rosegold-night-glow.webp","/watch-volcano-glacier-compass-rosegold-isometric-transparent.webp","/watch-volcano-glacier-compass-rosegold-angle-transparent.webp"]'::jsonb,
    '[{"url":"/watch-volcano-glacier-compass-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold case showcasing the split molten magma & glacial frost dial, central tourbillon, and 3D spherical compass."},{"url":"/watch-volcano-glacier-compass-rosegold-night-glow.webp","title":"Bioluminescent Dial & Index Night Glow","label":"02 Night Glow","caption":"Phosphor-infused night illumination revealing glowing green magma fissures, glacial terrain, and Super-LumiNova markers."},{"url":"/watch-volcano-glacier-compass-rosegold-isometric-transparent.webp","title":"Three-Quarter Compass Bubble Isometric","label":"03 3D Compass Bubble","caption":"Angled perspective highlighting the panoramic lower sapphire bubble, navigational compass sphere, and rose gold butterfly deployant clasp."},{"url":"/watch-volcano-glacier-compass-rosegold-angle-transparent.webp","title":"Rose Gold Architectural Presence","label":"04 Rose Gold Angle","caption":"Frontal angled view highlighting the warm rose gold case curves, titanium screws, and exposed tourbillon cage."}]'::jsonb,
    '{"movement":"Caliber H-9003 Dual Elements Expedition Flying Tourbillon Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Sculpted 316L Surgical Stainless Steel with 18K Rose Gold PVD & Brushed Chamfers","caseDimensions":"44.0 mm × 53.0 mm Organic Curved × 14.8 mm","lugToLug":"53.0 mm","glass":"Bespoke Multi-Curved Panoramic Sapphire Crystal with Lower Compass Bubble & Dual AR Coating","caseback":"Full Exhibition Sapphire Crystal Caseback with Laser Serialization","dial":"Split Volcanic Magma Rock & Glacial Ice Crystal Dial with 3D Spherical Navigational Compass","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Vertical Grooves","clasp":"18K Rose Gold PVD Double-Security Push-Button Deployant Clasp","complications":["3D Spherical Navigational Compass in Lower Panoramic Sapphire Bubble","Co-Axial Center Flying Tourbillon Assembly with Arched Black PVD Bridges","Dual Elements Split Dial (Molten Volcanic Magma & Glacial Frost Ice)","Bioluminescent Green Dial & Index Night Glow (Day/Night Mode)","Off-Center Primary Time Display with Skeleton Gear Trains"],"packaging":"Piano-Black Lacquered Explorer Presentation Vault with UV Glow Torch & NFC Authenticity Passport"}'::jsonb,
    6,
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
    'volcano-glacier-compass-rosegold',
    'HBR-8803-RG',
    'Dual Elements Volcano & Glacier Compass Tourbillon Rose Gold',
    'Tourbillon & Complications',
    6,
    155000,
    1860,
    '/watch-volcano-glacier-compass-rosegold-front-transparent.webp',
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

-- 8. Dual Elements Volcano & Glacier Compass Tourbillon Classic Silver (HBR-8803-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'volcano-glacier-compass-silver',
    'HBR-8803-SS',
    'Dual Elements Volcano & Glacier Compass Tourbillon Classic Silver',
    'Molten Magma & Glacial Frost Dial • 3D Navigational Compass Sphere • Central Tourbillon • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Dual Elements & Compass',
    '₹1,48,000',
    '$1,780',
    'Limited Allocation',
    '2026',
    'A striking contrast of volcanic fire and sub-zero ice engineered in solid 316L surgical stainless steel. The dial features a split dichotomy: fiery molten volcanic magma rock on the left and crystalline glacial frost ice on the right. An operative 3D micro-navigational compass sphere with cardinal directions orbits inside the lower panoramic sapphire bubble at 6 o''clock. Synchronized with a center flying tourbillon, openworked 12H time dial, and full bioluminescent night luminescence that illuminates the magma and glacier landscapes in green.',
    '/watch-volcano-glacier-compass-silver-front-transparent.webp',
    '/watch-volcano-glacier-compass-silver-front-transparent.webp',
    '["/watch-volcano-glacier-compass-silver-front-transparent.webp","/watch-volcano-glacier-compass-silver-night-glow.webp","/watch-volcano-glacier-compass-silver-isometric-transparent.webp","/watch-volcano-glacier-compass-silver-macro-transparent.webp"]'::jsonb,
    '[{"url":"/watch-volcano-glacier-compass-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical steel case showcasing the split molten magma & glacial frost dial, central tourbillon, and 3D spherical compass."},{"url":"/watch-volcano-glacier-compass-silver-night-glow.webp","title":"Bioluminescent Dial & Index Night Glow","label":"02 Night Glow","caption":"Phosphor-infused night illumination revealing glowing green magma fissures, glacial terrain, and Super-LumiNova markers."},{"url":"/watch-volcano-glacier-compass-silver-isometric-transparent.webp","title":"Three-Quarter Compass Bubble Isometric","label":"03 3D Compass Bubble","caption":"Angled perspective highlighting the panoramic lower sapphire bubble, navigational compass sphere, and steel butterfly deployant clasp."},{"url":"/watch-volcano-glacier-compass-silver-macro-transparent.webp","title":"Macro Texture & Dial Dichotomy","label":"04 Macro Dichotomy","caption":"High-contrast macro view of the textured volcanic rock fissures, frost crystals, and central tourbillon escapement."}]'::jsonb,
    '{"movement":"Caliber H-9003 Dual Elements Expedition Flying Tourbillon Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44.0 mm × 53.0 mm Organic Curved × 14.8 mm","lugToLug":"53.0 mm","glass":"Bespoke Multi-Curved Panoramic Sapphire Crystal with Lower Compass Bubble & Dual AR Coating","caseback":"Full Exhibition Sapphire Crystal Caseback with Laser Serialization","dial":"Split Volcanic Magma Rock & Glacial Ice Crystal Dial with 3D Spherical Navigational Compass","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Vertical Grooves","clasp":"Solid 316L Stainless Steel Double-Security Push-Button Deployant Clasp","complications":["3D Spherical Navigational Compass in Lower Panoramic Sapphire Bubble","Co-Axial Center Flying Tourbillon Assembly with Arched Black PVD Bridges","Dual Elements Split Dial (Molten Volcanic Magma & Glacial Frost Ice)","Bioluminescent Green Dial & Index Night Glow (Day/Night Mode)","Off-Center Primary Time Display with Skeleton Gear Trains"],"packaging":"Piano-Black Lacquered Explorer Presentation Vault with UV Glow Torch & NFC Authenticity Passport"}'::jsonb,
    5,
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
    'volcano-glacier-compass-silver',
    'HBR-8803-SS',
    'Dual Elements Volcano & Glacier Compass Tourbillon Classic Silver',
    'Tourbillon & Complications',
    5,
    148000,
    1780,
    '/watch-volcano-glacier-compass-silver-front-transparent.webp',
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

-- 9. V12 Engine-Block Supercar Tourbillon 18K Rose Gold (HBR-8805-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'supercar-engine-block-rosegold',
    'HBR-8805-RG',
    'V12 Engine-Block Supercar Tourbillon 18K Rose Gold',
    'Cylindrical Transmission Gear Train • Air Intake Grille Plaque • Alloy Wheel Dial • 18K Rose Gold',
    'TOURBILLON',
    'Tourbillon & Complications',
    'V12 Engine Block',
    '₹1,58,000',
    '$1,900',
    'Limited Allocation',
    '2026',
    'A supercar powertrain translated into haute horlogerie. Houses an operative 6 o''clock panoramic cylindrical gear transmission mechanism with micro-toothed driving wheel and laser-cut Hanboro ''H'' monogram. Features a decentered alloy racing wheel primary time dial at 12 o''clock, co-axial flying tourbillon at 6 o''clock, horizontal engine radiator air-intake grille with crimson ''HANBORO AUTOMATIC'' plaque at 3 o''clock, exposed transmission gear train at 9 o''clock, and sculpted 18K rose gold aerodynamic case with bezel spline screws.',
    '/watch-supercar-engine-block-rosegold-front-transparent.webp',
    '/watch-supercar-engine-block-rosegold-front-transparent.webp',
    '["/watch-supercar-engine-block-rosegold-front-transparent.webp","/watch-supercar-engine-block-rosegold-isometric-transparent.webp","/watch-supercar-engine-block-rosegold-racetrack.webp","/watch-supercar-engine-block-rosegold-headlights.webp","/watch-supercar-engine-block-rosegold-vault.webp"]'::jsonb,
    '[{"url":"/watch-supercar-engine-block-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold aerodynamic case with alloy wheel dial, central tourbillon, and operative 6 o''clock gear cylinder."},{"url":"/watch-supercar-engine-block-rosegold-isometric-transparent.webp","title":"Three-Quarter Aerodynamic Isometric","label":"02 Aerodynamic Profile","caption":"Angled perspective highlighting the curved 3D sapphire window, radiator grille plaque, and exposed transmission train."},{"url":"/watch-supercar-engine-block-rosegold-racetrack.webp","title":"Motorsport Racetrack Setting","label":"03 Racetrack Presence","caption":"Racetrack curb composition resting beside red Ferrari supercar demonstrating high-octane automotive heritage."},{"url":"/watch-supercar-engine-block-rosegold-headlights.webp","title":"Supercar Headlights Horizon","label":"04 Supercar Horizon","caption":"Editorial studio composition framed against supercar headlights highlighting the sculpted 18K rose gold chassis."},{"url":"/watch-supercar-engine-block-rosegold-vault.webp","title":"Collector Vault Presentation","label":"05 Collector Vault","caption":"Resting on collector presentation cushion showcasing the mirror-polished bevels and tactile rose gold crown."}]'::jsonb,
    '{"movement":"Caliber H-8805 Supercar V12 Powertrain Flying Tourbillon Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours","jewels":"36 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & 6 Spline Bezel Screws","caseDimensions":"44.5 mm × 53.0 mm Aerodynamic Sculpted × 15.0 mm","lugToLug":"53.0 mm","glass":"Multi-Curved Panoramic 3D Sapphire Crystal with Extended 6 O''Clock Transmission Window","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Disc Rotor","dial":"Multi-Tier V12 Engine Skeleton with Alloy Wheel Dial, Air Intake Grille & Cylindrical Gear","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Relief","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Deployant Clasp","complications":["Operative 6 O''Clock Panoramic Cylindrical Gear Transmission Mechanism","Co-Axial Flying Tourbillon Assembly with 3-Spoke Rose Gold Bridge","Decentered Alloy Racing Wheel Primary Time Dial at 12 O''Clock","Linear Engine Radiator Air-Intake Grille with Crimson Hanboro Plaque","Exposed 9 O''Clock Mechanical Transmission Gear Train"],"packaging":"Engine-Bay Lacquered Presentation Vault with Laser-Cut Steel Plaque & NFC Passport"}'::jsonb,
    12,
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
    'supercar-engine-block-rosegold',
    'HBR-8805-RG',
    'V12 Engine-Block Supercar Tourbillon 18K Rose Gold',
    'Tourbillon & Complications',
    12,
    158000,
    1900,
    '/watch-supercar-engine-block-rosegold-front-transparent.webp',
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

-- 10. V12 Engine-Block Supercar Tourbillon Classic Silver (HBR-8805-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'supercar-engine-block-silver',
    'HBR-8805-SS',
    'V12 Engine-Block Supercar Tourbillon Classic Silver',
    'Cylindrical Transmission Gear Train • Air Intake Grille Plaque • Alloy Wheel Dial • 316L Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'V12 Engine Block',
    '₹1,48,000',
    '$1,780',
    'Limited Allocation',
    '2026',
    'High-performance precision mechanical engineering rendered in solid 316L surgical stainless steel. Features an operative 6 o''clock panoramic cylindrical gear transmission mechanism with micro-toothed driving wheel and laser-cut Hanboro ''H'' monogram. Synced with a decentered alloy racing wheel primary time dial at 12 o''clock, co-axial flying tourbillon at 6 o''clock, horizontal engine radiator air-intake grille with crimson ''HANBORO AUTOMATIC'' plaque at 3 o''clock, exposed transmission gear train at 9 o''clock, and sculpted steel aerodynamic case with 6 spline bezel screws.',
    '/watch-supercar-engine-block-silver-front-transparent.webp',
    '/watch-supercar-engine-block-silver-front-transparent.webp',
    '["/watch-supercar-engine-block-silver-front-transparent.webp","/watch-supercar-engine-block-silver-isometric.webp","/watch-supercar-engine-block-silver-headlights.webp","/watch-supercar-engine-block-silver-denim.webp","/watch-supercar-engine-block-silver-driving.webp"]'::jsonb,
    '[{"url":"/watch-supercar-engine-block-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical steel aerodynamic case with alloy wheel dial, central tourbillon, and operative 6 o''clock gear cylinder."},{"url":"/watch-supercar-engine-block-silver-isometric.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled perspective highlighting the curved 3D sapphire window, radiator grille plaque, and exposed transmission train."},{"url":"/watch-supercar-engine-block-silver-headlights.webp","title":"Supercar Headlights Horizon","label":"03 Supercar Horizon","caption":"Editorial studio composition framed against supercar headlights highlighting the sculpted stainless steel chassis."},{"url":"/watch-supercar-engine-block-silver-denim.webp","title":"Sartorial Cockpit Denim Presence","label":"04 Cockpit Denim","caption":"On-wrist cockpit composition with denim jacket demonstrating daily ergonomics and high-contrast dial."},{"url":"/watch-supercar-engine-block-silver-driving.webp","title":"High-Speed Ferrari Cockpit Driving","label":"05 Ferrari Cockpit","caption":"High-speed driving perspective behind Ferrari steering wheel showcasing the exposed engine block caliber in motion."}]'::jsonb,
    '{"movement":"Caliber H-8805 Supercar V12 Powertrain Flying Tourbillon Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"72 Hours","jewels":"36 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes with 6 Spline Screws","caseDimensions":"44.5 mm × 53.0 mm Aerodynamic Sculpted × 15.0 mm","lugToLug":"53.0 mm","glass":"Multi-Curved Panoramic 3D Sapphire Crystal with Extended 6 O''Clock Transmission Window","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Disc Rotor","dial":"Multi-Tier V12 Engine Skeleton with Alloy Wheel Dial, Air Intake Grille & Cylindrical Gear","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber with Fluted Relief","clasp":"Solid 316L Stainless Steel Double-Security Deployant Clasp","complications":["Operative 6 O''Clock Panoramic Cylindrical Gear Transmission Mechanism","Co-Axial Flying Tourbillon Assembly with 3-Spoke Steel Bridge","Decentered Alloy Racing Wheel Primary Time Dial at 12 O''Clock","Linear Engine Radiator Air-Intake Grille with Crimson Hanboro Plaque","Exposed 9 O''Clock Mechanical Transmission Gear Train"],"packaging":"Engine-Bay Lacquered Presentation Vault with Laser-Cut Steel Plaque & NFC Passport"}'::jsonb,
    11,
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
    'supercar-engine-block-silver',
    'HBR-8805-SS',
    'V12 Engine-Block Supercar Tourbillon Classic Silver',
    'Tourbillon & Complications',
    11,
    148000,
    1780,
    '/watch-supercar-engine-block-silver-front-transparent.webp',
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

-- 11. Casino Grand Roulette Wheel Spinning Complication 18K Rose Gold (HBR-8809-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-rosegold',
    'HBR-8809-RG',
    'Casino Grand Roulette Wheel Spinning Complication 18K Rose Gold',
    'Interactive Push-Button Spinning Roulette Disk • 37 Pockets • Onyx Black Time Dial • 18K Rose Gold',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Casino Complication',
    '₹1,36,000',
    '$1,640',
    'In Stock',
    '2026',
    'Haute horlogerie meets the thrill of Monte Carlo. Features an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the dedicated mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest on a winning number beside the floating white ball marker. Accented with an onyx black center time dial, faceted 18K rose gold arrow hour indices, skeletonized luminous hands, and premium alligator-grain calfskin leather strap.',
    '/watch-casino-roulette-rosegold-front-transparent.webp',
    '/watch-casino-roulette-rosegold-front-transparent.webp',
    '["/watch-casino-roulette-rosegold-front-transparent.webp","/watch-casino-roulette-rosegold-felt.webp","/watch-casino-roulette-rosegold-wheel.webp","/watch-casino-roulette-rosegold-wrist-angle.webp","/watch-casino-roulette-rosegold-wrist-closeup.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with dynamic 37-pocket roulette disk, onyx black dial, and alligator leather strap."},{"url":"/watch-casino-roulette-rosegold-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"02 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the high-stakes roulette complication."},{"url":"/watch-casino-roulette-rosegold-wheel.webp","title":"Gaming Wheel Horizon","label":"03 Casino Horizon","caption":"Angled perspective framed against casino wheel bokeh highlighting the mirror-polished rose gold bezel and 8 o''clock spinner pusher."},{"url":"/watch-casino-roulette-rosegold-wrist-angle.webp","title":"Sartorial Wrist Horizon Angle","label":"04 Wrist Angle","caption":"On-wrist high-angle perspective showcasing the depth of the 3D roulette flange and luminous rose gold hands."},{"url":"/watch-casino-roulette-rosegold-wrist-closeup.webp","title":"Close-Up On-Wrist Dial Perspective","label":"05 Wrist Close-Up","caption":"Detailed macro wrist perspective demonstrating crisp pocket typography, white ball marker alignment, and supple alligator strap."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Onyx Black Center Dial with Applied Rose Gold Faceted Indices & Outer Dynamic Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor","Applied 18K Rose Gold Faceted Arrow Hour Markers with Luminous Tips","Dual Skeleton Hands with White & Red Luminous Enamel Accents"],"packaging":"Green Casino Felt Collector Presentation Case with Custom Metallic Chips & NFC Warranty Card"}'::jsonb,
    10,
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
    'casino-roulette-wheel-rosegold',
    'HBR-8809-RG',
    'Casino Grand Roulette Wheel Spinning Complication 18K Rose Gold',
    'Tourbillon & Complications',
    10,
    136000,
    1640,
    '/watch-casino-roulette-rosegold-front-transparent.webp',
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

-- 12. Casino Grand Roulette Wheel Spinning Complication Classic Silver (HBR-8809-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-silver',
    'HBR-8809-SS',
    'Casino Grand Roulette Wheel Spinning Complication Classic Silver',
    'Interactive Push-Button Spinning Roulette Disk • 37 Pockets • Onyx Black Time Dial • 316L Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Casino Complication',
    '₹1,28,000',
    '$1,540',
    'In Stock',
    '2026',
    'High-stakes luxury gaming horology forged in solid 316L surgical stainless steel. Features an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the dedicated mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest on a winning number beside the floating white ball marker. Accented with an onyx black center time dial, faceted stainless steel arrow hour indices, skeletonized luminous hands, and premium alligator-grain calfskin leather strap.',
    '/watch-casino-roulette-silver-front-transparent.webp',
    '/watch-casino-roulette-silver-front-transparent.webp',
    '["/watch-casino-roulette-silver-front-transparent.webp","/watch-casino-roulette-silver-wheel.webp","/watch-casino-roulette-silver-felt.webp","/watch-casino-roulette-silver-wrist-angle.webp","/watch-casino-roulette-silver-wrist-closeup.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with dynamic 37-pocket roulette disk, onyx black dial, and alligator leather strap."},{"url":"/watch-casino-roulette-silver-wheel.webp","title":"Gaming Wheel Horizon","label":"02 Casino Horizon","caption":"Angled perspective framed against casino wheel bokeh highlighting the mirror-polished steel bezel and 8 o''clock spinner pusher."},{"url":"/watch-casino-roulette-silver-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"03 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the high-stakes roulette complication."},{"url":"/watch-casino-roulette-silver-wrist-angle.webp","title":"Sartorial Wrist Horizon Angle","label":"04 Wrist Angle","caption":"On-wrist high-angle perspective showcasing the depth of the 3D roulette flange and luminous steel hands."},{"url":"/watch-casino-roulette-silver-wrist-closeup.webp","title":"Close-Up On-Wrist Dial Perspective","label":"05 Wrist Close-Up","caption":"Detailed macro wrist perspective demonstrating crisp pocket typography, white ball marker alignment, and supple alligator strap."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Onyx Black Center Dial with Applied Polished Steel Faceted Indices & Outer Dynamic Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor","Applied Steel Faceted Arrow Hour Markers with Luminous Tips","Dual Skeleton Hands with White & Red Luminous Enamel Accents"],"packaging":"Green Casino Felt Collector Presentation Case with Custom Metallic Chips & NFC Warranty Card"}'::jsonb,
    9,
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
    'casino-roulette-wheel-silver',
    'HBR-8809-SS',
    'Casino Grand Roulette Wheel Spinning Complication Classic Silver',
    'Tourbillon & Complications',
    9,
    128000,
    1540,
    '/watch-casino-roulette-silver-front-transparent.webp',
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

-- 13. Casino Grand Roulette Wheel Baguette Diamond & Emerald 18K Rose Gold (HBR-8809-EM)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-diamond-emerald',
    'HBR-8809-EM',
    'Casino Grand Roulette Wheel Baguette Diamond & Emerald 18K Rose Gold',
    'Full Concentric Baguette Diamond Paved Dial • 12 Baguette Emerald Indices • Interactive Roulette Spinner',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,88,000',
    '$2,260',
    'Haute Joaillerie Allocation',
    '2026',
    'The pinnacle of high-stakes horological opulence. Features a full center dial paved with concentric rings of dazzling baguette-cut diamonds and 12 radiating baguette-cut emerald green gemstone hour markers. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Housed in mirror-polished 18K rose gold with hand-stitched alligator-grain leather.',
    '/watch-casino-roulette-diamond-emerald-front-transparent.webp',
    '/watch-casino-roulette-diamond-emerald-front-transparent.webp',
    '["/watch-casino-roulette-diamond-emerald-front-transparent.webp","/watch-casino-roulette-diamond-emerald-felt.webp","/watch-casino-roulette-diamond-emerald-macro.webp","/watch-casino-roulette-diamond-emerald-wheel.webp","/watch-casino-roulette-diamond-emerald-isometric-transparent.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-diamond-emerald-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with concentric baguette diamond dial, emerald hour markers, and dynamic roulette ring."},{"url":"/watch-casino-roulette-diamond-emerald-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"02 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the diamond and emerald paved dial."},{"url":"/watch-casino-roulette-diamond-emerald-macro.webp","title":"High Joaillerie Macro Perspective","label":"03 Macro Setting","caption":"Detailed macro perspective showcasing the precision concentric diamond pave and vibrant green baguette emeralds."},{"url":"/watch-casino-roulette-diamond-emerald-wheel.webp","title":"Gaming Wheel Horizon","label":"04 Casino Horizon","caption":"Angled perspective framed against casino wheel bokeh highlighting the mirror-polished rose gold bezel and 8 o''clock spinner pusher."},{"url":"/watch-casino-roulette-diamond-emerald-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"05 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and alligator leather strap."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Diamond Pave Dial with 12 Baguette Emerald Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Diamond Paved Center Dial","12 Radiating Baguette-Cut Natural Emerald Gemstone Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Luxury Emerald Green Leather Presentation Vault with Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    8,
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
    'casino-roulette-wheel-diamond-emerald',
    'HBR-8809-EM',
    'Casino Grand Roulette Wheel Baguette Diamond & Emerald 18K Rose Gold',
    'Tourbillon & Complications',
    8,
    188000,
    2260,
    '/watch-casino-roulette-diamond-emerald-front-transparent.webp',
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

-- 14. Casino Grand Roulette Wheel Baguette Blue Sapphire & Diamond 18K Rose Gold (HBR-8809-BL)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-sapphire-diamond',
    'HBR-8809-BL',
    'Casino Grand Roulette Wheel Baguette Blue Sapphire & Diamond 18K Rose Gold',
    'Full Concentric Baguette Sapphire Paved Dial • 12 Baguette Diamond Indices • Interactive Roulette Spinner',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,88,000',
    '$2,260',
    'Haute Joaillerie Allocation',
    '2026',
    'Electric celestial blue high-jewellery gaming horology. Features a full center dial paved with concentric radiating rings of rich baguette-cut royal blue sapphires and 12 radiating white baguette-cut diamond gemstone hour markers. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Housed in mirror-polished 18K rose gold with hand-stitched navy blue alligator-grain leather.',
    '/watch-casino-roulette-sapphire-diamond-front-transparent.webp',
    '/watch-casino-roulette-sapphire-diamond-front-transparent.webp',
    '["/watch-casino-roulette-sapphire-diamond-front-transparent.webp","/watch-casino-roulette-sapphire-diamond-isometric-transparent.webp","/watch-casino-roulette-sapphire-diamond-wheel.webp","/watch-casino-roulette-sapphire-diamond-macro.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-sapphire-diamond-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with concentric baguette blue sapphire dial, white diamond hour markers, and dynamic roulette ring."},{"url":"/watch-casino-roulette-sapphire-diamond-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and navy blue alligator leather strap."},{"url":"/watch-casino-roulette-sapphire-diamond-wheel.webp","title":"Gaming Wheel Horizon","label":"03 Casino Horizon","caption":"Angled perspective framed against casino wheel bokeh highlighting the mirror-polished rose gold bezel and 8 o''clock spinner pusher."},{"url":"/watch-casino-roulette-sapphire-diamond-macro.webp","title":"Casino Gaming Table Macro Perspective","label":"04 Casino Macro","caption":"Detailed macro perspective on casino roulette felt showcasing the brilliant blue sapphires and white diamond indices."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Blue Sapphire Pave Dial with 12 Baguette Diamond Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Royal Navy Blue","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Blue Sapphire Paved Center Dial","12 Radiating Baguette-Cut White Diamond Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Royal Navy Blue Leather Presentation Vault with Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    7,
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
    'casino-roulette-wheel-sapphire-diamond',
    'HBR-8809-BL',
    'Casino Grand Roulette Wheel Baguette Blue Sapphire & Diamond 18K Rose Gold',
    'Tourbillon & Complications',
    7,
    188000,
    2260,
    '/watch-casino-roulette-sapphire-diamond-front-transparent.webp',
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

-- 15. Casino Grand Roulette Wheel Imperial Emerald & Diamond 18K Rose Gold (HBR-8809-EG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-emerald-alligator',
    'HBR-8809-EG',
    'Casino Grand Roulette Wheel Imperial Emerald & Diamond 18K Rose Gold',
    'Full Concentric Baguette Emerald Paved Dial • 12 Baguette Diamond Indices • Emerald Alligator Strap',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,88,000',
    '$2,260',
    'Haute Joaillerie Allocation',
    '2026',
    'Imperial botanical elegance united with high-stakes Monte Carlo gaming. Features a full center dial paved with concentric radiating rings of intense baguette-cut natural emerald green gemstones, accented with 12 radiating white baguette-cut diamond hour indices. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Complemented by a matching hand-stitched emerald green alligator-grain leather strap.',
    '/watch-casino-roulette-emerald-alligator-front-transparent.webp',
    '/watch-casino-roulette-emerald-alligator-front-transparent.webp',
    '["/watch-casino-roulette-emerald-alligator-front-transparent.webp","/watch-casino-roulette-emerald-alligator-isometric-transparent.webp","/watch-casino-roulette-emerald-alligator-macro.webp","/watch-casino-roulette-emerald-alligator-felt.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-emerald-alligator-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with full concentric baguette emerald dial, diamond hour markers, and emerald alligator leather strap."},{"url":"/watch-casino-roulette-emerald-alligator-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and emerald green alligator strap."},{"url":"/watch-casino-roulette-emerald-alligator-macro.webp","title":"Casino Gaming Table Macro Perspective","label":"03 Casino Macro","caption":"Detailed macro perspective on green roulette table showcasing the brilliant green emeralds and white diamond indices."},{"url":"/watch-casino-roulette-emerald-alligator-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"04 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the all-green gemstone luxury."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Emerald Pave Dial with 12 Baguette Diamond Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Imperial Emerald Green","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Emerald Paved Center Dial","12 Radiating Baguette-Cut White Diamond Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Imperial Emerald Green Leather Presentation Vault with Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    6,
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
    'casino-roulette-wheel-emerald-alligator',
    'HBR-8809-EG',
    'Casino Grand Roulette Wheel Imperial Emerald & Diamond 18K Rose Gold',
    'Tourbillon & Complications',
    6,
    188000,
    2260,
    '/watch-casino-roulette-emerald-alligator-front-transparent.webp',
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

-- 16. Casino Grand Roulette Wheel Pigeon Blood Ruby & Diamond 18K Rose Gold (HBR-8809-RB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-ruby-diamond',
    'HBR-8809-RB',
    'Casino Grand Roulette Wheel Pigeon Blood Ruby & Diamond 18K Rose Gold',
    'Full Concentric Baguette Ruby Paved Dial • 12 Baguette Diamond Indices • Interactive Roulette Spinner',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,88,000',
    '$2,260',
    'Haute Joaillerie Allocation',
    '2026',
    'Fiery passion meets Monte Carlo high horology. Features a full center dial paved with concentric radiating rings of intense baguette-cut pigeon blood red rubies, accented with 12 radiating white baguette-cut diamond hour indices. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Housed in mirror-polished 18K rose gold with hand-stitched midnight black alligator-grain leather.',
    '/watch-casino-roulette-ruby-diamond-front-transparent.webp',
    '/watch-casino-roulette-ruby-diamond-front-transparent.webp',
    '["/watch-casino-roulette-ruby-diamond-front-transparent.webp","/watch-casino-roulette-ruby-diamond-isometric-transparent.webp","/watch-casino-roulette-ruby-diamond-wheel.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-ruby-diamond-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with full concentric baguette ruby dial, diamond hour markers, and black alligator strap."},{"url":"/watch-casino-roulette-ruby-diamond-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and alligator leather strap."},{"url":"/watch-casino-roulette-ruby-diamond-wheel.webp","title":"Gaming Wheel Horizon","label":"03 Casino Horizon","caption":"Angled perspective framed against casino wheel bokeh highlighting the mirror-polished rose gold bezel and 8 o''clock spinner pusher."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Pigeon Blood Ruby Pave Dial with 12 Baguette Diamond Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Pigeon Blood Ruby Paved Center Dial","12 Radiating Baguette-Cut White Diamond Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Pigeon Blood Crimson Leather Presentation Vault with Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    5,
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
    'casino-roulette-wheel-ruby-diamond',
    'HBR-8809-RB',
    'Casino Grand Roulette Wheel Pigeon Blood Ruby & Diamond 18K Rose Gold',
    'Tourbillon & Complications',
    5,
    188000,
    2260,
    '/watch-casino-roulette-ruby-diamond-front-transparent.webp',
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

-- 17. Casino Grand Roulette Wheel Baguette Diamond & Emerald Classic Silver (HBR-8809-SE)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-silver-diamond-emerald',
    'HBR-8809-SE',
    'Casino Grand Roulette Wheel Baguette Diamond & Emerald Classic Silver',
    'Full Concentric Baguette Diamond Paved Dial • 12 Baguette Emerald Indices • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,78,000',
    '$2,140',
    'Haute Joaillerie Allocation',
    '2026',
    'High-stakes luxury gaming horology forged in solid 316L surgical stainless steel. Features a full center dial paved with concentric radiating rings of dazzling baguette-cut diamonds and 12 radiating natural baguette-cut emerald green gemstone hour markers. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Complemented by a hand-stitched alligator-embossed midnight black Italian calfskin leather strap.',
    '/watch-casino-roulette-silver-diamond-emerald-front-transparent.webp',
    '/watch-casino-roulette-silver-diamond-emerald-front-transparent.webp',
    '["/watch-casino-roulette-silver-diamond-emerald-front-transparent.webp","/watch-casino-roulette-silver-diamond-emerald-wheel-transparent.webp","/watch-casino-roulette-silver-diamond-emerald-felt.webp","/watch-casino-roulette-silver-diamond-emerald-wrist-angle.webp","/watch-casino-roulette-silver-diamond-emerald-wrist-closeup.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-silver-diamond-emerald-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with concentric baguette diamond dial, emerald hour markers, and black alligator leather strap."},{"url":"/watch-casino-roulette-silver-diamond-emerald-wheel-transparent.webp","title":"Gaming Wheel Horizon","label":"02 Casino Horizon","caption":"Angled perspective framed against casino wheel bokeh highlighting the mirror-polished steel bezel and 8 o''clock spinner pusher."},{"url":"/watch-casino-roulette-silver-diamond-emerald-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"03 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the diamond and emerald paved dial."},{"url":"/watch-casino-roulette-silver-diamond-emerald-wrist-angle.webp","title":"Sartorial Wrist Horizon Angle","label":"04 Wrist Angle","caption":"On-wrist high-angle perspective showcasing the depth of the 3D roulette flange and luminous steel hands."},{"url":"/watch-casino-roulette-silver-diamond-emerald-wrist-closeup.webp","title":"Close-Up On-Wrist Dial Perspective","label":"05 Wrist Close-Up","caption":"Detailed macro wrist perspective demonstrating crisp pocket typography, white ball marker alignment, and crown profile."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Diamond Pave Dial with 12 Baguette Emerald Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Diamond Paved Center Dial","12 Radiating Baguette-Cut Natural Emerald Gemstone Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Silver Steel Collector Presentation Vault with Custom Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    12,
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
    'casino-roulette-wheel-silver-diamond-emerald',
    'HBR-8809-SE',
    'Casino Grand Roulette Wheel Baguette Diamond & Emerald Classic Silver',
    'Tourbillon & Complications',
    12,
    178000,
    2140,
    '/watch-casino-roulette-silver-diamond-emerald-front-transparent.webp',
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

-- 18. Casino Grand Roulette Wheel Baguette Blue Sapphire & Diamond Classic Silver (HBR-8809-SB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-silver-sapphire-diamond',
    'HBR-8809-SB',
    'Casino Grand Roulette Wheel Baguette Blue Sapphire & Diamond Classic Silver',
    'Full Concentric Baguette Sapphire Paved Dial • 12 Baguette Diamond Indices • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,78,000',
    '$2,140',
    'Haute Joaillerie Allocation',
    '2026',
    'Electric cobalt horology in precision 316L surgical stainless steel. Features a full center dial paved with concentric radiating rings of intense baguette-cut royal blue sapphires, accented with 12 radiating white baguette-cut diamond gemstone hour markers. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Paired with a hand-stitched royal navy blue alligator-grain leather strap.',
    '/watch-casino-roulette-silver-sapphire-diamond-front-transparent.webp',
    '/watch-casino-roulette-silver-sapphire-diamond-front-transparent.webp',
    '["/watch-casino-roulette-silver-sapphire-diamond-front-transparent.webp","/watch-casino-roulette-silver-sapphire-diamond-isometric-transparent.webp","/watch-casino-roulette-silver-sapphire-diamond-wheel.webp","/watch-casino-roulette-silver-sapphire-diamond-wrist.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-silver-sapphire-diamond-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with concentric baguette blue sapphire dial, white diamond hour markers, and navy alligator strap."},{"url":"/watch-casino-roulette-silver-sapphire-diamond-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and navy blue alligator leather strap."},{"url":"/watch-casino-roulette-silver-sapphire-diamond-wheel.webp","title":"Gaming Wheel Horizon","label":"03 Casino Horizon","caption":"Angled perspective framed against casino wheel and chips highlighting the mirror-polished steel bezel and 8 o''clock spinner pusher."},{"url":"/watch-casino-roulette-silver-sapphire-diamond-wrist.webp","title":"Sartorial Casino Wrist Perspective","label":"04 Wrist Perspective","caption":"On-wrist perspective at casino gaming table showcasing the radiant blue sapphire dial and polished stainless steel case."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Blue Sapphire Pave Dial with 12 Baguette Diamond Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Royal Navy Blue","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Blue Sapphire Paved Center Dial","12 Radiating Baguette-Cut White Diamond Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Silver Steel Navy Presentation Vault with Custom Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    11,
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
    'casino-roulette-wheel-silver-sapphire-diamond',
    'HBR-8809-SB',
    'Casino Grand Roulette Wheel Baguette Blue Sapphire & Diamond Classic Silver',
    'Tourbillon & Complications',
    11,
    178000,
    2140,
    '/watch-casino-roulette-silver-sapphire-diamond-front-transparent.webp',
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

-- 19. Casino Grand Roulette Wheel Imperial Emerald & Diamond Classic Silver (HBR-8809-SG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-silver-emerald-alligator',
    'HBR-8809-SG',
    'Casino Grand Roulette Wheel Imperial Emerald & Diamond Classic Silver',
    'Full Concentric Baguette Emerald Paved Dial • 12 Baguette Diamond Indices • Emerald Alligator Strap',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,78,000',
    '$2,140',
    'Haute Joaillerie Allocation',
    '2026',
    'Imperial emerald radiance forged in surgical 316L stainless steel. Features a full center dial paved with concentric radiating rings of intense baguette-cut natural emerald green gemstones, accented with 12 radiating white baguette-cut diamond hour indices. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Fitted with a bespoke hand-stitched emerald green alligator-grain calfskin leather strap.',
    '/watch-casino-roulette-silver-emerald-alligator-front-transparent.webp',
    '/watch-casino-roulette-silver-emerald-alligator-front-transparent.webp',
    '["/watch-casino-roulette-silver-emerald-alligator-front-transparent.webp","/watch-casino-roulette-silver-emerald-alligator-felt.webp","/watch-casino-roulette-silver-emerald-alligator-wrist.webp","/watch-casino-roulette-silver-emerald-alligator-isometric-transparent.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-silver-emerald-alligator-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with concentric baguette emerald dial, white diamond hour markers, and emerald alligator strap."},{"url":"/watch-casino-roulette-silver-emerald-alligator-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"02 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the vivid green gemstone luxury."},{"url":"/watch-casino-roulette-silver-emerald-alligator-wrist.webp","title":"Sartorial Casino Wrist Perspective","label":"03 Wrist Perspective","caption":"On-wrist perspective at casino gaming table showcasing the emerald dial brilliance and polished steel case."},{"url":"/watch-casino-roulette-silver-emerald-alligator-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"04 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and emerald green alligator leather strap."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Emerald Pave Dial with 12 Baguette Diamond Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Imperial Emerald Green","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Emerald Paved Center Dial","12 Radiating Baguette-Cut White Diamond Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Silver Steel Emerald Presentation Vault with Custom Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    10,
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
    'casino-roulette-wheel-silver-emerald-alligator',
    'HBR-8809-SG',
    'Casino Grand Roulette Wheel Imperial Emerald & Diamond Classic Silver',
    'Tourbillon & Complications',
    10,
    178000,
    2140,
    '/watch-casino-roulette-silver-emerald-alligator-front-transparent.webp',
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

-- 20. Casino Grand Roulette Wheel Baguette Pigeon Blood Ruby & Diamond Classic Silver (HBR-8809-SR)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'casino-roulette-wheel-silver-ruby-diamond',
    'HBR-8809-SR',
    'Casino Grand Roulette Wheel Baguette Pigeon Blood Ruby & Diamond Classic Silver',
    'Full Concentric Baguette Ruby Paved Dial • 12 Baguette Diamond Indices • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'High Jewellery Roulette',
    '₹1,78,000',
    '$2,140',
    'Haute Joaillerie Allocation',
    '2026',
    'Fiery ruby brilliance forged in precision 316L surgical stainless steel. Features a full center dial paved with concentric radiating rings of intense baguette-cut pigeon blood red rubies, accented with 12 radiating white baguette-cut diamond gemstone hour markers. Framed by an interactive European roulette complication with 37 miniature lacquered pockets (green ''0'' and 1–36 in alternating red and black) mounted on ceramic micro-ball bearings. Pressing the mechanical pusher at 8 o''clock sends the entire roulette disc into a high-speed spin before coming to rest beside the floating white ball marker. Paired with a hand-stitched midnight black alligator-grain calfskin leather strap.',
    '/watch-casino-roulette-silver-ruby-diamond-front-transparent.webp',
    '/watch-casino-roulette-silver-ruby-diamond-front-transparent.webp',
    '["/watch-casino-roulette-silver-ruby-diamond-front-transparent.webp","/watch-casino-roulette-silver-ruby-diamond-isometric-transparent.webp","/watch-casino-roulette-silver-ruby-diamond-felt.webp","/watch-casino-roulette-silver-ruby-diamond-wrist.webp"]'::jsonb,
    '[{"url":"/watch-casino-roulette-silver-ruby-diamond-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with concentric baguette ruby dial, white diamond hour markers, and black alligator strap."},{"url":"/watch-casino-roulette-silver-ruby-diamond-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective highlighting the domed sapphire crystal, pocket depth, and midnight black alligator leather strap."},{"url":"/watch-casino-roulette-silver-ruby-diamond-felt.webp","title":"Monte Carlo Green Felt Casino Setting","label":"03 Casino Felt","caption":"Editorial casino composition on green felt table surrounded by gaming chips highlighting the vivid red pigeon blood ruby dial."},{"url":"/watch-casino-roulette-silver-ruby-diamond-wrist.webp","title":"Sartorial Casino Wrist Perspective","label":"04 Wrist Perspective","caption":"On-wrist perspective at casino gaming table showcasing the fiery ruby dial brilliance and polished steel case."}]'::jsonb,
    '{"movement":"Caliber H-8809 Dynamic Roulette Multi-Function Automatic Caliber with Ceramic Ball-Bearing Spinner","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"43.5 mm Diameter × 14.5 mm Thickness","lugToLug":"50.5 mm","glass":"Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Roulette Wheel Skeleton Rotor","dial":"Full Concentric Baguette Pigeon Blood Ruby Pave Dial with 12 Baguette Diamond Hour Markers & Dynamic Outer Roulette Ring","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Full Concentric Baguette Pigeon Blood Ruby Paved Center Dial","12 Radiating Baguette-Cut White Diamond Hour Markers","Mechanical 8 O''Clock Push-Button Roulette Spin Mechanism","Dynamic 37-Pocket Multi-Color European Roulette Disk with White Ball Marker","Ceramic Micro-Ball Bearing High-Velocity Low-Friction Kinetic Rotor"],"packaging":"Silver Steel Ruby Presentation Vault with Custom Metallic Chips & NFC High Joaillerie Passport"}'::jsonb,
    9,
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
    'casino-roulette-wheel-silver-ruby-diamond',
    'HBR-8809-SR',
    'Casino Grand Roulette Wheel Baguette Pigeon Blood Ruby & Diamond Classic Silver',
    'Tourbillon & Complications',
    9,
    178000,
    2140,
    '/watch-casino-roulette-silver-ruby-diamond-front-transparent.webp',
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

-- 21. Celestial Imperial Dragon Co-Axial Tourbillon 18K Rose Gold (HBR-8812-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'celestial-dragon-tourbillon-rosegold',
    'HBR-8812-RG',
    'Celestial Imperial Dragon Co-Axial Tourbillon 18K Rose Gold',
    'Hand-Sculpted 3D Imperial Gold Dragon • Glittering Aventurine Starry Dial • Co-Axial Tourbillon',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Imperial Metiers d''Art',
    '₹1,68,000',
    '$2,020',
    'Limited Edition',
    '2026',
    'A masterwork of Métiers d''Art horology fusing mythological majesty with haute complications. Dominated by a hand-carved and micro-sculpted 3D Imperial Dragon in 18K gold with ruby-set eyes and forehead pearl, weaving through a deep celestial midnight blue aventurine crystal dial sparkling with cosmic stars. Equipped with a flying co-axial tourbillon balance assembly at 9 o''clock, an openworked Roman numeral time chapter ring at 4 o''clock with flame-blued hands, and a micro-detailed lunar moon complication at 6 o''clock. Cased in 18K rose gold PVD 316L stainless steel with a sapphire blue fluted crown and navy alligator leather.',
    '/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp',
    '/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp',
    '["/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp","/watch-celestial-dragon-tourbillon-rosegold-isometric-transparent.webp","/watch-celestial-dragon-tourbillon-rosegold-lantern.webp","/watch-celestial-dragon-tourbillon-rosegold-macro.webp","/watch-celestial-dragon-tourbillon-rosegold-wrist.webp"]'::jsonb,
    '[{"url":"/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with sculpted 3D gold dragon, aventurine dial, flying tourbillon, and navy alligator strap."},{"url":"/watch-celestial-dragon-tourbillon-rosegold-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective showcasing the high-relief dragon anatomy, blue fluted crown, and deployant clasp."},{"url":"/watch-celestial-dragon-tourbillon-rosegold-lantern.webp","title":"Lantern Festival Dragon Horizon","label":"03 Lantern Setting","caption":"Editorial oriental composition framed against atmospheric glowing lanterns and dragon artwork."},{"url":"/watch-celestial-dragon-tourbillon-rosegold-macro.webp","title":"Imperial Dragon High Art Setting","label":"04 Dragon Horizon","caption":"Macro perspective framed against golden dragon motif highlighting the aventurine dial stars and openwork tourbillon."},{"url":"/watch-celestial-dragon-tourbillon-rosegold-wrist.webp","title":"Sartorial On-Wrist Perspective","label":"05 Wrist Perspective","caption":"Outdoor on-wrist perspective demonstrating the dramatic presence of the sculpted dragon, blued hands, and rose gold case."}]'::jsonb,
    '{"movement":"Caliber H-8812 Imperial Celestial Flying Tourbillon Openworked Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"44 mm Diameter × 14.8 mm Thickness","lugToLug":"51.0 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Imperial Dragon Engraved Rotor","dial":"Natural Cosmic Midnight Blue Aventurine Starry Dial with 3D Hand-Sculpted 18K Gold Dragon & Openworked Roman Numeral Sub-Dial","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Royal Midnight Navy Blue","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Hand-Sculpted 3D Imperial Gold Dragon with Ruby Eyes","Flying Co-Axial Tourbillon Balance Assembly at 9 O''Clock","Decentralized Skeletonized Roman Numeral Time Sub-Dial at 4 O''Clock","Micro-Carved 3D Lunar Moon Complication at 6 O''Clock","Natural Cosmic Midnight Blue Aventurine Glass Base Dial"],"packaging":"Imperial Lacquered Red & Gold Dragon Presentation Chest with NFC Certificate of Authenticity"}'::jsonb,
    8,
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
    'celestial-dragon-tourbillon-rosegold',
    'HBR-8812-RG',
    'Celestial Imperial Dragon Co-Axial Tourbillon 18K Rose Gold',
    'Tourbillon & Complications',
    8,
    168000,
    2020,
    '/watch-celestial-dragon-tourbillon-rosegold-front-transparent.webp',
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

-- 22. Celestial Imperial Dragon Co-Axial Tourbillon Classic Silver (HBR-8812-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'celestial-dragon-tourbillon-silver',
    'HBR-8812-SS',
    'Celestial Imperial Dragon Co-Axial Tourbillon Classic Silver',
    'Hand-Sculpted 3D Imperial Silver Dragon • Glittering Aventurine Starry Dial • 316L Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Imperial Metiers d''Art',
    '₹1,58,000',
    '$1,900',
    'Limited Edition',
    '2026',
    'A breathtaking synthesis of legendary mythology and micro-mechanical mastery forged in solid 316L surgical stainless steel. Dominated by a hand-carved and micro-sculpted 3D Imperial Silver Dragon with ruby-set eyes and forehead jewel, coiling majestically across a deep cosmic midnight blue aventurine crystal dial embedded with shimmering starry constellations. Equipped with an openworked flying co-axial tourbillon balance assembly at 9 o''clock, a decentralized skeletonized Roman numeral time sub-dial at 4 o''clock with flame-blued hands, and a micro-detailed lunar moon complication at 6 o''clock. Cased in mirror-polished surgical steel with a sapphire blue fluted crown and royal midnight navy blue alligator leather strap.',
    '/watch-celestial-dragon-tourbillon-silver-front-transparent.webp',
    '/watch-celestial-dragon-tourbillon-silver-front-transparent.webp',
    '["/watch-celestial-dragon-tourbillon-silver-front-transparent.webp","/watch-celestial-dragon-tourbillon-silver-isometric-transparent.webp","/watch-celestial-dragon-tourbillon-silver-lantern.webp","/watch-celestial-dragon-tourbillon-silver-macro.webp","/watch-celestial-dragon-tourbillon-silver-isometric-detail-transparent.webp"]'::jsonb,
    '[{"url":"/watch-celestial-dragon-tourbillon-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with sculpted 3D silver dragon, aventurine dial, flying tourbillon, and navy alligator strap."},{"url":"/watch-celestial-dragon-tourbillon-silver-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective showcasing the high-relief silver dragon anatomy, blue fluted crown, and deployant clasp."},{"url":"/watch-celestial-dragon-tourbillon-silver-lantern.webp","title":"Lantern Festival Dragon Horizon","label":"03 Lantern Setting","caption":"Editorial oriental composition framed against atmospheric glowing lanterns and dragon artwork."},{"url":"/watch-celestial-dragon-tourbillon-silver-macro.webp","title":"Imperial Dragon High Art Setting","label":"04 Dragon Horizon","caption":"Macro perspective framed against golden dragon motif highlighting the silver dragon scales, aventurine stars, and openwork tourbillon."},{"url":"/watch-celestial-dragon-tourbillon-silver-isometric-detail-transparent.webp","title":"Isometric Watch Detail","label":"05 Isometric Detail","caption":"Angled macro studio perspective highlighting the double-domed sapphire crystal, blue crown ring, and supple alligator strap."}]'::jsonb,
    '{"movement":"Caliber H-8812 Imperial Celestial Flying Tourbillon Openworked Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44 mm Diameter × 14.8 mm Thickness","lugToLug":"51.0 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Imperial Dragon Engraved Rotor","dial":"Natural Cosmic Midnight Blue Aventurine Starry Dial with 3D Hand-Sculpted Silver Dragon & Openworked Roman Numeral Sub-Dial","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Royal Midnight Navy Blue","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["Hand-Sculpted 3D Imperial Silver Dragon with Ruby Eyes","Flying Co-Axial Tourbillon Balance Assembly at 9 O''Clock","Decentralized Skeletonized Roman Numeral Time Sub-Dial at 4 O''Clock","Micro-Carved 3D Lunar Moon Complication at 6 O''Clock","Natural Cosmic Midnight Blue Aventurine Glass Base Dial"],"packaging":"Imperial Lacquered Silver & Blue Dragon Presentation Chest with NFC Certificate of Authenticity"}'::jsonb,
    7,
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
    'celestial-dragon-tourbillon-silver',
    'HBR-8812-SS',
    'Celestial Imperial Dragon Co-Axial Tourbillon Classic Silver',
    'Tourbillon & Complications',
    7,
    158000,
    1900,
    '/watch-celestial-dragon-tourbillon-silver-front-transparent.webp',
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

-- 23. Planetary Solar System Cosmos Co-Axial Tourbillon 18K Rose Gold (HBR-8815-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'planetary-cosmos-tourbillon-rosegold',
    'HBR-8815-RG',
    'Planetary Solar System Cosmos Co-Axial Tourbillon 18K Rose Gold',
    '3D Rotating Earth Hemisphere • Orbiting Planetary Solar System • Co-Axial Tourbillon',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Astronomical Complication',
    '₹1,68,000',
    '$2,020',
    'Limited Edition',
    '2026',
    'An astronomical horological marvel capturing the grandeur of the celestial cosmos. Features a vivid 3D micro-sculptured and hand-enameled rotating Earth hemisphere at 5 o''clock, orbiting miniature lacquer planets (Mars, Jupiter, Sun flare, Moon, Saturn) across a deep cosmic midnight blue aventurine starry glass dial. At 10 o''clock, an exposed flying co-axial tourbillon balance wheel oscillates beneath a mirror-polished steel skeleton bridge. The central time display features a globe-engraved chapter ring with Roman numerals and flame-blued leaf hands, encircled by 12 pearl-like luminous celestial sphere hour markers. Cased in 18K rose gold PVD 316L stainless steel with a sapphire blue fluted crown and midnight black alligator leather.',
    '/watch-planetary-cosmos-tourbillon-rosegold-front-transparent.webp',
    '/watch-planetary-cosmos-tourbillon-rosegold-front-transparent.webp',
    '["/watch-planetary-cosmos-tourbillon-rosegold-front-transparent.webp","/watch-planetary-cosmos-tourbillon-rosegold-galaxy.webp","/watch-planetary-cosmos-tourbillon-rosegold-wrist-sartorial.webp","/watch-planetary-cosmos-tourbillon-rosegold-planets.webp","/watch-planetary-cosmos-tourbillon-rosegold-wrist-macro.webp"]'::jsonb,
    '[{"url":"/watch-planetary-cosmos-tourbillon-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with 3D Earth sphere, aventurine planetary dial, flying tourbillon, and black alligator strap."},{"url":"/watch-planetary-cosmos-tourbillon-rosegold-galaxy.webp","title":"Deep Space Nebula Horizon","label":"02 Nebula Galaxy","caption":"Celestial editorial composition framed against deep cosmic nebula and orbiting planets highlighting the luminous earth sphere."},{"url":"/watch-planetary-cosmos-tourbillon-rosegold-wrist-sartorial.webp","title":"Sartorial Luxury Wrist Perspective","label":"03 Sartorial Wrist","caption":"On-wrist perspective in luxury setting showcasing the 18K rose gold case, blued hands, and planetary depth."},{"url":"/watch-planetary-cosmos-tourbillon-rosegold-planets.webp","title":"Solar System Orbiting Horizon","label":"04 Solar Horizon","caption":"Atmospheric astronomical setting with solar planets demonstrating the depth and micro-sculpted details."},{"url":"/watch-planetary-cosmos-tourbillon-rosegold-wrist-macro.webp","title":"Macro On-Wrist Celestial Detail","label":"05 Macro Wrist","caption":"Angled macro on-wrist perspective highlighting the 3D double-domed sapphire crystal, blue crown ring, and supple alligator leather."}]'::jsonb,
    '{"movement":"Caliber H-8815 Astronomical Planetary Orbiting Tourbillon Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Bezel","caseDimensions":"44 mm Diameter × 14.8 mm Thickness","lugToLug":"51.0 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Solar System Planetary Engraved Rotor","dial":"Natural Cosmic Midnight Blue Aventurine Starry Dial with 3D Enamel Earth Sphere & Orbiting Miniature Lacquer Planets","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"18K Rose Gold PVD Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["3D Hand-Enameled Micro-Sculpted Rotating Earth Hemisphere at 5 O''Clock","Flying Co-Axial Tourbillon Balance Assembly at 10 O''Clock","Central Globe-Engraved Roman Numeral Time Sub-Dial with Blued Hands","12 Orbiting Luminous Pearl Celestial Sphere Hour Markers","Natural Cosmic Midnight Blue Aventurine Glass Base with Miniature Lacquer Planets"],"packaging":"Celestial Solar System Lacquered Presentation Chest with NFC Certificate of Authenticity"}'::jsonb,
    6,
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
    'planetary-cosmos-tourbillon-rosegold',
    'HBR-8815-RG',
    'Planetary Solar System Cosmos Co-Axial Tourbillon 18K Rose Gold',
    'Tourbillon & Complications',
    6,
    168000,
    2020,
    '/watch-planetary-cosmos-tourbillon-rosegold-front-transparent.webp',
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

-- 24. Planetary Solar System Cosmos Co-Axial Tourbillon Classic Silver (HBR-8815-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'planetary-cosmos-tourbillon-silver',
    'HBR-8815-SS',
    'Planetary Solar System Cosmos Co-Axial Tourbillon Classic Silver',
    '3D Rotating Earth Hemisphere • Orbiting Planetary Solar System • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Astronomical Complication',
    '₹1,58,000',
    '$1,900',
    'Limited Edition',
    '2026',
    'Astronomical mechanics engineered in precision 316L surgical stainless steel. Features an enameled 3D rotating Earth hemisphere at 5 o''clock revolving continuously, encircled by miniature hand-lacquered orbiting planets (Mars, Jupiter, Sun flare, Moon, Saturn) set against a natural deep cosmic midnight blue aventurine starry glass dial. At 10 o''clock, an exposed flying co-axial tourbillon balance wheel oscillates beneath a mirror-polished steel skeleton bridge. The central time display features a globe-engraved chapter ring with Roman numerals and flame-blued leaf hands, encircled by 12 pearl-like luminous celestial sphere hour markers. Cased in mirror-polished stainless steel with a sapphire blue fluted crown and midnight black alligator leather.',
    '/watch-planetary-cosmos-tourbillon-silver-front-transparent.webp',
    '/watch-planetary-cosmos-tourbillon-silver-front-transparent.webp',
    '["/watch-planetary-cosmos-tourbillon-silver-front-transparent.webp","/watch-planetary-cosmos-tourbillon-silver-galaxy.webp","/watch-planetary-cosmos-tourbillon-silver-planets.webp","/watch-planetary-cosmos-tourbillon-silver-wrist-sartorial.webp","/watch-planetary-cosmos-tourbillon-silver-wrist-macro.webp"]'::jsonb,
    '[{"url":"/watch-planetary-cosmos-tourbillon-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with 3D Earth sphere, aventurine planetary dial, flying tourbillon, and black alligator strap."},{"url":"/watch-planetary-cosmos-tourbillon-silver-galaxy.webp","title":"Deep Space Nebula Horizon","label":"02 Nebula Galaxy","caption":"Celestial editorial composition framed against deep cosmic nebula and orbiting planets highlighting the luminous earth sphere."},{"url":"/watch-planetary-cosmos-tourbillon-silver-planets.webp","title":"Solar System Orbiting Horizon","label":"03 Solar Horizon","caption":"Atmospheric astronomical setting with solar planets demonstrating the depth and micro-sculpted details."},{"url":"/watch-planetary-cosmos-tourbillon-silver-wrist-sartorial.webp","title":"Sartorial Luxury Wrist Perspective","label":"04 Sartorial Wrist","caption":"On-wrist perspective in luxury setting showcasing the mirror-polished steel case, blued hands, and planetary depth."},{"url":"/watch-planetary-cosmos-tourbillon-silver-wrist-macro.webp","title":"Macro On-Wrist Celestial Detail","label":"05 Macro Wrist","caption":"Angled macro on-wrist perspective highlighting the 3D double-domed sapphire crystal, blue crown ring, and supple alligator leather."}]'::jsonb,
    '{"movement":"Caliber H-8815 Astronomical Planetary Orbiting Tourbillon Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44 mm Diameter × 14.8 mm Thickness","lugToLug":"51.0 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Solar System Planetary Engraved Rotor","dial":"Natural Cosmic Midnight Blue Aventurine Starry Dial with 3D Enamel Earth Sphere & Orbiting Miniature Lacquer Planets","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Double-Security Butterfly Deployant Clasp","complications":["3D Hand-Enameled Micro-Sculpted Rotating Earth Hemisphere at 5 O''Clock","Flying Co-Axial Tourbillon Balance Assembly at 10 O''Clock","Central Globe-Engraved Roman Numeral Time Sub-Dial with Blued Hands","12 Orbiting Luminous Pearl Celestial Sphere Hour Markers","Natural Cosmic Midnight Blue Aventurine Glass Base with Miniature Lacquer Planets"],"packaging":"Celestial Solar System Lacquered Presentation Chest with NFC Certificate of Authenticity"}'::jsonb,
    5,
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
    'planetary-cosmos-tourbillon-silver',
    'HBR-8815-SS',
    'Planetary Solar System Cosmos Co-Axial Tourbillon Classic Silver',
    'Tourbillon & Complications',
    5,
    158000,
    1900,
    '/watch-planetary-cosmos-tourbillon-silver-front-transparent.webp',
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

-- 25. Oceanic Pro Diver 200M Automatic Emerald Kermit (HBR-1102-GN)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'oceanic-diver-200m-green',
    'HBR-1102-GN',
    'Oceanic Pro Diver 200M Automatic Emerald Kermit',
    'Unidirectional Ceramic Bezel • Sunburst Emerald Green Dial • 200M / 660ft Professional Diver',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Professional Diver',
    '₹86,000',
    '$1,035',
    'In Stock',
    '2026',
    'Built for deep underwater exploration and everyday elegance. Engineered with an emerald green scratch-proof unidirectional rotating ceramic bezel (120 clicks) calibrated with a 60-minute dive scale and luminous pearl pip. The sunburst emerald green dial features high-contrast luminescent geometric indices and sword-and-baton hands treated with ultra-bright Swiss Super-LumiNova for maximum underwater legibility. Powered by a high-torque automatic caliber with 42 hours of power reserve and framed date display at 3 o''clock. Fitted with a solid 316L surgical stainless steel Oyster 3-link bracelet with diver extension safety deployant clasp, tested to 200 meters (20 ATM / 660 feet) of water resistance.',
    '/watch-oceanic-diver-200m-green-front-transparent.webp',
    '/watch-oceanic-diver-200m-green-front-transparent.webp',
    '["/watch-oceanic-diver-200m-green-front-transparent.webp","/watch-oceanic-diver-200m-green-underwater.webp","/watch-oceanic-diver-200m-green-splash.webp","/watch-oceanic-diver-200m-green-isometric-transparent.webp","/watch-oceanic-diver-200m-green-wrist-sartorial.webp"]'::jsonb,
    '[{"url":"/watch-oceanic-diver-200m-green-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel diver case with emerald ceramic bezel, sunburst green dial, and Oyster bracelet."},{"url":"/watch-oceanic-diver-200m-green-underwater.webp","title":"200M Oceanic Hydro-Test Horizon","label":"02 Hydro Dive","caption":"On-wrist underwater perspective in dynamic water splash showcasing extreme waterproof integrity and emerald reflection."},{"url":"/watch-oceanic-diver-200m-green-splash.webp","title":"Marine Coastal Rock Horizon","label":"03 Marine Horizon","caption":"Marine perspective resting on sea rocks surrounded by ocean spray highlighting the ceramic bezel and brushed steel luster."},{"url":"/watch-oceanic-diver-200m-green-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"04 Isometric Profile","caption":"Angled studio perspective on acrylic display highlighting the 120-click ceramic bezel teeth, date window, and Oyster links."},{"url":"/watch-oceanic-diver-200m-green-wrist-sartorial.webp","title":"Tailored Sartorial Urban Horizon","label":"05 Sartorial Wrist","caption":"On-wrist perspective paired with tailored coat showcasing the versatility from ocean depths to boardroom refinement."}]'::jsonb,
    '{"movement":"Caliber H-1102 High-Torque Automatic Diving Caliber with Date Quickset","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"42 Hours","jewels":"24 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Lugs & Mirror-Polished Flanks","caseDimensions":"41 mm Diameter × 12.8 mm Thickness","lugToLug":"48.0 mm","glass":"Scratch-Resistant Flat Sapphire Crystal with Anti-Reflective Inner Coating","bezel":"120-Click Unidirectional Rotating Emerald Green High-Tech Ceramic Bezel with Luminous 12H Pearl Pip","crown":"Screw-Down Triple-Lock Waterproof Crown with Embossed HANBORO Emblem & Protective Crown Guards","caseback":"Screw-Down Solid 316L Stainless Steel Diving Caseback with Deep-Sea Engraving","dial":"Sunburst Emerald Green Radial Dial with Applied Luminescent Geometric Indices & Framed 3H Date Window","lume":"Swiss Super-LumiNova BGW9 / C3 Luminous Coating on Hands, Hour Markers, and Bezel Pip","waterResistance":"200 Meters (20 ATM / 660 Feet / ISO 6425 Compliant)","strap":"Solid 316L Surgical Stainless Steel 3-Link Oyster Bracelet with Brushed Finish & Polished Chamfers","clasp":"Milled Solid 316L Stainless Steel Safety Folding Clasp with Diver Extension & Micro-Adjustment","packaging":"Waterproof High-Impact Diver''s Pelicase with Spring Bar Tool & International Warranty Card"}'::jsonb,
    12,
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
    'oceanic-diver-200m-green',
    'HBR-1102-GN',
    'Oceanic Pro Diver 200M Automatic Emerald Kermit',
    'Automatic Masterpieces',
    12,
    86000,
    1035,
    '/watch-oceanic-diver-200m-green-front-transparent.webp',
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

-- 26. Seamaster Pro Chronograph Diver 100M Sunburst Teal (HBR-1105-TG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'seamaster-chronograph-diver-teal',
    'HBR-1105-TG',
    'Seamaster Pro Chronograph Diver 100M Sunburst Teal',
    'Tri-Compax Chronograph • Sunburst Teal Radial Dial • 3D Embossed Ceramic Bezel',
    'CHRONOGRAPH',
    'Chronograph & Sport',
    'Diver Chronograph',
    '₹89,000',
    '$1,070',
    'In Stock',
    '2026',
    'High-performance aquatic precision combined with multi-register chronograph functionality. Features a breathtaking sunburst teal-emerald radial gradient dial with three circular-grained auxiliary registers: a 60-minute chronograph counter at 9 o''clock, a 24-hour day/night indicator at 6 o''clock, and running small seconds at 3 o''clock. Encircled by a scratch-resistant matte black ceramic diving bezel with 3D embossed polished 60-minute numerals and triangle pip marker. Equipped with dual screw-locked chronograph pushers, an angled date aperture at 4:30, high-luminosity indices, and a solid 316L stainless steel 3-link Oyster bracelet with polished center links, engineered for 100 meters (10 ATM / 330 feet) of water resistance.',
    '/watch-seamaster-chronograph-diver-teal-front-transparent.webp',
    '/watch-seamaster-chronograph-diver-teal-front-transparent.webp',
    '["/watch-seamaster-chronograph-diver-teal-front-transparent.webp","/watch-seamaster-chronograph-diver-teal-isometric-transparent.webp","/watch-seamaster-chronograph-diver-teal-horizon.webp","/watch-seamaster-chronograph-diver-teal-splash.webp"]'::jsonb,
    '[{"url":"/watch-seamaster-chronograph-diver-teal-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel chronograph case with embossed ceramic bezel, teal sunburst dial, and Oyster bracelet."},{"url":"/watch-seamaster-chronograph-diver-teal-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on acrylic display highlighting the dual chronograph pushers, crown guards, and tri-compax registers."},{"url":"/watch-seamaster-chronograph-diver-teal-horizon.webp","title":"Coastal Sea Foam Marine Horizon","label":"03 Coastal Horizon","caption":"Editorial maritime composition framed against ocean foam and sea ice highlighting the sunburst teal dial reflections."},{"url":"/watch-seamaster-chronograph-diver-teal-splash.webp","title":"Wet Rock Splash Hydro-Chronograph","label":"04 Splash Action","caption":"Marine dynamic splash perspective on coastal rocks highlighting the waterproof case construction and polished center links."}]'::jsonb,
    '{"movement":"Caliber H-1105 Precision Multi-Function Chronograph Movement with 24H Indicator & Date","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"27 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Lugs & Mirror-Polished Flanks","caseDimensions":"42 mm Diameter × 13.5 mm Thickness","lugToLug":"49.0 mm","glass":"Scratch-Resistant Flat Sapphire Crystal with Anti-Reflective Inner Coating","bezel":"120-Click Unidirectional Rotating Matte Black Ceramic Bezel with 3D Embossed Polished Numerals","crown":"Screw-Down Waterproof Crown with Embossed Logo Flanked by Dual Sealed Chronograph Pushers","caseback":"Screw-Down Solid 316L Stainless Steel Diving Caseback with Deep-Sea Engraving","dial":"Sunburst Teal-Emerald Gradient Radial Dial with Tri-Compax Snailing Registers & Angled 4:30 Date Window","lume":"Swiss Super-LumiNova BGW9 / C3 Luminous Coating on Hands, Hour Markers, and Bezel Pip","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Solid 316L Surgical Stainless Steel 3-Link Oyster Bracelet with Brushed Outer Links & Polished Center Links","clasp":"Milled Solid 316L Stainless Steel Safety Folding Clasp with Diver Extension & Micro-Adjustment","complications":["Tri-Compax Chronograph Function (60-Min Counter at 9H, Small Seconds at 3H)","24-Hour Day/Night Indicator Sub-Dial at 6 O''Clock","Angled Quickset Date Display Aperture at 4:30","120-Click Ceramic Diver Bezel with 3D Embossed Polished Numerals","Dual Sealed Mechanical Chronograph Pushers"],"packaging":"High-Impact Waterproof Diver''s Pelicase with Spring Bar Tool & International Warranty Card"}'::jsonb,
    11,
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
    'seamaster-chronograph-diver-teal',
    'HBR-1105-TG',
    'Seamaster Pro Chronograph Diver 100M Sunburst Teal',
    'Chronograph & Sport',
    11,
    89000,
    1070,
    '/watch-seamaster-chronograph-diver-teal-front-transparent.webp',
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

-- 27. Seamaster Pro Chronograph Diver 100M Olive Forest Green (HBR-1105-OG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'seamaster-chronograph-diver-olive',
    'HBR-1105-OG',
    'Seamaster Pro Chronograph Diver 100M Olive Forest Green',
    'Tri-Compax Chronograph • Olive Forest Green Ceramic Bezel & Dial • 100M Water Resistant',
    'CHRONOGRAPH',
    'Chronograph & Sport',
    'Diver Chronograph',
    '₹89,000',
    '$1,070',
    'In Stock',
    '2026',
    'Tactical maritime elegance forged in precision 316L stainless steel. Engineered with a matching high-tech olive forest green ceramic diving bezel featuring 3D embossed polished 60-minute dive numerals. The radiant olive forest green radial sunburst dial houses three circular-grained auxiliary registers: a 60-minute chronograph counter at 9 o''clock, a 24-hour day/night indicator at 6 o''clock, and running small seconds at 3 o''clock. Fitted with dual screw-locked mechanical chronograph pushers, an angled quickset date window at 4:30, high-luminosity Swiss Super-LumiNova indices, and a solid 316L stainless steel Oyster 3-link bracelet with mirror-polished center links, rated to 100 meters (10 ATM / 330 feet) of water resistance.',
    '/watch-seamaster-chronograph-diver-olive-front-transparent.webp',
    '/watch-seamaster-chronograph-diver-olive-front-transparent.webp',
    '["/watch-seamaster-chronograph-diver-olive-front-transparent.webp","/watch-seamaster-chronograph-diver-olive-underwater.webp","/watch-seamaster-chronograph-diver-olive-isometric-transparent.webp","/watch-seamaster-chronograph-diver-olive-isometric-stand-transparent.webp","/watch-seamaster-chronograph-diver-olive-surf.webp"]'::jsonb,
    '[{"url":"/watch-seamaster-chronograph-diver-olive-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel chronograph case with olive ceramic bezel, olive sunburst dial, and Oyster bracelet."},{"url":"/watch-seamaster-chronograph-diver-olive-underwater.webp","title":"Underwater Dynamic Bubble Horizon","label":"02 Deep Bubble Plunge","caption":"Deep water plunge perspective surrounded by air bubbles showcasing the high-contrast green ceramic bezel and lume."},{"url":"/watch-seamaster-chronograph-diver-olive-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"03 Isometric Profile","caption":"Angled studio perspective on acrylic display highlighting the dual chronograph pushers, crown guards, and tri-compax registers."},{"url":"/watch-seamaster-chronograph-diver-olive-isometric-stand-transparent.webp","title":"Isometric Acrylic Display Setting","label":"04 Display Stand","caption":"Three-quarter perspective highlighting the embossed ceramic bezel teeth and polished center bracelet links."},{"url":"/watch-seamaster-chronograph-diver-olive-surf.webp","title":"Oceanic Surf Wave Horizon","label":"05 Surf Horizon","caption":"Coastal surf perspective surrounded by ocean spray highlighting the radiant green dial and brushed steel casing."}]'::jsonb,
    '{"movement":"Caliber H-1105 Precision Multi-Function Chronograph Movement with 24H Indicator & Date","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"27 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Lugs & Mirror-Polished Flanks","caseDimensions":"42 mm Diameter × 13.5 mm Thickness","lugToLug":"49.0 mm","glass":"Scratch-Resistant Flat Sapphire Crystal with Anti-Reflective Inner Coating","bezel":"120-Click Unidirectional Rotating Olive Forest Green Ceramic Bezel with 3D Embossed Polished Numerals","crown":"Screw-Down Waterproof Crown with Embossed Logo Flanked by Dual Sealed Chronograph Pushers","caseback":"Screw-Down Solid 316L Stainless Steel Diving Caseback with Deep-Sea Engraving","dial":"Sunburst Olive Forest Green Radial Dial with Tri-Compax Snailing Registers & Angled 4:30 Date Window","lume":"Swiss Super-LumiNova BGW9 / C3 Luminous Coating on Hands, Hour Markers, and Bezel Pip","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Solid 316L Surgical Stainless Steel 3-Link Oyster Bracelet with Brushed Outer Links & Polished Center Links","clasp":"Milled Solid 316L Stainless Steel Safety Folding Clasp with Diver Extension & Micro-Adjustment","complications":["Tri-Compax Chronograph Function (60-Min Counter at 9H, Small Seconds at 3H)","24-Hour Day/Night Indicator Sub-Dial at 6 O''Clock","Angled Quickset Date Display Aperture at 4:30","120-Click Olive Ceramic Diver Bezel with 3D Embossed Polished Numerals","Dual Sealed Mechanical Chronograph Pushers"],"packaging":"High-Impact Waterproof Diver''s Pelicase with Spring Bar Tool & International Warranty Card"}'::jsonb,
    10,
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
    'seamaster-chronograph-diver-olive',
    'HBR-1105-OG',
    'Seamaster Pro Chronograph Diver 100M Olive Forest Green',
    'Chronograph & Sport',
    10,
    89000,
    1070,
    '/watch-seamaster-chronograph-diver-olive-front-transparent.webp',
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

-- 28. Seamaster Pro Chronograph Diver 100M Sunset Amber Fumé (HBR-1105-AB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'seamaster-chronograph-diver-amber',
    'HBR-1105-AB',
    'Seamaster Pro Chronograph Diver 100M Sunset Amber Fumé',
    'Tri-Compax Chronograph • Sunset Amber Fumé Dial • 3D Embossed Ceramic Bezel',
    'CHRONOGRAPH',
    'Chronograph & Sport',
    'Diver Chronograph',
    '₹89,000',
    '$1,070',
    'In Stock',
    '2026',
    'Fiery dusk horology forged in surgical 316L stainless steel. Features a smoldering sunset amber fumé radial sunburst dial shifting from radiant fiery cognac center to deep smoky espresso perimeter. The dial hosts three circular-grained auxiliary registers: a 60-minute chronograph counter at 9 o''clock, a 24-hour day/night indicator at 6 o''clock, and running small seconds at 3 o''clock. Encircled by a scratch-resistant matte black ceramic diving bezel with 3D embossed polished 60-minute numerals. Equipped with dual screw-locked mechanical chronograph pushers, an angled quickset date aperture at 4:30, high-luminosity Swiss Super-LumiNova indices, and a solid 316L stainless steel Oyster 3-link bracelet with mirror-polished center links, rated to 100 meters (10 ATM / 330 feet) of water resistance.',
    '/watch-seamaster-chronograph-diver-amber-front-transparent.webp',
    '/watch-seamaster-chronograph-diver-amber-front-transparent.webp',
    '["/watch-seamaster-chronograph-diver-amber-front-transparent.webp","/watch-seamaster-chronograph-diver-amber-isometric-transparent.webp","/watch-seamaster-chronograph-diver-amber-sunset.webp","/watch-seamaster-chronograph-diver-amber-wrist.webp"]'::jsonb,
    '[{"url":"/watch-seamaster-chronograph-diver-amber-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel chronograph case with embossed ceramic bezel, sunset amber fumé dial, and Oyster bracelet."},{"url":"/watch-seamaster-chronograph-diver-amber-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on acrylic display highlighting the dual chronograph pushers, crown guards, and tri-compax registers."},{"url":"/watch-seamaster-chronograph-diver-amber-sunset.webp","title":"Golden Hour Coastal Sunset Horizon","label":"03 Sunset Horizon","caption":"Editorial sunset maritime composition framed against ocean surf and golden twilight highlighting the fiery cognac dial."},{"url":"/watch-seamaster-chronograph-diver-amber-wrist.webp","title":"Sartorial On-Wrist Horizon","label":"04 On-Wrist Horizon","caption":"On-wrist perspective against clear sky and coastal rocks highlighting the amber dial gradient and polished center links."}]'::jsonb,
    '{"movement":"Caliber H-1105 Precision Multi-Function Chronograph Movement with 24H Indicator & Date","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"27 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Lugs & Mirror-Polished Flanks","caseDimensions":"42 mm Diameter × 13.5 mm Thickness","lugToLug":"49.0 mm","glass":"Scratch-Resistant Flat Sapphire Crystal with Anti-Reflective Inner Coating","bezel":"120-Click Unidirectional Rotating Matte Black Ceramic Bezel with 3D Embossed Polished Numerals","crown":"Screw-Down Waterproof Crown with Embossed Logo Flanked by Dual Sealed Chronograph Pushers","caseback":"Screw-Down Solid 316L Stainless Steel Diving Caseback with Deep-Sea Engraving","dial":"Sunburst Sunset Amber Fumé Radial Dial with Tri-Compax Snailing Registers & Angled 4:30 Date Window","lume":"Swiss Super-LumiNova BGW9 / C3 Luminous Coating on Hands, Hour Markers, and Bezel Pip","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Solid 316L Surgical Stainless Steel 3-Link Oyster Bracelet with Brushed Outer Links & Polished Center Links","clasp":"Milled Solid 316L Stainless Steel Safety Folding Clasp with Diver Extension & Micro-Adjustment","complications":["Tri-Compax Chronograph Function (60-Min Counter at 9H, Small Seconds at 3H)","24-Hour Day/Night Indicator Sub-Dial at 6 O''Clock","Angled Quickset Date Display Aperture at 4:30","120-Click Ceramic Diver Bezel with 3D Embossed Polished Numerals","Dual Sealed Mechanical Chronograph Pushers"],"packaging":"High-Impact Waterproof Diver''s Pelicase with Spring Bar Tool & International Warranty Card"}'::jsonb,
    9,
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
    'seamaster-chronograph-diver-amber',
    'HBR-1105-AB',
    'Seamaster Pro Chronograph Diver 100M Sunset Amber Fumé',
    'Chronograph & Sport',
    9,
    89000,
    1070,
    '/watch-seamaster-chronograph-diver-amber-front-transparent.webp',
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

-- 29. Seamaster Pro Chronograph Diver 100M Cyber Ultraviolet Fumé (HBR-1105-PU)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'seamaster-chronograph-diver-violet',
    'HBR-1105-PU',
    'Seamaster Pro Chronograph Diver 100M Cyber Ultraviolet Fumé',
    'Tri-Compax Chronograph • Cyber Ultraviolet Fumé Dial • 3D Embossed Ceramic Bezel',
    'CHRONOGRAPH',
    'Chronograph & Sport',
    'Diver Chronograph',
    '₹89,000',
    '$1,070',
    'In Stock',
    '2026',
    'Electrifying high-speed aquatic precision forged in surgical 316L stainless steel. Features an ultra-vivid cyber ultraviolet fumé radial sunburst dial transitioning from luminous neon purple center to deep nocturnal indigo-black perimeter. Houses three circular-grained auxiliary registers: a 60-minute chronograph counter at 9 o''clock, a 24-hour day/night indicator at 6 o''clock, and running small seconds at 3 o''clock. Encircled by a scratch-resistant matte black ceramic diving bezel with 3D embossed polished 60-minute numerals. Equipped with dual screw-locked mechanical chronograph pushers, an angled quickset date aperture at 4:30, high-luminosity Swiss Super-LumiNova indices, and a solid 316L stainless steel Oyster 3-link bracelet with mirror-polished center links, rated to 100 meters (10 ATM / 330 feet) of water resistance.',
    '/watch-seamaster-chronograph-diver-violet-front-transparent.webp',
    '/watch-seamaster-chronograph-diver-violet-front-transparent.webp',
    '["/watch-seamaster-chronograph-diver-violet-front-transparent.webp","/watch-seamaster-chronograph-diver-violet-supercar.webp","/watch-seamaster-chronograph-diver-violet-wrist.webp","/watch-seamaster-chronograph-diver-violet-isometric-transparent.webp"]'::jsonb,
    '[{"url":"/watch-seamaster-chronograph-diver-violet-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel chronograph case with embossed ceramic bezel, cyber ultraviolet fumé dial, and Oyster bracelet."},{"url":"/watch-seamaster-chronograph-diver-violet-supercar.webp","title":"Cyber Supercar Neon Speed Horizon","label":"02 Neon Cyber Speed","caption":"Neon cyberpunk automotive setting with motion speed blur highlighting the electrifying ultraviolet dial radiance."},{"url":"/watch-seamaster-chronograph-diver-violet-wrist.webp","title":"Sartorial On-Wrist Horizon","label":"03 On-Wrist Horizon","caption":"On-wrist perspective against clear sky and coastal rocks showcasing the purple dial reflections and brushed steel links."},{"url":"/watch-seamaster-chronograph-diver-violet-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"04 Isometric Profile","caption":"Angled studio perspective on acrylic display highlighting the dual chronograph pushers, crown guards, and tri-compax registers."}]'::jsonb,
    '{"movement":"Caliber H-1105 Precision Multi-Function Chronograph Movement with 24H Indicator & Date","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"27 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Lugs & Mirror-Polished Flanks","caseDimensions":"42 mm Diameter × 13.5 mm Thickness","lugToLug":"49.0 mm","glass":"Scratch-Resistant Flat Sapphire Crystal with Anti-Reflective Inner Coating","bezel":"120-Click Unidirectional Rotating Matte Black Ceramic Bezel with 3D Embossed Polished Numerals","crown":"Screw-Down Waterproof Crown with Embossed Logo Flanked by Dual Sealed Chronograph Pushers","caseback":"Screw-Down Solid 316L Stainless Steel Diving Caseback with Deep-Sea Engraving","dial":"Sunburst Cyber Ultraviolet Fumé Radial Dial with Tri-Compax Snailing Registers & Angled 4:30 Date Window","lume":"Swiss Super-LumiNova BGW9 / C3 Luminous Coating on Hands, Hour Markers, and Bezel Pip","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Solid 316L Surgical Stainless Steel 3-Link Oyster Bracelet with Brushed Outer Links & Polished Center Links","clasp":"Milled Solid 316L Stainless Steel Safety Folding Clasp with Diver Extension & Micro-Adjustment","complications":["Tri-Compax Chronograph Function (60-Min Counter at 9H, Small Seconds at 3H)","24-Hour Day/Night Indicator Sub-Dial at 6 O''Clock","Angled Quickset Date Display Aperture at 4:30","120-Click Ceramic Diver Bezel with 3D Embossed Polished Numerals","Dual Sealed Mechanical Chronograph Pushers"],"packaging":"High-Impact Waterproof Diver''s Pelicase with Spring Bar Tool & International Warranty Card"}'::jsonb,
    8,
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
    'seamaster-chronograph-diver-violet',
    'HBR-1105-PU',
    'Seamaster Pro Chronograph Diver 100M Cyber Ultraviolet Fumé',
    'Chronograph & Sport',
    8,
    89000,
    1070,
    '/watch-seamaster-chronograph-diver-violet-front-transparent.webp',
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

-- 30. Mecha Cyber Cantilever Tourbillon Glacier Ice Blue (HBR-9912-IB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'mecha-cantilever-tourbillon-iceblue',
    'HBR-9912-IB',
    'Mecha Cyber Cantilever Tourbillon Glacier Ice Blue',
    'Central Suspended Flying Tourbillon • Multi-Register Regulator • Glacier Ice Blue Skeleton',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Mecha Skeleton Complication',
    '₹1,48,000',
    '$1,780',
    'Limited Edition',
    '2026',
    'Cyberpunk mecha horology forged in 316L stainless steel. At its heart lies a centrally suspended flying tourbillon oscillating within an openworked 3-spoke titanium-gold cage anchored by high-tensile cantilevered bridges. The regulator dial layout features a decentralized pure white enamel-finish time sub-dial at 12 o''clock with flame-blued hands, flanked by a pointer date display at 8 o''clock with open gearwork and a celestial 24-hour day/night indicator at 4 o''clock. The architectural skeleton chassis is finished with vivid glacier ice blue louvered accents, synthetic rubies, and flame-blued screws. Fitted on an integrated ventilated FKM rubber strap with solid steel butterfly deployant clasp.',
    '/watch-mecha-cantilever-tourbillon-iceblue-front-transparent.webp',
    '/watch-mecha-cantilever-tourbillon-iceblue-front-transparent.webp',
    '["/watch-mecha-cantilever-tourbillon-iceblue-front-transparent.webp","/watch-mecha-cantilever-tourbillon-iceblue-mecha.webp","/watch-mecha-cantilever-tourbillon-iceblue-isometric.webp","/watch-mecha-cantilever-tourbillon-iceblue-splash.webp","/watch-mecha-cantilever-tourbillon-iceblue-wrist.webp"]'::jsonb,
    '[{"url":"/watch-mecha-cantilever-tourbillon-iceblue-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel mecha case with central tourbillon, ice blue skeleton bridges, and black FKM strap."},{"url":"/watch-mecha-cantilever-tourbillon-iceblue-mecha.webp","title":"Mecha Cyberpunk Horizon","label":"02 Mecha Cyber","caption":"Futuristic robotic anime/mecha backdrop showcasing the high-contrast glacier blue accents and central tourbillon."},{"url":"/watch-mecha-cantilever-tourbillon-iceblue-isometric.webp","title":"Three-Quarter Isometric Profile","label":"03 Isometric Profile","caption":"Angled studio perspective on dark pedestal with open deployant clasp showing the multi-layer skeleton depth."},{"url":"/watch-mecha-cantilever-tourbillon-iceblue-splash.webp","title":"Dynamic Hydro-Splash Action","label":"04 Splash Action","caption":"Dynamic water splash perspective demonstrating waterproof resilience and mirror-polished steel bezel."},{"url":"/watch-mecha-cantilever-tourbillon-iceblue-wrist.webp","title":"Sartorial On-Wrist Perspective","label":"05 Sartorial Wrist","caption":"On-wrist perspective in casual denim jacket highlighting the futuristic presence and wrist ergonomics."}]'::jsonb,
    '{"movement":"Caliber H-9912 Central Suspended Co-Axial Tourbillon Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"31 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Facets & Mirror-Polished Chamfers","caseDimensions":"44 mm Diameter × 14.2 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Mecha-Engraved Tungsten Rotor","dial":"Multi-Layer Openwork Mecha Skeleton Dial with Glacier Ice Blue Louvers & Multi-Register Regulator Display","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Integrated High-Density Ergonomic Vented FKM Rubber Strap in Matte Black","clasp":"Solid 316L Stainless Steel Dual-Release Butterfly Deployant Clasp","complications":["Centrally Suspended Flying Tourbillon Escapement with 3-Spoke Gold Cage","Decentralized White Enamel-Finish 12H Time Sub-Dial with Flame-Blued Hands","Skeletonized Pointer Date Register at 8 O''Clock with Red Indicator Arrow","24-Hour Day/Night Celestial Sun & Stars Sub-Dial at 4 O''Clock","Architectural Cantilever Skeleton Bridge System with Glacier Ice Blue Accents"],"packaging":"Mecha Armor Presentation Display Chest with NFC Certificate of Authenticity"}'::jsonb,
    7,
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
    'mecha-cantilever-tourbillon-iceblue',
    'HBR-9912-IB',
    'Mecha Cyber Cantilever Tourbillon Glacier Ice Blue',
    'Tourbillon & Complications',
    7,
    148000,
    1780,
    '/watch-mecha-cantilever-tourbillon-iceblue-front-transparent.webp',
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

-- 31. Celestial World Map Co-Axial Tourbillon 18K Rose Gold (HBR-8818-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'world-map-tourbillon-rosegold',
    'HBR-8818-RG',
    'Celestial World Map Co-Axial Tourbillon 18K Rose Gold',
    '3D Sculpted Rose Gold Continents • Lapis Blue Ocean Dial • Dual-Time Dual-Register',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Global Complication',
    '₹1,64,000',
    '$1,980',
    'Limited Edition',
    '2026',
    'Grand cartographic horology encased in 18K rose gold PVD surgical steel. Features a hand-engraved 3D bas-relief world map with frosted continents across a deep celestial lapis blue enamel ocean dial. In the center, an exposed flying co-axial tourbillon balance wheel oscillates freely within an openworked titanium-steel aperture. The dial is framed by two contrasting grand feu-style enamel sub-dials: an upper saffron orange hour register at 12 o''clock with classic Roman numerals and leaf hands, and a lower emerald green minute register at 6 o''clock with 60-minute calibration. Mounted on an alligator-embossed midnight black Italian calfskin leather strap with 18K rose gold butterfly deployant clasp.',
    '/watch-world-map-tourbillon-rosegold-front-transparent.webp',
    '/watch-world-map-tourbillon-rosegold-front-transparent.webp',
    '["/watch-world-map-tourbillon-rosegold-front-transparent.webp","/watch-world-map-tourbillon-rosegold-clasp-transparent.webp","/watch-world-map-tourbillon-rosegold-isometric-transparent.webp","/watch-world-map-tourbillon-rosegold-earth-orbit.webp","/watch-world-map-tourbillon-rosegold-night-orbit.webp"]'::jsonb,
    '[{"url":"/watch-world-map-tourbillon-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with 3D bas-relief continents, central tourbillon, and orange/green enamel sub-dials."},{"url":"/watch-world-map-tourbillon-rosegold-clasp-transparent.webp","title":"Deployant Clasp Studio Horizon","label":"02 Deployant Clasp","caption":"Top-down perspective highlighting the solid 18K rose gold butterfly deployant clasp and supple black alligator leather."},{"url":"/watch-world-map-tourbillon-rosegold-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"03 Isometric Profile","caption":"Angled studio perspective on white showcasing the curved bezel, sapphire crystal dome, and continent relief."},{"url":"/watch-world-map-tourbillon-rosegold-earth-orbit.webp","title":"Low Earth Orbit Space Horizon","label":"04 Space Orbit","caption":"Celestial orbital perspective against planet Earth and the Moon highlighting the deep lapis blue ocean dial."},{"url":"/watch-world-map-tourbillon-rosegold-night-orbit.webp","title":"Nocturnal Space Orbit Horizon","label":"05 Night Orbit","caption":"Orbital space night perspective above Earth city lights highlighting the frosted rose gold continents and central tourbillon."}]'::jsonb,
    '{"movement":"Caliber H-8818 Central Co-Axial Tourbillon Dual-Time Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Finish","caseDimensions":"43.5 mm Diameter × 14.0 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with World Navigator Engraved Rotor","dial":"Celestial Lapis Blue Enamel Dial with 3D Hand-Engraved Frosted Rose Gold Continents & Dual Enamel Sub-Dials","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel 18K Rose Gold Butterfly Deployant Clasp","complications":["3D Hand-Sculpted Bas-Relief 18K Rose Gold Continents & Lapis Blue Enamel Ocean","Centrally Positioned Flying Co-Axial Tourbillon Escapement","Upper Saffron Orange Enamel Hour Sub-Dial at 12H with Roman Numerals","Lower Emerald Green Enamel Minute Sub-Dial at 6H with 60-Min Calibration","Exhibition Sapphire Caseback with Cartographic Navigator Rotor"],"packaging":"Celestial World Map Lacquered Wooden Chest with NFC Certificate of Authenticity"}'::jsonb,
    6,
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
    'world-map-tourbillon-rosegold',
    'HBR-8818-RG',
    'Celestial World Map Co-Axial Tourbillon 18K Rose Gold',
    'Tourbillon & Complications',
    6,
    164000,
    1980,
    '/watch-world-map-tourbillon-rosegold-front-transparent.webp',
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

-- 32. Celestial World Map Co-Axial Tourbillon Royal Ocean Blue (HBR-8818-BL)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'world-map-tourbillon-blue',
    'HBR-8818-BL',
    'Celestial World Map Co-Axial Tourbillon Royal Ocean Blue',
    '3D Sculpted Rose Gold Continents • Royal Blue Enamel Sub-Dials • Alligator Leather',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Global Complication',
    '₹1,64,000',
    '$1,980',
    'Limited Edition',
    '2026',
    'Harmonious oceanic cartography encased in 18K rose gold PVD surgical steel. Features a hand-engraved 3D bas-relief world map with frosted continents across a deep celestial lapis blue enamel ocean dial. In the center, an exposed flying co-axial tourbillon balance wheel oscillates freely within an openworked titanium-steel aperture. The dial is complemented by matching monochromatic royal ocean blue enamel sub-dials: an upper hour register at 12 o''clock with classic Roman numerals and rose gold leaf hands, and a lower minute register at 6 o''clock with 60-minute calibration. Mounted on an alligator-embossed royal ocean navy blue Italian calfskin leather strap with 18K rose gold butterfly deployant clasp.',
    '/watch-world-map-tourbillon-blue-front-transparent.webp',
    '/watch-world-map-tourbillon-blue-front-transparent.webp',
    '["/watch-world-map-tourbillon-blue-front-transparent.webp","/watch-world-map-tourbillon-blue-isometric-transparent.webp"]'::jsonb,
    '[{"url":"/watch-world-map-tourbillon-blue-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with 3D bas-relief continents, central tourbillon, and royal blue enamel sub-dials."},{"url":"/watch-world-map-tourbillon-blue-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on white showcasing the curved bezel, sapphire crystal dome, and royal ocean blue alligator leather."}]'::jsonb,
    '{"movement":"Caliber H-8818 Central Co-Axial Tourbillon Dual-Time Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Finish","caseDimensions":"43.5 mm Diameter × 14.0 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with World Navigator Engraved Rotor","dial":"Celestial Lapis Blue Enamel Dial with 3D Hand-Engraved Frosted Rose Gold Continents & Royal Blue Enamel Sub-Dials","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Royal Ocean Blue","clasp":"Solid 316L Stainless Steel 18K Rose Gold Butterfly Deployant Clasp","complications":["3D Hand-Sculpted Bas-Relief 18K Rose Gold Continents & Lapis Blue Enamel Ocean","Centrally Positioned Flying Co-Axial Tourbillon Escapement","Upper Royal Blue Enamel Hour Sub-Dial at 12H with Roman Numerals","Lower Royal Blue Enamel Minute Sub-Dial at 6H with 60-Min Calibration","Exhibition Sapphire Caseback with Cartographic Navigator Rotor"],"packaging":"Celestial World Map Lacquered Wooden Chest with NFC Certificate of Authenticity"}'::jsonb,
    5,
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
    'world-map-tourbillon-blue',
    'HBR-8818-BL',
    'Celestial World Map Co-Axial Tourbillon Royal Ocean Blue',
    'Tourbillon & Complications',
    5,
    164000,
    1980,
    '/watch-world-map-tourbillon-blue-front-transparent.webp',
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

-- 33. Celestial World Map Co-Axial Tourbillon Classic Silver (HBR-8818-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'world-map-tourbillon-silver',
    'HBR-8818-SS',
    'Celestial World Map Co-Axial Tourbillon Classic Silver',
    '3D Sculpted Frosted Platinum Continents • Royal Blue Enamel • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Global Complication',
    '₹1,54,000',
    '$1,850',
    'Limited Edition',
    '2026',
    'Grand cartographic precision engineered in 316L surgical stainless steel. Features a hand-engraved 3D bas-relief world map with frosted platinum-finished continents across a deep celestial lapis blue enamel ocean dial. In the center, an exposed flying co-axial tourbillon balance wheel oscillates freely within an openworked titanium-steel aperture. The dial is complemented by matching royal blue enamel sub-dials: an upper hour register at 12 o''clock with classic Roman numerals and mirror-polished steel leaf hands, and a lower minute register at 6 o''clock with 60-minute calibration. Mounted on an alligator-embossed midnight black Italian calfskin leather strap with solid 316L stainless steel butterfly deployant clasp.',
    '/watch-world-map-tourbillon-silver-front-transparent.webp',
    '/watch-world-map-tourbillon-silver-front-transparent.webp',
    '["/watch-world-map-tourbillon-silver-front-transparent.webp","/watch-world-map-tourbillon-silver-isometric-transparent.webp","/watch-world-map-tourbillon-silver-space.webp","/watch-world-map-tourbillon-silver-wrist-studio.webp","/watch-world-map-tourbillon-silver-wrist-sky.webp"]'::jsonb,
    '[{"url":"/watch-world-map-tourbillon-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with 3D frosted continents, central tourbillon, and royal blue sub-dials."},{"url":"/watch-world-map-tourbillon-silver-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on white showcasing the curved steel bezel, double-domed sapphire crystal, and deployant clasp."},{"url":"/watch-world-map-tourbillon-silver-space.webp","title":"Low Earth Orbit Space Horizon","label":"03 Space Orbit","caption":"Macro celestial perspective framed against planet Earth highlighting the frosted silver continent relief and tourbillon cage."},{"url":"/watch-world-map-tourbillon-silver-wrist-studio.webp","title":"Sartorial Studio Wrist Perspective","label":"04 Studio Wrist","caption":"On-wrist perspective paired with dark tailoring showcasing the high-contrast silver case and ocean blue dial."},{"url":"/watch-world-map-tourbillon-silver-wrist-sky.webp","title":"Skyline Coastal Wrist Horizon","label":"05 Sky Horizon","caption":"Outdoor on-wrist perspective under open skies demonstrating the depth of the 3D double-domed sapphire crystal."}]'::jsonb,
    '{"movement":"Caliber H-8818 Central Co-Axial Tourbillon Dual-Time Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Finishing","caseDimensions":"43.5 mm Diameter × 14.0 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with World Navigator Engraved Rotor","dial":"Celestial Lapis Blue Enamel Dial with 3D Hand-Engraved Frosted Silver Continents & Royal Blue Enamel Sub-Dials","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Butterfly Deployant Clasp","complications":["3D Hand-Sculpted Bas-Relief Frosted Platinum/Silver Continents & Lapis Blue Enamel Ocean","Centrally Positioned Flying Co-Axial Tourbillon Escapement","Upper Royal Blue Enamel Hour Sub-Dial at 12H with Roman Numerals","Lower Royal Blue Enamel Minute Sub-Dial at 6H with 60-Min Calibration","Exhibition Sapphire Caseback with Cartographic Navigator Rotor"],"packaging":"Celestial World Map Lacquered Wooden Chest with NFC Certificate of Authenticity"}'::jsonb,
    12,
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
    'world-map-tourbillon-silver',
    'HBR-8818-SS',
    'Celestial World Map Co-Axial Tourbillon Classic Silver',
    'Tourbillon & Complications',
    12,
    154000,
    1850,
    '/watch-world-map-tourbillon-silver-front-transparent.webp',
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

-- 34. Celestial World Map Co-Axial Tourbillon Silver Saffron & Emerald (HBR-8818-SD)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'world-map-tourbillon-silver-dual',
    'HBR-8818-SD',
    'Celestial World Map Co-Axial Tourbillon Silver Saffron & Emerald',
    '3D Sculpted Rose Gold Continents • Dual Enamel Registers • 316L Surgical Steel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Global Complication',
    '₹1,54,000',
    '$1,850',
    'Limited Edition',
    '2026',
    'Two-tone cartographic mastery combining surgical 316L stainless steel with hand-engraved 3D frosted 18K rose gold continents. Set against a deep celestial lapis blue enamel ocean dial with a centrally oscillating flying co-axial tourbillon balance wheel. Features two contrasting grand feu-style enamel sub-dials: an upper saffron orange hour register at 12 o''clock with classic Roman numerals and rose gold leaf hands, and a lower emerald green minute register at 6 o''clock with 60-minute calibration. Mounted on an alligator-embossed midnight black Italian calfskin leather strap with solid 316L stainless steel butterfly deployant clasp.',
    '/watch-world-map-tourbillon-silver-dual-front-transparent.webp',
    '/watch-world-map-tourbillon-silver-dual-front-transparent.webp',
    '["/watch-world-map-tourbillon-silver-dual-front-transparent.webp","/watch-world-map-tourbillon-silver-dual-isometric-transparent.webp","/watch-world-map-tourbillon-silver-dual-space.webp","/watch-world-map-tourbillon-silver-dual-wrist-studio.webp","/watch-world-map-tourbillon-silver-dual-wrist-sky.webp"]'::jsonb,
    '[{"url":"/watch-world-map-tourbillon-silver-dual-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with 3D frosted rose gold continents, central tourbillon, and dual orange/green sub-dials."},{"url":"/watch-world-map-tourbillon-silver-dual-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on white showcasing the curved steel bezel, double-domed sapphire crystal, and deployant clasp."},{"url":"/watch-world-map-tourbillon-silver-dual-space.webp","title":"Low Earth Orbit Space Horizon","label":"03 Space Orbit","caption":"Macro celestial perspective framed against planet Earth highlighting the frosted rose gold continent relief and tourbillon cage."},{"url":"/watch-world-map-tourbillon-silver-dual-wrist-studio.webp","title":"Sartorial Studio Wrist Perspective","label":"04 Studio Wrist","caption":"On-wrist perspective paired with dark tailoring showcasing the contrast between the steel case, rose gold continents, and colorful registers."},{"url":"/watch-world-map-tourbillon-silver-dual-wrist-sky.webp","title":"Skyline Coastal Wrist Horizon","label":"05 Sky Horizon","caption":"Outdoor on-wrist perspective under open skies demonstrating the depth of the 3D double-domed sapphire crystal."}]'::jsonb,
    '{"movement":"Caliber H-8818 Central Co-Axial Tourbillon Dual-Time Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"52 Hours","jewels":"33 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Finishing","caseDimensions":"43.5 mm Diameter × 14.0 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with World Navigator Engraved Rotor","dial":"Celestial Lapis Blue Enamel Dial with 3D Hand-Engraved Frosted 18K Rose Gold Continents & Dual Enamel Sub-Dials","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Butterfly Deployant Clasp","complications":["3D Hand-Sculpted Bas-Relief Frosted 18K Rose Gold Continents & Lapis Blue Enamel Ocean","Centrally Positioned Flying Co-Axial Tourbillon Escapement","Upper Saffron Orange Enamel Hour Sub-Dial at 12H with Roman Numerals","Lower Emerald Green Enamel Minute Sub-Dial at 6H with 60-Min Calibration","Exhibition Sapphire Caseback with Cartographic Navigator Rotor"],"packaging":"Celestial World Map Lacquered Wooden Chest with NFC Certificate of Authenticity"}'::jsonb,
    11,
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
    'world-map-tourbillon-silver-dual',
    'HBR-8818-SD',
    'Celestial World Map Co-Axial Tourbillon Silver Saffron & Emerald',
    'Tourbillon & Complications',
    11,
    154000,
    1850,
    '/watch-world-map-tourbillon-silver-dual-front-transparent.webp',
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

-- 35. Overseas Perpetual Calendar Skeleton Integrated Steel (HBR-5509-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'overseas-perpetual-skeleton-steel',
    'HBR-5509-SS',
    'Overseas Perpetual Calendar Skeleton Integrated Steel',
    'Quad-Register Calendar & Moonphase • Openwork Anthracite Skeleton • Integrated Steel',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Grand Complication',
    '₹94,000',
    '$1,130',
    'In Stock',
    '2026',
    'Grand complication openwork architecture forged in integrated 316L stainless steel. Features a complex multi-layered skeleton movement with anthracite chamfered bridges, golden gear trains, and exposed ruby jewels. Displays a quad-register calendar array: month indicator at 12 o''clock in royal blue, day-of-the-week at 9 o''clock in royal blue, date pointer at 3 o''clock in royal blue, and a classical golden sun & stars moonphase disc at 6 o''clock. Framed by a notched fluted steel bezel and sloped royal blue minute flange. Seamlessly fitted on an integrated solid 316L surgical steel bracelet with double-butterfly deployant clasp.',
    '/watch-overseas-perpetual-skeleton-steel-front-transparent.webp',
    '/watch-overseas-perpetual-skeleton-steel-front-transparent.webp',
    '["/watch-overseas-perpetual-skeleton-steel-front-transparent.webp","/watch-overseas-perpetual-skeleton-steel-wrist.webp"]'::jsonb,
    '[{"url":"/watch-overseas-perpetual-skeleton-steel-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel integrated case with openwork skeleton dial, quad calendar registers, and steel bracelet."},{"url":"/watch-overseas-perpetual-skeleton-steel-wrist.webp","title":"Supercar Cockpit On-Wrist Horizon","label":"02 Supercar Cockpit","caption":"On-wrist perspective in luxury sports supercar setting highlighting the integrated steel geometry and skeleton depth."}]'::jsonb,
    '{"movement":"Caliber H-5509 Multi-Complication Perpetual Calendar & Moonphase Skeleton Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"29 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed Facets & Mirror-Polished Bevels","caseDimensions":"41.5 mm Diameter × 12.5 mm Thickness","lugToLug":"48.5 mm","glass":"Scratch-Resistant Flat Sapphire Crystal with Anti-Reflective Coating","bezel":"Geometric Notched Fluted Bezel in Solid 316L Stainless Steel","caseback":"Exhibition Sapphire Crystal Back with Skeletonized Oscillating Weight","dial":"Openwork Architectural Skeleton Dial with Royal Blue Calendar Registers & Golden Sun/Moon Disc","lume":"Swiss Super-LumiNova BGW9 on Hands and Index Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Integrated Solid 316L Surgical Stainless Steel Bracelet with Tapered H-Links","clasp":"Solid 316L Stainless Steel Dual-Release Butterfly Deployant Clasp","complications":["Month Indicator Sub-Dial at 12 O''Clock in Royal Blue","Day-of-the-Week Indicator Sub-Dial at 9 O''Clock in Royal Blue","Date Pointer Sub-Dial at 3 O''Clock in Royal Blue","Astronomical Golden Sun & Starry Moonphase Aperture at 6 O''Clock","Full Openworked Skeleton Architecture with Anthracite Bridges"],"packaging":"Luxury Piano Lacquer Presentation Chest with Calendar Adjustment Stylus"}'::jsonb,
    10,
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
    'overseas-perpetual-skeleton-steel',
    'HBR-5509-SS',
    'Overseas Perpetual Calendar Skeleton Integrated Steel',
    'Automatic Masterpieces',
    10,
    94000,
    1130,
    '/watch-overseas-perpetual-skeleton-steel-front-transparent.webp',
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

-- 36. Celestial Pilot Astronomical Moonphase Open-Heart Automatic (HBR-2208-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'celestial-pilot-moonphase-black',
    'HBR-2208-SS',
    'Celestial Pilot Astronomical Moonphase Open-Heart Automatic',
    'Open-Heart Escapement • 24H Astronomical Moonphase • Concentric Vinyl Dial',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Astronomical Complication',
    '₹78,000',
    '$940',
    'In Stock',
    '2026',
    'Aeronautical instrument elegance infused with astronomical complication. Features a multi-dimensional matte obsidian black dial decorated with concentric vinyl grooving and oversized luminescent Arabic numerals. The dial hosts a triple complication array: an open-heart escapement balance wheel aperture at 9-10 o''clock framed by a bridge and seconds scale, a 24-hour astronomical celestial sun & starry moonphase disc at 6-7 o''clock, and an openworked concentric date pointer register at 2 o''clock. Powered by a high-beat automatic movement with custom engraved rotor, visible through the exhibition sapphire back. Fitted on a heavy-duty saddle-stitched genuine black calfskin leather strap with solid 316L steel buckle.',
    '/watch-celestial-pilot-moonphase-black-front-transparent.webp',
    '/watch-celestial-pilot-moonphase-black-front-transparent.webp',
    '["/watch-celestial-pilot-moonphase-black-front-transparent.webp","/watch-celestial-pilot-moonphase-black-cosmic.webp","/watch-celestial-pilot-moonphase-black-moon.webp","/watch-celestial-pilot-moonphase-black-wrist-close.webp","/watch-celestial-pilot-moonphase-black-wrist-seated.webp"]'::jsonb,
    '[{"url":"/watch-celestial-pilot-moonphase-black-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical steel round case with concentric grooved black dial, open-heart escapement, and celestial moonphase."},{"url":"/watch-celestial-pilot-moonphase-black-cosmic.webp","title":"Bioluminescent Cosmic Horizon","label":"02 Cosmic Bedrock","caption":"Editorial dark aesthetic on luminescent blue crystalline bedrock showcasing the pilot geometry and dial complications."},{"url":"/watch-celestial-pilot-moonphase-black-moon.webp","title":"Full Moon Celestial Horizon","label":"03 Lunar Horizon","caption":"Nocturnal alpine landscape composition framed against a massive lunar sphere highlighting the astronomical moonphase."},{"url":"/watch-celestial-pilot-moonphase-black-wrist-close.webp","title":"Sartorial Denim On-Wrist Macro","label":"04 Wrist Macro","caption":"Macro on-wrist perspective paired with denim jacket highlighting the domed sapphire crystal and open-heart balance."},{"url":"/watch-celestial-pilot-moonphase-black-wrist-seated.webp","title":"Lifestyle Horizon On-Wrist Perspective","label":"05 Seated Horizon","caption":"Relaxed seated on-wrist perspective showcasing the rugged pilot leather strap with contrast saddle stitching."}]'::jsonb,
    '{"movement":"Caliber H-2208 Astronomical Moonphase Open-Heart Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"24 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Mirror-Polished Bezel & Brushed Caseband","caseDimensions":"43.0 mm Diameter × 13.5 mm Thickness","lugToLug":"50.0 mm","glass":"Double-Domed Scratch-Resistant Sapphire Crystal with AR Coating","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Matte Obsidian Black Concentric Grooved Dial with Open-Heart Balance & Astronomical Sub-Dials","lume":"Swiss Super-LumiNova C3 on Skeleton Pilot Arrow Hands & Indices","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Heavy-Duty Saddle-Stitched Genuine Calfskin Pilot Leather Strap in Matte Black","clasp":"Solid 316L Stainless Steel Engraved Tang Buckle","complications":["Open-Heart Balance Escapement Aperture at 9-10 O''Clock with Seconds Ring","24-Hour Astronomical Sun & Starry Moonphase Disc at 6-7 O''Clock","Concentric Date Pointer Sub-Dial at 2 O''Clock (1-31 Calibration)","Aviator 12 O''Clock Triangle Marker with Skeletonized Arrow Hands","Concentric Radial Vinyl Groove Pattern on Obsidian Black Dial"],"packaging":"Aviation Pilot Collectors Display Box with NFC Certificate of Authenticity"}'::jsonb,
    9,
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
    'celestial-pilot-moonphase-black',
    'HBR-2208-SS',
    'Celestial Pilot Astronomical Moonphase Open-Heart Automatic',
    'Automatic Masterpieces',
    9,
    78000,
    940,
    '/watch-celestial-pilot-moonphase-black-front-transparent.webp',
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

-- 37. Celestial Pilot Astronomical Moonphase 18K Rose Gold (HBR-2208-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'celestial-pilot-moonphase-rosegold',
    'HBR-2208-RG',
    'Celestial Pilot Astronomical Moonphase 18K Rose Gold',
    'Open-Heart Escapement • 24H Astronomical Moonphase • Opaline Silver Dial',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Astronomical Complication',
    '₹84,000',
    '$1,010',
    'In Stock',
    '2026',
    'Aeronautical instrument prestige elevated by 18K rose gold PVD and astronomical complications. Features a silvery opaline dial decorated with fine concentric vinyl grooving and applied 18K rose gold luminescent Arabic numerals. The dial hosts a triple complication array: an open-heart escapement balance wheel aperture at 9-10 o''clock framed by a steel bridge and seconds track, a 24-hour astronomical celestial sun & starry moonphase disc at 6-7 o''clock, and an openworked concentric date pointer register at 2 o''clock. Powered by a high-beat automatic movement with custom engraved rotor, visible through the exhibition sapphire back. Fitted on a heavy-duty saddle-stitched genuine black calfskin leather strap with 18K rose gold steel buckle.',
    '/watch-celestial-pilot-moonphase-rosegold-front-transparent.webp',
    '/watch-celestial-pilot-moonphase-rosegold-front-transparent.webp',
    '["/watch-celestial-pilot-moonphase-rosegold-front-transparent.webp","/watch-celestial-pilot-moonphase-rosegold-cosmic.webp","/watch-celestial-pilot-moonphase-rosegold-wrist-seated.webp","/watch-celestial-pilot-moonphase-rosegold-wrist-macro.webp"]'::jsonb,
    '[{"url":"/watch-celestial-pilot-moonphase-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with concentric grooved opaline silver dial, open-heart balance, and celestial moonphase."},{"url":"/watch-celestial-pilot-moonphase-rosegold-cosmic.webp","title":"Bioluminescent Cosmic Horizon","label":"02 Cosmic Bedrock","caption":"Editorial dark aesthetic on luminescent blue crystalline bedrock showcasing the rose gold case and opaline dial."},{"url":"/watch-celestial-pilot-moonphase-rosegold-wrist-seated.webp","title":"Lifestyle Horizon On-Wrist Perspective","label":"03 Seated Horizon","caption":"Relaxed seated on-wrist perspective showcasing the warm rose gold case and saddle-stitched pilot strap."},{"url":"/watch-celestial-pilot-moonphase-rosegold-wrist-macro.webp","title":"Sartorial Denim On-Wrist Macro","label":"04 Wrist Macro","caption":"Macro on-wrist perspective paired with denim jacket highlighting the domed sapphire crystal, date pointer, and moonphase disc."}]'::jsonb,
    '{"movement":"Caliber H-2208 Astronomical Moonphase Open-Heart Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"24 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Finish","caseDimensions":"43.0 mm Diameter × 13.5 mm Thickness","lugToLug":"50.0 mm","glass":"Double-Domed Scratch-Resistant Sapphire Crystal with AR Coating","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Opaline Silver Concentric Grooved Dial with Open-Heart Balance & Astronomical Sub-Dials","lume":"Swiss Super-LumiNova C3 on Rose Gold Skeleton Pilot Arrow Hands & Indices","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Heavy-Duty Saddle-Stitched Genuine Calfskin Pilot Leather Strap in Matte Black","clasp":"Solid 316L Stainless Steel 18K Rose Gold Engraved Tang Buckle","complications":["Open-Heart Balance Escapement Aperture at 9-10 O''Clock with Seconds Ring","24-Hour Astronomical Sun & Starry Moonphase Disc at 6-7 O''Clock","Concentric Date Pointer Sub-Dial at 2 O''Clock (1-31 Calibration)","Aviator 12 O''Clock Triangle Marker with 18K Rose Gold Arrow Hands","Concentric Radial Vinyl Groove Pattern on Opaline Silver Dial"],"packaging":"Aviation Pilot Collectors Display Box with NFC Certificate of Authenticity"}'::jsonb,
    8,
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
    'celestial-pilot-moonphase-rosegold',
    'HBR-2208-RG',
    'Celestial Pilot Astronomical Moonphase 18K Rose Gold',
    'Automatic Masterpieces',
    8,
    84000,
    1010,
    '/watch-celestial-pilot-moonphase-rosegold-front-transparent.webp',
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

-- 38. Dual Hemispheres Moonphase 100M Automatic Classic Steel (HBR-1108-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'dual-hemispheres-moonphase-steel',
    'HBR-1108-SS',
    'Dual Hemispheres Moonphase 100M Automatic Classic Steel',
    'North & South Lunar Tracking • Transverse Open-Heart Bridge • 10 ATM Water Resistance',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Dual-Hemisphere Complication',
    '₹88,000',
    '$1,060',
    'In Stock',
    '2026',
    'Astronomical mastery displaying simultaneous lunar phases for both Northern and Southern hemispheres. Enclosed in a solid 43.5mm 316L surgical stainless steel case tested to 10 ATM (100 meters / 330 feet) water resistance. The sunburst anthracite dial features dual astronomical registers: a Northern Hemisphere 24-hour moonphase sub-dial at 8-9 o''clock and a Southern Hemisphere 24-hour moonphase sub-dial at 4-5 o''clock, complemented by a subsidiary seconds register at 6 o''clock. At 12 o''clock, an open-heart balance wheel is anchored by a high-polish transverse bridge with guilloché engraving and flame-blued screws. Finished with a hand-stitched alligator-embossed genuine black calfskin leather strap with solid 316L stainless steel butterfly deployant clasp.',
    '/watch-dual-hemispheres-moonphase-steel-front-transparent.webp',
    '/watch-dual-hemispheres-moonphase-steel-front-transparent.webp',
    '["/watch-dual-hemispheres-moonphase-steel-front-transparent.webp","/watch-dual-hemispheres-moonphase-steel-isometric-transparent.webp","/watch-dual-hemispheres-moonphase-steel-studio-blue.webp","/watch-dual-hemispheres-moonphase-steel-wrist.webp"]'::jsonb,
    '[{"url":"/watch-dual-hemispheres-moonphase-steel-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with dual-hemisphere moonphase sub-dials and transverse open-heart bridge."},{"url":"/watch-dual-hemispheres-moonphase-steel-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 Isometric Profile","caption":"Angled studio perspective on white showcasing the curved bezel, sapphire crystal dome, and deployant clasp."},{"url":"/watch-dual-hemispheres-moonphase-steel-studio-blue.webp","title":"Studio Macro Horizon","label":"03 Studio Macro","caption":"Macro three-quarter perspective on blue backdrop highlighting the sunburst dial, guilloché bridge, and blued screws."},{"url":"/watch-dual-hemispheres-moonphase-steel-wrist.webp","title":"Sartorial Tailored On-Wrist Horizon","label":"04 Tailored Wrist","caption":"On-wrist perspective in business tailoring demonstrating the presence and balanced geometry of the dual-hemisphere complication."}]'::jsonb,
    '{"movement":"Caliber H-1108 Dual-Hemisphere Astronomical Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"26 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Mirror-Polished Bezel & Satin-Brushed Sides","caseDimensions":"43.5 mm Diameter × 13.8 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Sunburst Anthracite Charcoal Dial with Dual Hemispheres Moonphase Discs & Applied Arabic Numerals","lume":"Swiss Super-LumiNova BGW9 on Hands and Hour Markers","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Hand-Stitched Alligator-Embossed Genuine Italian Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Dual-Release Butterfly Deployant Clasp","complications":["Northern Hemisphere 24-Hour Day/Night Moonphase Sub-Dial at 8-9 O''Clock","Southern Hemisphere 24-Hour Day/Night Moonphase Sub-Dial at 4-5 O''Clock","Open-Heart Balance Escapement with Engraved Transverse Bridge at 12 O''Clock","Subsidiary Seconds Sub-Dial at 6 O''Clock","100M / 10 ATM Genuine Pressure-Tested Water Resistance"],"packaging":"Grand Celestial Presentation Display Box with NFC Certificate of Authenticity"}'::jsonb,
    7,
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
    'dual-hemispheres-moonphase-steel',
    'HBR-1108-SS',
    'Dual Hemispheres Moonphase 100M Automatic Classic Steel',
    'Automatic Masterpieces',
    7,
    88000,
    1060,
    '/watch-dual-hemispheres-moonphase-steel-front-transparent.webp',
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

-- 39. Dual Hemispheres Moonphase 100M Automatic Royal Blue (HBR-1108-BL)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'dual-hemispheres-moonphase-blue',
    'HBR-1108-BL',
    'Dual Hemispheres Moonphase 100M Automatic Royal Blue',
    'North & South Lunar Tracking • Sunburst Royal Blue Dial • 10 ATM Water Resistance',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Dual-Hemisphere Complication',
    '₹88,000',
    '$1,060',
    'In Stock',
    '2026',
    'Astronomical mastery displaying simultaneous lunar phases for both Northern and Southern hemispheres across a sunburst royal ocean blue dial. Enclosed in a solid 43.5mm 316L surgical stainless steel case tested to 10 ATM (100 meters / 330 feet) water resistance. The dial features dual astronomical registers: a Northern Hemisphere 24-hour moonphase sub-dial at 8-9 o''clock and a Southern Hemisphere 24-hour moonphase sub-dial at 4-5 o''clock, complemented by a subsidiary seconds register at 6 o''clock. At 12 o''clock, an open-heart balance wheel is anchored by a high-polish transverse bridge with guilloché engraving and flame-blued screws. Finished with a hand-stitched alligator-embossed royal blue Italian calfskin leather strap with solid 316L stainless steel butterfly deployant clasp.',
    '/watch-dual-hemispheres-moonphase-blue-front-transparent.webp',
    '/watch-dual-hemispheres-moonphase-blue-front-transparent.webp',
    '["/watch-dual-hemispheres-moonphase-blue-front-transparent.webp","/watch-dual-hemispheres-moonphase-blue-side-transparent.webp","/watch-dual-hemispheres-moonphase-blue-isometric-transparent.webp"]'::jsonb,
    '[{"url":"/watch-dual-hemispheres-moonphase-blue-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L surgical stainless steel round case with sunburst royal ocean blue dial, dual-hemisphere moonphase discs, and transverse open-heart bridge."},{"url":"/watch-dual-hemispheres-moonphase-blue-side-transparent.webp","title":"Sculptural Angled Profile","label":"02 Angled Profile","caption":"Angled perspective on white showcasing the curved lugs, deep blue alligator strap contour, and polished steel bezel."},{"url":"/watch-dual-hemispheres-moonphase-blue-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"03 Isometric Profile","caption":"Angled studio perspective on white showcasing the sapphire crystal dome, crown knurling, and open butterfly deployant clasp."}]'::jsonb,
    '{"movement":"Caliber H-1108 Dual-Hemisphere Astronomical Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"26 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Mirror-Polished Bezel & Satin-Brushed Sides","caseDimensions":"43.5 mm Diameter × 13.8 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Sunburst Royal Ocean Blue Dial with Dual Hemispheres Moonphase Discs & Applied Arabic Numerals","lume":"Swiss Super-LumiNova BGW9 on Hands and Hour Markers","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Hand-Stitched Alligator-Embossed Genuine Italian Calfskin Leather Strap in Royal Ocean Blue","clasp":"Solid 316L Stainless Steel Dual-Release Butterfly Deployant Clasp","complications":["Northern Hemisphere 24-Hour Day/Night Moonphase Sub-Dial at 8-9 O''Clock","Southern Hemisphere 24-Hour Day/Night Moonphase Sub-Dial at 4-5 O''Clock","Open-Heart Balance Escapement with Engraved Transverse Bridge at 12 O''Clock","Subsidiary Seconds Sub-Dial at 6 O''Clock","100M / 10 ATM Genuine Pressure-Tested Water Resistance"],"packaging":"Grand Celestial Presentation Display Box with NFC Certificate of Authenticity"}'::jsonb,
    6,
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
    'dual-hemispheres-moonphase-blue',
    'HBR-1108-BL',
    'Dual Hemispheres Moonphase 100M Automatic Royal Blue',
    'Automatic Masterpieces',
    6,
    88000,
    1060,
    '/watch-dual-hemispheres-moonphase-blue-front-transparent.webp',
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

-- 40. Dual Hemispheres Moonphase 100M Automatic 18K Rose Gold (HBR-1108-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'dual-hemispheres-moonphase-rosegold',
    'HBR-1108-RG',
    'Dual Hemispheres Moonphase 100M Automatic 18K Rose Gold',
    'North & South Lunar Tracking • Opaline Ivory Dial • 10 ATM Water Resistance',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Dual-Hemisphere Complication',
    '₹94,000',
    '$1,130',
    'In Stock',
    '2026',
    'Astronomical elegance encased in 18K rose gold PVD surgical stainless steel with genuine 10 ATM (100 meters / 330 feet) water resistance. The opaline ivory white dial displays simultaneous lunar phases for both Northern and Southern hemispheres: a Northern Hemisphere 24-hour moonphase sub-dial at 8-9 o''clock and a Southern Hemisphere 24-hour moonphase sub-dial at 4-5 o''clock with blue starry discs and rose gold indicator hands. At 12 o''clock, an open-heart balance wheel is anchored by a high-polish steel transverse bridge with guilloché engraving and flame-blued screws. Complemented by an independent small seconds sub-dial at 6 o''clock and applied rose gold Breguet numerals. Fitted on a hand-stitched alligator-embossed genuine cognac saddle brown Italian calfskin leather strap with 18K rose gold butterfly deployant clasp.',
    '/watch-dual-hemispheres-moonphase-rosegold-front-transparent.webp',
    '/watch-dual-hemispheres-moonphase-rosegold-front-transparent.webp',
    '["/watch-dual-hemispheres-moonphase-rosegold-front-transparent.webp","/watch-dual-hemispheres-moonphase-rosegold-side-transparent.webp","/watch-dual-hemispheres-moonphase-rosegold-isometric-transparent.webp"]'::jsonb,
    '[{"url":"/watch-dual-hemispheres-moonphase-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with opaline ivory dial, dual-hemisphere moonphase discs, and transverse open-heart bridge."},{"url":"/watch-dual-hemispheres-moonphase-rosegold-side-transparent.webp","title":"Sculptural Angled Profile","label":"02 Angled Profile","caption":"Angled perspective on white showcasing the warm rose gold case flanks, curved lugs, and cognac brown alligator strap."},{"url":"/watch-dual-hemispheres-moonphase-rosegold-isometric-transparent.webp","title":"Three-Quarter Isometric Profile","label":"03 Isometric Profile","caption":"Angled studio perspective on white showcasing the sapphire crystal dome, crown knurling, and open 18K rose gold butterfly deployant clasp."}]'::jsonb,
    '{"movement":"Caliber H-1108 Dual-Hemisphere Astronomical Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"26 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Mirror-Polished Finish","caseDimensions":"43.5 mm Diameter × 13.8 mm Thickness","lugToLug":"50.5 mm","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Opaline Ivory White Dial with Dual Hemispheres Moonphase Discs & Applied 18K Rose Gold Breguet Numerals","lume":"Swiss Super-LumiNova BGW9 on Hands and Hour Markers","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Hand-Stitched Alligator-Embossed Genuine Italian Calfskin Leather Strap in Cognac Saddle Brown","clasp":"Solid 316L Stainless Steel 18K Rose Gold Dual-Release Butterfly Deployant Clasp","complications":["Northern Hemisphere 24-Hour Day/Night Moonphase Sub-Dial at 8-9 O''Clock","Southern Hemisphere 24-Hour Day/Night Moonphase Sub-Dial at 4-5 O''Clock","Open-Heart Balance Escapement with Engraved Transverse Bridge at 12 O''Clock","Subsidiary Small Seconds Sub-Dial at 6 O''Clock","100M / 10 ATM Genuine Pressure-Tested Water Resistance"],"packaging":"Grand Celestial Presentation Display Box with NFC Certificate of Authenticity"}'::jsonb,
    5,
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
    'dual-hemispheres-moonphase-rosegold',
    'HBR-1108-RG',
    'Dual Hemispheres Moonphase 100M Automatic 18K Rose Gold',
    'Automatic Masterpieces',
    5,
    94000,
    1130,
    '/watch-dual-hemispheres-moonphase-rosegold-front-transparent.webp',
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

-- 41. Mechanical Sonnerie 'Ring the Bell' Diamond Ice Blue (HBR-3309-IB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'sonnerie-bell-iceblue',
    'HBR-3309-IB',
    'Mechanical Sonnerie ''Ring the Bell'' Diamond Ice Blue',
    'Mechanical Striking Chime Complication • Baguette Diamond Ring • Tiffany Ice Blue Stippled Dial',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Acoustic Complication',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'Horological acoustic poetry brought to life with a mechanical chime complication. Features an openwork acoustic aperture at 7-8 o''clock housing a micro-engineered striking hammer and ringing chime gong, activated via the side pusher with the historic ''Ring the bell'' inscription and bell insignia. The dial is executed in an extraordinary frosted stippled glacier Tiffany ice blue, encircled by an inner chapter ring of channel-set baguette-cut sparkling diamonds and applied cobalt blue-bordered luminous indices. The central sweep seconds hand in racing crimson red contrasts against the icy dial. Encased in a 42mm solid 316L surgical stainless steel case with integrated 3-link President bracelet and butterfly deployant clasp.',
    '/watch-sonnerie-bell-iceblue-front-transparent.webp',
    '/watch-sonnerie-bell-iceblue-front-transparent.webp',
    '["/watch-sonnerie-bell-iceblue-front-transparent.webp","/watch-sonnerie-bell-iceblue-forest.webp","/watch-sonnerie-bell-iceblue-vinyl.webp","/watch-sonnerie-bell-iceblue-wrist-tailored.webp","/watch-sonnerie-bell-iceblue-wrist-casual.webp"]'::jsonb,
    '[{"url":"/watch-sonnerie-bell-iceblue-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel round case with ice blue stippled dial, baguette diamond halo, and striking hammer aperture."},{"url":"/watch-sonnerie-bell-iceblue-forest.webp","title":"Acoustic Nature Harmony Horizon","label":"02 Nature Horizon","caption":"Editorial acoustic soundwave composition set against lush alpine forest canopy."},{"url":"/watch-sonnerie-bell-iceblue-vinyl.webp","title":"Vintage Vinyl Acoustic Horizon","label":"03 Vinyl Acoustic","caption":"Macro musical composition resting on a vintage vinyl record player and golden tonearm."},{"url":"/watch-sonnerie-bell-iceblue-wrist-tailored.webp","title":"Sartorial Tailored On-Wrist Horizon","label":"04 Tailored Wrist","caption":"On-wrist perspective in bespoke business tailoring highlighting the baguette diamonds and vibrant ice blue texture."},{"url":"/watch-sonnerie-bell-iceblue-wrist-casual.webp","title":"Contemporary Urban On-Wrist Horizon","label":"05 Urban Wrist","caption":"Casual on-wrist perspective in black coat demonstrating wrist presence and integrated steel bracelet."}]'::jsonb,
    '{"movement":"Caliber H-3309 Mechanical Sonnerie Chime Striking Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"27 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Chamfers","caseDimensions":"42.0 mm Diameter × 13.2 mm Thickness","lugToLug":"49.0 mm","bezel":"Channel-Set Inner Halo with Baguette-Cut Laboratory Diamonds","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Glacier Tiffany Ice Blue Stippled Crystalline Dial with Openwork Chime Hammer Aperture","hands":"Faceted Sword Luminous Hands with Crimson Red Center Sweep Seconds","lume":"Swiss Super-LumiNova BGW9 on Royal Cobalt Blue-Framed Baton Indices","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Surgical Stainless Steel 3-Link President Bracelet with Polished Center Links","clasp":"Dual-Push Security Butterfly Deployant Clasp","complications":["Mechanical Striking Chime Sonnerie Aperture at 7-8 O''Clock with Working Hammer & Gong","Baguette-Cut Diamond Channel-Set Chapter Ring (Full 360-Degree Halo)","Glacier Tiffany Ice Blue Crystalline Stippled Frosted Dial Texture","Side Case Chime Trigger Pusher with Anodized Crimson Red Crown Ring","Royal Cobalt Blue Framed Luminous Hour Baton Indices"],"packaging":"Acoustic Musical Collector Display Chest with NFC Certificate of Authenticity"}'::jsonb,
    12,
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
    'sonnerie-bell-iceblue',
    'HBR-3309-IB',
    'Mechanical Sonnerie ''Ring the Bell'' Diamond Ice Blue',
    'Automatic Masterpieces',
    12,
    98000,
    1180,
    '/watch-sonnerie-bell-iceblue-front-transparent.webp',
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

-- 42. Mechanical Sonnerie 'Ring the Bell' Diamond Royal Blue (HBR-3309-BL)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'sonnerie-bell-blue',
    'HBR-3309-BL',
    'Mechanical Sonnerie ''Ring the Bell'' Diamond Royal Blue',
    'Mechanical Striking Chime Complication • Baguette Diamond Ring • Royal Blue Stippled Dial',
    'AUTOMATIC',
    'Automatic Masterpieces',
    'Acoustic Complication',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'Horological acoustic poetry paired with a deep royal ocean blue crystalline stippled dial. Features an openwork acoustic chime aperture at 7-8 o''clock housing a micro-engineered working striking hammer and ringing chime gong, activated via the side pusher with the historic ''Ring the bell'' inscription and bell insignia. The radiant navy blue dial is encircled by an inner chapter ring of channel-set baguette-cut sparkling diamonds and applied cobalt blue-bordered luminous indices. The central sweep seconds hand in racing crimson red contrasts against the deep blue backdrop. Encased in a 42mm solid 316L surgical stainless steel case with integrated 3-link President bracelet and butterfly deployant clasp.',
    '/watch-sonnerie-bell-blue-front-transparent.webp',
    '/watch-sonnerie-bell-blue-front-transparent.webp',
    '["/watch-sonnerie-bell-blue-front-transparent.webp","/watch-sonnerie-bell-blue-display.webp","/watch-sonnerie-bell-blue-vinyl.webp","/watch-sonnerie-bell-blue-splash.webp","/watch-sonnerie-bell-blue-wrist.webp"]'::jsonb,
    '[{"url":"/watch-sonnerie-bell-blue-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel round case with royal blue stippled dial, baguette diamond halo, and striking hammer aperture."},{"url":"/watch-sonnerie-bell-blue-display.webp","title":"Carbon Horizon Display Perspective","label":"02 Carbon Display","caption":"Three-quarter isometric display perspective on dark carbon fiber backdrop highlighting the baguette diamond ring and case chamfers."},{"url":"/watch-sonnerie-bell-blue-vinyl.webp","title":"Vintage Vinyl Acoustic Horizon","label":"03 Vinyl Acoustic","caption":"Macro musical composition resting on a vintage vinyl record player and golden tonearm."},{"url":"/watch-sonnerie-bell-blue-splash.webp","title":"Hydrodynamic Splash Horizon","label":"04 Dynamic Splash","caption":"High-speed aquatic splash perspective demonstrating dynamic sealed engineering and diamond brilliance."},{"url":"/watch-sonnerie-bell-blue-wrist.webp","title":"Sartorial Tailored On-Wrist Horizon","label":"05 Tailored Wrist","caption":"On-wrist perspective in bespoke business tailoring highlighting the deep royal blue dial and integrated steel bracelet."}]'::jsonb,
    '{"movement":"Caliber H-3309 Mechanical Sonnerie Chime Striking Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"27 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Chamfers","caseDimensions":"42.0 mm Diameter × 13.2 mm Thickness","lugToLug":"49.0 mm","bezel":"Channel-Set Inner Halo with Baguette-Cut Laboratory Diamonds","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Decorated Automatic Rotor","dial":"Royal Ocean Blue Stippled Crystalline Dial with Openwork Chime Hammer Aperture","hands":"Faceted Sword Luminous Hands with Crimson Red Center Sweep Seconds","lume":"Swiss Super-LumiNova BGW9 on Royal Cobalt Blue-Framed Baton Indices","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Surgical Stainless Steel 3-Link President Bracelet with Polished Center Links","clasp":"Dual-Push Security Butterfly Deployant Clasp","complications":["Mechanical Striking Chime Sonnerie Aperture at 7-8 O''Clock with Working Hammer & Gong","Baguette-Cut Diamond Channel-Set Chapter Ring (Full 360-Degree Halo)","Royal Ocean Blue Crystalline Stippled Frosted Dial Texture","Side Case Chime Trigger Pusher with Anodized Crimson Red Crown Ring","Royal Cobalt Blue Framed Luminous Hour Baton Indices"],"packaging":"Acoustic Musical Collector Display Chest with NFC Certificate of Authenticity"}'::jsonb,
    11,
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
    'sonnerie-bell-blue',
    'HBR-3309-BL',
    'Mechanical Sonnerie ''Ring the Bell'' Diamond Royal Blue',
    'Automatic Masterpieces',
    11,
    98000,
    1180,
    '/watch-sonnerie-bell-blue-front-transparent.webp',
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

-- 43. Cyber Mecha Cogwheel Riveted Skeleton 18K Rose Gold (HBR-9915-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'cyber-cogwheel-skeleton-rosegold',
    'HBR-9915-RG',
    'Cyber Mecha Cogwheel Riveted Skeleton 18K Rose Gold',
    'Industrial Riveted Armor Bezel • Interlocking Gear Train • Mint Luminescence',
    'SKELETON',
    'Skeleton & Openwork',
    'Mecha Architecture',
    '₹96,000',
    '$1,160',
    'In Stock',
    '2026',
    'Industrial haute horlogerie encased in a 44mm 18K rose gold PVD surgical steel chassis. Features a high-impact gear-toothed scalloped bezel punctuated by 10 polished hexagonal armor rivets. The multi-tiered openwork skeleton movement exposes high-torque interlocking brass cogwheels, dual balance assemblies, exposed ruby jewels, and custom-perforated structural bridges. Framed by four prominent triangular indices filled with luminous mint-green Swiss Super-LumiNova, with the 12 o''clock HANBORO insignia and 6 o''clock AUTOMATIC crest. Finished with a knurled crown featuring a racing red ring, and mounted on an alligator-embossed cognac saddle brown Italian calfskin leather strap with 18K rose gold steel buckle.',
    '/watch-cyber-cogwheel-skeleton-rosegold-front-transparent.webp',
    '/watch-cyber-cogwheel-skeleton-rosegold-front-transparent.webp',
    '["/watch-cyber-cogwheel-skeleton-rosegold-front-transparent.webp","/watch-cyber-cogwheel-skeleton-rosegold-wrist.webp","/watch-cyber-cogwheel-skeleton-rosegold-industrial.webp"]'::jsonb,
    '[{"url":"/watch-cyber-cogwheel-skeleton-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold round case with riveted gear-toothed bezel, openwork cogwheel skeleton, and cognac leather strap."},{"url":"/watch-cyber-cogwheel-skeleton-rosegold-wrist.webp","title":"Sartorial Denim On-Wrist Horizon","label":"02 Denim Horizon","caption":"Outdoor on-wrist perspective in denim jacket showcasing the warm rose gold facets, mint luminous indices, and skeleton depth."},{"url":"/watch-cyber-cogwheel-skeleton-rosegold-industrial.webp","title":"Cyberpunk Industrial Horizon","label":"03 Industrial Horizon","caption":"Angled isometric perspective on industrial mesh grille showcasing the crown red ring, riveted bezel, and gear train."}]'::jsonb,
    '{"movement":"Caliber H-9915 Multi-Cogwheel Openwork Skeleton Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"28 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Brushed Industrial Finishing","caseDimensions":"44.0 mm Diameter × 13.5 mm Thickness","lugToLug":"51.0 mm","bezel":"Scalloped Gear-Toothed Armor Bezel with 10 Polished Hexagonal Rivets","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Openworked Skeleton Rotor","dial":"Multi-Layered Mechanical Skeleton Movement with Visible Brass Gears & Ruby Bearings","lume":"Swiss Super-LumiNova Mint Green on Triangular Indices & Arrow Skeleton Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Cognac Saddle Brown","clasp":"Solid 316L Stainless Steel 18K Rose Gold Engraved Tang Buckle","complications":["Multi-Tiered Openwork Skeleton Movement with Interlocking Brass Cogwheels","Industrial Gear-Toothed Armor Bezel with 10 Polished Steel Rivets","Four Triangular Luminous Mint Green Cardinal Hour Markers (12, 3, 6, 9)","High-Torque Skeletonized Gear Train with Exposed Ruby Bearings","Knurled Racing Crown with Anodized Crimson Red Accent Ring"],"packaging":"Cyberpunk Industrial Metal Presentation Display Chest with NFC Certificate of Authenticity"}'::jsonb,
    10,
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
    'cyber-cogwheel-skeleton-rosegold',
    'HBR-9915-RG',
    'Cyber Mecha Cogwheel Riveted Skeleton 18K Rose Gold',
    'Skeleton & Openwork',
    10,
    96000,
    1160,
    '/watch-cyber-cogwheel-skeleton-rosegold-front-transparent.webp',
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

-- 44. Cyber Mecha Cogwheel Riveted Skeleton Two-Tone Steel (HBR-9915-TT)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'cyber-cogwheel-skeleton-twotone',
    'HBR-9915-TT',
    'Cyber Mecha Cogwheel Riveted Skeleton Two-Tone Steel',
    'Two-Tone Steel & Rose Gold • Riveted Armor Bezel • Midnight Black Alligator',
    'SKELETON',
    'Skeleton & Openwork',
    'Mecha Architecture',
    '₹94,000',
    '$1,130',
    'In Stock',
    '2026',
    'Two-tone industrial mastery combining surgical 316L stainless steel with 18K rose gold PVD chassis accents. Features a brushed steel gear-toothed scalloped armor bezel punctuated by 10 polished hexagonal rivets, contrasting with the warm 18K rose gold lugs. The transparent multi-tiered openwork skeleton movement showcases interlocking brass gear trains, dual balance assemblies, exposed ruby jewels, and custom-perforated structural bridges. Framed by four prominent 18K rose gold triangular cardinal hour markers filled with luminous mint-green Super-LumiNova, with the 12 o''clock HANBORO insignia and 6 o''clock AUTOMATIC crest. Finished with a knurled crown featuring a racing red ring, and mounted on an alligator-embossed midnight black Italian calfskin leather strap with solid steel buckle.',
    '/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp',
    '/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp',
    '["/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp","/watch-cyber-cogwheel-skeleton-twotone-tactical.webp","/watch-cyber-cogwheel-skeleton-twotone-wrist-medium.webp","/watch-cyber-cogwheel-skeleton-twotone-wrist-close.webp"]'::jsonb,
    '[{"url":"/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical two-tone steel and rose gold round case with riveted gear-toothed bezel, openwork cogwheel skeleton, and black leather strap."},{"url":"/watch-cyber-cogwheel-skeleton-twotone-tactical.webp","title":"Tactical Field Horizon","label":"02 Tactical Field","caption":"Editorial macro on nautical rope and military binoculars highlighting the rugged two-tone architecture and red crown ring."},{"url":"/watch-cyber-cogwheel-skeleton-twotone-wrist-medium.webp","title":"Sartorial Denim On-Wrist Horizon","label":"03 Denim Horizon","caption":"Outdoor on-wrist perspective in denim jacket showcasing the high-contrast two-tone finish and luminous mint markers."},{"url":"/watch-cyber-cogwheel-skeleton-twotone-wrist-close.webp","title":"Macro Perspective On-Wrist Detail","label":"04 Wrist Macro","caption":"Close-up on-wrist angle under daylight highlighting the domed sapphire crystal, gear train, and riveted bezel."}]'::jsonb,
    '{"movement":"Caliber H-9915 Multi-Cogwheel Openwork Skeleton Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"28 Synthetic Rubies","caseMaterial":"Two-Tone 316L Surgical Stainless Steel & 18K Rose Gold PVD with Brushed Industrial Finishing","caseDimensions":"44.0 mm Diameter × 13.5 mm Thickness","lugToLug":"51.0 mm","bezel":"Scalloped Gear-Toothed Brushed Steel Armor Bezel with 10 Polished Hexagonal Rivets","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Openworked Skeleton Rotor","dial":"Multi-Layered Mechanical Skeleton Movement with Visible Brass Gears & Ruby Bearings","lume":"Swiss Super-LumiNova Mint Green on Triangular Indices & Arrow Skeleton Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Engraved Tang Buckle","complications":["Two-Tone Industrial Armor Chassis with 18K Rose Gold Lugs","Gear-Toothed Scalloped Steel Armor Bezel with 10 Polished Rivets","Multi-Tiered Openwork Skeleton Movement with Interlocking Brass Cogwheels","Four Triangular Luminous Mint Green Cardinal Hour Markers (12, 3, 6, 9)","Knurled Racing Crown with Anodized Crimson Red Accent Ring"],"packaging":"Cyberpunk Industrial Metal Presentation Display Chest with NFC Certificate of Authenticity"}'::jsonb,
    9,
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
    'cyber-cogwheel-skeleton-twotone',
    'HBR-9915-TT',
    'Cyber Mecha Cogwheel Riveted Skeleton Two-Tone Steel',
    'Skeleton & Openwork',
    9,
    94000,
    1130,
    '/watch-cyber-cogwheel-skeleton-twotone-front-transparent.webp',
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

-- 45. Cyber Mecha Cogwheel Riveted Skeleton Classic Steel (HBR-9915-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'cyber-cogwheel-skeleton-steel',
    'HBR-9915-SS',
    'Cyber Mecha Cogwheel Riveted Skeleton Classic Steel',
    'Riveted Armor Bezel • Flame-Blued Skeleton Hands • Mint Luminescence',
    'SKELETON',
    'Skeleton & Openwork',
    'Mecha Architecture',
    '₹92,000',
    '$1,110',
    'In Stock',
    '2026',
    'Monochrome industrial execution crafted from solid 316L surgical stainless steel. Punctuated by a gear-toothed scalloped armor bezel secured with 10 polished hexagonal rivets. The transparent multi-layered openwork skeleton movement exposes high-torque interlocking brass gear trains, dual balance assemblies, exposed ruby jewels, and custom-perforated structural bridges. Features electric flame-blued openwork faceted arrow hands that provide striking visual contrast against the mechanical architecture. Framed by four prominent triangular cardinal hour markers filled with luminous mint-green Swiss Super-LumiNova, with the 12 o''clock HANBORO insignia and 6 o''clock AUTOMATIC crest. Finished with a knurled crown featuring a racing red ring, and mounted on an alligator-embossed midnight black Italian calfskin leather strap with solid steel buckle.',
    '/watch-cyber-cogwheel-skeleton-steel-front-transparent.webp',
    '/watch-cyber-cogwheel-skeleton-steel-front-transparent.webp',
    '["/watch-cyber-cogwheel-skeleton-steel-front-transparent.webp","/watch-cyber-cogwheel-skeleton-steel-display.webp","/watch-cyber-cogwheel-skeleton-steel-tactical.webp","/watch-cyber-cogwheel-skeleton-steel-cockpit.webp","/watch-cyber-cogwheel-skeleton-steel-wrist.webp"]'::jsonb,
    '[{"url":"/watch-cyber-cogwheel-skeleton-steel-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel round case with riveted gear-toothed bezel, flame-blued skeleton hands, and black leather strap."},{"url":"/watch-cyber-cogwheel-skeleton-steel-display.webp","title":"Industrial Balance Horizon","label":"02 Balance Horizon","caption":"Studio three-quarter display perspective on steel industrial bar showcasing the gear train and domed sapphire crystal."},{"url":"/watch-cyber-cogwheel-skeleton-steel-tactical.webp","title":"Tactical Field Horizon","label":"03 Tactical Field","caption":"Macro field setting on nautical rope and military binoculars highlighting the rugged steel chassis and flame-blued hands."},{"url":"/watch-cyber-cogwheel-skeleton-steel-cockpit.webp","title":"Cockpit Horizon On-Wrist","label":"04 Cockpit Horizon","caption":"Editorial cockpit perspective on wrist demonstrating the mechanical depth and industrial presence."},{"url":"/watch-cyber-cogwheel-skeleton-steel-wrist.webp","title":"Sartorial Denim On-Wrist Horizon","label":"05 Denim Horizon","caption":"Outdoor daylight on-wrist angle in denim jacket highlighting the vibrant flame-blued hands and mint luminous markers."}]'::jsonb,
    '{"movement":"Caliber H-9915 Multi-Cogwheel Openwork Skeleton Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"28 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Brushed Industrial Finishing","caseDimensions":"44.0 mm Diameter × 13.5 mm Thickness","lugToLug":"51.0 mm","bezel":"Scalloped Gear-Toothed Brushed Steel Armor Bezel with 10 Polished Hexagonal Rivets","glass":"Double-Domed 3D Anti-Reflective Scratch-Resistant Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Openworked Skeleton Rotor","dial":"Multi-Layered Mechanical Skeleton Movement with Visible Brass Gears & Ruby Bearings","hands":"Flame-Blued Royal Cobalt Faceted Openwork Arrow Skeleton Hands","lume":"Swiss Super-LumiNova Mint Green on Triangular Indices & Arrow Skeleton Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Hand-Stitched Alligator-Embossed Italian Genuine Calfskin Leather Strap in Midnight Black","clasp":"Solid 316L Stainless Steel Engraved Tang Buckle","complications":["Monochrome 316L Surgical Steel Industrial Chassis","Electric Flame-Blued Royal Skeleton Arrow Hands","Gear-Toothed Scalloped Steel Armor Bezel with 10 Polished Rivets","Multi-Tiered Openwork Skeleton Movement with Interlocking Brass Cogwheels","Four Triangular Luminous Mint Green Cardinal Hour Markers (12, 3, 6, 9)","Knurled Racing Crown with Anodized Crimson Red Accent Ring"],"packaging":"Cyberpunk Industrial Metal Presentation Display Chest with NFC Certificate of Authenticity"}'::jsonb,
    8,
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
    'cyber-cogwheel-skeleton-steel',
    'HBR-9915-SS',
    'Cyber Mecha Cogwheel Riveted Skeleton Classic Steel',
    'Skeleton & Openwork',
    8,
    92000,
    1110,
    '/watch-cyber-cogwheel-skeleton-steel-front-transparent.webp',
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

-- 46. World Globe Tourbillon GMT (HBR-8802-WG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'world-globe',
    'HBR-8802-WG',
    'World Globe Tourbillon GMT',
    'Hemispherical 24H Celestial Earth Sphere with Dual-Time Tracking',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Dual-Time Horizon',
    '₹1,32,000',
    '$1,590',
    'In Stock',
    '2026',
    'Designed for the global navigator. A three-dimensional micro-carved northern hemisphere globe revolves continuously over a 24-hour cycle, synced with an openworked skeletonized balance assembly.',
    '/watch-world-globe.webp',
    '/watch-world-globe.webp',
    '["/watch-world-globe.webp","/hanboro-celestial-watch.png"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-8820 Co-Axial Dual-Time Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"60 Hours","jewels":"29 Synthetic Rubies","caseMaterial":"Midnight DLC-Coated 316L Stainless Steel with High-Polish Bezel","caseDimensions":"43.5 mm × 13.8 mm","lugToLug":"50.0 mm","glass":"Ultra-Clear Scratch-Proof Sapphire Crystal with Dual AR Coating","caseback":"Screw-Down Exhibition Sapphire Back with Laser-Etched Globe Motif","dial":"Deep Space Anthracite with 3D Relief World Continents & Luminous Meridian Marks","waterResistance":"50 Meters (5 ATM)","strap":"Handcrafted Italian Matte Black Leather with Contrast Signal Red Stitching","clasp":"Solid Steel Butterfly Deployant Clasp","complications":["360° 24-Hour Rotating Globe","Independent GMT Dual-Time Zone","Openwork Balance Bridge"],"packaging":"Collector''s Lacquer Vault with NFC Authenticity Card"}'::jsonb,
    7,
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
    'world-globe',
    'HBR-8802-WG',
    'World Globe Tourbillon GMT',
    'Tourbillon & Complications',
    7,
    132000,
    1590,
    '/watch-world-globe.webp',
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

-- 47. Architectural Openwork Skeleton DLC (HBR-6608-SK)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'architectural-skeleton-black',
    'HBR-6608-SK',
    'Architectural Openwork Skeleton DLC',
    'Geometric Openwork Bridges • Stealth Black DLC • 10H Exposed Balance Wheel • Signal Red Hands',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Architectural Openwork Bridge',
    '₹76,000',
    '$915',
    'In Stock',
    '2026',
    'Horological architecture laid bare. Built with multi-tier geometric skeletonized bridges and hand-beveled chamfers in stealth black DLC 316L stainless steel. Features a pulsing balance wheel at 10 o''clock with red index pointer, exposed golden transmission gear train at 6 o''clock, heat-blued screws, ruby synthetic jewels, and floating skeletonized hands with signal red luminous tips.',
    '/watch-architectural-skeleton-black-front-transparent.webp',
    '/watch-architectural-skeleton-black-front-transparent.webp',
    '["/watch-architectural-skeleton-black-front-transparent.webp","/watch-architectural-skeleton-black-briefcase.webp","/watch-architectural-skeleton-black-sunlight.webp","/watch-architectural-skeleton-black-leather.webp"]'::jsonb,
    '[{"url":"/watch-architectural-skeleton-black-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical stealth black DLC 316L case showcasing the openwork bridge architecture, 10 o''clock balance wheel, and signal red hands."},{"url":"/watch-architectural-skeleton-black-briefcase.webp","title":"Executive Leather Setting","label":"02 Executive Leather","caption":"Dramatic composition against luxury black leather briefcase highlighting the polished faceted gear bezel."},{"url":"/watch-architectural-skeleton-black-sunlight.webp","title":"Natural Sunlight Depth Macro","label":"03 Sunlight Depth","caption":"Macro on-wrist capture revealing three-dimensional bridge layering, heat-blued screws, and ruby jewel pivots under natural sunlight."},{"url":"/watch-architectural-skeleton-black-leather.webp","title":"Sartorial Biker Jacket Presence","label":"04 Sartorial Biker","caption":"Dynamic lifestyle on-wrist presence paired with black leather biker jacket, exhibiting the solid DLC steel bracelet."}]'::jsonb,
    '{"movement":"Caliber H-6680 In-House Architectural Openwork Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"24 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Marine Stainless Steel with Stealth Matte & Polished DLC Coating","caseDimensions":"42.5 mm × 12.2 mm","lugToLug":"49.0 mm","glass":"Scratch-Proof Domed Sapphire Crystal with Internal Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Openwork Rotor","dial":"Three-Dimensional Geometric Skeleton Bridges with High-Contrast Satin Chamfers & Floating Red Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Black DLC Multi-Row Stainless Steel Articulated Link Bracelet","clasp":"Double Push-Button Concealed Butterfly Deployant Clasp","complications":["10 O''Clock Exposed High-Beat Balance Wheel with Red Index Pointer","6 O''Clock Golden Secondary Gear Train Architecture","Signal Red Arrow Luminous Skeleton Hands","Full Openworked Multi-Tier Bridge Caliber"],"packaging":"Matte Black Presentation Vault with NFC Warranty Card & Microfiber Cloth"}'::jsonb,
    6,
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
    'architectural-skeleton-black',
    'HBR-6608-SK',
    'Architectural Openwork Skeleton DLC',
    'Tourbillon & Complications',
    6,
    76000,
    915,
    '/watch-architectural-skeleton-black-front-transparent.webp',
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

-- 48. Architectural Openwork Skeleton Two-Tone Rose Gold (HBR-6608-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'architectural-skeleton-rosegold',
    'HBR-6608-RG',
    'Architectural Openwork Skeleton Two-Tone Rose Gold',
    '18K Rose Gold Bezel • Two-Tone Steel Bracelet • 10H Exposed Balance Wheel • Signal Red Hands',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Two-Tone Rose Gold Openwork',
    '₹78,000',
    '$940',
    'In Stock',
    '2026',
    'A breathtaking union of warm precious metal and avant-garde skeletal geometry. Highlights an 18K rose gold PVD faceted gear bezel and matching two-tone articulated bracelet framing multi-tiered openworked bridges. Features an exposed pulsing balance wheel at 10 o''clock with red index pointer, 6 o''clock secondary golden gear train, heat-blued screws, and floating skeleton hands with signal-red arrow lume tips.',
    '/watch-architectural-skeleton-rosegold-front-transparent.webp',
    '/watch-architectural-skeleton-rosegold-front-transparent.webp',
    '["/watch-architectural-skeleton-rosegold-front-transparent.webp","/watch-architectural-skeleton-rosegold-dark.webp","/watch-architectural-skeleton-rosegold-splash.webp","/watch-architectural-skeleton-rosegold-leather.webp","/watch-architectural-skeleton-rosegold-wrist.webp"]'::jsonb,
    '[{"url":"/watch-architectural-skeleton-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical two-tone 316L steel and rose gold case showcasing the openwork bridge architecture, 10 o''clock balance wheel, and signal red hands."},{"url":"/watch-architectural-skeleton-rosegold-dark.webp","title":"Dark Mineral Studio Setting","label":"02 Dark Mineral","caption":"High-contrast macro perspective resting on dark mineral stone highlighting the warm glow of the faceted rose gold bezel."},{"url":"/watch-architectural-skeleton-rosegold-splash.webp","title":"Hydrodynamic Splash & 50M Rating","label":"03 Water Splash","caption":"Dynamic high-speed liquid capture demonstrating 50-meter water resistance and hermetic seal."},{"url":"/watch-architectural-skeleton-rosegold-leather.webp","title":"Full-Grain Leather Setting","label":"04 Leather Horizon","caption":"Curated artistic composition resting on textured black leather highlighting the heat-blued screws and rose gold crown."},{"url":"/watch-architectural-skeleton-rosegold-wrist.webp","title":"Sartorial Biker Lifestyle Presence","label":"05 Sartorial Biker","caption":"Lifestyle on-wrist presence paired with black leather biker jacket, exhibiting the solid two-tone articulated bracelet."}]'::jsonb,
    '{"movement":"Caliber H-6680 In-House Architectural Openwork Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"24 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD Bezel & Crown Guard","caseDimensions":"42.5 mm × 12.2 mm","lugToLug":"49.0 mm","glass":"Scratch-Proof Domed Sapphire Crystal with Internal Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Openwork Rotor","dial":"Three-Dimensional Geometric Skeleton Bridges with High-Contrast Satin Chamfers & Floating Red Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Two-Tone Solid 316L Steel & 18K Rose Gold PVD Multi-Row Articulated Link Bracelet","clasp":"Double Push-Button Concealed Butterfly Deployant Clasp","complications":["10 O''Clock Exposed High-Beat Balance Wheel with Red Index Pointer","6 O''Clock Golden Secondary Gear Train Architecture","Signal Red Arrow Luminous Skeleton Hands","18K Rose Gold Two-Tone Architecture"],"packaging":"Matte Black Vault Presentation Case with Rose-Gold Trim & NFC Warranty Passport"}'::jsonb,
    5,
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
    'architectural-skeleton-rosegold',
    'HBR-6608-RG',
    'Architectural Openwork Skeleton Two-Tone Rose Gold',
    'Tourbillon & Complications',
    5,
    78000,
    940,
    '/watch-architectural-skeleton-rosegold-front-transparent.webp',
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

-- 49. Arachnid Geometric Polygon Skeleton (HBR-9909-SP)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'arachnid-geometric-skeleton',
    'HBR-9909-SP',
    'Arachnid Geometric Polygon Skeleton',
    'Haute Métiers d''Art 3D Micro-Sculpted Hero • Spider-Web Bridges • 9H Balance • Faceted Polygon Bezel',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Haute Métiers d''Art',
    '₹1,18,000',
    '$1,420',
    'In Stock',
    '2026',
    'A breathtaking synthesis of superhero pop culture, diamond-cut polygonal geometry, and haute horlogerie skeletonization. Features a hand-engraved 3D silver micro-sculpture of the Arachnid Hero crouched over intricate spider-web guilloché bridges. An exposed balance assembly pulses at 9 o''clock beneath electric royal-blue skeleton hands with signal-red arrow tips, housed in an architectural faceted 316L stainless steel polygon case on an ergonomic vulcanized rubber strap.',
    '/watch-arachnid-geometric-front-transparent.webp',
    '/watch-arachnid-geometric-front-transparent.webp',
    '["/watch-arachnid-geometric-front-transparent.webp","/watch-arachnid-geometric-dark.webp","/watch-arachnid-geometric-wrist-macro.webp","/watch-arachnid-geometric-wrist-audio.webp"]'::jsonb,
    '[{"url":"/watch-arachnid-geometric-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical faceted polygon 316L case featuring the 3D micro-sculpted silver hero, spider-web bridges, 9 o''clock balance wheel, and electric blue hands."},{"url":"/watch-arachnid-geometric-dark.webp","title":"Dark Mineral Studio Perspective","label":"02 Dark Mineral","caption":"Three-quarter isometric profile on dark stone exhibiting the diamond-cut polygonal bezel facets and black DLC crown."},{"url":"/watch-arachnid-geometric-wrist-macro.webp","title":"Haute Horlogerie Macro On-Wrist","label":"03 Macro On-Wrist","caption":"Close-up on-wrist capture revealing the microscopic muscle striations and web texture of the silver hero sculpture."},{"url":"/watch-arachnid-geometric-wrist-audio.webp","title":"Contemporary Creative Lifestyle Presence","label":"04 Creative Lifestyle","caption":"Lifestyle wrist capture emphasizing the modern avant-garde presence and ergonomic fluororubber strap."}]'::jsonb,
    '{"movement":"Caliber H-9950 Haute Métiers d''Art Openwork Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"26 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Diamond-Cut Faceted 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44.0 mm × 13.5 mm","lugToLug":"50.0 mm","glass":"Faceted Scratch-Proof Sapphire Crystal with Multi-Layer AR Coating","caseback":"Exhibition Sapphire Crystal Back with Web Motif Rotor","dial":"Hand-Chiseled 3D Silver Hero Figure with Intricate Spider-Web Guilloché Bridges & Electric Blue Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Ergonomic Fluororubber Strap with Geometric Ridges","clasp":"Solid 316L Stainless Steel Double-Security Deployant Buckle","complications":["3D Hand-Sculpted Silver Hero Micro-Statue at 6 o''clock","Spider-Web Laser-Cut Openwork Skeleton Bridges","9 O''Clock Exposed Regulating Balance Assembly with Red Pointer","Electric Royal-Blue Skeleton Hands with Signal-Red Lume Tips","Diamond-Cut Faceted Polygon Bezel Architecture"],"packaging":"Matte Black Velvet Presentation Shrine with Collector Commemorative Medal & NFC Guarantee Passport"}'::jsonb,
    12,
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
    'arachnid-geometric-skeleton',
    'HBR-9909-SP',
    'Arachnid Geometric Polygon Skeleton',
    'Tourbillon & Complications',
    12,
    118000,
    1420,
    '/watch-arachnid-geometric-front-transparent.webp',
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

-- 50. Cyber Octagonal Skeleton Neon Green (HBR-8808-CG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'cyber-green-skeleton',
    'HBR-8808-CG',
    'Cyber Octagonal Skeleton Neon Green',
    'Neon Lime Engraved Bezel • Spoke Openwork Caliber • 10H Balance Seconds Wheel • Hybrid Leather/Rubber Strap',
    'TOURBILLON',
    'Tourbillon & Complications',
    'Cyberpunk Supercar Skeleton',
    '₹84,000',
    '$1,010',
    'In Stock',
    '2026',
    'Supercar engineering reimagined for haute horology. An angular stealth black DLC polygon bezel with precision-engraved electric neon green geometric lines surrounds a multi-layer spoke skeleton caliber. Features a high-beat balance assembly at 10 o''clock with a 60-second index track, exposed secondary gear train at 6 o''clock, faceted high-lume hands, and a hybrid black calfskin/rubber strap with neon green contrast saddle stitching.',
    '/watch-cyber-green-skeleton-front-transparent.webp',
    '/watch-cyber-green-skeleton-front-transparent.webp',
    '["/watch-cyber-green-skeleton-front-transparent.webp","/watch-cyber-green-skeleton-cockpit.webp","/watch-cyber-green-skeleton-wrist-car.webp","/watch-cyber-green-skeleton-beam.webp","/watch-cyber-green-skeleton-chrome-transparent.webp"]'::jsonb,
    '[{"url":"/watch-cyber-green-skeleton-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical stealth black DLC case featuring the neon green engraved polygon bezel, 10 o''clock balance wheel, spoke bridges, and hybrid strap."},{"url":"/watch-cyber-green-skeleton-cockpit.webp","title":"Automotive Cockpit On-Wrist Presence","label":"02 Cockpit On-Wrist","caption":"On-wrist perspective in supercar cockpit showing the anti-reflective blue sapphire flare and neon green accents."},{"url":"/watch-cyber-green-skeleton-wrist-car.webp","title":"Supercar Exterior Lifestyle Presence","label":"03 Supercar Lifestyle","caption":"Lifestyle wrist capture on supercar door frame exhibiting the ergonomic case contouring and neon stitching."},{"url":"/watch-cyber-green-skeleton-beam.webp","title":"Copper & Industrial Beam Studio Macro","label":"04 Industrial Copper","caption":"Three-quarter perspective resting on architectural copper beams highlighting the satin bezel brushing and titanium screws."},{"url":"/watch-cyber-green-skeleton-chrome-transparent.webp","title":"Polished Chrome Beam Perspective","label":"05 Chrome Structure","caption":"Isometric studio perspective on chrome beams displaying the openwork gear train depth and high-lume hour markers."}]'::jsonb,
    '{"movement":"Caliber H-8890 Cyber Spoke Openwork Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"46 Hours","jewels":"24 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with Stealth Matte Black DLC & Neon Green Bezel Engravings","caseDimensions":"43.5 mm × 13.0 mm","lugToLug":"49.5 mm","glass":"Scratch-Proof Domed Sapphire Crystal with Anti-Reflective Blue Flare Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Rim Rotor","dial":"Three-Dimensional Geometric Wheel Spoke Skeleton with Neon Green Perimeter Accents","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Hybrid Black Leather & Fluororubber Strap with Neon Green Stitching","clasp":"Solid 316L Black DLC Security Deployant Clasp","complications":["10 O''Clock Exposed Balance Wheel with 60-Second Track Ring","6 O''Clock Secondary Transmission Gear Train","Electric Neon Green Engraved Polygon Bezel Accents","Faceted High-Lume Hands & Spoke Bridge Architecture"],"packaging":"Matte Black Cyber Vault Presentation Box with Neon Green Accents & NFC Warranty Card"}'::jsonb,
    11,
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
    'cyber-green-skeleton',
    'HBR-8808-CG',
    'Cyber Octagonal Skeleton Neon Green',
    'Tourbillon & Complications',
    11,
    84000,
    1010,
    '/watch-cyber-green-skeleton-front-transparent.webp',
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

-- 51. Clover King Emerald Roulette (HBR-7704-EM)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'emerald-roulette',
    'HBR-7704-EM',
    'Clover King Emerald Roulette',
    'Free-Spinning Kinetic Roulette Wheel with Lucky Clover Axis',
    'ROULETTE',
    'Casino & Roulette',
    'Mechanical Casino Action',
    '₹88,000',
    '$1,060',
    'In Stock',
    '2026',
    'An iconic conversation piece combining Swiss tonneau elegance with dynamic kinetic entertainment. Natural wrist motion spins an internal 37-pocket roulette ring with an ultra-smooth micro-ball bearing track.',
    '/watch-emerald-roulette.webp',
    '/watch-emerald-roulette.webp',
    '["/watch-emerald-roulette.webp","/watch-carousel-roulette.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-7700 Free-Spinning Ball-Bearing Roulette Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"25 Synthetic Rubies & Micro Ceramic Ball Bearings","caseMaterial":"Ergonomic Curved Rose Gold Ion-Plated 316L Stainless Steel","caseDimensions":"44.0 mm × 52.0 mm Tonneau × 14.0 mm","lugToLug":"52.0 mm","glass":"Curved 3D Tonneau Sapphire Crystal with Interior Anti-Reflective Layer","caseback":"Solid Steel Exhibition Caseback with Roulette Wheel Engraving","dial":"Emerald Green Sunburst Center with Enamel Red & Black Numbered Pockets","waterResistance":"50 Meters (5 ATM)","strap":"British Racing Emerald Green Vulcanized Silicone Strap","clasp":"Engraved Tang Buckle with Clover Emblem","complications":["Kinetic Dynamic Roulette Spinner","4-Leaf Clover Center Axis","Quick-Set Date Indicator"],"packaging":"Lacquered Presentation Box with Dice & Velvet Pouch"}'::jsonb,
    10,
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
    'emerald-roulette',
    'HBR-7704-EM',
    'Clover King Emerald Roulette',
    'Casino & Roulette',
    10,
    88000,
    1060,
    '/watch-emerald-roulette.webp',
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

-- 52. Sapphire Blue Casino Roulette (HBR-7705-BL)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'blue-roulette',
    'HBR-7705-BL',
    'Sapphire Blue Casino Roulette',
    'Dynamic Kinetic Roulette Mechanism in Royal Cobalt Blue',
    'ROULETTE',
    'Casino & Roulette',
    'Mechanical Casino Action',
    '₹88,000',
    '$1,060',
    'In Stock',
    '2026',
    'High-octane casino mechanics wrapped in sleek brushed stainless steel and intense royal cobalt blue. Features the patented ultra-low friction ceramic ball bearing roulette wheel.',
    '/watch-blue-roulette.webp',
    '/watch-blue-roulette.webp',
    '["/watch-blue-roulette.webp","/watch-carousel-roulette.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-7700 Free-Spinning Ball-Bearing Roulette Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"25 Jewels","caseMaterial":"Satin-Brushed & Mirror-Polished 316L Surgical Steel","caseDimensions":"44.0 mm × 52.0 mm Tonneau × 14.0 mm","lugToLug":"52.0 mm","glass":"Curved Tonneau Anti-Scratch Sapphire Crystal","caseback":"Exhibition Glass with Weighted Rotor","dial":"Cobalt Blue Sunray Dial with 0-36 European Roulette Layout","waterResistance":"50 Meters (5 ATM)","strap":"Integrated Royal Blue Ergonomic Fluororubber","clasp":"Brushed Stainless Steel Deployant Buckle","complications":["Kinetic Roulette Action","Exposed Balance Wheel","Luminous Baton Hands"],"packaging":"Luxury Vault Presentation Case"}'::jsonb,
    9,
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
    'blue-roulette',
    'HBR-7705-BL',
    'Sapphire Blue Casino Roulette',
    'Casino & Roulette',
    9,
    88000,
    1060,
    '/watch-blue-roulette.webp',
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

-- 53. Arctic Tonneau Skeleton Pure White (HBR-6601-AR)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'arctic-tonneau',
    'HBR-6601-AR',
    'Arctic Tonneau Skeleton Pure White',
    'Ultra-Lightweight Curved Tonneau with Openwork Architectural Caliber',
    'TONNEAU',
    'Tonneau Skeleton',
    'Avant-Garde Ergonomics',
    '₹76,000',
    '$915',
    'In Stock',
    '2026',
    'A pure aesthetic triumph. The Arctic Tonneau combines a curved ergonomic white ceramic-composite bezel with a fully skeletonized automatic movement, offering complete optical transparency.',
    '/watch-arctic-tonneau-white.webp',
    '/watch-arctic-tonneau-white.webp',
    '["/watch-arctic-tonneau-white.webp","/clover-king-day.png"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-6600 Twin-Barrel Openworked Skeleton Automatic","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"52 Hours","jewels":"24 Jewels","caseMaterial":"Curved Ceramic Composite Outer Frame with Grade 2 Titanium Core","caseDimensions":"43.0 mm × 50.0 mm Tonneau × 13.5 mm","lugToLug":"50.0 mm","glass":"Scratch-Resistant Curved Sapphire Crystal with Dual AR Coating","caseback":"Transparent Sapphire Caseback with Skeleton Rotor","dial":"Openworked Architectural Caliber with Satin-Finished Bridges & Red Accents","waterResistance":"50 Meters (5 ATM)","strap":"High-Density Arctic White Anti-Dust Fluororubber","clasp":"Titanium Deployant Clasp","complications":["Complete Skeletonized Transparency","Super-LumiNova BGW9 White-Blue Glow","Curved Ergonomic Case"],"packaging":"Minimalist Hard-Shell Travel Vault"}'::jsonb,
    8,
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
    'arctic-tonneau',
    'HBR-6601-AR',
    'Arctic Tonneau Skeleton Pure White',
    'Tonneau Skeleton',
    8,
    76000,
    915,
    '/watch-arctic-tonneau-white.webp',
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

-- 54. Sichuan Opera Face-Changing Tonneau Diamond (HBR-9907-SO)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'sichuan-opera-diamond-tonneau',
    'HBR-9907-SO',
    'Sichuan Opera Face-Changing Tonneau Diamond',
    'Haute Métiers d''Art Bian Lian Complication • Full Pavé Diamond Case • Folding Fan Guilloché',
    'TONNEAU',
    'Tonneau Skeleton',
    'Haute Métiers d''Art',
    '₹1,35,000',
    '$1,630',
    'In Stock',
    '2026',
    'A breathtaking tribute to intangible cultural heritage and high complication horology. Encrusted with hundreds of precision-set brilliant-cut diamonds across an 18K rose gold tonneau case. The dial features a dynamic Sichuan Opera ''Bian Lian'' (Face Changing) complication at 6 o''clock where the hand-enameled dramatic mask transforms, topped by a traditional folding fan guilloché sector at 12 o''clock, mounted on an ergonomic fluororubber strap.',
    '/watch-sichuan-opera-diamond-front-transparent.webp',
    '/watch-sichuan-opera-diamond-front-transparent.webp',
    '["/watch-sichuan-opera-diamond-front-transparent.webp","/watch-sichuan-opera-diamond-wrist-fan.webp","/watch-sichuan-opera-diamond-wrist-angle.webp"]'::jsonb,
    '[{"url":"/watch-sichuan-opera-diamond-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold tonneau case with full pavé diamond bezel, hand-enameled Sichuan Opera mask at 6H, and folding fan sector at 12H."},{"url":"/watch-sichuan-opera-diamond-wrist-fan.webp","title":"Sartorial Chinese Folding Fan Composition","label":"02 Opera Fan Heritage","caption":"Dramatic on-wrist capture framed against traditional Sichuan Opera mask folding fan showcasing cultural heritage."},{"url":"/watch-sichuan-opera-diamond-wrist-angle.webp","title":"Pavé Diamond Brilliance & Profile","label":"03 Diamond Fire Profile","caption":"Three-quarter on-wrist perspective highlighting the curved 3D sapphire crystal, diamond pave fire, and ergonomic rubber strap."}]'::jsonb,
    '{"movement":"Caliber H-9970 Haute Métiers d''Art Bian Lian Dynamic Face-Changing Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"28 Synthetic Rubies & Micro-Gems","caseMaterial":"18K Rose Gold PVD 316L Stainless Steel Fully Set with Hand-Paved Brilliant-Cut Zirconias","caseDimensions":"44.0 mm × 52.0 mm Tonneau × 14.5 mm","lugToLug":"52.0 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Laser-Engraved Opera Mask Motif","dial":"Hand-Enameled Ceramic Mask with Folding Fan Guilloché Fluting & Radiant Skeleton Bridges","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Fluororubber Strap with Quick-Release Integration","clasp":"18K Rose Gold PVD Double-Security Deployant Buckle","complications":["Dynamic Bian Lian (Face-Changing) Mechanism at 6 o''clock","Traditional Folding Fan Sunburst Guilloché at 12 o''clock","Full Pavé Diamond-Encrusted Rose Gold Tonneau Frame","Luminous Rose Gold Baton Hands & Perimeter Accents"],"packaging":"Imperial Red Lacquered Heritage Presentation Shrine with Silk Lining & NFC Guarantee Passport"}'::jsonb,
    7,
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
    'sichuan-opera-diamond-tonneau',
    'HBR-9907-SO',
    'Sichuan Opera Face-Changing Tonneau Diamond',
    'Tonneau Skeleton',
    7,
    135000,
    1630,
    '/watch-sichuan-opera-diamond-front-transparent.webp',
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

-- 55. Sichuan Opera Face-Changing Tonneau Silver Diamond (HBR-9907-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'sichuan-opera-diamond-steel',
    'HBR-9907-SS',
    'Sichuan Opera Face-Changing Tonneau Silver Diamond',
    'Haute Métiers d''Art Bian Lian Complication • Pavé Diamond Steel Case • Folding Fan Guilloché',
    'TONNEAU',
    'Tonneau Skeleton',
    'Haute Métiers d''Art',
    '₹1,32,000',
    '$1,590',
    'In Stock',
    '2026',
    'The ice-brilliant sister edition to the rose gold Sichuan Opera masterpiece. Sculpted in high-polish surgical stainless steel fully pave-set with brilliant-cut diamonds. Features the animated Sichuan Opera ''Bian Lian'' (Face Changing) complication at 6 o''clock with hand-enameled ceremonial mask, folding fan guilloché sector at 12 o''clock, polished rhodium skeleton hands, and the exclusive imperial presentation gift box.',
    '/watch-sichuan-opera-steel-front-transparent.webp',
    '/watch-sichuan-opera-steel-front-transparent.webp',
    '["/watch-sichuan-opera-steel-front-transparent.webp","/watch-sichuan-opera-steel-box.webp","/watch-sichuan-opera-steel-wrist.webp","/watch-sichuan-opera-steel-macro.webp"]'::jsonb,
    '[{"url":"/watch-sichuan-opera-steel-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical silver 316L steel tonneau case with full pavé diamond bezel, hand-enameled Sichuan Opera mask at 6H, and folding fan sector at 12H."},{"url":"/watch-sichuan-opera-steel-box.webp","title":"Imperial Gift Box & Cultural Fan Set","label":"02 Imperial Vault","caption":"Complete collector''s presentation with the lacquered imperial red Bian Lian gift shrine, traditional mask folding fan, and passport."},{"url":"/watch-sichuan-opera-steel-wrist.webp","title":"Sartorial Chinese Folding Fan On-Wrist","label":"03 Opera Fan On-Wrist","caption":"Front on-wrist capture framed against traditional Sichuan Opera mask folding fan showcasing cultural heritage."},{"url":"/watch-sichuan-opera-steel-macro.webp","title":"Pavé Diamond Brilliance & Perspective","label":"04 Diamond Fire Profile","caption":"Three-quarter isometric profile on black reflective base with mask fan in backdrop highlighting diamond pave fire and curved tonneau lines."}]'::jsonb,
    '{"movement":"Caliber H-9970 Haute Métiers d''Art Bian Lian Dynamic Face-Changing Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"28 Synthetic Rubies & Micro-Gems","caseMaterial":"Solid 316L Surgical Stainless Steel Fully Set with Hand-Paved Brilliant-Cut Zirconias","caseDimensions":"44.0 mm × 52.0 mm Tonneau × 14.5 mm","lugToLug":"52.0 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Laser-Engraved Opera Mask Motif","dial":"Hand-Enameled Ceramic Mask with Folding Fan Guilloché Fluting & Radiant Skeleton Bridges","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Fluororubber Strap with Quick-Release Integration","clasp":"Solid 316L Stainless Steel Double-Security Deployant Buckle","complications":["Dynamic Bian Lian (Face-Changing) Mechanism at 6 o''clock","Traditional Folding Fan Sunburst Guilloché at 12 o''clock","Full Pavé Diamond-Encrusted Silver Steel Tonneau Frame","Polished Rhodium Luminous Skeleton Hands & Star Screws"],"packaging":"Imperial Red Lacquered Heritage Gift Box with Traditional Mask Folding Fan & NFC Passport"}'::jsonb,
    6,
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
    'sichuan-opera-diamond-steel',
    'HBR-9907-SS',
    'Sichuan Opera Face-Changing Tonneau Silver Diamond',
    'Tonneau Skeleton',
    6,
    132000,
    1590,
    '/watch-sichuan-opera-steel-front-transparent.webp',
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

-- 56. Great Wave off Kanagawa Ocean Sapphire Tonneau Skeleton (HBR-7715-GW)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'sapphire-kanagawa-wave',
    'HBR-7715-GW',
    'Great Wave off Kanagawa Ocean Sapphire Tonneau Skeleton',
    'Hand-Painted Ukiyo-e Wave Dial • 3D Full Moon & Starry Sky • All-Transparent Sapphire Tonneau Case',
    'TONNEAU',
    'Tonneau Skeleton',
    'Art Horlogerie',
    '₹1,28,000',
    '$1,540',
    'Limited Edition',
    '2026',
    'Tonneau haute horlogerie sculpted inside an all-transparent curved synthetic sapphire crystal case secured by titanium H-screws. The dial presents a breathtaking artistic tribute to Hokusai''s ''The Great Wave off Kanagawa'' (神奈川沖浪裏) with multi-layered micro-enamel ocean waves surging in vibrant cyan blue, indigo, and seafoam crests across the openworked skeleton movement. At 1-2 o''clock, a detailed glowing spherical textured full moon shines over swirling clouds and stars. Framed by a vibrant cyan blue chapter ring with luminous Arabic numerals and skeleton arrow hands with a racing red pointer. Fitted with a cyan blue ergonomic fluted rubber crown and high-performance vulcanized cyan sky blue fluororubber strap with titanium deployant clasp.',
    '/watch-sapphire-kanagawa-wave-front-transparent.webp',
    '/watch-sapphire-kanagawa-wave-front-transparent.webp',
    '["/watch-sapphire-kanagawa-wave-front-transparent.webp","/watch-sapphire-kanagawa-wave-motorsport.webp","/watch-sapphire-kanagawa-wave-ocean.webp","/watch-sapphire-kanagawa-wave-wrist.webp"]'::jsonb,
    '[{"url":"/watch-sapphire-kanagawa-wave-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical curved transparent sapphire tonneau case with Great Wave micro-painted dial, full moon sphere, and cyan blue strap."},{"url":"/watch-sapphire-kanagawa-wave-motorsport.webp","title":"Motorsport Wheel Neon Horizon","label":"02 Motorsport Horizon","caption":"Isometric perspective on high-performance supercar wheel showcasing vibrant blue neon reflections and transparent sapphire case."},{"url":"/watch-sapphire-kanagawa-wave-ocean.webp","title":"Pacific Coastal Ocean Bedrock","label":"03 Ocean Bedrock","caption":"Editorial nature perspective on coastal rocks amidst crashing waves and azure ocean horizons."},{"url":"/watch-sapphire-kanagawa-wave-wrist.webp","title":"Sartorial Coastal Denim On-Wrist Horizon","label":"04 Coastal Wrist","caption":"On-wrist perspective paired with denim shirt highlighting the transparent case curve and vivid wave artwork."}]'::jsonb,
    '{"movement":"Caliber H-7715 Ukiyo-e Wave Multi-Bridge Openworked Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"28 Synthetic Rubies","caseMaterial":"Curved Transparent Optical Synthetic Sapphire Crystal Tonneau with Titanium H-Screws","caseDimensions":"44.0 mm × 51.5 mm Curved Tonneau × 15.0 mm","lugToLug":"51.5 mm","glass":"Curved 3D Scratch-Resistant Sapphire Crystal with Dual AR Coating","caseback":"Full Transparent Synthetic Sapphire Exhibition Back","dial":"Multi-Layered Hand-Rendered ''Great Wave off Kanagawa'' Enamel Artwork with 3D Textured Full Moon & Starry Night Skeleton Bridges","lume":"Swiss Super-LumiNova BGW9 on Arabic Numerals, Hand Inserts, and Moon Disc","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Cyan Sky Blue Ergonomic Fluororubber Strap","clasp":"Solid Titanium Double-Security Push-Button Deployant Clasp","complications":["Multi-Layered Micro-Painted ''The Great Wave off Kanagawa'' Tidal Wave Artwork","3D Textured Full Moon and Celestial Starry Night Swirl Bridges at 1-2 O''Clock","Full Curved Transparent Synthetic Sapphire Crystal 360-Degree Case Architecture","Openworked Multi-Bridge Architectural Skeleton Movement Assembly","Cyan Blue Anodized Fluted Crown with High-Grip Rubber O-Ring"],"packaging":"Custom Japanese Art Vault Wooden Presentation Chest with NFC Certificate of Authenticity"}'::jsonb,
    5,
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
    'sapphire-kanagawa-wave',
    'HBR-7715-GW',
    'Great Wave off Kanagawa Ocean Sapphire Tonneau Skeleton',
    'Tonneau Skeleton',
    5,
    128000,
    1540,
    '/watch-sapphire-kanagawa-wave-front-transparent.webp',
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

-- 57. Stealth Fighter Jet Earth Tonneau Diamond (HBR-9905-FJ)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'stealth-fighter-jet-tonneau',
    'HBR-9905-FJ',
    'Stealth Fighter Jet Earth Tonneau Diamond',
    '3D Micro-Sculpted Supersonic Jet • Rotating Earth Hemisphere • Diamond Pavé Bezel Flanks',
    'TONNEAU',
    'Tonneau Skeleton',
    'Haute Aviation Complication',
    '₹1,26,000',
    '$1,520',
    'In Stock',
    '2026',
    'Supersonic aerodynamics meet celestial navigation. Features a hand-chiseled 3D micro-sculpture of a twin-engine Supersonic Stealth Fighter Jet ascending across an openwork X-wing framework over a rotating Earth hemisphere globe disk in vibrant blue and cloud white. The curved 316L stainless steel tonneau case is embellished with brilliant diamond pavé side flanks, jet intake fluting, and a turbine-engraved crown on an ergonomic black fluororubber strap.',
    '/watch-stealth-fighter-jet-front-transparent.webp',
    '/watch-stealth-fighter-jet-front-transparent.webp',
    '["/watch-stealth-fighter-jet-front-transparent.webp","/watch-stealth-fighter-jet-wing.webp","/watch-stealth-fighter-jet-sky.webp","/watch-stealth-fighter-jet-steel.webp","/watch-stealth-fighter-jet-back.webp"]'::jsonb,
    '[{"url":"/watch-stealth-fighter-jet-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel tonneau case with diamond-pavé side flanks, 3D sculpted supersonic fighter jet, rotating blue earth disk, and electric blue hands."},{"url":"/watch-stealth-fighter-jet-wing.webp","title":"Aviation Fuselage Perspective","label":"02 Aircraft Wing","caption":"Dramatic composition resting on aircraft wing under open skies, highlighting the aviation DNA and turbine crown."},{"url":"/watch-stealth-fighter-jet-sky.webp","title":"In-Flight Aerial Horizon","label":"03 Flight Horizon","caption":"Perspective framed against open skies with aircraft in flight demonstrating the high-contrast stencil numerals and curved sapphire."},{"url":"/watch-stealth-fighter-jet-steel.webp","title":"Aircraft Carrier Steel Studio","label":"04 Steel Structure","caption":"Three-quarter isometric studio capture on aircraft-grade reflective steel plate exhibiting the diamond pave fire."},{"url":"/watch-stealth-fighter-jet-back.webp","title":"Exhibition Caliber & Turbine Rotor","label":"05 Exhibition Rotor","caption":"Detailed caseback exhibition showing the high-beat automatic caliber, skeleton turbine rotor, and engraved Hanboro buckle."}]'::jsonb,
    '{"movement":"Caliber H-9920 Supersonic Aviation Openwork Automatic Caliber with Custom Weighted Rotor","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"26 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with Diamond-Pavé Side Flanks & Jet Intake Fluting","caseDimensions":"44.0 mm × 52.0 mm Tonneau × 14.2 mm","lugToLug":"52.0 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Supercar/Jet Turbine Openwork Rotor","dial":"3D Sculpted Silver Fighter Jet with Rotating Celestial Earth Hemisphere & Electric Blue Skeleton Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Fluororubber Strap with Lateral Airflow Ports","clasp":"Engraved HANBORO Solid 316L Stainless Steel Tang Buckle","complications":["3D Micro-Sculpted Supersonic Jet Fighter Ascending Complication","Rotating 24-Hour Celestial Blue Earth Hemisphere Disk","Diamond Pavé Encrusted Bezel Side Flanks","Electric Royal-Blue Skeleton Hands with Super-LumiNova & Heart Insignia","Turbine-Grooved Crown with Hanboro Star Motif"],"packaging":"Aero-Grade Matte Black Flight Presentation Vault with Pilot Mission Card & NFC Warranty Passport"}'::jsonb,
    12,
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
    'stealth-fighter-jet-tonneau',
    'HBR-9905-FJ',
    'Stealth Fighter Jet Earth Tonneau Diamond',
    'Tonneau Skeleton',
    12,
    126000,
    1520,
    '/watch-stealth-fighter-jet-front-transparent.webp',
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

-- 58. Forged Carbon Damascus Tonneau Skeleton (HBR-7708-FC)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-tonneau-tourbillon',
    'HBR-7708-FC',
    'Forged Carbon Damascus Tonneau Skeleton',
    'Bioluminescent Damascus Lume Case • Big Date Panorama • Openwork Skeleton Caliber',
    'TONNEAU',
    'Tonneau Skeleton',
    'Bioluminescent Carbon Lume',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'A technological triumph in composite horology and luminescent materials. Crafted from proprietary Damascus Forged Carbon, where infused bioluminescent phosphor veins glow emerald green in darkness. Features an openworked multi-layer skeleton movement with a twin-disc Big Date panorama at 12 o''clock, exposed high-beat balance assembly at 6 o''clock, multi-function subdials at 3 and 9 o''clock, anodized motorsport accents, and a ventilated ergonomic fluororubber strap.',
    '/watch-forged-carbon-tonneau-front-transparent.webp',
    '/watch-forged-carbon-tonneau-front-transparent.webp',
    '["/watch-forged-carbon-tonneau-front-transparent.webp","/watch-forged-carbon-tonneau-night-glow.webp","/watch-forged-carbon-tonneau-ferrari.webp","/watch-forged-carbon-tonneau-wrist-leather.webp","/watch-forged-carbon-tonneau-wrist-macro.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-tonneau-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Forged Damascus carbon case architecture showcasing the multi-layer skeleton caliber, Big Date panorama at 12 o''clock, and exposed balance bridge."},{"url":"/watch-forged-carbon-tonneau-night-glow.webp","title":"Bioluminescent Damascus Night Glow","label":"02 Night Lume Metamorphosis","caption":"Darkness reveals glowing emerald green phosphor veins running throughout the Damascus carbon case paired with luminous cyan skeleton numerals."},{"url":"/watch-forged-carbon-tonneau-ferrari.webp","title":"Motorsport DNA & Red Scuderia Profile","label":"03 Motorsport Scuderia","caption":"Isometric perspective against crimson supercar bodywork highlighting the titanium spline screws and anodized racing yellow crown."},{"url":"/watch-forged-carbon-tonneau-wrist-leather.webp","title":"Sartorial Biker Leather Presence","label":"04 On-Wrist Biker Style","caption":"Bold high-performance wrist presence paired with perforated black leather tailoring."},{"url":"/watch-forged-carbon-tonneau-wrist-macro.webp","title":"Precision Macro Horology View","label":"05 Macro Inspection","caption":"Close-up ergonomic inspection of the curved 3D sapphire crystal, openwork gear trains, and red flange tachymeter."}]'::jsonb,
    '{"movement":"Caliber H-7790 Grand Complication Openwork Skeleton Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"29 Synthetic Rubies & Titanium Screws","caseMaterial":"Proprietary Damascus Forged Carbon Composite with Phosphor Infused Veins & Grade 5 Titanium Core","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.2 mm","lugToLug":"51.5 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Carbon-Weave Skeleton Rotor","dial":"Multi-Layer Openworked Titanium Bridges with Dual-Chroma Super-LumiNova & Signal Red Track","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Ventilated Aerodynamic Matte Black Fluororubber Racing Strap","clasp":"Black DLC Titanium Double-Security Deployant Buckle","complications":["Bioluminescent Damascus Carbon Case Glow (Green / Cyan)","Twin-Disc Big Date Panorama at 12 o''clock","Exposed High-Beat Balance Assembly at 6 o''clock","Dual Running Function Subdials at 3 and 9 o''clock","Anodized Motorsport Yellow & Red Accents"],"packaging":"Matte Carbon Presentation Shrine with UV Luminescence Torch & NFC Authenticity Passport"}'::jsonb,
    11,
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
    'forged-carbon-tonneau-tourbillon',
    'HBR-7708-FC',
    'Forged Carbon Damascus Tonneau Skeleton',
    'Tonneau Skeleton',
    11,
    98000,
    1180,
    '/watch-forged-carbon-tonneau-front-transparent.webp',
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

-- 59. Forged Damascus Carbon 10ATM Skeleton (HBR-7710-FC)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-damascus-10atm',
    'HBR-7710-FC',
    'Forged Damascus Carbon 10ATM Skeleton',
    'Layered Damascus Carbon Case • Dual-Subdial Caliber • 100M Water Resistance • Quick-Release Strap',
    'TONNEAU',
    'Tonneau Skeleton',
    'Forged Damascus Carbon 100M',
    '₹92,000',
    '$1,110',
    'In Stock',
    '2026',
    'Ultra-lightweight multi-layer forged Damascus carbon fiber engineered to withstand 100 meters (10 ATM) of dynamic water resistance. The signature organic Damascus wave grain is paired with an openworked multi-register caliber featuring a 6 o''clock seconds register with bright red caliper hand, 9 o''clock 24-hour subdial, exposed 12H mainspring barrel, anodized crimson fluted crown, and a quick-release fluororubber strap system.',
    '/watch-forged-carbon-damascus-10atm-front-transparent.webp',
    '/watch-forged-carbon-damascus-10atm-front-transparent.webp',
    '["/watch-forged-carbon-damascus-10atm-front-transparent.webp","/watch-forged-carbon-damascus-10atm-angle-transparent.webp","/watch-forged-carbon-damascus-10atm-exploded-transparent.webp","/watch-forged-carbon-damascus-10atm-supercar.webp","/watch-forged-carbon-damascus-10atm-lifestyle.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-damascus-10atm-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical forged Damascus carbon tonneau case with multi-register skeleton caliber, red caliper hand, and crimson crown."},{"url":"/watch-forged-carbon-damascus-10atm-angle-transparent.webp","title":"Three-Quarter Studio Architecture","label":"02 Damascus Waves","caption":"Angled perspective highlighting the organic carbon wave layers, titanium spline screws, and curved sapphire glass."},{"url":"/watch-forged-carbon-damascus-10atm-exploded-transparent.webp","title":"Quick-Release Modular Architecture","label":"03 Quick-Release Lugs","caption":"Exploded technical view exhibiting the patented steel quick-release strap inserts and black deployant buckle."},{"url":"/watch-forged-carbon-damascus-10atm-supercar.webp","title":"Supercar Combustion Dynamic Studio","label":"04 Supercar Flames","caption":"Dramatic studio setting against supercar flame aura showcasing the automotive carbon heritage."},{"url":"/watch-forged-carbon-damascus-10atm-lifestyle.webp","title":"Cyber Ambient On-Wrist Lifestyle","label":"05 Cyber Lifestyle","caption":"On-wrist perspective under neon ambient lighting showcasing the lightweight presence and ergonomic drape."}]'::jsonb,
    '{"movement":"Caliber H-7721 Dual-Register Openwork Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"21 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Compression-Molded Real Forged Damascus Carbon Fiber with Titanium Core","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.0 mm","lugToLug":"51.5 mm","glass":"Curved Tonneau Scratch-Proof Sapphire Crystal with Dual AR Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Rotor","dial":"Multi-Tier High-Contrast Openworked Skeleton with Signal Red Caliper Hand & 24H Counter","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"High-Performance Ergonomic Black Fluororubber with Patented Quick-Release Steel Lugs","clasp":"Solid 316L Black DLC Double-Push Butterfly Deployant Clasp","complications":["100 Meters / 10 ATM Certified Water Resistance","6 O''Clock Seconds Subdial with Signal Red Caliper Hand","9 O''Clock 24-Hour Dual-Time Sub-Register","Exposed 12 O''Clock Mainspring Driving Barrel","Patented Quick-Release Fluororubber Lug System","Anodized Crimson Fluted Crown"],"packaging":"Matte Black Carbon Composite Flight Presentation Case & NFC Warranty Passport"}'::jsonb,
    10,
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
    'forged-carbon-damascus-10atm',
    'HBR-7710-FC',
    'Forged Damascus Carbon 10ATM Skeleton',
    'Tonneau Skeleton',
    10,
    92000,
    1110,
    '/watch-forged-carbon-damascus-10atm-front-transparent.webp',
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

-- 60. Arctic White 10ATM Multi-Register Tonneau (HBR-7710-WH)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'arctic-tonneau-10atm-white',
    'HBR-7710-WH',
    'Arctic White 10ATM Multi-Register Tonneau',
    'Pure Arctic Ceramic Composite • 100M Water Resistance • Dual-Register Caliber • Quick-Release Modular System',
    'TONNEAU',
    'Tonneau Skeleton',
    'Arctic Ceramic 100M',
    '₹89,000',
    '$1,070',
    'In Stock',
    '2026',
    'Crisp avant-garde purity with 100-meter (10 ATM) certified waterproof performance. Sculpted with an Arctic White composite bezel over a high-polish 316L stainless steel core. The multi-layer skeleton movement features a 6 o''clock seconds register with bright red caliper hand, 9 o''clock 24-hour counter, 12H exposed mainspring, a limited edition numbered exhibition caseback, and a quick-release interchangeable fluororubber strap system.',
    '/watch-arctic-tonneau-10atm-white-front-transparent.webp',
    '/watch-arctic-tonneau-10atm-white-front-transparent.webp',
    '["/watch-arctic-tonneau-10atm-white-front-transparent.webp","/watch-arctic-tonneau-10atm-white-straps.webp","/watch-arctic-tonneau-10atm-white-back-transparent.webp"]'::jsonb,
    '[{"url":"/watch-arctic-tonneau-10atm-white-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical Arctic White ceramic-composite tonneau case with multi-register skeleton caliber and signal red caliper hand."},{"url":"/watch-arctic-tonneau-10atm-white-straps.webp","title":"Modular Quick-Release Strap Collection","label":"02 Strap Suite","caption":"Studio exhibition showing the Arctic White & Forged Carbon editions alongside the multi-colored interchangeable fluororubber strap suite."},{"url":"/watch-arctic-tonneau-10atm-white-back-transparent.webp","title":"Limited Edition Exhibition Caseback","label":"03 Limited Caseback","caption":"Three-quarter exhibition caseback showing the limited edition 0478 serial engraving, skeleton rotor, and 10ATM rating."}]'::jsonb,
    '{"movement":"Caliber H-7721 Dual-Register Openwork Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"21 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Arctic White Ceramic-Composite Bezel with 316L Mirror-Polished Stainless Steel Core","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.0 mm","lugToLug":"51.5 mm","glass":"Curved Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Individually Numbered Limited Edition Exhibition Sapphire Caseback","dial":"High-Contrast Openwork Bridges with Signal Red Caliper Hand & 24H Sub-Register","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"High-Density Arctic White Anti-Dust Fluororubber with Patented Quick-Release Lugs","clasp":"Solid 316L Stainless Steel Heavy Duty Engraved Tang Buckle","complications":["100 Meters / 10 ATM Certified Aquatic Rating","6 O''Clock Seconds Subdial with Signal Red Caliper Hand","9 O''Clock 24-Hour Dual-Time Sub-Register","Exposed 12 O''Clock Mainspring Driving Barrel","Patented Quick-Release Modular Interchangeable Strap System","Numbered Limited Edition Caseback (0478 Series)"],"packaging":"Minimalist Hard-Shell Travel Vault with Interchangeable Quick-Release Straps & NFC Passport"}'::jsonb,
    9,
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
    'arctic-tonneau-10atm-white',
    'HBR-7710-WH',
    'Arctic White 10ATM Multi-Register Tonneau',
    'Tonneau Skeleton',
    9,
    89000,
    1070,
    '/watch-arctic-tonneau-10atm-white-front-transparent.webp',
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

-- 61. Forged Carbon Ribbed Shield Tonneau Skeleton (HBR-7712-CS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-ribbed-shield',
    'HBR-7712-CS',
    'Forged Carbon Ribbed Shield Tonneau Skeleton',
    'Horizontal Ribbed Carbon Bezel • Dual Heraldic Shield Bridges • 4-Point Arrow Caliber',
    'TONNEAU',
    'Tonneau Skeleton',
    'Ribbed Forged Carbon',
    '₹96,000',
    '$1,160',
    'In Stock',
    '2026',
    'Aggressive motorsport aerospace carbon architecture with distinct horizontal ribbed striations on the upper and lower bezel hoods. The skeleton movement features dual heraldic shield bridge structures at 12 o''clock and 6 o''clock framing a 4-point arrow openwork caliber with exposed synthetic rubies, floating red flange minute track, titanium spline screws on polished side flanks, and an ergonomic ventilated fluororubber strap.',
    '/watch-forged-carbon-ribbed-shield-front-transparent.webp',
    '/watch-forged-carbon-ribbed-shield-front-transparent.webp',
    '["/watch-forged-carbon-ribbed-shield-front-transparent.webp","/watch-forged-carbon-ribbed-shield-ferrari.webp","/watch-forged-carbon-ribbed-shield-biker.webp","/watch-forged-carbon-ribbed-shield-supercar.webp","/watch-forged-carbon-ribbed-shield-wrist.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-ribbed-shield-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical black forged carbon tonneau case with horizontal ribbed hoods, dual shield bridges, and 4-point arrow skeleton caliber."},{"url":"/watch-forged-carbon-ribbed-shield-ferrari.webp","title":"Ferrari Supercar Cockpit Setting","label":"02 Ferrari Console","caption":"Automotive composition on red Ferrari interior console highlighting the racing composite engineering."},{"url":"/watch-forged-carbon-ribbed-shield-biker.webp","title":"Biker Leather Sartorial Presence","label":"03 Biker Leather","caption":"On-wrist perspective with black leather motorcycle jacket and yellow helmet demonstrating the aggressive wrist silhouette."},{"url":"/watch-forged-carbon-ribbed-shield-supercar.webp","title":"Supercar Wheel Studio Perspective","label":"04 Supercar Studio","caption":"Moody dark studio capture against sports car wheel showcasing the ribbed carbon striations."},{"url":"/watch-forged-carbon-ribbed-shield-wrist.webp","title":"Perforated Driving Leather Macro","label":"05 Driving Leather","caption":"Close-up on-wrist capture with perforated leather driving jacket revealing the dual shield bridges and exposed rubies."}]'::jsonb,
    '{"movement":"Caliber H-7730 Shield Openwork Radial Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"24 Synthetic Rubies & Heat-Treated Screws","caseMaterial":"High-Tech Compression Forged Carbon with Horizontal Ribbed Hoods & Titanium Spline Screws","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.2 mm","lugToLug":"51.5 mm","glass":"Curved 3D Tonneau Scratch-Proof Sapphire Crystal with Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Caliper Rotor","dial":"Dual Heraldic Shield Skeleton Architecture with 4-Point Arrow Radial Framework","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Ventilated Matte Black Fluororubber Racing Strap","clasp":"Solid 316L Black DLC Stainless Steel Engraved Tang Buckle","complications":["Horizontal Ribbed Aerodynamic Carbon Hoods","Dual Heraldic Shield Caliber Architecture at 12 & 6 o''clock","4-Point Arrow Openwork Radial Framework with Exposed Rubies","Floating Inner Red-Accent Flange Track with Luminous Batons","Oversized Knurled Crown with Black Cabochon"],"packaging":"Matte Black Carbon Composite Presentation Case & NFC Warranty Passport"}'::jsonb,
    8,
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
    'forged-carbon-ribbed-shield',
    'HBR-7712-CS',
    'Forged Carbon Ribbed Shield Tonneau Skeleton',
    'Tonneau Skeleton',
    8,
    96000,
    1160,
    '/watch-forged-carbon-ribbed-shield-front-transparent.webp',
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

-- 62. Forged Carbon Ribbed Shield Tonneau Skeleton Royal Blue (HBR-7712-BL)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-ribbed-shield-blue',
    'HBR-7712-BL',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Royal Blue',
    'Electric Royal Blue Carbon Bezel • Dual Heraldic Shield Bridges • 4-Point Arrow Caliber',
    'TONNEAU',
    'Tonneau Skeleton',
    'Ribbed Forged Carbon',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'Electrifying cobalt composite horology with layered Royal Blue and carbon striations. Engineered with horizontal aerodynamic ribbed hoods on the tonneau bezel, dual heraldic shield bridge architecture at 12 and 6 o''clock framing a 4-point arrow openwork caliber with exposed rubies, floating red-accent inner track, titanium spline screws on polished flanks, and an electric royal blue fluororubber racing strap.',
    '/watch-forged-carbon-ribbed-shield-blue-front-transparent.webp',
    '/watch-forged-carbon-ribbed-shield-blue-front-transparent.webp',
    '["/watch-forged-carbon-ribbed-shield-blue-front-transparent.webp","/watch-forged-carbon-ribbed-shield-blue-ferrari.webp","/watch-forged-carbon-ribbed-shield-blue-lamborghini.webp","/watch-forged-carbon-ribbed-shield-blue-mesh.webp","/watch-forged-carbon-ribbed-shield-blue-supercar.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-ribbed-shield-blue-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical royal blue forged carbon tonneau case with horizontal ribbed hoods, dual shield bridges, and blue fluororubber strap."},{"url":"/watch-forged-carbon-ribbed-shield-blue-ferrari.webp","title":"Ferrari Supercar Cockpit Setting","label":"02 Ferrari Console","caption":"Automotive composition on red Ferrari interior console highlighting the cobalt carbon contrast."},{"url":"/watch-forged-carbon-ribbed-shield-blue-lamborghini.webp","title":"Lamborghini Supercar Display","label":"03 Supercar Display","caption":"High-octane tabletop composition with miniature Lamborghini supercar exhibiting motorsport pedigree."},{"url":"/watch-forged-carbon-ribbed-shield-blue-mesh.webp","title":"Cybertech Radiator Mesh Studio","label":"04 Radiator Mesh","caption":"Detailed macro perspective on red honeycomb radiator mesh showcasing the 4-point arrow skeleton framework."},{"url":"/watch-forged-carbon-ribbed-shield-blue-supercar.webp","title":"Supercar Wheel Studio Perspective","label":"05 Supercar Studio","caption":"Moody dark studio capture beside a sports car wheel highlighting the blue carbon striations."}]'::jsonb,
    '{"movement":"Caliber H-7730 Shield Openwork Radial Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"24 Synthetic Rubies & Heat-Treated Screws","caseMaterial":"Layered Royal Blue & Black Composite Forged Carbon with Ribbed Hoods & Titanium Spline Screws","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.2 mm","lugToLug":"51.5 mm","glass":"Curved 3D Tonneau Scratch-Proof Sapphire Crystal with Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Caliper Rotor","dial":"Dual Heraldic Shield Skeleton Architecture with 4-Point Arrow Radial Framework","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Ventilated Royal Blue Fluororubber Racing Strap","clasp":"Solid 316L Black DLC Stainless Steel Engraved Tang Buckle","complications":["Layered Electric Royal Blue Composite Forged Carbon Case","Horizontal Ribbed Aerodynamic Carbon Hoods","Dual Heraldic Shield Caliber Architecture at 12 & 6 o''clock","4-Point Arrow Openwork Radial Framework with Exposed Rubies","Floating Inner Red-Accent Flange Track with Luminous Batons"],"packaging":"Matte Black Carbon Composite Presentation Case & NFC Warranty Passport"}'::jsonb,
    7,
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
    'forged-carbon-ribbed-shield-blue',
    'HBR-7712-BL',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Royal Blue',
    'Tonneau Skeleton',
    7,
    98000,
    1180,
    '/watch-forged-carbon-ribbed-shield-blue-front-transparent.webp',
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

-- 63. Forged Carbon Ribbed Shield Tonneau Skeleton Cyber Green (HBR-7712-GN)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-ribbed-shield-green',
    'HBR-7712-GN',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Cyber Green',
    'Cyber Neon Green Carbon Bezel • Dual Heraldic Shield Bridges • 4-Point Arrow Caliber',
    'TONNEAU',
    'Tonneau Skeleton',
    'Ribbed Forged Carbon',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'Electrifying cyber-kinetic composite horology with layered Neon Green and carbon striations. Engineered with horizontal aerodynamic ribbed hoods on the tonneau bezel, dual heraldic shield bridge architecture at 12 and 6 o''clock framing a 4-point arrow openwork caliber with exposed rubies, floating red-accent inner track, titanium spline screws on polished flanks, and a cyber neon green fluororubber racing strap.',
    '/watch-forged-carbon-ribbed-shield-green-front-transparent.webp',
    '/watch-forged-carbon-ribbed-shield-green-front-transparent.webp',
    '["/watch-forged-carbon-ribbed-shield-green-front-transparent.webp","/watch-forged-carbon-ribbed-shield-green-ferrari.webp","/watch-forged-carbon-ribbed-shield-green-lamborghini.webp","/watch-forged-carbon-ribbed-shield-green-mesh.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-ribbed-shield-green-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical cyber neon green forged carbon tonneau case with horizontal ribbed hoods, dual shield bridges, and green fluororubber strap."},{"url":"/watch-forged-carbon-ribbed-shield-green-ferrari.webp","title":"Ferrari Supercar Cockpit Setting","label":"02 Ferrari Console","caption":"Automotive composition on red Ferrari interior console highlighting the vivid neon green carbon contrast."},{"url":"/watch-forged-carbon-ribbed-shield-green-lamborghini.webp","title":"Lamborghini Supercar Display","label":"03 Supercar Display","caption":"High-octane tabletop composition with miniature Lamborghini supercar exhibiting motorsport pedigree."},{"url":"/watch-forged-carbon-ribbed-shield-green-mesh.webp","title":"Cybertech Radiator Mesh Studio","label":"04 Radiator Mesh","caption":"Detailed macro perspective on red honeycomb radiator mesh showcasing the 4-point arrow skeleton framework."}]'::jsonb,
    '{"movement":"Caliber H-7730 Shield Openwork Radial Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"24 Synthetic Rubies & Heat-Treated Screws","caseMaterial":"Layered Cyber Neon Green & Black Composite Forged Carbon with Ribbed Hoods & Titanium Spline Screws","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.2 mm","lugToLug":"51.5 mm","glass":"Curved 3D Tonneau Scratch-Proof Sapphire Crystal with Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Caliper Rotor","dial":"Dual Heraldic Shield Skeleton Architecture with 4-Point Arrow Radial Framework","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Ventilated Cyber Neon Green Fluororubber Racing Strap","clasp":"Solid 316L Black DLC Stainless Steel Engraved Tang Buckle","complications":["Layered Cyber Neon Green Composite Forged Carbon Case","Horizontal Ribbed Aerodynamic Carbon Hoods","Dual Heraldic Shield Caliber Architecture at 12 & 6 o''clock","4-Point Arrow Openwork Radial Framework with Exposed Rubies","Floating Inner Red-Accent Flange Track with Luminous Batons"],"packaging":"Matte Black Carbon Composite Presentation Case & NFC Warranty Passport"}'::jsonb,
    6,
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
    'forged-carbon-ribbed-shield-green',
    'HBR-7712-GN',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Cyber Green',
    'Tonneau Skeleton',
    6,
    98000,
    1180,
    '/watch-forged-carbon-ribbed-shield-green-front-transparent.webp',
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

-- 64. Forged Carbon Ribbed Shield Tonneau Skeleton Rosso Corsa (HBR-7712-RD)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-ribbed-shield-red',
    'HBR-7712-RD',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Rosso Corsa',
    'Crimson Rosso Corsa Bezel • Dual Heraldic Shield Bridges • 4-Point Arrow Caliber',
    'TONNEAU',
    'Tonneau Skeleton',
    'Ribbed Forged Carbon',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'Pure Italian racing adrenaline fused with advanced composite craftsmanship. Finished in vivid Crimson Rosso Corsa with horizontal aerodynamic ribbed hoods on the tonneau bezel, dual heraldic shield bridge architecture at 12 and 6 o''clock framing a 4-point arrow openwork caliber with exposed rubies, floating red-accent inner track, titanium spline screws on polished flanks, and a crimson rosso corsa fluororubber racing strap.',
    '/watch-forged-carbon-ribbed-shield-red-front-transparent.webp',
    '/watch-forged-carbon-ribbed-shield-red-front-transparent.webp',
    '["/watch-forged-carbon-ribbed-shield-red-front-transparent.webp","/watch-forged-carbon-ribbed-shield-red-ferrari.webp","/watch-forged-carbon-ribbed-shield-red-mesh.webp","/watch-forged-carbon-ribbed-shield-red-lamborghini.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-ribbed-shield-red-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical crimson rosso corsa tonneau case with horizontal ribbed hoods, dual shield bridges, and red fluororubber strap."},{"url":"/watch-forged-carbon-ribbed-shield-red-ferrari.webp","title":"Ferrari Supercar Cockpit Setting","label":"02 Ferrari Console","caption":"Automotive composition on red Ferrari interior console highlighting the Rosso Corsa racing pedigree."},{"url":"/watch-forged-carbon-ribbed-shield-red-mesh.webp","title":"Cybertech Radiator Mesh Studio","label":"03 Radiator Mesh","caption":"Detailed macro perspective on red honeycomb radiator mesh showcasing the 4-point arrow skeleton framework."},{"url":"/watch-forged-carbon-ribbed-shield-red-lamborghini.webp","title":"Lamborghini Supercar Display","label":"04 Supercar Display","caption":"High-octane tabletop composition with miniature Lamborghini supercar exhibiting motorsport pedigree."}]'::jsonb,
    '{"movement":"Caliber H-7730 Shield Openwork Radial Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"24 Synthetic Rubies & Heat-Treated Screws","caseMaterial":"High-Tech Crimson Rosso Corsa Composite with Ribbed Hoods & Titanium Spline Screws","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.2 mm","lugToLug":"51.5 mm","glass":"Curved 3D Tonneau Scratch-Proof Sapphire Crystal with Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Caliper Rotor","dial":"Dual Heraldic Shield Skeleton Architecture with 4-Point Arrow Radial Framework","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Ventilated Crimson Rosso Corsa Fluororubber Racing Strap","clasp":"Solid 316L Black DLC Stainless Steel Engraved Tang Buckle","complications":["Vivid Crimson Rosso Corsa Composite Tonneau Case","Horizontal Ribbed Aerodynamic Carbon Hoods","Dual Heraldic Shield Caliber Architecture at 12 & 6 o''clock","4-Point Arrow Openwork Radial Framework with Exposed Rubies","Floating Inner Red-Accent Flange Track with Luminous Batons"],"packaging":"Matte Black Carbon Composite Presentation Case & NFC Warranty Passport"}'::jsonb,
    5,
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
    'forged-carbon-ribbed-shield-red',
    'HBR-7712-RD',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Rosso Corsa',
    'Tonneau Skeleton',
    5,
    98000,
    1180,
    '/watch-forged-carbon-ribbed-shield-red-front-transparent.webp',
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

-- 65. Forged Carbon Ribbed Shield Tonneau Skeleton Arctic White (HBR-7712-WH)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'forged-carbon-ribbed-shield-white',
    'HBR-7712-WH',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Arctic White',
    'Engineered Arctic White Ceramic Bezel • Anodized Cobalt Blue Hands • Dual Shield Bridges',
    'TONNEAU',
    'Tonneau Skeleton',
    'Ribbed Ceramic & Carbon',
    '₹98,000',
    '$1,180',
    'In Stock',
    '2026',
    'Ultra-clean high-tech polar aesthetic engineered in pure Arctic White Ceramic and titanium. Features horizontal aerodynamic ribbed hoods on the tonneau bezel, anodized electric cobalt blue skeleton hands, dual heraldic shield bridge caliber architecture at 12 and 6 o''clock framing a 4-point arrow openwork caliber with exposed rubies, floating red-accent inner track, titanium spline screws on polished flanks, and a pristine arctic white fluororubber racing strap.',
    '/watch-forged-carbon-ribbed-shield-white-front-transparent.webp',
    '/watch-forged-carbon-ribbed-shield-white-front-transparent.webp',
    '["/watch-forged-carbon-ribbed-shield-white-front-transparent.webp","/watch-forged-carbon-ribbed-shield-white-studio.webp","/watch-forged-carbon-ribbed-shield-white-ferrari.webp","/watch-forged-carbon-ribbed-shield-white-mesh.webp","/watch-forged-carbon-ribbed-shield-white-lamborghini.webp"]'::jsonb,
    '[{"url":"/watch-forged-carbon-ribbed-shield-white-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical arctic white ceramic tonneau case with horizontal ribbed hoods, cobalt blue hands, and white fluororubber strap."},{"url":"/watch-forged-carbon-ribbed-shield-white-studio.webp","title":"Dark Horizon Studio View","label":"02 Dark Studio","caption":"High-contrast front perspective against dark moody backdrop highlighting the pristine white ceramic and cobalt hands."},{"url":"/watch-forged-carbon-ribbed-shield-white-ferrari.webp","title":"Ferrari Supercar Cockpit Setting","label":"03 Ferrari Console","caption":"Automotive composition on red Ferrari interior console highlighting the crisp polar ceramic contrast."},{"url":"/watch-forged-carbon-ribbed-shield-white-mesh.webp","title":"Cybertech Radiator Mesh Studio","label":"04 Radiator Mesh","caption":"Detailed macro perspective on red honeycomb radiator mesh showcasing the 4-point arrow skeleton framework."},{"url":"/watch-forged-carbon-ribbed-shield-white-lamborghini.webp","title":"Lamborghini Supercar Display","label":"05 Supercar Display","caption":"High-octane tabletop composition with miniature Lamborghini supercar exhibiting motorsport pedigree."}]'::jsonb,
    '{"movement":"Caliber H-7730 Shield Openwork Radial Skeleton Automatic Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"24 Synthetic Rubies & Heat-Treated Screws","caseMaterial":"High-Tech Engineered Arctic White Ceramic with Ribbed Hoods & Titanium Spline Screws","caseDimensions":"44.0 mm × 51.5 mm Tonneau × 14.2 mm","lugToLug":"51.5 mm","glass":"Curved 3D Tonneau Scratch-Proof Sapphire Crystal with Anti-Reflective Coating","caseback":"Exhibition Sapphire Crystal Back with Supercar Brake Caliper Rotor","dial":"Dual Heraldic Shield Skeleton Architecture with 4-Point Arrow Radial Framework & Cobalt Blue Hands","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Density Arctic White Anti-Dust Fluororubber Racing Strap","clasp":"Solid 316L Black DLC Stainless Steel Engraved Tang Buckle","complications":["Pure Arctic White Engineered Ceramic Tonneau Case","Electric Anodized Cobalt Blue Skeleton Hands","Horizontal Ribbed Aerodynamic Carbon Hoods","Dual Heraldic Shield Caliber Architecture at 12 & 6 o''clock","4-Point Arrow Openwork Radial Framework with Exposed Rubies"],"packaging":"Matte White Presentation Case & NFC Warranty Passport"}'::jsonb,
    12,
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
    'forged-carbon-ribbed-shield-white',
    'HBR-7712-WH',
    'Forged Carbon Ribbed Shield Tonneau Skeleton Arctic White',
    'Tonneau Skeleton',
    12,
    98000,
    1180,
    '/watch-forged-carbon-ribbed-shield-white-front-transparent.webp',
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

-- 66. Twin-Turbine Double Balance Cantilever Tonneau Rose Gold (HBR-9908-DB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'double-balance-cantilever-rosegold',
    'HBR-9908-DB',
    'Twin-Turbine Double Balance Cantilever Tonneau Rose Gold',
    'Synchronized Dual Balance Wheels • Cantilever Crown Bridge Lock • 3D Stencil Numerals • 18K Rose Gold',
    'TONNEAU',
    'Tonneau Skeleton',
    'Dual Balance Complication',
    '₹1,08,000',
    '$1,300',
    'In Stock',
    '2026',
    'A masterclass in twin-regulating horology and industrial cantilever engineering. Houses synchronized twin-turbine balance wheels at 5 and 7 o''clock with heat-blued screws and exposed gold wheels, creating mesmerizing harmonic resonance. The trapezoidal tonneau case in 18K rose gold features a patented cantilever crown guard locking bridge at 3 o''clock, multi-layered openworked skeleton gear trains, crimson-outlined stencil Arabic numerals, and a chevron-molded high-grip fluororubber strap.',
    '/watch-double-balance-cantilever-rosegold-front-transparent.webp',
    '/watch-double-balance-cantilever-rosegold-front-transparent.webp',
    '["/watch-double-balance-cantilever-rosegold-front-transparent.webp","/watch-double-balance-cantilever-rosegold-car.webp","/watch-double-balance-cantilever-rosegold-cockpit.webp","/watch-double-balance-cantilever-rosegold-steering.webp"]'::jsonb,
    '[{"url":"/watch-double-balance-cantilever-rosegold-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 18K rose gold tonneau case with dual balance wheels, crimson stencil numerals, and cantilever crown lock."},{"url":"/watch-double-balance-cantilever-rosegold-car.webp","title":"Porsche Supercar Key Sartorial Presence","label":"02 Porsche Key","caption":"On-wrist automotive composition holding supercar key beside black Porsche sports car."},{"url":"/watch-double-balance-cantilever-rosegold-cockpit.webp","title":"Sports Cockpit Lateral Ergonomics","label":"03 Cockpit Ergonomics","caption":"Cockpit on-wrist perspective highlighting the cantilever crown lock mechanism and curved sapphire crystal."},{"url":"/watch-double-balance-cantilever-rosegold-steering.webp","title":"Driver''s Cockpit Steering Perspective","label":"04 Steering Presence","caption":"Dynamic driving perspective behind steering wheel showcasing the exposed pulsing twin balance wheels."}]'::jsonb,
    '{"movement":"Caliber H-9908 Synchronized Twin-Turbine Double Balance Wheel Automatic Caliber","frequency":"Dual 28,800 VPH (4.0 Hz × 2) Harmonic Resonance","powerReserve":"50 Hours","jewels":"35 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD & Satin-Brushed Bevels","caseDimensions":"44.0 mm × 52.5 mm Trapezoidal Tonneau × 14.5 mm","lugToLug":"52.5 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Twin-Turbine Rotor","dial":"Multi-Layer Openwork Skeleton with Exposed Dual Balance Wheels & Crimson Stencil Numerals","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Fluororubber with Chevron Tire-Tread Relief","clasp":"Solid 316L Stainless Steel 18K Rose Gold PVD Engraved Tang Buckle","complications":["Synchronized Dual Balance Wheel Assembly at 5 & 7 o''clock","Cantilever Crown Guard Locking Bridge Mechanism at 3 o''clock","Openworked Barrel & Multi-Tier Skeleton Bridges","Crimson-Outlined Dimensional Stencil Arabic Numerals","Luminous Skeleton Arrow Hands & Red Central Seconds"],"packaging":"Matte Black Automotive Vault Case with Laser-Cut Steel Insignia & NFC Passport"}'::jsonb,
    11,
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
    'double-balance-cantilever-rosegold',
    'HBR-9908-DB',
    'Twin-Turbine Double Balance Cantilever Tonneau Rose Gold',
    'Tonneau Skeleton',
    11,
    108000,
    1300,
    '/watch-double-balance-cantilever-rosegold-front-transparent.webp',
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

-- 67. Twin-Turbine Double Balance Cantilever Tonneau Cyber Yellow (HBR-9908-YS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'double-balance-cantilever-yellow',
    'HBR-9908-YS',
    'Twin-Turbine Double Balance Cantilever Tonneau Cyber Yellow',
    'Synchronized Dual Balance Wheels • Cantilever Crown Bridge Lock • Electric Cyber Yellow Flange • 316L Steel',
    'TONNEAU',
    'Tonneau Skeleton',
    'Dual Balance Complication',
    '₹1,05,000',
    '$1,265',
    'In Stock',
    '2026',
    'High-octane motorsport aesthetic with twin-regulating precision. Features dual synchronized balance wheels oscillating in tandem at 5 and 7 o''clock with heat-blued screws and exposed gold wheels. Housed in a hand-finished 316L surgical stainless steel trapezoidal tonneau case with an electric cyber-yellow racing flange, yellow central seconds, patented cantilever crown guard locking bridge at 3 o''clock, and a chevron tire-tread fluororubber strap.',
    '/watch-double-balance-cantilever-yellow-front-transparent.webp',
    '/watch-double-balance-cantilever-yellow-front-transparent.webp',
    '["/watch-double-balance-cantilever-yellow-front-transparent.webp","/watch-double-balance-cantilever-yellow-macro.webp","/watch-double-balance-cantilever-yellow-steering.webp","/watch-double-balance-cantilever-yellow-cockpit.webp","/watch-double-balance-cantilever-yellow-car.webp"]'::jsonb,
    '[{"url":"/watch-double-balance-cantilever-yellow-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel tonneau case with dual balance wheels, electric cyber yellow racing flange, and cantilever crown lock."},{"url":"/watch-double-balance-cantilever-yellow-macro.webp","title":"Sartorial Fabric Macro Inspection","label":"02 Fabric Macro","caption":"Close-up macro perspective on textured black fabric showcasing the hand-finished brushed bevels and dual balance assembly."},{"url":"/watch-double-balance-cantilever-yellow-steering.webp","title":"Porsche Steering Wheel Driver''s Perspective","label":"03 Steering Presence","caption":"Dynamic driver''s cockpit view behind the steering wheel highlighting the high-contrast yellow racing accents."},{"url":"/watch-double-balance-cantilever-yellow-cockpit.webp","title":"Sports Cockpit Lateral Ergonomics","label":"04 Cockpit Ergonomics","caption":"Cockpit on-wrist capture displaying the cantilever crown locking bridge and curved sapphire glass."},{"url":"/watch-double-balance-cantilever-yellow-car.webp","title":"Porsche Supercar Key Sartorial Presence","label":"05 Porsche Key","caption":"Automotive on-wrist composition holding key beside black Porsche sports car."}]'::jsonb,
    '{"movement":"Caliber H-9908 Synchronized Twin-Turbine Double Balance Wheel Automatic Caliber","frequency":"Dual 28,800 VPH (4.0 Hz × 2) Harmonic Resonance","powerReserve":"50 Hours","jewels":"35 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44.0 mm × 52.5 mm Trapezoidal Tonneau × 14.5 mm","lugToLug":"52.5 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Twin-Turbine Rotor","dial":"Multi-Layer Openwork Skeleton with Exposed Dual Balance Wheels & Cyber Yellow Stencil Flange","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Fluororubber with Chevron Tire-Tread Relief","clasp":"Solid 316L Stainless Steel Engraved Tang Buckle","complications":["Synchronized Dual Balance Wheel Assembly at 5 & 7 o''clock","Cantilever Crown Guard Locking Bridge Mechanism at 3 o''clock","Electric Cyber-Yellow Inner Tachymetric Racing Flange","Openworked Barrel & Multi-Tier Skeleton Bridges","Cyber-Yellow Outlined Dimensional Stencil Numerals & Seconds Hand"],"packaging":"Matte Black Automotive Vault Case with Laser-Cut Steel Insignia & NFC Passport"}'::jsonb,
    10,
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
    'double-balance-cantilever-yellow',
    'HBR-9908-YS',
    'Twin-Turbine Double Balance Cantilever Tonneau Cyber Yellow',
    'Tonneau Skeleton',
    10,
    105000,
    1265,
    '/watch-double-balance-cantilever-yellow-front-transparent.webp',
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

-- 68. Twin-Turbine Double Balance Cantilever Tonneau Crimson Red (HBR-9908-RS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'double-balance-cantilever-red',
    'HBR-9908-RS',
    'Twin-Turbine Double Balance Cantilever Tonneau Crimson Red',
    'Synchronized Dual Balance Wheels • Cantilever Crown Bridge Lock • Crimson Red Flange • 316L Steel',
    'TONNEAU',
    'Tonneau Skeleton',
    'Dual Balance Complication',
    '₹1,05,000',
    '$1,265',
    'In Stock',
    '2026',
    'Ferrari racing red soul paired with dual-regulating horological mastery. Features synchronized twin-turbine balance wheels oscillating in tandem at 5 and 7 o''clock with heat-blued screws and exposed gold wheels. Housed in a hand-finished 316L surgical stainless steel trapezoidal tonneau case with a vivid crimson red racing flange, red central seconds, patented cantilever crown guard locking bridge at 3 o''clock, and a chevron tire-tread fluororubber strap.',
    '/watch-double-balance-cantilever-red-front-transparent.webp',
    '/watch-double-balance-cantilever-red-front-transparent.webp',
    '["/watch-double-balance-cantilever-red-front-transparent.webp","/watch-double-balance-cantilever-red-ferrari.webp","/watch-double-balance-cantilever-red-cockpit.webp"]'::jsonb,
    '[{"url":"/watch-double-balance-cantilever-red-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel tonneau case with dual balance wheels, crimson red racing flange, and cantilever crown lock."},{"url":"/watch-double-balance-cantilever-red-ferrari.webp","title":"Ferrari Rosso Corsa Automotive Presence","label":"02 Ferrari Console","caption":"Automotive composition resting on red Ferrari interior console highlighting the racing spirit."},{"url":"/watch-double-balance-cantilever-red-cockpit.webp","title":"Sports Cockpit Driver''s Perspective","label":"03 Cockpit Perspective","caption":"Cockpit on-wrist perspective behind the steering wheel showcasing the exposed dual balance wheels and crimson accents."}]'::jsonb,
    '{"movement":"Caliber H-9908 Synchronized Twin-Turbine Double Balance Wheel Automatic Caliber","frequency":"Dual 28,800 VPH (4.0 Hz × 2) Harmonic Resonance","powerReserve":"50 Hours","jewels":"35 Synthetic Rubies & Heat-Blued Screws","caseMaterial":"Solid 316L Surgical Stainless Steel with Satin-Brushed & Mirror-Polished Planes","caseDimensions":"44.0 mm × 52.5 mm Trapezoidal Tonneau × 14.5 mm","lugToLug":"52.5 mm","glass":"Curved 3D Tonneau Anti-Reflective Scratch-Proof Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Twin-Turbine Rotor","dial":"Multi-Layer Openwork Skeleton with Exposed Dual Balance Wheels & Crimson Red Stencil Flange","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"High-Performance Vulcanized Black Fluororubber with Chevron Tire-Tread Relief","clasp":"Solid 316L Stainless Steel Engraved Tang Buckle","complications":["Synchronized Dual Balance Wheel Assembly at 5 & 7 o''clock","Cantilever Crown Guard Locking Bridge Mechanism at 3 o''clock","Crimson-Red Inner Tachymetric Racing Flange","Openworked Barrel & Multi-Tier Skeleton Bridges","Crimson-Red Outlined Dimensional Stencil Numerals & Seconds Hand"],"packaging":"Matte Black Automotive Vault Case with Laser-Cut Steel Insignia & NFC Passport"}'::jsonb,
    9,
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
    'double-balance-cantilever-red',
    'HBR-9908-RS',
    'Twin-Turbine Double Balance Cantilever Tonneau Crimson Red',
    'Tonneau Skeleton',
    9,
    105000,
    1265,
    '/watch-double-balance-cantilever-red-front-transparent.webp',
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

-- 69. Clover King Crimson Tonneau (HBR-7701-CK)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'clover-king-crimson',
    'HBR-7701-CK',
    'Clover King Crimson Tonneau',
    'Dual-Chroma Day/Night Super-LumiNova Skeleton with Signal Red Chassis',
    'TONNEAU',
    'Tonneau Skeleton',
    'Dual-Chroma Glow',
    '₹82,000',
    '$990',
    'In Stock',
    '2026',
    'The definitive hero timepiece of the Hanboro catalog, powered by the authentic Japanese CITIZEN 8N24 skeletonized mechanical movement (21 jewels, 21,600 vph, ~42h power reserve, hacking & hand-winding). Features an audacious signal-red tonneau profile that undergoes a dramatic metamorphosis when darkness falls, igniting vibrant bioluminescent phosphor dial tracks.',
    '/clover-king-day.png',
    '/clover-king-day.png',
    '["/clover-king-day.png","/clover-king-night-glow.png","/clover-king-night.png","/red-tonneau-day.png"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Japanese Citizen 8N24 Skeleton Automatic Movement (Hand-Winding & Hacking)","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"Approx. 42 Hours","jewels":"21 Jewels","caseMaterial":"Anodized Signal Red Aluminum & DLC Carbon-Forged Hybrid Structure","caseDimensions":"43.0 mm × 51.0 mm × 13.8 mm","lugToLug":"51.0 mm","glass":"Curved 3D Sapphire Crystal","caseback":"Exhibition Mineral Crystal with Customized Red Rotor","dial":"Day-to-Night Multi-Chroma Luminous Skeleton with Lucky Four-Leaf Hub","waterResistance":"50 Meters (5 ATM)","strap":"Dual-Tone Signal Red & Carbon Black Textured Rubber Strap","clasp":"Black DLC Tang Buckle","complications":["Day/Night Dual-Luminescence Metamorphosis","Stop-Second Hacking Function","Exposed Balance Spring","Skeletonized Hour Ring"],"packaging":"Collector''s Vault Presentation Box with UV Lume Torch"}'::jsonb,
    8,
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
    'clover-king-crimson',
    'HBR-7701-CK',
    'Clover King Crimson Tonneau',
    'Tonneau Skeleton',
    8,
    82000,
    990,
    '/clover-king-day.png',
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

-- 70. Imperial Dragon Tonneau Skeleton (HBR-9908-ID)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'imperial-dragon',
    'HBR-9908-ID',
    'Imperial Dragon Tonneau Skeleton',
    'Hand-Chiseled 3D Imperial Gold Dragon Entwined Around Movement Bridges',
    'TONNEAU',
    'Tonneau Skeleton',
    'Haute Métiers d''Art',
    '₹1,25,000',
    '$1,500',
    'Collector Piece',
    '2026',
    'A tour-de-force of artistic engraving and sculptural horology. A three-dimensional Imperial Dragon in micro-sculpted gold entwines gracefully across the openworked escapement and barrel bridges.',
    '/watch-carousel-dragon.webp',
    '/watch-carousel-dragon.webp',
    '["/watch-carousel-dragon.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-9900 Hand-Finished Sculpted Skeleton Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"50 Hours","jewels":"28 Jewels with Synthetic Ruby Dragon Eyes","caseMaterial":"Forged Carbon Composite with DLC Titanium Skeleton Core","caseDimensions":"44.0 mm × 53.0 mm × 14.5 mm","lugToLug":"53.0 mm","glass":"Anti-Reflective Arched Sapphire Crystal","caseback":"Exhibition Sapphire Caseback with Dragon Crest Seal","dial":"Hand-Carved 3D Dragon Relief in 18K Gold Finish with Flame Accents","waterResistance":"50 Meters (5 ATM)","strap":"Sculpted Matte Black Vulcanized Rubber with Dragon Scale Micro-Texture","clasp":"DLC Black Titanium Deployant Clasp","complications":["3D Sculpted Dragon Horological Art","Ruby Gem-Set Dial Accents","Exposed High-Beat Balance"],"packaging":"Custom Handcrafted Wood Presentation Shrine"}'::jsonb,
    7,
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
    'imperial-dragon',
    'HBR-9908-ID',
    'Imperial Dragon Tonneau Skeleton',
    'Tonneau Skeleton',
    7,
    125000,
    1500,
    '/watch-carousel-dragon.webp',
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

-- 71. Royal Octagonal Baguette Diamond Celestial (HBR-4408-RG)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'octagonal-diamond-celestial',
    'HBR-4408-RG',
    'Royal Octagonal Baguette Diamond Celestial',
    '18K Rose Gold • Baguette Bezel • Big Date Panorama • Dual-Moonphase Day Complication',
    'OCTAGONAL',
    'Royal Octagonal',
    'Haute Joaillerie & Grand Date',
    '₹94,000',
    '$1,130',
    'In Stock',
    '2026',
    'A masterwork of sculptural geometry and Haute Joaillerie finishing. Encased in satin-brushed 18K rose gold PVD steel with a bezel encrusted with 44 baguette-cut brilliant zirconias. The deep midnight blue fluted dial showcases a double-digit Big Date aperture at 12 o''clock, a dual-disc Moonphase and Day indicator at 7 o''clock, and an orbital 24-hour second time zone subdial at 4 o''clock, paired with a solid rose gold integrated bracelet.',
    '/watch-diamond-octagonal-front-transparent.webp',
    '/watch-diamond-octagonal-front-transparent.webp',
    '["/watch-diamond-octagonal-front-transparent.webp","/watch-diamond-octagonal-angle-transparent.webp","/watch-diamond-octagonal-wrist.webp","/watch-diamond-octagonal-lifestyle-dune.webp","/watch-diamond-octagonal-lifestyle-sunset.webp"]'::jsonb,
    '[{"url":"/watch-diamond-octagonal-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical horological architecture featuring the double-digit Big Date aperture at 12 o''clock and precision baguette-cut diamond bezel."},{"url":"/watch-diamond-octagonal-angle-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 3/4 Perspective","caption":"Multi-faceted octagonal casing, satin-brushed chamfers, and fluted crown bearing the engraved Hanboro emblem."},{"url":"/watch-diamond-octagonal-wrist.webp","title":"On-Wrist Sartorial Presence","label":"03 On-Wrist Collection","caption":"Bespoke wrist presence paired with tailored sartorial suiting, demonstrating the ergonomic multi-link bracelet drape."},{"url":"/watch-diamond-octagonal-lifestyle-dune.webp","title":"Dune Horizon & Obsidian Texture","label":"04 Dune Horizon","caption":"Dynamic warm ambient lighting catching the midnight cobalt blue fluted dial and diamond-set geometry."},{"url":"/watch-diamond-octagonal-lifestyle-sunset.webp","title":"Sunset Amber Flare Showcase","label":"05 Sunset Flare","caption":"Front-facing dramatic composition illuminated by warm golden hour radiance."}]'::jsonb,
    '{"movement":"Caliber H-4480 Big Date Multi-Complication In-House Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"28 Synthetic Rubies & Precision Ball Bearings","caseMaterial":"18K Rose Gold PVD 316L Surgical Stainless Steel with Satin-Brushed & Polished Chamfers","caseDimensions":"42.0 mm × 12.2 mm","lugToLug":"48.5 mm","glass":"Double-Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Screw-Down Exhibition Sapphire Back with 18K Rose Gold Rotor","dial":"Horizontal Fluted Teak Midnight Cobalt Blue with Faceted Luminous Rose Gold Hands & Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 18K Rose Gold PVD Integrated Multi-Link Steel Bracelet","clasp":"Dual-Security Butterfly Deployant Concealed Clasp","complications":["Twin-Disc Big Date Panorama at 12 o''clock","Integrated Day of the Week & Lunar Moonphase Disc at 7 o''clock","Orbital 24-Hour / Running Second Subdial at 4 o''clock","Haute Joaillerie Baguette Diamond-Set Bezel","Solid Integrated Rose Gold Ergonomic Bracelet"],"packaging":"Piano-Black Lacquered Wooden Presentation Vault with NFC Guarantee Card & Microfiber Cloth"}'::jsonb,
    6,
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
    'octagonal-diamond-celestial',
    'HBR-4408-RG',
    'Royal Octagonal Baguette Diamond Celestial',
    'Royal Octagonal',
    6,
    94000,
    1130,
    '/watch-diamond-octagonal-front-transparent.webp',
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

-- 72. Royal Octagonal Baguette Diamond Tobacco Bronze (HBR-4408-BR)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'octagonal-diamond-bronze',
    'HBR-4408-BR',
    'Royal Octagonal Baguette Diamond Tobacco Bronze',
    '18K Rose Gold • Baguette Bezel • Tobacco Bronze Fluted Dial • Big Date & Moonphase',
    'OCTAGONAL',
    'Royal Octagonal',
    'Haute Joaillerie & Grand Date',
    '₹94,000',
    '$1,130',
    'In Stock',
    '2026',
    'An opulent expression of geometric horology bathed in warm tones. Features an 18K rose gold PVD case with 44 precision baguette-cut zirconias framing a rich tobacco bronze and champagne horizontal fluted dial. Powered by the multi-complication automatic caliber with Big Date panorama at 12 o''clock, lunar moonphase and day subdial at 7 o''clock, and 24-hour wheel indicator at 4 o''clock on an integrated rose gold bracelet.',
    '/watch-diamond-octagonal-bronze-front-transparent.webp',
    '/watch-diamond-octagonal-bronze-front-transparent.webp',
    '["/watch-diamond-octagonal-bronze-front-transparent.webp","/watch-diamond-octagonal-bronze-angle-transparent.webp","/watch-diamond-octagonal-bronze-wrist.webp","/watch-diamond-octagonal-bronze-sunset.webp"]'::jsonb,
    '[{"url":"/watch-diamond-octagonal-bronze-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical rose gold casing and baguette-cut bezel showcasing the rich tobacco bronze fluted dial and double-digit Big Date aperture."},{"url":"/watch-diamond-octagonal-bronze-angle-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 3/4 Perspective","caption":"Sculpted octagonal geometry with vertical satin brushing, diamond-set chamfers, and Hanboro insignia fluted crown."},{"url":"/watch-diamond-octagonal-bronze-wrist.webp","title":"Sartorial On-Wrist Presence","label":"03 Sartorial On-Wrist","caption":"Striking wrist presence paired with dark sartorial styling, demonstrating the ergonomic rose gold bracelet contours."},{"url":"/watch-diamond-octagonal-bronze-sunset.webp","title":"Sunset Amber Flare Showcase","label":"04 Sunset Amber","caption":"Dramatic composition bathed in golden amber sunset radiance highlighting the champagne bronze dial nuances."}]'::jsonb,
    '{"movement":"Caliber H-4480 Big Date Multi-Complication In-House Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"28 Synthetic Rubies & Precision Ball Bearings","caseMaterial":"18K Rose Gold PVD 316L Surgical Stainless Steel with Satin-Brushed & Polished Chamfers","caseDimensions":"42.0 mm × 12.2 mm","lugToLug":"48.5 mm","glass":"Double-Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Screw-Down Exhibition Sapphire Back with 18K Rose Gold Rotor","dial":"Horizontal Fluted Teak Tobacco Bronze & Champagne with Faceted Luminous Rose Gold Hands & Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 18K Rose Gold PVD Integrated Multi-Link Steel Bracelet","clasp":"Dual-Security Butterfly Deployant Concealed Clasp","complications":["Twin-Disc Big Date Panorama at 12 o''clock","Integrated Day of the Week & Lunar Moonphase Disc at 7 o''clock","Orbital 24-Hour / Running Second Subdial at 4 o''clock","Haute Joaillerie Baguette Diamond-Set Bezel","Solid Integrated Rose Gold Ergonomic Bracelet"],"packaging":"Piano-Black Lacquered Wooden Presentation Vault with NFC Guarantee Card & Microfiber Cloth"}'::jsonb,
    5,
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
    'octagonal-diamond-bronze',
    'HBR-4408-BR',
    'Royal Octagonal Baguette Diamond Tobacco Bronze',
    'Royal Octagonal',
    5,
    94000,
    1130,
    '/watch-diamond-octagonal-bronze-front-transparent.webp',
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

-- 73. Royal Octagonal Baguette Diamond Emerald Forest (HBR-4408-EM)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'octagonal-diamond-emerald',
    'HBR-4408-EM',
    'Royal Octagonal Baguette Diamond Emerald Forest',
    '316L Stainless Steel • Baguette Bezel • Emerald Olive Fluted Dial • Big Date & Moonphase',
    'OCTAGONAL',
    'Royal Octagonal',
    'Haute Joaillerie & Grand Date',
    '₹92,000',
    '$1,110',
    'In Stock',
    '2026',
    'Cool-toned industrial sculpture meets organic richness. Encased in hand-finished 316L solid surgical stainless steel, the octagonal bezel is adorned with 44 precision baguette-cut zirconias framing a rich emerald olive horizontal fluted dial. Featuring a double-digit Big Date aperture at 12 o''clock, astronomical moonphase with day subdial at 7 o''clock, and running 24-hour wheel complication at 4 o''clock on a solid multi-link steel bracelet.',
    '/watch-diamond-octagonal-green-front-transparent.webp',
    '/watch-diamond-octagonal-green-front-transparent.webp',
    '["/watch-diamond-octagonal-green-front-transparent.webp","/watch-diamond-octagonal-green-angle-transparent.webp","/watch-diamond-octagonal-green-wrist.webp","/watch-diamond-octagonal-green-sunset.webp"]'::jsonb,
    '[{"url":"/watch-diamond-octagonal-green-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel architecture highlighting the deep emerald olive fluted dial, Big Date aperture at 12 o''clock, and baguette diamond bezel."},{"url":"/watch-diamond-octagonal-green-angle-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 3/4 Perspective","caption":"Precision-machined steel octagonal bevels, satin-brushed link articulation, and fluted winding crown."},{"url":"/watch-diamond-octagonal-green-wrist.webp","title":"Sartorial On-Wrist Presence","label":"03 Sartorial On-Wrist","caption":"Ergonomic wrist drape and high-contrast diamond luminescence paired with clean dark sartorial attire."},{"url":"/watch-diamond-octagonal-green-sunset.webp","title":"Sunset Amber Flare Showcase","label":"04 Sunset Amber","caption":"Dramatic front composition bathed in warm golden sunset light reflecting off the baguette diamonds and emerald green dial."}]'::jsonb,
    '{"movement":"Caliber H-4480 Big Date Multi-Complication In-House Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"28 Synthetic Rubies & Precision Ball Bearings","caseMaterial":"Grade 316L Solid Surgical Stainless Steel with Satin-Brushed & Polished Chamfers","caseDimensions":"42.0 mm × 12.2 mm","lugToLug":"48.5 mm","glass":"Double-Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Screw-Down Exhibition Sapphire Back with Rhodium-Plated Rotor","dial":"Horizontal Fluted Teak Emerald Olive Green with Faceted Luminous Silver Hands & Markers","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Surgical Stainless Steel Integrated Multi-Link Bracelet","clasp":"Dual-Security Butterfly Deployant Concealed Clasp","complications":["Twin-Disc Big Date Panorama at 12 o''clock","Integrated Day of the Week & Lunar Moonphase Disc at 7 o''clock","Orbital 24-Hour / Running Second Subdial at 4 o''clock","Haute Joaillerie Baguette Diamond-Set Bezel","Solid Integrated 316L Steel Ergonomic Bracelet"],"packaging":"Piano-Black Lacquered Wooden Presentation Vault with NFC Guarantee Card & Microfiber Cloth"}'::jsonb,
    12,
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
    'octagonal-diamond-emerald',
    'HBR-4408-EM',
    'Royal Octagonal Baguette Diamond Emerald Forest',
    'Royal Octagonal',
    12,
    92000,
    1110,
    '/watch-diamond-octagonal-green-front-transparent.webp',
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

-- 74. Rose Gold Octagonal Blue Guilloché (HBR-4401-RO)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'octagonal-blue',
    'HBR-4401-RO',
    'Rose Gold Octagonal Blue Guilloché',
    'Integrated Luxury Sports Watch with Deep Clous de Paris Tapisserie Dial',
    'OCTAGONAL',
    'Royal Octagonal',
    'Integrated Luxury Sport',
    '₹68,000',
    '$820',
    'In Stock',
    '2026',
    'The definitive integrated sports silhouette. An octagonal satin-brushed bezel punctuated by 8 polished hexagonal screws meets a deeply textured cobalt blue guilloché dial and integrated ergonomic strap.',
    '/watch-rosegold-octagonal-blue.webp',
    '/watch-rosegold-octagonal-blue.webp',
    '["/watch-rosegold-octagonal-blue.webp","/watch-carousel-octagonal.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-4400 Ultra-Slim Self-Winding Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"44 Hours","jewels":"24 Jewels","caseMaterial":"Rose Gold PVD 316L Solid Stainless Steel with Vertical Satin Brushing","caseDimensions":"41.0 mm × 11.2 mm Ultra-Slim","lugToLug":"48.0 mm","glass":"Flat Anti-Reflective Sapphire Crystal","caseback":"Screw-Down Exhibition Sapphire Back with Rose Gold Rotor","dial":"Deep Imperial Cobalt Blue ''Clous de Paris'' Tapisserie Guilloché","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Integrated Textured Rubber Strap with Rose Gold Quick-Release Pins","clasp":"Rose Gold Butterfly Deployant Buckle","complications":["Instant-Jump Date at 3 o''clock","Luminous Rose Gold Baton Hands","100m Water Resistance"],"packaging":"Handcrafted Suede Watch Roll & Presentation Box"}'::jsonb,
    11,
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
    'octagonal-blue',
    'HBR-4401-RO',
    'Rose Gold Octagonal Blue Guilloché',
    'Royal Octagonal',
    11,
    68000,
    820,
    '/watch-rosegold-octagonal-blue.webp',
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

-- 75. Royal Octagonal Skeleton Steel (HBR-4405-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'octagonal-skeleton-steel',
    'HBR-4405-SS',
    'Royal Octagonal Skeleton Steel',
    'Architectural Openwork Bridge Geometry in Satin-Brushed 316L Steel',
    'OCTAGONAL',
    'Royal Octagonal',
    'Architectural Openwork',
    '₹72,000',
    '$865',
    'In Stock',
    '2026',
    'Monochrome industrial perfection. Features an all-steel octagonal architecture housing a high-precision anthracite openworked movement with diamond-cut chamfers and symmetrical balance alignment.',
    '/watch-carousel-octagonal.webp',
    '/watch-carousel-octagonal.webp',
    '["/watch-carousel-octagonal.webp","/watch-rosegold-octagonal-blue.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-4450 Symmetrical Openworked In-House Automatic","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"48 Hours","jewels":"26 Jewels","caseMaterial":"Grade 316L Solid Stainless Steel with Hand-Polished Bevels","caseDimensions":"41.0 mm × 11.5 mm","lugToLug":"48.0 mm","glass":"Scratch-Proof Flat Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back","dial":"Anthracite NAC-Coated Skeleton Caliber with High-Contrast White Hands","waterResistance":"100 Meters (10 ATM)","strap":"Solid 316L Steel Integrated Link Bracelet + Quick-Swap Black Rubber","clasp":"Double Push-Button Milled Safety Clasp","complications":["Full Openwork Movement","Screw-Down Crown","10 ATM Water Resistance"],"packaging":"Steel Presentation Case with Strap-Changing Tool"}'::jsonb,
    10,
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
    'octagonal-skeleton-steel',
    'HBR-4405-SS',
    'Royal Octagonal Skeleton Steel',
    'Royal Octagonal',
    10,
    72000,
    865,
    '/watch-carousel-octagonal.webp',
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

-- 76. Silver Moonphase Orbital Automatic (HBR-5502-MO)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'orbital-moonphase',
    'HBR-5502-MO',
    'Silver Moonphase Orbital Automatic',
    'Astronomical 29.5-Day Precision Lunar Complication with Star-Dust Sunburst Dial',
    'CLASSIC',
    'Classic & Moonphase',
    'Astronomical Lunar',
    '₹62,000',
    '$745',
    'In Stock',
    '2026',
    'Poetry on the wrist. A stepped polished steel case cradles a shimmering star-dust silver sunburst dial, featuring a vivid midnight blue lunar disc tracking the 29.5-day astronomical moon cycle.',
    '/watch-orbital-moonphase.webp',
    '/watch-orbital-moonphase.webp',
    '["/watch-orbital-moonphase.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-5500 Orbital Moonphase Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"42 Hours","jewels":"25 Jewels","caseMaterial":"Mirror-Polished 316L Stainless Steel with Stepped Bezel","caseDimensions":"42.0 mm × 12.0 mm","lugToLug":"49.0 mm","glass":"Domed Anti-Reflective Sapphire Crystal","caseback":"Exhibition Sapphire Crystal Back with Constellation Engraving","dial":"Silver Sunburst Dial with Blued Steel Hands & Gold Star-Dust Accents","waterResistance":"50 Meters (5 ATM)","strap":"Genuine Black Alligator-Embossed Calfskin Leather Strap","clasp":"Engraved Steel Tang Buckle","complications":["Astronomical 29.5-Day Moonphase Disc","Pointer Date Indicator","Thermally Blued Steel Hands"],"packaging":"Heritage Leather Watch Box"}'::jsonb,
    9,
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
    'orbital-moonphase',
    'HBR-5502-MO',
    'Silver Moonphase Orbital Automatic',
    'Classic & Moonphase',
    9,
    62000,
    745,
    '/watch-orbital-moonphase.webp',
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

-- 77. Aurora Celestial Frost Automatic (HBR-5508-AC)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'aurora-celestial-frost',
    'HBR-5508-AC',
    'Aurora Celestial Frost Automatic',
    'Northern Lights 24H Orbital Disc • Stardust Silver Frost Dial • Pave Crystal Halo',
    'DIVER_SPORT',
    'Diver & Sport Chrono',
    'Orbital Aurora Complication',
    '₹78,000',
    '$940',
    'In Stock',
    '2026',
    'Inspired by the celestial brilliance of the polar aurora. Housed in a 43mm satin-brushed 316L stainless steel case with signature bezel screws and crown guards. The dial features a crystalline stardust silver texture encircled by a pave diamond halo and cobalt blue minute track, displaying an astronomical 24-hour rotating Northern Lights Earth disc at 9 o''clock and a quick-set date window at 3 o''clock, mounted on a vulcanized fluororubber sport strap.',
    '/watch-aurora-celestial-frost-front-transparent.webp',
    '/watch-aurora-celestial-frost-front-transparent.webp',
    '["/watch-aurora-celestial-frost-front-transparent.webp","/watch-aurora-celestial-frost-space.webp","/watch-aurora-celestial-frost-aurora.webp","/watch-aurora-celestial-frost-wrist-macro.webp","/watch-aurora-celestial-frost-wrist-denim.webp"]'::jsonb,
    '[{"url":"/watch-aurora-celestial-frost-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L stainless steel architecture featuring the 6-screw bezel, stardust silver frost dial, pave diamond halo, and 24H Aurora sphere."},{"url":"/watch-aurora-celestial-frost-space.webp","title":"Cosmic Aurora & Obsidian Terrain","label":"02 Cosmic Perspective","caption":"Three-quarter isometric composition framed against deep space starlight and cosmic aurora clouds."},{"url":"/watch-aurora-celestial-frost-aurora.webp","title":"Northern Lights Horizon Glow","label":"03 Polar Aurora","caption":"Front-facing showcase illuminated by the vibrant emerald glow of polar aurora borealis."},{"url":"/watch-aurora-celestial-frost-wrist-macro.webp","title":"Celestial Night Sky Macro Inspection","label":"04 Macro On-Wrist","caption":"Close-up on-wrist tactile handling capturing the crystalline dial texture and diamond halo luminescence."},{"url":"/watch-aurora-celestial-frost-wrist-denim.webp","title":"Sartorial Denim Lifestyle Presence","label":"05 Sartorial Denim","caption":"Effortless luxury sport styling with tailored denim, highlighting ergonomic fluororubber strap drape."}]'::jsonb,
    '{"movement":"Caliber H-5580 Dual-Time Celestial Aurora Automatic Movement","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"45 Hours","jewels":"25 Synthetic Rubies","caseMaterial":"316L Marine-Grade Stainless Steel with Vertical Satin Brushing & Mirror Chamfers","caseDimensions":"43.0 mm × 13.0 mm","lugToLug":"49.5 mm","glass":"Scratch-Proof Domed Sapphire Crystal with Anti-Reflective Internal Coating","caseback":"Exhibition Sapphire Crystal Back with Decorated Wind Rose Rotor","dial":"Glacial Stardust Silver Granulated Texture with Pave Crystal Halo & Cobalt Chapter Ring","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"High-Performance Ribbed Black Fluororubber Strap with Quick-Release Integration","clasp":"Solid Milled 316L Steel Tang Buckle with Hanboro Engraving","complications":["24-Hour Rotating Celestial Aurora Earth Sphere at 9 o''clock","Pave Brilliant-Cut Crystal Inner Halo Ring","Instant-Jump Date Window at 3 o''clock","Luminous Super-LumiNova Arrow Hands & Red Marker","100M Water Resistance Rating"],"packaging":"Matte Black Vault Presentation Box with NFC Warranty Certificate & Traveler Pouch"}'::jsonb,
    8,
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
    'aurora-celestial-frost',
    'HBR-5508-AC',
    'Aurora Celestial Frost Automatic',
    'Diver & Sport Chrono',
    8,
    78000,
    940,
    '/watch-aurora-celestial-frost-front-transparent.webp',
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

-- 78. Purple Sunray Chronograph Diver (HBR-3302-PU)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'purple-chrono',
    'HBR-3302-PU',
    'Purple Sunray Chronograph Diver',
    'High-Contrast Precision Column-Wheel Diver with Radiant Purple Sunburst Dial',
    'DIVER_SPORT',
    'Diver & Sport Chrono',
    'Sport Chronograph',
    '₹58,000',
    '$700',
    'In Stock',
    '2026',
    'Bold, expressive, and engineered for high-performance timing. Features a radiant imperial purple sunray dial paired with a 120-click rotating bezel and high-beat precision chronograph subdials.',
    '/watch-purple-chronograph.webp',
    '/watch-purple-chronograph.webp',
    '["/watch-purple-chronograph.webp","/watch-green-diver.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-3300 Precision Sweep Chronograph Caliber","frequency":"High-Beat Smooth Sweep (32,768 Hz / Precision Column-Wheel Action)","powerReserve":"Long-life Energy Cell (3-Year Continuous Sweep)","jewels":"Multi-Jeweled Precision Chrono Module","caseMaterial":"Heavy-Duty 316L Marine Stainless Steel with Crown Protectors","caseDimensions":"43.0 mm × 12.8 mm","lugToLug":"50.5 mm","glass":"Flat Sapphire Crystal with Anti-Scratch Coating","caseback":"Screw-Down Steel Caseback with Embossed Diver Logo","dial":"Vibrant Purple Sunray Finish with High-Lume Tri-Compax Subdials","waterResistance":"100 Meters (10 ATM / 330 Feet)","strap":"Flexible Purple Silicone Strap with Steel Keeper Ring","clasp":"Heavy-Duty Brushed Steel Buckle","complications":["1/10th Second Split Chronograph","60-Minute Counter","120-Click Unidirectional Bezel","Screw-Down Pushers"],"packaging":"Waterproof Pelican-Style Dive Box"}'::jsonb,
    7,
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
    'purple-chrono',
    'HBR-3302-PU',
    'Purple Sunray Chronograph Diver',
    'Diver & Sport Chrono',
    7,
    58000,
    700,
    '/watch-purple-chronograph.webp',
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

-- 79. Emerald Green Submariner Diver 200M (HBR-3305-GD)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'green-diver',
    'HBR-3305-GD',
    'Emerald Green Submariner Diver 200M',
    'Professional 200M ISO Aquatic Timepiece with Ceramic Unidirectional Bezel',
    'DIVER_SPORT',
    'Diver & Sport Chrono',
    '200M Professional Diver',
    '₹64,000',
    '$770',
    'In Stock',
    '2026',
    'Built to conquer the depths. Boasts a certified 200-meter depth rating, a scratch-proof 120-click emerald green ceramic bezel, a magnified Cyclops date window, and a solid 3-link Oyster steel bracelet.',
    '/watch-green-diver.webp',
    '/watch-green-diver.webp',
    '["/watch-green-diver.webp","/watch-purple-chronograph.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-3350 High-Torque Automatic Diver Caliber","frequency":"28,800 VPH (4.0 Hz)","powerReserve":"42 Hours","jewels":"24 Jewels","caseMaterial":"Marine-Grade 316L Stainless Steel with Screw-Down Crown & O-Ring Gaskets","caseDimensions":"42.0 mm × 13.0 mm","lugToLug":"49.5 mm","glass":"Sapphire Crystal with 2.5x Cyclops Date Magnifier","caseback":"Solid Screw-Down Stainless Steel Deep-Dive Caseback","dial":"Deep Emerald Green Sunburst with Oversized Super-LumiNova Maxi Indices","waterResistance":"200 Meters (20 ATM / 660 Feet)","strap":"Solid 316L Brushed Steel Oyster Link Bracelet with Extension Glidelock","clasp":"Double-Locking Security Fold-Over Clasp","complications":["200M Water Resistance Rating","120-Click Emerald Ceramic Bezel","Screw-Down Locking Crown","Cyclops Date Window"],"packaging":"Airtight Waterproof Dive Vault with Extra Green Rubber Strap"}'::jsonb,
    6,
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
    'green-diver',
    'HBR-3305-GD',
    'Emerald Green Submariner Diver 200M',
    'Diver & Sport Chrono',
    6,
    64000,
    770,
    '/watch-green-diver.webp',
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

-- 80. Power Reserve 35h Automatic Midnight Steel (HBR-2201-PR)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'powerreserve-black',
    'HBR-2201-PR',
    'Power Reserve 35h Automatic Midnight Steel',
    'Bauhaus Minimalist Gauge • Stealth Black DLC • 35-Hour Energy Reserve • Date at 6H',
    'CLASSIC',
    'Classic & Moonphase',
    'Minimalist Mechanical Gauge',
    '₹56,000',
    '$675',
    'In Stock',
    '2026',
    'A pure triumph of German-inspired Bauhaus horological minimalism. Stripped of all non-essentials to showcase a graceful 35-hour linear energy reserve gauge at 12 o''clock, offset running seconds subdial, and circular date aperture at 6 o''clock. Encased in satin-brushed and polished black DLC 316L stainless steel with an integrated multi-row solid link bracelet.',
    '/watch-powerreserve-midnight-front-transparent.webp',
    '/watch-powerreserve-midnight-front-transparent.webp',
    '["/watch-powerreserve-midnight-front-transparent.webp","/watch-powerreserve-midnight-bronze.webp","/watch-powerreserve-midnight-dark.webp","/watch-powerreserve-midnight-wrist.webp"]'::jsonb,
    '[{"url":"/watch-powerreserve-midnight-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Pure monochromatic Bauhaus architecture with sunburst charcoal dial, 35-hour energy arc gauge, and circular date aperture at 6 o''clock."},{"url":"/watch-powerreserve-midnight-bronze.webp","title":"Three-Quarter Bronze Horizon Profile","label":"02 Bronze Horizon","caption":"Macro perspective showing the multi-row stealth black DLC link bracelet, ergonomic bevels, and offset crown guard."},{"url":"/watch-powerreserve-midnight-dark.webp","title":"Tactile Velvet Studio Macro","label":"03 Velvet Texture","caption":"Detailed inspection of the curved sapphire crystal, slender baton hands, and contrasting red reserve gauge needle tip."},{"url":"/watch-powerreserve-midnight-wrist.webp","title":"Sartorial Business On-Wrist Presence","label":"04 Sartorial On-Wrist","caption":"Sophisticated executive wrist presence paired with tailored shirt cuff and solid DLC steel bracelet drape."}]'::jsonb,
    '{"movement":"Caliber H-2200 In-House Automatic with Top-Mounted Power Gauge","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"35 Hours (Top-Mounted Gauge)","jewels":"22 Synthetic Rubies","caseMaterial":"316L Surgical Stainless Steel with Stealth Matte & Polished DLC Coating","caseDimensions":"42.0 mm × 11.8 mm Ultra-Slim","lugToLug":"48.5 mm","glass":"Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Smoked Mineral Exhibition Crystal Caseback with Laser Serialization","dial":"Sunburst Charcoal Midnight Black with Minimalist Silver Indices & Red Gauge Dots","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Black DLC Multi-Row Stainless Steel Link Bracelet","clasp":"Double Push-Button Butterfly Deployant Clasp","complications":["Linear 35-Hour Power Reserve Gauge at 12 o''clock","Small Running Seconds Subdial at 6 o''clock","Circular Instant-Jump Date Window at 6 o''clock","Minimalist Bauhaus Monochromatic Architecture"],"packaging":"Modern Minimalist Matte Black Presentation Box with NFC Authenticity Card"}'::jsonb,
    5,
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
    'powerreserve-black',
    'HBR-2201-PR',
    'Power Reserve 35h Automatic Midnight Steel',
    'Classic & Moonphase',
    5,
    56000,
    675,
    '/watch-powerreserve-midnight-front-transparent.webp',
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

-- 81. Power Reserve 35h Automatic Classic Silver (HBR-2201-SS)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'powerreserve-silver',
    'HBR-2201-SS',
    'Power Reserve 35h Automatic Classic Silver',
    'Bauhaus Minimalist Gauge • Solid 316L Mirror & Satin Steel • 35-Hour Reserve • Date at 6H',
    'CLASSIC',
    'Classic & Moonphase',
    'Minimalist Mechanical Gauge',
    '₹54,000',
    '$650',
    'In Stock',
    '2026',
    'Pure Bauhaus sophistication rendered in hand-finished surgical steel. Highlighting a linear 35-hour energy indicator gauge at 12 o''clock, offset running seconds subdial, and circular date aperture at 6 o''clock on a charcoal sunburst dial. Encased in mirror-polished and satin-brushed 316L solid stainless steel with a high-flex multi-row link bracelet.',
    '/watch-powerreserve-silver-front-transparent.webp',
    '/watch-powerreserve-silver-front-transparent.webp',
    '["/watch-powerreserve-silver-front-transparent.webp","/watch-powerreserve-silver-angle-transparent.webp","/watch-powerreserve-silver-studio.webp","/watch-powerreserve-silver-wrist.webp"]'::jsonb,
    '[{"url":"/watch-powerreserve-silver-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel case with sunburst charcoal dial, 35-hour energy arc gauge, and circular date aperture at 6 o''clock."},{"url":"/watch-powerreserve-silver-angle-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 3/4 Perspective","caption":"Macro perspective displaying the multi-row articulated link bracelet, mirror-polished bezel bevels, and offset crown guard."},{"url":"/watch-powerreserve-silver-studio.webp","title":"Architectural Studio Reflection","label":"03 Studio Reflection","caption":"Curated artistic presentation highlighting the interplay of ambient light across the steel case and dial crystal."},{"url":"/watch-powerreserve-silver-wrist.webp","title":"Sartorial Executive On-Wrist Presence","label":"04 Sartorial On-Wrist","caption":"Sophisticated executive wrist presence paired with tailored business suiting and crisp white dress shirt."}]'::jsonb,
    '{"movement":"Caliber H-2200 In-House Automatic with Top-Mounted Power Gauge","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"35 Hours (Top-Mounted Gauge)","jewels":"22 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Hand-Polished Bevels & Satin Chamfers","caseDimensions":"42.0 mm × 11.8 mm Ultra-Slim","lugToLug":"48.5 mm","glass":"Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Smoked Mineral Exhibition Crystal Caseback with Laser Serialization","dial":"Sunburst Charcoal Midnight Black with Minimalist Silver Indices & Red Gauge Dots","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Stainless Steel Multi-Row Articulated Link Bracelet","clasp":"Double Push-Button Butterfly Deployant Clasp","complications":["Linear 35-Hour Power Reserve Gauge at 12 o''clock","Small Running Seconds Subdial at 6 o''clock","Circular Instant-Jump Date Window at 6 o''clock","Minimalist Bauhaus Monochromatic Architecture"],"packaging":"Modern Minimalist Silver-Trim Presentation Box with NFC Authenticity Card"}'::jsonb,
    12,
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
    'powerreserve-silver',
    'HBR-2201-SS',
    'Power Reserve 35h Automatic Classic Silver',
    'Classic & Moonphase',
    12,
    54000,
    650,
    '/watch-powerreserve-silver-front-transparent.webp',
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

-- 82. Power Reserve 35h Automatic Opaline Silver (HBR-2201-WH)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'powerreserve-opaline',
    'HBR-2201-WH',
    'Power Reserve 35h Automatic Opaline Silver',
    'Bauhaus Minimalist Gauge • Thermally Blued Hands • Opaline Silver Dial • Date at 6H',
    'CLASSIC',
    'Classic & Moonphase',
    'Blued Steel Minimalist Gauge',
    '₹54,000',
    '$650',
    'In Stock',
    '2026',
    'A masterclass in purist German watchmaking aesthetics. Features a radiant opaline silver sunburst dial accented with thermally blued steel baton hands and power reserve needle. Highlights an architectural 35-hour linear energy gauge at 12 o''clock, offset running seconds subdial, and circular date aperture at 6 o''clock. Encased in hand-finished 316L solid surgical steel with an articulated multi-row link bracelet.',
    '/watch-powerreserve-opaline-front-transparent.webp',
    '/watch-powerreserve-opaline-front-transparent.webp',
    '["/watch-powerreserve-opaline-front-transparent.webp","/watch-powerreserve-opaline-angle-transparent.webp","/watch-powerreserve-opaline-bracelet-transparent.webp","/watch-powerreserve-opaline-profile-transparent.webp","/watch-powerreserve-opaline-studio.webp"]'::jsonb,
    '[{"url":"/watch-powerreserve-opaline-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical 316L steel case with radiant opaline silver dial, blued steel hands, 35-hour energy arc gauge, and circular date aperture at 6 o''clock."},{"url":"/watch-powerreserve-opaline-angle-transparent.webp","title":"Three-Quarter Isometric Profile","label":"02 3/4 Perspective","caption":"Macro perspective displaying the high-flex articulated link bracelet, mirror-polished bezel bevels, and offset crown guard."},{"url":"/watch-powerreserve-opaline-bracelet-transparent.webp","title":"Articulated Steel Link Integration","label":"03 Bracelet Detail","caption":"Bottom-up architectural capture exhibiting the multi-row link curvature, solid end-links, and seamless case integration."},{"url":"/watch-powerreserve-opaline-profile-transparent.webp","title":"Crown Guard & Curved Crystal Profile","label":"04 Profile Silhouette","caption":"Side silhouette highlighting the ultra-slim 11.8mm case depth, engraved ''H'' crown, and domed anti-reflective sapphire crystal."},{"url":"/watch-powerreserve-opaline-studio.webp","title":"Dark Studio Texture Macro","label":"05 Studio Plinth","caption":"High-contrast studio composition resting on textured stone, highlighting the vivid cobalt-blue reflections of the hands."}]'::jsonb,
    '{"movement":"Caliber H-2200 In-House Automatic with Top-Mounted Power Gauge","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"35 Hours (Top-Mounted Gauge)","jewels":"22 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with Mirror-Polished Bevels & Satin Chamfers","caseDimensions":"42.0 mm × 11.8 mm Ultra-Slim","lugToLug":"48.5 mm","glass":"Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Smoked Mineral Exhibition Crystal Caseback with Laser Serialization","dial":"Glacial Opaline Silver Sunburst with Thermally Blued Steel Hands & Red Gauge Indicator","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Solid 316L Stainless Steel Multi-Row Articulated Link Bracelet","clasp":"Double Push-Button Butterfly Deployant Clasp","complications":["Linear 35-Hour Power Reserve Gauge at 12 o''clock","Thermally Blued Steel Baton Hands & Indicator Needles","Small Running Seconds Subdial at 6 o''clock","Circular Instant-Jump Date Window at 6 o''clock","Minimalist Bauhaus Monochromatic Architecture"],"packaging":"Modern Minimalist Silver-Trim Presentation Box with NFC Authenticity Card"}'::jsonb,
    11,
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
    'powerreserve-opaline',
    'HBR-2201-WH',
    'Power Reserve 35h Automatic Opaline Silver',
    'Classic & Moonphase',
    11,
    54000,
    650,
    '/watch-powerreserve-opaline-front-transparent.webp',
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

-- 83. Power Reserve 35h Automatic Two-Tone Rose Gold (HBR-2201-TT)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'powerreserve-twotone',
    'HBR-2201-TT',
    'Power Reserve 35h Automatic Two-Tone Rose Gold',
    '18K Rose Gold Bezel • Two-Tone Steel Bracelet • Blued Steel Hands • 35H Energy Gauge',
    'CLASSIC',
    'Classic & Moonphase',
    'Two-Tone Rose Gold Bauhaus',
    '₹58,000',
    '$700',
    'In Stock',
    '2026',
    'The pinnacle of warm luxury and German minimalist horology. Features an 18K rose gold PVD polished bezel and matching two-tone articulated bracelet framing a glacial opaline silver sunburst dial. Thermally blued steel baton hands glide across the linear 35-hour energy reserve gauge at 12 o''clock, small seconds subdial, and circular date aperture at 6 o''clock.',
    '/watch-powerreserve-twotone-front-transparent.webp',
    '/watch-powerreserve-twotone-front-transparent.webp',
    '["/watch-powerreserve-twotone-front-transparent.webp","/watch-powerreserve-twotone-wrist.webp","/watch-powerreserve-twotone-dark.webp","/watch-powerreserve-twotone-bronze.webp"]'::jsonb,
    '[{"url":"/watch-powerreserve-twotone-front-transparent.webp","title":"Studio Front Profile","label":"01 Studio Front","caption":"Symmetrical two-tone 316L steel and rose gold case with radiant opaline silver dial, blued steel hands, and 35-hour energy arc gauge."},{"url":"/watch-powerreserve-twotone-wrist.webp","title":"Sartorial Cashmere On-Wrist Presence","label":"02 Sartorial Cashmere","caption":"Lifestyle wrist capture paired with luxury cream cashmere knitwear highlighting the warmth of the rose gold bezel."},{"url":"/watch-powerreserve-twotone-dark.webp","title":"Tactile Velvet Studio Macro","label":"03 Velvet Texture","caption":"High-contrast macro perspective capturing the polished rose gold bezel bevels and thermally blued steel hands."},{"url":"/watch-powerreserve-twotone-bronze.webp","title":"Three-Quarter Bronze Horizon Profile","label":"04 Bronze Horizon","caption":"Curated artistic composition against warm golden bronze light showing the two-tone bracelet curvature and crown guard."}]'::jsonb,
    '{"movement":"Caliber H-2200 In-House Automatic with Top-Mounted Power Gauge","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"35 Hours (Top-Mounted Gauge)","jewels":"22 Synthetic Rubies","caseMaterial":"Solid 316L Surgical Stainless Steel with 18K Rose Gold PVD Bezel & Crown Guard","caseDimensions":"42.0 mm × 11.8 mm Ultra-Slim","lugToLug":"48.5 mm","glass":"Domed Anti-Reflective Scratch-Resistant Sapphire Crystal (Mohs 9)","caseback":"Smoked Mineral Exhibition Crystal Caseback with Laser Serialization","dial":"Glacial Opaline Silver Sunburst with Thermally Blued Steel Hands & Red Gauge Indicator","waterResistance":"50 Meters (5 ATM / 165 Feet)","strap":"Two-Tone Solid 316L Steel & 18K Rose Gold PVD Multi-Row Articulated Link Bracelet","clasp":"Double Push-Button Butterfly Concealed Deployant Clasp","complications":["Linear 35-Hour Power Reserve Gauge at 12 o''clock","Thermally Blued Steel Baton Hands & Indicator Needles","Small Running Seconds Subdial at 6 o''clock","Circular Instant-Jump Date Window at 6 o''clock","18K Rose Gold Two-Tone Architecture"],"packaging":"Modern Minimalist Rose-Gold Trim Presentation Box with NFC Authenticity Card"}'::jsonb,
    10,
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
    'powerreserve-twotone',
    'HBR-2201-TT',
    'Power Reserve 35h Automatic Two-Tone Rose Gold',
    'Classic & Moonphase',
    10,
    58000,
    700,
    '/watch-powerreserve-twotone-front-transparent.webp',
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

-- 84. Turquoise Open-Heart Ring The Bell (HBR-1108-TB)
INSERT INTO public.products (
    id, sku, name, subtitle, collection, collection_name, tag,
    price, price_usd, availability, year, summary, image, transparent_image,
    alt_images, gallery, specs, stock, is_active
) VALUES (
    'turquoise-ringbell',
    'HBR-1108-TB',
    'Turquoise Open-Heart Ring The Bell',
    'Vibrant Tiffany Turquoise Dial with Visible Pulsing 9 O''Clock Balance Wheel',
    'CLASSIC',
    'Classic & Moonphase',
    'Vibrant Open-Heart',
    '₹48,000',
    '$580',
    'In Stock',
    '2026',
    'Youthful vibrancy meets mechanical heartbeat. The sunray Tiffany turquoise dial features an open aperture exposing the rapid oscillations of the ruby-jeweled balance wheel and hairspring.',
    '/watch-turquoise-ringbell.webp',
    '/watch-turquoise-ringbell.webp',
    '["/watch-turquoise-ringbell.webp"]'::jsonb,
    '[]'::jsonb,
    '{"movement":"Caliber H-1100 Open-Heart Automatic Movement","frequency":"21,600 VPH (3.0 Hz)","powerReserve":"40 Hours","jewels":"21 Jewels","caseMaterial":"High-Polish 316L Stainless Steel with Fluted Crown","caseDimensions":"41.0 mm × 11.5 mm","lugToLug":"47.5 mm","glass":"Scratch-Resistant Sapphire Crystal","caseback":"Transparent Exhibition Caseback","dial":"Radiant Turquoise Enamel with 9 o''clock Open-Heart Balance Window","waterResistance":"50 Meters (5 ATM)","strap":"Genuine Turquoise Stitched Leather Strap + Milanese Steel Mesh Included","clasp":"Push-Button Deployant Clasp","complications":["Visible Pulsing Heartbeat Aperture","Radial Silver Minute Ring","Quick-Swap Strap Mechanism"],"packaging":"Tiffany Turquoise Gift Presentation Box"}'::jsonb,
    9,
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
    'turquoise-ringbell',
    'HBR-1108-TB',
    'Turquoise Open-Heart Ring The Bell',
    'Classic & Moonphase',
    9,
    48000,
    580,
    '/watch-turquoise-ringbell.webp',
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
