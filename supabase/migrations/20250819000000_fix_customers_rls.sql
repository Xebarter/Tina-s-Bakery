-- Fix RLS policies for customers table to allow public read access

-- 1. Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DO $$
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Public read access to customers" ON customers;
  DROP POLICY IF EXISTS "Customers can update own data" ON customers;
  DROP POLICY IF EXISTS "Admins can manage all customers" ON customers;
  
  -- Create public read access policy
  CREATE POLICY "Public read access to customers"
    ON customers
    FOR SELECT
    TO anon, authenticated
    USING (true);
    
  -- Create policy for customers to update their own data
  CREATE POLICY "Customers can update own data"
    ON customers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
    
  -- Create policy for admins to manage all customers
  CREATE POLICY "Admins can manage all customers"
    ON customers
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    ));
    
  -- Allow authenticated users to insert their own customer record
  CREATE POLICY "Customers can create their own record"
    ON customers
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
END
$$;
