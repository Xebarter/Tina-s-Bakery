/*
  # Add Product Flags for Seasonal and Signature Items

  1. New Columns
    - `is_seasonal_special` (boolean) - marks products as seasonal specials
    - `is_signature_product` (boolean) - marks products as signature items
    
  2. Constraints
    - Add check constraint to ensure products can't be both seasonal and signature
    
  3. Indexes
    - Add indexes for filtering performance
*/

-- Add new boolean columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_seasonal_special boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_signature_product boolean DEFAULT false;

-- Add constraint to ensure mutual exclusivity
ALTER TABLE products 
ADD CONSTRAINT check_exclusive_product_flags 
CHECK (NOT (is_seasonal_special = true AND is_signature_product = true));

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_products_seasonal ON products(is_seasonal_special) WHERE is_seasonal_special = true;
CREATE INDEX IF NOT EXISTS idx_products_signature ON products(is_signature_product) WHERE is_signature_product = true;

-- Update existing products to match current featured status
UPDATE products 
SET is_seasonal_special = true 
WHERE category = 'seasonal' AND featured = true;

UPDATE products 
SET is_signature_product = true 
WHERE featured = true AND category != 'seasonal';