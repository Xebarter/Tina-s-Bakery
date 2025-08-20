-- Fix RLS policies for order_items table

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can create order_items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order_items" ON order_items;

-- 2. Create new policies
-- Allow public read access (adjust if more restrictions are needed)
CREATE POLICY "Public read access to order_items"
  ON order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to create order_items
CREATE POLICY "Authenticated users can create order_items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins full access
CREATE POLICY "Admins can manage all order_items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. Enable RLS if not already enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
