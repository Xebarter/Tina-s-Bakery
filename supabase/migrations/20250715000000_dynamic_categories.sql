-- Migration: Dynamic Product Categories

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Insert default categories if not present
INSERT INTO categories (name, description)
SELECT * FROM (VALUES
  ('Breads', 'Freshly baked breads'),
  ('Pastries', 'Delicious pastries'),
  ('Cakes', 'Cakes for every occasion'),
  ('Cookies', 'Tasty cookies'),
  ('Seasonal', 'Seasonal specials')
) AS t(name, description)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = t.name);

-- 3. Alter products table to use category_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);

-- 4. Backfill category_id for existing products
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE LOWER(categories.name) = LOWER(products.category)
) WHERE category_id IS NULL;

-- 5. (Optional) Remove old category text column after migration
-- ALTER TABLE products DROP COLUMN category;

-- 6. Add index for category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id); 