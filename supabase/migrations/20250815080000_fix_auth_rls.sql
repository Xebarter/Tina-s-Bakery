-- Fix authentication and RLS policies for admin access

-- 1. Ensure the auth.users table has the necessary RLS policies
DO $$
BEGIN
  -- Enable RLS on auth.users if not already enabled
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'auth' 
    AND tablename = 'users'
  ) THEN
    -- Allow users to view their own auth data
    CREATE POLICY "Users can view their own auth data"
      ON auth.users
      FOR SELECT
      USING (auth.uid() = id);
      
    -- Allow authenticated users to update their own auth data
    CREATE POLICY "Users can update their own auth data"
      ON auth.users
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- 2. Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'is_admin' = 'true'
  );
$$;

-- 3. Update the customers table to link with auth.users

-- First, make sure the user_id column can be NULL temporarily
ALTER TABLE customers ALTER COLUMN user_id DROP NOT NULL;

-- For existing customers without a matching auth user, we'll create auth users
-- First, create a function to handle this
CREATE OR REPLACE FUNCTION public.create_missing_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_record RECORD;
  new_user_id UUID;
  customer_email TEXT;
  temp_password TEXT := 'TempPassword123!'; -- This will need to be changed on first login
BEGIN
  FOR customer_record IN 
    SELECT id, email FROM customers 
    WHERE user_id IS NULL 
    OR user_id NOT IN (SELECT id FROM auth.users)
  LOOP
    -- Generate a unique email if the customer's email is already taken
    customer_email := customer_record.email;
    
    -- Check if email exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = customer_email) THEN
      customer_email := 'customer-' || customer_record.id || '@' || split_part(customer_record.email, '@', 2);
      IF customer_email = '@' THEN
        customer_email := 'customer-' || customer_record.id || '@example.com';
      END IF;
    END IF;
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id, 
      instance_id, 
      aud, 
      role, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      recovery_sent_at, 
      last_sign_in_at, 
      created_at, 
      updated_at, 
      confirmation_token, 
      email_change, 
      email_change_token_new, 
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      customer_email,
      crypt(temp_password, gen_salt('bf')), -- Encrypt the temporary password
      now(),
      now(),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;
    
    -- Update the customer record with the new user_id
    UPDATE customers 
    SET user_id = new_user_id
    WHERE id = customer_record.id;
    
    -- Log the created user (optional)
    RAISE NOTICE 'Created auth user % for customer %', new_user_id, customer_record.id;
  END LOOP;
  
  -- Now that all customers have valid user_ids, add the NOT NULL constraint
  ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
  
  -- Add the foreign key constraint
  EXECUTE 'ALTER TABLE customers
    ADD CONSTRAINT fk_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE';
    
  -- All auth users have been created, return success
  RETURN;
END;
$$;

-- Create a function to sync auth users to customers
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the corresponding customer record when an auth user is updated
  UPDATE public.customers
  SET 
    email = NEW.email,
    updated_at = now()
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger to keep customers in sync with auth users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_auth_user_to_customer();

-- Execute the function to create missing auth users
SELECT public.create_missing_auth_users();

-- Drop the temporary function
DROP FUNCTION IF EXISTS public.create_missing_auth_users();

-- 4. Create a trigger to automatically create a customer profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.customers (user_id, email, full_name, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', 2))
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 5. Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- 6. Create admin policy for products table
CREATE POLICY "Admins can manage all products"
  ON products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Create admin policy for customers table
CREATE POLICY "Admins can manage all customers"
  ON customers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Create admin policy for orders table
CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Create admin policy for order_items table
CREATE POLICY "Admins can manage all order items"
  ON order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. Create admin policy for cake_orders table
CREATE POLICY "Admins can manage all cake orders"
  ON cake_orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. Create admin policy for payment_transactions table
CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
