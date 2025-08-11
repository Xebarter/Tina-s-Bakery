-- Comprehensive schema for Tina's Bakery

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('breads', 'pastries', 'cakes', 'cookies', 'seasonal')),
  image text,
  "inStock" boolean DEFAULT true,
  inventory integer DEFAULT 0,
  featured boolean DEFAULT false,
  "isSeasonalSpecial" boolean DEFAULT false,
  "isSignatureProduct" boolean DEFAULT false,
  signature_description text,
  ingredients text[],
  allergens text[],
  nutritional_info jsonb,
  portion_size text,
  preparation_time integer,
  difficulty_level text,
  special_pricing jsonb,
  display_settings jsonb,
  seasonal_dates jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Backfill new columns from old ones if needed
UPDATE products SET image = image_url WHERE image IS NULL AND image_url IS NOT NULL;
UPDATE products SET "inStock" = in_stock WHERE "inStock" IS NULL AND in_stock IS NOT NULL;
UPDATE products SET "isSeasonalSpecial" = is_seasonal_special WHERE "isSeasonalSpecial" IS NULL AND is_seasonal_special IS NOT NULL;
UPDATE products SET "isSignatureProduct" = is_signature_product WHERE "isSignatureProduct" IS NULL AND is_signature_product IS NOT NULL;

-- Indexes and constraints for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_seasonal ON products("isSeasonalSpecial") WHERE "isSeasonalSpecial" = true;
CREATE INDEX IF NOT EXISTS idx_products_signature ON products("isSignatureProduct") WHERE "isSignatureProduct" = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_exclusive_product_flags'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT check_exclusive_product_flags
      CHECK (NOT ("isSeasonalSpecial" = true AND "isSignatureProduct" = true));
  END IF;
END$$;

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  account_type text DEFAULT 'registered',
  isActive boolean DEFAULT true,
  totalOrders integer DEFAULT 0,
  totalSpent numeric DEFAULT 0,
  lastOrderDate timestamptz,
  registrationSource text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  order_date timestamptz DEFAULT now(),
  pickup_date timestamptz,
  payment_method text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_reference text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- CAKE ORDERS TABLE
CREATE TABLE IF NOT EXISTS cake_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  cake_type text NOT NULL,
  size text NOT NULL,
  flavor text NOT NULL,
  frosting text NOT NULL,
  decorations text[] DEFAULT '{}',
  custom_text text,
  design_image_url text,
  price decimal(10,2) NOT NULL,
  needed_by date NOT NULL,
  status text DEFAULT 'quote' CHECK (status IN ('quote', 'confirmed', 'in-progress', 'ready', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'KES',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference text UNIQUE,
  tracking_id text,
  merchant_reference text,
  pesapal_transaction_id text,
  callback_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Example public read policy for products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Example authenticated write policy for products
DROP POLICY IF EXISTS "Products are manageable by authenticated users" ON products;
CREATE POLICY "Products are manageable by authenticated users"
  ON products
  FOR ALL
  TO authenticated
  USING (true); 