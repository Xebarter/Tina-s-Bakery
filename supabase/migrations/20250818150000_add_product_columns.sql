-- Add slug and sold columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS sold integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_seasonal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_signature boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_id uuid;

-- Create a function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug(name text) 
RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g')) 
         -- Replace spaces with hyphens
         -- Collapse multiple hyphens into one
         -- Remove leading/trailing hyphens
         RETURN regexp_replace(regexp_replace(trim(lower(name)), '[^a-z0-9\s-]', '', 'g'), '\s+', '-', 'g');
END;
$$ LANGUAGE plpgsql;

-- Update existing products with generated slugs
UPDATE products 
SET slug = generate_slug(name)
WHERE slug IS NULL;

-- Set NOT NULL constraint on slug after populating
ALTER TABLE products 
  ALTER COLUMN slug SET NOT NULL;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products table
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
