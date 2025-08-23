-- Fix RLS policies for order_items table

-- 1. Enable RLS on order_items table if not already enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist
DO $$
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Public read access to order_items" ON order_items;
  DROP POLICY IF EXISTS "Authenticated users can create order_items" ON order_items;
  DROP POLICY IF EXISTS "Users can manage their own order items" ON order_items;
  DROP POLICY IF EXISTS "Admins can manage all order_items" ON order_items;
  
  -- Create public read access policy
  CREATE POLICY "Public read access to order_items"
    ON order_items
    FOR SELECT
    TO anon, authenticated
    USING (true);
    
  -- Create policy for authenticated users to create order items
  CREATE POLICY "Authenticated users can create order_items"
    ON order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    
  -- Create policy for users to manage their own order items
  CREATE POLICY "Users can manage their own order items"
    ON order_items
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM orders 
      JOIN customers ON orders.customer_id = customers.id
      WHERE orders.id = order_items.order_id 
      AND customers.user_id = auth.uid()
    ));
    
  -- Create policy for admins to manage all order items
  CREATE POLICY "Admins can manage all order_items"
    ON order_items
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    ));
END
$$;
