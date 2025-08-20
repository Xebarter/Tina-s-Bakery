-- Fix RLS policies for customers table to allow public read access

-- 1. Drop existing policies if they exist
DO $$
BEGIN
  -- Drop policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Customers can view own data') THEN
    DROP POLICY "Customers can view own data" ON customers;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Customers can update own data') THEN
    DROP POLICY "Customers can update own data" ON customers;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Admin can view all customers') THEN
    DROP POLICY "Admin can view all customers" ON customers;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Admins can manage all customers') THEN
    DROP POLICY "Admins can manage all customers" ON customers;
  END IF;

  -- Create new policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Public read access to customers') THEN
    CREATE POLICY "Public read access to customers"
      ON customers
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Customers can update own data') THEN
    CREATE POLICY "Customers can update own data"
      ON customers
      FOR UPDATE
      TO authenticated
      USING (id = (current_setting('app.current_customer_id', true))::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Admins can manage all customers') THEN
    CREATE POLICY "Admins can manage all customers"
      ON customers
      FOR ALL
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

-- 3. Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
