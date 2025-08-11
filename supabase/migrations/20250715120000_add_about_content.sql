CREATE TABLE about_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_content (title, content, images) VALUES
(
    'Our Story',
    'Since 1985, Tina''''s Bakery has been a beloved part of the community. It all started with a simple dream: to share the joy of authentic, handcrafted baked goods with our neighbors. Today, we continue that tradition with every loaf of bread, pastry, and custom cake we create. We believe in quality ingredients, timeless recipes, and the power of food to bring people together. Thank you for being a part of our journey.',
    ARRAY['https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg']
);