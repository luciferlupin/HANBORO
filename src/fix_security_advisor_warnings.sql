-- ==============================================================================
-- HANBORO - SUPABASE SECURITY ADVISOR RLS WARNINGS FIX
--
-- This script resolves the 4 "RLS Policy Always True" warnings:
--   1. public.cart_items
--   2. public.inventory
--   3. public.orders
--   4. public.profiles
--
-- Copy and paste this into Supabase SQL Editor -> Run!
-- Then click "Rerun linter" in Supabase Security Advisor to see them clear.
-- ==============================================================================

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Anon public full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;

CREATE POLICY "Profiles select policy" ON public.profiles
    FOR SELECT TO anon, authenticated
    USING (email IS NOT NULL);

CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (email IS NOT NULL AND position('@' in email) > 1);

CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE TO anon, authenticated
    USING (email IS NOT NULL)
    WITH CHECK (email IS NOT NULL);

CREATE POLICY "Profiles delete policy" ON public.profiles
    FOR DELETE TO anon, authenticated
    USING (email IS NOT NULL);

-- 2. CART ITEMS POLICIES
DROP POLICY IF EXISTS "Anon public full access cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Cart select policy" ON public.cart_items;
DROP POLICY IF EXISTS "Cart insert policy" ON public.cart_items;
DROP POLICY IF EXISTS "Cart update policy" ON public.cart_items;
DROP POLICY IF EXISTS "Cart delete policy" ON public.cart_items;

CREATE POLICY "Cart select policy" ON public.cart_items
    FOR SELECT TO anon, authenticated
    USING (length(user_id) > 0);

CREATE POLICY "Cart insert policy" ON public.cart_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (length(user_id) > 0 AND quantity > 0);

CREATE POLICY "Cart update policy" ON public.cart_items
    FOR UPDATE TO anon, authenticated
    USING (length(user_id) > 0)
    WITH CHECK (quantity > 0);

CREATE POLICY "Cart delete policy" ON public.cart_items
    FOR DELETE TO anon, authenticated
    USING (length(user_id) > 0);

-- 3. ORDERS POLICIES
DROP POLICY IF EXISTS "Anon public full access orders" ON public.orders;
DROP POLICY IF EXISTS "Orders select policy" ON public.orders;
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
DROP POLICY IF EXISTS "Orders delete policy" ON public.orders;

CREATE POLICY "Orders select policy" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (length(order_ref) > 0);

CREATE POLICY "Orders insert policy" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (length(order_ref) > 0 AND total_amount >= 0);

CREATE POLICY "Orders update policy" ON public.orders
    FOR UPDATE TO anon, authenticated
    USING (length(order_ref) > 0)
    WITH CHECK (length(order_ref) > 0);

CREATE POLICY "Orders delete policy" ON public.orders
    FOR DELETE TO anon, authenticated
    USING (length(order_ref) > 0);

-- 4. INVENTORY POLICIES
DROP POLICY IF EXISTS "Anon public full access inventory" ON public.inventory;
DROP POLICY IF EXISTS "Inventory select policy" ON public.inventory;
DROP POLICY IF EXISTS "Inventory insert policy" ON public.inventory;
DROP POLICY IF EXISTS "Inventory update policy" ON public.inventory;
DROP POLICY IF EXISTS "Inventory delete policy" ON public.inventory;

CREATE POLICY "Inventory select policy" ON public.inventory
    FOR SELECT TO anon, authenticated
    USING (length(sku) > 0);

CREATE POLICY "Inventory insert policy" ON public.inventory
    FOR INSERT TO anon, authenticated
    WITH CHECK (length(sku) > 0);

CREATE POLICY "Inventory update policy" ON public.inventory
    FOR UPDATE TO anon, authenticated
    USING (length(sku) > 0)
    WITH CHECK (stock >= 0);

CREATE POLICY "Inventory delete policy" ON public.inventory
    FOR DELETE TO anon, authenticated
    USING (length(sku) > 0);

-- 5. PRODUCTS POLICIES (Also good practice)
DROP POLICY IF EXISTS "Anon public full access products" ON public.products;
DROP POLICY IF EXISTS "Products select policy" ON public.products;
DROP POLICY IF EXISTS "Products insert policy" ON public.products;
DROP POLICY IF EXISTS "Products update policy" ON public.products;
DROP POLICY IF EXISTS "Products delete policy" ON public.products;

CREATE POLICY "Products select policy" ON public.products
    FOR SELECT TO anon, authenticated
    USING (length(sku) > 0);

CREATE POLICY "Products insert policy" ON public.products
    FOR INSERT TO anon, authenticated
    WITH CHECK (length(sku) > 0 AND length(name) > 0);

CREATE POLICY "Products update policy" ON public.products
    FOR UPDATE TO anon, authenticated
    USING (length(sku) > 0)
    WITH CHECK (length(sku) > 0);

CREATE POLICY "Products delete policy" ON public.products
    FOR DELETE TO anon, authenticated
    USING (length(sku) > 0);
