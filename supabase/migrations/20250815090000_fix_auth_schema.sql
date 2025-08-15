-- Create the customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  full_name text,
  first_name text,
  last_name text,
  phone text,
  address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customers_user_id_key UNIQUE (user_id)
);

-- Remove existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_schema = 'public' 
             AND table_name = 'customers' 
             AND constraint_name = 'fk_user_id') THEN
    ALTER TABLE public.customers DROP CONSTRAINT fk_user_id;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping foreign key: %', SQLERRM;
END;
$$;

-- Create or replace the function to handle new users
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
            NEW.raw_user_meta_data->>'name', 
            split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 
            split_part(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 
            split_part(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', 2))
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  );
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
CREATE POLICY "Users can view their own customer data"
  ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Users can update their own customer data" ON public.customers;
CREATE POLICY "Users can update their own customer data"
  ON public.customers
  FOR UPDATE
  USING (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Admins can manage all customer data" ON public.customers;
CREATE POLICY "Admins can manage all customer data"
  ON public.customers
  FOR ALL
  USING (public.is_admin());

-- Update existing customers with NULL user_ids to have a valid user_id
DO $$
DECLARE
  customer_record RECORD;
  new_user_id UUID;
BEGIN
  FOR customer_record IN 
    SELECT id, email FROM customers 
    WHERE user_id IS NULL 
    OR user_id NOT IN (SELECT id FROM auth.users)
  LOOP
    -- Insert a new auth user for this customer
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, 
      encrypted_password, email_confirmed_at, 
      recovery_sent_at, last_sign_in_at, 
      created_at, updated_at, 
      confirmation_token, email_change, 
      email_change_token_new, recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      customer_record.email,
      crypt('TempPassword123!', gen_salt('bf')),
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
    
    RAISE NOTICE 'Created auth user % for customer %', new_user_id, customer_record.id;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating auth users: %', SQLERRM;
END;
$$;

-- Add the foreign key constraint
ALTER TABLE public.customers 
  ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT fk_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
