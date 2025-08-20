-- Fix RLS policies for order_items table

DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Public read access to order_items') THEN
    DROP POLICY "Public read access to order_items" ON order_items;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Authenticated users can create order_items') THEN
    DROP POLICY "Authenticated users can create order_items" ON order_items;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can manage all order_items') THEN
    DROP POLICY "Admins can manage all order_items" ON order_items;
  END IF;

  -- Create new policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Public read access to order_items') THEN
    CREATE POLICY "Public read access to order_items"
      ON order_items
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Authenticated users can create order_items') THEN
    CREATE POLICY "Authenticated users can create order_items"
      ON order_items
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Admins can manage all order_items') THEN
    CREATE POLICY "Admins can manage all order_items"
      ON order_items
      FOR ALL
      TO authenticated
      USING (public.is_admin());
  END IF;
END
$$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'order_items' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;
