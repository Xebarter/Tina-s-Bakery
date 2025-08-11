/*
  # Seed Initial Data

  1. Insert sample products
  2. Create sample customer data
  3. Set up initial configuration
*/

-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, in_stock, inventory, featured) VALUES
-- Breads
('Artisan Sourdough', 'Traditional sourdough bread with a crispy crust and tangy flavor, made with our 20-year-old starter.', 6.50, 'breads', 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg', true, 12, true),
('Whole Wheat Honey Oat', 'Hearty whole wheat bread sweetened with honey and topped with oats for extra texture.', 5.75, 'breads', 'https://images.pexels.com/photos/1586947/pexels-photo-1586947.jpeg', true, 8, false),
('French Baguette', 'Classic French baguette with a golden crust and airy interior, perfect for sandwiches.', 4.25, 'breads', 'https://images.pexels.com/photos/2135677/pexels-photo-2135677.jpeg', true, 15, false),

-- Pastries
('Butter Croissant', 'Flaky, buttery croissant made with European-style butter and laminated dough.', 3.50, 'pastries', 'https://images.pexels.com/photos/2135677/pexels-photo-2135677.jpeg', true, 24, true),
('Chocolate Pain au Chocolat', 'Classic French pastry with rich dark chocolate batons wrapped in buttery pastry.', 4.25, 'pastries', 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg', true, 18, false),
('Apple Turnover', 'Flaky pastry filled with cinnamon-spiced apples and finished with a light glaze.', 3.75, 'pastries', 'https://images.pexels.com/photos/1586947/pexels-photo-1586947.jpeg', true, 16, false),

-- Cakes
('Classic Chocolate Layer Cake', 'Rich chocolate cake with silky chocolate buttercream frosting and chocolate ganache drip.', 45.00, 'cakes', 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg', true, 3, true),
('Red Velvet Cake', 'Moist red velvet cake with cream cheese frosting and a hint of cocoa.', 42.00, 'cakes', 'https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg', true, 2, false),
('Lemon Raspberry Cake', 'Light lemon cake layered with fresh raspberry filling and lemon buttercream.', 38.00, 'cakes', 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg', true, 4, false),

-- Cookies
('Chocolate Chip Cookies', 'Classic chocolate chip cookies with a perfect chewy texture and premium chocolate chips.', 2.50, 'cookies', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg', true, 36, false),
('Oatmeal Raisin Cookies', 'Hearty oatmeal cookies with plump raisins and a hint of cinnamon.', 2.25, 'cookies', 'https://images.pexels.com/photos/890577/pexels-photo-890577.jpeg', true, 42, false),

-- Seasonal
('Pumpkin Spice Muffins', 'Seasonal favorite with warm spices, pumpkin puree, and a crumb topping.', 3.25, 'seasonal', 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg', true, 20, true);