-- Fix RLS policies for order_items table

-- Enable RLS if not already enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Allow public read access to order_items" ON public.order_items;
  DROP POLICY IF EXISTS "Allow authenticated users to create order_items" ON public.order_items;
  DROP POLICY IF EXISTS "Allow admin full access to order_items" ON public.order_items;
  
  -- Create read access policy
  CREATE POLICY "Allow public read access to order_items"
    ON public.order_items
    FOR SELECT
    USING (true);
    
  -- Create insert policy for authenticated users
  CREATE POLICY "Allow authenticated users to create order_items"
    ON public.order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    
  -- Full access for admins
  CREATE POLICY "Allow admin full access to order_items"
    ON public.order_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
    
  -- Allow all operations with service role (Supabase admin)
  GRANT ALL ON public.order_items TO service_role;
  
  -- Grant necessary permissions to authenticated users
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
  
  -- Grant sequence permissions if needed
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  
  -- Ensure the table owner is service_role
  ALTER TABLE public.order_items OWNER TO service_role;
  
  -- Log the changes
  RAISE NOTICE 'Updated order_items RLS policies and permissions';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error updating order_items policies: %', SQLERRM;
END $$;
