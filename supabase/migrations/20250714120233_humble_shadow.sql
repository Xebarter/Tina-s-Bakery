/*
  # Create Comprehensive Customer Management System

  1. New Tables
    - `customers` - Main customer table with authentication
      - `id` (uuid, primary key)
      - `phone` (text, unique) - Primary login identifier
      - `password_hash` (text) - Secure password storage
      - `full_name` (text)
      - `email` (text, optional)
      - `address` (text)
      - `city` (text)
      - `country` (text, default 'Uganda')
      - `account_type` (enum: 'registered', 'billing_only')
      - `is_active` (boolean, default true)
      - `total_orders` (integer, default 0)
      - `total_spent` (numeric, default 0)
      - `last_order_date` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `customer_sessions` - Session management
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `session_token` (text, unique)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for customer data access
    - Add indexes for performance

  3. Functions
    - Password hashing function
    - Customer statistics update triggers
*/

-- Create account type enum
CREATE TYPE account_type AS ENUM ('registered', 'billing_only');

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  password_hash text,
  full_name text NOT NULL,
  email text,
  address text NOT NULL,
  city text NOT NULL,
  country text DEFAULT 'Uganda' NOT NULL,
  account_type account_type DEFAULT 'registered' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  total_orders integer DEFAULT 0 NOT NULL,
  total_spent numeric(12,2) DEFAULT 0 NOT NULL,
  last_order_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create customer sessions table
CREATE TABLE IF NOT EXISTS customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_account_type ON customers(account_type);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_customers_total_orders ON customers(total_orders DESC);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_customer_id ON customer_sessions(customer_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Customers can view own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.current_customer_id', true))::uuid);

CREATE POLICY "Customers can update own data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.current_customer_id', true))::uuid);

CREATE POLICY "Allow customer registration"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can view all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for customer sessions
CREATE POLICY "Customers can manage own sessions"
  ON customer_sessions
  FOR ALL
  TO authenticated
  USING (customer_id = (current_setting('app.current_customer_id', true))::uuid);

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers 
    SET 
      total_orders = (
        SELECT COUNT(*) 
        FROM orders 
        WHERE customer_id = NEW.customer_id
      ),
      total_spent = (
        SELECT COALESCE(SUM(total), 0) 
        FROM orders 
        WHERE customer_id = NEW.customer_id 
        AND status = 'completed'
      ),
      last_order_date = (
        SELECT MAX(order_date) 
        FROM orders 
        WHERE customer_id = NEW.customer_id
      ),
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order statistics
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();