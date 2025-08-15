-- Revert broken auth changes

-- Drop functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.sync_auth_user_to_customer();

DROP FUNCTION IF EXISTS public.create_missing_auth_users();
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop RLS policies
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all cake orders" ON public.cake_orders;
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON public.customers;


-- Drop foreign key and NOT NULL constraint
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS fk_user_id;
ALTER TABLE public.customers ALTER COLUMN user_id DROP NOT NULL;
