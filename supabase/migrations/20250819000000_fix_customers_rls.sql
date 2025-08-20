-- Fix RLS policies for customers table to allow public read access

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Customers can view own data" ON customers;
DROP POLICY IF EXISTS "Customers can update own data" ON customers;
DROP POLICY IF EXISTS "Admin can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can manage all customers" ON customers;

-- 2. Create new policies
-- Allow public read access to customers table
CREATE POLICY "Public read access to customers"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to update their own data
CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.current_customer_id', true))::uuid);

-- Allow admins full access
CREATE POLICY "Admins can manage all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 3. Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
